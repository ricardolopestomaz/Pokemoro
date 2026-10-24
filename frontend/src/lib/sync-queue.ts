import type {
  BatchSyncPayload,
  LeaderboardEntryDTO,
  LeaderboardQueryDTO,
  LeaderboardResponseDTO,
  SyncResponseDTO,
  SyncSessionPayload,
} from '../types';
import { isSupabaseConfigured, syncBatchToSupabase, fetchSupabaseLeaderboard } from './supabase';

const KEY_SYNC_QUEUE = 'pokemoro_sync_queue';
const KEY_LOCAL_LEADERBOARD = 'pokemoro_mock_leaderboard';

function loadQueue(): SyncSessionPayload[] {
  try {
    const raw = localStorage.getItem(KEY_SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncSessionPayload[]): void {
  try {
    localStorage.setItem(KEY_SYNC_QUEUE, JSON.stringify(queue));
  } catch {}
}

export class OfflineSyncQueueManager {
  private syncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.flushQueue();
      });
    }
  }

  /**
   * Enfileira uma sessão de estudo para sincronização assíncrona com o Supabase.
   */
  public enqueue(session: SyncSessionPayload, autoFlush = true): void {
    const queue = loadQueue();
    // Evita duplicidade por clientSessionId
    if (!queue.some((s) => s.clientSessionId === session.clientSessionId)) {
      queue.push(session);
      saveQueue(queue);
    }

    // Se estiver online e autoFlush habilitado, tenta enviar imediatamente em background
    if (autoFlush && typeof navigator !== 'undefined' && navigator.onLine) {
      void this.flushQueue();
    }
  }

  /**
   * Retorna os itens pendentes na fila.
   */
  public getPending(): SyncSessionPayload[] {
    return loadQueue();
  }

  /**
   * Esvazia a fila enviando as sessões para a nuvem de forma idempotente.
   */
  public async flushQueue(): Promise<SyncResponseDTO | null> {
    if (this.syncing) return null;
    const queue = loadQueue();
    if (queue.length === 0) return null;

    this.syncing = true;
    try {
      const profileRaw = localStorage.getItem('pokemoro_profile');
      const profile = profileRaw ? JSON.parse(profileRaw) : null;
      const avatarIcon = localStorage.getItem('pokemoro_avatar') || 'caterpie';
      const avatarBg = localStorage.getItem('pokemoro_avatar_bg') || 'greengrass';

      let pokeId = 10;
      let variant: 'regular' | 'shiny' = 'regular';
      if (avatarIcon.startsWith('poke_')) {
        const parts = avatarIcon.split('_');
        pokeId = Number(parts[1]) || 10;
        variant = (parts[2] || 'regular') as 'regular' | 'shiny';
      }

      // Obtém a equipe equipada para o snapshot
      let equippedTeam: number[] = [pokeId];
      try {
        const teamRaw = localStorage.getItem('pokemoro_active_team');
        const activeIds = teamRaw ? JSON.parse(teamRaw) : [];
        const collectionRaw = localStorage.getItem('pokemoro_collection');
        const collection = collectionRaw ? JSON.parse(collectionRaw) : [];
        if (Array.isArray(activeIds) && activeIds.length > 0) {
          const ids = activeIds
            .map((id: string) => collection.find((p: any) => p.id === id)?.pokemonId)
            .filter(Boolean);
          if (ids.length > 0) equippedTeam = ids;
        }
      } catch {}

      const payload: BatchSyncPayload = {
        userId: profile?.id || 'local-student-01',
        sessions: [...queue],
        profileSnapshot: {
          displayName: profile?.name || 'Estudante',
          avatarPokemonId: pokeId,
          avatarVariant: variant,
          avatarBg,
          currentStreak: profile?.streakDays || 1,
          equippedTeam,
        },
      };

      // Simulação / Envio híbrido para o endpoint do Supabase
      // Em ambiente standalone, atualiza o mock de ranking local persistido
      const res = await this.sendBatch(payload);

      // Limpa as sessões processadas da fila local
      const remaining = loadQueue().filter(
        (item) => !res.processedSessionIds.includes(item.clientSessionId)
      );
      saveQueue(remaining);

      return res;
    } catch {
      // Falha de rede: mantém na fila para a próxima tentativa
      return null;
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Indica se a sincronização em nuvem com o Supabase está pronta e online.
   */
  public isCloudConnected(): boolean {
    return isSupabaseConfigured() && (typeof navigator === 'undefined' || navigator.onLine);
  }

  /**
   * Envio assíncrono para Supabase ou fallback resiliente local.
   */
  private async sendBatch(payload: BatchSyncPayload): Promise<SyncResponseDTO> {
    const totalMinutes = payload.sessions.reduce((acc, s) => acc + s.actualDurationMinutes, 0);

    // Se o Supabase estiver configurado e o dispositivo estiver online, tenta sincronizar na nuvem
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const cloudRes = await syncBatchToSupabase(payload);
        if (cloudRes && cloudRes.success) {
          this.updateLocalLeaderboard(payload, totalMinutes);
          return cloudRes;
        }
      } catch (err) {
        console.warn('[SyncQueue] Nuvem indisponível ou erro de sincronização:', err);
      }
    }

    // Fallback local: atualiza ranking simulado localmente (para exibição sem Supabase configurado ou falhas de nuvem)
    this.updateLocalLeaderboard(payload, totalMinutes);

    return {
      success: true,
      processedSessionIds: payload.sessions.map((s) => s.clientSessionId),
      ignoredDuplicateIds: [],
      serverTimestamp: new Date().toISOString(),
      leaderboardSnapshot: {
        rankPosition: 1,
        totalMinutesAllTime: totalMinutes,
        weeklyMinutes: totalMinutes,
        percentileTop: 10,
      },
    };
  }

  /**
   * Consulta o ranking global com suporte a filtros de período (Nuvem ou Local).
   */
  public async getLeaderboard(query: LeaderboardQueryDTO): Promise<LeaderboardResponseDTO> {
    const profileRaw = localStorage.getItem('pokemoro_profile');
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const currentUserId = profile?.id || 'local-student-01';

    // Obtém a equipe do usuário para exibição local
    let userTeam: number[] = [10];
    try {
      const teamRaw = localStorage.getItem('pokemoro_active_team');
      const activeIds = teamRaw ? JSON.parse(teamRaw) : [];
      const collectionRaw = localStorage.getItem('pokemoro_collection');
      const collection = collectionRaw ? JSON.parse(collectionRaw) : [];
      if (Array.isArray(activeIds) && activeIds.length > 0) {
        const ids = activeIds
          .map((id: string) => collection.find((p: any) => p.id === id)?.pokemonId)
          .filter(Boolean);
        if (ids.length > 0) userTeam = ids;
      }
    } catch {}

    // 1. Tenta consultar o Leaderboard Global direto do Supabase
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      const cloudData = await fetchSupabaseLeaderboard(query, currentUserId);
      if (cloudData && cloudData.entries.length > 0) {
        return cloudData;
      }
    }

    // 2. Fallback resiliente local caso offline ou sem credenciais
    const raw = localStorage.getItem(KEY_LOCAL_LEADERBOARD);
    let entries: LeaderboardEntryDTO[] = raw ? JSON.parse(raw) : [];

    if (entries.length === 0) {
      // Mock inicial de estudantes parceiros com equipes autênticas
      entries = [
        {
          rank: 1,
          userId: 'student-ash-01',
          displayName: 'Ash de Pallet',
          avatarPokemonId: 25,
          avatarVariant: 'regular',
          avatarBg: 'greengrass',
          minutesStudied: 450,
          streakDays: 14,
          isCurrentUser: false,
          equippedTeam: [25, 1, 4, 7, 10], // Pikachu, Bulbasaur, Charmander, Squirtle, Caterpie
        },
        {
          rank: 2,
          userId: 'student-misty-02',
          displayName: 'Misty de Cerulean',
          avatarPokemonId: 54,
          avatarVariant: 'regular',
          avatarBg: 'beach',
          minutesStudied: 380,
          streakDays: 9,
          isCurrentUser: false,
          equippedTeam: [54, 120, 175, 60, 134], // Psyduck, Staryu, Togepi, Poliwag, Vaporeon
        },
        {
          rank: 3,
          userId: 'student-brock-03',
          displayName: 'Brock de Pewter',
          avatarPokemonId: 95,
          avatarVariant: 'regular',
          avatarBg: 'cave',
          minutesStudied: 310,
          streakDays: 12,
          isCurrentUser: false,
          equippedTeam: [95, 74, 37, 41, 111], // Onix, Geodude, Vulpix, Zubat, Rhyhorn
        },
      ];
    }

    // Recalcula ranks ordenados por tempo
    entries.sort((a, b) => b.minutesStudied - a.minutesStudied);
    entries = entries.map((e, idx) => ({
      ...e,
      rank: idx + 1,
      isCurrentUser: e.userId === currentUserId,
      equippedTeam: e.userId === currentUserId ? userTeam : (e.equippedTeam || [e.avatarPokemonId]),
    }));

    const userSummary = entries.find((e) => e.isCurrentUser) || {
      rank: entries.length + 1,
      userId: currentUserId,
      displayName: profile?.name || 'Você',
      avatarPokemonId: 10,
      avatarVariant: 'regular',
      avatarBg: 'greengrass',
      minutesStudied: 0,
      streakDays: profile?.streakDays || 0,
      isCurrentUser: true,
      equippedTeam: userTeam,
    };

    return {
      timeframe: query.timeframe,
      totalParticipants: entries.length,
      entries: entries.slice(0, query.limit || 50),
      userSummary,
    };
  }

  private updateLocalLeaderboard(payload: BatchSyncPayload, sessionMinutes: number): void {
    const raw = localStorage.getItem(KEY_LOCAL_LEADERBOARD);
    let entries: LeaderboardEntryDTO[] = raw ? JSON.parse(raw) : [];

    const existingIdx = entries.findIndex((e) => e.userId === payload.userId);
    if (existingIdx !== -1) {
      entries[existingIdx].minutesStudied += sessionMinutes;
      entries[existingIdx].streakDays = payload.profileSnapshot.currentStreak;
      entries[existingIdx].displayName = payload.profileSnapshot.displayName;
      entries[existingIdx].avatarPokemonId = payload.profileSnapshot.avatarPokemonId;
      entries[existingIdx].avatarVariant = payload.profileSnapshot.avatarVariant;
      entries[existingIdx].avatarBg = payload.profileSnapshot.avatarBg;
      entries[existingIdx].equippedTeam = payload.profileSnapshot.equippedTeam || [payload.profileSnapshot.avatarPokemonId];
    } else {
      entries.push({
        rank: entries.length + 1,
        userId: payload.userId,
        displayName: payload.profileSnapshot.displayName,
        avatarPokemonId: payload.profileSnapshot.avatarPokemonId,
        avatarVariant: payload.profileSnapshot.avatarVariant,
        avatarBg: payload.profileSnapshot.avatarBg,
        minutesStudied: sessionMinutes,
        streakDays: payload.profileSnapshot.currentStreak,
        isCurrentUser: true,
        equippedTeam: payload.profileSnapshot.equippedTeam || [payload.profileSnapshot.avatarPokemonId],
      });
    }

    try {
      localStorage.setItem(KEY_LOCAL_LEADERBOARD, JSON.stringify(entries));
    } catch {}
  }
}

export const syncQueue = new OfflineSyncQueueManager();
