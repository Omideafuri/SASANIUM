import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import manifest from './generated/frames.manifest.json';
import { SITE_CONFIG } from './config/site';
import { FrameLoader } from './engine/frameLoader';
import { CanvasRenderer } from './engine/canvasRenderer';
import { initScrollEngine, type OverlayId, type ScrollEngineHandle } from './engine/scrollMapper';
import { Canvas } from './components/Canvas';
import { Chapters } from './components/Chapters';
import { ProgressRail } from './components/ProgressRail';
import { ProjectsSheet } from './components/ProjectsSheet';
import { Loader } from './components/Loader';
import { Grain } from './components/Grain';

const Particles = lazy(() => import('./components/Particles'));

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);
  const velocityRef = useRef<number>(0);
  const pausedBySheetRef = useRef<boolean>(false);
  const scrollEngineRef = useRef<ScrollEngineHandle | null>(null);
  const hintHiddenRef = useRef<boolean>(false);

  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [overlayState, setOverlayState] = useState<{ id: OverlayId; isJump: boolean }>({
    id: 'intro-hero',
    isJump: false,
  });
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [sheetRising, setSheetRising] = useState(false);
  const [sheetCovering, setSheetCovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scrollTrack = scrollTrackRef.current;
    if (!canvas || !scrollTrack) return;

    let renderer: CanvasRenderer | null = null;
    const loader = new FrameLoader((loadedIdx) => {
      renderer?.notifyFrameLoaded(loadedIdx);
    });

    try {
      renderer = new CanvasRenderer(canvas, loader);
    } catch {
      setHasError(true);
      setIsReady(true);
      return () => loader.dispose();
    }

    let scrollEngine: ScrollEngineHandle | null = null;
    let cancelled = false;

    void loader
      .preloadInitial((_loaded, _total, percent) => {
        if (!cancelled) {
          setLoadProgress(percent);
        }
      })
      .then((ok) => {
        if (cancelled) return;
        if (!ok) {
          setHasError(true);
          setIsReady(true);
          return;
        }

        renderer?.setTargetFrame(0, true);
        setIsReady(true);
        loader.startBackgroundQueue();

        scrollEngine = initScrollEngine(scrollTrack, manifest.totalFrames, {
          onFrameChange: (targetFrame, progress, velocity) => {
            velocityRef.current = velocity;
            if (!pausedBySheetRef.current) {
              loader.prioritizeAround(Math.round(targetFrame));
              renderer?.setTargetFrame(targetFrame);
            }

            if (!hintHiddenRef.current && progress > 0.015) {
              hintHiddenRef.current = true;
              setShowScrollHint(false);
            }
          },
          onChapterChange: (chapterIdx) => {
            setActiveChapterIndex(chapterIdx);
          },
          onOverlayChange: (id, isJump) => {
            setOverlayState({ id, isJump });
          },
          onVignetteChange: (opacity) => {
            if (vignetteRef.current) {
              vignetteRef.current.style.opacity = String(opacity);
            }
          },
          onSheetStateChange: (rising, covering) => {
            pausedBySheetRef.current = covering;
            setSheetRising(rising);
            setSheetCovering(covering);
          },
        });
        scrollEngineRef.current = scrollEngine;
      });

    return () => {
      cancelled = true;
      scrollEngine?.dispose();
      scrollEngineRef.current = null;
      renderer?.dispose();
      loader.dispose();
    };
  }, []);

  const handleJumpToChapter = useCallback((frameIndex: number) => {
    scrollEngineRef.current?.scrollToFrame(frameIndex);
  }, []);

  const handleJumpToTop = useCallback(() => {
    scrollEngineRef.current?.scrollToTop();
  }, []);

  const handleScrollToContact = useCallback(() => {
    scrollEngineRef.current?.scrollToElement('#sheet-contact');
  }, []);

  const getScrollVelocity = useCallback(() => {
    return scrollEngineRef.current?.getScrollVelocity() ?? 0;
  }, []);

  const totalScrollHeight = `calc(${SITE_CONFIG.introHoldVh}vh + ${
    manifest.totalFrames * SITE_CONFIG.pxPerFrame
  }px + ${SITE_CONFIG.outroHoldVh}vh + 100vh)`;

  return (
    <main className="relative bg-[#0c0a08]">
      <Loader progress={loadProgress} isReady={isReady} />

      <Canvas
        ref={canvasRef}
        hasError={hasError}
        hiddenBySheet={sheetCovering}
        vignetteRef={vignetteRef}
      />

      {SITE_CONFIG.particlesEnabled && isReady && !hasError && (
        <Suspense fallback={null}>
          <Particles velocityRef={velocityRef} paused={sheetCovering} />
        </Suspense>
      )}

      <Grain />

      <Chapters
        activeOverlayId={overlayState.id}
        isJump={overlayState.isJump}
      />

      <ProgressRail
        activeChapterIndex={activeChapterIndex}
        showScrollHint={showScrollHint}
        hiddenBySheet={sheetRising}
        onJumpToChapter={handleJumpToChapter}
        onJumpToTop={handleJumpToTop}
      />

      {/* Tall scroll container driving the single ScrollTrigger */}
      <div
        id="top"
        ref={scrollTrackRef}
        style={{ height: totalScrollHeight }}
        className="relative z-0 w-full"
        aria-hidden="true"
      />

      {/* Cream Projects Sheet rising over the final 100vh of the journey */}
      <ProjectsSheet
        onScrollToContact={handleScrollToContact}
        getScrollVelocity={getScrollVelocity}
      />
    </main>
  );
}

export default App;
