// Шкала уровней слева от поля: множители строго на линиях уровней

import { useEffect, useRef } from 'react';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';

interface LevelLadderProps {
  levels: readonly number[];
  getSnapshot?: (() => FlightSnapshot) | undefined;
}

export function LevelLadder({ levels, getSnapshot }: LevelLadderProps) {
  // Подсвечивает пройденные уровни покадрово, не вызывая ререндеров React
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current;
    if (!node || !getSnapshot) return undefined;

    let frame = 0;
    let lastPassed = -1;

    const loop = (): void => {
      const { levelsPassed } = getSnapshot();
      if (levelsPassed !== lastPassed) {
        const items = node.children;
        for (let index = 0; index < items.length; index += 1) {
          items[index]?.classList.toggle('is-passed', index < levelsPassed);
        }
        lastPassed = levelsPassed;
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [levels, getSnapshot]);

  return (
    <div
      ref={listRef}
      className="pointer-events-none absolute inset-0 right-auto w-20 bg-sky-deep/30 sm:w-24"
    >
      {levels.map((multiplier, index) => (
        <span
          key={`${index}`}
          style={{ top: `${(1 - (index + 1) / (levels.length + 1)) * 100}%` }}
          className="level-mark absolute left-0 w-full -translate-y-1/2 text-center text-sm font-bold tabular-nums text-on-glass sm:text-base"
        >
          x {multiplier.toFixed(2)}
        </span>
      ))}
    </div>
  );
}
