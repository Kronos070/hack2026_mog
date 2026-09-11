// Персистентное состояние мок-бэкенда в localStorage (баланс, история, конфиг, пазл)

import type { GameConfig, HistoryEntry, LeaderboardEntry, User } from '@/shared/api/contract';
import { DEFAULT_CONFIG } from '@/shared/config/default-config';

const STORAGE_KEY = 'balloon.mock.state';

export interface MockState {
  users: Record<string, User>;
  currentUserId: string | null;
  config: GameConfig;
  history: HistoryEntry[];
  leaderboard: LeaderboardEntry[];
  puzzle: string[];
  upsellShown: boolean;
}

const BOTS: LeaderboardEntry[] = [
  { playerId: 'bot-1', playerName: 'Алина', points: 320 },
  { playerId: 'bot-2', playerName: 'Марк', points: 285 },
  { playerId: 'bot-3', playerName: 'Соня', points: 240 },
  { playerId: 'bot-4', playerName: 'Тимур', points: 190 },
  { playerId: 'bot-5', playerName: 'Вера', points: 145 },
];

function createInitialState(): MockState {
  return {
    users: {
      user: { id: 'user', name: 'Тестовый игрок', role: 'user', balance: 1000, points: 0 },
      admin: { id: 'admin', name: 'Администратор', role: 'admin', balance: 5000, points: 0 },
    },
    currentUserId: null,
    config: DEFAULT_CONFIG,
    history: [],
    leaderboard: BOTS,
    puzzle: [],
    upsellShown: false,
  };
}

export function readState(): MockState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<MockState>;
    return { ...createInitialState(), ...parsed };
  } catch {
    return createInitialState();
  }
}

export function writeState(state: MockState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Квота localStorage исчерпана — состояние остаётся только в памяти
  }
}

export function updateState(mutate: (state: MockState) => void): MockState {
  const state = readState();
  mutate(state);
  writeState(state);
  return state;
}

export function resetState(): void {
  writeState(createInitialState());
}
