import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { sameBoxes, useElementRect, useReducedMotion } from '../lib/geometry';
import { fieldCandidates, fieldTier, placeField } from '../lib/field';
import type { FieldCandidate, FieldSlot } from '../lib/field';
import { useExperience } from '../lib/ExperienceController';
import { TOPICS } from '../lib/typed';

type Phase = 'standby' | 'noticing' | 'typing' | 'listening' | 'locked';

const QUESTION = 'WHAT SHOULD WE AUTOMATE?';

/** how close the pointer must be before a signal answers (CSS px) */
const TOPIC_REACH = 62;
const AMBIENT_REACH = 44;

/** cursor influence tuning (CSS px, hero-local) */
// the gentle lean of the whole field toward the cursor — influence, not drag
const FIELD_LEAN = 7;
// how far the nearest signals may displace — a few pixels, per the approved feel
const CURSOR_PULL = 5;
// falloff reach around the pointer; smooth (no hard radius)
const CURSOR_REACH = 260;
// critically-damped-style smoothing per frame (frame-rate compensated at use)
// fast response, smooth movement — deliberately not a slow ease
const SMOOTH_IN = 0.32;
const SMOOTH_OUT = 0.12;

/**
 * The lock choreography is the one transition this component has to write: when
 * a topic is chosen, every other signal collapses toward the core along a vector
 * computed from its own position, so it cannot live in the stylesheet. The
 * properties differ per kind — a chosen topic also fills with the accent — while
 * every duration and curve comes from the motion system in the stylesheet.
 */
const LOCKED_PROPS: Record<FieldCandidate['kind'], string> = {
  topic: 'background-color 0.55s var(--ease-out), transform',
  ambient: 'transform',
  texture: 'transform',
};

