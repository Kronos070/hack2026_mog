# Handoff: Турнирная таблица, лидерборд и автоначисление наград (TOUR-1 / Tournament)

Статус: completed / current · сверено: 2026-09-12

Реализация турнирного модуля: учет очков игроков в турнирной таблице, вычисление призовых мест (динамическая сетка топ-3), предоставление REST и SSE эндпоинтов для лидерборда со стримингом в реальном времени раз в секунду, а также автоматическая финализация турнира в полночь по расписанию Quarkus Scheduler с выплатой бонусов победителям.

---

## 1. Что загрузить в начале сессии

1. [specs-map.md](specs-map.md) — обзорная карта системы.
2. `backend/src/main/resources/db/migration/V1.0.7__seed_tournament_users.sql` (индекс и тестовые участники).
3. `backend/src/main/resources/db/migration/V1.0.8__add_tournament_history.sql` (история завершенных турниров и метаданные).
4. `backend/src/main/java/com/hack2026/mog/services/TournamentService.java` (бизнес-логика, призы, SSE, планировщик и финализация).
5. `backend/src/main/java/com/hack2026/mog/resources/TournamentResource.java` (REST, SSE, settle и history эндпоинты).

---

## 2. Реализованный функционал

1. **DTO (Java Records) под контракты фронтенда и системы наград:**
   - `LeaderboardEntryDto(String playerId, String playerName, Long points)`
   - `TournamentTableEntryDto(Integer place, String playerId, String playerName, Long points, Long prize)`
   - `TournamentResponseDto(String title, Long endsAt, List<TournamentTableEntryDto> entries, String currentPlayerId)`
   - `TournamentHistoryItemDto(Integer place, String playerId, String playerName, Long score, Long prizeAwarded, String awardedAt)`
   - `TournamentSettlementResultDto(String status, String tournamentTitle, Long settledAt, int rewardedPlayersCount, Long totalPrizesAwarded, List<TournamentHistoryItemDto> winners, String message)`
2. **База данных:**
   - Миграция `V1.0.7__seed_tournament_users.sql`: индекс `idx_tournament_entries_score` и сидирование 35 тестовых участников.
   - Миграция `V1.0.8__add_tournament_history.sql`: таблицы `tournament_history` и `tournament_metadata` с индексами.
   - Panache-сущности `TournamentEntry` и `TournamentHistory`, репозитории `TournamentEntryRepository` (атомарный `upsertPoints(...)` и `resetAllScores()`) и `TournamentHistoryRepository`.
3. **`TournamentService`:**
   - Метод `recordRoundPoints(Long userId, String username, int pointsEarned)`: атомарный UPSERT в PostgreSQL.
   - Метод `getLeaderboard(int limit)`: выборка топ-N участников с `JOIN FETCH` и сбросом L1-кэша.
   - Метод `getCurrentTournament(Long currentUserId)`:
     - Динамический расчет призов только для топ-3 участников: 1 место — 100% от очков, 2 место — 60%, 3 место — 30%, 4+ места — 0.
     - Суточный таймер `endsAt` (23:59:59 MSK).
   - Методы `streamLeaderboard()` и `streamTournament()`: периодический SSE-стриминг (каждую 1 сек) на базе SmallRye Mutiny на пуле рабочих потоков.
   - Метод `settleCurrentTournament(boolean force)`: транзакционная выплата наград топ-3 призерам на `user.bonusBalance`, запись в `tournament_history` и сброс очков всех участников в 0 для нового суточного периода.
   - **Автоматический запуск:** `@Scheduled(cron = "0 0 0 * * ?")` ровно в 00:00:00 ежедневно и recovery-проверка раз в 1 минуту на случай перезапуска сервера.
   - Метод `getTournamentHistory(Long userId, int limit)`: архив победителей (глобальный или персональный).
4. **Интеграция с `GameService`:**
   - Вызовы `recordRoundPoints` встроены в `cashout`, `resolveCrash` и `recordQuickRound`.
5. **Эндпоинты `TournamentResource` (`/api/tournament`):**
   - `GET /api/tournament`: полная информация о турнире и участниках (REST).
   - `GET /api/tournament/leaderboard`: компактный список лидеров (REST).
   - `GET /api/tournament/stream`: SSE-стрим полной турнирной таблицы (`text/event-stream`).
   - `GET /api/tournament/leaderboard/stream`: SSE-стрим компактного рейтинга лидеров (`text/event-stream`).
   - `POST /api/tournament/settle`: запуск финализации турнира (`?force=true` для тестирования и демо).
   - `GET /api/tournament/history`: архив призеров прошедших турниров (`?my=true` для текущего пользователя).

---

## 3. Состояние на момент передачи

**Готово (Done):**
- ✅ Сущности `TournamentEntry`, `TournamentHistory` и репозитории.
- ✅ DTO records под спецификацию фронтенда и админки.
- ✅ `TournamentService` с логикой подсчета мест, динамических призов, SSE-стримингом и Quarkus Scheduler.
- ✅ Интеграция вызова `recordRoundPoints` в `GameService`.
- ✅ `TournamentResource` (REST + SSE для обоих потоков, settle и history).
- ✅ Flyway миграции `V1.0.7` и `V1.0.8`.
- ✅ Сквозное ручное и автоматическое тестирование подтвердило работу начисления очков, SSE-стримов, выплаты призов на баланс победителей и сброса таблицы.
- ✅ Спецификация `backend/API.md` обновлена до версии 1.2.0.

**Следующий трек:**
> Переход к треку META / Rewards (Мета-игра: Коллекция пазлов, ранги и достижения).
