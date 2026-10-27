import React, { useState } from 'react';
import type {
  MagikarpEventStateDTO,
  MagikarpUserProgressDTO,
  MagikarpMilestone,
} from '../../types/magikarp-event';

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
  const [tab, setTab] = useState<'community' | 'personal'>('community');
  const [copiedStory, setCopiedStory] = useState(false);

  if (!isOpen) return null;

  const { communityGoal, currentPhase, secondsUntilNextPhase } = eventState;

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  const handleCopyStoryText = () => {
    const text = `🌊 EU SOBREVIVI AO DIA DO MAGIKARP NO POKEMORO! 🐉\n⏱️ Minutos Estudados: ${userProgress.eventMinutesStudied} min\n🚀 Salto Máximo: ${userProgress.jumpMeters} metros\n🏆 Comunidade: ${communityGoal.currentCommunityMinutes} / ${communityGoal.targetMinutes} min (${communityGoal.progressPercentage}%)\n"Do salto mais fraco à maior aprovação."\n@PokemoroApp`;
    navigator.clipboard.writeText(text);
    setCopiedStory(true);
    setTimeout(() => setCopiedStory(false), 2500);
  };

  const personalMilestones = milestones.filter((m) => m.type === 'personal');
  const communityMilestones = milestones.filter((m) => m.type === 'community');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-[0_10px_40px_rgba(6,182,212,0.3)] overflow-hidden text-white">
        
        {/* Banner do Topo com Imagem do Festival */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-950 flex-shrink-0">
          <img
            src="/assets/magikarp_festival_loading.jpg"
            alt="Festival do Magikarp"
            className="w-full h-full object-cover opacity-75 transform hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/80 border border-white/20 text-white/80 hover:text-white flex items-center justify-center text-sm font-bold active:scale-95 transition-all z-20"
          >
            ✕
          </button>

          {/* Tag de Status da Fase */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.8)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              {currentPhase === 'teaser' && 'Aquecimento (72h)'}
              {currentPhase === 'live' && 'A Tempestade (Ao Vivo)'}
              {currentPhase === 'climax' && 'A Porta do Dragão 🐉'}
              {currentPhase === 'ended' && 'Rescaldo & Glória'}
              {currentPhase === 'inactive' && 'Temporada Fechada'}
            </span>
          </div>

          {/* Título e Subtítulo */}
          <div className="absolute bottom-3 left-4 right-4 z-20">
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 drop-shadow">
              Evento Mundial Anual • {eventState.cycleYear}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-md">
              Dia do Magikarp
            </h2>
            <p className="text-xs text-cyan-200/80 font-medium">
              A lenda da cachoeira onde o peixe mais focado vira dragão.
            </p>
          </div>
        </div>

        {/* Barra de Tempo e Acesso Rápido */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-cyan-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏳</span>
            <span className="text-slate-300 font-mono font-medium">
              Próxima Fase: <strong className="text-cyan-300">{formatCountdown(secondsUntilNextPhase)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenDevSwitcher && (
              <button
                onClick={onOpenDevSwitcher}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline"
              >
                🛠️ Modo Teste
              </button>
            )}
          </div>
        </div>

        {/* Seletor de Abas (Comunidade vs Pessoal) */}
        <div className="p-3 bg-slate-900/90 flex gap-2 border-b border-white/5">
          <button
            onClick={() => setTab('community')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'community'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <span>🌊</span>
            <span>Meta da Comunidade</span>
          </button>
          <button
            onClick={() => setTab('personal')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'personal'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <span>🎯</span>
            <span>Meu Progresso ({userProgress.eventMinutesStudied}m)</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'community' && (
            <>
              {/* Card da Meta Dinâmica */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-cyan-950/70 border border-cyan-500/30 p-3.5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      Cachoeira Mística Coletiva
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {communityGoal.currentCommunityMinutes} de {communityGoal.targetMinutes} minutos
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-cyan-300">
                      {communityGoal.progressPercentage}%
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {communityGoal.activeUsersCount} treinadores em união
                    </div>
                  </div>
                </div>

                {/* Barra com Onda */}
                <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-cyan-800 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 transition-all duration-700"
                    style={{ width: `${Math.max(4, communityGoal.progressPercentage)}%` }}
                  />
                </div>

                <div className="mt-2 text-[11px] text-cyan-200/70 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>
                    A meta é dinâmica e adapta-se à quantidade de alunos ativos. Cada 1 minuto de Pomodoro seu eleva o Magikarp mundial!
                  </span>
                </div>
              </div>

              {/* Botão de Destaque: Clímax ao Vivo */}
              {(currentPhase === 'climax' || communityGoal.isTargetAchieved) && (
                <button
                  onClick={onOpenClimaxCutscene}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 animate-bounce"
                >
                  <span>🐉</span>
                  <span>Assistir à Ascensão do Gyarados Vermelho!</span>
                </button>
              )}

              {/* Lista de Marcos Coletivos */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Recompensas Mundiais
                </h4>
                {communityMilestones.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 ${
                      m.isUnlocked
                        ? 'bg-slate-800/90 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/60 border-white/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{m.title}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">({m.requiredMinutes} min)</span>
                        </div>
                        <div className="text-[11px] text-cyan-300 font-medium">
                          {m.rewardLabel}
                        </div>
                        <div className="text-[10px] text-slate-400">{m.description}</div>
                      </div>
                    </div>

                    <div>
                      {m.isClaimed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Resgatado ✓
                        </span>
                      ) : m.isUnlocked ? (
                        <button
                          onClick={() => onClaimMilestone(m.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md hover:scale-105 active:scale-95 transition-all"
                        >
                          Resgatar
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'personal' && (
            <>
              {/* Card de Foco Pessoal */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-cyan-950/70 border border-cyan-500/30 p-3.5 shadow-inner flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                    Seu Esforço no Festival
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {userProgress.eventMinutesStudied} minutos focados
                  </h3>
                  <p className="text-xs text-cyan-300/80 font-medium">
                    🚀 {userProgress.jumpMeters} metros de altura alcançados!
                  </p>
                </div>

                <button
                  onClick={onOpenMiniGame}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center"
                >
                  <span className="text-base">🎮</span>
                  <span>Mini-Game</span>
                </button>
              </div>

              {/* Lista de Marcos Pessoais */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Desafios Individuais
                </h4>
                {personalMilestones.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 ${
                      m.isUnlocked
                        ? 'bg-slate-800/90 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/60 border-white/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{m.title}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">({m.requiredMinutes} min)</span>
                        </div>
                        <div className="text-[11px] text-cyan-300 font-medium">
                          {m.rewardLabel}
                        </div>
                        <div className="text-[10px] text-slate-400">{m.description}</div>
                      </div>
                    </div>

                    <div>
                      {m.isClaimed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Resgatado ✓
                        </span>
                      ) : m.isUnlocked ? (
                        <button
                          onClick={() => onClaimMilestone(m.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md hover:scale-105 active:scale-95 transition-all"
                        >
                          Resgatar
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão Stories Instagram */}
              <button
                onClick={handleCopyStoryText}
                className="w-full py-2.5 rounded-xl bg-slate-800 border border-white/10 hover:border-cyan-400/60 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>📸</span>
                <span>{copiedStory ? '✓ Texto copiado para a Área de Transferência!' : 'Copiar Texto para Stories / Status'}</span>
              </button>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Festival do Magikarp • Pokemoro</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
