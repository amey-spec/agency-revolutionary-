import { sectionLabels, type SectionId } from '../constants/systemStates';

export interface SystemMapProps {
  activeSection: SectionId | null;
  onSelectSection: (id: SectionId) => void;
  onClose?: () => void;
}

interface MapNodeDef {
  id: SectionId;
  label: string;
  x: number;
  y: number;
  connections: SectionId[];
}

// Visual architecture map layout
const MAP_NODES: MapNodeDef[] = [
  { id: 'hero', label: 'SYSTEM // 001', x: 250, y: 50, connections: ['problem'] },
  { id: 'problem', label: 'THE PROBLEM', x: 250, y: 120, connections: ['transformation'] },
  { id: 'transformation', label: 'TRANSFORMATION', x: 250, y: 190, connections: ['intelligence'] },
  { id: 'intelligence', label: 'INTELLIGENCE CORE', x: 250, y: 270, connections: ['agents', 'automation', 'technology'] },
  { id: 'agents', label: 'AI AGENTS', x: 100, y: 350, connections: ['integrations'] },
  { id: 'automation', label: 'AUTOMATION ENGINE', x: 250, y: 350, connections: ['integrations'] },
  { id: 'technology', label: 'TECH LAYERS', x: 400, y: 350, connections: ['integrations'] },
  { id: 'integrations', label: 'INTEGRATIONS', x: 250, y: 430, connections: ['case-studies', 'observability'] },
  { id: 'case-studies', label: 'DEPLOYED WORK', x: 160, y: 510, connections: ['convergence'] },
  { id: 'observability', label: 'OBSERVABILITY', x: 340, y: 510, connections: ['convergence'] },
  { id: 'convergence', label: 'CONVERGENCE', x: 250, y: 590, connections: ['contact'] },
  { id: 'contact', label: 'INPUT / NEXT CYCLE', x: 250, y: 670, connections: [] },
];

export const SystemMap: React.FC<SystemMapProps> = ({
  activeSection,
  onSelectSection,
  onClose,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto select-none p-4">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-base tracking-wider uppercase text-text-primary flex items-center gap-2">
            <span className="text-cyan-400">◎</span> SYSTEM ARCHITECTURE MAP
          </h3>
          <p className="font-mono text-xs text-text-tertiary">
            Interactive topology // Select any system node to navigate
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 px-3 rounded border border-border text-xs font-mono uppercase tracking-wider hover:border-cyan-400 hover:text-cyan-400 transition-colors"
          >
            [ ESC // CLOSE ]
          </button>
        )}
      </div>

      <div className="relative border border-border rounded-lg p-2 bg-[#080b0f] overflow-x-auto">
        <svg
          viewBox="0 0 500 730"
          className="w-full h-auto min-w-[380px] overflow-visible"
        >
          {/* Connection Lines */}
          {MAP_NODES.map((node) => {
            return node.connections.map((targetId) => {
              const target = MAP_NODES.find((n) => n.id === targetId);
              if (!target) return null;
              const isPathActive = activeSection === node.id || activeSection === targetId;

              return (
                <g key={`${node.id}-${targetId}`}>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="var(--color-border)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity={isPathActive ? 0.9 : 0.4}
                  />
                  {isPathActive && (
                    <line
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="var(--color-cyan)"
                      strokeWidth="1.5"
                      opacity="0.8"
                      style={{ filter: 'drop-shadow(0 0 4px var(--color-cyan))' }}
                    />
                  )}
                </g>
              );
            });
          })}

          {/* Interactive Nodes */}
          {MAP_NODES.map((node) => {
            const isActive = activeSection === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => onSelectSection(node.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSection(node.id);
                  }
                }}
              >
                {/* Active Ring */}
                {isActive && (
                  <circle
                    cx={0}
                    cy={0}
                    r={22}
                    fill="none"
                    stroke="var(--color-cyan)"
                    strokeWidth="1"
                    opacity="0.4"
                    style={{ animation: 'nodePulse 2s infinite' }}
                  />
                )}

                {/* Node Base */}
                <circle
                  cx={0}
                  cy={0}
                  r={14}
                  fill={isActive ? 'var(--color-surface)' : 'var(--color-graphite)'}
                  stroke={isActive ? 'var(--color-cyan)' : 'var(--color-border)'}
                  strokeWidth={isActive ? 2 : 1}
                  className="transition-colors group-hover:stroke-cyan-400"
                />

                {/* Status Dot */}
                <circle
                  cx={0}
                  cy={0}
                  r={4}
                  fill={isActive ? 'var(--color-cyan)' : 'var(--color-text-tertiary)'}
                />

                {/* Label Box */}
                <g transform="translate(22, 4)">
                  <rect
                    x={-4}
                    y={-14}
                    width={130}
                    height={20}
                    rx={3}
                    fill="var(--color-black)"
                    stroke={isActive ? 'var(--color-cyan)' : 'var(--color-border-alt)'}
                    strokeWidth="0.8"
                    opacity="0.9"
                    className="transition-colors group-hover:stroke-cyan-400"
                  />
                  <text
                    x={4}
                    y={0}
                    fill={isActive ? 'var(--color-cyan)' : 'var(--color-text-secondary)'}
                    fontSize="9"
                    fontFamily="var(--font-mono)"
                    letterSpacing="0.05em"
                    className="font-semibold uppercase group-hover:fill-white"
                  >
                    {node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-text-tertiary">
        <span>CURRENT EXECUTION: <span className="text-cyan-400 font-bold">{activeSection ? sectionLabels[activeSection] : 'STANDBY'}</span></span>
        <span>ESC: CLOSE MAP</span>
      </div>
    </div>
  );
};
