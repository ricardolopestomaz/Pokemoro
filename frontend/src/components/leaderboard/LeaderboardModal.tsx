import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, RefreshCw, X, Sparkles, CheckCircle2, Trophy } from 'lucide-react';
import { api } from '../../api/endpoints';
import { PokemonImage } from '../campsite/PokemonImage';
import { envUrl } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import { BadgeStrip } from '../common/BadgeStrip';
import { badgeCountForStreak, getEarnedBadgeCount } from '../../lib/badges';
import { readLiveTeam } from '../../lib/sync-queue';
import type { LeaderboardEntryDTO, LeaderboardTimeframe, LeaderboardResponseDTO } from '../../types';

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center select-none" title="1º Lugar - Fita Master">
        <img
          src="/medals/rank_1.png"
          onError={(e) => {
            e.currentTarget.src = 'https://i0.wp.com/www.serebii.net/games/ribbons/toughcontestmasterrankribbon-s.png?w=640&ssl=1';
          }}
          alt="1º Lugar"
          className="h-8 w-8 object-contain drop-shadow-sm transition-transform hover:scale-110"
          draggable={false}
        />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center select-none" title="2º Lugar - Fita Super">
        <img
          src="/medals/rank_2.png"
          onError={(e) => {
            e.currentTarget.src = 'https://i0.wp.com/www.serebii.net/games/ribbons/smartcontestsuperrankribbon-s.png?w=640&ssl=1';
          }}
          alt="2º Lugar"
          className="h-7 w-7 object-contain drop-shadow-sm transition-transform hover:scale-110"
          draggable={false}
        />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center select-none" title="3º Lugar - Fita Normal">
        <img
          src="/medals/rank_3.png"
          onError={(e) => {
            e.currentTarget.src = 'https://i0.wp.com/www.serebii.net/games/ribbons/coolcontestnormalrankribbon-s.png?w=640&ssl=1';
          }}
          alt="3º Lugar"
          className="h-6.5 w-6.5 object-contain drop-shadow-sm transition-transform hover:scale-110"
          draggable={false}
        />
      </div>
    );
  }
  return (
    <span className="text-xs font-black text-slate-400 font-mono tracking-tight select-none">
      #{rank}
    </span>
  );
}

interface Props {
  onClose: () => void;
}

const TIMEFRAMES: { id: LeaderboardTimeframe; label: string }[] = [
  { id: 'weekly', label: 'Semanal' },
  { id: 'daily', label: 'Diário' },
  { id: 'monthly', label: 'Mensal' },
  { id: 'all_time', label: 'Geral' },
];

