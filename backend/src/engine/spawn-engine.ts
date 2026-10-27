import { SpawnedPokemonDTO, SleepStyle, PokemonVariant } from '../dtos/spawn.dto.js';
import { DEFAULT_AVAILABLE_ROSTER } from '../data/pokemon-catalog.js';

export type PokemonCategory = 'BASE' | 'MID' | 'FINAL' | 'PSEUDO_LEGENDARY' | 'LEGENDARY';

export const LEGENDARY_IDS = new Set<number>([
  150, // Mewtwo
  151, // Mew
  243, // Raikou
  244, // Entei
  245, // Suicune
  380, // Latias
  381, // Latios
  488, // Cresselia
  491, // Darkrai
]);

export const PSEUDO_LEGENDARY_IDS = new Set<number>([
  149, // Dragonite
  248, // Tyranitar
  373, // Salamence
]);

export const MID_STAGE_IDS = new Set<number>([
  2,   // Ivysaur
  5,   // Charmeleon
  8,   // Wartortle
  11,  // Metapod
  25,  // Pikachu
  35,  // Clefairy
  39,  // Jigglypuff
  70,  // Weepinbell
  75,  // Graveler
  82,  // Magneton
  93,  // Haunter
  113, // Chansey
  148, // Dragonair
  153, // Bayleef
  156, // Quilava
  159, // Croconaw
  176, // Togetic
  180, // Flaaffy
  247, // Pupitar
  253, // Grovyle
  256, // Combusken
  259, // Marshtomp
  281, // Kirlia
  288, // Vigoroth
  305, // Lairon
  329, // Vibrava
  364, // Sealeo
  372, // Shelgon
  388, // Grotle
  391, // Monferno
  394, // Prinplup
  404, // Luxio
  737, // Charjabug
  907, // Floragato
  910, // Crocalor
  913, // Quaxwell
  922, // Pawmo
  958, // Tinkatuff
]);

export const FINAL_STAGE_IDS = new Set<number>([
  3, 6, 9, 12, 20, 24, 26, 28, 36, 38, 40, 51, 53, 55, 57, 59, 71, 76, 80, 85,
  94, 95, 105, 115, 122, 127, 132, 134, 135, 136, 154, 157, 160, 178, 181, 185,
  195, 196, 197, 199, 202, 208, 214, 225, 229, 242, 254, 257, 260, 282, 289,
  302, 303, 306, 311, 312, 317, 330, 334, 354, 359, 365, 389, 392, 395, 405,
  426, 430, 442, 448, 454, 460, 461, 462, 468, 470, 471, 475, 518, 558, 628,
  697, 700, 701, 702, 711, 715, 738, 743, 760, 764, 777, 778, 780, 845, 849,
  908, 911, 914, 923, 959, 975, 980,
]);

export function getPokemonCategory(pokemonId: number): PokemonCategory {
  if (LEGENDARY_IDS.has(pokemonId)) return 'LEGENDARY';
  if (PSEUDO_LEGENDARY_IDS.has(pokemonId)) return 'PSEUDO_LEGENDARY';
  if (FINAL_STAGE_IDS.has(pokemonId)) return 'FINAL';
  if (MID_STAGE_IDS.has(pokemonId)) return 'MID';
  return 'BASE';
}

export interface WeightedTier {
  minMinutes: number;
  maxMinutes: number;
  spawnCount: number;
  weights: Record<PokemonCategory, number>;
  shinyChancePercent: number;
}

