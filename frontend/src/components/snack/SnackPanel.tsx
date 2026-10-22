import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, Heart, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { PokemonImage } from '../campsite/PokemonImage';
import { sfx } from '../../lib/sfx';
import type { BiscuitType, SpawnedPokemon, UserPokemon } from '../../types';

interface Props {
  spawnId: string;
  onClose: () => void;
}

const BISCUITS: { type: BiscuitType; key: 'basic' | 'great' | 'master'; label: string; hint: string; from: string; to: string }[] = [
  { type: 'BASIC', key: 'basic', label: 'Café', hint: '+1', from: '#c98a4b', to: '#8a5a2b' },
  { type: 'GREAT', key: 'great', label: 'Especial', hint: '+3', from: '#9fd8ff', to: '#4fa3dd' },
  { type: 'MASTER', key: 'master', label: 'Dourado', hint: 'Máx!', from: '#ffe066', to: '#e0a800' },
];

interface Burst { id: number; kind: 'heart' | 'text'; x: number; text?: string; crit?: boolean }

export function SnackPanel({ spawnId, onClose }: Props) {
  const { coffeeBreak, profile, patchInventory, patchSpawn, toast, refreshTeam, refreshDex, refreshProfile } = useGame();
  const spawn: SpawnedPokemon | undefined = coffeeBreak?.spawns.find((s) => s.spawnId === spawnId);
  const [busy, setBusy] = useState<BiscuitType | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [recruited, setRecruited] = useState<UserPokemon | null>(null);
  const [chomp, setChomp] = useState(0);

  if (!spawn || !profile) return null;
  const done = spawn.currentFriendshipPoints >= spawn.maxFriendshipPoints;

  const addBursts = (items: Burst[]) => {
    setBursts((b) => [...b, ...items]);
    const ids = items.map((i) => i.id);
    setTimeout(() => setBursts((b) => b.filter((x) => !ids.includes(x.id))), 1600);
  };

  const feed = async (type: BiscuitType) => {
    setBusy(type);
    sfx.munch();
    try {
      const res = await api.feed(spawn.spawnId, type);
      patchInventory(res.updatedInventory);
      patchSpawn(spawn.spawnId, {
        currentFriendshipPoints: res.newFriendshipPoints,
        isFull: res.isFull,
        isHungry: false,
        isAlreadyRecruited: res.isRecruited || spawn.isAlreadyRecruited,
      });
      setChomp((c) => c + 1);
      const t = Date.now();
      addBursts([
        ...Array.from({ length: res.wasHungry ? 12 : 6 }, (_, i) => ({ id: t + i, kind: 'heart' as const, x: (Math.random() - 0.5) * 200 })),
        { id: t + 100, kind: 'text', x: 0, text: res.wasHungry ? `+${res.pointsAdded} CRITICAL!` : `+${res.pointsAdded}`, crit: res.wasHungry },
      ]);
      if (res.isRecruited && res.recruitedPokemon) {
        setTimeout(async () => {
          sfx.fanfare();
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
          setRecruited(res.recruitedPokemon);
          await Promise.allSettled([refreshTeam(), refreshDex(), refreshProfile()]);
        }, 700);
      } else if (res.isFull) {
        toast(`${spawn.pokemonName} está satisfeito e vai tirar um cochilo 💤`, 'info');
      }
    } catch (e) {
      sfx.warn();
      toast((e as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-[55] flex flex-col bg-black/25"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button id="btn-close-snack" onClick={() => { sfx.tap(); onClose(); }} className="glass absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full active:scale-90" aria-label="Fechar">
        <X size={20} />
      </button>

      {/* Metade superior: Pokémon */}
      <div className="relative flex flex-1 items-end justify-center overflow-hidden pb-4">
        <motion.div
          key={chomp}
          animate={{ scale: [1, 1.12, 0.95, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 0.5 }}
          className="relative w-[68%]"
        >
          <PokemonImage pokemonId={spawn.pokemonId} style={spawn.sleepStyle} variant={spawn.variant} alt={spawn.pokemonName} className="w-full drop-shadow-2xl" />
        </motion.div>
        <AnimatePresence>
          {bursts.map((b) =>
            b.kind === 'heart' ? (
              <motion.div
                key={b.id}
                className="pointer-events-none absolute bottom-1/3 left-1/2 text-love"
                initial={{ y: 0, x: 0, opacity: 1, scale: 0.4 }}
                animate={{ y: -160 - Math.random() * 90, x: b.x, opacity: 0, scale: 1.3 }}
                transition={{ duration: 1.3, ease: 'easeOut' }}
              >
                <Heart fill="currentColor" size={22} />
              </motion.div>
            ) : (
              <motion.div
                key={b.id}
                className={`pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 whitespace-nowrap font-black drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] ${b.crit ? 'text-4xl text-sleep-yellow' : 'text-3xl text-white'}`}
                initial={{ y: 20, opacity: 0, scale: 0.5 }}
                animate={{ y: -50, opacity: [0, 1, 1, 0], scale: [0.5, 1.3, 1] }}
                transition={{ duration: 1.5 }}
              >
                {b.text}
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>

      {/* Metade inferior: painel branco */}
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        className="rounded-t-[2rem] bg-white px-5 pb-6 pt-5 shadow-[0_-10px_30px_rgba(0,0,0,0.25)]"
      >
        <h2 className="text-center text-2xl font-black text-love">
          Nível de Amizade {spawn.currentFriendshipPoints}
        </h2>
        <p className="mt-0.5 text-center text-sm font-bold text-ink/70">
          {done ? 'Vocês são grandes amigos!' : `Faltam ${spawn.maxFriendshipPoints - spawn.currentFriendshipPoints} ❤ para recrutá-lo`}
        </p>

        <div className="mt-3 flex items-center justify-center gap-1.5" aria-label={`${spawn.currentFriendshipPoints} de ${spawn.maxFriendshipPoints} corações`}>
          {Array.from({ length: spawn.maxFriendshipPoints }).map((_, i) => {
            const on = i < spawn.currentFriendshipPoints;
            return (
              <motion.div key={`${i}-${on}`} initial={on ? { scale: 0.3 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Heart size={30} className={on ? 'text-love' : 'text-ink/15'} fill={on ? 'currentColor' : 'none'} strokeWidth={2.5} />
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-3">
          <div className="medal h-12 w-12 overflow-hidden">
            <PokemonImage pokemonId={spawn.pokemonId} menu variant={spawn.variant} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="flex-1">
            <div className="font-black">{spawn.pokemonName}</div>
            <div className="text-[11px] font-bold text-ink/50">
              {spawn.isFull ? '💤 Saciado' : spawn.isHungry ? '🔥 Faminto! 1º biscoito rende 3x' : 'Descansando'}
            </div>
          </div>
          <span className="text-lg font-black text-leaf-dark">{spawn.currentFriendshipPoints}/{spawn.maxFriendshipPoints}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3" role="group" aria-label="Biscoitos">
          {BISCUITS.map((b) => {
            const qty = profile.inventory[b.key];
            const disabled = qty <= 0 || spawn.isFull || done || busy !== null;
            return (
              <button
                key={b.type}
                id={`btn-feed-${b.type.toLowerCase()}`}
                disabled={disabled}
                onClick={() => feed(b.type)}
                className="btn flex flex-col items-center gap-1 !px-2 !py-2.5"
                style={{ ['--b' as string]: '#fff7e0', ['--bd' as string]: '#e8d9a8', color: '#4a3b00' }}
              >
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full shadow-inner" style={{ background: `radial-gradient(circle at 30% 30%, ${b.from}, ${b.to})` }}>
                  <Cookie size={24} color="#fff" />
                  <span className="absolute -right-1 -top-1 rounded-full bg-love px-1.5 text-[10px] font-black text-white">{qty}</span>
                </span>
                <span className="text-[11px] font-black leading-none">{b.label}</span>
                <span className="text-[10px] font-extrabold text-love">{b.hint}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Celebração de recrutamento estilo exemplo-pokemon-amizade-up.jpg e exemplo-felicidade-pokemon.jpg */}
      <AnimatePresence>
        {recruited && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-night/95 via-ocean-dark/95 to-[#1a2d52]/95 p-6 text-center text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Medalha Dourada com Estrela (exemplo-felicidade-pokemon.jpg) */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-sleep-yellow bg-gradient-to-b from-[#fff7d1] to-[#ffe270] p-4 shadow-[0_12px_30px_rgba(255,203,5,0.4)]"
              >
                <PokemonImage
                  pokemonId={recruited.pokemonId}
                  variant={recruited.variant}
                  alt={recruited.nickname}
                  className="h-full w-full object-contain drop-shadow-md"
                />
              </motion.div>
              <span className="absolute -top-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-warm-orange text-xl shadow-lg ring-4 ring-white/50">
                ⭐
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-love/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-love">
                Amizade Nível {recruited.friendshipLevel} atingida!
              </span>
              <h2 className="text-3xl font-black text-sleep-yellow drop-shadow-md">
                Novo Parceiro de Estudos!
              </h2>
              <p className="text-base font-extrabold text-white/90">
                {recruited.nickname} agora faz parte da sua Pokémon Box! 🎉
              </p>
            </div>

            <div className="w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-wider text-white/60">Bônus Passivo para a Equipe</div>
              <div className="mt-1 text-xs font-black text-sleep-yellow">
                {recruited.passiveBonusDescription}
              </div>
            </div>

            <button
              id="btn-continue-recruit"
              className="btn btn-green mt-2 w-full max-w-xs py-3 text-sm font-black shadow-lg"
              onClick={() => {
                sfx.tap();
                setRecruited(null);
                onClose();
              }}
            >
              Adicionar ao Acampamento
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
