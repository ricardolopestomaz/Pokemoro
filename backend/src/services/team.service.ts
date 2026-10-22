import { PokemonRepository } from '../db/repositories/pokemon.repository.js';
import { UserPokemonDTO, SetStudyTeamResponse } from '../dtos/team.dto.js';

export class TeamService {
  constructor(private pokemonRepo = new PokemonRepository()) {}

  public listAllPokemon(userId: string): UserPokemonDTO[] {
    return this.pokemonRepo.listUserPokemon(userId);
  }

  public setTeam(userId: string, pokemonIds: string[]): SetStudyTeamResponse {
    this.pokemonRepo.setActiveTeam(userId, pokemonIds);
    return this.getActiveTeam(userId);
  }

  public getActiveTeam(userId: string): SetStudyTeamResponse {
    const all = this.pokemonRepo.listUserPokemon(userId);
    // Filtra membros da equipe
    const activeTeam = all.slice(0, 5); // Primeiros equipados
    const activePassives = activeTeam
      .map((p) => p.passiveBonusDescription)
      .filter((desc): desc is string => Boolean(desc));

    return {
      activeTeam,
      activePassives,
    };
  }

  public getFocusDex(userId: string) {
    return this.pokemonRepo.getFocusDex(userId);
  }
}
