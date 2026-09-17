import React, { useState, useEffect } from 'react';
import { SystemNode } from '../../animation/SystemNode';
import { ConnectionLine } from '../../animation/ConnectionLine';
import { DataSignal } from '../../animation/DataSignal';
import { useSystem } from '../../system/SystemContext';
import { useScroll } from '../../system/ScrollContext';
import { SystemTransition } from '../../animation/SystemTransition';

const BOOT_SEQUENCE = [
  { nodeId: 'ai', label: 'AI REASONING CORE', statusText: 'ONLINE' },
  { nodeId: 'llm', label: 'LLM ENGINE', statusText: 'ONLINE' },
  { nodeId: 'agents', label: 'AGENT FLEET', statusText: 'ORCHESTRATED' },
  { nodeId: 'data', label: 'DATA PIPELINE', statusText: 'INDEXED' },
  { nodeId: 'api', label: 'API GATEWAY', statusText: 'LINKED' },
  { nodeId: 'automation', label: 'AUTOMATION CORE', statusText: 'ENGAGED' },
  { nodeId: 'db', label: 'TRANSACTIONAL DB', statusText: 'SYNCHRONIZED' },
  { nodeId: 'result', label: 'EXECUTION TARGET', statusText: 'READY' },
];

interface NodeDef {
  id: string;
  label: string;
  x: number;
  y: number;
  metadata: Record<string, string | number>;
}

const HERO_NODES: NodeDef[] = [
  { id: 'ai', label: 'AI CORE', x: 400, y: 70, metadata: { role: 'Reasoning', status: 'ACTIVE', model: 'Synapse-70B' } },
  { id: 'llm', label: 'LLM ENGINE', x: 230, y: 130, metadata: { context: '128k', latency: '24ms' } },
  { id: 'agents', label: 'AGENTS', x: 570, y: 130, metadata: { pool: 'Orchestrated', active: '12' } },
  { id: 'data', label: 'DATA LAYER', x: 160, y: 240, metadata: { throughput: '4.2GB/s', health: '100%' } },
  { id: 'api', label: 'API GATEWAY', x: 330, y: 230, metadata: { endpoints: '84', security: 'mTLS' } },
  { id: 'automation', label: 'AUTOMATION', x: 470, y: 230, metadata: { state_machines: '142', retries: '0' } },
  { id: 'crm', label: 'CRM / OPS', x: 640, y: 240, metadata: { sync: 'REALTIME', status: 'LINKED' } },
  { id: 'db', label: 'DATABASE', x: 260, y: 350, metadata: { persistence: 'ACID', replication: 'SYNC' } },
  { id: 'team', label: 'TEAM WORKFLOW', x: 540, y: 350, metadata: { human_loop: 'STANDBY', escalations: '0' } },
  { id: 'result', label: 'RESULT // EXECUTION', x: 400, y: 440, metadata: { status: 'OPTIMAL', latency: '82ms' } },
];

const HERO_CONNECTIONS = [
  { from: 'ai', to: 'llm' },
  { from: 'ai', to: 'agents' },
  { from: 'llm', to: 'data' },
  { from: 'ai', to: 'api' },
  { from: 'agents', to: 'automation' },
  { from: 'agents', to: 'crm' },
  { from: 'data', to: 'db' },
  { from: 'api', to: 'db' },
  { from: 'automation', to: 'team' },
  { from: 'crm', to: 'team' },
  { from: 'db', to: 'result' },
  { from: 'team', to: 'result' },
];

