// Экран выбора роли: временная замена регистрации на этапе прототипа

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { Button } from '@/shared/ui/Button';
import { soundManager } from '@/shared/lib/sound-manager';

const ROLES = [
  { id: 'user', title: 'Тестовый игрок', note: 'Баланс 1000 бонусов, доступ к игре' },
  { id: 'admin', title: 'Администратор', note: 'Доступ к настройкам параметров игры' },
] as const;

export function RolePage() {
  // Выбирает роль и направляет пользователя в игру или в админку
  const navigate = useNavigate();
  const setUser = useSessionStore((state) => state.setUser);

  const handleSelect = async (roleId: string): Promise<void> => {
    try {
      const user = await api.login(roleId);
      setUser(user);
      soundManager.play('select', 0.5);
      navigate(roleId === 'admin' ? '/admin' : '/game');
    } catch {
      toast.error('Не удалось войти');
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-4 py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Воздушный Шар</h1>
        <p className="mt-2 text-sm text-muted">
          Прототип бонусной игры. Выберите режим входа.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => void handleSelect(role.id)}
            className="rounded-lg border border-line p-6 text-left transition-colors hover:border-ink"
          >
            <h2 className="font-semibold">{role.title}</h2>
            <p className="mt-1 text-sm text-muted">{role.note}</p>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        Регистрация и авторизация — заглушка, будут добавлены позже.
      </p>

      <div className="text-center">
        <Button variant="ghost" onClick={() => soundManager.toggleMute()}>
          Переключить звук
        </Button>
      </div>
    </main>
  );
}
