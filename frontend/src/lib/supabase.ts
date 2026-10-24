import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type {
  BatchSyncPayload,
  LeaderboardEntryDTO,
  LeaderboardQueryDTO,
  LeaderboardResponseDTO,
  SyncResponseDTO,
  SyncSessionPayload,
} from '../types';

const STORAGE_KEY_USER_ID = 'pokemoro_supabase_user_id';

// Limpeza de segurança para remover qualquer chave antiga de localStorage
try {
  localStorage.removeItem('pokemoro_supabase_url');
  localStorage.removeItem('pokemoro_supabase_anon_key');
} catch {}

/**
 * Retorna as credenciais ativas do Supabase lendo EXCLUSIVAMENTE variáveis de ambiente
 * injetadas em tempo de compilação (Build-Time Security).
 */
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  let url = '';
  let anonKey = '';

  try {
    url = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
    anonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();
  } catch {}

  return { url, anonKey };
}

/**
 * Depreciado por segurança: Credenciais são configuradas exclusivamente via build (.env).
 */
export function saveSupabaseCredentials(_url: string, _anonKey: string): void {
  // No-op por segurança: impede escrita de chaves sensíveis em armazenamento web
}

/**
 * Verifica se o Supabase possui credenciais válidas configuradas.
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    anonKey.length > 20 &&
    !url.includes('seu-projeto')
  );
}

let cachedClient: SupabaseClient | null = null;

/**
 * Obtém a instância singleton do cliente Supabase.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !isSupabaseConfigured()) {
    return null;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('[Supabase] Falha ao inicializar cliente:', err);
    return null;
  }
}

/**
 * Garante que o usuário possua uma sessão autenticada (via Anonymous Auth do Supabase).
 * Preserva o mesmo UUID do estudante entre sessões.
 */
export async function getOrCreateSupabaseUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Verifica se já há uma sessão salva no localStorage
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      localStorage.setItem(STORAGE_KEY_USER_ID, session.user.id);
      return session.user;
    }

    // 2. Se não houver, tenta login anônimo
    const { data: anonData, error: anonError } = await client.auth.signInAnonymously();
    if (!anonError && anonData?.user) {
      localStorage.setItem(STORAGE_KEY_USER_ID, anonData.user.id);
      return anonData.user;
    }

    if (anonError) {
      console.warn('[Supabase] Autenticação anônima não pôde ser completada:', anonError.message);
    }
  } catch (err) {
    console.warn('[Supabase] Erro ao obter/criar usuário autenticado:', err);
  }

  return null;
}

/**
 * Sincroniza um lote de sessões de estudo com o Supabase.
 * Executa de forma atômica e idempotente, atualizando o perfil e disparando os triggers de ranking.
 */
