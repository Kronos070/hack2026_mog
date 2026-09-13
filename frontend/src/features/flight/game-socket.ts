// WebSocket игрового стрима: постоянное соединение, тики множителя, бустер, cashout и крах

import { readToken } from '@/shared/api/auth-token';
import { API_URL } from '@/shared/api/http';

export interface SocketMessage {
  type: string;
  roundId?: string;
  multiplier?: number;
  crashMultiplier?: number;
  winAmount?: number;
  newBalance?: number;
  elapsedMs?: number;
  level?: number;
  boosterMultiplier?: number;
  previousMultiplier?: number;
  bonusPoints?: number;
  pointsEarned?: number;
  levelsPassed?: number;
  boosterActivated?: boolean;
  message?: string;
  reward?: {
    kind?: string;
    pieceId?: string;
    label?: string;
    collected?: number;
    total?: number;
  };
  unlockedAchievements?: {
    id: string;
    title: string;
    description: string;
    letter: string;
    unlockedAt: number | null;
  }[];
}

function socketUrl(): string {
  const token = readToken() ?? '';
  if (API_URL.startsWith('/')) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const base = API_URL.replace(/\/api\/?$/, '');
    return `${proto}//${window.location.host}${base}/ws/game?token=${encodeURIComponent(token)}`;
  }
  const base = API_URL.replace(/\/api\/?$/, '');
  const wsBase = base.replace(/^http/, 'ws');
  return `${wsBase}/ws/game?token=${encodeURIComponent(token)}`;
}

type MessageListener = (message: SocketMessage) => void;

class GameSocketManager {
  private socket: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private roundBuffers: Map<string, SocketMessage[]> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;

  public connect(): void {
    const token = readToken();
    if (!token) return;

    // Если соединение уже открыто или открывается — повторно не создаём
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isExplicitlyClosed = false;
    try {
      const url = socketUrl();
      const ws = new WebSocket(url);
      this.socket = ws;

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as SocketMessage;
          if (msg.roundId) {
            let buffer = this.roundBuffers.get(msg.roundId);
            if (!buffer) {
              buffer = [];
              this.roundBuffers.set(msg.roundId, buffer);
              if (this.roundBuffers.size > 20) {
                const oldest = this.roundBuffers.keys().next().value;
                if (oldest) this.roundBuffers.delete(oldest);
              }
            }
            if (msg.type === 'TICK') {
              const tickIdx = buffer.findIndex((m) => m.type === 'TICK');
              if (tickIdx >= 0) buffer[tickIdx] = msg;
              else buffer.push(msg);
            } else {
              buffer.push(msg);
            }
          }

          for (const listener of this.listeners) {
            try {
              listener(msg);
            } catch (err) {
              console.error('[WS listener error]:', err);
            }
          }
        } catch {
          // Игнорируем не-JSON сообщения (например, PONG)
        }
      };

      ws.onclose = () => {
        this.stopHeartbeat();
        this.socket = null;
        if (!this.isExplicitlyClosed && readToken()) {
          this.scheduleReconnect();
        }
      };

      ws.onerror = () => {
        // Событие onclose сработает следом и обработает переподключение
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send('PING');
        } catch {
          // ignore
        }
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 5000);
    this.reconnectAttempts += 1;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  public subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    this.connect();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopHeartbeat();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
  }

  public getBufferedMessages(roundId: string): SocketMessage[] {
    return this.roundBuffers.get(roundId) ?? [];
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

const manager = new GameSocketManager();

/**
 * Получение буферизованных сообщений для раунда (на случай если события пришли до подписки слушателя)
 */
export function getBufferedGameMessages(roundId: string): SocketMessage[] {
  return manager.getBufferedMessages(roundId);
}

/**
 * Прогревает постоянное WebSocket-соединение заранее (например, при входе в игру)
 */
export function ensureGameSocketConnected(): void {
  manager.connect();
}

/**
 * Подписка на сообщения стрима без разрыва постоянного соединения при отписке
 */
export function subscribeGameSocket(onMessage: (message: SocketMessage) => void): () => void {
  return manager.subscribe(onMessage);
}

/**
 * Совместимость с существующим кодом: подписывает слушателя на общий сокет
 */
export function connectGameSocket(onMessage: (message: SocketMessage) => void): () => void {
  return manager.subscribe(onMessage);
}

/**
 * Полное закрытие сокета (например, при logout)
 */
export function disconnectGameSocket(): void {
  manager.disconnect();
}
