# AGENTS.md — Backend Architecture & Development Guidelines

> Данный документ является основным техническим руководством для AI-агентов и разработчиков при проектировании и реализации бэкенда проекта (директория `backend`).

---

## 1. Архитектурный контекст и философия

Бэкенд выполняет роль **авторитетного игрового сервера** (Authoritative Game Server) для бонусной crash-игры «Воздушный Шар» (чемпионат «Столото»):
- **Server-Authoritative:** Все критические вычисления (точка краха шара, множители, появление бустеров, валидация ставок и cashout, начисление очков) рассчитываются и валидируются исключительно на сервере. Клиентский интерфейс (Frontend) лишь визуализирует состояние, получаемое от сервера.
- **Модель конкурентности:** Используются **виртуальные потоки Java 21+ (Project Loom)** через аннотацию `@RunOnVirtualThread`. Разработчик пишет линейный, синхронный код (без бойлерплейта реактивных `Uni`/`Multi`), а рантайм Quarkus исполняет его на сверхлегких виртуальных потоках без блокировки OS-тредов (аналог `async/await` в Bun/Node.js).

---

## 2. Технологический стек

| Компонент | Технология / Библиотека | Описание / Обоснование |
|---|---|---|
| **Язык платформы** | **Java 21+ (Eclipse Temurin)** | Поддержка Virtual Threads, Records, Pattern Matching, современные лаконичные конструкции. |
| **Фреймворк** | **Quarkus 3.x** | Supersonic Subatomic Java, быстрый старт, встроенный Dev Mode с live reload. |
| **Сборщик** | **Maven Wrapper (`./mvnw`)** | Де-факто стандарт Quarkus. Не требует локальной установки Maven разработчиком. |
| **Основная СУБД** | **PostgreSQL 16+** | Надежное реляционное хранилище для пользователей, ставок, истории игр, турниров и настроек. |
| **ORM / Data Access** | **Hibernate ORM with Panache** (Repository Pattern) | Чистое разделение сущностей и запросов через `PanacheRepository<Entity>`. |
| **Миграции БД** | **Flyway** | Версионированные SQL-миграции в `src/main/resources/db/migration/` (аналог drizzle migrations). |
| **Real-time транспорт** | **Quarkus WebSockets Next** | Полнодуплексный высокоскоростной стриминг множителей, тиков шара, событий краха и живого рейтинга. |
| **REST API** | **RESTEasy Reactive + Jackson** | Транзакционные операции (авторизация, совершение ставки, cashout, админ-панель). OpenAPI / Swagger UI. |
| **Безопасность / Auth** | **JWT (Bearer Token) + BCrypt** | Классическая JWT-авторизация (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`). |
| **Конфигурация** | **PostgreSQL + In-Memory Cache** | Хранение игровых параметров в БД (таблица/JSONB) с мгновенным hot-reload в памяти через Admin REST API. |
| **Инфраструктура** | **Docker Compose** | Единый корневой `docker-compose.yml` (PostgreSQL + Backend + Frontend). |

---

## 3. Архитектура слоев (Classic Layered Enterprise)

Кодовая база в пакете `com.hack2026.mog` организована по классической слоистой архитектуре:

```
backend/
├── pom.xml
├── mvnw / mvnw.cmd
├── .mvn/wrapper/
└── src/
    ├── main/
    │   ├── java/com/hack2026/mog/
    │   │   ├── resources/       # REST API контроллеры (@Path, @GET, @POST, @RunOnVirtualThread)
    │   │   ├── websocket/       # WebSocket эндпоинты (@WebSocket, стриминг полета и лидерборда)
    │   │   ├── services/        # Бизнес-логика, генерация случайности, игровой цикл, баланс
    │   │   ├── repositories/    # Слой доступа к данным (PanacheRepository<Entity>)
    │   │   ├── entities/        # JPA сущности базы данных (@Entity, @Table)
    │   │   ├── dto/             # Java Records для запросов и ответов API / WebSocket сообщений
    │   │   └── config/          # Конфигурационные бины, кэш параметров игры
    │   └── resources/
    │       ├── application.properties   # Основная конфигурация Quarkus
    │       └── db/migration/            # SQL-миграции Flyway (V1.0.0__init.sql, и т.д.)
    └── test/
```

### Ответственность слоев:
1. **`resources/` (REST Controllers):**
   - Принимают HTTP-запросы, валидируют DTO (Jakarta Validation: `@Valid`, `@NotNull`, `@Min`).
   - Вызывают сервисный слой.
   - Помечены `@RunOnVirtualThread` для неблокирующей обработки на виртуальных потоках.
2. **`websocket/` (Real-Time Endpoints):**
   - Обрабатывают подключение игрока к игровому раунду (`/ws/game/{gameId}`).
   - Рассылают тики множителя, уведомления об активации бустеров, взрыв шара (crash).
   - Транслируют изменения в живом турнирном рейтинге.
3. **`services/` (Business Logic):**
   - Содержат всю игровую логику: генерация точки краха до старта раунда (с dev-seed режимом), расчет выигрыша, начисление очков, проверка таймингов.
   - Управляют транзакциями (`@Transactional` при списании/начислении баланса).
   - Хранят состояние активных раундов в памяти (`ConcurrentHashMap`).
4. **`repositories/` (Data Access):**
   - Реализуют интерфейс `PanacheRepository<Entity>`.
   - Содержат кастомные запросы поиска, пагинации и агрегации.
5. **`entities/` (Database Models):**
   - JPA-сущности с аннотациями Hibernate (`@Entity`, `@Table`, `@Id`, `@Column`).
6. **`dto/` (Data Transfer Objects):**
   - Оформляются как неизменяемые **Java `record`** (максимально близко к TypeScript `type` / `interface`).

---

## 4. Памятка для разработчиков из TypeScript / Bun / Elysia

Если ваш основной стек — TS, Bun, Elysia и Drizzle ORM, используйте следующие аналогии:

| TypeScript / Bun / Elysia / Drizzle | Java 21 / Quarkus Panache | Пример |
|---|---|---|
| `type BetRequest = { amount: number }` | `public record BetRequest(@NotNull @Min(1) Long amount) {}` | Java Record автоматически создает конструктор, геттеры, equals/hashCode |
| `async (req) => { ... }` | `@RunOnVirtualThread public Response handle(...)` | Линейный код выполняется не блокируя поток операционной системы |
| `drizzle.query.users.findFirst(...)` | `userRepository.findById(id)` или `userRepository.find("email", email).firstResult()` | Типизированные методы репозитория Panache |
| `await db.transaction(async (tx) => { ... })` | `@Transactional public void doTransfer(...)` | Декларативная транзакция с автоматическим commit/rollback |
| `drizzle-kit generate / migrate` | Flyway SQL миграции в `src/main/resources/db/migration/` | Автоматически применяются при запуске приложения |
| `Elysia error handling` | `ExceptionMapper<T>` или стандартные `WebApplicationException` | Централизованная обработка ошибок |

---

## 5. Правила написания кода для AI-агентов

1. **Использовать Records для всех DTO:**
   Все входные и выходные модели API должны быть Java Records (`public record UserProfileDto(...) {}`).
2. **Не блокировать системные потоки:**
   Всегда вешать `@RunOnVirtualThread` на методы контроллеров и долгие операции.
3. **Изоляция работы с базой данных:**
   Никогда не вызывать SQL или репозитории напрямую из контроллеров или веб-сокетов — только через сервисный слой (`Service`).
4. **Транзакционность финансовых и балансовых операций:**
   Любое изменение баланса пользователя, ставки или выигрыша обязано быть внутри `@Transactional`.
5. **Потокобезопасность in-memory состояния:**
   Использовать `ConcurrentHashMap` и `AtomicReference` для хранения состояний активных полетов шара и комнат.
6. **Парсинг и валидация:**
   Использовать Jakarta Bean Validation аннотации (`@NotNull`, `@Size`, `@Min`, `@Max`) во всех входящих DTO.
7. **Flyway Migrations:**
   Не создавать таблицы через `hibernate.orm.database.generation=update` в проде. Всегда писать SQL-миграции `V{Version}__{Description}.sql`.

---

## 6. Базовые команды и запуск

```bash
# Запуск бэкенда в режиме разработки (Live Reload на порту 8080)
./mvnw quarkus:dev

# Сборка проекта без запуска тестов
./mvnw clean package -DskipTests

# Сборка Docker-образа
docker build -f src/main/docker/Dockerfile.jvm -t mog-backend .

# Запуск всего стека через docker-compose (из корня проекта)
docker compose up --build
```

---

## 7. Переменные окружения (Environment Variables)

| Переменная | Назначение | Значение по умолчанию (Dev) |
|---|---|---|
| `QUARKUS_DATASOURCE_JDBC_URL` | JDBC URL PostgreSQL | `jdbc:postgresql://localhost:5432/mog_db` |
| `QUARKUS_DATASOURCE_USERNAME` | Пользователь БД | `mog_user` |
| `QUARKUS_DATASOURCE_PASSWORD` | Пароль БД | `mog_pass` |
| `JWT_SECRET` | Секретный ключ для подписи токенов | `dev-jwt-secret-key-must-be-at-least-256-bits-long!` |
| `QUARKUS_HTTP_PORT` | Порт HTTP/WebSocket сервера | `8080` |
| `GAME_DEV_SEED` | Опциональный seed для детерминированного тестирования краха | *(пусто)* |
