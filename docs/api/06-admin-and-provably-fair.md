# 06. Админка, House Edge и Provably Fair

В этом разделе описаны механизмы управления игрой в реальном времени, панель администратора с горячей перезагрузкой параметров (Hot-Reload), адаптивная модель преимущества казино (House Edge) и криптографическая система доказуемой честности (Provably Fair).

---

## ⚙️ 1. Панель управления игрой (Admin Config & Hot-Reload)

Согласно ТЗ §1.9, администраторы должны иметь возможность настраивать ключевые балансировочные параметры игры (скорость роста, множители бустеров, вероятности лута, бонусные очки) **без перезапуска сервера и без простоя игры**.

### Архитектура Hot-Reload:
- Реализована в сервисе [`GameConfigService.java`](file:///Users/kenny/Work/hack2026_mog/backend/src/main/java/com/hack2026/mog/services/GameConfigService.java) и контроллере [`AdminConfigResource.java`](file:///Users/kenny/Work/hack2026_mog/backend/src/main/java/com/hack2026/mog/resources/AdminConfigResource.java);
- Параметры сохраняются в БД в таблице `game_configs` в формате JSONB;
- В оперативной памяти параметры кэшируются в потокобезопасной ссылке `AtomicReference<GameConfigDto>`;
- Чтение параметров во время 60 FPS тиков полета шара выполняется за **$O(1)$ без единого обращения к базе данных**;
- При вызове `PUT` ссылка в памяти атомарно заменяется, и новые параметры вступают в силу со следующего игрового раунда;
- Веб-интерфейс редактирования параметров доступен по адресу `/admin` в компоненте [AdminPage.tsx](file:///Users/kenny/Work/hack2026_mog/frontend/src/features/admin/AdminPage.tsx).

---

### 1.1. Получение текущей конфигурации
`GET /api/admin/config`
- **Авторизация:** `Authorization: Bearer <token>` (доступно всем авторизованным пользователям для инициализации клиента).
- **Ответ `200 OK` (`GameConfigDto`):**
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
  "boosterCostFragments": [0, 2, 4, 6],
  "lootProbabilities": {
    "green": [0.0, 0.25, 0.20, 0.18, 0.15, 0.10, 0.07, 0.04, 0.01],
    "red": [0.0, 0.20, 0.18, 0.15, 0.13, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02, 0.01]
  },
  "minWinAmount": 50,
  "popupTimeout": 10
}
```

#### Назначение параметров:
| Параметр | Тип | Назначение |
|---|---|---|
| `isActive` | boolean | Флаг активности игры (позволяет временно приостановить прием ставок). |
| `alpha` | number | Коэффициент распределения Парето для генератора краша ($1.30$). |
| `maxMultiplier` | number | Максимально возможный коэффициент полета шара ($100.0\times$). |
| `minCrashMultiplier` | number | Минимальная точка краха ($1.01\times$). |
| `multiplierGrowthRate`| number | Базовая скорость подъема шара. |
| `growthAcceleration` | number | Ускорение подъема на высоких высотах. |
| `pointsPerLine` | number | Турнирные очки за пересечение одной высотной линии (10). |
| `pointsCashoutBonus` | number | Бонусные турнирные очки за успешный кэшаут (25). |
| `pointsBoosterBonus` | number | Базовый бонус очков за бустер (50). |
| `boosterTierValues` | array | Множители для тиров 1, 2, 3 и 4 бустеров: `[1.0, 2.0, 3.0, 4.0]`. |
| `boosterCostFragments` | array | Стоимость бустеров во фрагментах пазла для тиров 1, 2, 3 и 4: `[0, 2, 4, 6]`. |
| `lootProbabilities` | object | Таблицы вероятностей выпадения лута на каждом уровне для зеленой (9 уровней) и красной (12 уровней) тем. |
| `minWinAmount` | number | Минимальная сумма выигрыша для отображения поздравительного попапа. |
| `popupTimeout` | number | Время показа поздравительного экрана в секундах. |

---

### 1.2. Горячее обновление настроек
`PUT /api/admin/config`
- **Авторизация:** `Authorization: Bearer <token>` (строго роль **`ADMIN`**, иначе сервер вернет `403 Forbidden`).
- **Тело запроса:** JSON объект `GameConfigDto` с обновленными значениями.
- **Валидация:** Сервер проверяет значения через Jakarta Validation (`@Positive`, `@DecimalMin`, корректность длины массивов).
- **Ответ `200 OK`:** Сохраненный объект конфигурации.

---

### 1.3. Управление стоимостью бустеров (Booster Pricing)

Администратор может гибко балансировать экономику фрагментов без правки глобального конфига игры.

#### Чтение текущей сетки цен бустеров:
`GET /api/admin/boosters/pricing`
- **Авторизация:** `Authorization: Bearer <token>`
- **Ответ `200 OK` (`List<BoosterTierPricingDto>`):**
```json
[
  { "tier": 1, "multiplier": 1.0, "costFragments": 0 },
  { "tier": 2, "multiplier": 2.0, "costFragments": 2 },
  { "tier": 3, "multiplier": 3.0, "costFragments": 4 },
  { "tier": 4, "multiplier": 4.0, "costFragments": 6 }
]
```

#### Горячее обновление цен бустеров:
`PUT /api/admin/boosters/pricing`
- **Авторизация:** `Authorization: Bearer <token>` (роль **`ADMIN`**)
- **Тело запроса (`Content-Type: application/json`):** Массив ровно из 4 целых неотрицательных чисел (стоимость для тиров 1, 2, 3, 4).
```json
[0, 2, 4, 6]
```
- **Ответ `200 OK`:** Обновленный список `List<BoosterTierPricingDto>`. Изменения вступают в силу со следующего раунда мгновенно.

---

### 1.4. Сброс к заводским эталонным настройкам
`POST /api/admin/config/reset`
- **Авторизация:** Требуется роль **`ADMIN`**.
- **Ответ `200 OK`:** Сбрасывает конфигурацию к каноническим дефолтным значениям из ТЗ §1.9.

---

## 🔒 2. Доказуемая честность (Provably Fair)

В азартных играх критически важно доверие игроков: они должны иметь возможность математически проверить, что результат раунда был определен **до начала ставки**, и сервер не «подкрутил» взрыв шара в момент клика.

### Как это устроено:
1. До начала игры сервер генерирует три значения:
   - **`serverSeed`** — случайная криптографическая 256-битная строка сервера;
   - **`clientSeed`** — сид клиента (генерируется браузером);
   - **`nonce`** — временная метка раунда в миллисекундах.
2. В ответе на старт раунда (`/api/game/start`) клиент получает публичный хэш:
   $$\text{provablyFairHash} = \text{SHA256}(\text{serverSeed} : \text{clientSeed} : \text{nonce})$$
   Серверный сид держится в секрете до конца игры, но хэш уже зафиксирован!
3. После завершения игры в ответе кэшаута (`/api/game/cashout`) сервер **раскрывает исходные `serverSeed`, `clientSeed` и `nonce`**.
4. Игрок может сам вычислить хэш и коэффициент краха и убедиться, что они совпали до последней цифры!

---

### 🧮 Готовый скрипт проверки честности раунда (TypeScript)

Вы можете встроить эту функцию в интерфейс (например, на вкладку «Проверка честности» в истории игр):

```typescript
import { createHmac } from "crypto";

export function verifyRoundCrash(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge: number,
  expectedCrash: number
): boolean {
  // 1. Объединяем сид клиента и номер раунда
  const combinedSeed = `${clientSeed}:${nonce}`;

  // 2. Считаем HMAC-SHA256
  const hmac = createHmac("sha256", Buffer.from(serverSeed, "utf-8"))
    .update(Buffer.from(combinedSeed, "utf-8"))
    .digest();

  // 3. Берем первые 52 бита (первые 6 байт + 4 бита 7-го байта)
  let h = 0n;
  for (let i = 0; i < 6; i++) {
    h = (h << 8n) | BigInt(hmac[i]);
  }
  h = (h << 4n) | BigInt(hmac[6] >> 4);

  const e = 1n << 52n; // 2^52
  const eNum = Number(e);
  const hNum = Number(h);

  // 4. Формула расчетного краша с учетом House Edge
  const rawCrash = Math.max(
    1.00,
    ((100 * eNum - hNum) / (eNum - hNum)) * (1.0 - houseEdge) / 100.0
  );

  // 5. Округление вниз до 2 знаков после запятой
  const calculatedCrash = Math.max(1.00, Math.floor(rawCrash * 100) / 100);

  // Сравниваем с фактически полученным значением
  return Math.abs(calculatedCrash - expectedCrash) < 1e-6;
}
```

---

## 📈 3. Адаптивная модель преимущества казино (House Edge)

В «Воздушном Шаре» реализована гибкая математическая модель House Edge:
- **Базовое преимущество казино:** **$HE_{base} = 0.04$ (4%)** $\to$ Теоретический возврат игроку **$RTP = 96\%$**;
- **Допустимый диапазон:** от $HE_{min} = 0.5\%$ до $HE_{max} = 33\%$;
- **Динамическая адаптация:**
  - При крупной серии выигрышей игрока $HE$ плавно повышается, защищая банк игры;
  - При проигрыше $HE$ снижается на $-0.01$ (возвращая игроку большую вероятность выигрыша);
  - При резкой смене размера ставки $HE$ плавно возвращается к базовому значению $4\%$.

### Эндпоинты House Edge:

#### 1. Просмотр текущего House Edge игрока
`GET /api/game/house-edge`
- **Авторизация:** `Authorization: Bearer <token>`
- **Ответ `200 OK` (`PlayerHouseEdgeResponse`):**
```json
{
  "userId": 42,
  "currentHouseEdge": 0.0425,
  "rtp": 0.9575,
  "expectedValue": -0.0425,
  "lastBetAmount": 100
}
```
*Здесь $RTP = 0.9575$ означает $95.75\%$ возврата, а $EV = -4.25\%$ — математическое ожидание игрока на раунд.*

#### 2. Сброс House Edge к базовым 4%
`POST /api/game/house-edge/reset`
- **Авторизация:** `Authorization: Bearer <token>`
- **Ответ `200 OK`:** Сбрасывает персональный $HE$ к $0.04$ и обнуляет историю предыдущих ставок игрока (удобно для сброса состояния в тестах).

---

Переходите к финальному разделу: [**07. Шпаргалка TypeScript и справочник ошибок**](./07-cheatsheet-and-contracts.md) 📋
