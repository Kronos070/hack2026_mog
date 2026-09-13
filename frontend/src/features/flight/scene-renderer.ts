// Отрисовка сцены полёта в canvas: небо, уровни, шар, бустер и взрыв

import type { RoundStart, Theme } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { readScenePalette, type ScenePalette } from '@/features/flight/scene-palette';
import { getBalloonSprite } from '@/features/flight/balloon-sprites';
import { getBoosterSprite } from '@/features/flight/booster-sprites';

const BALLOON_BOTTOM = 104;
const BALLOON_TOP = 90;
const SMOOTHING = 0.12;
const CAMERA_HOLD = 0.55;
const BALLOON_HEIGHT = 96;
const BOOM_DURATION_MS = 700;
const BOOSTER_ICON_MAX = 52;
const BOOSTER_ICON_MIN = 24;
const BOOSTER_SHARDS = 9;
const BOOSTER_CRUMBLE_MS = 620;
const LADDER_WIDTH = 96;
const MIN_LINE_GAP = 34;

export interface SceneSetup {
  round: RoundStart | null;
  levels: readonly number[];
  theme: Theme;
}

export class SceneRenderer {
  private palette: ScenePalette = readScenePalette();
  private particles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  private width = 0;
  private height = 0;
  private shownProgress = 0;
  static smoothedProgress = 0;
  private explodedAt: number | null = null;
  private boosterMissedAt: number | null = null;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly round: RoundStart | null;
  private readonly levels: readonly number[];
  private readonly accent: string;
  private readonly theme: Theme;

  constructor(ctx: CanvasRenderingContext2D, scene: SceneSetup) {
    this.ctx = ctx;
    this.round = scene.round;
    this.levels = scene.round?.levelMultipliers ?? scene.levels;
    this.accent = scene.theme === 'red' ? '#dc2626' : '#16a34a';
    this.theme = scene.theme;
  }

