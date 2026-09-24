import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useElementRect, useReducedMotion } from '../lib/geometry';
import type { Pt } from '../lib/geometry';
import { useExperience } from '../lib/ExperienceController';
import type { TopicId } from '../lib/typed';

/**
 * MANUAL — the chapter that shows what work looks like without a system.
 *
 * The composition is a schematic, not a collage: six channels feed a lower row
 * of six records, and every wire between them carries a state. Three things
 * keep it honest:
 *
 *  1. NOTHING IS ASSERTED THAT ISN'T COUNTED. A card's tone comes from its
 *     status, the counters are a tally of those tones, and confidence is derived
 *     from the tally. When the automation resolves a record, the counters and
 *     the confidence readout move because the data moved — not because a label
 *     was swapped.
 *
 *  2. THE WIRES ARE MEASURED. Routes are traced from the real boxes of the
 *     cards on the stage, so the diagram cannot drift away from what it
 *     describes, at any breakpoint.
 *
 *  3. THE RUN IS A SEQUENCE, NOT A SPINNER. Reading (channels, in order) →
 *     wiring → flagging → resolving (records, in order). Each phase lights the
 *     cards it is about, so the visitor can watch which item is being handled.
 */

/* ── THE BOARD ─────────────────────────────────────────────────────────────── */

type Tone = 'err' | 'warn' | 'ok';

interface CardSpec {
  /** key inside its row */
  id: string;
  label: string;
  status: string;
  /** the line under the card: what it actually is */
  detail: string;
  /** the status once the automation has handled it */
  resolved: string;
  tone: Tone;
}

/** five live channels and one spreadsheet everyone keeps separately */
const SOURCES: (CardSpec & { channel: boolean })[] = [
  { id: 'email', label: 'EMAIL', status: 'REPLY AVERAGE', detail: '9 hrs in the queue', resolved: 'ANSWERED', tone: 'warn', channel: true },
  { id: 'form', label: 'FORM', status: 'UNREAD 3 DAYS', detail: 'contact form #2291', resolved: 'READ + ROUTED', tone: 'warn', channel: true },
  { id: 'crm', label: 'CRM', status: 'UNASSIGNED', detail: 'LEAD-88 // no owner', resolved: 'OWNER SET', tone: 'warn', channel: true },
  { id: 'sheet', label: 'SPREADSHEET', status: '7 OF 7 WAIT', detail: 'Q3-tracking-v7-FINAL', resolved: 'SYNCED', tone: 'warn', channel: false },
  { id: 'message', label: 'MESSAGE', status: 'SENT AT 3 AM', detail: '“did you see this one?”', resolved: 'ROUTED', tone: 'warn', channel: true },
  { id: 'calendar', label: 'CALENDAR', status: 'DOUBLE-BOOKED', detail: '11:00 — two bookings', resolved: 'CONFLICT CLEARED', tone: 'warn', channel: true },
];

const RECORDS: CardSpec[] = [
  { id: 'email', label: 'EMAIL', status: 'DUPLICATE', detail: 'same thread, two owners', resolved: 'RESOLVED', tone: 'err' },
  { id: 'db', label: 'DATABASE', status: 'NO OWNER', detail: 'customer // unlinked', resolved: 'ASSIGNED', tone: 'warn' },
  { id: 'report', label: 'REPORT', status: 'NEVER SENT', detail: 'WEEKLY-REPORT-draft2', resolved: 'SENT', tone: 'warn' },
  { id: 'form', label: 'FORM', status: 'DUPLICATE', detail: 'submitted twice', resolved: 'RESOLVED', tone: 'err' },
  { id: 'ticket', label: 'TICKET', status: 'ESCALATED', detail: 'URGENT — no reply yet', resolved: 'ASSIGNED', tone: 'warn' },
  { id: 'crm', label: 'CRM', status: 'DUPLICATE', detail: 'LEAD-88 // NEW ×2', resolved: 'RESOLVED', tone: 'err' },
];

/** every wire the manual world has: same record twice, plus who is waiting on whom */
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
  analyzing: 'scanning 12 items across 5 channels…',
  reading: 'reading sources — no field understood yet',
  linking: 'wiring 9 links between 5 channels…',
  flagging: '3 duplicates found — the same record in two places',
  resolving: 'resolving in place, one record at a time',
  done: '12 items, one system — 0 handoffs, 0 duplicates',
};

/* ── GLYPHS ──────────────────────────────────────────────────────────────────
   One mark per card, drawn on a 16-unit grid so every icon carries the same
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

/* ── ROUTES ──────────────────────────────────────────────────────────────────
   The wire is half of the argument: every record is reachable, and none of it
   was ever designed. Routes are rounded orthogonal traces — engineered, not
   drawn freehand. */

