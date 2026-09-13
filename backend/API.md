# MOG Backend API & WebSocket Specification (Authoritative Reference)

> 💡 **Человекочитаемая документация по API:** подробные описания с примерами, TypeScript-типами, схемами и сценариями работы вынесены в модуль [**`docs/api/`**](../docs/api/README.md).  
> **Статус документа:** Актуален · Версия: 1.4.0 · Среда: Quarkus 3.x / Java 21 Loom / PostgreSQL 16  
> **Целевая аудитория:** AI-агенты, фронтенд-разработчики, тестировщики и интеграторы.  
> **Базовый HTTP URL:** `http://localhost:8080`  
> **Базовый WebSocket URL:** `ws://localhost:8080`

---

## 1. Архитектурный контекст и общие правила

1. **Server-Authoritative:** Все ключевые игровые решения (точка краха шара, множители, позиция и активация бустера, списание ставки, начисление выигрыша, турнирных очков и мета-наград) вычисляются и проверяются исключительно сервером. Клиент лишь визуализирует состояние.
2. **Формат данных:** Все HTTP REST запросы и ответы имеют заголовок `Content-Type: application/json`. Дата и время передаются в формате ISO-8601 UTC (например, `2026-09-12T10:15:30.123456Z`).
3. **Аутентификация:** Используется **JWT Bearer Token** (`Authorization: Bearer <token>`) с временем жизни 24 часа. Для WebSocket токен передается в query-параметре: `/ws/game?token=<jwt_token>`.
4. **Математическая модель полета:** Рост коэффициента подчиняется непрерывной экспоненциальной формуле:
   $$M(t) = 1.00 \cdot e^{k \cdot t_{sec}} \quad \text{где } k = 0.06$$
   При $k = 0.06$ множитель $2.00\times$ достигается за $\approx 11.55$ секунд. Время краха:
   $$t_{crash} = \frac{\ln(M_{crash})}{k}$$
5. **Real-time стриминг:**
   - **WebSocket (60 FPS):** Сервер пушит тики множителя полета по WebSocket с частотой 60 кадров/сек (интервал $\approx 16$ мс) на легковесных виртуальных потоках, а также мгновенно передает `CASHOUT` и `CRASHED` с выпавшими фрагментами пазла (`reward`) и новыми достижениями (`unlockedAchievements`).
   - **Server-Sent Events (1 Гц):** Потоковая трансляция актуальной турнирной таблицы и лидерборда в реальном времени с периодичностью 1 раз в секунду вместо клиентского polling.
6. **Мета-игра и удержание (ТЗ §1.5):** Автоматическая выдача деталей пазла по Pity Timer (+20% за пустой раунд) с защитой от дубликатов (Bad Luck Protection), динамический расчет 6 рангов по чистой прибыли и проверка 10 достижений с буквами для UI-бейджей.
7. **Полигон характеристик игрока (RADAR-1):** Шестиугольник характеристик (шкала 0.0–10.0 в стиле Dota 2) по скользящему окну последних 30 игр с плановым пересчетом каждые 10 игр (предварительный динамический расчет для раундов 1–9). Включает 6 осей: выдержка, бустеры, коллекционер пазлов, щедрость ставок, винрейт и азарт/риск.

---

## 2. Сводная таблица контрактов

### 2.1. REST API

| Метод | Путь | Auth | Описание |
|---|---|:---:|---|
| `GET` | `/api/ping` | Нет | Проверка работоспособности бэкенда (Healthcheck) |
| `POST` | `/api/auth/register` | Нет | Регистрация нового игрока (выдает токен + 1000 бонусов) |
| `POST` | `/api/auth/login` | Нет | Аутентификация по username/email и паролю (выдает токен) |
| `GET` | `/api/auth/me` | JWT | Получение профиля авторизованного пользователя (`UserProfileResponse`) |
| `GET` | `/api/users/me` | JWT | Получить собственный расширенный профиль (`ProfileDto`: пазлы, ачивки, ранг, статистика) |
| `GET` | `/api/users/me/radar-stats` | JWT | Получить собственный полигон характеристик (`StatRadarDto`: 6 осей за 30 игр) |
| `PUT` | `/api/users/me` | JWT | Обновить данные профиля (username, email, имя, аватар) |
| `PUT` | `/api/users/me/password`| JWT | Сменить пароль (требует текущий пароль) |
| `DELETE`| `/api/users/me` | JWT | Удалить свой аккаунт |
| `GET` | `/api/users/{id}` | Нет | Получить публичный профиль игрока по ID (`ProfileDto` с мета-игрой) |
| `GET` | `/api/users/{id}/radar-stats` | Нет | Публичный полигон характеристик игрока по ID (`StatRadarDto`) |
| `GET` | `/api/users` | Нет | Пагинированный список игроков (`?page=0&size=20`) |
| `POST` | `/api/users/me/top-up` | JWT | Быстрое пополнение бонусного баланса текущего игрока |
| `POST` | `/api/users/{id}/top-up`| Нет | Быстрое пополнение баланса пользователя по ID |
| `POST` | `/api/game/start` | JWT | Начать новый раунд полета шара (списание ставки) |
| `POST` | `/api/game/cashout` | JWT | Зафиксировать выигрыш (Cashout) по текущему серверному времени |
| `GET` | `/api/game/state` | JWT | Получить состояние раунда (`?roundId=<uuid>` опционален) |
| `GET` | `/api/game/history` | Опц. | История раундов (глобальная или `?my=true` для персональной) |
| `GET` | `/api/game/house-edge` | JWT | Текущий House Edge, RTP и EV игрока |
| `POST` | `/api/game/house-edge/reset` | JWT | Сброс House Edge игрока к базовому значению `0.04` |
| `POST` | `/api/game/top-up` | JWT | Быстрое пополнение баланса бонусов (алиас для игр) |
| `GET` | `/api/game/boosters` | Нет | Получить доступные бустеры и их стоимость во фрагментах |
| `GET` | `/api/admin/config` | JWT | Чтение текущей конфигурации игры (кэш в RAM, O(1)) |
| `PUT` | `/api/admin/config` | ADMIN | Горячее сохранение конфигурации игры (Hot-Reload) |
| `POST` | `/api/admin/config/reset` | ADMIN | Сброс конфигурации к эталонным дефолтным значениям |
| `GET` | `/api/admin/boosters/pricing` | JWT | Чтение текущей стоимости бустеров во фрагментах |
| `PUT` | `/api/admin/boosters/pricing` | ADMIN | Обновление стоимости бустеров во фрагментах |
| `GET` | `/api/tournament` | Опц. | Полная турнирная таблица, призовые места топ-3 и таймер endsAt |
| `GET` | `/api/tournament/leaderboard` | Нет | Компактный рейтинг участников лидерборда (`?limit=50`) |
| `POST`| `/api/tournament/settle` | Нет | Финализация турнира, выплата призов топ-3 и сброс очков (`?force=true`) |
| `GET` | `/api/tournament/history` | Опц. | Архив призеров завершенных турниров (`?my=true&limit=20`) |

### 2.2. WebSocket

| Протокол | Эндпоинт | Auth | Описание |
|---|---|:---:|---|
| `WS` | `/ws/game?token=<jwt>` | Query JWT | Полнодуплексный 60 FPS стрим тиков, бустеров и краха |

### 2.3. Server-Sent Events (SSE)

