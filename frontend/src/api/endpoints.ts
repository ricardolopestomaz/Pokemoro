import { offlineEngine } from '../lib/offline-engine';
import { syncQueue } from '../lib/sync-queue';
import type {
  BiscuitType,
  CoffeeBreak,
  EndSessionPayload,
  FeedResponse,
  FocusDex,
  LeaderboardQueryDTO,
  LeaderboardResponseDTO,
  PomodoroMode,
  SessionSummary,
  StartSessionResponse,
  Subject,
  TeamResponse,
  UserPokemon,
  UserProfile,
} from '../types';

export const api = {
  health: async () => ({ status: 'ok', mode: 'offline-standalone' }),

  // Usuário
  getProfile: async (): Promise<UserProfile> => offlineEngine.getProfile(),
  completeOnboarding: async (name: string): Promise<UserProfile> => offlineEngine.completeOnboarding(name),
  setEnvironment: async (environment: string): Promise<UserProfile> => offlineEngine.setEnvironment(environment),
  buyBiscuits: async (biscuitType: BiscuitType, quantity = 1): Promise<UserProfile> =>
    offlineEngine.buyBiscuits(biscuitType, quantity),

  // Estudo
  getSubjects: async (): Promise<Subject[]> => offlineEngine.getSubjects(),
  createSubject: async (name: string, color?: string, icon?: string): Promise<Subject> =>
    offlineEngine.createSubject(name, color, icon),
  updateSubject: async (id: string, updates: { name?: string; color?: string; icon?: string }): Promise<Subject> =>
    offlineEngine.updateSubject(id, updates),
  deleteSubject: async (id: string): Promise<{ success: boolean; deletedId: string }> =>
    offlineEngine.deleteSubject(id),
  startSession: async (subjectId: string, mode: PomodoroMode, targetDurationMinutes: number): Promise<StartSessionResponse> =>
    offlineEngine.startSession(subjectId, mode, targetDurationMinutes),
  endSession: async (payload: EndSessionPayload): Promise<SessionSummary> => {
    const summary = offlineEngine.endSession(payload);
    // Enfileira sessão no syncQueue para espelhamento assíncrono no Supabase / Leaderboard
    if (summary.minutesLogged > 0) {
      syncQueue.enqueue({
        clientSessionId: payload.sessionId,
        mode: payload.mode || 'CLASSIC_25',
        actualDurationMinutes: summary.minutesLogged,
        startedAt: new Date(Date.now() - summary.minutesLogged * 60000).toISOString(),
        completedAt: new Date().toISOString(),
        isDeepFocus: summary.isDeepFocusEarned,
        streakDays: summary.newStreakDays,
        appVersion: '1.0.0',
      });
    }
    return summary;
  },
  recentSessions: async (limit = 10): Promise<unknown[]> =>
    offlineEngine.getRecentSessions(limit),

  // Sincronização & Leaderboard Supabase
  getLeaderboard: async (query?: Partial<LeaderboardQueryDTO>): Promise<LeaderboardResponseDTO> =>
    syncQueue.getLeaderboard({ timeframe: query?.timeframe || 'weekly', limit: query?.limit || 50 }),
  syncPending: async () => syncQueue.flushQueue(),
  getPendingSyncCount: () => syncQueue.getPending().length,

  // Coffee Break
  getActiveBreak: async (): Promise<CoffeeBreak | null> => offlineEngine.getActiveBreak(),
  feed: async (spawnId: string, biscuitType: BiscuitType): Promise<FeedResponse> =>
    offlineEngine.feedPokemon(spawnId, biscuitType),

  // Equipe & Dex
  getTeam: async (): Promise<TeamResponse> => offlineEngine.getTeam(),
  setTeam: async (pokemonIds: string[]): Promise<TeamResponse> => offlineEngine.setTeam(pokemonIds),
  getCollection: async (): Promise<UserPokemon[]> => offlineEngine.getCollection(),
  getDex: async (): Promise<FocusDex> => offlineEngine.getDex(),
  saveDexPhoto: async (
    pokemonId: number,
    sleepStyle: number,
    photoDataUrl: string,
    isShiny?: boolean
  ): Promise<{ ok: boolean }> => offlineEngine.saveDexPhoto(pokemonId, sleepStyle, photoDataUrl, isShiny),
};
