import React from 'react';
import type { SystemState } from '../constants/systemStates';
import { stateColors } from '../constants/colors';

export interface WorkflowNodeProps {
  step: number;
  label: string;
  sublabel?: string;
  status: SystemState;
  isActive?: boolean;
  isCompleted?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  step,
  label,
  sublabel,
  status,
  isActive = false,
  isCompleted = false,
  icon,
  onClick,
}) => {
  const color = stateColors[status] || 'var(--color-cyan)';

  return (
    <div
      onClick={onClick}
      className={`workflow-node relative flex items-center gap-4 p-4 rounded-md border transition-all duration-300 select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        background: isActive
          ? 'var(--color-surface)'
          : isCompleted
          ? 'var(--color-graphite)'
          : 'var(--color-charcoal)',
        borderColor: isActive
          ? color
          : isCompleted
          ? 'var(--color-green-dim)'
          : 'var(--color-border)',
        boxShadow: isActive ? `0 0 15px ${color}33` : 'none',
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Step Index Badge */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center font-mono text-xs font-bold border transition-colors"
        style={{
          background: isCompleted ? 'var(--color-green)' : isActive ? color : 'var(--color-black)',
          borderColor: isCompleted ? 'var(--color-green)' : isActive ? color : 'var(--color-border)',
          color: isCompleted || isActive ? '#000000' : 'var(--color-text-secondary)',
        }}
      >
        {isCompleted ? '✓' : String(step).padStart(2, '0')}
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-display font-semibold text-sm tracking-wide uppercase truncate"
            style={{
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            }}
          >
            {label}
          </span>
          {icon && <span className="text-xs opacity-70">{icon}</span>}
        </div>
        {sublabel && (
          <p className="font-mono text-xs text-text-tertiary truncate mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {sublabel}
          </p>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: color,
            boxShadow: isActive ? `0 0 8px ${color}` : 'none',
            animation: status === 'PROCESSING' || status === 'EXECUTING' ? 'statusPulse 1s infinite' : 'none',
          }}
        />
        <span
          className="font-mono text-[10px] uppercase tracking-wider hidden sm:inline-block"
          style={{ color }}
        >
          {status}
        </span>
      </div>
    </div>
  );
};
