import React, { useState, useEffect } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemStatus } from '../../animation/SystemStatus';
import { SystemTransition } from '../../animation/SystemTransition';

const TELEMETRY_NODES = [
  { label: 'AI REASONING CORE', value: 'ONLINE // 99.98%', status: 'ONLINE' as const },
  { label: 'WORKFLOW ENGINE', value: 'ACTIVE // 142 RUNNING', status: 'ACTIVE' as const },
  { label: 'AGENT ORCHESTRATOR', value: 'ACTIVE // 12 POOLED', status: 'ACTIVE' as const },
  { label: 'GATEWAY APIS', value: 'CONNECTED // 18ms', status: 'ONLINE' as const },
  { label: 'DATABASE REPLICAS', value: 'HEALTHY // ZERO LAG', status: 'HEALTHY' as const },
  { label: 'SECURITY PERIMETER', value: 'ENABLED // TLS 1.3', status: 'ONLINE' as const },
];

export const Observability: React.FC = () => {
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseTick((prev) => (prev + 1) % 100);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <SectionWrapper
        id="observability"
        systemPhase="PIPELINE PHASE 10"
        title="SYSTEM OBSERVABILITY & TELEMETRY."
        subtitle="Full operational visibility. Continuous heartbeat monitoring, latency diagnostics, distributed tracing, and fault detection across every workflow pipeline."
        targetState="READY"
      >
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Telemetry Table */}
          <div className="lg:col-span-6 space-y-4">
            <SystemStatus
              title="DISTRIBUTED NODE HEALTH DIAGNOSTICS"
              items={TELEMETRY_NODES}
            />

            <div className="p-4 rounded-lg bg-black border border-border font-mono text-xs text-text-tertiary">
              <div className="flex items-center justify-between text-text-secondary">
                <span>SIMULATED HEARTBEAT:</span>
                <span className="text-green-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping inline-block" />
                  PULSE // TICK {pulseTick}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Panels and Heartbeat Monitor */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-xl border border-border bg-charcoal space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="font-mono text-xs text-text-tertiary uppercase tracking-widest">
                  // REALTIME TELEMETRY MATRIX
                </span>
                <span className="demo-badge">DEMO SIMULATION</span>
              </div>

              {/* Grid of Key Diagnostics */}
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-3.5 rounded bg-black/60 border border-border">
                  <span className="text-text-tertiary text-[10px] uppercase block mb-1">AVERAGE LATENCY</span>
                  <span className="font-bold text-base text-cyan-400">18.4 MS</span>
                  <span className="text-[10px] text-text-disabled block mt-1">p99 &lt; 45ms</span>
                </div>

                <div className="p-3.5 rounded bg-black/60 border border-border">
                  <span className="text-text-tertiary text-[10px] uppercase block mb-1">FAULT RATE</span>
                  <span className="font-bold text-base text-green-400">0.001%</span>
                  <span className="text-[10px] text-text-disabled block mt-1">Automated retry active</span>
                </div>

                <div className="p-3.5 rounded bg-black/60 border border-border">
                  <span className="text-text-tertiary text-[10px] uppercase block mb-1">CONCURRENT SIGNALS</span>
                  <span className="font-bold text-base text-violet-400">2,480 / SEC</span>
                  <span className="text-[10px] text-text-disabled block mt-1">Capacity: 45k/s</span>
                </div>

                <div className="p-3.5 rounded bg-black/60 border border-border">
                  <span className="text-text-tertiary text-[10px] uppercase block mb-1">UPTIME POLICY</span>
                  <span className="font-bold text-base text-text-primary">99.95% SLA</span>
                  <span className="text-[10px] text-text-disabled block mt-1">Multi-zone redundancy</span>
                </div>
              </div>

              {/* Heartbeat EKG Canvas / SVG Simulation */}
              <div className="p-3 rounded bg-black border border-border">
                <div className="flex items-center justify-between text-[10px] font-mono text-text-tertiary mb-2">
                  <span>TELEMETRY STREAM: CLUSTER A1</span>
                  <span className="text-green-400 font-bold">NORMAL</span>
                </div>
                <svg viewBox="0 0 300 40" className="w-full h-10 overflow-hidden">
                  <path
                    d="M 0 20 L 60 20 L 70 8 L 80 32 L 90 20 L 160 20 L 170 12 L 180 28 L 190 20 L 250 20 L 260 5 L 270 35 L 280 20 L 300 20"
                    fill="none"
                    stroke="var(--color-cyan)"
                    strokeWidth="1.5"
                    opacity="0.8"
                    style={{ filter: 'drop-shadow(0 0 4px var(--color-cyan))' }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit Hand-off */}
      <SystemTransition
        fromLabel="OBSERVABILITY METRICS"
        toLabel="FINAL SYSTEM CONVERGENCE"
        height={70}
      />
    </>
  );
};
