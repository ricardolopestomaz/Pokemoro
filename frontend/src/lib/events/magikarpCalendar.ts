import type {
  MagikarpEventPhase,
  MagikarpEventTimelineDTO,
  CommunityGoalCalculationDTO,
  MagikarpEventStateDTO,
  MagikarpDevOverrideConfig,
  MagikarpMilestone,
} from '../../types/magikarp-event';

export const MAGIKARP_ANNUAL_CALENDAR = {
  eventId: 'magikarp_day',
  fixedMonth: 11,           // Novembro
  fixedDay: 15,             // Dia 15
  startHourUtc: 3,          // 00h00 BRT (UTC-3)
  teaserHoursBefore: 72,    // Inicia contagem regressiva e soma de horas coletivas (12 de Nov)
  eventDurationHours: 24,   // Dia D: 24 horas (15 de Nov 00:00 até 23:59)
  climaxHourOffset: 20,     // 20h00 BRT (A Porta do Dragão)
  postEventHours: 48,       // 48h seguintes para resgate de prêmios e glória
  baseMinutesTargetPerUser: 120, // Minutos esperados por aluno ativo
  minGlobalMinutesFloor: 300,    // Piso de segurança para poucas pessoas testando
};

const DEV_STORAGE_KEY = 'POKEMORO_MAGIKARP_DEV_OVERRIDE';

/**
 * Calcula a linha do tempo exata para determinado ano
 */
export function getTimelineForYear(year: number): MagikarpEventTimelineDTO {
  const { fixedMonth, fixedDay, startHourUtc, teaserHoursBefore, eventDurationHours, climaxHourOffset, postEventHours } = MAGIKARP_ANNUAL_CALENDAR;

  const eventStart = new Date(Date.UTC(year, fixedMonth - 1, fixedDay, startHourUtc, 0, 0));
  const teaserStart = new Date(eventStart.getTime() - teaserHoursBefore * 3600 * 1000);
  const climaxStart = new Date(eventStart.getTime() + climaxHourOffset * 3600 * 1000);
  const eventEnd = new Date(eventStart.getTime() + eventDurationHours * 3600 * 1000);
  const postEventEnd = new Date(eventEnd.getTime() + postEventHours * 3600 * 1000);
  const nextCycle = new Date(Date.UTC(year + 1, fixedMonth - 1, fixedDay, startHourUtc, 0, 0));

  return {
    cycleYear: year,
    teaserStartsAt: teaserStart.toISOString(),
    eventStartsAt: eventStart.toISOString(),
    climaxStartsAt: climaxStart.toISOString(),
    eventEndsAt: eventEnd.toISOString(),
    postEventEndsAt: postEventEnd.toISOString(),
    nextCycleDate: nextCycle.toISOString(),
  };
}

/**
 * Lê a configuração de override para testes (via Query Params da URL ou LocalStorage)
 */
export function getDevOverride(): MagikarpDevOverrideConfig {
  const result: MagikarpDevOverrideConfig = {};

  if (typeof window !== 'undefined') {
    // 1. Prioridade: Query params na URL (ex: ?magikarp_phase=live&sim_min=290&sim_users=2)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPhase = params.get('magikarp_phase') || params.get('event');
      if (urlPhase && ['inactive', 'teaser', 'live', 'climax', 'ended'].includes(urlPhase)) {
        result.forcePhase = urlPhase as MagikarpEventPhase;
      }
      const simMin = params.get('sim_min');
      if (simMin && !isNaN(Number(simMin))) {
        result.simulatedCommunityMinutes = Number(simMin);
      }
      const simUsers = params.get('sim_users');
      if (simUsers && !isNaN(Number(simUsers))) {
        result.simulatedUsersCount = Number(simUsers);
      }
    } catch {
      // Ignora erro em ambientes de teste sem window.location
    }

    // 2. LocalStorage override
    try {
      const stored = localStorage.getItem(DEV_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MagikarpDevOverrideConfig;
        if (!result.forcePhase && parsed.forcePhase) result.forcePhase = parsed.forcePhase;
        if (result.simulatedCommunityMinutes === undefined && parsed.simulatedCommunityMinutes !== undefined) {
          result.simulatedCommunityMinutes = parsed.simulatedCommunityMinutes;
        }
        if (result.simulatedUsersCount === undefined && parsed.simulatedUsersCount !== undefined) {
          result.simulatedUsersCount = parsed.simulatedUsersCount;
        }
        if (parsed.simulatedTimeTravelDate) {
          result.simulatedTimeTravelDate = parsed.simulatedTimeTravelDate;
        }
      }
    } catch {
      // noop
    }
  }

  return result;
}

