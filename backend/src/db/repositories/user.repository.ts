import { eq } from 'drizzle-orm';
import { getDatabase } from '../client.js';
import { users, inventories, userPokemon } from '../schema.js';
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
      focusCoins: 100,
      activeEnvironment: 'greengrass',
      createdAt: now,
    }).run();

    this.db.insert(inventories).values({
      userId: id,
      biscuitsBasic: 3,  // 3 Biscoitos de café iniciais
      biscuitsGreat: 1,
      biscuitsMaster: 0,
    }).run();

    return this.getUserProfile(id)!;
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
