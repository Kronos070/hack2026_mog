// SSE-стриминг турнирной таблицы и живого рейтинга в реальном времени (1 Гц)
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL, USE_MOCK } from '@/shared/api/http';
import type { LeaderboardEntry, Tournament } from '@/shared/api/contract';

export function useTournamentStreams(): void {
  // Подключается к Server-Sent Events потокам бэкенда и обновляет кэш TanStack Query
  const queryClient = useQueryClient();

  useEffect(() => {
    if (USE_MOCK || typeof window === 'undefined' || !window.EventSource) {
      return undefined;
    }

    const base = API_URL.replace(/\/api\/?$/, '');

    // 1. Стрим живого рейтинга (Leaderboard, 1 Гц)
    let esLeaderboard: EventSource | null = null;
    try {
      esLeaderboard = new EventSource(`${base}/api/tournament/leaderboard/stream`);
      esLeaderboard.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as LeaderboardEntry[];
          queryClient.setQueryData(['leaderboard'], data);
        } catch {
          // Игнорируем невалидные события
        }
      };
      esLeaderboard.onerror = () => {
        // Браузер выполнит автоматический реконнект
      };
    } catch {
      // Игнорируем сбои создания SSE
    }

    // 2. Стрим полной турнирной таблицы (Tournament, 1 Гц)
    let esTournament: EventSource | null = null;
    try {
      esTournament = new EventSource(`${base}/api/tournament/stream`);
      esTournament.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as Tournament;
          queryClient.setQueryData(['tournament'], data);
        } catch {
          // Игнорируем невалидные события
        }
      };
      esTournament.onerror = () => {
        // Браузер выполнит автоматический реконнект
      };
    } catch {
      // Игнорируем сбои создания SSE
    }

    return () => {
      esLeaderboard?.close();
      esTournament?.close();
    };
  }, [queryClient]);
}
