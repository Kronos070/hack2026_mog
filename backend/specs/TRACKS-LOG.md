# Архив завершенных треков (Tracks Log)

Статус: log / current · сверено: 2026-09-12

Журнал закрытых треков разработки (новые сверху). При закрытии трека handoff удаляется, а краткий итог в 1-2 предложения переносится сюда.

---

### [2026-09-12] Игровой цикл, WebSocket стриминг 60 FPS и синхронизация с контрактами фронтенда (Game Core & Feedback 1)
- **Итог:** Реализован авторитетный `GameService` с атомарными ставками, Provably Fair крашем (`CrashGenerator`), динамическим House Edge и разблокировкой cashout. Запущен полнодуплексный WebSocket `/ws/game` (60 FPS тики, `BOOSTER_ACTIVATED`, `CASHOUT`, `CRASHED`). Проведена синхронизация с фронтендом: добавлены `points` в `users` (миграция `V1.0.5`), предустановлен администратор `admin`/`admin123` (роль `ADMIN`), поддержан толерантный формат `POST /api/game/start`, передача `pointsEarned`, `levelsPassed`, `boosterActivated` и `newBalance` при крахе шара, тестовый эндпоинт `POST /api/game/top-up`, HTTP-логирование `LoggingFilter`, и активирован реальный режим во `frontend/.env`.
- **Преемники:** Трек конфигурации админки ([handoff-game-config.md](handoff-game-config.md)), трек турниров ([handoff-tournament.md](handoff-tournament.md)) и трек мета-игры ([handoff-meta-game.md](handoff-meta-game.md)).

---

### [2026-09-11] Базовый каркас, Auth и математика краша
- **Итог:** Реализована модель `User`, JWT авторизация (register/login/me), хэширование паролей BCrypt, обработка исключений и полная математическая модель `CrashGenerator` (HMAC-SHA256 Provably Fair) с `HouseEdgeCalculator`.
- **Преемник:** Трек игрового цикла (Game Core).
