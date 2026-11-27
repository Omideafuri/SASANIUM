import { forwardRef } from 'react';
import { SITE_CONFIG } from '../config/site';
import { PORTFOLIO_CONTENT } from '../content/portfolio';

interface CanvasProps {
  hasError: boolean;
  hiddenBySheet?: boolean;
  vignetteRef: React.RefObject<HTMLDivElement | null>;
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  ({ hasError, hiddenBySheet = false, vignetteRef }, ref) => {
    const { ui } = PORTFOLIO_CONTENT;

    if (hasError) {
      return (
        <div
          className="fixed inset-0 z-0 flex items-center justify-center bg-[#0c0a08]"
          role="region"
          aria-label={ui.fallbackTitle}
        >
          <img
            src="/frames/clip1/ezgif-frame-001.jpg"
            alt={ui.canvasAriaLabel}
            className="h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08] via-[#0c0a08]/60 to-[#0c0a08]/70" />
          <div className="relative z-10 max-w-md px-6 text-center">
            <p className="font-display text-3xl text-[#efe8dc]">
              {ui.fallbackTitle}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#b7ab98]">
              {ui.fallbackBody}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`fixed inset-0 z-0 overflow-hidden bg-[#0c0a08] ${
          hiddenBySheet ? 'invisible' : 'visible'
        }`}
      >
        <canvas
          ref={ref}
          role="img"
          aria-label={ui.canvasAriaLabel}
          className="block h-full w-full"
        />
        {/* Dynamic vignette: strengthens during dark architectural moments */}
        <div
          ref={vignetteRef}
          aria-hidden="true"
          style={{
            opacity: SITE_CONFIG.vignetteBaseOpacity,
            background:
              'radial-gradient(ellipse at center, transparent 42%, rgba(12, 10, 8, 0.72) 82%, rgba(12, 10, 8, 0.94) 100%)',
          }}
          className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
        />
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
