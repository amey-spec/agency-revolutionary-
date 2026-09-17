import React, { useState } from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';

interface TaskNode {
  id: string;
  label: string;
  fragX: number;
  fragY: number;
  convX: number;
  convY: number;
  timeLag: string;
}

const TASKS: TaskNode[] = [
  { id: 'email', label: 'READ EMAIL', fragX: 100, fragY: 60, convX: 180, convY: 70, timeLag: '14 min' },
  { id: 'copy', label: 'COPY DATA', fragX: 280, fragY: 40, convX: 220, convY: 120, timeLag: '8 min' },
  { id: 'crm', label: 'UPDATE CRM', fragX: 520, fragY: 50, convX: 240, convY: 170, timeLag: '12 min' },
  { id: 'sheet', label: 'CHECK SPREADSHEET', fragX: 700, fragY: 80, convX: 230, convY: 220, timeLag: '15 min' },
  { id: 'followup', label: 'SEND FOLLOW-UP', fragX: 80, fragY: 280, convX: 200, convY: 270, timeLag: '9 min' },
  { id: 'report', label: 'GENERATE REPORT', fragX: 260, fragY: 340, convX: 240, convY: 320, timeLag: '25 min' },
  { id: 'verify', label: 'VERIFY REQUEST', fragX: 540, fragY: 330, convX: 220, convY: 370, timeLag: '7 min' },
  { id: 'reply', label: 'REPLY TO CUSTOMER', fragX: 710, fragY: 270, convX: 180, convY: 420, timeLag: '16 min' },
];

