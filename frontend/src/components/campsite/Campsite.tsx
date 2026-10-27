import { useState, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Sparkles, BookOpen, Heart, Scroll, GripVertical } from 'lucide-react';
import { useGame } from '../../hooks/useGameState';
import { PokemonSpawn } from './PokemonSpawn';
import { PokemonImage } from './PokemonImage';
import { EnvironmentPicker } from './EnvironmentPicker';
import { LofiFloatingWidget } from './LofiFloatingWidget';
import { QuestsModal } from '../quests/QuestsModal';
import { captureScenePhoto } from '../../lib/photoCapture';
import { sleepSprite } from '../../lib/assets';
import { sfx } from '../../lib/sfx';
import { recordHeartReaction } from '../../lib/pokemonEmotions';
import { loadDailyQuests } from '../../lib/quests';
import { ResearchQuestIcon } from '../common/PokemonThemedIcons';
import { useMagikarpEvent } from '../../hooks/useMagikarpEvent';
import { MagikarpRainOverlay } from '../event/MagikarpRainOverlay';
import { MagikarpWaterPuddles } from '../event/MagikarpWaterPuddles';
import { MagikarpBottomEventBar } from '../event/MagikarpBottomEventBar';
import { MagikarpLakeCreature } from '../event/MagikarpLakeCreature';
import { MagikarpEventModal } from '../event/MagikarpEventModal';
import { MagikarpJumpModal } from '../event/MagikarpJumpModal';
import { MagikarpClimaxModal } from '../event/MagikarpClimaxModal';
import { MagikarpDevSwitcher } from '../event/MagikarpDevSwitcher';
import type { SpawnedPokemon, UserPokemon } from '../../types';

interface Props {
  onOpenSpawn: (s: SpawnedPokemon, photoDataUrl?: string) => void;
  isTour?: boolean;
}

function getTimeOfDay(): 'dawn' | 'day' | 'sunset' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'sunset';
  return 'night';
}

function NightFireflies() {
  const fireflies = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    id: i,
    left: `${12 + (i * 22) % 76}%`,
    top: `${18 + (i * 17) % 65}%`,
    duration: 3 + (i % 3) * 1.3,
    delay: i * 0.45,
  })), []);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
      {fireflies.map((f) => (
        <motion.div
          key={f.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.85, 0.15, 0.95, 0],
            scale: [0.5, 1.25, 0.7, 1.35, 0.5],
            y: [-4, -28, -12, -40, -4],
            x: [-4, 7, -5, 9, -4],
          }}
          transition={{ duration: f.duration, repeat: Infinity, delay: f.delay, ease: 'easeInOut' }}
          className="absolute h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047]"
          style={{ left: f.left, top: f.top }}
        />
      ))}
    </div>
  );
}

function ZzzParticles() {
  return (
    <div className="pointer-events-none absolute -top-3 right-1 z-30 select-none" aria-hidden="true">
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.6, 1, 0.8], y: [-2, -18], x: [0, 5] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 0.2 }}
        className="absolute text-[11px] font-black text-white/90 drop-shadow-md"
      >
        z
      </motion.span>
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.7, 1.1, 0.9], y: [-4, -25], x: [3, 11] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut', delay: 1.4 }}
        className="absolute text-[13px] font-black text-sky-200/90 drop-shadow-md"
      >
        Z
      </motion.span>
    </div>
  );
}

