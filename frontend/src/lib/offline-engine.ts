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
  { x: 0.26, y: 0.36 }, // Noroeste (topo esquerda)
  { x: 0.74, y: 0.36 }, // Nordeste (topo direita)
  { x: 0.22, y: 0.68 }, // Sudoeste (base esquerda)
  { x: 0.78, y: 0.68 }, // Sudeste (base direita)
  { x: 0.50, y: 0.25 }, // Norte Central (topo centro)
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
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export class OfflineGameEngine {
  // 1. Usuário & Perfil
  public getProfile(): UserProfile {
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

  // 3. Sessões de Estudo & Foco
  public startSession(_subjectId: string, _mode: PomodoroMode, targetDurationMinutes: number): StartSessionResponse {
    const sessionId = `sess_${Date.now()}`;
    return {
      sessionId,
      startedAt: new Date().toISOString(),
      targetDurationMinutes,
      deepFocusEligible: true,
    };
  }

  public endSession(payload: EndSessionPayload): SessionSummary {
    const profile = this.getProfile();
    const minutes = Math.max(1, payload.actualDurationMinutes);
    const interrupted = Boolean(payload.interruptedEarly);
    const outSeconds = payload.timeSpentOutOfAppSeconds || 0;

    // Cálculo do Deep Focus Multiplier
    const isDeepFocusEarned = outSeconds <= 60;
    const deepFocusMultiplier = isDeepFocusEarned ? 1.2 : 1.0;
    const teamBonusMultiplier = 1.0;
    const focusPowerEarned = Math.round(minutes * 10 * deepFocusMultiplier * teamBonusMultiplier);

    // Moedas de Foco
    const coinsEarned = Math.round(minutes * 2 * deepFocusMultiplier);
    profile.focusCoins += coinsEarned;

    // Cálculo de Streak
    const today = new Date().toISOString().split('T')[0];
    let newStreak = profile.streakDays;
    let streakKept = false;

    if (!profile.lastStudyDate) {
      newStreak = 1;
      streakKept = true;
    } else {
      const last = new Date(profile.lastStudyDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        newStreak += 1;
        streakKept = true;
      } else if (diffDays === 0) {
        streakKept = true;
      } else {
        newStreak = 1;
      }
    }
    profile.streakDays = newStreak;
    profile.lastStudyDate = today;
    saveJson(KEY_PROFILE, profile);

    // Atualiza minutos na matéria
    const subjects = this.getSubjects();
    if (subjects.length > 0) {
      const sub = subjects[0];
      sub.totalMinutes = (sub.totalMinutes || 0) + minutes;
      saveJson(KEY_SUBJECTS, subjects);
    }

    // Evolução da Equipe Ativa: estudar juntos aumenta o nível de amizade (até o Nível 5)
    if (!interrupted && minutes > 0) {
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

    // Salva histórico recente
    const recent = loadJson<any[]>(KEY_SESSIONS, []);
    recent.unshift({
      id: payload.sessionId,
      actualDurationMinutes: minutes,
      completedAt: new Date().toISOString(),
    });
    saveJson(KEY_SESSIONS, recent.slice(0, 50));

    // Determina se desbloqueia Coffee Break
    const isCoffeeBreakUnlocked = !interrupted;
    let spawnsCount = 0;

    if (isCoffeeBreakUnlocked) {
      if (focusPowerEarned > 600) spawnsCount = 5;
      else if (focusPowerEarned > 250) spawnsCount = Math.floor(Math.random() * 2) + 3; // 3 ou 4
      else spawnsCount = 2;

      this.generateCoffeeBreak(payload.sessionId, focusPowerEarned, spawnsCount);
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

  // 4. Coffee Break & Aparição de Pokémon
  private generateCoffeeBreak(sessionId: string, focusPower: number, count: number): void {
    const profile = this.getProfile();
    const roster = DEFAULT_AVAILABLE_ROSTER;
    const friendships = loadJson<Record<number, number>>(KEY_FRIENDSHIPS, {});
    const collection = this.getCollection();
    const recruitedSet = new Set(collection.map((p) => p.pokemonId));
    const dexRecords = loadJson<Record<number, { styles: number[]; photos: Record<number, string> }>>(KEY_DEX_ENTRIES, {});

    const spawns: SpawnedPokemon[] = [];
    const pool = [...roster];

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const chosen = pool.splice(idx, 1)[0] || roster[0];

      const isFriend = recruitedSet.has(chosen.id) || (friendships[chosen.id] ?? 0) >= 5;
      const discovered = dexRecords[chosen.id]?.styles || [];
      const undiscovered = [1, 2, 3].filter((s) => !discovered.includes(s)) as SleepStyle[];

      let style: SleepStyle = 1;
      if (isFriend && undiscovered.length > 0) {
        if (focusPower > 600 && undiscovered.includes(3)) style = 3;
        else if (focusPower > 250 && undiscovered.includes(2)) style = 2;
        else style = undiscovered[Math.floor(Math.random() * undiscovered.length)];
      } else {
        if (focusPower > 600 && Math.random() < 0.25) style = 3;
        else if (focusPower > 250 && Math.random() < 0.40) style = 2;
      }

      const isShiny = Math.random() < Math.min(0.01, 0.0022 + profile.streakDays * 0.001);
      const isHungry = Math.random() < 0.15;
      const currentPts = friendships[chosen.id] ?? 0;
      const slot = CANVAS_SLOTS[i % CANVAS_SLOTS.length];

      spawns.push({
        spawnId: `sp_${Date.now()}_${i}_${chosen.id}`,
        pokemonId: chosen.id,
        pokemonName: chosen.name,
        variant: isShiny ? 'shiny' : 'regular',
        sleepStyle: style,
        currentFriendshipPoints: currentPts,
        maxFriendshipPoints: 5,
        isAlreadyRecruited: currentPts >= 5,
        isHungry,
        isFull: false,
        spriteSleepUrl: `/sprites/sleep/${isShiny ? 'shiny' : 'regular'}/${String(chosen.id).padStart(4, '0')}-${style}${isShiny ? '_s' : ''}.png`,
        spriteMenuUrl: `/sprites/menu/${isShiny ? 'shiny' : 'regular'}/${String(chosen.id).padStart(4, '0')}${isShiny ? '_s' : ''}.png`,
        canvasPosition: {
          x: slot.x + (Math.random() * 0.04 - 0.02),
          y: slot.y + (Math.random() * 0.04 - 0.02),
        },
      });
    }

    const breakData: CoffeeBreak = {
      sessionId,
      focusPower,
      environment: profile.activeEnvironment,
      spawns,
    };
    saveJson(KEY_ACTIVE_BREAK, breakData);
  }

  public getActiveBreak(): CoffeeBreak | null {
    return loadJson<CoffeeBreak | null>(KEY_ACTIVE_BREAK, null);
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
    const cur = (friendships[target.pokemonId] ?? 0) + add;
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

  // 6. Focus Dex
  public getDex(): FocusDex {
    const dexRecords = loadJson<Record<number, { styles: number[]; photos: Record<number, string> }>>(
      KEY_DEX_ENTRIES,
      {}
    );
    const collection = this.getCollection();
    const recruitedSet = new Set(collection.map((p) => p.pokemonId));

    let totalDiscovered = 0;
    const entries: DexEntry[] = Object.values(AVAILABLE_POKEMON_CATALOG).map((meta) => {
      const rec = dexRecords[meta.id] || { styles: [], photos: {} };
      const styles = rec.styles || [];
      const photos = rec.photos || {};

      const s1Unlocked = styles.includes(1);
      const s2Unlocked = styles.includes(2);
      const s3Unlocked = styles.includes(3);

      if (s1Unlocked) totalDiscovered++;
      if (s2Unlocked) totalDiscovered++;
      if (s3Unlocked) totalDiscovered++;

      return {
        pokemonId: meta.id,
        pokemonName: meta.name,
        isSeen: styles.length > 0 || recruitedSet.has(meta.id),
        isRecruited: recruitedSet.has(meta.id),
        styles: {
          style1: {
            style: 1,
            isUnlocked: s1Unlocked,
            unlockedAt: s1Unlocked ? 'Descoberta' : null,
            discoveredShiny: false,
            photoDataUrl: photos[1] || null,
          },
          style2: {
            style: 2,
            isUnlocked: s2Unlocked,
            unlockedAt: s2Unlocked ? 'Descoberta' : null,
            discoveredShiny: false,
            photoDataUrl: photos[2] || null,
          },
          style3: {
            style: 3,
            isUnlocked: s3Unlocked,
            unlockedAt: s3Unlocked ? 'Descoberta' : null,
            discoveredShiny: false,
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

  public saveDexPhoto(pokemonId: number, sleepStyle: number, photoDataUrl: string, _isShiny?: boolean): { ok: boolean } {
    const dexRecords = loadJson<Record<number, { styles: number[]; photos: Record<number, string> }>>(
      KEY_DEX_ENTRIES,
      {}
    );
    if (!dexRecords[pokemonId]) {
      dexRecords[pokemonId] = { styles: [], photos: {} };
    }
    if (!dexRecords[pokemonId].styles.includes(sleepStyle)) {
      dexRecords[pokemonId].styles.push(sleepStyle);
    }
    if (photoDataUrl) {
      dexRecords[pokemonId].photos[sleepStyle] = photoDataUrl;
    }
    saveJson(KEY_DEX_ENTRIES, dexRecords);
    return { ok: true };
  }
}

export const offlineEngine = new OfflineGameEngine();
