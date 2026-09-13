// Единый игровой экран: ставка, полёт и итоги без перехода между страницами

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { BoosterTier } from '@/shared/api/contract';
import { buildLevelMultipliers } from '@/shared/lib/crash-math';
import { useSnapRows } from '@/shared/lib/use-snap-rows';
import { DEFAULT_CONFIG } from '@/shared/config/default-config';
import { useSessionStore } from '@/entities/game/session-store';
import { useRoundController } from '@/features/flight/use-round-controller';
import { GameLayout } from '@/shared/ui/GameLayout';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { HistoryList } from '@/features/history/HistoryList';
import { CrashHistory } from '@/features/history/CrashHistory';
import { TournamentTable } from '@/features/tournament/TournamentTable';
import { BalanceCard } from '@/features/bet/BalanceCard';
import { BetPanel } from '@/features/bet/BetPanel';
import { ActionBar } from '@/features/bet/ActionBar';
import { FlightOverlay } from '@/features/flight/FlightOverlay';
import { ResultModal } from '@/features/results/ResultModal';

export function GamePage() {
  const {
    user,
    theme,
    betCost,
    boosterTier,
    lastBet,
    autoCashout2x,
    setBet,
    rememberBet,
    toggleAutoCashout2x,
  } = useSessionStore();
  const historyRef = useSnapRows<HTMLDivElement>();

  const controller = useRoundController();
  const { phase, round, result, config, getSnapshot } = controller;

  const { data: allHistory = [] } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.getHistory(),
    refetchInterval: 3000,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });
  const fragmentBalance = profile?.puzzle?.length ?? 6;
  const totalFragments = profile?.puzzleTotal ?? 10;

  const { data: boosterPricing = [] } = useQuery({
    queryKey: ['booster-pricing'],
    queryFn: () => api.getBoosterPricing(),
  });

  const boosterCosts = useMemo(() => {
    if (boosterPricing.length === 4) {
      return boosterPricing.map((p) => p.costFragments);
    }
    return config?.boosterCostFragments ?? [0, 2, 4, 6];
  }, [boosterPricing, config]);

  const selectedBoosterCost = boosterCosts[boosterTier - 1] ?? 0;
  const hasEnoughFragments = fragmentBalance >= selectedBoosterCost;

  // Запись появляется только когда раунд действительно завершён
  const history = useMemo(
    () =>
      allHistory.filter((entry) =>
        phase === 'flying' && round ? entry.roundId !== round.roundId : true,
      ),
    [allHistory, round, phase],
  );

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
            className="flex flex-col lg:min-h-0 lg:flex-1"
            bodyRef={historyRef}
            bodyClassName="no-scrollbar max-h-[45vh] snap-y snap-mandatory overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1"
          >
            <HistoryList entries={history} />
          </GlassPanel>

          <GlassPanel
            title="Турнирная таблица"
            align="center"
            className="flex flex-col lg:min-h-0 lg:flex-1"
            bodyClassName="no-scrollbar max-h-[45vh] overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1"
          >
            <TournamentTable />
          </GlassPanel>
        </>
      }
      asideRight={
        <>
          <div className="grid gap-[clamp(0.5rem,1.4vw,1.25rem)] lg:grid-rows-[auto_minmax(min-content,1fr)]">
            <div className="hidden lg:block">
              <BalanceCard
                balance={balance}
                fragments={fragmentBalance}
                totalFragments={totalFragments}
              />
            </div>

            <BetPanel
              betCost={betCost}
              boosterTier={boosterTier}
              balance={balance}
              multipliers={multipliers}
              boosterCosts={boosterCosts}
              fragmentBalance={fragmentBalance}
              locked={flying}
              onBetChange={setBet}
            />
          </div>

          <ActionBar
            flying={flying}
            starting={controller.starting}
            canStart={betCost >= 1 && betCost <= balance && hasEnoughFragments}
            canCashout={controller.canCashout}
            cashedOut={controller.cashedOut}
            hasLastBet={lastBet !== null}
            autoCashout2x={autoCashout2x}
            onStart={() => startRound(betCost, boosterTier)}
            onCashout={() => void controller.cashout()}
            onRepeat={() => {
              if (!lastBet) return;
              const cost = lastBet.cost;
              const requiredFragments = boosterCosts[lastBet.tier - 1] ?? 0;
              const tier = fragmentBalance >= requiredFragments ? lastBet.tier : 1;
              setBet(cost, tier);
              startRound(cost, tier);
            }}
            onToggleAutoCashout={toggleAutoCashout2x}
          />
        </>
      }
    >
      {phase === 'finished' && result && (
        <ResultModal result={result} onClose={controller.playAgain} />
      )}
    </GameLayout>
  );
}