export function LeaderboardModal({ onClose }: Props) {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('weekly');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<LeaderboardResponseDTO | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const loadLeaderboard = useCallback(async (tf: LeaderboardTimeframe) => {
    setLoading(true);
    try {
      const res = await api.getLeaderboard({ timeframe: tf, limit: 50 });
      setData(res);
      setPendingCount(api.getPendingSyncCount());
    } catch {
      // Falha silenciosa com fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard(timeframe);
  }, [timeframe, loadLeaderboard]);

  const handleSyncNow = async () => {
    sfx.tap();
    setSyncing(true);
    try {
      await api.syncPending();
      sfx.fanfare();
      await loadLeaderboard(timeframe);
    } catch {
      // Ignora erro de rede
    } finally {
      setSyncing(false);
    }
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <motion.div
      className="absolute inset-0 z-[75] flex items-end bg-black/60 backdrop-blur-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="flex h-[90vh] w-full flex-col rounded-t-[2.4rem] bg-cream pb-6 pt-5 shadow-2xl"
      >
        {/* Header Superior com Troféu Oficial */}
        <div className="border-b border-ink/10 px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100/90 text-amber-600 shadow-xs border border-amber-200">
                <Trophy size={24} className="text-amber-500 fill-amber-400 drop-shadow-xs" />
              </div>
              <div>
                <h2 className="text-lg font-black text-ink">Ranking Global</h2>
                <p className="text-[10px] font-bold text-ink/60">
                  Pokémoro Study League · Classificação de Estudantes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                title="Sincronizar fila pendente com a nuvem"
                className="flex h-9 items-center gap-1 rounded-full border border-ink/10 bg-white px-2.5 text-xs font-black text-ink/70 shadow-xs active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin text-leaf' : ''} />
                {pendingCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warm-orange px-1 text-[9px] font-black text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { sfx.tap(); onClose(); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink/70 shadow-xs active:scale-90"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Abas de Período */}
          <div className="mt-3 flex rounded-2xl bg-ink/5 p-1">
            {TIMEFRAMES.map((tf) => {
              const active = timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  id={`tab-leaderboard-${tf.id}`}
                  onClick={() => { sfx.tap(); setTimeframe(tf.id); }}
                  className={`relative flex-1 rounded-xl py-1.5 text-center text-xs font-black transition-all ${
                    active ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card do Usuário Atual (Destaque Fixo) */}
        {data?.userSummary && (
          <div className="mx-4 mt-3 rounded-2xl border-2 border-leaf/60 bg-gradient-to-r from-leaf/15 to-sleep-yellow/15 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm">
                  <img
                    src={envUrl(data.userSummary.avatarBg || 'greengrass')}
                    alt="Cenário"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <PokemonImage
                      pokemonId={data.userSummary.avatarPokemonId}
                      variant={data.userSummary.avatarVariant}
                      alt="Seu Avatar"
                      menu
                      className="h-full w-full scale-135 object-contain drop-shadow"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-black text-ink truncate max-w-[130px]">{data.userSummary.displayName}</span>
                    <span className="rounded-full bg-leaf px-1.5 py-0.2 text-[8px] font-black uppercase text-white shrink-0">
                      Você
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-warm-orange shrink-0 ml-1">
                      <Flame size={10} fill="currentColor" /> {data.userSummary.streakDays}d
                    </span>
                    <span className="text-[10px] font-bold text-leaf-dark shrink-0 ml-1">
                      • {formatMinutes(data.userSummary.minutesStudied)}
                    </span>
                  </div>

                  {/* Fileira horizontal com mini-sprites da equipe e insígnias */}
                  {(() => {
                    const live = readLiveTeam();
                    const userTeamList = (data.userSummary.equippedTeam && data.userSummary.equippedTeam.length > 0)
                      ? data.userSummary.equippedTeam
                      : (live.length > 0 ? live : [data.userSummary.avatarPokemonId || 10]);
                    const userBadges = data.userSummary.badges ?? getEarnedBadgeCount(data.userSummary.streakDays);
                    return (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <div className="flex items-center gap-0.5 bg-white/90 px-1.5 py-0.5 rounded-full border border-leaf/40 shadow-2xs shrink-0">
                          {userTeamList.slice(0, 5).map((member, idx) => {
                            const pokeId = typeof member === 'number' ? member : (member?.pokemonId || 10);
                            const variant = typeof member === 'object' && member?.variant ? member.variant : 'regular';
                            return (
                              <div key={`user-team-${pokeId}-${idx}`} className="relative h-4.5 w-4.5 shrink-0 flex items-center justify-center" title={`Equipe #${pokeId}`}>
                                <PokemonImage
                                  pokemonId={pokeId}
                                  variant={variant}
                                  menu
                                  alt={`Equipe #${pokeId}`}
                                  className="h-full w-full object-contain scale-110"
                                />
                              </div>
                            );
                          })}
                        </div>
                        {userBadges > 0 && <BadgeStrip count={userBadges} size={14} className="shrink-0" />}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <span className="text-[10px] font-black uppercase text-ink/50">Sua Posição</span>
                <div className="text-lg font-black text-leaf-dark">
                  #{data.userSummary.rank}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista Rolável de Participantes */}
        <div className="mt-2 flex-1 overflow-y-auto px-4 no-scrollbar">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-ink/50">
              <RefreshCw size={24} className="animate-spin text-leaf" />
              <span className="text-xs font-bold">Consultando ranking global...</span>
            </div>
          ) : !data || data.entries.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-ink/50">
              <Trophy size={38} className="text-amber-400 opacity-40" />
              <p className="mt-2 text-xs font-bold">Nenhum registro de estudo ainda.</p>
              <p className="text-[10px] text-ink/40">Conclua um Pomodoro para entrar no ranking!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-6">
              {data.entries.map((entry: LeaderboardEntryDTO) => {
                const isUser = entry.isCurrentUser;
                return (
                  <div
                    key={`${entry.userId}-${entry.rank}`}
                    className={`flex items-center justify-between rounded-2xl border p-2.5 shadow-xs transition-all ${
                      isUser
                        ? 'border-2 border-leaf bg-leaf/5'
                        : entry.rank === 1
                        ? 'border-amber-300/60 bg-gradient-to-r from-amber-50/40 via-white to-white hover:bg-cream/50 shadow-xs'
                        : entry.rank === 2
                        ? 'border-slate-300/60 bg-gradient-to-r from-slate-50/40 via-white to-white hover:bg-cream/50 shadow-xs'
                        : entry.rank === 3
                        ? 'border-amber-700/25 bg-gradient-to-r from-orange-50/30 via-white to-white hover:bg-cream/50 shadow-xs'
                        : 'border-ink/5 bg-white hover:bg-cream/50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Medalha de Posição sem fundo pesado */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-transparent">
                        <RankMedal rank={entry.rank} />
                      </div>

                      {/* Avatar do Estudante com Fundo de Cenário */}
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white shadow-xs">
                        <img
                          src={envUrl(entry.avatarBg || 'greengrass')}
                          alt="Cenário"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="relative z-10 flex h-full w-full items-center justify-center">
                          <PokemonImage
                            pokemonId={entry.avatarPokemonId}
                            variant={entry.avatarVariant}
                            alt={entry.displayName}
                            menu
                            className="h-full w-full scale-135 object-contain drop-shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Nome, Streak, Equipe e Insígnias */}
                      <div className="flex-1 min-w-0">
                        {/* Linha 1: Nome, Sparkle, Tag Você e Streak */}
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs font-black text-ink truncate max-w-[120px]">{entry.displayName}</span>
                          {entry.avatarVariant === 'shiny' && (
                            <span title="Avatar Shiny!" className="shrink-0">
                              <Sparkles size={11} className="text-sleep-yellow-dark" />
                            </span>
                          )}
                          {isUser && (
                            <span className="rounded-full bg-leaf px-1 text-[8px] font-black text-white shrink-0">
                              Você
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-warm-orange shrink-0 ml-1">
                            <Flame size={9} fill="currentColor" />
                            <span>{entry.streakDays}d</span>
                          </span>
                        </div>

                        {/* Linha 2: Equipe Pokémon e Insígnias alinhadas logo abaixo */}
                        {(() => {
                          const live = readLiveTeam();
                          const teamList = (entry.equippedTeam && entry.equippedTeam.length > 0)
                            ? entry.equippedTeam
                            : (isUser && live.length > 0 ? live : [entry.avatarPokemonId || 10]);
                          const entryBadges = entry.badges ?? (isUser ? getEarnedBadgeCount(entry.streakDays) : badgeCountForStreak(entry.streakDays));
                          return (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <div className="flex items-center gap-0.5 bg-cream px-1.5 py-0.5 rounded-full border border-ink/10 shadow-2xs shrink-0">
                                {teamList.slice(0, 5).map((member, tIdx) => {
                                  const pokeId = typeof member === 'number' ? member : (member?.pokemonId || 10);
                                  const variant = typeof member === 'object' && member?.variant ? member.variant : 'regular';
                                  return (
                                    <div key={`${entry.userId}-team-${pokeId}-${tIdx}`} className="relative h-4.5 w-4.5 shrink-0 flex items-center justify-center" title={`Pokémon #${pokeId}`}>
                                      <PokemonImage
                                        pokemonId={pokeId}
                                        variant={variant}
                                        menu
                                        alt={`Membro #${pokeId}`}
                                        className="h-full w-full object-contain scale-110"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              {entryBadges > 0 && <BadgeStrip count={entryBadges} size={14} className="shrink-0" />}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Minutos Estudados */}
                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-black text-ink whitespace-nowrap">
                        {formatMinutes(entry.minutesStudied)}
                      </div>
                      <span className="text-[9px] font-bold text-ink/40 uppercase">Foco</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
