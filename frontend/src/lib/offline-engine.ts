import type {
  BiscuitType,
  CoffeeBreak,
  DexEntry,
  EndSessionPayload,
  FeedResponse,
  FocusDex,
  PomodoroMode,
  SessionSummary,
  SleepStyle,
  SpawnedPokemon,
  StartSessionResponse,
  Subject,
  TeamResponse,
  UserPokemon,
  UserProfile,
} from '../types';
import { AVAILABLE_POKEMON_CATALOG, DEFAULT_AVAILABLE_ROSTER } from '../data/pokemon-catalog';
import { getEvolutionOption, type EvolutionNode } from '../data/evolution-tree';
import { rollPokemonSpawns } from './spawn-engine';
import { formatLocalDate, evaluateStreakOnSession, isStreakBroken } from './date-utils';
import { syncQueue } from './sync-queue';

// Chaves locais do armazenamento
const KEY_PROFILE = 'pokemoro_profile';
const KEY_SUBJECTS = 'pokemoro_subjects';
const KEY_COLLECTION = 'pokemoro_collection';
const KEY_ACTIVE_TEAM = 'pokemoro_active_team';
const KEY_FRIENDSHIPS = 'pokemoro_friendships';
const KEY_DEX_ENTRIES = 'pokemoro_dex_entries';
const KEY_ACTIVE_BREAK = 'pokemoro_active_break';
const KEY_SESSIONS = 'pokemoro_sessions';

const CANVAS_SLOTS = [
  { x: 0.50, y: 0.28 }, // Gramado Norte (acima do tapete)
  { x: 0.18, y: 0.34 }, // Gramado Noroeste
  { x: 0.82, y: 0.34 }, // Gramado Nordeste
  { x: 0.16, y: 0.72 }, // Gramado Sudoeste
  { x: 0.84, y: 0.72 }, // Gramado Sudeste
  { x: 0.50, y: 0.76 }, // Gramado Sul (abaixo do tapete)
];

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

export class OfflineGameEngine {
  // 1. Usuário & Perfil
  public getProfile(skipStreakReset = false): UserProfile {
    let profile = loadJson<UserProfile | null>(KEY_PROFILE, null);
    if (!profile) {
      // Estado inicial zerado: na primeira vez que abre, vai direto para o tutorial
      profile = {
        id: 'local-student-01',
        name: '',
        email: '',
        streakDays: 0,
        lastStudyDate: null,
        focusCoins: 0,
        inventory: { basic: 0, great: 0, master: 0 },
        activeEnvironment: 'greengrass',
        activeTeamPokemonIds: [],
        createdAt: new Date().toISOString(),
        hasCompletedOnboarding: false,
      };
      saveJson(KEY_PROFILE, profile);
    } else if (!skipStreakReset && profile.streakDays > 0 && isStreakBroken(profile.lastStudyDate) && !this.hasActiveSessionInStorage()) {
      // Regra Duolingo: se o dia de ontem passou sem estudo, o foguinho zera no banco e no perfil
      // (não zera enquanto há uma sessão em andamento: ela será creditada ao dia em que iniciou)
      profile.streakDays = 0;
      saveJson(KEY_PROFILE, profile);
      void syncQueue.zeroStreakInSupabase(profile.id);
    }
    return profile;
  }

  private hasActiveSessionInStorage(): boolean {
    try {
      return Boolean(localStorage.getItem('pokemoro_active_session'));
    } catch {
      return false;
    }
  }

  public updateProfileFromCloud(cloudData: {
    streakDays?: number;
    lastStudyDate?: string | null;
    displayName?: string;
  }): UserProfile {
    const profile = this.getProfile(true);
    let changed = false;

    // A nuvem só vence se estiver tão atualizada quanto o local. Caso contrário (sessão recém-concluída
    // ainda não sincronizada), sobrescrever apagaria o foguinho conquistado agora.
    const cloudDate = cloudData.lastStudyDate ?? null;
    const localDate = profile.lastStudyDate ?? null;
    const cloudIsNewer = !!cloudDate && (!localDate || cloudDate > localDate);
    const sameDay = !!cloudDate && cloudDate === localDate;

    // Se a nuvem trouxe streakDays definido, reflete o valor diretamente do banco
    if (cloudData.streakDays !== undefined && cloudData.streakDays !== null) {
      if (profile.streakDays !== cloudData.streakDays) {
        profile.streakDays = cloudData.streakDays;
        changed = true;
      }
    }

    if (cloudIsNewer) {
      profile.lastStudyDate = cloudDate;
      changed = true;
    } else if (sameDay && cloudDate && profile.lastStudyDate !== cloudDate) {
      profile.lastStudyDate = cloudDate;
      changed = true;
    }

    if (cloudData.displayName && cloudData.displayName !== profile.name && cloudData.displayName !== 'Estudante') {
      profile.name = cloudData.displayName;
      changed = true;
    }

    if (changed) {
      saveJson(KEY_PROFILE, profile);
    }
    return profile;
  }

