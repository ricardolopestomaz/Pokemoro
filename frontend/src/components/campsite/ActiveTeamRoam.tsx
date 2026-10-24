import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../hooks/useGameState';
import { PokemonImage } from './PokemonImage';
import { sfx } from '../../lib/sfx';
import type { UserPokemon } from '../../types';

interface Props {
  team: UserPokemon[];
  hasSpawns?: boolean;
}

const REACTIONS = ['❤️', '🎵', '⚡', '☕', '📚', '✨', '🍃'];

// Posições-âncora iniciais para até 5 Pokémon
const ANCHOR_SLOTS = [
  { x: 50, y: 56 }, // Centro / Líder
  { x: 25, y: 45 }, // Noroeste
  { x: 75, y: 45 }, // Nordeste
  { x: 28, y: 72 }, // Sudoeste
  { x: 72, y: 72 }, // Sudeste
];

interface BuddyState {
  x: number;
  y: number;
  facing: 1 | -1;
  bubble: string | null;
  isJumping: boolean;
}

export function ActiveTeamRoam({ team, hasSpawns = false }: Props) {
  const { settings } = useGame();
  // Inicializa o estado de posição para cada membro da equipe ativa
  const [buddies, setBuddies] = useState<Record<string, BuddyState>>(() => {
    const map: Record<string, BuddyState> = {};
    team.slice(0, 5).forEach((p, idx) => {
      const anchor = ANCHOR_SLOTS[idx] || { x: 50, y: 60 };
      map[p.id] = {
        x: anchor.x,
        y: anchor.y,
        facing: 1,
        bubble: null,
        isJumping: false,
      };
    });
    return map;
  });

  // Atualiza caso a equipe mude
  useEffect(() => {
    setBuddies((prev) => {
      const next: Record<string, BuddyState> = {};
      team.slice(0, 5).forEach((p, idx) => {
        if (prev[p.id]) {
          next[p.id] = prev[p.id];
        } else {
          const anchor = ANCHOR_SLOTS[idx] || { x: 50, y: 60 };
          next[p.id] = {
            x: anchor.x,
            y: anchor.y,
            facing: 1,
            bubble: null,
            isJumping: false,
          };
        }
      });
      return next;
    });
  }, [team]);

  // IA de caminhada e interação a cada 4s - 8s aleatórios por Pokémon
  useEffect(() => {
    if (!team.length || settings?.enableTeamRoaming === false) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    team.slice(0, 5).forEach((p, idx) => {
      const scheduleNextMove = () => {
        const delay = 4000 + Math.random() * 4000; // entre 4s e 8s
        const t = setTimeout(() => {
          setBuddies((current) => {
            const b = current[p.id];
            if (!b) return current;

            const anchor = ANCHOR_SLOTS[idx] || { x: 50, y: 60 };
            // Move suavemente ao redor da âncora (alcance +/- 14% em X, +/- 10% em Y)
            const targetX = Math.max(16, Math.min(84, anchor.x + (Math.random() - 0.5) * 26));
            const targetY = Math.max(hasSpawns ? 40 : 35, Math.min(78, anchor.y + (Math.random() - 0.5) * 18));
            const newFacing: 1 | -1 = targetX >= b.x ? 1 : -1;

            // Chance de 30% de soltar um balãozinho amigável
            const triggerBubble = Math.random() < 0.35;
            const chosenReaction = triggerBubble ? REACTIONS[Math.floor(Math.random() * REACTIONS.length)] : null;

            return {
              ...current,
              [p.id]: {
                x: targetX,
                y: targetY,
                facing: newFacing,
                bubble: chosenReaction,
                isJumping: true,
              },
            };
          });

          // Limpa o balão após 2.5s
          setTimeout(() => {
            setBuddies((curr) => {
              if (!curr[p.id]) return curr;
              return { ...curr, [p.id]: { ...curr[p.id], bubble: null, isJumping: false } };
            });
          }, 2500);

          scheduleNextMove();
        }, delay);

        timers.push(t);
      };

      scheduleNextMove();
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [team, hasSpawns]);

  // Toque manual: pula de alegria, toca áudio e exibe coração
  const handleTap = (p: UserPokemon) => {
    sfx.tap();
    const r = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    setBuddies((curr) => {
      const b = curr[p.id];
      if (!b) return curr;
      return {
        ...curr,
        [p.id]: {
          ...b,
          bubble: r,
          isJumping: true,
        },
      };
    });

    setTimeout(() => {
      setBuddies((curr) => {
        if (!curr[p.id]) return curr;
        return { ...curr, [p.id]: { ...curr[p.id], bubble: null, isJumping: false } };
      });
    }, 2500);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-15">
      {team.slice(0, 5).map((p) => {
        const b = buddies[p.id] || { x: 50, y: 60, facing: 1, bubble: null, isJumping: false };
        return (
          <motion.div
            key={p.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              left: `${b.x}%`,
              top: `${b.y}%`,
            }}
            transition={{
              left: { duration: 2.2, ease: 'easeInOut' },
              top: { duration: 2.2, ease: 'easeInOut' },
              scale: { type: 'spring', stiffness: 220, damping: 15 },
            }}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none"
            style={{ width: '22%' }}
            onClick={() => handleTap(p)}
          >
            {/* Balão de Reação Flutuante */}
            <AnimatePresence>
              {b.bubble && (
                <motion.div
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -28, scale: 1.15 }}
                  exit={{ opacity: 0, y: -40, scale: 0.8 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center rounded-full border border-white/90 bg-white/95 px-2 py-1 shadow-md"
                >
                  <span className="text-sm">{b.bubble}</span>
                  <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pokémon Acordado com animação de passinhos e pulinho */}
            <motion.div
              animate={b.isJumping ? { y: [0, -14, 0] } : { y: [0, -3, 0] }}
              transition={{
                duration: b.isJumping ? 0.45 : 1.6,
                repeat: b.isJumping ? 1 : Infinity,
                ease: 'easeInOut',
              }}
              style={{ transformOrigin: '50% 90%' }}
              className="relative flex flex-col items-center"
            >
              <div
                style={{ transform: `scaleX(${b.facing})` }}
                className="transition-transform duration-300 w-full"
              >
                <PokemonImage
                  pokemonId={p.pokemonId}
                  menu
                  variant={p.variant}
                  alt={p.nickname}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Tag com apelido sutil */}
              <div className="mt-0.5 rounded-full border border-white/70 bg-white/85 px-1.5 py-0.2 shadow-2xs backdrop-blur-xs">
                <span className="text-[8px] font-black text-ink/80">{p.nickname}</span>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
