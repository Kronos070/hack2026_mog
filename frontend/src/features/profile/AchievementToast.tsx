// Уведомление о новых достижениях: появляется сверху по центру
import { useEffect } from 'react';
import { useAchievementStore } from '@/entities/game/achievement-store';
import { getAchievementIcon } from '@/shared/config/achievements';
import { cn } from '@/shared/lib/cn';

const VISIBLE_MS = 7000;

export function AchievementToast() {
  // Показывает все полученные достижения и сам скрывается по таймеру
  const queue = useAchievementStore((state) => state.queue);
  const clear = useAchievementStore((state) => state.clear);

  useEffect(() => {
    if (queue.length === 0) return undefined;
    const timer = setTimeout(clear, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [queue, clear]);

  if (queue.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
      {queue.map((achievement, index) => (
        <button
          key={achievement.id}
          onClick={clear}
          style={{ animationDelay: `${index * 90}ms` }}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl',
            'border-2 border-accent/80 bg-sky-deep/90 backdrop-blur-md p-3 text-left shadow-[0_8px_25px_rgba(0,0,0,0.4)]',
            'animate-[achievement-in_0.35s_ease-out_both]',
          )}
        >
          <img
            src={getAchievementIcon(achievement.id)}
            alt={achievement.title}
            draggable={false}
            className="size-12 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] select-none"
          />
          <span className="min-w-0">
            <span className="block text-xs font-bold text-accent tracking-wide uppercase">
              Достижение получено!
            </span>
            <span className="block truncate font-bold text-on-glass">{achievement.title}</span>
            <span className="block truncate text-xs text-on-glass-dim/80">{achievement.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
