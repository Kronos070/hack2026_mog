// Аватар игрока: первая буква имени в круге
import { cn } from '@/shared/lib/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const SIZES: Record<AvatarSize, string> = {
  sm: 'size-8 text-sm',
  md: 'size-10 text-base',
  lg: 'size-14 text-xl',
};

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  // Показывает инициал игрока вместо изображения
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'border border-line bg-surface font-bold uppercase text-ink',
        SIZES[size],
        className,
      )}
    >
      {name.charAt(0)}
    </span>
  );
}
