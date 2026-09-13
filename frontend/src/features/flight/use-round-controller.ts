// Управление раундом на едином экране: старт, cashout и завершение без смены страницы

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import type { BoosterTier, Theme } from '@/shared/api/contract';
import { useRoundStore } from '@/entities/game/round-store';
import { useSessionStore } from '@/entities/game/session-store';
import { useAchievementStore } from '@/entities/game/achievement-store';
import { useFlightEngine } from '@/features/flight/use-flight-engine';
import { useSocketFlight } from '@/features/flight/use-socket-flight';
import { ensureGameSocketConnected, type SocketMessage } from '@/features/flight/game-socket';
import { buildRoundResult } from '@/features/flight/build-round-result';
import { soundManager } from '@/shared/lib/sound-manager';

export function useRoundController() {
  // Держит весь игровой цикл в одном экране, переключая фазы
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  const pushAchievements = useAchievementStore((state) => state.push);
  const { phase, round, result, startRound, finishRound, resetToIdle } = useRoundStore();

  const [canCashout, setCanCashout] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [boosterHit, setBoosterHit] = useState(false);
  const [starting, setStarting] = useState(false);
  const boosterRef = useRef(false);
  const cashoutRef = useRef<number | null>(null);

  const { data: config } = useQuery({ queryKey: ['config'], queryFn: () => api.getConfig() });

  useEffect(() => {
    if (!api.isMock) {
      ensureGameSocketConnected();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await api.getCurrentUser();
    if (fresh) setUser(fresh);
  }, [setUser]);

  const handleLevel = useCallback((level: number) => {
    // Разблокировка вывода после преодоления 1-го уровня по CASE.md
    if (level >= 1) {
      setCanCashout(true);
    }
  }, []);

  const handleBooster = useCallback(() => {
    boosterRef.current = true;
    setBoosterHit(true);
    toast.success('Бустер активирован!');
  }, []);

  const handleCrash = useCallback(() => {
    void api
      .finishRound(boosterRef.current)
      .then(async (roundResult) => {
        finishRound(roundResult);
        if (roundResult.unlockedAchievements.length > 0) {
          pushAchievements(roundResult.unlockedAchievements);
        }
        await refreshUser();
        void queryClient.invalidateQueries({ queryKey: ['history'] });
        void queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .catch(() => toast.error('Ошибка завершения раунда'));
  }, [finishRound, refreshUser, queryClient, pushAchievements]);

  const handleSocketCrash = useCallback(
    (message: SocketMessage) => {
      const active = useRoundStore.getState().round;
      if (!active) return;
      const roundResult = buildRoundResult(active, message, cashoutRef.current);
      finishRound(roundResult);
      if (roundResult.unlockedAchievements.length > 0) {
        pushAchievements(roundResult.unlockedAchievements);
      }
      void refreshUser();
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    [finishRound, refreshUser, queryClient, pushAchievements],
  );

  const handleSocketCashout = useCallback(
    (message: SocketMessage) => {
      if (typeof message.multiplier === 'number') cashoutRef.current = message.multiplier;
      if (message.unlockedAchievements && message.unlockedAchievements.length > 0) {
        pushAchievements(message.unlockedAchievements);
      }
    },
    [pushAchievements],
  );

  const localFlight = useFlightEngine(api.isMock ? round : null, config, {
    onLevel: handleLevel,
    onBooster: handleBooster,
    onCrash: handleCrash,
  });

  const socketFlight = useSocketFlight(api.isMock ? null : round, {
    onLevel: handleLevel,
    onBooster: handleBooster,
    onCrash: handleSocketCrash,
    onCashout: handleSocketCashout,
  });

  const getSnapshot = api.isMock ? localFlight.getSnapshot : socketFlight.getSnapshot;
  const markCashout = api.isMock ? localFlight.markCashout : socketFlight.markCashout;

  const start = useCallback(
    async (theme: Theme, cost: number, boosterTier: BoosterTier): Promise<void> => {
      setStarting(true);
      soundManager.play('select', 0.6);
      try {
        const started = await api.startRound({ theme, cost, boosterTier });
        setCanCashout(false);
        setCashedOut(false);
        setBoosterHit(false);
        boosterRef.current = false;
        cashoutRef.current = null;
        startRound(started);
        void refreshUser();
        void queryClient.invalidateQueries({ queryKey: ['profile'] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Не удалось начать раунд');
      } finally {
        setStarting(false);
      }
    },
    [startRound, refreshUser, queryClient],
  );

  const cashout = useCallback(async (): Promise<void> => {
    if (cashedOut || !canCashout) return;
    const { multiplier } = getSnapshot();
    markCashout();
    setCashedOut(true);
    try {
      const payout = await api.cashout(multiplier, boosterRef.current, round?.roundId);
      cashoutRef.current = payout.multiplier;
      soundManager.play('cashout', 0.8);
      toast.success(`Забрано ${payout.payout} бонусов · могли бы забрать больше`);
    } catch {
      toast.error('Не удалось зафиксировать выигрыш');
    }
  }, [cashedOut, canCashout, getSnapshot, markCashout, round]);

  return {
    phase,
    round,
    result,
    config,
    getSnapshot,
    canCashout,
    cashedOut,
    boosterHit,
    starting,
    start,
    cashout,
    playAgain: resetToIdle,
  };
}
