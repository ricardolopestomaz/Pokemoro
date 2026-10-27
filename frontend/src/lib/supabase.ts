import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { getEarnedBadgeCount, badgeCountForStreak } from './badges';
import { isStreakBroken, formatLocalDate } from './date-utils';
import type {
  BatchSyncPayload,
  LeaderboardEntryDTO,
  LeaderboardQueryDTO,
  LeaderboardResponseDTO,
  SyncResponseDTO,
  SyncSessionPayload,
  TeamMemberDTO,
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

    // 2. Atualiza ou cria o perfil público (upsert) incluindo a equipe ativa codificada de forma resiliente
    let avatarBg = payload.profileSnapshot.avatarBg || 'greengrass';
    if (payload.profileSnapshot.equippedTeam && payload.profileSnapshot.equippedTeam.length > 0) {
      const cleanBg = avatarBg.split(':')[0];
      const teamCode = payload.profileSnapshot.equippedTeam.slice(0, 5).map((id) => Number(id).toString(36)).join('.');
      const encoded = `${cleanBg}:${teamCode}`;
      if (encoded.length <= 32) {
        avatarBg = encoded;
      }
    }

    const badgesCount = payload.profileSnapshot.badges !== undefined
      ? payload.profileSnapshot.badges
      : getEarnedBadgeCount(payload.profileSnapshot.currentStreak || 0);

    const profilePayload: Record<string, any> = {
      id: effectiveUserId,
      display_name: payload.profileSnapshot.displayName || 'Estudante',
      avatar_pokemon_id: payload.profileSnapshot.avatarPokemonId || 10,
      avatar_variant: payload.profileSnapshot.avatarVariant || 'regular',
      avatar_bg: avatarBg,
      streak_days: payload.profileSnapshot.currentStreak || 0,
      badges: badgesCount,
      updated_at: new Date().toISOString(),
    };

    profilePayload.equipped_team = (payload.profileSnapshot.equippedTeam && payload.profileSnapshot.equippedTeam.length > 0)
      ? payload.profileSnapshot.equippedTeam
      : [payload.profileSnapshot.avatarPokemonId || 10];

    const { error: profileError } = await client.from('profiles').upsert(
      profilePayload,
      { onConflict: 'id' }
    );

    if (profileError) {
      const retryPayload = { ...profilePayload };
      let hadFieldRemoval = false;
      if (profileError.message.includes('equipped_team')) {
        delete retryPayload.equipped_team;
        hadFieldRemoval = true;
      }
      if (profileError.message.includes('badges')) {
        delete retryPayload.badges;
        hadFieldRemoval = true;
      }
      if (hadFieldRemoval) {
        await client.from('profiles').upsert(retryPayload, { onConflict: 'id' });
      } else {
        console.warn('[Supabase] Aviso ao atualizar profiles:', profileError.message);
      }
    }

    // 3. Insere as sessões pendentes no ledger com restrição de idempotência
    const eventsToInsert = payload.sessions.map((s) => ({
      client_session_id: s.clientSessionId,
      user_id: effectiveUserId,
      mode: s.mode,
      duration_minutes: Math.min(720, Math.max(1, s.actualDurationMinutes)),
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

    // Varredura global: zera no banco as ofensivas de quem ficou um dia inteiro sem estudar
    try {
      await client.rpc('check_and_reset_streaks', { p_user_id: null });
    } catch {}

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

    // Busca mais linhas que o limite: a ordenação final (insígnias > minutos) é feita no cliente
    const fetchLimit = Math.max(limit * 4, 200);
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
        badges,
        last_study_date,
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
      .limit(fetchLimit);

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
          last_study_date,
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

    const parseEquippedTeam = (prof: any): TeamMemberDTO[] => {
      if (!prof) return [10];
      const rawTeam = prof.equipped_team;
      let parsed: any = rawTeam;
      if (typeof rawTeam === 'string') {
        try {
          parsed = JSON.parse(rawTeam);
        } catch {}
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        const list: TeamMemberDTO[] = [];
        for (const item of parsed) {
          if (typeof item === 'number' && !isNaN(item) && item > 0) {
            list.push(item);
          } else if (typeof item === 'string') {
            const num = parseInt(item, 10);
            if (!isNaN(num) && num > 0) list.push(num);
          } else if (item && typeof item === 'object') {
            const pId = Number(item.pokemonId || item.id);
            if (!isNaN(pId) && pId > 0) {
              list.push({ pokemonId: pId, variant: item.variant === 'shiny' ? 'shiny' : 'regular' });
            }
          }
        }
        if (list.length > 0) return list;
      }

      // Fallback 1: avatar_bg codificado com teamCode ("greengrass:p.1.4...")
      const bg = prof.avatar_bg;
      if (typeof bg === 'string' && bg.includes(':')) {
        const code = bg.split(':')[1];
        const parts = code
          .split(/[\.,]/)
          .map((item: string) => {
            const val = parseInt(item, 36);
            return isNaN(val) ? 0 : val;
          })
          .filter((id: number) => id > 0);
        if (parts.length > 0) return parts;
      }

      // Fallback 2: avatar_pokemon_id
      const fallbackId = Number(prof.avatar_pokemon_id) || 10;
      return [fallbackId];
    };

    const storedUid = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER_ID) : null;

    const effectiveStreak = (row: any): number =>
      isStreakBroken(row?.last_study_date ?? null) ? 0 : (Number(row?.current_streak) || 0);

    // Minutos do período só valem se o último estudo caiu dentro do período atual
    // (o banco não zera daily/weekly/monthly sozinho, então "1h de ontem" ficava contando hoje)
    const effectiveMinutes = (row: any): number => {
      const raw = Number(row?.[minsField]) || 0;
      if (minsField === 'total_minutes_all_time') return raw;
      const last: string | null = row?.last_study_date ?? null;
      if (!last) return 0;
      const today = formatLocalDate(new Date());
      if (minsField === 'daily_minutes') return last === today ? raw : 0;
      if (minsField === 'monthly_minutes') return last.slice(0, 7) === today.slice(0, 7) ? raw : 0;
      // weekly: semana começando na segunda-feira
      const weekStart = (s: string): string => {
        const [y, m, d] = s.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
        return formatLocalDate(dt);
      };
      return weekStart(last) === weekStart(today) ? raw : 0;
    };

    const rowBadgeCount = (row: any): number => {
      const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const rb = row.badges !== undefined && row.badges !== null ? Number(row.badges) : undefined;
      const pb = profileData?.badges !== undefined && profileData?.badges !== null ? Number(profileData.badges) : undefined;
      return Math.max(rb ?? 0, pb ?? 0, badgeCountForStreak(effectiveStreak(row)));
    };

    // Ranking geral: mais insígnias primeiro (peso maior), depois mais minutos no período
    data = [...data].sort((a: any, b: any) => {
      const bd = rowBadgeCount(b) - rowBadgeCount(a);
      if (bd !== 0) return bd;
      return effectiveMinutes(b) - effectiveMinutes(a);
    }).slice(0, limit);

    const entries: LeaderboardEntryDTO[] = data.map((row: any, idx: number) => {
      const minutesStudied = effectiveMinutes(row);
      const isCurrentUser =
        row.user_id === currentUserId ||
        (storedUid !== null && row.user_id === storedUid);
      const profileData = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const equippedTeam = parseEquippedTeam(profileData);
      const cleanBg = profileData?.avatar_bg ? profileData.avatar_bg.split(':')[0] : 'greengrass';

      const finalBadges = rowBadgeCount(row);

      return {
        rank: idx + 1,
        userId: row.user_id,
        displayName: profileData?.display_name || 'Estudante',
        avatarPokemonId: Number(profileData?.avatar_pokemon_id) || 10,
        avatarVariant: profileData?.avatar_variant || 'regular',
        avatarBg: cleanBg,
        minutesStudied,
        streakDays: effectiveStreak(row),
        badges: finalBadges,
        isCurrentUser,
        equippedTeam,
      };
    });

    // Localiza ou prepara o sumário do usuário atual
    let userSummary = entries.find((e) => e.isCurrentUser);
    if (!userSummary && (currentUserId || storedUid)) {
      const searchUid = currentUserId || storedUid;
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
            last_study_date,
            profiles (
              display_name,
              avatar_pokemon_id,
              avatar_variant,
              avatar_bg,
              equipped_team
            )
          `)
          .eq('user_id', searchUid)
          .single();

        if (myStats) {
          const profileData = Array.isArray((myStats as any).profiles)
            ? (myStats as any).profiles[0]
            : (myStats as any).profiles;
          const equippedTeam = parseEquippedTeam(profileData);
          const cleanBg = profileData?.avatar_bg
            ? profileData.avatar_bg.split(':')[0]
            : 'greengrass';

          userSummary = {
            rank: entries.length + 1,
            userId: searchUid!,
            displayName: profileData?.display_name || 'Você',
            avatarPokemonId: Number(profileData?.avatar_pokemon_id) || 10,
            avatarVariant: profileData?.avatar_variant || 'regular',
            avatarBg: cleanBg,
            minutesStudied: effectiveMinutes(myStats),
            streakDays: effectiveStreak(myStats),
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

/**
 * Busca o streak e perfil atualizado diretamente do Supabase.
 * Retorna os dados oficiais do banco de dados (profiles / leaderboard_stats).
 */
export async function fetchUserProfileFromSupabase(userId?: string): Promise<{
  streakDays: number;
  lastStudyDate: string | null;
  displayName?: string;
  avatarPokemonId?: number;
} | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return null;
  }

  let targetId: string | null | undefined = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER_ID) : null;
  if (!targetId) {
    const user = await getOrCreateSupabaseUser();
    if (user?.id) targetId = user.id;
  }
  if (!targetId) {
    targetId = userId || null;
  }
  if (!targetId) return null;

  try {
    let { data: stats } = await client
      .from('leaderboard_stats')
      .select('current_streak, last_study_date')
      .eq('user_id', targetId)
      .maybeSingle();

    let { data: prof } = await client
      .from('profiles')
      .select('streak_days, display_name, avatar_pokemon_id')
      .eq('id', targetId)
      .maybeSingle();

    // Se não encontrou por targetId e userId for diferente, tenta userId
    if (!stats && !prof && userId && userId !== targetId) {
      const fallbackStats = await client
        .from('leaderboard_stats')
        .select('current_streak, last_study_date')
        .eq('user_id', userId)
        .maybeSingle();
      if (fallbackStats.data) stats = fallbackStats.data;

      const fallbackProf = await client
        .from('profiles')
        .select('streak_days, display_name, avatar_pokemon_id')
        .eq('id', userId)
        .maybeSingle();
      if (fallbackProf.data) prof = fallbackProf.data;
    }

    if (!stats && !prof) return null;

    const rawLastDate: string | null = stats?.last_study_date || null;
    let effectiveStreak = 0;

    // Retorna o número diretamente do banco de dados
    if (stats?.current_streak !== undefined && stats?.current_streak !== null) {
      effectiveStreak = Number(stats.current_streak);
    } else if (prof?.streak_days !== undefined && prof?.streak_days !== null) {
      effectiveStreak = Number(prof.streak_days);
    }

    return {
      streakDays: effectiveStreak,
      lastStudyDate: rawLastDate,
      displayName: prof?.display_name,
      avatarPokemonId: prof?.avatar_pokemon_id,
    };
  } catch (err) {
    console.warn('[Supabase] Erro ao buscar perfil remoto:', err);
    return null;
  }
}
