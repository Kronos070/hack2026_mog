// Приём полёта по WebSocket: множитель и события приходят с сервера

import { useCallback, useEffect, useRef } from 'react';
import type { RoundStart } from '@/shared/api/contract';
import { connectGameSocket, type SocketMessage } from '@/features/flight/game-socket';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { levelsPassedAt } from '@/shared/lib/crash-math';
import { soundManager } from '@/shared/lib/sound-manager';

interface SocketFlightCallbacks {
  onLevel: (level: number) => void;
  onBooster: () => void;
  onCrash: (message: SocketMessage) => void;
  onCashout: (message: SocketMessage) => void;
}

export function useSocketFlight(round: RoundStart | null, callbacks: SocketFlightCallbacks) {
  // Обновляет состояние полёта по серверным тикам
  const snapshot = useRef<FlightSnapshot>({
    multiplier: 1,
    progress: 0,
    levelsPassed: 0,
    boosterActivated: false,
    crashed: false,
  });
  const handlers = useRef(callbacks);
  handlers.current = callbacks;

  const getSnapshot = useCallback(() => snapshot.current, []);

  useEffect(() => {
    if (!round) return undefined;

    snapshot.current = {
      multiplier: 1,
      progress: 0,
      levelsPassed: 0,
      boosterActivated: false,
      crashed: false,
    };

    const disconnect = connectGameSocket((message) => {
      const state = snapshot.current;

      if (message.type === 'TICK' && typeof message.multiplier === 'number') {
        state.multiplier = message.multiplier;
        const passed = levelsPassedAt(message.multiplier, round.levelMultipliers);
        if (passed > state.levelsPassed) {
          for (let level = state.levelsPassed + 1; level <= passed; level += 1) {
            handlers.current.onLevel(level);
            soundManager.play('level-up', 0.5);
          }
          state.levelsPassed = passed;
        }
        state.progress = progressFor(message.multiplier, round.levelMultipliers);
        return;
      }

      if (message.type === 'BOOSTER_ACTIVATED') {
        state.boosterActivated = true;
        handlers.current.onBooster();
        soundManager.play('boost', 0.7);
        return;
      }

      if (message.type === 'CASHOUT') {
        handlers.current.onCashout(message);
        return;
      }

      if (message.type === 'CRASHED') {
        state.crashed = true;
        if (typeof message.crashMultiplier === 'number') {
          state.multiplier = message.crashMultiplier;
          state.progress = progressFor(message.crashMultiplier, round.levelMultipliers);
        }
        soundManager.play('crash', 0.8);
        handlers.current.onCrash(message);
      }
    });

    return disconnect;
  }, [round]);

  return { getSnapshot };
}

function progressFor(multiplier: number, levels: readonly number[]): number {
  if (levels.length === 0) return 0;
  const slot = 1 / (levels.length + 1);

  for (let index = 0; index < levels.length; index += 1) {
    const top = levels[index] ?? 1;
    if (multiplier < top) {
      const bottom = index === 0 ? 1 : (levels[index - 1] ?? 1);
      const span = Math.log(top) - Math.log(bottom);
      const ratio = span > 0 ? (Math.log(multiplier) - Math.log(bottom)) / span : 0;
      return Math.min((index + Math.max(ratio, 0)) * slot, 1);
    }
  }
  return Math.min(levels.length * slot + slot * 0.5, 1);
}
