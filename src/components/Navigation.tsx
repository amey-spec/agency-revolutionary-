import React, { useState } from 'react';
import { useSystem } from '../system/SystemContext';
import { useScroll } from '../system/ScrollContext';
import { sectionLabels, type SectionId } from '../constants/systemStates';
import { stateColors } from '../constants/colors';

interface NavigationProps {
  onOpenSystemMap: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenSystemMap }) => {
  const { state } = useSystem();
  const { activeSection } = useScroll();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const statusColor = stateColors[state] || 'var(--color-cyan)';

  const navItems: Array<{ label: string; target: SectionId }> = [
    { label: 'SYSTEM', target: 'hero' },
    { label: 'AGENTS', target: 'agents' },
    { label: 'AUTOMATION', target: 'automation' },
    { label: 'WORK', target: 'case-studies' },
    { label: 'LAB', target: 'technology' },
    { label: 'CONTACT', target: 'contact' },
  ];

  const handleNavClick = (target: SectionId) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 border-b border-border select-none"
      style={{
        background: 'rgba(8, 11, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      role="banner"
    >
      <div className="container flex items-center justify-between h-14">
        {/* Brand System Moniker */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-2 group focus:outline-none"
            aria-label="Return to system start"
          >
            <div className="w-2.5 h-2.5 bg-cyan-400 rounded-sm group-hover:rotate-45 transition-transform duration-300" style={{ background: 'var(--color-cyan)' }} />
            <span className="font-display font-bold text-sm tracking-wider uppercase text-text-primary">
              SYNAPSE <span className="text-cyan-400" style={{ color: 'var(--color-cyan)' }}>//</span> AI
            </span>
          </button>

          {/* System State Chip */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-black border border-border">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: statusColor,
                boxShadow: `0 0 6px ${statusColor}`,
                animation: state === 'PROCESSING' || state === 'EXECUTING' ? 'statusPulse 1s infinite' : 'none',
              }}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: statusColor }}>
              {state}
            </span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main system navigation">
          {navItems.map((item) => {
            const isActive = activeSection === item.target;
            return (
              <button
                key={item.target}
                onClick={() => handleNavClick(item.target)}
                className={`text-nav tracking-widest text-xs transition-colors py-1 relative ${
                  isActive ? 'text-cyan-400 font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
                style={{ color: isActive ? 'var(--color-cyan)' : undefined }}
              >
                {item.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                    style={{ background: 'var(--color-cyan)', boxShadow: '0 0 6px var(--color-cyan)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* System Map Trigger & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSystemMap}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-graphite hover:border-cyan-400 hover:text-cyan-400 transition-all font-mono text-xs uppercase tracking-wider"
            style={{ background: 'var(--color-graphite)' }}
            aria-label="Open System Architecture Map"
          >
            <span className="text-cyan-400" style={{ color: 'var(--color-cyan)' }}>◎</span>
            <span className="hidden sm:inline">SYSTEM MAP</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded border border-border text-text-secondary hover:text-text-primary"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-black p-4 space-y-3">
          <div className="font-mono text-[10px] text-text-tertiary uppercase tracking-widest border-b border-border pb-2">
            // NAVIGATION DIRECTORY
          </div>
          {navItems.map((item) => (
            <button
              key={item.target}
              onClick={() => handleNavClick(item.target)}
              className="w-full text-left font-mono text-xs tracking-wider py-2 uppercase flex items-center justify-between hover:text-cyan-400"
              style={{
                color: activeSection === item.target ? 'var(--color-cyan)' : 'var(--color-text-secondary)',
              }}
            >
              <span>{item.label}</span>
              <span className="text-[10px] text-text-tertiary">
                {sectionLabels[item.target]}
              </span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
