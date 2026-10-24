import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Clock, RefreshCw, X, Cloud, CloudOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/endpoints';
import { PokemonImage } from '../campsite/PokemonImage';
import { envUrl } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { LeaderboardEntryDTO, LeaderboardTimeframe, LeaderboardResponseDTO } from '../../types';

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
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;
  const isCloud = isSupabaseConfigured() && isOnline;

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

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-[#ffcb05] text-[#7a5900]', icon: '🥇', border: 'border-[#ffcb05]' };
    if (rank === 2) return { bg: 'bg-[#cfd8dc] text-[#37474f]', icon: '🥈', border: 'border-[#cfd8dc]' };
    if (rank === 3) return { bg: 'bg-[#d7ccc8] text-[#4e342e]', icon: '🥉', border: 'border-[#d7ccc8]' };
    return { bg: 'bg-ink/5 text-ink/70', icon: `#${rank}`, border: 'border-transparent' };
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
        {/* Header Superior */}
        <div className="border-b border-ink/10 px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sleep-yellow/30 text-sleep-yellow-dark shadow-xs">
                <Trophy size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-black text-ink">Ranking Global</h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      isCloud
                        ? 'bg-leaf/15 text-leaf-dark'
                        : 'bg-warm-orange/15 text-warm-orange'
                    }`}
                  >
                    {isCloud ? <Cloud size={10} /> : <CloudOff size={10} />}
                    {isCloud ? 'Supabase' : 'Offline-First'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-ink/60">
                  Pokémoro Study League · Sincronização em Nuvem
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
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm">
                  <img
                    src={envUrl(data.userSummary.avatarBg || 'greengrass')}
                    alt="Cenário"
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

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-ink">{data.userSummary.displayName}</span>
                    <span className="rounded-full bg-leaf px-1.5 py-0.2 text-[8px] font-black uppercase text-white">
                      Você
                    </span>
                    {/* Fileira horizontal com mini-sprites da equipe do usuário */}
                    {data.userSummary.equippedTeam && data.userSummary.equippedTeam.length > 0 && (
                      <div className="flex items-center gap-0.5 ml-0.5 bg-white/80 px-1.5 py-0.5 rounded-full border border-leaf/40 shadow-2xs">
                        {data.userSummary.equippedTeam.slice(0, 5).map((pokeId, idx) => (
                          <div key={`user-team-${pokeId}-${idx}`} className="h-5 w-5 shrink-0 flex items-center justify-center overflow-hidden">
                            <PokemonImage
                              pokemonId={pokeId}
                              menu
                              alt={`Equipe #${pokeId}`}
                              className="h-full w-full object-contain scale-120 drop-shadow-2xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-ink/70">
                    <span className="flex items-center gap-0.5 text-warm-orange">
                      <Flame size={11} fill="currentColor" /> {data.userSummary.streakDays} dias
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-leaf-dark">
                      <Clock size={11} /> {formatMinutes(data.userSummary.minutesStudied)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
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
              <Trophy size={32} className="opacity-30" />
              <p className="mt-2 text-xs font-bold">Nenhum registro de estudo ainda.</p>
              <p className="text-[10px] text-ink/40">Conclua um Pomodoro para entrar no ranking!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-6">
              {data.entries.map((entry: LeaderboardEntryDTO) => {
                const badge = getRankBadge(entry.rank);
                const isUser = entry.isCurrentUser;
                return (
                  <motion.div
                    key={`${entry.userId}-${entry.rank}`}
                    layout
                    className={`flex items-center justify-between rounded-2xl border bg-white p-2.5 shadow-xs transition-all ${
                      isUser
                        ? 'border-2 border-leaf bg-leaf/5'
                        : `${badge.border} hover:bg-cream/50`
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Badge de Posição */}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-black text-xs ${badge.bg}`}
                      >
                        {badge.icon}
                      </div>

                      {/* Avatar do Estudante com Fundo de Cenário */}
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white shadow-xs">
                        <img
                          src={envUrl(entry.avatarBg || 'greengrass')}
                          alt="Cenário"
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

                      {/* Nome, Equipe e Streak */}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-ink">{entry.displayName}</span>
                          {entry.avatarVariant === 'shiny' && (
                            <span title="Avatar Shiny!">
                              <Sparkles size={11} className="text-sleep-yellow-dark" />
                            </span>
                          )}
                          {isUser && (
                            <span className="rounded-full bg-leaf px-1 text-[8px] font-black text-white">
                              Você
                            </span>
                          )}
                          {/* Fileira horizontal com os mini-sprites da equipe do jogador */}
                          {entry.equippedTeam && entry.equippedTeam.length > 0 && (
                            <div className="flex items-center gap-0.5 ml-0.5 bg-cream px-1.5 py-0.5 rounded-full border border-ink/10 shadow-2xs">
                              {entry.equippedTeam.slice(0, 5).map((pokeId, tIdx) => (
                                <div key={`${entry.userId}-team-${pokeId}-${tIdx}`} className="h-5 w-5 shrink-0 flex items-center justify-center overflow-hidden" title={`Pokémon #${pokeId}`}>
                                  <PokemonImage
                                    pokemonId={pokeId}
                                    menu
                                    alt={`Membro #${pokeId}`}
                                    className="h-full w-full object-contain scale-120 drop-shadow-2xs"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-warm-orange">
                          <Flame size={10} fill="currentColor" />
                          <span>{entry.streakDays} dias seguidos</span>
                        </div>
                      </div>
                    </div>

                    {/* Minutos Estudados */}
                    <div className="text-right">
                      <div className="text-xs font-black text-ink">
                        {formatMinutes(entry.minutesStudied)}
                      </div>
                      <span className="text-[9px] font-bold text-ink/40 uppercase">Foco</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