| Протокол | Эндпоинт | Auth | Описание |
|---|---|:---:|---|
| `SSE` | `/api/tournament/leaderboard/stream` | Нет | Потоковый 1 Гц SSE-стрим компактного рейтинга лидеров |
| `SSE` | `/api/tournament/stream` | Нет | Потоковый 1 Гц SSE-стрим полной турнирной таблицы и призов |

---

## 3. Детальная спецификация REST эндпоинтов

### 3.1. Системные (Healthcheck)

#### `GET /api/ping`
Проверка доступности сервиса.
- **Headers:** Не требуются.
- **Ответ `200 OK`:**
```json
{
  "status": "OK",
  "timestamp": "2026-09-12T00:10:00.123Z",
  "message": "MOG Backend is running on Java Virtual Threads"
}
```

---

### 3.2. Аутентификация (`/api/auth/*`)

#### `POST /api/auth/register`
Создание нового аккаунта. При регистрации автоматически начисляется стартовый баланс **1000 бонусных баллов**, роль `USER` и базовый House Edge `0.04` (4%).
- **Тело запроса:**
```json
{
  "username": "super_player",
  "email": "player@stoloto.ru",
  "password": "strongPassword123",
  "firstName": "Иван",
  "lastName": "Иванов",
  "avatarUrl": "https://example.com/avatar.png"
}
```
*Валидация:*
- `username`: от 3 до 64 символов, без пробелов (обязательно).
- `email`: валидный email до 128 символов (обязательно).
- `password`: от 6 до 100 символов (обязательно).
- `firstName`, `lastName`, `avatarUrl`: опциональны.

