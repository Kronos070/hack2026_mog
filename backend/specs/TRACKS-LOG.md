# Архив завершенных треков (Tracks Log)

Статус: log / current · сверено: 2026-09-12

Журнал закрытых треков разработки (новые сверху). При закрытии трека handoff удаляется, а краткий итог в 1-2 предложения переносится сюда.

---

### [2026-09-12] Мета-игра: Коллекция пазлов, динамические ранги, ачивки и расширенный профиль (META / Rewards)
- **Итог:** Реализована комплексная система удержания и мета-игры Столото: миграция `V1.0.9` (таблицы `user_puzzle_pieces`, `user_achievements`, колонка `users.puzzle_pity`, оптимизационный индекс `idx_game_rounds_user_stats`). Сервис `MetaGameService` с механикой Pity Timer (+20% за пустой раунд) и Bad Luck Protection (выпадение только недостающих фрагментов из 9), расчет 6 динамических рангов по чистой прибыли и проверка 10 достижений с буквами для бейджей. Бесшовная интеграция в `GameService` (`cashout` и `resolveCrash`), отправка `reward` и `unlockedAchievements` в реальном времени через WebSocket (`WsGameMessage`) и REST (`/api/game/cashout`), а также полные профили `ProfileDto` в `GET /api/users/me` и `GET /api/users/{id}`.
- **Преемник:** Все основные треки хакатона закрыты.

---

### [2026-09-12] Турнирная таблица, лидерборд, SSE-стриминг и автоначисление наград (TOUR-1 / Tournament)
- **Итог:** Реализован турнирный модуль: миграции `V1.0.7` (индекс на `score DESC`, 35 тестовых участников) и `V1.0.8` (таблицы `tournament_history` и `tournament_metadata`). Разработан `TournamentService` с атомарным начислением очков из `GameService` при завершении раундов и кэшауте, динамической сеткой призов только для топ-3 участников (100% / 60% / 30% от очков), суточным таймером `endsAt` (23:59:59 MSK), потоковым SSE-стримингом с частотой 1 Гц (`/api/tournament/stream`, `/api/tournament/leaderboard/stream`) и защитой от залипания L1-кэша. Внедрен `quarkus-scheduler` для автоматической полуночной финализации турнира ровно в 00:00:00 MSK с выплатой призов на баланс победителей (`User.bonusBalance`), архивацией в историю и сбросом таблицы для нового периода, а также эндпоинты `POST /api/tournament/settle` (`?force=true` для демо) и `GET /api/tournament/history`.
- **Преемник:** Трек мета-игры ([handoff-meta-game.md](handoff-meta-game.md)).

---

### [2026-09-12] Конфигурация игры и админка с Hot-Reload (CFG-1 / Game Config)
- **Итог:** Реализован модуль администрирования параметров игры по ТЗ §1.9: персистентность в PostgreSQL (`game_configs`), in-memory кэширование `AtomicReference<GameConfigDto>` с чтением за $O(1)$ без нагрузки на БД на тиках полета, self-healing сидирование эталонным JSON при старте и ролевой REST API `AdminConfigResource` (`GET /api/admin/config`, `PUT /api/admin/config`, `POST /api/admin/config/reset`) с авторизацией по роли `ADMIN`. Конфигурация связана с игровым циклом (`ActiveGameRound`, `GameService`, `GameWebSocket`) для динамического темпа роста кривой и начисления очков.
- **Преемник:** Трек турниров ([handoff-tournament.md](handoff-tournament.md)).

---

### [2026-09-12] Игровой цикл, WebSocket стриминг 60 FPS и синхронизация с контрактами фронтенда (Game Core & Feedback 1)
- **Итог:** Реализован авторитетный `GameService` с атомарными ставками, Provably Fair крашем (`CrashGenerator`), динамическим House Edge и разблокировкой cashout. Запущен полнодуплексный WebSocket `/ws/game` (60 FPS тики, `BOOSTER_ACTIVATED`, `CASHOUT`, `CRASHED`). Проведена синхронизация с фронтендом: добавлены `points` в `users` (миграция `V1.0.5`), предустановлен администратор `admin`/`admin123` (роль `ADMIN`), поддержан толерантный формат `POST /api/game/start`, передача `pointsEarned`, `levelsPassed`, `boosterActivated` и `newBalance` при крахе шара, тестовый эндпоинт `POST /api/game/top-up`, HTTP-логирование `LoggingFilter`, и активирован реальный режим во `frontend/.env`.
- **Преемники:** Трек конфигурации админки ([handoff-game-config.md](handoff-game-config.md)), трек турниров ([handoff-tournament.md](handoff-tournament.md)) и трек мета-игры ([handoff-meta-game.md](handoff-meta-game.md)).

---

### [2026-09-11] Базовый каркас, Auth и математика краша
- **Итог:** Реализована модель `User`, JWT авторизация (register/login/me), хэширование паролей BCrypt, обработка исключений и полная математическая модель `CrashGenerator` (HMAC-SHA256 Provably Fair) с `HouseEdgeCalculator`.
- **Преемник:** Трек игрового цикла (Game Core).
