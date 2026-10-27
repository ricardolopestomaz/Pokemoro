import React from 'react';
import type { CommunityGoalCalculationDTO, MagikarpEventPhase } from '../../types/magikarp-event';

interface Props {
  goal: CommunityGoalCalculationDTO;
  phase: MagikarpEventPhase;
  onOpenEventHub: () => void;
}

export function MagikarpCommunityBar({ goal, phase, onOpenEventHub }: Props) {
  const isTargetMet = goal.isTargetAchieved;

  return (
    <div className="w-full px-3 py-1.5 animate-fadeIn">
      <button
        onClick={onOpenEventHub}
        className="w-full text-left relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/90 via-slate-900/95 to-cyan-950/90 border border-cyan-500/40 p-2.5 shadow-[0_4px_20px_rgba(6,182,212,0.25)] hover:border-cyan-400 hover:shadow-[0_4px_25px_rgba(6,182,212,0.4)] active:scale-[0.99] transition-all group backdrop-blur-md"
      >
        {/* Efeito de brilho líquido dinâmico no fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/15 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />

        {/* Linha Superior: Título, Alunos e Porcentagem */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base animate-pulse">🌊</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 drop-shadow">
                  Salto da Cachoeira
                </span>
                {phase === 'live' && (
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-extrabold uppercase bg-red-500/90 text-white animate-pulse">
                    Ao Vivo
                  </span>
                )}
                {phase === 'climax' && (
                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-extrabold uppercase bg-amber-500 text-slate-950 font-black animate-bounce">
                    Clímax 🐉
                  </span>
                )}
              </div>
              <span className="text-[10px] text-cyan-200/80 font-medium">
                {goal.activeUsersCount} {goal.activeUsersCount === 1 ? 'Mestre' : 'Mestres'} em foco conjunto
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-black text-white flex items-center gap-1 justify-end">
              <span className="text-cyan-300">{goal.currentCommunityMinutes}</span>
              <span className="text-cyan-500/70">/</span>
              <span>{goal.targetMinutes}m</span>
            </div>
            <div className="text-[9px] font-bold text-cyan-400">
              {isTargetMet ? '✨ META ATINGIDA!' : `${goal.progressPercentage}% concluído`}
            </div>
          </div>
        </div>

        {/* Barra de Progresso com Água Líquida e Magikarp Nadando */}
        <div className="relative h-3 w-full bg-slate-950/80 rounded-full overflow-hidden border border-cyan-800/60 p-0.5">
          {/* Fundo com onda */}
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
              isTargetMet
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
            }`}
            style={{ width: `${Math.max(5, goal.progressPercentage)}%` }}
          >
            {/* Brilho reluzente animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>

          {/* Marcador do Magikarp saltando na ponta da barra */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-2 pointer-events-none transition-all duration-700"
            style={{ left: `${Math.max(4, Math.min(96, goal.progressPercentage))}%` }}
          >
            <span className="inline-block text-[10px] transform -scale-x-100 animate-bounce drop-shadow">
              🐟
            </span>
          </div>
        </div>

        {/* Rodapé sutil de incentivo */}
        <div className="relative z-10 flex items-center justify-between text-[9px] text-cyan-300/70 mt-1 font-medium">
          <span>{isTargetMet ? 'O dragão acordou! Toque para ver' : 'Estude para impulsionar a barra coletiva'}</span>
          <span className="group-hover:translate-x-0.5 transition-transform text-cyan-300 font-bold">
            Ver Recompensas →
          </span>
        </div>
      </button>
    </div>
  );
}
