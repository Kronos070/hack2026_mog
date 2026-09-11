# Handoff: Игровой цикл и WebSocket стриминг (Game Core)

Статус: plan / current · сверено: 2026-09-11

Переход от базовой авторизации и изолированной математики к работающему игровому серверу: запуск раундов, тики полета шара, прием ставок и валидация cashout.

---

## 1. Что загрузить в начале сессии

1. [specs-map.md](specs-map.md) — обзорная карта системы.
2. [spec-architecture.md](spec-architecture.md) — архитектура и модели базы данных.
3. `src/main/java/com/hack2026/mog/math/CrashGenerator.java` — готовый генератор точки краха (Provably Fair HMAC-SHA256).
4. `src/main/resources/db/migration/V1.0.0__initial_schema.sql` (секция `game_rounds` и `game_configs`) — целевая схема для раундов.

**Что НЕ загружать целиком (Anti-List):**
- Сервисы авторизации (`AuthService.java`, `UserService.java`, `TokenService.java`) — они стабильны, не тратить токены.
- `pom.xml` и `docker-compose.yml` — только точечный поиск при необходимости.

---

## 2. Задача

1. Создать DTO (Java Records) для WebSocket-сообщений:
   - `RoundStateMessage` (состояние: WAITING, FLYING, CRASHED),
   - `MultiplierTickMessage` (текущий множитель, время полета),
   - `CashoutActionMessage` / `BetActionMessage`.
2. Реализовать `GameLoopService`:
   - Авторитетный серверный таймер раунда на виртуальном потоке (`@RunOnVirtualThread`).
   - Хранение активного раунда в памяти (`AtomicReference<ActiveRound>` или `ConcurrentHashMap`).
   - Предварительный расчет точки краха через `CrashGenerator` перед стартом полета.
3. Реализовать WebSocket эндпоинт (`/ws/game`) через Quarkus WebSockets Next:
   - Рассылка тиков всем подключенным клиентам.
   - Уведомление о крахе шара и завершении раунда.
4. Связать ставки с балансом пользователя в БД: списание при ставке, начисление при успешном cashout внутри `@Transactional`.

---

## 3. Границы и правила (Scope Rules)

- **Финансовые транзакции:** списание ставки и начисление выигрыша на `bonus_balance` — строго внутри `@Transactional`.
- **Без реактивного бойлерплейта:** никакого `Uni`/`Multi` из Mutiny. Линейный блокирующий код на Virtual Threads (`@RunOnVirtualThread`).
- **Изоляция:** не ломать существующие REST эндпоинты `/api/auth/*`.

---

## 4. Не перерешивать (Locked Decisions)

- 🔒 **Модель конкурентности:** Java 21 Loom Virtual Threads. Не переходить на Reactor / WebFlux / Vert.x EventBus.
- 🔒 **Математика краха:** использовать готовый `CrashGenerator`. Не переписывать алгоритм расчета краха.
- 🔒 **DTO:** все запросы, ответы и WS-пакеты оформляются исключительно как Java `record`.
- 🔒 **ORM:** Hibernate with Panache Repository (`PanacheRepository<Entity>`), без сырого JDBC.

---

## 5. Состояние на момент передачи

**Готово (Done):**
- ✅ Математика краха и маржи (`CrashGenerator`, `HouseEdgeCalculator`).
- ✅ Таблицы базы данных в Flyway (`users`, `game_rounds`, `game_configs`, `tournament_entries`).
- ✅ Аутентификация игроков по JWT.
- ✅ `GameService` — внутренний авторитетный сервис: жизненный цикл одиночного раунда (`startRound`, `cashout`, `checkRoundState`), пассивный timestamp-расчет множителя $M(t) = 1.00 \cdot e^{k \cdot t}$.
- ✅ Динамический персональный House Edge игрока в таблице `users` (`current_house_edge`, `last_bet_amount`) с автоматическим обновлением по формулам Столото.
- ✅ Сущность `GameRound`, репозиторий `GameRoundRepository`, миграция `V1.0.2__add_game_lifecycle_fields.sql`.
- ✅ Representation Layer: REST API [`GameResource`](../src/main/java/com/hack2026/mog/resources/GameResource.java) (`/api/game/start`, `/api/game/cashout`, `/api/game/state`, `/api/game/history`, `/api/game/house-edge`).
- ✅ Representation Layer: WebSocket [`GameWebSocket`](../src/main/java/com/hack2026/mog/websocket/GameWebSocket.java) (`/ws/game?token=...`) на Quarkus WebSockets Next с push-стримингом тиков на виртуальных потоках 60 FPS до момента краха.

**В процессе / Осталось (Pending):**
- ⏳ Турнирный скоринг и начисление очков в `tournament_entries` (`TournamentService`, живой рейтинг).
- ⏳ Механика бустеров (будет внедрена на следующей итерации).
- ⏳ Админ-панель изменения конфигурации (`GameConfigResource`).

**Первый шаг новой сессии (Next Step):**
> Реализовать турнирный скоринг (`TournamentService` и REST/WS эндпоинты живого рейтинга).

