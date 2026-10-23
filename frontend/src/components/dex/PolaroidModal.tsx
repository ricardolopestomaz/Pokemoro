import { useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Star, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../../hooks/useGameState';
import { api } from '../../api/endpoints';
import { PokemonImage } from '../campsite/PokemonImage';
import { STYLE_BLURBS, STYLE_NAMES, envUrl } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import type { SpawnedPokemon } from '../../types';

interface Props {
  spawn: SpawnedPokemon;
  photoDataUrl?: string | null;
  onRegister: () => void;
  onClose: () => void;
}

/** Card de descoberta estilo Polaroid com inclinação 3D. */
export function PolaroidModal({ spawn, photoDataUrl, onRegister, onClose }: Props) {
  const { profile, refreshDex, dex } = useGame();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 16 });
  const sry = useSpring(ry, { stiffness: 200, damping: 16 });
  const id4 = String(spawn.pokemonId).padStart(4, '0');

  const displayPhoto = photoDataUrl || spawn.photoDataUrl;

  const isAlreadyRegistered = useMemo(() => {
    if (!dex?.entries) return false;
    const entry = dex.entries.find((e) => e.pokemonId === spawn.pokemonId);
    if (!entry) return false;
    const styleKey = `style${spawn.sleepStyle}` as 'style1' | 'style2' | 'style3';
    return Boolean(entry.styles[styleKey]?.isUnlocked);
  }, [dex, spawn.pokemonId, spawn.sleepStyle]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 26);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 26);
  };
  const reset = () => { rx.set(0); ry.set(0); };

  const register = async () => {
    sfx.fanfare();
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors: ['#ffcb05', '#48d0b0', '#ff5b84', '#4fc3f7'] });
    if (displayPhoto) {
      await api.saveDexPhoto(spawn.pokemonId, spawn.sleepStyle, displayPhoto, spawn.variant === 'shiny').catch(() => {});
    }
    await refreshDex().catch(() => undefined);
    onRegister();
  };

  return (
    <motion.div
      className="absolute inset-0 z-[55] flex items-center justify-center bg-black/55 p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        onPointerMove={onMove}
        onPointerLeave={reset}
        initial={{ y: 80, opacity: 0, rotate: -12, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, rotate: -2, scale: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
        className="relative w-full max-w-[320px] rounded-[1.6rem] bg-white p-4 pb-5 shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
      >
        <Star className="absolute right-4 top-4 z-10 drop-shadow" size={26} fill="#ffcb05" color="#d9a800" />

        <div className="relative aspect-square overflow-hidden rounded-2xl bg-leaf/30 border border-ink/10 shadow-inner">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={spawn.pokemonName}
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <img src={envUrl(profile?.activeEnvironment ?? 'greengrass')} alt="" className="absolute inset-0 h-full w-full scale-150 object-cover" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <PokemonImage pokemonId={spawn.pokemonId} style={spawn.sleepStyle} variant={spawn.variant} alt={spawn.pokemonName} className="w-[88%] drop-shadow-xl" />
              </motion.div>
            </>
          )}
          <div className="shimmer absolute inset-0 pointer-events-none" />
        </div>

        <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
          <span className="rounded-full bg-ocean/20 px-3 py-0.5 text-xs font-black text-ocean-dark">
            #{id4} {spawn.pokemonName} ({STYLE_NAMES[spawn.sleepStyle].split(' ').slice(-1)[0]})
          </span>
          <h2 className="text-xl font-black text-ink">{STYLE_NAMES[spawn.sleepStyle]}</h2>
          <p className="text-xs font-bold text-ink/60">
            {spawn.variant === 'shiny' && '✨ Cor rara! '}
            {STYLE_BLURBS[spawn.sleepStyle]}
          </p>
        </div>

        {/* Recompensa de descoberta se inédita OU aviso de já catalogada */}
        {isAlreadyRegistered ? (
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-leaf/15 py-1 px-3 text-xs font-black text-leaf-dark shadow-xs">
            <CheckCircle2 size={14} />
            <span>Pose já catalogada na Focus Dex</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-center gap-3 rounded-full bg-cream py-1 px-3 text-xs font-black text-ink/80 shadow-inner">
            <span className="flex items-center gap-1 text-warm-orange">🍪 +1 Biscoito</span>
            <span className="text-ink/30">/</span>
            <span className="flex items-center gap-1 text-sleep-yellow-dark">🪙 +25 Moedas</span>
          </div>
        )}

        {isAlreadyRegistered ? (
          <button
            id="btn-register-dex"
            className="btn btn-green mt-3 w-full"
            onClick={() => {
              sfx.tap();
              onRegister();
            }}
          >
            Continuar
          </button>
        ) : (
          <button id="btn-register-dex" className="btn mt-3 w-full" onClick={register}>
            📸 Registrar na Focus Dex
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
