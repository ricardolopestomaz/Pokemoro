import type {
  BatchSyncPayload,
  LeaderboardEntryDTO,
  LeaderboardQueryDTO,
  LeaderboardResponseDTO,
  SyncResponseDTO,
  SyncSessionPayload,
  TeamMemberDTO,
} from '../types';
import {
  isSupabaseConfigured,
  syncBatchToSupabase,
  fetchSupabaseLeaderboard,
  getSupabaseClient,
  getOrCreateSupabaseUser,
} from './supabase';
import { badgeCountForStreak, getEarnedBadgeCount } from './badges';

const KEY_SYNC_QUEUE = 'pokemoro_sync_queue';
const KEY_LOCAL_LEADERBOARD = 'pokemoro_mock_leaderboard';
const KEY_TEAM_CACHE = 'pokemoro_active_team_pokemon_ids';
const KEY_TEAM_SYNCED_SIG = 'pokemoro_team_synced_sig';

function teamMemberId(m: TeamMemberDTO): number {
  return typeof m === 'number' ? m : Number(m?.pokemonId) || 0;
}

/**
 * Lê a equipe ATIVA diretamente do estado real do jogo (fonte da verdade), preservando a variante Shiny.
 * Evita mostrar no ranking uma equipe antiga quando o jogador recruta, evolui ou troca membros.
 */
