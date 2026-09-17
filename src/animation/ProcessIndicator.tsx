import React from 'react';
import type { SystemState } from '../constants/systemStates';
import { stateColors } from '../constants/colors';

export interface ProcessIndicatorProps {
  label: string;
  status: SystemState;
  showCheckmark?: boolean;
}

export const ProcessIndicator: React.FC<ProcessIndicatorProps> = ({
  label,
  status,
  showCheckmark = true,
}) => {
  const color = stateColors[status] || 'var(--color-cyan)';
  const isComplete = status === 'SUCCESS';
  const isProcessing = status === 'PROCESSING' || status === 'INITIALIZING' || status === 'EXECUTING';

  return (
    <div
      className="flex items-center justify-between py-1.5 px-3 rounded font-mono text-xs border border-transparent transition-all duration-300"
      style={{
        background: isProcessing ? 'rgba(0, 212, 232, 0.05)' : 'transparent',
        borderColor: isProcessing ? 'rgba(0, 212, 232, 0.2)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: color,
            boxShadow: isProcessing ? `0 0 6px ${color}` : 'none',
            animation: isProcessing ? 'statusPulse 1s infinite' : 'none',
          }}
        />
        <span
          className="tracking-wider uppercase"
          style={{
            color: isComplete
              ? 'var(--color-text-primary)'
              : isProcessing
              ? 'var(--color-cyan)'
              : 'var(--color-text-tertiary)',
          }}
        >
          {label}
        </span>
      </div>

      <div>
        {isComplete && showCheckmark ? (
          <span className="text-green-500 font-bold" style={{ color: 'var(--color-green)' }}>
            ✓
          </span>
        ) : isProcessing ? (
          <span
            className="inline-block animate-spin"
            style={{ color: 'var(--color-cyan)' }}
          >
            ⟳
          </span>
        ) : (
          <span className="text-text-disabled" style={{ color: 'var(--color-text-disabled)' }}>
            —
          </span>
        )}
      </div>
    </div>
  );
};
