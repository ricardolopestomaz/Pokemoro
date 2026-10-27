import { eq, and, sql } from 'drizzle-orm';
import { getDatabase } from '../client.js';
import { pokemonFriendships, userPokemon, focusDexEntries, users, inventories } from '../schema.js';
import { UserPokemonDTO, StudyRole } from '../../dtos/team.dto.js';
import { FocusDexEntryDTO, SleepStyle, PokemonVariant } from '../../dtos/index.js';
import crypto from 'crypto';

import { AVAILABLE_POKEMON_CATALOG } from '../../data/pokemon-catalog.js';

const POKEMON_METADATA_MAP = AVAILABLE_POKEMON_CATALOG;

export class PokemonRepository {
  private db = getDatabase();

  public getFriendshipPointsMap(userId: string): Record<number, number> {
    const records = this.db
      .select()
      .from(pokemonFriendships)
      .where(eq(pokemonFriendships.userId, userId))
      .all();

    const map: Record<number, number> = {};
    for (const r of records) {
      map[r.pokemonId] = r.currentPoints;
    }
    return map;
  }

  public getRecruitedPokemonIds(userId: string): Set<number> {
    const records = this.db
      .select({ pokemonId: userPokemon.pokemonId })
      .from(userPokemon)
      .where(eq(userPokemon.userId, userId))
      .all();
    return new Set(records.map((r) => r.pokemonId));
  }

  public getDiscoveredStylesMap(userId: string): Record<number, number[]> {
    const records = this.db
      .select()
      .from(focusDexEntries)
      .where(eq(focusDexEntries.userId, userId))
      .all();

    const map: Record<number, number[]> = {};
    for (const r of records) {
      if (!map[r.pokemonId]) map[r.pokemonId] = [];
      if (!map[r.pokemonId].includes(r.sleepStyle)) {
        map[r.pokemonId].push(r.sleepStyle);
      }
    }
    return map;
  }

  public feedPokemon(
    userId: string,
    pokemonId: number,
    pointsToAdd: number,
    maxPoints = 5
  ): { newPoints: number; isRecruited: boolean } {
    const existing = this.db
      .select()
      .from(pokemonFriendships)
      .where(and(eq(pokemonFriendships.userId, userId), eq(pokemonFriendships.pokemonId, pokemonId)))
      .get();

    const now = new Date().toISOString();
    let newPoints = pointsToAdd;

    if (existing) {
      newPoints = Math.min(maxPoints, existing.currentPoints + pointsToAdd);
      const isRecruited = newPoints >= maxPoints;

      this.db.update(pokemonFriendships)
        .set({
          currentPoints: newPoints,
          isRecruited,
          updatedAt: now,
        })
        .where(eq(pokemonFriendships.id, existing.id))
        .run();

      return { newPoints, isRecruited };
    } else {
      newPoints = Math.min(maxPoints, pointsToAdd);
      const isRecruited = newPoints >= maxPoints;

      this.db.insert(pokemonFriendships).values({
        id: crypto.randomUUID(),
        userId,
        pokemonId,
        currentPoints: newPoints,
        maxPoints,
        isRecruited,
        updatedAt: now,
      }).run();

      return { newPoints, isRecruited };
    }
  }

  public recruitPokemon(
    userId: string,
    pokemonId: number,
    nickname: string,
    variant: PokemonVariant = 'regular'
  ): UserPokemonDTO {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const meta = POKEMON_METADATA_MAP[pokemonId] || {
      name: `Pokemon #${pokemonId}`,
      role: 'ENERGY' as StudyRole,
      bonus: '+5% de foco durante o estudo',
    };

    this.db.insert(userPokemon).values({
      id,
      userId,
      pokemonId,
      nickname,
      variant,
      friendshipLevel: 1,
      isInActiveTeam: false,
      teamSlot: null,
      role: meta.role,
      passiveBonusDescription: meta.bonus,
      recruitedAt: now,
    }).run();

    return {
      id,
      pokemonId,
      nickname,
      variant,
      friendshipLevel: 1,
      discoveredStyles: [1],
      role: meta.role,
      passiveBonusDescription: meta.bonus,
      recruitedAt: now,
    };
  }