  public completeOnboarding(name: string): UserProfile {
    const profile = this.getProfile();
    const cleanName = name?.trim() || 'Estudante';
    const now = new Date().toISOString();

    profile.name = cleanName;
    profile.hasCompletedOnboarding = true;
    profile.inventory = { basic: 3, great: 1, master: 0 };
    saveJson(KEY_PROFILE, profile);

    // Concede Caterpie (#0010) como primeiro parceiro e líder
    const caterpieId = 'caterpie-starter-01';
    const caterpieMeta = AVAILABLE_POKEMON_CATALOG[10] || {
      id: 10,
      name: 'Caterpie',
      role: 'ITEMS',
      bonus: '+20% de Moedas de Foco e biscoitos adicionais nas pausas',
    };

    const collection = this.getCollection();
    let caterpieItem = collection.find((p) => p.pokemonId === 10);
    if (!caterpieItem) {
      caterpieItem = {
        id: caterpieId,
        pokemonId: 10,
        nickname: 'Caterpie',
        variant: 'regular',
        friendshipLevel: 1,
        discoveredStyles: [1],
        role: caterpieMeta.role,
        passiveBonusDescription: caterpieMeta.bonus,
        recruitedAt: now,
        isInActiveTeam: true,
        teamSlot: 1,
      };
      collection.unshift(caterpieItem);
      saveJson(KEY_COLLECTION, collection);

      // Amizade no máximo
      const friendships = loadJson<Record<number, number>>(KEY_FRIENDSHIPS, {});
      friendships[10] = 5;
      saveJson(KEY_FRIENDSHIPS, friendships);

      // Registra Estilo 1 na Focus Dex
      this.saveDexPhoto(10, 1, '', false);
    }

    // SEMPRE garante que haja equipe ativa com pelo menos o Caterpie (ou o líder)
    const activeIds = loadJson<string[]>(KEY_ACTIVE_TEAM, []);
    if (activeIds.length === 0) {
      saveJson(KEY_ACTIVE_TEAM, [caterpieItem.id]);
    }

    return profile;
  }

  public setEnvironment(environment: string): UserProfile {
    const profile = this.getProfile();
    profile.activeEnvironment = environment;
    saveJson(KEY_PROFILE, profile);
    return profile;
  }

  public buyBiscuits(biscuitType: BiscuitType, quantity = 1): UserProfile {
    const profile = this.getProfile();
    const costMap: Record<BiscuitType, number> = {
      BASIC: 50,
      GREAT: 120,
      MASTER: 300,
    };
    const total = costMap[biscuitType] * quantity;
    if (profile.focusCoins < total) {
      throw new Error(`Moedas insuficientes. Custo: ${total}, Saldo: ${profile.focusCoins}`);
    }

    profile.focusCoins -= total;
    if (biscuitType === 'BASIC') profile.inventory.basic += quantity;
    else if (biscuitType === 'GREAT') profile.inventory.great += quantity;
    else if (biscuitType === 'MASTER') profile.inventory.master += quantity;

    saveJson(KEY_PROFILE, profile);
    return profile;
  }

  // 2. Matérias de Estudo (Subjects)
  public getSubjects(): Subject[] {
    const subjects = loadJson<Subject[]>(KEY_SUBJECTS, []);
    return subjects;
  }

  public createSubject(name: string, color = '#48D0B0', icon = 'book'): Subject {
    const subjects = this.getSubjects();
    const newSubject: Subject = {
      id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color,
      icon,
      totalMinutes: 0,
    };
    subjects.push(newSubject);
    saveJson(KEY_SUBJECTS, subjects);
    return newSubject;
  }

