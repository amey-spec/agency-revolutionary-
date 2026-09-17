import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { ProcessIndicator } from '../../animation/ProcessIndicator';
import { WorkflowNode } from '../../animation/WorkflowNode';

interface ProposedPipeline {
  title: string;
  steps: string[];
  latency: string;
}

const PARSING_STAGES = [
  'INPUT RECEIVED',
  'IDENTIFYING PROCESS',
  'ANALYZING WORKFLOW',
  'AI CLASSIFICATION',
  'AUTOMATED ROUTING',
  'POTENTIAL SYSTEM IDENTIFIED',
];

export const Contact: React.FC = () => {
  const [problemText, setProblemText] = useState('');
  const [parsingStep, setParsingStep] = useState<number>(-1);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [proposedPipeline, setProposedPipeline] = useState<ProposedPipeline | null>(null);
  const [email, setEmail] = useState('');
  const [isQueued, setIsQueued] = useState(false);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText.trim() || isSynthesizing) return;

    setIsSynthesizing(true);
    setProposedPipeline(null);
    setIsQueued(false);
    setParsingStep(0);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setParsingStep(current);

      if (current >= PARSING_STAGES.length) {
        clearInterval(interval);
        setIsSynthesizing(false);

        // Synthesize custom architecture pipeline
        const lower = problemText.toLowerCase();
        let plan: ProposedPipeline;

        if (lower.includes('lead') || lower.includes('sales') || lower.includes('email') || lower.includes('crm')) {
          plan = {
            title: 'INBOUND LEAD TRIAGE & CRM ENRICHMENT PIPELINE',
            steps: ['WEBHOOK PAYLOAD INGESTION', 'CLEARBIT/APOLLO DATA ENRICHMENT', 'REPUTATION & ICP SCORING', 'AUTOMATED CRM UPSERT', 'VIP CALENDAR INVITE DISPATCHED'],
            latency: '120ms',
          };
        } else if (lower.includes('ticket') || lower.includes('support') || lower.includes('customer')) {
          plan = {
            title: 'AUTONOMOUS TIER-1 SUPPORT RESOLUTION ENGINE',
            steps: ['INBOUND TICKET INTERCEPT', 'HYBRID VECTOR RUNBOOK SEARCH', 'LLM SAFETY & POLICY EVALUATION', 'AUTONOMOUS RESOLUTION DISPATCH', 'CONFIRMATION LOGGED'],
            latency: '180ms',
          };
        } else if (lower.includes('data') || lower.includes('sheet') || lower.includes('invoice') || lower.includes('reconcil')) {
          plan = {
            title: 'UNSTRUCTURED DOCUMENT PARSER & RECONCILIATION BUS',
            steps: ['DOCUMENT UPLOAD / IMAP LISTENER', 'MULTIMODAL SCHEMA EXTRACTION', 'CROSS-LEDGER VALIDATION', 'ATOMIC ERP COMMIT', 'SLACK NOTIFICATION EMITTED'],
            latency: '240ms',
          };
        } else {
          plan = {
            title: 'CUSTOM MULTI-TIER AUTOMATION PIPELINE',
            steps: ['EVENT DISPATCH INTERCEPT', 'SEMANTIC AGENT LOGIC EVALUATION', 'STATE MACHINE BRANCHING', 'DOWNSTREAM MICROSERVICE DISPATCH', 'AUDIT PERSISTED'],
            latency: '140ms',
          };
        }

        setProposedPipeline(plan);
      }
    }, 280);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsQueued(true);
  };

  return (
    <SectionWrapper
      id="contact"
      systemPhase="FINAL STAGE // INPUT NODE FOR NEXT CYCLE"
      title="SYSTEM READY. INPUT REQUIRED."
      subtitle="The website pipeline does not end with a generic contact form. The visitor's inquiry is the input node that triggers the next automation cycle. What should we automate for your team?"
      targetState="IDLE"
    >
      <div className="mt-4 max-w-3xl mx-auto select-none space-y-8">
        {/* Terminal Input Node Console */}
        <div className="relative p-6 sm:p-8 rounded-2xl border border-cyan-500/40 bg-[#070a0e] shadow-2xl overflow-hidden">
          {/* Top Telemetry Header */}
          <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
            <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              // INPUT TERMINAL NODE
            </span>
            <span className="demo-badge">FEED THE SYSTEM</span>
          </div>

          <h3 className="text-display-md text-text-primary mb-4 font-display">
            WHAT SHOULD WE AUTOMATE?
          </h3>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label htmlFor="problem-input" className="sr-only">
                Describe the repetitive work
              </label>
              <textarea
                id="problem-input"
                rows={4}
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="Describe the repetitive work your team is dealing with... (e.g. copying leads from emails into CRM, reconciling customer invoices against spreadsheets, responding to repeated support questions)"
                className="w-full p-4 rounded-xl bg-black border border-border text-text-primary placeholder:text-text-disabled font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors resize-none leading-relaxed"
                disabled={isSynthesizing}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="font-mono text-xs text-text-tertiary">
                {isSynthesizing ? 'PARSING INTENT...' : 'SUBMIT PROBLEM TO TRIGGER ARCHITECTURE SYNTHESIS'}
              </span>

              <button
                type="submit"
                disabled={isSynthesizing || !problemText.trim()}
                className="px-6 py-3 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: 'var(--color-cyan)',
                  color: '#000000',
                  boxShadow: '0 0 16px rgba(0, 212, 232, 0.35)',
                  opacity: !problemText.trim() || isSynthesizing ? 0.6 : 1,
                }}
                data-cursor="ANALYZE"
              >
                <span>{isSynthesizing ? '⟳ PARSING...' : 'SYNTHESIZE ARCHITECTURE →'}</span>
              </button>
            </div>
          </form>

          {/* Sequential Live Pipeline Parsing Steps */}
          {isSynthesizing && (
            <div className="mt-6 pt-6 border-t border-border space-y-1.5 animate-fadeIn">
              <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                // COMPILATION IN PROGRESS:
              </div>
              {PARSING_STAGES.map((stage, idx) => (
                <ProcessIndicator
                  key={stage}
                  label={stage}
                  status={idx < parsingStep ? 'SUCCESS' : idx === parsingStep ? 'PROCESSING' : 'IDLE'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Synthesized Architecture Blueprint */}
        {proposedPipeline && (
          <div className="p-6 sm:p-8 rounded-2xl border border-green-500/50 bg-charcoal space-y-6 shadow-2xl animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="font-mono text-xs text-green-400 font-bold uppercase tracking-widest block">
                  POTENTIAL SYSTEM IDENTIFIED
                </span>
                <h4 className="font-display font-bold text-lg text-text-primary uppercase mt-1">
                  {proposedPipeline.title}
                </h4>
              </div>
              <span className="demo-badge">PREVIEW // LATENCY: {proposedPipeline.latency}</span>
            </div>

            {/* Generated Steps */}
            <div className="space-y-2">
              <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider block">
                PROPOSED EXECUTION PIPELINE:
              </span>
              <div className="space-y-2">
                {proposedPipeline.steps.map((step, idx) => (
                  <WorkflowNode
                    key={idx}
                    step={idx + 1}
                    label={step}
                    status="SUCCESS"
                    isActive={false}
                    isCompleted={true}
                  />
                ))}
              </div>
            </div>

            {/* Final Project Start Deployment Action */}
            {!isQueued ? (
              <form onSubmit={handleProjectSubmit} className="pt-4 border-t border-border space-y-4">
                <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider block">
                  COMMISSION THIS SYSTEM FOR YOUR INFRASTRUCTURE:
                </span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter corporate email (e.g. founder@enterprise.com)"
                    className="flex-1 p-3.5 rounded-xl bg-black border border-border text-text-primary font-mono text-xs focus:outline-none focus:border-green-400"
                  />
                  <button
                    type="submit"
                    className="px-7 py-3.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-green-500 text-black hover:bg-green-400 transition-colors shadow-[0_0_18px_rgba(16,185,129,0.35)] cursor-pointer whitespace-nowrap"
                    data-cursor="DEPLOY"
                  >
                    START A PROJECT →
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-green-950/40 border border-green-800 text-green-400 font-mono text-xs flex items-center justify-between">
                <span>✓ DISPATCH CONFIRMED. OUR ARCHITECTS WILL CONTACT {email.toUpperCase()} WITHIN 4 BUSINESS HOURS.</span>
                <span className="font-bold">[QUEUED]</span>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionWrapper>
  );
};
