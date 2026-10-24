import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Coins, Cookie, Flame, Zap, Trophy } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { caterpieIcon, envUrl } from '../../lib/assets';
import { PokemonImage } from '../campsite/PokemonImage';
import { ProfileModal } from '../profile/ProfileModal';
import { LeaderboardModal } from '../leaderboard/LeaderboardModal';
import { sfx } from '../../lib/sfx';

interface Props {
  onShop: () => void;
}

const MONTHS_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export function TopHUD({ onShop }: Props) {
  const { profile, coffeeBreak } = useGame();
  const [profileModal, setProfileModal] = useState(false);
  const [leaderboardModal, setLeaderboardModal] = useState(false);
  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem('pokemoro_avatar') || 'caterpie');
  const [avatarBg, setAvatarBg] = useState<string>(() => localStorage.getItem('pokemoro_avatar_bg') || 'greengrass');

  const now = new Date();
  const day = now.getDate();
  const month = MONTHS_PT[now.getMonth()];

  const fp = coffeeBreak?.focusPower ?? 0;
  const pct = Math.min(100, Math.max(5, (fp / 600) * 100));
  const biscuits = profile ? profile.inventory.basic + profile.inventory.great + profile.inventory.master : 0;

  const handleSelectAvatar = (newIcon: string, newBg: string) => {
    setAvatar(newIcon);
    setAvatarBg(newBg);
    localStorage.setItem('pokemoro_avatar', newIcon);
    localStorage.setItem('pokemoro_avatar_bg', newBg);
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
          className="h-full w-full object-contain scale-135 drop-shadow-md"
        />
      );
    }
    return <img src={caterpieIcon} alt="Avatar" className="h-full w-full object-contain scale-120 drop-shadow-md" />;
  };

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-30 flex items-stretch gap-1.5 sm:gap-2.5 px-2 sm:px-3 pb-2.5 safe-top-padding">
        {/* Date badge estilo Pokémon Sleep */}
        <button
          onClick={() => { sfx.tap(); setProfileModal(true); }}
          className="flex h-12 w-11 sm:h-14 sm:w-12 shrink-0 flex-col items-center justify-between overflow-hidden rounded-2xl border-2 border-white/90 bg-white shadow-md transition-transform active:scale-95"
          title="Ver perfil e configurações"
          aria-label="Perfil do Treinador"
        >
          <span className="flex-1 flex items-center justify-center text-base sm:text-lg font-black leading-none text-ink">
            {day}
          </span>
          <span className="w-full bg-leaf py-0.5 text-center text-[9px] sm:text-[10px] font-black uppercase text-white tracking-wider">
            {month}
          </span>
        </button>

        {/* Avatar medal com fundo de cenário e streak dourado */}
        <div className="relative shrink-0">
          <button
            onClick={() => { sfx.tap(); setProfileModal(true); }}
            className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center overflow-hidden rounded-full border-[2.5px] sm:border-[3px] border-white shadow-md transition-transform active:scale-95"
            style={{ boxShadow: '0 0 0 2.5px #ffcb05, 0 4px 8px rgba(0,0,0,0.25)' }}
            aria-label="Alterar avatar e configurações"
          >
            {/* Textura do cenário/chão recortada em círculo */}
            <img
              src={envUrl(avatarBg)}
              alt="Cenário de fundo"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="relative z-10 flex h-full w-full items-center justify-center p-0.5">
              {renderAvatarContent()}
            </div>
          </button>
          <span
            className="absolute -bottom-1 -right-1 z-20 flex items-center gap-0.5 rounded-full bg-warm-orange px-1.5 py-0.2 text-[9px] sm:text-[10px] font-black text-white shadow streak-icon"
            title={`${profile?.streakDays ?? 0} dias consecutivos de estudo`}
          >
            <Flame size={9} fill="currentColor" />
            {profile?.streakDays ?? 0}
          </span>
        </div>

        {/* Central Focus Power Bar (Estritamente sem quebra de linha) */}
        <div className="glass flex min-w-0 flex-1 flex-col justify-center rounded-2xl px-2 sm:px-3 py-1 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wide text-ink/75">
            <span className="flex items-center gap-1 whitespace-nowrap truncate">
              <Zap size={12} className="text-sleep-yellow-dark shrink-0" fill="currentColor" />
              <span>PODER DE FOCO</span>
            </span>
            <span className="text-xs sm:text-sm font-black text-ink whitespace-nowrap ml-1">{fp}</span>
          </div>
          <div className="mt-1 h-2 sm:h-2.5 overflow-hidden rounded-full bg-ink/10 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-leaf to-sleep-yellow transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-ink/60">
            <span className="whitespace-nowrap truncate">{profile ? `${profile.streakDays} dia(s) de ofensiva` : '...'}</span>
            <span className="text-leaf-dark font-black whitespace-nowrap ml-1 shrink-0">Meta 600</span>
          </div>
        </div>

        {/* Currencies: Coins & Biscuits & Leaderboard */}
        <div className="flex shrink-0 flex-col justify-between gap-1">
          <div className="flex items-center gap-1">
            <div
              className="pill-label flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black text-ink shadow-sm whitespace-nowrap"
              title="Moedas de Foco (ganhas ao estudar)"
            >
              <Coins size={12} className="text-sleep-yellow-dark shrink-0" fill="#ffcb05" />
              <span>{profile?.focusCoins ?? 0}</span>
            </div>
            <button
              id="btn-top-leaderboard"
              onClick={() => { sfx.tap(); setLeaderboardModal(true); }}
              className="pill-label flex items-center justify-center p-1 sm:p-1.5 shadow-sm transition-transform active:scale-95 text-[#f59e0b] hover:border-[#f59e0b]"
              title="Ranking Global de Treinadores"
              aria-label="Ranking Global"
            >
              <Trophy size={13} fill="currentColor" />
            </button>
          </div>
          <button
            onClick={() => { sfx.tap(); onShop(); }}
            className="pill-label flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black text-ink shadow-sm transition-transform active:scale-95 hover:border-warm-orange whitespace-nowrap"
            aria-label="Abrir cantina de biscoitos"
            id="btn-open-shop"
            title="Biscoitos de Amizade (clique para abrir a loja)"
          >
            <Cookie size={12} className="text-warm-orange shrink-0" fill="#ff8c42" />
            <span>{biscuits}</span>
          </button>
        </div>
      </header>

      {/* Modal de seleção de avatar e configurações */}
      <AnimatePresence>
        {profileModal && (
          <ProfileModal
            currentIcon={avatar}
            currentBg={avatarBg}
            onSelectIcon={handleSelectAvatar}
            onClose={() => setProfileModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Modal de Ranking Global */}
      <AnimatePresence>
        {leaderboardModal && (
          <LeaderboardModal onClose={() => setLeaderboardModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
