import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PORTFOLIO_CONTENT, type SheetProjectCard } from '../content/portfolio';
import { SplitReveal } from './SplitReveal';

gsap.registerPlugin(ScrollTrigger);

interface ProjectsSheetProps {
  onScrollToContact: () => void;
  getScrollVelocity: () => number;
}

const TONE_STYLES: Record<
  SheetProjectCard['tone'],
  { bg: string; text: string; num: string }
> = {
  ink: {
    bg: 'bg-[#14110D]',
    text: 'text-[#F3E9DA]',
    num: 'text-[#F3E9DA]/18',
  },
  accent: {
    bg: 'bg-[#B86B1F]',
    text: 'text-[#F3E9DA]',
    num: 'text-[#F3E9DA]/24',
  },
  sand: {
    bg: 'bg-[#E5D7C3]',
    text: 'text-[#14110D]',
    num: 'text-[#14110D]/14',
  },
};

export function ProjectsSheet({
  onScrollToContact,
  getScrollVelocity,
}: ProjectsSheetProps) {
  const { sheet, contact } = PORTFOLIO_CONTENT;

  const sheetRef = useRef<HTMLElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);
  const pill1Ref = useRef<HTMLSpanElement | null>(null);
  const pill2Ref = useRef<HTMLSpanElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const tickerTrackRef = useRef<HTMLDivElement | null>(null);
  const tickerHoveredRef = useRef(false);

  useEffect(() => {
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      // Top bar fades in as sheet rises into view
      if (topBarRef.current) {
        gsap.fromTo(
          topBarRef.current,
          { opacity: 0, y: reducedMotion ? 0 : 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sheetEl,
              start: 'top 55%',
              end: 'top 10%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      }

      // Rotated black pill stickers: scale from 0 with rotation overshoot + gentle idle wobble
      const pills = [pill1Ref.current, pill2Ref.current].filter(Boolean) as HTMLElement[];
      if (pills.length > 0) {
        const baseRotations = [-6, 5];
        const pillTl = gsap.timeline({
          scrollTrigger: {
            trigger: pill1Ref.current,
            start: 'top 85%',
            end: 'bottom 10%',
            onEnter: () => pillTl.play(),
            onEnterBack: () => pillTl.play(),
            onLeave: () => pillTl.reverse(),
            onLeaveBack: () => pillTl.reverse(),
          },
        });

        if (reducedMotion) {
          gsap.set(pills, { opacity: 0 });
          pillTl.to(pills, { opacity: 1, duration: 0.3, stagger: 0.1 });
        } else {
          pills.forEach((pill, i) => {
            gsap.set(pill, {
              scale: 0,
              opacity: 0,
              rotation: baseRotations[i] - 18,
            });
          });
          pillTl.to(pills, {
            scale: 1,
            opacity: 1,
            rotation: (i) => baseRotations[i],
            duration: 0.5,
            stagger: 0.12,
            ease: 'back.out(1.7)',
            delay: 0.35,
          });

          // Gentle idle wobble (±1.5deg)
          pills.forEach((pill, i) => {
            gsap.to(pill, {
              rotation: baseRotations[i] + (i === 0 ? 1.5 : -1.5),
              duration: 2.6 + i * 0.4,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: 0.9 + i * 0.2,
            });
          });
        }
      }

      // Project cards: per-card reveal so 1-col mobile stacks & 3-col desktop rows never stay hidden
      if (gridRef.current) {
        const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>('[data-sheet-card]'));

        cards.forEach((cardEl, idx) => {
          const cover = cardEl.querySelector<HTMLElement>('[data-card-cover]');
          const trailing = cardEl.querySelector<HTMLElement>('[data-card-trailing]');
          const colDelay = window.innerWidth >= 1024 ? (idx % 3) * 0.08 : window.innerWidth >= 768 ? (idx % 2) * 0.08 : 0;

          if (reducedMotion) {
            gsap.set(cardEl, { opacity: 0 });
            gsap.to(cardEl, {
              opacity: 1,
              duration: 0.35,
              scrollTrigger: {
                trigger: cardEl,
                start: 'top 95%',
                end: 'bottom 5%',
                toggleActions: 'play reverse play reverse',
              },
            });
            return;
          }

          if (cover) {
            gsap.set(cover, { clipPath: 'inset(100% 0% 0% 0%)', y: 20 });
          }
          if (trailing) {
            gsap.set(trailing, { scale: 0.6, opacity: 0 });
          }

          const cardTl = gsap.timeline({
            scrollTrigger: {
              trigger: cardEl,
              start: 'top 94%',
              end: 'bottom 6%',
              onEnter: () => cardTl.play(),
              onEnterBack: () => cardTl.play(),
              onLeave: () => cardTl.reverse(),
              onLeaveBack: () => cardTl.reverse(),
            },
          });

          if (cover) {
            cardTl.to(cover, {
              clipPath: 'inset(0% 0% 0% 0%)',
              y: 0,
              duration: 0.95,
              delay: colDelay,
              ease: 'power3.out',
            });
          }
          if (trailing) {
            cardTl.to(
              trailing,
              {
                scale: 1,
                opacity: 1,
                duration: 0.45,
                ease: 'back.out(1.6)',
              },
              colDelay + 0.3
            );
          }
        });
      }
    }, sheetRef);

    // Infinite horizontal tools ticker reacting to scroll velocity & direction
    let rafId = 0;
    let offset = 0;
    let direction = -1;
    let lastTime = performance.now();

    const tickTicker = (now: number) => {
      rafId = window.requestAnimationFrame(tickTicker);
      if (reducedMotion || document.hidden || tickerHoveredRef.current) {
        lastTime = now;
        return;
      }

      const track = tickerTrackRef.current;
      if (!track) return;

      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const vel = getScrollVelocity();
      if (Math.abs(vel) > 0.4) {
        direction = vel > 0 ? -1 : 1;
      }

      const baseSpeed = window.innerWidth < 768 ? 26 : 38;
      const speed = baseSpeed + Math.min(180, Math.abs(vel) * 6);
      offset += direction * speed * dt;

      const halfWidth = track.scrollWidth / 2;
      if (halfWidth > 0) {
        if (offset <= -halfWidth) offset += halfWidth;
        if (offset >= 0) offset -= halfWidth;
        track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      }
    };

    if (!reducedMotion) {
      rafId = window.requestAnimationFrame(tickTicker);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, [getScrollVelocity]);

  return (
    <section
      ref={sheetRef}
      aria-label="Selected Projects"
      className="font-sheet sheet-overlap relative z-40 w-full rounded-t-[32px] bg-[#F3E9DA] text-[#14110D] shadow-[0_-24px_80px_rgba(12,10,8,0.55)] sm:rounded-t-[40px]"
    >
      {/* Full-bleed repeating floral & swirling-stem background at 30% opacity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage: "url('/images/floral-pattern.webp')",
          backgroundRepeat: 'repeat',
          backgroundSize: '520px 520px',
          backgroundPosition: 'top center',
        }}
      />

      <div className="relative z-10">
      {/* Top Bar inside the Sheet (respects safe-area-inset-top on mobile) */}
      <div
        ref={topBarRef}
        className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-3 pb-6 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-12 sm:pb-8 sm:pt-10 md:grid-cols-3 lg:px-16"
      >
        <div className="justify-self-start">
          <span className="sheet-condensed inline-flex min-h-[36px] items-center rounded-full bg-[#14110D] px-4 py-1.5 text-xs uppercase tracking-[0.14em] text-[#F3E9DA]">
            {sheet.topBar.pill}
          </span>
        </div>

        <span className="hidden justify-self-center rounded-full bg-[#F3E9DA]/85 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#14110D] backdrop-blur-[2px] md:inline-block">
          {sheet.topBar.centerWordmark}
        </span>

        <div className="flex items-center gap-3 justify-self-end">
          <span className="hidden rounded-full bg-[#F3E9DA]/85 px-4 py-1.5 text-xs font-semibold tracking-[0.06em] text-[#14110D] backdrop-blur-[2px] sm:inline-block">
            {sheet.topBar.location}
          </span>
          <button
            type="button"
            onClick={onScrollToContact}
            className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-full bg-[#14110D] py-1.5 pl-4 pr-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#F3E9DA] transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-[#B86B1F]"
          >
            <span>{sheet.topBar.cta}</span>
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B86B1F] text-[#F3E9DA] transition-transform duration-300 group-hover:rotate-45"
            >
              ↗
            </span>
          </button>
        </div>
      </div>

      {/* Staggered Giant Headline + Rotated Black Pills */}
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-12 sm:pt-14 lg:px-16">
        <div className="relative">
          <div className="flex justify-end pr-1 sm:pr-12">
            <div className="relative inline-block">
              <SplitReveal
                as="h2"
                scrollTrigger
                mode="lines"
                duration={1.1}
                stagger={0.15}
                ariaText={`${sheet.headlineLine1} ${sheet.headlineLine2}`}
                className="sheet-headline text-right text-[clamp(2rem,9.2vw,7.2rem)] uppercase leading-[0.92] tracking-[-0.02em] text-[#14110D]"
              >
                {sheet.headlineLine1}
              </SplitReveal>
              <span
                ref={pill1Ref}
                className="sheet-condensed pointer-events-none absolute -bottom-3.5 left-1 z-10 inline-block rounded-full bg-[#14110D] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#F3E9DA] shadow-sm sm:-bottom-5 sm:-left-8 sm:px-5 sm:py-1.5 sm:text-sm"
              >
                {sheet.pill1}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-start sm:mt-9">
            <div className="relative inline-block">
              <SplitReveal
                as="div"
                scrollTrigger
                mode="lines"
                delay={0.15}
                duration={1.1}
                ariaText={sheet.headlineLine2}
                className="sheet-headline text-[clamp(2rem,9.2vw,7.2rem)] uppercase leading-[0.92] tracking-[-0.02em] text-[#14110D]"
              >
                {sheet.headlineLine2}
              </SplitReveal>
              <span
                ref={pill2Ref}
                className="sheet-condensed pointer-events-none absolute -right-1 -top-3.5 z-10 inline-block rounded-full bg-[#14110D] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#F3E9DA] shadow-sm sm:-right-12 sm:-top-3 sm:px-5 sm:py-1.5 sm:text-sm"
              >
                {sheet.pill2}
              </span>
            </div>
          </div>
        </div>

        {/* Accent-text Intro Paragraph — centered */}
        <SplitReveal
          as="p"
          scrollTrigger
          mode="lines"
          delay={0.1}
          ariaText={sheet.intro}
          className="mx-auto mt-12 max-w-2xl rounded-2xl bg-[#F3E9DA]/85 px-6 py-5 text-center text-lg font-semibold leading-relaxed text-[#7D420B] backdrop-blur-[2px] sm:mt-16 sm:px-8 sm:py-6 sm:text-2xl"
        >
          {sheet.intro}
        </SplitReveal>

        {/* 6-Card Project Grid */}
        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
        >
          {(sheet.cards as readonly SheetProjectCard[]).map((card) => {
            const tone = TONE_STYLES[card.tone];
            const hasDestination = Boolean(card.link || card.video);

            return (
              <article
                key={card.id}
                data-sheet-card
                className="group flex flex-col"
              >
                {/* Rounded Cover (24px radius) */}
                <div
                  data-card-cover
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-[24px] ${tone.bg} ${tone.text}`}
                >
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.name}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col justify-between p-5 transition-transform duration-500 ease-out group-hover:scale-[1.04] sm:p-7">
                      <span
                        aria-hidden="true"
                        className={`sheet-headline select-none text-5xl leading-none sm:text-7xl ${tone.num}`}
                      >
                        {card.number}
                      </span>
                      <div className="space-y-1.5">
                        <p className="sheet-condensed text-xl uppercase leading-[1.04] tracking-tight sm:text-3xl">
                          {card.name}
                        </p>
                        <p className="line-clamp-2 text-xs leading-relaxed opacity-80">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: uniform height across all cards */}
                <div className="mt-3.5 flex min-h-[88px] flex-1 items-center justify-between gap-3 rounded-2xl bg-[#F3E9DA]/85 px-4 py-3.5 backdrop-blur-[2px]">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="sheet-condensed mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#14110D]/25 bg-[#E5D7C3] text-xs uppercase text-[#14110D]"
                    >
                      {card.monogram}
                    </span>

                    <div className="min-w-0 space-y-1">
                      <SplitReveal
                        as="h3"
                        scrollTrigger
                        mode="lines"
                        ariaText={card.name}
                        className="sheet-condensed block text-base uppercase leading-snug tracking-tight text-[#14110D] sm:text-lg"
                      >
                        <span className="relative inline-block">
                          {card.name}
                          <span
                            aria-hidden="true"
                            className="absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-[#14110D] transition-transform duration-300 ease-out group-hover:scale-x-100"
                          />
                        </span>
                      </SplitReveal>

                      <SplitReveal
                        as="p"
                        scrollTrigger
                        mode="lines"
                        delay={0.08}
                        ariaText={card.category}
                        className="sheet-condensed block text-[11px] uppercase tracking-[0.14em] text-[#7D420B]"
                      >
                        {card.category}
                      </SplitReveal>
                    </div>
                  </div>

                  <div data-card-trailing className="shrink-0 pt-1">
                    {hasDestination ? (
                      <a
                        href={card.link || card.video}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${card.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B86B1F] text-[#F3E9DA] transition-transform duration-300 group-hover:rotate-45"
                      >
                        ↗
                      </a>
                    ) : (
                      <span className="sheet-condensed text-xs font-bold tracking-[0.12em] text-[#14110D]/80">
                        {card.year}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Tools Infinite Horizontal Marquee — solid Persian teal matching floral blossoms */}
      <div
        onMouseEnter={() => {
          tickerHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          tickerHoveredRef.current = false;
        }}
        className="mt-16 overflow-hidden border-y border-[#14110D]/20 bg-[#163F3E] py-4 text-[#F3E9DA] sm:mt-24 sm:py-6"
        aria-label="Tools and technologies"
      >
        <div
          ref={tickerTrackRef}
          className="flex w-max items-center whitespace-nowrap will-change-transform"
        >
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center" aria-hidden={dup === 1}>
              {sheet.toolsTicker.map((tool) => (
                <span
                  key={`${dup}-${tool}`}
                  className="sheet-condensed mx-4 text-xs uppercase tracking-[0.18em] text-[#F3E9DA] sm:mx-8 sm:text-base"
                >
                  {tool}
                  <span className="ml-8 text-[#E5A952] sm:ml-16" aria-hidden="true">
                    ·
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Block (respects safe-area-inset-bottom with extra bottom breathing room) */}
      <footer
        id="sheet-contact"
        className="mx-auto max-w-7xl px-5 pb-[max(5rem,calc(env(safe-area-inset-bottom)+3rem))] pt-14 sm:px-12 sm:pb-28 sm:pt-28 lg:px-16"
      >
        <div className="rounded-3xl bg-[#F3E9DA]/85 p-5 backdrop-blur-[2px] sm:p-10">
          <SplitReveal
            as="h2"
            scrollTrigger
            mode="words"
            stagger={0.06}
            ariaText={contact.headline}
            className="sheet-headline max-w-4xl text-[clamp(2rem,8.5vw,5.8rem)] uppercase leading-[0.94] tracking-[-0.02em] text-[#14110D]"
          >
            {contact.headline}
          </SplitReveal>

          <p className="mt-5 max-w-xl text-sm font-medium leading-relaxed text-[#14110D] sm:mt-6 sm:text-lg">
            {contact.text}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
            {contact.handle && (
              <a
                href={contact.handleUrl}
                target="_blank"
                rel="noreferrer"
                className="sheet-condensed inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#14110D] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#F3E9DA] transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-[#B86B1F]"
              >
                <span>{contact.handle}</span>
                <span aria-hidden="true" className="text-[#E5A952]">
                  ↗
                </span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="sheet-condensed inline-flex min-h-[44px] items-center rounded-full border border-[#14110D]/30 bg-[#F3E9DA] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#14110D]"
              >
                {contact.email}
              </a>
            )}
            {contact.linkedin && (
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="sheet-condensed inline-flex min-h-[44px] items-center rounded-full border border-[#14110D]/30 bg-[#F3E9DA] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#14110D]"
              >
                LinkedIn
              </a>
            )}
            {contact.x && (
              <a
                href={contact.x}
                target="_blank"
                rel="noreferrer"
                className="sheet-condensed inline-flex min-h-[44px] items-center rounded-full border border-[#14110D]/30 bg-[#F3E9DA] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#14110D]"
              >
                X
              </a>
            )}
            {contact.behance && (
              <a
                href={contact.behance}
                target="_blank"
                rel="noreferrer"
                className="sheet-condensed inline-flex min-h-[44px] items-center rounded-full border border-[#14110D]/30 bg-[#F3E9DA] px-6 py-3 text-xs uppercase tracking-[0.16em] text-[#14110D]"
              >
                Behance
              </a>
            )}
          </div>

          <div className="mt-14 border-t border-[#14110D]/20 pt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#14110D]/80">
            {contact.copyright}
          </div>
        </div>
      </footer>
      </div>
    </section>
  );
}
