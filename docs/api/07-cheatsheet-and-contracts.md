# 07. Шпаргалка TypeScript и справочник ошибок

Этот раздел — практическая настольная шпаргалка для фронтенд-разработчиков и тестировщиков: все типы данных на TypeScript, сводная таблица всех 27 REST-эндпоинтов, WebSocket и SSE потоков, расшифровка ошибок и чек-лист для проверки интеграции.

---

## 🚨 1. Единый формат ошибок (`ErrorResponse`)

Все ошибки REST API возвращаются в едином стандартизированном JSON-формате:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Вывод доступен только после прохождения 1-го уровня (коэффициент не ниже 1.2x)",
  "timestamp": "2026-09-12T12:00:00.000Z"
}
```

### Справочник HTTP-статусов:

| Код | Статус | Когда возникает | Рекомендуемое действие фронтенда |
|---|---|---|---|
| **`200`** | OK | Успешный запрос (вход, кэшаут, профиль, турнир, бустеры). | Отобразить данные в UI. |
| **`201`** | Created | Успешный старт раунда (`/api/game/start`). | Запустить анимацию взлета шара. |
| **`204`** | No Content | Успешное удаление аккаунта (`DELETE /api/users/me`). | Очистить сессию, редирект на логин. |
| **`400`** | Bad Request | Ошибка валидации; нехватка бонусов на ставку; нехватка фрагментов на бустер; попытка нажать «Забрать» до 1-го уровня. | Показать всплывающий тост с текстом из `message`. Не блокировать UI. |
| **`401`** | Unauthorized | Токен отсутствует, истек (прошло 24 часа) или испорчен. | Очистить `localStorage`, перенаправить пользователя на `/login`. |
| **`403`** | Forbidden | Пользователь с ролью `USER` пытается вызвать админку (`PUT /api/admin/config`, `PUT /api/admin/boosters/pricing`). | Показать сообщение «Доступ запрещен (требуется роль ADMIN)». |
| **`404`** | Not Found | Игрок или игровой раунд с указанным ID/UUID не найден. | Отобразить заглушку «Запись не найдена». |
| **`409`** | Conflict | Попытка зарегистрировать уже занятый логин или email. | Подсветить поле формы красным цветом. |
| **`500`** | Server Error | Внутренняя ошибка сервера. | Показать пользователю «Что-то пошло не так, попробуйте позже». |

---

## 📑 2. Полный каталог TypeScript интерфейсов

Вы можете скопировать этот блок кода целиком в файл `src/types/api.ts` вашего React / Vue / Svelte приложения:

```typescript
// ==========================================
// 1. АУТЕНТИФИКАЦИЯ И ПОЛЬЗОВАТЕЛИ
// ==========================================

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  bonusBalance: number;
  fragmentBalance?: number; // 0..10
  points: number;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role: "USER" | "ADMIN" | string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: "Bearer";
  expiresIn: number; // 86400 (24 часа)
  user: UserProfile;
}

export interface TopUpBalanceResponse {
  userId: number;
  username: string;
  addedAmount: number;
  newBalance: number;
}

// ==========================================
// 2. ИГРОВОЙ ЦИКЛ И БУСТЕРЫ (REST)
// ==========================================

export interface BoosterTierPricingDto {
  tier: number; // 1, 2, 3, 4
  multiplier: number; // 1.0, 2.0, 3.0, 4.0
  costFragments: number; // 0, 2, 4, 6
}

export interface StartRoundRequest {
  betAmount?: number;
  cost?: number; // фронтенд-алиас для betAmount
  theme?: "green" | "red";
  boosterMultiplier?: 1 | 2 | 3 | 4;
  boosterTier?: 1 | 2 | 3 | 4; // фронтенд-алиас для boosterMultiplier
}

export interface GameRoundStartResult {
  roundId: string; // UUID раунда
  startTime: string; // ISO-8601
  initialMultiplier: number; // 1.00
  growthRate: number; // 0.06
  provablyFairHash: string; // SHA-256
  betAmount: number;
  boosterMultiplier: number; // 1, 2, 3, 4
  boosterLevel: number | null; // номер линии бустера или null
  totalLevels: number; // 9 или 12
  unlockCashoutMultiplier: number; // 1.20 или 1.15
  remainingBalance: number;
}

export interface CashoutRequest {
  roundId: string;
}

export interface GameRoundCashoutResult {
  roundId: string;
  status: "FINISHED" | "CRASHED";
  isWin: boolean;
  multiplier: number;
  crashMultiplier: number;
  winAmount: number;
  newBalance: number;
  pointsEarned: number;
  levelsPassed: number;
  boosterActivated: boolean;
  boosterMultiplier: number;
  nextHouseEdge: number;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  reward?: RewardDto | null;
  unlockedAchievements?: AchievementDto[];
}

