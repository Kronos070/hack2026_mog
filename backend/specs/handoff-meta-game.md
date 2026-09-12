# Handoff: Мета-игра: Коллекция пазлов, ранги и достижения (META / Rewards)

Статус: plan / current · сверено: 2026-09-12

Реализация системы удержания игроков (Retention & Gamification): обязательная коллекция пазлов по ТЗ (§1.5), динамические ранги по чистой прибыли, система достижений и расширенная статистика профиля.

---

## 1. Что загрузить в начале сессии

1. [specs-map.md](specs-map.md) — обзорная карта системы.
2. `backend/src/main/java/com/hack2026/mog/entities/User.java` (модель пользователя).
3. `backend/src/main/java/com/hack2026/mog/services/GameService.java` (итоги раунда).
4. `frontend/src/shared/api/contract.ts` (схемы `profileSchema`, `rewardSchema`, `rankSchema`, `achievementSchema`).

**Что НЕ загружать (Anti-List):**
- Генератор краха (`CrashGenerator.java`).
- WebSocket стриминг тиков.

---

## 2. Задача и декомпозиция

На фронтенде эти механики временно эмулируются в `mock-server.ts`. Задача бэкенда — перенести их на сервер для надежности и сохранения прогресса между устройствами.

### 2.1. Коллекция наград / Пазлы (ТЗ §1.5 — ОБЯЗАТЕЛЬНО):
- Игрок собирает тематический пазл (9 кусочков: `piece_1` .. `piece_9`).
- За каждый завершенный раунд выдается фрагмент пазла (гарантированно или с нарастающей вероятностью).
- DTO награды `RewardDto`:
  ```json
  {
    "kind": "puzzle-piece",
    "pieceId": "piece_3",
    "label": "Фрагмент 3",
    "collected": 3,
    "total": 9
  }
  ```
- Хранение: прогресс пользователя хранится в БД (таблица `user_puzzle_pieces` или JSONB/список в `users`).
- Выдача: награда передается в событии завершения раунда (`CASHOUT` / `CRASHED` / `GET /api/game/state`).

### 2.2. Ранги игрока по чистой прибыли:
- Ранг рассчитывается динамически по формуле: `profit = totalPayout - totalWagered`.
- 6 рангов по ТЗ Столото:
  1. `novice` — «Новичок» (profit < 500, minProfit = 0)
  2. `amateur` — «Любитель» (profit ≥ 500, minProfit = 500)
  3. `aeronaut` — «Воздухоплаватель» (profit ≥ 2 000, minProfit = 2 000)
  4. `captain` — «Капитан» (profit ≥ 5 000, minProfit = 5 000)
  5. `wind_master` — «Мастер ветра» (profit ≥ 15 000, minProfit = 15 000)
  6. `sky_legend` — «Легенда небес» (profit ≥ 50 000, minProfit = 50 000)
- DTO ранга `RankDto`: `id`, `title`, `minProfit`, `nextTitle`, `nextAt`, `profit`.

### 2.3. Система достижений (10 ачивок):
- 10 достижений: «Первый полет», «Удачный старт», «Высокий полет (x5+)», «Стратосфера (x10+)», «Рисковый капитан», «Серия побед (3 подряд)», «Мастер бустеров», «Коллекционер пазлов», «Щедрый игрок», «Легенда небес».
- Таблица БД `user_achievements (id, user_id, achievement_id, unlocked_at)`.
- Сервис `AchievementService`: проверка критериев после каждого раунда.
- Возврат списка новых открытых ачивок `unlockedAchievements: AchievementDto[]` в результате раунда.

### 2.4. Расширенный профиль игрока:
- Обновление эндпоинта `GET /api/users/me` (или `GET /api/users/{id}`):
  - `user`: базовая модель пользователя;
  - `puzzle`: список собранных ID фрагментов (`["piece_1", "piece_2", ...]`);
  - `puzzleTotal`: общее количество (9);
  - `roundsPlayed`: всего сыграно раундов;
  - `roundsWon`: выиграно раундов;
  - `bestMultiplier`: рекордный зафиксированный коэффициент;
  - `totalWagered`: общая сумма сделанных ставок;
  - `totalPayout`: общая сумма выплат;
  - `rank`: текущий ранг `RankDto`;
  - `achievements`: список достижений с датой открытия `AchievementDto[]`.

---

## 3. Границы и правила (Scope Rules)

- **Миграции Flyway:** Таблицы `user_puzzle_pieces` и `user_achievements` создаются через SQL-миграцию `V1.0.6__add_gamification_tables.sql`.
- **Производительность:** Агрегаты профиля (`roundsPlayed`, `totalWagered`, `totalPayout`) кэшируются в полях пользователя или вычисляются через быстрый `SELECT count(*), sum(...) FROM game_rounds WHERE user_id = ?`.

---

## 4. Не перерешивать (Locked Decisions)

- 🔒 **Контракты DTO:** Формат моделей обязан в точности соответствовать Zod-схемам `profileSchema`, `rewardSchema`, `rankSchema`, `achievementSchema` во `frontend/src/shared/api/contract.ts`.
- 🔒 **Формула ранга:** Расчет ранга строго по чистой прибыли (`totalPayout - totalWagered`), как заложено в ТЗ.

---

## 5. Состояние на момент передачи

**Готово (Done):**
- ✅ Модели пользователей и история раундов в БД.
- ✅ Моки данных на стороне фронтенда.

**В процессе / Осталось (Pending):**
- ⏳ Миграция БД `V1.0.6__add_gamification_tables.sql`.
- ⏳ DTO records для наград, рангов и достижений.
- ⏳ Логика выдачи кусочков пазлов и проверки достижений в `MetaGameService`.
- ⏳ Расширенный ответ в `UserResource` (`GET /api/users/me`).

**Первый шаг новой сессии (Next Step):**
> Создать миграцию Flyway `V1.0.6` для хранения прогресса пазлов и разблокированных достижений.
