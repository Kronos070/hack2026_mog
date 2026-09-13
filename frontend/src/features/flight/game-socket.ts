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
  if (API_URL.startsWith('/')) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const base = API_URL.replace(/\/api\/?$/, '');
    return `${proto}//${window.location.host}${base}/ws/game?token=${encodeURIComponent(readToken() ?? '')}`;
  }
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