  public updateSubject(id: string, updates: { name?: string; color?: string; icon?: string }): Subject {
    const subjects = this.getSubjects();
    const idx = subjects.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Matéria não encontrada');
    subjects[idx] = { ...subjects[idx], ...updates };
    saveJson(KEY_SUBJECTS, subjects);
    return subjects[idx];
  }

  public deleteSubject(id: string): { success: boolean; deletedId: string } {
    const subjects = this.getSubjects();
    const filtered = subjects.filter((s) => s.id !== id);
    saveJson(KEY_SUBJECTS, filtered);
    return { success: true, deletedId: id };
  }

  private activeSession: {
    sessionId: string;
    subjectId: string;
    mode: PomodoroMode;
    targetDurationMinutes: number;
    startedAt: string;
  } | null = null;

  // 3. Sessões de Estudo & Foco
  public startSession(subjectId: string, mode: PomodoroMode, targetDurationMinutes: number): StartSessionResponse {
    const sessionId = `sess_${Date.now()}`;
    const startedAt = new Date().toISOString();
    this.activeSession = { sessionId, subjectId, mode, targetDurationMinutes, startedAt };
    return {
      sessionId,
      startedAt,
      targetDurationMinutes,
      deepFocusEligible: true,
    };
  }

  public endSession(payload: EndSessionPayload): SessionSummary {
    const profile = this.getProfile(true);
    const anyPayload = payload as any;
    const legacyMinutes = anyPayload.durationSeconds ? Math.floor(anyPayload.durationSeconds / 60) : 0;
    const rawMinutes = anyPayload.actualDurationMinutes !== undefined ? anyPayload.actualDurationMinutes : legacyMinutes;
    const minutes = Math.max(0, Number(rawMinutes) || 0);
    const interrupted = anyPayload.completedNormally !== undefined
      ? !anyPayload.completedNormally
      : Boolean(anyPayload.interruptedEarly);
    const outSeconds = anyPayload.timeSpentOutOfAppSeconds || 0;

    // Regra oficial: Só ganha moedas se completar o foco (sem interrupção) e com NO MÍNIMO 25 minutos!
    const qualifiesForRewards = !interrupted && minutes >= 25;

    // Cálculo do Deep Focus Multiplier
    const isDeepFocusEarned = outSeconds <= 60;
    const deepFocusMultiplier = isDeepFocusEarned ? 1.2 : 1.0;
    const teamBonusMultiplier = 1.0;
    const focusPowerEarned = qualifiesForRewards
      ? Math.round(minutes * 10 * deepFocusMultiplier * teamBonusMultiplier)
      : Math.round(minutes * 5);

    // Moedas de Foco: Estritamente 0 se for menos de 25 minutos ou se for interrompido
    const coinsEarned = qualifiesForRewards
      ? Math.round(minutes * 2 * deepFocusMultiplier)
      : 0;
    profile.focusCoins += coinsEarned;

    // Timestamps precisos da sessão para divisão de dias no diário
    const completedAt = payload.completedAt || new Date().toISOString();
    const startedAt = payload.startedAt
      || (this.activeSession?.sessionId === payload.sessionId ? this.activeSession.startedAt : null)
      || new Date(Date.now() - minutes * 60000).toISOString();

    // Data de início do estudo no calendário local (Regra Duolingo: salva o dia em que o estudo iniciou)
    const sessionStartDateStr = formatLocalDate(new Date(startedAt));

    // Cálculo de Streak usando a Regra Oficial do Duolingo
    let newStreak = profile.streakDays;
    let streakKept = false;

    if (qualifiesForRewards) {
      const evalResult = evaluateStreakOnSession(
        profile.streakDays,
        profile.lastStudyDate,
        sessionStartDateStr,
        true
      );
      newStreak = Math.max(1, evalResult.newStreak);
      streakKept = evalResult.streakKept;
      profile.streakDays = newStreak;
      profile.lastStudyDate = evalResult.newLastStudyDate;
    }
    saveJson(KEY_PROFILE, profile);

    // Atualiza minutos na matéria
    const subjects = this.getSubjects();
    if (subjects.length > 0) {
      const targetSubId = payload.subjectId || this.activeSession?.subjectId;
      const sub = (targetSubId ? subjects.find((s) => s.id === targetSubId) : null) || subjects[0];
      sub.totalMinutes = (sub.totalMinutes || 0) + minutes;
      saveJson(KEY_SUBJECTS, subjects);
    }

    // Evolução da Equipe Ativa: estudar juntos aumenta o nível de amizade (até o Nível 5)
    if (qualifiesForRewards) {
      const team = this.getTeam();
      const collection = this.getCollection();
      let collChanged = false;

      team.activeTeam.forEach((member) => {
        const item = collection.find((p) => p.id === member.id);
        if (item) {
          const currentStudy = ((item as unknown as { studyMinutes?: number }).studyMinutes || 0) + minutes;
          (item as unknown as { studyMinutes?: number }).studyMinutes = currentStudy;

          // A cada 25 minutos estudados juntos na equipe, sobe 1 Nível de Amizade (máximo 5)
          const newLevel = Math.min(5, 1 + Math.floor(currentStudy / 25));
          if (newLevel > item.friendshipLevel) {
            item.friendshipLevel = newLevel;
            collChanged = true;
          }
        }
      });

      if (collChanged) {
        saveJson(KEY_COLLECTION, collection);
      }
    }

    // Salva histórico recente com timestamps de início e término para o Diário
    const recent = loadJson<any[]>(KEY_SESSIONS, []);
    recent.unshift({
      id: payload.sessionId,
      subjectId: payload.subjectId || this.activeSession?.subjectId || 'default',
      actualDurationMinutes: minutes,
      startedAt,
      completedAt,
    });
    saveJson(KEY_SESSIONS, recent.slice(0, 50));

    // Determina se desbloqueia Coffee Break através da Spawn Engine:
    // No modo livre (FREE_STOPWATCH), exige >= 50m conforme tiers.
    // No modo guiado clássico (CLASSIC_25 / EXTENDED_50), conclusão sem interrupção de 25m garante 1 visitante no descanso!
    let isCoffeeBreakUnlocked = false;
    let spawnsCount = 0;

    if (qualifiesForRewards) {
      const mode = payload.mode || this.activeSession?.mode || 'CLASSIC_25';
      const isFreeMode = mode === 'FREE_STOPWATCH';
      const forcedCount = (!isFreeMode && minutes >= 25) ? 1 : undefined;
      const spawns = this.generateCoffeeBreak(payload.sessionId, focusPowerEarned, minutes, forcedCount);
      spawnsCount = spawns.length;
      isCoffeeBreakUnlocked = spawnsCount > 0;
    }

    return {
      sessionId: payload.sessionId,
      subjectId: 'default',
      minutesLogged: minutes,
      isDeepFocusEarned,
      deepFocusMultiplier,
      streakMultiplier: 1.0,
      focusPowerEarned,
      focusCoinsEarned: coinsEarned,
      newStreakDays: newStreak,
      streakKept,
      isCoffeeBreakUnlocked,
      spawnsCount,
    };
  }