export const Hero: React.FC = () => {
  const { transition } = useSystem();
  const { registerSection, unregisterSection } = useScroll();
  const [activeStep, setActiveStep] = useState(0);
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [inspectedNodeId, setInspectedNodeId] = useState<string>('ai');

  const sectionRef = React.useRef<HTMLElement>(null);
  useEffect(() => {
    if (sectionRef.current) registerSection('hero', sectionRef.current);
    return () => unregisterSection('hero');
  }, [registerSection, unregisterSection]);

  // Progressive System Boot: Illuminates the nodes step-by-step
  useEffect(() => {
    if (activeStep < BOOT_SEQUENCE.length) {
      const timer = setTimeout(() => {
        setActiveStep((prev) => prev + 1);
      }, 350);
      return () => clearTimeout(timer);
    } else if (!isSystemOnline) {
      const timer = setTimeout(() => {
        setIsSystemOnline(true);
        transition('READY');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeStep, isSystemOnline, transition]);

  // Arterial signal coordinates flowing through the assembled system
  const mainSignalPath = [
    { x: 400, y: 70 },  // AI Core
    { x: 230, y: 130 }, // LLM Engine
    { x: 330, y: 230 }, // API Gateway
    { x: 470, y: 230 }, // Automation
    { x: 400, y: 440 }, // Result Output (Delivering down to Problem stage)
  ];

  // Which nodes are unlocked based on the boot progress
  const unlockedNodeIds = new Set(
    BOOT_SEQUENCE.slice(0, activeStep).map((s) => s.nodeId).concat(['crm', 'team'])
  );

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-[100dvh] flex flex-col justify-between pt-20 pb-0 overflow-hidden"
      aria-label="System Initialization and Hero Architecture"
    >
      {/* Background ambient radial grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(0, 212, 232, 0.18) 0%, transparent 65%), linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
        }}
      />

      <div className="container relative z-10 flex flex-col flex-1">
        {/* Top Telemetry & Main System Headline */}
        <div className="pt-6 md:pt-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-text-tertiary px-3.5 py-1 rounded-full border border-border bg-black/60 backdrop-blur-sm mb-4">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: isSystemOnline ? 'var(--color-green)' : 'var(--color-amber)',
                boxShadow: `0 0 8px ${isSystemOnline ? 'var(--color-green)' : 'var(--color-amber)'}`,
              }}
            />
            <span className={isSystemOnline ? 'text-green-400 font-bold' : 'text-amber-400'}>
              {isSystemOnline ? 'SYSTEM ONLINE // 001' : 'SYSTEM INITIALIZING...'}
            </span>
            <span className="text-text-disabled">//</span>
            <span className="text-cyan-400">INPUT → EXECUTION</span>
          </div>

          <h1 className="text-display-xl tracking-tight text-text-primary mb-4 font-display">
            THE WEBSITE IS <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#c7d2fe] to-[#38bdf8]">
              THE AUTOMATION SYSTEM.
            </span>
          </h1>

          <p className="text-body-lg text-text-secondary max-w-2xl mx-auto font-light leading-relaxed">
            Move through an orchestrated machine of autonomous AI agents, persistent workflow engines,
            and real-time integrations that eliminate repetitive work at scale.
          </p>
        </div>

        {/* Evolving Living System Network Graph */}
        <div className="relative flex-1 mt-4 min-h-[500px] flex items-center justify-center">
          <svg
            viewBox="0 0 800 500"
            className="w-full h-auto max-h-[520px] overflow-visible select-none"
          >
            {/* Visual Conduits */}
            {HERO_CONNECTIONS.map((c, i) => {
              const n1 = HERO_NODES.find((n) => n.id === c.from);
              const n2 = HERO_NODES.find((n) => n.id === c.to);
              if (!n1 || !n2) return null;

              const isUnlocked = unlockedNodeIds.has(n1.id) && unlockedNodeIds.has(n2.id);
              const isInspected = inspectedNodeId === n1.id || inspectedNodeId === n2.id;

              return (
                <ConnectionLine
                  key={i}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  curve="smooth"
                  active={isUnlocked}
                  pulse={isInspected && isSystemOnline}
                  color={
                    !isUnlocked
                      ? 'var(--color-border)'
                      : isInspected
                      ? 'var(--color-cyan)'
                      : 'rgba(0, 212, 232, 0.4)'
                  }
                  strokeWidth={isInspected ? 2 : 1.2}
                />
              );
            })}

            {/* Continuous Traveling Arterial Signal */}
            {isSystemOnline && (
              <DataSignal
                points={mainSignalPath}
                duration={3400}
                color="var(--color-cyan)"
                size={5}
                loop={true}
                onReachPoint={(idx) => {
                  const sequence = ['ai', 'llm', 'api', 'automation', 'result'];
                  if (sequence[idx]) setInspectedNodeId(sequence[idx]);
                }}
              />
            )}

            {/* System Nodes */}
            {HERO_NODES.map((node) => {
              const isUnlocked = unlockedNodeIds.has(node.id);
              const isInspected = inspectedNodeId === node.id;

              return (
                <SystemNode
                  key={node.id}
                  id={node.id}
                  label={node.label}
                  x={node.x}
                  y={node.y}
                  size={node.id === 'ai' ? 46 : node.id === 'result' ? 42 : 36}
                  status={
                    !isUnlocked
                      ? 'IDLE'
                      : isInspected
                      ? 'PROCESSING'
                      : 'READY'
                  }
                  isActive={isInspected}
                  metadata={node.metadata}
                  onClick={() => setInspectedNodeId(node.id)}
                  onHover={(h) => {
                    if (h) setInspectedNodeId(node.id);
                  }}
                />
              );
            })}
          </svg>

          {/* Subsystem Booting Telemetry Ticker Overlay */}
          {!isSystemOnline && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-amber-400 bg-black/80 px-4 py-1.5 rounded-full border border-amber-900/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>
                ACTIVATING SUBSYSTEM: {BOOT_SEQUENCE[Math.min(activeStep, BOOT_SEQUENCE.length - 1)]?.label || 'READY'}
              </span>
            </div>
          )}

          {isSystemOnline && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[10px] text-text-tertiary bg-black/70 px-4 py-1 rounded-full border border-border flex items-center gap-2">
              <span className="text-cyan-400">●</span>
              <span>ARTERIAL SIGNAL FLOWING // HOVER ANY NODE TO INSPECT TELEMETRY</span>
            </div>
          )}
        </div>
      </div>

      {/* Downward Conduit: Arterial Signal seamlessly exits Hero and enters The Problem */}
      <SystemTransition
        fromLabel="RESULT OUTPUT // 001"
        toLabel="THE PROBLEM PIPELINE"
        height={100}
        color="var(--color-cyan)"
      />
    </section>
  );
};
