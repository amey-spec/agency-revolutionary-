import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS } from '../lib/content';
import { radialLayout, useReducedMotion } from '../lib/geometry';
import { useExperience } from '../lib/ExperienceController';

export function Scenarios() {
  const { pulse, pushEcho, lastRun } = useExperience();
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0); // steps completed
  const [morphing, setMorphing] = useState(false);
  const timers = useRef<number[]>([]);

  const scn = SCENARIOS[idx];

  // stable positions per scenario (same node ids s0..s5 → DOM reuse → CSS morph)
  const positions = useMemo(
    () =>
      radialLayout(
        scn.nodes.map((n) => ({ id: n.id, kind: n.kind })),
        // radius stays inside the map box on phone widths (nodes are ~110px wide)
        { minR: 20, maxR: 33, tiltSeed: idx * 11 + 3 },
      ),
    [scn, idx],
  );

  // sequence playback on scenario change
  useEffect(() => {
    setProgress(0);
    const len = scn.sequence.length;
    if (reduced) {
      setProgress(len);
      return;
    }
    for (let i = 1; i <= len; i++) {
      timers.current.push(window.setTimeout(() => setProgress(i), 480 * i));
    }
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [scn, reduced]);

  const nodeState = (id: string) => {
    const seqIdx = scn.sequence.indexOf(id);
    if (seqIdx < 0) return 'idle';
    if (progress > seqIdx) return 'hot';
    if (progress === seqIdx) return 'next';
    return 'idle';
  };

  const pos = (id: string) => positions.get(id) ?? { x: 50, y: 50 };

  return (
    <section id="scenarios" className="chapter" aria-label="The same system in different industries">
      <div className="chapter-head">
        <div>
          <p className="mono-label">05 — CHANGE THE WORLD</p>
          <h2>Seven industries. Same machine underneath.</h2>
        </div>
        <p className="chapter-note">ILLUSTRATIVE SYSTEMS — NOT CLIENT WORK</p>
      </div>

      <div className="scn-shell">
        <div className="scn-tabs" role="group" aria-label="Choose an industry">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={i === idx}
              className={`scn-tab ${i === idx ? 'active' : ''}`}
              onClick={() => {
                if (i !== idx) {
                  pulse();
                  pushEcho(`Scenario: ${s.name}.`);
                  setMorphing(true); // labels dip while the architecture reconfigures
                  // tracked like every other timer, so rapid switching can
                  // never leave a stale un-morph behind
                  timers.current.push(window.setTimeout(() => setMorphing(false), 380));
                }
                setIdx(i);
              }}
              data-cursor="hot"
            >
              <span className="tab-id">{s.code}</span>
              <span className="tab-name">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="scn-body">
          <div className={`scn-map ${morphing ? 'morphing' : ''}`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {scn.links.map(([a, b], i) => {
                const pa = pos(a);
                const pb = pos(b);
                const active = nodeState(a) === 'hot' && nodeState(b) === 'hot';
                return (
                  <line
                    key={`${scn.id}-${i}`}
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    stroke={active ? 'var(--lime)' : 'var(--border)'}
                    strokeWidth={active ? 1.6 : 1}
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: 'stroke 0.4s var(--ease)' }}
                  />
                );
              })}
            </svg>

            {scn.nodes.map((n) => {
              const p = pos(n.id);
              const st = nodeState(n.id);
              return (
                <div
                  key={n.id}
                  className={`scn-node ${st === 'hot' ? 'hot' : ''} ${st === 'idle' && progress > 0 ? 'dim' : ''} ${n.kind === 'input' ? 'src' : ''}`}
                  // The reconfiguration stays on left/top on purpose. It is a
                  // deliberate morph — a whole architecture moving at once while
                  // the labels dip — it only ever runs on a tab click, and it is
                  // bounded to six small boxes. Expressed as a transform it would
                  // have to be re-measured against the map's pixel size, which
                  // would make every window resize replay the flight.
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                    transition:
                      'left 0.8s var(--ease-out), top 0.8s var(--ease-out), border-color var(--m-base) var(--ease), opacity var(--m-base) var(--ease)',
                  }}
                >
                  <span className="n-id">{n.kind.toUpperCase()}</span>
                  <span className="n-label">{n.label}</span>
                </div>
              );
            })}
          </div>

          <aside className="scn-info" aria-live="polite">
            <div className="scn-row">
              <span className="k">THE PROBLEM</span>
              <span className="v">{scn.problem}</span>
            </div>
            <div className="scn-row">
              <span className="k">ARRIVES AS</span>
              <span className="v"><span className="am">{scn.needs}</span></span>
            </div>
            <div className="scn-row">
              <span className="k">SYSTEM HANDLES</span>
              <span className="v">{scn.handles}</span>
            </div>
            <div className="scn-row">
              <span className="k">ENDS WITH</span>
              <span className="v"><span className="li">{scn.returns}</span></span>
            </div>
            <div className="scn-row">
              <span className="k">RUN VERDICT</span>
              {progress >= scn.sequence.length ? (
                <span className="v scn-verdict" key={scn.terminal} style={{ color: 'var(--paper)' }}>
                  {scn.terminal}
                </span>
              ) : (
                <span className="v" style={{ color: 'var(--faint)' }}>
                  EXECUTING…
                </span>
              )}
            </div>
            {lastRun && (
              <div className="scn-row">
                <span className="k">PREVIOUSLY ON THIS VISIT</span>
                <span className="v" style={{ color: 'var(--dim)' }}>You ran: {lastRun}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