/**
 * Salva ou remove o override de dev no localStorage
 */
export function saveDevOverride(config: MagikarpDevOverrideConfig | null) {
  if (typeof window === 'undefined') return;
  if (!config || Object.keys(config).length === 0) {
    localStorage.removeItem(DEV_STORAGE_KEY);
  } else {
    localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify(config));
  }
}

/**
 * Determina o ciclo ativo e a fase atual com base na hora e overrides
 */
export function determineActiveEventState(
  nowInput: Date = new Date(),
  override: MagikarpDevOverrideConfig = getDevOverride(),
  realCommunityMinutes = 0,
  realActiveUsersCount = 1
): MagikarpEventStateDTO {
  let effectiveNow = nowInput;
  if (override.simulatedTimeTravelDate) {
    effectiveNow = new Date(override.simulatedTimeTravelDate);
  }

  const currentYear = effectiveNow.getFullYear();
  let timeline = getTimelineForYear(currentYear);

  // Se o ciclo deste ano já passou totalmente, o alvo passa a ser o ano seguinte
  if (effectiveNow.getTime() > new Date(timeline.postEventEndsAt).getTime()) {
    timeline = getTimelineForYear(currentYear + 1);
  }

  const nowMs = effectiveNow.getTime();
  const teaserMs = new Date(timeline.teaserStartsAt).getTime();
  const eventStartMs = new Date(timeline.eventStartsAt).getTime();
  const climaxMs = new Date(timeline.climaxStartsAt).getTime();
  const eventEndMs = new Date(timeline.eventEndsAt).getTime();
  const postEventEndMs = new Date(timeline.postEventEndsAt).getTime();

  let naturalPhase: MagikarpEventPhase = 'inactive';
  let secondsUntilNextPhase = 0;

  if (nowMs < teaserMs) {
    naturalPhase = 'inactive';
    secondsUntilNextPhase = Math.max(0, Math.floor((teaserMs - nowMs) / 1000));
  } else if (nowMs < eventStartMs) {
    naturalPhase = 'teaser';
    secondsUntilNextPhase = Math.max(0, Math.floor((eventStartMs - nowMs) / 1000));
  } else if (nowMs < climaxMs) {
    naturalPhase = 'live';
    secondsUntilNextPhase = Math.max(0, Math.floor((climaxMs - nowMs) / 1000));
  } else if (nowMs < eventEndMs) {
    naturalPhase = 'climax';
    secondsUntilNextPhase = Math.max(0, Math.floor((eventEndMs - nowMs) / 1000));
  } else if (nowMs <= postEventEndMs) {
    naturalPhase = 'ended';
    secondsUntilNextPhase = Math.max(0, Math.floor((postEventEndMs - nowMs) / 1000));
  } else {
    naturalPhase = 'inactive';
    const nextTimeline = getTimelineForYear(timeline.cycleYear + 1);
    secondsUntilNextPhase = Math.max(0, Math.floor((new Date(nextTimeline.teaserStartsAt).getTime() - nowMs) / 1000));
  }

  // Cálculo da Meta Dinâmica Proporcional
  const activeUsersCount = override.simulatedUsersCount !== undefined 
    ? Math.max(1, override.simulatedUsersCount) 
    : Math.max(1, realActiveUsersCount);

  const baseMinutesPerUser = MAGIKARP_ANNUAL_CALENDAR.baseMinutesTargetPerUser;
  const targetMinutes = Math.max(
    MAGIKARP_ANNUAL_CALENDAR.minGlobalMinutesFloor,
    activeUsersCount * baseMinutesPerUser
  );

  const currentCommunityMinutes = override.simulatedCommunityMinutes !== undefined
    ? override.simulatedCommunityMinutes
    : realCommunityMinutes;

  const progressPercentage = Math.min(100, Math.max(0, Number(((currentCommunityMinutes / targetMinutes) * 100).toFixed(1))));
  const isTargetAchieved = currentCommunityMinutes >= targetMinutes;

  // Se a meta foi batida durante 'live', podemos antecipar o clímax!
  if (naturalPhase === 'live' && isTargetAchieved) {
    naturalPhase = 'climax';
  }

  const finalPhase = override.forcePhase ?? naturalPhase;

  return {
    eventId: MAGIKARP_ANNUAL_CALENDAR.eventId,
    cycleYear: timeline.cycleYear,
    currentPhase: finalPhase,
    timeline,
    communityGoal: {
      activeUsersCount,
      baseMinutesPerUser,
      targetMinutes,
      currentCommunityMinutes,
      progressPercentage,
      isTargetAchieved,
    },
    secondsUntilNextPhase,
    isDoubleCoinsActive: finalPhase === 'live' || finalPhase === 'climax',
    isRainVisualActive: finalPhase === 'live' || finalPhase === 'climax',
    isTeaserVisualActive: finalPhase === 'teaser',
  };
}