export interface GameRoundStateResult {
  roundId: string | null;
  status: "IN_PROGRESS" | "FINISHED" | "CRASHED" | "NO_ACTIVE_ROUND";
  isCrashed: boolean;
  currentMultiplier: number;
  crashMultiplier: number | null;
  elapsedMs: number;
  potentialWin: number;
  startTime: string | null;
  levelsPassed: number;
  pointsEarned: number;
  boosterActivated: boolean;
}

export interface GameRoundHistoryItem {
  roundId: string;
  userId: number | null;
  username: string;
  theme: string;
  betAmount: number;
  crashMultiplier: number;
  cashoutMultiplier: number | null;
  winAmount: number;
  isWin: boolean;
  status: string;
  createdAt: string;
}

export interface PlayerHouseEdgeResponse {
  userId: number;
  currentHouseEdge: number;
  rtp: number;
  expectedValue: number;
  lastBetAmount: number | null;
}

// ==========================================
// 3. WEBSOCKET СОБЫТИЯ (60 FPS)
// ==========================================

export type WsMessageType =
  | "CONNECTED"
  | "TICK"
  | "BOOSTER_ACTIVATED"
  | "CASHOUT"
  | "CRASHED"
  | "ERROR"
  | "PONG";

export interface WsGameMessage {
  type: WsMessageType;
  roundId?: string | null;
  multiplier?: number | null;
  crashMultiplier?: number | null;
  winAmount?: number | null;
  newBalance?: number | null;
  elapsedMs?: number | null;
  message?: string | null;
  level?: number | null;
  boosterMultiplier?: number | null;
  previousMultiplier?: number | null;
  bonusPoints?: number | null;
  pointsEarned?: number | null;
  levelsPassed?: number | null;
  boosterActivated?: boolean | null;
  reward?: RewardDto | null;
  unlockedAchievements?: AchievementDto[];
}

// ==========================================
// 4. МЕТА-ИГРА И ДОСТИЖЕНИЯ
// ==========================================

export interface RewardDto {
  kind: "puzzle-piece";
  pieceId: string; // "piece_1" ... "piece_10" или "completed"
  label: string;
  collected: number;
  total: number; // 10
}

export interface RankDto {
  id: "novice" | "amateur" | "aeronaut" | "captain" | "wind_master" | "sky_legend";
  title: string;
  minProfit: number;
  nextTitle: string | null;
  nextAt: number | null;
  profit: number;
}

export interface AchievementDto {
  id: string;
  title: string;
  description: string;
  letter: string; // русская буква для бейджа ('П', 'У', 'В', 'С', 'Р', 'М', 'К', 'Щ', 'Л')
  unlockedAt: number | null; // timestamp в ms или null (заблокировано)
}

export interface ProfileUserDto {
  id: string;
  name: string;
  role: "user" | "admin";
  balance: number;
  points: number;
}

export interface ProfileDto {
  user: ProfileUserDto;
  puzzle: string[]; // собранные фрагменты ["piece_1", "piece_2", ...]
  puzzleTotal: number; // 10
  fragmentBalance?: number; // 0..10
  roundsPlayed: number;
  roundsWon: number;
  bestMultiplier: number;
  totalWagered: number;
  totalPayout: number;
  rank: RankDto;
  achievements: AchievementDto[];
}

export interface StatRadarDto {
  patience: number;      // 0.0 - 10.0 (Выдержка)
  boosters: number;      // 0.0 - 10.0 (Бустеры)
  collector: number;     // 0.0 - 10.0 (Коллекционер пазлов)
  generosity: number;    // 0.0 - 10.0 (Размах ставки)
  winRate: number;       // 0.0 - 10.0 (Винрейт)
  risk: number;          // 0.0 - 10.0 (Азарт / Риск)
  gamesAnalyzed: number; // Число раундов в окне (0 - 30)
  totalGames: number;    // Всего сыграно игр
  nextRecalcIn: number;  // Раундов до следующего пересчета (1 - 10)
}

// ==========================================
// 5. ТУРНИРЫ И ЛИДЕРБОРД
// ==========================================

export interface LeaderboardEntryDto {
  playerId: string;
  playerName: string;
  points: number;
}

export interface TournamentTableEntryDto {
  place: number;
  playerId: string;
  playerName: string;
  points: number;
  prize: number; // расчетный бонус за ТОП-3
}

