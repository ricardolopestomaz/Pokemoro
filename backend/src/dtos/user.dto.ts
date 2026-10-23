export type BiscuitType = 'BASIC' | 'GREAT' | 'MASTER';

export interface BiscuitInventoryDTO {
  basic: number;   // Biscoito de Café (+1 amizade)
  great: number;   // Biscoito Especial (+3 amizade)
  master: number;  // Biscoito Dourado (Completa a barra instantaneamente)
}

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  streakDays: number;
  lastStudyDate: string | null;     // ISO 8601 YYYY-MM-DD
  focusCoins: number;
  inventory: BiscuitInventoryDTO;
  activeEnvironment: string;        // ex: 'greengrass', 'beach', 'tundra', 'cave', 'study_room'
  activeTeamPokemonIds: string[];   // IDs dos 5 Pokémon ativos na mesa
  hasCompletedOnboarding: boolean;  // Flag que indica se o usuário concluiu o tutorial do Prof. Ricardo
  createdAt: string;
}

export interface UpdateEnvironmentRequest {
  environment: string;
}
