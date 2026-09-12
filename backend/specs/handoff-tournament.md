# Handoff: Турнирная таблица и лидерборд (TOUR-1 / Tournament)

Статус: completed · сверено: 2026-09-12

Реализация турнирного модуля: учет очков игроков в турнирной таблице, вычисление призовых мест (динамическая сетка топ-3) и предоставление REST и SSE эндпоинтов для лидерборда со стримингом в реальном времени раз в секунду.

---

## 1. Что загрузить в начале сессии

1. [specs-map.md](specs-map.md) — обзорная карта системы.
2. `backend/src/main/resources/db/migration/V1.0.7__seed_tournament_users.sql` (индекс и тестовые участники).
3. `backend/src/main/java/com/hack2026/mog/services/TournamentService.java` (бизнес-логика, призы, SSE).
4. `backend/src/main/java/com/hack2026/mog/resources/TournamentResource.java` (REST и SSE эндпоинты).

---

## 2. Реализованный функционал

1. **DTO (Java Records) под контракты фронтенда:**
   - `LeaderboardEntryDto(String playerId, String playerName, Long points)`
   - `TournamentTableEntryDto(Integer place, String playerId, String playerName, Long points, Long prize)`
   - `TournamentResponseDto(String title, Long endsAt, List<TournamentTableEntryDto> entries, String currentPlayerId)`
2. **База данных:**
   - Миграция `V1.0.7__seed_tournament_users.sql` с индексом `idx_tournament_entries_score` и сидированием 35 тестовых игроков.
   - Panache-сущность `TournamentEntry` и репозиторий `TournamentEntryRepository` с атомарным `upsertPoints(...)`.
3. **`TournamentService`:**
   - Метод `recordRoundPoints(Long userId, String username, int pointsEarned)`: атомарный UPSERT в PostgreSQL.
   - Метод `getLeaderboard(int limit)`: выборка топ-N участников с `JOIN FETCH`.
   - Метод `getCurrentTournament(Long currentUserId)`:
     - Динамический расчет призов только для топ-3 участников: 1 место — 100% от очков, 2 место — 60%, 3 место — 30%, 4+ места — 0.
     - Суточный таймер `endsAt` (23:59:59 MSK).
   - Методы `streamLeaderboard()` и `streamTournament()`: периодический SSE-стриминг (каждую 1 сек) на базе SmallRye Mutiny.
4. **Интеграция с `GameService`:**
   - Вызовы `recordRoundPoints` встроены в `cashout`, `resolveCrash` и `recordQuickRound`.
5. **Эндпоинты `TournamentResource` (`/api/tournament`):**
   - `GET /api/tournament`: полная информация о турнире и участниках (REST).
   - `GET /api/tournament/leaderboard`: компактный список лидеров (REST).
   - `GET /api/tournament/stream`: SSE-стрим полной турнирной таблицы (`text/event-stream`).
   - `GET /api/tournament/leaderboard/stream`: SSE-стрим компактного рейтинга лидеров (`text/event-stream`).

---

## 3. Состояние на момент передачи

**Готово (Done):**
- ✅ Сущность `TournamentEntry` и репозиторий `TournamentEntryRepository`.
- ✅ DTO records: `LeaderboardEntryDto`, `TournamentTableEntryDto`, `TournamentResponseDto`.
- ✅ `TournamentService` с логикой подсчета мест, динамических призов и SSE-стримингом.
- ✅ Интеграция вызова `recordRoundPoints` в `GameService`.
- ✅ `TournamentResource` (REST + SSE для обоих потоков).
- ✅ Flyway миграция `V1.0.7` с индексом и сидированием 35 участников.
- ✅ Ручное и автоматическое тестирование подтвердило работу REST, SSE и учет очков при игре.

**Следующий трек:**
> Переход к треку META / Rewards (Мета-игра: Коллекция пазлов, ранги и достижения).

