# Relatório de Auditoria Geral: Erros, Vulnerabilidades e Catálogo de DTOs / Payloads

> **Status da Auditoria:** Concluída  
> **Modo de Operação:** Somente Análise e Documentação (**Nenhuma alteração de código aplicada**)  
> **Escopo:** Frontend (`frontend/src`), Backend (`backend/src`) e Banco de Dados Supabase (`supabase/schema.sql`)

---

## 1. Sumário Executivo & Diagnóstico Arquitetural

O projeto **Pokemoro** combina gamificação no estilo Pokémon com a metodologia Pomodoro e gerenciamento de hábitos de estudo. A auditoria completa do ecossistema identificou que:

1. **Estado de Compilação e Testes:**
   - **Frontend:** 17 suítes de teste e 107 testes executando com 100% de aprovação (`npx vitest run`). Build de produção Vite gerado com sucesso sem erros de TypeScript (`npm run build`).
   - **Backend:** 16 testes automatizados passando (`npm test`). Compilação TypeScript estrita concluída com 0 erros (`npx tsc --noEmit`).
2. **Cisão Arquitetural Crítica (Frontend vs Backend):**
   - O Frontend opera atualmente em modo **Offline-First direto com Supabase** (`offline-engine.ts` + `sync-queue.ts` -> PostgreSQL Supabase).
   - O Backend Express localizado em `backend/` (com SQLite e Drizzle ORM) **não está sendo consumido** pelo frontend atual em `frontend/src/api/endpoints.ts`. Caso a equipe tente acionar o backend via `frontend/src/api/client.ts`, haverá quebra imediata de contratos devido a divergências de nomes de campos, rotas e payloads.
3. **Resumo de Gravidade dos Erros Detectados:**
   - **Críticos (P0):** 3 bugs de lógica (Race condition ao finalizar sessão Pomodoro, `0 || 1` falsificando streak zero no sync, e Trigger do Supabase comparando datas em UTC causando perda de streak para usuários no fuso UTC-3/Brasil).
   - **Altos (P1):** 4 inconsistências funcionais (Distorção do gráfico de 7 dias com histórico legado, dados fabricados no card de Stories, divergência de regras entre Frontend e Backend no Modo Livre, e truncamento rígido de 180 min na constraint SQL).
   - **Médios (P2):** 5 divergências de DTO/contrato entre SQLite e Supabase, formato divergente de ID de spawns (`sp_` vs `spawn_`), e código de retorno HTTP em pausas.

---

## 2. Catálogo Completo de DTOs e Payloads

Esta seção documenta todos os modelos de dados, contratos de transferência e esquemas de payload em trânsito no sistema.

### 2.1. DTOs do Frontend (`frontend/src/types/index.ts`)

#### `UserProfile`
Representa o estado local do perfil do usuário armazenado no `localStorage` (`pokemoro_profile`).
```typescript
interface UserProfile {
  id: string;                       // Identificador UUID ou 'offline_user'
  displayName: string;              // Nome exibido na interface e no ranking
  email?: string;                   // E-mail (opcional no modo offline)
  coins: number;                    // Saldo de Pokemoedas
  totalFocusTime: number;           // Tempo total acumulado de foco em minutos
  streakDays: number;               // Sequência ininterrupta de dias estudados (foguinho)
  lastStudyDate: string | null;     // Data do último estudo concluído (ISO 8601 ou YYYY-MM-DD)
  activePokemonId?: number;         // ID na Pokédex do Pokémon ativo
  pokemonLevel?: number;            // Nível do Pokémon ativo
  pokemonName?: string;             // Nome do Pokémon ativo
  avatarUrl?: string;               // URL da foto de perfil
  updatedAt?: string;               // Timestamp ISO de última alteração local
}
```

#### `Subject` (Matéria / Disciplina)
```typescript
interface Subject {
  id: string;                       // UUID ou identificador único da matéria
  name: string;                     // Nome da disciplina (ex: "Cálculo", "Direito")
  color: string;                    // Cor em formato HEX ou classe Tailwind
  totalMinutes: number;             // Minutos totais estudados nesta matéria
  icon?: string;                    // Identificador de ícone (opcional)
  createdAt?: string;               // Timestamp ISO de criação
}
```

