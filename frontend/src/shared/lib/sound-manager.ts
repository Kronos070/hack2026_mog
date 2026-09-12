// Менеджер звуков: разблокировка аудио по первому жесту, пул инстансов, тумблер mute

export type SoundKey =
  | 'bird'
  | 'drop'
  | 'level-up'
  | 'boost'
  | 'cashout'
  | 'crash'
  | 'select';

const SOURCES: Readonly<Record<SoundKey, string>> = {
  bird: '/sounds/bird.mp3',
  drop: '/sounds/drop.mp3',
  'level-up': '/sounds/level-up.mp3',
  boost: '/sounds/boost.mp3',
  cashout: '/sounds/cashout.mp3',
  crash: '/sounds/crash.mp3',
  select: '/sounds/select.mp3',
};

const MUTE_KEY = 'balloon.muted';
const POOL_SIZE = 3;

class SoundManager {
  private pools = new Map<SoundKey, HTMLAudioElement[]>();
  private cursors = new Map<SoundKey, number>();
  private unlocked = false;
  private muted = this.readMuted();

  init(): void {
    if (this.unlocked) return;
    const unlock = (): void => {
      this.unlocked = true;
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  play(key: SoundKey, volume = 1): void {
    if (this.muted || !this.unlocked) return;
    const pool = this.ensurePool(key);
    const cursor = this.cursors.get(key) ?? 0;
    const audio = pool[cursor % pool.length];
    this.cursors.set(key, cursor + 1);
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = volume;
    // Файлы звуков могут отсутствовать на этапе прототипа — ошибка не должна ломать игру
    void audio.play().catch(() => undefined);
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, String(this.muted));
    } catch {
      // Настройка не сохранится, но звук переключится в текущей сессии
    }
    return this.muted;
  }

  private ensurePool(key: SoundKey): HTMLAudioElement[] {
    const existing = this.pools.get(key);
    if (existing) return existing;

    const pool = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(SOURCES[key]);
      audio.preload = 'auto';
      return audio;
    });
    this.pools.set(key, pool);
    return pool;
  }

  private readMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  }
}

export const soundManager = new SoundManager();
