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
    const activeTeam = all
      .filter((p) => p.isInActiveTeam)
      .sort((a, b) => (a.teamSlot ?? 0) - (b.teamSlot ?? 0));
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

  public saveDexPhoto(
    userId: string,
    pokemonId: number,
    sleepStyle: number,
    isShiny: boolean,
    photoDataUrl: string
  ) {
    this.pokemonRepo.recordDexEntry(userId, pokemonId, sleepStyle as any, isShiny, photoDataUrl);
    return { ok: true };
  }
}

