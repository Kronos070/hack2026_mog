# Карта спецификаций проекта (Root Specs Map)

Статус: reference / current · сверено: 2026-09-12

Главная карта спецификаций и состояния разработки бэкенда для AI-агентов и разработчиков.

---

## Быстрый старт для агента перед началом задачи

1. Посмотри активные задачи в [TRACKS.md](TRACKS.md).
2. Загрузи handoff текущего трека (например, [handoff-game-config.md](handoff-game-config.md)).
3. Загрузи **только те файлы**, которые указаны в блоке «Что загрузить».
4. Не перерешивай то, что зафиксировано в блоке «Не перерешивать».
5. По окончании сессии — обнови состояние в handoff и строку в [TRACKS.md](TRACKS.md).

---

## Архитектура и существующий код

- [spec-architecture.md](spec-architecture.md) — актуальное устройство бэкенда: Quarkus 3, Virtual Threads, БД, Auth, Math CrashGenerator, WebSocket.
- [spec-specs.md](spec-specs.md) — правила ведения спецификаций (жанры, статусы `current`/`stale`, правила handoff).

---

## Бэклоги и трекер задач

- [backlog.md](backlog.md) — открытые задачи хакатона (что осталось сделать).
- [backlog-resolved.md](backlog-resolved.md) — решенные задачи с описанием решений (база прецедентов, чтобы не наступать на старые баги).
- [TRACKS-LOG.md](TRACKS-LOG.md) — архив завершенных рабочих треков.

---

## Активные треки и Handoff'ы

- **Конфигурация игры и админка:** [handoff-game-config.md](handoff-game-config.md) — CFG-1, админ-панель параметров игры с hot-reload.
- **Турнирная таблица и лидерборд:** [handoff-tournament.md](handoff-tournament.md) — TOUR-1/2, турнирный скоринг и рейтинг.
- **Мета-игра и награды:** [handoff-meta-game.md](handoff-meta-game.md) — META, коллекция пазлов, ранги, ачивки и расширенный профиль.
