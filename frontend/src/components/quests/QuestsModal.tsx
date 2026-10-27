import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, Gift, Flame, Award, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { loadDailyQuests, claimDailyReward, type DailyQuest } from '../../lib/quests';
import { useGame } from '../../hooks/useGameState';
import { sfx } from '../../lib/sfx';
import { ResearchQuestIcon, PokeCoinIcon, PokeBiscuitIcon, GymBadgeIcon } from '../common/PokemonThemedIcons';
import { BADGE_TIERS, getEarnedBadgeCount, nextBadgeProgress, getBadgeTier, BADGE_STEP_DAYS, getBadgeGifUrl, getBadgeFallbackGifUrl } from '../../lib/badges';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function QuestsModal({ isOpen, onClose }: Props) {
  const { profile, refreshProfile, patchInventory, toast } = useGame();
  const [quests, setQuests] = useState<DailyQuest[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuests(loadDailyQuests());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = (quest: DailyQuest) => {
    const res = claimDailyReward(quest.id);
    if (!res.success) return;

    sfx.bell();
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } });

    if (quest.rewardType === 'coins' && profile) {
      profile.focusCoins += quest.rewardAmount;
      void refreshProfile();
    } else if (quest.rewardType === 'biscuit_basic' && profile) {
      profile.inventory.basic += quest.rewardAmount;
      patchInventory(profile.inventory);
    }

    toast(`Recompensa resgatada: ${quest.rewardLabel}!`, 'ok');
    setQuests(loadDailyQuests());
  };

  const completedCount = quests.filter((q) => q.completed).length;
  const streak = profile?.streakDays || 0;
  const earnedCount = getEarnedBadgeCount(streak);
  const nextInfo = nextBadgeProgress(streak);
  const nextBadge = getBadgeTier(nextInfo.nextIndex);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-xs select-none"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.88, y: 25 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar rounded-[2rem] bg-gradient-to-b from-[#fffef9] to-[#f4f7fa] p-5 text-slate-800 shadow-2xl border border-white/60"
        >
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 shadow-inner border border-blue-200">
              <ResearchQuestIcon size={26} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Missões & Ginásios
              </h2>
              <p className="text-[11px] font-bold text-slate-500">
                Professor Ricardo · {completedCount}/3 Diárias Concluídas
              </p>
            </div>
          </div>

          {/* Jornada de Ginásios Pokémon: 1 Insígnia a cada 10 dias de ofensiva */}
          <div className="mt-3.5 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-yellow-50/80 p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award size={15} className="text-amber-600" />
                <span className="text-xs font-black text-amber-950">Insígnias de Ginásio</span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300/60 shadow-2xs">
                <Flame size={11} fill="currentColor" className="text-orange-500" />
                <span>{streak} dias de ofensiva</span>
              </span>
            </div>

            <p className="mt-1 text-[10px] font-bold text-amber-900/80 leading-snug">
              Conquiste 1 insígnia oficial de ginásio a cada 10 dias ininterruptos de estudo!
            </p>

            {/* Estojo com as 8 Insígnias de Kanto (Serebii 01.gif a 08.gif) */}
            <div className="mt-2.5 grid grid-cols-4 gap-1.5 rounded-xl bg-white/70 p-2 border border-amber-200/70 shadow-2xs">
              {BADGE_TIERS.map((tier, idx) => {
                const isUnlocked = idx < earnedCount;
                const requiredDays = (idx + 1) * BADGE_STEP_DAYS;
                const gifUrl = getBadgeGifUrl(idx);
                const fallbackUrl = getBadgeFallbackGifUrl(idx);

                return (
                  <div
                    key={tier.id}
                    className={`relative flex flex-col items-center justify-center rounded-lg p-1.5 transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-b from-amber-100/70 to-yellow-100/60 shadow-xs border border-amber-300/80'
                        : 'bg-slate-100/60 border border-slate-200/70 opacity-60'
                    }`}
                    title={`${tier.name} (${tier.gym}) - ${isUnlocked ? 'Conquistada! ⭐' : `Requer ${requiredDays} dias de ofensiva`}`}
                  >
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <img
                        src={gifUrl}
                        alt={tier.name}
                        onError={(e) => { e.currentTarget.src = fallbackUrl; }}
                        className={`h-7 w-7 object-contain drop-shadow-xs transition-transform ${
                          isUnlocked ? 'scale-110 drop-shadow-md' : 'grayscale opacity-35'
                        }`}
                      />
                      {isUnlocked ? (
                        <span className="absolute -top-1 -right-1 text-[8px]">✨</span>
                      ) : (
                        <Lock size={9} className="absolute text-slate-700 drop-shadow-2xs" />
                      )}
                    </div>
                    <span className={`mt-1 text-[9px] font-black truncate max-w-full ${isUnlocked ? 'text-amber-950' : 'text-slate-500'}`}>
                      {isUnlocked ? tier.name.replace('Insígnia ', '') : `${requiredDays}d`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Barra de progresso para a próxima insígnia */}
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-amber-950">
              <span className="truncate">
                {earnedCount >= 8 ? (
                  '🏆 Mestre dos Ginásios! Ciclo de Insígnias Brilhantes ativo'
                ) : (
                  <>Próxima: <strong className="text-orange-700">{nextBadge.name}</strong> ({nextInfo.daysLeft} {nextInfo.daysLeft === 1 ? 'dia restante' : 'dias restantes'})</>
                )}
              </span>
              <span className="shrink-0 text-amber-800 font-black ml-1">
                {earnedCount}/8
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-amber-200/60 p-[1px] overflow-hidden border border-amber-300/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
                style={{ width: `${Math.round(nextInfo.progress * 100)}%` }}
              />
            </div>
          </div>

          {/* Lista de Missões Diárias */}
          <div className="mt-3.5 flex flex-col gap-2">
            {quests.map((q) => {
              const pct = Math.min(100, (q.current / q.target) * 100);

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-3.5 transition-all ${
                    q.claimed
                      ? 'border-emerald-200 bg-emerald-50/60 opacity-80'
                      : q.completed
                      ? 'border-amber-300 bg-amber-50/80 shadow-sm'
                      : 'border-slate-200/90 bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{q.icon}</span>
                      <div>
                        <div className="text-xs font-black text-slate-900">{q.title}</div>
                        <div className="text-[10px] font-semibold text-slate-500 leading-tight">
                          {q.desc}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      {q.rewardType === 'coins' ? <PokeCoinIcon size={13} /> : <PokeBiscuitIcon size={13} type="basic" />}
                      {q.rewardLabel}
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60 p-[1px]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 min-w-[32px] text-right">
                      {q.current}/{q.target}
                    </span>
                  </div>

                  {/* Botão de Resgate */}
                  {q.completed && !q.claimed && (
                    <button
                      onClick={() => handleClaim(q)}
                      className="btn mt-2.5 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs py-1.5 shadow-md flex items-center justify-center gap-1.5 animate-pulse"
                    >
                      <Gift size={13} />
                      <span>Resgatar Recompensa!</span>
                    </button>
                  )}

                  {q.claimed && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-black text-emerald-700">
                      <CheckCircle2 size={13} />
                      <span>Concluída e Resgatada!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dica de rodapé */}
          <div className="mt-4 rounded-xl bg-slate-100/80 p-2.5 text-center text-[10px] font-bold text-slate-500">
            As missões renovam todos os dias à meia-noite. Mantenha seu ritmo de estudos! ⏱️
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
