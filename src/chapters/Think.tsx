import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useExperience } from '../lib/ExperienceController';
import { useReducedMotion } from '../lib/geometry';

type ThinkPhase = 'reading' | 'extracting' | 'cleanup' | 'decide' | 'resolved';

const TOKENS: { text: string; tag?: string; noise?: boolean }[] = [
  { text: 'I', tag: 'CUSTOMER' },
  { text: 'need', tag: 'INTENT' },
  { text: 'to' },
  { text: 'change', tag: 'INTENT' },
  { text: 'my' },
  { text: 'appointment', tag: 'APPOINTMENT' },
  { text: 'tomorrow', tag: 'WHEN' },
  { text: 'morning', tag: 'WHEN' },
  { text: 'if possible,', tag: 'PRIORITY' },
  { text: 'thanks', noise: true },
];

const SCHEMA = ['CUSTOMER', 'INTENT', 'APPOINTMENT', 'WHEN', 'PRIORITY'];

export function Think() {
  const { setState, pushEcho, pulse, caseDecision, setCaseMemory } = useExperience();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<ThinkPhase>('reading');
  const headRef = useRef<HTMLSpanElement>(null);
  const [tagIdx, setTagIdx] = useState(0); // how many tags applied
  const [decision, setDecision] = useState<string | null>(caseDecision);
  const headRaf = useRef(0);
  const timers = useRef<number[]>([]);
  // VISUAL ONLY: the chapter's entrance (statement boot, inbound scan, the
  // sequential detection of the parsed fields) is gated on the chapter actually
  // being on screen. Nothing else reads this.
  const sectionRef = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  const entered = seen || reduced;

  /**
   * A chapter narrates the HUD only while it is the chapter on screen: the parse
   * machine here runs from mount, but its verdict must not be published over the
   * intro, or over MANUAL's own "decision required" reading.
   */
  const ownsHud = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return true;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4;
  }, []);

  // reading head sweep
  useEffect(() => {
    if (phase !== 'reading') return;
    if (reduced) {
      setTagIdx(SCHEMA.length);
      setPhase('decide');
      if (ownsHud()) setState('decision');
      return;
    }
    // The sweep is written straight to the head's own custom property instead
    // of through React state: one style write per frame and a composited
    // offset, where a `setHeadPos` per frame re-rendered the whole sentence
    // (every token, every tag) ~144 times across the 2.4s pass.
    let t0: number | null = null;
    const step = (t: number) => {
      if (t0 === null) t0 = t;
      const p = Math.min((t - t0) / 2400, 1);
      headRef.current?.style.setProperty('--p', String(p));
      if (p < 1) {
        headRaf.current = requestAnimationFrame(step);
      } else {
        setPhase('extracting');
      }
    };
    headRaf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(headRaf.current);
  }, [phase, reduced, setState, ownsHud]);

  // tag application, then ghost cleanup
  useEffect(() => {
    if (phase !== 'extracting') return;
    for (let i = 1; i <= SCHEMA.length; i++) {
      timers.current.push(window.setTimeout(() => setTagIdx(i), 240 * i));
    }
    timers.current.push(window.setTimeout(() => setPhase('cleanup'), 240 * SCHEMA.length + 350));
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [phase]);

  // BUG FIX: this move lived inside the extracting effect, so the phase change it
  // caused immediately cleared its own timer and the chapter stalled on
  // "DISCARDING NOISE…" forever. It owns its timeout now.
  useEffect(() => {
    if (phase !== 'cleanup') return;
    const t = window.setTimeout(() => {
      setPhase('decide');
      if (ownsHud()) setState('decision');
    }, 700);
    return () => window.clearTimeout(t);
  }, [phase, setState, ownsHud]);

  useEffect(() => () => cancelAnimationFrame(headRaf.current), []);

  // the chapter is dark until it is on screen. The observer is one-shot; the
  // frame check covers being entered already framed (anchor / restored scroll).
  useEffect(() => {
    if (entered) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    const raf = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) setSeen(true);
    });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [entered]);

  const decide = useCallback(
    (option: string) => {
      if (phase === 'resolved') return;
      setDecision(option);
      setPhase('resolved');
      setState('executing');
      pulse();
      pushEcho(`Decision: ${option}.`);
      setCaseMemory({ caseId: 'appointment', decision: option, run: null });
    },
    [phase, setState, pulse, pushEcho, setCaseMemory],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'decide') return;
      if (e.key === '1') decide('RESCHEDULE');
      if (e.key === '2') decide('CHECK AVAILABILITY');
      if (e.key === '3') decide('ESCALATE TO HUMAN');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, decide]);

  const choices = useMemo(
    () => [
      { key: '1', label: 'RESCHEDULE', result: 'New slot held. Customer gets two options.' },
      { key: '2', label: 'CHECK AVAILABILITY', result: 'Calendar read first — answer with real times.' },
      { key: '3', label: 'ESCALATE TO HUMAN', result: 'Flagged urgent, context attached, human decides.' },
    ],
    [],
  );

  return (
    <section
      id="think"
      ref={sectionRef}
      className={`chapter think ${entered ? 'in' : ''}`}
      aria-label="Watch the system think"
    >
      <div className="chapter-head">
        <div>
          <p className="mono-label">02 — WATCH IT THINK</p>
          <h2>
            Intelligence is <span className="think-accent">behavior, not a logo.</span>
          </h2>
        </div>
        <p className="chapter-note">ILLUSTRATIVE SYSTEM — SIMULATED UNDERSTANDING</p>
      </div>

      <div className="think-stage">
        {/* decorative: the signal bus that ties the two halves of the console
            together. Positioned out of flow, aria-hidden, no interactive part. */}
        <span className="think-bus" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>

        <div className="think-canvas">
          <div
            className="manual-entry think-source"
            style={{ animation: reduced ? 'none' : 'riseIn 0.5s var(--ease-out) both' }}
          >
            <span className="x" style={{ color: 'var(--lime)' }}>✓</span> INBOUND — 14:02
            {/* decorative: the one-time packet scan across the inbound edge */}
            <span className="think-scan" aria-hidden="true" />
          </div>

          {/* the message, being read */}
          <div className="think-sentence">
            {phase === 'reading' && <span ref={headRef} aria-hidden="true" className="read-head" />}
            {TOKENS.map((t, i) => {
              const tagOrder = t.tag ? SCHEMA.indexOf(t.tag) : -1;
              const tagApplied = t.tag && tagOrder < tagIdx;
              const noiseGone = t.noise && (phase === 'cleanup' || phase === 'decide' || phase === 'resolved');
              return (
                <span
                  key={i}
                  className={`tok ${tagApplied ? 'tagged' : ''} ${noiseGone ? 'ghosted' : ''}`}
                  style={{ opacity: phase === 'reading' && !t.noise ? 0.9 : 1 }}
                >
                  {t.text}
                  {tagApplied && <i className="tok-tag">{t.tag}</i>}
                  {' '}
                </span>
              );
            })}
          </div>

          {/* schema accumulation */}
          <div className="think-schema" aria-hidden="true">
            {SCHEMA.map((t, i) => (
              <span
                key={t}
                style={{
                  color: i < tagIdx ? 'var(--lime)' : 'var(--faint)',
                  transition: 'color var(--m-base) var(--ease)',
                }}
              >
                {i < tagIdx ? '▣' : '▢'} {t}
              </span>
            ))}
          </div>
        </div>

        {/* decision panel */}
        <aside className="think-panel">
          <p className="mono-label q" aria-live="polite">
            {phase === 'reading' && 'READING…'}
            {phase === 'extracting' && 'STRUCTURING…'}
            {phase === 'cleanup' && 'DISCARDING NOISE…'}
            {(phase === 'decide' || phase === 'resolved') && 'UNDERSTOOD — DECISION REQUIRED'}
          </p>

          {(phase === 'decide' || phase === 'resolved') && (
            <>
              <h3 className="think-title">WHAT SHOULD HAPPEN?</h3>
              <p className="think-sub">
                {phase === 'decide'
                  ? 'The system understood the request. You make the call — it executes.'
                  : 'Executed. The other paths were live options.'}
              </p>
              <div className="decision-list" role="group" aria-label="Choose the action">
                {choices.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    className={`decision-option ${decision === c.label ? 'picked' : ''}`}
                    onClick={() => (phase === 'decide' ? decide(c.label) : setDecision(c.label))}
                    data-cursor="hot"
                  >
                    <span>
                      {c.label} <span className="d-key">[{c.key}]</span>
                    </span>
                    {decision === c.label && phase === 'resolved' && <span className="d-key">EXECUTED</span>}
                  </button>
                ))}
              </div>
              {phase === 'resolved' && decision && (
                <div className="think-log">
                  <p className="terminal-line ok" style={{ margin: 0 }}>
                    <span className="t">14:02:07</span>
                    <span>
                      <span className="ok">→</span> {choices.find((c) => c.label === decision)?.result}
                    </span>
                  </p>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
