// Фоновый слой сцены: облака разной глубины и стаи птиц

interface Drifter {
  x: number;
  y: number;
  speed: number;
  scale: number;
  depth: number;
}

interface Flock extends Drifter {
  size: number;
  phase: number;
}

import type { ScenePalette } from '@/features/flight/scene-palette';

export class SkyLayer {
  private clouds: Drifter[] = [];
  private flocks: Flock[] = [];
  private seeded = false;

  update(deltaMs: number, width: number, height: number): void {
    if (!this.seeded) {
      this.seed(width, height);
      this.seeded = true;
    }

    const seconds = deltaMs / 1000;
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * seconds;
      if (cloud.x > width + 90) cloud.x = -90;
    }
    for (const flock of this.flocks) {
      flock.x += flock.speed * seconds;
      flock.phase += seconds * 3;
      if (flock.x > width + 120) flock.x = -120;
    }
  }

  draw(ctx: CanvasRenderingContext2D, palette: ScenePalette): void {
    for (const cloud of this.clouds) {
      ctx.globalAlpha = cloud.depth;
      this.drawCloud(ctx, cloud, palette);
    }
    ctx.globalAlpha = 1;

    for (const flock of this.flocks) {
      ctx.globalAlpha = flock.depth;
      this.drawFlock(ctx, flock, palette);
    }
    ctx.globalAlpha = 1;
  }

  private drawCloud(
    ctx: CanvasRenderingContext2D,
    cloud: Drifter,
    palette: ScenePalette,
  ): void {
    const r = 20 * cloud.scale;
    ctx.fillStyle = palette.cloud;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, r, 0, Math.PI * 2);
    ctx.arc(cloud.x + r * 0.95, cloud.y + 5, r * 0.8, 0, Math.PI * 2);
    ctx.arc(cloud.x - r * 0.95, cloud.y + 5, r * 0.7, 0, Math.PI * 2);
    ctx.arc(cloud.x + r * 0.3, cloud.y - r * 0.55, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFlock(
    ctx: CanvasRenderingContext2D,
    flock: Flock,
    palette: ScenePalette,
  ): void {
    ctx.strokeStyle = palette.bird;
    ctx.lineWidth = 1.6 * flock.scale;

    for (let index = 0; index < flock.size; index += 1) {
      const offsetX = index * 13 * flock.scale;
      const offsetY = (index % 2 === 0 ? 1 : -1) * index * 5 * flock.scale;
      const flap = Math.sin(flock.phase + index) * 2.5 * flock.scale;
      const x = flock.x - offsetX;
      const y = flock.y + offsetY;
      const s = 6 * flock.scale;

      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.quadraticCurveTo(x - s / 2, y - s / 2 - flap, x, y);
      ctx.quadraticCurveTo(x + s / 2, y - s / 2 - flap, x + s, y);
      ctx.stroke();
    }
  }

  private seed(width: number, height: number): void {
    const cloudCount = 4 + Math.floor(Math.random() * 4);
    const flockCount = 3 + Math.floor(Math.random() * 3);

    this.clouds = Array.from({ length: cloudCount }, () => {
      const depth = 0.35 + Math.random() * 0.5;
      return {
        x: Math.random() * width,
        y: 20 + Math.random() * height * 0.5,
        speed: (5 + Math.random() * 10) * depth,
        scale: 0.6 + Math.random() * 0.8,
        depth,
      };
    });

    this.flocks = Array.from({ length: flockCount }, () => {
      const depth = 0.7 + Math.random() * 0.3;
      return {
        x: Math.random() * width,
        y: 25 + Math.random() * height * 0.5,
        speed: (28 + Math.random() * 34) * depth,
        scale: 0.6 + Math.random() * 0.5,
        depth,
        size: 2 + Math.floor(Math.random() * 4),
        phase: Math.random() * Math.PI * 2,
      };
    });
  }
}
