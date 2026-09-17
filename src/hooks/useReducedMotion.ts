import { useState, useEffect } from 'react';

/**
 * useReducedMotion
 *
 * Returns true when the user has requested reduced motion.
 * Source: AGENCY_WEBSITE_SPEC.md §37
 *
 * All animation primitives must check this hook.
 * When true:
 * - Disable complex path animations
 * - Disable rAF loops
 * - Remove scroll-driven parallax
 * - Simplify transitions
 * - Preserve information and hierarchy
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
