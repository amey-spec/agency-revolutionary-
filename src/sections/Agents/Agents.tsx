import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';
import { TerminalLog } from '../../animation/TerminalLog';
import type { LogEntry } from '../../types/animation';

interface AgentDef {
  id: string;
  role: string;
  code: string;
  x: number;
  y: number;
  goal: string;
  steps: string[];
  logs: LogEntry[];
}

const AGENT_FLEET: AgentDef[] = [
  {
    id: 'sales',
    role: 'SALES AGENT',
    code: 'AGT-01',
    x: 160,
    y: 200,
    goal: 'INBOUND LEAD QUALIFICATION & ROUTING',
    steps: ['INTERCEPT WEBHOOK', 'ENRICH FIRMOGRAPHICS', 'REPUTATION SCORING', 'ASSIGN VIP CALENDAR'],
    logs: [
      { id: '1', timestamp: '14:20:01', message: 'Inbound payload intercepted: acme-corp.com ($40M ARR)', type: 'info' },
      { id: '2', timestamp: '14:20:02', message: 'Clearbit + Apollo enrichment complete (Tier-1 Enterprise)', type: 'system' },
      { id: '3', timestamp: '14:20:03', message: 'Score calculated: 96/100. Dispatched to Principal AE calendar', type: 'success' },
    ],
  },
  {
    id: 'support',
    role: 'SUPPORT AGENT',
    code: 'AGT-02',
    x: 400,
    y: 200,
    goal: 'AUTONOMOUS INCIDENT TRIAGE & REMEDIATION',
    steps: ['INGEST TICKET UUID', 'EMBEDDING RUNBOOK QUERY', 'TRACE ERROR STACK', 'DISPATCH CLOUD MITIGATION'],
    logs: [
      { id: '1', timestamp: '14:21:10', message: 'Ticket #8421: p99 latency spike detected on cluster-eu-west', type: 'warning' },
      { id: '2', timestamp: '14:21:11', message: 'Queried vector knowledge base: automated remediation plan loaded', type: 'info' },
      { id: '3', timestamp: '14:21:12', message: 'Provisioned 3 RDS read replicas via AWS API. Latency normalized to 16ms', type: 'success' },
    ],
  },
  {
    id: 'data',
    role: 'DATA AGENT',
    code: 'AGT-03',
    x: 640,
    y: 200,
    goal: 'CROSS-LEDGER RECONCILIATION & AUDIT',
    steps: ['POLL PAYMENT GATEWAYS', 'MATCH ERP GENERAL LEDGER', 'RECONCILE DISCREPANCIES', 'DISPATCH CFO DIGEST'],
    logs: [
      { id: '1', timestamp: '14:22:30', message: 'Batch transaction sync: 1,840 records ingested from Stripe API', type: 'info' },
      { id: '2', timestamp: '14:22:31', message: '100% matched against QuickBooks general ledger. Variance: $0.00', type: 'success' },
      { id: '3', timestamp: '14:22:32', message: 'Audit trail signed and delivered to Slack executive channel', type: 'system' },
    ],
  },
];