export function readLiveTeam(): TeamMemberDTO[] {
  try {
    const activeRaw = localStorage.getItem('pokemoro_active_team');
    const collectionRaw = localStorage.getItem('pokemoro_collection');
    const activeIds: string[] = activeRaw ? JSON.parse(activeRaw) : [];
    const collection: any[] = collectionRaw ? JSON.parse(collectionRaw) : [];
    if (Array.isArray(collection) && collection.length > 0) {
      const source = Array.isArray(activeIds) && activeIds.length > 0
        ? activeIds.map((id) => collection.find((p) => p.id === id)).filter(Boolean)
        : [collection[0]];
      const members = source
        .slice(0, 5)
        .map((p: any) => ({ pokemonId: Number(p.pokemonId), variant: p.variant === 'shiny' ? 'shiny' as const : 'regular' as const }))
        .filter((m) => m.pokemonId > 0);
      if (members.length > 0) return members;
    }
  } catch {}
  try {
    const cached = localStorage.getItem(KEY_TEAM_CACHE);
    const parsed = cached ? JSON.parse(cached) : [];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as TeamMemberDTO[];
  } catch {}
  return [];
}

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

      // Equipe ativa lida do estado real do jogo (com variante Shiny)
      let equippedTeam: TeamMemberDTO[] = readLiveTeam();
      if (equippedTeam.length === 0) equippedTeam = [pokeId];

      const storedSupabaseUid = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_supabase_user_id') : null;

      const payload: BatchSyncPayload = {
        userId: storedSupabaseUid || profile?.id || 'local-student-01',
        sessions: [...queue],
        profileSnapshot: {
          displayName: profile?.name || 'Estudante',
          avatarPokemonId: pokeId,
          avatarVariant: variant,
          avatarBg,
          currentStreak: profile?.streakDays ?? 0,
          badges: getEarnedBadgeCount(profile?.streakDays ?? 0),
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
    const storedSupabaseUid = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_supabase_user_id') : null;
    const currentUserId = storedSupabaseUid || profile?.id || 'local-student-01';

    // Equipe do usuário lida do estado real do jogo (sempre atualizada, com Shiny)
    let userTeam: TeamMemberDTO[] = readLiveTeam();
    if (userTeam.length === 0) userTeam = [10];
    const userBadges = getEarnedBadgeCount(profile?.streakDays || 0);

    // Garante que a nuvem também esteja com a equipe atual (não depende de sessões pendentes)
    void this.syncTeamSnapshot(userTeam);

    // 1. Tenta consultar o Leaderboard Global direto do Supabase
    if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      const cloudData = await fetchSupabaseLeaderboard(query, currentUserId);
      if (cloudData && cloudData.entries.length > 0) {
        // Assegura que o usuário atual tenha a equipe ativa equipada e todos tenham fallback seguro
        cloudData.entries = cloudData.entries.map((entry) => {
          const isUser =
            entry.userId === currentUserId ||
            (storedSupabaseUid !== null && entry.userId === storedSupabaseUid) ||
            (profile?.name && entry.displayName === profile.name);
          const finalTeam = isUser
            ? userTeam
            : (entry.equippedTeam && entry.equippedTeam.length > 0 ? entry.equippedTeam : [entry.avatarPokemonId || 10]);
          return {
            ...entry,
            isCurrentUser: isUser,
            equippedTeam: finalTeam,
            badges: isUser
              ? Math.max(userBadges, badgeCountForStreak(entry.streakDays))
              : (entry.badges !== undefined ? entry.badges : badgeCountForStreak(entry.streakDays)),
          };
        });

        if (cloudData.userSummary) {
          const isUserMatch =
            cloudData.userSummary.userId === currentUserId ||
            (storedSupabaseUid !== null && cloudData.userSummary.userId === storedSupabaseUid) ||
            (profile?.name && cloudData.userSummary.displayName === profile.name);

          cloudData.userSummary = {
            ...cloudData.userSummary,
            isCurrentUser: true,
            displayName: (isUserMatch && profile?.name) ? profile.name : cloudData.userSummary.displayName,
            equippedTeam: userTeam,
            badges: userBadges,
          };
        }

        return cloudData;
      }
    }

    // 2. Fallback resiliente local caso offline ou sem credenciais
    const raw = localStorage.getItem(KEY_LOCAL_LEADERBOARD);
    let entries: LeaderboardEntryDTO[] = raw ? JSON.parse(raw) : [];

    // Mock de estudantes parceiros com equipes autênticas e diferentes quantidades de insígnias (1 a 8)
    const benchmarkStudents: LeaderboardEntryDTO[] = [
      {
        rank: 1,
        userId: 'student-red-master',
        displayName: 'Red de Pallet',
        avatarPokemonId: 6, // Charizard
        avatarVariant: 'shiny',
        avatarBg: 'mountain',
        minutesStudied: 850,
        streakDays: 80, // 8 insígnias (todas as 8 de Kanto!)
        badges: 8,
        isCurrentUser: false,
        equippedTeam: [6, 25, 3, 9, 143], // Charizard, Pikachu, Venusaur, Blastoise, Snorlax
      },
      {
        rank: 2,
        userId: 'student-gary-02',
        displayName: 'Gary de Pallet',
        avatarPokemonId: 9, // Blastoise
        avatarVariant: 'regular',
        avatarBg: 'beach',
        minutesStudied: 620,
        streakDays: 52, // 5 insígnias!
        badges: 5,
        isCurrentUser: false,
        equippedTeam: [9, 59, 103, 130, 65], // Blastoise, Arcanine, Exeggutor, Gyarados, Alakazam
      },
      {
        rank: 3,
        userId: 'student-ash-01',
        displayName: 'Ash de Pallet',
        avatarPokemonId: 25, // Pikachu
        avatarVariant: 'regular',
        avatarBg: 'greengrass',
        minutesStudied: 450,
        streakDays: 34, // 3 insígnias!
        badges: 3,
        isCurrentUser: false,
        equippedTeam: [25, 1, 4, 7, 10], // Pikachu, Bulbasaur, Charmander, Squirtle, Caterpie
      },
      {
        rank: 4,
        userId: 'student-misty-02',
        displayName: 'Misty de Cerulean',
        avatarPokemonId: 54, // Psyduck
        avatarVariant: 'regular',
        avatarBg: 'beach',
        minutesStudied: 380,
        streakDays: 22, // 2 insígnias!
        badges: 2,
        isCurrentUser: false,
        equippedTeam: [54, 120, 175, 60, 134], // Psyduck, Staryu, Togepi, Poliwag, Vaporeon
      },
      {
        rank: 5,
        userId: 'student-brock-03',
        displayName: 'Brock de Pewter',
        avatarPokemonId: 95, // Onix
        avatarVariant: 'regular',
        avatarBg: 'cave',
        minutesStudied: 310,
        streakDays: 14, // 1 insígnia!
        badges: 1,
        isCurrentUser: false,
        equippedTeam: [95, 74, 37, 41, 111], // Onix, Geodude, Vulpix, Zubat, Rhyhorn
      },
    ];

    if (entries.length < 5 || !entries.some((e) => e.userId === 'student-red-master')) {
      // Mescla garantindo que tenhamos os treinadores de referência com todas e algumas insígnias
      const existingUserOnly = entries.filter((e) => e.isCurrentUser || e.userId === currentUserId);
      entries = [...existingUserOnly, ...benchmarkStudents];
    }

    // Recalcula ranks ordenados por tempo
    entries.sort((a, b) => b.minutesStudied - a.minutesStudied);
    entries = entries.map((e, idx) => {
      const isUser =
        e.userId === currentUserId ||
        (storedSupabaseUid !== null && e.userId === storedSupabaseUid) ||
        (profile?.name && e.displayName === profile.name);
      return {
        ...e,
        rank: idx + 1,
        isCurrentUser: isUser,
        equippedTeam: isUser ? userTeam : (e.equippedTeam || [e.avatarPokemonId]),
        badges: isUser
          ? Math.max(userBadges, badgeCountForStreak(e.streakDays))
          : (e.badges !== undefined ? e.badges : badgeCountForStreak(e.streakDays)),
      };
    });

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
      badges: userBadges,
    };

    return {
      timeframe: query.timeframe,
      totalParticipants: entries.length,
      entries: entries.slice(0, query.limit || 50),
      userSummary,
    };
  }

  /**
   * Atualiza imediatamente a equipe no ranking local e propaga para o Supabase.
   */
  public async syncTeamSnapshot(teamMembers: TeamMemberDTO[]): Promise<void> {
    if (!Array.isArray(teamMembers) || teamMembers.length === 0) return;
    const teamPokemonIds = teamMembers.map(teamMemberId).filter((id) => id > 0);
    if (teamPokemonIds.length === 0) return;

    // Assinatura da equipe: evita reenviar para a nuvem quando nada mudou
    const signature = JSON.stringify(teamMembers);
    let alreadySynced = false;
    try {
      alreadySynced = localStorage.getItem(KEY_TEAM_SYNCED_SIG) === signature;
      localStorage.setItem(KEY_TEAM_CACHE, signature);
    } catch {}

    const profileRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_profile') : null;
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const storedSupabaseUid = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_supabase_user_id') : null;
    const effectiveUserId = storedSupabaseUid || profile?.id || 'local-student-01';

    // 1. Atualiza cache local do leaderboard
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_LOCAL_LEADERBOARD) : null;
    let entries: LeaderboardEntryDTO[] = raw ? JSON.parse(raw) : [];
    const existingIdx = entries.findIndex(
      (e) =>
        e.userId === effectiveUserId ||
        (storedSupabaseUid !== null && e.userId === storedSupabaseUid) ||
        (profile?.name && e.displayName === profile.name)
    );

    if (existingIdx !== -1) {
      entries[existingIdx].equippedTeam = teamMembers;
    } else {
      entries.push({
        rank: entries.length + 1,
        userId: effectiveUserId,
        displayName: profile?.name || 'Você',
        avatarPokemonId: teamPokemonIds[0] || 10,
        avatarVariant: 'regular',
        avatarBg: profile?.activeEnvironment || 'greengrass',
        minutesStudied: 0,
        streakDays: profile?.streakDays || 0,
        isCurrentUser: true,
        equippedTeam: teamMembers,
      });
    }

    try {
      localStorage.setItem(KEY_LOCAL_LEADERBOARD, JSON.stringify(entries));
    } catch {}

    // 2. Se online com Supabase configurado, atualiza o perfil com a nova equipe (apenas se mudou)
    if (!alreadySynced && isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const client = getSupabaseClient();
        if (client) {
          const user = await getOrCreateSupabaseUser();
          const uid = user?.id || effectiveUserId;

          const avatarBg = profile?.activeEnvironment || 'greengrass';
          const teamCode = teamPokemonIds.slice(0, 5).map((id) => Number(id).toString(36)).join('.');
          const encodedBg = `${avatarBg.split(':')[0]}:${teamCode}`;

          const userBadges = getEarnedBadgeCount(profile?.streakDays || 0);

          const updatePayload: Record<string, any> = {
            id: uid,
            display_name: profile?.name || 'Estudante',
            avatar_pokemon_id: teamPokemonIds[0] || 10,
            avatar_variant: 'regular',
            avatar_bg: encodedBg.length <= 32 ? encodedBg : avatarBg.split(':')[0],
            equipped_team: teamMembers,
            streak_days: profile?.streakDays || 0,
            badges: userBadges,
            updated_at: new Date().toISOString(),
          };

          const { error } = await client.from('profiles').upsert(updatePayload, { onConflict: 'id' });
          if (error) {
            const retryPayload = { ...updatePayload };
            let retryNeeded = false;
            if (error.message.includes('equipped_team')) {
              delete retryPayload.equipped_team;
              retryNeeded = true;
            }
            if (error.message.includes('badges')) {
              delete retryPayload.badges;
              retryNeeded = true;
            }
            if (retryNeeded) {
              await client.from('profiles').upsert(retryPayload, { onConflict: 'id' });
            }
          }
          // Marca como sincronizada somente se a nuvem aceitou (senão tenta de novo depois)
          if (!error || error.message.includes('equipped_team')) {
            try { localStorage.setItem(KEY_TEAM_SYNCED_SIG, signature); } catch {}
          }
        }
      } catch (err) {
        console.warn('[SyncQueue] Erro ao sincronizar nova equipe com Supabase:', err);
      }
    }
  }

  /**
   * Sincroniza o estado geral do jogador com o Supabase sempre que o app inicia ou reconecta:
   * 1. Identifica se está conectado à internet (navigator.onLine).
   * 2. Despeja sessões de estudo pendentes (flushQueue).
   * 3. Sincroniza a equipe completa de Pokémon com suas variantes.
   * 4. Sincroniza as horas/minutos acumulados de estudo de todas as matérias.
   * 5. Sincroniza as insígnias oficiais de ginásio.
   */
  public async syncFullUserStateToSupabase(): Promise<{ success: boolean; reason?: string; synced?: string[] }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, reason: 'offline' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, reason: 'supabase_not_configured' };
    }

    try {
      const client = getSupabaseClient();
      if (!client) return { success: false, reason: 'no_client' };

      // 1. Obtém ou autentica o usuário no Supabase
      const user = await getOrCreateSupabaseUser();
      const storedUid = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_supabase_user_id') : null;
      let profile: any = null;
      try {
        const profileRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_profile') : null;
        profile = profileRaw ? JSON.parse(profileRaw) : null;
      } catch {}

      const effectiveUserId = user?.id || storedUid || profile?.id || 'local-student-01';

      // 2. Primeiro, despeja qualquer sessão pendente na fila
      await this.flushQueue();

      // 3. Lê o estado completo do jogador
      const liveTeam = readLiveTeam();
      const teamPokemonIds = liveTeam.map(teamMemberId).filter((id) => id > 0);

      // Total de minutos acumulados de todas as matérias
      let totalMinutes = 0;
      try {
        const subjectsRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_subjects') : null;
        if (subjectsRaw) {
          const subjects = JSON.parse(subjectsRaw);
          if (Array.isArray(subjects)) {
            totalMinutes = subjects.reduce((sum: number, s: any) => sum + (Number(s?.totalMinutes) || 0), 0);
          }
        }
      } catch {}

      const avatarIcon = typeof localStorage !== 'undefined' ? (localStorage.getItem('pokemoro_avatar') || 'caterpie') : 'caterpie';
      const avatarBg = typeof localStorage !== 'undefined' ? (localStorage.getItem('pokemoro_avatar_bg') || profile?.activeEnvironment || 'greengrass') : 'greengrass';
      let pokeId = teamPokemonIds[0] || 10;
      let variant: 'regular' | 'shiny' = 'regular';
      if (avatarIcon.startsWith('poke_')) {
        const parts = avatarIcon.split('_');
        pokeId = Number(parts[1]) || pokeId;
        variant = (parts[2] || 'regular') as 'regular' | 'shiny';
      }

      const userBadges = getEarnedBadgeCount(profile?.streakDays || 0);
      const teamCode = teamPokemonIds.slice(0, 5).map((id) => Number(id).toString(36)).join('.');
      const encodedBg = `${avatarBg.split(':')[0]}:${teamCode}`;

      // 4. Sincroniza o Perfil Público (Pokémons, Insígnias e Ofensiva)
      const profilePayload: Record<string, any> = {
        id: effectiveUserId,
        display_name: profile?.name || 'Estudante',
        avatar_pokemon_id: pokeId,
        avatar_variant: variant,
        avatar_bg: encodedBg.length <= 32 ? encodedBg : avatarBg.split(':')[0],
        equipped_team: liveTeam.length > 0 ? liveTeam : [pokeId],
        streak_days: profile?.streakDays || 0,
        badges: userBadges,
        updated_at: new Date().toISOString(),
      };

      const { error: profErr } = await client.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      if (profErr) {
        const retry = { ...profilePayload };
        let retryNeeded = false;
        if (profErr.message.includes('equipped_team')) { delete retry.equipped_team; retryNeeded = true; }
        if (profErr.message.includes('badges')) { delete retry.badges; retryNeeded = true; }
        if (retryNeeded) {
          await client.from('profiles').upsert(retry, { onConflict: 'id' });
        }
      }

      // 5. Sincroniza as Horas e Ranking em leaderboard_stats
      const statsPayload: Record<string, any> = {
        user_id: effectiveUserId,
        total_minutes_all_time: totalMinutes,
        badges: userBadges,
        current_streak: profile?.streakDays || 0,
        ...(profile?.lastStudyDate ? { last_study_date: profile.lastStudyDate } : {}),
        updated_at: new Date().toISOString(),
      };

      const { error: statsErr } = await client.from('leaderboard_stats').upsert(statsPayload, { onConflict: 'user_id' });
      if (statsErr && statsErr.message.includes('badges')) {
        const retryStats = { ...statsPayload };
        delete retryStats.badges;
        await client.from('leaderboard_stats').upsert(retryStats, { onConflict: 'user_id' });
      }

      // 6. Atualiza o cache local do ranking
      this.updateLocalLeaderboard(
        {
          userId: effectiveUserId,
          sessions: [],
          profileSnapshot: {
            displayName: profile?.name || 'Estudante',
            avatarPokemonId: pokeId,
            avatarVariant: variant,
            avatarBg: avatarBg.split(':')[0],
            currentStreak: profile?.streakDays || 0,
            badges: userBadges,
            equippedTeam: liveTeam,
          },
        },
        totalMinutes
      );

      try {
        localStorage.setItem('pokemoro_last_full_sync', new Date().toISOString());
      } catch {}

      return {
        success: true,
        synced: ['pokemon_team', 'study_hours', 'badges', 'profile'],
      };
    } catch (err) {
      console.warn('[SyncQueue] Erro ao sincronizar estado geral com Supabase:', err);
      return { success: false, reason: String(err) };
    }
  }

  /**
   * Zera a ofensiva (fogo) diretamente no banco de dados Supabase e no ranking local
   * quando o usuário não estudou no dia anterior (virada de meia-noite).
   */
  public async zeroStreakInSupabase(userId?: string): Promise<boolean> {
    const client = getSupabaseClient();
    const storedUid = typeof localStorage !== 'undefined' ? localStorage.getItem('pokemoro_supabase_user_id') : null;
    const effectiveUserId = storedUid || userId;

    // Atualiza cache local do leaderboard
    try {
      const raw = localStorage.getItem(KEY_LOCAL_LEADERBOARD);
      if (raw) {
        const entries: LeaderboardEntryDTO[] = JSON.parse(raw);
        let changed = false;
        entries.forEach((e) => {
          if (e.isCurrentUser || (effectiveUserId && e.userId === effectiveUserId)) {
            e.streakDays = 0;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(KEY_LOCAL_LEADERBOARD, JSON.stringify(entries));
        }
      }
    } catch {}

    if (!client || !effectiveUserId) return false;

    try {
      // 1. Tenta chamar o RPC do Supabase se existir
      try {
        await client.rpc('check_and_reset_streaks', { p_user_id: effectiveUserId });
      } catch {}

      // 2. Atualiza diretamente a tabela de profiles
      await client
        .from('profiles')
        .update({ streak_days: 0, updated_at: new Date().toISOString() })
        .eq('id', effectiveUserId);

      // 3. Atualiza diretamente a tabela leaderboard_stats
      await client
        .from('leaderboard_stats')
        .update({ current_streak: 0, updated_at: new Date().toISOString() })
        .eq('user_id', effectiveUserId);

      return true;
    } catch (err) {
      console.warn('[SyncQueue] Falha ao zerar streak no Supabase:', err);
      return false;
    }
  }

  private updateLocalLeaderboard(payload: BatchSyncPayload, sessionMinutes: number): void {
    let entries: LeaderboardEntryDTO[] = [];
    try {
      const raw = localStorage.getItem(KEY_LOCAL_LEADERBOARD);
      entries = raw ? JSON.parse(raw) : [];
    } catch {}

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
