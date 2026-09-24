import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExperienceController, useExperience } from './lib/ExperienceController';
import { STATE_LABEL } from './lib/typed';
import { useReducedMotion } from './lib/geometry';
import { Enter } from './chapters/Enter';
import { Manual } from './chapters/Manual';
import { Think } from './chapters/Think';
import { Flow } from './chapters/Flow';
import { Lab } from './chapters/Lab';
import { Scenarios } from './chapters/Scenarios';
import { Converge } from './chapters/Converge';
import { Contact } from './chapters/Contact';
import { Legal } from './chapters/Legal';

const CHAPTERS = [
  { id: 'top', label: 'ENTER', href: '#top' },
  { id: 'manual', label: 'MANUAL', href: '#manual' },
  { id: 'think', label: 'THINK', href: '#think' },
  { id: 'flow', label: 'ACT', href: '#flow' },
  { id: 'lab', label: 'BUILD', href: '#lab' },
  { id: 'scenarios', label: 'WORLDS', href: '#scenarios' },
  { id: 'converge', label: 'SYSTEM', href: '#converge' },
  { id: 'ecosystem', label: 'STACK', href: '#ecosystem' },
  { id: 'contact', label: 'TAKE IT', href: '#contact' },
];

export default function App() {
  return (
    <ExperienceController>
      <Shell />
    </ExperienceController>
  );
}

