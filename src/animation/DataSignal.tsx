import React, { useEffect, useState, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface DataSignalProps {
  points: Array<{ x: number; y: number }>;
  duration?: number; // duration in ms
  color?: string;
  size?: number;
  loop?: boolean;
  onComplete?: () => void;
  onReachPoint?: (index: number) => void;
  active?: boolean;
}

export const DataSignal: React.FC<DataSignalProps> = ({
  points,
  duration = 2000,
  color = 'var(--color-cyan)',
  size = 4,
  loop = true,
  onComplete,
  onReachPoint,
  active = true,
}) => {
  const reducedMotion = useReducedMotion();
  const [pos, setPos] = useState<{ x: number; y: number }>(points[0] || { x: 0, y: 0 });
  const [visible, setVisible] = useState(active);
  const animRef = useRef<number | null>(null);
  const lastPointReachedRef = useRef<number>(-1);

  useEffect(() => {
    if (!active || points.length < 2 || reducedMotion) {
      if (points.length > 0) setPos(points[0]);
      setVisible(false);
      return;
    }

    setVisible(true);
    let startTime: number | null = null;

    // Precalculate segment lengths and total length
    const segments: Array<{ length: number; start: { x: number; y: number }; end: { x: number; y: number } }> = [];
    let totalLength = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      segments.push({ length: dist, start: p1, end: p2 });
      totalLength += dist;
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = (elapsed % duration) / duration;
      const isFinished = elapsed >= duration;

      if (isFinished && !loop) {
        setPos(points[points.length - 1]);
        onComplete?.();
        return;
      }

      const currentDist = (loop ? rawProgress : Math.min(1, elapsed / duration)) * totalLength;

      // Find current segment
      let accum = 0;
      let targetX = points[0].x;
      let targetY = points[0].y;

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (accum + seg.length >= currentDist || i === segments.length - 1) {
          const segDist = currentDist - accum;
          const t = seg.length > 0 ? Math.min(1, Math.max(0, segDist / seg.length)) : 0;
          targetX = seg.start.x + (seg.end.x - seg.start.x) * t;
          targetY = seg.start.y + (seg.end.y - seg.start.y) * t;

          if (lastPointReachedRef.current !== i && t > 0.9) {
            lastPointReachedRef.current = i;
            onReachPoint?.(i + 1);
          }
          break;
        }
        accum += seg.length;
      }

      setPos({ x: targetX, y: targetY });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [points, duration, loop, active, reducedMotion, onComplete, onReachPoint]);

  if (!visible || reducedMotion) return null;

  return (
    <g className="data-signal" transform={`translate(${pos.x}, ${pos.y})`}>
      {/* Glow aura */}
      <circle
        cx={0}
        cy={0}
        r={size * 2.2}
        fill={color}
        opacity={0.3}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
      {/* Solid core */}
      <circle cx={0} cy={0} r={size} fill="#ffffff" />
      <circle cx={0} cy={0} r={size * 0.7} fill={color} />
    </g>
  );
};
