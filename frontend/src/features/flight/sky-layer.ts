// Фоновый слой сцены: облака и птицы со случайными траекториями

interface Drifter {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

export class SkyLayer {
  private clouds: Drifter[];
  private birds: Drifter[];

  constructor() {
    this.clouds = spawn(1 + Math.floor(Math.random() * 3), 30, 120, 6, 8, 0.7, 0.6);
    this.birds = spawn(1 + Math.floor(Math.random() * 3), 20, 100, 30, 40, 0.7, 0.5);
  }

  update(deltaMs: number, width: number): void {
    const seconds = deltaMs / 1000;
    for (const item of [...this.clouds, ...this.birds]) {
      item.x += item.speed * seconds;
      if (item.x > width + 60) item.x = -60;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#e5e7eb';
    for (const cloud of this.clouds) {
      const radius = 18 * cloud.scale;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, radius, 0, Math.PI * 2);
      ctx.arc(cloud.x + radius * 0.9, cloud.y + 4, radius * 0.8, 0, Math.PI * 2);
      ctx.arc(cloud.x - radius * 0.9, cloud.y + 4, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1.5;
    for (const bird of this.birds) {
      const size = 6 * bird.scale;
      ctx.beginPath();
      ctx.moveTo(bird.x - size, bird.y);
      ctx.quadraticCurveTo(bird.x - size / 2, bird.y - size / 2, bird.x, bird.y);
      ctx.quadraticCurveTo(bird.x + size / 2, bird.y - size / 2, bird.x + size, bird.y);
      ctx.stroke();
    }
  }
}

function spawn(
  count: number,
  minY: number,
  spreadY: number,
  minSpeed: number,
  spreadSpeed: number,
  minScale: number,
  spreadScale: number,
): Drifter[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 400,
    y: minY + Math.random() * spreadY,
    speed: minSpeed + Math.random() * spreadSpeed,
    scale: minScale + Math.random() * spreadScale,
  }));
}
