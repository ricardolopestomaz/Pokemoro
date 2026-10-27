export type MagikarpEventPhase = 'inactive' | 'teaser' | 'live' | 'climax' | 'ended';

export type MagikarpMilestoneType = 'personal' | 'community';

export interface MagikarpMilestone {
  id: string;
  type: MagikarpMilestoneType;
  requiredMinutes: number;
  title: string;
  description: string;
  rewardLabel: string;
  rewardType: 'TITLE' | 'ENVIRONMENT_SKIN' | 'POKEMON_VARIANT' | 'COINS' | 'SNACK' | 'BADGE';
  icon: string;
  isUnlocked: boolean;
  isClaimed: boolean;
}

export interface MagikarpEventTimelineDTO {
  cycleYear: number;
  teaserStartsAt: string;     // ISO 8601 (T - 72h) -> Começa contagem e teasers
  eventStartsAt: string;      // ISO 8601 (T - 0h)  -> Início do Dia D (chuva e tempestade)
  climaxStartsAt: string;     // ISO 8601 (T + 20h) -> Horário do clímax ao vivo
  eventEndsAt: string;        // ISO 8601 (T + 24h) -> Fim do Dia D
  postEventEndsAt: string;    // ISO 8601 (T + 72h) -> Fim do rescaldo e resgate
  nextCycleDate: string;      // Próxima ocorrência anual
}

export interface CommunityGoalCalculationDTO {
  activeUsersCount: number;
  baseMinutesPerUser: number;
  targetMinutes: number;
  currentCommunityMinutes: number;
  progressPercentage: number;
  isTargetAchieved: boolean;
}

export interface MagikarpEventStateDTO {
  eventId: string;
  cycleYear: number;
  currentPhase: MagikarpEventPhase;
  timeline: MagikarpEventTimelineDTO;
  communityGoal: CommunityGoalCalculationDTO;
  secondsUntilNextPhase: number;
  isDoubleCoinsActive: boolean;
  isRainVisualActive: boolean;
  isTeaserVisualActive: boolean;
}

export interface MagikarpUserProgressDTO {
  userId: string;
  cycleYear: number;
  eventMinutesStudied: number;
  jumpMeters: number;
  claimedMilestoneIds: string[];
  highestMiniGameJumpMeters: number;
  unlockedGyaradosShiny: boolean;
  unlockedTieMagikarp: boolean;
  unlockedFurySkin: boolean;
  unlockedSwimmerTitle: boolean;
  storyCardGeneratedAt?: string;
}

export interface MagikarpMiniGameJumpPayload {
  sessionId: string;
  sessionMinutes: number;
  tapImpressionsCount: number;
  calculatedJumpMeters: number;
  polaroidPhotoUrl?: string;
  timestamp: string;
}

export interface MagikarpDevOverrideConfig {
  forcePhase?: MagikarpEventPhase | null;
  simulatedUsersCount?: number;
  simulatedCommunityMinutes?: number;
  simulatedTimeTravelDate?: string;
  bypassTimerValidation?: boolean;
}
