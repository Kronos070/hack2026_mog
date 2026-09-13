// Значок достижения: цветной при получении, силуэт при блокировке
import type { Achievement } from '@/shared/api/contract';
import { getAchievementIcon } from '@/shared/config/achievements';
import { cn } from '@/shared/lib/cn';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md';
}

export function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
  // Отображает иконку достижения с подписью и описанием
  const unlocked = achievement.unlockedAt !== null;
  const iconSrc = getAchievementIcon(achievement.id);

  return (
    <div
      title={`${achievement.title} — ${achievement.description}`}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all duration-200',
        unlocked
          ? 'border-accent/70 bg-glass-strong/60 shadow-[0_4px_16px_rgba(245,179,36,0.18)] hover:scale-[1.03] hover:border-accent hover:shadow-[0_6px_22px_rgba(245,179,36,0.28)]'
          : 'border-dashed border-glass-line/35 bg-sky-deep/20 hover:border-glass-line/50',
      )}
    >
      <div className="relative flex items-center justify-center">
        <img
          src={iconSrc}
          alt={achievement.title}
          draggable={false}
          className={cn(
            'object-contain select-none transition-transform duration-200',
            size === 'sm' ? 'size-14 sm:size-16' : 'size-20 sm:size-24',
            unlocked
              ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] group-hover:scale-105'
              : 'grayscale opacity-30 brightness-75 contrast-125',
          )}
        />
        {!unlocked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-sky-deep/85 p-1.5 backdrop-blur-xs border border-glass-line/30 shadow-md">
              <svg
                className="h-3.5 w-3.5 text-on-glass-dim/80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <span
          className={cn(
            'text-sm font-bold tracking-wide',
            unlocked ? 'text-on-glass drop-shadow-xs' : 'text-on-glass-dim/70',
          )}
        >
          {achievement.title}
        </span>
        <span className="mt-0.5 text-xs text-on-glass-dim/75 leading-tight line-clamp-2">
          {achievement.description}
        </span>
      </div>
    </div>
  );
}
