// Выпадающее меню навигации для узких экранов

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavLink {
  label: string;
  action: () => void;
}

interface MobileNavProps {
  links: readonly NavLink[];
  disabled: boolean;
}

export function MobileNav({ links, disabled }: MobileNavProps) {
  // Прячет пункты навигации под кнопку, когда они не помещаются в строку
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);

  return (
    <div className="relative lg:hidden">
      <button
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={open}
        className="flex items-center text-on-glass transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {open ? <X className="size-[clamp(1.5rem,5vw,2.25rem)]" /> : <Menu className="size-[clamp(1.5rem,5vw,2.25rem)]" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <nav className="glass-panel absolute right-0 top-[calc(100%+0.5rem)] z-20 flex min-w-[10rem] flex-col overflow-hidden rounded-2xl">
            {links.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  setOpen(false);
                  link.action();
                }}
                className="px-5 py-3 text-left text-base font-bold whitespace-nowrap text-on-glass transition-colors hover:bg-white/10 hover:text-accent"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
