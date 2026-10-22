import { PokemonVariant, SleepStyle } from './spawn.dto.js';

export type StudyRole = 'ENERGY' | 'ITEMS' | 'SUBJECT_EXACT' | 'SUBJECT_HUMAN' | 'STAMINA';

export interface UserPokemonDTO {
  id: string;                          // UUID único da criatura do usuário
  pokemonId: number;                   // ID da Pokédex (ex: 10)
  nickname: string;
  variant: PokemonVariant;
  friendshipLevel: number;             // Nível de amizade acumulado
  discoveredStyles: SleepStyle[];      // Poses que o jogador já descobriu com ele
  role: StudyRole;
  passiveBonusDescription: string;     // ex: "+10% XP em matérias de Exatas"
  recruitedAt: string;
  isInActiveTeam?: boolean;
  teamSlot?: number | null;
}

export interface SetStudyTeamRequest {
  pokemonIds: string[];                // Array de 1 a 5 IDs de UserPokemon
}

export interface SetStudyTeamResponse {
  activeTeam: UserPokemonDTO[];
  activePassives: string[];            // Resumo de todos os bônus ativos para a sessão
}
