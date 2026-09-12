// Панель итогов раунда: показывается на игровом экране без перехода на другую страницу

import { useEffect, useState } from 'react';
import type { RoundResult } from '@/shared/api/contract';
import { Button } from '@/shared/ui/Button';
import { RESULT_AUTO_EXIT_MS } from '@/shared/config/default-config';

interface ResultPanelProps {
  result: RoundResult;
  onPlayAgain: () => void;
}

export function ResultPanel({ result, onPlayAgain }: ResultPanelProps) {
  // Подводит итоги и сама возвращает экран к выбору ставки по таймауту
  const [seconds, setSeconds] = useState(RESULT_AUTO_EXIT_MS / 1000);
  const won = result.payout > 0;

  useEffect(() => {
    const interval = setInterval(() => setSeconds((value) => value - 1), 1000);
    const timeout = setTimeout(onPlayAgain, RESULT_AUTO_EXIT_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onPlayAgain]);

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <h2 className="text-2xl font-bold">
          {won ? `Выигрыш ${result.payout} бонусов` : 'Ставка сгорела'}
        </h2>
        <p className="mt-1 text-sm text-on-glass-dim">
          {won
            ? `Забрано на x${result.cashoutMultiplier?.toFixed(2)} · крах на x${result.crashMultiplier.toFixed(2)}`
            : `Шар лопнул на x${result.crashMultiplier.toFixed(2)}`}
        </p>
      </header>

      <dl className="glass-tile divide-y divide-glass-line/40 rounded-xl">
        <Row label="Заработано очков" value={String(result.pointsEarned)} />
        <Row label="Пройдено уровней" value={String(result.levelsPassed)} />
        <Row label="Бустер" value={result.boosterActivated ? 'Активирован' : 'Не сработал'} />
        <Row
          label="Награда"
          value={`${result.reward.label} (${result.reward.collected}/${result.reward.total})`}
        />
        <Row label="Баланс" value={`${result.balance} бонусов`} />
      </dl>

      <div className="flex flex-col gap-2">
        <Button variant="gold" className="flex-1 rounded-full py-3 font-bold" onClick={onPlayAgain}>
          Играть снова
        </Button>
      </div>

      <p className="text-center text-xs text-on-glass-dim">
        Автовозврат к ставке через {Math.max(seconds, 0)} с
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <dt className="text-on-glass-dim">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
