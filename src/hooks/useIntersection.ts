import { useInView } from 'react-intersection-observer';

/**
 * useIntersection
 *
 * Thin wrapper around react-intersection-observer's useInView.
 * Returns [ref, inView] for attaching to a section or animation container.
 *
 * Used by:
 * - SectionWrapper (fires onEnter / onLeave state transitions)
 * - Animation primitives (pause when not visible)
 *
 * Source: AGENCY_WEBSITE_SPEC.md §38
 * "Animation systems must be paused or reduced when not needed."
 */
export function useIntersection(options?: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}) {
  return useInView({
    threshold: options?.threshold ?? 0.15,
    rootMargin: options?.rootMargin ?? '0px',
    triggerOnce: options?.triggerOnce ?? false,
  });
}
