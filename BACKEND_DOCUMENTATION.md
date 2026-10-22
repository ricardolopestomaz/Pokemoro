# Pokémoro Backend: Documentação de Arquitetura & Funcionamento

> **Tecnologias:** Node.js 24, TypeScript, Express 5, SQLite (`better-sqlite3`), Drizzle ORM  
> **Filosofia Central:** 100% *Offline-First*, zero latência, gamificação positiva e conformidade estrita com o [POKEMORO_CONCEPT.md](POKEMORO_CONCEPT.md).

---

## 1. Visão Geral da Arquitetura

O backend do **Pokémoro** foi projetado para operar de forma totalmente local ou embarcada, garantindo que o estudante possa estudar e colecionar Pokémon mesmo em **Modo Avião** ou em locais sem conexão de internet.

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend (Web / Mobile)                     │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP / JSON                   │ Assets & Sprites
┌──────────────▼───────────────────────────────┴──────────────┐
│                  Pokémoro REST API (Express)                │
│  /api/user  |  /api/study  |  /api/coffee-break  |  /api/team│
├─────────────────────────────────────────────────────────────┤
│                    Camada de Serviços                       │
│  UserService  |  StudyService  |  CoffeeBreakService | Team │
├─────────────────────────────────────────────────────────────┤
│               Spawn Engine & Game Mathematics               │
│  Cálculo de Focus Power, Taxa de Shiny, Hungry (15%) & Poses│
├─────────────────────────────────────────────────────────────┤
│                 Repositórios & Drizzle ORM                  │
├─────────────────────────────────────────────────────────────┤
│             SQLite Database (WAL Mode + FKs)                │
│                 data/pokemoro.sqlite                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Conformidade com o Conceito do Jogo (`POKEMORO_CONCEPT.md`)

Todos os módulos do backend foram validados e testados contra o documento de design original:

| Mecânica do Conceito | Como foi Implementada no Backend | Teste Automatizado |
| :--- | :--- | :---: |
| **Timer Pomodoro (25m, 50m, livre)** | `StudySessionRepository.startSession` e `completeSession` registram tempos planejados e reais. | `db.test.ts` |
| **Anti-Cheat & Deep Focus (1.2x)** | Monitora `timeSpentOutOfAppSeconds`. Se $\le 60$ segundos, concede **1.2x Focus Power**. Se $> 60$s, rebaixa para 1.0x. | `mechanics.test.ts` |
| **Penalidade Gentil (Não Punitiva)** | Sessões interrompidas antes do fim salvam todos os minutos no histórico e matérias, mas bloqueiam o *Coffee Break*. | `api.test.ts` |
| **Spawn Engine Pós-Estudo** | Função pura `calculateSpawns` sorteia 2 a 5 criaturas conforme o *Focus Power* acumulado. | `spawn-engine.test.ts` |
| **Rolagem de Faminto (*Hungry*)** | 15% de chance fixa de tag Faminto, triplicando (+3x) os pontos no primeiro biscoito. | `mechanics.test.ts` |
| **Tipos de Biscoito** | Básico (+1), Great (+3) e Master (barra cheia instantânea). | `mechanics.test.ts` |
| **Amizade Persistida** | Tabela `pokemon_friendships` guarda pontos por espécie; a amizade **nunca zera** entre sessões. | `db.test.ts` |
| **Mecânica de Saciado (*Full*)** | 35% de chance do Pokémon ficar saciado após comer se não for recrutado. | `coffee-break.service.ts` |
| **Equipe de 5 Study Buddies** | Limite rígido de 5 membros na mesa com passivas vinculadas ao tipo (Energia, Itens, Exatas, etc.). | `mechanics.test.ts` |
| **Focus Dex (Álbum de Poses)** | Cataloga os 3 estilos de sono descobertos (`0010-1`, `0010-2`, `0010-3`) e variantes *Shiny*. | `mechanics.test.ts` |
| **Horas Estudadas por Matéria** | Cada Pomodoro concluído incrementa automaticamente `subjects.total_minutes`. | `api.test.ts` |

---

## 3. Modelo de Dados Relacional (SQLite + Drizzle)

O banco é criado automaticamente em `backend/data/pokemoro.sqlite` com modo de escrita WAL (*Write-Ahead Logging*) e integridade de chaves estrangeiras ativada.

### Tabelas do Sistema:

1. **`users`**:
   - `id` (PK Text), `name`, `email`, `streak_days`, `last_study_date`, `focus_coins`, `active_environment`, `created_at`.
2. **`inventories`**:
   - `user_id` (PK FK), `biscuits_basic`, `biscuits_great`, `biscuits_master`.
3. **`subjects`**:
   - `id` (PK Text), `user_id` (FK), `name`, `color`, `icon`, `total_minutes`, `created_at`.
4. **`study_sessions`**:
   - `id` (PK Text), `user_id` (FK), `subject_id` (FK), `mode`, `target_duration_minutes`, `actual_duration_minutes`, `time_spent_out_of_app_seconds`, `is_deep_focus`, `deep_focus_multiplier`, `streak_multiplier`, `focus_power_earned`, `focus_coins_earned`, `interrupted_early`, `is_coffee_break_unlocked`, `started_at`, `completed_at`.
