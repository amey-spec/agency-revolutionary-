import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useExperience } from '../lib/ExperienceController';
import { TOPICS } from '../lib/typed';

const TOPIC_NAMES: Record<string, string> = {
  leads: 'YOUR LEADS',
  support: 'YOUR SUPPORT INBOX',
  reporting: 'YOUR REPORTING',
  scheduling: 'YOUR SCHEDULING',
  other: 'THE PROCESS YOU NAMED',
};

// ── additive console pieces (bar / stats / log / track) ─────────────────
const BUILD_ITEMS = ['AI AGENTS', 'WORKFLOW AUTOMATION', 'INTEGRATIONS', 'DATA PIPELINES'];

const HOW_STEPS = [
  { title: 'MAP YOUR PROCESS', sub: 'We document what really happens' },
  { title: 'DESIGN THE SYSTEM', sub: 'Agents, rules and hand-offs' },
  { title: 'CONNECT YOUR TOOLS', sub: 'CRM, email, billing, any API' },
  { title: 'SUPERVISED LAUNCH', sub: 'Your people stay in the loop' },
];

/** echoes read as log entries: the text up to the first colon is the actor */
function splitEcho(text: string): { head: string | null; rest: string } {
  const i = text.indexOf(':');
  if (i > 0 && i <= 32) return { head: text.slice(0, i + 1), rest: text.slice(i + 1).trim() };
  return { head: null, rest: text };
}

// ── rate limiting ───────────────────────────────────────────────────────
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 5 * 60_000;
const STORE_KEY = 'off-form-attempts';

function loadAttempts(): number[] {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter((t): t is number => typeof t === 'number' && now - t < WINDOW_MS);
  } catch {
    return [];
  }
}

