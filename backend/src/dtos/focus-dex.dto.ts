import { SleepStyle } from './spawn.dto.js';

export interface FocusDexStyleDTO {
  style: SleepStyle;
  isUnlocked: boolean;
  unlockedAt: string | null;
  discoveredShiny: boolean;
}

export interface FocusDexEntryDTO {
  pokemonId: number;
  pokemonName: string;
  isSeen: boolean;
  isRecruited: boolean;
  styles: {
    style1: FocusDexStyleDTO;
    style2: FocusDexStyleDTO;
    style3: FocusDexStyleDTO;
  };
}

export interface GetFocusDexResponse {
  totalDiscovered: number;
  totalAvailable: number;
  completionPercentage: number;
  entries: FocusDexEntryDTO[];
}
