import { CHAPTERS, type ChapterConfig } from '../config/chapters';
import { SITE_CONFIG } from '../config/site';
import { PORTFOLIO_CONTENT } from '../content/portfolio';
import type { OverlayId } from '../engine/scrollMapper';
import { RichText, stripBoldMarkers } from './RichText';
import { SplitReveal } from './SplitReveal';

interface ChaptersProps {
  activeOverlayId: OverlayId;
  isJump: boolean;
}

const LAYOUT_CLASSES: Record<ChapterConfig['layout'], string> = {
  'bottom-left': 'items-end justify-start pb-14 sm:pb-20 pl-6 sm:pl-14 pr-14',
  'top-left': 'items-start justify-start pt-24 sm:pt-28 pl-6 sm:pl-14 pr-14',
  'bottom-right':
    'items-end justify-end pb-14 sm:pb-20 pr-14 sm:pr-44 md:pr-52 pl-6 text-right',
  'center-low': 'items-end justify-center pb-14 sm:pb-20 px-6 text-center',
};

const SCRIM_CLASSES: Record<ChapterConfig['layout'], string> = {
  'bottom-left':
    'bg-gradient-to-tr from-[#0c0a08]/88 via-[#0c0a08]/50 to-transparent',
  'top-left':
    'bg-gradient-to-br from-[#0c0a08]/88 via-[#0c0a08]/45 to-transparent',
  'bottom-right':
    'bg-gradient-to-tl from-[#0c0a08]/88 via-[#0c0a08]/50 to-transparent',
  'center-low':
    'bg-gradient-to-t from-[#0c0a08]/92 via-[#0c0a08]/55 to-transparent',
};

