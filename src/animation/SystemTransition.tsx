import React from 'react';

export interface SystemTransitionProps {
  fromLabel?: string;
  toLabel?: string;
  height?: number;
  color?: string;
  active?: boolean;
}

export const SystemTransition: React.FC<SystemTransitionProps> = ({
  fromLabel = 'STAGE OUTPUT',
  toLabel = 'STAGE INPUT',
  height = 120,
  color = 'var(--color-cyan)',
  active = true,
}) => {
  return (
    <div
      className="system-transition relative w-full flex flex-col items-center justify-center pointer-events-none select-none my-0 overflow-visible"
      style={{ height }}
      aria-hidden="true"
    >
      {/* Top Source Node */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-tertiary bg-black/80 px-3 py-1 rounded-full border border-border/80 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        <span className="text-text-secondary">{fromLabel}</span>
      </div>

      {/* Vertical Energy Conduit Beam */}
      <div className="relative flex-1 w-12 flex justify-center items-center my-0">
        <svg
          className="h-full w-12 overflow-visible"
          viewBox="0 0 48 100"
          preserveAspectRatio="none"
        >
          {/* Subtle Outer Halo */}
          <line
            x1="24"
            y1="0"
            x2="24"
            y2="100"
            stroke={color}
            strokeWidth="8"
            opacity="0.08"
            strokeLinecap="round"
          />

          {/* Guide Rail */}
          <line
            x1="24"
            y1="0"
            x2="24"
            y2="100"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />

          {/* Core Laser Energy Pulse */}
          {active && (
            <line
              x1="24"
              y1="0"
              x2="24"
              y2="100"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="16 20"
              opacity="0.9"
              style={{
                animation: 'conduitFlow 1.2s linear infinite',
                filter: `drop-shadow(0 0 6px ${color})`,
              }}
            />
          )}

          {/* Traveling Signal Particle */}
          {active && (
            <g style={{ animation: 'signalDrop 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}>
              <circle cx="24" cy="50" r="7" fill={color} opacity="0.3" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
              <circle cx="24" cy="50" r="3.5" fill="#ffffff" />
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Destination Terminal */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-tertiary bg-black/80 px-3 py-1 rounded-full border border-border/80 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.8)] z-10">
        <span className="text-cyan-400 font-bold">↓</span>
        <span className="text-cyan-400 font-semibold">{toLabel}</span>
      </div>
    </div>
  );
};
