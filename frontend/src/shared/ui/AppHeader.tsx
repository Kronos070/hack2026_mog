// Общий хедер приложения: логотипы, навигация и звук поверх неба

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { useRoundStore } from '@/entities/game/round-store';
import { useSoundStore } from '@/entities/game/sound-store';
import { cn } from '@/shared/lib/cn';

interface AppHeaderProps {
  onOpenRules?: (() => void) | undefined;
}

export function AppHeader({ onOpenRules }: AppHeaderProps) {
  // Показывает навигацию игрового экрана, блокируя переходы во время полёта
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const flying = useRoundStore((state) => state.phase === 'flying');
  const muted = useSoundStore((state) => state.muted);
  const toggleMuted = useSoundStore((state) => state.toggle);
  const [topUpLoading, setTopUpLoading] = useState(false);

  if (!user) return null;

  const handleTopUp = async () => {
    setTopUpLoading(true);
    try {
      const res = await api.topUp(1000);
      toast.success(`Баланс пополнен на ${res.addedAmount.toLocaleString()} бонусов!`);
      const freshUser = await api.getCurrentUser();
      if (freshUser) setUser(freshUser);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось пополнить баланс');
    } finally {
      setTopUpLoading(false);
    }
  };

  const links = [
    { label: 'Профиль', action: () => navigate('/profile') },
    { label: 'Активы', action: () => navigate('/achievements') },
    ...(onOpenRules ? [{ label: 'Правила', action: onOpenRules }] : []),
    { label: 'Рейтинг', action: () => navigate('/leaderboard') },
    ...(user.role === 'admin' ? [{ label: 'Админка', action: () => navigate('/admin') }] : []),
  ];

  return (
    <header className="sticky top-0 z-20">
      <div className="mx-auto flex w-[94%] max-w-[1700px] items-center gap-5 py-4">
        <button
          onClick={() => navigate('/game')}
          disabled={flying}
          className="flex shrink-0 items-center gap-3 disabled:cursor-not-allowed"
        >
          <img src="/images/logo.webp" alt="Воздушный шар" className="-my-2 h-20 w-auto max-w-none object-contain" />
          <img src="/stoloto.svg" alt="Столото" className="hidden h-11 w-auto sm:block" />
        </button>

        {/* Быстрое отображение баланса и пополнение */}
        <div className="hidden items-center gap-2 rounded-full border border-accent/40 bg-sky-deep/50 px-3 py-1.5 text-sm font-bold text-on-glass backdrop-blur-md sm:flex">
          <span className="text-accent">{user.balance.toLocaleString()} бонусов</span>
          <button
            onClick={() => void handleTopUp()}
            disabled={flying || topUpLoading}
            title="Быстрое пополнение баланса (+1000)"
            className="rounded-full bg-accent/25 px-2 py-0.5 text-xs text-accent transition-colors hover:bg-accent/40 disabled:opacity-50"
          >
            +1000
          </button>
        </div>

        <nav className="ml-auto flex items-center gap-7">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={link.action}
              disabled={flying}
              className="hidden text-3xl font-bold text-on-glass drop-shadow-[0_2px_4px_rgb(4_20_40/0.7)] transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 md:block"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              void api.logout();
              setUser(null as unknown as typeof user);
              navigate('/');
            }}
            disabled={flying}
            className="text-3xl font-bold text-accent drop-shadow-[0_2px_4px_rgb(4_20_40/0.7)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Выйти
          </button>
          <button
            onClick={toggleMuted}
            title={muted ? 'Включить звук' : 'Выключить звук'}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            className={cn('text-on-glass transition-colors hover:text-accent')}
          >
            {muted ? <VolumeX size={36} /> : <Volume2 size={36} />}
          </button>
        </nav>
      </div>
    </header>
  );
}
