import { SpawnedPokemonDTO, SleepStyle, PokemonVariant } from '../dtos/spawn.dto.js';

export interface SpawnEngineOptions {
  focusPower: number;
  streakDays: number;
  availablePokemon?: Array<{ id: number; name: string }>;
  existingFriendships?: Record<number, number>; // pokemonId -> pontos atuais
  randomFn?: () => number;                      // Para testes unitários determinísticos
}

// Coordenadas relativas pré-configuradas em torno do tapete no cenário top-down
const CANVAS_SLOTS = [
  { x: 0.50, y: 0.50 }, // Centro do tapete (pose principal)
  { x: 0.28, y: 0.38 }, // Noroeste
  { x: 0.72, y: 0.38 }, // Nordeste
  { x: 0.25, y: 0.65 }, // Sudoeste
  { x: 0.74, y: 0.65 }, // Sudeste
];

import { DEFAULT_AVAILABLE_ROSTER } from '../data/pokemon-catalog.js';

const DEFAULT_POKEMON_ROSTER = DEFAULT_AVAILABLE_ROSTER;

export function calculateSpawns(options: SpawnEngineOptions): SpawnedPokemonDTO[] {
  const {
    focusPower,
    streakDays,
    availablePokemon = DEFAULT_POKEMON_ROSTER,
    existingFriendships = {},
    randomFn = Math.random,
  } = options;

  // 1. Determina quantidade de spawns com base no Focus Power
  let spawnCount = 2;
  if (focusPower > 600) {
    spawnCount = 5;
  } else if (focusPower > 250) {
    spawnCount = Math.floor(randomFn() * 2) + 3; // 3 ou 4
  }

  // 2. Chance de Shiny (base ~0.22% aumentando até 1.0% com o streak de estudos)
  const shinyRate = Math.min(0.01, 0.0022 + streakDays * 0.001);

  // 3. Sorteia os Pokémon sem repetição na mesma sessão (se houver candidatos suficientes)
  const pool = [...availablePokemon];
  const results: SpawnedPokemonDTO[] = [];

  for (let i = 0; i < spawnCount; i++) {
    const pIndex = Math.floor(randomFn() * pool.length);
    const chosen = pool.splice(pIndex, 1)[0] || availablePokemon[0];

    // Sorteia o estilo de sono (poses raras exigem maior Focus Power)
    let style: SleepStyle = 1;
    if (focusPower > 600 && randomFn() < 0.25) {
      style = 3;
    } else if (focusPower > 250 && randomFn() < 0.40) {
      style = 2;
    }

    const isShiny = randomFn() < shinyRate;
    const isHungry = randomFn() < 0.15; // 15% de chance de Faminto
    const variant: PokemonVariant = isShiny ? 'shiny' : 'regular';

    const paddedId = String(chosen.id).padStart(4, '0');
    const shinySuffix = isShiny ? '_s' : '';
    const spriteSleepUrl = `sprites/sleep/${variant}/${paddedId}-${style}${shinySuffix}.png`;
    const spriteMenuUrl = `sprites/menu/${variant}/${paddedId}${shinySuffix}.png`;

    const currentPts = existingFriendships[chosen.id] ?? 0;
    const slot = CANVAS_SLOTS[i % CANVAS_SLOTS.length];

    results.push({
      spawnId: `spawn_${Date.now()}_${i}_${chosen.id}`,
      pokemonId: chosen.id,
      pokemonName: chosen.name,
      variant,
      sleepStyle: style,
      currentFriendshipPoints: currentPts,
      maxFriendshipPoints: 5,
      isAlreadyRecruited: currentPts >= 5,
      isHungry,
      isFull: false,
      spriteSleepUrl,
      spriteMenuUrl,
      canvasPosition: {
        x: slot.x + (randomFn() * 0.04 - 0.02), // Pequena variação orgânica
        y: slot.y + (randomFn() * 0.04 - 0.02),
      },
    });
  }

  return results;
}
