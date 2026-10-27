import React, { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  studiedMinutes: number;
  onSaveScore: (meters: number) => void;
  highestRecord: number;
}

export function MagikarpJumpModal({
  isOpen,
  onClose,
  studiedMinutes,
  onSaveScore,
  highestRecord,
}: Props) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');
  const [timeLeft, setTimeLeft] = useState(8);
  const [taps, setTaps] = useState(0);
  const [meters, setMeters] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setGameState('intro');
      setTimeLeft(8);
      setTaps(0);
      setMeters(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  const startGame = () => {
    setGameState('playing');
    setTimeLeft(8);
    setTaps(0);
    setMeters(0);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;
    setTaps((prev) => {
      const nextTaps = prev + 1;
      // Multiplica os toques com bônus de minutos estudados!
      const bonusMultiplier = Math.max(1, Math.floor(studiedMinutes / 10));
      const calculatedMeters = nextTaps * (25 + bonusMultiplier * 5);
      setMeters(calculatedMeters);
      return nextTaps;
    });
  };

  const finishGame = () => {
    setGameState('result');
    setMeters((finalMeters) => {
      onSaveScore(finalMeters);
      return finalMeters;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/40 p-5 shadow-[0_10px_40px_rgba(6,182,212,0.3)] text-white overflow-hidden text-center flex flex-col items-center">
        
        {/* Fundo de Cachoeira */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/60 via-slate-950 to-blue-950/90 pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-sm z-20"
        >
          ✕
        </button>

        {gameState === 'intro' && (
          <div className="relative z-10 py-4 flex flex-col items-center space-y-3">
            <span className="text-4xl animate-bounce">🌊</span>
            <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300">
              Salto da Cachoeira
            </h3>
            <p className="text-xs text-slate-300 max-w-[260px] leading-relaxed">
              Dê impulsos ritmados no Magikarp para ele saltar contra a correnteza! Seus minutos de estudo aumentam a força do salto.
            </p>
            <div className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
              Bônus de Foco: +{studiedMinutes} min estudados
            </div>
            {highestRecord > 0 && (
              <div className="text-xs text-amber-300 font-semibold">
                🏆 Seu Recorde: {highestRecord} metros
              </div>
            )}
            <button
              onClick={startGame}
              className="mt-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Começar Salto!
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div
            onClick={handleTap}
            className="relative z-10 w-full py-6 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
          >
            <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider mb-1">
              ⏳ Tempo: {timeLeft}s
            </div>

            <div className="text-3xl font-mono font-black text-cyan-300 drop-shadow mb-4">
              {meters} <span className="text-xs text-cyan-400 font-bold">metros</span>
            </div>

            {/* Sprite do Magikarp saltando */}
            <div className="relative my-4">
              <img
                src="/assets/magikarp.gif"
                alt="Magikarp"
                className="w-24 h-24 object-contain animate-bounce"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/sprites/menu/regular/0129.png';
                }}
              />
            </div>

            <div className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg animate-pulse">
              Toque Rápido! ({taps} toques)
            </div>
            <span className="text-[10px] text-cyan-300/70 mt-2">Clique ou toque na tela para impulsionar</span>
          </div>
        )}

        {gameState === 'result' && (
          <div className="relative z-10 py-3 flex flex-col items-center space-y-3">
            {/* Polaroid Photo Card */}
            <div className="bg-slate-100 text-slate-900 p-3 pt-4 rounded-xl shadow-2xl border-4 border-white max-w-[240px] rotate-[-2deg] hover:rotate-0 transition-transform">
              <div className="h-32 bg-gradient-to-b from-sky-400 to-blue-700 rounded-lg flex items-center justify-center overflow-hidden relative shadow-inner">
                <img
                  src="/assets/magikarp_shiny.gif"
                  alt="Magikarp Salto"
                  className="w-20 h-20 object-contain drop-shadow"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/sprites/menu/regular/0129.png';
                  }}
                />
                <span className="absolute bottom-1 right-2 text-[9px] font-bold text-white/90">
                  {meters}m
                </span>
              </div>
              <div className="mt-2 text-center">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                  Salto Histórico
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  {new Date().toLocaleDateString('pt-BR')} • {taps} Impulsos
                </div>
              </div>
            </div>

            <div className="text-sm font-bold text-white mt-1">
              {meters >= (highestRecord || 1000) ? '🎉 NOVO RECORDE ALCANÇADO!' : 'Ótimo salto!'}
            </div>

            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={startGame}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-cyan-300 font-bold text-xs hover:bg-slate-700 transition-colors"
              >
                Tentar De Novo
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs hover:bg-cyan-400 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
