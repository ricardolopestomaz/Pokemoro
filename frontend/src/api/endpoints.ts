import { offlineEngine } from '../lib/offline-engine';
import { syncQueue } from '../lib/sync-queue';
import { fetchUserProfileFromSupabase } from '../lib/supabase';
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

  // Usuário (Busca perfil e sincroniza o foguinho diretamente com o banco de dados Supabase)
  getProfile: async (): Promise<UserProfile> => {
    const localProfile = offlineEngine.getProfile();
    try {
      const cloudData = await fetchUserProfileFromSupabase(localProfile.id);
      if (cloudData) {
        return offlineEngine.updateProfileFromCloud(cloudData);
      }
    } catch {}
    return localProfile;
  },
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
    const completedAt = payload.completedAt || new Date().toISOString();
    const startedAt = payload.startedAt || new Date(new Date(completedAt).getTime() - summary.minutesLogged * 60000).toISOString();

    // Enfileira sessão no syncQueue para espelhamento assíncrono no Supabase / Leaderboard
    if (summary.minutesLogged > 0) {
      syncQueue.enqueue({
        clientSessionId: payload.sessionId,
        mode: payload.mode || 'CLASSIC_25',
        actualDurationMinutes: summary.minutesLogged,
        startedAt,
        completedAt,
        isDeepFocus: summary.isDeepFocusEarned,
        streakDays: summary.newStreakDays,
        appVersion: '1.0.0',
      });
    }
    return summary;
  },
  recentSessions: async (limit = 10): Promise<unknown[]> =>
    offlineEngine.getRecentSessions(limit),
  checkMidnightStreak: () => offlineEngine.checkAndResetMidnightStreak(),

  // Sincronização & Leaderboard Supabase
  getLeaderboard: async (query?: Partial<LeaderboardQueryDTO>): Promise<LeaderboardResponseDTO> =>
    syncQueue.getLeaderboard({ timeframe: query?.timeframe || 'weekly', limit: query?.limit || 50 }),
  syncPending: async () => syncQueue.flushQueue(),
  syncFullUserState: async () => syncQueue.syncFullUserStateToSupabase(),
  getPendingSyncCount: () => syncQueue.getPending().length,

  // Coffee Break
  getActiveBreak: async (): Promise<CoffeeBreak | null> => offlineEngine.getActiveBreak(),
  feed: async (spawnId: string, biscuitType: BiscuitType): Promise<FeedResponse> =>
    offlineEngine.feedPokemon(spawnId, biscuitType),
  removeSpawn: async (spawnId: string): Promise<void> => offlineEngine.removeSpawn(spawnId),

  // Equipe & Dex
  getTeam: async (): Promise<TeamResponse> => offlineEngine.getTeam(),
  setTeam: async (pokemonIds: string[]): Promise<TeamResponse> => {
    const res = offlineEngine.setTeam(pokemonIds);
    const teamPokemonIds = res.activeTeam.map((m: UserPokemon) => m.pokemonId);
    void syncQueue.syncTeamSnapshot(teamPokemonIds);
    return res;
  },
  getCollection: async (): Promise<UserPokemon[]> => offlineEngine.getCollection(),
  renamePokemon: async (id: string | number, nickname: string): Promise<UserPokemon> =>
    offlineEngine.renamePokemon(id, nickname),
  evolvePokemon: async (id: string | number) => offlineEngine.evolvePokemon(id),
  getDex: async (): Promise<FocusDex> => offlineEngine.getDex(),
  saveDexPhoto: async (
    pokemonId: number,
    sleepStyle: number,
    photoDataUrl: string,
    isShiny?: boolean
  ): Promise<{ ok: boolean }> => offlineEngine.saveDexPhoto(pokemonId, sleepStyle, photoDataUrl, isShiny),
};
