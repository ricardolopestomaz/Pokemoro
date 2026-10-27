import React, { useMemo } from 'react';

interface Props {
  intensity?: 'light' | 'heavy' | 'storm';
}

export function MagikarpRainOverlay({ intensity = 'heavy' }: Props) {
  // Gera posições e delays para 40 gotas de chuva sem causar re-renders
  const rainDrops = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${(i * 2.5 + Math.random() * 2).toFixed(1)}%`,
      top: `${-10 - Math.random() * 20}%`,
      duration: `${(0.6 + Math.random() * 0.4).toFixed(2)}s`,
      delay: `${(Math.random() * 1.5).toFixed(2)}s`,
      height: `${25 + Math.random() * 20}px`,
      opacity: (0.3 + Math.random() * 0.4).toFixed(2),
    }));
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(8, 28, 54, 0.45) 0%, rgba(14, 55, 99, 0.25) 50%, rgba(5, 20, 38, 0.5) 100%)',
      }}
    >
      {/* Flash de Relâmpago Ocasional */}
      <div className="absolute inset-0 animate-lightning opacity-0 bg-cyan-100/20 mix-blend-overlay pointer-events-none" />

      {/* Gotas de Chuva */}
      {rainDrops.map((drop) => (
        <div
          key={drop.id}
          className="absolute w-[1.5px] bg-gradient-to-b from-transparent via-cyan-200/80 to-blue-300 rounded-full animate-rainfall"
          style={{
            left: drop.left,
            top: drop.top,
            height: drop.height,
            opacity: Number(drop.opacity),
            animationDuration: drop.duration,
            animationDelay: drop.delay,
            transform: 'rotate(15deg)',
          }}
        />
      ))}

      {/* Névoa de Água na Base */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-blue-950/60 via-cyan-900/20 to-transparent blur-sm pointer-events-none" />

      {/* Partículas de Respingos sutis na parte inferior */}
      <div className="absolute bottom-6 left-1/4 w-32 h-2 rounded-full bg-cyan-300/20 blur-md animate-pulse" />
      <div className="absolute bottom-10 right-1/4 w-40 h-2 rounded-full bg-cyan-300/20 blur-md animate-pulse delay-700" />
    </div>
  );
}