  public getRecentSessions(limit = 10): any[] {
    const list = loadJson<any[]>(KEY_SESSIONS, []);
    return list.slice(0, limit);
  }

  /**
   * Checa se a virada de meia-noite quebrou a sequência e zera diretamente no banco de dados e localmente.
   */
  public checkAndResetMidnightStreak(): { reset: boolean; streakDays: number } {
    const profile = this.getProfile();
    if (profile.streakDays > 0 && isStreakBroken(profile.lastStudyDate) && !this.hasActiveSessionInStorage()) {
      profile.streakDays = 0;
      saveJson(KEY_PROFILE, profile);
      void syncQueue.zeroStreakInSupabase(profile.id);
      return { reset: true, streakDays: 0 };
    }
    return { reset: false, streakDays: profile.streakDays };
  }

  // 4. Coffee Break & Aparição de Pokémon
  private generateCoffeeBreak(sessionId: string, focusPower: number, minutes: number, forcedCount?: number): SpawnedPokemon[] {
    const profile = this.getProfile();
    const friendships = loadJson<Record<number, number>>(KEY_FRIENDSHIPS, {});
    const collection = this.getCollection();
    const recruitedSet = new Set(collection.map((p) => p.pokemonId));
    const dexRecords = loadJson<Record<number, { styles: number[]; photos: Record<number, string> }>>(KEY_DEX_ENTRIES, {});

    const spawns = rollPokemonSpawns(minutes, {
      existingFriendships: friendships,
      recruitedPokemonIds: recruitedSet,
      discoveredDexStyles: dexRecords,
      forcedSpawnCount: forcedCount,
    });

    if (spawns.length > 0) {
      const now = Date.now();
      const breakExpiresAt = now + 30 * 60 * 1000;
      spawns.forEach((s) => {
        s.spawnedAt = s.spawnedAt || now;
        s.expiresAt = s.expiresAt || breakExpiresAt;
      });
      const breakData: CoffeeBreak = {
        sessionId,
        focusPower,
        environment: profile.activeEnvironment,
        spawns,
        createdAt: now,
        expiresAt: breakExpiresAt,
      };
      saveJson(KEY_ACTIVE_BREAK, breakData);
    } else {
      saveJson(KEY_ACTIVE_BREAK, null);
    }

    return spawns;
  }

