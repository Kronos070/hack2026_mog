// Базовая кнопка в минималистичном стиле
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:opacity-85',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-muted hover:text-ink',
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
