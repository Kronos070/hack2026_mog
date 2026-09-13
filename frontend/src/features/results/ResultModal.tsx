// Модалка итогов раунда: победа или проигрыш поверх экрана краха

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoundResult } from '@/shared/api/contract';
import { SkyDecor } from '@/features/home/SkyDecor';
import { RewardList } from '@/features/results/RewardList';
import { soundManager } from '@/shared/lib/sound-manager';

const EXIT_MS = 340;

interface ResultModalProps {
  result: RoundResult;
  onClose: () => void;
}

export function ResultModal({ result, onClose }: ResultModalProps) {
  // Показывает исход раунда и закрывается по кресту, фону и Esc
  const ref = useRef<HTMLDialogElement>(null);
  const exitTimer = useRef<number | null>(null);
  const [closing, setClosing] = useState(false);
  const won = result.payout > 0;
  const puzzleEarned = result.reward.collected < result.reward.total;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    if (won) {
      soundManager.play('win', 0.9);
    }
    return () => {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    };
  }, [won]);

  const requestClose = useCallback(() => {
    setClosing((already) => {
      if (!already) exitTimer.current = window.setTimeout(onClose, EXIT_MS);
      return true;
    });
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) requestClose();
      }}
      className={`${closing ? 'anim-result-backdrop-out' : 'anim-result-backdrop'} m-0 h-full max-h-none w-full max-w-none bg-[url('/images/result/modal-background.webp')] bg-cover bg-center p-0 backdrop:bg-sky-deep/45`}
    >
      <div className="pointer-events-none grid h-full w-full place-items-center p-4 pb-[14vh]">
        <SkyDecor withBirds={false} still className={closing ? 'result-clouds-out' : 'result-clouds'} />

        <button
          type="button"
          onClick={requestClose}
          aria-label="Закрыть"
          className="pointer-events-auto absolute top-5 right-5 z-10 text-4xl leading-none font-light text-on-glass drop-shadow-[0_2px_8px_rgb(4_20_40/0.8)] transition-transform outline-none hover:scale-110 focus-visible:scale-110"
        >
          ✕
        </button>

        <div
          className={`${closing ? 'anim-result-card-out' : 'anim-result-card'} pointer-events-auto relative flex w-full max-w-4xl flex-col items-center gap-6`}
        >
          <img
            src={won ? '/images/result/title-win.webp' : '/images/result/title-lose.webp'}
            alt={won ? 'Победа' : 'Не повезло'}
            className="anim-result-title w-[min(92vw,56rem)] select-none drop-shadow-[0_10px_30px_rgb(4_20_40/0.5)]"
          />

          <RewardList result={result} puzzleEarned={puzzleEarned} />

          <button
            type="button"
            onClick={requestClose}
            className="w-[min(72vw,17rem)] rounded-full bg-linear-to-b from-accent to-accent-dark py-4 text-xl font-bold text-sky-deep shadow-[0_8px_22px_rgb(4_20_40/0.45)] transition hover:brightness-110 active:translate-y-0.5"
          >
            Играть еще →
          </button>
        </div>
      </div>
    </dialog>
  );
}
