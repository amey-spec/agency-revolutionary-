import { FIELD_FRAGMENTS, FIELD_GLYPHS, FIELD_SIGNALS } from './content';
import type { FieldGroup } from './content';
import { seededRandom } from './geometry';
import type { TopicId } from './typed';

/**
 * The hero signal field.
 *
 * Signals are placed along a handful of curved lanes (rotated ellipses with
 * different centres, radii and phases) — never on one ring, never on a grid.
 * Placement is measured (each signal's real box) and deterministic, so the field
 * keeps its composition between loads and can never overlap itself, the central
 * question, or the chrome at the edges of the hero.
 */

export type FieldTier = 'xs' | 's' | 'm' | 'l' | 'xl';
export type FieldKind = 'topic' | 'ambient' | 'texture';

export interface FieldCandidate {
  key: string;
  kind: FieldKind;
  /** the word itself (topics and ambient signals) */
  text?: string;
  /** texture only: the rendered lines and their relative weight */
  lines?: string[];
  lineOpacity?: number;
  topic?: TopicId;
}

export interface FieldSlot extends FieldCandidate {
  /** centre of the signal, in % of the hero box */
  x: number;
  y: number;
  /** resting motion: a slow glide along the local lane + a radial breath */
  dirX: number;
  dirY: number;
  amp: number;
  cross: number;
  speed: number;
  phase: number;
  radial: number;
  rPhase: number;
}

/** how much of the vocabulary each viewport gets */
export const FIELD_TIERS: Record<FieldTier, { ambient: number; texture: number }> = {
  xs: { ambient: 8, texture: 2 },
  s: { ambient: 10, texture: 3 },
  m: { ambient: 14, texture: 4 },
  l: { ambient: 18, texture: 5 },
  xl: { ambient: 22, texture: 6 },
};

export function fieldTier(width: number): FieldTier {
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'l';
  if (width >= 768) return 'm';
  if (width >= 480) return 's';
  return 'xs';
}

const GROUPS: FieldGroup[] = ['action', 'business', 'ai', 'creative'];

function textureCandidates(count: number): FieldCandidate[] {
  const rng = seededRandom(917);
  const out: FieldCandidate[] = [];
  for (let i = 0; i < count; i++) {
    const run = (n: number) => {
      let s = '';
      for (let c = 0; c < n; c++) s += FIELD_GLYPHS[Math.floor(rng() * FIELD_GLYPHS.length)];
      return s;
    };
    const lines = [run(4 + Math.floor(rng() * 5)), run(3 + Math.floor(rng() * 5))];
    // some patches carry a technical fragment: the app's own ambient vocabulary
    if (rng() > 0.45) lines.push(FIELD_FRAGMENTS[Math.floor(rng() * FIELD_FRAGMENTS.length)]);
    out.push({
      key: `tex:${i}`,
      kind: 'texture',
      lines,
      lineOpacity: 0.3 + rng() * 0.5,
    });
  }
  return out;
}

/** the balanced subset of signals this viewport shows */
export function fieldCandidates(tier: FieldTier): FieldCandidate[] {
  const { ambient, texture } = FIELD_TIERS[tier];
  const topics = FIELD_SIGNALS.filter((s) => s.topic);
  const pool = FIELD_SIGNALS.filter((s) => !s.topic);

  // round-robin across the four vocabularies so no single group dominates
  const picks: typeof pool = [];
  for (let round = 0; picks.length < ambient; round++) {
    let added = false;
    for (const group of GROUPS) {
      const next = pool.filter((s) => s.group === group)[round];
      if (next && picks.length < ambient) {
        picks.push(next);
        added = true;
      }
    }
    if (!added) break;
  }

  // the selectable topics sit inside the field, spread through its order
  const mixed = [...picks];
  topics.forEach((t, i) => mixed.splice(Math.min(mixed.length, i * 3 + 1), 0, t));

  const items: FieldCandidate[] = mixed.map((s) =>
    s.topic ? { key: `t:${s.topic}`, kind: 'topic', text: s.t, topic: s.topic } : { key: `s:${s.t}`, kind: 'ambient', text: s.t },
  );

  return [...items, ...textureCandidates(texture)];
}

