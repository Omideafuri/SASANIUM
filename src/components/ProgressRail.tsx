import { CHAPTERS } from '../config/chapters';
import { PORTFOLIO_CONTENT } from '../content/portfolio';

interface ProgressRailProps {
  activeChapterIndex: number;
  showScrollHint: boolean;
  hiddenBySheet: boolean;
  onJumpToChapter: (frameIndex: number) => void;
  onJumpToTop: () => void;
}

export function ProgressRail({
  activeChapterIndex,
  showScrollHint,
  hiddenBySheet,
  onJumpToChapter,
  onJumpToTop,
}: ProgressRailProps) {
  const { ui, stops } = PORTFOLIO_CONTENT;

  return (
    <>
      {/* Top-left brand logo (fades out when cream sheet rises) */}
      <header
        aria-hidden={hiddenBySheet}
        className={`pointer-events-none fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-[#0c0a08]/55 via-[#0c0a08]/20 to-transparent px-6 pb-8 pt-5 transition-opacity duration-400 sm:px-10 sm:pt-7 ${
          hiddenBySheet ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <a
          href="#top"
          tabIndex={hiddenBySheet ? -1 : 0}
          aria-label={ui.brandMark}
          onClick={(e) => {
            e.preventDefault();
            onJumpToTop();
          }}
          className={`inline-flex items-center drop-shadow-[0_2px_10px_rgba(12,10,8,0.65)] transition-opacity hover:opacity-80 ${
            hiddenBySheet ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          <img
            src="/images/sasanium-logo.png"
            alt={ui.brandMark}
            className="h-12 w-auto select-none object-contain sm:h-16"
          />
        </a>
      </header>

      {/* Right-side vertical progress rail with 6 clickable dots */}
      <nav
        aria-label="Disciplines and landmarks"
        aria-hidden={hiddenBySheet}
        className={`fixed right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-4 transition-opacity duration-400 sm:right-8 ${
          hiddenBySheet ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {CHAPTERS.map((chapter, idx) => {
          const stop = stops[idx];
          const isActive = idx === activeChapterIndex;
          const isTurquoise = chapter.accent === 'turquoise';
          const label = stop
            ? `${stop.discipline}, ${stop.landmark}`
            : chapter.landmark;

          return (
            <button
              key={chapter.id}
              type="button"
              tabIndex={hiddenBySheet ? -1 : 0}
              onClick={() => onJumpToChapter(chapter.anchorFrame)}
              aria-label={label}
              aria-current={isActive ? 'step' : undefined}
              className="group relative flex min-h-[44px] min-w-[44px] items-center justify-end gap-3 py-1 focus-visible:outline-none sm:min-h-0 sm:min-w-0"
            >
              <span
                className={`pointer-events-none hidden text-[10px] uppercase tracking-[0.22em] transition-all duration-300 sm:inline-block ${
                  isActive
                    ? 'translate-x-0 text-[#efe8dc] opacity-100'
                    : 'translate-x-2 text-[#b7ab98] opacity-0 group-hover:translate-x-0 group-hover:opacity-90 group-focus-visible:translate-x-0 group-focus-visible:opacity-100'
                }`}
              >
                {label}
              </span>

              <span
                className={`block rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#d4a359] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#0c0a08] ${
                  isActive
                    ? `h-2.5 w-2.5 ring-4 ${
                        isTurquoise
                          ? 'bg-[#2a8c82] ring-[#2a8c82]/25'
                          : 'bg-[#d4a359] ring-[#d4a359]/25'
                      }`
                    : 'h-1.5 w-1.5 bg-[#efe8dc]/40 group-hover:scale-125 group-hover:bg-[#efe8dc]'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Scroll-down hint on load */}
      <div
        aria-hidden={!showScrollHint || hiddenBySheet}
        className={`pointer-events-none fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500 ${
          showScrollHint && !hiddenBySheet ? 'opacity-90' : 'opacity-0'
        }`}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#b7ab98]">
          {ui.scrollHint}
        </span>
        <span className="block h-6 w-[1px] bg-gradient-to-b from-[#d4a359] to-transparent" />
      </div>
    </>
  );
}
