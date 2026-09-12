# Handoff: Конфигурация игры и админка (CFG-1 / Game Config)

Статус: plan / current · сверено: 2026-09-12

Реализация обязательного модуля ТЗ (§1.9): чтение и изменение параметров игры экспертом/администратором через REST API с горячим обновлением в оперативной памяти без перезапуска сервера.

---

## 1. Что загрузить в начале сессии

1. [specs-map.md](specs-map.md) — обзорная карта системы.
2. [spec-architecture.md](spec-architecture.md) — архитектурные слои и модели данных.
3. `backend/src/main/resources/db/migration/V1.0.0__initial_schema.sql` (таблица `game_configs`).
4. `frontend/src/shared/api/contract.ts` (схема `gameConfigSchema`).

**Что НЕ загружать (Anti-List):**
- Сервисы авторизации и токенов (`AuthService.java`, `TokenService.java`).
- Математику Provably Fair (`CrashGenerator.java`).

---

## 2. Задача и декомпозиция

Фронтенд ожидает работу админки по контракту `gameConfigSchema` и вызывает методы `api.getConfig()` и `api.saveConfig(config)`.

### Задачи:
1. **DTO `GameConfigDto` (Java Record):**
   - Точное соответствие `gameConfigSchema` фронтенда:
     ```json
     {
       "gameId": "air-balloon",
       "gameName": "Воздушный Шар",
       "isActive": true,
       "alpha": 1.30,
       "maxMultiplier": 100.0,
       "minCrashMultiplier": 1.01,
       "multiplierGrowthRate": 0.22,
       "growthAcceleration": 1.5,
       "pointsPerLine": 10,
       "pointsCashoutBonus": 25,
       "pointsBoosterBonus": 50,
       "boosterTierValues": [1.0, 2.0, 3.0, 4.0],
       "lootProbabilities": {
         "green": [0.0, 0.25, 0.20, 0.18, 0.15, 0.10, 0.07, 0.04, 0.01],
         "red": [0.0, 0.20, 0.18, 0.15, 0.13, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02, 0.01]
       },
       "minWinAmount": 50,
       "popupTimeout": 10
     }
     ```
2. **`GameConfigService` (In-Memory Hot-Reload):**
   - Хранение актуального конфига в `AtomicReference<GameConfigDto>`.
   - Загрузка из таблицы `game_configs` (JSONB) при `@Startup`. Если записи нет — сидировать эталонным JSON.
   - Метод `saveConfig(GameConfigDto newConfig)`: сериализация в JSONB, сохранение в БД и атомарная замена `atomicRef.set(newConfig)`.
   - Метод `resetConfig()`: сброс к эталонному дефолту.
3. **REST API `AdminConfigResource` (`/api/admin/config`):**
   - `GET /api/admin/config`: отдает текущий конфиг (для `AdminPage.tsx` и `api.getConfig()`).
   - `PUT /api/admin/config`: сохранение конфига (`AdminPage.tsx` -> `api.saveConfig()`). Проверка роли `ADMIN`.
4. **Связка с игровым циклом (`GameService` & `GameWebSocket`):**
   - Заменить хардкод `DEFAULT_GROWTH_RATE = 0.06` на чтение `configService.getCurrentConfig().multiplierGrowthRate()` (0.22).
   - Чтение `pointsPerLine`, `pointsCashoutBonus`, `pointsBoosterBonus` из конфига при расчете очков раунда (Сценарий 5 ТЗ).

---

## 3. Границы и правила (Scope Rules)

- **Безопасность:** Редактирование конфига разрешено только пользователям с ролью `ADMIN`.
- **Производительность:** Никаких запросов в БД на каждый тик WebSocket (~16 мс) — параметры читаются исключительно из in-memory ссылки `AtomicReference`.
- **Валидация:** Валидировать диапазоны значений через Jakarta Validation (`@Min`, `@Max`, `@NotNull`).

---

## 4. Не перерешивать (Locked Decisions)

- 🔒 **Формат конфигурации:** Хранение в таблице `game_configs` в колонке `config_data JSONB`.
- 🔒 **Конкурентность:** `AtomicReference<GameConfigDto>` для потокобезопасного чтения и горячей подмены.
- 🔒 **Контракт DTO:** Полная совместимость с Zod-схемой `gameConfigSchema` фронтенда.

---

## 5. Состояние на момент передачи

**Готово (Done):**
- ✅ Таблица `game_configs` в миграции `V1.0.0__initial_schema.sql` и обновление до каноничного JSONB в `V1.0.6__update_game_config_canonical.sql`.
- ✅ Сид-пользователь `admin` с ролью `ADMIN` в `V1.0.5__add_points_and_seed_admin.sql`.
- ✅ Java Record `GameConfigDto` с вложенным `LootProbabilitiesDto` и полной валидацией через Jakarta Validation (`@Positive`, `@DecimalMin`, `@Size(min=4, max=4)` и т.д.).
- ✅ Сервис `GameConfigService` с in-memory кэшем `AtomicReference<GameConfigDto>`, персистентностью в PostgreSQL (`game_configs`) и self-healing механизмом при `@Startup`.
- ✅ REST API `AdminConfigResource`:
  - `GET /api/admin/config`: чтение актуального конфига (`@Authenticated`).
  - `PUT /api/admin/config`: горячее сохранение конфига (`@RolesAllowed("ADMIN")`).
  - `POST /api/admin/config/reset`: сброс к дефолтным эталонным значениям (`@RolesAllowed("ADMIN")`).
- ✅ Связка с игровым циклом (`ActiveGameRound`, `GameService`, `GameWebSocket`):
  - Снапшот параметров (`growthRate`, `pointsPerLine`, `pointsCashoutBonus`, `pointsBoosterBonus`) в `ActiveGameRound` при старте раунда.
  - Динамический темп роста `growthRate` в `calculateMultiplierAt` и WebSocket-тиках (вместо константы 0.06).
  - Динамический расчет очков раунда по параметрам из конфига.
- ✅ Полный набор тестов:
  - `GameConfigDtoTest`: валидация и JSON round-trip.
  - `GameConfigServiceTest`: in-memory кэширование, hot-reload, reset.
  - `AdminConfigResourceTest`: авторизация, ролевая модель, валидация 400, обновление, сброс.
  - `GameServiceConfigIntegrationTest`: динамическое применение конфига к новым раундам и изоляция летящих шаров.

**Статус трека:** Completed / Verified (12/12 тестов прошли успешно).
