// Приём полёта по WebSocket с клиентским сглаживанием (Client-Side Prediction)

import { useCallback, useEffect, useRef } from 'react';
import type { RoundStart } from '@/shared/api/contract';
import {
  connectGameSocket,
  getBufferedGameMessages,
  type SocketMessage,
} from '@/features/flight/game-socket';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { levelsPassedAt, progressInLevels } from '@/shared/lib/crash-math';
import { soundManager } from '@/shared/lib/sound-manager';

interface SocketFlightCallbacks {
  onLevel: (level: number) => void;
  onBooster: () => void;
  onCrash: (message: SocketMessage) => void;
  onCashout: (message: SocketMessage) => void;
  onTick?: (multiplier: number) => void;
}

export function useSocketFlight(round: RoundStart | null, callbacks: SocketFlightCallbacks) {
  // Обновляет состояние полёта по серверным тикам с интерполяцией и клиентским предсказанием
  const snapshot = useRef<FlightSnapshot>({
    multiplier: 1,
    baseMultiplier: 1,
    progress: 0,
    levelsPassed: 0,
    boosterActivated: false,
    cashedOut: false,
    crashed: false,
  });
  const handlers = useRef(callbacks);
  useEffect(() => {
    handlers.current = callbacks;
  });

  const getSnapshot = useCallback(() => snapshot.current, []);

  const markCashout = useCallback(() => {
    snapshot.current.cashedOut = true;
    soundManager.stopFlightSound();
  }, []);

  useEffect(() => {
    if (!round) return undefined;

    snapshot.current = {
      multiplier: 1,
      baseMultiplier: 1,
      progress: 0,
      levelsPassed: 0,
      boosterActivated: false,
      cashedOut: false,
      crashed: false,
    };

    let targetMultiplier = 1;
    let currentMultiplier = 1;
    let boosterFactor = 1;
    let hasReceivedServerTick = false;
    let animationFrameId = 0;
    let isFinished = false;
    const clientStartTime = performance.now();
    soundManager.startFlightSound();

    // Цикл клиентского предсказания (60 FPS через rAF):
    // шарик плавно взлетает с первой миллисекунды, не дожидаясь пинга первого тика
    const loop = (): void => {
      if (isFinished) return;

      const state = snapshot.current;
      if (state.crashed) return;

      if (!hasReceivedServerTick) {
        // До прихода первого тика рассчитываем множитель по формуле сервера M(t) = e^(k * t)
        // Используем монотонное время клиента с момента старта раунда, исключая расхождения системных часов
        const elapsedSec = Math.max(0, (performance.now() - clientStartTime) / 1000);
        targetMultiplier = Math.max(1, Math.exp(round.growthRate * elapsedSec));
      }

      // Плавное сглаживание к целевому множителю (lerp)
      const diff = targetMultiplier - currentMultiplier;
      if (diff > 0.001) {
        currentMultiplier = Math.min(targetMultiplier, currentMultiplier + Math.max(diff * 0.4, 0.005));
      } else if (diff < -0.001) {
        currentMultiplier = Math.max(targetMultiplier, currentMultiplier - 0.05);
      } else {
        currentMultiplier = targetMultiplier;
      }

      const displayMultiplier = Math.round(currentMultiplier * 100) / 100;
      const baseMultiplier = Math.round((displayMultiplier / boosterFactor) * 100) / 100;
      state.multiplier = displayMultiplier;
      state.baseMultiplier = baseMultiplier;

      // Проверка прохождения уровней (по актуальному множителю полета шара)
      const passed = levelsPassedAt(displayMultiplier, round.levelMultipliers);
      if (passed > state.levelsPassed) {
        for (let level = state.levelsPassed + 1; level <= passed; level += 1) {
          handlers.current.onLevel(level);

          // Звуки x2, x3, x4... воспроизводятся при пересечении линий игрового поля
          if (level >= 2 && (passed - state.levelsPassed <= 1 || level === passed)) {
            soundManager.playMultiplier(level);
          }
        }
        state.levelsPassed = passed;
      }

      // Высота и прогресс шара определяются фактическим множителем (при бустере шар устремляется вверх)
      state.progress = progressInLevels(displayMultiplier, round.levelMultipliers);

      handlers.current.onTick?.(displayMultiplier);

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    const handleMessage = (message: SocketMessage): void => {
      // Игнорируем сообщения, относящиеся к другому раунду
      if (message.roundId && message.roundId !== round.roundId) {
        return;
      }

      const state = snapshot.current;

      if (message.type === 'TICK' && typeof message.multiplier === 'number') {
        hasReceivedServerTick = true;
        targetMultiplier = message.multiplier;
        return;
      }

      if (message.type === 'BOOSTER_ACTIVATED') {
        state.boosterActivated = true;
        const mult = message.boosterMultiplier ?? round.boosterMultiplier ?? 2;
        boosterFactor = mult;
        if (typeof message.multiplier === 'number') {
          targetMultiplier = Math.max(targetMultiplier, message.multiplier);
        } else {
          targetMultiplier = Math.max(targetMultiplier, currentMultiplier * mult);
        }
        handlers.current.onBooster();
        soundManager.play('boost', 0.7);
        return;
      }

      if (message.type === 'CASHOUT') {
        state.cashedOut = true;
        soundManager.stopFlightSound();
        handlers.current.onCashout(message);
        return;
      }

      if (message.type === 'CRASHED') {
        isFinished = true;
        cancelAnimationFrame(animationFrameId);
        soundManager.stopFlightSound();

        state.crashed = true;
        const crashMult = typeof message.crashMultiplier === 'number'
          ? message.crashMultiplier
          : targetMultiplier;

        const finalBase = boosterFactor > 1
          ? Math.round((crashMult / boosterFactor) * 100) / 100
          : crashMult;

        state.multiplier = crashMult;
        state.baseMultiplier = finalBase;
        state.progress = progressInLevels(crashMult, round.levelMultipliers);

        soundManager.play('crash', 0.8);
        handlers.current.onCrash(message);
      }
    };

    // Воспроизводим ранее пришедшие буферизованные сообщения (например, мгновенный крах пришел до монтирования эффекта)
    const buffered = getBufferedGameMessages(round.roundId);
    for (const msg of buffered) {
      handleMessage(msg);
    }

    const unsubscribe = connectGameSocket(handleMessage);

    return () => {
      isFinished = true;
      cancelAnimationFrame(animationFrameId);
      soundManager.stopFlightSound();
      unsubscribe();
    };
  }, [round]);

  return { getSnapshot, markCashout };
}
