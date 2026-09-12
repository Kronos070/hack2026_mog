// Очередь недавно полученных достижений для показа уведомления
import { create } from 'zustand';
import type { Achievement } from '@/shared/api/contract';

interface AchievementState {
  queue: Achievement[];
  push: (items: Achievement[]) => void;
  clear: () => void;
}

export const useAchievementStore = create<AchievementState>()((set) => ({
  queue: [],
  push: (items) => set((state) => ({ queue: [...state.queue, ...items] })),
  clear: () => set({ queue: [] }),
}));
