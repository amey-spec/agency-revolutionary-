import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';

interface IntegrationNode {
  id: string;
  name: string;
  angle: number; // in degrees around the central hub
  state: 'CONNECTED' | 'SYNCING' | 'DATA RECEIVED' | 'CONNECTING';
  latency: string;
  protocol: string;
  systems: string;
}

const PROTOCOL_NODES: IntegrationNode[] = [
  { id: 'crm', name: 'CRM & LEADS', angle: 0, state: 'SYNCING', latency: '42ms', protocol: 'OAuth 2.0 / REST Webhooks', systems: 'HubSpot, Salesforce, Pipedrive' },
  { id: 'db', name: 'DATABASES', angle: 45, state: 'CONNECTED', latency: '12ms', protocol: 'PostgreSQL / pgvector / HNSW', systems: 'Snowflake, Supabase, BigQuery' },
  { id: 'email', name: 'EMAIL & COMMS', angle: 90, state: 'DATA RECEIVED', latency: '65ms', protocol: 'SMTP / IMAP / Webhooks', systems: 'Slack, Resend, Gmail API' },
  { id: 'api', name: 'CUSTOM APIS', angle: 135, state: 'CONNECTED', latency: '18ms', protocol: 'gRPC / OpenAPI 3.1 / JSON-RPC', systems: 'Internal Corporate Microservices' },
  { id: 'payments', name: 'PAYMENTS', angle: 180, state: 'CONNECTED', latency: '28ms', protocol: 'Signed Webhooks (TLS 1.3)', systems: 'Stripe, PayPal, Chargebee' },
  { id: 'calendar', name: 'SCHEDULING', angle: 225, state: 'CONNECTED', latency: '35ms', protocol: 'CalDAV / Google Calendar API', systems: 'Google Workspace, Calendly' },
  { id: 'analytics', name: 'ANALYTICS', angle: 270, state: 'SYNCING', latency: '22ms', protocol: 'Segment / Realtime Event Stream', systems: 'PostHog, Mixpanel, Datadog' },
  { id: 'comms', name: 'VOICE & SMS', angle: 315, state: 'CONNECTED', latency: '85ms', protocol: 'SIP Trunking / WebSockets Stream', systems: 'Twilio, ElevenLabs, Telnyx' },
];

