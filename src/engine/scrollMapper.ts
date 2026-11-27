import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CHAPTERS } from '../config/chapters';
import { SITE_CONFIG } from '../config/site';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export type OverlayId =
  | 'intro-hero'
  | 'stop-0'
  | 'stop-1'
  | 'stop-2'
  | 'stop-3'
  | 'stop-4'
  | 'stop-5'
  | null;

/**
 * Builds a monotonic Lookup Table mapping normalized journey progress (0..1)
 * to global frame index (0..totalFrames-1), gently slowing down inside each
 * chapter's `holdRange` so the camera lingers at each landmark.
 */
export function buildProgressToFrameLUT(totalFrames: number): Float32Array {
  const steps = 2000;
  const weights = new Float32Array(totalFrames);

  for (let f = 0; f < totalFrames; f++) {
    let w = 1.0;
    for (const ch of CHAPTERS) {
      const [hStart, hEnd] = ch.holdRange;
      if (f >= hStart && f <= hEnd) {
        w = 1.0 + SITE_CONFIG.holdSlowdownStrength * 2.2;
        break;
      }
    }
    weights[f] = w;
  }

  const cumulative = new Float32Array(totalFrames);
  let totalWeight = 0;
  for (let f = 0; f < totalFrames; f++) {
    totalWeight += weights[f];
    cumulative[f] = totalWeight;
  }

  const lut = new Float32Array(steps + 1);
  let frameCursor = 0;
  for (let s = 0; s <= steps; s++) {
    const targetWeight = (s / steps) * totalWeight;
    while (frameCursor < totalFrames - 1 && cumulative[frameCursor] < targetWeight) {
      frameCursor++;
    }
    lut[s] = frameCursor;
  }
  lut[steps] = totalFrames - 1;
  return lut;
}

export function sampleFrameFromLUT(lut: Float32Array, progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  const pos = clamped * (lut.length - 1);
  const low = Math.floor(pos);
  const high = Math.min(lut.length - 1, low + 1);
  const frac = pos - low;
  return lut[low] + (lut[high] - lut[low]) * frac;
}

export function findProgressForFrame(lut: Float32Array, targetFrame: number): number {
  for (let i = 0; i < lut.length; i++) {
    if (lut[i] >= targetFrame) {
      return i / (lut.length - 1);
    }
  }
  return 1;
}

export interface ScrollEngineCallbacks {
  onFrameChange: (targetFrame: number, progress: number, velocity: number) => void;
  onChapterChange: (chapterIndex: number) => void;
  onOverlayChange: (overlayId: OverlayId, isJump: boolean) => void;
  onVignetteChange: (opacity: number) => void;
  onSheetStateChange: (sheetRising: boolean, sheetCovering: boolean) => void;
}

export interface ScrollEngineHandle {
  scrollToFrame: (frameIndex: number) => void;
  scrollToTop: () => void;
  scrollToElement: (selector: string) => void;
  getScrollVelocity: () => number;
  dispose: () => void;
}

function getHoldBounds(totalFrames: number) {
  const vh = document.documentElement.clientHeight || window.innerHeight || 800;
  const introPx = (SITE_CONFIG.introHoldVh / 100) * vh;
  const outroPx = (SITE_CONFIG.outroHoldVh / 100) * vh;
  const journeyPx = totalFrames * SITE_CONFIG.pxPerFrame;
  const trackScrollMax = Math.max(1, introPx + journeyPx + outroPx);
  return {
    introEnd: introPx / trackScrollMax,
    outroStart: (introPx + journeyPx) / trackScrollMax,
    trackScrollMax,
  };
}

