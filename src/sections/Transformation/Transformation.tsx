import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';

interface StagePair {
  step: number;
  manualLabel: string;
  manualDesc: string;
  manualLag: string;
  autoLabel: string;
  autoDesc: string;
  autoLag: string;
}

const TRANSFORMATION_STAGES: StagePair[] = [
  { step: 1, manualLabel: 'HUMAN DISPATCH', manualDesc: 'Manual inbox triage & copying', manualLag: '45 min', autoLabel: 'TRIGGER WEBHOOK', autoDesc: 'Event payload intercepted instantly', autoLag: '2 ms' },
  { step: 2, manualLabel: 'EMAIL PARSING', manualDesc: 'Copying text into clipboard', manualLag: '20 min', autoLabel: 'AI PARSING', autoDesc: 'LLM semantic entity extraction', autoLag: '28 ms' },
  { step: 3, manualLabel: 'SPREADSHEET', manualDesc: 'Pasting rows into Google Sheets', manualLag: '30 min', autoLabel: 'DECISION LOGIC', autoDesc: 'Deterministic policy rule routing', autoLag: '8 ms' },
  { step: 4, manualLabel: 'MANUAL DECISION', manualDesc: 'Waiting for manager approval', manualLag: '2.5 hrs', autoLabel: 'AUTONOMOUS ACTION', autoDesc: 'Downstream microservice dispatch', autoLag: '15 ms' },
  { step: 5, manualLabel: 'CRM INPUT', manualDesc: 'Typing fields into Salesforce', manualLag: '25 min', autoLabel: 'DATABASE UPSERT', autoDesc: 'Atomic transactional commit', autoLag: '6 ms' },
  { step: 6, manualLabel: 'MANUAL FOLLOW-UP', manualDesc: 'Typing boilerplate reply email', manualLag: '40 min', autoLabel: 'VERIFIED RESULT', autoDesc: 'Client notified & audit logged', autoLag: '23 ms' },
];

export const Transformation: React.FC = () => {
  const [isAutomated, setIsAutomated] = useState(true);

  return (
    <>
      <SectionWrapper
        id="transformation"
        systemPhase="STAGE 03 // WORKFLOW MORPHING"
        title="MANUAL TO AUTONOMOUS TRANSFORMATION."
        subtitle="Watch the mechanical morph from fragile human bottlenecks to deterministic high-frequency automation. Node by node, latency drops from hours to milliseconds."
        targetState="PROCESSING"
      >
        <div className="mt-4 max-w-5xl mx-auto select-none space-y-8">
          {/* State Morph Controller */}
          <div className="flex items-center justify-between p-2 rounded-full bg-black border border-border max-w-md mx-auto">
            <button
              onClick={() => setIsAutomated(false)}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-mono font-semibold tracking-wider transition-all uppercase ${
                !isAutomated
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              data-cursor="MANUAL"
            >
              [ 01 // MANUAL CHAOS ]
            </button>
            <button
              onClick={() => setIsAutomated(true)}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-mono font-semibold tracking-wider transition-all uppercase ${
                isAutomated
                  ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 shadow-[0_0_12px_rgba(0,212,232,0.25)]'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              data-cursor="AUTOMATE"
            >
              [ 02 // AUTOMATED PIPELINE ]
            </button>
          </div>

          {/* Morphing Spatial Pipeline Track */}
          <div className="relative p-6 sm:p-8 rounded-2xl border border-border bg-[#070a0e] shadow-2xl overflow-hidden">
            {/* Ambient Background Energy Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-cyan-400 to-transparent hidden md:block" />

            {/* Total System Latency Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-8 font-mono text-xs">
              <div className="flex items-center gap-3">
                <span className="text-text-tertiary uppercase">TOTAL ROUNDTRIP:</span>
                <span
                  className="font-bold text-base transition-colors"
                  style={{ color: isAutomated ? 'var(--color-green)' : 'var(--color-red)' }}
                >
                  {isAutomated ? '82 MILLISECONDS (REALTIME)' : '4.8 HOURS (HUMAN BOTTLENECK)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: isAutomated ? 'var(--color-cyan)' : 'var(--color-amber)' }}
                />
                <span className="text-text-secondary uppercase text-[11px]">
                  {isAutomated ? 'SELF-HEALING CONTINUOUS BUS' : 'MANUAL HUMAN HANDOFFS'}
                </span>
              </div>
            </div>

            {/* 6 In-Place Morphing Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {TRANSFORMATION_STAGES.map((stage) => {
                const label = isAutomated ? stage.autoLabel : stage.manualLabel;
                const desc = isAutomated ? stage.autoDesc : stage.manualDesc;
                const latency = isAutomated ? stage.autoLag : stage.manualLag;

                return (
                  <div
                    key={stage.step}
                    className="p-5 rounded-xl border transition-all duration-500 bg-charcoal/90 relative overflow-hidden"
                    style={{
                      borderColor: isAutomated ? 'rgba(0, 212, 232, 0.35)' : 'rgba(245, 158, 11, 0.25)',
                      boxShadow: isAutomated ? '0 0 15px rgba(0, 212, 232, 0.08)' : 'none',
                    }}
                  >
                    {/* Top step badge & latency */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                        style={{
                          background: isAutomated ? 'var(--color-cyan)' : 'var(--color-amber)',
                          color: '#000000',
                          borderColor: isAutomated ? 'var(--color-cyan)' : 'var(--color-amber)',
                        }}
                      >
                        0{stage.step}
                      </span>
                      <span
                        className="font-mono text-xs font-semibold uppercase"
                        style={{ color: isAutomated ? 'var(--color-green)' : 'var(--color-red)' }}
                      >
                        {latency}
                      </span>
                    </div>

                    {/* Morphing Headline */}
                    <h3
                      className="font-display font-bold text-base uppercase tracking-wide transition-all duration-300"
                      style={{ color: isAutomated ? '#ffffff' : 'var(--color-text-secondary)' }}
                    >
                      {label}
                    </h3>

                    {/* Morphing Subtitle */}
                    <p className="font-mono text-xs text-text-tertiary mt-1.5 leading-relaxed">
                      {desc}
                    </p>

                    {/* Bottom Status Dot */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-text-disabled">STAGE 0{stage.step}</span>
                      <span
                        className="uppercase font-semibold"
                        style={{ color: isAutomated ? 'var(--color-cyan)' : 'var(--color-amber)' }}
                      >
                        {isAutomated ? 'AUTONOMOUS ✓' : 'MANUAL LAG'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit: Stream delivers payload to Stage 04 AI Intelligence */}
      <SystemTransition
        fromLabel="TRANSFORMED PIPELINE BUS"
        toLabel="AI INTELLIGENCE REASONING CORE"
        height={100}
        color="var(--color-cyan)"
      />
    </>
  );
};
