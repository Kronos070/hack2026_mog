// Менеджер звуков: разблокировка аудио по первому жесту, фоновая музыка, озвучка множителей, тумблер mute

export type SoundKey =
  | 'bird'
  | 'drop'
  | 'boost'
  | 'cashout'
  | 'crash'
  | 'select'
  | 'win';

const SOURCES: Readonly<Record<SoundKey, string>> = {
  bird: '/sounds/button-click.mp3',
  drop: '/sounds/button-click.mp3',
  boost: '/sounds/blow.mp3',
  cashout: '/sounds/cash.mp3',
  crash: '/sounds/balloon-pop.mp3',
  select: '/sounds/button-click.mp3',
  win: '/sounds/win.mp3',
};

const MUTE_KEY = 'balloon.muted';
const POOL_SIZE = 3;

class SoundManager {
  private pools = new Map<SoundKey, HTMLAudioElement[]>();
  private cursors = new Map<SoundKey, number>();
  private multiplierPool = new Map<number, HTMLAudioElement>();
  private bgmAudio: HTMLAudioElement | null = null;
  private flightAudio: HTMLAudioElement | null = null;
  private unlocked = false;
  private muted = this.readMuted();

  init(): void {
    if (this.unlocked) return;
    const events = ['pointerdown', 'keydown', 'click', 'touchstart'] as const;
    const unlock = (): void => {
      this.unlocked = true;
      if (!this.muted) {
        this.startBgm();
      }
      for (const ev of events) {
        window.removeEventListener(ev, unlock);
      }
    };
    for (const ev of events) {
      window.addEventListener(ev, unlock, { once: true });
    }
  }

  play(key: SoundKey, volume = 1): void {
    if (!this.unlocked) {
      this.unlocked = true;
      if (!this.muted) this.startBgm();
    }
    if (this.muted) return;
    if (this.bgmAudio && this.bgmAudio.paused) {
      void this.bgmAudio.play().catch(() => undefined);
    }
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

  playMultiplier(level: number, volume = 0.85): void {
    if (!this.unlocked) {
      this.unlocked = true;
      if (!this.muted) this.startBgm();
    }
    if (this.muted) return;
    const clamped = Math.max(2, Math.min(12, Math.round(level)));
    let audio = this.multiplierPool.get(clamped);
    if (!audio) {
      audio = new Audio(`/sounds/multipliers/x${clamped}.mp3`);
      audio.preload = 'auto';
      this.multiplierPool.set(clamped, audio);
    }
    audio.currentTime = 0;
    audio.volume = volume;
    void audio.play().catch(() => undefined);
  }

  startFlightSound(volume = 0.25): void {
    if (this.muted || !this.unlocked) return;
    if (!this.flightAudio) {
      const audio = new Audio('/sounds/flight-loop.mp3');
      audio.loop = true;
      audio.preload = 'auto';
      audio.addEventListener('ended', () => {
        if (!this.muted && this.flightAudio === audio) {
          audio.currentTime = 0;
          void audio.play().catch(() => undefined);
        }
      });
      this.flightAudio = audio;
    }
    this.flightAudio.volume = volume;
    this.flightAudio.currentTime = 0;
    void this.flightAudio.play().catch(() => undefined);
  }

  stopFlightSound(): void {
    if (this.flightAudio) {
      this.flightAudio.pause();
      this.flightAudio.currentTime = 0;
    }
  }

  startBgm(volume = 0.18): void {
    if (this.muted || !this.unlocked) return;
    if (!this.bgmAudio) {
      const audio = new Audio('/sounds/bgm.mp3');
      audio.loop = true;
      audio.preload = 'auto';

      // Гарантированное бесконечное зацикливание во всех браузерах
      audio.addEventListener('ended', () => {
        if (!this.muted) {
          audio.currentTime = 0;
          void audio.play().catch(() => undefined);
        }
      });

      this.bgmAudio = audio;
    }
    this.bgmAudio.volume = volume;
    if (this.bgmAudio.paused) {
      void this.bgmAudio.play().catch(() => undefined);
    }
  }

  pauseBgm(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
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

    if (this.muted) {
      this.pauseBgm();
      this.stopFlightSound();
    } else if (this.unlocked) {
      this.startBgm();
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
