import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { SITE_CONFIG } from '../config/site';

gsap.registerPlugin(SplitText, ScrollTrigger);

export type SplitRevealMode = 'lines' | 'words' | 'fade';

interface SplitRevealProps {
  children: ReactNode;
  /** Plain-text string for screen readers (split spans are aria-hidden) */
  ariaText: string;
  /** Controlled mode (journey stops): plays when true, reverses when false */
  active?: boolean;
  /** Viewport ScrollTrigger mode (Cream Projects Sheet): replays on re-entry */
  scrollTrigger?: boolean;
  immediate?: boolean;
  mode?: SplitRevealMode;
  delay?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  className?: string;
  as?: 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'span' | 'li' | 'ul';
}

export function SplitReveal({
  children,
  ariaText,
  active = false,
  scrollTrigger = false,
  immediate = false,
  mode = 'lines',
  delay = 0,
  duration,
  stagger,
  ease = SITE_CONFIG.splitReveal.ease,
  className = '',
  as: Tag = 'div',
}: SplitRevealProps) {
  const elRef = useRef<HTMLElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const splitRef = useRef<SplitText | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let disposed = false;
    let resizeTimer: number | null = null;
    let lastWidth = el.offsetWidth;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const buildTimeline = () => {
      if (disposed || !elRef.current) return;

      stRef.current?.kill();
      stRef.current = null;
      tlRef.current?.kill();
      splitRef.current?.revert();
      splitRef.current = null;

      const elNode = elRef.current;
      const resolvedDuration =
        duration ??
        (mode === 'fade'
          ? SITE_CONFIG.splitReveal.fadeDuration
          : mode === 'words'
          ? SITE_CONFIG.splitReveal.wordsDuration
          : SITE_CONFIG.splitReveal.linesDuration);

      const resolvedStagger =
        stagger ??
        (mode === 'words'
          ? SITE_CONFIG.splitReveal.wordsStagger
          : SITE_CONFIG.splitReveal.linesStagger);

      const tl = gsap.timeline({ paused: true });

      if (reducedMotion || mode === 'fade') {
        gsap.set(elNode, {
          opacity: 0,
          y: reducedMotion ? 0 : 16,
        });
        tl.to(elNode, {
          opacity: 1,
          y: 0,
          duration: reducedMotion ? 0.3 : resolvedDuration,
          ease,
          delay,
        });
      } else {
        const splitType = mode === 'words' ? 'words' : 'lines';
        const split = SplitText.create(elNode, {
          type: splitType,
          mask: splitType,
          linesClass: 'split-line',
          wordsClass: 'split-word',
          aria: 'none',
        });
        splitRef.current = split;

        const targets = mode === 'words' ? split.words : split.lines;
        if (targets.length > 0) {
          targets.forEach((node) => node.setAttribute('aria-hidden', 'true'));
          gsap.set(elNode, { opacity: 1, y: 0 });
          gsap.set(targets, { yPercent: 110, opacity: 1 });
          tl.to(targets, {
            yPercent: 0,
            duration: resolvedDuration,
            stagger: resolvedStagger,
            ease,
            delay,
          });
        } else {
          gsap.set(elNode, { opacity: 0 });
          tl.to(elNode, { opacity: 1, duration: resolvedDuration, ease, delay });
        }
      }

      tlRef.current = tl;

      if (scrollTrigger) {
        stRef.current = ScrollTrigger.create({
          trigger: elNode,
          start: 'top 95%',
          end: 'bottom 5%',
          onEnter: () => tl.timeScale(1).play(),
          onEnterBack: () => tl.timeScale(1).play(),
          onLeave: () => tl.timeScale(1.8).reverse(),
          onLeaveBack: () => tl.timeScale(1.8).reverse(),
        });
        if (stRef.current.isActive) {
          tl.progress(1);
        }
      } else {
        tl.progress(activeRef.current ? 1 : 0);
      }
    };

    const init = async () => {
      try {
        await document.fonts.ready;
      } catch {
        // Proceed if fonts API is unavailable
      }
      if (!disposed) {
        buildTimeline();
      }
    };

    void init();

    const ro = new ResizeObserver(() => {
      if (!elRef.current || disposed) return;
      const nextWidth = elRef.current.offsetWidth;
      if (Math.abs(nextWidth - lastWidth) > 2) {
        lastWidth = nextWidth;
        if (resizeTimer !== null) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          buildTimeline();
        }, 180);
      }
    });
    ro.observe(el);

    return () => {
      disposed = true;
      ro.disconnect();
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      stRef.current?.kill();
      tlRef.current?.kill();
      splitRef.current?.revert();
      splitRef.current = null;
    };
  }, [ariaText, mode, delay, duration, stagger, ease, scrollTrigger]);

  useEffect(() => {
    if (scrollTrigger) return;
    const tl = tlRef.current;
    if (!tl) return;

    if (immediate) {
      tl.pause(active ? tl.duration() : 0);
      return;
    }

    if (active) {
      tl.timeScale(1).play();
    } else {
      const dur = tl.duration() || 0.4;
      const exitScale = Math.max(1, dur / SITE_CONFIG.splitReveal.exitDuration);
      tl.timeScale(exitScale).reverse();
    }
  }, [active, immediate, scrollTrigger]);

  return (
    <Tag
      ref={elRef as never}
      aria-label={ariaText}
      className={className}
    >
      {children}
    </Tag>
  );
}