- **Ответ `200 OK` (`AuthResponse`):**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": 1,
    "username": "super_player",
    "email": "player@stoloto.ru",
    "bonusBalance": 1000,
    "points": 0,
    "firstName": "Иван",
    "lastName": "Иванов",
    "avatarUrl": "https://example.com/avatar.png",
    "role": "USER",
    "createdAt": "2026-09-12T00:00:00Z",
    "updatedAt": "2026-09-12T00:00:00Z"
  }
}
```
- **Ошибки:**
  - `400 Bad Request` — ошибка валидации полей.
  - `409 Conflict` — пользователь с таким `username` или `email` уже существует.

> **Предустановленный администратор для тестирования админки:**
> - **Username:** `admin` (или email: `admin@stoloto.ru`)
> - **Password:** `admin123`
> - **Role:** `ADMIN` (баланс: 50 000 бонусов, 5 000 очков)
>
> **Предустановленный тестовый пользователь:**
> - **Имя:** Тестовый Пользователь
> - **Username:** `test_user` (или email: `test_user@stoloto.ru`)
> - **Password:** `test1234`
> - **Role:** `USER` (баланс: 10 000 бонусов, средний ранг `aeronaut` / «Воздухоплаватель», 0 достижений)

---

#### `POST /api/auth/login`
Вход по логину (`username` или `email`) и паролю.
- **Тело запроса:**
```json
{
  "login": "super_player",
  "password": "strongPassword123"
}
```
- **Ответ `200 OK` (`AuthResponse`):** Возвращает JWT токен и профиль пользователя (с полем `points`).
- **Ошибки:**
  - `401 Unauthorized` — неверный логин или пароль.

---

#### `GET /api/auth/me`
Получить профиль текущего пользователя из контекста токена.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Ответ `200 OK`:** Возвращает объект `UserProfileResponse` (включая `points`).
- **Ошибки:**
  - `401 Unauthorized` — токен отсутствует, просрочен или поврежден.

---

### 3.3. Управление пользователями и профилем (`/api/users/*`)

#### `GET /api/users/me`
Получить собственный расширенный профиль игрока со всеми данными мета-игры (пазлы, динамический ранг, 10 достижений и статистика раундов). В точности соответствует `profileSchema` фронтенда.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Ответ `200 OK` (`ProfileDto`):**
```json
{
  "user": {
    "id": "1",
    "name": "super_player",
    "role": "user",
    "balance": 1150,
    "points": 350
  },
  "puzzle": [
    "piece_1",
    "piece_3",
    "piece_5"
  ],
  "puzzleTotal": 9,
  "roundsPlayed": 14,
  "roundsWon": 8,
  "bestMultiplier": 4.52,
  "totalWagered": 1400,
  "totalPayout": 2150,
  "rank": {
    "id": "amateur",
    "title": "Любитель",
    "minProfit": 500.0,
    "nextTitle": "Воздухоплаватель",
    "nextAt": 2000.0,
    "profit": 750.0
  },
  "achievements": [
    {
      "id": "first_flight",
      "title": "Первый полет",
      "description": "Сыграть первый раунд в игре",
      "letter": "П",
      "unlockedAt": 1789200000000
    },
    {
      "id": "lucky_start",
      "title": "Удачный старт",
      "description": "Выиграть свой первый раунд",
      "letter": "У",
      "unlockedAt": 1789200050000
    },
    {
      "id": "high_flight_5x",
      "title": "Высокий полет (x5+)",
      "description": "Забрать выигрыш на множителе x5 или выше",
      "letter": "В",
      "unlockedAt": null
    }
  ]
}
```
*Поля `ProfileDto`:*
- `user`: объект игрока (`id`, `name`, `role`, `balance`, `points`).
- `puzzle`: список строковых ID собранных фрагментов (например, `["piece_1", "piece_3"]`).
- `puzzleTotal`: константа `9` (всего деталей в пазле).
- `roundsPlayed`, `roundsWon`, `bestMultiplier`, `totalWagered`, `totalPayout`: агрегированная статистика по завершенным раундам игрока.
- `rank`: объект текущего ранга игрока, рассчитанного по чистой прибыли ($profit = totalPayout - totalWagered$).
- `achievements`: полный каталог из 10 достижений игры с отметкой `unlockedAt` (timestamp в ms или `null`, если заблокировано).

#### `GET /api/users/me/radar-stats`
Получить собственный полигон характеристик (шестиугольник статистики в стиле Dota 2) авторизованного игрока.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Механика расчета и скользящее окно:**
  - Анализируются последние **до 30 завершенных игр** игрока (`game_rounds`).
  - **Калибровка для новых игроков:** в раундах с 1 по 9 полигон пересчитывается динамически после каждого раунда в реальном времени.
  - **Плановый пересчет:** начиная с 10-го раунда пересчет показателей выполняется строго каждые 10 игр (`totalRounds % 10 == 0`). В промежуточные раунды (11–19, 21–29 и т.д.) возвращается сохраненный снимок и декрементируется счетчик `nextRecalcIn`.
- **Ответ `200 OK` (`StatRadarDto`):**
```json
{
  "patience": 5.0,
  "boosters": 10.0,
  "collector": 6.7,
  "generosity": 5.0,
  "winRate": 6.7,
  "risk": 7.0,
  "gamesAnalyzed": 30,
  "totalGames": 30,
  "nextRecalcIn": 10
}
```
*Описание полей `StatRadarDto` (шкала 0.0 – 10.0):*
- `patience` (**Выдержка**): средний зафиксированный коэффициент забора в победных раундах окна. При $\le 1.0\times \to 0.0$, при $3.0\times \to 5.0$, при $\ge 5.0\times \to 10.0$. Формула: $\min\left(10.0, \frac{\text{avgCashout} - 1.0}{4.0} \times 10.0\right)$.
- `boosters` (**Бустеры**): частота выбора ставок с бустерами $\times 2$--$\times 4$ (дает до 5.0 очков) + доля их реальной активации до вывода (дает до 5.0 очков). Сумма нормализуется в диапазоне $0.0$--$10.0$.
- `collector` (**Коллекционер**): общий прогресс сбора 9 фрагментов пазла ($\frac{\text{collected}}{9} \times 7.0$, до 7.0) + количество выпавших кусочков за анализируемое окно 30 игр ($\min(3.0, \text{recentDrops})$, до 3.0).
- `generosity` (**Размах / Щедрость**): средний размер ставки в окне по шкале пресетов: $10 \to 1.0$, $25 \to 2.5$, $50 \to 5.0$, $100 \to 7.5$, $\ge 250 \to 10.0$.
- `winRate` (**Винрейт**): чистый процент успешных раундов без краха за анализируемое окно: $\frac{\text{wins}}{N} \times 10.0$.
- `risk` (**Азарт / Риск**): доля игр на сложной красной теме с 12 уровнями (до 5.0) + средняя дерзость близости забора к точке краха $\frac{M_{cashout}}{M_{crash}}$ (до 5.0).
- `gamesAnalyzed`: число фактически проанализированных раундов в окне ($0 \dots 30$).
- `totalGames`: общее число завершенных раундов игрока за все время.
- `nextRecalcIn`: количество раундов до следующего планового пересчета полигона.
- **Ошибки:**
  - `401 Unauthorized` — отсутствует или недействителен JWT токен.
  - `404 Not Found` — пользователь не найден.

#### `PUT /api/users/me`
Обновление личных данных профиля.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Тело запроса (`UpdateProfileRequest`):**
```json
{
  "username": "new_nickname",
  "email": "new_email@stoloto.ru",
  "firstName": "Петр",
  "lastName": "Петров",
  "avatarUrl": "https://example.com/new-avatar.png"
}
```
*Все поля опциональны. Обновляются только переданные.*
- **Ответ `200 OK`:** Обновленный `UserProfileResponse`.

#### `PUT /api/users/me/password`
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Тело запроса:**
```json
{
  "oldPassword": "currentPassword123",
  "newPassword": "newSecretPassword456"
}
```
- **Ответ `200 OK`:** `{"message": "Пароль успешно изменен"}`.
- **Ошибки:** `400 Bad Request` (неверный старый пароль или новый совпадает со старым).

#### `DELETE /api/users/me`
Удаление собственного аккаунта.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Ответ `204 No Content`**.

#### `GET /api/users/{id}`
Публичный расширенный профиль по ID игрока (включая мета-игру `ProfileDto`).
- **Ответ `200 OK`:** Объект `ProfileDto`.
- **Ошибки:** `404 Not Found`.

#### `GET /api/users/{id}/radar-stats`
Публичный просмотр полигона характеристик любого игрока по его ID (для отображения в профиле, лидерборде или турнирной таблице).
- **Параметры пути:** `id` (Long) — идентификатор игрока.
- **Headers:** Не требуются (публичный эндпоинт).
- **Ответ `200 OK`:** Объект `StatRadarDto` (структура и шкалы идентичны `/me/radar-stats`).
- **Ошибки:**
  - `404 Not Found` — игрок с указанным ID не найден.

#### `GET /api/users?page=0&size=20`
Пагинированный список пользователей.
- **Ответ `200 OK` (`PageResponse<UserProfileResponse>`):**
```json
{
  "items": [ /* UserProfileResponse */ ],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8
}
```

---

### 3.4. Тестовое пополнение баланса бонусов (Top-Up)

Эндпоинты предназначены для тестирования игрового процесса без проверок и ограничений.

#### `POST /api/users/me/top-up` или `POST /api/game/top-up`
Пополнение баланса текущего авторизованного игрока.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Тело запроса (опционально, если пусто — добавляется `1000` баллов):**
```json
{
  "amount": 5000
}
```
- **Ответ `200 OK` (`TopUpBalanceResponse`):**
```json
{
  "userId": 1,
  "username": "super_player",
  "addedAmount": 5000,
  "newBalance": 6000
}
```

#### `POST /api/users/{id}/top-up`
Пополнение баланса любого игрока по ID (без авторизации, для отладки).
- **Параметр пути:** `id` (Long).
- **Тело:** `{"amount": 10000}` (или `{}`).
- **Ответ `200 OK`:** `TopUpBalanceResponse`.

---

### 3.5. Игровой процесс (`/api/game/*`)

#### `POST /api/game/start`
Запуск нового раунда игры.
1. Проверяет отсутствие активного раунда у игрока (если был незавершенный раунд, завершает его крашем).
2. Проверяет `bonusBalance >= betAmount`.
3. Атомарно списывает `betAmount` с баланса.
4. Рассчитывает точку краха на основе HMAC-SHA256 и персонального House Edge игрока.
5. Рассчитывает позицию бустера `boosterLevel` (если `boosterMultiplier > 1`).
6. Создает запись в `game_rounds` со статусом `IN_PROGRESS`.
7. Запускает 60 FPS WebSocket стрим для подключенного клиента.

- **Headers:** `Authorization: Bearer <jwt_token>`
- **Тело запроса (`StartRoundRequest`):**
```json
{
  "betAmount": 100,
  "theme": "green",
  "boosterMultiplier": 3
}
```
*Параметры:*
- `betAmount` (или алиас `cost`): сумма ставки в бонусах ($\ge 1$, по умолчанию 100).
- `theme`: тема игры `"green"` (по умолчанию, 9 уровней) или `"red"` (12 уровней).
- `boosterMultiplier` (или алиас `boosterTier`): множитель бустера `1` (тир 1, без бустера), `2` (тир 2), `3` (тир 3) или `4` (тир 4).

- **Ответ `201 Created` (`GameRoundStartResult`):**
```json
{
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "startTime": "2026-09-12T00:15:00.000Z",
  "initialMultiplier": 1.00,
  "growthRate": 0.06,
  "provablyFairHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "betAmount": 100,
  "boosterMultiplier": 3,
  "boosterLevel": 5,
  "totalLevels": 9,
  "unlockCashoutMultiplier": 1.20,
  "remainingBalance": 900
}
```
*Ключевые поля:*
- `roundId`: UUID раунда для последующего кэшаута.
- `provablyFairHash`: публичный SHA256-хэш исхода (доказывает честность до старта).
- `growthRate`: коэффициент $k = 0.06$ для построения кривой на клиенте.
- `boosterLevel`: номер уровня, на котором нарисован маркер бустера (или `null`, если `boosterMultiplier == 1`).
- `unlockCashoutMultiplier`: минимальный коэффициент, по достижении которого кнопка «Забрать» становится активной (1.20 для зеленой темы, 1.15 для красной).

- **Ошибки:**
  - `400 Bad Request` — недостаточно средств на балансе бонусов (`"Insufficient bonus balance..."`).
  - `400 Bad Request` — раунд уже идет (`"You already have an active game round in progress..."`).

---

#### `POST /api/game/cashout`
Фиксация выигрыша (Cashout) по текущему серверному времени.
1. Сервер берет текущую метку времени `now`.
2. Вычисляет текущий множитель $M(t) = 1.00 \cdot e^{0.06 \cdot t}$.
3. **Проверяет разблокировку:** если $M(t) < unlockCashoutMultiplier$ — возвращает ошибку `400 Bad Request` (кнопка заблокирована до 1-го уровня).
4. **Проверяет крах:** если шар уже лопнул ($t \ge t_{crash}$ или $M(t) \ge M_{crash}$), раунд завершается как проигрыш `CRASHED` (`winAmount = 0`, `isWin = false`).
5. **При успехе:**
   - Если шар до момента кэшаута успел долететь до уровня бустера, текущий множитель умножается на `boosterMultiplier`.
   - Начисляется выигрыш: `winAmount = round(betAmount * multiplier)`.
   - Баланс пользователя пополняется на `winAmount`.
   - Рассчитываются игровые очки (за уровни + бустер + 50 очков за кэшаут) и начисляются на общий счет игрока `points`.
   - Динамический House Edge игрока обновляется (по формуле выигрыша).
   - Раунд в БД помечается `FINISHED`, `isWin = true`.
   - В открытый WebSocket пушится событие `CASHOUT`.

- **Headers:** `Authorization: Bearer <jwt_token>`
- **Тело запроса (`CashoutRequest`):**
```json
{
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

- **Ответ `200 OK` при выигрыше (`GameRoundCashoutResult`):**
```json
{
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "FINISHED",
  "isWin": true,
  "multiplier": 2.50,
  "crashMultiplier": 3.80,
  "winAmount": 250,
  "newBalance": 1150,
  "pointsEarned": 90,
  "levelsPassed": 4,
  "boosterActivated": true,
  "boosterMultiplier": 1,
  "nextHouseEdge": 0.0425,
  "serverSeed": "a1b2c3d4e5f6...",
  "clientSeed": "8f3a9e2b1c4d...",
  "nonce": 1726099200000,
  "reward": {
    "kind": "puzzle-piece",
    "pieceId": "piece_3",
    "label": "Фрагмент 3",
    "collected": 3,
    "total": 9
  },
  "unlockedAchievements": [
    {
      "id": "lucky_start",
      "title": "Удачный старт",
      "description": "Выиграть свой первый раунд",
      "letter": "У",
      "unlockedAt": 1726099200000
    }
  ]
}
```

- **Ответ `200 OK` при опоздании (Крах / Потеря ставки):**
```json
{
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "CRASHED",
  "isWin": false,
  "multiplier": 0.0,
  "crashMultiplier": 2.10,
  "winAmount": 0,
  "newBalance": 900,
  "pointsEarned": 20,
  "levelsPassed": 2,
  "boosterActivated": false,
  "boosterMultiplier": 1,
  "nextHouseEdge": 0.0300,
  "serverSeed": "a1b2c3d4e5f6...",
  "clientSeed": "8f3a9e2b1c4d...",
  "nonce": 1726099200000,
  "reward": {
    "kind": "puzzle-piece",
    "pieceId": "none",
    "label": "Без фрагмента",
    "collected": 2,
    "total": 9
  },
  "unlockedAchievements": []
}
```

- **Ошибки:**
  - `400 Bad Request` — раунд не принадлежит игроку, уже завершен или шар не долетел до 1-го уровня.
  - `404 Not Found` — раунд с указанным UUID не найден.

---

#### `GET /api/game/state?roundId=<uuid>`
Опрос текущего состояния раунда (синхронизация состояния или фолбэк при сбоях сети).
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Параметры query:**
  - `roundId` (UUID, опционально). Если не передан, сервер ищет текущий активный раунд игрока.
- **Ответ `200 OK` (`GameRoundStateResult`):**
```json
{
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "IN_PROGRESS",
  "isCrashed": false,
  "currentMultiplier": 1.74,
  "crashMultiplier": null,
  "elapsedMs": 9200,
  "potentialWin": 174,
  "startTime": "2026-09-12T00:15:00.000Z",
  "levelsPassed": 2,
  "pointsEarned": 20,
  "boosterActivated": false
}
```
*Примечание:* До завершения раунда `crashMultiplier` возвращается как `null` во избежание считывания точки краха на стороне клиента.

---

#### `GET /api/game/history?my=false&limit=20`
История завершенных раундов.
- **Параметры query:**
  - `my` (boolean, по умолчанию `false`):
    - `false`: возвращает глобальную историю раундов всех игроков (требование CASE.md для экрана ставок);
    - `true`: возвращает только историю текущего авторизованного игрока (требуется Bearer токен).
  - `limit` (int, 1..100, по умолчанию `20`).
- **Ответ `200 OK` (`List<GameRoundHistoryItemDto>`):**
```json
[
  {
    "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": 1,
    "username": "super_player",
    "theme": "green",
    "betAmount": 100,
    "crashMultiplier": 3.80,
    "cashoutMultiplier": 2.50,
    "winAmount": 250,
    "isWin": true,
    "status": "FINISHED",
    "createdAt": "2026-09-12T00:15:00Z"
  }
]
```

---

#### `GET /api/game/house-edge`
Просмотр персонального показателя преимущества казино (House Edge) для авторизованного игрока.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Ответ `200 OK` (`PlayerHouseEdgeResponse`):**
```json
{
  "userId": 1,
  "currentHouseEdge": 0.0425,
  "rtp": 0.9575,
  "expectedValue": -0.0425,
  "lastBetAmount": 100
}
```
*Поля:*
- `currentHouseEdge`: текущий $HE \in [0.005, 0.33]$.
- `rtp`: теоретический возврат игроку $RTP = 1 - HE$ (например, $0.9575 = 95.75\%$).
- `expectedValue`: матожидание раунда для игрока $EV = -HE$.
- `lastBetAmount`: размер предыдущей ставки (для проверки смены ставки).

#### `POST /api/game/house-edge/reset`
Сброс House Edge игрока к базовому значению `0.04` (4%) и очистка истории ставок (для тестирования).
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Ответ `200 OK`:** Объект `PlayerHouseEdgeResponse`.

#### `GET /api/game/boosters`
Получить каталог доступных бустеров и их стоимость во фрагментах.
- **Auth:** Не требуется (публичный эндпоинт для клиента)
- **Ответ `200 OK`:**
```json
[
  { "tier": 1, "multiplier": 1.0, "costFragments": 0 },
  { "tier": 2, "multiplier": 2.0, "costFragments": 2 },
  { "tier": 3, "multiplier": 3.0, "costFragments": 4 },
  { "tier": 4, "multiplier": 4.0, "costFragments": 6 }
]
```

---

### 3.6. Управление конфигурацией игры (Admin Config & Hot-Reload)

Модуль управления динамическими параметрами игры согласно ТЗ §1.9. Обеспечивает чтение параметров за $O(1)$ без нагрузки на базу данных на тиках WebSocket и горячее обновление без рестарта сервера.

#### `GET /api/admin/config`
Получить актуальную конфигурацию игры из in-memory кэша.
- **Headers:** `Authorization: Bearer <jwt_token>` (доступно всем авторизованным пользователям)
- **Ответ `200 OK`:**
```json
{
  "gameId": "air-balloon",
  "gameName": "Воздушный Шар",
  "isActive": true,
  "alpha": 1.30,
  "maxMultiplier": 100.0,
  "minCrashMultiplier": 1.01,
  "multiplierGrowthRate": 0.22,
  "growthAcceleration": 1.5,
  "pointsPerLine": 10,
  "pointsCashoutBonus": 25,
  "pointsBoosterBonus": 50,
  "boosterTierValues": [1.0, 2.0, 3.0, 4.0],
  "boosterCostFragments": [0, 2, 4, 6],
  "lootProbabilities": {
    "green": [0.0, 0.25, 0.20, 0.18, 0.15, 0.10, 0.07, 0.04, 0.01],
    "red": [0.0, 0.20, 0.18, 0.15, 0.13, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02, 0.01]
  },
  "minWinAmount": 50,
  "popupTimeout": 10
}
```

#### `PUT /api/admin/config`
Горячее обновление параметров игры (Hot-Reload). Сохраняет обновленный JSONB в таблице `game_configs` и атомарно заменяет ссылку в памяти `AtomicReference`.
- **Headers:** `Authorization: Bearer <jwt_token>` (роль `ADMIN`, иначе `403 Forbidden`)
- **Body:** JSON объект `GameConfigDto` (валидируется через Jakarta Validation: `@Positive`, `@DecimalMin`, `@Size(min=4, max=4)` и т.д.).
- **Ответ `200 OK`:** Обновленный объект `GameConfigDto`.
- **Ошибки:**
  - `400 Bad Request` — нарушение ограничений валидации параметров.
  - `401 Unauthorized` — отсутствует Bearer токен.
  - `403 Forbidden` — у пользователя нет роли `ADMIN`.

#### `POST /api/admin/config/reset`
Сброс параметров игры к эталонным заводским настройкам (ТЗ §1.9).
- **Headers:** `Authorization: Bearer <jwt_token>` (роль `ADMIN`)
- **Ответ `200 OK`:** Сброшенный объект `GameConfigDto` с дефолтными значениями.

#### `GET /api/admin/boosters/pricing`
Получить текущую сетку стоимости бустеров во фрагментах.
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Ответ `200 OK`:** Список объектов `BoosterTierPricingDto`.

#### `PUT /api/admin/boosters/pricing`
Обновить стоимость бустеров во фрагментах (применяется для всех последующих раундов).
- **Headers:** `Authorization: Bearer <jwt_token>` (роль `ADMIN`, иначе `403 Forbidden`)
- **Body:** Массив из 4 целых чисел `[costTier1, costTier2, costTier3, costTier4]`, например `[0, 2, 4, 6]`.
- **Ответ `200 OK`:** Обновленный список `BoosterTierPricingDto`.

---

### 3.7. Турнирная таблица и лидерборд (`/api/tournament/*`)

Модуль турнира и живого рейтинга. Обеспечивает учет очков игроков, суточный таймер турнира и расчет динамических призов для топ-3 участников.

#### `GET /api/tournament`
Получение полной информации о текущем турнире, таймере окончания, призах и списке участников.
- **Headers:** `Authorization: Bearer <jwt_token>` (опционально: при передаче токена поле `currentPlayerId` заполняется ID авторизованного игрока для подсветки строки «вы» в UI; при анонимном запросе возвращается `null`).
- **Ответ `200 OK` (`TournamentResponseDto`):**
```json
{
  "title": "Гран-при Воздухоплавателей Столото",
  "endsAt": 1789246799000,
  "entries": [
    {
      "place": 1,
      "playerId": "7",
      "playerName": "alex_pilot",
      "points": 3450,
      "prize": 3450
    },
    {
      "place": 2,
      "playerId": "8",
      "playerName": "sky_queen",
      "points": 2890,
      "prize": 1734
    },
    {
      "place": 3,
      "playerId": "9",
      "playerName": "wind_master",
      "points": 2410,
      "prize": 723
    },
    {
      "place": 4,
      "playerId": "10",
      "playerName": "aero_star",
      "points": 1980,
      "prize": 0
    }
  ],
  "currentPlayerId": "42"
}
```
*Ключевые поля:*
- `title`: название текущего турнира («Гран-при Воздухоплавателей Столото»).
- `endsAt`: timestamp завершения текущего турнира в epoch миллисекундах (конец суток 23:59:59 MSK).
- `entries`: отсортированный по убыванию очков список участников (до 50 записей).
- `place`: позиция участника в таблице (1, 2, 3...).
- `prize`: динамический призовой фонд в бонусах (рассчитывается только для топ-3: 1 место — 100%, 2 место — 60%, 3 место — 30% от набранных очков; начиная с 4 места — 0).
- `currentPlayerId`: ID авторизованного пользователя в виде строки или `null` при анонимном обращении.

---

#### `GET /api/tournament/leaderboard`
Получение компактного списка лидеров для виджета на главной странице или отдельного экрана живого рейтинга.
- **Query-параметры:**
  - `limit` (int, опционально, по умолчанию `50`): количество возвращаемых записей в топе.
- **Headers:** Не требуются (публичный эндпоинт).
- **Ответ `200 OK` (`List<LeaderboardEntryDto>`):**
```json
[
  {
    "playerId": "7",
    "playerName": "alex_pilot",
    "points": 3450
  },
  {
    "playerId": "8",
    "playerName": "sky_queen",
    "points": 2890
  },
  {
    "playerId": "9",
    "playerName": "wind_master",
    "points": 2410
  }
]
```

---

#### `POST /api/tournament/settle?force=false`
Финализация турнира и начисление наград победителям.
- **Логика работы:**
  1. Проверяет, завершился ли период турнира (`now >= endsAt`). Если турнир еще активен, без флага `force=true` возвращается статус `SKIPPED`.
  2. Проверяет идемпотентность: исключает повторную выплату за один и тот же период.
  3. Выбирает топ-3 участников:
     - 1 место: 100% от набранных очков (`prize = score`);
     - 2 место: 60% от набранных очков (`prize = round(score * 0.6)`);
     - 3 место: 30% от набранных очков (`prize = round(score * 0.3)`).
  4. Начисляет призовые бонусы на баланс игроков (`User.bonusBalance += prize`).
  5. Сохраняет записи в аудит-таблицу `tournament_history`.
  6. Сбрасывает очки в таблице `tournament_entries` (`score = 0`) для старта нового суточного турнира.
- **Автоматический запуск:** Метод также вызывается автоматически через **Quarkus Scheduler** ровно в полночь `00:00:00 MSK` (`@Scheduled(cron = "0 0 0 * * ?")`), а также проверяется каждую минуту на случай перезапуска сервера.
- **Query-параметры:**
  - `force` (boolean, опционально, по умолчанию `false`): принудительное завершение турнира до наступления 23:59:59 MSK (для ручного тестирования и демонстраций).
- **Ответ `200 OK` (`TournamentSettlementResultDto`):**
```json
{
  "status": "SUCCESS",
  "tournamentTitle": "Гран-при Воздухоплавателей Столото",
  "settledAt": 1789207734656,
  "rewardedPlayersCount": 3,
  "totalPrizesAwarded": 5907,
  "winners": [
    {
      "place": 1,
      "playerId": "7",
      "playerName": "alex_pilot",
      "score": 3450,
      "prizeAwarded": 3450,
      "awardedAt": "2026-09-12T10:08:54.663907Z"
    },
    {
      "place": 2,
      "playerId": "8",
      "playerName": "sky_queen",
      "score": 2890,
      "prizeAwarded": 1734,
      "awardedAt": "2026-09-12T10:08:54.681504Z"
    },
    {
      "place": 3,
      "playerId": "9",
      "playerName": "wind_master",
      "score": 2410,
      "prizeAwarded": 723,
      "awardedAt": "2026-09-12T10:08:54.684889Z"
    }
  ],
  "message": "Турнир успешно финализирован! Призы зачислены на баланс победителей."
}
```

---

#### `GET /api/tournament/history?my=false&limit=20`
Получение архива завершенных турниров и начисленных призов.
- **Query-параметры:**
  - `my` (boolean, опционально, по умолчанию `false`):
    - `false` — возвращает глобальную историю призеров всех турниров;
    - `true` — возвращает только историю наград текущего авторизованного игрока (требуется `Authorization: Bearer <jwt>`).
  - `limit` (int, опционально, по умолчанию `20`).
- **Ответ `200 OK` (`List<TournamentHistoryItemDto>`):**
```json
[
  {
    "place": 1,
    "playerId": "7",
    "playerName": "alex_pilot",
    "score": 3450,
    "prizeAwarded": 3450,
    "awardedAt": "2026-09-12T10:08:54.663907Z"
  }
]
```

---

## 4. Спецификация WebSocket API (`/ws/game`)

WebSocket обеспечивает полнодуплексный высокоскоростной стриминг тиков множителя в реальном времени с поддержкой до 60 кадров в секунду.

### 4.1. Подключение и рукопожатие (Handshake)

Клиент открывает соединение, передавая токен в строке запроса:
```
ws://localhost:8080/ws/game?token=eyJhbGciOiJSUzI1NiIs...
```
Если токен отсутствует или недействителен, сервер отправляет сообщение об ошибке и немедленно закрывает соединение.

### 4.2. Входящие сообщения (Client $\to$ Server)

Клиент может отправлять PING-сообщения для проверки канала связи:
- Текст сообщения: `"PING"`
- Сервер отвечает: `{"type": "PONG", "message": "PONG"}`

*(Примечание: Запуск раунда и кэшаут осуществляются через транзакционный REST API `POST /api/game/start` и `POST /api/game/cashout`, а WebSocket принимает push-обновления).*

---

### 4.3. Исходящие сообщения (Server $\to$ Client)

Все события отправляются в формате JSON с полем `"type"`.

#### 1. Событие успешного подключения `CONNECTED`
Отправляется сразу после проверки токена.
```json
{
  "type": "CONNECTED",
  "message": "Connected to game stream: super_player"
}
```

#### 2. Потоковый тик полета `TICK` (60 FPS)
Шлется каждые $\approx 16$ мс с момента взлета шара и до момента краха.
```json
{
  "type": "TICK",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "multiplier": 1.45,
  "elapsedMs": 6250
}
```
*Если активирован бустер, `multiplier` в тиках автоматически транслируется умноженным на множитель бустера.*

#### 3. Активация бустера `BOOSTER_ACTIVATED`
Отправляется ровно в момент, когда шар достигает уровня с маркером бустера (до нажатия кэшаута).
```json
{
  "type": "BOOSTER_ACTIVATED",
  "level": 5,
  "boosterMultiplier": 3,
  "previousMultiplier": 2.7,
  "currentMultiplier": 8.1,
  "bonusPoints": 30,
  "message": "Booster x3 activated!"
}
```
*Поля:*
- `level`: номер уровня, на котором сработал бустер.
- `boosterMultiplier`: кратность бустера (2, 3 или 4).
- `previousMultiplier`: множитель непосредственно перед скачком (например, 2.70).
- `currentMultiplier`: новый множитель после скачка ($2.70 \times 3 = 8.10$).
- `bonusPoints`: начисленные бонусные очки (`boosterMultiplier * 10`).

#### 4. Подтверждение забора выигрыша `CASHOUT`
Пушится сразу после успешного вызова `POST /api/game/cashout`.
```json
{
  "type": "CASHOUT",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "multiplier": 2.50,
  "winAmount": 250,
  "newBalance": 1150,
  "pointsEarned": 90,
  "levelsPassed": 4,
  "boosterActivated": true,
  "message": "Cashout successful",
  "reward": {
    "kind": "puzzle-piece",
    "pieceId": "piece_3",
    "label": "Фрагмент 3",
    "collected": 3,
    "total": 9
  },
  "unlockedAchievements": [
    {
      "id": "lucky_start",
      "title": "Удачный старт",
      "description": "Выиграть свой первый раунд",
      "letter": "У",
      "unlockedAt": 1726099200000
    }
  ]
}
```
*Важно (по CASE.md):* Даже после получения `CASHOUT` шар продолжает лететь и стримить события `TICK` до момента точки краха! Выигрыш игрока зафиксирован и больше не меняется.

#### 5. Крах шара `CRASHED`
Отправляется в момент, когда шар лопнул (достиг $t_{crash}$).
```json
{
  "type": "CRASHED",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "crashMultiplier": 3.80,
  "winAmount": 0,
  "newBalance": 900,
  "elapsedMs": 14200,
  "pointsEarned": 30,
  "levelsPassed": 3,
  "boosterActivated": false,
  "message": "Balloon crashed!",
  "reward": {
    "kind": "puzzle-piece",
    "pieceId": "none",
    "label": "Без фрагмента",
    "collected": 2,
    "total": 9
  },
  "unlockedAchievements": []
}
```
После этого события клиент показывает финальный экран результатов (выигрыш или сгорание ставки) со всеми заработанными очками и пройденными уровнями.

#### 6. Ошибка `ERROR`
```json
{
  "type": "ERROR",
  "message": "Token required: /ws/game?token=<jwt>"
}
```

---

## 5. Спецификация Server-Sent Events (SSE) API (`/api/tournament/*/stream`)

Server-Sent Events (SSE) обеспечивают потоковую доставку турнирной таблицы и живого рейтинга в реальном времени взамен короткого HTTP-поллинга.

### 5.1. Архитектура и транспорт
- **Протокол:** HTTP Server-Sent Events (`Accept: text/event-stream`, ответ `Content-Type: text/event-stream;charset=UTF-8`).
- **Частота тиков:** Ровно **1 Гц** (каждую 1.0 секунду) с моментальным стартовым снимком при подключении (задержка первого тика $\le 10$ мс).
- **Пул потоков:** Обработка тиков и формирование снимков производятся реактивным движком SmallRye Mutiny на пуле рабочих потоков (`Infrastructure.getDefaultWorkerPool()`), что полностью исключает блокировку реактивного цикла Vert.x EventLoop.
- **Изоляция L1-кэша:** Перед каждой выборкой лидеров выполняется сброс контекста постоянства (`EntityManager.clear()`), что гарантирует моментальное отражение очков, начисленных в фоновом режиме через нативный SQL UPSERT игрового движка.
- **Авторизация:** Стримы полностью **публичны** (`currentPlayerId` в широковещательном потоке всегда `null`). Клиент сопоставляет строки со своим локальным `user.id` из сессионного хранилища и подсвечивает строку игрока («вы»).
- **Отказоустойчивость:** При разрыве соединения браузерный `EventSource` выполняет автоматический реконнект без потери состояния.

---

### 5.2. Стрим компактного рейтинга `GET /api/tournament/leaderboard/stream`
Транслирует актуальный снимок топ-50 участников для виджета рейтинга или страницы `/leaderboard`.
- **Формат события:**
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream;charset=UTF-8

data:[{"playerId":"7","playerName":"alex_pilot","points":3450},{"playerId":"8","playerName":"sky_queen","points":2890},{"playerId":"9","playerName":"wind_master","points":2410}]

data:[{"playerId":"7","playerName":"alex_pilot","points":3450},{"playerId":"8","playerName":"sky_queen","points":2890},{"playerId":"9","playerName":"wind_master","points":2410}]
```
- **Тело события:** Массив объектов `LeaderboardEntryDto`:
  - `playerId` (string): ID игрока;
  - `playerName` (string): имя пользователя;
  - `points` (number): набранные турнирные очки.

