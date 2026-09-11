// Отрисовка сцены полёта в canvas: небо, уровни, шар, бустер и взрыв

import type { RoundStart, Theme } from '@/shared/api/contract';
import type { FlightSnapshot } from '@/features/flight/use-flight-engine';
import { SkyLayer } from '@/features/flight/sky-layer';

const BALLOON_BOTTOM = 76;

export interface SceneSetup {
  round: RoundStart | null;
  levels: readonly number[];
  theme: Theme;
}

export class SceneRenderer {
  private readonly sky = new SkyLayer();
  private particles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  private width = 0;
  private height = 0;
  private explodedAt: number | null = null;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly round: RoundStart | null;
  private readonly levels: readonly number[];
  private readonly accent: string;

  constructor(ctx: CanvasRenderingContext2D, scene: SceneSetup) {
    this.ctx = ctx;
    this.round = scene.round;
    this.levels = scene.round?.levelMultipliers ?? scene.levels;
    this.accent = scene.theme === 'red' ? '#dc2626' : '#16a34a';
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  draw(snapshot: FlightSnapshot | null, deltaMs: number): void {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    this.ctx.fillStyle = '#fafafa';
    this.ctx.fillRect(0, 0, width, height);
    this.sky.update(deltaMs, width);
    this.sky.draw(this.ctx);

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
      this.drawParticles(deltaMs);
    } else {
      this.drawBalloon(snapshot);
    }
  }

  private drawLevels(snapshot: FlightSnapshot | null): void {
    const { ctx, width, height, levels } = this;
    const count = levels.length;
    if (count === 0) return;

    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    for (let index = 0; index < count; index += 1) {
      const y = height - ((index + 1) / (count + 1)) * height;
      const passed = (snapshot?.levelsPassed ?? 0) > index;

      ctx.strokeStyle = passed ? '#0a0a0a' : '#e5e7eb';
      ctx.lineWidth = passed ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(width - 16, y);
      ctx.stroke();

      ctx.fillStyle = passed ? '#0a0a0a' : '#9ca3af';
      ctx.fillText(`x${levels[index]?.toFixed(2) ?? '-'}`, 6, y);

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

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 26);
    ctx.lineTo(-5, 40);
    ctx.moveTo(8, 26);
    ctx.lineTo(5, 40);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-7, -8, 6, 11, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, 40, 16, 12);

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
