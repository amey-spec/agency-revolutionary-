import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useExperience } from '../lib/ExperienceController';
import { useElementRect, useReducedMotion } from '../lib/geometry';

/**
 * BUILD — the workbench.
 *
 * The chapter is a real (small) automation builder, not a picture of one. Three
 * ideas hold it together:
 *
 *  1. COMPONENTS LIVE IN TIERS. Every part belongs to one of five columns —
 *     triggers → interpret → look up → act → output — and a tier's parts run in
 *     parallel. Order inside a column is the order the parts execute, which is
 *     why reordering is a real operation and not decoration.
 *
 *  2. THE GRAPH IS DERIVED, NEVER STORED. Edges are every enabled part of one
 *     tier wired to every enabled part of the next non-empty tier, so adding,
 *     disabling or moving a part rewires the canvas on the next render. A
 *     disabled part is skipped by the wiring entirely, which is what makes the
 *     toggle visible on the canvas instead of only in the panel.
 *
 *  3. THE RUN WALKS THE TIERS. `lit` counts the tiers that have fired and `sig`
 *     is the tier whose signal is currently travelling, so node states, wire
 *     states and the trace are all read off two numbers. Reduced motion jumps
 *     straight to the finished state — same data, no timing.
 */

type Kind = 'trigger' | 'interpret' | 'lookup' | 'act' | 'output';

interface ColumnDef {
  id: Kind;
  /** header label for the tier (plural) */
  label: string;
  /** the part's own category label */
  single: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'trigger', label: 'TRIGGERS', single: 'TRIGGER' },
  { id: 'interpret', label: 'INTERPRET', single: 'INTERPRET' },
  { id: 'lookup', label: 'LOOK UP', single: 'LOOK UP' },
  { id: 'act', label: 'ACT', single: 'ACT' },
  { id: 'output', label: 'OUTPUT', single: 'OUTPUT' },
];

const COLUMN_BY_ID = new Map(COLUMNS.map((c) => [c.id, c]));

interface PartDef {
  id: string;
  kind: Kind;
  label: string;
  hint: string;
  /** a part can carry a caveat that matters at run time (the gate, mostly) */
  note?: string;
}

const PARTS: PartDef[] = [
  { id: 'lead', kind: 'trigger', label: 'NEW LEAD', hint: 'form capture' },
  { id: 'inbound', kind: 'trigger', label: 'INBOUND MSG', hint: 'support / inquiry' },
  { id: 'form', kind: 'trigger', label: 'FORM SUBMISSION', hint: 'site form' },
  { id: 'webhook', kind: 'trigger', label: 'WEBHOOK', hint: 'any system event' },
  { id: 'ai', kind: 'interpret', label: 'AI', hint: 'reads + decides' },
  { id: 'classifier', kind: 'interpret', label: 'CLASSIFIER', hint: 'sorts the intent' },
  { id: 'router', kind: 'interpret', label: 'ROUTER', hint: 'picks the path' },
  { id: 'crm', kind: 'lookup', label: 'CRM', hint: 'customer record' },
  { id: 'database', kind: 'lookup', label: 'DATABASE', hint: 'system of record' },
  {
    id: 'condition',
    kind: 'lookup',
    label: 'CONDITION',
    hint: 'if / then gate',
    note: 'THIS GATE DECIDES WHETHER THE OUTPUTS BELOW FIRE',
  },
  { id: 'email', kind: 'act', label: 'EMAIL', hint: 'sends + replies' },
  { id: 'calendar', kind: 'act', label: 'CALENDAR', hint: 'finds the slot' },
  { id: 'notify', kind: 'output', label: 'NOTIFY SALES', hint: 'ping the team' },
  { id: 'confirm', kind: 'output', label: 'CONFIRM', hint: 'tell the customer' },
  { id: 'send', kind: 'output', label: 'SEND EMAIL', hint: 'write the reply' },
  { id: 'task', kind: 'output', label: 'CREATE TASK', hint: 'open a to-do' },
];

const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]));

/** the configuration panel lists every part under its tier's own heading */
const GROUPS: { label: string; kinds: Kind[] }[] = [
  { label: 'TRIGGERS', kinds: ['trigger'] },
  { label: 'INTERPRETATION', kinds: ['interpret'] },
  { label: 'CONNECTED SYSTEMS', kinds: ['lookup', 'act'] },
  { label: 'OUTPUTS', kinds: ['output'] },
];

interface Placed {
  uid: string;
  part: string;
  col: Kind;
  on: boolean;
}

const MAX_PLACED = 8;
/** how long the library takes to fold away — matches its exit animation */
const PICKER_EXIT_MS = 240;

/** the workbench opens as the reference shows it: two triggers, one decider, a
 *  lookup pair (record + gate) and one output. */
const STARTER: Placed[] = [
  { uid: 's1', part: 'lead', col: 'trigger', on: true },
  { uid: 's2', part: 'inbound', col: 'trigger', on: true },
  { uid: 's3', part: 'ai', col: 'interpret', on: true },
  { uid: 's4', part: 'crm', col: 'lookup', on: true },
  { uid: 's5', part: 'condition', col: 'lookup', on: true },
  { uid: 's6', part: 'notify', col: 'output', on: true },
];

