// Единая точка подмены источника данных: мок-бэкенд или реальный Java-сервис

import axios from 'axios';
import type {
  BetRequest,
  CashoutResult,
  GameConfig,
  HistoryEntry,
  LeaderboardEntry,
  RoundResult,
  RoundStart,
  User,
} from '@/shared/api/contract';
import {
  cashoutResultSchema,
  gameConfigSchema,
  historyEntrySchema,
  leaderboardEntrySchema,
  roundResultSchema,
  roundStartSchema,
  userSchema,
} from '@/shared/api/contract';
import * as mock from '@/shared/api/mock-server';

const USE_MOCK = import.meta.env['VITE_API_MODE'] !== 'real';

const http = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? '/api',
  withCredentials: true,
});

export const api = {
  async login(userId: string): Promise<User> {
    if (USE_MOCK) return mock.mockLogin(userId);
    const { data } = await http.post('/auth/login', { userId });
    return userSchema.parse(data);
  },

  async getCurrentUser(): Promise<User | null> {
    if (USE_MOCK) return mock.mockGetCurrentUser();
    const { data } = await http.get('/auth/me');
    return data ? userSchema.parse(data) : null;
  },

  async logout(): Promise<void> {
    if (USE_MOCK) return mock.mockLogout();
    await http.post('/auth/logout');
  },

  async getConfig(): Promise<GameConfig> {
    if (USE_MOCK) return mock.mockGetConfig();
    const { data } = await http.get('/admin/config');
    return gameConfigSchema.parse(data);
  },

  async saveConfig(config: GameConfig): Promise<GameConfig> {
    if (USE_MOCK) return mock.mockSaveConfig(config);
    const { data } = await http.put('/admin/config', config);
    return gameConfigSchema.parse(data);
  },

  async getHistory(): Promise<HistoryEntry[]> {
    if (USE_MOCK) return mock.mockGetHistory();
    const { data } = await http.get('/rounds/history');
    return historyEntrySchema.array().parse(data);
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (USE_MOCK) return mock.mockGetLeaderboard();
    const { data } = await http.get('/tournament/leaderboard');
    return leaderboardEntrySchema.array().parse(data);
  },

  async startRound(request: BetRequest): Promise<RoundStart> {
    if (USE_MOCK) return mock.mockStartRound(request);
    const { data } = await http.post('/rounds', request);
    return roundStartSchema.parse(data);
  },

  async cashout(multiplier: number, boosterActivated: boolean): Promise<CashoutResult> {
    if (USE_MOCK) return mock.mockCashout(multiplier, boosterActivated);
    const { data } = await http.post('/rounds/cashout', { multiplier, boosterActivated });
    return cashoutResultSchema.parse(data);
  },

  async finishRound(boosterActivated: boolean): Promise<RoundResult> {
    if (USE_MOCK) return mock.mockFinishRound(boosterActivated);
    const { data } = await http.post('/rounds/finish', { boosterActivated });
    return roundResultSchema.parse(data);
  },
};