export const SPAWN_WEIGHT_TIERS: WeightedTier[] = [
  {
    minMinutes: 0,
    maxMinutes: 50,
    spawnCount: 0,
    weights: { BASE: 0, MID: 0, FINAL: 0, PSEUDO_LEGENDARY: 0, LEGENDARY: 0 },
    shinyChancePercent: 0,
  },
  {
    minMinutes: 50,
    maxMinutes: 120,
    spawnCount: 1,
    weights: { BASE: 85, MID: 15, FINAL: 0, PSEUDO_LEGENDARY: 0, LEGENDARY: 0 },
    shinyChancePercent: 0,
  },
  {
    minMinutes: 120,
    maxMinutes: 180,
    spawnCount: 2,
    weights: { BASE: 50, MID: 35, FINAL: 15, PSEUDO_LEGENDARY: 0, LEGENDARY: 0 },
    shinyChancePercent: 1,
  },
  {
    minMinutes: 180,
    maxMinutes: 240,
    spawnCount: 2,
    weights: { BASE: 15, MID: 35, FINAL: 45, PSEUDO_LEGENDARY: 5, LEGENDARY: 0 },
    shinyChancePercent: 3,
  },
  {
    minMinutes: 240,
    maxMinutes: 300,
    spawnCount: 2,
    weights: { BASE: 0, MID: 20, FINAL: 55, PSEUDO_LEGENDARY: 23, LEGENDARY: 2 },
    shinyChancePercent: 5,
  },
  {
    minMinutes: 300,
    maxMinutes: 360,
    spawnCount: 2,
    weights: { BASE: 0, MID: 0, FINAL: 50, PSEUDO_LEGENDARY: 35, LEGENDARY: 15 },
    shinyChancePercent: 25,
  },
  {
    minMinutes: 360,
    maxMinutes: Infinity,
    spawnCount: 2,
    weights: { BASE: 0, MID: 0, FINAL: 20, PSEUDO_LEGENDARY: 40, LEGENDARY: 40 },
    shinyChancePercent: 50,
  },
];

// Coordenadas relativas pré-configuradas no gramado aberto em torno do tapete
export const CANVAS_SLOTS = [
  { x: 0.50, y: 0.28 }, // Gramado Norte (acima do tapete)
  { x: 0.18, y: 0.34 }, // Gramado Noroeste
  { x: 0.82, y: 0.34 }, // Gramado Nordeste
  { x: 0.16, y: 0.72 }, // Gramado Sudoeste
  { x: 0.84, y: 0.72 }, // Gramado Sudeste
  { x: 0.50, y: 0.76 }, // Gramado Sul (abaixo do tapete)
];

export interface RollSpawnsOptions {
  availablePokemon?: Array<{ id: number; name: string }>;
  existingFriendships?: Record<number, number>;
  recruitedPokemonIds?: Set<number> | number[];
  discoveredDexStyles?: Record<number, Set<number> | number[] | { styles?: number[] }>;
  randomFn?: () => number;
  now?: number;
  forcedSpawnCount?: number;
}

