-- ==============================================================================
-- POKÉMORO - SUPABASE POSTGRESQL SCHEMA & GLOBAL LEADERBOARD
-- Compatível com DTO_PAYLOAD_MIGRATION_PLAN.md e POKEMORO_CONCEPT.md
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA: PERFIS PÚBLICOS DOS ESTUDANTES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(32) NOT NULL DEFAULT 'Estudante',
    avatar_pokemon_id INT NOT NULL DEFAULT 10,
    avatar_variant VARCHAR(16) NOT NULL DEFAULT 'regular',
    avatar_bg VARCHAR(32) NOT NULL DEFAULT 'greengrass',
    equipped_team JSONB DEFAULT '[]'::jsonb,
    streak_days INT NOT NULL DEFAULT 0,
    badges INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrações idempotentes para bancos existentes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_team JSONB DEFAULT '[]'::jsonb;

-- RLS: Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis são visíveis publicamente por todos" ON public.profiles;
CREATE POLICY "Perfis são visíveis publicamente por todos" 
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar apenas seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem criar seu perfil inicial" ON public.profiles;
CREATE POLICY "Usuários podem criar seu perfil inicial" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. TABELA: EVENTOS DE SESSÃO SINCRONIZADA (Ledger de Auditoria Imutável)
CREATE TABLE IF NOT EXISTS public.study_session_sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_session_id VARCHAR(64) NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mode VARCHAR(32) NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 720),
    is_deep_focus BOOLEAN NOT NULL DEFAULT true,
    client_started_at TIMESTAMPTZ NOT NULL,
    client_completed_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    client_hash VARCHAR(128),
    CONSTRAINT uk_user_client_session UNIQUE (user_id, client_session_id)
);

ALTER TABLE public.study_session_sync_events DROP CONSTRAINT IF EXISTS study_session_sync_events_duration_minutes_check;
ALTER TABLE public.study_session_sync_events ADD CONSTRAINT study_session_sync_events_duration_minutes_check CHECK (duration_minutes > 0 AND duration_minutes <= 720);

-- RLS: Sessões Sincronizadas
ALTER TABLE public.study_session_sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário pode visualizar suas próprias sessões sincronizadas" ON public.study_session_sync_events;
CREATE POLICY "Usuário pode visualizar suas próprias sessões sincronizadas"
    ON public.study_session_sync_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário autenticado pode inserir eventos de estudo com seu UID" ON public.study_session_sync_events;
CREATE POLICY "Usuário autenticado pode inserir eventos de estudo com seu UID"
    ON public.study_session_sync_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. TABELA: ESTATÍSTICAS E RANKING GLOBAL (Agregador em O(1))
