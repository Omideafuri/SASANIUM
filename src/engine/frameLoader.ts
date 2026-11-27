import manifest from '../generated/frames.manifest.json';
import { SITE_CONFIG } from '../config/site';

export type FrameAsset = ImageBitmap | HTMLImageElement;

export interface FrameSourceProfile {
  mode: 'webp-desktop' | 'webp-mobile' | 'webp-mobile-half' | 'jpg';
  isMobile: boolean;
  step: 1 | 2;
}

function getEffectiveConnection(): { saveData?: boolean; effectiveType?: string } {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  return nav.connection ?? {};
}

export function selectSourceProfile(): FrameSourceProfile {
  const isMobile = window.innerWidth < SITE_CONFIG.mobileBreakpoint;
  const conn = getEffectiveConnection();
  const slowConn =
    Boolean(conn.saveData) ||
    conn.effectiveType === '2g' ||
    conn.effectiveType === 'slow-2g' ||
    conn.effectiveType === '3g';

  if (SITE_CONFIG.preferWebp) {
    if (isMobile && slowConn && manifest.webp.mobileHalf) {
      return { mode: 'webp-mobile-half', isMobile, step: 2 };
    }
    if (isMobile && manifest.webp.mobile) {
      return { mode: 'webp-mobile', isMobile, step: 1 };
    }
    if (!isMobile && manifest.webp.desktop) {
      return { mode: 'webp-desktop', isMobile, step: 1 };
    }
  }

  return { mode: 'jpg', isMobile, step: 1 };
}

export function getFrameUrl(index: number, profile: FrameSourceProfile): string {
  const clamped = Math.max(0, Math.min(manifest.totalFrames - 1, index));
  const padded = String(clamped).padStart(4, '0');

  if (profile.mode === 'webp-mobile-half') {
    const evenIndex =
      clamped === manifest.totalFrames - 1 ? clamped : clamped - (clamped % 2);
    return `/frames-web/mobile-half/${String(evenIndex).padStart(4, '0')}.webp`;
  }
  if (profile.mode === 'webp-mobile') {
    return `/frames-web/mobile/${padded}.webp`;
  }
  if (profile.mode === 'webp-desktop') {
    return `/frames-web/desktop/${padded}.webp`;
  }
  return manifest.frames[clamped].jpg;
}

function isImageBitmap(asset: FrameAsset): asset is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && asset instanceof ImageBitmap;
}

