import { motion } from 'framer-motion';
import { Coins, Cookie, X } from 'lucide-react';
import { api } from '../../api/endpoints';
import { useGame } from '../../hooks/useGameState';
import { sfx } from '../../lib/sfx';
import type { BiscuitType } from '../../types';

const ITEMS: { type: BiscuitType; key: 'basic' | 'great' | 'master'; name: string; desc: string; cost: number; from: string; to: string }[] = [
  { type: 'BASIC', key: 'basic', name: 'Biscoito de Café', desc: '+1 ponto de amizade', cost: 50, from: '#c98a4b', to: '#8a5a2b' },
  { type: 'GREAT', key: 'great', name: 'Biscoito Especial', desc: '+3 pontos de amizade', cost: 120, from: '#9fd8ff', to: '#4fa3dd' },
  { type: 'MASTER', key: 'master', name: 'Biscoito Dourado', desc: 'Enche a barra na hora', cost: 300, from: '#ffe066', to: '#e0a800' },
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
            <span className="pill-label flex items-center gap-1 px-3 py-1 text-sm"><Coins size={16} className="text-sleep-yellow-dark" />{profile.focusCoins}</span>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow active:scale-90" aria-label="Fechar"><X size={18} /></button>
          </div>
        </div>
        <ul className="flex flex-col gap-2.5">
          {ITEMS.map((it) => (
            <li key={it.type} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${it.from}, ${it.to})` }}>
                <Cookie size={26} color="#fff" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-black">{it.name} <span className="text-ink/40">x{profile.inventory[it.key]}</span></div>
                <div className="text-[11px] font-bold text-ink/60">{it.desc}</div>
              </div>
              <button id={`btn-buy-${it.type.toLowerCase()}`} className="btn !px-4 !py-2 text-sm" disabled={profile.focusCoins < it.cost} onClick={() => buy(it.type, it.name)}>
                {it.cost} 🪙
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-[11px] font-bold text-ink/50">Ganhe moedas estudando: 2 moedas por minuto focado.</p>
      </motion.div>
    </motion.div>
  );
}
