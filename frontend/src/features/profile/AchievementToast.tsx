// Уведомление о новых достижениях: появляется сверху по центру
import { useEffect } from 'react';
import { useAchievementStore } from '@/entities/game/achievement-store';
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
            'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg',
            'border-2 border-gold bg-paper p-3 text-left shadow-lg',
            'animate-[achievement-in_0.35s_ease-out_both]',
          )}
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-lg font-bold text-ink">
            {achievement.letter}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-gold">Достижение получено</span>
            <span className="block truncate font-semibold">{achievement.title}</span>
            <span className="block truncate text-xs text-muted">{achievement.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