---

### 5.3. Стрим турнирной таблицы `GET /api/tournament/stream`
Транслирует полную турнирную таблицу с расчетом призовых мест и таймером до конца суток.
- **Формат события:**
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream;charset=UTF-8

data:{"title":"Гран-при Воздухоплавателей Столото","endsAt":1789246799000,"entries":[{"place":1,"playerId":"7","playerName":"alex_pilot","points":3450,"prize":3450},{"place":2,"playerId":"8","playerName":"sky_queen","points":2890,"prize":1734},{"place":3,"playerId":"9","playerName":"wind_master","points":2410,"prize":723},{"place":4,"playerId":"10","playerName":"aero_star","points":1980,"prize":0}],"currentPlayerId":null}
```
- **Тело события:** Объект `TournamentResponseDto` (с динамическими призами для топ-3).

---

### 5.4. Пример интеграции на клиенте (TypeScript / React)

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LeaderboardEntryDto, TournamentResponseDto } from './contract';

export function useTournamentStreams(baseUrl = 'http://localhost:8080') {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Стрим живого рейтинга (Leaderboard)
    const esLeaderboard = new EventSource(`${baseUrl}/api/tournament/leaderboard/stream`);
    esLeaderboard.onmessage = (event) => {
      try {
        const data: LeaderboardEntryDto[] = JSON.parse(event.data);
        queryClient.setQueryData(['leaderboard'], data);
      } catch (err) {
        console.error('Failed to parse leaderboard SSE event', err);
      }
    };

    // 2. Стрим полной турнирной таблицы (Tournament)
    const esTournament = new EventSource(`${baseUrl}/api/tournament/stream`);
    esTournament.onmessage = (event) => {
      try {
        const data: TournamentResponseDto = JSON.parse(event.data);
        queryClient.setQueryData(['tournament'], data);
      } catch (err) {
        console.error('Failed to parse tournament SSE event', err);
      }
    };

    return () => {
      esLeaderboard.close();
      esTournament.close();
    };
  }, [baseUrl, queryClient]);
}
```