  public recordDexEntry(
    userId: string,
    pokemonId: number,
    sleepStyle: SleepStyle,
    isShiny: boolean,
    photoDataUrl?: string
  ): void {
    const existing = this.db
      .select()
      .from(focusDexEntries)
      .where(
        and(
          eq(focusDexEntries.userId, userId),
          eq(focusDexEntries.pokemonId, pokemonId),
          eq(focusDexEntries.sleepStyle, sleepStyle)
        )
      )
      .get();

    if (!existing) {
      this.db.insert(focusDexEntries).values({
        id: crypto.randomUUID(),
        userId,
        pokemonId,
        sleepStyle,
        isShiny,
        photoDataUrl: photoDataUrl || null,
        discoveredAt: new Date().toISOString(),
      }).run();

      // Concede recompensa de descoberta de nova pose (+25 Moedas e +1 Biscoito de Café)
      try {
        this.db.run(sql`UPDATE users SET focus_coins = focus_coins + 25 WHERE id = ${userId}`);
        this.db.run(sql`UPDATE inventories SET biscuits_basic = biscuits_basic + 1 WHERE user_id = ${userId}`);
      } catch {}
    } else if (photoDataUrl) {
      this.db.update(focusDexEntries)
        .set({ photoDataUrl })
        .where(eq(focusDexEntries.id, existing.id))
        .run();
    }
  }

  public getFocusDex(userId: string): {
    totalDiscovered: number;
    totalAvailable: number;
    completionPercentage: number;
    entries: any[];
  } {
    const recordedEntries = this.db
      .select()
      .from(focusDexEntries)
      .where(eq(focusDexEntries.userId, userId))
      .all();

    const recruitedIds = new Set(
      this.db
        .select({ pokemonId: userPokemon.pokemonId })
        .from(userPokemon)
        .where(eq(userPokemon.userId, userId))
        .all()
        .map((p) => p.pokemonId)
    );

    const entriesMap = new Map<number, typeof recordedEntries>();
    for (const entry of recordedEntries) {
      const list = entriesMap.get(entry.pokemonId) || [];
      list.push(entry);
      entriesMap.set(entry.pokemonId, list);
    }

    let totalDiscovered = 0;
    const catalogEntries = Object.entries(POKEMON_METADATA_MAP).map(([idStr, meta]) => {
      const pId = Number(idStr);
      const userStyles = entriesMap.get(pId) || [];

      const getStyleInfo = (styleNum: 1 | 2 | 3) => {
        const found = userStyles.find((s) => s.sleepStyle === styleNum);
        if (found) totalDiscovered++;
        return {
          style: styleNum as SleepStyle,
          isUnlocked: Boolean(found),
          unlockedAt: found ? found.discoveredAt : null,
          discoveredShiny: found ? found.isShiny : false,
          photoDataUrl: found ? (found.photoDataUrl || null) : null,
        };
      };

      const style1 = getStyleInfo(1);
      const style2 = getStyleInfo(2);
      const style3 = getStyleInfo(3);

      return {
        pokemonId: pId,
        pokemonName: meta.name,
        isSeen: userStyles.length > 0,
        isRecruited: recruitedIds.has(pId),
        styles: { style1, style2, style3 },
      };
    });

    const totalAvailable = catalogEntries.length * 3;
    const rawPercentage = totalAvailable > 0 ? (totalDiscovered / totalAvailable) * 100 : 0;
    const completionPercentage = totalDiscovered > 0
      ? Math.max(1, Math.round(rawPercentage))
      : 0;

    return {
      totalDiscovered,
      totalAvailable,
      completionPercentage,
      entries: catalogEntries,
    };
  }

  public listUserPokemon(userId: string): UserPokemonDTO[] {
    const pokemons = this.db
      .select()
      .from(userPokemon)
      .where(eq(userPokemon.userId, userId))
      .all();

    return pokemons.map((p) => ({
      id: p.id,
      pokemonId: p.pokemonId,
      nickname: p.nickname,
      variant: p.variant as PokemonVariant,
      friendshipLevel: p.friendshipLevel,
      discoveredStyles: [1],
      role: p.role as StudyRole,
      passiveBonusDescription: p.passiveBonusDescription || '',
      recruitedAt: p.recruitedAt,
      isInActiveTeam: p.isInActiveTeam,
      teamSlot: p.teamSlot,
    }));
  }

  public setActiveTeam(userId: string, pokemonIds: string[]): void {
    // Reseta equipe anterior
    this.db.update(userPokemon)
      .set({ isInActiveTeam: false, teamSlot: null })
      .where(eq(userPokemon.userId, userId))
      .run();

    // Atribui novos membros (até 5)
    for (let slot = 0; slot < Math.min(5, pokemonIds.length); slot++) {
      this.db.update(userPokemon)
        .set({ isInActiveTeam: true, teamSlot: slot })
        .where(and(eq(userPokemon.userId, userId), eq(userPokemon.id, pokemonIds[slot])))
        .run();
    }
  }

  public renamePokemon(userId: string, id: string, newNickname: string): void {
    const clean = newNickname.trim();
    if (!clean) throw new Error('Nome inválido');
    this.db.update(userPokemon)
      .set({ nickname: clean })
      .where(and(eq(userPokemon.userId, userId), eq(userPokemon.id, id)))
      .run();
  }
}
