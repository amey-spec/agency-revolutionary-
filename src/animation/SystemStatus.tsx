import React from 'react';

export interface SystemStatusItem {
  label: string;
  value: string;
  status?: 'ONLINE' | 'ACTIVE' | 'HEALTHY' | 'PROCESSING' | 'IDLE' | 'WARNING';
}

export interface SystemStatusProps {
  title?: string;
  items: SystemStatusItem[];
  compact?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  title = 'SYSTEM TELEMETRY',
  items,
  compact = false,
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
      case 'HEALTHY':
        return 'var(--color-green)';
      case 'PROCESSING':
        return 'var(--color-amber)';
      case 'WARNING':
        return 'var(--color-red)';
      case 'IDLE':
      default:
        return 'var(--color-cyan-dim)';
    }
  };

  return (
    <div
      className={`border border-border rounded-md p-3 font-mono select-none ${
        compact ? 'text-xs' : 'text-sm'
      }`}
      style={{
        background: 'rgba(13, 17, 23, 0.85)',
        borderColor: 'var(--color-border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
            // {title}
          </span>
          <span className="demo-badge">DEMO</span>
        </div>
      )}

      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const color = getStatusColor(item.status);
          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-text-tertiary text-xs uppercase tracking-wider">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 5px ${color}` }}
                />
                <span className="text-xs font-semibold uppercase" style={{ color }}>
                  {item.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
