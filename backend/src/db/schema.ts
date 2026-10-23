import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ==========================================
// 1. USUÁRIO & PERFIL
// ==========================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  streakDays: integer('streak_days').default(0).notNull(),
  lastStudyDate: text('last_study_date'), // YYYY-MM-DD
  focusCoins: integer('focus_coins').default(0).notNull(),
  activeEnvironment: text('active_environment').default('greengrass').notNull(),
  hasCompletedOnboarding: integer('has_completed_onboarding', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').notNull(),
});

// ==========================================
// 2. INVENTÁRIO DE BISCOITOS
// ==========================================
export const inventories = sqliteTable('inventories', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  biscuitsBasic: integer('biscuits_basic').default(3).notNull(),  // Café (+1)
  biscuitsGreat: integer('biscuits_great').default(0).notNull(),  // Especial (+3)
  biscuitsMaster: integer('biscuits_master').default(0).notNull(), // Dourado (Instantâneo)
});

// ==========================================
// 3. MATÉRIAS DE ESTUDO
// ==========================================
export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#4CAF50').notNull(),
  icon: text('icon').default('book').notNull(),
  totalMinutes: integer('total_minutes').default(0).notNull(),
  createdAt: text('created_at').notNull(),
});

// ==========================================
// 4. SESSÕES DE ESTUDO (POMODORO & FOCO)
// ==========================================
export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(), // 'CLASSIC_25' | 'EXTENDED_50' | 'FREE_STOPWATCH'
  targetDurationMinutes: integer('target_duration_minutes').notNull(),
  actualDurationMinutes: integer('actual_duration_minutes').notNull(),
  timeSpentOutOfAppSeconds: integer('time_spent_out_of_app_seconds').default(0).notNull(),
  isDeepFocus: integer('is_deep_focus', { mode: 'boolean' }).default(true).notNull(),
  deepFocusMultiplier: real('deep_focus_multiplier').default(1.2).notNull(),
  streakMultiplier: real('streak_multiplier').default(1.0).notNull(),
  focusPowerEarned: integer('focus_power_earned').default(0).notNull(),
  focusCoinsEarned: integer('focus_coins_earned').default(0).notNull(),
  interruptedEarly: integer('interrupted_early', { mode: 'boolean' }).default(false).notNull(),
  isCoffeeBreakUnlocked: integer('is_coffee_break_unlocked', { mode: 'boolean' }).default(true).notNull(),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at').notNull(),
});

// ==========================================
// 5. POKÉMON RECRUTADOS (COLEÇÃO & STUDY BUDDIES)
// ==========================================
export const userPokemon = sqliteTable('user_pokemon', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pokemonId: integer('pokemon_id').notNull(), // National Dex
  nickname: text('nickname').notNull(),
  variant: text('variant').default('regular').notNull(), // 'regular' | 'shiny' | 'events'
  friendshipLevel: integer('friendship_level').default(1).notNull(),
  isInActiveTeam: integer('is_in_active_team', { mode: 'boolean' }).default(false).notNull(),
  teamSlot: integer('team_slot'), // 0 a 4 se estiver na equipe
  role: text('role').default('ENERGY').notNull(),
  passiveBonusDescription: text('passive_bonus_description'),
  recruitedAt: text('recruited_at').notNull(),
});

// ==========================================
// 6. PROGRESSO DE AMIZADE PERSISTIDO POR ESPÉCIE
// ==========================================
export const pokemonFriendships = sqliteTable('pokemon_friendships', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pokemonId: integer('pokemon_id').notNull(),
  currentPoints: integer('current_points').default(0).notNull(),
  maxPoints: integer('max_points').default(5).notNull(),
  isRecruited: integer('is_recruited', { mode: 'boolean' }).default(false).notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ==========================================
// 7. FOCUS DEX (REGISTRO DE POSES DE SONO DESCOBERTAS)
// ==========================================
export const focusDexEntries = sqliteTable('focus_dex_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  pokemonId: integer('pokemon_id').notNull(),
  sleepStyle: integer('sleep_style').notNull(), // 1, 2 ou 3
  isShiny: integer('is_shiny', { mode: 'boolean' }).default(false).notNull(),
  photoDataUrl: text('photo_data_url'),
  discoveredAt: text('discovered_at').notNull(),
});

