# Решенные задачи хакатона (Resolved Backlog)

Статус: reference / current · сверено: 2026-09-12

База прецедентов: закрытые задачи с описанием решения. Перед исправлением бага или написанием похожего кода сверяйтесь с этим списком, чтобы не изобретать велосипед и не вносить регрессии.

---

- [x] **AUTH-1: Регистрация и логин по JWT** — Сделаны `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Пароли хэшируются через `SecurityService` (BCrypt), токены подписываются HMAC-SHA256 в `TokenService`. Стартовый баланс 1000 бонусов.
- [x] **AUTH-2: Единый формат ошибок** — Настроен `AppExceptionMapper` для обработки `AppException` с возвратом `ErrorResponse(status, message, timestamp)` вместо сырых стектрейсов.
- [x] **MATH-1: Provably Fair Crash Generator** — Реализован `CrashGenerator` на базе HMAC-SHA256 (первые 52 бита энтропии). Поддерживает внешний сид и `GAME_DEV_SEED` для детерминированного воспроизведения в тестах.
- [x] **MATH-2: House Edge & Ожидание казино** — Реализован `HouseEdgeCalculator` с конфигурацией `HouseEdgeConfig`, гарантирующий математическое ожидание сервера при бонусах и множителях.
- [x] **DB-1: Базовая схема PostgreSQL Flyway** — Написаны миграции `V1.0.0__initial_schema.sql` и `V1.0.1__add_user_profile_fields.sql` (таблицы `users`, `game_configs`, `game_rounds`, `tournament_entries`).
- [x] **DOC-1: OpenAPI 3.1 спецификация** — Сгенерирован файл [OPENAPI.yaml](../OPENAPI.yaml) с описанием схемы и интерактивный Swagger UI на `/q/swagger-ui`.
- [x] **GAME-1 & GAME-2: Внутренний GameService и транзакционный баланс** — Реализован `GameService` с атомарным списанием ставки при старте (`POST /api/game/start`), серверным Provably Fair расчетом точки краха (`CrashGenerator`), валидацией времени и фиксацией выигрыша (`POST /api/game/cashout`). Персональный House Edge хранится в `users` и пересчитывается после каждого исхода.
- [x] **WS-1, WS-2, WS-3: Representation Layer (REST & WebSocket 60 FPS)** — Реализован `GameResource` (`/api/game/*`) и полнодуплексный WebSocket `GameWebSocket` (`/ws/game`) на Quarkus WebSockets Next со стримингом тиков на виртуальных потоках со скоростью 60 FPS (~16 мс) до момента краха. DTO records в пакете `com.hack2026.mog.dto.game`.
- [x] **GAME-3: Синхронизация с контрактами фронтенда (Feedback 1)** — Добавлена колонка `points` в `users` (миграция `V1.0.5`), создан seed-администратор `admin`/`admin123` (роль `ADMIN`, 50k бонусов), обеспечена толерантность формата `POST /api/game/start` (алиасы `cost`/`betAmount`, `boosterTier`/`boosterMultiplier`), расширены WebSocket-события `CRASHED` (`pointsEarned`, `levelsPassed`, `boosterActivated`, `newBalance`) и `CASHOUT`, добавлен тестовый эндпоинт `POST /api/game/top-up`, HTTP-логирование `LoggingFilter`, и переключен фронтенд на реальный бэкенд через `frontend/.env`.
- [x] **META-1: Коллекция пазлов (ТЗ §1.5)** — Создана миграция `V1.0.9`, таблица `user_puzzle_pieces` и счетчик `users.puzzle_pity`. Реализована выдача фрагментов с защитой от неудач (Bad Luck Protection — выбор только неполученных деталей) и Pity Timer (+20% за каждый пустой раунд). Возврат `reward: RewardDto` в `CASHOUT` и `CRASHED` событиях WebSocket и REST `POST /api/game/cashout`.
- [x] **META-2: Динамические ранги игрока** — Формула чистой прибыли `profit = totalPayout - totalWagered`. 6 канонических рангов Столото (`novice`, `amateur`, `aeronaut`, `captain`, `wind_master`, `sky_legend`) с прогрессом до следующего уровня и порогом `nextAt`.
- [x] **META-3: Система достижений (10 ачивок)** — Таблица `user_achievements`. 10 канонических достижений с буквами для UI-бейджей и тостов. Автоматическая проверка критериев в `GameService` после каждого раунда и возврат списка `unlockedAchievements`.
- [x] **META-4: Расширенный профиль игрока** — Эндпоинты `GET /api/users/me` и `GET /api/users/{id}` возвращают `ProfileDto`, строго соответствующий `profileSchema` фронтенда (`user`, `puzzle`, `puzzleTotal`, `roundsPlayed`, `roundsWon`, `bestMultiplier`, `totalWagered`, `totalPayout`, `rank`, `achievements`). Быстрый расчет статистики через индекс `idx_game_rounds_user_stats`.

