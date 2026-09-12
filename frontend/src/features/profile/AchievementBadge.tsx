// Значок достижения: цветной при получении, серый при блокировке
import type { Achievement } from '@/shared/api/contract';
import { cn } from '@/shared/lib/cn';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md';
}

export function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
  // Отображает букву достижения с подписью
  const unlocked = achievement.unlockedAt !== null;

  return (
    <div
      title={`${achievement.title} — ${achievement.description}`}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-colors',
        unlocked ? 'border-gold/50 bg-gold/5' : 'border-dashed border-line opacity-60',
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold',
          size === 'sm' ? 'size-9 text-base' : 'size-12 text-lg',
          unlocked ? 'bg-gold text-ink' : 'bg-line text-muted',
        )}
      >
        {achievement.letter}
      </span>
      <span className={cn('text-sm font-medium', !unlocked && 'text-muted')}>
        {achievement.title}
      </span>
      <span className="text-xs text-muted">{achievement.description}</span>
    </div>
  );
}
