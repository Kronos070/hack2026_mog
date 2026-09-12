# 05. Турниры, Лидерборд и SSE-стримы

Этот модуль описывает соревновательную систему **суточных турниров** («Гран-при Воздухоплавателей Столото»), динамический расчет призового фонда и потоковую трансляцию таблицы лидеров в реальном времени через **Server-Sent Events (SSE)**.

---

## 🏆 1. Концепция суточного турнира

Турнир — это регулярное суточное соревнование всех игроков:
1. **Период проведения:** Каждый турнир длится ровно сутки и завершается в **23:59:59 МСК**.
2. **Как начисляются турнирные очки:**
   - **+10 очков** за каждый высотный уровень, пройденный шаром;
   - **+(boosterMultiplier $\times$ 10) очков** за активацию бустера во время полета;
   - **+50 очков** за успешную фиксацию выигрыша (кэшаут).
   *(Даже если шар лопнул и ставка сгорела, заработанные за пройденные до краха уровни очки сохраняются в турнирной копилке игрока!)*
3. **Призовой фонд:** По итогам суток **ТОП-3 лучших игрока** получают призовые бонусы прямо на свой игровой баланс!

### 💰 Сетка призовых выплат ТОП-3:
- 🥇 **1 место:** **100%** от набранных очков победителя (`prize = points`);
- 🥈 **2 место:** **60%** от набранных очков (`prize = Math.round(points * 0.6)`);
- 🥉 **3 место:** **30%** от набранных очков (`prize = Math.round(points * 0.3)`);
- 4+ места: почетное участие без начисления бонусов (`prize = 0`).

---

## 📡 2. Server-Sent Events (SSE) стриминг (1 Гц)

Вместо устаревшего клиентского поллинга (когда браузер каждую секунду бомбит сервер HTTP GET запросами), бэкенд MOG предоставляет **Server-Sent Events (SSE)** с частотой 1 раз в секунду:
- **Нулевая задержка:** Первый снимок турнирной таблицы улетает клиенту за $\le 10$ миллисекунд;
- **Экономия трафика:** Держится одно постоянное HTTP-соединение;
- **Авто-реконнект:** Браузерный `EventSource` автоматически переподключается при сбоях сети;
- **Не блокирует EventLoop:** Обработка тиков производится на пуле виртуальных потоков Java 21 Loom с изоляцией L1-кэша базы данных.

---

### 2.1. Стрим полной турнирной таблицы
`GET /api/tournament/stream`
- **Протокол:** HTTP SSE (`Accept: text/event-stream`)
- **Авторизация:** Публичный (токен не требуется)
- **Формат события:**
```http
data:{"title":"Гран-при Воздухоплавателей Столото","endsAt":1789246799000,"entries":[{"place":1,"playerId":"7","playerName":"alex_pilot","points":3450,"prize":3450},{"place":2,"playerId":"8","playerName":"sky_queen","points":2890,"prize":1734},{"place":3,"playerId":"9","playerName":"wind_master","points":2410,"prize":723},{"place":4,"playerId":"42","playerName":"sky_pilot_99","points":1980,"prize":0}],"currentPlayerId":null}
```

#### Поля объекта:
- `title` (string) — название турнира;
- `endsAt` (number) — timestamp завершения в миллисекундах (конец суток 23:59:59 MSK). Используйте для таймера обратного отсчета на клиенте;
- `entries` (массив) — список лидеров, отсортированный по убыванию очков;
  - `place`: занятое место (1, 2, 3...);
  - `playerId`: ID игрока в виде строки;
  - `playerName`: имя игрока;
  - `points`: набранные турнирные очки;
  - `prize`: расчетный размер приза в бонусах на данный момент;
- `currentPlayerId`: в широковещательном стриме всегда `null`. Фронтенд сравнивает `entry.playerId` со своим локальным сохраненным `user.id` и подсвечивает свою строку золотым/зеленым цветом («Вы»).

---

### 2.2. Стрим компактного рейтинга лидеров
`GET /api/tournament/leaderboard/stream`
Облегченный стрим для виджета рейтинга на главной странице или в сайдбаре:
```http
data:[{"playerId":"7","playerName":"alex_pilot","points":3450},{"playerId":"8","playerName":"sky_queen","points":2890},{"playerId":"9","playerName":"wind_master","points":2410}]
```