/** Hub principal: cenário calmo e acolhedor com Pokémon dormindo pacificamente no tapete e visitantes do Coffee Break. */
export function Campsite({ onOpenSpawn, isTour = false }: Props) {
  const { coffeeBreak, team, collection, profile, settings, setTab, removeSpawn } = useGame();
  const rawSpawns = isTour ? [] : (coffeeBreak?.spawns ?? []);
  const activeTeam = team?.activeTeam ?? [];
  const leader: UserPokemon = activeTeam[0] || collection?.[0] || {
    id: 'caterpie-starter-01',
    pokemonId: 10,
    nickname: 'Caterpie',
    variant: 'regular',
    friendshipLevel: 1,
    discoveredStyles: [1],
    role: 'ITEMS',
    passiveBonusDescription: '+20% de Moedas de Foco e biscoitos adicionais nas pausas',
    recruitedAt: '',
  };

  const fullTeam: UserPokemon[] = (activeTeam.length > 0 ? activeTeam : (leader ? [leader] : [])).slice(0, 5);
  const activeTeamPokemonIds = new Set(fullTeam.map((m) => m.pokemonId));
  const spawns = rawSpawns.filter(
    (s) => !s.isAlreadyRecruited && !activeTeamPokemonIds.has(s.pokemonId)
  );
  const recruited = rawSpawns.filter((s) => s.isAlreadyRecruited || activeTeamPokemonIds.has(s.pokemonId)).length;

  const [heartBubbleMemberId, setHeartBubbleMemberId] = useState<string | null>(null);
  const [showQuests, setShowQuests] = useState(false);
  const heartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const campsiteRef = useRef<HTMLDivElement | null>(null);
  const isDraggingQuests = useRef(false);
  const isDraggingMagikarp = useRef(false);
  const timeOfDay = useMemo(() => getTimeOfDay(), []);

  const magikarp = useMagikarpEvent(profile?.id || 'local_trainer');

  const hasUnclaimedQuests = useMemo(() => {
    try {
      return loadDailyQuests().some((q) => q.completed && !q.claimed);
    } catch {
      return false;
    }
  }, [showQuests]);

  // Verificação reativa periódica da expiração de 30 minutos dos visitantes
  useEffect(() => {
    if (isTour) return;

    const checkExpirations = () => {
      const now = Date.now();
      const currentSpawns = coffeeBreak?.spawns ?? [];
      const expired = currentSpawns.filter((s) => {
        let exp = s.expiresAt;
        if (!exp && s.spawnedAt) exp = s.spawnedAt + 30 * 60 * 1000;
        if (!exp) {
          const match = s.spawnId?.match(/^sp_(\d+)_/);
          if (match) exp = Number(match[1]) + 30 * 60 * 1000;
        }
        return Boolean(exp && exp <= now);
      });
      if (expired.length > 0) {
        expired.forEach((s) => removeSpawn(s.spawnId));
      }
    };

    checkExpirations();
    const interval = setInterval(checkExpirations, 1000);

    const onWake = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkExpirations();
      }
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [coffeeBreak?.spawns, removeSpawn, isTour]);

  useEffect(() => {
    return () => {
      if (heartTimer.current) clearTimeout(heartTimer.current);
    };
  }, []);

  const handleMemberClick = (member: UserPokemon) => {
    // Limite estrito de no máximo 2 corações a cada 5 minutos (anti-spam)
    if (!recordHeartReaction()) {
      return;
    }

    sfx.tap();
    setHeartBubbleMemberId(member.id);

    if (heartTimer.current) clearTimeout(heartTimer.current);
    heartTimer.current = setTimeout(() => {
      setHeartBubbleMemberId(null);
    }, 2000);
  };

  const TEAM_LAYOUT = [
    { left: '50%', top: '55%', zIndex: 12, isLeader: true },
    { left: '20%', top: '44%', zIndex: 10, isLeader: false },
    { left: '80%', top: '44%', zIndex: 10, isLeader: false },
    { left: '18%', top: '65%', zIndex: 14, isLeader: false },
    { left: '82%', top: '65%', zIndex: 14, isLeader: false },
  ];

  const handleSpawnClick = async (s: SpawnedPokemon) => {
    sfx.tap();
    const photoUrl = await captureScenePhoto({
      targetSpawn: s,
      allSpawns: spawns,
      leader: leader,
      environment: profile?.activeEnvironment ?? 'greengrass',
    });
    onOpenSpawn(s, photoUrl);
  };

  const handleCameraClick = async () => {
    sfx.tap();
    const target = spawns.find((s) => !s.isAlreadyRecruited) || spawns[0];
    if (target) {
      const photoUrl = await captureScenePhoto({
        targetSpawn: target,
        allSpawns: spawns,
        leader: leader,
        environment: profile?.activeEnvironment ?? 'greengrass',
      });
      onOpenSpawn(target, photoUrl);
    }
  };

  return (
    <section ref={campsiteRef} className="absolute inset-0 z-10 overflow-hidden" aria-label="Cenário de descanso">
      {/* 0. Iluminação Dinâmica do Ciclo Dia / Noite */}
      {timeOfDay === 'dawn' && (
        <div className="pointer-events-none absolute inset-0 z-15 bg-gradient-to-b from-orange-400/20 via-pink-400/10 to-amber-100/10" aria-hidden="true" />
      )}
      {timeOfDay === 'sunset' && (
        <div className="pointer-events-none absolute inset-0 z-15 bg-gradient-to-b from-amber-600/25 via-purple-700/15 to-indigo-950/20" aria-hidden="true" />
      )}
      {timeOfDay === 'night' && (
        <>
          <div className="pointer-events-none absolute inset-0 z-15 bg-slate-950/40 mix-blend-multiply" aria-hidden="true" />
          <NightFireflies />
        </>
      )}

      {/* Overlays do Festival do Magikarp */}
      {magikarp.eventState.isRainVisualActive && <MagikarpRainOverlay />}
      {magikarp.eventState.isTeaserVisualActive && (
        <MagikarpWaterPuddles
          secondsUntilEvent={magikarp.eventState.secondsUntilNextPhase}
          onOpenEventHub={() => magikarp.setShowEventHubModal(true)}
        />
      )}

      {/* 1. Camada dos Pokémon no cenário */}
      <div className="absolute inset-0">

        {/* Equipe Ativa dormindo pacificamente no tapete com efeito Balatro Foil */}
        {!isTour && fullTeam.map((member, idx) => {
          const pos = TEAM_LAYOUT[idx] || TEAM_LAYOUT[0];
          const memberStyle = (member.discoveredStyles?.[0] || 1) as 1 | 2 | 3;
          const memberSprite = sleepSprite(member.pokemonId, memberStyle, member.variant);
          const isBubbleActive = heartBubbleMemberId === member.id;

          return (
            <div
              key={member.id || `team-${idx}-${member.pokemonId}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer select-none w-[38%] max-w-[150px]"
              style={{ left: pos.left, top: pos.top, zIndex: isBubbleActive ? 45 : pos.zIndex }}
              onClick={() => handleMemberClick(member)}
            >
              {/* Coração pixelado oficial flutuante sem círculo em volta, milimetricamente ampliado */}
              <AnimatePresence>
                {isBubbleActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.4, y: 0 }}
                    animate={{ opacity: 1, scale: [0.4, 1.25, 1], y: -18 }}
                    exit={{ opacity: 0, scale: 0.8, y: -30 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute bottom-full mb-1 z-50 flex items-center justify-center pointer-events-none"
                  >
                    <img
                      src="/sprites/emotes/loving.png"
                      alt="<3"
                      draggable={false}
                      className="w-7 h-7 select-none pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Partículas suaves de Zzz */}
              {!settings?.lowPowerMode && <ZzzParticles />}

              {/* Animação suave e calma de respiração dormindo */}
              <motion.div
                animate={
                  settings?.lowPowerMode
                    ? { scaleY: 1, y: 0 }
                    : { scaleY: [1, 1.035, 1], y: [0, -2.5, 0] }
                }
                transition={
                  settings?.lowPowerMode
                    ? undefined
                    : { duration: 3.2 + idx * 0.35, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{ willChange: 'transform' }}
                className="flex flex-col items-center w-full"
              >
                <div className="balatro-foil-sprite relative flex items-center justify-center w-full" style={{ opacity: 1 }}>
                  <PokemonImage
                    key={`${member.pokemonId}-sleep`}
                    pokemonId={member.pokemonId}
                    style={memberStyle}
                    variant={member.variant}
                    alt={member.nickname}
                    className="w-full object-contain pokemon-shadow"
                  />
                  {/* Camada Holográfica Balatro Foil com máscara no formato do sprite */}
                  {settings?.enableFoilEffect && !settings?.lowPowerMode && (pos.isLeader || member.variant === 'shiny') && (
                    <div
                      className="balatro-foil-overlay inset-0 w-full h-full"
                      style={{
                        WebkitMaskImage: `url('${memberSprite}')`,
                        maskImage: `url('${memberSprite}')`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Tag de Líder discreta e elegante */}
                {pos.isLeader && (
                  <motion.div
                    key={`leader-tag-${member.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 flex items-center gap-1 rounded-full bg-slate-900/40 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white/85 shadow-xs border border-white/15"
                  >
                    <Sparkles size={8} className="text-amber-400 fill-amber-400" />
                    <span className="truncate max-w-[80px]">{member.nickname} (Líder)</span>
                    <span className="text-[8px] text-amber-400 font-black">★</span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          );
        })}

        {/* Spawns visitantes do Coffee Break (dormem tranquilamente e expiram após 30 min) */}
        <AnimatePresence>
          {spawns.map((s, i) => (
            <PokemonSpawn key={s.spawnId} spawn={s} index={i} onClick={handleSpawnClick} />
          ))}
        </AnimatePresence>

        {/* Criatura Interativa do Magikarp no Lago durante o Festival */}
        {!isTour && magikarp.eventState.currentPhase !== 'inactive' && (
          <MagikarpLakeCreature
            jumpMeters={magikarp.userProgress.jumpMeters}
            onLaunchJumpGame={() => magikarp.setShowJumpMiniGame(true)}
            isShiny={magikarp.userProgress.unlockedGyaradosShiny}
          />
        )}
      </div>

      {/* Menus Modulares Arrastáveis na Tela de Descanso */}
      {!isTour && (
        <>
          {/* 1. Mudar Ilha / Cenário (Arrastável) */}
          <EnvironmentPicker containerRef={campsiteRef} />

          {/* 2. Poké-Rádio Lo-Fi Beats & Sons Ambientes (Arrastável) */}
          <LofiFloatingWidget containerRef={campsiteRef} />

          {/* 3. Missões Diárias de Estudo & Ginásios (Arrastável) */}
          <motion.div
            drag
            dragConstraints={campsiteRef}
            dragMomentum={false}
            dragElastic={0.08}
            whileDrag={{ scale: 1.05, zIndex: 60 }}
            onDragStart={() => { isDraggingQuests.current = true; }}
            onDragEnd={() => { setTimeout(() => { isDraggingQuests.current = false; }, 80); }}
            className="absolute left-2.5 sm:left-3.5 top-[80px] sm:top-[88px] z-30 pointer-events-auto select-none"
          >
            <button
              id="btn-campsite-quests"
              type="button"
              onClick={() => {
                if (!isDraggingQuests.current) {
                  sfx.tap();
                  setShowQuests(true);
                }
              }}
              className="glass group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-md border border-white/80 active:scale-95 transition-all cursor-grab active:cursor-grabbing backdrop-blur-md"
              title="Missões Diárias de Estudo & Ginásios (Arraste para reposicionar)"
              aria-label="Abrir Missões Diárias"
            >
              <span className="opacity-40 hover:opacity-100 flex items-center" title="Arraste para mover">
                <GripVertical size={12} className="text-slate-600" />
              </span>
              <ResearchQuestIcon size={16} />
              <span className="text-[10px] font-black text-slate-800">Missões</span>
              {hasUnclaimedQuests && (
                <span className="flex h-2 w-2 relative ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>
          </motion.div>
        </>
      )}

      {/* Barra de Evento no Rodapé (Estilo Fortnite Event HUD) */}
      {!isTour && magikarp.eventState.currentPhase !== 'inactive' && (
        <div className="absolute bottom-20 inset-x-0 z-35 pointer-events-auto">
          <MagikarpBottomEventBar
            goal={magikarp.eventState.communityGoal}
            phase={magikarp.eventState.currentPhase}
            userMinutes={magikarp.userProgress.eventMinutesStudied}
            hasUnclaimedMilestone={magikarp.milestones.some((m) => m.isUnlocked && !m.isClaimed)}
            onOpenEventPass={() => magikarp.setShowEventHubModal(true)}
            onLaunchClimax={() => magikarp.openClimaxCutscene()}
            onLaunchJumpGame={() => magikarp.setShowJumpMiniGame(true)}
          />
        </div>
      )}

      {/* Barra de Status Inferior (Fotografia e amigos de hoje) */}
      {!isTour && spawns.length > 0 && (
        <div className="absolute bottom-20 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
          <div className="glass pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2 shadow-md">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf text-white shadow-xs">
              <BookOpen size={14} />
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-ink/60">Amizades de Hoje</span>
              <span className="text-xs font-black text-ink">{recruited} de {spawns.length} recrutados</span>
            </div>
          </div>

          <button
            onClick={handleCameraClick}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-leaf to-[#5be3c0] text-white shadow-xl transition-transform active:scale-90"
            aria-label="Fotografar Pokémon no acampamento"
            title="Fotografar e registrar"
          >
            <Camera size={26} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Modal de Missões Diárias */}
      <QuestsModal isOpen={showQuests} onClose={() => setShowQuests(false)} />

      {/* Modais do Festival do Magikarp */}
      <MagikarpEventModal
        isOpen={magikarp.showEventHubModal}
        onClose={() => magikarp.setShowEventHubModal(false)}
        eventState={magikarp.eventState}
        userProgress={magikarp.userProgress}
        milestones={magikarp.milestones}
        onClaimMilestone={magikarp.claimMilestone}
        onOpenMiniGame={() => {
          magikarp.setShowEventHubModal(false);
          magikarp.setShowJumpMiniGame(true);
        }}
        onOpenClimaxCutscene={() => {
          magikarp.setShowEventHubModal(false);
          magikarp.openClimaxCutscene();
        }}
        onOpenDevSwitcher={() => {
          magikarp.setShowDevSwitcher(true);
        }}
      />

      <MagikarpJumpModal
        isOpen={magikarp.showJumpMiniGame}
        onClose={() => magikarp.setShowJumpMiniGame(false)}
        studiedMinutes={magikarp.userProgress.eventMinutesStudied}
        onSaveScore={magikarp.submitMiniGameScore}
        highestRecord={magikarp.userProgress.highestMiniGameJumpMeters}
      />

      <MagikarpClimaxModal
        isOpen={magikarp.showClimaxModal}
        onClose={magikarp.dismissClimaxModal}
      />

      <MagikarpDevSwitcher
        isOpen={magikarp.showDevSwitcher}
        onClose={() => magikarp.setShowDevSwitcher(false)}
        currentConfig={magikarp.overrideConfig}
        onUpdateConfig={magikarp.updateDevConfig}
      />
    </section>
  );
}
