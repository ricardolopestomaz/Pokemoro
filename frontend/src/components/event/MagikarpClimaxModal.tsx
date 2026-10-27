import React, { useState, useEffect } from 'react';
import { sfx } from '../../lib/sfx';
import { playMagikarpCry, playGyaradosCry } from '../../lib/magikarpAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MagikarpClimaxModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<'storm' | 'leap' | 'lightning' | 'dragon'>('storm');

  useEffect(() => {
    if (!isOpen) {
      setStep('storm');
      return;
    }

    // Sequência Cinematográfica
    setStep('storm');

    const timer1 = setTimeout(() => {
      setStep('leap');
      playMagikarpCry(0.9);
      sfx.start();
    }, 2000);

    const timer2 = setTimeout(() => {
      setStep('lightning');
      sfx.warn();
    }, 4500);

    const timer3 = setTimeout(() => {
      setStep('dragon');
      playGyaradosCry(1.0);
      sfx.fanfare();
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fadeIn select-none overflow-hidden">
      
      {/* Relâmpagos no Fundo */}
      {(step === 'storm' || step === 'lightning') && (
        <div className="absolute inset-0 bg-white/20 animate-lightning mix-blend-overlay pointer-events-none" />
      )}

      {/* Chuva e Ondas */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-slate-950 to-cyan-950 opacity-80 pointer-events-none" />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        
        {step === 'storm' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-5xl animate-pulse">⚡</div>
            <h2 className="text-2xl font-black text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
              A Tempestade Mística Rugiu...
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              O foco inabalável dos estudantes rompeu as correntezas da cachoeira lendária.
            </p>
          </div>
        )}

        {step === 'leap' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="relative h-44 flex items-center justify-center">
              <img
                src="/assets/magikarp_shiny.gif"
                alt="Magikarp Saltando"
                className="w-36 h-36 object-contain animate-bounce drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/sprites/menu/shiny/0129_s.png';
                }}
              />
            </div>
            <h3 className="text-xl font-black text-amber-300 uppercase tracking-widest drop-shadow">
              O Salto para as Nuvens!
            </h3>
            <p className="text-xs text-cyan-200">
              Contra todas as probabilidades, o peixe alcança o topo da Porta do Dragão!
            </p>
          </div>
        )}

        {step === 'lightning' && (
          <div className="space-y-4 animate-pulse">
            <div className="relative h-44 flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full bg-red-600/60 blur-2xl animate-ping" />
              <div className="text-6xl animate-bounce">💥</div>
            </div>
            <h3 className="text-2xl font-black text-red-400 uppercase tracking-widest drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]">
              A FÚRIA DO DRAGÃO DESPERTA!
            </h3>
          </div>
        )}

        {step === 'dragon' && (
          <div className="space-y-5 animate-scaleIn flex flex-col items-center">
            {/* Confetes e Aura Dourada */}
            <div className="absolute -inset-10 bg-radial from-red-600/20 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-rose-600 blur-xl opacity-75 animate-pulse" />
              <img
                src="/assets/gyarados_shiny.gif"
                alt="Red Gyarados Shiny"
                className="relative w-48 h-48 object-contain drop-shadow-[0_0_35px_rgba(239,68,68,1)] animate-bounce"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/sprites/menu/shiny/0130_s.png';
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg mx-auto inline-block">
                Lendário • Red Gyarados Shiny
              </div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-red-400 to-rose-400 drop-shadow-md">
                A Ascensão do Dragão!
              </h2>
              <p className="text-xs text-slate-200 max-w-xs mx-auto leading-relaxed">
                Parabéns, Treinador! A meta global foi conquistada e o Gyarados Vermelho agora faz parte da sua jornada de foco.
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-3 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-red-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.7)] hover:scale-105 active:scale-95 transition-all"
            >
              Conquistar Glória! 🐉
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
