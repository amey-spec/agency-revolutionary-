import React, { useEffect, useRef } from 'react';
import { useScroll } from '../system/ScrollContext';
import { useSystem } from '../system/SystemContext';
import type { SectionId, SystemState } from '../constants/systemStates';
import { sectionLabels } from '../constants/systemStates';

interface SectionWrapperProps {
  id: SectionId;
  systemPhase: string;
  title: string;
  subtitle?: string;
  targetState?: SystemState;
  children: React.ReactNode;
  className?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  systemPhase,
  title,
  subtitle,
  targetState,
  children,
  className = '',
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerSection, unregisterSection, activeSection } = useScroll();
  const { transition } = useSystem();

  useEffect(() => {
    const el = sectionRef.current;
    if (el) {
      registerSection(id, el);
    }
    return () => {
      unregisterSection(id);
    };
  }, [id, registerSection, unregisterSection]);

  const isActive = activeSection === id;

  useEffect(() => {
    if (isActive && targetState) {
      transition(targetState);
    }
  }, [isActive, targetState, transition]);

  return (
    <section
      id={id}
      ref={sectionRef}
      className={`section-wrapper relative scroll-mt-14 transition-opacity duration-700 ${className}`}
      aria-label={`${systemPhase}: ${title}`}
    >
      {/* Vertical Spine Alignment Lines in Background */}
      <div className="absolute inset-0 pointer-events-none flex justify-center opacity-10">
        <div className="w-px h-full bg-cyan-400" />
      </div>

      <div className="container relative z-10 py-16 md:py-24">
        {/* Cinematic Pipeline Stage Header */}
        <div className="mb-10 md:mb-16 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-text-tertiary px-3.5 py-1 rounded-full border border-border bg-black/60 backdrop-blur-md mb-4">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: isActive ? 'var(--color-cyan)' : 'var(--color-border)',
                boxShadow: isActive ? '0 0 8px var(--color-cyan)' : 'none',
              }}
            />
            <span style={{ color: isActive ? 'var(--color-cyan)' : undefined }}>
              {systemPhase}
            </span>
            <span className="text-text-disabled">::</span>
            <span className="text-text-secondary">{sectionLabels[id]}</span>
          </div>

          <h2 className="text-display-lg text-text-primary tracking-tight font-display">
            {title}
          </h2>

          {subtitle && (
            <p className="text-body-lg text-text-secondary max-w-2xl mt-4 font-light leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Section Body */}
        {children}
      </div>
    </section>
  );
};
