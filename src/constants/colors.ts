/**
 * Design token: color system
 * Source: AGENCY_WEBSITE_SPEC.md §5
 *
 * Colors communicate system state — never use purely decoratively.
 */

export const colors = {
  // ── Base backgrounds ──────────────────────────────────────────────────────
  base: {
    black:    '#080b0f',   // near-black with subtle blue undertone
    deep:     '#0d1117',   // primary background
    charcoal: '#141920',   // secondary background / section alt
    graphite: '#1c2330',   // card / elevated surfaces
    surface:  '#222b38',   // hover / subtle lift
    border:   '#2a3441',   // dividers, node borders
    borderAlt:'#1e2a36',   // subtle borders
  },

  // ── Primary text ─────────────────────────────────────────────────────────
  text: {
    primary:   '#f0f2f5',  // warm white
    secondary: '#9aa5b4',  // muted gray
    tertiary:  '#5c6b7a',  // dim labels
    disabled:  '#3d4e5e',  // inactive
  },

  // ── System semantic colors ────────────────────────────────────────────────
  // These map directly to system state and visual meaning per the spec.
  system: {
    cyan:    '#00d4e8',  // data / information / networking
    cyanDim: '#00abbe',  // muted cyan for lines/connections
    violet:  '#8b5cf6',  // AI / intelligence / reasoning
    violetDim:'#6d3fd6', // muted violet
    green:   '#10b981',  // success / completion / healthy
    greenDim:'#0a8a5f',  // muted green
    amber:   '#f59e0b',  // processing / attention / waiting
    amberDim:'#c97d08',  // muted amber
    red:     '#ef4444',  // error / warning / failure
    redDim:  '#c13030',  // muted red
  },

  // ── Glow values (used in box-shadow / filter) ─────────────────────────────
  glow: {
    cyan:   '0 0 20px rgba(0, 212, 232, 0.25)',
    violet: '0 0 20px rgba(139, 92, 246, 0.25)',
    green:  '0 0 20px rgba(16, 185, 129, 0.25)',
    amber:  '0 0 20px rgba(245, 158, 11, 0.25)',
    red:    '0 0 20px rgba(239, 68, 68, 0.25)',
  },
} as const;

/**
 * State → color mapping
 * Used by animation primitives to derive color from system state.
 */
export const stateColors: Record<string, string> = {
  IDLE:         colors.system.cyanDim,
  INITIALIZING: colors.system.amber,
  READY:        colors.system.cyan,
  PROCESSING:   colors.system.violet,
  EXECUTING:    colors.system.cyan,
  SUCCESS:      colors.system.green,
  ERROR:        colors.system.red,
};
