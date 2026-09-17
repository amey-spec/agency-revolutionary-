import React, { createContext, useReducer, useContext, useCallback } from 'react';
import type { SystemState, SectionId } from '../constants/systemStates';
import { stateTransitions } from '../constants/systemStates';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SystemContextValue {
  state: SystemState;
  activeSection: SectionId | null;
  /** Attempt a state transition. Ignored if not a valid transition. */
  transition: (next: SystemState) => void;
  /** Update which section is currently in view */
  setActiveSection: (id: SectionId) => void;
}

type SystemAction =
  | { type: 'TRANSITION'; next: SystemState }
  | { type: 'SET_SECTION'; id: SectionId };

interface SystemReducerState {
  state: SystemState;
  activeSection: SectionId | null;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function systemReducer(
  current: SystemReducerState,
  action: SystemAction
): SystemReducerState {
  switch (action.type) {
    case 'TRANSITION': {
      const allowed = stateTransitions[current.state];
      if (!allowed.includes(action.next)) return current;
      return { ...current, state: action.next };
    }
    case 'SET_SECTION':
      return { ...current, activeSection: action.id };
    default:
      return current;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

export const SystemContext = createContext<SystemContextValue | null>(null);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [{ state, activeSection }, dispatch] = useReducer(systemReducer, {
    state: 'IDLE',
    activeSection: null,
  });

  const transition = useCallback((next: SystemState) => {
    dispatch({ type: 'TRANSITION', next });
  }, []);

  const setActiveSection = useCallback((id: SectionId) => {
    dispatch({ type: 'SET_SECTION', id });
  }, []);

  return (
    <SystemContext.Provider value={{ state, activeSection, transition, setActiveSection }}>
      {children}
    </SystemContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used inside <SystemProvider>');
  return ctx;
}
