// Единый игровой экран: ставка, полёт и итоги без перехода между страницами

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { BoosterTier } from '@/shared/api/contract';
import { buildLevelMultipliers } from '@/shared/lib/crash-math';
import { DEFAULT_CONFIG } from '@/shared/config/default-config';
import { useSessionStore } from '@/entities/game/session-store';
import { useRoundController } from '@/features/flight/use-round-controller';
import { GameLayout } from '@/shared/ui/GameLayout';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { Modal } from '@/shared/ui/Modal';
import { HistoryList } from '@/features/history/HistoryList';
import { CrashHistory } from '@/features/history/CrashHistory';
import { TournamentTable } from '@/features/tournament/TournamentTable';
import { RulesContent } from '@/features/bet/RulesContent';
import { BalanceCard } from '@/features/bet/BalanceCard';
import { BetPanel } from '@/features/bet/BetPanel';
import { ActionBar } from '@/features/bet/ActionBar';
import { FlightOverlay } from '@/features/flight/FlightOverlay';
import { ResultPanel } from '@/features/results/ResultPanel';

export function GamePage() {
  // Управляет всеми фазами раунда в пределах одного экрана
  const { user, theme, betCost, boosterTier, lastBet, setBet, rememberBet } = useSessionStore();
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
      asideLeft={
        <>
          <GlassPanel
            title="История игр"
            align="center"
            className="flex min-h-0 flex-1 flex-col"
            bodyClassName="no-scrollbar min-h-0 flex-1 overflow-y-auto"
          >
            <HistoryList entries={history} />
          </GlassPanel>

          <GlassPanel
            title="Турнирная таблица"
            align="center"
            className="flex min-h-0 flex-1 flex-col"
            bodyClassName="no-scrollbar min-h-0 flex-1 overflow-y-auto"
          >
            <TournamentTable />
          </GlassPanel>
        </>
      }
      asideRight={
        <>
          <BalanceCard balance={balance} />

          <BetPanel
            betCost={betCost}
            boosterTier={boosterTier}
            balance={balance}
            multipliers={multipliers}
            locked={flying}
            onBetChange={setBet}
          />

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
        </>
      }
    >
      <Modal open={rulesOpen} title="Правила игры" onClose={() => setRulesOpen(false)}>
        <RulesContent />
      </Modal>

      {phase === 'finished' && result && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-sky-deep/60 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 text-on-glass">
            <ResultPanel result={result} onPlayAgain={controller.playAgain} />
          </div>
        </div>
      )}
    </GameLayout>
  );
}