  public getActiveBreak(): CoffeeBreak | null {
    const breakData = loadJson<CoffeeBreak | null>(KEY_ACTIVE_BREAK, null);
    if (!breakData) return null;
    const now = Date.now();

    if (!breakData.spawns || breakData.spawns.length === 0) {
      saveJson(KEY_ACTIVE_BREAK, null);
      return null;
    }

    // Se o Coffee Break expirou completamente enquanto o app estava fechado:
    const breakExpiresAt = typeof breakData.expiresAt === 'number'
      ? breakData.expiresAt
      : typeof breakData.expiresAt === 'string' && breakData.expiresAt.length > 0 && !isNaN(new Date(breakData.expiresAt).getTime())
      ? new Date(breakData.expiresAt).getTime()
      : undefined;

    if (breakExpiresAt && breakExpiresAt <= now) {
      saveJson(KEY_ACTIVE_BREAK, null);
      return null;
    }

    let modified = false;

    // Garante que cada spawn possua spawnedAt e expiresAt persistentes
    const spawns = (breakData.spawns || []).map((s) => {
      let spawnedAt = s.spawnedAt;
      const rawExpiresAt = (s as any).expiresAt;
      let expiresAt: number | undefined = typeof rawExpiresAt === 'number'
        ? rawExpiresAt
        : typeof rawExpiresAt === 'string' && rawExpiresAt.length > 0 && !isNaN(new Date(rawExpiresAt).getTime())
        ? new Date(rawExpiresAt).getTime()
        : undefined;

      if (!spawnedAt || isNaN(spawnedAt)) {
        const match = s.spawnId?.match(/^sp_(\d+)_/);
        if (match) {
          spawnedAt = Number(match[1]);
        } else if (breakData.createdAt) {
          spawnedAt = breakData.createdAt;
        } else {
          spawnedAt = now;
        }
        s.spawnedAt = spawnedAt;
        modified = true;
      }

      if (!expiresAt || isNaN(expiresAt)) {
        expiresAt = breakExpiresAt || (spawnedAt + 30 * 60 * 1000);
        s.expiresAt = expiresAt;
        modified = true;
      }

      return s;
    });

    // Filtra estritamente apenas os visitantes cujo tempo de 30 minutos NÃO venceu
    // (com o app fechado, se passar de 30min ele desaparece automaticamente)
    const validSpawns = spawns.filter((s) => {
      if (!s.expiresAt || isNaN(s.expiresAt)) return false;
      return s.expiresAt > now;
    });

    // Garante que todo Pokémon visitante ativo reflita os corações de amizade já salvos
    const friendships = loadJson<Record<number, number>>(KEY_FRIENDSHIPS, {});
    validSpawns.forEach((s) => {
      const savedPts = friendships[s.pokemonId];
      if (savedPts !== undefined && savedPts > (s.currentFriendshipPoints ?? 0)) {
        s.currentFriendshipPoints = savedPts;
      }
    });

    if (validSpawns.length !== (breakData.spawns || []).length || modified) {
      if (validSpawns.length === 0) {
        saveJson(KEY_ACTIVE_BREAK, null);
        return null;
      }
      breakData.spawns = validSpawns;
      saveJson(KEY_ACTIVE_BREAK, breakData);
    }
    return breakData;
  }