function saveAttempts(attempts: number[]) {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(attempts));
  } catch {
    // storage unavailable (private mode) — in-memory only
  }
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** pragmatic email shape check — server-side validation is not available here */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Contact() {
  const { topic, labBuilt, echoes, contact, setContact, pushEcho, pulse } = useExperience();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number[]>(loadAttempts);
  const [now, setNow] = useState(() => Date.now());
  const tick = useRef<number | null>(null);

  // countdown tick while any attempt is inside the window
  useEffect(() => {
    if (!attempts.some((t) => Date.now() - t < WINDOW_MS)) return;
    if (tick.current === null) {
      tick.current = window.setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (tick.current !== null) {
        window.clearInterval(tick.current);
        tick.current = null;
      }
    };
  }, [attempts]);

  const liveAttempts = attempts.filter((t) => now - t < WINDOW_MS);
  const limited = liveAttempts.length >= MAX_ATTEMPTS;
  const retryIn = limited ? liveAttempts[0] + WINDOW_MS - now : 0;
  const remaining = Math.max(0, MAX_ATTEMPTS - liveAttempts.length);

  // the handoff is a mailto to the agency inbox with the visitor's own words
  // pre-filled, so the message actually reaches the business. Nothing is stored
  // on this site and there is no backend.
  const buildMailto = () => {
    const subject = `Automation request — ${contact.name.trim() || 'new enquiry'}`;
    const body = [
      `Name: ${contact.name.trim()}`,
      `Email: ${contact.email.trim()}`,
      '',
      'Process that keeps repeating:',
      contact.process.trim(),
    ].join('\n');
    return `mailto:hello@off.systems?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();

    if (limited) {
      setError(`RATE LIMIT // ${MAX_ATTEMPTS} ATTEMPTS PER 5 MIN — RETRY IN ${fmt(retryIn)}`);
      return;
    }

    if (!contact.name.trim()) {
      setError('NAME REQUIRED — THE SYSTEM ADDRESSES HUMANS BY NAME.');
      return;
    }
    if (!EMAIL_RE.test(contact.email.trim())) {
      setError('A VALID EMAIL IS REQUIRED — SO A HUMAN CAN REPLY.');
      return;
    }
    if (!contact.process.trim()) {
      setError('DESCRIBE THE PROCESS — EVEN ONE LINE IS ENOUGH.');
      return;
    }

    setError(null);
    const next = [...liveAttempts, Date.now()];
    setAttempts(next);
    saveAttempts(next); // pruned list written back here
    // open the visitor's mail client with the enquiry ready to send
    window.location.href = buildMailto();
    setSent(true);
    // the visit log records the request like every other chapter action
    const words = contact.process.trim().split(/\s+/);
    const label = words.slice(0, 5).join(' ');
    pushEcho(`Build requested: ${label.toLowerCase()}${words.length > 5 ? '…' : ''}`);
    pulse();
  };

  const reset = useCallback(() => {
    setSent(false);
    setError(null);
  }, []);

  const topicName = TOPIC_NAMES[topic ?? 'other'];
  const topicLabel = topic ? (TOPICS.find((t) => t.id === topic)?.label ?? 'NONE') : 'NONE';

  return (
    <section id="contact" className="final" aria-label="Build your system">
      <div className="world">
        <div className="final-head">
          <p className="mono-label">08 — TAKE IT WITH YOU</p>
          <h2 className="final-title">
            READY TO AUTOMATE <em>{topicName}?</em>
          </h2>
          <p className="final-lead">
            You saw the system route a lead, read a message, decide, act, and rebuild itself for seven industries.
            The real thing is built on your stack, supervised by your people.
          </p>
        </div>

        <div className="final-grid">
          {sent ? (
            <div className="final-form">
              <div className="form-bar">
                <span className="a">
                  <span className="sq" aria-hidden="true" />
                  START A PROJECT
                </span>
                <span className="b">EMAIL HANDOFF</span>
              </div>
              <div className="form-ok" role="status">
                <span className="big">✓ HANDED TO YOUR EMAIL</span>
                <p>
                  Thanks, {contact.name.trim().split(' ')[0]}. Your email app should have opened with your
                  enquiry ready — press send to{' '}
                  <a href={buildMailto()} style={{ color: 'var(--lime)' }}>
                    hello@off.systems
                  </a>{' '}
                  and a human takes over from there. Nothing is stored on this site.
                </p>
                <p className="form-note">
                  Nothing opened? <a href={buildMailto()} style={{ color: 'var(--lime)' }}>Open the email again</a>.
                </p>
              </div>
              {remaining > 0 ? (
                <button type="button" className="chip" onClick={reset}>
                  SUBMIT ANOTHER — {remaining} LEFT THIS WINDOW
                </button>
              ) : (
                <p className="form-limited" role="status">
                  RATE LIMIT // {MAX_ATTEMPTS} PER 5 MIN — NEXT SLOT IN {fmt(retryIn)}
                </p>
              )}
            </div>
          ) : (
            <form className="final-form" onSubmit={submit} noValidate>
              <div className="form-bar">
                <span className="a">
                  <span className="sq" aria-hidden="true" />
                  START A PROJECT
                </span>
                <span className="b">EMAIL HANDOFF</span>
              </div>
              <div className="field">
                <label htmlFor="f-name">NAME</label>
                <input
                  id="f-name"
                  value={contact.name}
                  onChange={(e) => setContact({ name: e.target.value })}
                  autoComplete="name"
                  disabled={limited}
                />
              </div>
              <div className="field">
                <label htmlFor="f-email">EMAIL</label>
                <input
                  id="f-email"
                  type="email"
                  inputMode="email"
                  value={contact.email}
                  onChange={(e) => setContact({ email: e.target.value })}
                  autoComplete="email"
                  disabled={limited}
                />
              </div>
              <div className="field">
                <label htmlFor="f-process">
                  THE PROCESS THAT KEEPS REPEATING
                  <span className="fcount">{contact.process.length} / 280</span>
                </label>
                <textarea
                  id="f-process"
                  value={contact.process}
                  onChange={(e) => setContact({ process: e.target.value })}
                  placeholder="e.g. every new lead needs a reply before 5pm…"
                  maxLength={280}
                  disabled={limited}
                />
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              {limited && (
                <p className="form-limited" role="status" aria-live="polite">
                  RATE LIMIT // {MAX_ATTEMPTS} ATTEMPTS PER 5 MIN — RETRY IN {fmt(retryIn)}
                </p>
              )}
              <button type="submit" className="system-btn solid" data-cursor="hot" disabled={limited}>
                {limited ? `LOCKED — ${fmt(retryIn)}` : 'SEND THIS TO THE TEAM →'}
              </button>
              <p className="form-note">
                SUBMIT OPENS YOUR EMAIL APP WITH YOUR ENQUIRY PRE-FILLED — NOTHING IS STORED ON THIS SITE.
                {' '}{MAX_ATTEMPTS} SUBMISSIONS PER 5 MIN · {remaining} REMAINING. SEE{' '}
                <a href="#privacy" style={{ color: 'var(--dim)' }}>PRIVACY</a>.
              </p>
            </form>
          )}

          <aside className="final-aside">
            <div className="aside-sumh">THIS VISIT, THE SYSTEM LOGGED</div>

            <div className="aside-stats">
              <div className="aside-stat">
                <span className="k">TOPIC</span>
                <b className={topic ? 'on' : ''}>{topicLabel}</b>
              </div>
              <div className="aside-stat">
                <span className="k">BUILD</span>
                <b className={labBuilt ? 'on' : ''}>{labBuilt ? 'REQUESTED' : 'NONE'}</b>
              </div>
              <div className="aside-stat">
                <span className="k">EVENTS</span>
                <b className="on">{echoes.length}</b>
              </div>
            </div>

            <div className="aside-echos aside-log" aria-live="polite">
              <span className="k">
                EVENT LOG
                <span className="live-tag">LIVE</span>
              </span>
              {echoes.length === 0 && (
                <span className="log-row">
                  <span className="m">·</span> quiet so far
                </span>
              )}
              {echoes.map((e, i) => {
                const { head, rest } = splitEcho(e.text);
                return (
                  <span key={e.id} className="log-row">
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="sq" aria-hidden="true" />
                    <span className="t">
                      {head ? (
                        <>
                          <b>{head}</b> {rest}
                        </>
                      ) : (
                        rest
                      )}
                    </span>
                  </span>
                );
              })}
            </div>

            <div className="aside-build">
              <div className="aside-sumh">WHAT WE BUILD</div>
              <div className="aside-chips">
                {BUILD_ITEMS.map((label) => (
                  <span key={label} className="chip">
                    <span className="sq" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="how-panel">
          <div className="form-bar">
            <span className="a">
              <span className="sq" aria-hidden="true" />
              HOW IT STARTS
            </span>
            <span className="b">4 STEPS · SUPERVISED</span>
          </div>
          <div className="how-track">
            {HOW_STEPS.map((step, i) => (
              <div className="how-step" key={step.title} data-step={i}>
                <span className="nd">{i + 1}</span>
                <h4>{step.title}</h4>
                <p>{step.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="final-foot">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="hud-mark" aria-hidden="true" /> OFF — AN AI AUTOMATION AGENCY
          </span>
          <span>THIS PAGE WAS THE DEMO. YOUR PROCESS IS NEXT.</span>
          <nav className="final-legal" aria-label="Legal and contact">
            <a href="#privacy" data-cursor="hot">PRIVACY</a>
            <a href="#terms" data-cursor="hot">TERMS</a>
            <a href="mailto:hello@off.systems" data-cursor="hot">hello@off.systems</a>
          </nav>
          <a href="#top" data-cursor="hot">↑ SYSTEM RESET</a>
        </footer>
      </div>
    </section>
  );
}
