import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Coins, Cookie, Flame, Zap } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { caterpieIcon } from '../../lib/assets';
import { PokemonImage } from '../campsite/PokemonImage';
import { ProfileModal } from '../profile/ProfileModal';
import { sfx } from '../../lib/sfx';

interface Props {
  onShop: () => void;
}

const MONTHS_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export function TopHUD({ onShop }: Props) {
  const { profile, coffeeBreak } = useGame();
  const [profileModal, setProfileModal] = useState(false);
  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem('pokemoro_avatar') || 'caterpie');

  const now = new Date();
  const day = now.getDate();
  const month = MONTHS_PT[now.getMonth()];

  const fp = coffeeBreak?.focusPower ?? 0;
  const pct = Math.min(100, Math.max(5, (fp / 600) * 100));
  const biscuits = profile ? profile.inventory.basic + profile.inventory.great + profile.inventory.master : 0;

  const handleSelectAvatar = (newIcon: string) => {
    setAvatar(newIcon);
    localStorage.setItem('pokemoro_avatar', newIcon);
  };

  const renderAvatarContent = () => {
    if (avatar.startsWith('poke_')) {
      const parts = avatar.split('_');
      const pokemonId = Number(parts[1]);
      const variant = (parts[2] || 'regular') as 'regular' | 'shiny';
      return (
        <PokemonImage
          pokemonId={pokemonId}
          menu
          variant={variant}
          alt="Avatar"
          className="h-full w-full object-contain"
        />
      );
    }
    if (avatar === 'pokeball') return <span className="text-2xl">🔴</span>;
    if (avatar === 'greatball') return <span className="text-2xl">🔵</span>;
    if (avatar === 'ultraball') return <span className="text-2xl">🟡</span>;
    return <img src={caterpieIcon} alt="Avatar" className="h-full w-full object-cover" />;
  };

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30 flex items-stretch gap-2 p-3">
        {/* Date badge estilo Pokémon Sleep (exemplo-main-2.jpg) */}
        <button
          onClick={() => { sfx.tap(); setProfileModal(true); }}
          className="flex flex-col items-center justify-between overflow-hidden rounded-2xl border-2 border-white/90 bg-white shadow-md transition-transform active:scale-95"
          style={{ width: '48px', height: '56px' }}
          title="Ver perfil e alterar ícone"
          aria-label="Perfil do Treinador"
        >
          <span className="flex-1 flex items-center justify-center text-lg font-black leading-none text-ink">
            {day}
          </span>
          <span className="w-full bg-leaf py-0.5 text-center text-[10px] font-black uppercase text-white">
            {month}
          </span>
        </button>

        {/* Avatar medal with streak */}
        <div className="relative shrink-0">
          <button
            onClick={() => { sfx.tap(); setProfileModal(true); }}
            className="medal flex h-14 w-14 items-center justify-center overflow-hidden border-2 border-white/90 transition-transform active:scale-95"
            aria-label="Alterar avatar"
          >
            {renderAvatarContent()}
          </button>
          <span
            className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-warm-orange px-1.5 py-0.5 text-[10px] font-black text-white shadow"
            title={`${profile?.streakDays ?? 0} dias consecutivos de estudo`}
          >
            <Flame size={10} fill="currentColor" />
            {profile?.streakDays ?? 0}
          </span>
        </div>

        {/* Central Focus Power Bar */}
        <div className="glass flex min-w-0 flex-1 flex-col justify-center rounded-2xl px-3 py-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-ink/70">
            <span className="flex items-center gap-1">
              <Zap size={13} className="text-sleep-yellow-dark" fill="currentColor" /> Poder de Foco
            </span>
            <span className="text-sm font-black text-ink">{fp}</span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-ink/10 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-leaf to-sleep-yellow transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[10px] font-bold text-ink/50">
            <span>{profile ? `${profile.streakDays} dia(s) de ofensiva` : '...'}</span>
            <span className="text-leaf-dark font-black">Meta 600</span>
          </div>
        </div>

        {/* Currencies: Coins & Biscuits */}
        <div className="flex shrink-0 flex-col justify-between gap-1">
          <div
            className="pill-label flex items-center gap-1.5 px-2.5 py-1 text-xs font-black text-ink shadow-sm"
            title="Moedas de Foco (ganhas ao estudar)"
          >
            <Coins size={14} className="text-sleep-yellow-dark" fill="#ffcb05" />
            <span>{profile?.focusCoins ?? 0}</span>
          </div>
          <button
            onClick={() => { sfx.tap(); onShop(); }}
            className="pill-label flex items-center gap-1.5 px-2.5 py-1 text-xs font-black text-ink shadow-sm transition-transform active:scale-95 hover:border-warm-orange"
            aria-label="Abrir cantina de biscoitos"
            id="btn-open-shop"
            title="Biscoitos de Amizade (clique para abrir a loja)"
          >
            <Cookie size={14} className="text-warm-orange" fill="#ff8c42" />
            <span>{biscuits}</span>
          </button>
        </div>
      </header>

      {/* Modal de seleção de avatar */}
      <AnimatePresence>
        {profileModal && (
          <ProfileModal
            currentIcon={avatar}
            onSelectIcon={handleSelectAvatar}
            onClose={() => setProfileModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
