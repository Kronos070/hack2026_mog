// WebSocket игрового стрима: тики множителя, бустер, cashout и крах

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
}

function socketUrl(): string {
  const base = API_URL.replace(/\/api\/?$/, '');
  const wsBase = base.replace(/^http/, 'ws');
  return `${wsBase}/ws/game?token=${encodeURIComponent(readToken() ?? '')}`;
}

export function connectGameSocket(onMessage: (message: SocketMessage) => void): () => void {
  // Открывает игровой стрим и возвращает функцию отключения
  let socket: WebSocket | null = null;
  let closed = false;

  try {
    socket = new WebSocket(socketUrl());
  } catch {
    return () => undefined;
  }

  socket.addEventListener('message', (event) => {
    try {
      onMessage(JSON.parse(String(event.data)) as SocketMessage);
    } catch {
      // Не-JSON сообщения (например, PONG) игнорируем
    }
  });

  return () => {
    if (closed) return;
    closed = true;
    socket?.close();
  };
}