5. **`user_pokemon` (Coleção e Equipe)**:
   - `id` (PK Text), `user_id` (FK), `pokemon_id`, `nickname`, `variant`, `friendship_level`, `is_in_active_team`, `team_slot`, `role`, `passive_bonus_description`, `recruited_at`.
6. **`pokemon_friendships` (Amizade Persistida)**:
   - `id` (PK Text), `user_id` (FK), `pokemon_id`, `current_points`, `max_points`, `is_recruited`, `updated_at`.
7. **`focus_dex_entries` (Álbum de Poses)**:
   - `id` (PK Text), `user_id` (FK), `pokemon_id`, `sleep_style`, `is_shiny`, `discovered_at`.

---

## 4. Spawn Engine: A Matemática do Sorteio

A Spawn Engine (`backend/src/engine/spawn-engine.ts`) é uma função pura e determinística quando necessário para testes:

$$\text{Focus Power} = \text{Minutos Estudados} \times 10 \times \text{Multiplicador de Streak} \times \text{Multiplicador Deep Focus}$$

### Faixas de Recompensa:
- **Até 250 FP (Sessão rápida / normal):** 2 Pokémon descansando (Pose Estilo 1).
- **251 a 600 FP (Sessão de 50m ou Streak ativo):** 3 a 4 Pokémon (Chance de Estilo 2).
- **601+ FP (Sessão longa ou Streak 7+ dias):** 5 Pokémon (Chance de Estilo 3 e Shiny).

### Coordenadas no Cenário Top-Down:
Cada Pokémon sorteado recebe uma posição normalizada `canvasPosition: { x, y }` projetada para renderizar proporcionalmente ao redor do tapete circular central dos cenários gerados em `assets/`.

---

## 5. Referência de Rotas da API REST

O servidor Express roda por padrão na porta `3001` com CORS habilitado.

### 5.1. Assets Estáticos
- `GET /assets/*` — Retorna os cenários PNG de alta definição gerados (`cenario_pokemon_sleep_9_16.png`, etc.).
- `GET /sprites/*` — Retorna os sprites oficiais das pastas `sprites/sleep/` e `sprites/menu/`.

### 5.2. Usuário & Perfil (`/api/user`)
- **`GET /api/user/profile`**: Retorna dados do estudante, ofensiva, cenário ativo e inventário de biscoitos.
- **`POST /api/user/environment`**: Altera o cenário ativo.
  - Body: `{ "environment": "beach" | "tundra" | "cave" | "study_room" | "greengrass" }`
- **`POST /api/user/biscuits/buy`**: Compra biscoitos usando moedas ganhas nos estudos.
  - Body: `{ "biscuitType": "BASIC" | "GREAT" | "MASTER", "quantity": 1 }`

### 5.3. Pomodoro & Matérias (`/api/study`)
- **`GET /api/study/subjects`**: Lista matérias cadastradas e minutos acumulados.
- **`POST /api/study/subjects`**: Cria nova matéria.
  - Body: `{ "name": "Matemática", "color": "#4CAF50", "icon": "calculator" }`
- **`POST /api/study/sessions/start`**: Inicia contagem de Pomodoro.
  - Body: `{ "subjectId": "...", "mode": "CLASSIC_25", "targetDurationMinutes": 25 }`
- **`POST /api/study/sessions/end`**: Conclui o ciclo, computa Deep Focus e desbloqueia os spawns.
  - Body: `{ "sessionId": "...", "actualDurationMinutes": 25, "interruptedEarly": false, "timeSpentOutOfAppSeconds": 20 }`
- **`GET /api/study/sessions/recent`**: Histórico recente de sessões.

### 5.4. Coffee Break & Alimentação (`/api/coffee-break`)
- **`GET /api/coffee-break/active`**: Retorna os Pokémon sorteados descansando no cenário após o estudo.
- **`POST /api/coffee-break/feed`**: Alimenta um Pokémon com biscoito.
  - Body: `{ "spawnId": "...", "biscuitType": "BASIC" | "GREAT" | "MASTER" }`
  - Resposta: `{ "pointsAdded": 3, "newFriendshipPoints": 3, "wasHungry": true, "isRecruited": false }`

### 5.5. Equipe & Focus Dex (`/api/team`)
- **`GET /api/team`**: Retorna a equipe de até 5 *Study Buddies* e a lista de bônus passivos ativos.
- **`POST /api/team`**: Atualiza a equipe selecionando criaturas da coleção.
  - Body: `{ "pokemonIds": ["id1", "id2", "id3", "id4", "id5"] }`
- **`GET /api/team/collection`**: Lista todas as criaturas recrutadas pelo usuário.
- **`GET /api/team/dex`**: Retorna o progresso completo da Pokédex de estudos (poses descobertas e porcentagem).

---

## 6. Como Executar e Testar

### Instalação de Dependências:
```bash
cd backend
npm install
```

### Rodar a Suíte Completa de Testes:
```bash
npm test
```
*Executa 8 testes unitários e de integração cobrindo spawn engine, banco de dados, regras de amizade e rotas HTTP.*

### Iniciar o Servidor:
```bash
npm start
```
*Servidor pronto em: `http://localhost:3001`*
