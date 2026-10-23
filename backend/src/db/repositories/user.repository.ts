import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../client.js';
import { users, inventories, userPokemon, pokemonFriendships, focusDexEntries } from '../schema.js';
import { UserProfileDTO, BiscuitInventoryDTO } from '../../dtos/user.dto.js';
import crypto from 'crypto';

export class UserRepository {
  private db = getDatabase();

  public createInitialUser(customId?: string, name = 'Estudante Pokémoro', email?: string): UserProfileDTO {
    const id = customId || crypto.randomUUID();
    const existing = this.getUserProfile(id);
    if (existing) return existing;

    const now = new Date().toISOString();

    this.db.insert(users).values({
      id,
      name,
      email: email || null,
      streakDays: 0,
      lastStudyDate: null,
      focusCoins: 0,
      activeEnvironment: 'greengrass',
      hasCompletedOnboarding: false,
      createdAt: now,
    }).run();

    this.db.insert(inventories).values({
      userId: id,
      biscuitsBasic: 0,
      biscuitsGreat: 0,
      biscuitsMaster: 0,
    }).run();

    return this.getUserProfile(id)!;
  }

  public completeOnboarding(userId: string, name: string): UserProfileDTO {
    const user = this.db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) throw new Error('Usuário não encontrado');

    const cleanName = name?.trim() || 'Estudante Pokémoro';
    const now = new Date().toISOString();

    // 1. Atualiza nome e marca onboarding concluído
    this.db
      .update(users)
      .set({
        name: cleanName,
        hasCompletedOnboarding: true,
      })
      .where(eq(users.id, userId))
      .run();

    // 2. Concede kit inicial de boas-vindas do Professor Ricardo (3 Biscoitos de Café + 1 Biscoito Especial)
    this.db
      .update(inventories)
      .set({
        biscuitsBasic: 3,
        biscuitsGreat: 1,
        biscuitsMaster: 0,
      })
      .where(eq(inventories.userId, userId))
      .run();

    // 3. Concede o Caterpie (#0010) como primeiro parceiro oficial e Líder da equipe
    const existingCaterpie = this.db
      .select()
      .from(userPokemon)
      .where(and(eq(userPokemon.userId, userId), eq(userPokemon.pokemonId, 10)))
      .get();

    if (!existingCaterpie) {
      this.db.insert(userPokemon).values({
        id: crypto.randomUUID(),
        userId,
        pokemonId: 10,
        nickname: 'Caterpie',
        variant: 'regular',
        friendshipLevel: 1,
        isInActiveTeam: true,
        teamSlot: 1,
        role: 'ITEMS',
        passiveBonusDescription: '+20% de Moedas de Foco e biscoitos adicionais nas pausas',
        recruitedAt: now,
      }).run();

      this.db.insert(pokemonFriendships).values({
        id: crypto.randomUUID(),
        userId,
        pokemonId: 10,
        currentPoints: 5,
        maxPoints: 5,
        isRecruited: true,
        updatedAt: now,
      }).run();
    } else {
      this.db
        .update(userPokemon)
        .set({ isInActiveTeam: true, teamSlot: 1 })
        .where(eq(userPokemon.id, existingCaterpie.id))
        .run();
    }

    // 4. Registra a pose inicial do Caterpie na Focus Dex (aparece colorido)
    const existingDex = this.db
      .select()
      .from(focusDexEntries)
      .where(and(eq(focusDexEntries.userId, userId), eq(focusDexEntries.pokemonId, 10), eq(focusDexEntries.sleepStyle, 1)))
      .get();
    if (!existingDex) {
      this.db.insert(focusDexEntries).values({
        id: crypto.randomUUID(),
        userId,
        pokemonId: 10,
        sleepStyle: 1,
        isShiny: false,
        photoDataUrl: null,
        discoveredAt: now,
      }).run();
    }

    return this.getUserProfile(userId)!;
  }

  public getUserProfile(userId: string): UserProfileDTO | null {
    const user = this.db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return null;

    const inventory = this.db.select().from(inventories).where(eq(inventories.userId, userId)).get();
    const teamMembers = this.db
      .select({ id: userPokemon.id })
      .from(userPokemon)
      .where(eq(userPokemon.userId, userId))
      .all();

    return {
      id: user.id,
      name: user.name,
      email: user.email || '',
      streakDays: user.streakDays,
      lastStudyDate: user.lastStudyDate,
      focusCoins: user.focusCoins,
      inventory: {
        basic: inventory?.biscuitsBasic ?? 0,
        great: inventory?.biscuitsGreat ?? 0,
        master: inventory?.biscuitsMaster ?? 0,
      },
      activeEnvironment: user.activeEnvironment,
      activeTeamPokemonIds: teamMembers.map((m) => m.id),
      hasCompletedOnboarding: Boolean(user.hasCompletedOnboarding),
      createdAt: user.createdAt,
    };
  }

  public updateStreak(userId: string, todayDateStr: string): { newStreak: number; kept: boolean } {
    const user = this.db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) throw new Error('User not found');

    let newStreak = user.streakDays;
    let kept = false;

    if (!user.lastStudyDate) {
      newStreak = 1;
      kept = true;
    } else if (user.lastStudyDate === todayDateStr) {
      // Já estudou hoje, mantém o streak atual
      kept = true;
    } else {
      const last = new Date(user.lastStudyDate);
      const today = new Date(todayDateStr);
      const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newStreak += 1; // Dia consecutivo!
        kept = true;
      } else {
        newStreak = 1; // Quebrou a sequência
        kept = false;
      }
    }

    this.db.update(users)
      .set({
        streakDays: newStreak,
        lastStudyDate: todayDateStr,
      })
      .where(eq(users.id, userId))
      .run();

    return { newStreak, kept };
  }

  public updateInventory(userId: string, inv: BiscuitInventoryDTO): void {
    this.db.update(inventories)
      .set({
        biscuitsBasic: inv.basic,
        biscuitsGreat: inv.great,
        biscuitsMaster: inv.master,
      })
      .where(eq(inventories.userId, userId))
      .run();
  }

  public updateEnvironment(userId: string, environment: string): void {
    this.db.update(users)
      .set({ activeEnvironment: environment })
      .where(eq(users.id, userId))
      .run();
  }

  public deductFocusCoins(userId: string, amount: number): void {
    const user = this.db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) throw new Error('User not found');
    this.db.update(users)
      .set({ focusCoins: Math.max(0, user.focusCoins - amount) })
      .where(eq(users.id, userId))
      .run();
  }
}