export interface FieldBox {
  width: number;
  height: number;
  /** usable band inside the hero (keeps signals off the status lines and prompt) */
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** the central question, already inflated by a margin */
  avoid: { x: number; y: number; w: number; h: number } | null;
}

export interface FieldItem {
  key: string;
  w: number;
  h: number;
  kind: FieldKind;
}

interface Lane {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  cos: number;
  sin: number;
  phase: number;
}

const LANES = 7;

function buildLanes(box: FieldBox, rng: () => number): Lane[] {
  const { width: w, height: h } = box;
  const lanes: Lane[] = [];
  for (let i = 0; i < LANES; i++) {
    const rot = (rng() - 0.5) * 1.15;
    lanes.push({
      // lanes are offset from the centre and differently rotated, so the field
      // reads as crossing trajectories rather than concentric orbits
      cx: w * (0.5 + (rng() - 0.5) * 0.32),
      cy: h * (0.5 + (rng() - 0.5) * 0.26),
      rx: w * (0.28 + rng() * 0.24),
      ry: h * (0.2 + rng() * 0.22),
      cos: Math.cos(rot),
      sin: Math.sin(rot),
      phase: rng() * Math.PI * 2,
    });
  }
  return lanes;
}

const pointOn = (lane: Lane, t: number) => {
  const x0 = Math.cos(t) * lane.rx;
  const y0 = Math.sin(t) * lane.ry;
  return { x: lane.cx + x0 * lane.cos - y0 * lane.sin, y: lane.cy + x0 * lane.sin + y0 * lane.cos };
};

const tangentOn = (lane: Lane, t: number) => {
  const x0 = -Math.sin(t) * lane.rx;
  const y0 = Math.cos(t) * lane.ry;
  const dx = x0 * lane.cos - y0 * lane.sin;
  const dy = x0 * lane.sin + y0 * lane.cos;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
};

/** dense patches against empty space — keeps the field from reading as a grid */
function fieldNoise(x: number, y: number, box: FieldBox) {
  const u = (x - box.left) / Math.max(box.right - box.left, 1);
  const v = (y - box.top) / Math.max(box.bottom - box.top, 1);
  return (
    Math.sin(u * 6.4 + 1.3) * 0.55 +
    Math.sin(v * 5.2 + 0.7) * 0.5 +
    Math.sin((u + v) * 3.9 + 2.1) * 0.45 +
    Math.sin((u - v) * 8.3 + 4.2) * 0.25
  );
}

const MARGIN = 7;

/**
 * Free space around a candidate slot, after reserving the room each signal
 * needs to breathe. `bound` is the largest distance a signal can travel from
 * its slot (its glide, its cross drift and its radial breath combined), so a
 * non-negative result means the two signals cannot touch at any point of their
 * motion — not only in their resting frame.
 */
function slack(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  bound: number,
  placed: { x: number; y: number; halfW: number; halfH: number; bound: number }[],
) {
  let worst = Infinity;
  for (const p of placed) {
    const gap = Math.max(
      Math.abs(x - p.x) - (halfW + p.halfW),
      Math.abs(y - p.y) - (halfH + p.halfH),
    );
    const room = gap - (bound + p.bound);
    if (room < worst) worst = room;
  }
  return worst;
}

/** interactive signals claim the open space first, then the field fills in */
const PLACE_ORDER: Record<FieldKind, number> = { topic: 0, ambient: 1, texture: 2 };

/**
 * Places every signal on a curved lane, preferring open space (with a noise
 * bias so dense patches and empty regions emerge). Deterministic for a seed.
 */