export const Agents: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('sales');
  const activeAgent = AGENT_FLEET.find((a) => a.id === selectedAgentId) || AGENT_FLEET[0];

  return (
    <>
      <SectionWrapper
        id="agents"
        systemPhase="STAGE 05 // ORCHESTRATED AGENT FLEET"
        title="AUTONOMOUS SPECIALIZED AGENTS."
        subtitle="The central AI core acts as master orchestrator. Individual autonomous agents operate across sales, support, and data reconciliation without human intervention."
        targetState="PROCESSING"
      >
        <div className="mt-4 max-w-5xl mx-auto select-none space-y-8">
          {/* Visual Orchestrator Tree Network */}
          <div className="relative rounded-2xl border border-border bg-[#070a0e] p-6 sm:p-8 shadow-2xl overflow-hidden min-h-[440px]">
            <svg viewBox="0 0 800 360" className="w-full h-auto overflow-visible select-none">
              {/* Orchestrator Master Node (at top center) */}
              <g transform="translate(400, 50)">
                <circle cx={0} cy={0} r={46} fill="none" stroke="var(--color-violet)" strokeWidth="1" opacity="0.3" style={{ animation: 'nodePulse 2s infinite' }} />
                <rect
                  x={-80}
                  y={-22}
                  width={160}
                  height={44}
                  rx={8}
                  fill="var(--color-charcoal)"
                  stroke="var(--color-violet)"
                  strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.3))' }}
                />
                <text x={0} y={-4} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                  ORCHESTRATOR CORE
                </text>
                <text x={0} y={12} fill="var(--color-violet)" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">
                  DISPATCH BUS // 3 POOLED
                </text>
              </g>

              {/* Connecting Branch Conduits to Agents */}
              {AGENT_FLEET.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <g key={`branch-${agent.id}`}>
                    <path
                      d={`M 400 72 C 400 130, ${agent.x} 130, ${agent.x} 175`}
                      fill="none"
                      stroke={isSelected ? 'var(--color-cyan)' : 'var(--color-border)'}
                      strokeWidth={isSelected ? 2.5 : 1}
                      opacity={isSelected ? 1 : 0.3}
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 8px var(--color-cyan))' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />

                    {/* Traveling Data Pulses along selected branch */}
                    {isSelected && (
                      <circle
                        cx={(400 + agent.x) / 2}
                        cy={125}
                        r="3.5"
                        fill="#ffffff"
                        style={{ filter: 'drop-shadow(0 0 6px var(--color-cyan))' }}
                      />
                    )}
                  </g>
                );
              })}

              {/* 3 Specialized Agent Nodes */}
              {AGENT_FLEET.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <g
                    key={agent.id}
                    transform={`translate(${agent.x}, ${agent.y})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedAgentId(agent.id)}
                    role="button"
                    tabIndex={0}
                    style={{
                      opacity: isSelected ? 1 : 0.45,
                      transition: 'opacity 0.3s ease',
                    }}
                    data-cursor="SELECT"
                  >
                    <rect
                      x={-75}
                      y={-25}
                      width={150}
                      height={50}
                      rx={8}
                      fill={isSelected ? 'var(--color-surface)' : 'var(--color-graphite)'}
                      stroke={isSelected ? 'var(--color-cyan)' : 'var(--color-border)'}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 16px rgba(0,212,232,0.25))' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    />
                    <text x={0} y={-6} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                      {agent.role}
                    </text>
                    <text x={0} y={12} fill={isSelected ? 'var(--color-cyan)' : 'var(--color-text-tertiary)'} fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">
                      [{agent.code}] // EXECUTING
                    </text>
                  </g>
                );
              })}

              {/* Converging Lower Conduits to Result Connector */}
              {AGENT_FLEET.map((agent) => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <path
                    key={`lower-${agent.id}`}
                    d={`M ${agent.x} 225 C ${agent.x} 280, 400 280, 400 330`}
                    fill="none"
                    stroke={isSelected ? 'var(--color-green)' : 'var(--color-border)'}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={isSelected ? 0.9 : 0.25}
                  />
                );
              })}

              {/* Lower Result Hub */}
              <circle cx={400} cy={330} r={6} fill="var(--color-green)" style={{ filter: 'drop-shadow(0 0 8px var(--color-green))' }} />
            </svg>
          </div>

          {/* Active Agent Inspector & Live Terminal Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-xl border border-border bg-charcoal">
            <div className="md:col-span-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-cyan-400 font-bold uppercase">{activeAgent.role}</span>
                <span className="text-green-400 font-bold">ONLINE ✓</span>
              </div>
              <div>
                <span className="text-text-tertiary text-[10px] uppercase block mb-1">TASK DIRECTIVE:</span>
                <span className="text-text-primary font-semibold">{activeAgent.goal}</span>
              </div>
              <div className="space-y-1 pt-2">
                <span className="text-text-tertiary text-[10px] uppercase block">PROTOCOL STEPS:</span>
                {activeAgent.steps.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-text-secondary text-[11px]">
                    <span className="text-cyan-400 font-bold">0{idx + 1}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-7">
              <TerminalLog
                title={`${activeAgent.id.toUpperCase()} // EVENT STREAM`}
                entries={activeAgent.logs}
                maxHeight="160px"
              />
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit: Agent output directly initiates the Automation Engine Runner */}
      <SystemTransition
        fromLabel="AGENT EXECUTION STREAM"
        toLabel="AUTOMATION ENGINE RUNNER"
        height={100}
        color="var(--color-green)"
      />
    </>
  );
};
