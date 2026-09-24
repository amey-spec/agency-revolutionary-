import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/** Mulberry32 seeded PRNG — same "randomness" every load, so layouts are stable. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Pt {
  x: number;
  y: number;
}

/**
 * Radial cluster layout: no rings, no grid. Groups form a loose annulus around
 * the center; items get per-type tilt + jitter. Coordinates are in % of stage.
 */
export function radialLayout<T extends { id: string; kind?: string }>(
  items: T[],
  opts: { jitter?: number; minR?: number; maxR?: number; tiltSeed?: number } = {},
): Map<string, Pt> {
  const { minR = 17, maxR = 40, tiltSeed = 7 } = opts;
  const rng = seededRandom(tiltSeed * 1000 + items.length * 13 + 7);
  const byKind = new Map<string, T[]>();
  for (const item of items) {
    const k = item.kind ?? 'x';
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k)!.push(item);
  }
  const groups = [...byKind.values()];
  const pos = new Map<string, Pt>();

  groups.forEach((group, gi) => {
    const gCount = groups.length;
    const tilt = (gi / gCount) * Math.PI * 2 + rng() * 0.5;
    group.forEach((item, ii) => {
      const inner = group.length > 1 ? ii / (group.length - 1) : 0.5;
      const radius = minR + inner * (maxR - minR) + (rng() - 0.5) * 5;
      const angle = tilt + (inner - 0.5) * 0.85 + (rng() - 0.5) * 0.12;
      pos.set(item.id, {
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * 0.78 * radius,
      });
    });
  });

  return pos;
}

export interface Box {
  w: number;
  h: number;
}

/**
 * Where a segment leaving (cx, cy) toward (tx, ty) crosses the edge of a w × h
 * box centred on (cx, cy) — i.e. the point where a wire should meet a node's
 * outer boundary instead of its centre. Works in whatever unit the caller uses,
 * as long as the box is expressed in that same unit. `pad` pushes the meeting
 * point `pad` units clear of the edge (the visual gap between wire and node).
 */
export function boxEdgePoint(
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  box: Box,
  pad = 0,
): Pt {
  const hw = box.w / 2 + pad;
  const hh = box.h / 2 + pad;
  const dx = tx - cx;
  const dy = ty - cy;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  // coincident points have no direction — leave from the right edge
  if (adx < 1e-6 && ady < 1e-6) return { x: cx + hw, y: cy };
  const txEdge = adx < 1e-6 ? Infinity : hw / adx;
  const tyEdge = ady < 1e-6 ? Infinity : hh / ady;
  const t = Math.min(txEdge, tyEdge);
  return { x: cx + dx * t, y: cy + dy * t };
}

/** True when two measured box maps describe the same boxes. */
export function sameBoxes(a: Record<string, Box>, b: Record<string, Box>): boolean {
  const keys = Object.keys(b);
  return (
    keys.length === Object.keys(a).length &&
    keys.every((k) => a[k] && a[k].w === b[k].w && a[k].h === b[k].h)
  );
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const EMPTY_RECT: Rect = { left: 0, top: 0, width: 0, height: 0 };

/**
 * Reactive viewport rect of an element. Diagram wires are laid out in the
 * container's own unit space, so they need the container's real pixel size to
 * land on a node's edge at every breakpoint.
 */
export function useElementRect<T extends HTMLElement>(): [RefObject<T | null>, Rect] {
  const ref = useRef<T | null>(null);
  const [rect, setRect] = useState<Rect>(EMPTY_RECT);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const next = el.getBoundingClientRect();
      setRect((prev) =>
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : { left: next.left, top: next.top, width: next.width, height: next.height },
      );
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener('resize', read);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', read);
    };
  }, []);

  return [ref, rect];
}

/**
 * Tracks prefers-reduced-motion reactively.
 * `?fast` in the URL forces the reduced/static path (useful for QA snapshots).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.location.search.includes('fast')) return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
