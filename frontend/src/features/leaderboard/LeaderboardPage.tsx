// Страница живого рейтинга: очки участников турнира с обновлением в реальном времени

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { Button } from '@/shared/ui/Button';
import { SkyLayout } from '@/shared/ui/SkyLayout';
import { Avatar } from '@/shared/ui/Avatar';
import { cn } from '@/shared/lib/cn';

const POLL_INTERVAL_MS = 1000;

export function LeaderboardPage() {
  // Показывает участников турнира, опрашивая сервер раз в секунду
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.getLeaderboard(),
    refetchInterval: POLL_INTERVAL_MS,
  });

  return (
    <SkyLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-line/40 pb-4">
        <div>
          <h1 className="text-xl font-bold">Живой рейтинг</h1>
          <p className="text-sm text-on-glass-dim">Обновляется каждую секунду</p>
        </div>
        <Button variant="glass" onClick={() => navigate('/game')}>
          К игре
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-on-glass-dim">Загрузка рейтинга…</p>
      ) : (
        <ol className="mt-6 divide-y divide-line overflow-hidden rounded-lg border-2 border-glass-line/40">
          {entries.map((entry, index) => {
            const isCurrent = entry.playerId === user?.id;
            return (
              <li key={entry.playerId}>
                <button
                  onClick={() => navigate(isCurrent ? '/profile' : `/profile/${entry.playerId}`)}
                  className={cn(
                    'flex w-full items-center gap-4 px-4 py-3.5 text-left text-base transition-colors hover:bg-white/10',
                    isCurrent && 'bg-white/10 font-semibold',
                  )}
                >
                  <span className="w-9 shrink-0 tabular-nums text-on-glass-dim">{index + 1}</span>
                  <Avatar name={entry.playerName} size="sm" />
                  <span className="min-w-0 flex-1 truncate">
                    {entry.playerName}
                    {isCurrent && <span className="ml-2 text-sm text-on-glass-dim">вы</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{entry.points} очков</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {entries.length === 0 && !isLoading && (
        <p className="mt-6 rounded-lg border-2 border-dashed border-glass-line/40 p-5 text-base text-on-glass-dim">
          Пока нет участников
        </p>
      )}
    </SkyLayout>
  );
}