async function decodeImage(url: string): Promise<FrameAsset> {
  if (typeof createImageBitmap === 'function') {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const blob = await res.blob();
    return createImageBitmap(blob);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

export class FrameLoader {
  private cache = new Map<number, FrameAsset>();
  private inflight = new Map<number, Promise<void>>();
  private failed = new Set<number>();
  private profile: FrameSourceProfile;
  private maxCache: number;
  private priorityCenter = 0;
  private backgroundRunning = false;
  private disposed = false;
  private onFrameReady?: (index: number) => void;

  constructor(onFrameReady?: (index: number) => void) {
    this.profile = selectSourceProfile();
    this.maxCache = this.profile.isMobile
      ? SITE_CONFIG.maxCachedFramesMobile
      : SITE_CONFIG.maxCachedFramesDesktop;
    this.onFrameReady = onFrameReady;
  }

  get totalFrames(): number {
    return manifest.totalFrames;
  }

  updateProfileOnResize(): void {
    const next = selectSourceProfile();
    if (next.mode !== this.profile.mode) {
      this.profile = next;
      this.maxCache = next.isMobile
        ? SITE_CONFIG.maxCachedFramesMobile
        : SITE_CONFIG.maxCachedFramesDesktop;
    }
  }

  setPriorityCenter(frameIndex: number): void {
    this.priorityCenter = Math.max(0, Math.min(this.totalFrames - 1, Math.round(frameIndex)));
  }

  /**
   * Returns the exact cached frame, or the nearest cached frame so the canvas
   * never flashes blank or black during fast scroll jumps.
   */
  getNearestFrame(targetIndex: number): { asset: FrameAsset; index: number } | null {
    const clamped = Math.max(0, Math.min(this.totalFrames - 1, Math.round(targetIndex)));
    const exact = this.cache.get(clamped);
    if (exact) return { asset: exact, index: clamped };

    // Search outward from targetIndex
    for (let offset = 1; offset < this.totalFrames; offset++) {
      const right = clamped + offset;
      if (right < this.totalFrames) {
        const assetR = this.cache.get(right);
        if (assetR) return { asset: assetR, index: right };
      }
      const left = clamped - offset;
      if (left >= 0) {
        const assetL = this.cache.get(left);
        if (assetL) return { asset: assetL, index: left };
      }
    }
    return null;
  }

  /**
   * Loads the initial chunk (first ~60 frames) and reports real progress.
   * Returns true if at least one frame loaded successfully.
   */
  async preloadInitial(
    onProgress: (loaded: number, total: number, percent: number) => void
  ): Promise<boolean> {
    const count = Math.min(SITE_CONFIG.initialPreloadCount, this.totalFrames);
    let completed = 0;
    let successes = 0;
    const indices = Array.from({ length: count }, (_, i) => i);

    let cursor = 0;
    const worker = async () => {
      while (cursor < indices.length && !this.disposed) {
        const idx = indices[cursor++];
        const ok = await this.loadSingle(idx);
        if (ok) successes++;
        completed++;
        const percent = Math.round((completed / count) * 100);
        onProgress(completed, count, percent);
      }
    };

    await Promise.all(
      Array.from({ length: SITE_CONFIG.preloadConcurrency }, worker)
    );

    return successes > 0;
  }

  /**
   * Progressively loads remaining frames in priority order (nearest to current scroll position first).
   */
  startBackgroundQueue(): void {
    if (this.backgroundRunning || this.disposed) return;
    this.backgroundRunning = true;

    const pickNextIndex = (): number | null => {
      // Pick the uncached, non-inflight frame nearest to priorityCenter within cache window
      const halfWindow = Math.floor(this.maxCache * 0.65);
      let bestIdx: number | null = null;
      let bestDist = Infinity;

      const minI = Math.max(0, this.priorityCenter - halfWindow);
      const maxI = Math.min(this.totalFrames - 1, this.priorityCenter + halfWindow);

      for (let i = minI; i <= maxI; i++) {
        if (this.cache.has(i) || this.inflight.has(i) || this.failed.has(i)) continue;
        const dist = Math.abs(i - this.priorityCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
          if (dist === 0) break;
        }
      }

      if (bestIdx !== null) return bestIdx;

      // If local window is full, only preload beyond window if cache still has room
      if (this.cache.size < this.maxCache) {
        for (let i = 0; i < this.totalFrames; i++) {
          if (this.cache.has(i) || this.inflight.has(i) || this.failed.has(i)) continue;
          const dist = Math.abs(i - this.priorityCenter);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }
      }
      return bestIdx;
    };

    const worker = async () => {
      while (!this.disposed) {
        const nextIdx = pickNextIndex();
        if (nextIdx === null) {
          // Wait briefly before re-checking (e.g. if user scrolls to a new area)
          await new Promise((r) => setTimeout(r, 180));
          continue;
        }
        await this.loadSingle(nextIdx);
      }
    };

    const workers = Math.max(2, Math.min(SITE_CONFIG.preloadConcurrency, 4));
    for (let i = 0; i < workers; i++) {
      void worker();
    }
  }

  /**
   * Ensures a specific frame and its immediate neighbors are requested with top priority.
   */
  prioritizeAround(frameIndex: number): void {
    this.setPriorityCenter(frameIndex);
    const center = this.priorityCenter;
    for (let d = 0; d <= 6; d++) {
      for (const idx of d === 0 ? [center] : [center + d, center - d]) {
        if (idx >= 0 && idx < this.totalFrames && !this.cache.has(idx) && !this.inflight.has(idx)) {
          void this.loadSingle(idx);
        }
      }
    }
  }

  private async loadSingle(index: number): Promise<boolean> {
    if (this.disposed || this.cache.has(index)) return true;
    const existing = this.inflight.get(index);
    if (existing) {
      await existing;
      return this.cache.has(index);
    }

    const promise = (async () => {
      const url = getFrameUrl(index, this.profile);
      try {
        const asset = await decodeImage(url);
        if (this.disposed) {
          if (isImageBitmap(asset)) asset.close();
          return;
        }
        this.evictIfNeeded(index);
        this.cache.set(index, asset);
        this.failed.delete(index);
        this.onFrameReady?.(index);
      } catch {
        // Fallback to original JPG if WebP failed
        if (this.profile.mode !== 'jpg') {
          try {
            const jpgUrl = manifest.frames[index].jpg;
            const asset = await decodeImage(jpgUrl);
            if (!this.disposed) {
              this.evictIfNeeded(index);
              this.cache.set(index, asset);
              this.failed.delete(index);
              this.onFrameReady?.(index);
              return;
            }
          } catch {
            // Fall through to failed set
          }
        }
        this.failed.add(index);
      } finally {
        this.inflight.delete(index);
      }
    })();

    this.inflight.set(index, promise);
    await promise;
    return this.cache.has(index);
  }

  private evictIfNeeded(incomingIndex: number): void {
    if (this.cache.size < this.maxCache) return;

    // Evict the cached frame farthest from priorityCenter (and not incomingIndex)
    let farthestKey: number | null = null;
    let maxDist = -1;
    for (const key of this.cache.keys()) {
      if (key === incomingIndex) continue;
      const dist = Math.abs(key - this.priorityCenter);
      if (dist > maxDist) {
        maxDist = dist;
        farthestKey = key;
      }
    }

    if (farthestKey !== null) {
      const evicted = this.cache.get(farthestKey);
      this.cache.delete(farthestKey);
      if (evicted && isImageBitmap(evicted)) {
        evicted.close();
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    for (const asset of this.cache.values()) {
      if (isImageBitmap(asset)) {
        asset.close();
      }
    }
    this.cache.clear();
    this.inflight.clear();
  }
}
