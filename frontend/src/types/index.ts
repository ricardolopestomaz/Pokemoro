export type BiscuitType = 'BASIC' | 'GREAT' | 'MASTER';
export type PomodoroMode = 'CLASSIC_25' | 'EXTENDED_50' | 'FREE_STOPWATCH';
export type PokemonVariant = 'regular' | 'shiny' | 'events';
export type SleepStyle = 1 | 2 | 3;
export type StudyRole = 'ENERGY' | 'ITEMS' | 'SUBJECT_EXACT' | 'SUBJECT_HUMAN' | 'STAMINA';
export type EnvironmentId = 'greengrass' | 'beach' | 'tundra' | 'cave' | 'study_room';

export interface BiscuitInventory {
  basic: number;
  great: number;
  master: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  streakDays: number;
  lastStudyDate: string | null;
  focusCoins: number;
  inventory: BiscuitInventory;
  activeEnvironment: EnvironmentId | string;
  activeTeamPokemonIds: string[];
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  userId?: string;
  name: string;
  color: string;
  icon: string;
  totalMinutes?: number;
}

export interface StartSessionResponse {
  sessionId: string;
  startedAt: string;
  targetDurationMinutes: number;
  deepFocusEligible: boolean;
}

export interface EndSessionPayload {
  sessionId: string;
  mode?: PomodoroMode;
  actualDurationMinutes: number;
  interruptedEarly: boolean;
  timeSpentOutOfAppSeconds: number;
  startedAt?: string;
  completedAt?: string;
  subjectId?: string;
}

export interface SessionHistoryItem {
  id: string;
  subjectId?: string;
  actualDurationMinutes: number;
  completedAt: string;
  startedAt?: string;
}

export interface AppSettings {
  lowPowerMode: boolean;
  enableFoilEffect: boolean;
  enableConfetti: boolean;
  enableTeamRoaming: boolean;
  enableVisualEffects: boolean;
  enableAudio: boolean;
  enableHaptics: boolean;
}

// ─────────────────────────────────────────────
// DTOs para Sincronização Supabase & Ranking Global
// ─────────────────────────────────────────────

export interface SyncSessionPayload {
  clientSessionId: string;
  mode: PomodoroMode;
  actualDurationMinutes: number;
  startedAt: string;
  completedAt: string;
  isDeepFocus: boolean;
  streakDays: number;
  appVersion: string;
  clientHash?: string;
}

export interface BatchSyncPayload {
  userId: string;
  sessions: SyncSessionPayload[];
  profileSnapshot: {
    displayName: string;
    avatarPokemonId: number;
    avatarVariant: 'regular' | 'shiny';
    avatarBg: string;
    currentStreak: number;
    badges?: number;
    equippedTeam?: TeamMemberDTO[];
  };
}

export interface SyncResponseDTO {
  success: boolean;
  processedSessionIds: string[];
  ignoredDuplicateIds: string[];
  serverTimestamp: string;
  leaderboardSnapshot?: {
    rankPosition: number;
    totalMinutesAllTime: number;
    weeklyMinutes: number;
    percentileTop: number;
  };
}

export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardQueryDTO {
  timeframe: LeaderboardTimeframe;
  limit?: number;
  offset?: number;
  aroundMe?: boolean;
}

export type TeamMemberDTO = number | { pokemonId: number; variant?: 'regular' | 'shiny' };

export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  displayName: string;
  avatarPokemonId: number;
  avatarVariant: 'regular' | 'shiny';
  avatarBg: string;
  minutesStudied: number;
  streakDays: number;
  isCurrentUser: boolean;
  equippedTeam?: TeamMemberDTO[];
  /** Insígnias de ginásio conquistadas (1 a cada 10 dias de ofensiva). */
  badges?: number;
}

export interface LeaderboardResponseDTO {
  timeframe: LeaderboardTimeframe;
  totalParticipants: number;
  entries: LeaderboardEntryDTO[];
  userSummary?: LeaderboardEntryDTO;
}

export interface SessionSummary {
  sessionId: string;
  subjectId: string;
  minutesLogged: number;
  isDeepFocusEarned: boolean;
  deepFocusMultiplier: number;
  streakMultiplier: number;
  focusPowerEarned: number;
  focusCoinsEarned: number;
  newStreakDays: number;
  streakKept: boolean;
  isCoffeeBreakUnlocked: boolean;
  spawnsCount: number;
}

export interface SpawnedPokemon {
  spawnId: string;
  pokemonId: number;
  pokemonName: string;
  variant: PokemonVariant;
  sleepStyle: SleepStyle;
  currentFriendshipPoints: number;
  maxFriendshipPoints: number;
  isAlreadyRecruited: boolean;
  isHungry: boolean;
  isFull: boolean;
  spriteSleepUrl: string;
  spriteMenuUrl: string;
  canvasPosition: { x: number; y: number };
  photoDataUrl?: string | null;
  spawnedAt?: number;
  expiresAt?: number;
}

export interface CoffeeBreak {
  sessionId: string;
  focusPower: number;
  environment: string;
  spawns: SpawnedPokemon[];
  createdAt?: number;
  expiresAt?: number | string;
}

export interface UserPokemon {
  id: string;
  pokemonId: number;
  nickname: string;
  variant: PokemonVariant;
  friendshipLevel: number;
  discoveredStyles: SleepStyle[];
  role: StudyRole;
  passiveBonusDescription: string;
  recruitedAt: string;
  isInActiveTeam?: boolean;
  teamSlot?: number | null;
}

export interface FeedResponse {
  spawnId: string;
  pointsAdded: number;
  newFriendshipPoints: number;
  maxFriendshipPoints: number;
  wasHungry: boolean;
  isFull: boolean;
  isRecruited: boolean;
  recruitedPokemon: UserPokemon | null;
  updatedInventory: BiscuitInventory;
}

export interface TeamResponse {
  activeTeam: UserPokemon[];
  activePassives: string[];
}

export interface DexStyle {
  style: SleepStyle;
  isUnlocked: boolean;
  unlockedAt: string | null;
  discoveredShiny: boolean;
  photoDataUrl?: string | null;
}

export interface DexEntry {
  pokemonId: number;
  pokemonName: string;
  isSeen: boolean;
  isRecruited: boolean;
  hasShiny?: boolean;
  styles: { style1: DexStyle; style2: DexStyle; style3: DexStyle };
}

export interface FocusDex {
  totalDiscovered: number;
  totalAvailable: number;
  completionPercentage: number;
  entries: DexEntry[];
}

export type TabId = 'focus' | 'rest' | 'journey' | 'team' | 'dex';