---

## 6. Механика уровней, бустеров и очков (CASE.md)

### 6.1. Темы и уровни

| Параметр | Зеленая тема (`"green"`) | Красная тема (`"red"`) |
|---|:---:|:---:|
| **Всего уровней** | **9 уровней** | **12 уровней** |
| **Разблокировка Cashout** | **Уровень 1 ($1.20\times$)** | **Уровень 1 ($1.15\times$)** |
| **Пороги уровней** | 1.20, 1.50, 2.00, 2.60, 3.50, 5.00, 7.50, 12.00, 20.00 | 1.15, 1.35, 1.65, 2.10, 2.80, 3.80, 5.20, 7.20, 10.50, 16.00, 25.00, 50.00 |

### 6.2. Правила начисления очков
- За каждый пересеченный уровень: `+10 очков`.
- За активацию бустера: `+ (boosterMultiplier * 10) очков`.
- За успешный кэшаут (фиксация выигрыша): `+50 очков`.
- При крахе без кэшаута: начисляются очки только за фактически пройденные уровни (и активированный бустер, если он был пройден до взрыва).

### 6.3. Правила бустеров
1. При выборе ставки с бустером ($\times 2, \times 3, \times 4$) сервер случайно и честно выбирает уровень размещения маркера бустера: от 2-го уровня до $(totalLevels - 2)$.
2. Если шар пересекает уровень бустера **до** того, как игрок нажал «Забрать»:
   - Коэффициент мгновенно умножается на `boosterMultiplier`.
   - В WebSocket летит событие `BOOSTER_ACTIVATED`.
