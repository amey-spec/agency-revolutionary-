import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useElementRect, useReducedMotion } from '../lib/geometry';
import { useExperience } from '../lib/ExperienceController';
import type { TopicId } from '../lib/typed';

/**
 * MANUAL — "the living system".
 *
 * Twelve disconnected signals surround one core. Six channels sit on the outer
 * ring, six records on the inner ring, and every wire between them passes
 * through the core: many inputs → one system → an organised result.
 *
 * Three things keep it honest:
 *
 *  1. NOTHING IS ASSERTED THAT ISN'T COUNTED. A node's tone comes from its
 *     status, the counters tally those tones, and confidence is derived from the
 *     tally. When the automation converges a record, the counters move because
 *     the data moved — not because a label was swapped.
 *
 *  2. THE WIRES ARE MEASURED. Positions are computed from the stage's real size,
 *     so the ring cannot drift away from what it describes at any breakpoint.
 *
 *  3. THE RUN IS A SEQUENCE, NOT A SPINNER. Reading (outer ring, in order) →
 *     linking → flagging → converging (inner ring, in order). Each phase lights
 *     the nodes it is about, so the visitor can watch which signal is moving.
 */

/* ── THE SIGNALS ───────────────────────────────────────────────────────────── */

type Tone = 'err' | 'warn' | 'ok';

interface NodeSpec {
  id: string;
  label: string;
  status: string;
  detail: string;
  /** the status once the automation has handled it */
  resolved: string;
  tone: Tone;
}

/** six live channels on the outer ring */
const SOURCES: (NodeSpec & { channel: boolean })[] = [
  { id: 'email', label: 'EMAIL', status: 'REPLY AVERAGE', detail: '9 hrs in the queue', resolved: 'ANSWERED', tone: 'warn', channel: true },
  { id: 'form', label: 'FORM', status: 'UNREAD 3 DAYS', detail: 'contact form #2291', resolved: 'READ + ROUTED', tone: 'warn', channel: true },
  { id: 'crm', label: 'CRM', status: 'UNASSIGNED', detail: 'LEAD-88 // no owner', resolved: 'OWNER SET', tone: 'warn', channel: true },
  { id: 'sheet', label: 'SPREADSHEET', status: '7 OF 7 WAIT', detail: 'Q3-tracking-v7-FINAL', resolved: 'SYNCED', tone: 'warn', channel: false },
  { id: 'message', label: 'MESSAGE', status: 'SENT AT 3 AM', detail: '“did you see this one?”', resolved: 'ROUTED', tone: 'warn', channel: true },
  { id: 'calendar', label: 'CALENDAR', status: 'DOUBLE-BOOKED', detail: '11:00 — two bookings', resolved: 'CONFLICT CLEARED', tone: 'warn', channel: true },
];

/** six records on the inner ring — what the channels produced */
const RECORDS: NodeSpec[] = [
  { id: 'email', label: 'EMAIL', status: 'DUPLICATE', detail: 'same thread, two owners', resolved: 'RESOLVED', tone: 'err' },
  { id: 'db', label: 'DATABASE', status: 'NO OWNER', detail: 'customer // unlinked', resolved: 'ASSIGNED', tone: 'warn' },
  { id: 'report', label: 'REPORT', status: 'NEVER SENT', detail: 'WEEKLY-REPORT-draft2', resolved: 'SENT', tone: 'warn' },
  { id: 'form', label: 'FORM', status: 'DUPLICATE', detail: 'submitted twice', resolved: 'RESOLVED', tone: 'err' },
  { id: 'ticket', label: 'TICKET', status: 'ESCALATED', detail: 'URGENT — no reply yet', resolved: 'ASSIGNED', tone: 'warn' },
  { id: 'crm', label: 'CRM', status: 'DUPLICATE', detail: 'LEAD-88 // NEW ×2', resolved: 'RESOLVED', tone: 'err' },
];

/** every wire in the manual world: same record twice, plus who waits on whom */
const LINKS: { id: string; from: string; to: string; weak?: boolean }[] = [
  { id: 'l1', from: 'email', to: 'email' },
  { id: 'l2', from: 'form', to: 'form' },
  { id: 'l3', from: 'crm', to: 'crm' },
  { id: 'l4', from: 'form', to: 'ticket', weak: true },
  { id: 'l5', from: 'message', to: 'ticket' },
  { id: 'l6', from: 'crm', to: 'db' },
  { id: 'l7', from: 'sheet', to: 'report', weak: true },
  { id: 'l8', from: 'calendar', to: 'ticket', weak: true },
  { id: 'l9', from: 'email', to: 'db' },
];

