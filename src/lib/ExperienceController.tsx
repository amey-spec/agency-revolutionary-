import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/** stack order is layout order — inputs on the left column, outputs on the right */
const STACK_ORDER = ['crm', 'email', 'sheets', 'calendar', 'billing', 'chat', 'db', 'api'];
import type { ReactNode } from 'react';
import type { ExperienceState, TopicId } from './typed';

interface Echo {
  id: number;
  text: string;
}

/** the HUD keeps a short rolling log — enough to prove the visit is remembered */
const MAX_ECHOES = 4;

export interface ContactFields {
  name: string;
  email: string;
  process: string;
}

/** the STACK chapter's flow stages — the pipeline the stack feeds */
export type StackStage = 'input' | 'process' | 'decision' | 'action' | 'output';

interface ExperienceValue {
  state: ExperienceState;
  setState: (s: ExperienceState) => void;

  /**
   * The system master switch (the HUD's OFF / ON readout). Everything that can
   * *execute* reads it: the BUILD workbench disables its run control while the
   * system is off, so the switch is a real gate rather than a label.
   */
  power: boolean;
  togglePower: () => void;
  /** transient counter used by the HUD cursor to flash during activity */
  activity: number;
  pulse: () => void;

  topic: TopicId | null;
  chooseTopic: (t: TopicId) => void;

  caseId: string | null;
  caseDecision: string | null;
  lastRun: string | null;
  setCaseMemory: (memory: { caseId: string | null; decision: string | null; run: string | null }) => void;

  labBuilt: boolean;
  markLabBuilt: () => void;

  echoes: Echo[];
  pushEcho: (text: string) => void;

  contact: ContactFields;
  setContact: (patch: Partial<ContactFields>) => void;

  // ── STACK (chapter 07): one wiring, three views ────────────────────────
  /** the eight system inputs, in stack order — the source of truth */
  stackTools: string[];
  /** which inputs are wired in; the chips, the graph and the stats all read it */
  stackSelected: string[];
  toggleStackTool: (id: string) => void;
  /** the node being inspected ("core" is the AI hub itself) */
  stackNode: string | null;
  setStackNode: (id: string | null) => void;
  /** the flow stage under the visualization that is being focused */
  stackStage: StackStage;
  setStackStage: (s: StackStage) => void;
}

const ExperienceContext = createContext<ExperienceValue | null>(null);

export function ExperienceController({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ExperienceState>('idle');
  const [power, setPower] = useState(false);
  const [activity, setActivity] = useState(0);
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseDecision, setCaseDecision] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [labBuilt, setLabBuilt] = useState(false);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [contact, setContactState] = useState<ContactFields>({ name: '', email: '', process: '' });
  const [stackSelected, setStackSelected] = useState<string[]>([
    'crm',
    'email',
    'sheets',
    'calendar',
    'billing',
    'chat',
    'db',
    'api',
  ]);
  const [stackNode, setStackNode] = useState<string | null>(null);
  const [stackStage, setStackStage] = useState<StackStage>('input');
  const echoId = useRef(0);

  const pulse = useCallback(() => setActivity((n) => n + 1), []);

  // Both setters are plain updaters: the power flip must not be paired with a
  // mutation to `state` that only runs as a side effect of the first update.
  const togglePower = useCallback(() => {
    setPower((on) => !on);
    // cutting the power mid-run cancels the run instead of leaving it lit
    setState((s) => (s === 'executing' ? 'idle' : s));
  }, []);

  const chooseTopic = useCallback((t: TopicId) => setTopic(t), []);

  const setCaseMemory = useCallback(
    (memory: { caseId: string | null; decision: string | null; run: string | null }) => {
      if (memory.caseId !== undefined) setCaseId(memory.caseId);
      setCaseDecision(memory.decision);
      setLastRun(memory.run);
    },
    [],
  );

  const markLabBuilt = useCallback(() => setLabBuilt(true), []);

  // NOTE: the echo is built *outside* the updater so the updater stays pure.
  // Reading echoId.current inside it made React's dev double-invocation produce
  // two entries with the same id (duplicate keys) and let the log grow past its cap.
  const pushEcho = useCallback((text: string) => {
    echoId.current += 1;
    const echo: Echo = { id: echoId.current, text };
    setEchoes((list) => [...list.slice(-(MAX_ECHOES - 1)), echo]);
  }, []);

  const setContact = useCallback(
    (patch: Partial<ContactFields>) => setContactState((prev) => ({ ...prev, ...patch })),
    [],
  );

  // the stack keeps its order stable (the graph reads position, not membership),
  // so a toggle edits in place rather than appending to the end
  const toggleStackTool = useCallback(
    (id: string) =>
      setStackSelected((sel) =>
        sel.includes(id)
          ? sel.filter((s) => s !== id)
          : // re-selecting keeps the tool at its fixed layout position
            STACK_ORDER.filter((t) => sel.includes(t) || t === id),
      ),
    [],
  );

  const value = useMemo<ExperienceValue>(
    () => ({
      state,
      setState,
      power,
      togglePower,
      activity,
      pulse,
      topic,
      chooseTopic,
      caseId,
      caseDecision,
      lastRun,
      setCaseMemory,
      labBuilt,
      markLabBuilt,
      echoes,
      pushEcho,
      contact,
      setContact,
      stackTools: STACK_ORDER,
      stackSelected,
      toggleStackTool,
      stackNode,
      setStackNode,
      stackStage,
      setStackStage,
    }),
    [
      state,
      power,
      togglePower,
      activity,
      pulse,
      topic,
      chooseTopic,
      caseId,
      caseDecision,
      lastRun,
      setCaseMemory,
      labBuilt,
      markLabBuilt,
      echoes,
      pushEcho,
      contact,
      setContact,
      stackSelected,
      toggleStackTool,
      stackNode,
      setStackNode,
      stackStage,
      setStackStage,
    ],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceController>');
  return ctx;
}
