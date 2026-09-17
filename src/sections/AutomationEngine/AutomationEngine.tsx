import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { TerminalLog } from '../../animation/TerminalLog';
import { SystemTransition } from '../../animation/SystemTransition';
import type { LogEntry } from '../../types/animation';

interface EngineStep {
  step: number;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  logMessage: string;
}

const WORKFLOW_STEPS: EngineStep[] = [
  { step: 1, label: 'TRIGGER', sublabel: 'Inbound Webhook Payload', x: 80, y: 70, logMessage: 'TRIGGER INTERCEPTED: HTTP POST /v1/events/inbound' },
  { step: 2, label: 'AI REASONING', sublabel: 'LLM Intent & Semantic Entity Extraction', x: 240, y: 70, logMessage: 'AI REASONING: Intent classified as ORDER_EXPEDITE [99.4% confidence]' },
  { step: 3, label: 'DECISION', sublabel: 'Deterministic Policy Evaluation', x: 400, y: 70, logMessage: 'DECISION LOGIC: Business threshold match validated. Expedited route APPROVED' },
  { step: 4, label: 'ACTION', sublabel: 'Warehouse & ERP API Dispatch', x: 560, y: 70, logMessage: 'ACTION EXECUTED: Warehouse priority fulfillment queue updated via gRPC' },
  { step: 5, label: 'DATABASE', sublabel: 'Atomic ACID Commit & Audit Persistence', x: 720, y: 70, logMessage: 'DATABASE COMMITTED: Transaction locked & cryptographic audit trace saved' },
];

