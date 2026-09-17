import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../types/animation';

export interface TerminalLogProps {
  entries: LogEntry[];
  title?: string;
  maxHeight?: string;
  autoScroll?: boolean;
  isSimulated?: boolean;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  entries,
  title = 'SYSTEM LOGS',
  maxHeight = '240px',
  autoScroll = true,
  isSimulated = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'var(--color-green)';
      case 'warning':
        return 'var(--color-amber)';
      case 'error':
        return 'var(--color-red)';
      case 'system':
        return 'var(--color-violet)';
      case 'info':
      default:
        return 'var(--color-cyan)';
    }
  };

  return (
    <div
      className="border border-border rounded-md overflow-hidden font-mono text-xs select-none"
      style={{
        background: 'var(--color-black)',
        borderColor: 'var(--color-border)',
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.8)',
      }}
    >
      {/* Terminal Title Bar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border"
        style={{ background: 'var(--color-charcoal)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-60 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-60 inline-block" />
          <span className="text-[11px] text-text-tertiary ml-2 uppercase tracking-wider font-semibold">
            {title}
          </span>
        </div>
        {isSimulated && (
          <span className="demo-badge">
            SIMULATED // DEMO
          </span>
        )}
      </div>

      {/* Terminal Content Stream */}
      <div
        ref={containerRef}
        className="p-3 overflow-y-auto space-y-1.5 scrollbar-thin"
        style={{ maxHeight }}
        role="log"
        aria-live="polite"
      >
        {entries.length === 0 ? (
          <div className="text-text-disabled italic py-2">
            &gt; Awaiting telemetry stream...
          </div>
        ) : (
          entries.map((entry) => {
            const color = getTypeColor(entry.type);
            return (
              <div key={entry.id} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-text-disabled shrink-0 font-mono text-[10px]">
                  {entry.timestamp}
                </span>
                <span
                  className="font-bold shrink-0 text-[10px]"
                  style={{ color }}
                >
                  [{entry.type.toUpperCase()}]
                </span>
                <span className="text-text-primary break-all flex-1">
                  {entry.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
