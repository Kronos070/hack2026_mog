// Игровой цикл полёта: анимация множителя через rAF без ререндеров React

import { useCallback, useEffect, useRef } from 'react';
import type { GameConfig, RoundStart } from '@/shared/api/contract';
import { levelsPassedAt, multiplierAt, progressInLevels } from '@/shared/lib/crash-math';
import { soundManager } from '@/shared/lib/sound-manager';

export interface FlightSnapshot {
  multiplier: number;
  baseMultiplier: number;
  progress: number;
  levelsPassed: number;
  boosterActivated: boolean;
  cashedOut: boolean;
  crashed: boolean;
}

interface FlightCallbacks {
  onLevel: (level: number) => void;
  onBooster: () => void;
  onCrash: () => void;
}

export function useFlightEngine(
  round: RoundStart | null,
  config: GameConfig | undefined,
  callbacks: FlightCallbacks,
) {
  const snapshot = useRef<FlightSnapshot>({
    multiplier: 1,
    baseMultiplier: 1,
    progress: 0,
    levelsPassed: 0,
    boosterActivated: false,
    cashedOut: false,
    crashed: false,
  });
  const cashedOut = useRef(false);
  const boosterFactor = useRef(1);
  const frame = useRef(0);
  const handlers = useRef(callbacks);
  handlers.current = callbacks;

  const markCashout = useCallback(() => {
    cashedOut.current = true;
    snapshot.current.cashedOut = true;
    soundManager.stopFlightSound();
  }, []);

  const getSnapshot = useCallback(() => snapshot.current, []);

  useEffect(() => {
    if (!round || !config) return undefined;

    snapshot.current = {
      multiplier: 1,
      baseMultiplier: 1,
      progress: 0,
      levelsPassed: 0,
      boosterActivated: false,
      cashedOut: false,
      crashed: false,
    };
    cashedOut.current = false;
    boosterFactor.current = 1;
    soundManager.startFlightSound();

    const tick = (): void => {
      const state = snapshot.current;
      if (state.crashed) return;

      const elapsed = Date.now() - round.startedAt;
      const base = multiplierAt(elapsed, config);
      const current = base * boosterFactor.current;

      const passed = levelsPassedAt(current, round.levelMultipliers);
      if (passed > state.levelsPassed) {
        for (let level = state.levelsPassed + 1; level <= passed; level += 1) {
          handlers.current.onLevel(level);

          // Звуки x2, x3, x4... воспроизводятся при пересечении линий игрового поля
          if (level >= 2 && (passed - state.levelsPassed <= 1 || level === passed)) {
            soundManager.playMultiplier(level);
          }

          if (
            round.boosterLevel === level &&
            !cashedOut.current &&
            !state.boosterActivated
          ) {
            state.boosterActivated = true;
            boosterFactor.current = round.boosterMultiplier;
            handlers.current.onBooster();
            soundManager.play('boost', 0.7);
          }
        }
        state.levelsPassed = passed;
      }

      state.multiplier = current;
      state.baseMultiplier = base;
      state.progress = progressInLevels(current, round.levelMultipliers);

      if (base >= round.crashMultiplier) {
        state.crashed = true;
        state.multiplier = round.crashMultiplier * boosterFactor.current;
        state.baseMultiplier = round.crashMultiplier;
        state.progress = progressInLevels(state.multiplier, round.levelMultipliers);
        soundManager.stopFlightSound();
        handlers.current.onCrash();
        soundManager.play('crash', 0.8);
        return;
      }

      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame.current);
      soundManager.stopFlightSound();
    };
  }, [round, config]);

  return { getSnapshot, markCashout };
}