  public feedPokemon(spawnId: string, biscuitType: BiscuitType): FeedResponse {
    const breakData = this.getActiveBreak();
    if (!breakData) throw new Error('Nenhum Coffee Break ativo no momento.');

    const target = breakData.spawns.find((s) => s.spawnId === spawnId);
    if (!target) throw new Error('Pokémon não encontrado.');
    if (target.isFull) throw new Error('Este Pokémon já está satisfeito!');

    const profile = this.getProfile();
    if (biscuitType === 'BASIC') {
      if (profile.inventory.basic <= 0) throw new Error('Sem Biscoitos de Café!');
      profile.inventory.basic -= 1;
    } else if (biscuitType === 'GREAT') {
      if (profile.inventory.great <= 0) throw new Error('Sem Biscoitos Especiais!');
      profile.inventory.great -= 1;
    } else if (biscuitType === 'MASTER') {
      if (profile.inventory.master <= 0) throw new Error('Sem Biscoitos Dourados!');
      profile.inventory.master -= 1;
    }
    saveJson(KEY_PROFILE, profile);

    let add = 1;
    if (biscuitType === 'GREAT') add = 3;
    else if (biscuitType === 'MASTER') add = target.maxFriendshipPoints;

    const wasHungry = target.isHungry;
    if (wasHungry) {
      add *= 3;
      target.isHungry = false;
    }

    const friendships = loadJson<Record<number, number>>(KEY_FRIENDSHIPS, {});
    // Preserva o total de corações acumulados em encontros anteriores
    const previousPts = Math.max(friendships[target.pokemonId] ?? 0, target.currentFriendshipPoints ?? 0);
    const cur = previousPts + add;
    const newPoints = Math.min(target.maxFriendshipPoints, cur);
    friendships[target.pokemonId] = newPoints;
    saveJson(KEY_FRIENDSHIPS, friendships);

    target.currentFriendshipPoints = newPoints;
    const isRecruited = newPoints >= target.maxFriendshipPoints;
    let recruitedPokemon: UserPokemon | null = null;

    if (isRecruited) {
      target.isAlreadyRecruited = true;
      const collection = this.getCollection();
      const existing = collection.find((p) => p.pokemonId === target.pokemonId);
      if (!existing) {
        const meta = AVAILABLE_POKEMON_CATALOG[target.pokemonId] || {
          id: target.pokemonId,
          name: target.pokemonName,
          role: 'STAMINA',
          bonus: '+10% de resistência',
        };
        recruitedPokemon = {
          id: `poke_${Date.now()}_${target.pokemonId}`,
          pokemonId: target.pokemonId,
          nickname: target.pokemonName,
          variant: target.variant,
          friendshipLevel: 1,
          discoveredStyles: [target.sleepStyle],
          role: meta.role,
          passiveBonusDescription: meta.bonus,
          recruitedAt: new Date().toISOString(),
        };
        collection.push(recruitedPokemon);
        saveJson(KEY_COLLECTION, collection);
      } else {
        // Se já está na coleção, reencontrá-lo e alimentá-lo sobe o nível de vínculo da espécie!
        if (existing.friendshipLevel < 5) {
          existing.friendshipLevel += 1;
        }
        if (!existing.discoveredStyles.includes(target.sleepStyle)) {
          existing.discoveredStyles.push(target.sleepStyle);
        }
        recruitedPokemon = existing;
        saveJson(KEY_COLLECTION, collection);
      }
    } else {
      if (Math.random() < 0.35) target.isFull = true;
    }

    saveJson(KEY_ACTIVE_BREAK, breakData);

    return {
      spawnId,
      pointsAdded: add,
      newFriendshipPoints: newPoints,
      maxFriendshipPoints: target.maxFriendshipPoints,
      wasHungry,
      isFull: target.isFull,
      isRecruited,
      recruitedPokemon,
      updatedInventory: profile.inventory,
    };
  }

  public removeSpawn(spawnId: string): void {
    const breakData = this.getActiveBreak();
    if (!breakData) return;
    const remaining = breakData.spawns.filter((s) => s.spawnId !== spawnId);
    if (remaining.length === 0) {
      saveJson(KEY_ACTIVE_BREAK, null);
    } else {
      breakData.spawns = remaining;
      saveJson(KEY_ACTIVE_BREAK, breakData);
    }
  }

