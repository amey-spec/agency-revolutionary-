import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { SectionId } from '../constants/systemStates';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScrollContextValue {
  /** Global scroll progress 0–1 (top of page to bottom) */
  scrollProgress: number;
  /** Scroll progress within the active section 0–1 */
  sectionProgress: number;
  /** Currently most-visible section */
  activeSection: SectionId | null;
  /** Register a section element with its id */
  registerSection: (id: SectionId, el: HTMLElement) => void;
  /** Unregister a section element */
  unregisterSection: (id: SectionId) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const ScrollContext = createContext<ScrollContextValue | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  // Map of sectionId → element
  const sectionsRef = useRef<Map<SectionId, HTMLElement>>(new Map());

  const registerSection = useCallback((id: SectionId, el: HTMLElement) => {
    sectionsRef.current.set(id, el);
  }, []);

  const unregisterSection = useCallback((id: SectionId) => {
    sectionsRef.current.delete(id);
  }, []);

  useEffect(() => {
    let rafId: number;

    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        setScrollProgress(Math.min(1, Math.max(0, progress)));

        // Determine active section (most-centered in viewport)
        let bestId: SectionId | null = null;
        let bestOverlap = 0;
        const vpTop = scrollTop;
        const vpBottom = scrollTop + window.innerHeight;

        sectionsRef.current.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const elTop = rect.top + scrollTop;
          const elBottom = elTop + rect.height;
          const overlap = Math.min(vpBottom, elBottom) - Math.max(vpTop, elTop);
          if (overlap > bestOverlap) {
            bestOverlap = overlap;
            bestId = id;
          }
        });

        if (bestId !== null) {
          setActiveSection(bestId);
          const el = sectionsRef.current.get(bestId);
          if (el) {
            const rect = el.getBoundingClientRect();
            const elTop = rect.top + scrollTop;
            const sp = Math.min(1, Math.max(0, (scrollTop - elTop) / el.offsetHeight));
            setSectionProgress(sp);
          }
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial values
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <ScrollContext.Provider
      value={{ scrollProgress, sectionProgress, activeSection, registerSection, unregisterSection }}
    >
      {children}
    </ScrollContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScroll must be used inside <ScrollProvider>');
  return ctx;
}
