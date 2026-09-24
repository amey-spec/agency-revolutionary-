import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS, execDuration } from '../lib/scenarios';
import type { Scenario, StepState } from '../lib/scenarios';
import { useExperience } from '../lib/ExperienceController';
import { useReducedMotion } from '../lib/geometry';

// ── ACT: the execution console ────────────────────────────────────────────
// One system, five inputs. Selecting an input arms the workflow (it does not
// run); RUN executes the chain left to right with the log synchronised to the
// bar; REPLAY clears and re-runs the same input.

type ExecStatus = 'idle' | 'running' | 'complete';

export function Flow() {
  const { power, setState, pushEcho, pulse, setCaseMemory } = useExperience();
  const reduced = useReducedMotion();

  const [scenarioIdx, setScenarioIdx] = useState(0);
  const scenario = SCENARIOS[scenarioIdx];

  const [execStatus, setExecStatus] = useState<ExecStatus>('idle');
  // run token: identifies the in-flight run; also seeds the duration jitter
  const [runNo, setRunNo] = useState(0);
  // index of the step currently running; -1 = none
  const [, setCursor] = useState(-1);
  const [stepStates, setStepStates] = useState<StepState[]>(() => scenario.steps.map(() => 'idle'));
  const [logRows, setLogRows] = useState<LogRow[]>([]);
  const [received, setReceived] = useState(() => receivedStamp());
  const [duration, setDuration] = useState<string | null>(null);
  const [resultShown, setResultShown] = useState(false);
  const [selStep, setSelStep] = useState<number | null>(null); // from the bar
  const [selLog, setSelLog] = useState<number | null>(null); // from a log row
  /** true only while the result detail is folding away (see `.closing`) */
  const [detailClosing, setDetailClosing] = useState(false);

  const timers = useRef<number[]>([]);
  const runId = useRef(0);

  interface LogRow {
    step: number;
    text: string;
    detail?: string;
    dur: string;
  }

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const resetRun = useCallback(
    (scn: Scenario) => {
      clearTimers();
      runId.current += 1;
      setStepStates(scn.steps.map(() => 'idle'));
      setLogRows([]);
      setCursor(-1);
      setResultShown(false);
      setDuration(null);
      setReceived(receivedStamp());
    },
    [clearTimers],
  );

  const run = useCallback(
    (scn: Scenario) => {
      resetRun(scn);
      setState('executing');
      pulse();

      if (reduced) {
        // no cadence animation: the run still reports, instantly
        setStepStates(scn.steps.map(() => 'completed'));
        setLogRows(scn.logs.map((l, i) => ({ step: i, ...l })));
        setDuration(execDuration(scn.baseDur, runNo));
        setResultShown(true);
        setExecStatus('complete');
        setState('complete');
        pushEcho(`Workflow executed: ${scn.label}.`);
        return;
      }

      setExecStatus('running');
      const total = scn.steps.length;
      let elapsed = 0;
      scn.steps.forEach((_, i) => {
        const stepMs = scn.logs[i].ms;
        later(() => {
          setCursor(i);
          setStepStates((prev) => prev.map((s, k) => (k === i ? 'running' : s)));
          setExecStatus('running');
        }, elapsed);
        elapsed += stepMs;
        later(() => {
          setStepStates((prev) => prev.map((s, k) => (k <= i ? 'completed' : s)));
          setLogRows((prev) => [...prev, { step: i, ...scn.logs[i] }]);
          if (i === total - 1) {
            setCursor(-1);
            setDuration(execDuration(scn.baseDur, runNo));
            setResultShown(true);
            setExecStatus('complete');
            setState('complete');
            pushEcho(`Workflow executed: ${scn.label}.`);
            setCaseMemory({ caseId: scn.id, decision: null, run: scn.label });
          }
        }, elapsed);
      });
    },
    // `runNo` is read so a replay re-seeds the duration jitter; `setRunNo`
    // happens in `replay` before this fires, and state setters are stable
    // across renders, so the closure here already holds the fresh value.
    [reduced, resetRun, setState, pulse, pushEcho, setCaseMemory, later, runNo],
  );

  // switching input cancels any in-flight run cleanly and arms the new one —
  // never let the log show one input while the selector shows another
  const selectScenario = useCallback(
    (i: number) => {
      setScenarioIdx(i);
      setSelStep(null);
      setSelLog(null);
      resetRun(SCENARIOS[i]);
      setExecStatus('idle'); // the cancelled run leaves no status behind
      setState('input');
      pulse();
    },
    [resetRun, setState, pulse],
  );

  /**
   * The detail only exists while it is open, so it is held mounted for the
   * length of its exit animation (`.closing`) instead of being deleted between
   * two frames; its `onAnimationEnd` clears the flag when it is done. The exit
   * duration lives in the styles — nothing here mirrors it. Opening it always
   * clears the flag, so a close that was cut short by a run can never come back
   * with the exit still attached.
   */
  const toggleDetail = useCallback(() => {
    setDetailClosing(selLog === -1); // it was open: this click folds it away
    setSelLog((v) => (v === null ? -1 : null));
  }, [selLog]);

  const replay = useCallback(() => {
    setSelStep(null);
    setSelLog(null);
    setRunNo((n) => n + 1);
    run(scenario);
  }, [run, scenario]);

  // cut power mid-run kills the run (the HUD gate is real)
  useEffect(() => {
    if (!power && execStatus === 'running') {
      clearTimers();
      runId.current += 1;
      setExecStatus('idle');
      setCursor(-1);
      setStepStates((prev) => prev.map((s) => (s === 'running' ? 'idle' : s)));
    }
  }, [power, execStatus, clearTimers]);

  // keep the armed scenario's memory in sync for other chapters
  useEffect(() => {
    setCaseMemory({ caseId: scenario.id, decision: null, run: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const stepsDone = stepStates.filter((s) => s === 'completed').length;
  const totalSteps = scenario.steps.length;

  // log selection drives step emphasis; step selection drives log emphasis
  const activeSel = selLog ?? selStep;
  const selFromLog = selLog !== null;
  const selIndex = activeSel;

  const statusPulse = execStatus === 'running';

  const execLabel = useMemo(() => {
    if (execStatus === 'running') return 'EXECUTING';
    if (execStatus === 'complete') return 'EXECUTION COMPLETE';
    return 'LIVE EXECUTION';
  }, [execStatus]);

  return (
    <section id="flow" className="chapter" aria-label="Watch the automation execute">
      <span className="act-field" aria-hidden="true" />

      <div className="chapter-head">
        <div>
          <p className="mono-label">03 — LET IT ACT</p>
          <h2 className="act-title">
            <span className="act-line">Same system.</span>
            <span className="act-line act-line-accent">Whatever you feed it.</span>
          </h2>
        </div>
        <button
          type="button"
          className={`act-live ${execStatus} ${statusPulse ? 'pulse' : ''}`}
          onClick={replay}
          title={execStatus === 'idle' ? 'Run the selected input' : 'Replay the current input'}
          data-cursor="hot"
        >
          <span className="act-live-dot" aria-hidden="true" />
          {execLabel} · SIMULATED DATA
        </button>
      </div>

      <div className="flow-shell">
        {/* INPUT SELECTOR */}
        <div className="act-picker" role="group" aria-label="Change the input">
          <span className="act-picker-head">
            <span className="act-picker-dash" aria-hidden="true" />
            CHANGE THE INPUT
          </span>
          <div className="act-picker-row">
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${i === scenarioIdx ? 'active' : ''}`}
                aria-pressed={i === scenarioIdx}
                onClick={() => selectScenario(i)}
                data-cursor="hot"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* WORKFLOW STEP BAR */}
        <div className={`act-chainbar ${selIndex !== null ? 'has-sel' : ''}`} role="list" aria-label="Workflow steps">
          {scenario.steps.map((st, i) => {
            const state = stepStates[i];
            const isSel = activeSel === i;
            const dim = selIndex !== null && !isSel;
            return (
              <div key={`${scenario.id}-${st.label}`} role="listitem" className="act-step-cell">
                {i > 0 && (
                  <span
                    className={`act-conn ${state === 'running' ? 'flowing' : ''} ${stepStates[i - 1] === 'completed' ? 'lit' : ''}`}
                    aria-hidden="true"
                  >
                    <i className="act-conn-pulse" />
                  </span>
                )}
                <button
                  type="button"
                  role="listitem"
                  className={`act-step ${state} ${isSel ? 'selected' : ''} ${dim ? 'dim' : ''}`}
                  onClick={() => setSelStep(isSel && selFromLog === false ? null : i)}
                  aria-pressed={isSel}
                  title={`${st.label} — ${state}`}
                  data-cursor="hot"
                >
                  <span className="act-step-check" aria-hidden="true">
                    {state === 'completed' ? '✓' : state === 'running' ? '◆' : ''}
                  </span>
                  <span className="act-step-label">{st.label}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* EXECUTION PANEL: result | log */}
        <div className="act-panel">
          {/* RESULT */}
          <div className="act-result">
            <p className="mono-label act-pane-label">RESULT</p>
            {resultShown ? (
              <button
                type="button"
                className={`act-verdict ${activeSel === -1 ? 'selected' : ''}`}
                onClick={toggleDetail}
                aria-expanded={selLog === -1}
                title="Show result details"
                data-cursor="hot"
              >
                <span className="act-verdict-1">{scenario.result1}</span>
                <span className="act-verdict-2">{scenario.result2}</span>
              </button>
            ) : (
              <p className={`act-verdict-idle ${execStatus === 'running' ? 'busy' : ''}`}>
                {execStatus === 'running' ? 'EXECUTING…' : 'AWAITING RUN'}
              </p>
            )}

            {resultShown && (selLog === -1 || detailClosing) && (
              <div
                className={`act-detail${detailClosing ? ' closing' : ''}`}
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget) setDetailClosing(false);
                }}
              >
                {scenario.details.map((d) => (
                  <div key={d.label} className="act-detail-row">
                    <span className="act-detail-label">{d.label}</span>
                    <span className="act-detail-value">{d.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="act-meta">
              <div className="act-meta-cell">
                <span className="act-meta-label">SOURCE</span>
                <span className="act-meta-value">{scenario.source}</span>
              </div>
              <div className="act-meta-cell">
                <span className="act-meta-label">RECEIVED</span>
                <span className="act-meta-value">{received}</span>
              </div>
              <div className="act-meta-cell">
                <span className="act-meta-label">EXECUTED IN</span>
                <span className="act-meta-value">{duration ?? '—'}</span>
              </div>
            </div>

            {/* the deliverable: dashed until composed, lime once sent */}
            <div
              className={`act-output ${resultShown ? 'ready' : ''} ${stepsDone >= 5 ? 'composed' : ''}`}
              aria-live="polite"
            >
              <span className="act-output-ic" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M6 3h9l4 4v14H6z" />
                  <path d="M9 16v-4M12 16V9M15 16v-6" />
                </svg>
              </span>
              <span className="act-output-tx">
                <b>{scenario.output.title}</b>
                <span>
                  {scenario.output.unit} ·{' '}
                  {resultShown ? 'sent to owner ✓' : stepsDone >= 5 ? 'ready to send' : 'not yet generated'}
                </span>
              </span>
            </div>

            <button
              type="button"
              className="chip act-replay"
              onClick={replay}
              disabled={execStatus === 'running'}
              data-cursor="hot"
            >
              <span className="act-replay-ico" aria-hidden="true">↻</span> REPLAY THIS INPUT
            </button>
          </div>

          {/* EXECUTION LOG */}
          <div className="act-log">
            <div className="act-log-head">
              <p className="mono-label act-pane-label">EXECUTION LOG</p>
              <p className="act-log-count">
                <span className="act-log-count-num">{stepsDone}</span> / {totalSteps} STEPS COMPLETE
              </p>
            </div>
            <div className="act-log-progress" aria-hidden="true">
              <i style={{ transform: `scaleX(${stepsDone / totalSteps})` }} />
            </div>
            <div className="act-log-rows" aria-live="polite">
              {logRows.length === 0 && (
                <p className="act-log-empty">
                  {execStatus === 'running' ? '▌ streaming…' : '— waiting for signal'}
                </p>
                )}
              {logRows.map((row) => {
                const isSel = selLog === row.step;
                const dim = selIndex !== null && !isSel;
                return (
                  <button
                    key={`${scenario.id}-${row.step}-${row.text}`}
                    type="button"
                    className={`act-log-row ${isSel ? 'selected' : ''} ${dim ? 'dim' : ''}`}
                    onClick={() => setSelLog(isSel ? null : row.step)}
                    aria-pressed={isSel}
                    data-cursor="hot"
                  >
                    <span className="act-log-n" aria-hidden="true">
                      {String(row.step + 1).padStart(2, '0')}
                    </span>
                    <span className="act-log-dot" aria-hidden="true" />
                    <span className="act-log-text">
                      {row.text}
                      {row.detail && <em> — {row.detail}</em>}
                    </span>
                    <span className="act-log-dur">
                      {row.dur} <b>✓</b>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="act-foot">
        <span className="act-foot-rule" aria-hidden="true" />
        <b>Five inputs. One system.</b> The workflow reconfigures itself.
        <br />
        That is the product.
      </p>
    </section>
  );
}

function receivedStamp(): string {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