/** the order the run handles the records in — the order the reference lists */
const RESOLVE_ORDER = ['email', 'db', 'report', 'form', 'ticket', 'crm'];

/** copy per topic, so the chapter answers the question the visitor actually asked */
const CONTEXT: Record<TopicId, [string, string]> = {
  leads: ['Five channels. One question: “did anyone reply to that lead?”', 'Nobody knows without checking all five.'],
  support: ['Questions arrive faster than answers, in five different places.', 'Every reply starts from zero.'],
  reporting: ['Four sources, one spreadsheet, zero trust in the numbers.', 'Friday afternoons disappear in here.'],
  scheduling: ['Booking one hour takes nine emails across three calendars.', 'The calendar knows. Nobody asks it.'],
  other: ['The same process, by hand, in five tools — slightly differently each time.', 'Nothing is written down.'],
};

/** the same reading the payload carries, one character wide */
const MARK: Record<Tone, string> = { err: '✕', warn: '△', ok: '✓' };

const PHASE_COPY: Record<string, string> = {
  analyzing: 'scanning 12 signals across 5 channels…',
  reading: 'reading sources — no field understood yet',
  linking: 'wiring 9 links through the core…',
  flagging: '3 duplicates found — the same record in two places',
  resolving: 'converging into place, one record at a time',
  done: '12 signals, one system — 0 handoffs, 0 duplicates',
};

/* ── GLYPHS ──────────────────────────────────────────────────────────────────
   One mark per node, drawn on a 16-unit grid so every icon carries the same
   weight at the same size. Unknown labels fall back to the system mark. */

const GLYPHS: Record<string, ReactNode> = {
  EMAIL: (
    <>
      <rect x="1.7" y="4" width="12.6" height="8.4" rx="1" />
      <path d="M1.7 5.2 8 9.4l6.3-4.2" />
    </>
  ),
  FORM: (
    <>
      <rect x="3" y="1.8" width="10" height="12.4" rx="1" />
      <path d="M5.6 5.2h4.8M5.6 8h4.8M5.6 10.8h3" />
    </>
  ),
  CRM: (
    <>
      <circle cx="8" cy="5.4" r="2.5" />
      <path d="M3.2 14c0-2.7 2.1-4.3 4.8-4.3s4.8 1.6 4.8 4.3" />
    </>
  ),
  SPREADSHEET: (
    <>
      <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1" />
      <path d="M1.8 6.2h12.4M1.8 9.8h12.4M6 2.6v10.8M10 2.6v10.8" />
    </>
  ),
  MESSAGE: <path d="M2 4.3a1.8 1.8 0 0 1 1.8-1.8h8.4A1.8 1.8 0 0 1 14 4.3v4.9a1.8 1.8 0 0 1-1.8 1.8H7.1l-3.3 2.5v-2.5H3.8A1.8 1.8 0 0 1 2 9.2Z" />,
  CALENDAR: (
    <>
      <rect x="1.8" y="3.4" width="12.4" height="10.6" rx="1" />
      <path d="M1.8 6.9h12.4M5.6 1.8v3M10.4 1.8v3" />
      <path d="M4.8 9.3h1.8M9.4 9.3h1.8M4.8 11.6h1.8M9.4 11.6h1.8" />
    </>
  ),
  DATABASE: (
    <>
      <ellipse cx="8" cy="3.7" rx="5.2" ry="1.9" />
      <path d="M2.8 3.7v8.6c0 1 2.3 1.9 5.2 1.9s5.2-.9 5.2-1.9V3.7" />
      <path d="M2.8 8c0 1 2.3 1.9 5.2 1.9s5.2-.9 5.2-1.9" />
    </>
  ),
  REPORT: (
    <>
      <path d="M3.4 1.8h5.8l3.4 3.4v9H3.4z" />
      <path d="M9.2 1.8v3.4h3.4M5.8 8.6h4.4M5.8 11.2h4.4" />
    </>
  ),
  TICKET: (
    <>
      <path d="M1.8 5.6V3h12.4v2.6a2.4 2.4 0 0 0 0 4.8V13H1.8v-2.6a2.4 2.4 0 0 0 0-4.8Z" />
      <path d="M8.6 5.2v1.6M8.6 9.2v1.6" />
    </>
  ),
  SYSTEM: (
    <>
      <rect x="5" y="5" width="6" height="6" rx="0.6" />
      <path d="M8 1.6v3.4M8 11v3.4M1.6 8h3.4M11 8h3.4" />
    </>
  ),
};

function CardGlyph({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[label] ?? GLYPHS.SYSTEM}
    </svg>
  );
}

