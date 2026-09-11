// Переключатель светлой и тёмной темы интерфейса
import { useEffect } from 'react';
import { useThemeStore } from '@/entities/game/theme-store';
import { Button } from '@/shared/ui/Button';

export function ThemeToggle({ className }: { className?: string }) {
  // Переключает оформление и держит класс темы на корневом элементе
  const scheme = useThemeStore((state) => state.scheme);
  const toggle = useThemeStore((state) => state.toggle);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', scheme === 'dark');
  }, [scheme]);

  return (
    <Button
      variant="outline"
      onClick={toggle}
      title={scheme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
      aria-label={scheme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
      className={className}
    >
      <span aria-hidden>{scheme === 'light' ? '🌙' : '☀️'}</span>
    </Button>
  );
}