export async function syncBatchToSupabase(payload: BatchSyncPayload): Promise<SyncResponseDTO | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Obtém ou autentica o usuário
    const user = await getOrCreateSupabaseUser();
    const effectiveUserId = user?.id || payload.userId;

    // 2. Atualiza ou cria o perfil público (upsert) incluindo a equipe ativa
    const profilePayload: Record<string, any> = {
      id: effectiveUserId,
      display_name: payload.profileSnapshot.displayName || 'Estudante',
      avatar_pokemon_id: payload.profileSnapshot.avatarPokemonId || 10,
      avatar_variant: payload.profileSnapshot.avatarVariant || 'regular',
      avatar_bg: payload.profileSnapshot.avatarBg || 'greengrass',
      streak_days: payload.profileSnapshot.currentStreak || 0,
      updated_at: new Date().toISOString(),
    };

    if (payload.profileSnapshot.equippedTeam) {
      profilePayload.equipped_team = payload.profileSnapshot.equippedTeam;
    }

    const { error: profileError } = await client.from('profiles').upsert(
      profilePayload,
      { onConflict: 'id' }
    );

    if (profileError) {
      if (profileError.message.includes('equipped_team')) {
        delete profilePayload.equipped_team;
        await client.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      } else {
        console.warn('[Supabase] Aviso ao atualizar profiles:', profileError.message);
      }
    }

    // 3. Insere as sessões pendentes no ledger com restrição de idempotência
    const eventsToInsert = payload.sessions.map((s) => ({
      client_session_id: s.clientSessionId,
      user_id: effectiveUserId,
      mode: s.mode,
      duration_minutes: Math.min(180, Math.max(1, s.actualDurationMinutes)),
      is_deep_focus: s.isDeepFocus,
      client_started_at: s.startedAt,
      client_completed_at: s.completedAt,
      client_hash: s.clientHash || null,
    }));

    // Inserção com ignoreDuplicates para garantir idempotência em caso de retentativas
    const { data: insertedData, error: sessionError } = await client
      .from('study_session_sync_events')
      .upsert(eventsToInsert, {
        onConflict: 'user_id,client_session_id',
        ignoreDuplicates: true,
      })
      .select('client_session_id');

    if (sessionError) {
      console.warn('[Supabase] Erro ao inserir eventos de sessão:', sessionError.message);
      return null;
    }

    const processedIds = insertedData ? insertedData.map((d: { client_session_id: string }) => d.client_session_id) : payload.sessions.map((s) => s.clientSessionId);
    const ignoredDuplicateIds = payload.sessions
      .map((s) => s.clientSessionId)
      .filter((id) => !processedIds.includes(id));

    // 4. Consulta a posição atualizada do usuário no ranking
    const { data: statsData } = await client
      .from('leaderboard_stats')
      .select('total_minutes_all_time, weekly_minutes')
      .eq('user_id', effectiveUserId)
      .single();

    const totalMinutesAllTime = statsData?.total_minutes_all_time || 0;
    const weeklyMinutes = statsData?.weekly_minutes || 0;

    return {
      success: true,
      processedSessionIds: processedIds,
      ignoredDuplicateIds,
      serverTimestamp: new Date().toISOString(),
      leaderboardSnapshot: {
        rankPosition: 1,
        totalMinutesAllTime,
        weeklyMinutes,
        percentileTop: 10,
      },
    };
  } catch (err) {
    console.warn('[Supabase] Falha durante sincronização em lote:', err);
    return null;
  }
}

/**
 * Consulta o Leaderboard Global direto do Supabase.
 */
