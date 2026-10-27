import React from 'react';
import type { CommunityGoalCalculationDTO, MagikarpEventPhase } from '../../types/magikarp-event';
import { playMagikarpCry } from '../../lib/magikarpAudio';
import { sfx } from '../../lib/sfx';

interface Props {
  goal: CommunityGoalCalculationDTO;
  phase: MagikarpEventPhase;
  userMinutes: number;
  hasUnclaimedMilestone: boolean;
  onOpenEventPass: () => void;
  onLaunchClimax?: () => void;
  onLaunchJumpGame?: () => void;
}

export function MagikarpBottomEventBar({
  goal,
  phase,
  userMinutes,
  hasUnclaimedMilestone,
  onOpenEventPass,
  onLaunchClimax,
  onLaunchJumpGame,
}: Props) {
  const isTargetMet = goal.isTargetAchieved;

  const handleBarClick = () => {
    sfx.tap();
    playMagikarpCry(0.5);
    onOpenEventPass();
  };

  return (
    <div className="w-full px-2.5 pb-1 pointer-events-auto select-none animate-fadeIn">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/50 p-2.5 shadow-[0_0_25px_rgba(6,182,212,0.35)] backdrop-blur-xl">
        
        {/* Glow de fundo dinâmico */}
        <div
          className={`absolute -inset-1 opacity-30 blur-md pointer-events-none ${
            isTargetMet
              ? 'bg-gradient-to-r from-red-600 via-amber-500 to-rose-600 animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-400'
          }`}
        />

        {/* Linha 1: Cabeçalho Estilo Fortnite Battle Pass */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            {/* Ícone Estilo Pokémon Sleep do Magikarp */}
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-700/40 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.5)] p-0.5 shrink-0 overflow-hidden">
              <img
                src="/sprites/menu/regular/0129.png"
                alt="Magikarp"
                className="w-full h-full object-contain transform -scale-x-100"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 drop-shadow">
                  {phase === 'climax' || isTargetMet ? '⚡ O DRAGÃO DESPERTOU!' : 'META COLETIVA: A CACHOEIRA'}
                </span>
                {phase === 'live' && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-600 text-white tracking-widest animate-pulse">
                    AO VIVO
                  </span>
                )}
              </div>
              <div className="text-[10px] text-cyan-300 font-bold flex items-center gap-1.5">
                <span>{goal.activeUsersCount} Alunos Conectados</span>
                <span>•</span>
                <span className="text-white/80 font-mono">Você: {userMinutes}m</span>
              </div>
            </div>
          </div>

          {/* Números e Ação Rápida */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs font-mono font-black text-white flex items-center justify-end gap-1">
                <span className="text-cyan-300">{goal.currentCommunityMinutes}</span>
                <span className="text-cyan-600">/</span>
                <span className="text-slate-300">{goal.targetMinutes}m</span>
              </div>
              <div className="text-[10px] font-mono font-black text-cyan-400">
                {goal.progressPercentage}%
              </div>
            </div>

            {/* Botão de Ação Direta Sem Menus Chatos */}
            {isTargetMet && onLaunchClimax ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.fanfare();
                  onLaunchClimax();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-red-500 to-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.8)] hover:scale-105 active:scale-95 transition-all animate-bounce"
              >
                🐉 Ver Clímax!
              </button>
            ) : hasUnclaimedMilestone ? (
              <button
                type="button"
                onClick={handleBarClick}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                🎁 Recompensas!
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBarClick}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-cyan-400/30 text-cyan-300 font-black text-[10px] uppercase tracking-wider hover:bg-slate-700 active:scale-95 transition-all"
              >
                Passe ⚡
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Barra de Energia em Estilo Game HUD */}
        <div
          onClick={handleBarClick}
          className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-cyan-800/80 p-0.5 cursor-pointer"
        >
          {/* Preenchimento Líquido */}
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
              isTargetMet
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-300 shadow-[0_0_12px_rgba(34,211,238,0.7)]'
            }`}
            style={{ width: `${Math.max(4, goal.progressPercentage)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
          </div>

          {/* Marcador do Peixe Saltando ao longo do percurso */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-2 pointer-events-none transition-all duration-700"
            style={{ left: `${Math.max(3, Math.min(96, goal.progressPercentage))}%` }}
          >
            <span className="inline-block text-[11px] transform -scale-x-100 animate-bounce drop-shadow">
              🐟
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
