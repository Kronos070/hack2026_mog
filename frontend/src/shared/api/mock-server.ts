// Мок-бэкенд: авторитетная генерация раундов и расчёт выигрыша до появления Java-сервиса

import type { GameConfig, HistoryEntry, LeaderboardEntry, User } from '@/shared/api/contract';
import { readState, updateState } from '@/shared/api/mock-store';

export { mockStartRound, mockCashout, mockFinishRound } from '@/shared/api/mock-rounds';

export function mockLogin(userId: string): User {
  const state = updateState((draft) => {
    draft.currentUserId = userId;
  });
  const user = state.users[userId];
  if (!user) throw new Error('Пользователь не найден');
  return user;
}

export function mockGetCurrentUser(): User | null {
  const state = readState();
  if (!state.currentUserId) return null;
  return state.users[state.currentUserId] ?? null;
}

export function mockLogout(): void {
  updateState((draft) => {
    draft.currentUserId = null;
    draft.upsellShown = false;
  });
}

export function mockGetConfig(): GameConfig {
  return readState().config;
}

export function mockSaveConfig(config: GameConfig): GameConfig {
  updateState((draft) => {
    draft.config = config;
  });
  return config;
}

export function mockGetHistory(): HistoryEntry[] {
  return readState().history.slice(0, 20);
}

export function mockGetLeaderboard(): LeaderboardEntry[] {
  const state = readState();
  const current = state.currentUserId ? state.users[state.currentUserId] : null;
  const entries = [...state.leaderboard];
  if (current) {
    entries.push({ playerId: current.id, playerName: current.name, points: current.points });
  }
  return entries.sort((left, right) => right.points - left.points);
}

