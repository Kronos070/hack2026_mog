// Единый игровой экран: ставка, полёт и итоги без перехода между страницами

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { LEVELS_BY_THEME, type BoosterTier } from '@/shared/api/contract';
import { buildLevelMultipliers } from '@/shared/lib/crash-math';
import { DEFAULT_CONFIG } from '@/shared/config/default-config';
import { useSessionStore } from '@/entities/game/session-store';
import { useRoundController } from '@/features/flight/use-round-controller';
import { GameLayout } from '@/shared/ui/GameLayout';
import { Modal } from '@/shared/ui/Modal';
import { HistoryList } from '@/features/history/HistoryList';
import { CrashHistory } from '@/features/history/CrashHistory';
import { TournamentTable } from '@/features/tournament/TournamentTable';
import { RulesContent } from '@/features/bet/RulesContent';
import { BetPanel } from '@/features/bet/BetPanel';
import { ActionBar } from '@/features/bet/ActionBar';
import { FlightOverlay } from '@/features/flight/FlightOverlay';
import { ResultPanel } from '@/features/results/ResultPanel';

export function GamePage() {
  // Управляет всеми фазами раунда в пределах одного экрана
  const { user, theme, betCost, boosterTier, lastBet, setTheme, setBet, rememberBet } =
    useSessionStore();
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

  const startRound = (cost: number, tier: BoosterTier): void => {
    rememberBet(cost, tier);
    void controller.start(theme, cost, tier);
  };

  const levels = useMemo(
    () => buildLevelMultipliers(theme, config ?? DEFAULT_CONFIG),
    [theme, config],
  );

  return (
    <GameLayout
      onOpenRules={() => setRulesOpen(true)}
      round={round}
      levels={levels}
      theme={round?.theme ?? theme}
      getSnapshot={flying ? getSnapshot : undefined}
      sceneOverlay={
        flying && round ? (
          <FlightOverlay
            round={round}
            getSnapshot={getSnapshot}
            boosterHit={controller.boosterHit}
          />
        ) : null
      }
      stickyBelow={<CrashHistory entries={history} />}
      scenePanel={
        <p className="border-t border-line px-3 py-2 text-center text-xs text-muted">
          {flying && `Полёт · ${round?.levelCount ?? 0} уровней`}
          {phase === 'finished' && `Раунд завершён · крах на x${result?.crashMultiplier.toFixed(2) ?? '—'}`}
          {phase === 'idle' && `${LEVELS_BY_THEME[theme]} уровней · шар ждёт запуска`}
        </p>
      }
    >
      <div className="mt-6">
        <BetPanel
          theme={theme}
          betCost={betCost}
          boosterTier={boosterTier}
          balance={balance}
          multipliers={multipliers}
          locked={flying}
          onThemeChange={setTheme}
          onBetChange={setBet}
        />
      </div>

      <div className="mt-6">
        <ActionBar
          flying={flying}
          starting={controller.starting}
          canStart={betCost >= 1 && betCost <= balance}
          canCashout={controller.canCashout}
          cashedOut={controller.cashedOut}
          hasLastBet={lastBet !== null}
          onStart={() => startRound(betCost, boosterTier)}
          onCashout={() => void controller.cashout()}
          onRepeat={() => {
            if (!lastBet) return;
            setBet(lastBet.cost, lastBet.tier);
            startRound(lastBet.cost, lastBet.tier);
          }}
          onExpress={() => {
            const cost = betCost >= 1 ? betCost : Math.min(25, balance);
            setBet(cost, boosterTier);
            startRound(cost, boosterTier);
          }}
        />
      </div>

      {phase === 'finished' && result && (
        <div className="mt-6">
          <ResultPanel result={result} onPlayAgain={controller.playAgain} />
        </div>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold text-muted">История игр</h2>
          <HistoryList entries={history} />
        </section>
        <section>
          <h2 className="text-sm font-semibold text-muted">Турнирная таблица</h2>
          <div className="mt-2">
            <TournamentTable />
          </div>
        </section>
      </div>

      <Modal open={rulesOpen} title="Правила игры" onClose={() => setRulesOpen(false)}>
        <RulesContent />
      </Modal>
    </GameLayout>
  );
}