export interface TournamentResponseDto {
  title: string;
  endsAt: number; // timestamp окончания (23:59:59 MSK)
  entries: TournamentTableEntryDto[];
  currentPlayerId: string | null;
}

export interface TournamentHistoryItemDto {
  place: number;
  playerId: string;
  playerName: string;
  score: number;
  prizeAwarded: number;
  awardedAt: string;
}

export interface TournamentSettlementResultDto {
  status: "SUCCESS" | "SKIPPED" | "ALREADY_SETTLED";
  tournamentTitle: string;
  settledAt: number;
  rewardedPlayersCount: number;
  totalPrizesAwarded: number;
  winners: TournamentHistoryItemDto[];
  message: string;
}

// ==========================================
// 6. КОНФИГУРАЦИЯ ИГРЫ (АДМИНКА)
// ==========================================

export interface GameConfigDto {
  gameId: string;
  gameName: string;
  isActive: boolean;
  alpha: number;
  maxMultiplier: number;
  minCrashMultiplier: number;
  multiplierGrowthRate: number;
  growthAcceleration: number;
  pointsPerLine: number;
  pointsCashoutBonus: number;
  pointsBoosterBonus: number;
  boosterTierValues: number[];
  boosterCostFragments?: number[]; // [0, 2, 4, 6]
  lootProbabilities: {
    green: number[];
    red: number[];
  };
  minWinAmount: number;
  popupTimeout: number;
}

