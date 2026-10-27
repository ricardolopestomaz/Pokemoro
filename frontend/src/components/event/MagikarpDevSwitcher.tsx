import React, { useState } from 'react';
import type { MagikarpEventPhase, MagikarpDevOverrideConfig } from '../../types/magikarp-event';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: MagikarpDevOverrideConfig;
  onUpdateConfig: (config: MagikarpDevOverrideConfig | null) => void;
}

export function MagikarpDevSwitcher({
  isOpen,
  onClose,
  currentConfig,
  onUpdateConfig,
}: Props) {
  const [phase, setPhase] = useState<MagikarpEventPhase | 'auto'>(
    currentConfig.forcePhase ?? 'auto'
  );
  const [simMinutes, setSimMinutes] = useState<number>(
    currentConfig.simulatedCommunityMinutes ?? 282
  );
  const [simUsers, setSimUsers] = useState<number>(
    currentConfig.simulatedUsersCount ?? 2
  );

  if (!isOpen) return null;

  const handleApply = () => {
    if (phase === 'auto' && simMinutes === 282 && simUsers === 2 && !currentConfig.forcePhase) {
      onUpdateConfig(null);
    } else {
      onUpdateConfig({
        forcePhase: phase === 'auto' ? null : phase,
        simulatedCommunityMinutes: simMinutes,
        simulatedUsersCount: simUsers,
      });
    }
    onClose();
  };

  const handleReset = () => {
    setPhase('auto');
    setSimMinutes(0);
    setSimUsers(1);
    onUpdateConfig(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn text-white">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/50 p-5 shadow-[0_0_35px_rgba(245,158,11,0.3)]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <div>
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                Professor Ricardo QA Suite
              </h3>
              <p className="text-[10px] text-slate-400">
                Simulador de Fases e Datas do Evento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {/* Seletor de Fase */}
        <div className="space-y-1.5 mb-4">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Forçar Fase do Evento
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { id: 'auto', label: 'Automático (Data Real)', icon: '📅' },
              { id: 'teaser', label: 'Fase 1: Teaser (72h)', icon: '⏳' },
              { id: 'live', label: 'Fase 2: Ao Vivo (Chuva)', icon: '⛈️' },
              { id: 'climax', label: 'Fase 3: Clímax (Gyarados)', icon: '🐉' },
              { id: 'ended', label: 'Fase 4: Rescaldo', icon: '🏆' },
              { id: 'inactive', label: 'Desativado', icon: '⚪' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setPhase(item.id as any)}
                className={`py-2 px-2.5 rounded-xl border text-left flex items-center gap-1.5 transition-all text-[11px] font-bold ${
                  phase === item.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                    : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Simulador de Minutos da Comunidade */}
        <div className="space-y-2 mb-4 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-300">
              Minutos da Comunidade
            </span>
            <span className="font-mono font-bold text-cyan-300">{simMinutes} min</span>
          </div>
          <input
            type="range"
            min="0"
            max="600"
            step="10"
            value={simMinutes}
            onChange={(e) => setSimMinutes(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-[10px] font-bold uppercase text-slate-300">
              Usuários Conectados
            </span>
            <span className="font-mono font-bold text-amber-300">{simUsers} alunos</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={simUsers}
            onChange={(e) => setSimUsers(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />

          {/* Atilhos Rápidos */}
          <div className="flex gap-1.5 pt-2">
            <button
              onClick={() => {
                setSimMinutes(285);
                setSimUsers(2);
              }}
              className="flex-1 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-cyan-300 hover:bg-slate-700"
            >
              95% Meta
            </button>
            <button
              onClick={() => {
                setSimMinutes(300);
                setSimUsers(2);
              }}
              className="flex-1 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-emerald-300 hover:bg-slate-700"
            >
              100% Meta
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
          >
            Resetar
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Aplicar Teste
          </button>
        </div>

      </div>
    </div>
  );
}
