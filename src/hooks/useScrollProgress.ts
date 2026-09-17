import { useContext } from 'react';
import { ScrollContext } from '../system/ScrollContext';

/**
 * useScrollProgress
 *
 * Returns the global scroll progress (0–1) and the active section ID.
 * Consumers must be inside <ScrollContext.Provider>.
 */
export function useScrollProgress() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScrollProgress must be used inside ScrollContext.Provider');
  return ctx;
}