// ==========================================
// 7. СИСТЕМНЫЕ И ОШИБКИ
// ==========================================

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}
```

---

## 🗺 3. Сводная матрица всех эндпоинтов

| Метод | URL | Авторизация | Раздел документации | Назначение |
|---|---|:---:|---|---|
| `GET` | `/api/ping` | Нет | [01. Аутентификация](./01-auth-and-users.md) | Проверка доступности бэкенда |
| `POST` | `/api/auth/register` | Нет | [01. Аутентификация](./01-auth-and-users.md) | Регистрация (+1000 бонусов, 6 фрагментов) |
| `POST` | `/api/auth/login` | Нет | [01. Аутентификация](./01-auth-and-users.md) | Вход по логину/email и паролю |
| `GET` | `/api/auth/me` | JWT | [01. Аутентификация](./01-auth-and-users.md) | Проверка токена и быстрый профиль |
| `GET` | `/api/users/me` | JWT | [01. Аутентификация](./01-auth-and-users.md) | Расширенный профиль (пазлы, ачивки, ранг) |
| `GET` | `/api/users/me/radar-stats`| JWT | [04. Мета-игра](./04-meta-game.md) | Шестиугольник характеристик (Dota 2) |
| `PUT` | `/api/users/me` | JWT | [01. Аутентификация](./01-auth-and-users.md) | Обновление имени, email, аватара |
| `PUT` | `/api/users/me/password` | JWT | [01. Аутентификация](./01-auth-and-users.md) | Смена пароля |
| `DELETE`| `/api/users/me` | JWT | [01. Аутентификация](./01-auth-and-users.md) | Удаление собственного аккаунта |
| `GET` | `/api/users/{id}` | Нет | [01. Аутентификация](./01-auth-and-users.md) | Публичный профиль игрока по ID |
| `GET` | `/api/users/{id}/radar-stats`| Нет | [04. Мета-игра](./04-meta-game.md) | Публичный шестиугольник игрока |
| `GET` | `/api/users` | Нет | [01. Аутентификация](./01-auth-and-users.md) | Пагинированный список игроков |
| `POST` | `/api/users/me/top-up` | JWT | [01. Аутентификация](./01-auth-and-users.md) | Быстрое пополнение баланса бонусов |
| `POST` | `/api/users/{id}/top-up` | Нет | [01. Аутентификация](./01-auth-and-users.md) | Тестовое пополнение любого игрока |
| `GET` | `/api/game/boosters` | Нет | [02. Игровой цикл](./02-game-flow.md) | Каталог бустеров и стоимость во фрагментах |
| `POST` | `/api/game/start` | JWT | [02. Игровой цикл](./02-game-flow.md) | Старт раунда полета (списание ставки и фрагментов) |
| `POST` | `/api/game/cashout` | JWT | [02. Игровой цикл](./02-game-flow.md) | Забрать выигрыш (Cashout) |
| `GET` | `/api/game/state` | JWT | [02. Игровой цикл](./02-game-flow.md) | Синхронизация состояния раунда |
| `GET` | `/api/game/history` | Опц. | [02. Игровой цикл](./02-game-flow.md) | История ставок (глобальная или `?my=true`) |
| `GET` | `/api/game/house-edge` | JWT | [06. Админка и честность](./06-admin-and-provably-fair.md) | Текущий House Edge и RTP игрока |
| `POST` | `/api/game/house-edge/reset`| JWT | [06. Админка и честность](./06-admin-and-provably-fair.md) | Сброс House Edge к базовым 4% |
| `GET` | `/api/admin/config` | JWT | [06. Админка и честность](./06-admin-and-provably-fair.md) | Чтение параметров игры (Hot-Reload) |
| `PUT` | `/api/admin/config` | ADMIN | [06. Админка и честность](./06-admin-and-provably-fair.md) | Сохранение настроек игры на лету |
| `POST` | `/api/admin/config/reset` | ADMIN | [06. Админка и честность](./06-admin-and-provably-fair.md) | Сброс настроек игры к заводским |
| `GET` | `/api/admin/boosters/pricing`| JWT | [06. Админка и честность](./06-admin-and-provably-fair.md) | Чтение сетки цен бустеров во фрагментах |
| `PUT` | `/api/admin/boosters/pricing`| ADMIN | [06. Админка и честность](./06-admin-and-provably-fair.md) | Обновление стоимости бустеров на лету |
| `GET` | `/api/tournament` | Опц. | [05. Турниры и SSE](./05-tournament-and-sse.md) | Таблица турнира и призы ТОП-3 |
| `GET` | `/api/tournament/leaderboard`| Нет | [05. Турниры и SSE](./05-tournament-and-sse.md) | Компактный список лидеров |
| `POST` | `/api/tournament/settle` | Нет | [05. Турниры и SSE](./05-tournament-and-sse.md) | Финализация наград (`?force=true`) |
| `GET` | `/api/tournament/history` | Опц. | [05. Турниры и SSE](./05-tournament-and-sse.md) | Архив прошедших турниров |
| `WS` | `/ws/game?token=...` | JWT | [03. WebSocket](./03-websocket-stream.md) | 60 FPS стрим тиков полета шара |
| `SSE` | `/api/tournament/stream` | Нет | [05. Турниры и SSE](./05-tournament-and-sse.md) | 1 Гц стрим турнирной таблицы |
| `SSE` | `/api/tournament/leaderboard/stream` | Нет | [05. Турниры и SSE](./05-tournament-and-sse.md) | 1 Гц стрим компактного рейтинга |

---

## ✅ 4. Чек-лист проверки интеграции (QA & Frontend)

Перед показом проекта убедитесь, что пройдены ключевые шаги:

1. [ ] **Регистрация и вход:** Проверьте, что новому пользователю начисляется 1 000 бонусов и 6 стартовых фрагментов пазла.
2. [ ] **WebSocket подключение:** При открытии экрана игры сокет успешно соединяется (`CONNECTED`) и шлет `PING` раз в 25 секунд.
3. [ ] **Блокировка кнопки кэшаута:** Кнопка «Забрать» должна быть заблокирована, пока множитель не достигнет 1-го уровня (1.20x для зеленой темы, 1.15x для красной).
4. [ ] **Экономика бустеров:** При нехватке фрагментов кнопка бустера отключается или сервер возвращает `400 Bad Request`, а при старте фрагменты корректно списываются с баланса.
5. [ ] **Бустер в полете:** При выборе бустера $\times 2$--$\times 4$ маркер отображается на поле, а при пролете шара срабатывает визуальный скачок и вспышка `BOOSTER_ACTIVATED`.
6. [ ] **Автовывод x2:** При включении кнопки «Автовывод x2» кэшаут вызывается автоматически фронтендом ровно при достижении множителя $\ge 2.00\times$.
7. [ ] **Продолжение полета после кэшаута:** После нажатия «Забрать» шар не исчезает, а долетает до точки краха, позволяя игроку видеть весь полет.
8. [ ] **Турнирные очки:** Очки начисляются как при выигрыше (+50 за кэшаут + уровни), так и при крахе (за пройденные уровни).
9. [ ] **SSE турнира:** Турнирная таблица обновляется раз в секунду без лишних сетевых GET-запросов в DevTools вкладке Network.
10. [ ] **Выпадение пазлов:** Кусочки пазла (до 10 штук) собираются в профиле без дубликатов по Pity Timer.
11. [ ] **Шестиугольник характеристик:** В личном кабинете строится полигон из 6 осей (`GET /api/users/me/radar-stats`).
12. [ ] **Тестовое пополнение:** При нажатии кнопки «Пополнить баланс» вызывается `/api/users/me/top-up` и баланс сразу обновляется в шапке.

🎉 **Удачной интеграции и отличных побед на хакатоне!**
