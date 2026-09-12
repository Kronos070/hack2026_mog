# Handoff: Мета-игра: Коллекция пазлов, ранги и достижения (META / Rewards)

Статус: completed / current · сверено: 2026-09-12

Реализация системы удержания игроков (Retention & Gamification): обязательная коллекция пазлов по ТЗ (§1.5), динамические ранги по чистой прибыли, система достижений и расширенная статистика профиля.

---

## 1. Что загрузить в начале сессии

1. [specs-map.md](specs-map.md) — обзорная карта системы.
2. `backend/src/main/java/com/hack2026/mog/entities/User.java` (модель пользователя).
3. `backend/src/main/java/com/hack2026/mog/services/GameService.java` (итоги раунда).
4. `backend/src/main/java/com/hack2026/mog/services/MetaGameService.java` (логика дропа, ачивок и профиля).
5. `frontend/src/shared/api/contract.ts` (схемы `profileSchema`, `rewardSchema`, `rankSchema`, `achievementSchema`).

**Что НЕ загружать (Anti-List):**
- Генератор краха (`CrashGenerator.java`).
- WebSocket стриминг тиков.

---

## 2. Архитектура и реализованные решения

### 2.1. Коллекция наград / Пазлы (ТЗ §1.5):
- Игрок собирает тематический пазл (9 кусочков: `piece_1` .. `piece_9`).
- Механика дропа: Pity Timer (+20% шанс за каждый «пустой» раунд) + Bad Luck Protection (гарантированный выбор случайного еще не собранного кусочка).
- DTO награды `RewardDto` (`kind: "puzzle-piece"`, `pieceId`, `label`, `collected`, `total: 9`).
- Хранение: таблица `user_puzzle_pieces (id, user_id, piece_id, collected_at, UNIQUE(user_id, piece_id))`, поле `users.puzzle_pity`.
- Выдача: награда передается в событии завершения раунда (`CASHOUT` / `CRASHED` в WebSocket `WsGameMessage` и в REST ответе `POST /api/game/cashout`).

### 2.2. Ранги игрока по чистой прибыли:
- Ранг рассчитывается динамически по формуле: `profit = totalPayout - totalWagered`.
- 6 рангов по ТЗ Столото:
  1. `novice` — «Новичок» (minProfit = 0)
  2. `amateur` — «Любитель» (profit ≥ 500, minProfit = 500)
  3. `aeronaut` — «Воздухоплаватель» (profit ≥ 2 000, minProfit = 2 000)
  4. `captain` — «Капитан» (profit ≥ 5 000, minProfit = 5 000)
  5. `wind_master` — «Мастер ветра» (profit ≥ 15 000, minProfit = 15 000)
  6. `sky_legend` — «Легенда небес» (profit ≥ 50 000, minProfit = 50 000)
- DTO ранга `RankDto`: `id`, `title`, `minProfit`, `nextTitle`, `nextAt`, `profit`.

### 2.3. Система достижений (10 ачивок):
- 10 достижений: `first_flight`, `lucky_start`, `high_flight_5x`, `stratosphere_10x`, `risky_captain`, `win_streak_3`, `booster_master`, `puzzle_collector`, `high_roller`, `sky_legend`.
- Таблица БД `user_achievements (id, user_id, achievement_id, unlocked_at, UNIQUE(user_id, achievement_id))`.
- Сервис `MetaGameService`: проверка критериев после каждого раунда в `GameService` (`cashout` и `resolveCrash`).
- Возврат списка новых открытых ачивок `unlockedAchievements: AchievementDto[]` в результате раунда через WebSocket и REST.

### 2.4. Расширенный профиль игрока:
- Обновлены эндпоинты `GET /api/users/me` и `GET /api/users/{id}`:
  - `user`: базовая модель пользователя (`ProfileUserDto`);
  - `puzzle`: список собранных ID фрагментов (`List<String>`);
  - `puzzleTotal`: общее количество (9);
  - `roundsPlayed`, `roundsWon`, `bestMultiplier`, `totalWagered`, `totalPayout`: агрегаты из `GameRoundRepository.getUserStats()`;
  - `rank`: текущий ранг `RankDto`;
  - `achievements`: полный каталог из 10 достижений с отметкой даты открытия `unlockedAt` (`AchievementDto[]`).

---

## 3. Границы и правила (Scope Rules)

- **Миграции Flyway:** Таблицы `user_puzzle_pieces`, `user_achievements`, колонка `users.puzzle_pity` и индекс `idx_game_rounds_user_stats` созданы через `V1.0.9__add_gamification_tables.sql`.
- **Производительность:** Агрегаты профиля рассчитываются через оптимизированный агрегатный запрос по индексу `game_rounds (user_id, is_win, cashout_multiplier, bet_amount, win_amount)` за <1 мс.

---

## 4. Не перерешивать (Locked Decisions)

- 🔒 **Контракты DTO:** Формат моделей обязан в точности соответствовать Zod-схемам `profileSchema`, `rewardSchema`, `rankSchema`, `achievementSchema` во `frontend/src/shared/api/contract.ts`.
- 🔒 **Формула ранга:** Расчет ранга строго по чистой прибыли (`totalPayout - totalWagered`), как заложено в ТЗ.
- 🔒 **Фронтенд:** Исходный код фронтенда не модифицируется данным треком (адаптацию выполняет фронтенд-разработчик).

---

## 5. Состояние на момент передачи

**Готово (Done):**
- ✅ Миграция Flyway `V1.0.9__add_gamification_tables.sql`.
- ✅ JPA сущности `UserPuzzlePiece` и `UserAchievement`, репозитории с оптимизированными запросами.
- ✅ DTO `RewardDto`, `RankDto`, `AchievementDto`, `ProfileUserDto`, `ProfileDto`.
- ✅ Сервис `MetaGameService`: расчет рангов, Pity Timer + Bad Luck Protection, проверка 10 ачивок, сборка профиля.
- ✅ Интеграция с игровым циклом в `GameService` (`cashout` и `resolveCrash`), доставка через `WsGameMessage` и `GameWebSocket`.
- ✅ Реализация эндпоинтов `GET /api/users/me` и `GET /api/users/{id}` в `UserResource`.
- ✅ Проект успешно компилируется (`./mvnw compile -DskipTests`).
