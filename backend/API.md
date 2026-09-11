# MOG Backend API & WebSocket Specification (Authoritative Reference)

> **Статус документа:** Актуален · Версия: 1.1.0 · Среда: Quarkus 3.x / Java 21 Loom / PostgreSQL 16  
> **Целевая аудитория:** AI-агенты, фронтенд-разработчики, тестировщики и интеграторы.  
> **Базовый HTTP URL:** `http://localhost:8080`  
> **Базовый WebSocket URL:** `ws://localhost:8080`

---

## 1. Архитектурный контекст и общие правила

1. **Server-Authoritative:** Все ключевые игровые решения (точка краха шара, множители, позиция и активация бустера, списание ставки, начисление выигрыша и турнирных очков) вычисляются и проверяются исключительно сервером. Клиент лишь визуализирует состояние.
2. **Формат данных:** Все HTTP REST запросы и ответы имеют заголовок `Content-Type: application/json`. Дата и время передаются в формате ISO-8601 UTC (например, `2026-09-12T10:15:30.123456Z`).
3. **Аутентификация:** Используется **JWT Bearer Token** (`Authorization: Bearer <token>`) с временем жизни 24 часа. Для WebSocket токен передается в query-параметре: `/ws/game?token=<jwt_token>`.
4. **Математическая модель полета:** Рост коэффициента подчиняется непрерывной экспоненциальной формуле:
   $$M(t) = 1.00 \cdot e^{k \cdot t_{sec}} \quad \text{где } k = 0.06$$
   При $k = 0.06$ множитель $2.00\times$ достигается за $\approx 11.55$ секунд. Время краха:
   $$t_{crash} = \frac{\ln(M_{crash})}{k}$$
5. **Real-time стриминг:** Сервер пушит тики множителя по WebSocket с частотой **60 FPS** (интервал $\approx 16$ мс) на легковесных виртуальных потоках (Virtual Threads).

---

## 2. Сводная таблица контрактов

### 2.1. REST API

| Метод | Путь | Auth | Описание |
|---|---|:---:|---|
| `GET` | `/api/ping` | Нет | Проверка работоспособности бэкенда (Healthcheck) |
| `POST` | `/api/auth/register` | Нет | Регистрация нового игрока (выдает токен + 1000 бонусов) |
| `POST` | `/api/auth/login` | Нет | Аутентификация по username/email и паролю (выдает токен) |
| `GET` | `/api/auth/me` | JWT | Получение профиля текущего авторизованного пользователя |
| `GET` | `/api/users/me` | JWT | Получить собственный расширенный профиль |
| `PUT` | `/api/users/me` | JWT | Обновить данные профиля (username, email, имя, аватар) |
| `PUT` | `/api/users/me/password`| JWT | Сменить пароль (требует текущий пароль) |
| `DELETE`| `/api/users/me` | JWT | Удалить свой аккаунт |
| `GET` | `/api/users/{id}` | Нет | Получить публичный профиль игрока по ID |
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

### 2.2. WebSocket

| Протокол | Эндпоинт | Auth | Описание |
|---|---|:---:|---|
| `WS` | `/ws/game?token=<jwt>` | Query JWT | Полнодуплексный 60 FPS стрим тиков, бустеров и краха |

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
- **Headers:** `Authorization: Bearer <jwt_token>`
- **Ответ `200 OK`:** Объект `UserProfileResponse`.

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
Публичный профиль по ID.
- **Ответ `200 OK`:** `UserProfileResponse`.
- **Ошибки:** `404 Not Found`.

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
  "nonce": 1726099200000
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
  "nonce": 1726099200000
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
  "message": "Cashout successful"
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
  "elapsedMs": 14200,
  "pointsEarned": 30,
  "levelsPassed": 3,
  "boosterActivated": false,
  "message": "Balloon crashed!"
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

## 5. Механика уровней, бустеров и очков (CASE.md)

### 5.1. Темы и уровни

| Параметр | Зеленая тема (`"green"`) | Красная тема (`"red"`) |
|---|:---:|:---:|
| **Всего уровней** | **9 уровней** | **12 уровней** |
| **Разблокировка Cashout** | **Уровень 1 ($1.20\times$)** | **Уровень 1 ($1.15\times$)** |
| **Пороги уровней** | 1.20, 1.50, 2.00, 2.60, 3.50, 5.00, 7.50, 12.00, 20.00 | 1.15, 1.35, 1.65, 2.10, 2.80, 3.80, 5.20, 7.20, 10.50, 16.00, 25.00, 50.00 |

### 5.2. Правила начисления очков
- За каждый пересеченный уровень: `+10 очков`.
- За активацию бустера: `+ (boosterMultiplier * 10) очков`.
- За успешный кэшаут (фиксация выигрыша): `+50 очков`.
- При крахе без кэшаута: начисляются очки только за фактически пройденные уровни (и активированный бустер, если он был пройден до взрыва).

### 5.3. Правила бустеров
1. При выборе ставки с бустером ($\times 2, \times 3, \times 4$) сервер случайно и честно выбирает уровень размещения маркера бустера: от 2-го уровня до $(totalLevels - 2)$.
2. Если шар пересекает уровень бустера **до** того, как игрок нажал «Забрать»:
   - Коэффициент мгновенно умножается на `boosterMultiplier`.
   - В WebSocket летит событие `BOOSTER_ACTIVATED`.
3. Если игрок нажал «Забрать» **до** уровня бустера, бустер **не** активируется (даже когда шар долетит до него в визуальном продолжении полета).

---

## 6. Математическая модель Provably Fair и House Edge

### 6.1. Provably Fair генерация точки краха (HMAC-SHA256)
Сервер рассчитывает коэффициент краха до старта раунда:
1. `h = first_52_bits( HMAC_SHA256( server_seed, client_seed + ":" + nonce ) )`
2. $e = 2^{52} = 4{,}503{,}599{,}627{,}370{,}496$
3. Точный расчет:
   $$M_{raw} = \max\left(1.00, \; \frac{100 \cdot e - h}{e - h} \cdot \frac{1 - HE}{100}\right)$$
4. Итоговый множитель округляется вниз до 2 знаков:
   $$M_{crash} = \max\left(1.00, \; \frac{\lfloor M_{raw} \cdot 100 \rfloor}{100}\right)$$

### 6.2. Динамический расчет House Edge игрока
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

## 7. TypeScript контракты (Интерфейсы для фронтенда)

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
}
```

---

## 8. Клиентская проверка Provably Fair (TypeScript)

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

## 9. Формат сообщений об ошибках (`ErrorResponse`)

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