export function initScrollEngine(
  scrollContainer: HTMLElement,
  totalFrames: number,
  callbacks: ScrollEngineCallbacks
): ScrollEngineHandle {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lut = buildProgressToFrameLUT(totalFrames);

  const lenis = new Lenis({
    lerp: reducedMotion ? 1 : SITE_CONFIG.lenisLerp,
    smoothWheel: !reducedMotion,
    syncTouch: false,
    wheelMultiplier: 0.95,
  });

  let currentVelocity = 0;
  let lastActiveChapter = 0;
  let lastOverlayId: OverlayId = 'intro-hero';
  let lastSheetRising = false;
  let lastSheetCovering = false;
  let isProgrammaticJump = false;

  const updateSheetCoverage = (scrollY: number) => {
    const { trackScrollMax, outroStart } = getHoldBounds(totalFrames);
    const p = Math.max(0, Math.min(1, scrollY / trackScrollMax));
    const rising = p > outroStart + 0.002;
    const covering = scrollY >= trackScrollMax - 2;
    if (rising !== lastSheetRising || covering !== lastSheetCovering) {
      lastSheetRising = rising;
      lastSheetCovering = covering;
      callbacks.onSheetStateChange(rising, covering);
    }
  };

  lenis.on('scroll', (e: { velocity?: number; scroll?: number }) => {
    currentVelocity = e.velocity ?? 0;
    updateSheetCoverage(e.scroll ?? window.scrollY);
    ScrollTrigger.update();
  });

  const tickerCallback = (time: number) => {
    lenis.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  const st = ScrollTrigger.create({
    trigger: scrollContainer,
    start: 'top top',
    end: 'bottom bottom',
    scrub: reducedMotion ? 0 : SITE_CONFIG.scrollScrub,
    onUpdate: (self) => {
      const { introEnd, outroStart } = getHoldBounds(totalFrames);
      const p = self.progress;

      let targetFrame = 0;
      let activeOverlay: OverlayId = null;
      let activeIdx = lastActiveChapter;
      let isDarkMoment = false;

      if (p < introEnd) {
        // Clamped on frame 0 during Intro
        targetFrame = 0;
        activeIdx = 0;
        const introLocal = introEnd > 0 ? p / introEnd : 1;
        activeOverlay = introLocal < 0.9 ? 'intro-hero' : null;
      } else if (p > outroStart) {
        // Clamped on final frame while Cream Projects Sheet rises
        targetFrame = totalFrames - 1;
        activeIdx = CHAPTERS.length - 1;
        activeOverlay = null;
      } else {
        const journeySpan = Math.max(0.0001, outroStart - introEnd);
        const journeyProgress = (p - introEnd) / journeySpan;
        targetFrame = sampleFrameFromLUT(lut, journeyProgress);
        const rounded = Math.round(targetFrame);

        for (let i = 0; i < CHAPTERS.length; i++) {
          const ch = CHAPTERS[i];
          if (rounded >= ch.startFrame && rounded <= ch.endFrame) {
            activeIdx = i;
            activeOverlay = `stop-${i}` as OverlayId;
            if (ch.darkMoment && rounded >= ch.holdRange[0] - 12 && rounded <= ch.holdRange[1] + 12) {
              isDarkMoment = true;
            }
            break;
          }
          if (rounded > ch.endFrame) {
            activeIdx = i;
          }
        }
      }

      callbacks.onFrameChange(targetFrame, p, currentVelocity);

      if (activeIdx !== lastActiveChapter) {
        lastActiveChapter = activeIdx;
        callbacks.onChapterChange(activeIdx);
      }

      if (activeOverlay !== lastOverlayId) {
        lastOverlayId = activeOverlay;
        callbacks.onOverlayChange(activeOverlay, isProgrammaticJump);
      }

      callbacks.onVignetteChange(
        isDarkMoment ? SITE_CONFIG.vignetteDarkBoost : SITE_CONFIG.vignetteBaseOpacity
      );
    },
  });

  const scrollToFrame = (frameIndex: number) => {
    const { introEnd, outroStart, trackScrollMax } = getHoldBounds(totalFrames);
    const journeyProgress = findProgressForFrame(lut, frameIndex);
    const overallProgress = introEnd + journeyProgress * (outroStart - introEnd);
    const targetY = Math.max(0, Math.min(trackScrollMax, overallProgress * trackScrollMax));

    isProgrammaticJump = true;
    lenis.scrollTo(targetY, {
      duration: reducedMotion ? 0 : 1.35,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      onComplete: () => {
        isProgrammaticJump = false;
      },
    });
  };

  const scrollToTop = () => {
    isProgrammaticJump = true;
    lenis.scrollTo(0, {
      duration: reducedMotion ? 0 : 1.35,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      onComplete: () => {
        isProgrammaticJump = false;
      },
    });
  };

  const scrollToElement = (selector: string) => {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) return;
    lenis.scrollTo(target, {
      duration: reducedMotion ? 0 : 1.35,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
  };

  let lastWidth = window.innerWidth;
  let resizeTimer: number | null = null;
  const onWidthOrOrientationChange = () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 180);
  };
  const onOrientationChange = () => {
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      lastWidth = window.innerWidth;
      ScrollTrigger.refresh();
    }, 220);
  };
  window.addEventListener('resize', onWidthOrOrientationChange, { passive: true });
  window.addEventListener('orientationchange', onOrientationChange, { passive: true });

  return {
    scrollToFrame,
    scrollToTop,
    scrollToElement,
    getScrollVelocity: () => currentVelocity,
    dispose: () => {
      window.removeEventListener('resize', onWidthOrOrientationChange);
      window.removeEventListener('orientationchange', onOrientationChange);
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      st.kill();
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    },
  };
}
