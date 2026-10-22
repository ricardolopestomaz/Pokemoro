import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { PokemonImage } from './PokemonImage';
import { sfx } from '../../lib/sfx';
import type { SpawnedPokemon } from '../../types';

interface Props {
  spawn: SpawnedPokemon;
  index: number;
  onClick: (s: SpawnedPokemon) => void;
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Pokémon dormindo no cenário: respira continuamente com etiqueta limpa (nome + coração + pontos). */
export function PokemonSpawn({ spawn, index, onClick }: Props) {
  const h = hash(spawn.spawnId);
  const breath = 2.8 + (h % 14) / 10;

  const handleClick = () => {
    sfx.tap();
    onClick(spawn);
  };

  return (
    <motion.button
      id={`spawn-${spawn.spawnId}`}
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.12 * index }}
      whileTap={{ scale: 0.92 }}
      className="absolute z-10 w-[38%] -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none"
      style={{ left: `${spawn.canvasPosition.x * 100}%`, top: `${spawn.canvasPosition.y * 100}%` }}
      aria-label={`${spawn.pokemonName} dormindo`}
    >
      {/* Etiqueta flutuante: apenas nome do Pokémon com o coração e a quantidade de coração */}
      <div className="pointer-events-none absolute left-1/2 -top-5 z-20 flex -translate-x-1/2 flex-col items-center">
        <div className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-2.5 py-0.5 shadow-sm backdrop-blur-xs">
          <span className="text-[10px] font-black text-ocean-dark">
            {spawn.pokemonName}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-black text-love">
            <Heart size={10} fill="currentColor" />
            <span>{spawn.currentFriendshipPoints}/{spawn.maxFriendshipPoints}</span>
          </span>
        </div>
      </div>

      {/* Modelo animado com oscilação de respiração (sem sombra artificial) */}
      <motion.div
        animate={{ scaleY: [1, 1.045, 1], scaleX: [1, 0.992, 1] }}
        transition={{ duration: breath, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '50% 88%' }}
        className="relative"
      >
        <PokemonImage
          pokemonId={spawn.pokemonId}
          style={spawn.sleepStyle}
          variant={spawn.variant}
          alt={spawn.pokemonName}
          className="w-full"
        />
      </motion.div>
    </motion.button>
  );
}
