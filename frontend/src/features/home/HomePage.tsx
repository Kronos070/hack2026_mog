// Стартовый экран: титульный логотип, кнопка запуска и анимированное небо

import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/entities/game/session-store';
import { AppHeader } from '@/shared/ui/AppHeader';
import { SkyDecor } from '@/features/home/SkyDecor';
import { soundManager } from '@/shared/lib/sound-manager';

export function HomePage() {
  // Встречает игрока и ведёт в игру одним нажатием
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);

  const start = (): void => {
    soundManager.play('select', 0.5);
    navigate(user ? '/choose' : '/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-deep bg-[url('/images/home/sky.webp')] bg-cover bg-center">
      <SkyDecor />

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />

        <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 pb-[8vh]">
          <img
            src="/images/home/balloon.webp"
            alt="Воздушный шар"
            className="w-[min(82vw,620px)] drop-shadow-[0_18px_40px_rgb(10_40_80/0.45)]"
          />

          <button
            onClick={start}
            className="rounded-full bg-linear-to-b from-accent to-accent-dark px-20 py-5 text-3xl font-extrabold text-sky-deep transition-transform hover:brightness-110 active:translate-y-0.5"
          >
            Играть!
          </button>
        </main>
      </div>
    </div>
  );
}
