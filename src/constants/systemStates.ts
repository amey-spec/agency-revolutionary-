/**
 * System state definitions
 * Source: AGENCY_WEBSITE_SPEC.md §8
 *
 * The website has conceptual system states that drive all animations.
 * Every animation primitive responds to these states.
 */

export type SystemState =
  | 'IDLE'
  | 'INITIALIZING'
  | 'READY'
  | 'PROCESSING'
  | 'EXECUTING'
  | 'SUCCESS'
  | 'ERROR';

/**
 * Valid state transitions.
 * Prevents arbitrary state jumps that would break animation continuity.
 */
export const stateTransitions: Record<SystemState, SystemState[]> = {
  IDLE:         ['INITIALIZING'],
  INITIALIZING: ['READY', 'ERROR'],
  READY:        ['PROCESSING', 'IDLE'],
  PROCESSING:   ['EXECUTING', 'ERROR', 'READY'],
  EXECUTING:    ['SUCCESS', 'ERROR'],
  SUCCESS:      ['IDLE', 'READY'],
  ERROR:        ['PROCESSING', 'IDLE'],
};

/**
 * Human-readable labels for each state.
 * Used in TerminalLog, SystemStatus, and node metadata.
 */
export const stateLabels: Record<SystemState, string> = {
  IDLE:         'IDLE',
  INITIALIZING: 'INITIALIZING',
  READY:        'READY',
  PROCESSING:   'PROCESSING',
  EXECUTING:    'EXECUTING',
  SUCCESS:      'COMPLETE',
  ERROR:        'ERROR',
};

/**
 * Section IDs in narrative scroll order.
 * Used by SystemMap, ScrollProgress, and SectionWrapper.
 */
export const SECTIONS = [
  'hero',
  'problem',
  'transformation',
  'intelligence',
  'agents',
  'automation',
  'integrations',
  'case-studies',
  'technology',
  'observability',
  'convergence',
  'contact',
] as const;

export type SectionId = typeof SECTIONS[number];

/**
 * Section display names for System Map and navigation.
 */
export const sectionLabels: Record<SectionId, string> = {
  'hero':           'SYSTEM / 001',
  'problem':        'THE PROBLEM',
  'transformation': 'TRANSFORMATION',
  'intelligence':   'INTELLIGENCE',
  'agents':         'AI AGENTS',
  'automation':     'AUTOMATION ENGINE',
  'integrations':   'INTEGRATIONS',
  'case-studies':   'WORK',
  'technology':     'TECHNOLOGY',
  'observability':  'OBSERVABILITY',
  'convergence':    'CONVERGENCE',
  'contact':        'CONTACT',
};
