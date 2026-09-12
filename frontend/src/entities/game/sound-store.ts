// Реактивная обёртка над менеджером звука для переключателя в хедере

import { create } from 'zustand';
import { soundManager } from '@/shared/lib/sound-manager';

interface SoundState {
  muted: boolean;
  toggle: () => void;
}

export const useSoundStore = create<SoundState>()((set) => ({
  muted: soundManager.isMuted(),
  toggle: () => set({ muted: soundManager.toggleMute() }),
}));
