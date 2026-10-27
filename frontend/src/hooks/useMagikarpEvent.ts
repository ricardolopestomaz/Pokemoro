import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  determineActiveEventState,
  getDevOverride,
  saveDevOverride,
  getMagikarpMilestones,
} from '../lib/events/magikarpCalendar';
import {
  getLocalUserEventProgress,
  claimEventMilestone,
  recordMiniGameJump,
  hasSeenClimaxCutscene,
  setClimaxCutsceneSeen,
} from '../lib/events/magikarpStorage';
import type {
  MagikarpEventStateDTO,
  MagikarpUserProgressDTO,
  MagikarpMilestone,
  MagikarpDevOverrideConfig,
} from '../types/magikarp-event';

export function useMagikarpEvent(userId: string = 'local_trainer') {
  const [overrideConfig, setOverrideConfig] = useState<MagikarpDevOverrideConfig>(() => getDevOverride());
  const [now, setNow] = useState<Date>(() => new Date());
  const [showClimaxModal, setShowClimaxModal] = useState<boolean>(false);
  const [showEventHubModal, setShowEventHubModal] = useState<boolean>(false);
  const [showJumpMiniGame, setShowJumpMiniGame] = useState<boolean>(false);
  const [showDevSwitcher, setShowDevSwitcher] = useState<boolean>(false);

  // Tick a cada 1 segundo para contagem regressiva e transição de fases
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calcula o estado do evento
  const eventState: MagikarpEventStateDTO = useMemo(() => {
    return determineActiveEventState(now, overrideConfig, 0, 2);
  }, [now, overrideConfig]);

  // Carrega progresso do usuário para o ciclo ativo
  const [userProgress, setUserProgress] = useState<MagikarpUserProgressDTO>(() =>
    getLocalUserEventProgress(userId, eventState.cycleYear)
  );

  useEffect(() => {
    setUserProgress(getLocalUserEventProgress(userId, eventState.cycleYear));
  }, [userId, eventState.cycleYear]);

  // Se a fase for 'climax' e o jogador ainda não viu a cena ao vivo, abre o modal automaticamente
  useEffect(() => {
    if (eventState.currentPhase === 'climax') {
      const alreadySeen = hasSeenClimaxCutscene(eventState.cycleYear);
      if (!alreadySeen && !overrideConfig.forcePhase) {
        setShowClimaxModal(true);
      }
    }
  }, [eventState.currentPhase, eventState.cycleYear, overrideConfig.forcePhase]);

  // Lista de marcos dinâmicos
  const milestones: MagikarpMilestone[] = useMemo(() => {
    return getMagikarpMilestones(
      userProgress.eventMinutesStudied,
      eventState.communityGoal.currentCommunityMinutes,
      eventState.communityGoal.targetMinutes,
      userProgress.claimedMilestoneIds
    );
  }, [userProgress, eventState.communityGoal]);

  const claimMilestone = useCallback((milestoneId: string) => {
    const updated = claimEventMilestone(userId, eventState.cycleYear, milestoneId);
    setUserProgress({ ...updated });
    return updated;
  }, [userId, eventState.cycleYear]);

  const submitMiniGameScore = useCallback((jumpMeters: number) => {
    const updated = recordMiniGameJump(userId, eventState.cycleYear, jumpMeters);
    setUserProgress({ ...updated });
    return updated;
  }, [userId, eventState.cycleYear]);

  const updateDevConfig = useCallback((newConfig: MagikarpDevOverrideConfig | null) => {
    saveDevOverride(newConfig);
    setOverrideConfig(newConfig || {});
  }, []);

  const openClimaxCutscene = useCallback(() => {
    setShowClimaxModal(true);
  }, []);

  const dismissClimaxModal = useCallback(() => {
    setShowClimaxModal(false);
    setClimaxCutsceneSeen(eventState.cycleYear, true);
  }, [eventState.cycleYear]);

  return {
    eventState,
    userProgress,
    milestones,
    claimMilestone,
    submitMiniGameScore,
    // Modais e Visuais
    showClimaxModal,
    openClimaxCutscene,
    dismissClimaxModal,
    showEventHubModal,
    setShowEventHubModal,
    showJumpMiniGame,
    setShowJumpMiniGame,
    showDevSwitcher,
    setShowDevSwitcher,
    // Dev overrides
    overrideConfig,
    updateDevConfig,
  };
}
