# Индекс активных треков (Active Work Tracks)

Статус: reference / current · сверено: 2026-09-12

Индекс текущих задач в разработке. Ровно одна строка на трек. При смене сессии агент открывает соответствующий handoff.

- **Конфигурация игры и админка (CFG-1 / Game Config)** — [handoff](handoff-game-config.md) — completed, 2026-09-12, next: Переход к треку TOUR-1 (Турнирная таблица)
- **Турнирная таблица и лидерборд (TOUR-1 / Tournament)** — [handoff](handoff-tournament.md) — active, 2026-09-12, next: TournamentService и эндпоинты GET /api/tournament, GET /api/tournament/leaderboard
- **Мета-игра: Коллекция пазлов, ранги и достижения (META / Rewards)** — [handoff](handoff-meta-game.md) — pending, 2026-09-12, next: Миграция БД V1.0.7 для пазлов и ачивок, выдача фрагментов и расчет рангов