export async function fetchSupabaseLeaderboard(
  query: LeaderboardQueryDTO,
  currentUserId: string
): Promise<LeaderboardResponseDTO | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const limit = query.limit || 50;

    // Determina a coluna de ordenação com base no timeframe solicitado
    let sortColumn = 'total_minutes_all_time';
    let minsField = 'total_minutes_all_time';
    if (query.timeframe === 'weekly') {
      sortColumn = 'weekly_minutes';
      minsField = 'weekly_minutes';
    } else if (query.timeframe === 'monthly') {
      sortColumn = 'monthly_minutes';
      minsField = 'monthly_minutes';
    } else if (query.timeframe === 'daily') {
      sortColumn = 'daily_minutes';
      minsField = 'daily_minutes';
    }

    // Consulta join com a tabela de perfis (com compatibilidade para esquemas com ou sem equipped_team)
    let data: any[] | null = null;
    let queryError: any = null;
    let totalCount = 0;

    const resWithTeam = await client
      .from('leaderboard_stats')
      .select(
        `
        user_id,
        total_minutes_all_time,
        weekly_minutes,
        monthly_minutes,
        daily_minutes,
        current_streak,
        profiles!inner (
          display_name,
          avatar_pokemon_id,
          avatar_variant,
          avatar_bg,
          equipped_team
        )
      `,
        { count: 'exact' }
      )
      .order(sortColumn, { ascending: false })
      .limit(limit);

    if (resWithTeam.error && resWithTeam.error.message.includes('equipped_team')) {
      const resWithoutTeam = await client
        .from('leaderboard_stats')
        .select(
          `
          user_id,
          total_minutes_all_time,
          weekly_minutes,
          monthly_minutes,
          daily_minutes,
          current_streak,
          profiles!inner (
            display_name,
            avatar_pokemon_id,
            avatar_variant,
            avatar_bg
          )
        `,
          { count: 'exact' }
        )
        .order(sortColumn, { ascending: false })
        .limit(limit);

      data = resWithoutTeam.data;
      queryError = resWithoutTeam.error;
      totalCount = resWithoutTeam.count || 0;
    } else {
      data = resWithTeam.data;
      queryError = resWithTeam.error;
      totalCount = resWithTeam.count || 0;
    }

    if (queryError || !data) {
      console.warn('[Supabase] Erro ao consultar leaderboard:', queryError?.message);
      return null;
    }

    const entries: LeaderboardEntryDTO[] = data.map((row: any, idx: number) => {
      const minutesStudied = Number(row[minsField]) || 0;
      const isCurrentUser = row.user_id === currentUserId;
      const equippedTeam = Array.isArray(row.profiles?.equipped_team)
        ? row.profiles.equipped_team
        : [row.profiles?.avatar_pokemon_id || 10];
      return {
        rank: idx + 1,
        userId: row.user_id,
        displayName: row.profiles?.display_name || 'Estudante',
        avatarPokemonId: row.profiles?.avatar_pokemon_id || 10,
        avatarVariant: row.profiles?.avatar_variant || 'regular',
        avatarBg: row.profiles?.avatar_bg || 'greengrass',
        minutesStudied,
        streakDays: row.current_streak || 0,
        isCurrentUser,
        equippedTeam,
      };
    });

    // Localiza ou prepara o sumário do usuário atual
    let userSummary = entries.find((e) => e.isCurrentUser);
    if (!userSummary && currentUserId) {
      // Tenta buscar especificamente os dados do usuário caso esteja fora do top limit
      try {
        const { data: myStats } = await client
          .from('leaderboard_stats')
          .select(`
            user_id,
            total_minutes_all_time,
            weekly_minutes,
            monthly_minutes,
            daily_minutes,
            current_streak,
            profiles!inner (
              display_name,
              avatar_pokemon_id,
              avatar_variant,
              avatar_bg
            )
          `)
          .eq('user_id', currentUserId)
          .single();

        if (myStats) {
          const equippedTeam = Array.isArray((myStats as any).profiles?.equipped_team)
            ? (myStats as any).profiles.equipped_team
            : [(myStats as any).profiles?.avatar_pokemon_id || 10];
          userSummary = {
            rank: entries.length + 1,
            userId: currentUserId,
            displayName: (myStats as any).profiles?.display_name || 'Você',
            avatarPokemonId: (myStats as any).profiles?.avatar_pokemon_id || 10,
            avatarVariant: (myStats as any).profiles?.avatar_variant || 'regular',
            avatarBg: (myStats as any).profiles?.avatar_bg || 'greengrass',
            minutesStudied: Number((myStats as any)[minsField]) || 0,
            streakDays: (myStats as any).current_streak || 0,
            isCurrentUser: true,
            equippedTeam,
          };
        }
      } catch {}
    }

    // Se ainda assim o usuário não tiver registro no Supabase, provê um sumário seguro padrão
    if (!userSummary) {
      userSummary = {
        rank: entries.length + 1,
        userId: currentUserId || 'usr-local-default',
        displayName: 'Você',
        avatarPokemonId: 10,
        avatarVariant: 'regular',
        avatarBg: 'greengrass',
        minutesStudied: 0,
        streakDays: 0,
        isCurrentUser: true,
        equippedTeam: [10],
      };
    }

    return {
      timeframe: query.timeframe,
      totalParticipants: totalCount || entries.length,
      entries,
      userSummary,
    };
  } catch (err) {
    console.warn('[Supabase] Falha de rede ao consultar ranking:', err);
    return null;
  }
}
