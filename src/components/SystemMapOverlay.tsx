import React, { useEffect } from 'react';
import { SystemMap } from '../animation/SystemMap';
import { useScroll } from '../system/ScrollContext';
import type { SectionId } from '../constants/systemStates';

interface SystemMapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemMapOverlay: React.FC<SystemMapOverlayProps> = ({ isOpen, onClose }) => {
  const { activeSection } = useScroll();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectSection = (id: SectionId) => {
    onClose();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="System Map"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#0d1117] border border-border rounded-xl shadow-2xl overflow-hidden my-auto animate-fadeIn">
        <SystemMap
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
