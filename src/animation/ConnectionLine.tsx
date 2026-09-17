import React from 'react';

export interface ConnectionLineProps {
  id?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active?: boolean;
  color?: string;
  curve?: 'straight' | 'smooth' | 'stepped';
  strokeWidth?: number;
  pulse?: boolean;
  dashed?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  id,
  x1,
  y1,
  x2,
  y2,
  active = false,
  color = 'var(--color-cyan)',
  curve = 'smooth',
  strokeWidth = 1.2,
  pulse = false,
  dashed = false,
}) => {
  let pathD = '';

  if (curve === 'straight') {
    pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  } else if (curve === 'stepped') {
    const midX = (x1 + x2) / 2;
    pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  } else {
    // smooth cubic bezier
    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.5;
    const cy1 = y1;
    const cx2 = x1 + dx * 0.5;
    const cy2 = y2;
    pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  return (
    <g className="connection-line" id={id ? `conn-${id}` : undefined}>
      {/* Background conduit path */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={strokeWidth}
        opacity={active ? 0.6 : 0.3}
      />

      {/* Active illuminated path */}
      {active && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dashed ? '4 4' : pulse ? '8 16' : 'none'}
          opacity={0.85}
          style={{
            filter: `drop-shadow(0 0 3px ${color})`,
            animation: pulse ? 'lineFlow 2s linear infinite' : 'none',
          }}
        />
      )}
    </g>
  );
};