export function Chapters({ activeOverlayId, isJump }: ChaptersProps) {
  const { hero, stops, ui } = PORTFOLIO_CONTENT;
  const isHero = activeOverlayId === 'intro-hero';

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* INTRO: HERO PANEL (canvas clamped on frame 0) */}
      <section
        aria-hidden={!isHero}
        aria-label={hero.name}
        className={`absolute inset-0 flex transition-opacity duration-400 ease-out ${LAYOUT_CLASSES['bottom-left']} ${
          isHero ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${SCRIM_CLASSES['bottom-left']} ${
            isHero ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="relative z-10 max-w-2xl">
          <SplitReveal
            as="p"
            mode="fade"
            delay={0}
            active={isHero}
            immediate={isJump}
            ariaText={hero.subtitle}
            className="text-[11px] uppercase tracking-[0.28em] text-[#d4a359]"
          >
            {hero.subtitle}
          </SplitReveal>

          <SplitReveal
            as="h1"
            mode="lines"
            delay={0.12}
            active={isHero}
            immediate={isJump}
            ariaText={hero.name}
            className="font-display mt-2 text-4xl font-normal leading-[1.02] tracking-tight text-[#efe8dc] sm:text-6xl md:text-7xl"
          >
            {hero.name}
          </SplitReveal>

          <SplitReveal
            as="p"
            mode="fade"
            delay={0.24}
            active={isHero}
            immediate={isJump}
            ariaText={hero.title}
            className="mt-2 text-sm font-medium tracking-[0.06em] text-[#efe8dc]/90 sm:text-base"
          >
            {hero.title}
          </SplitReveal>

          <SplitReveal
            as="p"
            mode="words"
            delay={0.34}
            active={isHero}
            immediate={isJump}
            ariaText={stripBoldMarkers(hero.statement)}
            className="mt-4 max-w-xl text-sm leading-relaxed text-[#efe8dc]/88 sm:text-base"
          >
            <RichText text={hero.statement} />
          </SplitReveal>

          <SplitReveal
            as="div"
            mode="fade"
            delay={0.48}
            active={isHero}
            immediate={isJump}
            ariaText={hero.location}
            className="mt-5 flex flex-wrap items-center gap-4 text-xs tracking-[0.14em] text-[#b7ab98]"
          >
            <span>{hero.location}</span>
            {hero.showreelUrl && (
              <a
                href={hero.showreelUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-[#d4a359]/60 px-4 py-1.5 uppercase tracking-[0.2em] text-[#efe8dc] transition-colors hover:border-[#d4a359] hover:bg-[#d4a359]/15"
              >
                View Showreel
              </a>
            )}
            {hero.email && (
              <a
                href={`mailto:${hero.email}`}
                className="border border-[#efe8dc]/25 px-4 py-1.5 uppercase tracking-[0.2em] text-[#efe8dc] transition-colors hover:border-[#efe8dc]/50"
              >
                Email Me
              </a>
            )}
            {hero.handle && (
              <a
                href={hero.handleUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-[#d4a359]/50 bg-[#0c0a08]/55 px-3.5 py-1.5 text-[#d4a359] transition-colors hover:border-[#d4a359] hover:bg-[#d4a359]/15"
              >
                {hero.handle}
              </a>
            )}
          </SplitReveal>
        </div>
      </section>

      {/* SIX STOPS = SIX DISCIPLINES */}
      {CHAPTERS.map((chapter, idx) => {
        const stop = stops[idx];
        if (!stop) return null;

        const isActive = activeOverlayId === `stop-${idx}`;
        const isTurquoise = chapter.accent === 'turquoise';
        const isRight = chapter.layout === 'bottom-right';
        const isCenter = chapter.layout === 'center-low';

        const labelText = SITE_CONFIG.showLandmarkLabel
          ? `${stop.number} · ${stop.landmark.toUpperCase()}`
          : stop.number;

        return (
          <section
            key={chapter.id}
            aria-hidden={!isActive}
            aria-label={`${stop.discipline}, ${stop.landmark}`}
            className={`absolute inset-0 flex transition-opacity duration-400 ease-out ${LAYOUT_CLASSES[chapter.layout]} ${
              isActive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${SCRIM_CLASSES[chapter.layout]} ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <div
              className={`relative z-10 max-w-xl ${
                isCenter ? 'mx-auto flex flex-col items-center' : ''
              }`}
            >
              {/* 1. Small label: index + simple English landmark name */}
              <SplitReveal
                as="p"
                mode="fade"
                delay={0}
                active={isActive}
                immediate={isJump}
                ariaText={labelText}
                className={`text-[11px] font-medium uppercase tracking-[0.28em] ${
                  isTurquoise ? 'text-[#2a8c82]' : 'text-[#d4a359]'
                }`}
              >
                {labelText}
              </SplitReveal>

              {/* 2. Discipline title (large serif) */}
              <SplitReveal
                as="h2"
                mode="lines"
                delay={0.1}
                active={isActive}
                immediate={isJump}
                ariaText={stop.discipline}
                className="font-display mt-2 text-4xl font-normal leading-[1.03] tracking-tight text-[#efe8dc] sm:text-5xl md:text-6xl"
              >
                {stop.discipline}
              </SplitReveal>

              {/* 3. One intro sentence */}
              <SplitReveal
                as="p"
                mode="lines"
                delay={0.22}
                active={isActive}
                immediate={isJump}
                ariaText={stop.intro}
                className="mt-3 max-w-md text-sm leading-relaxed text-[#efe8dc]/90 sm:text-base"
              >
                {stop.intro}
              </SplitReveal>

              {/* 4. "How I work": 3 short numbered steps */}
              <div className="mt-4">
                <SplitReveal
                  as="p"
                  mode="fade"
                  delay={0.34}
                  active={isActive}
                  immediate={isJump}
                  ariaText={ui.howIWorkLabel}
                  className="text-[10px] uppercase tracking-[0.26em] text-[#b7ab98]"
                >
                  {ui.howIWorkLabel}
                </SplitReveal>

                <ol className="mt-2 space-y-1.5">
                  {stop.steps.map((step, sIdx) => (
                    <SplitReveal
                      key={sIdx}
                      as="li"
                      mode="fade"
                      delay={0.4 + sIdx * 0.1}
                      active={isActive}
                      immediate={isJump}
                      ariaText={`0${sIdx + 1} ${step}`}
                      className={`flex items-baseline gap-2.5 text-xs leading-snug text-[#efe8dc]/82 sm:text-sm ${
                        isRight
                          ? 'justify-end'
                          : isCenter
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span
                        className={`text-[10px] tabular-nums ${
                          isTurquoise ? 'text-[#2a8c82]' : 'text-[#d4a359]'
                        }`}
                      >
                        0{sIdx + 1}
                      </span>
                      <span>{step}</span>
                    </SplitReveal>
                  ))}
                </ol>
              </div>

              {/* 5. "In practice": related project names */}
              <SplitReveal
                as="p"
                mode="fade"
                delay={0.72}
                active={isActive}
                immediate={isJump}
                ariaText={`${ui.inPracticeLabel}: ${stop.inPractice}`}
                className="mt-4 border-t border-[#efe8dc]/15 pt-3 text-xs tracking-[0.06em] text-[#b7ab98]"
              >
                <span className="uppercase tracking-[0.2em] text-[#d4a359]/90">
                  {ui.inPracticeLabel}:{' '}
                </span>
                <span className="text-[#efe8dc]/90">{stop.inPractice}</span>
              </SplitReveal>
            </div>
          </section>
        );
      })}
    </div>
  );
}