export function rollPokemonSpawns(minutesFocused: number, options?: RollSpawnsOptions): SpawnedPokemonDTO[] {
  const {
    availablePokemon = DEFAULT_AVAILABLE_ROSTER,
    existingFriendships = {},
    recruitedPokemonIds,
    discoveredDexStyles,
    randomFn = Math.random,
    now = Date.now(),
    forcedSpawnCount,
  } = options || {};

  const cleanMinutes = Math.max(0, minutesFocused);
  const tier = SPAWN_WEIGHT_TIERS.find((t) => cleanMinutes >= t.minMinutes && cleanMinutes < t.maxMinutes)
    || SPAWN_WEIGHT_TIERS[SPAWN_WEIGHT_TIERS.length - 1];

  const spawnCount = forcedSpawnCount !== undefined ? forcedSpawnCount : tier.spawnCount;
  if (spawnCount <= 0) return [];

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
      if (Array.isArray(v)) {
        discoveredMap[Number(k)] = v;
      } else if (v instanceof Set) {
        discoveredMap[Number(k)] = Array.from(v);
      } else if (v && typeof v === 'object' && 'styles' in v && Array.isArray((v as any).styles)) {
        discoveredMap[Number(k)] = (v as any).styles;
      } else if (v && typeof (v as any)[Symbol.iterator] === 'function') {
        discoveredMap[Number(k)] = Array.from(v as any);
      }
    }
  }

  // Agrupa os Pokémon disponíveis por categoria
  const categoryPools: Record<PokemonCategory, Array<{ id: number; name: string }>> = {
    BASE: [],
    MID: [],
    FINAL: [],
    PSEUDO_LEGENDARY: [],
    LEGENDARY: [],
  };

  availablePokemon.forEach((p) => {
    const cat = getPokemonCategory(p.id);
    categoryPools[cat].push(p);
  });

  const CATEGORY_ORDER: PokemonCategory[] = ['BASE', 'MID', 'FINAL', 'PSEUDO_LEGENDARY', 'LEGENDARY'];
  const results: SpawnedPokemonDTO[] = [];
  const chosenIds = new Set<number>();

  for (let i = 0; i < spawnCount; i++) {
    // 1. Sorteio de Categoria (0 a 100)
    const catRoll = randomFn() * 100;
    let selectedCategory: PokemonCategory = 'BASE';
    let accum = 0;

    for (const cat of CATEGORY_ORDER) {
      accum += tier.weights[cat];
      if (catRoll < accum) {
        selectedCategory = cat;
        break;
      }
    }

    // 2. Sorteio de Shiny independente (0 a 100)
    const shinyRoll = randomFn() * 100;
    const isShiny = tier.shinyChancePercent > 0 && shinyRoll < tier.shinyChancePercent;

    // Seleciona um Pokémon da categoria sorteada
    let pool = categoryPools[selectedCategory].filter((p) => !chosenIds.has(p.id));

    // Se o pool da categoria estiver vazio, faz fallback inteligente
    if (pool.length === 0) {
      const fallbackOrder: PokemonCategory[] = ['PSEUDO_LEGENDARY', 'FINAL', 'MID', 'BASE', 'LEGENDARY'];
      for (const fallbackCat of fallbackOrder) {
        const altPool = categoryPools[fallbackCat].filter((p) => !chosenIds.has(p.id));
        if (altPool.length > 0) {
          pool = altPool;
          break;
        }
      }
      if (pool.length === 0) {
        pool = [...availablePokemon];
      }
    }

    const pIndex = Math.floor(randomFn() * pool.length);
    const chosen = pool[pIndex] || availablePokemon[0];
    chosenIds.add(chosen.id);

    const isFriend = recruitedSet.has(chosen.id) || (existingFriendships[chosen.id] ?? 0) >= 5;
    const discovered = discoveredMap[chosen.id] || [];
    const undiscovered = [1, 2, 3].filter((s) => !discovered.includes(s)) as SleepStyle[];

    // Sorteio real entre as poses de sono 1, 2 e 3
    let style: SleepStyle = 1;
    if (isFriend && undiscovered.length > 0) {
      const idx = Math.floor(randomFn() * undiscovered.length);
      style = undiscovered[idx];
    } else {
      const styleRoll = randomFn();
      if (styleRoll < 0.334) style = 1;
      else if (styleRoll < 0.667) style = 2;
      else style = 3;
    }

    const isHungry = randomFn() < 0.15; // 15% de chance de Faminto
    const variant: PokemonVariant = isShiny ? 'shiny' : 'regular';
    const paddedId = String(chosen.id).padStart(4, '0');
    const shinySuffix = isShiny ? '_s' : '';
    const spriteSleepUrl = `sprites/sleep/${variant}/${paddedId}-${style}${shinySuffix}.png`;
    const spriteMenuUrl = `sprites/menu/${variant}/${paddedId}${shinySuffix}.png`;

    const currentPts = existingFriendships[chosen.id] ?? 0;
    const slot = CANVAS_SLOTS[i % CANVAS_SLOTS.length];

    // Timestamps de expiração de 30 minutos (1.800.000 ms)
    const spawnedAt = now;
    const expiresAt = now + 30 * 60 * 1000;

    results.push({
      spawnId: `spawn_${now}_${i}_${chosen.id}`,
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
        x: slot.x + (randomFn() * 0.04 - 0.02),
        y: slot.y + (randomFn() * 0.04 - 0.02),
      },
      spawnedAt,
      expiresAt,
    });
  }

  return results;
}

