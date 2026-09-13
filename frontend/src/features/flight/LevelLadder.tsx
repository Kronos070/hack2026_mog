// Шкала уровней слева от поля: множители строго на линиях уровней

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { SceneRenderer } from '@/features/flight/scene-renderer';

const BALLOON_BOTTOM = 104;
const BALLOON_TOP = 90;
const CAMERA_HOLD = 0.55;
const MIN_LABEL_GAP = 34;

interface LevelLadderProps {
  levels: readonly number[];
  getSnapshot?: (() => FlightSnapshot) | undefined;
}

export function LevelLadder({ levels, getSnapshot }: LevelLadderProps) {
  // Подсвечивает пройденные уровни покадрово, не вызывая ререндеров React
  const listRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) return undefined;

    const fit = (): void => {
      const span = node.clientHeight - BALLOON_BOTTOM - BALLOON_TOP;
      const gap = span / (levels.length + 1);
      setStep(Math.max(Math.ceil(MIN_LABEL_GAP / Math.max(gap, 1)), 1));
    };
    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, [levels.length]);

  useEffect(() => {
    const node = listRef.current;
    if (!node || !getSnapshot) return undefined;

    let frame = 0;
    let lastPassed = -1;

    const loop = (): void => {
      const { levelsPassed } = getSnapshot();

      const over = Math.max(SceneRenderer.smoothedProgress - CAMERA_HOLD, 0);
      const span = node.clientHeight - BALLOON_BOTTOM - BALLOON_TOP;
      node.style.transform = `translate3d(0, ${over * span}px, 0)`;

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
    return () => {
      cancelAnimationFrame(frame);
      node.style.transform = '';
    };
  }, [levels, getSnapshot]);

  return (
    <div className="pointer-events-none absolute inset-0 right-auto w-20 overflow-hidden bg-sky-deep/30 sm:w-24">
      <div ref={listRef} className="absolute inset-0">
        {levels.map((multiplier, index) => (
          <span
            key={`${index}`}
            style={{
              top: `calc(100% - ${BALLOON_BOTTOM}px - ${(index + 1) / (levels.length + 1)} * (100% - ${BALLOON_BOTTOM + BALLOON_TOP}px))`,
            }}
            className={`level-mark absolute left-0 w-full -translate-y-1/2 text-center text-sm font-bold tabular-nums text-on-glass sm:text-base ${
              index % step === 0 || index === levels.length - 1 ? '' : 'opacity-0'
            }`}
          >
            x {multiplier.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
