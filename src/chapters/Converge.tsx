import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CONVERGE_SOURCES, INTEGRATION_TOOLS } from '../lib/content';
import { sameBoxes, seededRandom, useElementRect, useReducedMotion } from '../lib/geometry';
import type { Box } from '../lib/geometry';
import { useExperience } from '../lib/ExperienceController';
import type { StackStage } from '../lib/ExperienceController';

/** clear space between a node's edge and the spoke that meets it, in CSS px */
const LINE_GAP_PX = 6;

/** width/height of the travelling signal rectangle, in CSS px (non-scaling) */
const SIGNAL_W = 10;
const SIGNAL_H = 3;

/** the stages under the visualization, in pipeline order */
const STAGES: { id: StackStage; label: string }[] = [
  { id: 'input', label: 'INPUT' },
  { id: 'process', label: 'PROCESS' },
  { id: 'decision', label: 'DECISION' },
  { id: 'action', label: 'ACTION' },
  { id: 'output', label: 'OUTPUT' },
];

/** left column: what the core reads; right column: what the core drives */
const INPUT_IDS = ['crm', 'email', 'sheets', 'calendar'];
const OUTPUT_IDS = ['billing', 'chat', 'db', 'api'];

const TOOLS_BY_ID: Record<string, (typeof INTEGRATION_TOOLS)[number]> = Object.fromEntries(
  INTEGRATION_TOOLS.map((t) => [t.id, t]),
);

const CONNECTED_FACT: Record<string, string> = {
  crm: '8,420 records',
  email: '312 threads',
  sheets: '14 sheets',
  calendar: '5 calendars',
  billing: '96 invoices',
  chat: '7 channels',
  db: '3 systems',
  api: 'any endpoint',
};

// ── reference geometry ──────────────────────────────────────────────────────
// The wire templates are lifted from the reference frame (1474 × 480) and
// re-expressed as percentages of the map, so proportions hold at every size.
/** each node column sits 13% from its edge: 24%-wide node boxes keep ~22% of
    clear channel between node edge and hub edge for the curves to breathe in */
const LEFT_CX = 13;
const RIGHT_CX = 87;
/** the four rows: evenly spaced, inside the panel's safe band (clear of the
    footer caption at the bottom), centred as a group on the hub */
const ROW_CYS = [10.5, 35, 59.5, 84];
/** the hub sits at the centre of the node group, not of the raw panel */
const HUB_CY = (ROW_CYS[0] + ROW_CYS[3]) / 2;

/* (curve control points are computed per-row in wirePath: horizontal tangents
   at both ends, with per-row x anchors so the four paths stay distinct) */

/**
 * One wire, in the map's 0–100 space. Inputs run node → hub (out of the node's
 * right edge); outputs run hub → node (into the node's left edge), so a signal
 * travelling 0→1 along the path always moves in the direction data flows. Both
 * endpoints meet a measured box edge (node and hub), so the curvature from the
 * reference frame holds at every viewport width.
 */
