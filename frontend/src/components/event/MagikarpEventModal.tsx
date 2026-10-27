import React, { useState } from 'react';
import type {
  MagikarpEventStateDTO,
  MagikarpUserProgressDTO,
  MagikarpMilestone,
} from '../../types/magikarp-event';
import { playMagikarpCry, playGyaradosCry } from '../../lib/magikarpAudio';
import { sfx } from '../../lib/sfx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventState: MagikarpEventStateDTO;
  userProgress: MagikarpUserProgressDTO;
  milestones: MagikarpMilestone[];
  onClaimMilestone: (id: string) => void;
  onOpenMiniGame: () => void;
  onOpenClimaxCutscene: () => void;
  onOpenDevSwitcher?: () => void;
}

export function MagikarpEventModal({
  isOpen,
  onClose,
  eventState,
  userProgress,
  milestones,
  onClaimMilestone,
  onOpenMiniGame,
  onOpenClimaxCutscene,
  onOpenDevSwitcher,
}: Props) {
  const [copiedStory, setCopiedStory] = useState(false);

  if (!isOpen) return null;

  const { communityGoal, currentPhase, secondsUntilNextPhase } = eventState;
  const isClimaxReady = currentPhase === 'climax' || communityGoal.isTargetAchieved;

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  const handleClaim = (id: string) => {
    sfx.fanfare();
    if (id === 'comm_100pct') {
      playGyaradosCry(1.0);
    } else {
      playMagikarpCry(0.8);
    }
    onClaimMilestone(id);
  };

  const handleCopyStory = () => {
    sfx.tap();
    const text = `⚡ POKEMORO LIVE EVENT: DIA DO MAGIKARP 🐉\n⏱️ Meus Minutos Estudados: ${userProgress.eventMinutesStudied} min\n🚀 Recorde de Salto: ${userProgress.highestMiniGameJumpMeters || userProgress.jumpMeters} metros\n🌊 Meta Mundial: ${communityGoal.currentCommunityMinutes} / ${communityGoal.targetMinutes} min (${communityGoal.progressPercentage}%)\n"Do peixe mais fraco ao dragão da aprovação."\n@PokemoroApp`;
    navigator.clipboard.writeText(text);
    setCopiedStory(true);
    setTimeout(() => setCopiedStory(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-[32px] sm:rounded-[32px] bg-slate-900 border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.4)] overflow-hidden text-white">
        
        {/* Glow de fundo */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-cyan-500/20 via-blue-600/10 to-transparent pointer-events-none" />

        {/* Header Estilo Fortnite Event Pass */}
        <div className="relative p-5 pb-3 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-900 p-1 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center shrink-0">
              <img
                src="/assets/magikarp_shiny.gif"
                alt="Magikarp"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/sprites/menu/shiny/0129_s.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-cyan-400 text-slate-950">
                  PASSE DE EVENTO AO VIVO
                </span>
                <span className="text-[10px] text-cyan-300 font-mono font-bold">
                  ⏳ {formatCountdown(secondsUntilNextPhase)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow">
                A Ascensão do Dragão
              </h2>
              <p className="text-[11px] text-cyan-200/80 font-bold">
                {userProgress.eventMinutesStudied}m focados por você • {userProgress.jumpMeters}m de salto
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/90 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold active:scale-95 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* Trilha de Recompensas do Passe de Batalha (Sem abas chatas!) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Card Especial de Clímax se o Dragão Despertou */}
          {isClimaxReady && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-2 border-red-500 p-4 shadow-[0_0_30px_rgba(239,68,68,0.6)] text-center animate-pulse">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img
                  src="/assets/gyarados_shiny.gif"
                  alt="Red Gyarados"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/sprites/menu/shiny/0130_s.png';
                  }}
                />
                <div className="text-left">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white tracking-widest">
                    EVENTO AO VIVO LIBERADO
                  </span>
                  <h3 className="text-base font-black text-amber-300">
                    O Gyarados Vermelho Rompeu as Águas!
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sfx.fanfare();
                  playGyaradosCry(1.0);
                  onOpenClimaxCutscene();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-red-500 to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                🐉 Assistir Cena Cinematográfica
              </button>
            </div>
          )}

          {/* Lista Linear de Recompensas */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>Trilha de Recompensas & Conquistas</span>
              <span className="text-slate-400">{milestones.filter(m => m.isClaimed).length}/{milestones.length} Resgatados</span>
            </div>

            {milestones.map((m) => {
              const isLocked = !m.isUnlocked;
              return (
                <div
                  key={m.id}
                  className={`relative overflow-hidden rounded-2xl p-3 border-2 transition-all flex items-center justify-between gap-3 ${
                    m.isClaimed
                      ? 'bg-slate-950/80 border-emerald-500/40 opacity-75'
                      : m.isUnlocked
                      ? 'bg-gradient-to-r from-blue-950/90 to-cyan-950/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse'
                      : 'bg-slate-950/60 border-white/10 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-white/10 shrink-0">
                      {m.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{m.title}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">({m.requiredMinutes}m)</span>
                        {m.type === 'community' && (
                          <span className="text-[8px] font-extrabold uppercase bg-indigo-600 px-1 py-0.2 rounded text-white">
                            Global
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-cyan-300">
                        {m.rewardLabel}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.description}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {m.isClaimed ? (
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Resgatado ✓
                      </span>
                    ) : m.isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(m.id)}
                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 transition-all"
                      >
                        Resgatar! ⚡
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-500 bg-slate-800/80">
                        Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ações Rápidas de Jogo (Sem menus) */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                sfx.tap();
                onOpenMiniGame();
              }}
              className="py-3 px-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>🎮</span>
              <span>Desafio do Salto</span>
            </button>

            <button
              type="button"
              onClick={handleCopyStory}
              className="py-3 px-3 rounded-2xl bg-slate-800 border border-cyan-400/30 text-cyan-300 font-black text-xs uppercase tracking-wider hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>📸</span>
              <span>{copiedStory ? 'Copiado! ✓' : 'Stories Instagram'}</span>
            </button>
          </div>

          {onOpenDevSwitcher && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onOpenDevSwitcher}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline"
              >
                🛠️ Abrir Ajustes de Teste & Simulação
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
