import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';

interface CaseStudySystem {
  id: string;
  designation: string;
  title: string;
  category: string;
  architecture: string;
  beforeWorkflow: string[];
  afterWorkflow: string[];
  status: 'OPERATIONAL' | 'DEPLOYED' | 'ACTIVE';
}

const DEPLOYED_SYSTEMS: CaseStudySystem[] = [
  {
    id: 'sys-024',
    designation: 'SYSTEM // 024',
    title: 'ENTERPRISE INBOUND PIPELINE',
    category: 'REVENUE OPERATIONS',
    architecture: 'Webhook Gateway → LLM Intent Extraction → CRM Enrichment → Calendar Dispatch',
    beforeWorkflow: [
      'Manual inbox monitoring by sales team',
      'Fragmented copy-pasting of prospect data into CRM',
      'Variable response lag causing cold drop-off',
    ],
    afterWorkflow: [
      'Zero-lag webhook ingestion within 200ms of form submit',
      'Automated enrichment of company firmographics via API',
      'Deterministic qualification scoring & instant calendar assignment',
    ],
    status: 'OPERATIONAL',
  },
  {
    id: 'sys-041',
    designation: 'SYSTEM // 041',
    title: 'AUTONOMOUS SUPPORT ESCALATION',
    category: 'CUSTOMER EXPERIENCE',
    architecture: 'Zendesk Webhook → Hybrid RAG Search → Safety Guardrail → Draft Generator',
    beforeWorkflow: [
      'Tier-1 agents answering repeated repetitive FAQs',
      'High queue backlog during surge periods',
      'Inconsistent resolution quality across shifts',
    ],
    afterWorkflow: [
      'Semantic classification of incoming user queries',
      'Retrieval-augmented runbook synthesis with safety guardrails',
      'Automatic resolution of tier-1 requests with seamless human handover',
    ],
    status: 'OPERATIONAL',
  },
  {
    id: 'sys-067',
    designation: 'SYSTEM // 067',
    title: 'CROSS-LEDGER RECONCILIATION',
    category: 'FINANCIAL DATA',
    architecture: 'Stripe Gateway → Bank Feed Poller → Ledger Matching Engine → CFO Digest',
    beforeWorkflow: [
      'Finance teams manually cross-referencing CSV exports',
      'End-of-month reconciliation bottleneck taking days',
      'Human transposition errors during manual balance audits',
    ],
    afterWorkflow: [
      'Hourly atomic synchronization of transactions against ERP records',
      'Fuzzy matching of disparate merchant account identifiers',
      'Automated discrepancy flagging and encrypted Slack alerts',
    ],
    status: 'OPERATIONAL',
  },
];

export const CaseStudies: React.FC = () => {
  const [activeSystemId, setActiveSystemId] = useState<string>('sys-024');
  const activeSystem = DEPLOYED_SYSTEMS.find((s) => s.id === activeSystemId) || DEPLOYED_SYSTEMS[0];

  return (
    <>
      <SectionWrapper
        id="case-studies"
        systemPhase="PIPELINE PHASE 08"
        title="DEPLOYED CLIENT ARCHITECTURES."
        subtitle="Systems engineered for durability and precision. Real architectural patterns deployed across revenue operations, customer experience, and financial reconciliation."
        targetState="READY"
      >
        <div className="mt-8 space-y-6">
          {/* System Selector Tab Bar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
            {DEPLOYED_SYSTEMS.map((sys) => {
              const isSelected = activeSystemId === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => setActiveSystemId(sys.id)}
                  className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-surface text-cyan-400 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,212,232,0.2)] font-bold'
                      : 'bg-charcoal text-text-tertiary border border-border hover:text-text-primary'
                  }`}
                  data-cursor="VIEW"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? 'var(--color-cyan)' : 'var(--color-text-tertiary)' }} />
                  <span>{sys.designation}</span>
                  <span className="opacity-60 hidden sm:inline">// {sys.category}</span>
                </button>
              );
            })}
          </div>

          {/* Active System Details Blueprint */}
          <div className="p-6 md:p-8 rounded-xl border border-border bg-charcoal space-y-6 shadow-2xl">
            {/* Header Telemetry */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="font-mono text-xs text-cyan-400 font-bold tracking-widest uppercase">
                  {activeSystem.designation} :: {activeSystem.category}
                </span>
                <h3 className="text-display-md text-text-primary mt-1">
                  {activeSystem.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="demo-badge">QUALITATIVE BLUEPRINT</span>
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-black border border-green-800 text-green-400 font-mono text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span>{activeSystem.status}</span>
                </div>
              </div>
            </div>

            {/* Architecture Flow Banner */}
            <div className="p-4 rounded-lg bg-black border border-border font-mono text-xs">
              <span className="text-text-tertiary uppercase block text-[10px] mb-1.5">
                SYSTEM PIPELINE TOPOLOGY:
              </span>
              <span className="text-cyan-300 font-semibold leading-relaxed">
                {activeSystem.architecture}
              </span>
            </div>

            {/* Before vs After Workflow Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before state */}
              <div className="p-5 rounded-lg border border-red-900/40 bg-red-950/10 space-y-3">
                <div className="flex items-center justify-between border-b border-red-900/30 pb-2 font-mono text-xs text-red-400 font-semibold uppercase tracking-wider">
                  <span>[ MANUAL WORKFLOW // BEFORE ]</span>
                  <span className="text-[10px] opacity-70">HIGH FRICTION</span>
                </div>
                <ul className="space-y-2 font-mono text-xs text-text-secondary">
                  {activeSystem.beforeWorkflow.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-red-400 shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* After state */}
              <div className="p-5 rounded-lg border border-green-900/40 bg-green-950/10 space-y-3">
                <div className="flex items-center justify-between border-b border-green-900/30 pb-2 font-mono text-xs text-green-400 font-semibold uppercase tracking-wider">
                  <span>[ AUTONOMOUS SYSTEM // AFTER ]</span>
                  <span className="text-[10px] opacity-70">ZERO TOUCH</span>
                </div>
                <ul className="space-y-2 font-mono text-xs text-text-secondary">
                  {activeSystem.afterWorkflow.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-green-400 shrink-0">✓</span>
                      <span className="text-text-primary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit Hand-off */}
      <SystemTransition
        fromLabel="CLIENT WORKFLOW RESULTS"
        toLabel="TECHNOLOGY STACK LAYERS"
        height={70}
      />
    </>
  );
};
