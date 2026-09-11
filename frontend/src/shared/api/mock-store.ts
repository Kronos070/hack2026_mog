// Персистентное состояние мок-бэкенда в localStorage (баланс, история, конфиг, пазл)

import type { GameConfig, HistoryEntry, LeaderboardEntry, User } from '@/shared/api/contract';
import { DEFAULT_CONFIG } from '@/shared/config/default-config';

const STORAGE_KEY = 'balloon.mock.state';

export interface PlayerStats {
  roundsPlayed: number;
  roundsWon: number;
  bestMultiplier: number;
  totalWagered: number;
  totalPayout: number;
  boostersActivated: number;
  maxBet: number;
}

export interface BotProfile {
  id: string;
  name: string;
  points: number;
  stats: PlayerStats;
  achievements: string[];
  puzzleSize: number;
}

export interface MockState {
  users: Record<string, User>;
  currentUserId: string | null;
  config: GameConfig;
  history: HistoryEntry[];
  leaderboard: LeaderboardEntry[];
  puzzle: string[];
  upsellShown: boolean;
  stats: PlayerStats;
  unlocked: Record<string, number>;
}

export const EMPTY_STATS: PlayerStats = {
  roundsPlayed: 0,
  roundsWon: 0,
  bestMultiplier: 0,
  totalWagered: 0,
  totalPayout: 0,
  boostersActivated: 0,
  maxBet: 0,
};

export const BOT_PROFILES: readonly BotProfile[] = [
  {
    id: 'bot-1',
    name: 'Алина',
    points: 320,
    stats: { roundsPlayed: 48, roundsWon: 21, bestMultiplier: 12.4, totalWagered: 2400, totalPayout: 3180, boostersActivated: 9, maxBet: 250 },
    achievements: ['first-flight', 'first-win', 'high-five', 'sky-ten', 'booster-hit', 'veteran-10', 'high-roller', 'in-profit'],
    puzzleSize: 6,
  },
  {
    id: 'bot-2',
    name: 'Марк',
    points: 285,
    stats: { roundsPlayed: 37, roundsWon: 15, bestMultiplier: 7.8, totalWagered: 1850, totalPayout: 2020, boostersActivated: 6, maxBet: 100 },
    achievements: ['first-flight', 'first-win', 'high-five', 'booster-hit', 'veteran-10', 'in-profit'],
    puzzleSize: 4,
  },
  {
    id: 'bot-3',
    name: 'Соня',
    points: 240,
    stats: { roundsPlayed: 31, roundsWon: 11, bestMultiplier: 4.6, totalWagered: 1550, totalPayout: 1290, boostersActivated: 4, maxBet: 100 },
    achievements: ['first-flight', 'first-win', 'booster-hit', 'veteran-10'],
    puzzleSize: 3,
  },
  {
    id: 'bot-4',
    name: 'Тимур',
    points: 190,
    stats: { roundsPlayed: 22, roundsWon: 8, bestMultiplier: 3.2, totalWagered: 880, totalPayout: 640, boostersActivated: 2, maxBet: 50 },
    achievements: ['first-flight', 'first-win', 'booster-hit', 'veteran-10'],
    puzzleSize: 2,
  },
  {
    id: 'bot-5',
    name: 'Вера',
    points: 145,
    stats: { roundsPlayed: 9, roundsWon: 3, bestMultiplier: 2.1, totalWagered: 320, totalPayout: 210, boostersActivated: 1, maxBet: 50 },
    achievements: ['first-flight', 'first-win', 'booster-hit'],
    puzzleSize: 1,
  },
];

const BOTS: LeaderboardEntry[] = BOT_PROFILES.map((bot) => ({
  playerId: bot.id,
  playerName: bot.name,
  points: bot.points,
}));

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
    stats: { ...EMPTY_STATS },
    unlocked: {},
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
