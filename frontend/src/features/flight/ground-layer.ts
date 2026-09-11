// Наземный слой сцены: холмы, деревья и кусты вдоль нижней кромки

import type { ScenePalette } from '@/features/flight/scene-palette';

interface Tree {
  x: number;
  scale: number;
  kind: 'pine' | 'round';
}

const GROUND_HEIGHT = 46;

export class GroundLayer {
  private trees: Tree[] = [];
  private seeded = false;

  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    palette: ScenePalette,
  ): void {
    if (!this.seeded) {
      this.seed(width);
      this.seeded = true;
    }

    const baseY = height;
    const hillY = baseY - GROUND_HEIGHT;

    ctx.fillStyle = palette.ground;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(0, hillY + 12);
    ctx.quadraticCurveTo(width * 0.25, hillY - 10, width * 0.5, hillY + 6);
    ctx.quadraticCurveTo(width * 0.78, hillY + 18, width, hillY - 4);
    ctx.lineTo(width, baseY);
    ctx.closePath();
    ctx.fill();

    for (const tree of this.trees) {
      const x = tree.x * width;
      if (tree.kind === 'pine') this.drawPine(ctx, x, hillY + 10, tree.scale, palette);
      else this.drawRound(ctx, x, hillY + 12, tree.scale, palette);
    }
  }

  private drawPine(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    palette: ScenePalette,
  ): void {
    const h = 26 * scale;
    const w = 9 * scale;

    ctx.fillStyle = palette.trunk;
    ctx.fillRect(x - 1.5 * scale, y - h * 0.25, 3 * scale, h * 0.28);

    ctx.fillStyle = palette.treePine;
    for (let tier = 0; tier < 3; tier += 1) {
      const tierY = y - h * 0.22 - tier * h * 0.26;
      const tierW = w * (1 - tier * 0.2);
      ctx.beginPath();
      ctx.moveTo(x, tierY - h * 0.34);
      ctx.lineTo(x - tierW, tierY);
      ctx.lineTo(x + tierW, tierY);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawRound(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    palette: ScenePalette,
  ): void {
    const r = 8 * scale;

    ctx.fillStyle = palette.trunk;
    ctx.fillRect(x - 1.5 * scale, y - r, 3 * scale, r);

    ctx.fillStyle = palette.treeRound;
    ctx.beginPath();
    ctx.arc(x, y - r * 1.6, r, 0, Math.PI * 2);
    ctx.arc(x - r * 0.7, y - r * 1.1, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y - r * 1.2, r * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }

  private seed(width: number): void {
    const count = Math.max(5, Math.round(width / 110));
    this.trees = Array.from({ length: count }, (_, index) => ({
      x: (index + 0.5) / count + (Math.random() - 0.5) * 0.06,
      scale: 0.75 + Math.random() * 0.6,
      kind: Math.random() > 0.45 ? 'pine' : 'round',
    }));
  }
}
