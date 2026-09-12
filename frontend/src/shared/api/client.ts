// Единая точка доступа к данным: реальный бэкенд там, где он готов, иначе мок

import type {
  BetRequest,
  CashoutResult,
  GameConfig,
  HistoryEntry,
  LeaderboardEntry,
  Profile,
  RoundResult,
  RoundStart,
  Tournament,
  User,
} from '@/shared/api/contract';
import {
  gameConfigSchema,
  leaderboardEntrySchema,
  profileSchema,
  tournamentSchema,
} from '@/shared/api/contract';
import {
  authResponseSchema,
  backendUserSchema,
  cashoutResponseSchema,
  historyItemSchema,
  roundStartResponseSchema,
  toHistoryEntry,
  toRoundStart,
  toUser,
} from '@/shared/api/backend-contract';
import { clearToken, saveToken } from '@/shared/api/auth-token';
import { http, USE_MOCK } from '@/shared/api/http';
import { buildLevelMultipliers } from '@/shared/lib/crash-math';
import { DEFAULT_CONFIG } from '@/shared/config/default-config';
import * as mock from '@/shared/api/mock-server';

export interface Credentials {
  login: string;
  password: string;
}

export interface RegisterData extends Credentials {
  username: string;
  email: string;
}

export const api = {
  isMock: USE_MOCK,

  async login(credentials: Credentials): Promise<User> {
    if (USE_MOCK) return mock.mockLogin(credentials.login);
    const { data } = await http.post('/auth/login', credentials);
    const parsed = authResponseSchema.parse(data);
    saveToken(parsed.token);
    return toUser(parsed.user);
  },

  async register(form: RegisterData): Promise<User> {
    if (USE_MOCK) return mock.mockLogin('user');
    const { data } = await http.post('/auth/register', {
      username: form.username,
      email: form.email,
      password: form.password,
    });
    const parsed = authResponseSchema.parse(data);
    saveToken(parsed.token);
    return toUser(parsed.user);
  },

  async getCurrentUser(): Promise<User | null> {
    if (USE_MOCK) return mock.mockGetCurrentUser();
    try {
      const { data } = await http.get('/auth/me');
      return toUser(backendUserSchema.parse(data));
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    if (USE_MOCK) return mock.mockLogout();
    clearToken();
  },

  async startRound(request: BetRequest): Promise<RoundStart> {
    if (USE_MOCK) return mock.mockStartRound(request);
    const { data } = await http.post('/game/start', {
      theme: request.theme,
      cost: request.cost,
      boosterTier: request.boosterTier,
    });
    const parsed = roundStartResponseSchema.parse(data);
    return toRoundStart(parsed, request.theme, buildLevelMultipliers(request.theme, DEFAULT_CONFIG));
  },

  async cashout(
    multiplier: number,
    boosterActivated: boolean,
    roundId?: string,
  ): Promise<CashoutResult> {
    if (USE_MOCK) return mock.mockCashout(multiplier, boosterActivated);
    const { data } = await http.post('/game/cashout', { roundId });
    const parsed = cashoutResponseSchema.parse(data);
    return {
      roundId: parsed.roundId,
      multiplier: parsed.multiplier,
      payout: parsed.winAmount,
      balance: parsed.newBalance,
    };
  },

  async finishRound(boosterActivated: boolean): Promise<RoundResult> {
    // На реальном бэкенде итоги приходят по WebSocket, отдельного вызова нет
    return mock.mockFinishRound(boosterActivated);
  },

  async getHistory(): Promise<HistoryEntry[]> {
    if (USE_MOCK) return mock.mockGetHistory();
    const { data } = await http.get('/game/history');
    const rows = Array.isArray(data) ? data : ((data as { items?: unknown[] }).items ?? []);
    return historyItemSchema.array().parse(rows).map(toHistoryEntry).slice(0, 20);
  },

  async getProfile(playerId?: string): Promise<Profile> {
    if (USE_MOCK) return mock.mockGetProfile(playerId);
    const { data } = await http.get(playerId ? `/users/${playerId}` : '/users/me');
    const user = toUser(backendUserSchema.parse(data));
    return profileSchema.parse({ ...mock.mockGetProfile(), user });
  },

  // Ниже — то, чего на бэкенде пока нет: работает на моке
  async getConfig(): Promise<GameConfig> {
    return gameConfigSchema.parse(mock.mockGetConfig());
  },

  async saveConfig(config: GameConfig): Promise<GameConfig> {
    return gameConfigSchema.parse(mock.mockSaveConfig(config));
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return leaderboardEntrySchema.array().parse(mock.mockGetLeaderboard());
  },

  async getTournament(): Promise<Tournament> {
    return tournamentSchema.parse(mock.mockGetTournament());
  },
};
