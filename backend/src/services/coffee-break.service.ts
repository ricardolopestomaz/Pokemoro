import { UserRepository } from '../db/repositories/user.repository.js';
import { PokemonRepository } from '../db/repositories/pokemon.repository.js';
import { SpawnedPokemonDTO, GetActiveCoffeeBreakResponse } from '../dtos/spawn.dto.js';
import { FeedPokemonResponse } from '../dtos/friendship.dto.js';
import { BiscuitType } from '../dtos/user.dto.js';

interface ActiveSessionData {
  sessionId: string;
  focusPower: number;
  environment: string;
  spawns: SpawnedPokemonDTO[];
}

export class CoffeeBreakService {
  private static activeSessions = new Map<string, ActiveSessionData>();

  constructor(
    private userRepo = new UserRepository(),
    private pokemonRepo = new PokemonRepository()
  ) {}

  public setActiveCoffeeBreak(
    userId: string,
    sessionId: string,
    focusPower: number,
    environment: string,
    spawns: SpawnedPokemonDTO[]
  ): GetActiveCoffeeBreakResponse {
    const data: ActiveSessionData = {
      sessionId,
      focusPower,
      environment,
      spawns,
    };

    CoffeeBreakService.activeSessions.set(userId, data);

    // Registra as poses de sono descobertas na Focus Dex
    for (const s of spawns) {
      this.pokemonRepo.recordDexEntry(userId, s.pokemonId, s.sleepStyle, s.variant === 'shiny');
    }

    return {
      sessionId,
      focusPower,
      environment,
      spawns,
    };
  }

  public getActiveCoffeeBreak(userId: string): GetActiveCoffeeBreakResponse | null {
    const session = CoffeeBreakService.activeSessions.get(userId);
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      focusPower: session.focusPower,
      environment: session.environment,
      spawns: session.spawns,
    };
  }

  public feedPokemon(
    userId: string,
    spawnId: string,
    biscuitType: BiscuitType
  ): FeedPokemonResponse {
    const session = CoffeeBreakService.activeSessions.get(userId);
    if (!session) throw new Error('Nenhuma sessão de Coffee Break ativa no momento.');

    const targetSpawn = session.spawns.find((s) => s.spawnId === spawnId);
    if (!targetSpawn) throw new Error('Pokémon não encontrado nesta sessão.');

    if (targetSpawn.isFull) {
      throw new Error('Este Pokémon já está satisfeito e descansando!');
    }

    // 1. Verifica se o usuário tem o biscoito
    const user = this.userRepo.getUserProfile(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    const inventory = { ...user.inventory };
    if (biscuitType === 'BASIC') {
      if (inventory.basic <= 0) throw new Error('Você não tem mais Biscoitos de Café!');
      inventory.basic -= 1;
    } else if (biscuitType === 'GREAT') {
      if (inventory.great <= 0) throw new Error('Você não tem Biscoitos Especiais!');
      inventory.great -= 1;
    } else if (biscuitType === 'MASTER') {
      if (inventory.master <= 0) throw new Error('Você não tem Biscoitos Dourados!');
      inventory.master -= 1;
    }

    // Atualiza inventário do usuário no banco
    this.userRepo.updateInventory(userId, inventory);

    // 2. Calcula pontos adicionados
    let pointsToAdd = 1;
    if (biscuitType === 'GREAT') pointsToAdd = 3;
    else if (biscuitType === 'MASTER') pointsToAdd = targetSpawn.maxFriendshipPoints;

    const wasHungry = targetSpawn.isHungry;
    if (wasHungry) {
      pointsToAdd *= 3; // Efeito de Faminto! 3x no primeiro biscoito
      targetSpawn.isHungry = false;
    }

    // 3. Atualiza progresso de amizade no banco
    const { newPoints, isRecruited } = this.pokemonRepo.feedPokemon(
      userId,
      targetSpawn.pokemonId,
      pointsToAdd,
      targetSpawn.maxFriendshipPoints
    );

    targetSpawn.currentFriendshipPoints = newPoints;

    // 4. Se atingiu o máximo, recruta!
    let recruitedPokemon = null;
    if (isRecruited) {
      targetSpawn.isAlreadyRecruited = true;
      recruitedPokemon = this.pokemonRepo.recruitPokemon(
        userId,
        targetSpawn.pokemonId,
        targetSpawn.pokemonName,
        targetSpawn.variant
      );
    } else {
      // Chance de ficar satisfeito (Full) se não foi recrutado (após comer)
      if (Math.random() < 0.35) {
        targetSpawn.isFull = true;
      }
    }

    return {
      spawnId,
      pointsAdded: pointsToAdd,
      newFriendshipPoints: newPoints,
      maxFriendshipPoints: targetSpawn.maxFriendshipPoints,
      wasHungry,
      isFull: targetSpawn.isFull,
      isRecruited,
      recruitedPokemon,
      updatedInventory: inventory,
    };
  }
}
