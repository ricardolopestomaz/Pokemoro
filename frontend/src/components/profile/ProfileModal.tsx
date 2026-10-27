import { useState } from 'react';
import { api } from '../../api/endpoints';
import { formatLocalDate, splitSessionAcrossDays } from '../../lib/date-utils';
import { motion } from 'framer-motion';
import { Check, X, Zap, Sparkles, Volume2, VolumeX, Smartphone, Eye, Wind, Share2 } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonImage } from '../campsite/PokemonImage';
import { caterpieIcon, envUrl } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import { generateStudyStoryCard, shareOrDownloadStory } from '../../lib/storyCard';
import { MagikarpDevSwitcher } from '../event/MagikarpDevSwitcher';
import { getDevOverride, saveDevOverride } from '../../lib/events/magikarpCalendar';
import { getLocalUserEventProgress } from '../../lib/events/magikarpStorage';
import type { MagikarpDevOverrideConfig } from '../../types/magikarp-event';

interface Props {
  currentIcon: string;
  currentBg?: string;
  onSelectIcon: (icon: string, bg: string) => void;
  onClose: () => void;
}

const BG_OPTIONS = [
  { id: 'greengrass', label: 'Grama', emoji: '🌿' },
  { id: 'beach', label: 'Praia', emoji: '🏖️' },
  { id: 'tundra', label: 'Neve', emoji: '❄️' },
  { id: 'cave', label: 'Caverna', emoji: '💎' },
  { id: 'study_room', label: 'Sala', emoji: '📚' },
];

