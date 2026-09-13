// Единая точка доступа к данным: реальный бэкенд там, где он готов, иначе мок

import type {
  BetRequest,
  CashoutResult,
  GameConfig,
  HistoryEntry,
  LeaderboardEntry,
  PlayerHouseEdge,
  Profile,
  RoundResult,
  RoundStart,
  StatRadar,
  TopUpResponse,
  Tournament,
  TournamentHistoryItem,
  TournamentSettlement,
  User,
} from '@/shared/api/contract';
import {
  gameConfigSchema,
  leaderboardEntrySchema,
  playerHouseEdgeSchema,
  profileSchema,
  statRadarSchema,
  topUpResponseSchema,
  tournamentHistoryItemSchema,
  tournamentSchema,
  tournamentSettlementSchema,
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
      betAmount: request.cost,
      boosterMultiplier: request.boosterTier,
    });
    const parsed = roundStartResponseSchema.parse(data);
    const config = await this.getConfig().catch(() => DEFAULT_CONFIG);
    return toRoundStart(parsed, request.theme, buildLevelMultipliers(request.theme, config));
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
    return profileSchema.parse(data);
  },

  async getConfig(): Promise<GameConfig> {
    if (USE_MOCK) return gameConfigSchema.parse(mock.mockGetConfig());
    const { data } = await http.get('/admin/config');
    return gameConfigSchema.parse(data);
  },

  async saveConfig(config: GameConfig): Promise<GameConfig> {
    if (USE_MOCK) return gameConfigSchema.parse(mock.mockSaveConfig(config));
    const { data } = await http.put('/admin/config', config);
    return gameConfigSchema.parse(data);
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (USE_MOCK) return leaderboardEntrySchema.array().parse(mock.mockGetLeaderboard());
    const { data } = await http.get('/tournament/leaderboard', { params: { limit: 50 } });
    return leaderboardEntrySchema.array().parse(data);
  },

  async getTournament(): Promise<Tournament> {
    if (USE_MOCK) return tournamentSchema.parse(mock.mockGetTournament());
    const { data } = await http.get('/tournament');
    return tournamentSchema.parse(data);
  },

  // =========================================================================
  // Эндпоинты бэкенда без прямого UI (интегрированы согласно контрактам)
  // =========================================================================

  /**
   * TODO: [UI отсутствует] Получение полигона характеристик (шестиугольник Dota 2: 6 осей за 30 игр).
   * Зачем нужна: визуализация стиля игры (выдержка, бустеры, коллекционер, щедрость, винрейт, риск).
   * Эндпоинты бэкенда: GET /api/users/me/radar-stats (свой) или GET /api/users/{id}/radar-stats (публичный).
   */
  async getRadarStats(playerId?: string): Promise<StatRadar> {
    if (USE_MOCK) {
      return {
        patience: 5.0,
        boosters: 5.0,
        collector: 5.0,
        generosity: 5.0,
        winRate: 5.0,
        risk: 5.0,
        gamesAnalyzed: 0,
        totalGames: 0,
        nextRecalcIn: 10,
      };
    }
    const { data } = await http.get(playerId ? `/users/${playerId}/radar-stats` : '/users/me/radar-stats');
    return statRadarSchema.parse(data);
  },

  /**
   * TODO: [UI отсутствует] Сброс параметров игры к эталонным заводским настройкам (ТЗ §1.9).
   * Зачем нужна: админская функция отката баланса игры без ручного ввода всех полей.
   * Эндпоинт бэкенда: POST /api/admin/config/reset (требует роль ADMIN).
   */
  async resetConfig(): Promise<GameConfig> {
    if (USE_MOCK) return gameConfigSchema.parse(mock.mockGetConfig());
    const { data } = await http.post('/admin/config/reset');
    return gameConfigSchema.parse(data);
  },

  /**
   * TODO: [UI отсутствует] Быстрое пополнение баланса бонусов для тестирования.
   * Зачем нужна: проверка игрового цикла и ставок при нехватке средств без ограничений.
   * Эндпоинты бэкенда: POST /api/users/me/top-up или POST /api/users/{id}/top-up.
   */
  async topUpBalance(amount = 1000, playerId?: string): Promise<TopUpResponse> {
    if (USE_MOCK) {
      return { userId: 1, username: 'player', addedAmount: amount, newBalance: 10000 };
    }
    const url = playerId ? `/users/${playerId}/top-up` : '/users/me/top-up';
    const { data } = await http.post(url, { amount });
    return topUpResponseSchema.parse(data);
  },

  /**
   * TODO: [UI отсутствует] Просмотр персонального House Edge, RTP и EV игрока.
   * Зачем нужна: проверка адаптивной математической модели казино Столото и динамического House Edge.
   * Эндпоинт бэкенда: GET /api/game/house-edge.
   */
  async getHouseEdge(): Promise<PlayerHouseEdge> {
    if (USE_MOCK) {
      return { userId: 1, currentHouseEdge: 0.04, rtp: 0.96, expectedValue: -0.04, lastBetAmount: null };
    }
    const { data } = await http.get('/game/house-edge');
    return playerHouseEdgeSchema.parse(data);
  },

  /**
   * TODO: [UI отсутствует] Сброс персонального House Edge игрока к базовому значению 0.04.
   * Зачем нужна: очистка персональной истории динамического RTP для воспроизводимого тестирования.
   * Эндпоинт бэкенда: POST /api/game/house-edge/reset.
   */
  async resetHouseEdge(): Promise<PlayerHouseEdge> {
    if (USE_MOCK) {
      return { userId: 1, currentHouseEdge: 0.04, rtp: 0.96, expectedValue: -0.04, lastBetAmount: null };
    }
    const { data } = await http.post('/game/house-edge/reset');
    return playerHouseEdgeSchema.parse(data);
  },

  /**
   * TODO: [UI отсутствует] Принудительная финализация турнира и начисление наград топ-3.
   * Зачем нужна: тестирование подведения итогов турнира, начисления призов и сброса таблицы.
   * Эндпоинт бэкенда: POST /api/tournament/settle?force=true.
   */
  async settleTournament(force = false): Promise<TournamentSettlement> {
    if (USE_MOCK) {
      return {
        status: 'SUCCESS',
        tournamentTitle: 'Гран-при Воздухоплавателей',
        settledAt: Date.now(),
        rewardedPlayersCount: 0,
        totalPrizesAwarded: 0,
        winners: [],
        message: 'Демо-турнир финализирован',
      };
    }
    const { data } = await http.post('/tournament/settle', null, { params: { force } });
    return tournamentSettlementSchema.parse(data);
  },

  /**
   * TODO: [UI отсутствует] Получение архива завершенных турниров и начисленных призов.
   * Зачем нужна: аудит призовых мест и просмотр истории выигрышей в турнирах.
   * Эндпоинт бэкенда: GET /api/tournament/history?my=false&limit=20.
   */
  async getTournamentHistory(my = false, limit = 20): Promise<TournamentHistoryItem[]> {
    if (USE_MOCK) return [];
    const { data } = await http.get('/tournament/history', { params: { my, limit } });
    const rows = Array.isArray(data) ? data : [];
    return tournamentHistoryItemSchema.array().parse(rows);
  },
};
