/**
 * @file OrderBookCanvas.ts
 * @description High-performance OffscreenCanvas renderer for the Order Book.
 * Synchronizes with requestAnimationFrame (60fps) to prevent UI stutter.
 */

export class OrderBookRenderer {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private dpr: number;

  constructor(canvas: OffscreenCanvas, dpr: number = 2) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = dpr;
  }

  public render(data: any) {
    const { bids, asks, maxDepth } = data;
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);
    
    const rowHeight = 22 * this.dpr;
    const halfHeight = height / 2;

    // Render Asks (Top, Red)
    asks.slice(0, 20).reverse().forEach((ask: any, i: number) => {
      const y = halfHeight - (i + 1) * rowHeight;
      this.drawRow(ask, y, '#FF4466', maxDepth, 'ask');
    });

    // Render Bids (Bottom, Green)
    bids.slice(0, 20).forEach((bid: any, i: number) => {
      const y = halfHeight + i * rowHeight + 40; // Offset for price ticker
      this.drawRow(bid, y, '#00FF66', maxDepth, 'bid');
    });
  }

  private drawRow(row: any, y: number, color: string, maxDepth: bigint, type: string) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const depthWidth = Number((row.total * BigInt(width)) / maxDepth);

    // Depth Bar
    ctx.fillStyle = type === 'bid' ? 'rgba(0, 255, 102, 0.08)' : 'rgba(255, 68, 102, 0.08)';
    ctx.fillRect(width - depthWidth, y, depthWidth, 20 * this.dpr);

    // Text (Simulated for high-perf, usually text is layered via DOM or heavy Canvas text)
    ctx.font = `${11 * this.dpr}px "JetBrains Mono"`;
    ctx.fillStyle = color;
    ctx.fillText(this.formatBigInt(row.price), 10 * this.dpr, y + 14 * this.dpr);
    
    ctx.fillStyle = '#f8fbff';
    ctx.textAlign = 'right';
    ctx.fillText(this.formatBigInt(row.volume), width - 80 * this.dpr, y + 14 * this.dpr);
    
    ctx.fillStyle = '#64748b';
    ctx.fillText(this.formatBigInt(row.total), width - 10 * this.dpr, y + 14 * this.dpr);
    ctx.textAlign = 'left';
  }

  private formatBigInt(val: bigint): string {
    const s = val.toString().padStart(10, '0');
    return `${s.slice(0, -9)}.${s.slice(-9, -5)}`;
  }
}