function wirePath(
  id: string,
  side: 'in' | 'out',
  rect: { width: number; height: number },
  boxes: Record<string, Box>,
): string {
  const ids = side === 'in' ? INPUT_IDS : OUTPUT_IDS;
  const row = Math.max(ids.indexOf(id), 0);
  const cxp = side === 'in' ? LEFT_CX : RIGHT_CX;
  const cyp = ROW_CYS[row];
  if (rect.width === 0 || rect.height === 0) return '';
  const box = boxes[id] ?? { w: 0, h: 0 };
  const hubW = boxes.core?.w ?? 220;
  const nodeCenter = { x: (cxp / 100) * rect.width, y: (cyp / 100) * rect.height };
  const edgeX = nodeCenter.x + (side === 'in' ? 1 : -1) * (box.w / 2 + LINE_GAP_PX);
  const A = { x: (edgeX / rect.width) * 100, y: (nodeCenter.y / rect.height) * 100 };
  const hubEdgeX = rect.width / 2 + (side === 'in' ? -1 : 1) * (hubW / 2 + LINE_GAP_PX);
  const B = { x: (hubEdgeX / rect.width) * 100, y: HUB_CY };
  // horizontal tangents at both ends: the curve leaves the node along its own
  // row and settles onto the hub edge at the hub's mid-height. The first
  // control point is anchored a fixed distance out of the node (per-row, so
  // the four curves stay distinct instead of bundling into one beam); the
  // second sits just before the hub edge.
  const anchorX = side === 'in' ? A.x + 4.5 + row * 1.4 : A.x - 4.5 - row * 1.4;
  const preHubX = side === 'in' ? B.x - 2.2 : B.x + 2.2;
  const f = (n: number) => n.toFixed(2);
  return `M ${f(A.x)} ${f(A.y)} C ${f(anchorX)} ${f(A.y)}, ${f(preHubX)} ${f(B.y)}, ${f(B.x)} ${f(B.y)}`;
}

/** the hub's role line follows the pipeline stage the visitor is focusing */
const HUB_SUB: Record<StackStage, string> = {
  input: 'reads · decides · acts',
  process: 'reading inputs',
  decision: 'deciding',
  action: 'acting',
  output: 'delivering',
};

