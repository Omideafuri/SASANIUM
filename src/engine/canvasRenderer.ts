import { SITE_CONFIG } from '../config/site';
import type { FrameAsset, FrameLoader } from './frameLoader';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private loader: FrameLoader;

  private targetFrame = 0;
  private currentFrame = 0;
  private lastDrawnIndex = -1;
  private lastGoodAsset: FrameAsset | null = null;

  private rafId: number | null = null;
  private resizeTimer: number | null = null;
  private disposed = false;
  private reducedMotion = false;

  constructor(canvas: HTMLCanvasElement, loader: FrameLoader) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('2D canvas context unavailable');
    }
    this.ctx = ctx;
    this.loader = loader;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.resizeCanvas();
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  setTargetFrame(frame: number, immediate = false): void {
    const clamped = Math.max(0, Math.min(this.loader.totalFrames - 1, frame));
    this.targetFrame = clamped;

    if (immediate || this.reducedMotion) {
      this.currentFrame = clamped;
      this.drawFrame(Math.round(clamped), true);
      return;
    }

    this.scheduleTick();
  }

  notifyFrameLoaded(index: number): void {
    const roundedCurrent = Math.round(this.currentFrame);
    // Redraw immediately if the newly loaded frame is the exact one we want,
    // or if we haven't drawn anything yet.
    if (index === roundedCurrent || this.lastDrawnIndex === -1) {
      this.drawFrame(roundedCurrent, true);
    }
  }

  private handleResize = (): void => {
    if (this.resizeTimer !== null) {
      window.clearTimeout(this.resizeTimer);
    }
    this.resizeTimer = window.setTimeout(() => {
      this.loader.updateProfileOnResize();
      this.resizeCanvas();
      this.drawFrame(Math.round(this.currentFrame), true);
    }, 120);
  };

  private resizeCanvas(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  private scheduleTick(): void {
    if (this.rafId !== null || this.disposed) return;
    this.rafId = window.requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    this.rafId = null;
    if (this.disposed) return;

    const diff = this.targetFrame - this.currentFrame;
    if (Math.abs(diff) < 0.01) {
      this.currentFrame = this.targetFrame;
      this.drawFrame(Math.round(this.currentFrame));
      return;
    }

    this.currentFrame += diff * SITE_CONFIG.frameEase;
    this.drawFrame(Math.round(this.currentFrame));

    if (Math.abs(this.targetFrame - this.currentFrame) >= 0.01) {
      this.scheduleTick();
    }
  };

  private drawFrame(requestedIndex: number, force = false): void {
    if (!force && requestedIndex === this.lastDrawnIndex) return;

    const found = this.loader.getNearestFrame(requestedIndex);
    const asset = found?.asset ?? this.lastGoodAsset;
    if (!asset) return;

    this.lastGoodAsset = asset;
    if (found) {
      this.lastDrawnIndex = found.index;
    }

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = 'naturalWidth' in asset ? asset.naturalWidth : asset.width;
    const ih = 'naturalHeight' in asset ? asset.naturalHeight : asset.height;

    if (!iw || !ih || !cw || !ch) return;

    // "object-fit: cover" math centered
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) * 0.5;
    const dy = (ch - dh) * 0.5;

    this.ctx.drawImage(asset, dx, dy, dw, dh);
  }

  dispose(): void {
    this.disposed = true;
    window.removeEventListener('resize', this.handleResize);
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
    }
    if (this.resizeTimer !== null) {
      window.clearTimeout(this.resizeTimer);
    }
  }
}