/**
 * Lista de Marcos do Evento (Pessoais e Coletivos)
 */
export function getMagikarpMilestones(
  userMinutes: number,
  communityMinutes: number,
  targetMinutes: number,
  claimedIds: string[]
): MagikarpMilestone[] {
  const rawMilestones: Omit<MagikarpMilestone, 'isUnlocked' | 'isClaimed'>[] = [
    {
      id: 'm_25min',
      type: 'personal',
      requiredMinutes: 25,
      title: 'Primeiro Salto',
      description: 'Estude pelo menos 25 minutos durante o festival.',
      rewardLabel: 'Título: "Nadador de Correnteza"',
      rewardType: 'TITLE',
      icon: '🌊',
    },
    {
      id: 'm_50min',
      type: 'personal',
      requiredMinutes: 50,
      title: 'Foco na Tempestade',
      description: 'Estude 50 minutos e domine as correntezas brutais.',
      rewardLabel: 'Cenário Permanente: "Lago da Fúria"',
      rewardType: 'ENVIRONMENT_SKIN',
      icon: '⛈️',
    },
    {
      id: 'm_100min',
      type: 'personal',
      requiredMinutes: 100,
      title: 'Mestre da Determinação',
      description: 'Estude 100 minutos e prove que qualquer peixe vira dragão.',
      rewardLabel: 'Pokémon Raro: Magikarp de Gravata 👔',
      rewardType: 'POKEMON_VARIANT',
      icon: '👓',
    },
    {
      id: 'comm_25pct',
      type: 'community',
      requiredMinutes: Math.round(targetMinutes * 0.25),
      title: 'Correnteza Coletiva',
      description: 'Atingir 25% da meta mundial de foco.',
      rewardLabel: '+100 Foco Coins para todos',
      rewardType: 'COINS',
      icon: '🪙',
    },
    {
      id: 'comm_50pct',
      type: 'community',
      requiredMinutes: Math.round(targetMinutes * 0.5),
      title: 'Metade da Cachoeira',
      description: 'Atingir 50% da meta mundial de foco.',
      rewardLabel: '3x Poké Biscoitos Recheados',
      rewardType: 'SNACK',
      icon: '🍪',
    },
    {
      id: 'comm_100pct',
      type: 'community',
      requiredMinutes: targetMinutes,
      title: 'A Porta do Dragão',
      description: 'Atingir 100% da meta coletiva e quebrar a cachoeira mística.',
      rewardLabel: 'Gyarados Vermelho Lendário (Shiny) + Insígnia do Dragão',
      rewardType: 'BADGE',
      icon: '🐉',
    },
  ];

  return rawMilestones.map((m) => {
    const isUnlocked = m.type === 'personal'
      ? userMinutes >= m.requiredMinutes
      : communityMinutes >= m.requiredMinutes;
    const isClaimed = claimedIds.includes(m.id);
    return {
      ...m,
      isUnlocked,
      isClaimed,
    };
  });
}
