# Архитектура и устройство бэкенда (As-Built)

Статус: as-built / current · сверено: 2026-09-11

Authoritative Game Server для бонусной crash-игры «Воздушный Шар» (чемпионат «Столото»).

---

## 1. Стек и среда исполнения

- **Платформа:** Java 21+ (Loom Virtual Threads via `@RunOnVirtualThread`). Линейный синхронный код без `Uni`/`Multi`.
- **Фреймворк:** Quarkus 3.x (RESTEasy Reactive, Hibernate ORM with Panache, WebSockets Next).
- **СУБД:** PostgreSQL 16+ с версионированными миграциями Flyway (`src/main/resources/db/migration/`).
- **Сборка & Запуск:** `./mvnw quarkus:dev` (порт 8080).

---

## 2. Реализованные модули (Current / As-Built)

### 2.1. Авторизация и пользователи
- **Сущность:** `User` (`users` таблица: `id`, `username`, `email`, `password_hash`, `bonus_balance`, `role`).
- **Безопасность:** `TokenService` (HMAC256 JWT, claims: `userId`, `username`), `SecurityService` (BCrypt хэширование).
- **REST Endpoints:**
  - `POST /api/auth/register` — регистрация нового игрока (начисление стартовых 1000 бонусов).
  - `POST /api/auth/login` — аутентификация по логину/паролю, выдача JWT Bearer.
  - `GET /api/auth/me` — профиль текущего авторизованного пользователя.
  - `GET /api/users` — пагинированный список пользователей (Panache Page).
  - `GET /api/ping` — healthcheck / ping.
- **DTOs:** Все DTO оформлены как Java `record` (`LoginRequest`, `RegisterRequest`, `UserProfileResponse`, `AuthResponse`).
- **Обработка ошибок:** `AppExceptionMapper` перехватывает `AppException` (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ConflictException`) и возвращает JSON `ErrorResponse(status, message, timestamp)`.

### 2.2. Математическое ядро игры (Provably Fair & House Edge)
- **Пакет:** `com.hack2026.mog.math`
- **`CrashGenerator`:**
  - HMAC-SHA256 генерация множителя краха по формуле Provably Fair:
    $h = \text{first\_52\_bits}(\text{HMAC\_SHA256}(server\_seed, combined\_seed))$
    $\text{crash} = \max(1.00, \frac{100 \cdot e - h}{e - h} \cdot \frac{1 - HE(n)}{100})$
  - Поддержка детерминированного тестирования (`GAME_DEV_SEED`).
- **`HouseEdgeCalculator` & `HouseEdgeConfig`:** Динамический расчет маржи казино $HE(n)$ для удержания математического ожидания.

---

## 3. Схема базы данных (Flyway V1.0.0 & V1.0.1)

1. `users` — профили, хэши паролей, баланс бонусов (`bonus_balance`).
2. `game_configs` — таблица JSONB конфигураций с hot-reload.
3. `game_rounds` — история завершенных раундов (UUID, ставка, бустер, краш-множитель, cashout, выигрыш, очки).
4. `tournament_entries` — рейтинговая таблица турнира (user_id, score).

---

## 4. Запланированные модули (Pending Implementation)

1. **`GameLoopService`:** серверный цикл полета шара (60 fps / тики 100мс), расчет роста множителя.
2. **`GameWebSocket`:** Quarkus WebSockets Next (`/ws/game/{gameId}`) для стриминга множителей, событий краха и ставок других игроков в реальном времени.
3. **`BetService`:** списание ставки с `bonus_balance` внутри `@Transactional`, валидация cashout до точки краха, начисление выигрыша.
4. **`TournamentService`:** начисление турнирных очков за успешные полеты, стриминг лидерборда.
