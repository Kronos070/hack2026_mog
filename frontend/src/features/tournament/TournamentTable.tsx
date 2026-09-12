// Турнирная таблица: места, очки и призовой фонд с таймером до завершения

import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useCountdown } from '@/features/tournament/use-countdown';
import { Link } from 'react-router-dom';
import { Avatar } from '@/shared/ui/Avatar';
import { cn } from '@/shared/lib/cn';

const VISIBLE_PLACES = 8;

export function TournamentTable() {
  // Показывает текущий рейтинг турнира и время до его окончания
  const { data, isLoading } = useQuery({
    queryKey: ['tournament'],
    queryFn: () => api.getTournament(),
    refetchInterval: 5000,
  });

  const remaining = useCountdown(data?.endsAt ?? null);

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border-2 border-line p-5 text-base text-muted">
        Загрузка турнира…
      </div>
    );
  }

  const visible = data.entries.slice(0, VISIBLE_PLACES);
  const current = data.entries.find((entry) => entry.playerId === data.currentPlayerId);
  const currentHidden = current && current.place > VISIBLE_PLACES;

  return (
    <div className="overflow-hidden rounded-lg border-2 border-line">
      <div className="flex items-center justify-between border-b-2 border-line bg-surface px-4 py-3">
        <span className="text-base font-semibold">{data.title}</span>
        <span className="tabular-nums text-sm text-muted">до конца {remaining}</span>
      </div>

      <ul className="divide-y divide-line">
        {visible.map((entry) => (
          <Row key={entry.playerId} entry={entry} isCurrent={entry.playerId === data.currentPlayerId} />
        ))}
      </ul>

      {currentHidden && current && (
        <div className="border-t-2 border-ink">
          <ul>
            <Row entry={current} isCurrent />
          </ul>
        </div>
      )}
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
          'flex items-center gap-3 px-4 py-3 text-base transition-colors hover:bg-ink/5',
          isCurrent && 'bg-ink/5 font-semibold',
          entry.place <= 3 && !isCurrent && 'bg-gold/5',
        )}
      >
      <span
        className={cn(
          'w-7 shrink-0 tabular-nums',
          entry.place <= 3 ? 'font-bold text-gold' : 'text-muted',
        )}
      >
        {entry.place}
      </span>
      <Avatar name={entry.playerName} size="sm" />
      <span className="min-w-0 flex-1 truncate">
        {entry.playerName}
        {isCurrent && <span className="ml-2 text-sm font-normal text-muted">вы</span>}
      </span>
      <span className="shrink-0 tabular-nums text-muted">{entry.points}</span>
      {entry.prize > 0 && (
          <span className="w-20 shrink-0 text-right tabular-nums text-sm text-green-theme">
            +{entry.prize}
          </span>
        )}
      </Link>
    </li>
  );
}