export function Converge() {
  const { setState } = useExperience();
  const reduced = useReducedMotion();
  const [fired, setFired] = useState(false);
  const [whatIf, setWhatIf] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const [mapRef, mapRect] = useElementRect<HTMLDivElement>();
  const sourceEls = useRef(new Map<string, HTMLElement | null>());
  const [sourceSizes, setSourceSizes] = useState<Record<string, Box>>({});

  // measured source label boxes: the spokes stop at a label's edge
  useLayoutEffect(() => {
    const next: Record<string, Box> = {};
    sourceEls.current.forEach((el, label) => {
      if (el) next[label] = { w: el.offsetWidth, h: el.offsetHeight };
    });
    setSourceSizes((prev) => (sameBoxes(prev, next) ? prev : next));
  }, [mapRect.width]);

  // deterministic source positions on a wide ellipse
  const sources = useMemo(() => {
    const rng = seededRandom(99);
    return CONVERGE_SOURCES.map((label, i) => {
      const angle = (i / CONVERGE_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
      const rx = 38 + rng() * 6;
      const ry = 26 + rng() * 5;
      return {
        label,
        x: 50 + Math.cos(angle) * rx,
        y: 50 + Math.sin(angle) * ry,
        delay: i * 90,
      };
    });
  }, []);

  // fire the convergence when the section becomes visible
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setFired(true);
          setState('complete');
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [setState]);

  // the interruption, slightly after the big moment
  useEffect(() => {
    if (!fired) return;
    const t = window.setTimeout(() => setWhatIf(true), reduced ? 400 : 2600);
    return () => window.clearTimeout(t);
  }, [fired, reduced]);

  const converged = fired && !reduced;
  const settled = fired && reduced;

  const srcPos = (s: (typeof sources)[number]) => {
    if (converged) return { x: 50, y: 50 };
    return { x: s.x, y: s.y };
  };

  // the spoke starts at the source label's outer edge, not at its centre
  // (during the convergence itself the label is already flying to the core, so
  // the spoke keeps the untouched centre-to-centre geometry of the animation)
  const srcEdge = (s: (typeof sources)[number]) => {
    const p = srcPos(s);
    const size = sourceSizes[s.label];
    if (converged || !size || mapRect.width === 0 || mapRect.height === 0) return p;
    const cx = (p.x / 100) * mapRect.width;
    const cy = (p.y / 100) * mapRect.height;
    const gapX = size.w / 2 + LINE_GAP_PX;
    const gapY = size.h / 2 + LINE_GAP_PX;
    const dx = mapRect.width / 2 - cx;
    const dy = mapRect.height / 2 - cy;
    const t = Math.min(
      Math.abs(dx) < 1e-6 ? Infinity : gapX / Math.abs(dx),
      Math.abs(dy) < 1e-6 ? Infinity : gapY / Math.abs(dy),
    );
    const ex = cx + dx * t;
    const ey = cy + dy * t;
    return { x: (ex / mapRect.width) * 100, y: (ey / mapRect.height) * 100 };
  };

  return (
    <>
      {/* 06 — THE WHOLE SYSTEM */}
      <section id="converge" ref={ref} className="converge" aria-label="Everything becomes one system">
        <div className="world">
          <div className="converge-head">
            <p className="mono-label">06 — THE WHOLE SYSTEM</p>
          </div>

          <div ref={mapRef} style={{ position: 'relative', minHeight: reduced ? '16rem' : '22rem' }}>
            <svg
              className="converge-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, margin: 0 }}
              aria-hidden="true"
            >
              {sources.map((s) => {
                const p = srcEdge(s);
                const on = converged || settled;
                return (
                  <line
                    key={s.label}
                    x1={p.x}
                    y1={p.y}
                    x2={50}
                    y2={50}
                    stroke="var(--lime)"
                    strokeWidth={on ? 1 : 0.8}
                    strokeOpacity={on ? 0.55 : 0}
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: `stroke-opacity 0.9s var(--ease-out) ${s.delay}ms` }}
                  />
                );
              })}
            </svg>

            {sources.map((s, i) => {
              // A label's home never moves: it stays on its own left/top slot and
              // the distance it has travelled toward the core is a transform.
              // Driving that flight on left/top (what this used to do) relayouts
              // the map on every frame for 1.6s across seven elements at once;
              // the transform makes the identical journey on the compositor.
              const gone = converged;
              const measurable = mapRect.width > 0 && mapRect.height > 0;
              const dx = gone && measurable ? ((50 - s.x) / 100) * mapRect.width : 0;
              const dy = gone && measurable ? ((50 - s.y) / 100) * mapRect.height : 0;
              const settle = `${1400 + i * 60}ms`;
              return (
                <span
                  key={s.label}
                  ref={(el) => {
                    sourceEls.current.set(s.label, el);
                  }}
                  className="converge-node"
                  style={{
                    position: 'absolute',
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    transform: `translate(-50%, -50%) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`,
                    fontSize: 'var(--mono-11)',
                    letterSpacing: '0.14em',
                    color: gone ? 'var(--lime)' : 'var(--ink)',
                    opacity: gone ? 0.12 : 1,
                    transition: `transform 1.6s var(--ease-in-out) ${s.delay}ms, color 0.8s var(--ease-out) ${settle}, opacity 0.8s var(--ease-out) ${settle}`,
                    zIndex: 2,
                  }}
                >
                  {s.label}
                </span>
              );
            })}

            {/* the center core */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 9,
                height: 9,
                background: 'var(--lime)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%) scale(' + (converged || settled ? 1 : 0.4) + ')',
                opacity: converged || settled ? 1 : 0.3,
                transition: 'transform 1.2s var(--ease-out) 1.4s, opacity 1.2s var(--ease-out) 1.4s',
                zIndex: 3,
              }}
            />

            {/* the statement */}
            <h3
              className="converge-title"
              style={{
                position: 'relative',
                zIndex: 4,
                paddingTop: 'clamp(6rem, 14vh, 9rem)',
                textAlign: 'center',
                opacity: converged || settled ? 1 : 0,
                transform: converged || settled ? 'none' : 'translateY(18px)',
                transition: 'opacity 1.1s var(--ease-out) 1.9s, transform 1.1s var(--ease-out) 1.9s',
              }}
            >
              WE PROVIDE <em>SOLUTIONS.</em>
            </h3>
            <p
              className="converge-sub"
              style={{
                textAlign: 'center',
                opacity: converged || settled ? 1 : 0,
                transition: 'opacity 1s var(--ease-out) 2.5s',
              }}
            >
              SEVEN DISCONNECTED TOOLS. ONE DECISION-MAKING LAYER. ZERO COPY-PASTE.
            </p>
          </div>
        </div>
      </section>

      {/* interruption */}
      <section className="whatif" aria-label="What if this ran itself">
        <div className="world">
          <h3
            className="whatif-title"
            style={{
              opacity: whatIf ? 1 : 0,
              transform: whatIf ? 'none' : 'scale(0.96)',
              transition: 'opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out)',
            }}
          >
            WHAT IF THIS <em>RAN ITSELF?</em>
          </h3>
          <p
            className="whatif-sub"
            style={{
              opacity: whatIf ? 1 : 0,
              transition: 'opacity 0.8s var(--ease-out) 0.25s',
            }}
          >
            It already does — for routing, reading, deciding, scheduling, answering, and reporting.
            You keep the judgment calls. The system keeps the rest moving.
          </p>
          <div
            className="whatif-actions"
            style={{ opacity: whatIf ? 1 : 0, transition: 'opacity 0.8s var(--ease-out) 0.4s' }}
          >
            <a href="#lab" className="system-btn" data-cursor="hot">
              ▶ RUN ANOTHER DEMO
            </a>
            <a href="#contact" className="chip" data-cursor="hot">
              SHOW ME MY OPTIONS
            </a>
          </div>
        </div>
      </section>

      {/* 07 — YOUR STACK, CONNECTED */}
      <section id="ecosystem" className="chapter" aria-label="Your stack, connected">
        <div className="world">
          <StackChapter />
        </div>
      </section>
    </>
  );
}

