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
  actualDurationMinutes: number;
  interruptedEarly: boolean;
  timeSpentOutOfAppSeconds: number;
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
}

export interface CoffeeBreak {
  sessionId: string;
  focusPower: number;
  environment: string;
  spawns: SpawnedPokemon[];
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
  styles: { style1: DexStyle; style2: DexStyle; style3: DexStyle };
}

export interface FocusDex {
  totalDiscovered: number;
  totalAvailable: number;
  completionPercentage: number;
  entries: DexEntry[];
}

export type TabId = 'focus' | 'rest' | 'journey' | 'team' | 'dex';
