import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { PokemonImage } from './PokemonImage';
import { useGame } from '../../hooks/useGameState';
import { sfx } from '../../lib/sfx';
import type { SpawnedPokemon } from '../../types';

interface Props {
  spawn: SpawnedPokemon;
  index: number;
  onClick: (s: SpawnedPokemon) => void;
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function ZzzParticles() {
  return (
    <div className="pointer-events-none absolute -top-3 right-1 z-30 select-none" aria-hidden="true">
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.6, 1, 0.8], y: [-2, -18], x: [0, 5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 0.2 }}
        className="absolute text-[11px] font-black text-white/90 drop-shadow-md"
      >
        z
      </motion.span>
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.7, 1.1, 0.9], y: [-4, -25], x: [3, 11] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 1.4 }}
        className="absolute text-[13px] font-black text-sky-200/90 drop-shadow-md"
      >
        Z
      </motion.span>
    </div>
  );
}

/** Pokémon selvagem visitante dormindo tranquilamente no cenário, com expiração de 30 minutos por ciclo. */
export function PokemonSpawn({ spawn, index, onClick }: Props) {
  const { settings, removeSpawn } = useGame();
  const h = hash(spawn.spawnId);
  const breath = 2.8 + (h % 14) / 10;
  const [now, setNow] = useState(() => Date.now());

  // Timestamp fixo e persistente de expiração (30 minutos a partir do spawn)
  const expiresAt = useMemo(() => {
    if (spawn.expiresAt && spawn.expiresAt > 0) return spawn.expiresAt;
    if (spawn.spawnedAt && spawn.spawnedAt > 0) return spawn.spawnedAt + 30 * 60 * 1000;
    const match = spawn.spawnId?.match(/^sp_(\d+)_/);
    if (match) {
      const ts = Number(match[1]);
      if (!isNaN(ts) && ts > 0) return ts + 30 * 60 * 1000;
    }
    return Date.now() + 30 * 60 * 1000;
  }, [spawn.expiresAt, spawn.spawnedAt, spawn.spawnId]);

  // Atualiza o contador segundo a segundo; no 0 o Pokémon é removido automaticamente
  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (expiresAt <= current) {
        removeSpawn(spawn.spawnId);
      }
    };

    tick();
    const id = setInterval(tick, 1000);

    const onWake = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        tick();
      }
    };
    window.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      clearInterval(id);
      window.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [expiresAt, spawn.spawnId, removeSpawn]);

  const handleClick = () => {
    sfx.tap();
    onClick(spawn);
  };

  // Anti-colisão: se cair sobre o tapete central, reposiciona suavemente
  let posX = spawn.canvasPosition?.x ?? 0.5;
  let posY = spawn.canvasPosition?.y ?? 0.3;
  const distToRug = Math.hypot(posX - 0.50, posY - 0.54);
  if (distToRug < 0.25) {
    const safeOuterSlots = [
      { x: 0.50, y: 0.26 },
      { x: 0.16, y: 0.32 },
      { x: 0.84, y: 0.32 },
      { x: 0.14, y: 0.74 },
      { x: 0.86, y: 0.74 },
      { x: 0.50, y: 0.78 },
    ];
    const safeSlot = safeOuterSlots[index % safeOuterSlots.length];
    posX = safeSlot.x;
    posY = safeSlot.y;
  }
  const leftPct = posX * 100;
  const topPct = posY * 100;

  // Cálculo do tempo restante de permanência (diminui de 1 em 1 minuto e no 0 some)
  const msRemaining = Math.max(0, expiresAt - now);
  const minutesRemaining = Math.ceil(msRemaining / 60000);

  return (
    <motion.button
      id={`spawn-${spawn.spawnId}`}
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0, y: -12, transition: { duration: 0.35 } }}
      transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.12 * index }}
      whileTap={{ scale: 0.92 }}
      className="absolute z-10 w-[38%] max-w-[150px] -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none"
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
      aria-label={`${spawn.pokemonName} dormindo`}
    >
      {/* Etiqueta flutuante limpa: nome + coração + tempo restante antes de expirar */}
      <div className="pointer-events-none absolute left-1/2 -top-5 z-20 flex -translate-x-1/2 flex-col items-center">
        <div className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-2.5 py-0.5 shadow-sm">
          <span className="text-[10px] font-black text-ocean-dark">
            {spawn.pokemonName}
          </span>
          <span className="flex items-center gap-0.5 text-[9px] font-black text-love">
            <Heart size={10} fill="currentColor" />
            <span>{spawn.currentFriendshipPoints}/{spawn.maxFriendshipPoints}</span>
          </span>
          <span
            className={`text-[8px] font-bold pl-1 border-l border-slate-200 ${minutesRemaining <= 5 ? 'text-orange-600' : 'text-slate-500'}`}
            title="Tempo restante no acampamento"
          >
            ⏳ {minutesRemaining}m
          </span>
        </div>
      </div>

      {/* Partículas suaves de Zzz quando dormindo */}
      {!settings?.lowPowerMode && <ZzzParticles />}

      {/* Animação suave e calma de respiração dormindo */}
      <motion.div
        animate={
          settings?.lowPowerMode
            ? { scaleY: 1, scaleX: 1 }
            : { scaleY: [1, 1.045, 1], scaleX: [1, 0.992, 1] }
        }
        transition={
          settings?.lowPowerMode
            ? undefined
            : { duration: breath, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ transformOrigin: '50% 88%', willChange: 'transform' }}
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