export const AutomationEngine: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '0', timestamp: '12:41:00', message: 'Engine standing by. Click RUN SYSTEM to dispatch payload.', type: 'system' },
  ]);

  const runSystem = () => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentStepIndex(0);

    setLogs([
      {
        id: String(Date.now()),
        timestamp: new Date().toLocaleTimeString(),
        message: 'EXECUTION SEQUENCE TRIGGERED: Injecting packet into engine...',
        type: 'info',
      },
    ]);

    let step = 0;
    const interval = setInterval(() => {
      if (step < WORKFLOW_STEPS.length) {
        const current = WORKFLOW_STEPS[step];
        setCurrentStepIndex(step);
        setLogs((prev) => [
          ...prev,
          {
            id: String(Date.now() + step),
            timestamp: new Date().toLocaleTimeString(),
            message: current.logMessage,
            type: step === WORKFLOW_STEPS.length - 1 ? 'success' : 'info',
          },
        ]);
        step++;
      } else {
        clearInterval(interval);
        setCurrentStepIndex(WORKFLOW_STEPS.length);
        setLogs((prev) => [
          ...prev,
          {
            id: String(Date.now() + 99),
            timestamp: new Date().toLocaleTimeString(),
            message: 'WORKFLOW COMPLETE: Zero latency bottlenecks. Signal dispatched downstream.',
            type: 'success',
          },
        ]);
        setIsRunning(false);
      }
    }, 750);
  };

  return (
    <>
      <SectionWrapper
        id="automation"
        systemPhase="STAGE 06 // DETERMINISTIC AUTOMATION ENGINE"
        title="THE AUTOMATION ENGINE IN EXECUTION."
        subtitle="Experience real-time execution. Click RUN SYSTEM to watch a live data packet travel from raw trigger down to verified persistent database commitment."
        targetState="EXECUTING"
      >
        <div className="mt-4 max-w-5xl mx-auto select-none space-y-8">
          {/* Main Interactive Execution Board */}
          <div className="relative rounded-2xl border border-cyan-500/30 bg-[#070a0e] p-6 sm:p-8 shadow-2xl overflow-hidden">
            {/* Header Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: isRunning ? 'var(--color-amber)' : currentStepIndex >= WORKFLOW_STEPS.length ? 'var(--color-green)' : 'var(--color-cyan)',
                    boxShadow: `0 0 10px ${isRunning ? 'var(--color-amber)' : 'var(--color-cyan)'}`,
                  }}
                />
                <span className="uppercase text-text-secondary tracking-wider font-semibold">
                  STATUS: {isRunning ? 'EXECUTING STEP ' + (currentStepIndex + 1) : currentStepIndex >= WORKFLOW_STEPS.length ? 'WORKFLOW COMPLETE ✓' : 'STANDBY'}
                </span>
              </div>

              <button
                onClick={runSystem}
                disabled={isRunning}
                className="px-6 py-2.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: isRunning ? 'var(--color-amber)' : 'var(--color-cyan)',
                  color: '#000000',
                  boxShadow: isRunning
                    ? '0 0 18px rgba(245, 158, 11, 0.4)'
                    : '0 0 18px rgba(0, 212, 232, 0.4)',
                  opacity: isRunning ? 0.85 : 1,
                }}
                data-cursor="RUN"
              >
                <span>{isRunning ? '⟳ EXECUTING...' : '⚡ RUN SYSTEM →'}</span>
              </button>
            </div>

            {/* Visual SVG Conduit with Living Packet Tracking */}
            <div className="overflow-x-auto py-2">
              <svg viewBox="0 0 800 140" className="w-full h-auto min-w-[680px] overflow-visible select-none">
                {/* Connecting Laser Guide Wire */}
                <line
                  x1="80"
                  y1="70"
                  x2="720"
                  y2="70"
                  stroke="var(--color-border)"
                  strokeWidth="2"
                />

                {/* Animated Illuminated Flow */}
                {isRunning && (
                  <line
                    x1="80"
                    y1="70"
                    x2={WORKFLOW_STEPS[Math.min(currentStepIndex, WORKFLOW_STEPS.length - 1)]?.x || 720}
                    y2="70"
                    stroke="var(--color-cyan)"
                    strokeWidth="2.5"
                    strokeDasharray="6 8"
                    style={{
                      animation: 'lineFlow 0.8s linear infinite',
                      filter: 'drop-shadow(0 0 6px var(--color-cyan))',
                    }}
                  />
                )}

                {/* 5 Workflow Nodes along the conduit */}
                {WORKFLOW_STEPS.map((step, idx) => {
                  const isNodeActive = currentStepIndex === idx;
                  const isNodeComplete = idx < currentStepIndex || currentStepIndex >= WORKFLOW_STEPS.length;

                  return (
                    <g key={step.step} transform={`translate(${step.x}, ${step.y})`}>
                      {/* Active Pulse Ring */}
                      {isNodeActive && (
                        <circle
                          cx={0}
                          cy={0}
                          r={34}
                          fill="none"
                          stroke="var(--color-amber)"
                          strokeWidth="1.5"
                          opacity="0.5"
                          style={{ animation: 'nodePulse 1.2s infinite' }}
                        />
                      )}

                      {/* Node Body */}
                      <circle
                        cx={0}
                        cy={0}
                        r={24}
                        fill={isNodeComplete ? 'var(--color-surface)' : isNodeActive ? 'var(--color-charcoal)' : 'var(--color-black)'}
                        stroke={isNodeComplete ? 'var(--color-green)' : isNodeActive ? 'var(--color-amber)' : 'var(--color-border)'}
                        strokeWidth={isNodeActive || isNodeComplete ? 2 : 1.2}
                        style={{
                          filter: isNodeComplete
                            ? 'drop-shadow(0 0 10px rgba(16,185,129,0.35))'
                            : isNodeActive
                            ? 'drop-shadow(0 0 12px rgba(245,158,11,0.4))'
                            : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      />

                      {/* Step Number or Checkmark */}
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill={isNodeComplete ? 'var(--color-green)' : isNodeActive ? 'var(--color-amber)' : 'var(--color-text-secondary)'}
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="var(--font-mono)"
                      >
                        {isNodeComplete ? '✓' : `0${step.step}`}
                      </text>

                      {/* Top Label */}
                      <text
                        x={0}
                        y={-34}
                        textAnchor="middle"
                        fill={isNodeComplete ? '#ffffff' : isNodeActive ? 'var(--color-amber)' : 'var(--color-text-secondary)'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="var(--font-mono)"
                        letterSpacing="0.08em"
                      >
                        {step.label}
                      </text>

                      {/* Bottom Status Text */}
                      <text
                        x={0}
                        y={42}
                        textAnchor="middle"
                        fill={isNodeComplete ? 'var(--color-green)' : isNodeActive ? 'var(--color-amber)' : 'var(--color-text-disabled)'}
                        fontSize="8"
                        fontFamily="var(--font-mono)"
                        letterSpacing="0.05em"
                      >
                        {isNodeComplete ? 'COMPLETE' : isNodeActive ? 'PROCESSING' : 'IDLE'}
                      </text>
                    </g>
                  );
                })}

                {/* Real Physical Data Pulse traveling on current step */}
                {isRunning && currentStepIndex >= 0 && currentStepIndex < WORKFLOW_STEPS.length && (
                  <circle
                    cx={WORKFLOW_STEPS[currentStepIndex].x}
                    cy={70}
                    r={6}
                    fill="#ffffff"
                    style={{
                      filter: 'drop-shadow(0 0 10px var(--color-amber))',
                    }}
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Synchronized Terminal Log Stream */}
          <div className="p-6 rounded-xl border border-border bg-charcoal">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 font-mono text-xs">
              <span className="text-text-tertiary uppercase tracking-wider font-semibold">
                // SYNCHRONIZED EXECUTION AUDIT TRACE
              </span>
              <span className="demo-badge">REAL-TIME RUNNER</span>
            </div>

            <TerminalLog
              title="AUTOMATION RUNTIME STREAM"
              entries={logs}
              maxHeight="180px"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit: Output signal feeds into Stage 07 Integrations */}
      <SystemTransition
        fromLabel="AUTOMATION RUNNER RESULT"
        toLabel="CONNECTED INTEGRATION PROTOCOLS"
        height={100}
        color="var(--color-cyan)"
      />
    </>
  );
};