type Phase = 'edit' | 'running' | 'done';

interface NodeBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface DragState {
  uid: string;
  col: Kind;
  index: number;
  moved: boolean;
}

interface Suggestion {
  id: string;
  action: 'add' | 'enable';
  part: string;
  targetUid?: string;
  title: string;
  reason: string;
}

/** one tier's turn on the bench, and the hop of signal that follows it */
const STEP_MS = 560;
const HOP_MS = 340;

const sameBoxes = (a: Record<string, NodeBox>, b: Record<string, NodeBox>) => {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => {
    const x = a[k];
    const y = b[k];
    return (
      !!y &&
      Math.abs(x.left - y.left) < 0.5 &&
      Math.abs(x.top - y.top) < 0.5 &&
      Math.abs(x.right - y.right) < 0.5 &&
      Math.abs(x.bottom - y.bottom) < 0.5
    );
  });
};

/**
 * A wire leaves the source edge and meets the target edge. Which edge is not a
 * breakpoint decision but a geometric one — compare the air between the boxes on
 * each axis: in the five-column bench the next tier is to the right, and in the
 * stacked layout it is below, so one rule routes both.
 */
function wirePath(a: NodeBox, b: NodeBox): string {
  const GAP = 5;
  const dx = Math.max(b.left - a.right, 0);
  const dy = Math.max(b.top - a.bottom, 0);
  const round = (n: number) => Math.round(n * 100) / 100;

  if (dy > dx) {
    const x = round((a.left + a.right) / 2);
    const y2 = round((b.left + b.right) / 2);
    const y1 = round(a.bottom + GAP);
    const y3 = round(b.top - GAP);
    const c = round(Math.min(Math.max((y3 - y1) * 0.5, 14), 54));
    return `M ${x} ${y1} C ${x} ${round(y1 + c)}, ${y2} ${round(y3 - c)}, ${y2} ${y3}`;
  }

  const y = round((a.top + a.bottom) / 2);
  const y2 = round((b.top + b.bottom) / 2);
  const x1 = round(a.right + GAP);
  const x3 = round(b.left - GAP);
  const c = round(Math.min(Math.max((x3 - x1) * 0.5, 14), 62));
  return `M ${x1} ${y} C ${round(x1 + c)} ${y}, ${round(x3 - c)} ${y2}, ${x3} ${y2}`;
}

