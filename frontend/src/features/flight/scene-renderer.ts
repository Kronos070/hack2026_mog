// Отрисовка сцены полёта в canvas: небо, уровни, шар, бустер и взрыв

import type { RoundStart, Theme } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { readScenePalette, type ScenePalette } from '@/features/flight/scene-palette';
import { getBalloonSprite } from '@/features/flight/balloon-sprites';

const BALLOON_BOTTOM = 104;
const BALLOON_HEIGHT = 96;
const BOOM_DURATION_MS = 700;
const LADDER_WIDTH = 96;

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
  private explodedAt: number | null = null;

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

    this.drawLevels(snapshot);

    if (!this.round || !snapshot) {
      const bob = Math.sin(performance.now() / 900) * 4;
      this.paintBalloon(height - BALLOON_BOTTOM + bob, this.accent);
      return;
    }

    if (snapshot.crashed) {
      if (this.explodedAt === null) {
        this.explodedAt = performance.now();
        this.spawnParticles(snapshot.progress);
      }
      this.drawBoom(snapshot.progress);
      this.drawParticles(deltaMs);
    } else {
      this.drawBalloon(snapshot);
    }
  }

  private drawLevels(snapshot: FlightSnapshot | null): void {
    const { ctx, width, height, levels } = this;
    const count = levels.length;
    if (count === 0) return;

    for (let index = 0; index < count; index += 1) {
      const y = height - ((index + 1) / (count + 1)) * height;
      const passed = (snapshot?.levelsPassed ?? 0) > index;

      ctx.strokeStyle = passed ? 'rgba(245, 179, 36, 0.9)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = passed ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(LADDER_WIDTH, y);
      ctx.lineTo(width - 12, y);
      ctx.stroke();

      if (this.round?.boosterLevel === index + 1) {
        this.drawBoosterMarker(y, snapshot?.boosterActivated ?? false);
      }
    }
  }

  private drawBoosterMarker(y: number, activated: boolean): void {
    const { ctx, width } = this;
    ctx.fillStyle = activated ? '#eab308' : '#6b7280';
    ctx.beginPath();
    ctx.arc(width - 32, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x${this.round?.boosterMultiplier ?? 1}`, width - 32, y);
    ctx.textAlign = 'left';
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
  }

  private drawBalloon(snapshot: FlightSnapshot): void {
    this.paintBalloon(this.height - snapshot.progress * this.height - 26, this.accent);
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

  private spawnParticles(progress: number): void {
    const x = this.width / 2;
    const y = this.height - progress * this.height - 26;
    this.particles = Array.from({ length: 28 }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 320,
      vy: (Math.random() - 0.5) * 320,
      life: 1,
    }));
  }

  private drawBoom(progress: number): void {
    const sprite = getBalloonSprite(this.theme, 'boom');
    if (!sprite || this.explodedAt === null) return;

    const elapsed = performance.now() - this.explodedAt;
    if (elapsed > BOOM_DURATION_MS) return;

    const { ctx, width, height } = this;
    const scale = 1 + (elapsed / BOOM_DURATION_MS) * 0.4;
    const spriteHeight = BALLOON_HEIGHT * scale;
    const spriteWidth = (sprite.naturalWidth / sprite.naturalHeight) * spriteHeight;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - elapsed / BOOM_DURATION_MS);
    ctx.translate(width / 2, height - progress * height - 26);
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
