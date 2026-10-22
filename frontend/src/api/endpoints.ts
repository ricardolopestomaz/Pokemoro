import { request, ApiError } from './client';
import type {
  BiscuitType, CoffeeBreak, EndSessionPayload, FeedResponse, FocusDex, PomodoroMode,
  SessionSummary, StartSessionResponse, Subject, TeamResponse, UserPokemon, UserProfile,
} from '../types';

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  health: () => request<{ status: string }>('/api/health'),

  // Usuário
  getProfile: () => request<UserProfile>('/api/user/profile'),
  setEnvironment: (environment: string) => post<UserProfile>('/api/user/environment', { environment }),
  buyBiscuits: (biscuitType: BiscuitType, quantity = 1) =>
    post<UserProfile>('/api/user/biscuits/buy', { biscuitType, quantity }),

  // Estudo
  getSubjects: () => request<Subject[]>('/api/study/subjects'),
  createSubject: (name: string, color?: string, icon?: string) =>
    post<Subject>('/api/study/subjects', { name, color, icon }),
  startSession: (subjectId: string, mode: PomodoroMode, targetDurationMinutes: number) =>
    post<StartSessionResponse>('/api/study/sessions/start', { subjectId, mode, targetDurationMinutes }),
  endSession: (payload: EndSessionPayload) => post<SessionSummary>('/api/study/sessions/end', payload),
  recentSessions: (limit = 10) => request<unknown[]>(`/api/study/sessions/recent?limit=${limit}`),

  // Coffee Break (404 = nenhum ativo)
  getActiveBreak: async (): Promise<CoffeeBreak | null> => {
    try {
      return await request<CoffeeBreak>('/api/coffee-break/active');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  feed: (spawnId: string, biscuitType: BiscuitType) =>
    post<FeedResponse>('/api/coffee-break/feed', { spawnId, biscuitType }),

  // Equipe & Dex
  getTeam: () => request<TeamResponse>('/api/team'),
  setTeam: (pokemonIds: string[]) => post<TeamResponse>('/api/team', { pokemonIds }),
  getCollection: () => request<UserPokemon[]>('/api/team/collection'),
  getDex: () => request<FocusDex>('/api/team/dex'),
};
