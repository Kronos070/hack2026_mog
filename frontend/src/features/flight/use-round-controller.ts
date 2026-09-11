// Управление раундом на едином экране: старт, cashout и завершение без смены страницы

import { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import type { BoosterTier, Theme } from '@/shared/api/contract';
import { useRoundStore } from '@/entities/game/round-store';
import { useSessionStore } from '@/entities/game/session-store';
import { useFlightEngine } from '@/features/flight/use-flight-engine';
import { soundManager } from '@/shared/lib/sound-manager';

export function useRoundController() {
  // Держит весь игровой цикл в одном экране, переключая фазы
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  const { phase, round, result, startRound, finishRound, resetToIdle } = useRoundStore();

  const [canCashout, setCanCashout] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [boosterHit, setBoosterHit] = useState(false);
  const [starting, setStarting] = useState(false);
  const boosterRef = useRef(false);

  const { data: config } = useQuery({ queryKey: ['config'], queryFn: () => api.getConfig() });

  const refreshUser = useCallback(async () => {
    const fresh = await api.getCurrentUser();
    if (fresh) setUser(fresh);
  }, [setUser]);

  const handleLevel = useCallback((level: number) => {
    if (level >= 1) setCanCashout(true);
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
        await refreshUser();
        void queryClient.invalidateQueries({ queryKey: ['history'] });
      })
      .catch(() => toast.error('Ошибка завершения раунда'));
  }, [finishRound, refreshUser, queryClient]);

  const { getSnapshot, markCashout } = useFlightEngine(round, config, {
    onLevel: handleLevel,
    onBooster: handleBooster,
    onCrash: handleCrash,
  });

  const start = useCallback(
    async (theme: Theme, cost: number, boosterTier: BoosterTier): Promise<void> => {
      setStarting(true);
      try {
        const started = await api.startRound({ theme, cost, boosterTier });
        setCanCashout(false);
        setCashedOut(false);
        setBoosterHit(false);
        boosterRef.current = false;
        startRound(started);
        await refreshUser();
        soundManager.play('select', 0.6);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Не удалось начать раунд');
      } finally {
        setStarting(false);
      }
    },
    [startRound, refreshUser],
  );

  const cashout = useCallback(async (): Promise<void> => {
    if (cashedOut || !canCashout) return;
    const { multiplier } = getSnapshot();
    markCashout();
    setCashedOut(true);
    try {
      const payout = await api.cashout(multiplier, boosterRef.current);
      soundManager.play('cashout', 0.8);
      toast.success(`Забрано ${payout.payout} бонусов · могли бы забрать больше`);
    } catch {
      toast.error('Не удалось зафиксировать выигрыш');
    }
  }, [cashedOut, canCashout, getSnapshot, markCashout]);

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