3. Если игрок нажал «Забрать» **до** уровня бустера, бустер **не** активируется (даже когда шар долетит до него в визуальном продолжении полета).

### 6.4. Динамическая сетка призов турнира
На призовых местах могут находиться одновременно **только 3 пользователя**:
- **1 место:** 100% от набранных очков участника (`prize = points`).
- **2 место:** 60% от набранных очков участника (`prize = Math.round(points * 0.6)`).
- **3 место:** 30% от набранных очков участника (`prize = Math.round(points * 0.3)`).
- **4+ места:** призовые бонусы не начисляются (`prize = 0`).
---

## 7. Мета-игра: Коллекция пазлов, динамические ранги и система достижений (ТЗ §1.5)

Модуль удержания (Retention & Gamification), реализованный в сервисе `MetaGameService` на базе миграции `V1.0.9`. Обеспечивает долгосрочную мотивацию игроков, наглядный прогресс в профиле и автоматическое поощрение за активность.

### 7.1. Коллекция пазлов и алгоритм дропа (Bad Luck Protection & Pity Timer)
- **Каталог пазла:** Всего **9 тематических фрагментов** (`piece_1` .. `piece_9`), общее количество `puzzleTotal = 9`.
  - `piece_1`: «Фрагмент 1»
  - `piece_2`: «Фрагмент 2»
  - `piece_3`: «Фрагмент 3»
  - `piece_4`: «Фрагмент 4»
  - `piece_5`: «Фрагмент 5»
  - `piece_6`: «Фрагмент 6»
  - `piece_7`: «Фрагмент 7»
  - `piece_8`: «Фрагмент 8»
  - `piece_9`: «Фрагмент 9»
