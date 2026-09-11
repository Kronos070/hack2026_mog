// Страница достижений: полный список с отметкой полученных

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { AppHeader } from '@/shared/ui/AppHeader';
import { Button } from '@/shared/ui/Button';
import { AchievementBadge } from '@/features/profile/AchievementBadge';

export function AchievementsPage() {
  // Показывает все достижения игры и прогресс игрока
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => api.getProfile() });

  const achievements = data?.achievements ?? [];
  const unlocked = achievements.filter((item) => item.unlockedAt !== null).length;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-[94%] max-w-[1600px] py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h1 className="text-xl font-bold">Достижения</h1>
            <p className="text-sm text-muted">
              {isLoading ? 'Загрузка…' : `Получено ${unlocked} из ${achievements.length}`}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/game')}>
            К игре
          </Button>
        </div>

        {!isLoading && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
