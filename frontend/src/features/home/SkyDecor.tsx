// Декоративный слой стартового экрана: плавающие облака и парящие птицы

interface Decor {
  src: string;
  className: string;
  anim: string;
  delay: string;
  side: 'left' | 'right';
  size: readonly [number, number];
}

const BIRD_SHADOW = 'drop-shadow-[0_8px_18px_rgb(20_60_110/0.35)]';

const DECOR: readonly Decor[] = [
  { src: 'cloud-s1', className: `-left-[18%] -bottom-[22%] z-0 w-[80vw] max-w-[1150px]`, anim: 'anim-float-soft', delay: '-3s', side: 'left', size: [287, 184] },
  { src: 'cloud-s3', className: `-right-[18%] -bottom-[20%] z-0 w-[80vw] max-w-[1150px]`, anim: 'anim-float-back', delay: '-7s', side: 'right', size: [344, 216] },
  { src: 'cloud-big-a', className: `-left-[1113px] -bottom-[22%] z-[1] w-[92.4vw] max-w-[1386px]`, anim: 'anim-drift-left', delay: '0s', side: 'left', size: [482, 332] },
  { src: 'cloud-big-b', className: `-right-[1186px] -bottom-[24%] z-[1] w-[96.6vw] max-w-[1449px]`, anim: 'anim-drift-right', delay: '-5s', side: 'right', size: [508, 271] },
  { src: 'bird-a', className: `left-[9%] top-[48%] z-[2] w-[14vw] max-w-[200px] ${BIRD_SHADOW}`, anim: 'anim-bird-left', delay: '-1s', side: 'left', size: [167, 175] },
  { src: 'bird-b', className: `right-[17%] top-[21%] z-[2] w-[16vw] max-w-[230px] ${BIRD_SHADOW}`, anim: 'anim-bird-right', delay: '-4s', side: 'right', size: [224, 180] },
];

interface SkyDecorProps {
  withBirds?: boolean;
  still?: boolean;
  className?: string;
}

export function SkyDecor({ withBirds = true, still = false, className = '' }: SkyDecorProps) {
  // Раскладывает облака и птиц по краям экрана, не перехватывая клики
  const items = withBirds ? DECOR : DECOR.filter((item) => !item.src.startsWith('bird'));

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {items.map((item) => (
        <img
          key={item.src + item.className}
          src={`/images/home/${item.src}.webp`}
          alt=""
          style={still ? undefined : { animationDelay: item.delay }}
          width={item.size[0]}
          height={item.size[1]}
          data-side={item.side}
          className={`absolute select-none ${item.className} ${still ? '' : item.anim}`}
        />
      ))}
    </div>
  );
}