// ── 07 — YOUR STACK, CONNECTED ──────────────────────────────────────────────
// The chips, the graph and the statistics all read one piece of state in the
// ExperienceController, so they can never drift apart.

function StackChapter() {
  const {
    stackTools,
    stackSelected,
    toggleStackTool,
    stackNode,
    setStackNode,
    stackStage,
    setStackStage,
    pushEcho,
    pulse,
  } = useExperience();
  const reduced = useReducedMotion();
  const [mapRef, mapRect] = useElementRect<HTMLDivElement>();

  // measured node boxes: the wires stop at a node's edge, not its centre
  const nodeEls = useRef(new Map<string, HTMLElement | null>());
  const [nodeBoxes, setNodeBoxes] = useState<Record<string, Box>>({});
  useLayoutEffect(() => {
    const next: Record<string, Box> = {};
    nodeEls.current.forEach((el, id) => {
      if (el) next[id] = { w: el.offsetWidth, h: el.offsetHeight };
    });
    setNodeBoxes((prev) => (sameBoxes(prev, next) ? prev : next));
  }, [mapRect.width]);

  const selectedSet = useMemo(() => new Set(stackSelected), [stackSelected]);
  const isWired = (id: string) => selectedSet.has(id);
  const anyWired = stackSelected.length > 0;

  const focus = stackNode;
  const focusRing = focus && focus !== 'core' ? focus : null;

  // a stage focus lights its conceptual area: sources, the core, or the systems
  const stageSide: 'in' | 'core' | 'out' =
    stackStage === 'input' ? 'in' : stackStage === 'process' || stackStage === 'decision' ? 'core' : 'out';

  // the status reflects the actual wiring: a core with no inputs is not a system
  const status = anyWired ? { label: 'VALID', cls: 'ok' } : { label: 'INCOMPLETE', cls: 'warn' };

  const toggle = (id: string) => {
    const wasWired = isWired(id);
    toggleStackTool(id);
    // unwiring the node under inspection closes the inspection with it
    if (wasWired && focus === id) setStackNode(null);
    pushEcho(wasWired ? `Stack: ${TOOLS_BY_ID[id].label} disconnected.` : `Stack: ${TOOLS_BY_ID[id].label} wired in.`);
    pulse();
  };

  const inspect = (id: string | null) => {
    pulse();
    if (id === null) {
      setStackNode(null);
      return;
    }
    setStackNode(focus === id ? null : id);
  };

  const wireD = (id: string, side: 'in' | 'out') =>
    isWired(id) ? wirePath(id, side, mapRect, nodeBoxes) : null;

  return (
    <>
      <div className="stack-head">
        <div className="stack-lead">
          <p className="mono-label stack-eyebrow">07 — YOUR STACK, CONNECTED</p>
          <h2 className="stack-title">
            <span className="hl-line">AI connects the tools</span>
            <span className="hl-line hl-line-accent">you already use.</span>
          </h2>
        </div>
        <div className="stack-stats" role="group" aria-label="System statistics">
          <div className="stat">
            <span className="st-key">INPUTS</span>
            <strong>{stackSelected.length}</strong>
          </div>
          <div className="stat">
            <span className="st-key">CORE</span>
            <strong className="ok">1</strong>
          </div>
          <div className="stat">
            <span className="st-key">SYSTEM</span>
            <strong>{anyWired ? 1 : 0}</strong>
          </div>
        </div>
      </div>

      {/* the inputs: each chip is a real switch on the same state the graph reads */}
      <div className="stack-pick">
        <div className="stack-chips" role="group" aria-label="Select your systems">
          {stackTools.map((id) => {
            const tool = TOOLS_BY_ID[id];
            const on = isWired(id);
            return (
              <button
                key={id}
                type="button"
                className={`stack-chip ${on ? 'active' : ''}`}
                onClick={() => toggle(id)}
                aria-pressed={on}
                data-cursor="hot"
              >
                <span className="chip-check" aria-hidden="true">
                  <svg viewBox="0 0 12 12">
                    <path d="M2.2 6.4 4.9 9.1 9.8 3.4" />
                  </svg>
                </span>
                {tool.label}
              </button>
            );
          })}
        </div>
        <p className="stack-count" aria-live="polite">
          <b>{stackSelected.length}</b> of {stackTools.length} selected
        </p>
      </div>

      {/* the panel: left inputs → core → right systems */}
      <div className="stack-panel">
        <div className="stack-bar">
          <span className="stack-bar-k">
            <i aria-hidden="true" />
            WORKFLOW VISUALIZATION
          </span>
          <span className="stack-bar-v">
            {stackSelected.length}/{stackTools.length} COMPONENTS{' '}
            <span className={`stack-valid ${status.cls}`}>
              <i aria-hidden="true" />
              {status.label}
            </span>
          </span>
        </div>

        <div
          className={`stack-map ${focus ? 'focused' : ''}`}
          ref={mapRef}
          onClick={(e) => {
            // empty-canvas click clears the inspection; clicks on the nodes, the
            // hub or the panel must reach their own handlers untouched
            if ((e.target as HTMLElement).closest('.stack-node, .stack-hub, .stack-inspect')) return;
            setStackNode(null);
          }}
        >
          <svg className="stack-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {/* orbit guides, as in the reference frame */}
            <g className="stack-guides">
              <ellipse cx="50" cy="50" rx="10.2" ry="31.25" />
              <ellipse cx="50" cy="50" rx="17.6" ry="54.2" strokeDasharray="0.8 2" />
            </g>

            {[
              ...INPUT_IDS.map((id) => ({ id, side: 'in' as const })),
              ...OUTPUT_IDS.map((id) => ({ id, side: 'out' as const })),
            ].map(({ id, side }) => {
              const d = wireD(id, side);
              if (!d) return null;
              const inspected = focusRing === id || focus === 'core';
              const unrelated = focus != null && !inspected && focus !== id;
              const stageTouched = (stageSide === 'in' && side === 'in') || (stageSide === 'out' && side === 'out');
              return (
                <path
                  key={`${id}-wire`}
                  className={`stack-wire ${inspected ? 'lit' : ''} ${unrelated ? 'fade' : ''} ${stageTouched && focus == null ? 'stage' : ''}`}
                  d={d}
                  pathLength={1}
                  fill="none"
                />
              );
            })}

            {/* travelling signals, paced left then right — calm unless inspected */}
            {!reduced &&
              [
                ...INPUT_IDS.map((id) => ({ id, side: 'in' as const, k: INPUT_IDS.indexOf(id) })),
                ...OUTPUT_IDS.map((id) => ({ id, side: 'out' as const, k: OUTPUT_IDS.indexOf(id) })),
              ].map(({ id, side, k }) => {
                const d = wireD(id, side);
                if (!d) return null;
                const fast = focus === id || focus === 'core';
                const delay = side === 'in' ? 0.4 + k * 0.42 : 2.6 + k * 0.42;
                return <Signal key={`${id}-sig`} d={d} delay={delay} fast={fast} />;
              })}
          </svg>

          {INPUT_IDS.map((id) => (
            <StackNode
              key={id}
              id={id}
              side="in"
              wired={isWired(id)}
              dim={focusRing != null && focusRing !== id}
              lit={stageSide === 'in' && focus == null}
              selected={focus === id}
              onSelect={() => inspect(id)}
              register={(el) => {
                nodeEls.current.set(id, el);
              }}
            />
          ))}
          {OUTPUT_IDS.map((id) => (
            <StackNode
              key={id}
              id={id}
              side="out"
              wired={isWired(id)}
              dim={focusRing != null && focusRing !== id}
              lit={stageSide === 'out' && focus == null}
              selected={focus === id}
              onSelect={() => inspect(id)}
              register={(el) => {
                nodeEls.current.set(id, el);
              }}
            />
          ))}

          {/* the core */}
          <button
            type="button"
            ref={(el) => {
              nodeEls.current.set('core', el);
            }}
            className={`stack-hub live ${focus === 'core' ? 'sel' : ''} ${stageSide === 'core' && focus == null ? 'lit' : ''}`}
            style={{ position: 'absolute', left: '50%', top: `${HUB_CY}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => inspect('core')}
            aria-pressed={focus === 'core'}
            data-cursor="hot"
          >
            <span className="hub-k">CORE</span>
            <span className="hub-a">AI</span>
            <span className="hub-s">{focus === 'core' ? HUB_SUB[stackStage] : 'reads · decides · acts'}</span>
          </button>

          {/* contextual inspection — compact, inside the panel, never a modal */}
          {focus && (
            <aside className="stack-inspect" aria-live="polite">
              <div className="si-head">
                <b>{focus === 'core' ? 'CORE / AI' : TOOLS_BY_ID[focus]?.label}</b>
                <button type="button" onClick={() => setStackNode(null)} aria-label="Close inspection" data-cursor="hot">
                  ✕
                </button>
              </div>
              <div className="si-row">
                <span>{focus === 'core' ? 'the decision-making layer' : TOOLS_BY_ID[focus]?.desc}</span>
              </div>
              <div className="si-grid">
                <span className="k">{focus === 'core' ? 'FEEDS' : 'CONNECTED'}</span>
                <span className="v">
                  {focus === 'core'
                    ? `${stackSelected.length} component${stackSelected.length === 1 ? '' : 's'}`
                    : isWired(focus)
                      ? CONNECTED_FACT[focus]
                      : '—'}
                </span>
                <span className="k">STATUS</span>
                <span className={`v ${isWired(focus) ? 'ok' : 'warn'}`}>{isWired(focus) ? 'READY' : 'NOT WIRED'}</span>
              </div>
            </aside>
          )}

          <p className="mono-label stack-foot">
            <span>NO LOGO WALL. YOUR TOOLS BECOME NODES IN ONE SYSTEM.</span>
            <span className="stack-foot-ref">FIG. 07 — SIMULATED NETWORK</span>
          </p>
        </div>
      </div>

      {/* the pipeline this stack feeds */}
      <div className="stack-flow">
        <p className="mono-label stack-flow-lab">
          <i aria-hidden="true" />
          FLOW
        </p>
        <div className="stack-steps" role="group" aria-label="Flow stages">
          {STAGES.map((s, i) => (
            <span key={s.id} className="stack-step-wrap">
              {i > 0 && <i className="stack-arrow" aria-hidden="true" />}
              <button
                type="button"
                className={`stack-step ${stackStage === s.id ? 'active' : ''}`}
                onClick={() => {
                  setStackStage(s.id);
                  pulse();
                }}
                aria-pressed={stackStage === s.id}
                data-cursor="hot"
              >
                {s.label}
              </button>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

function StackNode({
  id,
  side,
  wired,
  dim,
  lit,
  selected,
  onSelect,
  register,
}: {
  id: string;
  side: 'in' | 'out';
  wired: boolean;
  dim: boolean;
  lit: boolean;
  selected: boolean;
  onSelect: () => void;
  register: (el: HTMLButtonElement | null) => void;
}) {
  const tool = TOOLS_BY_ID[id];
  const row = side === 'in' ? INPUT_IDS.indexOf(id) : OUTPUT_IDS.indexOf(id);
  return (
    <button
      type="button"
      ref={register}
      className={`stack-node side-${side} eco-${id} ${wired ? '' : 'off'} ${dim ? 'dim' : ''} ${lit ? 'lit' : ''} ${selected ? 'sel' : ''}`}
      style={{
        position: 'absolute',
        left: `${side === 'in' ? LEFT_CX : RIGHT_CX}%`,
        top: `${ROW_CYS[row]}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onSelect}
      aria-pressed={selected}
      data-cursor="hot"
    >
      <span className="n-ic" aria-hidden="true" />
      <span className="n-tx">
        <b>{tool.label}</b>
        <span>{tool.desc}</span>
      </span>
      {side === 'out' && (
        <i className="n-badge" aria-hidden="true">
          <svg viewBox="0 0 12 12">
            <path d="M2.2 6.4 4.9 9.1 9.8 3.4" />
          </svg>
        </i>
      )}
    </button>
  );
}

/**
 * A small rectangular signal that travels along one wire, with a short trail.
 * Rendered only when motion is allowed; SMIL carries the motion so the page's
 * rAF budget is untouched. `fast` = the wire is under inspection.
 *
 * The head is a rect sized in CSS px, measured into the svg's user units on
 * mount, so the map's non-uniform viewBox scaling can never stretch it into
 * one of those capsules.
 */
function Signal({ d, delay, fast }: { d: string; delay: number; fast: boolean }) {
  const raw = useId();
  const id = `sig${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const dur = fast ? 2.1 : 6.4;
  // the map's user units are % of width (x) and % of height (y) at different
  // scales, so the rect is measured against the rendered svg on mount AND on
  // every resize — otherwise a viewport change silently de-sizes the signals
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const measure = () => {
      const holder = document.getElementById(id);
      const svg = holder ? holder.closest('svg') : null;
      if (!svg) return;
      const vb = svg.viewBox.baseVal;
      if (!vb.width || !vb.height) return;
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setSize({ w: (SIGNAL_W / r.width) * vb.width, h: (SIGNAL_H / r.height) * vb.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [id]);
  return (
    <g className={`stack-signal ${fast ? 'fast' : ''}`}>
      <path id={id} d={d} fill="none" stroke="none" />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          className={`sig-dot d${i}`}
          x={-size.w / 2}
          y={-size.h / 2}
          width={size.w}
          height={size.h}
        >
          <animateMotion dur={`${dur}s`} begin={`${delay + i * 0.16}s`} repeatCount="indefinite">
            <mpath href={`#${id}`} />
          </animateMotion>
        </rect>
      ))}
    </g>
  );
}
