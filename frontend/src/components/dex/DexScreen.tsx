import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Sparkles, Star, X } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonImage } from '../campsite/PokemonImage';
import { PolaroidModal } from './PolaroidModal';
import { STYLE_NAMES } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import type { DexEntry, SleepStyle, SpawnedPokemon } from '../../types';

type Filter = 'all' | 'recruited' | 'poses' | 'shiny';
const FILTERS: { id: Filter; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos', icon: '📖' },
  { id: 'recruited', label: 'Recrutados', icon: '⭐' },
  { id: 'poses', label: 'Poses descobertas', icon: '📸' },
  { id: 'shiny', label: 'Shiny', icon: '✨' },
];

const stylesOf = (e: DexEntry) => [e.styles.style1, e.styles.style2, e.styles.style3];
const unlockedCount = (e: DexEntry) => stylesOf(e).filter((s) => s.isUnlocked).length;

export function DexScreen() {
  const { dex } = useGame();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<DexEntry | null>(null);
  const [polaroidPreview, setPolaroidPreview] = useState<SpawnedPokemon | null>(null);

  const entries = useMemo(() => {
    const list = dex?.entries ?? [];
    switch (filter) {
      case 'recruited': return list.filter((e) => e.isRecruited);
      case 'poses': return list.filter((e) => unlockedCount(e) > 0);
      case 'shiny': return list.filter((e) => stylesOf(e).some((s) => s.discoveredShiny));
      default: return list;
    }
  }, [dex, filter]);

  const openPolaroid = (e: DexEntry, styleNum: SleepStyle, isShiny: boolean) => {
    sfx.tap();
    const spawnObj: SpawnedPokemon = {
      spawnId: `dex_preview_${e.pokemonId}_${styleNum}`,
      pokemonId: e.pokemonId,
      pokemonName: e.pokemonName,
      variant: isShiny ? 'shiny' : 'regular',
      sleepStyle: styleNum,
      currentFriendshipPoints: e.isRecruited ? 5 : 0,
      maxFriendshipPoints: 5,
      isAlreadyRecruited: e.isRecruited,
      isHungry: false,
      isFull: true,
      spriteSleepUrl: '',
      spriteMenuUrl: '',
      canvasPosition: { x: 0.5, y: 0.5 },
    };
    setPolaroidPreview(spawnObj);
  };

  return (
    <section className="absolute inset-0 z-20 overflow-y-auto bg-cream px-4 pb-28 pt-[84px] no-scrollbar" aria-label="Focus Dex">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-leaf-dark">Enciclopédia de Estudos</span>
          <h1 className="text-xl font-black text-ink">Focus Dex</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-leaf/15 px-3 py-1 text-xs font-black text-leaf-dark">
          <Sparkles size={14} />
          <span>{dex?.completionPercentage ?? 0}%</span>
        </div>
      </div>

      {/* Barra de Progresso Geral */}
      <div className="mt-2.5 rounded-2xl border border-white/80 bg-white p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="text-ink">{dex?.totalDiscovered ?? 0} / {dex?.totalAvailable ?? 0} poses catalogadas</span>
          <span className="text-leaf-dark font-black">{dex?.completionPercentage ?? 0}% concluído</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10 shadow-inner">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-leaf to-sleep-yellow"
            initial={{ width: 0 }}
            animate={{ width: `${dex?.completionPercentage ?? 0}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Filtros em Abas Roláveis */}
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            id={`dex-filter-${f.id}`}
            onClick={() => { sfx.tap(); setFilter(f.id); }}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition-all active:scale-95 shadow-xs"
            style={{
              background: filter === f.id ? '#48d0b0' : '#fff',
              color: filter === f.id ? '#fff' : '#6b7488',
              boxShadow: filter === f.id ? '0 3px 0 #2fa98c' : '0 1px 3px rgba(0,0,0,.08)',
            }}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Grid de Cards de Pokémon estilo exemplo-pokemons-vistos.jpg */}
      {entries.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-6 text-center text-xs font-bold text-ink/60 shadow-sm">
          Nenhum registro encontrado nesta categoria. Continue focando para descobrir novas poses! 📚
        </div>
      ) : (
        <motion.ul
          key={filter}
          className="mt-3.5 grid grid-cols-4 gap-x-2 gap-y-3.5"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.03 } } }}
        >
          {entries.map((e) => {
            const n = unlockedCount(e);
            const shiny = stylesOf(e).some((s) => s.discoveredShiny);
            return (
              <motion.li key={e.pokemonId} variants={{ hidden: { opacity: 0, y: 12, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}>
                <button
                  id={`dex-${e.pokemonId}`}
                  onClick={() => { sfx.tap(); setOpen(e); }}
                  className="flex w-full flex-col items-center gap-1 transition-transform active:scale-90"
                >
                  <div className={`medal aspect-square w-full overflow-hidden border-2 ${
                    e.isSeen ? 'border-white/90 bg-white' : 'medal-locked border-transparent !bg-ink/5'
                  }`}>
                    <PokemonImage
                      pokemonId={e.pokemonId}
                      menu
                      silhouette={!e.isSeen}
                      className="h-full w-full object-contain"
                      alt={e.isSeen ? e.pokemonName : 'Desconhecido'}
                    />
                    {e.isRecruited && (
                      <Star size={14} className="absolute -right-1 -top-1" fill="#ffcb05" color="#d9a800" />
                    )}
                    {shiny && <span className="absolute -left-1 -top-1 text-xs">✨</span>}
                  </div>

                  <div className="h-1.5 w-[80%] overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-leaf" style={{ width: `${(n / 3) * 100}%` }} />
                  </div>
                  <span className="max-w-full truncate text-[10px] font-black text-ink">
                    {e.isSeen ? e.pokemonName : '???'}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      {/* Modal inferior com os 3 estilos de sono */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute inset-0 z-30 flex items-end bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              onClick={(ev) => ev.stopPropagation()}
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="w-full rounded-t-[2.2rem] bg-white p-5 pb-8 shadow-[0_-10px_35px_rgba(0,0,0,0.3)]"
            >
              <div className="mb-3 flex items-center justify-between border-b border-ink/10 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-leaf-dark">#{String(open.pokemonId).padStart(4, '0')}</span>
                  <h2 className="text-xl font-black text-ink">{open.isSeen ? open.pokemonName : '???'}</h2>
                </div>
                <button
                  onClick={() => { sfx.tap(); setOpen(null); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink/70 active:scale-90"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {stylesOf(open).map((s) => {
                  const styleNum = s.style as SleepStyle;
                  return (
                    <button
                      key={s.style}
                      disabled={!s.isUnlocked}
                      onClick={() => openPolaroid(open, styleNum, s.discoveredShiny)}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl p-2 transition-all ${
                        s.isUnlocked
                          ? 'border border-leaf/40 bg-[#f0faf7] active:scale-95 hover:border-leaf'
                          : 'border border-ink/10 bg-cream/50 opacity-60'
                      }`}
                    >
                      <div className="aspect-square w-full">
                        <PokemonImage
                          pokemonId={open.pokemonId}
                          style={styleNum}
                          variant={s.discoveredShiny ? 'shiny' : 'regular'}
                          silhouette={!s.isUnlocked}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="text-center text-[10px] font-black leading-tight text-ink">
                        {s.isUnlocked ? STYLE_NAMES[styleNum] : 'Bloqueada'}
                      </span>
                      {s.isUnlocked && (
                        <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-leaf-dark">
                          <Camera size={10} /> Ver foto
                        </span>
                      )}
                      {s.discoveredShiny && (
                        <span className="text-[9px] font-black text-warm-orange">✨ Shiny</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-center text-xs font-bold text-ink/60">
                {open.isRecruited
                  ? '⭐ Já faz parte da sua coleção de Study Buddies!'
                  : 'Complete Pomodoros e alimente-o no Descanso para recrutá-lo! 🍪'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Polaroid para visualização em 3D */}
      <AnimatePresence>
        {polaroidPreview && (
          <PolaroidModal
            spawn={polaroidPreview}
            onRegister={() => setPolaroidPreview(null)}
            onClose={() => setPolaroidPreview(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