export function placeField(items: FieldItem[], box: FieldBox, seed: number): Map<string, FieldSlot> {
  const rng = seededRandom(seed);
  const lanes = buildLanes(box, rng);
  const placed: { x: number; y: number; halfW: number; halfH: number; bound: number }[] = [];
  const out = new Map<string, FieldSlot>();
  const samples = 20;
  // the first pass asks for generous air; later passes relax it rather than
  // dropping a signal from the field, and the last one only insists on the
  // reserved drift room, so a signal is dropped only when nothing at all fits
  const passes = [1, 0.68, 0.42, 0];
  const queue = [...items].sort((a, b) => PLACE_ORDER[a.kind] - PLACE_ORDER[b.kind]);

  // motion is settled before placement, because how far a signal travels is
  // exactly how much room its neighbours must leave it
  interface Motion {
    amp: number;
    cross: number;
    speed: number;
    phase: number;
    radial: number;
    rPhase: number;
    bound: number;
  }
  // a narrower composition also drifts less, the way the rest of the layout
  // scales down, which leaves more usable room on handsets
  const spread = Math.min(1, Math.max(0.55, box.width / 1280));
  const motion = new Map<string, Motion>();
  for (const item of queue) {
    // restrained by design: a signal glides a few pixels, it does not swim
    const amp = (3 + rng() * 4) * spread;
    const cross = 0.28 + rng() * 0.34;
    const radial = (1.5 + rng() * 2) * spread;
    motion.set(item.key, {
      amp,
      cross,
      speed: (Math.PI * 2) / (24 + rng() * 26),
      phase: rng() * Math.PI * 2,
      radial,
      rPhase: rng() * Math.PI * 2,
      // |along| + |across| + |out| bounds the glide loop, so two neighbours
      // can never touch however their phases happen to line up
      bound: amp * (1 + cross) + radial,
    });
  }

  for (const item of queue) {
    const halfW = item.w / 2 + MARGIN;
    const halfH = item.h / 2 + MARGIN;
    const wanted = item.kind === 'topic' ? 30 : item.kind === 'texture' ? 14 : 18;
    const m = motion.get(item.key)!;

    const options: { p: { x: number; y: number }; lane: Lane; t: number; score: number }[] = [];
    for (const relax of passes) {
      const minGap = wanted * relax;
      for (const lane of lanes) {
        const start = rng() * Math.PI * 2;
        for (let s = 0; s < samples; s++) {
          const t = start + (s / samples) * Math.PI * 2;
          const p = pointOn(lane, t);
          if (p.x - halfW < box.left || p.x + halfW > box.right) continue;
          if (p.y - halfH < box.top || p.y + halfH > box.bottom) continue;
          const a = box.avoid;
          if (a && p.x + halfW > a.x && p.x - halfW < a.x + a.w && p.y + halfH > a.y && p.y - halfH < a.y + a.h) {
            continue;
          }
          const room = slack(p.x, p.y, halfW, halfH, m.bound, placed);
          if (room < minGap || room < 0) continue;
          options.push({
            p,
            lane,
            t,
            score: Math.min(room, 90) * 0.45 + fieldNoise(p.x, p.y, box) * 26 + rng() * 12,
          });
        }
      }
      if (options.length > 0) break;
    }

    if (options.length === 0) continue; // no legal slot at this size — the signal sits out
    const choice = options.reduce((a, b) => (b.score > a.score ? b : a));

    placed.push({ x: choice.p.x, y: choice.p.y, halfW, halfH, bound: m.bound });
    const dir = tangentOn(choice.lane, choice.t);
    out.set(item.key, {
      key: item.key,
      kind: item.kind,
      x: (choice.p.x / box.width) * 100,
      y: (choice.p.y / box.height) * 100,
      dirX: dir.x,
      dirY: dir.y,
      amp: m.amp,
      cross: m.cross,
      speed: m.speed,
      phase: m.phase,
      radial: m.radial,
      rPhase: m.rPhase,
    });
  }

  return out;
}
