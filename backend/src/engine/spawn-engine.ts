import { SpawnedPokemonDTO, SleepStyle, PokemonVariant } from '../dtos/spawn.dto.js';

export interface SpawnEngineOptions {
  focusPower: number;
  streakDays: number;
  availablePokemon?: Array<{ id: number; name: string }>;
  existingFriendships?: Record<number, number>; // pokemonId -> pontos atuais
  recruitedPokemonIds?: Set<number> | number[];
  discoveredDexStyles?: Record<number, Set<number> | number[]>;
  randomFn?: () => number;                      // Para testes unitários determinísticos
  forcedSpawnCount?: number;                    // Quantidade forçada de Pokémon gerados (ex: modo Livre = 1)
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
    recruitedPokemonIds,
    discoveredDexStyles,
    randomFn = Math.random,
    forcedSpawnCount,
  } = options;

  // 1. Determina quantidade de spawns com base no Focus Power (ou valor forçado pelo modo)
  let spawnCount = forcedSpawnCount !== undefined ? forcedSpawnCount : 2;
  if (forcedSpawnCount === undefined) {
    if (focusPower > 600) {
      spawnCount = 5;
    } else if (focusPower > 250) {
      spawnCount = Math.floor(randomFn() * 2) + 3; // 3 ou 4
    }
  }

  if (spawnCount <= 0) return [];

  // 2. Chance de Shiny (base ~0.22% aumentando até 1.0% com o streak de estudos)
  const shinyRate = Math.min(0.01, 0.0022 + streakDays * 0.001);

  // Normaliza IDs de recrutados e mapa de poses descobertas
  const recruitedSet = new Set<number>(
    Array.isArray(recruitedPokemonIds)
      ? recruitedPokemonIds
      : recruitedPokemonIds
      ? Array.from(recruitedPokemonIds)
      : []
  );

  const discoveredMap: Record<number, number[]> = {};
  if (discoveredDexStyles) {
    for (const [k, v] of Object.entries(discoveredDexStyles)) {
      discoveredMap[Number(k)] = Array.isArray(v) ? v : Array.from(v);
    }
  }

  // 3. Filtro inteligente de prioridade:
  // Se o Pokémon já é amigo E já tem todas as 3 poses descobertas, prioriza outros
  const isComplete = (pId: number) => {
    const isFriend = recruitedSet.has(pId) || (existingFriendships[pId] ?? 0) >= 5;
    const discovered = discoveredMap[pId] || [];
    return isFriend && [1, 2, 3].every((s) => discovered.includes(s));
  };

  const freshCandidates = availablePokemon.filter((p) => !isComplete(p.id));
  const pool = freshCandidates.length >= spawnCount
    ? [...freshCandidates]
    : [...availablePokemon];
  const results: SpawnedPokemonDTO[] = [];

  for (let i = 0; i < spawnCount; i++) {
    const pIndex = Math.floor(randomFn() * pool.length);
    const chosen = pool.splice(pIndex, 1)[0] || availablePokemon[0];

    const isFriend = recruitedSet.has(chosen.id) || (existingFriendships[chosen.id] ?? 0) >= 5;
    const discovered = discoveredMap[chosen.id] || [];
    const undiscovered = [1, 2, 3].filter((s) => !discovered.includes(s)) as SleepStyle[];

    // Sorteia o estilo de sono
    let style: SleepStyle = 1;
    if (isFriend && undiscovered.length > 0) {
      // Se já virou amigo, APENAS sorteia poses que o usuário ainda NÃO descobriu
      if (focusPower > 600 && undiscovered.includes(3)) {
        style = 3;
      } else if (focusPower > 250 && undiscovered.includes(2)) {
        style = 2;
      } else {
        const idx = Math.floor(randomFn() * undiscovered.length);
        style = undiscovered[idx];
      }
    } else {
      if (focusPower > 600 && randomFn() < 0.25) {
        style = 3;
      } else if (focusPower > 250 && randomFn() < 0.40) {
        style = 2;
      }
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
