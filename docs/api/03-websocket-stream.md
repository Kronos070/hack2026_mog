# 03. WebSocket в реальном времени (60 FPS)

Этот раздел посвящен высокоскоростному каналу связи **WebSocket** (`/ws/game`), который отвечает за трансляцию полета шара с частотой 60 кадров в секунду, моментальное оповещение о бустерах, кэшаутах и крахе.

---

## ⚡ Зачем нужен WebSocket в «Воздушном Шаре»?

В классических играх поллинг (постоянные HTTP GET запросы) не подходит:
1. Задержка HTTP не позволяет добиться плавной анимации на частоте 60 Гц.
2. При интервале запросов 16 мс сервер упадет под миллионами запросов.
3. Событие краха должно прилетать **мгновенно**, без задержек сетевого стека.

Поэтому бэкенд MOG использует постоянное полнодуплексное соединение на базе **Quarkus WebSockets Next** и виртуальных потоков Java 21 Loom:
- Каждое соединение игрока обслуживается легковесным потоком;
- Каждые ~16 мс сервер пушит тик множителя;
- При обрыве соединения сервер не блокируется, а при реконнекте игра мгновенно продолжается.

---

## 🔌 1. Подключение и рукопожатие (Handshake)

### Адрес для подключения:
```
ws://localhost:8080/ws/game?token=<ваш_jwt_токен>
```

> **Важно:** Браузерный API `WebSocket` не умеет слать заголовок `Authorization: Bearer ...`, поэтому токен авторизации передается в виде query-параметра `?token=...`.

### Что происходит при подключении:
1. Сервер валидирует JWT-токен.
2. Если токен отсутствует, просрочен или поврежден:
   - Сервер шлет сообщение об ошибке: `{"type": "ERROR", "message": "Token required: /ws/game?token=<jwt>"}`;
   - Соединение немедленно закрывается с кодом `1008 Policy Violation`.
3. Если токен валиден:
   - Соединение привязывается к `userId` игрока;
   - Сервер шлет приветственное событие `CONNECTED`;
   - **Автоматическое возобновление:** Если у игрока прямо сейчас в фоне идет активный раунд (например, после обновления страницы `F5`), сервер мгновенно подхватывает его и начинает слать тики полета!

---

## 🔄 2. Входящие сообщения (Клиент ➔ Сервер)

Игровой сокет предназначен преимущественно для **push-стриминга от сервера к клиенту**. 
Финансовые операции (старт ставки и забор выигрыша) производятся через безопасные транзакционные REST-эндпоинты (`POST /api/game/start` и `POST /api/game/cashout`), что исключает потерю денег при обрыве сокета.

Клиент может отправлять в сокет сообщения проверки связи (Keep-Alive):

### `PING` — Проверка жизнеспособности соединения
- **Отправка клиентом:** обычная текстовая строка: `"PING"`
- **Ответ сервера:**
  ```json
  {
    "type": "PONG",
    "message": "PONG"
  }
  ```
*Рекомендуется отправлять `"PING"` каждые 20–30 секунд для предотвращения закрытия соединения промежуточными прокси-серверами или фаерволами.*

---

## 📡 3. Исходящие сообщения (Сервер ➔ Клиент)

Все сообщения от сервера приходят в виде JSON-строк и имеют обязательное поле `"type"`.

### 3.1. Событие успешного подключения `CONNECTED`
Отправляется сразу после рукопожатия:
```json
{
  "type": "CONNECTED",
  "message": "Connected to game stream: sky_pilot_99"
}
```

---

### 3.2. Тик полета `TICK` (60 раз в секунду)
Шлется каждые ~16 мс с момента взлета и до краха шара:
```json
{
  "type": "TICK",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "multiplier": 2.45,
  "elapsedMs": 14850
}
```
#### Поля:
- `roundId`: UUID текущего раунда;
- `multiplier`: текущий коэффициент (например, `2.45` означает $2.45\times$). Если на пути сработал бустер, в этом поле уже транслируется итоговое значение с учетом бустера!
- `elapsedMs`: время в миллисекундах с момента старта полета.

> **Совет по оптимизации рендеринга:**  
> Чтобы не вызывать ререндер React-компонентов 60 раз в секунду, сохраняйте `multiplier` в `useRef` или передавайте напрямую в Canvas/WebGL движок (Pixi.js, Three.js или обычный 2D Context).

---

### 3.3. Срабатывание бустера `BOOSTER_ACTIVATED`
Отправляется ровно в миллисекунду, когда шар пересекает высотную линию, на которой был установлен маркер бустера:
```json
{
  "type": "BOOSTER_ACTIVATED",
  "level": 5,
  "boosterMultiplier": 3,
  "previousMultiplier": 2.70,
  "currentMultiplier": 8.10,
  "bonusPoints": 30,
  "message": "Booster x3 activated!"
}
```
#### Поля:
- `level`: номер уровня, на котором сработал бустер (например, 5);
- `boosterMultiplier`: кратность бустера (2, 3 или 4);
- `previousMultiplier`: множитель за мгновение до бустера (`2.70`);
- `currentMultiplier`: новый множитель после скачка ($2.70 \times 3 = 8.10$);
- `bonusPoints`: начисленные бонусные очки за бустер (`boosterMultiplier * 10 = 30`).

