// Глобальное состояние сессии: пользователь, выбранная тема и параметры ставки

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoosterTier, Theme, User } from '@/shared/api/contract';

interface SessionState {
  user: User | null;
  theme: Theme;
  betCost: number;
  boosterTier: BoosterTier;
  lastBet: { cost: number; tier: BoosterTier } | null;
  autoCashout2x: boolean;
  onboardingSeen: boolean;
  setUser: (user: User | null) => void;
  setTheme: (theme: Theme) => void;
  setBet: (betCost: number, boosterTier: BoosterTier) => void;
  rememberBet: (cost: number, tier: BoosterTier) => void;
  toggleAutoCashout2x: () => void;
  markOnboardingSeen: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'red',
      betCost: 0,
      boosterTier: 1,
      lastBet: null,
      autoCashout2x: false,
      onboardingSeen: false,
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setBet: (betCost, boosterTier) => set({ betCost, boosterTier }),
      rememberBet: (cost, tier) => set({ lastBet: { cost, tier } }),
      toggleAutoCashout2x: () => set((state) => ({ autoCashout2x: !state.autoCashout2x })),
      markOnboardingSeen: () => set({ onboardingSeen: true }),
    }),
    { name: 'balloon.session', version: 3 },
  ),
);