export function Enter() {
  const { setState, chooseTopic, pushEcho, pulse } = useExperience();
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>('standby');
  const [typed, setTyped] = useState('');
  const [locked, setLocked] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const holdTimer = useRef<number | null>(null);

  const [heroRef, heroRect] = useElementRect<HTMLElement>();
  const questionRef = useRef<HTMLSpanElement>(null);
  const itemEls = useRef(new Map<string, HTMLElement | null>());
  const orbitEls = useRef(new Map<string, HTMLElement | null>());
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({});
  const [questionBox, setQuestionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // a webfont arriving after the first measure reflows every signal, so the
  // field measures once more when the faces are ready
  const [fontTick, setFontTick] = useState(0);

  const tier = heroRect.width > 0 ? fieldTier(heroRect.width) : 'm';
  const candidates = useMemo(() => fieldCandidates(tier), [tier]);

  // awakening sequence
  useEffect(() => {
    const reducedNow = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t1 = window.setTimeout(() => setPhase('noticing'), reducedNow ? 200 : 1400);
    const t2 = window.setTimeout(() => setPhase('typing'), reducedNow ? 300 : 2400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // typewriter
  useEffect(() => {
    if (phase !== 'typing') return;
    if (reduced) {
      setTyped(QUESTION);
      setPhase('listening');
      return;
    }
    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      setTyped(QUESTION.slice(0, i));
      if (i >= QUESTION.length) {
        window.clearInterval(interval);
        window.setTimeout(() => setPhase('listening'), 500);
      }
      // 33ms is two frames at 60Hz: every character lands on a frame boundary,
      // so the cadence is even instead of alternating 2 and 3 frames (42ms),
      // which read as a stutter in a sentence this large.
    }, 33);
    return () => window.clearInterval(interval);
  }, [phase, reduced]);

  // system state reporting. The intro narrates the HUD only while the intro is
  // on screen: once the visitor has scrolled on, the chapter they are actually
  // reading owns the readout (MANUAL raises the decision, THINK the choice).
  useEffect(() => {
    const hero = heroRef.current;
    if (hero && hero.getBoundingClientRect().bottom < window.innerHeight * 0.35) return;
    if (phase === 'standby') setState('idle');
    else if (phase === 'noticing' || phase === 'typing') setState('awakening');
    else setState('input');
  }, [phase, setState, heroRef]);

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) setFontTick((t) => t + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  // measured signal boxes + the real drawn extent of the question. Both are
  // needed before the field can be laid out, and both are read while the field
  // is still invisible (it only fades in once the question is finished).
  useLayoutEffect(() => {
    const next: Record<string, { w: number; h: number }> = {};
    for (const item of candidates) {
      const el = itemEls.current.get(item.key);
      if (el) next[item.key] = { w: el.offsetWidth, h: el.offsetHeight };
    }
    setSizes((prev) => (sameBoxes(prev, next) ? prev : next));

    // the field avoids the question: one union box keeps signals clear of the
    // whole statement block
    const hero = heroRef.current?.getBoundingClientRect();
    const parts = [questionRef.current]
      .map((el) => el?.getBoundingClientRect())
      .filter((r): r is DOMRect => !!r && r.width > 0);
    if (hero && parts.length > 0) {
      const left = Math.min(...parts.map((r) => r.left));
      const top = Math.min(...parts.map((r) => r.top));
      const right = Math.max(...parts.map((r) => r.right));
      const bottom = Math.max(...parts.map((r) => r.bottom));
      const box = { x: left - hero.left, y: top - hero.top, w: right - left, h: bottom - top };
      setQuestionBox((prev) =>
        prev &&
        Math.abs(prev.x - box.x) < 1 &&
        Math.abs(prev.y - box.y) < 1 &&
        Math.abs(prev.w - box.w) < 1 &&
        Math.abs(prev.h - box.h) < 1
          ? prev
          : box,
      );
    }
  }, [candidates, heroRef, phase, heroRect.width, heroRect.height, fontTick]);

  const slots = useMemo<FieldSlot[]>(() => {
    const w = heroRect.width;
    const h = heroRect.height;
    if (w === 0 || h === 0) return [];

    const measured = candidates
      .filter((c) => sizes[c.key])
      .map((c) => ({ key: c.key, w: sizes[c.key].w, h: sizes[c.key].h, kind: c.kind }));
    if (measured.length !== candidates.length) return [];

    // a deliberately simpler, tighter composition on handsets
    const pad = tier === 'xs' || tier === 's' ? 0.135 : 0.105;
    const placed = placeField(
      measured,
      {
        width: w,
        height: h,
        left: 10,
        right: w - 10,
        top: h * pad,
        bottom: h * (1 - pad),
        avoid: questionBox
          ? {
              x: questionBox.x - 30,
              y: questionBox.y - 22,
              w: questionBox.w + 60,
              h: questionBox.h + 44,
            }
          : null,
      },
      // deterministic: the same field greets everyone at the same size
      1337 + measured.length * 7,
    );

    return candidates.reduce<FieldSlot[]>((list, c) => {
      const slot = placed.get(c.key);
      if (slot) list.push({ ...c, ...slot });
      return list;
    }, []);
  }, [candidates, sizes, questionBox, heroRect.width, heroRect.height, tier]);

  // placement is looked up by key: every candidate is mounted (so it can be
  // measured), but only the ones that found a slot take part in the field
  const slotMap = useMemo(() => {
    const map = new Map<string, FieldSlot>();
    for (const s of slots) map.set(s.key, s);
    return map;
  }, [slots]);

  // ── the field's one motion loop ──────────────────────────────────────────
  // Ambient orbital drift (lane glide + radial breath, unchanged) and the
  // cursor influence are composed into a single transform per signal, written
  // once per frame from one rAF. Pointer position lives in refs — pointer
  // movement never re-renders, never touches React state.
  const influenceRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, lx: 0, ly: 0, last: 0 });
  const inHeroRef = useRef(false);

  useEffect(() => {
    if (reduced || slots.length === 0) return;
    const hero = heroRef.current;
    if (!hero) return;

    const cx = heroRect.width / 2;
    const cy = heroRect.height / 2;
    // signals lean a touch less on narrow screens, like every other layer
    const lean = Math.min(1, Math.max(0.55, heroRect.width / 1280));
    const reach = CURSOR_REACH * lean;
    const globalAmp = FIELD_LEAN * lean;
    const nodes = slots
      .map((s) => {
        const el = orbitEls.current.get(s.key);
        if (!el) return null;
        const px = (s.x / 100) * heroRect.width;
        const py = (s.y / 100) * heroRect.height;
        const d = Math.hypot(px - cx, py - cy) || 1;
        return {
          el,
          s,
          rx: (px - cx) / d,
          ry: (py - cy) / d,
        };
      })
      .filter((n): n is NonNullable<typeof n> => n !== null);

    let raf = 0;
    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(hero);

    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      if (!onScreen || document.hidden) return;
      const sec = t / 1000;
      const breath = 0.86 + 0.14 * Math.sin(sec * 0.11);

      // the pointer's influence, smoothed toward its target each frame
      // (frame-rate compensated so the feel matches at any refresh rate)
      const inf = influenceRef.current;
      const tx = inHeroRef.current ? inf.tx : 0;
      const ty = inHeroRef.current ? inf.ty : 0;
      const k = inHeroRef.current ? SMOOTH_IN : SMOOTH_OUT;
      const a = 1 - Math.pow(1 - k, (t - inf.last) / 16.7);
      inf.last = t;
      inf.x += (tx - inf.x) * a;
      inf.y += (ty - inf.y) * a;
      const settled = !inHeroRef.current && inf.x * inf.x + inf.y * inf.y < 0.0004;

      for (const n of nodes) {
        const { s } = n;
        // ambient orbital motion — the approved choreography, untouched
        const along = Math.sin(sec * s.speed + s.phase) * s.amp * breath;
        const across = Math.cos(sec * s.speed * 0.71 + s.phase * 1.6) * s.amp * s.cross;
        const out = Math.sin(sec * 0.16 + s.rPhase) * s.radial;
        let dx = s.dirX * along - s.dirY * across + n.rx * out;
        let dy = s.dirY * along + s.dirX * across + n.ry * out;

        // cursor influence layered on top: the field leans gently toward the
        // pointer, and nearby signals answer a few pixels more (smooth
        // falloff — 1 at the pointer, easing to 0 at the reach)
        if (!settled) {
          // scaled by how present the pointer is, so it fades in and out
          // without popping
          const infMag = Math.min(1, Math.hypot(inf.x, inf.y) * 1.5);
          dx += inf.x * globalAmp;
          dy += inf.y * globalAmp;
          const pdx = (s.x / 100) * heroRect.width - inf.lx;
          const pdy = (s.y / 100) * heroRect.height - inf.ly;
          const pd = Math.hypot(pdx, pdy);
          if (pd < reach && infMag > 0.01) {
            const fall = 1 - (pd / reach) * (pd / reach);
            const pull = fall * fall * CURSOR_PULL * lean * infMag;
            dx -= (pdx / (pd || 1)) * pull;
            dy -= (pdy / (pd || 1)) * pull;
          }
        }
        n.el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [slots, reduced, heroRef, heroRect.width, heroRect.height]);

  // the hero's page-space origin, cached — refreshed on scroll/resize/layout so
  // pointer coords can be made hero-local without per-frame rect reads
  const heroGeomRef = useRef({ left: 0, top: 0 });
  const [near, setNear] = useState<{ topic: string | null; ambient: string | null }>({
    topic: null,
    ambient: null,
  });
  const nearRef = useRef(near);
  useEffect(() => {
    nearRef.current = near;
  }, [near]);

  // cache the hero's page-space origin; refreshed on scroll/resize/layout so
  // the proximity test stays correct without per-frame rect reads
  useEffect(() => {
    const read = () => {
      const r = heroRef.current?.getBoundingClientRect();
      if (r) heroGeomRef.current = { left: r.left + window.scrollX, top: r.top + window.scrollY };
    };
    read();
    window.addEventListener('resize', read);
    window.addEventListener('scroll', read, { passive: true });
    return () => {
      window.removeEventListener('resize', read);
      window.removeEventListener('scroll', read);
    };
  }, [heroRef, heroRect.width, heroRect.height, phase]);

  // one pointermove listener → refs + influence targets. React renders only
  // when the hovered proximity class actually changes (max once per crossing).
  useEffect(() => {
    if (phase === 'locked' || reduced) return;

    const applyPointer = (x: number, y: number) => {
      // influence targets live in hero-local space (-1 … 1 from centre),
      // alongside the real pointer position for the proximity falloff
      const hw = heroRect.width / 2;
      const hh = heroRect.height / 2;
      const lx = x - heroGeomRef.current.left;
      const ly = y - heroGeomRef.current.top;
      const inf = influenceRef.current;
      inf.lx = lx;
      inf.ly = ly;
      if (hw > 0 && hh > 0) {
        inf.tx = Math.max(-1, Math.min(1, (lx - hw) / (hw * 0.5)));
        inf.ty = Math.max(-1, Math.min(1, (ly - hh) / (hh * 0.5)));
      }

      // proximity answer (topology only — colour styling stays in CSS)
      if (phase !== 'listening') return;
      const localX = lx;
      const localY = ly;
      let topic: { key: string; d: number } | null = null;
      let ambient: { key: string; d: number } | null = null;
      for (const s of slots) {
        if (s.kind === 'texture') continue;
        const dx = localX - (s.x / 100) * heroRect.width;
        const dy = localY - (s.y / 100) * heroRect.height;
        // vertical proximity counts a little heavier, as it always has
        const d = Math.hypot(dx, dy * 1.25);
        if (s.kind === 'topic') {
          if (!topic || d < topic.d) topic = { key: s.key, d };
        } else if (!ambient || d < ambient.d) {
          ambient = { key: s.key, d };
        }
      }
      const next = {
        topic: topic && topic.d < TOPIC_REACH ? topic.key : null,
        ambient: ambient && ambient.d < AMBIENT_REACH ? ambient.key : null,
      };
      const cur = nearRef.current;
      if (cur.topic !== next.topic || cur.ambient !== next.ambient) setNear(next);
    };

    const onMove = (e: PointerEvent) => applyPointer(e.clientX, e.clientY);
    const onEnter = () => {
      inHeroRef.current = true;
    };
    const onLeave = () => {
      inHeroRef.current = false;
    };
    const hero = heroRef.current;
    window.addEventListener('pointermove', onMove, { passive: true });
    if (hero) {
      hero.addEventListener('pointerenter', onEnter);
      hero.addEventListener('pointerleave', onLeave);
    } else {
      document.documentElement.addEventListener('pointerleave', onLeave);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (hero) {
        hero.removeEventListener('pointerenter', onEnter);
        hero.removeEventListener('pointerleave', onLeave);
      } else {
        document.documentElement.removeEventListener('pointerleave', onLeave);
      }
    };
  }, [phase, reduced, slots, heroRef, heroRect.width, heroRect.height]);

  const pick = useCallback(
    (slot: FieldSlot) => {
      if (phase === 'locked' || !slot.topic || !slot.text) return;
      setLocked(slot.text);
      setPhase('locked');
      setShowConfirm(false);
      pulse();
      chooseTopic(slot.topic);
      window.clearTimeout(holdTimer.current ?? 0);
      holdTimer.current = window.setTimeout(() => {
        setShowConfirm(true);
        const def = TOPICS.find((t) => t.id === slot.topic);
        pushEcho(def ? def.echo : 'Choice recorded.');
      }, 700);
    },
    [phase, pulse, pushEcho, chooseTopic],
  );

  const topicDef = TOPICS.find((t) => t.label === locked);

  const jumpToManual = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('manual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const seeded = phase === 'listening' || phase === 'locked';

  // on selection everything but the chosen signal clears out of the way (the
  // approved locked choreography — React-rendered, transition-carried)
  const signalTransform = (s: FieldSlot): string | undefined => {
    if (phase === 'locked') {
      if (locked === s.text) return 'translate(0, 0) scale(1)';
      return `translate(${(50 - s.x) * 3.4}vw, ${(50 - s.y) * 3.4}vh) scale(0.2)`;
    }
    return undefined;
  };

  // one signal: a selectable topic, an ambient word, or a patch of texture.
  // Every candidate renders on the first pass — a signal that hasn't found a
  // slot yet stays mounted but out of the composition, so its real box can be
  // measured before the field is laid out.
  const renderSignal = (c: FieldCandidate, s: FieldSlot | undefined, i: number) => {
    const delay = seeded ? `${i * 45}ms` : '0ms';
    const transform = s ? signalTransform(s) : undefined;
    // The component only owns the two things the stylesheet cannot know: the
    // per-signal stagger, and — once a topic is locked — the fly-out transform
    // computed from that signal's own position. Everything else (which
    // properties move, how long, and on which curve) belongs to the motion
    // system in the stylesheet. Overriding the shorthand here wholesale used to
    // mis-align every duration with its property: React's shorthand set the
    // property list while the sheet's two-value shorthand supplied the
    // durations, so colour and opacity swapped timings depending on the signal
    // kind.
    const flying = phase === 'locked' && transform !== undefined;
    const lockedTransition = flying
      ? `${LOCKED_PROPS[c.kind]} 0.75s var(--ease-out) ${delay}, opacity 0.55s var(--ease-out) ${delay}, color 0.3s var(--ease-out)`
      : undefined;

    if (c.kind === 'topic') {
      return (
        <button
          type="button"
          tabIndex={seeded && s ? 0 : -1}
          aria-pressed={locked === c.text}
          onClick={() => s && pick(s)}
          data-cursor="hot"
          ref={(el) => {
            itemEls.current.set(c.key, el);
          }}
          className={`topic-node ${locked === c.text ? 'selected' : ''} ${s && near.topic === c.key ? 'near' : ''}`}
          style={{ transform, transition: lockedTransition, '--seed': delay } as CSSProperties}
        >
          {c.text}
        </button>
      );
    }

    if (c.kind === 'ambient') {
      // ambient signals: readable, never clickable, never announced
      return (
        <span
          aria-hidden="true"
          ref={(el) => {
            itemEls.current.set(c.key, el);
          }}
          className={`signal-node ambient ${s && near.ambient === c.key ? 'near' : ''}`}
          style={{ transform, transition: lockedTransition, '--seed': delay } as CSSProperties}
        >
          {c.text}
        </span>
      );
    }

    return (
      <span
        aria-hidden="true"
        ref={(el) => {
          itemEls.current.set(c.key, el);
        }}
        className="signal-node texture"
        style={{ transform, transition: lockedTransition, '--seed': delay } as CSSProperties}
      >
        {c.lines?.map((line, li) => (
          <span key={li} className="texture-line" style={{ opacity: c.lineOpacity }}>
            {line}
          </span>
        ))}
      </span>
    );
  };

  return (
    <section ref={heroRef} className="enter" aria-label="Start the experience">
      <p className="enter-status" aria-live="polite">
        <span
          className="hud-blink"
          style={{ background: phase === 'standby' ? undefined : 'var(--lime)' }}
        />
        SYSTEM // {phase === 'standby' ? 'STANDBY' : phase === 'locked' ? 'LOCKED' : 'LISTENING'}
      </p>

      <p
        className="enter-hello"
        style={{ opacity: phase === 'standby' ? 0 : 1, transition: 'opacity var(--m-reveal) var(--ease-out)' }}
      >
        {phase === 'standby' ? '' : phase === 'noticing' ? 'SIGNAL DETECTED' : phase === 'locked' ? `EXPLORING: ${locked}` : 'VISITOR PRESENT'}
      </p>

      {/* the spine grows out of the question and settles: decelerating into
          place, rather than the linear crawl of a plain ease */}
      <div className="baseline" style={{ transform: `scaleY(${phase === 'standby' ? 0 : 1})`, transition: 'transform 1.6s var(--ease-out)' }} aria-hidden="true" />

      <h1 className="enter-title" aria-label={QUESTION}>
        <span ref={questionRef} aria-hidden="true">
          {typed}
          {phase === 'typing' || (phase === 'listening' && !locked) ? <span className="caret" /> : null}
        </span>
      </h1>

      {/* the field — selectable topics among ambient signals, all of it routed
          around the question rather than stacked beside it */}
      <div
        className={`signal-field ${seeded ? 'seeded' : ''}`}
        style={{ opacity: seeded ? 1 : 0, transition: 'opacity var(--m-scene) var(--ease-out)' }}
        aria-hidden={phase !== 'listening'}
      >
        {candidates.map((c, i) => {
          const s = slotMap.get(c.key);
          return (
            <span
              key={c.key}
              className={`field-anchor ${s ? '' : 'pending'}`}
              style={{ left: `${s ? s.x : 50}%`, top: `${s ? s.y : 50}%` }}
            >
              <span
                className="field-orbit"
                ref={(el) => {
                  orbitEls.current.set(c.key, el);
                }}
              >
                {renderSignal(c, s, i)}
              </span>
            </span>
          );
        })}
      </div>

      {showConfirm && topicDef && (
        <div className="enter-confirm">
          <p className="mono-label">{topicDef.echo}</p>
          <a href="#manual" className="system-btn solid" data-cursor="hot" onClick={jumpToManual}>
            SHOW ME ↓
          </a>
          <p className="mono-label confirm-note">THE REST OF THIS PAGE WILL REMEMBER</p>
        </div>
      )}

      <p className="enter-prompt" style={{ opacity: phase === 'listening' && !locked ? 1 : 0 }}>
        <span className="caret" /> SELECT A SIGNAL
      </p>
    </section>
  );
}
