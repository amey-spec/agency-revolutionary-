// ── Experience state machine ────────────────────────────────────────────
export type ExperienceState =
  | 'idle'
  | 'awakening'
  | 'input'
  | 'processing'
  | 'decision'
  | 'executing'
  | 'complete';

export const STATE_LABEL: Record<ExperienceState, string> = {
  idle: 'STANDBY',
  awakening: 'AWAKENING',
  input: 'AWAITING INPUT',
  processing: 'PROCESSING',
  decision: 'DECISION REQUIRED',
  executing: 'EXECUTING',
  complete: 'RESULT',
};

// ── Topic (first choice) ────────────────────────────────────────────────
export type TopicId = 'leads' | 'support' | 'reporting' | 'scheduling' | 'other';

export interface TopicDef {
  id: TopicId;
  label: string;
  /** short line the system "writes down" after the choice */
  echo: string;
}

export const TOPICS: TopicDef[] = [
  { id: 'leads', label: 'LEADS', echo: 'Echo logged: LEADS — routing + follow-up.' },
  { id: 'support', label: 'SUPPORT', echo: 'Echo logged: SUPPORT — triage + resolution.' },
  { id: 'reporting', label: 'REPORTING', echo: 'Echo logged: REPORTING — summaries that write themselves.' },
  { id: 'scheduling', label: 'SCHEDULING', echo: 'Echo logged: SCHEDULING — the calendar answers itself.' },
  { id: 'other', label: 'SOMETHING ELSE', echo: 'Echo logged: UNLISTED — the system maps any repeated process.' },
];

// ── Workflow engine ─────────────────────────────────────────────────────
export type StepStatus = 'pending' | 'active' | 'done' | 'branch-taken' | 'skipped';

export interface FlowNode {
  id: string;
  kind: 'input' | 'ai' | 'data' | 'decision' | 'action' | 'output';
  label: string;
  sub: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  /** signal crosses this edge right-to-left (for the horizontal strip, unused) */
  delay?: number;
}

export interface InputCase {
  id: string;
  label: string;
  meta: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  branchOn?: string;
  branchLabel?: string;
  branchOk?: string;
  branchNo?: string;
  terminal: string;
  logs: string[];
}

export interface ScenarioDef {
  id: string;
  code: string;
  name: string;
  problem: string;
  needs: string;
  handles: string;
  returns: string;
  nodes: { id: string; label: string; kind: string }[];
  links: [string, string][];
  sequence: string[];
  terminal: string;
}

export const flowDuration = (steps: number) => steps * 620 + 1500;

export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