function Shell() {
  const { state, activity, power, togglePower } = useExperience();
  const reduced = useReducedMotion();
  const [active, setActive] = useState('top');
  const [scrollPct, setScrollPct] = useState(0);
  const [hot, setHot] = useState(false);
  const [busyFlash, setBusyFlash] = useState(false);
  const raf = useRef(0);

  // the custom cursor is written straight to the DOM — pointer movement never
  // re-renders. The dot tracks the pointer immediately; the ring eases after
  // it inside the shell's single cursor rAF loop.
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef({ x: -100, y: -100, rx: -100, ry: -100, raf: 0, last: 0 });
  const hotRef = useRef(false);

  // the ring chases the dot inside its own short-lived rAF loop (named
  // function expression so the loop can re-schedule itself)
  const stepRing = useCallback(function stepRing(t: number) {
    const c = cursorRef.current;
    c.raf = 0;
    // critically-damped-style chase: fast response, smooth movement. The
    // smoothing is frame-rate compensated — a fixed 0.32 per frame converges
    // roughly twice as fast on a 120Hz display, which is the one place the
    // cursor would visibly outrun the rest of the page. The loop stops as soon
    // as the remaining distance is imperceptible.
    const dt = c.last ? Math.min(t - c.last, 64) : 16.7;
    c.last = t;
    const ease = 1 - Math.pow(1 - 0.32, dt / 16.7);
    c.rx += (c.x - c.rx) * ease;
    c.ry += (c.y - c.ry) * ease;
    if (ringRef.current) ringRef.current.style.transform = `translate3d(${c.rx.toFixed(2)}px, ${c.ry.toFixed(2)}px, 0)`;
    if (Math.abs(c.x - c.rx) + Math.abs(c.y - c.ry) > 0.05) {
      c.raf = requestAnimationFrame(stepRing);
    } else {
      c.last = 0;
    }
  }, []);

  const trackCursor = useCallback((x: number, y: number) => {
    const c = cursorRef.current;
    c.x = x;
    c.y = y;
    if (dotRef.current) dotRef.current.style.transform = `translate(${x}px, ${y}px) scale(${hotRef.current ? 2.2 : 1})`;
    if (!c.raf) c.raf = requestAnimationFrame(stepRing);
  }, [stepRing]);

  // scroll as input: progress + active chapter (single passive listener, rAF-gated)
  useEffect(() => {
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        const doc = document.documentElement;
        const pct = doc.scrollTop / Math.max(doc.scrollHeight - doc.clientHeight, 1);
        setScrollPct(pct);

        let current = CHAPTERS[0].id;
        for (const c of CHAPTERS) {
          const el = document.getElementById(c.id);
          if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.45) current = c.id;
        }
        setActive(current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // cursor (desktop, motion allowed): one pointermove listener, refs only,
  // imperative transforms. React renders once per hot-zone crossing.
  useEffect(() => {
    if (reduced) return;
    const c = cursorRef.current;
    let raf2 = 0;
    const onMove = (e: PointerEvent) => {
      trackCursor(e.clientX, e.clientY);
      if (raf2) return;
      raf2 = requestAnimationFrame(() => {
        raf2 = 0;
        const t = e.target as HTMLElement | null;
        const next = !!t?.closest?.('[data-cursor="hot"], a, button');
        hotRef.current = next;
        setHot((prev) => (prev === next ? prev : next));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf2) cancelAnimationFrame(raf2);
      if (c.raf) {
        cancelAnimationFrame(c.raf);
        c.raf = 0;
      }
    };
  }, [reduced, trackCursor]);

  // activity flash
  useEffect(() => {
    if (activity === 0) return;
    setBusyFlash(true);
    const t = window.setTimeout(() => setBusyFlash(false), 600);
    return () => window.clearTimeout(t);
  }, [activity]);

  const stateClass =
    state === 'executing' ? 'busy' : state === 'complete' ? 'done' : state === 'idle' ? '' : 'on';
  const blinkClass = busyFlash ? 'busy' : stateClass;

  const jump = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      // the footer's SYSTEM RESET control is a real reset: cutting the power
      // (only if the visitor switched it on) returns every state-driven chapter
      // to its resting readout, then the page returns to the top — matching the
      // HUD master switch's own contract
      if (href === '#top' && power) togglePower();
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [power, togglePower],
  );

  const rail = useMemo(() => CHAPTERS.slice(1), []);

  return (
    <div className="shell" id="top">
      {/* HUD */}
      <header className="hud" role="banner">
        <div className="hud-left">
          {/* the master switch: a real control, so the readout is never a label */}
          <button
            type="button"
            className={`hud-power ${power ? 'on' : 'off'}`}
            onClick={togglePower}
            aria-pressed={power}
            title={power ? 'System on — click to cut power' : 'System off — click to power on'}
            data-cursor="hot"
          >
            <span className="hud-mark" aria-hidden="true" />
            <span>{power ? 'ON' : 'OFF'}</span>
          </button>
          <span className="hud-state" aria-live="polite">
            <span className={`hud-blink ${blinkClass}`} aria-hidden="true" />
            <span style={{ color: 'var(--faint)' }}>SYSTEM //</span> {STATE_LABEL[state]}
          </span>
        </div>
        <nav className="hud-index" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {i > 0 && <span className="idx-sep">/</span>}
              <a
                href={c.href}
                className={active === c.id ? 'active' : ''}
                onClick={(e) => jump(e, c.href)}
              >
                {c.label}
              </a>
            </span>
          ))}
        </nav>
      </header>

      {/* right rail */}
      <nav className="rail" aria-label="Chapter rail">
        {rail.map((c) => (
          <a key={c.id} href={c.href} className={`rail-item ${active === c.id ? 'active' : ''}`} onClick={(e) => jump(e, c.href)}>
            <span>{c.label}</span>
            <span className="tick" aria-hidden="true" />
          </a>
        ))}
      </nav>

      {/* scroll-as-input signal bar */}
      <div className="scrollbar" aria-hidden="true">
        <span className="scrollbar-fill" style={{ transform: `scaleX(${scrollPct})` }} />
      </div>

      {/* cursor */}
      {!reduced && (
        <>
          <div
            ref={dotRef}
            className={`cursor-dot ${hot ? 'hot' : ''}`}
            style={{ transform: 'translate(-100px, -100px)' }}
            aria-hidden="true"
          />
          <div
            ref={ringRef}
            className={`cursor-ring ${hot ? 'hot' : ''}`}
            style={{ transform: 'translate(-100px, -100px)' }}
            aria-hidden="true"
          />
        </>
      )}

      {/* chapters */}
      <main>
        <Enter />
        <Manual />
        <Think />
        <Flow />
        <Lab />
        <Scenarios />
        <Converge />
        <Contact />
        <Legal />
      </main>
    </div>
  );
}