  // 5. Equipe & Coleção
  public getCollection(): UserPokemon[] {
    return loadJson<UserPokemon[]>(KEY_COLLECTION, []);
  }

  public getTeam(): TeamResponse {
    const collection = this.getCollection();
    let activeIds = loadJson<string[]>(KEY_ACTIVE_TEAM, []);
    const byId = new Map(collection.map((p) => [p.id, p]));
    let activeTeam = activeIds.map((id) => byId.get(id)).filter((p): p is UserPokemon => p !== undefined && p !== null);

    // Auto-recuperação garantida: se a equipe ativa estiver vazia mas houver Pokémon na coleção,
    // define o primeiro Pokémon da coleção (ou Caterpie) como líder ativo
    if (activeTeam.length === 0 && collection.length > 0) {
      activeTeam = [collection[0]];
      saveJson(KEY_ACTIVE_TEAM, [collection[0].id]);
    }

    return {
      activeTeam,
      activePassives: activeTeam.map((p) => p.passiveBonusDescription).filter(Boolean),
    };
  }

  public setTeam(pokemonIds: string[]): TeamResponse {
    const limited = pokemonIds.slice(0, 5);
    saveJson(KEY_ACTIVE_TEAM, limited);
    return this.getTeam();
  }

  public renamePokemon(idOrPokemonId: string | number, newNickname: string): UserPokemon {
    const cleanName = newNickname.trim();
    if (!cleanName) throw new Error('O nome do Pokémon não pode ser vazio.');
    const collection = this.getCollection();
    const target = collection.find(
      (p) => p.id === String(idOrPokemonId) || p.pokemonId === Number(idOrPokemonId)
    );
    if (!target) throw new Error('Pokémon não encontrado na coleção.');
    target.nickname = cleanName;
    saveJson(KEY_COLLECTION, collection);
    return target;
  }

  public evolvePokemon(idOrPokemonId: string | number): { evolvedPokemon: UserPokemon; evolutionNode: EvolutionNode } {
    const collection = this.getCollection();
    const target = collection.find(
      (p) => p.id === String(idOrPokemonId) || p.pokemonId === Number(idOrPokemonId)
    );
    if (!target) throw new Error('Pokémon não encontrado na coleção.');
    const evo = getEvolutionOption(target.pokemonId);
    if (!evo) throw new Error('Este Pokémon já atingiu seu estágio final!');
    if (target.friendshipLevel < evo.requiredFriendshipLevel) {
      throw new Error(`Amizade insuficiente. Requer nível ${evo.requiredFriendshipLevel}.`);
    }

    const isOriginalName = !target.nickname || target.nickname === AVAILABLE_POKEMON_CATALOG[target.pokemonId]?.name;
    const meta = AVAILABLE_POKEMON_CATALOG[evo.evolvesToId] || {
      id: evo.evolvesToId,
      name: evo.evolvedName,
      role: target.role,
      bonus: target.passiveBonusDescription,
    };

    target.pokemonId = evo.evolvesToId;
    if (isOriginalName) {
      target.nickname = meta.name;
    }
    target.role = meta.role;
    target.passiveBonusDescription = meta.bonus;
    if (!target.discoveredStyles.includes(1)) {
      target.discoveredStyles.push(1);
    }

    // Salva na Focus Dex automaticamente
    this.saveDexPhoto(evo.evolvesToId, 1, '', target.variant === 'shiny');

    saveJson(KEY_COLLECTION, collection);
    return { evolvedPokemon: target, evolutionNode: evo };
  }

