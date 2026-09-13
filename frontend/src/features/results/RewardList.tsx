// Блок «Награда»: выпавшие монеты и фрагменты пазла за раунд

import type { RoundResult } from '@/shared/api/contract';

interface RewardItem {
  key: string;
  src: string;
  alt: string;
  amount: number;
}

interface RewardListProps {
  result: RoundResult;
  puzzleEarned: boolean;
}

export function RewardList({ result, puzzleEarned }: RewardListProps) {
  // Показывает только реально выпавшие награды, скрывая нулевые
  const items: RewardItem[] = [];

  if (result.payout > 0) {
    items.push({
      key: 'coins',
      src: '/images/choose/coin.webp',
      alt: 'Монеты',
      amount: result.payout,
    });
  }

  if (puzzleEarned) {
    items.push({
      key: 'puzzle',
      src: '/images/boosters/tier-2.png',
      alt: result.reward.label,
      amount: 1,
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col items-center gap-3">
      <h3 className="text-2xl font-bold tracking-[0.18em] text-on-glass uppercase drop-shadow-[0_2px_6px_rgb(4_20_40/0.8)]">
        Награда
      </h3>
      <ul className="flex items-start justify-center gap-8">
        {items.map((item, index) => (
          <li
            key={item.key}
            style={{ animationDelay: `${0.25 + index * 0.12}s` }}
            className="anim-result-reward flex w-20 flex-col items-center gap-1"
          >
            <img
              src={item.src}
              alt={item.alt}
              className="h-16 w-16 object-contain drop-shadow-[0_6px_14px_rgb(4_20_40/0.55)]"
            />
            <span className="text-lg font-bold text-on-glass drop-shadow-[0_2px_6px_rgb(4_20_40/0.85)]">
              {item.amount}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
