// Общий хедер приложения: баланс и навигация, закреплён сверху

import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/entities/game/session-store';
import { useRoundStore } from '@/entities/game/round-store';
import { Button } from '@/shared/ui/Button';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

interface AppHeaderProps {
  onOpenRules?: (() => void) | undefined;
}

export function AppHeader({ onOpenRules }: AppHeaderProps) {
  // Показывает баланс и переходы, блокируя их во время полёта
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const flying = useRoundStore((state) => state.phase === 'flying');

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex w-[94%] max-w-[1600px] items-center justify-between gap-3 py-2.5">
        <button
          onClick={() => navigate('/game')}
          disabled={flying}
          className="shrink-0 text-left disabled:cursor-not-allowed"
        >
          <span className="hidden text-xl font-bold sm:block">Воздушный Шар</span>
          <span className="block whitespace-nowrap text-sm text-muted">
            <span className="hidden sm:inline">Баланс: </span>
            <span className="font-semibold text-ink">{user.balance}</span>
            <span className="hidden sm:inline"> бонусов</span>
            <span className="sm:hidden"> Б</span>
          </span>
        </button>

        <nav className="flex shrink-0 gap-1.5">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            title="Профиль"
            aria-label="Профиль"
            className="px-2.5 text-xs sm:px-4 sm:text-sm"
          >
            <span className="xs:hidden" aria-hidden>👤</span>
            <span className="hidden xs:inline">Профиль</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/achievements')}
            title="Достижения"
            aria-label="Достижения"
            className="px-2.5 text-xs sm:px-4 sm:text-sm"
          >
            <span className="xs:hidden" aria-hidden>🏅</span>
            <span className="hidden xs:inline">Ачивки</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/leaderboard')}
            title="Живой рейтинг"
            aria-label="Живой рейтинг"
            className="px-2.5 text-xs sm:px-4 sm:text-sm"
          >
            <span className="xs:hidden" aria-hidden>🏆</span>
            <span className="hidden xs:inline">Рейтинг</span>
          </Button>
          {onOpenRules && (
            <Button
              variant="outline"
              disabled={flying}
              onClick={onOpenRules}
              title="Правила игры"
              aria-label="Правила игры"
              className="px-2.5 text-xs sm:px-4 sm:text-sm"
            >
              <span className="xs:hidden" aria-hidden>📖</span>
              <span className="hidden xs:inline">Правила</span>
            </Button>
          )}
          <ThemeToggle className="px-2.5 text-xs sm:px-3 sm:text-sm" />
          <Button
            variant="ghost"
            disabled={flying}
            onClick={() => navigate('/')}
            className="px-2.5 text-xs sm:px-4 sm:text-sm"
          >
            Выйти
          </Button>
        </nav>
      </div>
    </header>
  );
}