---

## 🌐 3. Классические REST-эндпоинты турнира

Если в вашем приложении не требуется постоянный стриминг, можно использовать стандартные HTTP GET запросы.

### 3.1. Получение данных о турнире
`GET /api/tournament`
- **Авторизация:** Опционально (`Authorization: Bearer <token>`). Если токен передан, поле `currentPlayerId` автоматически заполнится ID текущего пользователя.
- **Ответ `200 OK`:** Объект `TournamentResponseDto` (аналогичен телу события SSE).

### 3.2. Компактный список лидеров
`GET /api/tournament/leaderboard?limit=50`
- **Параметр:** `limit` (по умолчанию 50 записей).
- **Ответ `200 OK`:** Список объектов `LeaderboardEntryDto`.

---

## 🏁 4. Финализация турнира и выплата призов

### `POST /api/tournament/settle`
Подводит итоги турнира: начисляет призы ТОП-3 победителям на их бонусный баланс, архивирует результаты и сбрасывает очки для старта нового турнира.

- **Как это работает автоматически:**  
  Метод вызывается встроенным планировщиком задач Quarkus Scheduler ровно в полночь **00:00:00 МСК** (`@Scheduled(cron = "0 0 0 * * ?")`).
- **Ручной запуск для тестирования (`?force=true`):**  
  Если турнир еще не закончился, вызов без параметров вернет статус `SKIPPED`.  
  Чтобы принудительно завершить турнир прямо сейчас во время демонстрации или автотестов, передайте флаг:
  ```http
  POST /api/tournament/settle?force=true
  ```

#### Ответ `200 OK` (`TournamentSettlementResultDto`):
```json
{
  "status": "SUCCESS",
  "tournamentTitle": "Гран-при Воздухоплавателей Столото",
  "settledAt": 1789207734656,
  "rewardedPlayersCount": 3,
  "totalPrizesAwarded": 5907,
  "winners": [
    {
      "place": 1,
      "playerId": "7",
      "playerName": "alex_pilot",
      "score": 3450,
      "prizeAwarded": 3450,
      "awardedAt": "2026-09-12T10:08:54.663907Z"
    },
    {
      "place": 2,
      "playerId": "8",
      "playerName": "sky_queen",
      "score": 2890,
      "prizeAwarded": 1734,
      "awardedAt": "2026-09-12T10:08:54.681504Z"
    },
    {
      "place": 3,
      "playerId": "9",
      "playerName": "wind_master",
      "score": 2410,
      "prizeAwarded": 723,
      "awardedAt": "2026-09-12T10:08:54.684889Z"
    }
  ],
  "message": "Турнир успешно финализирован! Призы зачислены на баланс победителей."
}
```

---

## 📜 5. Архив прошедших турниров

### `GET /api/tournament/history`
Позволяет посмотреть списки призеров завершенных соревнований.
- **Параметры query:**
  - `my` (boolean, по умолчанию `false`):
    - `false` — возвращает общую историю всех призеров;
    - `true` — возвращает только призовые места текущего авторизованного игрока (требуется Bearer токен).
  - `limit` (int, по умолчанию `20`).
- **Ответ `200 OK`:** Массив объектов `TournamentHistoryItemDto`.

---

## 💻 6. Готовый React-хук для подключения к SSE-стримам

Скопируйте этот сниппет в свой фронтенд-проект:

```typescript
import { useEffect, useState } from 'react';

export interface TournamentEntry {
  place: number;
  playerId: string;
  playerName: string;
  points: number;
  prize: number;
}

export interface TournamentData {
  title: string;
  endsAt: number;
  entries: TournamentEntry[];
  currentPlayerId: string | null;
}

export function useTournamentStream(baseUrl = 'http://localhost:8080') {
  const [data, setData] = useState<TournamentData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`${baseUrl}/api/tournament/stream`);

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const parsed: TournamentData = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        console.error('Ошибка парсинга SSE турнира', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [baseUrl]);

  return { data, isConnected };
}
```

---

Переходите к следующему разделу: [**06. Админка, House Edge и Provably Fair**](./06-admin-and-provably-fair.md) ⚙️
