import { BiscuitType, BiscuitInventoryDTO } from './user.dto.js';
import { UserPokemonDTO } from './team.dto.js';

export interface FeedPokemonRequest {
  spawnId: string;
  biscuitType: BiscuitType;            // 'BASIC' | 'GREAT' | 'MASTER'
}

export interface FeedPokemonResponse {
  spawnId: string;
  pointsAdded: number;                 // Multiplicado por 3 se estava Hungry
  newFriendshipPoints: number;
  maxFriendshipPoints: number;
  wasHungry: boolean;                  // Se o Pokémon consumiu o bônus de faminto
  isFull: boolean;                     // Se atingiu o limite da sessão
  isRecruited: boolean;                // true se newFriendshipPoints >= maxFriendshipPoints
  
  // Retorna o Pokémon criado na coleção caso tenha sido recrutado agora
  recruitedPokemon: UserPokemonDTO | null;
  
  // Saldo de biscoitos atualizado no inventário
  updatedInventory: BiscuitInventoryDTO;
}
