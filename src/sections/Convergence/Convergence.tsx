import React from 'react';
import { SectionWrapper } from '../../components/SectionWrapper';
import { SystemTransition } from '../../animation/SystemTransition';



export const Convergence: React.FC = () => {
  return (
    <>
      <SectionWrapper
        id="convergence"
        systemPhase="STAGE 11 // MACRO ARCHITECTURE CONVERGENCE"
        title="SYSTEM CONVERGENCE & COMPLETION."
        subtitle="Every stage introduced in the journey reconnects into one unified machine. Motion slows. Entropy dissolves. The architecture settles into intentional stillness."
        targetState="SUCCESS"
      >
        <div className="mt-4 max-w-5xl mx-auto select-none space-y-8">
          {/* Macro Monolithic System Diagram */}
          <div className="relative rounded-2xl border border-green-500/40 bg-[#070a0e] p-6 sm:p-10 shadow-2xl overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center">
            {/* Ambient Settling Aura */}
            <div
              className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-10 blur-3xl"
              style={{ background: 'var(--color-green)' }}
            />

            {/* Top State Banner */}
            <div className="flex items-center gap-3 font-mono text-xs text-green-400 font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-green-800/80 bg-black/80 mb-8 backdrop-blur-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span>SYSTEM / COMPLETE // OPERATIONAL</span>
            </div>

            {/* Symmetrical Macro Assembly SVG */}
            <div className="w-full max-w-2xl py-4">
              <svg viewBox="0 0 600 240" className="w-full h-auto overflow-visible select-none">
                {/* Lateral converging lines to central nexus */}
                <path d="M 60 40 C 180 40, 220 120, 300 120" stroke="var(--color-green)" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M 60 120 L 300 120" stroke="var(--color-green)" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M 60 200 C 180 200, 220 120, 300 120" stroke="var(--color-green)" strokeWidth="1.5" fill="none" opacity="0.6" />

                <path d="M 540 40 C 420 40, 380 120, 300 120" stroke="var(--color-green)" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M 540 120 L 300 120" stroke="var(--color-green)" strokeWidth="1.5" fill="none" opacity="0.6" />
                <path d="M 540 200 C 420 200, 380 120, 300 120" stroke="var(--color-green)" strokeWidth="1.5" fill="none" opacity="0.6" />

                {/* Left Source Subsystems */}
                <g transform="translate(60, 40)">
                  <rect x="-50" y="-12" width="100" height="24" rx="4" fill="var(--color-charcoal)" stroke="var(--color-border)" strokeWidth="1" />
                  <text x="0" y="4" fill="var(--color-text-secondary)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">AI REASONING</text>
                </g>
                <g transform="translate(60, 120)">
                  <rect x="-50" y="-12" width="100" height="24" rx="4" fill="var(--color-charcoal)" stroke="var(--color-border)" strokeWidth="1" />
                  <text x="0" y="4" fill="var(--color-text-secondary)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">AGENT FLEET</text>
                </g>
                <g transform="translate(60, 200)">
                  <rect x="-50" y="-12" width="100" height="24" rx="4" fill="var(--color-charcoal)" stroke="var(--color-border)" strokeWidth="1" />
                  <text x="0" y="4" fill="var(--color-text-secondary)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">AUTOMATION</text>
                </g>

                {/* Right Source Subsystems */}
                <g transform="translate(540, 40)">
                  <rect x="-50" y="-12" width="100" height="24" rx="4" fill="var(--color-charcoal)" stroke="var(--color-border)" strokeWidth="1" />
                  <text x="0" y="4" fill="var(--color-text-secondary)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">DATA MATRIX</text>
                </g>
                <g transform="translate(540, 120)">
                  <rect x="-50" y="-12" width="100" height="24" rx="4" fill="var(--color-charcoal)" stroke="var(--color-border)" strokeWidth="1" />
                  <text x="0" y="4" fill="var(--color-text-secondary)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">INTEGRATIONS</text>
                </g>
                <g transform="translate(540, 200)">
                  <rect x="-50" y="-12" width="100" height="24" rx="4" fill="var(--color-charcoal)" stroke="var(--color-border)" strokeWidth="1" />
                  <text x="0" y="4" fill="var(--color-text-secondary)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">DEPLOYED WORK</text>
                </g>

                {/* Central Nexus of Convergence */}
                <g transform="translate(300, 120)">
                  <circle cx="0" cy="0" r="48" fill="var(--color-surface)" stroke="var(--color-green)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.3))' }} />
                  <text x="0" y="-6" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                    SYSTEM
                  </text>
                  <text x="0" y="10" fill="var(--color-green)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                    COMPLETE
                  </text>
                </g>
              </svg>
            </div>

            {/* Intentional Stillness Text */}
            <div className="max-w-xl mx-auto mt-6 space-y-2">
              <span className="font-mono text-[10px] text-text-tertiary uppercase tracking-widest block">
                [ INTENTIONAL STILLNESS ACHIEVED ]
              </span>
              <p className="text-body-md text-text-secondary font-light">
                The execution loop has settled. Every subsystem is operational, synchronized, and standing by for the next operational directive.
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Downward Conduit: Carries the ready system state directly to the final Contact input node */}
      <SystemTransition
        fromLabel="SYSTEM COMPLETE"
        toLabel="INPUT REQUIRED // NEXT CYCLE"
        height={100}
        color="var(--color-green)"
      />
    </>
  );
};
