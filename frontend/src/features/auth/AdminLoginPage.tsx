// Страница входа администратора: логин и регистрация в общем стиле проекта

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { Button } from '@/shared/ui/Button';
import { soundManager } from '@/shared/lib/sound-manager';
import { AuthField } from '@/features/auth/AuthField';

type Mode = 'login' | 'register';

export function AdminLoginPage() {
  // Пускает администратора в панель управления игрой
  const navigate = useNavigate();
  const setUser = useSessionStore((state) => state.setUser);
  const [mode, setMode] = useState<Mode>('login');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (): Promise<void> => {
    if (!login || !password) {
      toast.error('Заполните логин и пароль');
      return;
    }
    setPending(true);
    try {
      const user =
        mode === 'login'
          ? await api.login({ login, password })
          : await api.register({ login, password, username: login, email });
      setUser(user);
      soundManager.play('select', 0.5);
      navigate(user.role === 'admin' ? '/admin/panel' : '/choose');
    } catch {
      toast.error(mode === 'login' ? 'Неверный логин или пароль' : 'Не удалось зарегистрироваться');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="text-center">
        <h1 className="text-[clamp(1.25rem,2.4vw,1.75rem)] font-extrabold uppercase tracking-wide text-on-glass">
          Панель администратора
        </h1>
        <p className="mt-1 text-[clamp(0.75rem,1.2vw,0.9rem)] text-on-glass-dim">
          {mode === 'login' ? 'Вход в систему управления' : 'Создание учётной записи'}
        </p>
      </header>

      <div className="mt-6 space-y-3">
        <AuthField label="Логин" value={login} onChange={setLogin} autoComplete="username" />
        {mode === 'register' && (
          <AuthField label="Email" value={email} onChange={setEmail} type="email" />
        )}
        <AuthField
          label="Пароль"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => void submit()}
        className="btn-gold mt-6 w-full py-[clamp(0.625rem,1.6vw,1rem)] text-[clamp(1rem,1.8vw,1.25rem)] font-extrabold text-sky-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
      </button>

      <div className="mt-4 text-center">
        <Button
          variant="glass"
          className="w-full"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Создать учётную запись' : 'Уже есть аккаунт? Войти'}
        </Button>
      </div>
    </div>
  );
}