interface FieldLink {
  id: string;
  key: string;
  d: string;
  tone: Tone;
  weak: boolean;
  a: Pt;
  b: Pt;
}

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
  cx: number;
  cy: number;
}

/** Rounded polyline: routes read as engineered traces rather than scribbles. */
function trace(points: Pt[], radius = 8): string {
  if (points.length < 2) return '';
  const dir = (a: Pt, b: Pt) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len, len };
  };
  const round = (n: number) => n.toFixed(1);
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const p = points[i];
    const next = points[i + 1];
    const into = dir(prev, p);
    const out = dir(p, next);
    const r = Math.min(radius, into.len / 2, out.len / 2);
    d += ` L ${round(p.x - into.x * r)} ${round(p.y - into.y * r)}`;
    d += ` Q ${round(p.x)} ${round(p.y)} ${round(p.x + out.x * r)} ${round(p.y + out.y * r)}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${round(last.x)} ${round(last.y)}`;
}

/** The shortest orthogonal route between two cards, with a gap at each end. */
function route(from: Box, to: Box): Pt[] {
  const gap = 7;
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  if (Math.abs(dy) > Math.abs(dx) * 0.6) {
    const down = dy > 0;
    const midY = (from.cy + to.cy) / 2;
    return [
      { x: from.cx, y: down ? from.b + gap : from.t - gap },
      { x: from.cx, y: midY },
      { x: to.cx, y: midY },
      { x: to.cx, y: down ? to.t - gap : to.b + gap },
    ];
  }
  const right = dx > 0;
  const midX = (from.cx + to.cx) / 2;
  return [
    { x: right ? from.r + gap : from.l - gap, y: from.cy },
    { x: midX, y: from.cy },
    { x: midX, y: to.cy },
    { x: right ? to.l - gap : to.r + gap, y: to.cy },
  ];
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
  /** how many sources the run has read, and how many records it has handled */
  const [read, setRead] = useState(0);
  const [handled, setHandled] = useState(0);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  /** true while this chapter is the one on screen: it owns the HUD's readout */
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  const [metrics, setMetrics] = useState({ w: 0, h: 0, boxes: {} as Record<string, Box> });

  const sectionRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement | null>());
  const timers = useRef<number[]>([]);
  const [stageRef, stageRect] = useElementRect<HTMLDivElement>();

  const running = phase !== 'manual' && phase !== 'done';
  const settled = phase === 'done';
  /** how many records the run has settled: the board is a function of this */
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
      // "on screen" means the chapter holds the middle band of the viewport, not
      // that a corner of it peeks in below the intro
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
  // chapters below narrate their own state from mount — without this, the ACT
  // chapter's off-screen demo lands a "RESULT" over the manual world.
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
      // the group is fixed by what the records were, so the reading keeps
      // pointing at the same three cards after the run has settled them
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

  /* ── measuring: every wire is traced from the cards' real boxes ──────────── */

  const layoutKey = cards.all.map((c) => `${c.key}:${c.tone}`).join('|');
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const base = stage.getBoundingClientRect();
    const boxes: Record<string, Box> = {};
    cardRefs.current.forEach((el, key) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      boxes[key] = {
        l: r.left - base.left,
        t: r.top - base.top,
        r: r.right - base.left,
        b: r.bottom - base.top,
        cx: r.left - base.left + r.width / 2,
        cy: r.top - base.top + r.height / 2,
      };
    });
    setMetrics((prev) => {
      if (prev.w === stageRect.width && prev.h === stageRect.height) {
        const a = Object.keys(prev.boxes);
        const b = Object.keys(boxes);
        if (
          a.length === b.length &&
          b.every((k) => prev.boxes[k] && Math.abs(prev.boxes[k].l - boxes[k].l) < 0.5 && Math.abs(prev.boxes[k].t - boxes[k].t) < 0.5 && Math.abs(prev.boxes[k].r - boxes[k].r) < 0.5 && Math.abs(prev.boxes[k].b - boxes[k].b) < 0.5)
        ) {
          return prev;
        }
      }
      return { w: stageRect.width, h: stageRect.height, boxes };
    });
  }, [stageRef, stageRect.width, stageRect.height, layoutKey, handledCount]);

  const wires = useMemo<FieldLink[]>(() => {
    if (!metrics.w || !metrics.h) return [];
    return LINKS.flatMap((l) => {
      const from = metrics.boxes[keyOf('source', l.from)];
      const to = metrics.boxes[keyOf('record', l.to)];
      if (!from || !to) return [];
      const points = route(from, to);
      const a = cards.sources.find((s) => s.id === l.from);
      const b = cards.records.find((r) => r.id === l.to);
      const tone: Tone = a?.tone === 'err' || b?.tone === 'err' ? 'err' : a?.tone === 'warn' || b?.tone === 'warn' ? 'warn' : 'ok';
      return [
        {
          id: l.id,
          key: `${l.id}:${tone}`,
          d: trace(points),
          tone,
          weak: !!l.weak,
          a: points[0],
          b: points[points.length - 1],
        },
      ];
    });
  }, [metrics, cards]);

  /* ── pointer as instrumentation ──────────────────────────────────────────── */

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    let last = { x: 0, y: 0 };
    const apply = () => {
      raf = 0;
      const stageEl = stageRef.current;
      const rect = section.getBoundingClientRect();
      const nx = (last.x - rect.left) / Math.max(rect.width, 1) - 0.5;
      const ny = (last.y - rect.top) / Math.max(rect.height, 1) - 0.5;
      if (planeRef.current) {
        planeRef.current.style.transform = `translate3d(${(-nx * 7).toFixed(1)}px, ${(-ny * 5).toFixed(1)}px, 0)`;
      }
      if (focusRef.current) {
        if (!stageEl) {
          focusRef.current.style.transform = 'translate3d(-60rem, -60rem, 0)';
          return;
        }
        const sr = stageEl.getBoundingClientRect();
        const inside = last.x >= sr.left && last.x <= sr.right && last.y >= sr.top && last.y <= sr.bottom;
        focusRef.current.style.transform = inside
          ? `translate3d(${(last.x - sr.left).toFixed(0)}px, ${(last.y - sr.top).toFixed(0)}px, 0)`
          : 'translate3d(-60rem, -60rem, 0)';
      }
    };
    const onMove = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      if (planeRef.current) planeRef.current.style.transform = 'translate3d(0, 0, 0)';
      if (focusRef.current) focusRef.current.style.transform = 'translate3d(-60rem, -60rem, 0)';
    };
    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);
    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, stageRef]);

  /* ── selection ──────────────────────────────────────────────────────────── */

  const pick = useCallback((row: 'source' | 'record', id: string) => {
    pulse();
    setSelected((prev) => (prev && prev.row === row && prev.id === id ? null : { row, id }));
  }, [pulse]);

  const pickHighlight = useCallback(
    (next: Highlight) => {
      pulse();
      // any pick that takes the note down folds it away instead of deleting it
      // between two frames
      setNoteClosing(noteOpen);
      setHighlight((prev) => (prev && prev.kind === next?.kind && prev.tone === next?.tone ? null : next));
      setSelected(null);
    },
    [pulse, noteOpen],
  );

  /** drop whatever is open — the selected card, the picked stat, and the note */
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
    clear(); // the run takes over the readings the visitor had picked
    setRead(0);
    setHandled(0);
    pulse();
    pushEcho('Manual system: automating 12 items.');
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

    // PHASE 2 — the channels are read in order, left to right
    const READ_STEP = 200;
    SOURCES.forEach((_, i) => at(700 + i * READ_STEP, () => setRead(i + 1)));

    // PHASE 3 — the wires carry data
    const afterReads = 700 + SOURCES.length * READ_STEP;
    at(afterReads, () => setPhase('linking'));
    // PHASE 4 — the duplicates are identified
    at(afterReads + 900, () => setPhase('flagging'));
    // PHASE 5 — records are handled in order
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
    // `clear` is a dependency on purpose: it is the one place that knows whether
    // the note is open, and a stale copy of it would drop the note instead of
    // folding it away
  }, [clear, clearTimers, phase, pulse, pushEcho, reduced, setState]);

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
    if (highlight?.kind === 'sources') return `${channels} LIVE CHANNELS, ${SOURCES.length + RECORDS.length} ITEMS — NOBODY OWNS THE WHOLE PICTURE`;
    if (highlight?.kind === 'duplicates')
      return settled
        ? 'THE THREE DUPLICATES ARE SETTLED — EACH RECORD NOW HAS ONE OWNER'
        : `${duplicates} RECORDS EXIST TWICE — TWO SYSTEMS THINK THEY OWN EACH ONE`;
    if (highlight?.kind === 'confidence') return 'LOW BECAUSE 3 DUPLICATES, 2 UNOWNED RECORDS AND 1 UNSENT REPORT DISAGREE WITH EACH OTHER';
    if (highlight?.kind === 'tone' && highlight.tone === 'err')
      return settled
        ? '0 ERRORS — EVERY DUPLICATE WAS SETTLED WHERE IT WAS'
        : '3 ERRORS — EVERY DUPLICATE IS THE SAME RECORD IN TWO PLACES';
    if (highlight?.kind === 'tone' && highlight.tone === 'warn')
      return settled
        ? '0 WARNINGS — NOTHING IS WAITING ON A HUMAN ANY MORE'
        : '9 WARNINGS — WAITING, UNREAD, UNOWNED, DOUBLE-BOOKED, NEVER SENT';
    if (highlight?.kind === 'tone')
      return settled
        ? '12 RESOLVED — ONE OWNER AND ONE VERSION EACH'
        : 'NOTHING IS RESOLVED YET — RUN THE AUTOMATION';
    // nothing being inspected: the panel reports where the system ended up
    if (settled) return PHASE_COPY.done;
    return 'MORE LINKS, LOW CONFIDENCE INCIDENTS';
  }, [running, settled, selected, highlight, phase, cards, channels, duplicates]);

  const cardClass = (card: (typeof cards.all)[number]) => {
    const classes: string[] = [card.tone];
    // the card you picked is not the same state as the cards it reaches: one is
    // framed, the others are lit, and everything they do not touch recedes
    const picked = !!selected && card.key === keyOf(selected.row, selected.id);
    const focused = focusKeys?.has(card.key) ?? false;
    if (picked) classes.push('selected');
    else if ((selected || highlight) && focused) classes.push('linked');
    else if ((selected || highlight) && focusKeys) classes.push('dim');
    if (running && card.row === 'source' && SOURCES.findIndex((s) => s.id === card.id) < read) classes.push('active');
    if (phase === 'flagging' && card.row === 'record' && RECORDS.find((r) => r.id === card.id)?.tone === 'err') classes.push('flash');
    if (phase === 'resolving' && card.row === 'record' && RECORDS.slice(0, handledCount).some((r) => r.id === card.id)) classes.push('settling');
    return classes.join(' ');
  };

  const stageClass = `manual-stage ${running ? 'processing' : ''} ${settled ? 'settled' : ''} ${selected || highlight ? 'focused' : ''}`;

  return (
    <section
      id="manual"
      ref={sectionRef}
      className={`chapter manual ${entered ? 'in' : ''} ${phase !== 'manual' ? 'fired' : ''}`}
      aria-label="The manual world, and the automation that replaces it"
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

      {/* the system, as it is right now */}
      <div className="scatter">
        <div className="sys-head">
          <span className={`sys-head-state ${settled ? 'ok' : running ? 'busy' : 'err'}`}>
            <span className="sys-dot" aria-hidden="true" />
            {settled
              ? '12 ITEMS, ONE SYSTEM'
              : running && phase === 'reading'
                ? `READING ${read}/${SOURCES.length} CHANNELS`
                : `${SOURCES.length + RECORDS.length} ITEMS ACROSS ${channels} CHANNELS`}
          </span>
          <span className="chapter-note sys-head-note">
            ILLUSTRATIVE SYSTEM —
            <br />
            SIMULATED DATA
          </span>
        </div>

        <div className={stageClass} ref={stageRef} onClick={clear} role="presentation">
          <div className="field-plane" ref={planeRef} aria-hidden="true">
            <span className="field-grid" />
            <span className="field-arcs" />
            <span className="field-scan" />
          </div>
          <span className="field-focus" ref={focusRef} aria-hidden="true" />

          {metrics.w > 0 && metrics.h > 0 && (
            <svg
              className="field-links"
              width={metrics.w}
              height={metrics.h}
              viewBox={`0 0 ${metrics.w} ${metrics.h}`}
              aria-hidden="true"
              focusable="false"
            >
              {wires.map((w) => {
                const hot = activeLinks.has(w.id);
                const classes = ['link', w.tone, w.weak ? 'broken' : '', hot ? 'hot' : ''].filter(Boolean).join(' ');
                return (
                  <g key={w.key} className={classes}>
                    <path className="link-path" d={w.d} pathLength={100} />
                    {!reduced && (hot || running) && (
                      <path
                        className="link-bloom"
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
                    <circle className="link-port" cx={w.a.x} cy={w.a.y} r="2.2" />
                    <circle className="link-port" cx={w.b.x} cy={w.b.y} r="2.2" />
                    {!reduced && (hot || running) && (
                      <circle className="link-pulse" r="1.9">
                        <animateMotion
                          dur={`${running ? 1.5 : 6 + (w.id.charCodeAt(1) % 4)}s`}
                          begin={`${(w.id.charCodeAt(1) % 4) * 0.5}s`}
                          repeatCount="indefinite"
                          path={w.d}
                        />
                        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.14;0.8;1" dur={`${running ? 1.5 : 6}s`} repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          <div className="sys-rows">
            {/* INPUT — the channels, each sitting on its own state */}
            <div className="sys-row">
              <p className="sys-row-label">
                SOURCES <span>/ WAITING ON A HUMAN</span>
              </p>
              <div className="sys-cards">
                {cards.sources.map((card, i) => (
                  <button
                    key={card.key}
                    type="button"
                    ref={(el) => {
                      cardRefs.current.set(card.key, el);
                    }}
                    className={`manual-entry ${cardClass(card)}`}
                    aria-pressed={selected?.row === 'source' && selected.id === card.id}
                    aria-label={`${card.label} — ${card.status}. ${card.detail}.`}
                    onClick={(e) => {
                      e.stopPropagation();
                      pick('source', card.id);
                    }}
                    style={{ animationDelay: reduced ? undefined : `${700 + i * 60}ms` }}
                    data-cursor="hot"
                  >
                    <span className="me-node">
                      <span className="me-x" aria-hidden="true">
                        {MARK[card.tone]}
                      </span>
                      <span className="me-glyph" aria-hidden="true">
                        <CardGlyph label={card.label} />
                      </span>
                      <span className="me-type">{card.label}</span>
                      <span className="me-idx" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="me-stat">{card.status}</span>
                      <span className="me-detail" aria-hidden="true">
                        {card.detail}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* OUTPUT — what the channels have produced so far */}
            <div className="sys-row">
              <p className="sys-row-label">
                RECORDS <span>/ NO SINGLE TRUTH</span>
              </p>
              <div className="sys-cards">
                {cards.records.map((card, i) => (
                  <button
                    key={card.key}
                    type="button"
                    ref={(el) => {
                      cardRefs.current.set(card.key, el);
                    }}
                    className={`scatter-cell ${cardClass(card)}`}
                    aria-pressed={selected?.row === 'record' && selected.id === card.id}
                    aria-label={`${card.label} — ${card.status}. ${card.detail}.`}
                    onClick={(e) => {
                      e.stopPropagation();
                      pick('record', card.id);
                    }}
                    style={{ animationDelay: reduced ? undefined : `${760 + i * 60}ms` }}
                    data-cursor="hot"
                  >
                    <span className="sc-idx" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="sc-head">
                      <span className="me-glyph" aria-hidden="true">
                        <CardGlyph label={card.label} />
                      </span>
                      <span className="cell-type">{card.label}</span>
                    </span>
                    <span className="cell-stat">{card.status}</span>
                    <span className="cell-value">{card.detail}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* the panel's own readout: counted from the board, never asserted */}
        <div className="scatter-actions">
          <p className="manual-legend">
            {(['err', 'warn', 'ok'] as Tone[]).map((tone) => {
              const marks: Record<Tone, string> = { err: '✕', warn: '△', ok: '✓' };
              // "0 RESOLVED" reads as a tally; "0 RESOLVEDS" does not
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
                  className={`lg ${tone} ${active ? 'picked' : ''}`}
                  aria-pressed={active}
                  onClick={() => pickHighlight({ kind: 'tone', tone })}
                  data-cursor="hot"
                >
                  <span aria-hidden="true">{marks[tone]}</span>
                  <span className="lg-n">{tones[tone]}</span>
                  {labels[tone][tones[tone] === 1 ? 0 : 1]}
                </button>
              );
            })}
          </p>
          <p className="sys-note" aria-live="polite">
            {note}
          </p>
        </div>
      </div>

      {/* the decision the chapter has been building to */}
      <div className="manual-actions">
        <button
          type="button"
          className={`system-btn solid ${running ? 'fired' : ''}`}
          onClick={automate}
          disabled={running}
          data-cursor="hot"
        >
          {running ? 'ANALYZING…' : settled ? 'AUTOMATED ✓' : 'AUTOMATE THIS →'}
        </button>
        {phase !== 'manual' && (
          <button type="button" className="chip" onClick={reset}>
            ↺ RESET SYSTEM
          </button>
        )}
        <p className="manual-caption">
          {settled ? 'SAME 12 ITEMS — ONE SYSTEM, ONE OWNER, ONE VERSION' : 'SEE THE SAME 12 ITEMS IN AN AI-LED SYSTEM'}
        </p>
      </div>
    </section>
  );
}
