import { useRef, useEffect, useCallback } from 'react';
import { useIntersection } from './useIntersection';
import { useReducedMotion } from './useReducedMotion';

/**
 * useAnimationPause
 *
 * Manages a requestAnimationFrame loop that:
 * - Starts when the element enters the viewport
 * - Pauses when the element leaves the viewport
 * - Never runs when prefers-reduced-motion is set
 *
 * Source: AGENCY_WEBSITE_SPEC.md §38
 * "Animation loops running when off-screen" — must be avoided.
 *
 * Usage:
 * ```
 * const { ref, isActive } = useAnimationPause(tick);
 * <div ref={ref}>...</div>
 * ```
 *
 * @param tick - Function called on each animation frame. Receives elapsed ms.
 * @param enabled - Optional external enable flag (default: true)
 */
export function useAnimationPause(
  tick: (elapsed: number) => void,
  enabled: boolean = true
) {
  const reducedMotion = useReducedMotion();
  const [intersectionRef, inView] = useIntersection({ threshold: 0.05 });

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isActive = inView && enabled && !reducedMotion;

  const loop = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      tick(timestamp - startTimeRef.current);
      rafRef.current = requestAnimationFrame(loop);
    },
    [tick]
  );

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = null;
      rafRef.current = requestAnimationFrame(loop);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isActive, loop]);

  return { ref: intersectionRef, inView, isActive };
}
