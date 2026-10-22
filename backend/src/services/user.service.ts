import { UserRepository } from '../db/repositories/user.repository.js';
import { UserProfileDTO, BiscuitType } from '../dtos/user.dto.js';

export class UserService {
  constructor(private userRepo = new UserRepository()) {}

  /**
   * Garante que existe pelo menos um usuário local cadastrado para o app offline-first.
   */
  public getOrCreateDefaultUser(): UserProfileDTO {
    // Procura primeiro usuário ou cria o padrão
    const defaultId = 'local-student-01';
    let profile = this.userRepo.getUserProfile(defaultId);

    if (!profile) {
      profile = this.userRepo.createInitialUser(defaultId, 'Treinador Focado');
    }

    return profile;
  }

  public getProfile(userId: string): UserProfileDTO {
    const profile = this.userRepo.getUserProfile(userId);
    if (!profile) throw new Error('Usuário não encontrado');
    return profile;
  }

  public setEnvironment(userId: string, environment: string): UserProfileDTO {
    this.userRepo.updateEnvironment(userId, environment);
    return this.getProfile(userId);
  }

  public buyBiscuits(userId: string, type: BiscuitType, quantity = 1): UserProfileDTO {
    const profile = this.getProfile(userId);
    const costMap: Record<BiscuitType, number> = {
      BASIC: 50,
      GREAT: 120,
      MASTER: 300,
    };

    const totalCost = costMap[type] * quantity;
    if (profile.focusCoins < totalCost) {
      throw new Error(`Moedas insuficientes. Custo: ${totalCost}, Saldo: ${profile.focusCoins}`);
    }

    const newInventory = { ...profile.inventory };
    if (type === 'BASIC') newInventory.basic += quantity;
    else if (type === 'GREAT') newInventory.great += quantity;
    else if (type === 'MASTER') newInventory.master += quantity;

    this.userRepo.updateInventory(userId, newInventory);
    return this.getProfile(userId);
  }
}
