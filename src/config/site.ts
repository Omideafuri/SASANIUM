/**
 * Central configuration for all tunable engine, hold, and text-animation parameters.
 * Adjust scroll length, smoothing, cache limits, and reveal timings here.
 */
export const SITE_CONFIG = {
  /** Scroll distance per frame in pixels */
  pxPerFrame: 22,

  /** Extra scroll distance (in vh) clamped on frame 0 for Intro (Hero) */
  introHoldVh: 130,

  /** Extra scroll distance (in vh) clamped on the final frame while the cream sheet rises */
  outroHoldVh: 100,

  /** Show each stop's simple English landmark name as a quiet location label */
  showLandmarkLabel: true,

  /** GSAP ScrollTrigger scrub smoothing in seconds */
  scrollScrub: 0.45,

  /** Lenis smooth scroll lerp factor (lower = smoother/heavier) */
  lenisLerp: 0.085,

  /** Canvas rAF frame interpolation factor toward target frame (0.05..0.35) */
  frameEase: 0.18,

  /** How strongly hold zones slow down scroll-to-frame progression (0 = off, 0.55 = gentle dwell) */
  holdSlowdownStrength: 0.55,

  /** Number of initial frames to preload before dismissing the loading screen */
  initialPreloadCount: 60,

  /** Bounded ImageBitmap cache size (desktop / mobile) to protect GPU memory */
  maxCachedFramesDesktop: 160,
  maxCachedFramesMobile: 90,

  /** Concurrent frame fetches during background priority loading */
  preloadConcurrency: 6,

  /** Enable Three.js floating golden dust overlay (set false to disable completely) */
  particlesEnabled: true,

  /** Enable subtle film grain overlay */
  grainEnabled: true,

  /** Base vignette opacity (0..1) and boosted opacity during dark architectural moments */
  vignetteBaseOpacity: 0.36,
  vignetteDarkBoost: 0.72,

  /** Prefer optimized WebP frames in /frames-web when available */
  preferWebp: true,

  /** Mobile breakpoint width in px */
  mobileBreakpoint: 768,

  /** Default SplitReveal editorial animation timings */
  splitReveal: {
    linesDuration: 1.2,
    linesStagger: 0.1,
    wordsDuration: 1.2,
    wordsStagger: 0.06,
    fadeDuration: 0.8,
    exitDuration: 0.4,
    ease: 'power3.out',
  },
} as const;
