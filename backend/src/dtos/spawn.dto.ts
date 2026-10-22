export type PokemonVariant = 'regular' | 'shiny' | 'events';
export type SleepStyle = 1 | 2 | 3;

export interface SpawnedPokemonDTO {
  spawnId: string;                     // ID efêmero da sessão de descanso
  pokemonId: number;                   // ID da Pokédex nacional (ex: 10 = Caterpie)
  pokemonName: string;
  variant: PokemonVariant;
  sleepStyle: SleepStyle;              // Estilo de sono sorteado (1, 2 ou 3)
  
  // Status de Amizade
  currentFriendshipPoints: number;     // Progresso persistido (não reseta entre sessões)
  maxFriendshipPoints: number;         // Pontos para recrutar (ex: 5 para básicos)
  isAlreadyRecruited: boolean;         // True se o jogador já possui este Pokémon
  
  // Mecânicas de Alimentação
  isHungry: boolean;                   // 15% de chance (3x pontos no 1º biscoito)
  isFull: boolean;                     // True se ficar saciado
  
  // Caminhos de Assets
  spriteSleepUrl: string;              // ex: 'sprites/sleep/regular/0010-1.png'
  spriteMenuUrl: string;               // ex: 'sprites/menu/regular/0010.png'
  
  // Coordenadas normalizadas para renderização no cenário (0.0 a 1.0)
  canvasPosition: {
    x: number;
    y: number;
  };
}

export interface GetActiveCoffeeBreakResponse {
  sessionId: string;
  focusPower: number;
  environment: string;                 // Cenário em que estão descansando
  spawns: SpawnedPokemonDTO[];
}
