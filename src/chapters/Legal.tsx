/**
 * LEGAL — the fine print that sits below the demo.
 *
 * DELIBERATELY A DRAFT. Every bracket is a placeholder for the business to fill
 * in, and the banner says so in plain language. Nothing here is legal advice and
 * nothing here invents a credential, a guarantee or a jurisdiction-specific rule.
 * Replace the placeholders and have a qualified lawyer review both documents
 * before this page is public.
 */
export function Legal() {
  return (
    <section className="chapter legal" aria-labelledby="legal-heading">
      <div className="world">
        <p className="mono-label">— LEGAL &amp; BUSINESS DETAILS</p>
        <h2 id="legal-heading" className="legal-h2">
          THE FINE PRINT
        </h2>

        <p className="legal-banner" role="note">
          <strong>DRAFT — NOT LEGAL ADVICE.</strong> These are starting-point summaries, not finished legal
          documents. Replace every <code>[BRACKETED]</code> placeholder and have a qualified lawyer review
          both for the jurisdiction you operate in before this page goes public.
        </p>

        {/* ── WHO YOU ARE TALKING TO ─────────────────────────────────────── */}
        <div className="legal-block legal-identity">
          <h3>Business details</h3>
          <dl>
            <div>
              <dt>Trading name</dt>
              <dd>OFF — AI automation agency</dd>
            </div>
            <div>
              <dt>Legal entity</dt>
              <dd>[REGISTERED COMPANY NAME]</dd>
            </div>
            <div>
              <dt>Registered address</dt>
              <dd>[STREET, CITY, COUNTRY]</dd>
            </div>
            <div>
              <dt>Registration / VAT</dt>
              <dd>[COMPANY NUMBER / VAT ID, IF APPLICABLE]</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>
                <a href="mailto:hello@off.systems">hello@off.systems</a>
              </dd>
            </div>
          </dl>
        </div>

        {/* ── PRIVACY ────────────────────────────────────────────────────── */}
        <article id="privacy" className="legal-block" aria-labelledby="privacy-heading">
          <h3 id="privacy-heading">Privacy policy</h3>
          <p className="legal-updated">Last updated: [DATE]</p>

          <h4>1. Who we are</h4>
          <p>
            This site is operated by [REGISTERED COMPANY NAME] ("we"). You can reach us at{' '}
            <a href="mailto:hello@off.systems">hello@off.systems</a>.
          </p>

          <h4>2. What we collect</h4>
          <p>
            The contact form asks for your name, your email address and a short description of the process
            you want to automate. Submitting the form does not send data to a server on this site — it opens
            your own email app with the enquiry pre-filled, and the message reaches us only if you choose to
            send it. We may also receive basic technical logs (such as IP address and pages viewed) from our
            hosting provider: [CONFIRM WHAT YOUR HOST LOGS].
          </p>

          <h4>3. How we use it</h4>
          <p>
            We use what you send us to reply to your enquiry and, if you engage us, to deliver and support
            the automation work. We do not sell your data.
          </p>

          <h4>4. Legal basis</h4>
          <p>
            [IF YOU SERVE PEOPLE IN THE EU/UK, STATE A LAWFUL BASIS FOR EACH USE — FOR EXAMPLE CONSENT OR
            LEGITIMATE INTERESTS. CONFIRM WITH COUNSEL.]
          </p>

          <h4>5. Sharing</h4>
          <p>
            We share data only with service providers needed to run the business — for example our email and
            hosting providers: [LIST PROVIDERS]. This site currently loads a font from Google Fonts, which
            means your browser contacts Google: [SELF-HOST THE FONT OR DISCLOSE THIS].
          </p>

          <h4>6. Retention</h4>
          <p>[HOW LONG YOU KEEP ENQUIRIES AND CLIENT RECORDS — E.G. X MONTHS.]</p>

          <h4>7. Cookies</h4>
          <p>
            This site sets no advertising or tracking cookies. [CONFIRM ANY HOST-LEVEL OR THIRD-PARTY
            COOKIES/STORAGE BEFORE LAUNCH.]
          </p>

          <h4>8. Your rights</h4>
          <p>
            [YOUR RIGHTS DEPEND ON WHERE YOU LIVE — FOR EXAMPLE ACCESS, CORRECTION, DELETION OR OBJECTION.
            HAVE COUNSEL SET THESE OUT FOR YOUR JURISDICTION.]
          </p>

          <h4>9. The on-page demos</h4>
          <p>
            The interactive workflows on this page are illustrative simulations with made-up data. They are
            not client work and they process nothing you type.
          </p>
        </article>

        {/* ── TERMS ──────────────────────────────────────────────────────── */}
        <article id="terms" className="legal-block" aria-labelledby="terms-heading">
          <h3 id="terms-heading">Terms of service</h3>
          <p className="legal-updated">Last updated: [DATE]</p>

          <h4>1. What we provide</h4>
          <p>
            We provide custom AI automation services: analysing business processes, recommending
            automations, designing and building them, integrating the relevant tools, and providing ongoing
            support where agreed. We are a services business — this website is not self-serve software and
            there is no account to create.
          </p>

          <h4>2. No guaranteed outcomes</h4>
          <p>
            We do not guarantee any particular business result — including revenue, lead volume, cost
            savings, headcount reduction or time saved. Any examples shown on this site are illustrative and
            are not a promise of what a given engagement will achieve.
          </p>

          <h4>3. Human oversight</h4>
          <p>
            Our automations are built to run with human supervision and defined hand-off points. They are not
            presented as fully autonomous, and they can require monitoring, maintenance and correction.
          </p>

          <h4>4. Scope and fees</h4>
          <p>
            Every engagement is scoped separately in writing before work begins: [DESCRIBE YOUR SCOPE,
            PRICING AND PAYMENT TERMS].
          </p>

          <h4>5. Third-party tools</h4>
          <p>
            Automations connect to third-party services you use. Their availability, pricing and terms are
            outside our control and can change.
          </p>

          <h4>6. Intellectual property</h4>
          <p>[WHO OWNS THE BUILT AUTOMATIONS AND ANY REUSABLE COMPONENTS — CONFIRM WITH COUNSEL.]</p>

          <h4>7. Liability</h4>
          <p>[LIMITATIONS OF LIABILITY FOR YOUR SERVICES — THIS SHOULD BE DRAFTED BY COUNSEL.]</p>

          <h4>8. Governing law</h4>
          <p>[WHICH COUNTRY'S LAW GOVERNS THESE TERMS — CONFIRM WITH COUNSEL.]</p>

          <h4>9. Contact</h4>
          <p>
            Questions about these terms: <a href="mailto:hello@off.systems">hello@off.systems</a>.
          </p>
        </article>
      </div>
    </section>
  );
}