CREATE TABLE IF NOT EXISTS public.leaderboard_stats (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_minutes_all_time BIGINT NOT NULL DEFAULT 0,
    monthly_minutes INT NOT NULL DEFAULT 0,
    weekly_minutes INT NOT NULL DEFAULT 0,
    daily_minutes INT NOT NULL DEFAULT 0,
    current_streak INT NOT NULL DEFAULT 0,
    highest_streak INT NOT NULL DEFAULT 0,
    badges INT NOT NULL DEFAULT 0,
    total_sessions_count INT NOT NULL DEFAULT 0,
    last_study_date DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leaderboard_stats ADD COLUMN IF NOT EXISTS badges INT NOT NULL DEFAULT 0;

-- Índices B-Tree para consultas de sub-segundo no Leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_all_time ON public.leaderboard_stats (total_minutes_all_time DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly ON public.leaderboard_stats (weekly_minutes DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_monthly ON public.leaderboard_stats (monthly_minutes DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily ON public.leaderboard_stats (daily_minutes DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_streak ON public.leaderboard_stats (current_streak DESC);

-- RLS: Leaderboard
ALTER TABLE public.leaderboard_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ranking público legível por qualquer usuário" ON public.leaderboard_stats;
CREATE POLICY "Ranking público legível por qualquer usuário"
    ON public.leaderboard_stats FOR SELECT USING (true);

-- 5. TRIGGER: ATUALIZAÇÃO ATÔMICA DO RANKING NO INGRESSO DE UMA SESSÃO (COM REGRA DUOLINGO)
CREATE OR REPLACE FUNCTION public.handle_study_session_synced()
RETURNS TRIGGER AS $$
DECLARE
    -- A sessão é sempre creditada ao dia em que o estudo INICIOU (regra Duolingo)
    session_date DATE := (NEW.client_started_at AT TIME ZONE 'America/Sao_Paulo')::DATE;
    user_badges_val INT := 0;
    v_calculated_streak INT := 1;
BEGIN
    SELECT COALESCE(badges, 0) INTO user_badges_val FROM public.profiles WHERE id = NEW.user_id;

    INSERT INTO public.leaderboard_stats (
        user_id,
        total_minutes_all_time,
        monthly_minutes,
        weekly_minutes,
        daily_minutes,
        current_streak,
        highest_streak,
        badges,
        total_sessions_count,
        last_study_date,
        updated_at
    )
    VALUES (
        NEW.user_id,
        NEW.duration_minutes,
        NEW.duration_minutes,
        NEW.duration_minutes,
        NEW.duration_minutes,
        1,
        1,
        GREATEST(user_badges_val, 0),
        1,
        session_date,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_minutes_all_time = public.leaderboard_stats.total_minutes_all_time + NEW.duration_minutes,
        monthly_minutes = CASE
            WHEN public.leaderboard_stats.last_study_date IS NOT NULL
             AND date_trunc('month', public.leaderboard_stats.last_study_date) = date_trunc('month', session_date)
            THEN public.leaderboard_stats.monthly_minutes + NEW.duration_minutes
            ELSE NEW.duration_minutes
        END,
        weekly_minutes = CASE
            WHEN public.leaderboard_stats.last_study_date IS NOT NULL
             AND date_trunc('week', public.leaderboard_stats.last_study_date) = date_trunc('week', session_date)
            THEN public.leaderboard_stats.weekly_minutes + NEW.duration_minutes
            ELSE NEW.duration_minutes
        END,
        daily_minutes = CASE 
            WHEN public.leaderboard_stats.last_study_date = session_date 
            THEN public.leaderboard_stats.daily_minutes + NEW.duration_minutes
            ELSE NEW.duration_minutes 
        END,
        current_streak = CASE
            WHEN public.leaderboard_stats.last_study_date = session_date 
                THEN GREATEST(public.leaderboard_stats.current_streak, 1)
            WHEN public.leaderboard_stats.last_study_date = (session_date - INTERVAL '1 day')::DATE 
                THEN public.leaderboard_stats.current_streak + 1
            ELSE 1
        END,
        highest_streak = GREATEST(
            public.leaderboard_stats.highest_streak,
            CASE
                WHEN public.leaderboard_stats.last_study_date = session_date 
                    THEN GREATEST(public.leaderboard_stats.current_streak, 1)
                WHEN public.leaderboard_stats.last_study_date = (session_date - INTERVAL '1 day')::DATE 
                    THEN public.leaderboard_stats.current_streak + 1
                ELSE 1
            END
        ),
        badges = GREATEST(
            public.leaderboard_stats.badges,
            COALESCE((SELECT p.badges FROM public.profiles p WHERE p.id = NEW.user_id), 0),
            FLOOR(
                (CASE
                    WHEN public.leaderboard_stats.last_study_date = session_date 
                        THEN GREATEST(public.leaderboard_stats.current_streak, 1)
                    WHEN public.leaderboard_stats.last_study_date = (session_date - INTERVAL '1 day')::DATE 
                        THEN public.leaderboard_stats.current_streak + 1
                    ELSE 1
                END) / 10
            )
        ),
        total_sessions_count = public.leaderboard_stats.total_sessions_count + 1,
        last_study_date = GREATEST(COALESCE(public.leaderboard_stats.last_study_date, session_date), session_date),
        updated_at = NOW();

    -- Sincroniza streak_days no perfil
    UPDATE public.profiles
    SET streak_days = (SELECT current_streak FROM public.leaderboard_stats WHERE user_id = NEW.user_id),
        updated_at = NOW()
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_study_session_sync ON public.study_session_sync_events;
CREATE TRIGGER trg_on_study_session_sync
    AFTER INSERT ON public.study_session_sync_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_study_session_synced();

-- 6. FUNÇÃO RPC: ZERAR OFENSIVA À MEIA-NOITE NO BANCO DIRETAMENTE CASO NÃO TENHA ESTUDADO
CREATE OR REPLACE FUNCTION public.check_and_reset_streaks(p_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Zera minutos de períodos já encerrados (diário/semanal/mensal)
    UPDATE public.leaderboard_stats
    SET daily_minutes = 0, updated_at = NOW()
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND daily_minutes > 0
      AND (last_study_date IS NULL OR last_study_date < (v_today))
      ;
    UPDATE public.leaderboard_stats
    SET weekly_minutes = 0, updated_at = NOW()
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND weekly_minutes > 0
      AND (last_study_date IS NULL OR date_trunc('week', last_study_date) < date_trunc('week', v_today));
    UPDATE public.leaderboard_stats
    SET monthly_minutes = 0, updated_at = NOW()
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND monthly_minutes > 0
      AND (last_study_date IS NULL OR date_trunc('month', last_study_date) < date_trunc('month', v_today));

    -- Zera em leaderboard_stats para quem perdeu o dia de ontem
    UPDATE public.leaderboard_stats
    SET current_streak = 0,
        updated_at = NOW()
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND last_study_date IS NOT NULL
      AND last_study_date < (v_today - INTERVAL '1 day')::DATE
      AND current_streak > 0;

    -- Zera em profiles de forma sincronizada
    UPDATE public.profiles p
    SET streak_days = 0,
        updated_at = NOW()
    FROM public.leaderboard_stats s
    WHERE p.id = s.user_id
      AND (p_user_id IS NULL OR p.id = p_user_id)
      AND s.last_study_date IS NOT NULL
      AND s.last_study_date < (v_today - INTERVAL '1 day')::DATE
      AND p.streak_days > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. VIEW CANÔNICA DE LEADERBOARD COM RANKS DINÂMICOS E VERIFICAÇÃO DE OFENSIVA ATIVA
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
    s.user_id,
    p.display_name,
    p.avatar_pokemon_id,
    p.avatar_variant,
    p.avatar_bg,
    p.equipped_team,
    s.total_minutes_all_time,
    s.weekly_minutes,
    s.monthly_minutes,
    s.daily_minutes,
    CASE 
        WHEN s.last_study_date IS NOT NULL AND s.last_study_date < (CURRENT_DATE - INTERVAL '1 day')::DATE THEN 0
        ELSE s.current_streak
    END AS current_streak,
    s.highest_streak,
    COALESCE(p.badges, s.badges, FLOOR(s.current_streak / 10), 0) AS badges,
    s.total_sessions_count,
    s.last_study_date,
    s.updated_at,
    ROW_NUMBER() OVER (ORDER BY s.total_minutes_all_time DESC) AS rank_all_time,
    ROW_NUMBER() OVER (ORDER BY s.weekly_minutes DESC) AS rank_weekly,
    ROW_NUMBER() OVER (ORDER BY s.monthly_minutes DESC) AS rank_monthly,
    ROW_NUMBER() OVER (ORDER BY s.daily_minutes DESC) AS rank_daily
FROM public.leaderboard_stats s
JOIN public.profiles p ON p.id = s.user_id;
