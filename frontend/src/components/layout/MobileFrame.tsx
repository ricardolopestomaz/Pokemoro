import type { ReactNode } from 'react';

/** Smartphone 9:16 centralizado no desktop; ocupa 100% da viewport no mobile. */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full flex items-center justify-center sm:p-3">
      <div
        id="mobile-frame-root"
        className="relative h-full w-full overflow-hidden bg-cream sm:h-[min(96vh,940px)] sm:w-auto sm:aspect-[9/16] sm:rounded-[2.5rem] sm:border-[10px] sm:border-white/80 sm:shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}
