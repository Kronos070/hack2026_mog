// Профиль игрока: ранг, статистика, полигон характеристик, достижения и коллекция

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { AppHeader } from '@/shared/ui/AppHeader';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { StatCard } from '@/features/profile/StatCard';
import { RankCard } from '@/features/profile/RankCard';
import { PuzzleCollection } from '@/features/profile/PuzzleCollection';
import { AchievementBadge } from '@/features/profile/AchievementBadge';
import { StatRadarCard } from '@/features/profile/StatRadarCard';

export function ProfilePage() {
  // Показывает сводку по игроку — собственную или чужую
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useSessionStore((state) => state.setUser);
  const { playerId } = useParams<{ playerId?: string }>();
  const isOwn = !playerId;

  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile', playerId ?? 'me'],
    queryFn: () => api.getProfile(playerId),
  });

  const handleTopUp = async () => {
    setTopUpLoading(true);
    try {
      const res = await api.topUp(1000, playerId);
      toast.success(`Баланс пополнен на ${res.addedAmount.toLocaleString()} бонусов!`);
      if (isOwn) {
        const freshUser = await api.getCurrentUser();
        if (freshUser) setUser(freshUser);
      }
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось пополнить баланс');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (editUsername.trim() || editEmail.trim()) {
        const updated = await api.updateProfile({
          username: editUsername.trim() || undefined,
          email: editEmail.trim() || undefined,
        });
        setUser(updated);
        toast.success('Профиль обновлен');
      }

      if (oldPassword && newPassword) {
        await api.changePassword({ oldPassword, newPassword });
        toast.success('Пароль успешно изменен');
        setOldPassword('');
        setNewPassword('');
      }

      setEditOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления');
    }
  };

  if (isLoading || !data) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto w-[94%] max-w-[1600px] py-6 text-sm text-muted">
          Загрузка профиля…
        </main>
      </>
    );
  }

  const { user, achievements } = data;
  const winRate = data.roundsPlayed > 0 ? Math.round((data.roundsWon / data.roundsPlayed) * 100) : 0;
  const unlocked = achievements.filter((item) => item.unlockedAt !== null);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-[94%] max-w-[1600px] py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user.name}</h1>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">
                  {user.balance.toLocaleString()} бонусов
                </span>
              </div>
              <p className="text-sm text-muted">
                {data.rank.title}
                {!isOwn && ' · чужой профиль'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={topUpLoading}
              onClick={() => void handleTopUp()}
              className="text-accent border-accent/40 hover:bg-accent/10"
            >
              +1 000 бонусов
            </Button>
            {isOwn && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditUsername(user.name);
                  setEditOpen(true);
                }}
              >
                Редактировать
              </Button>
            )}
            {isOwn && (
              <Button variant="outline" onClick={() => navigate('/achievements')}>
                Все достижения
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(isOwn ? '/game' : '/leaderboard')}>
              {isOwn ? 'К игре' : 'К рейтингу'}
            </Button>
          </div>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <RankCard rank={data.rank} />
          <StatCard label="Игровые очки" value={`${user.points.toLocaleString()}`} note="за все раунды" />
          <StatCard
            label="Сыграно раундов"
            value={`${data.roundsPlayed}`}
            note={`побед: ${winRate}%`}
          />
          <StatCard
            label="Лучший коэффициент"
            value={data.bestMultiplier > 0 ? `x${data.bestMultiplier.toFixed(2)}` : '—'}
            note={`поставлено: ${data.totalWagered.toLocaleString()}`}
          />
        </section>

        {/* Полигон характеристик игрока (шестиугольник Dota 2 style) */}
        <div className="mt-7">
          <StatRadarCard playerId={playerId} />
        </div>

        <section className="mt-7">
          <h2 className="text-sm font-semibold text-muted">
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
      </main>

      {/* Модальное окно редактирования профиля и смены пароля */}
      <Modal open={editOpen} title="Редактировать профиль" onClose={() => setEditOpen(false)}>
        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-muted">Имя пользователя (логин)</label>
            <input
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-ink outline-none focus:border-accent"
              placeholder="Новое имя пользователя"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-ink outline-none focus:border-accent"
              placeholder="new_email@stoloto.ru"
            />
          </div>

          <div className="border-t border-line pt-3">
            <h4 className="text-xs font-semibold text-muted mb-2">Смена пароля (опционально)</h4>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mb-2 w-full rounded-md border border-line bg-card px-3 py-2 text-ink outline-none focus:border-accent"
              placeholder="Текущий пароль"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-line bg-card px-3 py-2 text-ink outline-none focus:border-accent"
              placeholder="Новый пароль (мин. 6 символов)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Отмена
            </Button>
            <Button variant="success" onClick={() => void handleSaveProfile()}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

