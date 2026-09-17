import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';

interface CapabilityDef {
  id: string;
  name: string;
  angle: number; // angle in degrees around the core
  description: string;
  telemetry: string;
}

const CAPABILITIES: CapabilityDef[] = [
  { id: 'understand', name: 'UNDERSTAND', angle: 0, description: 'Multimodal semantic tokenization & entity resolution', telemetry: 'Vector Dimension: 3072 // Cosine Similarity: 0.98' },
  { id: 'classify', name: 'CLASSIFY', angle: 60, description: 'Zero-shot taxonomy categorization across 120+ enterprise domains', telemetry: 'Confidence Score: 99.4% // Category: HIGH_INTENT' },
  { id: 'retrieve', name: 'RETRIEVE', angle: 120, description: 'Hybrid sparse-dense RAG retrieval from internal document indices', telemetry: 'HNSW Index Latency: 12ms // 8 Chunks Ingested' },
  { id: 'reason', name: 'REASON', angle: 180, description: 'Chain-of-thought graph exploration with self-reflection guardrails', telemetry: 'Depth: 5 hops // Logic Check: STRICT PASS' },
  { id: 'generate', name: 'GENERATE', angle: 240, description: 'Strictly validated schema synthesis with zero hallucinations', telemetry: 'Typing: ZOD ENFORCED // Output Tokens: 512' },
  { id: 'decide', name: 'DECIDE', angle: 300, description: 'Autonomous threshold evaluation and policy execution', telemetry: 'Policy Match: ALLOW // Escalation: 0' },
];

export const Intelligence: React.FC = () => {
  const [activeCapId, setActiveCapId] = useState<string>('reason');

  const activeCap = CAPABILITIES.find((c) => c.id === activeCapId) || CAPABILITIES[3];

  const centerX = 250;
  const centerY = 210;
  const radius = 145;

  return (
    <>
      <SectionWrapper
        id="intelligence"
        systemPhase="STAGE 04 // COGNITIVE REASONING CORE"
        title="AI INTELLIGENCE ARCHITECTURE."
        subtitle="Unstructured enterprise entropy enters. The cognitive core resolves meaning, retrieves context, verifies logic, and produces structured instructions."
        targetState="PROCESSING"
      >
        <div className="mt-4 max-w-5xl mx-auto select-none space-y-6">
          {/* Orbital AI Core Display */}
          <div className="relative rounded-2xl border border-violet-500/30 bg-[#070a0e] p-6 sm:p-10 shadow-2xl overflow-hidden min-h-[490px] flex items-center justify-center">
            {/* Ambient Background Aura */}
            <div
              className="absolute w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
              style={{ background: 'var(--color-violet)' }}
            />

            <svg viewBox="0 0 500 420" className="w-full h-auto max-w-[560px] overflow-visible select-none">
              {/* Orbital Ring Track */}
              <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
              <circle cx={centerX} cy={centerY} r={radius * 0.6} fill="none" stroke="var(--color-border-alt)" strokeWidth="1" opacity="0.3" />

              {/* Laser Radial Conduits from Capabilities to Core */}
              {CAPABILITIES.map((cap) => {
                const rad = (cap.angle * Math.PI) / 180;
                const nodeX = centerX + radius * Math.cos(rad);
                const nodeY = centerY + radius * Math.sin(rad);
                const isSelected = activeCapId === cap.id;

                return (
                  <g key={`conduit-${cap.id}`}>
                    {/* Beam Line */}
                    <line
                      x1={nodeX}
                      y1={nodeY}
                      x2={centerX}
                      y2={centerY}
                      stroke={isSelected ? 'var(--color-violet)' : 'var(--color-border)'}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : '2 4'}
                      opacity={isSelected ? 1 : 0.4}
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 8px var(--color-violet))' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />

                    {/* Traveling Energy Pulse along conduit */}
                    {isSelected && (
                      <circle
                        cx={(nodeX + centerX) / 2}
                        cy={(nodeY + centerY) / 2}
                        r="3.5"
                        fill="#ffffff"
                        style={{ filter: 'drop-shadow(0 0 6px var(--color-violet))' }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Central Pulsing AI Core */}
              <g transform={`translate(${centerX}, ${centerY})`}>
                <circle cx={0} cy={0} r={58} fill="none" stroke="var(--color-violet)" strokeWidth="1" opacity="0.3" style={{ animation: 'nodePulse 2.4s infinite' }} />
                <circle
                  cx={0}
                  cy={0}
                  r={46}
                  fill="var(--color-surface)"
                  stroke="var(--color-violet)"
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.45))' }}
                />
                <text x={0} y={-6} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                  [ AI CORE ]
                </text>
                <text x={0} y={10} fill="var(--color-violet)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)" letterSpacing="0.1em">
                  SYNAPSE // 70B
                </text>
              </g>

              {/* 6 Orbital Capability Nodes */}
              {CAPABILITIES.map((cap) => {
                const rad = (cap.angle * Math.PI) / 180;
                const nodeX = centerX + radius * Math.cos(rad);
                const nodeY = centerY + radius * Math.sin(rad);
                const isSelected = activeCapId === cap.id;

                return (
                  <g
                    key={cap.id}
                    transform={`translate(${nodeX}, ${nodeY})`}
                    className="cursor-pointer group"
                    onClick={() => setActiveCapId(cap.id)}
                    role="button"
                    tabIndex={0}
                    data-cursor="INSPECT"
                  >
                    <rect
                      x="-52"
                      y="-15"
                      width="104"
                      height="30"
                      rx="6"
                      fill={isSelected ? 'var(--color-charcoal)' : 'var(--color-black)'}
                      stroke={isSelected ? 'var(--color-violet)' : 'var(--color-border)'}
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-colors group-hover:stroke-violet-400"
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 12px rgba(139,92,246,0.35))' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : 'var(--color-text-secondary)'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                      letterSpacing="0.08em"
                      className="group-hover:fill-white transition-colors"
                    >
                      {cap.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Capability Inspector HUD */}
          <div className="p-6 rounded-xl border border-border bg-charcoal flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-mono text-xs">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-violet-400 font-bold uppercase tracking-wider">
                  ACTIVE ENGINE: {activeCap.name}
                </span>
              </div>
              <p className="text-text-secondary text-sm font-light">
                {activeCap.description}
              </p>
              <div className="text-[11px] text-text-tertiary pt-1">
                {activeCap.telemetry}
              </div>
            </div>

            <div className="shrink-0 px-4 py-2.5 rounded bg-black border border-border text-[11px] text-text-tertiary">
              <span className="text-green-400 font-bold">LATENCY: 18ms</span> // ZERO DRIFT
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit: Violet reasoning beam focused into the Agent Orchestrator */}
      <SystemTransition
        fromLabel="AI CORE BEAM // 70B"
        toLabel="AGENT ORCHESTRATOR FLEET"
        height={100}
        color="var(--color-violet)"
      />
    </>
  );
};
