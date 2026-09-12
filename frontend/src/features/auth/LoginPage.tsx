// Экран входа: авторизация по логину и паролю, регистрация и быстрый вход в реальном или демо-режиме

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/shared/api/client';
import { useSessionStore } from '@/entities/game/session-store';
import { Button } from '@/shared/ui/Button';
import { soundManager } from '@/shared/lib/sound-manager';
import { AuthField } from '@/features/auth/AuthField';

type Mode = 'login' | 'register';

export function LoginPage() {
  // Пускает игрока в приложение через реальный бэкенд или мок
  const navigate = useNavigate();
  const setUser = useSessionStore((state) => state.setUser);
  const [mode, setMode] = useState<Mode>('login');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  // Проверка доступности бэкенда
  const { data: pingData, isError: isPingError } = useQuery({
    queryKey: ['ping'],
    queryFn: () => api.ping(),
    retry: 1,
    refetchInterval: 10000,
  });

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
          : await api.register({
              login,
              password,
              username: login,
              email: email.trim() || `${login}@stoloto.ru`,
            });
      setUser(user);
      soundManager.play('select', 0.5);
      navigate(user.role === 'admin' ? '/admin' : '/game');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : mode === 'login' ? 'Неверный логин или пароль' : 'Не удалось зарегистрироваться');
    } finally {
      setPending(false);
    }
  };

  const quickLogin = async (role: 'user' | 'admin'): Promise<void> => {
    setPending(true);
    try {
      if (api.isMock) {
        const user = await api.login({ login: role, password: '' });
        setUser(user);
        navigate(user.role === 'admin' ? '/admin' : '/game');
        return;
      }

      if (role === 'admin') {
        const user = await api.login({ login: 'admin', password: 'admin123' });
        setUser(user);
        navigate('/admin');
      } else {
        // Попытка войти под сидированным пользователем alex_pilot
        try {
          const user = await api.login({ login: 'alex_pilot', password: 'admin123' });
          setUser(user);
          navigate('/game');
        } catch {
          // Если пользователь ещё не создан — зарегистрировать тестового игрока
          try {
            const user = await api.register({
              login: 'player_demo',
              username: 'player_demo',
              email: 'player@stoloto.ru',
              password: 'player123',
            });
            setUser(user);
            navigate('/game');
          } catch {
            const user = await api.login({ login: 'player_demo', password: 'player123' });
            setUser(user);
            navigate('/game');
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось выполнить быстрый вход');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-[94%] max-w-md flex-col justify-center gap-6 py-12">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Воздушный Шар</h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'login' ? 'Вход в игру' : 'Создание аккаунта'}
          {api.isMock ? ' · демо-режим' : ' · Quarkus Backend'}
        </p>

        {/* Индикатор статуса подключения к бэкенду */}
        {!api.isMock && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted/10 px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                pingData ? 'bg-emerald-500 animate-pulse' : isPingError ? 'bg-amber-500' : 'bg-muted'
              }`}
            />
            <span className="text-muted">
              {pingData
                ? 'Сервер онлайн (Java 21 / Quarkus)'
                : isPingError
                  ? 'Сервер не отвечает на :8080'
                  : 'Проверка подключения…'}
            </span>
          </div>
        )}
      </header>

      <div className="space-y-3">
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

      <Button variant="success" disabled={pending} onClick={() => void submit()} className="py-3">
        {pending ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
      </Button>

      <button
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
      </button>

      <div className="border-t border-line pt-4">
        <p className="text-center text-xs text-muted">Быстрый вход для демонстрации</p>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" className="flex-1" disabled={pending} onClick={() => void quickLogin('user')}>
            Игрок
          </Button>
          <Button variant="outline" className="flex-1" disabled={pending} onClick={() => void quickLogin('admin')}>
            Администратор
          </Button>
        </div>
      </div>
    </main>
  );
}
