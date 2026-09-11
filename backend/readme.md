# Backend — Руководство по локальному запуску и разработке

> **Для AI-агентов:** Данный документ содержит исчерпывающие инструкции и команды для поднятия окружения, запуска приложения в режиме разработки, сборки и диагностики бэкенда. Детальные архитектурные правила и соглашения по коду описаны в [AGENTS.md](./AGENTS.md).

---

## 1. Стек и требования

- **Java:** OpenJDK 21+ (в окружении доступен OpenJDK 26 Temurin)
- **Фреймворк:** Quarkus 3.x (с поддержкой Virtual Threads / Project Loom)
- **Сборщик:** Maven Wrapper (`./mvnw`)
- **База данных:** PostgreSQL 16+
- **Docker / Docker Compose:** для запуска БД или контейнеризированного приложения

---

## 2. Быстрый старт (TL;DR)

### Шаг 1. Запуск PostgreSQL
Из корня проекта (`/Users/kenny/Work/hack2026_mog`):
```bash
docker compose up -d postgres
```
Проверить статус готовности БД:
```bash
docker compose ps postgres
```
*(База будет доступна на `localhost:5432`, БД: `mog_db`, логин: `mog_user`, пароль: `mog_pass`)*.

---

### Шаг 2. Запуск бэкенда в режиме разработки (Dev Mode)
Перейдите в директорию `backend`:
```bash
cd backend
./mvnw quarkus:dev
```

Особенности режима `quarkus:dev`:
- **Live Reload / Hot Swap:** изменения в Java-файлах, ресурсах и миграциях подхватываются автоматически при следующем HTTP/WebSocket запросе без перезапуска процесса.
- **Миграции БД:** Flyway автоматически накатывает новые миграции из `src/main/resources/db/migration/` на старте.
- **Управление из консоли:**
  - Нажмите `h` — справка по горячим клавишам.
  - Нажмите `s` — принудительный рестарт Live Reload.
  - Нажмите `q` — корректная остановка сервера.

---

### Шаг 3. Проверка работоспособности
После запуска сервер доступен по адресу `http://localhost:8080`:

| Сервис / Страница | URL | Описание |
|---|---|---|
| **Swagger UI** | [http://localhost:8080/q/swagger-ui](http://localhost:8080/q/swagger-ui) | Интерактивная документация REST API |
| **OpenAPI Schema** | [http://localhost:8080/q/openapi](http://localhost:8080/q/openapi) | OpenAPI 3.0 спецификация (JSON/YAML) |
| **Quarkus Dev UI** | [http://localhost:8080/q/dev-ui](http://localhost:8080/q/dev-ui) | Панель управления Quarkus, расширения, конфигурация |
| **Health Check** | [http://localhost:8080/q/health](http://localhost:8080/q/health) | Общий статус сервиса и подключений (БД) |
| **WebSocket** | `ws://localhost:8080/ws` | Эндпоинты реального времени (WebSockets Next) |

Быстрая проверка curl:
```bash
curl -i http://localhost:8080/q/health
```

---

## 3. Сборка проекта

### Быстрая валидация компиляции (синтаксис и типы):
```bash
./mvnw clean compile
```

### Полная сборка JAR (без запуска тестов):
```bash
./mvnw clean package -DskipTests
```
Собранный fast-jar артефакт появится в директории `target/quarkus-app/`.

### Запуск собранного JAR:
```bash
java -jar target/quarkus-app/quarkus-run.jar
```

---

## 4. Переменные окружения (Environment Variables)

Все переменные имеют значения по умолчанию для локальной разработки в [application.properties](./src/main/resources/application.properties):

| Переменная | Назначение | Значение по умолчанию (Local Dev) |
|---|---|---|
| `QUARKUS_HTTP_PORT` | Порт HTTP и WebSocket сервера | `8080` |
| `QUARKUS_DATASOURCE_JDBC_URL` | JDBC URL к PostgreSQL | `jdbc:postgresql://localhost:5432/mog_db` |
| `QUARKUS_DATASOURCE_USERNAME` | Пользователь БД | `mog_user` |
| `QUARKUS_DATASOURCE_PASSWORD` | Пароль БД | `mog_pass` |
| `JWT_SECRET` | Секрет для генерации/проверки токенов | `dev-jwt-secret-key-must-be-at-least-256-bits-long!` |
| `GAME_DEV_SEED` | Seed для детерминированного краша (тесты) | *(пусто)* |

### Пример запуска с переопределением порта или параметров БД:
```bash
QUARKUS_HTTP_PORT=8081 ./mvnw quarkus:dev
```

---

## 5. Работа с базой данных и Flyway миграциями

1. Все миграции хранятся в `backend/src/main/resources/db/migration/`.
2. Формат именования файлов: `V<Version>__<Description>.sql` (два подчеркивания!).
   - Пример: `V1.0.2__create_leaderboard_table.sql`.
3. При старте бэкенда Flyway автоматически сравнивает текущую версию схемы и накатывает недостающие миграции.
4. Прямое подключение к базе данных через psql:
```bash
docker exec -it mog-postgres psql -U mog_user -d mog_db
```

---

## 6. Запуск через Docker

### Сборка и запуск только бэкенда и БД из корня:
```bash
docker compose up --build backend postgres
```

### Сборка standalone Docker-образа бэкенда:
```bash
# Из папки backend:
./mvnw package -DskipTests
docker build -f src/main/docker/Dockerfile.jvm -t mog-backend .
```

---

## 7. Диагностика частых проблем (Troubleshooting для AI)

1. **`Connection refused` к PostgreSQL (порт 5432):**
   - Убедитесь, что контейнер с БД поднят: `docker ps | grep mog-postgres`.
   - Если нет: выполните `docker compose up -d postgres` из корня проекта.
2. **Порт 8080 уже занят (`Address already in use`):**
   - Найти процесс: `lsof -i :8080`.
   - Завершить мешающий процесс или запустить бэкенд на другом порту: `QUARKUS_HTTP_PORT=8081 ./mvnw quarkus:dev`.
3. **Ошибки миграций Flyway (`FlywayException` / Checksum mismatch):**
   - Если изменился уже примененный файл миграции, очистите локальный том БД: `docker compose down -v && docker compose up -d postgres`.
4. **Не хватает прав на исполнение `./mvnw`:**
   - Выполнить `chmod +x ./mvnw`.
