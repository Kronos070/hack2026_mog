// Базовая кнопка в минималистичном стиле
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'success' | 'outline' | 'ghost' | 'gold' | 'slate' | 'glass';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:opacity-85',
  success: 'bg-green-theme text-paper hover:opacity-90',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-muted hover:text-ink',
  gold: 'bg-linear-to-b from-accent to-accent-dark text-sky-deep shadow-[0_4px_0_var(--c-accent-dark),0_8px_20px_rgb(90_60_0/0.45)] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_var(--c-accent-dark)]',
  slate: 'bg-slate-btn text-on-glass shadow-[0_4px_14px_rgb(5_15_35/0.5)] hover:brightness-125',
  glass: 'glass-tile text-on-glass hover:brightness-125',
};

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  // Единая кнопка с тремя вариантами оформления
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
        'transition-opacity disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