- **Pity Timer (гарантия выпадения):**
  - Базовый шанс выпадения фрагмента за раунд составляет **30%**.
  - За каждый сыгранный раунд без выпадения счетчик `users.puzzle_pity` увеличивается на `+1`, добавляя **+20%** к вероятности дропа:
    $$\text{DropChance} = \min(1.0, \; 0.30 + \text{pity} \times 0.20)$$
  - При выпадении фрагмента счетчик pity сбрасывается в `0`.
- **Bad Luck Protection (защита от дубликатов):**
  - Сервер запрашивает список уже собранных игроком фрагментов в таблице `user_puzzle_pieces`.
  - При срабатывании шанса дропа случайным образом выбирается **только недостающий** фрагмент:
    $$\text{missingPieces} = \text{ALL\_PIECES} \setminus \text{collectedPieces}$$
  - Дубликаты фрагментов математически исключены. Игрок гарантированно собирает полную коллекцию за разумное число раундов.
  - Когда все 9 фрагментов собраны, в результате раунда возвращается `RewardDto("completed", "Коллекция собрана", 9, 9)`.

### 7.2. Динамические ранги игрока по чистой прибыли
Ранг пересчитывается динамически на основе совокупных финансовых показателей игрока по всем завершенным раундам:
$$\text{Profit} = \text{totalPayout} - \text{totalWagered}$$

Шкала 6 канонических рангов Столото:
| Ранг ID | Название | Мин. прибыль ($minProfit$) | Следующий ранг | Порог ($nextAt$) |
|---|---|:---:|---|:---:|
| `novice` | **Новичок** | $0$ | Любитель | $500$ |
| `amateur` | **Любитель** | $500$ | Воздухоплаватель | $2\,000$ |
| `aeronaut` | **Воздухоплаватель** | $2\,000$ | Капитан | $5\,000$ |
| `captain` | **Капитан** | $5\,000$ | Мастер ветра | $15\,000$ |
| `wind_master` | **Мастер ветра** | $15\,000$ | Легенда небес | $50\,000$ |
| `sky_legend` | **Легенда небес** | $50\,000$ | — *(максимальный)* | `null` |

*Примечание:* При отрицательной прибыли ($profit < 0$) игрок находится на ранге `novice` («Новичок»), а поле `profit` точно отражает текущий финансовый результат (например, `-250`).

