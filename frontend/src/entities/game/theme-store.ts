// Состояние оформления интерфейса: светлая или тёмная тема
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColorScheme = 'light' | 'dark';

interface ThemeState {
  scheme: ColorScheme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      scheme: 'light',
      toggle: () => set((state) => ({ scheme: state.scheme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'balloon.theme' },
  ),
);
