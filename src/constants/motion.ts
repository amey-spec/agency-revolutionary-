/**
 * Motion timing + easing constants
 * Source: AGENCY_WEBSITE_SPEC.md §40, §41
 *
 * All animation primitives must import from here.
 * Never hardcode timing in individual components.
 */

// ── Duration tiers (milliseconds) ────────────────────────────────────────────
export const duration = {
  /** 150–300ms: hover, focus, button press */
  micro: 0.18,
  /** 300–700ms: component reveal, state badge change */
  normal: 0.45,
  /** 700–1500ms: node activation, section element entrance */
  system: 1.0,
  /** 1000–2500ms: cross-section transition, workflow morph */
  cinematic: 1.8,
  /** Hero boot sequence total target */
  boot: 3.0,
} as const;

// ── Easing presets ────────────────────────────────────────────────────────────
// Spec §41: prefer natural easing — ease-out, controlled spring, custom bezier.
// Avoid bounce, elastic, overshoot. "Engineered, not cartoon-like."
export const ease = {
  /** Standard deceleration — enters fast, slows to rest */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Standard acceleration — starts slow, exits fast */
  in: [0.4, 0, 1, 1] as [number, number, number, number],
  /** Smooth in-out — used for morphing/transformation */
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Precise snap — fast deceleration for technical elements */
  snap: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  /** Light spring for system nodes floating */
  spring: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 } as const,
  /** Tighter spring for micro-interactions */
  springSnap: { type: 'spring', stiffness: 300, damping: 30 } as const,
} as const;

// ── Stagger presets ────────────────────────────────────────────────────────────
export const stagger = {
  /** Sequential list items (boot checklist, terminal log lines) */
  list: 0.12,
  /** Node activation in a network */
  node: 0.18,
  /** Section element cascade */
  section: 0.08,
  /** Fast cascade for data signal effects */
  signal: 0.04,
} as const;

// ── GSAP ease strings (used in GSAP timelines) ────────────────────────────────
export const gsapEase = {
  out:    'power3.out',
  in:     'power2.in',
  inOut:  'power2.inOut',
  snap:   'power4.out',
  linear: 'none',
} as const;

// ── Signal animation ───────────────────────────────────────────────────────────
export const signal = {
  /** px/ms — speed of a DataSignal dot along a path */
  speed: 0.18,
  /** ms — how long a node pulse lasts after signal arrives */
  pulseDuration: 600,
  /** ms — delay before next signal loop starts */
  loopDelay: 2400,
} as const;
