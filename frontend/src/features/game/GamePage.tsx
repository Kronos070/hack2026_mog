// Единый игровой экран: ставка, полёт и итоги без перехода между страницами

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { LEVELS_BY_THEME } from '@/shared/api/contract';
import { buildLevelMultipliers } from '@/shared/lib/crash-math';
import { DEFAULT_CONFIG } from '@/shared/config/default-config';
import { useSessionStore } from '@/entities/game/session-store';
import { useRoundController } from '@/features/flight/use-round-controller';
import { GameLayout } from '@/shared/ui/GameLayout';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Placeholder } from '@/shared/ui/Placeholder';
import { HistoryList } from '@/features/history/HistoryList';
import { RulesContent } from '@/features/bet/RulesContent';
import { BetPanel } from '@/features/bet/BetPanel';
import { FlightOverlay } from '@/features/flight/FlightOverlay';
import { ResultPanel } from '@/features/results/ResultPanel';

export function GamePage() {
  // Управляет всеми фазами раунда в пределах одного экрана
  const navigate = useNavigate();
  const { user, theme, betCost, boosterTier, setTheme, setBet } = useSessionStore();
  const [rulesOpen, setRulesOpen] = useState(false);

  const controller = useRoundController();
  const { phase, round, result, config, getSnapshot } = controller;

  const { data: history = [] } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
  });

  const balance = user?.balance ?? 0;
  const multipliers = config?.boosterTierValues ?? [1, 2, 3, 4];
  const flying = phase === 'flying';

  const levels = useMemo(
    () => buildLevelMultipliers(theme, config ?? DEFAULT_CONFIG),
    [theme, config],
  );

  return (
    <GameLayout
      round={round}
      levels={levels}
      theme={round?.theme ?? theme}
      getSnapshot={flying ? getSnapshot : undefined}
      sceneOverlay={
        flying && round ? (
          <FlightOverlay
            round={round}
            getSnapshot={getSnapshot}
            canCashout={controller.canCashout}
            cashedOut={controller.cashedOut}
            boosterHit={controller.boosterHit}
            onCashout={() => void controller.cashout()}
          />
        ) : null
      }
      scenePanel={
        <p className="border-t border-line px-3 py-2 text-center text-xs text-muted">
          {flying && `Полёт · ${round?.levelCount ?? 0} уровней`}
          {phase === 'finished' && `Раунд завершён · крах на x${result?.crashMultiplier.toFixed(2) ?? '—'}`}
          {phase === 'idle' && `${LEVELS_BY_THEME[theme]} уровней · шар ждёт запуска`}
        </p>
      }
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold">Воздушный Шар</h1>
          <p className="text-sm text-muted">
            Баланс: <span className="font-semibold text-ink">{balance}</span> бонусов
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={flying} onClick={() => setRulesOpen(true)}>
            Правила
          </Button>
          <Button variant="ghost" disabled={flying} onClick={() => navigate('/')}>
            Сменить роль
          </Button>
        </div>
      </header>

      {phase === 'finished' && result ? (
        <div className="mt-6">
          <ResultPanel result={result} onPlayAgain={controller.playAgain} />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <Placeholder title="Живой рейтинг" note="Заглушка — дополнительная возможность" />
          </div>

          <div className="mt-6">
            <BetPanel
              theme={theme}
              betCost={betCost}
              boosterTier={boosterTier}
              balance={balance}
              multipliers={multipliers}
              locked={flying}
              starting={controller.starting}
              onThemeChange={setTheme}
              onBetChange={setBet}
              onStart={() => void controller.start(theme, betCost, boosterTier)}
            />
          </div>
        </>
      )}

      <section className="mt-7">
        <h2 className="text-sm font-semibold text-muted">История игр</h2>
        <HistoryList entries={history} />
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Placeholder title="Турнирная таблица" note="Заглушка — дополнительная возможность" />
        <Placeholder title="Экран выбора темы" note="Заглушка — дополнительная возможность" />
      </div>

      <Modal open={rulesOpen} title="Правила игры" onClose={() => setRulesOpen(false)}>
        <RulesContent />
      </Modal>
    </GameLayout>
  );
}
