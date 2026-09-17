import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';

interface TechLayer {
  level: number;
  name: string;
  focus: string;
  components: string[];
  protocol: string;
  color: string;
}

const TECH_LAYERS: TechLayer[] = [
  {
    level: 6,
    name: 'EXPERIENCE LAYER',
    focus: 'Human-in-the-loop interfaces, executive command centers & responsive web dashboards',
    components: ['Next.js React Architecture', 'Realtime WebSockets UI', 'Role-Based Access Control', 'Mobile Responsive Telemetry'],
    protocol: 'HTTPS / WSS / Client-Side Decoupling',
    color: 'var(--color-cyan)',
  },
  {
    level: 5,
    name: 'APPLICATION SERVICES',
    focus: 'REST/GraphQL microservices, webhook interceptors & API gateways',
    components: ['FastAPI / Node Microservices', 'Kong API Gateway', 'Event Bus Dispatcher', 'Mutual TLS Auth Gate'],
    protocol: 'OpenAPI 3.1 / gRPC / JSON-RPC',
    color: 'var(--color-cyan-dim)',
  },
  {
    level: 4,
    name: 'AI & AGENTIC REASONING',
    focus: 'LLM orchestration, autonomous agent pools, vector indexing & chain-of-thought routing',
    components: ['Anthropic Claude & OpenAI Engines', 'LangChain / Custom ReAct Agent Loops', 'Semantic Router Graph', 'Guardrail & Safety Evaluators'],
    protocol: 'Streaming Inference / Vector Embeddings',
    color: 'var(--color-violet)',
  },
  {
    level: 3,
    name: 'AUTOMATION CORE',
    focus: 'Deterministic state machines, job queues, transactional retries & rate-limiting',
    components: ['Temporal.io Durable Execution', 'Redis Event Queues', 'Distributed Locks & Retries', 'Dead Letter Queue Recovery'],
    protocol: 'Idempotent Webhooks / Async SQS',
    color: 'var(--color-green)',
  },
  {
    level: 2,
    name: 'DATA & KNOWLEDGE LAYER',
    focus: 'Atomic relational storage, vector indices, document embeddings & audit logs',
    components: ['PostgreSQL & pgvector', 'Pinecone / Qdrant Vector Indices', 'Snowflake Analytics Warehousing', 'Encrypted Document Vault'],
    protocol: 'ACID Transactions / HNSW Indexing',
    color: 'var(--color-amber)',
  },
  {
    level: 1,
    name: 'INFRASTRUCTURE & SECURITY',
    focus: 'Cloud native container orchestration, edge caching, zero-trust perimeter & SOC2 compliance',
    components: ['AWS / GCP Cloud Native VPC', 'Docker & Kubernetes Clusters', 'Cloudflare Edge WAF', 'KMS Key Envelope Encryption'],
    protocol: 'Terraform IaC / Zero-Trust Mesh',
    color: 'var(--color-text-secondary)',
  },
];

export const Technology: React.FC = () => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(0);
  const activeLayer = TECH_LAYERS[selectedLayerIndex];

  return (
    <>
      <SectionWrapper
        id="technology"
        systemPhase="PIPELINE PHASE 09"
        title="TECHNOLOGY ARCHITECTURE."
        subtitle="Layered architectural engineering. Every system tier operates with isolated responsibilities, strict schemas, and horizontal scalability."
        targetState="READY"
      >
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Stacked Layer Buttons */}
          <div className="lg:col-span-6 space-y-2 select-none">
            <div className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>// SYSTEM STACK HIERARCHY</span>
              <span className="demo-badge">LAYER 01 → 06</span>
            </div>

            {TECH_LAYERS.map((layer, idx) => {
              const isSelected = selectedLayerIndex === idx;
              return (
                <div
                  key={layer.level}
                  onClick={() => setSelectedLayerIndex(idx)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-surface border-cyan-400 shadow-[0_0_15px_rgba(0,212,232,0.15)]'
                      : 'bg-charcoal border-border hover:border-border-alt opacity-80 hover:opacity-100'
                  }`}
                  role="button"
                  tabIndex={0}
                  data-cursor="LAYER"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-text-disabled">
                      0{layer.level}
                    </span>
                    <span
                      className="w-1.5 h-6 rounded-full"
                      style={{ background: layer.color }}
                    />
                    <div>
                      <h4 className="font-display font-bold text-sm text-text-primary tracking-wide uppercase">
                        {layer.name}
                      </h4>
                      <p className="font-mono text-[11px] text-text-tertiary truncate max-w-xs">
                        {layer.protocol}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-cyan-400">
                    {isSelected ? 'ACTIVE ➔' : '+'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Layer Inspector */}
          <div className="lg:col-span-6 p-6 rounded-xl border border-border bg-charcoal space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">
                  TIER // 0{activeLayer.level} DEEP DIVE
                </span>
                <h3 className="font-display font-bold text-xl text-text-primary uppercase tracking-wide mt-1">
                  {activeLayer.name}
                </h3>
              </div>
              <span className="demo-badge">ISOLATED SUBSYSTEM</span>
            </div>

            <p className="text-body-md text-text-secondary font-light">
              {activeLayer.focus}
            </p>

            {/* Components Grid */}
            <div className="space-y-2">
              <span className="font-mono text-xs text-text-tertiary uppercase tracking-wider block">
                ENGINEERED SUBSYSTEMS:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeLayer.components.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded bg-black/60 border border-border font-mono text-xs text-text-secondary flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeLayer.color }} />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Protocol Spec */}
            <div className="p-3.5 rounded bg-black border border-border font-mono text-xs flex items-center justify-between">
              <span className="text-text-tertiary uppercase text-[10px]">COMMUNICATION BUS:</span>
              <span className="text-cyan-400 font-semibold">{activeLayer.protocol}</span>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit Hand-off */}
      <SystemTransition
        fromLabel="TECHNOLOGY STACK"
        toLabel="LIVE OBSERVABILITY TELEMETRY"
        height={70}
      />
    </>
  );
};