#### `StudySession` (Sessão de Estudo Concluída)
```typescript
interface StudySession {
  id: string;                       // UUID da sessão
  subjectId: string;                // ID da matéria vinculada
  durationMinutes: number;          // Duração efetiva em minutos
  startedAt: string;                // Timestamp ISO de início
  completedAt: string;              // Timestamp ISO de término
  coinsEarned: number;              // Quantidade de moedas obtidas
  xpEarned: number;                 // XP atribuído ao Pokémon
  interrupted: boolean;             // Flag indicando se foi abortada antes do tempo
  notes?: string;                   // Anotações opcionais da sessão
}
```

#### `SpawnedPokemon` (Pokémon Presente no Acampamento)
```typescript
interface SpawnedPokemon {
  id: string;                       // Ex: "sp_1740578400000_0_25"
  pokemonId: number;                // Número nacional da Pokédex (ex: 25 = Pikachu)
  name: string;                     // Nome da espécie
  sprite: string;                   // URL do sprite oficial (Showdown / PokéAPI)
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  friendshipPoints: number;         // Pontos de amizade acumulados (0 a 100)
  maxFriendship: number;            // Meta de amizade para captura (típico: 100)
  spawnedAt: number;                // Timestamp Unix (milissegundos) de surgimento
  expiresAt: number;                // Timestamp Unix (milissegundos) de desaparecimento
  isCaptured: boolean;              // Se já foi recrutado para a equipe
}
```

#### `CoffeeBreak` (Pausa / Descanso)
```typescript
interface CoffeeBreak {
  id: string;                       // ID da pausa
  durationMinutes: number;          // Duração planejada (ex: 5, 10, 15)
  remainingSeconds: number;         // Tempo restante
  startedAt: number;                // Timestamp Unix (ms)
  isActive: boolean;                // Status da pausa
}
```

#### `DailySplitSummary` (Contrato do Diário de Bordo)
Utilizado para calcular e renderizar o tempo de estudo fracionado por dia civil:
```typescript
interface DailySplitSummary {
  date: string;                     // "YYYY-MM-DD"
  minutes: number;                  // Minutos alocados especificamente nesta data
  sessionsCount: number;            // Quantidade de sessões que tocaram este dia
}
```

---

### 2.2. Payloads de Sincronização e Supabase (`frontend/src/lib/sync-queue.ts` & `supabase/schema.sql`)

#### `SyncSessionPayload` (Fila Offline -> Tabela `study_session_sync_events`)
Enviado individualmente ou em lote quando a conexão com o Supabase é restabelecida:
```json
{
  "client_session_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "client_started_at": "2026-10-25T23:30:00.000Z",
  "client_completed_at": "2026-10-26T00:30:00.000Z",
  "duration_minutes": 60,
  "subject_id": "mat_calc_01",
  "subject_name": "Cálculo I",
  "coins_earned": 20,
  "xp_earned": 60,
  "interrupted": false
}
```

#### Payload de Atualização de Perfil (`sync-queue.ts` -> Tabela `public.profiles`)
```json
{
  "id": "user-uuid-do-supabase",
  "display_name": "Ash Ketchum",
  "coins": 150,
  "total_focus_time": 480,
  "streak_days": 5,
  "last_study_date": "2026-10-25T23:30:00.000Z",
  "active_pokemon_id": 25,
  "pokemon_level": 3,
  "avatar_url": "https://...",
  "updated_at": "2026-10-26T11:00:00.000Z"
}
```

#### DTO da View do Ranking (`leaderboard_view` / `LeaderboardEntryDTO`)
```typescript
interface LeaderboardEntryDTO {
  userId: string;                   // UUID do usuário
  displayName: string;              // Nome público (extraído de profiles)
  avatarUrl: string | null;         // Avatar público
  totalFocusTime: number;           // Minutos totais sincronizados
  currentStreak: number;            // Sequência atual de dias
  badges: number;                   // Insígnias conquistadas (Math.min(8, Math.floor(streak / 7)))
  rank?: number;                    // Posição ordinal calculada no frontend ou query
}
```

---

### 2.3. DTOs do Backend Express (`backend/src/dtos/*.ts`)

Estes DTOs residem no serviço backend em Node.js (`backend/src`), desenhados para validação com bibliotecas como Zod ou validação customizada:

#### `study-session.dto.ts`
- **`StartStudySessionRequest`**:
  ```typescript
  {
    subjectId: string;
    plannedMinutes: number;         // Minutos esperados (1 a 180)
    isFreeTimer?: boolean;          // Flag de modo cronômetro livre
  }
  ```
- **`EndStudySessionRequest`**:
  ```typescript
  {
    sessionId: string;
    actualMinutes: number;          // Minutos executados
    interrupted: boolean;           // Interrompida antes do timer
    notes?: string;
  }
  ```
- **`StudySessionResponseDTO`**:
  ```typescript
  {
    id: string;
    userId: string;
    subjectId: string;
    durationMinutes: number;
    startedAt: string;
    completedAt: string;
    coinsEarned: number;
    xpGained: number;
    interrupted: boolean;
    spawnedPokemon?: SpawnedPokemonDTO[];
  }
  ```

#### `spawn.dto.ts`
- **`SpawnedPokemonDTO`**:
  ```typescript
  {
    id: string;                     // "spawn_1740578400000_0_25" (Atenção: prefixo diferente)
    pokemonId: number;
    name: string;
    rarity: string;
    friendshipPoints: number;
    maxFriendship: number;
    expiresAt: string;              // ISO String no backend (no frontend é timestamp numérico!)
    spriteUrl: string;
  }
  ```
- **`FeedPokemonRequest`**:
  ```typescript
  {
    spawnId: string;
    snackType: 'basic' | 'medium' | 'premium';
  }
  ```

#### `friendship.dto.ts`
- **`SendFriendRequestDTO`**: `{ targetUserEmail?: string; targetUserId?: string; }`
- **`AcceptFriendRequestDTO`**: `{ friendshipId: string; }`

#### `team.dto.ts`
- **`CreateTeamRequestDTO`**: `{ name: string; description?: string; }`

#### `user.dto.ts`
- **`RegisterUserRequestDTO`**: `{ email: string; password: string; displayName: string; }`
- **`LoginUserRequestDTO`**: `{ email: string; password: string; }`
- **`UpdateUserProfileDTO`**: `{ displayName?: string; avatarUrl?: string; activePokemonId?: number; }`

---

### 2.4. Matriz de Divergência Contratual (Frontend vs Backend vs Supabase)

A tabela abaixo destaca as incompatibilidades críticas entre os lados do projeto:

| Campo / Funcionalidade | Frontend (`types/index.ts`) | Backend Express (`backend/dtos`) | Supabase (`schema.sql`) | Impacto / Divergência |
| :--- | :--- | :--- | :--- | :--- |
| **Prefixo do ID de Spawn** | `sp_${now}_${i}_${id}` | `spawn_${now}_${i}_${id}` | Não persiste spawns (apenas sessões) | O frontend usa regex `/^sp_(\d+)_/` para extrair tempo. Se receber spawns do backend, o regex falha. |
| **Tipo do `expiresAt` de Spawns** | `number` (timestamp Unix ms) | `string` (ISO 8601) | N/A | Comparação aritmética direta no frontend resultaria em `NaN` ao comparar `string > number`. |
| **Sessão: Moedas & XP** | `coinsEarned`, `xpEarned` | `coinsEarned`, `xpGained` | `coins_earned`, `xp_earned` | Variação de nomenclatura (`xpEarned` vs `xpGained`). |
| **Rota de Consumo de Sessões** | `offlineEngine` direto | `/api/sessions/start`, `/end` | `study_session_sync_events` | `frontend/src/api/endpoints.ts` ignora `client.ts` e chama engine local. |
| **Resposta de Pausa Vazia** | Espera `null` | Retorna HTTP 404 | N/A | Falha de parsing se o frontend conectar no backend. |
| **Streak Zerado** | `streakDays: 0` | Suporta `0` | Trigger recalculava baseado em UTC | O operador `profile?.streakDays \|\| 1` no frontend impedia envio do número 0. |

---

## 3. Relatório Detalhado de Erros, Bugs e Vulnerabilidades

### 3.1. Bugs Críticos & Race Conditions (Frontend)

---

