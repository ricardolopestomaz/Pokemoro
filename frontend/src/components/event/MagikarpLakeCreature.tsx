import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playMagikarpCry } from '../../lib/magikarpAudio';
import { sfx } from '../../lib/sfx';

interface Props {
  jumpMeters: number;
  onLaunchJumpGame: () => void;
  isShiny?: boolean;
}

export function MagikarpLakeCreature({ jumpMeters, onLaunchJumpGame, isShiny = false }: Props) {
  const [isLeaping, setIsLeaping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.tap();
    playMagikarpCry(0.85);

    setIsLeaping(true);
    setShowBubble(true);
    setTapCount((prev) => prev + 1);

    setTimeout(() => {
      setIsLeaping(false);
    }, 1200);

    setTimeout(() => {
      setShowBubble(false);
    }, 2400);

    // No terceiro toque consecutivo, convida direto para o desafio do salto!
    if (tapCount >= 2) {
      setTapCount(0);
      onLaunchJumpGame();
    }
  };

  const spriteSrc = isShiny ? '/sprites/menu/shiny/0129_s.png' : '/sprites/menu/regular/0129.png';

  return (
    <div className="absolute bottom-[240px] right-[24%] z-25 pointer-events-auto select-none">
      {/* Ondas na água */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-6 rounded-[100%] bg-cyan-400/30 blur-[1px] animate-ping opacity-40 pointer-events-none" />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-4 rounded-[100%] bg-blue-300/40 pointer-events-none" />

      {/* Balão de Reação Estilo Jogo */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-cyan-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] backdrop-blur-md z-30"
          >
            <span>Karp! 🌊 {jumpMeters > 0 ? `${jumpMeters}m de salto` : 'Toque de novo!'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* O Magikarp que salta com física elástica */}
      <motion.button
        type="button"
        onClick={handleClick}
        animate={
          isLeaping
            ? {
                y: [-10, -75, 0],
                rotate: [0, -25, 20, 0],
                scale: [1, 1.25, 1],
              }
            : {
                y: [0, -6, 0],
                rotate: [0, -3, 3, 0],
              }
        }
        transition={
          isLeaping
            ? { duration: 1.1, ease: 'easeOut' }
            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative block cursor-pointer group active:scale-90 transition-transform"
        title="Magikarp do Lago (Toque para ver o salto!)"
        aria-label="Interagir com Magikarp"
      >
        <img
          src={spriteSrc}
          alt="Magikarp no Lago"
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform -scale-x-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/sprites/menu/regular/0129.png';
          }}
        />

        {/* Respingos de água durante o salto */}
        {isLeaping && (
          <div className="absolute -bottom-2 inset-x-0 flex justify-around">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-white animate-ping delay-100" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping delay-200" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
