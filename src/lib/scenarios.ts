// ── ACT console: the five inputs, one system ─────────────────────────────
// Everything the ACT console renders and "executes" derives from this table.
// Execution is simulated locally — no backend — but every visual state, log
// row, result and metadata value below is what the run actually reports.

export type StepState = 'idle' | 'running' | 'completed' | 'error';

export interface LogEvent {
  /** text before the em-dash detail */
  text: string;
  /** the dim tail after the dash, if any */
  detail?: string;
  /** simulated wall-clock cost, shown as e.g. "0.2 s" */
  dur: string;
  /** real cadence of the simulation for this step, in ms */
  ms: number;
}

export interface ResultDetail {
  label: string;
  value: string;
}

export interface Scenario {
  id: string;
  /** selector label */
  label: string;
  /** where the input came from (SOURCE metadata) */
  source: string;
  /** first result line — off-white */
  result1: string;
  /** second result line — lime accent */
  result2: string;
  /** the deliverable card: fixed title + unit line ("1 page") */
  output: { title: string; unit: string };
  /** the 7-step chain, left to right */
  steps: { label: string }[];
  /** one execution-log event per step (index-aligned) */
  logs: LogEvent[];
  /** detail panel revealed when the result is clicked */
  details: ResultDetail[];
  /** baseline simulated execution time, seconds (≈ sum of step ms) */
  baseDur: number;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'lead',
    label: 'NEW LEAD',
    source: 'Web form',
    result1: 'LEAD ROUTED',
    result2: 'OWNER NOTIFIED',
    output: { title: 'Meeting invitation', unit: '1 invite' },
    baseDur: 2.5,
    steps: [
      { label: 'REQUEST' },
      { label: 'AI SCOPE' },
      { label: 'CRM DATA' },
      { label: 'QUALIFY' },
      { label: 'ROUTE' },
      { label: 'NOTIFY OWNER' },
      { label: 'LOG' },
    ],
    logs: [
      { text: 'Request received', detail: 'web form · new lead', dur: '0.2 s', ms: 260 },
      { text: 'AI scope', detail: 'company + intent scan', dur: '0.3 s', ms: 340 },
      { text: 'CRM data', detail: 'account pulled · 14 fields', dur: '0.5 s', ms: 520 },
      { text: 'Qualify', detail: 'score 87 · hot path', dur: '0.5 s', ms: 520 },
      { text: 'Route', detail: 'owner assigned · sales team', dur: '0.3 s', ms: 360 },
      { text: 'Notify owner', detail: 'invite drafted', dur: '0.2 s', ms: 280 },
      { text: 'Log', detail: 'run saved to history', dur: '0.2 s', ms: 220 },
    ],
    details: [
      { label: 'OWNER', value: 'Sales Team' },
      { label: 'ACTION', value: 'Meeting invitation prepared' },
      { label: 'STATUS', value: 'Ready' },
      { label: 'SOURCE', value: 'Web form' },
    ],
  },
  {
    id: 'question',
    label: 'CUSTOMER QUESTION',
    source: 'Support inbox',
    result1: 'RESPONSE PREPARED',
    result2: 'OWNER NOTIFIED',
    output: { title: 'Customer reply', unit: '1 draft' },
    baseDur: 2.4,
    steps: [
      { label: 'REQUEST' },
      { label: 'AI SCOPE' },
      { label: 'SEARCH KNOWLEDGE' },
      { label: 'ANALYZE' },
      { label: 'COMPOSE' },
      { label: 'SEND RESPONSE' },
      { label: 'LOG' },
    ],
    logs: [
      { text: 'Request received', detail: 'support inbox · billing question', dur: '0.2 s', ms: 260 },
      { text: 'AI scope', detail: 'topic · account #2214', dur: '0.3 s', ms: 340 },
      { text: 'Search knowledge', detail: '3 KB articles matched', dur: '0.5 s', ms: 480 },
      { text: 'Analyze', detail: 'answer assembled from sources', dur: '0.5 s', ms: 480 },
      { text: 'Compose', detail: 'reply drafted · approved tone', dur: '0.3 s', ms: 360 },
      { text: 'Send response', detail: 'queued to outbox', dur: '0.2 s', ms: 280 },
      { text: 'Log', detail: 'run saved to history', dur: '0.2 s', ms: 220 },
    ],
    details: [
      { label: 'OWNER', value: 'Support Team' },
      { label: 'ACTION', value: 'Drafted reply awaiting one human yes' },
      { label: 'STATUS', value: 'Ready' },
      { label: 'SOURCE', value: 'Support inbox' },
    ],
  },
  {
    id: 'invoice',
    label: 'INVOICE',
    source: 'Accounts payable',
    result1: 'INVOICE REVIEWED',
    result2: 'OWNER NOTIFIED',
    output: { title: 'Invoice summary', unit: '1 approval' },
    baseDur: 2.5,
    steps: [
      { label: 'REQUEST' },
      { label: 'AI SCOPE' },
      { label: 'DATA PULL' },
      { label: 'VERIFY' },
      { label: 'ANALYZE' },
      { label: 'NOTIFY OWNER' },
      { label: 'LOG' },
    ],
    logs: [
      { text: 'Request received', detail: 'accounts payable · pdf invoice', dur: '0.2 s', ms: 260 },
      { text: 'AI scope', detail: 'vendor + amount located', dur: '0.3 s', ms: 340 },
      { text: 'Data pull', detail: 'ledger + PO records · 2 matches', dur: '0.5 s', ms: 520 },
      { text: 'Verify', detail: '€12,480 · net-30 · PO #2231', dur: '0.5 s', ms: 520 },
      { text: 'Analyze', detail: 'due before month end · no flags', dur: '0.4 s', ms: 400 },
      { text: 'Notify owner', detail: 'approval requested', dur: '0.2 s', ms: 280 },
      { text: 'Log', detail: 'run saved to history', dur: '0.2 s', ms: 220 },
    ],
    details: [
      { label: 'OWNER', value: 'Finance Team' },
      { label: 'ACTION', value: 'Approval requested before net-30 cut-off' },
      { label: 'STATUS', value: 'Ready' },
      { label: 'SOURCE', value: 'Accounts payable' },
    ],
  },
  {
    id: 'meeting',
    label: 'MEETING REQUEST',
    source: 'Email',
    result1: 'MEETING PROPOSED',
    result2: 'OWNER NOTIFIED',
    output: { title: 'Meeting invitation', unit: '1 slot' },
    baseDur: 2.4,
    steps: [
      { label: 'REQUEST' },
      { label: 'AI SCOPE' },
      { label: 'CALENDAR CHECK' },
      { label: 'ANALYZE' },
      { label: 'PROPOSE' },
      { label: 'NOTIFY OWNER' },
      { label: 'LOG' },
    ],
    logs: [
      { text: 'Request received', detail: 'email · intro call', dur: '0.2 s', ms: 260 },
      { text: 'AI scope', detail: 'intent · 30-min intro', dur: '0.3 s', ms: 340 },
      { text: 'Calendar check', detail: '5 calendars scanned', dur: '0.5 s', ms: 520 },
      { text: 'Analyze', detail: 'thu 15:00 free for all', dur: '0.4 s', ms: 440 },
      { text: 'Propose', detail: 'invitation drafted · room + link', dur: '0.3 s', ms: 360 },
      { text: 'Notify owner', detail: 'one-click confirm', dur: '0.2 s', ms: 280 },
      { text: 'Log', detail: 'run saved to history', dur: '0.2 s', ms: 220 },
    ],
    details: [
      { label: 'OWNER', value: 'Ops Team' },
      { label: 'ACTION', value: 'Meeting invitation prepared' },
      { label: 'STATUS', value: 'Ready' },
      { label: 'SOURCE', value: 'Email' },
    ],
  },
  {
    id: 'report',
    label: 'REPORT REQUEST',
    source: 'Ops channel',
    result1: 'REPORT DELIVERED',
    result2: 'OWNER NOTIFIED',
    output: { title: 'Weekly performance report', unit: '1 page' },
    baseDur: 2.8,
    steps: [
      { label: 'REQUEST' },
      { label: 'AI SCOPE' },
      { label: 'DATA PULL' },
      { label: 'ANALYZE' },
      { label: 'COMPOSE' },
      { label: 'NOTIFY OWNER' },
      { label: 'LOG' },
    ],
    logs: [
      { text: 'Request received', detail: 'ops channel, weekly report', dur: '0.3 s', ms: 300 },
      { text: 'AI scope', detail: 'last 7 days · 3 sources', dur: '0.3 s', ms: 340 },
      { text: 'Data pull', detail: 'CRM, billing, sheets · 1,284 rows', dur: '0.5 s', ms: 520 },
      { text: 'Analyze', detail: 'revenue +8.2% · 2 anomalies flagged', dur: '0.5 s', ms: 520 },
      { text: 'Compose', detail: 'one-page summary drafted', dur: '0.3 s', ms: 360 },
      { text: 'Notify owner', detail: 'report sent', dur: '0.2 s', ms: 280 },
      { text: 'Log', detail: 'run saved to history', dur: '0.2 s', ms: 220 },
    ],
    details: [
      { label: 'OWNER', value: 'Ops Team' },
      { label: 'ACTION', value: 'Weekly report delivered with commentary' },
      { label: 'STATUS', value: 'Ready' },
      { label: 'SOURCE', value: 'Ops channel' },
    ],
  },
];

/** Simulated "received" timestamp — a believable recent clock time. */
export function receivedTime(d = new Date()): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}

/** Simulated total duration: base + small deterministic jitter per run. */
export function execDuration(base: number, run: number): string {
  const jitter = ((run * 37) % 5) * 0.03; // 0 – 0.12 s, varies per replay
  return `${(base + jitter).toFixed(1)} s`;
}
