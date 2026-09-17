import React from 'react';
import { useScroll } from '../system/ScrollContext';
import { SECTIONS, sectionLabels, type SectionId } from '../constants/systemStates';

export const ScrollProgress: React.FC = () => {
  const { scrollProgress, activeSection } = useScroll();

  const handleScrollTo = (id: SectionId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Mobile top progress line */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 md:hidden pointer-events-none"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          className="h-full bg-cyan-400 transition-all duration-75"
          style={{
            width: `${Math.round(scrollProgress * 100)}%`,
            background: 'var(--color-cyan)',
            boxShadow: '0 0 8px var(--color-cyan)',
          }}
        />
      </div>

      {/* Desktop right HUD bar */}
      <aside
        className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3 select-none pointer-events-auto"
        aria-label="System scroll navigation"
      >
        {/* Progress percentage indicator */}
        <div className="font-mono text-[10px] tracking-widest text-text-tertiary mb-1">
          SYS // {Math.round(scrollProgress * 100).toString().padStart(3, '0')}%
        </div>

        {/* Section nodes spine */}
        <div className="flex flex-col items-center gap-2 py-2">
          {SECTIONS.map((secId) => {
            const isActive = activeSection === secId;
            return (
              <button
                key={secId}
                onClick={() => handleScrollTo(secId)}
                className="group relative flex items-center justify-end w-6 h-4 cursor-pointer focus:outline-none"
                aria-label={`Jump to ${sectionLabels[secId]}`}
              >
                {/* Hover label tooltip */}
                <span
                  className="absolute right-7 font-mono text-[9px] uppercase tracking-wider py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
                  style={{
                    background: 'var(--color-black)',
                    color: isActive ? 'var(--color-cyan)' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {sectionLabels[secId]}
                </span>

                {/* Node dash or dot */}
                <span
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: isActive ? '12px' : '4px',
                    height: isActive ? '4px' : '4px',
                    background: isActive ? 'var(--color-cyan)' : 'var(--color-border)',
                    boxShadow: isActive ? '0 0 8px var(--color-cyan)' : 'none',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Active section title */}
        {activeSection && (
          <div
            className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-1"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {sectionLabels[activeSection]}
          </div>
        )}
      </aside>
    </>
  );
};