#### Что должен сделать фронтенд:
1. Воспроизвести звук ускорения / взрыва турбины;
2. Показать вспышку или эффект пламени под корзиной шара;
3. Мгновенно обновить цифру коэффициента и перерисовать кривую полета.

---

### 3.4. Подтверждение фиксации выигрыша `CASHOUT`
Приходит в сокет сразу после успешного выполнения HTTP-запроса `POST /api/game/cashout`:
```json
{
  "type": "CASHOUT",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "multiplier": 3.60,
  "winAmount": 360,
  "newBalance": 1260,
  "pointsEarned": 90,
  "levelsPassed": 4,
  "boosterActivated": true,
  "message": "Cashout successful",
  "reward": {
    "kind": "puzzle-piece",
    "pieceId": "piece_3",
    "label": "Фрагмент 3",
    "collected": 3,
    "total": 9
  },
  "unlockedAchievements": [
    {
      "id": "lucky_start",
      "title": "Удачный старт",
      "description": "Выиграть свой первый раунд",
      "letter": "У",
      "unlockedAt": 1726099200000
    }
  ]
}
```
#### Что должен сделать фронтенд:
1. Зафиксировать состояние кнопки: кнопка «Забрать» превращается в статус «Забрано: 360 бонусов!»;
2. Обновить баланс игрока в шапке сайта (`newBalance: 1260`);
3. Показать тост выпавшего кусочка пазла (`reward`) и ачивок (`unlockedAchievements`);
4. **НЕ останавливать шар!** Согласно правилам игры, шар продолжает полет и стримит события `TICK` до момента взрыва.

---

### 3.5. Крах шара `CRASHED`
Отправляется в момент, когда шар лопается (время полета достигло `crashTime`):
```json
{
  "type": "CRASHED",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "crashMultiplier": 4.82,
  "winAmount": 0,
  "newBalance": 900,
  "elapsedMs": 18200,
  "pointsEarned": 30,
  "levelsPassed": 3,
  "boosterActivated": false,
  "message": "Balloon crashed!",
  "reward": null,
  "unlockedAchievements": []
}
```
#### Что должен сделать фронтенд:
1. Воспроизвести анимацию взрыва шара (частицы ткани, дым);
2. Если игрок не успел забрать выигрыш — показать красную плашку краша с финальным коэффициентом (`crashMultiplier: 4.82`);
3. Если игрок успел забрать выигрыш ранее — показать финальный поздравительный экран с результатом;
4. Разблокировать форму для ввода новой ставки на следующий раунд.

---

### 3.6. Ошибка `ERROR`
```json
{
  "type": "ERROR",
  "message": "Authentication failed: JWT expired"
}
```
При получении ошибки клиенту следует обновить токен через повторную авторизацию и переподключиться.

---

## 💻 4. Готовый пример WebSocket-клиента (TypeScript / React)

Ниже приведен готовый типобезопасный класс для интеграции на клиенте:

```typescript
export type WsGameMessage = {
  type: "CONNECTED" | "TICK" | "BOOSTER_ACTIVATED" | "CASHOUT" | "CRASHED" | "ERROR" | "PONG";
  roundId?: string;
  multiplier?: number;
  crashMultiplier?: number;
  winAmount?: number;
  newBalance?: number;
  elapsedMs?: number;
  level?: number;
  boosterMultiplier?: number;
  pointsEarned?: number;
  reward?: any;
  unlockedAchievements?: any[];
  message?: string;
};

export class GameSocketClient {
  private ws: WebSocket | null = null;
  private pingInterval: any = null;

  constructor(
    private url: string,
    private token: string,
    private onMessage: (msg: WsGameMessage) => void,
    private onError?: (err: Event) => void
  ) {}

  public connect() {
    this.ws = new WebSocket(`${this.url}?token=${encodeURIComponent(this.token)}`);

    this.ws.onopen = () => {
      console.log('Game WebSocket connected');
      // Запуск heartbeat каждые 25 сек
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('PING');
        }
      }, 25000);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsGameMessage = JSON.parse(event.data);
        this.onMessage(msg);
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    this.ws.onclose = () => {
      console.log('Game WebSocket closed');
      clearInterval(this.pingInterval);
    };

    this.ws.onerror = (err) => {
      console.error('Game WebSocket error', err);
      if (this.onError) this.onError(err);
    };
  }

  public disconnect() {
    clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

---

Переходите к следующему разделу: [**04. Мета-игра и удержание игроков**](./04-meta-game.md) 🧩
