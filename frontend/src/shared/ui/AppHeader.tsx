// Общий хедер приложения: логотипы, навигация и звук поверх неба

import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { useSessionStore } from '@/entities/game/session-store';
import { useRoundStore } from '@/entities/game/round-store';
import { useSoundStore } from '@/entities/game/sound-store';
import { cn } from '@/shared/lib/cn';
import { MobileNav } from '@/shared/ui/MobileNav';

export function AppHeader() {
  // Показывает навигацию игрового экрана, блокируя переходы во время полёта
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const flying = useRoundStore((state) => state.phase === 'flying');
  const muted = useSoundStore((state) => state.muted);
  const toggleMuted = useSoundStore((state) => state.toggle);

  const logout = (): void => {
    setUser(null);
    navigate('/');
  };

  const links = [
    { label: 'Профиль', action: () => navigate('/profile') },
    { label: 'Активы', action: () => navigate('/achievements') },
    { label: 'Правила', action: () => navigate('/rules') },
    { label: 'Рейтинг', action: () => navigate('/leaderboard') },
  ];

  return (
    <header className="sticky top-0 z-20">
      <div className="mx-auto flex w-[94%] max-w-[1700px] items-center gap-[clamp(0.5rem,2vw,1.25rem)] py-[clamp(0.5rem,1.5vw,1rem)]">
        <button
          onClick={() => navigate('/game')}
          disabled={flying}
          className="flex shrink-0 items-center gap-3 disabled:cursor-not-allowed"
        >
          <img src="/images/logo.webp" alt="Воздушный шар" width={512} height={508} className="-my-[clamp(1rem,4vw,3rem)] h-[clamp(3.5rem,9vw,9.75rem)] w-auto max-w-none" />
          <img src="/stoloto.svg" alt="Столото" width={254} height={51} className="hidden h-[clamp(1.75rem,3vw,2.75rem)] w-auto sm:block" />
        </button>

        <nav className="ml-auto flex min-w-0 items-center gap-[clamp(0.625rem,1.8vw,1.75rem)]">
          {user &&
            links.map((link) => (
              <button
                key={link.label}
                onClick={link.action}
                disabled={flying}
                className="hidden shrink-0 text-[clamp(0.9rem,1.5vw,1.875rem)] font-bold whitespace-nowrap text-on-glass drop-shadow-[0_2px_4px_rgb(4_20_40/0.7)] transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 lg:block"
              >
                {link.label}
              </button>
            ))}
          {user && (
            <button
              onClick={logout}
              disabled={flying}
              className="hidden shrink-0 text-[clamp(0.9rem,1.5vw,1.875rem)] font-bold whitespace-nowrap text-accent drop-shadow-[0_2px_4px_rgb(4_20_40/0.7)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 lg:block"
            >
              Выйти
            </button>
          )}
          <button
            onClick={(event) => {
              toggleMuted();
              event.currentTarget.blur();
            }}
            title={muted ? 'Включить звук' : 'Выключить звук'}
            aria-label={muted ? 'Включить звук' : 'Выключить звук'}
            className={cn(
              'shrink-0 transition-colors hover:text-accent focus:outline-none',
              muted ? 'text-accent' : 'text-on-glass',
            )}
          >
            {muted ? (
              <VolumeX className="size-[clamp(1.5rem,4vw,2.25rem)]" />
            ) : (
              <Volume2 className="size-[clamp(1.5rem,4vw,2.25rem)]" />
            )}
          </button>

          {user && (
            <MobileNav
              links={[...links, { label: 'Выйти', action: logout }]}
              disabled={flying}
            />
          )}
        </nav>
      </div>
    </header>
  );
}
