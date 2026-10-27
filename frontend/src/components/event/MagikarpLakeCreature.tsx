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
  const [showBubble, setShowBubble] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.tap();
    playMagikarpCry(0.85);

    setShowBubble(true);
    setTapCount((prev) => prev + 1);

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
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto select-none w-[32%] max-w-[130px] z-11"
      style={{ left: '58%', top: '38%' }}
    >
      {/* Balão de Reação Estilo Pokémon Sleep ao interagir */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: -14, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-cyan-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-cyan-400/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)] backdrop-blur-md z-30 pointer-events-none"
          >
            <span>Karp! 🌊 {jumpMeters > 0 ? `${jumpMeters}m de salto` : 'Dia do Magikarp'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magikarp estático descansando no lago com o sprite e sombra Pokémon Sleep */}
      <motion.button
        type="button"
        onClick={handleClick}
        whileTap={{ scale: 0.94 }}
        className="relative block w-full cursor-pointer focus:outline-none select-none"
        title="Magikarp no Lago (Toque para interagir)"
        aria-label="Interagir com Magikarp"
      >
        <img
          src={spriteSrc}
          alt="Magikarp no Lago"
          className="w-full h-auto object-contain select-none pointer-events-none"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/sprites/menu/regular/0129.png';
          }}
        />
      </motion.button>
    </div>
  );
}