export interface SpawnEngineOptions {
  focusPower: number;
  streakDays: number;
  availablePokemon?: Array<{ id: number; name: string }>;
  existingFriendships?: Record<number, number>;
  recruitedPokemonIds?: Set<number> | number[];
  discoveredDexStyles?: Record<number, Set<number> | number[]>;
  randomFn?: () => number;
  forcedSpawnCount?: number;
}

export function calculateSpawns(options: SpawnEngineOptions): SpawnedPokemonDTO[] {
  const {
    focusPower,
    streakDays,
    availablePokemon = DEFAULT_AVAILABLE_ROSTER,
    existingFriendships = {},
    recruitedPokemonIds,
    discoveredDexStyles,
    randomFn = Math.random,
    forcedSpawnCount,
  } = options;

  let spawnCount = forcedSpawnCount !== undefined ? forcedSpawnCount : 2;
  if (forcedSpawnCount === undefined) {
    if (focusPower > 600) {
      spawnCount = 5;
    } else if (focusPower > 250) {
      spawnCount = Math.floor(randomFn() * 2) + 3;
    }
  }

  if (spawnCount <= 0) return [];

  const shinyRate = Math.min(0.01, 0.0022 + streakDays * 0.001);

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

  const now = Date.now();

  for (let i = 0; i < spawnCount; i++) {
    const pIndex = Math.floor(randomFn() * pool.length);
    const chosen = pool.splice(pIndex, 1)[0] || availablePokemon[0];

    const isFriend = recruitedSet.has(chosen.id) || (existingFriendships[chosen.id] ?? 0) >= 5;
    const discovered = discoveredMap[chosen.id] || [];
    const undiscovered = [1, 2, 3].filter((s) => !discovered.includes(s)) as SleepStyle[];

    let style: SleepStyle = 1;
    if (isFriend && undiscovered.length > 0) {
      if (focusPower >= 500 && undiscovered.includes(3)) {
        style = 3;
      } else if (focusPower >= 200 && undiscovered.includes(2)) {
        style = 2;
      } else {
        const idx = Math.floor(randomFn() * undiscovered.length);
        style = undiscovered[idx];
      }
    } else {
      const roll = randomFn();
      if (focusPower >= 500) {
        if (roll < 0.35) style = 3;
        else if (roll < 0.75) style = 2;
        else style = 1;
      } else if (focusPower >= 200) {
        if (roll < 0.20) style = 3;
        else if (roll < 0.65) style = 2;
        else style = 1;
      } else {
        if (roll < 0.10) style = 3;
        else if (roll < 0.45) style = 2;
        else style = 1;
      }
    }

    const isShiny = randomFn() < shinyRate;
    const isHungry = randomFn() < 0.15;
    const variant: PokemonVariant = isShiny ? 'shiny' : 'regular';

    const paddedId = String(chosen.id).padStart(4, '0');
    const shinySuffix = isShiny ? '_s' : '';
    const spriteSleepUrl = `sprites/sleep/${variant}/${paddedId}-${style}${shinySuffix}.png`;
    const spriteMenuUrl = `sprites/menu/${variant}/${paddedId}${shinySuffix}.png`;

    const currentPts = existingFriendships[chosen.id] ?? 0;
    const slot = CANVAS_SLOTS[i % CANVAS_SLOTS.length];

    results.push({
      spawnId: `spawn_${now}_${i}_${chosen.id}`,
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
        x: slot.x + (randomFn() * 0.04 - 0.02),
        y: slot.y + (randomFn() * 0.04 - 0.02),
      },
      spawnedAt: now,
      expiresAt: now + 30 * 60 * 1000,
    });
  }

  return results;
}
