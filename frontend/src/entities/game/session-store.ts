// Глобальное состояние сессии: пользователь, выбранная тема и параметры ставки

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoosterTier, Theme, User } from '@/shared/api/contract';

interface SessionState {
  user: User | null;
  theme: Theme;
  betCost: number;
  boosterTier: BoosterTier;
  onboardingSeen: boolean;
  setUser: (user: User | null) => void;
  setTheme: (theme: Theme) => void;
  setBet: (betCost: number, boosterTier: BoosterTier) => void;
  markOnboardingSeen: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'green',
      betCost: 0,
      boosterTier: 1,
      onboardingSeen: false,
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setBet: (betCost, boosterTier) => set({ betCost, boosterTier }),
      markOnboardingSeen: () => set({ onboardingSeen: true }),
    }),
    { name: 'balloon.session' },
  ),
);