export function Lab() {
  const { setState, pushEcho, pulse, markLabBuilt, power } = useExperience();
  const reduced = useReducedMotion();

  const [placed, setPlaced] = useState<Placed[]>(STARTER);
  const [selected, setSelected] = useState<string | null>(null);
  /**
   * The component a closing inspector is still showing: selection is what the
   * inspector is about, so it is handed over here when it closes and the panel
   * is unmounted only once its exit animation (`.closing`) has run.
   */
  const [closingInspect, setClosingInspect] = useState<Placed | null>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('edit');
  /** tiers that have fired */
  const [lit, setLit] = useState(0);
  /** tier whose signal is currently travelling to the next tier */
  const [sig, setSig] = useState(-1);
  const [trace, setTrace] = useState<string[]>([]);
  const [showTrace, setShowTrace] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  /** true only while the library is folding away (see closePicker) */
  const [pickerClosing, setPickerClosing] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [dismissed, setDismissed] = useState<{ id: string; key: string } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  /** the two parts of a part's life that only the animation cares about */
  const [entering, setEntering] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<Record<string, NodeBox>>({});

  const [canvasRef, canvasRect] = useElementRect<HTMLDivElement>();
  const dragFrom = useRef({ x: 0, y: 0 });
  /** the component that was just dropped: its trailing click is not a select */
  const dragged = useRef<string | null>(null);
  const nodeEls = useRef(new Map<string, HTMLButtonElement | null>());
  const trackEls = useRef(new Map<Kind, HTMLDivElement | null>());
  const timers = useRef<number[]>([]);

  /* ── the graph ─────────────────────────────────────────────────────────── */

  const tiers = useMemo(
    () =>
      COLUMNS.map((c) => ({
        col: c.id,
        nodes: placed
          .filter((p) => p.col === c.id && p.on)
          .map((p) => ({ uid: p.uid, def: PART_BY_ID.get(p.part)!, part: p.part })),
      })).filter((t) => t.nodes.length > 0),
    [placed],
  );

  const wires = useMemo(() => {
    const out: { id: string; from: string; to: string; tier: number }[] = [];
    for (let i = 1; i < tiers.length; i++) {
      for (const a of tiers[i - 1].nodes) {
        for (const b of tiers[i].nodes) out.push({ id: `${a.uid}>${b.uid}`, from: a.uid, to: b.uid, tier: i - 1 });
      }
    }
    return out;
  }, [tiers]);

  const tierOf = useMemo(() => {
    const map = new Map<string, number>();
    tiers.forEach((t, i) => t.nodes.forEach((n) => map.set(n.uid, i)));
    return map;
  }, [tiers]);

  const enabled = useMemo(() => placed.filter((p) => p.on), [placed]);

  const issues = useMemo(() => {
    const out: string[] = [];
    if (placed.length === 0) return ['EMPTY BENCH — ADD A COMPONENT FROM THE LIBRARY'];
    const kinds = new Set(enabled.map((p) => PART_BY_ID.get(p.part)!.kind));
    if (!kinds.has('trigger')) out.push('NO TRIGGER — NOTHING STARTS THIS RUN');
    if (!kinds.has('interpret')) out.push('NO INTERPRETATION — THE RUN CANNOT DECIDE ANYTHING');
    if (!kinds.has('output')) out.push('NO OUTPUT — NOTHING HAPPENS AT THE END');
    if (enabled.length === 0) out.push('EVERY COMPONENT IS OFF');
    return out;
  }, [placed, enabled]);

  const canRun = power && phase !== 'running' && tiers.length >= 2 && issues.length === 0;

  /* ── what the bench recommends next ───────────────────────────────────── */

  const suggestions = useMemo<Suggestion[]>(() => {
    const list: Suggestion[] = [];
    const has = (id: string) => placed.some((p) => p.part === id);
    const room = placed.length < MAX_PLACED;
    const kinds = new Set(placed.filter((p) => p.on).map((p) => PART_BY_ID.get(p.part)!.kind));

    if (placed.length > 0 && !kinds.has('output')) {
      list.push({
        id: 'no-output',
        action: 'add',
        part: 'notify',
        title: 'ADD NOTIFY SALES',
        reason: 'THE RUN FINISHES WITHOUT TELLING ANYBODY IT FINISHED.',
      });
    }
    const off = placed.find((p) => !p.on);
    if (off) {
      list.push({
        id: `enable-${off.uid}`,
        action: 'enable',
        part: off.part,
        targetUid: off.uid,
        title: `TURN ${PART_BY_ID.get(off.part)!.label} BACK ON`,
        reason: 'A COMPONENT THAT IS OFF IS SKIPPED: THE WIRES ROUTE AROUND IT.',
      });
    }
    if (room && !has('confirm') && kinds.has('output')) {
      list.push({
        id: 'add-confirm',
        action: 'add',
        part: 'confirm',
        title: 'ADD CONFIRM',
        reason: 'EVERY RUN SHOULD END BY TELLING THE CUSTOMER WHAT HAPPENS NEXT.',
      });
    }
    if (room && !kinds.has('act') && has('crm')) {
      list.push({
        id: 'add-act',
        action: 'add',
        part: 'calendar',
        title: 'ADD CALENDAR',
        reason: 'THIS RUN READS THE RECORD BUT NEVER ACTS ON THE WORLD.',
      });
    }
    // one recommendation at a time: a workbench that lists everything is a to-do list
    return list.slice(0, 1);
  }, [placed]);

  /* ── measuring: wires are laid out in the canvas's own pixel space ─────── */

  const layoutKey = useMemo(() => placed.map((p) => `${p.uid}:${p.col}:${p.on ? 1 : 0}`).join('|'), [placed]);

  // A dismissal belongs to the composition it was made for: change anything on
  // the bench and the recommendation is allowed back. Recording the key it was
  // dismissed against keeps that a derivation instead of an effect that resets
  // state on every edit.
  const suggestion = suggestions.find((s) => !(dismissed?.id === s.id && dismissed.key === layoutKey)) ?? null;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base = canvas.getBoundingClientRect();
    const next: Record<string, NodeBox> = {};
    nodeEls.current.forEach((el, uid) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      next[uid] = {
        left: r.left - base.left,
        top: r.top - base.top,
        right: r.right - base.left,
        bottom: r.bottom - base.top,
      };
    });
    setBoxes((prev) => (sameBoxes(prev, next) ? prev : next));
  }, [canvasRef, canvasRect.width, canvasRect.height, layoutKey, phase, lit]);

  /* ── edits ─────────────────────────────────────────────────────────────── */

  /**
   * The library is a shelf, not a dialog: closing it folds it away over one
   * animation instead of deleting it between two frames. It stays mounted for
   * the length of its exit — the same pattern the bench uses for a part that is
   * taken off it — and the timer comes from the shared pool, so a chapter that
   * unmounts mid-fold can never leave a stale class behind.
   */
  const openPicker = useCallback(() => {
    setPickerClosing(false);
    setPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    timers.current.push(window.setTimeout(() => setPickerClosing(false), PICKER_EXIT_MS));
    setPickerClosing(true);
    setPickerOpen(false);
  }, []);

  const addPart = useCallback(
    (partId: string) => {
      const def = PART_BY_ID.get(partId);
      if (!def) return;
      const uid = `u${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
      setPlaced((list) => (list.length >= MAX_PLACED ? list : [...list, { uid, part: partId, col: def.kind, on: true }]));
      setSelected(uid);
      setPhase('edit');
      setTrace([]);
      setLit(0);
      setSig(-1);
      closePicker();
      setSuggestOpen(false);
      setEntering(uid);
      timers.current.push(
        window.setTimeout(() => setEntering((cur) => (cur === uid ? null : cur)), 340),
      );
      markLabBuilt();
      pulse();
    },
    [closePicker, markLabBuilt, pulse],
  );

  // the part is taken off the bench before it is dropped from the model, so the
  // bench never reflows around a component that is still visible
  const removeNode = useCallback(
    (uid: string) => {
      setRemoving(uid);
      // …and the inspector closing on it folds away alongside the part
      setClosingInspect(placed.find((p) => p.uid === uid) ?? null);
      timers.current.push(
        window.setTimeout(() => {
          setPlaced((list) => list.filter((p) => p.uid !== uid));
          setSelected((s) => (s === uid ? null : s));
          setRemoving((cur) => (cur === uid ? null : cur));
        }, 220),
      );
    },
    [placed],
  );

  const toggleNode = useCallback((uid: string) => {
    setPlaced((list) => list.map((p) => (p.uid === uid ? { ...p, on: !p.on } : p)));
  }, []);

  const moveNode = useCallback((uid: string, col: Kind, index: number) => {
    setPlaced((list) => {
      const node = list.find((p) => p.uid === uid);
      if (!node) return list;
      const rest = list.filter((p) => p.uid !== uid);
      const peers = rest.filter((p) => p.col === col);
      // insert before the peer the pointer passed, or after the last one
      const at =
        index < peers.length
          ? rest.indexOf(peers[index])
          : peers.length > 0
            ? rest.indexOf(peers[peers.length - 1]) + 1
            : rest.length;
      return [...rest.slice(0, at), { ...node, col }, ...rest.slice(at)];
    });
  }, []);

  /** step a selected part one tier left or right (the keyboard/touch path —
   *  dragging is a pointer affordance and touch devices scroll with the same
   *  gesture, so the control has to exist somewhere reachable) */
  const shiftTier = useCallback((uid: string, dir: -1 | 1) => {
    setPlaced((list) => {
      const node = list.find((p) => p.uid === uid);
      if (!node) return list;
      const from = COLUMNS.findIndex((c) => c.id === node.col);
      const to = from + dir;
      if (to < 0 || to >= COLUMNS.length) return list;
      return list.map((p) => (p.uid === uid ? { ...p, col: COLUMNS[to].id } : p));
    });
  }, []);

  /** reorder within a tier — the arrows, so a part's position is a real control */
  const reorder = useCallback((uid: string, dir: -1 | 1) => {
    setPlaced((list) => {
      const node = list.find((p) => p.uid === uid);
      if (!node) return list;
      const peers = list.filter((p) => p.col === node.col);
      const i = peers.indexOf(node);
      const j = i + dir;
      if (j < 0 || j >= peers.length) return list;
      const rest = list.filter((p) => p.uid !== uid);
      const target = peers[j];
      const at = rest.indexOf(target);
      return [...rest.slice(0, at), node, ...rest.slice(at)];
    });
  }, []);

  /* ── the run ───────────────────────────────────────────────────────────── */

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  // the enter/remove micro-animations share the same pool and die with the
  // chapter, so a node can never be stuck half-faded after navigating away
  useEffect(() => clearTimers, []);

  const run = useCallback(() => {
    if (!canRun) return;
    clearTimers();
    pulse();
    setState('executing');
    setPhase('running');
    setTrace([]);
    setLit(0);
    setSig(-1);
    setSelected(null);

    const lines = (i: number) =>
      tiers[i].nodes.map(
        (n) => `${COLUMN_BY_ID.get(tiers[i].col)!.single.toLowerCase()} · ${n.def.label.toLowerCase()} — ${n.def.hint}`,
      );

    if (reduced) {
      setLit(tiers.length);
      setTrace(tiers.flatMap((_, i) => lines(i)));
      setPhase('done');
      setState('complete');
      markLabBuilt();
      return;
    }

    let t = 0;
    for (let i = 0; i < tiers.length; i++) {
      const fired = i + 1;
      // tier i fires at t, runs for STEP_MS; its signal departs mid-run and
      // lands as tier i+1 begins — no dead time at the start, no gap between
      timers.current.push(
        window.setTimeout(() => {
          setLit(fired);
          setSig(-1);
          setTrace((l) => [...l.slice(-6), ...lines(i)]);
        }, t),
      );
      t += STEP_MS;
      if (i < tiers.length - 1) {
        timers.current.push(window.setTimeout(() => setSig(i), t - HOP_MS));
        t += HOP_MS;
      }
    }
    timers.current.push(
      window.setTimeout(() => {
        setLit(tiers.length);
        setSig(-1);
        setPhase('done');
        setState('complete');
        markLabBuilt();
        pushEcho(`Build workbench executed: ${tiers.length} tiers.`);
        setTrace((l) => [...l.slice(-6), `run complete — ${tiers.reduce((n, x) => n + x.nodes.length, 0)} components, 0 handoffs`]);
      }, t + 120),
    );
  }, [canRun, clearTimers, markLabBuilt, pulse, pushEcho, reduced, setState, tiers]);

  const reset = useCallback(() => {
    clearTimers();
    setPlaced(STARTER);
    setSelected(null);
    setPhase('edit');
    setLit(0);
    setSig(-1);
    setTrace([]);
    setPickerOpen(false);
    setSuggestOpen(false);
    setDismissed(null);
    setEntering(null);
    setRemoving(null);
    setState('idle');
  }, [clearTimers, setState]);

  // cutting the power stops the run where it stands
  useEffect(() => {
    if (!power && phase === 'running') {
      clearTimers();
      setPhase('edit');
      setLit(0);
      setSig(-1);
    }
  }, [power, phase, clearTimers]);

  const applySuggestion = useCallback(
    (s: Suggestion) => {
      if (s.action === 'add') addPart(s.part);
      if (s.action === 'enable' && s.targetUid) {
        setPlaced((list) => list.map((p) => (p.uid === s.targetUid ? { ...p, on: true } : p)));
      }
      setSuggestOpen(false);
      setDismissed(null);
    },
    [addPart],
  );

  /* ── keyboard ──────────────────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected || phase !== 'edit') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        shiftTier(selected, -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        shiftTier(selected, 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        reorder(selected, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        reorder(selected, 1);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeNode(selected);
      } else if (e.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, phase, shiftTier, reorder, removeNode]);

  /* ── selection helpers ─────────────────────────────────────────────────── */

  const selectedNode = placed.find((p) => p.uid === selected) ?? null;
  /** what the inspector is showing — the selection, or the one it is closing on */
  const inspectNode = selectedNode ?? closingInspect;
  const selectedDef = inspectNode ? PART_BY_ID.get(inspectNode.part)! : null;
  const selectedTier = inspectNode ? COLUMNS.findIndex((c) => c.id === inspectNode.col) : -1;

  const place = (partId: string) => {
    const existing = placed.find((p) => p.part === partId);
    if (existing) {
      setSelected(existing.uid);
      setSuggestOpen(false);
      return;
    }
    addPart(partId);
  };

  /* ── drag: pointer only, and only while editing ───────────────────────── */

  const columnAt = useCallback((clientX: number): Kind => {
    let best: Kind = COLUMNS[0].id;
    let bestDist = Infinity;
    for (const c of COLUMNS) {
      const el = trackEls.current.get(c.id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) return c.id;
      const d = Math.min(Math.abs(clientX - r.left), Math.abs(clientX - r.right));
      if (d < bestDist) {
        bestDist = d;
        best = c.id;
      }
    }
    return best;
  }, []);

  const indexAt = useCallback(
    (col: Kind, clientY: number, exclude: string) => {
      let i = 0;
      for (const p of placed) {
        if (p.col !== col || p.uid === exclude) continue;
        const el = nodeEls.current.get(p.uid);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (clientY > r.top + r.height / 2) i++;
      }
      return i;
    },
    [placed],
  );

  // Selection is deliberately NOT handled here. The pointer path only ever
  // rearranges: a press that never travels becomes an ordinary click, and the
  // click handler owns selection for mouse, touch and keyboard alike.
  const onNodeDown = (e: React.PointerEvent<HTMLButtonElement>, node: Placed) => {
    dragged.current = null; // a fresh press invalidates any pending suppression
    if (phase !== 'edit' || e.button !== 0 || e.pointerType === 'touch') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragFrom.current = { x: e.clientX, y: e.clientY };
    setDrag({ uid: node.uid, col: node.col, index: 0, moved: false });
  };

  const onNodeMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    // a click is a click: only a real displacement turns this into a drag
    const travel = Math.abs(e.clientX - dragFrom.current.x) + Math.abs(e.clientY - dragFrom.current.y);
    if (!drag.moved && travel < 5) return;
    const col = columnAt(e.clientX);
    const index = indexAt(col, e.clientY, drag.uid);
    if (col !== drag.col || index !== drag.index || !drag.moved) setDrag({ ...drag, col, index, moved: true });
  };

  const onNodeUp = (e: React.PointerEvent<HTMLButtonElement>, node: Placed) => {
    if (!drag) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (drag.moved) {
      dragged.current = node.uid;
      moveNode(node.uid, drag.col, drag.index);
    }
    setDrag(null);
  };

  const onNodeClick = (node: Placed) => {
    // only the drop's own trailing click is ignored — clicking anywhere else
    // right after a drag still selects normally
    if (dragged.current === node.uid) {
      dragged.current = null;
      return;
    }
    // deselection hands the component to the inspector's exit; a fresh
    // selection takes it straight back, which cancels that exit
    setClosingInspect(selected === node.uid ? node : null);
    setSelected((s) => (s === node.uid ? null : node.uid));
  };

  /* ── derived readouts ──────────────────────────────────────────────────── */

  const mode = !power
    ? 'SYSTEM OFF'
    : phase === 'running'
      ? 'RUNNING'
      : phase === 'done'
        ? 'RUN COMPLETE'
        : 'EDIT MODE';

  const status = !power
    ? 'OFF'
    : phase === 'running'
      ? `RUNNING ${Math.min(lit, tiers.length)}/${tiers.length}`
      : phase === 'done'
        ? `COMPLETE · ${(((tiers.length - 1) * (STEP_MS + HOP_MS) + STEP_MS) / 1000).toFixed(1)}S`
        : 'IDLE';

  const traceLine =
    phase === 'running' && trace.length > 0
      ? trace[trace.length - 1]
      : phase === 'done'
        ? 'WORKFLOW COMPLETE — THE SYSTEM DID THE REST'
        : issues.length > 0
          ? issues[0]
          : enabled.length === 0
            ? 'ADD A COMPONENT TO BEGIN'
            : 'WIRED AND READY — POWER ON, THEN RUN';

  return (
    <section id="lab" className="chapter" aria-label="Build your own automation">
      <div className="chapter-head">
        <div>
          <p className="mono-label">04 — BUILD YOUR SYSTEM</p>
          <h2>Your stack. Your workflow. Run it.</h2>
        </div>
        <p className="chapter-note">
          MINI LAB — A SIMPLIFIED MODEL OF THE REAL THING. ADD COMPONENTS, WIRE THEM, RUN IT.
        </p>
      </div>

      <div className={`lab-shell ${power ? '' : 'unpowered'}`}>
        {/* bench header: what mode the workbench is in, and whether it is sound */}
        <div className="lab-bar">
          <span>{mode}</span>
          <span>
            {placed.length}/{MAX_PLACED} COMPONENTS
            {issues.length > 0 ? ` · ${issues.length} ${issues.length === 1 ? 'ISSUE' : 'ISSUES'}` : ' · VALID'}
          </span>
        </div>

        <div className="lab-main">
          <div className="lab-canvas-col">
            <div
              className={`lab-canvas ${drag?.moved ? 'dragging' : ''}`}
              ref={canvasRef}
              role="group"
              aria-label="Workflow canvas"
              aria-busy={phase === 'running'}
            >
              <svg className="lab-wires" aria-hidden="true">
                {wires.map((w) => {
                  const a = boxes[w.from];
                  const b = boxes[w.to];
                  if (!a || !b) return null;
                  const state =
                    phase === 'edit'
                      ? ''
                      : w.tier < lit - 1 || phase === 'done'
                        ? 'ok'
                        : sig === w.tier
                          ? 'flow'
                          : w.tier === lit - 1
                            ? 'ready'
                            : '';
                  return <path key={w.id} className={`lab-wire ${state}`} d={wirePath(a, b)} fill="none" />;
                })}
                {/* the signal itself, on the tier that is transmitting right now */}
                {phase === 'running' &&
                  sig >= 0 &&
                  !reduced &&
                  wires
                    .filter((w) => w.tier === sig)
                    .map((w) => {
                      const a = boxes[w.from];
                      const b = boxes[w.to];
                      if (!a || !b) return null;
                      return (
                        <circle key={`${sig}-${w.id}`} className="lab-signal" r="2.6">
                          <animateMotion dur={`${HOP_MS}ms`} fill="freeze" path={wirePath(a, b)} />
                        </circle>
                      );
                    })}
              </svg>

              {COLUMNS.map((col) => {
                const nodes = placed.filter((p) => p.col === col.id);
                return (
                  <div className="lab-col" key={col.id} data-col={col.id}>
                    <p className="lab-col-label">{col.label}</p>
                    <div
                      className={`lab-track ${drag?.moved && drag.col === col.id ? 'drop' : ''}`}
                      ref={(el) => {
                        trackEls.current.set(col.id, el);
                      }}
                    >
                      {nodes.length === 0 && <span className="lab-track-empty" aria-hidden="true" />}
                      {nodes.map((node) => {
                        const def = PART_BY_ID.get(node.part)!;
                        const tier = tierOf.get(node.uid);
                        const state = !node.on
                          ? 'off'
                          : phase === 'edit'
                            ? 'idle'
                            : tier === undefined
                              ? 'off'
                              : phase === 'done' || tier < lit - 1
                                ? 'ok'
                                : tier === lit - 1
                                  ? 'live'
                                  : 'idle';
                        const meta =
                          state === 'off'
                            ? 'OFF'
                            : state === 'live'
                              ? 'RUNNING'
                              : state === 'ok'
                                ? 'DONE'
                                : COLUMN_BY_ID.get(node.col)!.single;
                        // `.lab-meta .ok/.warn` already carry the bench's status ink
                        const stateClass = state === 'off' ? 'warn' : state;
                        return (
                          <button
                            key={node.uid}
                            type="button"
                            ref={(el) => {
                              nodeEls.current.set(node.uid, el);
                            }}
                            className={`lab-node ${selected === node.uid ? 'selected' : ''} ${
                              hot === node.part ? 'hot' : ''
                            } ${drag?.uid === node.uid ? 'dragging' : ''} ${state === 'ok' ? 'lit' : ''} ${
                              entering === node.uid ? 'entering' : ''
                            } ${removing === node.uid ? 'removing' : ''}`}
                            data-state={state}
                            data-kind={node.col}
                            aria-pressed={selected === node.uid}
                            aria-label={`${def.label}, ${COLUMN_BY_ID.get(node.col)!.single}, ${
                              node.on ? 'enabled' : 'disabled'
                            }. Drag or use the arrow keys to move it, Delete to remove it.`}
                            onClick={() => onNodeClick(node)}
                            onPointerDown={(e) => onNodeDown(e, node)}
                            onPointerMove={onNodeMove}
                            onPointerUp={(e) => onNodeUp(e, node)}
                            onPointerEnter={() => setHot(node.part)}
                            onPointerLeave={() => setHot((h) => (h === node.part ? null : h))}
                            data-cursor="hot"
                          >
                            <span className="ln-type">{COLUMN_BY_ID.get(node.col)!.single}</span>
                            <span className="ln-name">{def.label}</span>
                            <span className="ln-hint">{def.hint}</span>
                            {def.note && <span className="ln-note">{def.note}</span>}
                            <span className="ln-meta">
                              <span className={`ln-state ${stateClass}`}>{meta}</span>
                              <span className="ln-uid">{node.uid.slice(-4).toUpperCase()}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {placed.length === 0 && <p className="mono-label">EMPTY BENCH — ADD A COMPONENT FROM THE LIBRARY</p>}
            </div>

            {/* library: the only way in for a new component */}
            <div className="lab-library">
              <button
                type="button"
                className={`lab-add ${pickerOpen ? 'open' : ''}`}
                aria-expanded={pickerOpen}
                aria-controls="lab-library-picker"
                onClick={() => (pickerOpen ? closePicker() : openPicker())}
                data-cursor="hot"
              >
                <span className="la-mark" aria-hidden="true" />
                {pickerOpen ? 'CLOSE LIBRARY' : 'ADD COMPONENT'}
              </button>
              <span className="lab-hint">CLICK LIBRARY TO ADD · DRAG TO ARRANGE · ARROWS MOVE</span>
              <span className="lab-library-note">TRIGGERS FIRE IN PARALLEL</span>

              {(pickerOpen || pickerClosing) && (
                <div
                  className={`lab-picker ${pickerClosing ? 'closing' : ''}`}
                  id="lab-library-picker"
                  role="group"
                  aria-label="Component library"
                >
                  <p className="lab-picker-head">
                    {placed.length}/{MAX_PLACED} PLACED
                    {placed.length >= MAX_PLACED ? ' — REMOVE ONE TO ADD ANOTHER' : ' — PICK A COMPONENT'}
                  </p>
                  <div className="lab-picker-groups">
                    {GROUPS.map((g) => (
                      <div className="lab-lib-group" key={g.label}>
                        <p className="group-label">{g.label}</p>
                        <div className="chip-row">
                          {PARTS.filter((p) => g.kinds.includes(p.kind)).map((p) => {
                            const isPlaced = placed.some((x) => x.part === p.id);
                            const full = placed.length >= MAX_PLACED && !isPlaced;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className={`chip ${isPlaced ? 'active' : ''}`}
                                disabled={full}
                                onClick={() => place(p.id)}
                                onPointerEnter={() => setHot(p.id)}
                                onPointerLeave={() => setHot((h) => (h === p.id ? null : h))}
                                title={
                                  full
                                    ? `Bench is full (${MAX_PLACED}/${MAX_PLACED}) — remove a component first`
                                    : isPlaced
                                      ? 'Placed — select it on the bench'
                                      : `Add ${p.label}`
                                }
                              >
                                {isPlaced ? '✓ ' : '+ '}
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* the trace: what the run is doing, line by line */}
            {showTrace && (
              <div className="lab-run-log">
                {trace.slice(-5).map((line, i) => (
                  <span className="terminal-line" key={`${line}-${i}`}>
                    <span className="t">{String(i + 1).padStart(2, '0')}</span>
                    {line}
                  </span>
                ))}
                {trace.length === 0 &&
                  (issues.length > 0 ? (
                    issues.map((issue) => (
                      <span className="terminal-line" key={issue}>
                        <span className="t">!</span>
                        <span className="warn">{issue}</span>
                      </span>
                    ))
                  ) : (
                    <span className="terminal-line">
                      <span className="t">··</span>
                      NO RUN YET — THE TRACE FILLS IN AS THE WORKFLOW EXECUTES
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* configuration panel */}
          <div className="lab-lib-col">
            <div className="lab-config-head">
              <span className="lab-count">
                {placed.length}/{MAX_PLACED} COMPONENTS
              </span>
              {suggestion ? (
                <button
                  type="button"
                  className={`lab-suggest ${suggestOpen ? 'open' : ''}`}
                  aria-expanded={suggestOpen}
                  aria-controls="lab-suggest-card"
                  onClick={() => setSuggestOpen((o) => !o)}
                  data-cursor="hot"
                >
                  <span className="ls-mark" aria-hidden="true" />1 SUGGESTION
                </button>
              ) : (
                <span className="lab-count dim">NO OPEN SUGGESTIONS</span>
              )}
            </div>

            {suggestion && suggestOpen && (
              <div className="lab-suggest-card" id="lab-suggest-card">
                <p className="ls-title">{suggestion.title}</p>
                <p className="ls-reason">{suggestion.reason}</p>
                <div className="ls-actions">
                  <button type="button" className="chip" onClick={() => applySuggestion(suggestion)} data-cursor="hot">
                    APPLY
                  </button>
                  <button type="button" className="chip" onClick={() => setDismissed({ id: suggestion.id, key: layoutKey })}>
                    DISMISS
                  </button>
                </div>
              </div>
            )}

            {inspectNode && selectedDef ? (
              <div
                className={`lab-inspect${closingInspect ? ' closing' : ''}`}
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget) setClosingInspect(null);
                }}
              >
                <p className="li-head">
                  SELECTED · {COLUMN_BY_ID.get(inspectNode.col)!.single}
                  <span className="li-pos">
                    STEP {selectedTier + 1} OF {COLUMNS.length}
                  </span>
                </p>
                <p className="li-name">{selectedDef.label}</p>
                <p className="li-hint">{selectedDef.hint}</p>
                {selectedDef.note && <p className="li-note">{selectedDef.note}</p>}
                <div className="li-actions">
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={inspectNode.on}
                    onClick={() => toggleNode(inspectNode.uid)}
                  >
                    {inspectNode.on ? 'ON — TURN OFF' : 'OFF — TURN ON'}
                  </button>
                  <button
                    type="button"
                    className="chip"
                    disabled={selectedTier <= 0}
                    onClick={() => shiftTier(inspectNode.uid, -1)}
                  >
                    ◀ TIER
                  </button>
                  <button
                    type="button"
                    className="chip"
                    disabled={selectedTier >= COLUMNS.length - 1}
                    onClick={() => shiftTier(inspectNode.uid, 1)}
                  >
                    TIER ▶
                  </button>
                  <button type="button" className="chip" onClick={() => reorder(inspectNode.uid, -1)}>
                    ▲ EARLIER
                  </button>
                  <button type="button" className="chip" onClick={() => reorder(inspectNode.uid, 1)}>
                    ▼ LATER
                  </button>
                  <button type="button" className="chip danger" onClick={() => removeNode(inspectNode.uid)}>
                    REMOVE
                  </button>
                </div>
              </div>
            ) : (
              <p className="lab-inspect-empty">
                SELECT A COMPONENT ON THE BENCH OR BELOW TO INSPECT AND RECONFIGURE IT.
              </p>
            )}

            <div className="lab-panel-groups">
              {GROUPS.map((g) => (
                <div className="lab-lib-group" key={g.label}>
                  <p className="group-label">{g.label}</p>
                  {PARTS.filter((p) => g.kinds.includes(p.kind)).map((p) => {
                    const node = placed.find((x) => x.part === p.id) ?? null;
                    const full = placed.length >= MAX_PLACED;
                    return (
                      <div
                        className={`lab-row ${node ? 'placed' : ''} ${node && !node.on ? 'off' : ''} ${
                          node && selected === node.uid ? 'selected' : ''
                        } ${hot === p.id ? 'hot' : ''}`}
                        key={p.id}
                        onPointerEnter={() => setHot(p.id)}
                        onPointerLeave={() => setHot((h) => (h === p.id ? null : h))}
                      >
                        {node ? (
                          <button
                            type="button"
                            className="lr-power"
                            aria-pressed={node.on}
                            aria-label={`${p.label} is ${node.on ? 'on' : 'off'} — toggle`}
                            title={node.on ? 'Turn this component off' : 'Turn this component on'}
                            onClick={() => toggleNode(node.uid)}
                            data-cursor="hot"
                          >
                            <span className="lr-dot" aria-hidden="true" />
                          </button>
                        ) : (
                          <span className="lr-dot ghost" aria-hidden="true" />
                        )}
                        <button
                          type="button"
                          className="lr-main"
                          aria-pressed={node ? selected === node.uid : false}
                          disabled={!node && full}
                          title={
                            node
                              ? 'Select this component'
                              : full
                                ? `Bench is full (${MAX_PLACED}/${MAX_PLACED}) — remove a component first`
                                : `Place ${p.label} on the bench`
                          }
                          onClick={() => place(p.id)}
                          data-cursor="hot"
                        >
                          <span className="lr-label">{p.label}</span>
                          <span className="lr-hint">{node ? p.hint : `+ ${p.hint}`}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="lab-actions">
              <button
                type="button"
                className={`system-btn solid lab-run ${phase === 'running' ? 'fired' : ''}`}
                disabled={!canRun}
                onClick={run}
                title={!power ? 'System is off — switch it on in the top left' : issues[0] ?? 'Execute the workflow'}
                data-cursor="hot"
              >
                {phase === 'running' ? 'RUNNING…' : 'RUN ▶'}
              </button>
              <button type="button" className="chip lab-reset" onClick={reset} title="Stop the run and restore the starter workflow">
                RESET
              </button>
            </div>
            <p className="lab-foot">
              EVERY RUN NEEDS A TRIGGER, ONE INTERPRETER AND AN OUTPUT. THE REAL THING WIRES INTO YOUR ACTUAL STACK.
            </p>
          </div>
        </div>

        {/* panel footer: live run status and the two trace controls */}
        <div className="lab-strip">
          <span className={`lab-status ${phase} ${power ? '' : 'off'}`}>
            <span className="lss-dot" aria-hidden="true" />
            {status}
          </span>
          <span className="lab-strip-trace" aria-live="polite">
            {traceLine}
          </span>
          <span className="lab-strip-actions">
            <button type="button" className="chip" aria-pressed={showTrace} onClick={() => setShowTrace((s) => !s)}>
              {showTrace ? 'LOG ON' : 'LOG OFF'}
            </button>
            <button
              type="button"
              className="chip"
              disabled={phase !== 'done' || !canRun}
              onClick={run}
              title={phase === 'done' ? 'Run the same workflow again' : 'Replay is available after a run completes'}
            >
              REPLAY
            </button>
          </span>
        </div>
      </div>
    </section>
  );
}