  refreshPalette(): void {
    this.palette = readScenePalette();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  draw(snapshot: FlightSnapshot | null, deltaMs: number): void {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    const target = snapshot?.progress ?? 0;
    const step = 1 - Math.pow(1 - SMOOTHING, deltaMs / 16.67);
    this.shownProgress += (target - this.shownProgress) * step;
    SceneRenderer.smoothedProgress = this.shownProgress;

    this.drawLevels(snapshot);

    if (!this.round || !snapshot) {
      const bob = Math.sin(performance.now() / 900) * 4;
      this.shownProgress = 0;
      this.paintBalloon(this.balloonY(0) + bob, this.accent);
      return;
    }

    if (snapshot.crashed) {
      if (this.explodedAt === null) {
        this.explodedAt = performance.now();
        this.spawnParticles();
      }
      this.drawBoom();
      this.drawParticles(deltaMs);
    } else {
      this.drawBalloon();
    }
  }

  private balloonY(progress: number): number {
    const rest = this.height - BALLOON_BOTTOM;
    return rest - progress * (rest - BALLOON_TOP);
  }

  // Сдвиг сцены: после порога шар замирает, а шкала уезжает вниз
  private cameraShift(): number {
    const over = this.shownProgress - CAMERA_HOLD;
    if (over <= 0) return 0;
    const rest = this.height - BALLOON_BOTTOM;
    return over * (rest - BALLOON_TOP);
  }

  // Иконка бустера уменьшается вместе с полем на узких экранах
  private get boosterIcon(): number {
    const scaled = (this.width - LADDER_WIDTH) * 0.135;
    return Math.max(BOOSTER_ICON_MIN, Math.min(BOOSTER_ICON_MAX, scaled));
  }

  private levelY(progress: number): number {
    return this.balloonY(progress) + this.cameraShift();
  }

  private drawLevels(snapshot: FlightSnapshot | null): void {
    const { ctx, width, levels } = this;
    const count = levels.length;
    if (count === 0) return;

    const slot = 1 / (count + 1);
    // Шаг прогрессии: по нему достраиваем шкалу выше последнего уровня
    const first = levels[0] ?? 1;
    const last = levels[count - 1] ?? 1;
    const ratio = count > 1 ? Math.pow(last / first, 1 / (count - 1)) : 2;

    // Сколько слотов видно над последним уровнем при текущем сдвиге камеры
    const extra = Math.max(Math.ceil(this.cameraShift() / (slot * (this.height - BALLOON_BOTTOM - BALLOON_TOP))) + 1, 0);
    const total = count + extra;

    // На низком поле рисуем линии реже, чтобы они не сливались
    const gap = (this.height - BALLOON_BOTTOM - BALLOON_TOP) * slot;
    const step = Math.max(Math.ceil(MIN_LINE_GAP / Math.max(gap, 1)), 1);

    ctx.textBaseline = 'middle';

    for (let index = 0; index < total; index += 1) {
      const y = this.levelY((index + 1) * slot);
      if (y < -40 || y > this.height + 40) continue;
      const sparse = index % step !== 0 && index !== count - 1;

      const beyond = index >= count;
      const value = beyond ? last * Math.pow(ratio, index - count + 1) : (levels[index] ?? 1);
      const passed = beyond
        ? (snapshot?.multiplier ?? 0) >= value
        : (snapshot?.levelsPassed ?? 0) > index;

      if (sparse) {
        ctx.strokeStyle = passed ? 'rgba(245, 179, 36, 0.25)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = passed ? 'rgba(245, 179, 36, 0.9)' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = passed ? 2 : 1;
      }
      ctx.beginPath();
      ctx.moveTo(LADDER_WIDTH, y);
      ctx.lineTo(width - 12, y);
      ctx.stroke();

      // Подписи продолжения рисуем на канвасе: DOM-шкала знает только базовые уровни
      if (beyond && !sparse) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 15px Nunito, ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x ${value.toFixed(2)}`, LADDER_WIDTH / 2, y);
        ctx.textAlign = 'left';
        ctx.font = '600 11px Nunito, ui-sans-serif, system-ui, sans-serif';
      }

      if (!beyond && this.round?.boosterLevel === index + 1) {
        const activated = snapshot?.boosterActivated ?? false;
        const lost = !activated && ((snapshot?.cashedOut ?? false) || passed);
        this.drawBoosterMarker(y, activated, lost);
      }
    }

    ctx.textBaseline = 'alphabetic';
  }

  private drawBoosterMarker(y: number, activated: boolean, missed: boolean): void {
    const { ctx, width } = this;
    const multiplier = this.round?.boosterMultiplier ?? 1;
    const tier = Math.max(Math.round(multiplier), 1);
    const x = (LADDER_WIDTH + width) / 2;
    const sprite = getBoosterSprite(tier);
    const icon = this.boosterIcon;
    const time = performance.now();

    if (missed) {
      if (this.boosterMissedAt === null) this.boosterMissedAt = time;
      this.drawBoosterShards(x, y, icon, sprite, time - this.boosterMissedAt);
      return;
    }

    const bob = Math.sin(time / 520) * 5;
    const tilt = Math.sin(time / 760) * 0.09;
    const pulse = 1 + Math.sin(time / 430) * 0.06;
    const glow = 12 + Math.sin(time / 300) * 6;

    ctx.save();
    ctx.globalAlpha = activated ? 1 : 0.75;
    ctx.translate(x, y + bob);
    ctx.rotate(tilt);
    ctx.scale(pulse, pulse);

    if (sprite) {
      const h = icon;
      const w = (sprite.naturalWidth / sprite.naturalHeight) * h;
      ctx.shadowColor = activated ? 'rgba(245, 179, 36, 0.95)' : 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = activated ? glow + 10 : glow * 0.5;
      ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = activated ? '#eab308' : '#6b7280';
      ctx.beginPath();
      ctx.arc(0, 0, icon / 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Вспышка-ореол в момент срабатывания бустера
    if (activated) {
      const ring = (time % 1200) / 1200;
      ctx.save();
      ctx.globalAlpha = (1 - ring) * 0.5;
      ctx.strokeStyle = '#f5b324';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y + bob, icon * (0.5 + ring * 0.7), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = activated ? '#f5b324' : 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 15px Nunito, ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`x${multiplier}`, x, y + bob + icon / 2 + icon * 0.27);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '600 11px Nunito, ui-sans-serif, system-ui, sans-serif';
  }

  // Упущенный бустер рассыпается на осколки и гаснет
  private drawBoosterShards(
    x: number,
    y: number,
    icon: number,
    sprite: HTMLImageElement | null,
    elapsed: number,
  ): void {
    const { ctx } = this;
    const progress = Math.min(elapsed / BOOSTER_CRUMBLE_MS, 1);
    const fade = 1 - progress;
    if (fade <= 0) return;

    const piece = icon / 2.4;

    for (let index = 0; index < BOOSTER_SHARDS; index += 1) {
      const angle = (index / BOOSTER_SHARDS) * Math.PI * 2 + index * 0.7;
      const spread = icon * 0.85 * progress;
      const sx = x + Math.cos(angle) * spread;
      const sy = y + Math.sin(angle) * spread * 0.6 + progress * progress * icon * 1.4;

      ctx.save();
      ctx.globalAlpha = fade * 0.9;
      ctx.translate(sx, sy);
      ctx.rotate(angle + progress * 3.4);

      if (sprite) {
        const w = (sprite.naturalWidth / sprite.naturalHeight) * piece;
        ctx.drawImage(sprite, -w / 2, -piece / 2, w, piece);
      } else {
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(-piece / 2, -piece / 2, piece, piece);
      }

      ctx.restore();
    }
  }

  private drawBalloon(): void {
    this.paintBalloon(this.balloonY(Math.min(this.shownProgress, CAMERA_HOLD)), this.accent);
  }

  private paintBalloon(y: number, accent: string): void {
    const { ctx, width } = this;
    const sway = Math.sin(performance.now() / 600) * 6;

    ctx.save();
    ctx.translate(width / 2 + sway, y);

    const sprite = getBalloonSprite(this.theme, 'default');
    if (sprite) {
      const height = BALLOON_HEIGHT;
      const spriteWidth = (sprite.naturalWidth / sprite.naturalHeight) * height;
      ctx.drawImage(sprite, -spriteWidth / 2, -height / 2, spriteWidth, height);
      ctx.restore();
      return;
    }

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.palette.trunk;
    ctx.fillRect(-8, 30, 16, 12);

    ctx.restore();
  }

  private spawnParticles(): void {
    const x = this.width / 2;
    const y = this.balloonY(Math.min(this.shownProgress, CAMERA_HOLD));
    this.particles = Array.from({ length: 28 }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 320,
      vy: (Math.random() - 0.5) * 320,
      life: 1,
    }));
  }

  private drawBoom(): void {
    const sprite = getBalloonSprite(this.theme, 'boom');
    if (!sprite || this.explodedAt === null) return;

    const elapsed = performance.now() - this.explodedAt;
    if (elapsed > BOOM_DURATION_MS) return;

    const { ctx, width } = this;
    const scale = 1 + (elapsed / BOOM_DURATION_MS) * 0.4;
    const spriteHeight = BALLOON_HEIGHT * scale;
    const spriteWidth = (sprite.naturalWidth / sprite.naturalHeight) * spriteHeight;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - elapsed / BOOM_DURATION_MS);
    ctx.translate(width / 2, this.balloonY(Math.min(this.shownProgress, CAMERA_HOLD)));
    ctx.drawImage(sprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
    ctx.restore();
  }

  private drawParticles(deltaMs: number): void {
    const { ctx } = this;
    const seconds = deltaMs / 1000;
    const accent = this.accent;

    for (const particle of this.particles) {
      particle.x += particle.vx * seconds;
      particle.y += particle.vy * seconds;
      particle.vy += 260 * seconds;
      particle.life -= seconds * 1.1;
      if (particle.life <= 0) continue;

      ctx.globalAlpha = Math.max(particle.life, 0);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
