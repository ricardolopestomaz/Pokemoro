export type PomodoroMode = 'CLASSIC_25' | 'EXTENDED_50' | 'FREE_STOPWATCH';

export interface StartStudySessionRequest {
  subjectId: string;             // ID da matéria de estudo
  mode: PomodoroMode;
  targetDurationMinutes: number; // ex: 25, 50 ou 0 para livre
}

export interface StartStudySessionResponse {
  sessionId: string;
  startedAt: string;            // Timestamp ISO
  targetDurationMinutes: number;
  deepFocusEligible: boolean;   // Inicia true
}

export interface EndStudySessionRequest {
  sessionId: string;
  mode?: PomodoroMode;
  actualDurationMinutes: number;
  interruptedEarly: boolean;           // True se cancelou antes do tempo planejado
  timeSpentOutOfAppSeconds: number;    // Medido via AppState/Visibility API
}

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

export interface StudySessionSummaryDTO {
  sessionId: string;
  subjectId: string;
  minutesLogged: number;
  
  // Cálculo de Foco & Recompensas
  isDeepFocusEarned: boolean;          // true se timeSpentOutOfAppSeconds <= 60
  deepFocusMultiplier: number;         // 1.2 se manteve o foco, 1.0 se distraiu
  streakMultiplier: number;            // Multiplicador baseado na sequência de dias
  focusPowerEarned: number;            // Minutos * Streak * DeepFocus
  focusCoinsEarned: number;
  
  // Ofensiva Atualizada
  newStreakDays: number;
  streakKept: boolean;
  
  // Desbloqueio do Coffee Break
  isCoffeeBreakUnlocked: boolean;      // false se cancelado antes do fim
  spawnsCount: number;                 // 0 se interrompido, 2 a 5 se concluído
}