/* ── STATE ─────────────────────────────────────────────────────────────────── */

type Phase = 'manual' | 'analyzing' | 'reading' | 'linking' | 'flagging' | 'resolving' | 'done';

/** what the readouts are currently emphasising */
type Highlight = { kind: 'sources' | 'duplicates' | 'confidence' | 'tone'; tone?: Tone } | null;

interface Selection {
  row: 'source' | 'record';
  id: string;
}

const keyOf = (row: 'source' | 'record', id: string) => `${row}:${id}`;

/** one positioned signal in the ring */
interface Placed<T> {
  spec: T;
  x: number;
  y: number;
}

/** the whole stage geometry, in the stage's own pixel space */
interface Layout {
  /** ring on wide viewports; two columns flanking the core on phones */
  mode: 'ring' | 'columns';
  w: number;
  h: number;
  cx: number;
  cy: number;
  outerRx: number;
  outerRy: number;
  innerRx: number;
  innerRy: number;
  sources: Placed<(typeof SOURCES)[number]>[];
  records: Placed<(typeof RECORDS)[number]>[];
}

/** place n items on an ellipse, starting at the top and going clockwise */
function ring<T>(items: T[], cx: number, cy: number, rx: number, ry: number, offset: number): Placed<T>[] {
  const step = (Math.PI * 2) / Math.max(items.length, 1);
  return items.map((spec, i) => {
    const a = -Math.PI / 2 + offset + i * step;
    return { spec, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
  });
}

export function Manual() {
  const { state, setState, pushEcho, pulse, topic } = useExperience();
  const reduced = useReducedMotion();
  const topicId: TopicId = topic ?? 'leads';
  const [line1, line2] = CONTEXT[topicId];

  const [phase, setPhase] = useState<Phase>('manual');
  const [selected, setSelected] = useState<Selection | null>(null);
  const [highlight, setHighlight] = useState<Highlight>(null);
  /** true only while the confidence note is folding away (see `.closing`) */
  const [noteClosing, setNoteClosing] = useState(false);
  /** the note exists only while the confidence stat is the picked one */
  const noteOpen = highlight?.kind === 'confidence';
  /** how many outer signals the run has read, and how many records it has handled */
  const [read, setRead] = useState(0);
  const [handled, setHandled] = useState(0);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  /** true while this chapter is the one on screen: it owns the HUD's readout */
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  const sectionRef = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);
  const [stageRef, stageRect] = useElementRect<HTMLDivElement>();

  const running = phase !== 'manual' && phase !== 'done';
  const settled = phase === 'done';
  const handledCount = handled;

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const entered = seen || reduced;
  const onScreen = visible || reduced;

  // ONE OBSERVER, TWO READINGS: `seen` latches the entrance (it never replays
  // when the visitor scrolls back), `visible` tracks the chapter being on
  // screen right now. The second one is what gives this chapter the HUD.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setVisible(entry.isIntersecting);
          if (entry.isIntersecting) setSeen(true);
        });
      },
      { rootMargin: '-38% 0px -38% 0px' },
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
  }, []);

  // THE READOUT: while the visitor is reading this chapter, the HUD says what
  // the chapter is about. It re-asserts rather than claiming once, because the
  // chapters below narrate their own state from mount.
  useEffect(() => {
    if (!onScreen || running || settled) return;
    if (state !== 'decision') setState('decision');
  }, [onScreen, running, settled, state, setState]);

  /* ── the board as it stands right now ───────────────────────────────────── */

  /** the first `handled` records have been resolved, in the run's own order */
  const resolvedRecords = useMemo(() => new Set(RESOLVE_ORDER.slice(0, handledCount)), [handledCount]);
  /** a source resolves once a record it feeds has been handled */
  const resolvedSources = useMemo(() => {
    const out = new Set<string>();
    if (handledCount === 0) return out;
    LINKS.forEach((l) => {
      if (resolvedRecords.has(l.to)) out.add(l.from);
    });
    return out;
  }, [handledCount, resolvedRecords]);

  const cards = useMemo(() => {
    const sources = SOURCES.map((s) => ({
      ...s,
      row: 'source' as const,
      key: keyOf('source', s.id),
      tone: (resolvedSources.has(s.id) ? 'ok' : s.tone) as Tone,
      status: resolvedSources.has(s.id) ? s.resolved : s.status,
    }));
    const records = RECORDS.map((r) => ({
      ...r,
      row: 'record' as const,
      key: keyOf('record', r.id),
      tone: (resolvedRecords.has(r.id) ? 'ok' : r.tone) as Tone,
      status: resolvedRecords.has(r.id) ? r.resolved : r.status,
    }));
    return { sources, records, all: [...sources, ...records] };
  }, [resolvedRecords, resolvedSources]);

  const tones = useMemo(() => {
    const tally: Record<Tone, number> = { err: 0, warn: 0, ok: 0 };
    cards.all.forEach((c) => {
      tally[c.tone] += 1;
    });
    return tally;
  }, [cards.all]);

  const channels = SOURCES.filter((s) => s.channel).length;
  const duplicates = cards.records.filter((r) => r.tone === 'err').length;
  const confidence: { label: string; tone: Tone } =
    tones.err > 0 ? { label: 'Low', tone: 'warn' } : tones.warn > 0 ? { label: 'Medium', tone: 'warn' } : { label: 'High', tone: 'ok' };

  /* ── geometry: the ring is measured from the stage's real size ──────────── */

  const layout = useMemo<Layout | null>(() => {
    const w = stageRect.width;
    const h = stageRect.height;
    if (!w || !h) return null;
    const cx = w / 2;
    const cy = h / 2;

    // narrow viewports RECOMPOSE rather than shrink: sources stack down the left
    // and records down the right, so twelve signals stay legible and tappable
    // without crowding the core
    if (w < 640) {
      const leftX = w * 0.18;
      const rightX = w * 0.82;
      const topPad = Math.min(34, h * 0.07);
      const usable = h - topPad * 2;
      const place = <T,>(items: T[], x: number): Placed<T>[] =>
        items.map((spec, i) => ({ spec, x, y: topPad + (usable * (i + 0.5)) / items.length }));
      return {
        mode: 'columns',
        w,
        h,
        cx,
        cy,
        outerRx: 0,
        outerRy: 0,
        innerRx: 0,
        innerRy: 0,
        sources: place(SOURCES, leftX),
        records: place(RECORDS, rightX),
      };
    }

    // desktop / tablet: two concentric rings, six signals each, kept clear of
    // the stage's own edges at every width
    const padX = Math.min(104, w * 0.16);
    const padY = Math.min(76, h * 0.13);
    const outerRx = Math.max(44, cx - padX);
    const outerRy = Math.max(44, cy - padY);
    const innerRx = outerRx * 0.56;
    const innerRy = outerRy * 0.62;
    return {
      mode: 'ring',
      w,
      h,
      cx,
      cy,
      outerRx,
      outerRy,
      innerRx,
      innerRy,
      sources: ring(SOURCES, cx, cy, outerRx, outerRy, 0),
      records: ring(RECORDS, cx, cy, innerRx, innerRy, Math.PI / SOURCES.length),
    };
  }, [stageRect.width, stageRect.height]);

  /* ── the wires: every source → record passes through the core ───────────── */

  const wires = useMemo(() => {
    if (!layout) return [];
    return LINKS.flatMap((l) => {
      const from = layout.sources.find((s) => s.spec.id === l.from);
      const to = layout.records.find((r) => r.spec.id === l.to);
      if (!from || !to) return [];
      const a = cards.sources.find((s) => s.id === l.from);
      const b = cards.records.find((r) => r.id === l.to);
      const tone: Tone = a?.tone === 'err' || b?.tone === 'err' ? 'err' : a?.tone === 'warn' || b?.tone === 'warn' ? 'warn' : 'ok';
      // a quadratic whose control point is the core centre: the wire visibly
      // converges before it reaches its record
      return [
        {
          id: l.id,
          key: `${l.id}:${tone}`,
          d: `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${layout.cx.toFixed(1)} ${layout.cy.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
          tone,
          weak: !!l.weak,
        },
      ];
    });
  }, [layout, cards]);

  /* ── what is currently emphasised ───────────────────────────────────────── */

  const neighbours = useMemo(() => {
    const map = new Map<string, string[]>();
    LINKS.forEach((l) => {
      const a = keyOf('source', l.from);
      const b = keyOf('record', l.to);
      map.set(a, [...(map.get(a) ?? []), b]);
      map.set(b, [...(map.get(b) ?? []), a]);
    });
    return map;
  }, []);

  const focusKeys = useMemo<Set<string> | null>(() => {
    if (selected) {
      const key = keyOf(selected.row, selected.id);
      return new Set([key, ...(neighbours.get(key) ?? [])]);
    }
    // five live channels — the spreadsheet is the sixth source, not a channel
    if (highlight?.kind === 'sources') return new Set(cards.sources.filter((s) => s.channel).map((s) => s.key));
    if (highlight?.kind === 'duplicates') {
      return new Set(RECORDS.filter((r) => r.tone === 'err').map((r) => keyOf('record', r.id)));
    }
    if (highlight?.kind === 'tone' && highlight.tone) {
      return new Set(cards.all.filter((c) => c.tone === highlight.tone).map((c) => c.key));
    }
    return null;
  }, [selected, highlight, cards, neighbours]);

  const activeLinks = useMemo(() => {
    if (selected) {
      const key = keyOf(selected.row, selected.id);
      return new Set(LINKS.filter((l) => keyOf('source', l.from) === key || keyOf('record', l.to) === key).map((l) => l.id));
    }
    if (highlight?.kind === 'duplicates') {
      return new Set(LINKS.filter((l) => l.from === l.to).map((l) => l.id));
    }
    if (highlight?.kind === 'sources' || (highlight?.kind === 'tone' && highlight.tone)) {
      const keys = focusKeys ?? new Set<string>();
      return new Set(LINKS.filter((l) => keys.has(keyOf('source', l.from)) && keys.has(keyOf('record', l.to))).map((l) => l.id));
    }
    if (running) return new Set(LINKS.map((l) => l.id));
    return new Set<string>();
  }, [selected, highlight, focusKeys, running]);

  /* ── selection ──────────────────────────────────────────────────────────── */

  const pick = useCallback(
    (row: 'source' | 'record', id: string) => {
      pulse();
      setSelected((prev) => (prev && prev.row === row && prev.id === id ? null : { row, id }));
    },
    [pulse],
  );

  const pickHighlight = useCallback(
    (next: Highlight) => {
      pulse();
      setNoteClosing(noteOpen);
      setHighlight((prev) => (prev && prev.kind === next?.kind && prev.tone === next?.tone ? null : next));
      setSelected(null);
    },
    [pulse, noteOpen],
  );

  const clear = useCallback(() => {
    setNoteClosing(noteOpen);
    setSelected(null);
    setHighlight(null);
  }, [noteOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      clear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clear]);

  /* ── the run ───────────────────────────────────────────────────────────── */

  const automate = useCallback(() => {
    if (phase !== 'manual' && phase !== 'done') return;
    clearTimers();
    clear();
    setRead(0);
    setHandled(0);
    pulse();
    pushEcho('Manual system: converging 12 signals.');
    setState('executing');

    if (reduced) {
      setRead(SOURCES.length);
      setHandled(RESOLVE_ORDER.length);
      setPhase('done');
      setState('complete');
      return;
    }

    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

    setPhase('analyzing');
    at(700, () => setPhase('reading'));

    // PHASE 2 — the channels are read in order, around the ring
    const READ_STEP = 200;
    SOURCES.forEach((_, i) => at(700 + i * READ_STEP, () => setRead(i + 1)));

    // PHASE 3 — the wires carry data through the core
    const afterReads = 700 + SOURCES.length * READ_STEP;
    at(afterReads, () => setPhase('linking'));
    // PHASE 4 — the duplicates are identified
    at(afterReads + 900, () => setPhase('flagging'));
    // PHASE 5 — records converge in order
    const RESOLVE_STEP = 430;
    const afterFlag = afterReads + 1600;
    at(afterFlag, () => {
      setPhase('resolving');
      setHandled(1);
    });
    for (let i = 2; i <= RESOLVE_ORDER.length; i++) {
      at(afterFlag + (i - 1) * RESOLVE_STEP, () => setHandled(i));
    }
    at(afterFlag + RESOLVE_ORDER.length * RESOLVE_STEP + 320, () => {
      setPhase('done');
      setState('complete');
      pushEcho('Manual system resolved: 0 errors, 0 warnings.');
    });
  }, [clear, clearTimers, phase, pulse, pushEcho, reduced, setState]);

  /** the replay: a clean reset, then the whole convergence again */
  const replay = useCallback(() => {
    clearTimers();
    setPhase('manual');
    setRead(0);
    setHandled(0);
    setSelected(null);
    setHighlight(null);
    setState('decision');
    // let the reset paint one frame, then run — so replay reads as a replay
    timers.current.push(
      window.setTimeout(() => {
        automate();
      }, 60),
    );
  }, [automate, clearTimers, setState]);

  const reset = useCallback(() => {
    clearTimers();
    setPhase('manual');
    setRead(0);
    setHandled(0);
    setSelected(null);
    setHighlight(null);
    setState('decision');
  }, [clearTimers, setState]);

  /* ── the readouts ──────────────────────────────────────────────────────── */

  const linkLabel = (l: (typeof LINKS)[number]) =>
    `${SOURCES.find((s) => s.id === l.from)?.label ?? l.from} → ${RECORDS.find((r) => r.id === l.to)?.label ?? l.to}`;

  const note = useMemo(() => {
    if (running) return PHASE_COPY[phase] ?? '';
    if (selected) {
      const key = keyOf(selected.row, selected.id);
      const mine = LINKS.filter((l) => keyOf('source', l.from) === key || keyOf('record', l.to) === key);
      const card = cards.all.find((c) => c.key === key);
      if (!mine.length) return `${card?.label ?? ''} — NOTHING POINTS AT THIS YET`;
      return `${card?.label ?? ''} · ${mine.length} ${mine.length === 1 ? 'LINK' : 'LINKS'} — ${mine.map(linkLabel).join(' · ')}`;
    }
    if (highlight?.kind === 'sources') return `${channels} LIVE CHANNELS, ${SOURCES.length + RECORDS.length} SIGNALS — NOBODY OWNS THE WHOLE PICTURE`;
    if (highlight?.kind === 'duplicates')
      return settled
        ? 'THE THREE DUPLICATES ARE SETTLED — EACH RECORD NOW HAS ONE OWNER'
        : `${duplicates} RECORDS EXIST TWICE — TWO SYSTEMS THINK THEY OWN EACH ONE`;
    if (highlight?.kind === 'confidence') return 'LOW BECAUSE 3 DUPLICATES, 2 UNOWNED RECORDS AND 1 UNSENT REPORT DISAGREE WITH EACH OTHER';
    if (highlight?.kind === 'tone' && highlight.tone === 'err')
      return settled ? '0 ERRORS — EVERY DUPLICATE WAS SETTLED WHERE IT WAS' : '3 ERRORS — EVERY DUPLICATE IS THE SAME RECORD IN TWO PLACES';
    if (highlight?.kind === 'tone' && highlight.tone === 'warn')
      return settled ? '0 WARNINGS — NOTHING IS WAITING ON A HUMAN ANY MORE' : '9 WARNINGS — WAITING, UNREAD, UNOWNED, DOUBLE-BOOKED, NEVER SENT';
    if (highlight?.kind === 'tone')
      return settled ? '12 RESOLVED — ONE OWNER AND ONE VERSION EACH' : 'NOTHING IS RESOLVED YET — RUN THE AUTOMATION';
    if (settled) return PHASE_COPY.done;
    return 'TWELVE SIGNALS, NO CORE — NOTHING IS COLLECTED';
  }, [running, settled, selected, highlight, phase, cards, channels, duplicates]);

  const cardClass = (row: 'source' | 'record', card: (typeof cards.all)[number], index: number) => {
    const classes: string[] = [card.tone];
    const picked = !!selected && card.key === keyOf(selected.row, selected.id);
    const focused = focusKeys?.has(card.key) ?? false;
    if (picked) classes.push('selected');
    else if ((selected || highlight) && focused) classes.push('linked');
    else if ((selected || highlight) && focusKeys) classes.push('dim');
    if (running && row === 'source' && index < read) classes.push('active');
    if (phase === 'flagging' && row === 'record' && RECORDS.find((r) => r.id === card.id)?.tone === 'err') classes.push('flash');
    if (phase === 'resolving' && row === 'record' && RESOLVE_ORDER.slice(0, handledCount).includes(card.id)) classes.push('settling');
    return classes.join(' ');
  };

  const headState = settled
    ? { cls: 'ok', text: '12 SIGNALS, ONE SYSTEM' }
    : running && phase === 'reading'
      ? { cls: 'busy', text: `READING ${read}/${SOURCES.length} CHANNELS` }
      : running
        ? { cls: 'busy', text: `${SOURCES.length + RECORDS.length} SIGNALS CONVERGING` }
        : { cls: 'err', text: `${SOURCES.length + RECORDS.length} SIGNALS ACROSS ${channels} CHANNELS` };

  const coreValue = settled ? '12' : running ? String(handled) : '12';
  const coreLabel = settled ? 'UNIFIED' : running ? 'CONVERGING' : 'NO CORE';
  const stageMode = layout?.mode ?? 'ring';

  return (
    <section
      id="manual"
      ref={sectionRef}
      className={`chapter manual ${entered ? 'in' : ''} ${phase !== 'manual' ? 'fired' : ''}`}
      aria-label="The manual world, and the system that replaces it"
    >
      {/* HERO — the statement, with the system's own statistics beside it */}
      <div className="chapter-head manual-hero">
        <div className="mh-lead">
          <p className="mono-label manual-eyebrow">01 — THE MANUAL WORLD</p>
          <h2 className="manual-title">
            <span className="hl-line">This is what work</span>
            <span className="hl-line">feels like</span>
            <span className="hl-line hl-line-accent">without a system.</span>
          </h2>
          <p className="manual-sub">
            {line1}
            <br />
            {line2}
          </p>
        </div>

        <div className="mh-side">
          <div className="manual-meta" role="group" aria-label="System statistics">
            <button
              type="button"
              data-stat="sources"
              className={`stat ${highlight?.kind === 'sources' ? 'picked' : ''}`}
              aria-pressed={highlight?.kind === 'sources'}
              onClick={() => pickHighlight({ kind: 'sources' })}
              data-cursor="hot"
            >
              <span className="st-key">SOURCES</span>
              <strong>{settled ? 1 : channels}</strong>
            </button>
            <button
              type="button"
              data-stat="duplicates"
              className={`stat ${duplicates > 0 ? 'err' : 'ok'} ${highlight?.kind === 'duplicates' ? 'picked' : ''}`}
              aria-pressed={highlight?.kind === 'duplicates'}
              onClick={() => pickHighlight({ kind: 'duplicates' })}
              data-cursor="hot"
            >
              <span className="st-key">DUPLICATES</span>
              <strong>{duplicates}</strong>
            </button>
            <button
              type="button"
              data-stat="confidence"
              className={`stat ${confidence.tone === 'ok' ? 'ok' : 'warn'} ${highlight?.kind === 'confidence' ? 'picked' : ''}`}
              aria-pressed={highlight?.kind === 'confidence'}
              onClick={() => pickHighlight({ kind: 'confidence' })}
              data-cursor="hot"
            >
              <span className="st-key">CONFIDENCE</span>
              <strong>{confidence.label}</strong>
            </button>
            {(noteOpen || noteClosing) && (
              <p
                className={`stat-note${noteClosing ? ' closing' : ''}`}
                aria-live="polite"
                onAnimationEnd={(e) => {
                  if (e.target === e.currentTarget) setNoteClosing(false);
                }}
              >
                {settled
                  ? 'HIGH — every record has one owner, one place and one version.'
                  : 'LOW — the records disagree with each other: duplicates, one unowned contact and one report that never left.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* the living system, as it is right now */}
      <div className="living">
        <div className="living-head">
          <span className={`living-head-state ${headState.cls}`}>
            <span className="living-dot" aria-hidden="true" />
            {headState.text}
          </span>
          <span className="chapter-note living-head-note">
            ILLUSTRATIVE SYSTEM —
            <br />
            SIMULATED DATA
          </span>
        </div>

        <div
          className={`living-stage ${stageMode} ${entered ? 'in' : ''} ${running ? 'processing' : ''} ${
            settled ? 'settled' : ''
          } ${selected || highlight ? 'focused' : ''}`}
          ref={stageRef}
          onClick={clear}
          role="presentation"
        >
          <span className="living-grid" aria-hidden="true" />
          <span className="living-glow" aria-hidden="true" />

          {layout && (
            <svg
              className="living-wires"
              width={layout.w}
              height={layout.h}
              viewBox={`0 0 ${layout.w} ${layout.h}`}
              aria-hidden="true"
              focusable="false"
            >
              {/* ring guides — only meaningful when the signals are on a ring */}
              {layout.mode === 'ring' && (
                <>
                  <ellipse className="living-ring outer" cx={layout.cx} cy={layout.cy} rx={layout.outerRx} ry={layout.outerRy} />
                  <ellipse className="living-ring inner" cx={layout.cx} cy={layout.cy} rx={layout.innerRx} ry={layout.innerRy} />
                  <line className="living-axis" x1={layout.cx} y1={8} x2={layout.cx} y2={layout.h - 8} />
                </>
              )}
              {wires.map((w) => {
                const hot = activeLinks.has(w.id);
                const classes = ['living-wire', w.tone, w.weak ? 'broken' : '', hot ? 'hot' : ''].filter(Boolean).join(' ');
                return (
                  <g key={w.key} className={classes}>
                    <path className="lw-path" d={w.d} pathLength={100} />
                    {!reduced && (hot || running) && (
                      <path
                        className="lw-bloom"
                        d={w.d}
                        pathLength={100}
                        style={
                          {
                            '--dur': `${running ? 2.4 : 7 + (w.id.charCodeAt(1) % 3)}s`,
                            '--begin': `${(w.id.charCodeAt(1) % 5) * 0.4}s`,
                          } as CSSProperties
                        }
                      />
                    )}
                    {!reduced && (hot || running) && (
                      <circle className="lw-pulse" r="1.9">
                        <animateMotion
                          dur={`${running ? 1.5 : 6 + (w.id.charCodeAt(1) % 4)}s`}
                          begin={`${(w.id.charCodeAt(1) % 4) * 0.5}s`}
                          repeatCount="indefinite"
                          path={w.d}
                        />
                        <animate
                          attributeName="opacity"
                          values="0;1;1;0"
                          keyTimes="0;0.14;0.8;1"
                          dur={`${running ? 1.5 : 6}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* the core: one system, every signal passes through it */}
          {layout && (
            <div className="living-core" style={{ left: `${layout.cx}px`, top: `${layout.cy}px` }}>
              <span className="core-orbit" aria-hidden="true" />
              <span className="core-orbit reverse" aria-hidden="true" />
              <span className="core-disc" aria-hidden="true">
                {!reduced && <span className="core-tick" key={`${handled}-${phase}`} />}
              </span>
              <span className="core-readout" aria-hidden="true">
                <strong>{coreValue}</strong>
                <em>{coreLabel}</em>
              </span>
            </div>
          )}

          {/* twelve signals: six sources outside, six records inside */}
          {layout &&
            [...layout.sources, ...layout.records].map((placed, i) => {
              const isSource = i < layout.sources.length;
              const card = isSource ? cards.sources.find((c) => c.id === placed.spec.id)! : cards.records.find((c) => c.id === placed.spec.id)!;
              const row: 'source' | 'record' = isSource ? 'source' : 'record';
              const idx = isSource ? i : i - layout.sources.length;
              return (
                <button
                  key={`${row}:${placed.spec.id}`}
                  type="button"
                  className={`living-node ${row} ${cardClass(row, card, idx)}`}
                  style={
                    {
                      left: `${placed.x}px`,
                      top: `${placed.y}px`,
                      '--enter-delay': reduced ? '0ms' : `${(isSource ? 520 : 700) + idx * 60}ms`,
                    } as CSSProperties
                  }
                  aria-pressed={selected?.row === row && selected.id === placed.spec.id}
                  aria-label={`${card.label} — ${card.status}. ${card.detail}.`}
                  onClick={(e) => {
                    e.stopPropagation();
                    pick(row, placed.spec.id);
                  }}
                  data-cursor="hot"
                >
                  <span className="ln-body">
                    <span className="ln-top">
                      <span className="ln-mark" aria-hidden="true">
                        {MARK[card.tone]}
                      </span>
                      <span className="ln-glyph" aria-hidden="true">
                        <CardGlyph label={card.label} />
                      </span>
                      <span className="ln-idx" aria-hidden="true">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </span>
                    <span className="ln-type">{card.label}</span>
                    <span className="ln-stat">{card.status}</span>
                  </span>
                </button>
              );
            })}
        </div>

        {/* the panel's own readout: counted from the board, never asserted */}
        <div className="living-foot">
          <p className="living-legend">
            {(['err', 'warn', 'ok'] as Tone[]).map((tone) => {
              const labels: Record<Tone, [string, string]> = {
                err: ['ERROR', 'ERRORS'],
                warn: ['WARNING', 'WARNINGS'],
                ok: ['RESOLVED', 'RESOLVED'],
              };
              const active = highlight?.kind === 'tone' && highlight.tone === tone;
              return (
                <button
                  key={tone}
                  type="button"
                  className={`living-lg ${tone} ${active ? 'picked' : ''}`}
                  aria-pressed={active}
                  onClick={() => pickHighlight({ kind: 'tone', tone })}
                  data-cursor="hot"
                >
                  <span aria-hidden="true">{MARK[tone]}</span>
                  <span className="lgl-n">{tones[tone]}</span>
                  {labels[tone][tones[tone] === 1 ? 0 : 1]}
                </button>
              );
            })}
          </p>
          <p className="living-note" aria-live="polite">
            {note}
          </p>
        </div>
      </div>

      {/* the decision the chapter has been building to */}
      <div className="manual-actions">
        <button
          type="button"
          className={`system-btn solid ${running ? 'fired' : ''}`}
          onClick={settled ? replay : automate}
          disabled={running}
          data-cursor="hot"
        >
          {running ? 'CONVERGING…' : settled ? '↺ REPLAY CONVERGENCE' : 'CONVERGE THE SYSTEM →'}
        </button>
        {phase !== 'manual' && !running && (
          <button type="button" className="chip" onClick={reset}>
            ↺ RESET SYSTEM
          </button>
        )}
        <p className="manual-caption">
          {settled ? 'SAME 12 SIGNALS — ONE SYSTEM, ONE OWNER, ONE VERSION' : 'WATCH 12 DISCONNECTED SIGNALS BECOME ONE SYSTEM'}
        </p>
      </div>
    </section>
  );
}
