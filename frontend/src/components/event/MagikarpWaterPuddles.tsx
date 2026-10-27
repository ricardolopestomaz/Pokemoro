import React from 'react';

interface Props {
  secondsUntilEvent: number;
  onOpenEventHub: () => void;
}

export function MagikarpWaterPuddles({ secondsUntilEvent, onOpenEventHub }: Props) {
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Poça d'água 1 (Canto Inferior Esquerdo) */}
      <div className="absolute bottom-28 left-8 w-20 h-8 rounded-[100%] bg-cyan-400/25 blur-[1px] border border-cyan-300/30 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
        <div className="absolute inset-0 rounded-full animate-ping opacity-25 bg-cyan-200" />
      </div>

      {/* Poça d'água 2 (Canto Inferior Direito) */}
      <div className="absolute bottom-36 right-12 w-24 h-10 rounded-[100%] bg-cyan-400/20 blur-[1px] border border-cyan-300/20 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
        <div className="absolute inset-1 rounded-full animate-ping opacity-20 bg-cyan-100 delay-500" />
      </div>

      {/* Holograma de Contagem Regressiva Flutuante no Lago */}
      <div className="pointer-events-auto absolute top-28 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={onOpenEventHub}
          className="group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.45)] hover:scale-105 active:scale-95 transition-all text-xs"
        >
          {/* Brilho pulsante */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 opacity-40 blur group-hover:opacity-80 transition duration-500 animate-pulse" />

          {/* Ícone saltitante do peixe */}
          <span className="relative text-base animate-bounce">🐟</span>

          <div className="relative text-left">
            <div className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-300 flex items-center gap-1">
              <span>Festival do Magikarp</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-[11px] font-mono font-bold text-white drop-shadow">
              ⏳ {formatCountdown(secondsUntilEvent)}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