### 7.3. Каталог 10 достижений игры
Каждое достижение содержит уникальную букву `letter` для визуального рендеринга круглого бейджа в профиле и всплывающих тостах `AchievementToast`:

| ID достижения | Название | Буква | Описание | Критерий разблокировки |
|---|---|:---:|---|---|
| `first_flight` | **Первый полет** | **П** | Сыграть первый раунд в игре | `roundsPlayed >= 1` |
| `lucky_start` | **Удачный старт** | **У** | Выиграть свой первый раунд | `roundsWon >= 1` или текущий кэшаут |
| `high_flight_5x` | **Высокий полет (x5+)** | **В** | Забрать выигрыш на множителе x5 или выше | `bestMultiplier >= 5.0` |
| `stratosphere_10x` | **Стратосфера (x10+)** | **С** | Забрать выигрыш на множителе x10 или выше | `bestMultiplier >= 10.0` |
| `risky_captain` | **Рисковый капитан** | **Р** | Забрать выигрыш на множителе x20 или выше | `bestMultiplier >= 20.0` |
| `win_streak_3` | **Серия побед** | **П** | Одержать победу в 3 раундах подряд | 3 подряд раунда с `isWin = true` в истории |
| `booster_master` | **Мастер бустеров** | **М** | Активировать бустер во время полета | `boosterActivated == true` в раунде |
| `puzzle_collector` | **Коллекционер пазлов** | **К** | Собрать все 9 фрагментов пазла | `collectedPieces >= 9` |
| `high_roller` | **Щедрый игрок** | **Щ** | Сделать ставку от 250 бонусов за раунд | `maxBet >= 250` или текущая ставка $\ge 250$ |
| `sky_legend` | **Легенда небес** | **Л** | Достичь наивысшего ранга «Легенда небес» | `profit >= 50000` |

---

## 8. Математическая модель Provably Fair и House Edge

### 8.1. Provably Fair генерация точки краха (HMAC-SHA256)
Сервер рассчитывает коэффициент краха до старта раунда:
1. `h = first_52_bits( HMAC_SHA256( server_seed, client_seed + ":" + nonce ) )`
2. $e = 2^{52} = 4{,}503{,}599{,}627{,}370{,}496$
3. Точный расчет:
   $$M_{raw} = \max\left(1.00, \; \frac{100 \cdot e - h}{e - h} \cdot \frac{1 - HE}{100}\right)$$
4. Итоговый множитель округляется вниз до 2 знаков:
   $$M_{crash} = \max\left(1.00, \; \frac{\lfloor M_{raw} \cdot 100 \rfloor}{100}\right)$$

### 8.2. Динамический расчет House Edge игрока
Позволяет балансировать математическое ожидание в зависимости от результатов предыдущих раундов:
- $HE_{base} = 0.04$, $HE_{min} = 0.005$, $HE_{max} = 0.33$.
- Вес выигрыша: $W(n) = \max(1, \; k_{cashout} - 1)$.
- Приращение $\Delta HE(n)$:
  $$\Delta HE(n) = \begin{cases} 
  (1.01)^{W(n)} - 1, & \text{при победе [WIN]} \\
  -0.01, & \text{при проигрыше [LOSS]}
  \end{cases} + (HE_{base} - HE(n)) \cdot [bet(n) \neq bet(n-1)]$$
- Новый House Edge:
  $$HE(n+1) = \text{clamp}(HE(n) + \Delta HE(n), \; 0.005, \; 0.33)$$

---

## 9. TypeScript контракты (Интерфейсы для фронтенда)

```typescript
// ==================== REST Contracts ====================

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  bonusBalance: number;
  points: number;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface TopUpBalanceResponse {
  userId: number;
  username: string;
  addedAmount: number;
  newBalance: number;
}

export interface StartRoundRequest {
  betAmount?: number;
  cost?: number; // алиас фронтенда для betAmount
  theme?: "green" | "red";
  boosterMultiplier?: 1 | 2 | 3 | 4;
  boosterTier?: 1 | 2 | 3 | 4; // алиас фронтенда для boosterMultiplier
}

export interface GameRoundStartResult {
  roundId: string;
  startTime: string;
  initialMultiplier: number;
  growthRate: number; // 0.06
  provablyFairHash: string;
  betAmount: number;
  boosterMultiplier: number;
  boosterLevel: number | null;
  totalLevels: number; // 9 or 12
  unlockCashoutMultiplier: number; // 1.20 or 1.15
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

// ==================== Tournament & Leaderboard Contracts ====================

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
  prize: number;
}

export interface TournamentResponseDto {
  title: string;
  endsAt: number; // epoch ms (23:59:59 MSK)
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

// ==================== WebSocket Contracts ====================

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

// ==================== Meta-Game & Rewards Contracts ====================

export interface RewardDto {
  kind: "puzzle-piece";
  pieceId: string;
  label: string;
  collected: number;
  total: number;
}

export interface RankDto {
  id: string;
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
  letter: string;
  unlockedAt: number | null; // epoch ms or null if locked
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
  puzzle: string[];
  puzzleTotal: number; // 9
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
  generosity: number;    // 0.0 - 10.0 (Размах / Щедрость ставки)
  winRate: number;       // 0.0 - 10.0 (Винрейт за окно)
  risk: number;          // 0.0 - 10.0 (Азарт / Риск)
  gamesAnalyzed: number; // Число раундов в окне (0 - 30)
  totalGames: number;    // Всего сыгранных игр
  nextRecalcIn: number;  // Игр до следующего пересчета (1 - 10)
}
```

---

## 10. Клиентская проверка Provably Fair (TypeScript)

Для проверки честности любого сыгранного раунда клиент может локально выполнить вычисление:

```typescript
import { createHmac } from "crypto";

export function verifyRound(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge: number,
  expectedCrash: number
): boolean {
  const combinedSeed = `${clientSeed}:${nonce}`;
  const hmac = createHmac("sha256", Buffer.from(serverSeed, "utf-8"))
    .update(Buffer.from(combinedSeed, "utf-8"))
    .digest();

  // Первые 52 бита (первые 6 байт + 4 бита 7-го байта)
  let h = 0n;
  for (let i = 0; i < 6; i++) {
    h = (h << 8n) | BigInt(hmac[i]);
  }
  h = (h << 4n) | BigInt(hmac[6] >> 4);

  const e = 1n << 52n; // 2^52
  const eNum = Number(e);
  const hNum = Number(h);

  const rawCrash = Math.max(
    1.00,
    ((100 * eNum - hNum) / (eNum - hNum)) * (1.0 - houseEdge) / 100.0
  );
  const floored = Math.max(1.00, Math.floor(rawCrash * 100) / 100);

  return Math.abs(floored - expectedCrash) < 1e-6;
}
```

---

## 11. Формат сообщений об ошибках (`ErrorResponse`)

В случае ошибок REST API всегда возвращает стандартизированный JSON:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Вывод доступен только после прохождения 1-го уровня (коэффициент не ниже 1.2x)",
  "timestamp": "2026-09-12T00:20:00.000Z"
}
```

### Коды ошибок:
- `400 Bad Request` — ошибка валидации входных параметров, недостаточный баланс, попытка кэшаута до 1-го уровня.
- `401 Unauthorized` — отсутствует, недействителен или просрочен JWT токен.
- `404 Not Found` — запрашиваемый ресурс (раунд, пользователь) не найден.
- `409 Conflict` — конфликт уникальности (например, логин или email уже занят).
- `500 Internal Server Error` — внутренняя ошибка сервера.