export const Integrations: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('crm');
  const activeNode = PROTOCOL_NODES.find((n) => n.id === selectedNodeId) || PROTOCOL_NODES[0];

  const centerX = 300;
  const centerY = 240;
  const radius = 175;

  const getStateColor = (state: IntegrationNode['state']) => {
    switch (state) {
      case 'CONNECTED':
        return 'var(--color-green)';
      case 'SYNCING':
        return 'var(--color-amber)';
      case 'DATA RECEIVED':
        return 'var(--color-cyan)';
      case 'CONNECTING':
      default:
        return 'var(--color-violet)';
    }
  };

  return (
    <>
      <SectionWrapper
        id="integrations"
        systemPhase="STAGE 07 // ENTERPRISE INTEGRATION MESH"
        title="CONNECTED PROTOCOL MESH."
        subtitle="No disconnected silos. Our engine bridges enterprise databases, legacy payment gateways, voice trunks, and modern cloud APIs into one continuous bi-directional network."
        targetState="READY"
      >
        <div className="mt-4 max-w-5xl mx-auto select-none space-y-6">
          {/* Living Radial Mesh Network */}
          <div className="relative rounded-2xl border border-border bg-[#070a0e] p-6 sm:p-10 shadow-2xl overflow-hidden min-h-[500px] flex items-center justify-center">
            {/* Ambient Background Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, var(--color-cyan) 0%, transparent 60%)',
              }}
            />

            <svg viewBox="0 0 600 480" className="w-full h-auto max-w-[620px] overflow-visible select-none">
              {/* Outer Orbit Guide Track */}
              <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />

              {/* Conduits from Central Hub to 8 Satellite Nodes */}
              {PROTOCOL_NODES.map((node) => {
                const rad = (node.angle * Math.PI) / 180;
                const nodeX = centerX + radius * Math.cos(rad);
                const nodeY = centerY + radius * Math.sin(rad);
                const isSelected = selectedNodeId === node.id;
                const nodeColor = getStateColor(node.state);

                return (
                  <g key={`conduit-${node.id}`}>
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={nodeX}
                      y2={nodeY}
                      stroke={isSelected ? nodeColor : 'var(--color-border)'}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : '3 4'}
                      opacity={isSelected ? 1 : 0.35}
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 6px ${nodeColor})` : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />

                    {/* Continuous cycling pulses */}
                    <circle
                      cx={(centerX + nodeX) / 2}
                      cy={(centerY + nodeY) / 2}
                      r="2.5"
                      fill={nodeColor}
                      opacity={0.8}
                      style={{ filter: `drop-shadow(0 0 4px ${nodeColor})` }}
                    />
                  </g>
                );
              })}

              {/* Central Integration Bus Core */}
              <g transform={`translate(${centerX}, ${centerY})`}>
                <circle cx={0} cy={0} r={52} fill="none" stroke="var(--color-cyan)" strokeWidth="1" opacity="0.3" style={{ animation: 'nodePulse 2s infinite' }} />
                <circle
                  cx={0}
                  cy={0}
                  r={42}
                  fill="var(--color-surface)"
                  stroke="var(--color-cyan)"
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,232,0.35))' }}
                />
                <text x={0} y={-4} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                  SYNAPSE
                </text>
                <text x={0} y={10} fill="var(--color-cyan)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                  INTEGRATION BUS
                </text>
              </g>

              {/* 8 Satellite Protocol Nodes */}
              {PROTOCOL_NODES.map((node) => {
                const rad = (node.angle * Math.PI) / 180;
                const nodeX = centerX + radius * Math.cos(rad);
                const nodeY = centerY + radius * Math.sin(rad);
                const isSelected = selectedNodeId === node.id;
                const color = getStateColor(node.state);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${nodeX}, ${nodeY})`}
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId(node.id)}
                    role="button"
                    tabIndex={0}
                    data-cursor="INSPECT"
                  >
                    <rect
                      x="-50"
                      y="-14"
                      width="100"
                      height="28"
                      rx="5"
                      fill={isSelected ? 'var(--color-charcoal)' : 'var(--color-black)'}
                      stroke={isSelected ? color : 'var(--color-border)'}
                      strokeWidth={isSelected ? 1.8 : 1}
                      className="transition-colors group-hover:stroke-cyan-400"
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 10px ${color})` : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : 'var(--color-text-secondary)'}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                      letterSpacing="0.05em"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Node Telemetry HUD Bar */}
          <div className="p-6 rounded-xl border border-border bg-charcoal flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-mono text-xs">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-3">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: getStateColor(activeNode.state), boxShadow: `0 0 8px ${getStateColor(activeNode.state)}` }}
                />
                <span className="font-bold text-sm text-text-primary uppercase tracking-wider">
                  {activeNode.name}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded border uppercase"
                  style={{ color: getStateColor(activeNode.state), borderColor: getStateColor(activeNode.state) }}
                >
                  {activeNode.state}
                </span>
              </div>

              <div className="text-text-secondary text-xs">
                PROTOCOL: <strong className="text-cyan-400">{activeNode.protocol}</strong>
              </div>
              <div className="text-text-tertiary text-[11px]">
                ECOSYSTEM TARGETS: {activeNode.systems}
              </div>
            </div>

            <div className="shrink-0 px-4 py-2.5 rounded bg-black border border-border text-[11px] text-text-tertiary">
              <span>ROUNDTRIP LATENCY: </span>
              <span className="text-green-400 font-bold">{activeNode.latency}</span>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit: Output stream enters Case Studies */}
      <SystemTransition
        fromLabel="INTEGRATION MESH OUTPUT"
        toLabel="DEPLOYED CLIENT ARCHITECTURES"
        height={100}
        color="var(--color-cyan)"
      />
    </>
  );
};
