// Единая точка доступа к данным: полнофункциональная интеграция REST API бэкенда с мок-фолбэком

import type {
  Achievement,
  BetRequest,
  CashoutResult,
  ChangePasswordRequest,
  GameConfig,
  GameRoundState,
  HistoryEntry,
  LeaderboardEntry,
  PingResponse,
  PlayerHouseEdge,
  Profile,
  Reward,
  RoundResult,
  RoundStart,
  StatRadar,
  TopUpResponse,
  Tournament,
  TournamentHistoryItem,
  TournamentSettlementResult,
  UpdateProfileRequest,
  User,
} from '@/shared/api/contract';
import {
  gameConfigSchema,
  gameRoundStateSchema,
  leaderboardEntrySchema,
  pingSchema,
  playerHouseEdgeSchema,
  profileSchema,
  statRadarSchema,
  topUpResponseSchema,
  tournamentHistoryItemSchema,
  tournamentSchema,
  tournamentSettlementResultSchema,
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
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export const api = {
  isMock: USE_MOCK,

  /**
   * Healthcheck бэкенда
   */
  async ping(): Promise<PingResponse> {
    if (USE_MOCK) {
      return { status: 'OK', timestamp: new Date().toISOString(), message: 'Mock backend' };
    }
    const { data } = await http.get('/ping');
    return pingSchema.parse(data);
  },

  /**
   * Аутентификация по логину/email и паролю
   */
  async login(credentials: Credentials): Promise<User> {
    if (USE_MOCK) return mock.mockLogin(credentials.login);
    const { data } = await http.post('/auth/login', credentials);
    const parsed = authResponseSchema.parse(data);
    saveToken(parsed.token);
    return toUser(parsed.user);
  },

  /**
   * Регистрация нового игрока (+1000 стартовых бонусов)
   */
  async register(form: RegisterData): Promise<User> {
    if (USE_MOCK) return mock.mockLogin('user');
    const { data } = await http.post('/auth/register', {
      username: form.username,
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      avatarUrl: form.avatarUrl,
    });
    const parsed = authResponseSchema.parse(data);
    saveToken(parsed.token);
    return toUser(parsed.user);
  },

  /**
   * Получение данных текущего авторизованного пользователя
   */
  async getCurrentUser(): Promise<User | null> {
    if (USE_MOCK) return mock.mockGetCurrentUser();
    try {
      const { data } = await http.get('/auth/me');
      return toUser(backendUserSchema.parse(data));
    } catch {
      return null;
    }
  },

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    if (USE_MOCK) return mock.mockLogout();
    clearToken();
  },

  /**
   * Запуск раунда (списание ставки, генерация Provably Fair)
   */
  async startRound(request: BetRequest): Promise<RoundStart> {
    if (USE_MOCK) return mock.mockStartRound(request);
    const { data } = await http.post('/game/start', {
      theme: request.theme,
      cost: request.cost,
      boosterTier: request.boosterTier,
    });
    const parsed = roundStartResponseSchema.parse(data);
    let config = DEFAULT_CONFIG;
    try {
      config = await api.getConfig();
    } catch {
      // Использовать эталонный конфиг при сбое
    }
    return toRoundStart(parsed, request.theme, buildLevelMultipliers(request.theme, config));
  },

  /**
   * Фиксация выигрыша (Cashout)
   */
  async cashout(
    multiplier: number,
    boosterActivated: boolean,
    roundId?: string,
  ): Promise<CashoutResult & { reward?: Reward | null; unlockedAchievements?: Achievement[] }> {
    if (USE_MOCK) return mock.mockCashout(multiplier, boosterActivated);
    const { data } = await http.post('/game/cashout', { roundId });
    const parsed = cashoutResponseSchema.parse(data);
    return {
      roundId: parsed.roundId,
      multiplier: parsed.multiplier,
      payout: parsed.winAmount,
      balance: parsed.newBalance,
      reward: parsed.reward ?? null,
      unlockedAchievements: parsed.unlockedAchievements ?? [],
    };
  },

  /**
   * Завершение раунда (для мок-режима)
   */
  async finishRound(boosterActivated: boolean): Promise<RoundResult> {
    return mock.mockFinishRound(boosterActivated);
  },

  /**
   * Опрос текущего состояния активного раунда
   */
  async getRoundState(roundId?: string): Promise<GameRoundState> {
    if (USE_MOCK) {
      return {
        roundId: roundId ?? null,
        status: 'NO_ACTIVE_ROUND',
        isCrashed: false,
        currentMultiplier: 1.0,
        crashMultiplier: null,
        elapsedMs: 0,
        potentialWin: 0,
        startTime: null,
        levelsPassed: 0,
        pointsEarned: 0,
        boosterActivated: false,
      };
    }
    const { data } = await http.get('/game/state', {
      params: roundId ? { roundId } : undefined,
    });
    return gameRoundStateSchema.parse(data);
  },

  /**
   * История раундов (глобальная или персональная ?my=true)
   */
  async getHistory(options?: { my?: boolean; limit?: number }): Promise<HistoryEntry[]> {
    if (USE_MOCK) return mock.mockGetHistory();
    const { data } = await http.get('/game/history', {
      params: {
        my: options?.my ?? false,
        limit: options?.limit ?? 20,
      },
    });
    const rows = Array.isArray(data) ? data : ((data as { items?: unknown[] }).items ?? []);
    return historyItemSchema.array().parse(rows).map(toHistoryEntry);
  },

  /**
   * House Edge, RTP и EV текущего игрока
   */
  async getHouseEdge(): Promise<PlayerHouseEdge> {
    if (USE_MOCK) {
      return {
        userId: 1,
        currentHouseEdge: 0.04,
        rtp: 0.96,
        expectedValue: -0.04,
        lastBetAmount: 100,
      };
    }
    const { data } = await http.get('/game/house-edge');
    return playerHouseEdgeSchema.parse(data);
  },

  /**
   * Сброс персонального House Edge игрока к базовому значению 0.04
   */
  async resetHouseEdge(): Promise<PlayerHouseEdge> {
    if (USE_MOCK) {
      return {
        userId: 1,
        currentHouseEdge: 0.04,
        rtp: 0.96,
        expectedValue: -0.04,
        lastBetAmount: null,
      };
    }
    const { data } = await http.post('/game/house-edge/reset');
    return playerHouseEdgeSchema.parse(data);
  },

  /**
   * Полный профиль игрока со всеми данными мета-игры (пазлы, ранг, ачивки, статистика)
   */
  async getProfile(playerId?: string): Promise<Profile> {
    if (USE_MOCK) return mock.mockGetProfile(playerId);
    const { data } = await http.get(playerId ? `/users/${playerId}` : '/users/me');
    return profileSchema.parse(data);
  },

  /**
   * Полигон характеристик (шестиугольник Dota 2 style: выдержка, бустеры, коллекционер, щедрость, винрейт, риск)
   */
  async getRadarStats(playerId?: string): Promise<StatRadar> {
    if (USE_MOCK) {
      return {
        patience: 6.5,
        boosters: 8.0,
        collector: 4.5,
        generosity: 7.0,
        winRate: 6.0,
        risk: 7.5,
        gamesAnalyzed: 15,
        totalGames: 15,
        nextRecalcIn: 5,
      };
    }
    const { data } = await http.get(playerId ? `/users/${playerId}/radar-stats` : '/users/me/radar-stats');
    return statRadarSchema.parse(data);
  },

  /**
   * Обновление данных профиля (имя, email, аватар)
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<User> {
    if (USE_MOCK) {
      const current = mock.mockGetCurrentUser();
      if (!current) throw new Error('Пользователь не найден');
      return current;
    }
    const { data } = await http.put('/users/me', updates);
    return toUser(backendUserSchema.parse(data));
  },

  /**
   * Смена пароля
   */
  async changePassword(req: ChangePasswordRequest): Promise<{ message: string }> {
    if (USE_MOCK) return { message: 'Пароль успешно изменен' };
    const { data } = await http.put('/users/me/password', req);
    return data as { message: string };
  },

  /**
   * Удаление собственного аккаунта
   */
  async deleteAccount(): Promise<void> {
    if (USE_MOCK) {
      mock.mockLogout();
      return;
    }
    await http.delete('/users/me');
    clearToken();
  },

  /**
   * Быстрое пополнение бонусного баланса (Top-Up)
   */
  async topUp(amount?: number, playerId?: string): Promise<TopUpResponse> {
    if (USE_MOCK) {
      const state = mock.mockGetCurrentUser();
      const added = amount ?? 1000;
      const newBalance = (state?.balance ?? 0) + added;
      return {
        userId: 1,
        username: state?.name ?? 'user',
        addedAmount: added,
        newBalance,
      };
    }
    const path = playerId ? `/users/${playerId}/top-up` : '/users/me/top-up';
    const { data } = await http.post(path, amount ? { amount } : {});
    return topUpResponseSchema.parse(data);
  },

  /**
   * Получение актуальной конфигурации игры
   */
  async getConfig(): Promise<GameConfig> {
    if (USE_MOCK) return gameConfigSchema.parse(mock.mockGetConfig());
    const { data } = await http.get('/admin/config');
    return gameConfigSchema.parse(data);
  },

  /**
   * Горячее сохранение конфигурации игры (Hot-Reload, ADMIN)
   */
  async saveConfig(config: GameConfig): Promise<GameConfig> {
    if (USE_MOCK) return gameConfigSchema.parse(mock.mockSaveConfig(config));
    const { data } = await http.put('/admin/config', config);
    return gameConfigSchema.parse(data);
  },

  /**
   * Сброс параметров игры к эталонным настройкам по умолчанию (ADMIN)
   */
  async resetConfig(): Promise<GameConfig> {
    if (USE_MOCK) return DEFAULT_CONFIG;
    const { data } = await http.post('/admin/config/reset');
    return gameConfigSchema.parse(data);
  },

  /**
   * Компактный рейтинг лидеров лидерборда
   */
  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    if (USE_MOCK) return leaderboardEntrySchema.array().parse(mock.mockGetLeaderboard());
    const { data } = await http.get('/tournament/leaderboard', { params: { limit } });
    return leaderboardEntrySchema.array().parse(data);
  },

  /**
   * Полная турнирная таблица с таймером и призами топ-3
   */
  async getTournament(): Promise<Tournament> {
    if (USE_MOCK) return tournamentSchema.parse(mock.mockGetTournament());
    const { data } = await http.get('/tournament');
    return tournamentSchema.parse(data);
  },

  /**
   * Финализация турнира, начисление призов топ-3 и сброс таблицы
   */
  async settleTournament(force = false): Promise<TournamentSettlementResult> {
    if (USE_MOCK) {
      return {
        status: 'SUCCESS',
        tournamentTitle: 'Гран-при Воздухоплавателей Столото',
        settledAt: Date.now(),
        rewardedPlayersCount: 3,
        totalPrizesAwarded: 5000,
        winners: [],
        message: 'Турнир успешно финализирован!',
      };
    }
    const { data } = await http.post('/tournament/settle', {}, { params: { force } });
    return tournamentSettlementResultSchema.parse(data);
  },

  /**
   * Архив завершенных турниров и начисленных наград
   */
  async getTournamentHistory(options?: { my?: boolean; limit?: number }): Promise<TournamentHistoryItem[]> {
    if (USE_MOCK) return [];
    const { data } = await http.get('/tournament/history', {
      params: {
        my: options?.my ?? false,
        limit: options?.limit ?? 20,
      },
    });
    return tournamentHistoryItemSchema.array().parse(data);
  },
};
