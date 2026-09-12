# Handoff: Полигон статистики игрока (RADAR-1 / Stats Polygon)

Статус: as-built / current · сверено: 2026-09-12

Реализация фичи «Полигон статистики» (шестиугольник с показателями в диапазоне 0.0–10.0 в стиле Dota 2) для профиля игрока.
Пересчет производится строго каждые 10 игр на основе окна из последних 30 игр (для новых игроков с 1 по 9 раунд выполняется предварительный динамический расчет).

---

## 1. Что загрузить в начале сессии

1. `backend/specs/specs-map.md` — карта спецификаций.
2. `backend/src/main/java/com/hack2026/mog/entities/UserStatRadar.java` (модель полигона статистики).
3. `backend/src/main/java/com/hack2026/mog/services/MetaGameService.java` (формулы расчета и обновление).
4. `backend/src/main/java/com/hack2026/mog/resources/UserResource.java` (REST эндпоинты `/api/users/me/radar-stats` и `/{id}/radar-stats`).

**Что НЕ загружать (Anti-List):**
- Фронтенд-компоненты (интерфейсом занимается отдельный разработчик).
- Генератор случайности и сиды (`CrashGenerator.java`).
- WebSocket тики полета.

---

## 2. Архитектура и согласованные решения (Locked Decisions)

- 🔒 **6 вершин полигона (показатели 0.0 – 10.0):**
  1. `patience` (**Выдержка**): средний коэффициент забора в победных раундах окна (1.0x → 0.0, 3.0x → 5.0, 5.0x+ → 10.0).
  2. `boosters` (**Бустеры**): частота выбора ставок с бустерами x2–x4 (до 5.0) + доля их реальной активации до забора (до 5.0).
  3. `collector` (**Коллекционер**): общий прогресс собранных фрагментов пазла (до 7.0 за 9 шт.) + выпадения кусочков за последние 30 игр (до 3.0).
  4. `generosity` (**Размах / Щедрость**): средний размер ставки в окне (10 бонусов → 1.0, 50 → 5.0, 250+ → 10.0).
  5. `winRate` (**Винрейт**): чистый процент успешных раундов без краха за окно (от 0% до 100% → 0.0–10.0).
  6. `risk` (**Азарт / Риск**): доля игр на сложной красной теме (до 5.0) + дерзость (средняя близость точки забора к краху `cashout/crash`, до 5.0).
- 🔒 **Окно и пересчет:**
  - Окно анализа: последние 30 завершенных игр игрока (`findHistoryByUserId(userId, 30)`).
  - Калибровка / предварительный расчет: для игр 1–9 пересчет происходит после каждой игры.
  - Начиная с 10-й игры: пересчет строго каждые 10 игр (`totalRounds % 10 == 0`). В раундах 11–19, 21–29 и т.д. возвращается сохраненный снимок.
- 🔒 **Хранение в БД:**
  - Отдельная таблица `user_stat_radars` с FK на `users(id)` (ON DELETE CASCADE) и UNIQUE(user_id).
  - Flyway миграция `V1.0.10__add_user_stat_radars.sql`.
  - Дополнительное поле `booster_activated BOOLEAN DEFAULT FALSE` в таблице `game_rounds` для точной фиксации сработавших бустеров в истории.
- 🔒 **API Контракт:**
  - Существующий `ProfileDto` не изменяется (гарантия обратной совместимости).
  - Выделенные эндпоинты:
    - `GET /api/users/me/radar-stats` (Authenticated)
    - `GET /api/users/{id}/radar-stats` (публичный просмотр полигона любого игрока)
  - DTO `StatRadarDto`: `patience`, `boosters`, `collector`, `generosity`, `winRate`, `risk`, `gamesAnalyzed`, `totalGames`, `nextRecalcIn`.
- 🔒 **Интерфейс:**
  - Исходный код фронтенда не модифицируется (этим занимается фронтенд-разработчик).

---

## 3. Состояние на момент передачи

**Готово (Done):**
- ✅ Согласованы дизайн, метрики, формулы и архитектурные решения через `/grill-me`.
- ✅ Оформлена handoff-спецификация и обновлена карта треков [TRACKS.md](TRACKS.md).
- ✅ Создана миграция Flyway `V1.0.10__add_user_stat_radars.sql` (таблица `user_stat_radars` и колонка `game_rounds.booster_activated`).
- ✅ Созданы JPA сущность `UserStatRadar` и репозиторий `UserStatRadarRepository`.
- ✅ Обновлена сущность `GameRound` и фиксация `boosterActivated` при `cashout` и `resolveCrash` в `GameService`.
- ✅ Создан DTO `StatRadarDto`.
- ✅ В `MetaGameService` реализованы методы `recalculateStatRadar`, `maybeUpdateStatRadar` и `getStatRadar`.
- ✅ Добавлены REST эндпоинты `GET /api/users/me/radar-stats` и `GET /api/users/{id}/radar-stats` в `UserResource`.
- ✅ Написаны и успешно пройдены модульные тесты `MetaGameServiceTest` (`./mvnw test -Dtest=MetaGameServiceTest`).
- ✅ Проект успешно компилируется (`./mvnw compile -DskipTests`).
