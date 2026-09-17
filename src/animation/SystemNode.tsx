import React, { useState } from 'react';
import type { SystemState } from '../constants/systemStates';
import { stateColors } from '../constants/colors';

export interface SystemNodeProps {
  id: string;
  label: string;
  status?: SystemState;
  x: number; // percentage (0-100) or SVG px
  y: number;
  size?: number;
  isActive?: boolean;
  isHovered?: boolean;
  metadata?: Record<string, string | number>;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  pulse?: boolean;
  showDetails?: boolean;
}

export const SystemNode: React.FC<SystemNodeProps> = ({
  id,
  label,
  status = 'READY',
  x,
  y,
  size = 40,
  isActive = false,
  isHovered = false,
  metadata,
  onClick,
  onHover,
  pulse = true,
  showDetails = false,
}) => {
  const [internalHover, setInternalHover] = useState(false);
  const effectiveHover = isHovered || internalHover;
  const color = stateColors[status] || 'var(--color-cyan)';

  const handleMouseEnter = () => {
    setInternalHover(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setInternalHover(false);
    onHover?.(false);
  };

  const half = size / 2;

  return (
    <g
      id={`node-${id}`}
      transform={`translate(${x}, ${y})`}
      className="system-node cursor-pointer select-none"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`System Node ${label}, status: ${status}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{ outline: 'none' }}
    >
      {/* Outer Pulse ring when active */}
      {pulse && (isActive || status === 'PROCESSING' || status === 'EXECUTING') && (
        <circle
          cx={0}
          cy={0}
          r={half + 14}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.4"
          className="animate-ping-slow"
          style={{
            animation: 'nodePulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            transformOrigin: 'center',
          }}
        />
      )}

      {/* Target indicator ring */}
      <circle
        cx={0}
        cy={0}
        r={half + 6}
        fill="none"
        stroke={effectiveHover || isActive ? color : 'var(--color-border)'}
        strokeWidth={effectiveHover ? '1.5' : '1'}
        strokeDasharray={effectiveHover ? '3 3' : 'none'}
        opacity={effectiveHover ? 0.9 : 0.4}
        style={{ transition: 'all 0.3s ease' }}
      />

      {/* Node base body */}
      <circle
        cx={0}
        cy={0}
        r={half}
        fill="var(--color-graphite)"
        stroke={effectiveHover || isActive ? color : 'var(--color-border)'}
        strokeWidth={isActive || effectiveHover ? 2 : 1.2}
        style={{
          filter: effectiveHover ? `drop-shadow(0 0 10px ${color})` : 'none',
          transition: 'all 0.25s ease',
        }}
      />

      {/* Center status core */}
      <circle
        cx={0}
        cy={0}
        r={half * 0.35}
        fill={color}
        opacity={isActive || effectiveHover ? 1 : 0.75}
      />

      {/* Label underneath */}
      <text
        x={0}
        y={half + 16}
        textAnchor="middle"
        fill={effectiveHover ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'}
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="0.08em"
        style={{ transition: 'fill 0.2s ease', textTransform: 'uppercase' }}
      >
        {label}
      </text>

      {/* Hover metadata popover */}
      {(effectiveHover || showDetails) && metadata && (
        <g transform={`translate(${half + 12}, ${-half})`} className="node-popover">
          <rect
            x={0}
            y={0}
            width={140}
            height={20 + Object.keys(metadata).length * 16}
            rx={4}
            fill="var(--color-black)"
            stroke={color}
            strokeWidth="1"
            opacity="0.95"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
          />
          <text
            x={10}
            y={14}
            fill="var(--color-text-tertiary)"
            fontSize="8"
            fontFamily="var(--font-mono)"
            letterSpacing="0.06em"
          >
            NODE // {id.toUpperCase()}
          </text>
          {Object.entries(metadata).map(([key, val], idx) => (
            <text
              key={key}
              x={10}
              y={30 + idx * 16}
              fill="var(--color-text-secondary)"
              fontSize="9"
              fontFamily="var(--font-mono)"
            >
              <tspan fill="var(--color-text-tertiary)">{key.toUpperCase()}: </tspan>
              <tspan fill={key.toLowerCase() === 'status' ? color : 'var(--color-text-primary)'}>
                {val}
              </tspan>
            </text>
          ))}
        </g>
      )}
    </g>
  );
};
