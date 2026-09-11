# Открытый бэклог хакатона (Backlog)

Статус: reference / current · сверено: 2026-09-11

Список задач, которые предстоит реализовать на хакатоне. Когда задача закрыта — строка удаляется отсюда и переносится в [backlog-resolved.md](backlog-resolved.md) с кратким описанием решения.

---

## Высокий приоритет (Игровой цикл и демо)
- [ ] **WS-1**: DTO records для WebSocket протокола (`GameTickDto`, `RoundStatusDto`, `BetEventDto`, `CrashEventDto`).
- [ ] **WS-2**: `GameLoopService` — таймер раундов, генерация точки краха, расчет текущего множителя по времени.
- [ ] **WS-3**: `GameWebSocket` (`/ws/game`) на Quarkus WebSockets Next — бродкаст тиков клиентам.
- [ ] **GAME-1**: Валидация и прием ставок (`POST /api/game/bet` или через WS) со списанием `bonus_balance` в `@Transactional`.
- [ ] **GAME-2**: Механизм Cashout — фиксация коэффициента игрока до момента краха, расчет выигрыша, начисление баланса.

## Средний приоритет (Турнир и фичи Столото)
- [ ] **TOUR-1**: Начисление турнирных очков за успешные раунды в таблицу `tournament_entries`.
- [ ] **TOUR-2**: REST/WebSocket эндпоинт живого лидерборда (`GET /api/tournament/leaderboard`).
- [ ] **CFG-1**: Админский REST API для изменения параметров игры (`POST /api/admin/config`) с горячим обновлением в памяти.
