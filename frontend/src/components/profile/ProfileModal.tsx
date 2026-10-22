import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonImage } from '../campsite/PokemonImage';
import { caterpieIcon } from '../../lib/assets';
import { sfx } from '../../lib/sfx';

interface Props {
  currentIcon: string;
  onSelectIcon: (icon: string) => void;
  onClose: () => void;
}

const COMMON_ICONS = [
  { id: 'caterpie', label: 'Caterpie Pokémoro', url: caterpieIcon },
  { id: 'pokeball', label: 'Poké Ball', isEmoji: true, emoji: '🔴' },
  { id: 'greatball', label: 'Great Ball', isEmoji: true, emoji: '🔵' },
  { id: 'ultraball', label: 'Ultra Ball', isEmoji: true, emoji: '🟡' },
];

export function ProfileModal({ currentIcon, onSelectIcon, onClose }: Props) {
  const { collection } = useGame();
  const [selected, setSelected] = useState<string>(currentIcon || 'caterpie');

  const save = () => {
    sfx.fanfare();
    onSelectIcon(selected);
    onClose();
  };

  return (
    <motion.div
      className="absolute inset-0 z-[70] flex items-end bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 500 }}
        animate={{ y: 0 }}
        exit={{ y: 500 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="flex max-h-[85vh] w-full flex-col rounded-t-[2.2rem] bg-white pb-6 pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.3)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-6 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-leaf-dark">Perfil do Treinador</span>
            <h2 className="text-xl font-black text-ink">Ícone do Perfil</h2>
          </div>
          <button
            onClick={() => { sfx.tap(); onClose(); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink/70 active:scale-90"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-4">
          {/* Section: Common */}
          <div className="mb-5">
            <h3 className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
              <span className="h-3 w-1 rounded-full bg-leaf" />
              Padrão
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {COMMON_ICONS.map((it) => {
                const active = selected === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => { sfx.tap(); setSelected(it.id); }}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 transition-all active:scale-90 ${
                      active
                        ? 'border-2 border-leaf bg-leaf/10 shadow-md ring-2 ring-leaf/40'
                        : 'border border-ink/10 bg-cream hover:bg-cream/80'
                    }`}
                  >
                    {it.url ? (
                      <img src={it.url} alt={it.label} className="h-12 w-12 rounded-xl object-contain" />
                    ) : (
                      <span className="text-3xl">{it.emoji}</span>
                    )}
                    {active && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-leaf text-white shadow">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Pokémon befriended */}
          <div>
            <h3 className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
              <span className="h-3 w-1 rounded-full bg-leaf" />
              Pokémon Amigos ({collection.length})
            </h3>
            {collection.length === 0 ? (
              <p className="rounded-2xl bg-cream p-4 text-center text-xs font-bold text-ink/50">
                Alimente os Pokémon no Descanso para desbloquear novos avatares! 🍪
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {collection.map((p) => {
                  const iconKey = `poke_${p.pokemonId}_${p.variant}`;
                  const active = selected === iconKey;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { sfx.tap(); setSelected(iconKey); }}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 transition-all active:scale-90 ${
                        active
                          ? 'border-2 border-leaf bg-leaf/10 shadow-md ring-2 ring-leaf/40'
                          : 'border border-ink/10 bg-cream hover:bg-cream/80'
                      }`}
                    >
                      <PokemonImage
                        pokemonId={p.pokemonId}
                        menu
                        variant={p.variant}
                        alt={p.nickname}
                        className="h-12 w-12 object-contain"
                      />
                      <span className="mt-0.5 max-w-full truncate text-[9px] font-black text-ink/70">
                        {p.nickname}
                      </span>
                      {active && (
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-leaf text-white shadow">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 border-t border-ink/10 px-6 pt-3">
          <button
            onClick={() => { sfx.tap(); onClose(); }}
            className="btn btn-ghost flex-1 py-3 text-sm text-ink/70"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="btn btn-green flex-1 py-3 text-sm"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
