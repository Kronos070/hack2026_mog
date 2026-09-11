# Решенные задачи хакатона (Resolved Backlog)

Статус: reference / current · сверено: 2026-09-11

База прецедентов: закрытые задачи с описанием решения. Перед исправлением бага или написанием похожего кода сверяйтесь с этим списком, чтобы не изобретать велосипед и не вносить регрессии.

---

- [x] **AUTH-1: Регистрация и логин по JWT** — Сделаны `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Пароли хэшируются через `SecurityService` (BCrypt), токены подписываются HMAC-SHA256 в `TokenService`. Стартовый баланс 1000 бонусов.
- [x] **AUTH-2: Единый формат ошибок** — Настроен `AppExceptionMapper` для обработки `AppException` с возвратом `ErrorResponse(status, message, timestamp)` вместо сырых стектрейсов.
- [x] **MATH-1: Provably Fair Crash Generator** — Реализован `CrashGenerator` на базе HMAC-SHA256 (первые 52 бита энтропии). Поддерживает внешний сид и `GAME_DEV_SEED` для детерминированного воспроизведения в тестах.
- [x] **MATH-2: House Edge & Ожидание казино** — Реализован `HouseEdgeCalculator` с конфигурацией `HouseEdgeConfig`, гарантирующий математическое ожидание сервера при бонусах и множителях.
- [x] **DB-1: Базовая схема PostgreSQL Flyway** — Написаны миграции `V1.0.0__initial_schema.sql` и `V1.0.1__add_user_profile_fields.sql` (таблицы `users`, `game_configs`, `game_rounds`, `tournament_entries`).
- [x] **DOC-1: OpenAPI 3.1 спецификация** — Сгенерирован файл [OPENAPI.yaml](../OPENAPI.yaml) с описанием схемы и интерактивный Swagger UI на `/q/swagger-ui`.
