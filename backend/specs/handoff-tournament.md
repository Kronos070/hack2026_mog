# Handoff: Турнирная таблица и лидерборд (TOUR-1 / Tournament)

Статус: plan / current · сверено: 2026-09-12

Реализация турнирного модуля: учет очков игроков в турнирной таблице, вычисление призовых мест и предоставление REST эндпоинтов для лидерборда с поддержкой клиентского polling раз в секунду.

---

## 1. Что загрузить в начале сессии

1. [specs-map.md](specs-map.md) — обзорная карта системы.
2. `backend/src/main/resources/db/migration/V1.0.0__initial_schema.sql` (таблица `tournament_entries`).
3. `backend/src/main/java/com/hack2026/mog/services/GameService.java` (метод начисления очков).
4. `frontend/src/shared/api/contract.ts` (схемы `tournamentSchema` и `leaderboardEntrySchema`).

**Что НЕ загружать (Anti-List):**
- Генератор краха (`CrashGenerator.java`).
- Админку и конфигурации.

---

## 2. Задача и декомпозиция

Фронтенд имеет готовый интерфейс турнирной таблицы и опрашивает турнир методами:
- `api.getTournament()` → `GET /api/tournament`
- `api.getLeaderboard()` → `GET /api/tournament/leaderboard`

### Задачи:
1. **DTO (Java Records) под контракты фронтенда:**
   - `LeaderboardEntryDto(String playerId, String playerName, Long points)`
   - `TournamentTableEntryDto(Integer place, String playerId, String playerName, Long points, Long prize)`
   - `TournamentResponseDto(String title, Long endsAt, List<TournamentTableEntryDto> entries, String currentPlayerId)`
2. **`TournamentService`:**
   - Метод `recordRoundPoints(Long userId, String username, int pointsEarned)`: атомарное обновление очков в таблице `tournament_entries` (UPSERT: если записи нет — `INSERT`, если есть — `score = score + pointsEarned`).
   - Метод `getLeaderboard(int limit)`: получение топ-N игроков, отсортированных по `score DESC`.
   - Метод `getCurrentTournament(Long currentUserId)`: формирование турнирной таблицы:
     - `title`: название текущего турнира («Гран-при Воздухоплавателей Столото»);
     - `endsAt`: timestamp окончания турнира в ms (например, конец текущих суток);
     - Призовой фонд (`prize`): распределение призов за топ-места (1 место: 5 000 бонусов, 2 место: 3 000, 3 место: 1 500, 4-10 места: 500);
     - `currentPlayerId`: ID авторизованного пользователя для подсветки его строки в UI.
3. **Интеграция с `GameService`:**
   - В методах `cashout` и `resolveCrash` вызывать `tournamentService.recordRoundPoints(...)` при получении очков `pointsEarned > 0`.
4. **REST API `TournamentResource` (`/api/tournament`):**
   - `GET /api/tournament`: полная информация о турнире и участниках.
   - `GET /api/tournament/leaderboard`: компактный список лидеров для виджета на главном экране.

---

## 3. Границы и правила (Scope Rules)

- **Конкурентность:** Обновление очков в турнирной таблице должно быть потокобезопасным (`ON CONFLICT (user_id) DO UPDATE SET score = tournament_entries.score + EXCLUDED.score` или через блокировку строки).
- **Частота опроса:** Фронт может вызывать эндпоинт 1 раз в секунду. Запрос должен быть быстрым (индекс по `score DESC`).

---

## 4. Не перерешивать (Locked Decisions)

- 🔒 **Хранилище:** Таблица `tournament_entries` с `user_id`, `username`, `score`.
- 🔒 **Контракт DTO:** Строгое совпадение с `tournamentSchema` и `leaderboardEntrySchema` фронтенда.

---

## 5. Состояние на момент передачи

**Готово (Done):**
- ✅ Таблица `tournament_entries` с ограничением `UNIQUE (user_id)` в `V1.0.0__initial_schema.sql`.
- ✅ Начисление очков `points` в профиль игрока (`User.points`).

**В процессе / Осталось (Pending):**
- ⏳ Java Records для ответов турнира.
- ⏳ Сущность `TournamentEntry` и Panache-репозиторий `TournamentEntryRepository`.
- ⏳ `TournamentService` с логикой подсчета мест и призов.
- ⏳ Интеграция вызова `recordRoundPoints` в `GameService`.
- ⏳ `TournamentResource` (`GET /api/tournament`, `GET /api/tournament/leaderboard`).

**Первый шаг новой сессии (Next Step):**
> Создать Panache-сущность `TournamentEntry`, DTO records и `TournamentService`.
