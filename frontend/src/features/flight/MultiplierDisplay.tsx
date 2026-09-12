// Показ множителя с цветовой дифференциацией по уровням, без ререндеров React

import { useEffect, useRef } from 'react';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';

interface MultiplierDisplayProps {
  getSnapshot: () => FlightSnapshot;
}

const TIER_CLASSES = [
  'text-ink',
  'text-gold',
  'text-gold drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]',
  'text-gold drop-shadow-[0_0_18px_rgba(234,179,8,0.9)] scale-125',
];

export function MultiplierDisplay({ getSnapshot }: MultiplierDisplayProps) {
  // Обновляет текст и класс покадрово напрямую через DOM
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return undefined;

    let frame = 0;
    let lastTier = -1;

    const loop = (): void => {
      const { multiplier, levelsPassed } = getSnapshot();
      node.textContent = `x${multiplier.toFixed(2)}`;

      const tier = Math.min(levelsPassed, TIER_CLASSES.length - 1);
      if (tier !== lastTier) {
        node.className = `inline-block text-5xl font-bold tabular-nums transition-all duration-300 sm:text-6xl ${TIER_CLASSES[tier] ?? ''}`;
        lastTier = tier;
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [getSnapshot]);

  return (
    <span ref={nodeRef} className="inline-block text-5xl font-bold tabular-nums sm:text-6xl">
      x1.00
    </span>
  );
}
