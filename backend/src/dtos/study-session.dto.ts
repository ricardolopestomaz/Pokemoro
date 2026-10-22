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
  actualDurationMinutes: number;
  interruptedEarly: boolean;           // True se cancelou antes do tempo planejado
  timeSpentOutOfAppSeconds: number;    // Medido via AppState/Visibility API
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