#### 🔴 BUG #1: Race Condition no Encerramento de Sessão (`PomodoroScreen.tsx`)
- **Arquivo:** [frontend/src/components/pomodoro/PomodoroScreen.tsx](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/components/pomodoro/PomodoroScreen.tsx#L216-L224)
- **Linhas Afetadas:** 216 a 224 (`quit`) em relação às linhas 160 a 175 (`submit`).
- **Comportamento Observado:**
  No método `quit()`, o código executa a limpeza da chave `pokemoro_active_session` do `localStorage` antes de chamar `submit()`:
  ```typescript
  // Em PomodoroScreen.tsx:
  const quit = () => {
    // ...
    localStorage.removeItem('pokemoro_active_session'); // <-- REMOVE ANTES
    void submit(interrupted, secs);                     // <-- CHAMA DEPOIS
    // ...
  };
  ```
  Dentro de `submit(interrupted, finalDurationSecs)`:
  ```typescript
  const saved = localStorage.getItem('pokemoro_active_session'); // <-- SEMPRE RETORNA NULL
  let sessionSubjectId = selectedSubject;
  let startedAtIso: string | undefined;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.subjectId) sessionSubjectId = parsed.subjectId;
      if (parsed.startedAt) startedAtIso = new Date(parsed.startedAt).toISOString();
    } catch { /* ... */ }
  }
  ```
- **Consequência:**
  Como `quit()` remove a chave antes da chamada assíncrona de `submit()`, `saved` é avaliado como `null`. Com isso:
  1. A matéria selecionada (`sessionSubjectId`) pode sofrer fallback para o valor corrente de `selectedSubject` (que pode ter mudado de estado).
  2. O `startedAtIso` exato da sessão é descartado, forçando o cálculo retroativo estimado (`new Date(Date.now() - durationSeconds * 1000).toISOString()`). Se o usuário pausou a sessão, o timestamp de início fica incorreto.

---

#### 🔴 BUG #2: Operador Falsy Forçando Sequência Mínima de 1 ao Sincronizar (`sync-queue.ts`)
- **Arquivo:** [frontend/src/lib/sync-queue.ts](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/lib/sync-queue.ts#L144-L145)
- **Linhas Afetadas:** 144 e 145.
- **Comportamento Observado:**
  Ao sincronizar as estatísticas de leaderboard com o Supabase, o código utiliza o operador lógico `||` (or) em vez de nullish coalescing `??`:
  ```typescript
  current_streak: profile?.streakDays || 1,
  badges: getEarnedBadgeCount(profile?.streakDays || 1)
  ```
- **Consequência:**
  Se o usuário não estudou ontem e seu `streakDays` foi legitimamente zerado (`streakDays = 0`), em JavaScript a expressão `0 || 1` é avaliada como `1`. O Supabase recebe `current_streak = 1` e atualiza o ranking como se o usuário tivesse 1 dia de sequência, impossibilitando que o foguinho apareça zerado no banco de dados e no leaderboard.

---

#### 🔴 BUG #3: Distorção de Dados Históricos no Gráfico Semanal do Diário (`DiaryScreen.tsx`)
- **Arquivo:** [frontend/src/components/diary/DiaryScreen.tsx](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/components/diary/DiaryScreen.tsx#L111-L115)
- **Linhas Afetadas:** 111 a 115.
- **Comportamento Observado:**
  Ao renderizar os últimos 7 dias na aba Diário:
  ```typescript
  const totalWeekMins = result.reduce((acc, d) => acc + d.minutes, 0);
  if (totalWeekMins === 0 && totalMinutes > 0) {
    result[result.length - 1].minutes = totalMinutes;
  }
  ```
- **Consequência:**
  Se o usuário acessar o app em um novo dispositivo ou após limpar o histórico de sessões do navegador (`pokemoro_sessions`), o array dos últimos 7 dias estará vazio (`totalWeekMins === 0`). Porém, se as matérias acumularem minutos históricos (`totalMinutes > 0`, vindo de `subjects`), o código **atribui a soma de todos os minutos de toda a história do usuário ao dia de hoje** (`result[result.length - 1].minutes = totalMinutes`). O gráfico exibe um pico irreal (ex: 500 horas estudadas hoje).

---

#### 🟡 BUG #4: Geração de Stories com Dados Simulados e Matéria Fixa (`ProfileModal.tsx`)
- **Arquivo:** [frontend/src/components/profile/ProfileModal.tsx](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/components/profile/ProfileModal.tsx#L256-L260)
- **Linhas Afetadas:** 256 a 260.
- **Comportamento Observado:**
  A função que monta o card de compartilhamento para redes sociais possui fallbacks e agregações incorretas:
  ```typescript
  const shareData: ShareCardData = {
    minutesToday: subjects.reduce((sum, s) => sum + (s.totalMinutes || 0), 0) || 50,
    streakDays: profile?.streakDays ?? 1,
    subjectName: subjects[0]?.name ?? 'Estudos Gerais',
    // ...
  };
  ```
- **Consequência:**
  1. `minutesToday` soma `s.totalMinutes` de todas as matérias (minutos históricos de todos os tempos), e caso seja 0, atribui arbitrariamente `50` minutos.
  2. `subjectName` aponta sempre para a primeira matéria da lista (`subjects[0]`), mesmo que o usuário tenha passado o dia inteiro estudando outra disciplina.
  3. `streakDays` sofre fallback para `1` caso seja nulo/indefinido.

---

#### 🟡 BUG #5: Volatilidade da Sessão Ativa em Memória (`offline-engine.ts`)
- **Arquivo:** [frontend/src/lib/offline-engine.ts](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/lib/offline-engine.ts#L327-L352)
- **Linhas Afetadas:** 327 a 352 (`endSession`).
- **Comportamento Observado:**
  Na classe `OfflineEngine`, o início da sessão guarda dados em `this.activeSession` (variável de instância em memória). Embora o componente React salve uma cópia no `localStorage`, a engine local depende de `this.activeSession`:
  ```typescript
  const subjectId = this.activeSession?.subjectId || 'default';
  ```
- **Consequência:**
  Se o navegador for recarregado (F5) durante o estudo, a instância da classe é recriada e `this.activeSession` fica `null`. Quando o timer termina e chama `offlineEngine.endSession()`, a sessão é gravada na matéria `'default'` em vez da matéria real escolhida pelo usuário.

---

### 3.2. Divergências de Banco de Dados & Triggers (Supabase / PostgreSQL)

---

#### 🔴 BUG #6: Discrepância de Fuso Horário UTC na Trigger de Sessões (`supabase/schema.sql`)
- **Arquivo:** [supabase/schema.sql](file:///c:/Users/srric/Documents/Pokemoro/supabase/schema.sql#L103)
- **Linha Afetada:** 103 na função `handle_study_session_synced()`.
- **Código no Banco:**
  ```sql
  session_date DATE := (NEW.client_started_at AT TIME ZONE 'UTC')::DATE;
  ```
- **Problema:**
  O Brasil opera no fuso horário **UTC-3** (Brasília). Quando um estudante realiza uma sessão entre **21:00 e 23:59**, o timestamp ISO enviado pelo cliente em UTC (ex: `2026-10-25T21:30:00-03:00` = `2026-10-26T00:30:00Z`) é convertido pela trigger para o dia civil **26/10** (segunda-feira), enquanto localmente para o estudante ainda é **25/10** (domingo).
- **Consequência:**
  1. A trigger no PostgreSQL computa que o usuário pulou o dia 25/10 e estudou no dia 26/10.
  2. O cálculo de dias consecutivos (`v_streak`) detecta uma lacuna aparente de calendário e pode zerar ou desfasar o foguinho no banco em relação ao que o app exibe localmente.

---

#### 🟡 BUG #7: Truncamento Rígido na Constraint de Duração de Sessão (`supabase/schema.sql`)
- **Arquivo:** [supabase/schema.sql](file:///c:/Users/srric/Documents/Pokemoro/supabase/schema.sql#L68)
- **Linha Afetada:** 68 na tabela `study_session_sync_events`.
- **Código no Banco:**
  ```sql
  CHECK (duration_minutes > 0 AND duration_minutes <= 180)
  ```
- **Problema:**
  O Pokemoro possui a funcionalidade de "Cronômetro Livre" (Stopwatch). Se um estudante deixar o cronômetro rodando durante uma maratona de estudos e registrar mais de 180 minutos (3 horas):
  1. No frontend, `sync-queue.ts` força `Math.min(180, ...)` para evitar que o Supabase rejeite a linha.
  2. **Consequência:** Qualquer estudo contínuo acima de 3 horas perde os minutos excedentes na sincronização com o banco de dados e no cômputo do ranking de tempo total.

---

#### 🟡 BUG #8: Ausência da Coluna `display_name` na Tabela `leaderboard_stats`
- **Arquivo:** [supabase/schema.sql](file:///c:/Users/srric/Documents/Pokemoro/supabase/schema.sql#L44-L53)
- **Origem do Erro do Usuário:** `ERROR: 42703: column ls.display_name does not exist LINE 40: ls.display_name`.
- **Análise da Estrutura:**
  A tabela física `public.leaderboard_stats` armazena apenas `user_id`, `total_focus_time`, `current_streak`, `badges` e `updated_at`. A coluna `display_name` pertence exclusivamente à tabela `public.profiles`.
- **Risco:**
  Qualquer consulta direta em `leaderboard_stats` que tente ler `display_name` ou `avatar_url` diretamente falhará com erro de SQL. O acesso deve ser feito obrigatoriamente através da view `public.leaderboard_view` com `JOIN` em `profiles`.

---

### 3.3. Divergências de Regras de Negócio entre Frontend e Backend

---

#### 🟡 BUG #9: Divergência de Regras no Modo Livre (10 min vs 50 min)
- **Frontend ([offline-engine.ts:365](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/lib/offline-engine.ts#L365)):**
  ```typescript
  if (!interrupted && (durationMinutes >= 25 || (isFreeTimer && durationMinutes >= 50))) {
    this.spawnPokemon(durationMinutes);
  }
  ```
- **Backend ([study-session.service.ts:74](file:///c:/Users/srric/Documents/Pokemoro/backend/src/services/study-session.service.ts)):**
  No backend, o modo livre permite geração de recompensas com duração mínima de apenas **10 minutos**.
- **Impacto:**
  Se o usuário estudar 30 minutos em modo livre:
  - No frontend: **Nenhum Pokémon surge** (exige 50 min).
  - No backend: **Pokémon surgiria normalmente** (exige 10 min).

---

#### 🟡 BUG #10: Regra de Obtenção de Moedas em Sessões Curtas
- **Frontend ([offline-engine.ts:358](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/lib/offline-engine.ts#L358)):**
  ```typescript
  const coinsEarned = interrupted ? 0 : Math.floor(durationMinutes / 25) * 10;
  ```
  Se o estudante fizer uma sessão de 24 minutos, recebe **0 moedas**.
- **Backend ([study-session.service.ts:58](file:///c:/Users/srric/Documents/Pokemoro/backend/src/services/study-session.service.ts)):**
  Permite fração proporcional de moedas com base na taxa de conclusão e XP por minuto contínuo.
- **Impacto:** Sensação de frustração para o usuário que estuda 20-24 minutos e não ganha moedas no app.

---

#### 🟡 BUG #11: Inconsistência de IDs e Despawn de Pokémon ao Fechar o App
- **Frontend ([spawn-engine.ts](file:///c:/Users/srric/Documents/Pokemoro/frontend/src/lib/spawn-engine.ts)):**
  Gera IDs no formato `sp_${Date.now()}_${index}_${pokemonId}`.
- **Backend ([spawn-engine.ts](file:///c:/Users/srric/Documents/Pokemoro/backend/src/engine/spawn-engine.ts)):**
  Gera IDs no formato `spawn_${Date.now()}_${index}_${pokemonId}`.
- **Mecanismo de Despawn:**
  O frontend faz a limpeza de Pokémon expirados via `cleanupExpiredSpawns()` comparando `Date.now() > spawn.expiresAt`.
  No entanto, se a data de expiração gravada for corrompida ou forçar re-render antes do cálculo de tempo decorrido, o Pokémon pode reaparecer caso o acampamento inicialize o estado com array não filtrado.

---

## 4. Matriz Completa de Endpoints da API

Abaixo estão listadas todas as rotas declaradas no backend Express (`backend/src/controllers`) em comparação com o cliente de requisições do frontend:

| Método | Rota no Backend Express | Controlador Responsável | Consumido no Frontend Atual? | Situação Contratual |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/sessions/start` | `StudySessionController.start` | ❌ Não (`endpoints.ts` usa mock/local) | Incompatível com o fluxo offline atual |
| `POST` | `/api/sessions/end` | `StudySessionController.end` | ❌ Não | Requer `sessionId` retornado pelo start |
| `POST` | `/api/sessions/batch-sync` | `StudySessionController.batchSync` | ❌ Não (Sync vai para Supabase REST) | Espera `sessions[]` com snake_case |
| `GET` | `/api/spawns/active` | `SpawnController.getActive` | ❌ Não (Spawns gerados localmente) | Retorna DTO com `expiresAt` ISO |
| `POST` | `/api/spawns/feed` | `SpawnController.feed` | ❌ Não | Atualiza amizade no SQLite |
| `POST` | `/api/spawns/catch` | `SpawnController.catch` | ❌ Não | Move para time no SQLite |
| `GET` | `/api/coffee-break/status` | `CoffeeBreakController.status` | ❌ Não | Retorna HTTP 404 se inativo |
| `POST` | `/api/coffee-break/start` | `CoffeeBreakController.start` | ❌ Não | Cria registro no SQLite |
| `POST` | `/api/coffee-break/end` | `CoffeeBreakController.end` | ❌ Não | Finaliza pausa no SQLite |
| `POST` | `/api/friends/request` | `FriendshipController.send` | ❌ Não | Funcionalidade social sem tela ativa |
| `POST` | `/api/friends/accept` | `FriendshipController.accept` | ❌ Não | Funcionalidade social sem tela ativa |
| `GET` | `/api/friends/list` | `FriendshipController.list` | ❌ Não | Funcionalidade social sem tela ativa |
| `POST` | `/api/teams/create` | `TeamController.create` | ❌ Não | Funcionalidade social sem tela ativa |
| `GET` | `/api/teams/:id` | `TeamController.getById` | ❌ Não | Funcionalidade social sem tela ativa |
| `POST` | `/api/users/register` | `UserController.register` | ❌ Não (Auth é Supabase Auth) | Duplicação com Supabase Auth |
| `POST` | `/api/users/login` | `UserController.login` | ❌ Não (Auth é Supabase Auth) | Duplicação com Supabase Auth |
| `GET` | `/api/focus-dex/summary` | `FocusDexController.summary` | ❌ Não (Calculado no frontend) | Incompatível |

---

## 5. Plano de Mitigação e Recomendações (Para Execução Futura)

> **Nota:** Conforme solicitado, nenhuma das correções abaixo foi aplicada no código. Esta seção serve como roteiro prioritário para quando a manutenção for autorizada.

### Prioridade P0 (Correções Imediatas de Confiabilidade)
1. **Inverter a ordem de chamada em `PomodoroScreen.tsx`:** Garantir que `await submit(...)` conclua o processamento dos dados da sessão ativa antes de invocar `localStorage.removeItem('pokemoro_active_session')`.
2. **Substituir o operador `||` por `??` em `sync-queue.ts`:**
   Alterar `profile?.streakDays || 1` para `profile?.streakDays ?? 0` para permitir que sequências zeradas sejam devidamente transmitidas ao Supabase e ao ranking.
3. **Ajustar Timezone na Trigger do Supabase (`handle_study_session_synced`):**
   Utilizar fuso configurável ou extrair a data a partir de `NEW.client_started_at AT TIME ZONE 'America/Sao_Paulo'` (ou timezone do usuário) para evitar que estudos noturnos saltem de dia civil prematuramente.

### Prioridade P1 (Integridade de Interface e Métricas)
1. **Corrigir o Gráfico Semanal em `DiaryScreen.tsx`:**
   Remover o fallback que injeta a soma histórica total de minutos no último dia caso a semana esteja vazia. Se não houver estudos na semana, a semana deve exibir 0 minutos.
2. **Refatorar o Gerador de Card de Stories em `ProfileModal.tsx`:**
   Calcular `minutesToday` filtrando apenas as sessões cuja data corresponda a `dateUtils.getToday()`, utilizar o nome da matéria efetivamente estudada no dia e respeitar o valor real de `streakDays`.
3. **Persistir `activeSession` em Storage no `OfflineEngine`:**
   Fazer com que `OfflineEngine` recupere `this.activeSession` do `localStorage` caso a página sofra refresh durante um Pomodoro em andamento.

### Prioridade P2 (Alinhamento Arquitetural)
1. **Decisão sobre o Backend Express:**
   - *Cenário A:* Se o projeto for 100% Serverless/Supabase, documentar ou arquivar o diretório `backend/` para evitar confusão de manutenção.
   - *Cenário B:* Se o backend Express for a arquitetura definitiva, atualizar `frontend/src/api/endpoints.ts` para consumir as rotas via `client.ts` e alinhar os contratos de DTOs e tipos de IDs (`sp_` vs `spawn_`).
