import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonImage } from '../campsite/PokemonImage';
import { caterpieIcon, envUrl, ENVIRONMENTS } from '../../lib/assets';
import { sfx } from '../../lib/sfx';

interface Props {
  currentIcon: string;
  currentBg?: string;
  onSelectIcon: (icon: string, bg: string) => void;
  onClose: () => void;
}

const BG_OPTIONS = [
  { id: 'greengrass', label: 'Grama', emoji: '🌿' },
  { id: 'beach', label: 'Praia', emoji: '🏖️' },
  { id: 'tundra', label: 'Neve', emoji: '❄️' },
  { id: 'cave', label: 'Caverna', emoji: '💎' },
  { id: 'study_room', label: 'Sala', emoji: '📚' },
];

export function ProfileModal({ currentIcon, currentBg = 'greengrass', onSelectIcon, onClose }: Props) {
  const { collection } = useGame();
  const [selectedIcon, setSelectedIcon] = useState<string>(currentIcon || 'caterpie');
  const [selectedBg, setSelectedBg] = useState<string>(currentBg || 'greengrass');

  const save = () => {
    sfx.fanfare();
    onSelectIcon(selectedIcon, selectedBg);
    onClose();
  };

  const renderPreviewContent = () => {
    if (selectedIcon.startsWith('poke_')) {
      const parts = selectedIcon.split('_');
      const pokemonId = Number(parts[1]);
      const variant = (parts[2] || 'regular') as 'regular' | 'shiny';
      return (
        <PokemonImage
          pokemonId={pokemonId}
          menu
          variant={variant}
          alt="Avatar"
          className="h-full w-full object-contain scale-135 drop-shadow-md"
        />
      );
    }
    return <img src={caterpieIcon} alt="Avatar" className="h-full w-full object-contain scale-120 drop-shadow-md" />;
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
        className="flex max-h-[88vh] w-full flex-col rounded-t-[2.2rem] bg-white pb-6 pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.3)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink/10 px-6 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-leaf-dark">Personalização</span>
            <h2 className="text-xl font-black text-ink">Foto de Perfil & Fundo</h2>
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
          {/* Pré-visualização do Avatar */}
          <div className="mb-5 flex flex-col items-center justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-leaf/40">
              <img
                src={envUrl(selectedBg)}
                alt="Fundo"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="relative z-10 flex h-full w-full items-center justify-center p-0.5">
                {renderPreviewContent()}
              </div>
            </div>
            <span className="mt-1.5 text-[11px] font-black text-ink/70">Pré-visualização do Ícone</span>
          </div>

          {/* Seção 1: Seletor de Fundo do Avatar (Cenários/Chão) */}
          <div className="mb-5">
            <h3 className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
              <span className="h-3 w-1 rounded-full bg-leaf" />
              Fundo do Avatar (Cenário)
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {BG_OPTIONS.map((bg) => {
                const active = selectedBg === bg.id;
                return (
                  <button
                    key={bg.id}
                    id={`bg-opt-${bg.id}`}
                    onClick={() => { sfx.tap(); setSelectedBg(bg.id); }}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-all active:scale-90 ${
                      active
                        ? 'border-2 border-leaf bg-leaf/10 shadow-md ring-2 ring-leaf/40'
                        : 'border border-ink/10 bg-cream hover:bg-cream/80'
                    }`}
                  >
                    <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-xs">
                      <img src={envUrl(bg.id)} alt={bg.label} className="h-full w-full object-cover" />
                      {active && (
                        <span className="absolute inset-0 flex items-center justify-center bg-leaf/40 text-white">
                          <Check size={14} strokeWidth={3.5} />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-ink">{bg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Ícones Padrão (Caterpie) */}
          <div className="mb-5">
            <h3 className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
              <span className="h-3 w-1 rounded-full bg-leaf" />
              Mascote Padrão
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <button
                id="icon-opt-caterpie"
                onClick={() => { sfx.tap(); setSelectedIcon('caterpie'); }}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 transition-all active:scale-90 ${
                  selectedIcon === 'caterpie'
                    ? 'border-2 border-leaf bg-leaf/10 shadow-md ring-2 ring-leaf/40'
                    : 'border border-ink/10 bg-cream hover:bg-cream/80'
                }`}
              >
                <img src={caterpieIcon} alt="Caterpie" className="h-12 w-12 rounded-xl object-contain" />
                <span className="mt-0.5 text-[9px] font-black text-ink/70">Caterpie</span>
                {selectedIcon === 'caterpie' && (
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-leaf text-white shadow">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Seção 3: Pokémon Amigos Recrutados */}
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
                  const active = selectedIcon === iconKey;
                  return (
                    <button
                      key={p.id}
                      id={`icon-opt-${p.pokemonId}`}
                      onClick={() => { sfx.tap(); setSelectedIcon(iconKey); }}
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

        {/* Botão para rever o tutorial a qualquer momento */}
        <div className="px-6 pb-2 pt-1">
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              try {
                const raw = localStorage.getItem('pokemoro_profile');
                if (raw) {
                  const parsed = JSON.parse(raw);
                  parsed.hasCompletedOnboarding = false;
                  localStorage.setItem('pokemoro_profile', JSON.stringify(parsed));
                  window.location.reload();
                }
              } catch {}
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 py-2.5 text-xs font-black text-emerald-800 shadow-sm active:scale-95 hover:bg-emerald-100 transition-all"
          >
            <span>🎓 Rever Tutorial do Professor Ricardo</span>
          </button>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 border-t border-ink/10 px-6 pt-3">
          <button
            onClick={() => { sfx.tap(); onClose(); }}
            className="btn btn-ghost flex-1 py-3 text-sm font-bold !text-slate-800 border-2 border-slate-300 shadow-sm active:scale-95"
          >
            Cancelar
          </button>
          <button
            id="btn-save-avatar"
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
