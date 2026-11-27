import { PORTFOLIO_CONTENT } from '../content/portfolio';

interface LoaderProps {
  progress: number;
  isReady: boolean;
}

export function Loader({ progress, isReady }: LoaderProps) {
  return (
    <div
      aria-hidden={isReady}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0c0a08] px-6 transition-opacity duration-700 ease-out ${
        isReady ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <img
        src="/images/sasanium-logo.png"
        alt={PORTFOLIO_CONTENT.ui.brandMark}
        style={{ opacity: 0.45 + (Math.min(100, Math.max(0, progress)) / 100) * 0.55 }}
        className="h-28 w-auto select-none object-contain transition-opacity duration-200 sm:h-36"
      />
    </div>
  );
}