export const Problem: React.FC = () => {
  const [isConverged, setIsConverged] = useState(false);

  return (
    <>
      <SectionWrapper
        id="problem"
        systemPhase="STAGE 02 // SYSTEM DIAGNOSTIC"
        title="BUSINESS IS FULL OF INVISIBLE WORK."
        subtitle="Repetitive chores start scattered and uncoordinated across teams and tabs. Watch fragmentation reorganize and converge into automated execution."
        targetState="PROCESSING"
      >
        <div className="mt-4 max-w-5xl mx-auto select-none">
          {/* Convergence Mode Controller Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-full bg-black/80 border border-border mb-8 max-w-2xl mx-auto backdrop-blur-md">
            <div className="flex items-center gap-3 pl-3 font-mono text-xs text-text-secondary">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: isConverged ? 'var(--color-green)' : 'var(--color-amber)' }}
              />
              <span className="uppercase text-[11px] tracking-wider">
                TOPOLOGY: <strong className={isConverged ? 'text-green-400' : 'text-amber-400'}>
                  {isConverged ? 'ORGANIZED // CONVERGED CORE' : 'FRAGMENTED // 8 DISJOINTED CHORES'}
                </strong>
              </span>
            </div>

            <button
              onClick={() => setIsConverged(!isConverged)}
              className="px-5 py-2 rounded-full font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: isConverged ? 'var(--color-green)' : 'var(--color-cyan)',
                color: '#000000',
                boxShadow: isConverged
                  ? '0 0 15px rgba(16, 185, 129, 0.4)'
                  : '0 0 15px rgba(0, 212, 232, 0.4)',
              }}
              data-cursor="CONVERGE"
            >
              <span>{isConverged ? '↺ SHOW FRAGMENTATION' : '⚡ TRIGGER CONVERGENCE →'}</span>
            </button>
          </div>

          {/* Living Topological Visualizer: Fragmentation vs Converged Core */}
          <div className="relative w-full rounded-2xl border border-border bg-[#070a0e] p-4 sm:p-6 overflow-hidden shadow-2xl min-h-[480px] flex items-center justify-center">
            <svg
              viewBox="0 0 800 480"
              className="w-full h-auto max-h-[500px] overflow-visible select-none"
            >
              {/* Background radial lines toward center */}
              <circle cx="560" cy="240" r="140" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 6" opacity="0.25" />

              {/* Connecting Conduits from Tasks to Central Core */}
              {TASKS.map((task) => {
                const currentX = isConverged ? task.convX : task.fragX;
                const currentY = isConverged ? task.convY : task.fragY;
                const coreX = 560;
                const coreY = 240;

                return (
                  <g key={`path-${task.id}`}>
                    {/* Conduit Path */}
                    <path
                      d={
                        isConverged
                          ? `M ${currentX + 80} ${currentY} C 360 ${currentY}, 440 ${coreY}, ${coreX - 44} ${coreY}`
                          : `M ${currentX} ${currentY} L ${currentX + 30} ${currentY + 20}`
                      }
                      fill="none"
                      stroke={isConverged ? 'var(--color-cyan)' : 'var(--color-border)'}
                      strokeWidth={isConverged ? 1.8 : 1}
                      strokeDasharray={isConverged ? 'none' : '3 3'}
                      opacity={isConverged ? 0.85 : 0.3}
                      style={{
                        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        filter: isConverged ? 'drop-shadow(0 0 3px var(--color-cyan))' : 'none',
                      }}
                    />

                    {/* Traveling Energy Signals when Converged */}
                    {isConverged && (
                      <circle
                        cx={(currentX + 80 + coreX) / 2}
                        cy={(currentY + coreY) / 2}
                        r="2.5"
                        fill="#ffffff"
                        style={{
                          filter: 'drop-shadow(0 0 4px var(--color-cyan))',
                          animation: 'pulse 1s infinite',
                        }}
                      />
                    )}
                  </g>
                );
              })}

              {/* Central Automation Core Node */}
              <g
                transform="translate(560, 240)"
                style={{
                  opacity: isConverged ? 1 : 0.2,
                  transition: 'opacity 0.6s ease',
                }}
              >
                {/* Core Rings */}
                <circle
                  cx={0}
                  cy={0}
                  r={54}
                  fill="none"
                  stroke={isConverged ? 'var(--color-green)' : 'var(--color-border)'}
                  strokeWidth="1.5"
                  opacity="0.4"
                  style={{ animation: isConverged ? 'nodePulse 2s infinite' : 'none' }}
                />
                <circle
                  cx={0}
                  cy={0}
                  r={42}
                  fill="var(--color-surface)"
                  stroke={isConverged ? 'var(--color-green)' : 'var(--color-border)'}
                  strokeWidth={2}
                  style={{ filter: isConverged ? 'drop-shadow(0 0 16px rgba(16,185,129,0.3))' : 'none' }}
                />
                <text
                  x={0}
                  y={-4}
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.08em"
                >
                  AUTOMATION
                </text>
                <text
                  x={0}
                  y={12}
                  fill={isConverged ? 'var(--color-green)' : 'var(--color-text-tertiary)'}
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {isConverged ? 'CONVERGED ✓' : 'STANDBY'}
                </text>

                {/* Concentrated Output Arrow */}
                {isConverged && (
                  <path
                    d="M 44 0 L 140 0"
                    stroke="var(--color-green)"
                    strokeWidth="3"
                    markerEnd="url(#arrow)"
                    style={{ filter: 'drop-shadow(0 0 6px var(--color-green))' }}
                  />
                )}
              </g>

              {/* Task Chips (Moving smoothly across coordinates) */}
              {TASKS.map((task) => {
                const posX = isConverged ? task.convX : task.fragX;
                const posY = isConverged ? task.convY : task.fragY;

                return (
                  <g
                    key={task.id}
                    transform={`translate(${posX}, ${posY})`}
                    style={{
                      transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    className="select-none"
                  >
                    <rect
                      x={-60}
                      y={-14}
                      width={130}
                      height={28}
                      rx={6}
                      fill={isConverged ? 'var(--color-charcoal)' : '#0f141c'}
                      stroke={isConverged ? 'var(--color-cyan)' : 'var(--color-border)'}
                      strokeWidth={isConverged ? 1.5 : 1}
                      style={{
                        filter: isConverged ? 'drop-shadow(0 0 8px rgba(0,212,232,0.25))' : 'none',
                        transition: 'stroke 0.4s ease, fill 0.4s ease',
                      }}
                    />
                    <text
                      x={-50}
                      y={4}
                      fill={isConverged ? '#ffffff' : 'var(--color-text-secondary)'}
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      fontWeight="bold"
                      letterSpacing="0.05em"
                    >
                      {task.label}
                    </text>
                    <text
                      x={60}
                      y={4}
                      fill={isConverged ? 'var(--color-green)' : 'var(--color-amber)'}
                      fontSize="8"
                      fontFamily="var(--font-mono)"
                      textAnchor="end"
                    >
                      {isConverged ? 'AUTO' : task.timeLag}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Settle Message */}
          <div className="text-center mt-6">
            <p className="font-display text-lg text-text-primary uppercase tracking-wide">
              {isConverged
                ? 'WE AUTOMATE THE REPETITION.'
                : 'FRAGMENTED WORK BURNS HOURS // CONVERGE INTO CONTINUOUS FLOW'}
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit: Output flows directly into Stage 03 Transformation */}
      <SystemTransition
        fromLabel="AUTOMATION CORE OUTPUT"
        toLabel="WORKFLOW TRANSFORMATION ENGINE"
        height={100}
        color="var(--color-green)"
      />
    </>
  );
};
