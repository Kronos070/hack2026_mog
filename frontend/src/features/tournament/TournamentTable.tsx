// Турнирная таблица: места, очки и призовой фонд с таймером до завершения

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/shared/api/client';
import { useCountdown } from '@/features/tournament/use-countdown';
import { useTournamentStreams } from '@/features/tournament/use-tournament-streams';
import { Avatar } from '@/shared/ui/Avatar';
import { cn } from '@/shared/lib/cn';

const VISIBLE_PLACES = 10;

const PLACE_COLORS: Readonly<Record<number, string>> = {
  1: 'text-accent',
  2: 'text-on-glass',
  3: 'text-red-theme',
};

export function TournamentTable() {
  // Показывает текущий рейтинг турнира и время до его окончания (обновление по SSE)
  useTournamentStreams();

  const { data, isLoading } = useQuery({
    queryKey: ['tournament'],
    queryFn: () => api.getTournament(),
    refetchInterval: 5000,
  });

  const remaining = useCountdown(data?.endsAt ?? null);

  if (isLoading || !data) {
    return <p className="py-3 text-center text-sm text-on-glass-dim">Загрузка турнира…</p>;
  }

  const visible = data.entries.slice(0, VISIBLE_PLACES);
  const current = data.entries.find((entry) => entry.playerId === data.currentPlayerId);
  const currentHidden = current && current.place > VISIBLE_PLACES;

  return (
    <div>
      <p className="mb-3 text-center text-xs text-on-glass-dim">до конца {remaining}</p>
      <ul className="grid gap-2.5">
        {visible.map((entry) => (
          <Row
            key={entry.playerId}
            entry={entry}
            isCurrent={entry.playerId === data.currentPlayerId}
          />
        ))}
        {currentHidden && current && <Row entry={current} isCurrent />}
      </ul>
    </div>
  );
}

function Row({
  entry,
  isCurrent,
}: {
  entry: { place: number; playerId: string; playerName: string; points: number; prize: number };
  isCurrent: boolean;
}) {
  return (
    <li>
      <Link
        to={isCurrent ? '/profile' : `/profile/${entry.playerId}`}
        className={cn(
          'glass-tile flex items-center gap-2.5 rounded-sm px-3 py-3 text-base transition-all hover:brightness-125',
          isCurrent && 'ring-1 ring-accent/60',
        )}
      >
        <span
          className={cn(
            'w-4 shrink-0 font-bold tabular-nums',
            PLACE_COLORS[entry.place] ?? 'text-on-glass-dim',
          )}
        >
          {entry.place}
        </span>
        <Avatar name={entry.playerName} size="sm" />
        <span className="min-w-0 flex-1 truncate text-on-glass">{entry.playerName}</span>
        <span className="shrink-0 text-base font-bold tabular-nums text-accent">{entry.points}</span>
        {entry.prize > 0 && (
          <span className="shrink-0 text-base font-semibold tabular-nums text-pick">
            +{entry.prize}
          </span>
        )}
      </Link>
    </li>
  );
}
