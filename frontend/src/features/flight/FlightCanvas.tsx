// Canvas со сценой: рисует полёт при активном раунде и парящий шар в ожидании

import { useEffect, useRef } from 'react';
import type { RoundStart, Theme } from '@/shared/api/contract';
import { SceneRenderer } from '@/features/flight/scene-renderer';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';

interface FlightCanvasProps {
  round?: RoundStart | null | undefined;
  levels: readonly number[];
  theme: Theme;
  getSnapshot?: (() => FlightSnapshot) | undefined;
}

export function FlightCanvas({ round = null, levels, theme, getSnapshot }: FlightCanvasProps) {
  // Рисует сцену покадрово, не вызывая ререндеров React
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const renderer = new SceneRenderer(ctx, { round, levels, theme });
    let frame = 0;
    let last = performance.now();

    const resize = (): void => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * ratio;
      canvas.height = clientHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      renderer.resize(clientWidth, clientHeight);
    };

    const loop = (now: number): void => {
      const delta = Math.min(now - last, 64);
      last = now;
      renderer.draw(snapshotRef.current?.() ?? null, delta);
      frame = requestAnimationFrame(loop);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [round, levels, theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />;
}