  // 6. Focus Dex
  public getDex(): FocusDex {
    const dexRecords = loadJson<Record<number, { styles: number[]; photos: Record<number, string>; shinyStyles?: number[]; hasShiny?: boolean }>>(
      KEY_DEX_ENTRIES,
      {}
    );
    const collection = this.getCollection();
    const recruitedSet = new Set(collection.map((p) => p.pokemonId));
    const shinyPokemonIds = new Set(collection.filter((p) => p.variant === 'shiny').map((p) => p.pokemonId));

    let totalDiscovered = 0;
    const entries: DexEntry[] = Object.values(AVAILABLE_POKEMON_CATALOG).map((meta) => {
      const rec = dexRecords[meta.id] || { styles: [], photos: {}, shinyStyles: [], hasShiny: false };
      const styles = rec.styles || [];
      const photos = rec.photos || {};
      const shinyStyles = rec.shinyStyles || [];

      const s1Unlocked = styles.includes(1);
      const s2Unlocked = styles.includes(2);
      const s3Unlocked = styles.includes(3);

      if (s1Unlocked) totalDiscovered++;
      if (s2Unlocked) totalDiscovered++;
      if (s3Unlocked) totalDiscovered++;

      const isShinyKnown = shinyPokemonIds.has(meta.id) || Boolean(rec.hasShiny) || shinyStyles.length > 0;

      return {
        pokemonId: meta.id,
        pokemonName: meta.name,
        isSeen: styles.length > 0 || recruitedSet.has(meta.id),
        isRecruited: recruitedSet.has(meta.id),
        hasShiny: isShinyKnown,
        styles: {
          style1: {
            style: 1,
            isUnlocked: s1Unlocked,
            unlockedAt: s1Unlocked ? 'Descoberta' : null,
            discoveredShiny: shinyStyles.includes(1) || isShinyKnown,
            photoDataUrl: photos[1] || null,
          },
          style2: {
            style: 2,
            isUnlocked: s2Unlocked,
            unlockedAt: s2Unlocked ? 'Descoberta' : null,
            discoveredShiny: shinyStyles.includes(2) || isShinyKnown,
            photoDataUrl: photos[2] || null,
          },
          style3: {
            style: 3,
            isUnlocked: s3Unlocked,
            unlockedAt: s3Unlocked ? 'Descoberta' : null,
            discoveredShiny: shinyStyles.includes(3) || isShinyKnown,
            photoDataUrl: photos[3] || null,
          },
        },
      };
    });

    const totalAvailable = entries.length * 3;
    const rawPct = totalAvailable > 0 ? (totalDiscovered / totalAvailable) * 100 : 0;
    const completionPercentage = totalDiscovered > 0 ? Math.max(1, Math.round(rawPct)) : 0;

    return {
      totalDiscovered,
      totalAvailable,
      completionPercentage,
      entries,
    };
  }

  public saveDexPhoto(
    pokemonId: number,
    sleepStyle: number,
    photoDataUrl: string,
    isShiny?: boolean
  ): { ok: boolean; rewarded?: boolean } {
    const dexRecords = loadJson<Record<number, { styles: number[]; photos: Record<number, string>; shinyStyles?: number[]; hasShiny?: boolean }>>(
      KEY_DEX_ENTRIES,
      {}
    );
    if (!dexRecords[pokemonId]) {
      dexRecords[pokemonId] = { styles: [], photos: {}, shinyStyles: [], hasShiny: false };
    }
    const isNewStyle = !dexRecords[pokemonId].styles.includes(sleepStyle);
    if (isNewStyle) {
      dexRecords[pokemonId].styles.push(sleepStyle);
    }
    if (photoDataUrl) {
      dexRecords[pokemonId].photos[sleepStyle] = photoDataUrl;
    }
    if (isShiny) {
      dexRecords[pokemonId].hasShiny = true;
      if (!dexRecords[pokemonId].shinyStyles) {
        dexRecords[pokemonId].shinyStyles = [];
      }
      if (!dexRecords[pokemonId].shinyStyles!.includes(sleepStyle)) {
        dexRecords[pokemonId].shinyStyles!.push(sleepStyle);
      }
    }
    saveJson(KEY_DEX_ENTRIES, dexRecords);

    // Concede recompensa de nova pose (+1 Biscoito de Café básico e +25 Moedas de Foco)
    if (isNewStyle) {
      const profile = this.getProfile();
      if (!profile.inventory) {
        profile.inventory = { basic: 0, great: 0, master: 0 };
      }
      profile.inventory.basic = (profile.inventory.basic || 0) + 1;
      profile.focusCoins = (profile.focusCoins || 0) + 25;
      saveJson(KEY_PROFILE, profile);
    }

    return { ok: true, rewarded: isNewStyle };
  }
}

export const offlineEngine = new OfflineGameEngine();
