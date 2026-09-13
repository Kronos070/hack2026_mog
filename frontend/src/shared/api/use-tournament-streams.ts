// Фоновое обновление турнира и лидерборда по Server-Sent Events (1 Гц)
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL, USE_MOCK } from '@/shared/api/http';
import { leaderboardEntrySchema, tournamentSchema } from '@/shared/api/contract';

export function useTournamentStreams(): void {
  // Подключает SSE-стримы бэкенда и обновляет кэш TanStack Query без ререндеров
  const queryClient = useQueryClient();

  useEffect(() => {
    if (USE_MOCK) return;

    const base = API_URL.replace(/\/+$/, '');
    let esLeaderboard: EventSource | null = null;
    let esTournament: EventSource | null = null;

    try {
      esLeaderboard = new EventSource(`${base}/tournament/leaderboard/stream`);
      esLeaderboard.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const parsed = leaderboardEntrySchema.array().safeParse(raw);
          if (parsed.success) {
            queryClient.setQueryData(['leaderboard'], parsed.data);
          }
        } catch {
          // Ошибки формата игнорируются, активен fallback на polling
        }
      };

      esTournament = new EventSource(`${base}/tournament/stream`);
      esTournament.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const parsed = tournamentSchema.safeParse(raw);
          if (parsed.success) {
            queryClient.setQueryData(['tournament'], parsed.data);
          }
        } catch {
          // Ошибки формата игнорируются, активен fallback на polling
        }
      };
    } catch {
      // При сбое EventSource работает стандартный HTTP polling
    }

    return () => {
      esLeaderboard?.close();
      esTournament?.close();
    };
  }, [queryClient]);
}
