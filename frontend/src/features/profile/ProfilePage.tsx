// Профиль игрока: ранг, статистика, достижения и коллекция

import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { StatCard } from '@/features/profile/StatCard';
import { RankCard } from '@/features/profile/RankCard';
import { PuzzleCollection } from '@/features/profile/PuzzleCollection';
import { AchievementBadge } from '@/features/profile/AchievementBadge';

export function ProfilePage() {
  // Показывает сводку по игроку — собственную или чужую
  const navigate = useNavigate();
  const { playerId } = useParams<{ playerId?: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', playerId ?? 'me'],
    queryFn: () => api.getProfile(playerId),
  });

  if (isLoading || !data) {
    return (
      <p className="text-sm text-on-glass-dim">Загрузка профиля…</p>
    );
  }

  const { user, achievements } = data;
  const winRate = data.roundsPlayed > 0 ? Math.round((data.roundsWon / data.roundsPlayed) * 100) : 0;
  const unlocked = achievements.filter((item) => item.unlockedAt !== null);
  const isOwn = !playerId;

  return (
    <>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-line/40 pb-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-on-glass-dim">
                {data.rank.title}
                {!isOwn && ' · чужой профиль'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwn && (
              <Button variant="glass" onClick={() => navigate('/achievements')}>
                Все достижения
              </Button>
            )}
            <Button variant="glass" onClick={() => navigate(isOwn ? '/game' : '/leaderboard')}>
              {isOwn ? 'К игре' : 'К рейтингу'}
            </Button>
          </div>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RankCard rank={data.rank} />
          <StatCard label="Игровые очки" value={`${user.points}`} note="за все раунды" />
          <StatCard
            label="Сыграно раундов"
            value={`${data.roundsPlayed}`}
            note={`побед: ${winRate}%`}
          />
          <StatCard
            label="Лучший коэффициент"
            value={data.bestMultiplier > 0 ? `x${data.bestMultiplier.toFixed(2)}` : '—'}
            note={`поставлено: ${data.totalWagered}`}
          />
        </section>

        <section className="mt-7">
          <h2 className="text-sm font-semibold text-on-glass-dim">
            Достижения · {unlocked.length} из {achievements.length}
          </h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {achievements.slice(0, 5).map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} size="sm" />
            ))}
          </div>
        </section>

        <div className="mt-7">
          <PuzzleCollection puzzle={data.puzzle} total={data.puzzleTotal} />
        </div>
    </>
  );
}
