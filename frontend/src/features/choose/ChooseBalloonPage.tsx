// Экран выбора шара: сравнение тем перед запуском раунда

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Theme } from '@/shared/api/contract';
import { useSessionStore } from '@/entities/game/session-store';
import { AppHeader } from '@/shared/ui/AppHeader';
import { SkyDecor } from '@/features/home/SkyDecor';
import { BonusBadge } from '@/features/choose/BonusBadge';
import { BALLOON_OPTIONS } from '@/features/choose/balloon-options';
import { soundManager } from '@/shared/lib/sound-manager';
import { cn } from '@/shared/lib/cn';

export function ChooseBalloonPage() {
  // Даёт выбрать шар и уводит в игру с выбранной темой
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const storedTheme = useSessionStore((state) => state.theme);
  const setTheme = useSessionStore((state) => state.setTheme);
  const [active, setActive] = useState<Theme>(storedTheme === 'red' ? 'red' : 'green');

  const option = BALLOON_OPTIONS.find((item) => item.theme === active) ?? BALLOON_OPTIONS[0]!;

  const confirm = (): void => {
    setTheme(active);
    soundManager.play('select', 0.5);
    navigate('/game');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-sky-deep bg-[url('/images/home/sky.webp')] bg-cover bg-center">
      <SkyDecor withBirds={false} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />

        <main className="mx-auto grid w-[94%] max-w-[1700px] flex-1 items-start gap-8 pb-[5vh] pt-6 lg:grid-cols-[minmax(0,1fr)_34rem]">
          <section className="flex min-w-0 flex-col gap-6">
            <h1 className="glass-panel w-fit rounded-full px-12 py-4 text-4xl font-extrabold uppercase tracking-wide text-on-glass">
              Выберите шар
            </h1>

            <div className="flex flex-wrap items-end gap-4 sm:gap-8">
              {BALLOON_OPTIONS.map((item) => (
                <button
                  key={item.theme}
                  onClick={() => setActive(item.theme)}
                  aria-pressed={item.theme === active}
                  className={cn(
                    'transition-all duration-300',
                    item.theme === active
                      ? 'w-[min(52vw,620px)] drop-shadow-[0_18px_40px_rgb(10_40_80/0.45)]'
                      : 'w-[min(34vw,400px)] opacity-70 hover:opacity-100',
                  )}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className={cn(
                      'w-full',
                      item.theme === 'green' ? 'anim-balloon-sway' : 'anim-balloon-sway-alt',
                    )}
                  />
                </button>
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <div className="flex justify-end">
              <BonusBadge balance={user?.balance ?? 0} />
            </div>

            <div className="glass-panel flex flex-col gap-7 rounded-3xl p-10">
              <h2 className="text-5xl font-extrabold uppercase leading-tight text-on-glass">
                {option.title}
              </h2>

              <div className="glass-tile flex w-fit items-center gap-3.5 rounded-full px-7 py-3">
                <span className={cn('size-7 shrink-0 rounded-full', option.dotClass)} />
                <span className="whitespace-nowrap text-xl font-semibold text-on-glass">
                  {option.colorName} · {option.levels} уровней
                </span>
              </div>

              <div className="flex flex-col gap-4 text-xl leading-relaxed text-on-glass">
                {option.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <button
                onClick={confirm}
                className="mt-3 flex items-center justify-center gap-3 rounded-full bg-linear-to-b from-accent to-accent-dark py-6 text-3xl font-extrabold text-sky-deep transition-transform hover:brightness-110 active:translate-y-0.5"
              >
                Выбрать
                <ArrowRight size={32} strokeWidth={3} />
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
