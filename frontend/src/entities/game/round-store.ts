// Состояние игрового цикла: фаза, активный раунд и последний результат

import { create } from 'zustand';
import type { RoundResult, RoundStart } from '@/shared/api/contract';

export type GamePhase = 'idle' | 'flying' | 'finished';

interface RoundState {
  phase: GamePhase;
  round: RoundStart | null;
  result: RoundResult | null;
  startRound: (round: RoundStart) => void;
  finishRound: (result: RoundResult) => void;
  resetToIdle: () => void;
}

export const useRoundStore = create<RoundState>()((set) => ({
  phase: 'idle',
  round: null,
  result: null,
  startRound: (round) => set({ phase: 'flying', round, result: null }),
  finishRound: (result) => set({ phase: 'finished', result }),
  resetToIdle: () => set({ phase: 'idle', round: null, result: null }),
}));
