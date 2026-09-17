import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export const CustomCursor: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [targetLabel, setTargetLabel] = useState<string | null>(null);
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest('button, a, input, textarea, [role="button"], .cursor-pointer');
      setIsHoveringClickable(!!clickable);

      // Extract custom cursor label if specified on element
      const customAction = target.closest('[data-cursor]')?.getAttribute('data-cursor');
      if (customAction) {
        setTargetLabel(customAction);
      } else if (target.closest('input, textarea')) {
        setTargetLabel('INPUT');
      } else if (target.closest('.system-node')) {
        setTargetLabel('NODE');
      } else if (target.closest('.workflow-node')) {
        setTargetLabel('STEP');
      } else if (clickable) {
        setTargetLabel('EXEC');
      } else {
        setTargetLabel(null);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [reducedMotion, isVisible]);

  if (reducedMotion || !isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-50 select-none transition-opacity duration-200"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        willChange: 'transform',
      }}
    >
      {/* Reticle ring */}
      <div
        className="relative -top-3 -left-3 rounded-full border transition-all duration-150 flex items-center justify-center"
        style={{
          width: isHoveringClickable ? '32px' : '24px',
          height: isHoveringClickable ? '32px' : '24px',
          borderColor: isHoveringClickable ? 'var(--color-cyan)' : 'rgba(0, 212, 232, 0.4)',
          background: isHoveringClickable ? 'rgba(0, 212, 232, 0.08)' : 'transparent',
          transform: isHoveringClickable ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isHoveringClickable ? '0 0 12px rgba(0, 212, 232, 0.3)' : 'none',
        }}
      >
        {/* Center dot */}
        <div
          className="w-1 h-1 rounded-full"
          style={{ background: isHoveringClickable ? 'var(--color-cyan)' : '#ffffff' }}
        />
      </div>

      {/* Context Action Tag */}
      {targetLabel && (
        <div
          className="absolute left-6 -top-2 font-mono text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-border"
          style={{
            background: 'var(--color-black)',
            color: 'var(--color-cyan)',
            borderColor: 'var(--color-cyan-dim)',
            whiteSpace: 'nowrap',
          }}
        >
          {targetLabel}
        </div>
      )}
    </div>
  );
};
