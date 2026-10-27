import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { sfx } from '../../lib/sfx';
import { PokeBiscuitIcon, PokeCoinIcon } from '../common/PokemonThemedIcons';
import type { BiscuitType } from '../../types';

const ITEMS: { type: BiscuitType; key: 'basic' | 'great' | 'master'; name: string; desc: string; cost: number }[] = [
  { type: 'BASIC', key: 'basic', name: 'Biscoito de Café', desc: '+1 ponto de amizade', cost: 50 },
  { type: 'GREAT', key: 'great', name: 'Biscoito Especial', desc: '+3 pontos de amizade', cost: 120 },
  { type: 'MASTER', key: 'master', name: 'Biscoito Dourado', desc: 'Enche a barra na hora', cost: 300 },
];

export function ShopSheet({ onClose }: { onClose: () => void }) {
  const { profile, refreshProfile, toast } = useGame();
  if (!profile) return null;

  const buy = async (type: BiscuitType, name: string) => {
    sfx.tap();
    try {
      await api.buyBiscuits(type, 1);
      await refreshProfile();
      sfx.munch();
      toast(`${name} comprado!`, 'ok');
    } catch (e) {
      sfx.warn();
      toast((e as Error).message, 'error');
    }
  };

  return (
    <motion.div className="absolute inset-0 z-[60] flex items-end bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        exit={{ y: 400 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="w-full rounded-t-[2rem] bg-cream p-5 pb-8"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">Cantina de Biscoitos</h2>
          <div className="flex items-center gap-2">
            <span className="pill-label flex items-center gap-1.5 px-3 py-1 text-sm font-black text-ink shadow-xs">
              <PokeCoinIcon size={18} />
              {profile.focusCoins}
            </span>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow active:scale-90" aria-label="Fechar"><X size={18} /></button>
          </div>
        </div>
        <ul className="flex flex-col gap-2.5">
          {ITEMS.map((it) => (
            <li key={it.type} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm border border-slate-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200/60 shadow-inner">
                <PokeBiscuitIcon size={32} type={it.type.toLowerCase() as any} />
              </span>
              <div className="flex-1">
                <div className="text-sm font-black">{it.name} <span className="text-ink/40">x{profile.inventory[it.key]}</span></div>
                <div className="text-[11px] font-bold text-ink/60">{it.desc}</div>
              </div>
              <button
                id={`btn-buy-${it.type.toLowerCase()}`}
                className="btn !px-4 !py-2 text-sm flex items-center gap-1.5"
                disabled={profile.focusCoins < it.cost}
                onClick={() => buy(it.type, it.name)}
                aria-label={`${it.cost} 🪙`}
              >
                <span>{it.cost}</span>
                <PokeCoinIcon size={14} />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-[11px] font-bold text-ink/50">Ganhe moedas estudando: 2 moedas por minuto focado.</p>
      </motion.div>
    </motion.div>
  );
}
