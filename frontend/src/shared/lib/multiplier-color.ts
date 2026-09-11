// Цветовая шкала коэффициентов: от красного при низких до зелёного при высоких

export type MultiplierTone = 'low' | 'warm' | 'amber' | 'gold' | 'high';

interface ToneStyle {
  text: string;
  chip: string;
}

const TONES: Readonly<Record<MultiplierTone, ToneStyle>> = {
  low: { text: 'text-crash-low', chip: 'border-crash-low/40 bg-crash-low/10 text-crash-low' },
  warm: { text: 'text-crash-warm', chip: 'border-crash-warm/40 bg-crash-warm/10 text-crash-warm' },
  amber: {
    text: 'text-crash-amber',
    chip: 'border-crash-amber/40 bg-crash-amber/10 text-crash-amber',
  },
  high: { text: 'text-crash-high', chip: 'border-crash-high/40 bg-crash-high/10 text-crash-high' },
  gold: { text: 'text-crash-gold', chip: 'border-crash-gold/50 bg-crash-gold/15 text-crash-gold' },
};

export function multiplierTone(multiplier: number): MultiplierTone {
  // Определяет тон по величине коэффициента
  if (multiplier < 1.2) return 'low';
  if (multiplier < 1.5) return 'warm';
  if (multiplier < 2) return 'amber';
  if (multiplier < 5) return 'high';
  return 'gold';
}

export function multiplierTextClass(multiplier: number): string {
  return TONES[multiplierTone(multiplier)].text;
}

export function multiplierChipClass(multiplier: number): string {
  return TONES[multiplierTone(multiplier)].chip;
}
