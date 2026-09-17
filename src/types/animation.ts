/**
 * Shared TypeScript types for the animation system.
 * Source: AGENCY_WEBSITE_SPEC.md §7 animation architecture
 */

import type { SystemState, SectionId } from '../constants/systemStates';

// ── Node types ─────────────────────────────────────────────────────────────────

export interface NodePosition {
  x: number; // percentage of SVG viewBox width (0–100)
  y: number; // percentage of SVG viewBox height (0–100)
}

export interface NodeMetadata {
  [key: string]: string | number;
}

export interface SystemNodeData {
  id: string;
  label: string;
  status: SystemState;
  position: NodePosition;
  connections: string[]; // ids of connected nodes
  metadata?: NodeMetadata;
  color?: string;
}

// ── Connection types ───────────────────────────────────────────────────────────

export interface ConnectionData {
  id: string;
  from: string; // node id
  to: string;   // node id
  active: boolean;
  bidirectional?: boolean;
}

// ── Signal types ───────────────────────────────────────────────────────────────

export interface SignalData {
  id: string;
  pathIds: string[]; // ordered list of connection IDs to traverse
  color?: string;
  speed?: number;
  loop?: boolean;
}

// ── Workflow types ─────────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  label: string;
  sublabel?: string;
  status: SystemState;
  step: number;
}

// ── Terminal log types ─────────────────────────────────────────────────────────

export type LogEntryType = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: LogEntryType;
}

// ── System Map types ───────────────────────────────────────────────────────────

export interface SystemMapNode {
  id: SectionId;
  label: string;
  children?: SectionId[];
  active?: boolean;
}

// ── Section transition types ───────────────────────────────────────────────────

export interface SectionHandoff {
  fromSection: SectionId;
  toSection: SectionId;
  signalPosition?: NodePosition; // where the signal exits the "from" section
}
