// Обратный отсчёт до заданного момента времени
import { useEffect, useState } from 'react';

export function useCountdown(endsAt: number | null): string {
  // Возвращает оставшееся время в формате ч:мм:сс
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (endsAt === null) return '—';

  const left = Math.max(endsAt - now, 0);
  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);

  return `${hours}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}