export function ProfileModal({ currentIcon, currentBg = 'greengrass', onSelectIcon, onClose }: Props) {
  const { profile, team, subjects, collection, settings, updateSettings, toggleLowPowerMode, toast } = useGame();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [selectedIcon, setSelectedIcon] = useState<string>(currentIcon || 'caterpie');
  const [selectedBg, setSelectedBg] = useState<string>(currentBg || 'greengrass');
  const [devClicks, setDevClicks] = useState(0);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devConfig, setDevConfig] = useState<MagikarpDevOverrideConfig>(() => getDevOverride());

  const eventProgress = profile?.id ? getLocalUserEventProgress(profile.id, new Date().getFullYear()) : null;

  const handleVersionClick = () => {
    setDevClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowDevModal(true);
        toast('🛠️ Suíte de Testes do Professor Ricardo ativada!');
        return 0;
      }
      return next;
    });
  };

  const save = () => {
    sfx.fanfare();
    onSelectIcon(selectedIcon, selectedBg);
    onClose();
  };

  const renderPreviewContent = () => {
    if (selectedIcon.startsWith('poke_')) {
      const parts = selectedIcon.split('_');
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
    <motion.div
      className="absolute inset-0 z-[70] flex items-end bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 500 }}
        animate={{ y: 0 }}
        exit={{ y: 500 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="flex max-h-[88vh] w-full flex-col rounded-t-[2.2rem] bg-white pb-6 pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.3)]"
      >
        {/* Header com Abas */}
        <div className="border-b border-ink/10 px-6 pb-2">
          <div className="flex items-center justify-between pb-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-leaf-dark">
                {activeTab === 'profile' ? 'Personalização' : 'Desempenho & Bateria'}
              </span>
              <h2 className="text-xl font-black text-ink">
                {activeTab === 'profile' ? 'Foto de Perfil & Fundo' : 'Configurações de Gráficos'}
              </h2>
            </div>
            <button
              onClick={() => { sfx.tap(); onClose(); }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink/70 active:scale-90"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Seletor de Abas Estilo Pokémon Sleep */}
          <div className="flex gap-4 pt-1 overflow-x-auto no-scrollbar">
            <button
              id="tab-profile-opt"
              onClick={() => { sfx.tap(); setActiveTab('profile'); }}
              className={`pb-2 text-xs font-black transition-all shrink-0 ${
                activeTab === 'profile'
                  ? 'border-b-2 border-leaf text-leaf-dark'
                  : 'border-b-2 border-transparent text-ink/40'
              }`}
            >
              🎨 Perfil & Avatar
            </button>
            <button
              id="tab-settings-opt"
              onClick={() => { sfx.tap(); setActiveTab('settings'); }}
              className={`pb-2 text-xs font-black transition-all shrink-0 ${
                activeTab === 'settings'
                  ? 'border-b-2 border-leaf text-leaf-dark'
                  : 'border-b-2 border-transparent text-ink/40'
              }`}
            >
              ⚡ Desempenho
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba 1: Perfil & Avatar */}
        {activeTab === 'profile' && (
          <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-4">
            {/* Pré-visualização do Avatar */}
            <div className="mb-5 flex flex-col items-center justify-center">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-leaf/40">
                <img
                  src={envUrl(selectedBg)}
                  alt="Fundo"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="relative z-10 flex h-full w-full items-center justify-center p-0.5">
                  {renderPreviewContent()}
                </div>
              </div>
              <span className="mt-1.5 text-[11px] font-black text-ink/70">Pré-visualização do Ícone</span>
              {eventProgress?.unlockedSwimmerTitle && (
                <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm flex items-center gap-1">
                  <span>🌊</span>
                  <span>Nadador de Correnteza</span>
                </span>
              )}
            </div>

            {/* Seção 1: Seletor de Fundo do Avatar */}
            <div className="mb-5">
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
                <span className="h-3 w-1 rounded-full bg-leaf" />
                Fundo do Avatar (Cenário)
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {BG_OPTIONS.map((bg) => {
                  const active = selectedBg === bg.id;
                  return (
                    <button
                      key={bg.id}
                      id={`bg-opt-${bg.id}`}
                      onClick={() => { sfx.tap(); setSelectedBg(bg.id); }}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl p-1.5 transition-all active:scale-90 ${
                        active
                          ? 'border-2 border-leaf bg-leaf/10 shadow-md ring-2 ring-leaf/40'
                          : 'border border-ink/10 bg-cream hover:bg-cream/80'
                      }`}
                    >
                      <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-xs">
                        <img src={envUrl(bg.id)} alt={bg.label} className="h-full w-full object-cover" />
                        {active && (
                          <span className="absolute inset-0 flex items-center justify-center bg-leaf/40 text-white">
                            <Check size={14} strokeWidth={3.5} />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-ink">{bg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seção 2: Ícones Padrão */}
            <div className="mb-5">
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
                <span className="h-3 w-1 rounded-full bg-leaf" />
                Mascote Padrão
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <button
                  id="icon-opt-caterpie"
                  onClick={() => { sfx.tap(); setSelectedIcon('caterpie'); }}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 transition-all active:scale-90 ${
                    selectedIcon === 'caterpie'
                      ? 'border-2 border-leaf bg-leaf/10 shadow-md ring-2 ring-leaf/40'
                      : 'border border-ink/10 bg-cream hover:bg-cream/80'
                  }`}
                >
                  <img src={caterpieIcon} alt="Caterpie" className="h-12 w-12 rounded-xl object-contain" />
                  <span className="mt-0.5 text-[9px] font-black text-ink/70">Caterpie</span>
                  {selectedIcon === 'caterpie' && (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-leaf text-white shadow">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Seção 3: Pokémon Amigos Recrutados */}
            <div>
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
                <span className="h-3 w-1 rounded-full bg-leaf" />
                Pokémon Amigos ({collection.length})
              </h3>
              {collection.length === 0 ? (
                <p className="rounded-2xl bg-cream p-4 text-center text-xs font-bold text-ink/50">
                  Alimente os Pokémon no Descanso para desbloquear novos avatares! 🍪
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {collection.map((p) => {
                    const iconKey = `poke_${p.pokemonId}_${p.variant}`;
                    const active = selectedIcon === iconKey;
                    return (
                      <button
                        key={p.id}
                        id={`icon-opt-${p.pokemonId}`}
                        onClick={() => { sfx.tap(); setSelectedIcon(iconKey); }}
                        className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl p-1 transition-all active:scale-90 ${
                          active
                            ? 'border-2 border-leaf bg-leaf/10 shadow-md ring-2 ring-leaf/40'
                            : 'border border-ink/10 bg-cream hover:bg-cream/80'
                        }`}
                      >
                        <PokemonImage
                          pokemonId={p.pokemonId}
                          menu
                          variant={p.variant}
                          alt={p.nickname}
                          className="h-12 w-12 object-contain"
                        />
                        <span className="mt-0.5 max-w-full truncate text-[9px] font-black text-ink/70">
                          {p.nickname}
                        </span>
                        {active && (
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-leaf text-white shadow">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção 3: Compartilhar Conquistas nos Stories */}
            <div className="mb-4 mt-2">
              <button
                onClick={async () => {
                  try {
                    sfx.tap();
                    const partner = team?.activeTeam[0] || collection[0];
                    const todayStr = formatLocalDate(new Date());
                    const recent = await api.recentSessions(50).catch(() => []);
                    let minutesToday = 0;
                    const perSubject = new Map<string, number>();
                    (recent as any[]).forEach((s) => {
                      const splits = splitSessionAcrossDays({
                        startedAt: s.startedAt,
                        completedAt: s.completedAt,
                        actualDurationMinutes: s.actualDurationMinutes,
                      });
                      splits.forEach((sp) => {
                        if (sp.dateStr !== todayStr) return;
                        minutesToday += sp.minutes;
                        if (s.subjectId) perSubject.set(s.subjectId, (perSubject.get(s.subjectId) || 0) + sp.minutes);
                      });
                    });
                    const topId = [...perSubject.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
                    const topSubject = subjects.find((s) => s.id === topId);
                    const dataUrl = await generateStudyStoryCard({
                      pokemonId: partner?.pokemonId ?? 10,
                      nickname: partner?.nickname ?? 'Caterpie',
                      variant: partner?.variant ?? 'regular',
                      minutesToday,
                      streakDays: profile?.streakDays ?? 0,
                      subjectName: topSubject?.name ?? 'Estudos Gerais',
                    });
                    await shareOrDownloadStory(dataUrl);
                    toast('Card de Stories gerado com sucesso!', 'ok');
                  } catch {
                    toast('Não foi possível gerar o card de Stories.', 'error');
                  }
                }}
                className="btn w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 text-white font-black text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 size={16} />
                <span>Gerar Cartão Postal para Stories 📸</span>
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 2: Gráficos & Desempenho (Low-End Devices) */}
        {activeTab === 'settings' && (
          <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-4">
            {/* Master Toggle: Modo Econômico */}
            <div className={`mb-5 rounded-3xl p-4 border transition-all ${
              settings.lowPowerMode
                ? 'border-emerald-500 bg-emerald-50/90 shadow-md ring-2 ring-emerald-300'
                : 'border-ink/10 bg-cream/70'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    settings.lowPowerMode ? 'bg-emerald-500 text-white' : 'bg-ink/10 text-ink/60'
                  }`}>
                    <Zap size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-ink">Modo Econômico</h3>
                    <p className="text-[11px] font-bold text-ink/60">Otimizado para celulares de entrada</p>
                  </div>
                </div>
                <button
                  id="toggle-master-low-power"
                  onClick={() => { sfx.tap(); toggleLowPowerMode(); }}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.lowPowerMode ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.lowPowerMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="mt-3 text-[11px] font-medium leading-relaxed text-ink/70">
                Desativa automaticamente efeitos pesados (gradiente holográfico, partículas de confete e animações contínuas) para economizar bateria e garantir 60 FPS contínuos.
              </p>
            </div>

            {/* Ajustes Individuais */}
            <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink/60">
              <span className="h-3 w-1 rounded-full bg-leaf" />
              Ajustes Individuais de Efeitos
            </h3>

            <div className="flex flex-col gap-2.5">
              {/* Foil Holográfico */}
              <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cream/50 p-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-ink">Efeito Holográfico (Foil)</div>
                    <div className="text-[10px] text-ink/50 font-medium">Laminado brilhante no Pokémon Líder</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableFoilEffect}
                  onChange={(e) => updateSettings({ enableFoilEffect: e.target.checked, lowPowerMode: false })}
                  className="h-5 w-5 accent-emerald-500 rounded"
                />
              </div>

              {/* Confetes */}
              <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cream/50 p-3">
                <div className="flex items-center gap-2.5">
                  <Wind size={18} className="text-pink-500 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-ink">Chuva de Confetes</div>
                    <div className="text-[10px] text-ink/50 font-medium">Partículas ao concluir metas e fotos</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableConfetti}
                  onChange={(e) => updateSettings({ enableConfetti: e.target.checked, lowPowerMode: false })}
                  className="h-5 w-5 accent-emerald-500 rounded"
                />
              </div>

              {/* Team Roaming */}
              <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cream/50 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🌿</span>
                  <div>
                    <div className="text-xs font-extrabold text-ink">Equipe Caminhando</div>
                    <div className="text-[10px] text-ink/50 font-medium">Movimento contínuo pelo acampamento</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableTeamRoaming}
                  onChange={(e) => updateSettings({ enableTeamRoaming: e.target.checked, lowPowerMode: false })}
                  className="h-5 w-5 accent-emerald-500 rounded"
                />
              </div>

              {/* Blur e Bolhas */}
              <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cream/50 p-3">
                <div className="flex items-center gap-2.5">
                  <Eye size={18} className="text-sky-500 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-ink">Efeitos Visuais Suaves</div>
                    <div className="text-[10px] text-ink/50 font-medium">Bolhas flutuantes e desfoques de vidro</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableVisualEffects}
                  onChange={(e) => updateSettings({ enableVisualEffects: e.target.checked, lowPowerMode: false })}
                  className="h-5 w-5 accent-emerald-500 rounded"
                />
              </div>

              {/* Sons */}
              <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cream/50 p-3">
                <div className="flex items-center gap-2.5">
                  {settings.enableAudio ? (
                    <Volume2 size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <VolumeX size={18} className="text-slate-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-extrabold text-ink">Efeitos Sonoros</div>
                    <div className="text-[10px] text-ink/50 font-medium">Toques, sinos e fanfarras de foco</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAudio}
                  onChange={(e) => updateSettings({ enableAudio: e.target.checked })}
                  className="h-5 w-5 accent-emerald-500 rounded"
                />
              </div>

              {/* Vibração */}
              <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-cream/50 p-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone size={18} className="text-purple-500 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-ink">Vibrações Hápticas</div>
                    <div className="text-[10px] text-ink/50 font-medium">Resposta tátil ao interagir</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableHaptics}
                  onChange={(e) => updateSettings({ enableHaptics: e.target.checked })}
                  className="h-5 w-5 accent-emerald-500 rounded"
                />
              </div>
              {/* Versão e status oficial v1.0.0 (5 toques abre a Suíte de Testes) */}
              <div
                onClick={handleVersionClick}
                className="mt-2 rounded-2xl bg-cream/70 border border-ink/10 p-3 text-center cursor-pointer select-none active:scale-95 transition-transform"
                title="Toque 5 vezes para abrir a Suíte de Testes"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-leaf-dark">
                  Pokémoro v1.0.0 Oficial
                </span>
                <p className="mt-0.5 text-[10px] font-medium text-ink/60">
                  100% Offline-First · Motor Standalone & Sincronização Nuvem Segura
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex gap-3 border-t border-ink/10 px-6 pt-3">
          <button
            onClick={() => { sfx.tap(); onClose(); }}
            className="btn btn-ghost flex-1 py-3 text-sm font-bold !text-slate-800 border-2 border-slate-300 shadow-sm active:scale-95"
          >
            {activeTab === 'profile' ? 'Cancelar' : 'Concluir'}
          </button>
          {activeTab === 'profile' && (
            <button
              id="btn-save-avatar"
              onClick={save}
              className="btn btn-green flex-1 py-3 text-sm"
            >
              Confirmar
            </button>
          )}
        </div>

        {/* Modal da Suíte de Testes do Professor Ricardo */}
        <MagikarpDevSwitcher
          isOpen={showDevModal}
          onClose={() => setShowDevModal(false)}
          currentConfig={devConfig}
          onUpdateConfig={(cfg) => {
            saveDevOverride(cfg);
            setDevConfig(cfg || {});
          }}
        />
      </motion.div>
    </motion.div>
  );
}
