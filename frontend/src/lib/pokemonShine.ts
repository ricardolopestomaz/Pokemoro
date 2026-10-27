/**
 * Sistema de Brilho & Efeitos Visuais para Pokémon Shiny e Lendários do Pokémoro.
 * - Shiny Comum: Aura roxa mística pulsante que agrada aos olhos.
 * - Shiny Lendário: Aura dourada celestial estelar majestosa.
 */

export const LEGENDARY_POKEMON_IDS = new Set<number>([
  // Gen 1
  144, 145, 146, 150, 151, // Articuno, Zapdos, Moltres, Mewtwo, Mew
  // Gen 2
  243, 244, 245, 249, 250, 251, // Raikou, Entei, Suicune, Lugia, Ho-Oh, Celebi
  // Gen 3
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386, // Regirock, Regice, Registeel, Latias, Latios, Kyogre, Groudon, Rayquaza, Jirachi, Deoxys
  // Gen 4
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, // Uxie, Mesprit, Azelf, Dialga, Palkia, Heatran, Regigigas, Giratina, Cresselia, Phione, Manaphy, Darkrai, Shaymin, Arceus
  // Gen 5
  494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, // Victini, Cobalion, Terrakion, Virizion, Tornadus, Thundurus, Reshiram, Zekrom, Landorus, Kyurem, Keldeo, Meloetta, Genesect
  // Gen 6
  716, 717, 718, 719, 720, 721, // Xerneas, Yveltal, Zygarde, Diancie, Hoopa, Volcanion
  // Gen 7
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 793, 800, 801, 802, 807, 808, 809, // Silvally, Tapus, Cosmog, Solgaleo, Lunala, Nihilego, Necrozma, Magearna, Marshadow, Zeraora, Meltan, Melmetal
  // Gen 8
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905, // Zacian, Zamazenta, Eternatus, Urshifu, Zarude, Regieleki, Regidrago, Calyrex, Enamorus
  // Gen 9
  1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024, 1025 // Treasures of Ruin, Koraidon, Miraidon, Loyal Three, Ogerpon, Terapagos, Pecharunt
]);

/** Verifica se um Pokémon é Lendário ou Mítico */
export function isLegendaryPokemon(pokemonId: number): boolean {
  return LEGENDARY_POKEMON_IDS.has(Number(pokemonId));
}

/**
 * Retorna a classe CSS de brilho estelar para o Pokémon:
 * - Shiny Lendário: 'shiny-glow-gold' ou 'shiny-glow-gold-mini' (dourado radiante)
 * - Shiny Comum: 'shiny-glow-purple' ou 'shiny-glow-purple-mini' (roxo místico)
 * - Regular: ''
 */
export function getPokemonShineClass(pokemonId: number, variant?: string, isMini = false): string {
  if (variant !== 'shiny') return '';
  const isLegend = isLegendaryPokemon(pokemonId);
  if (isMini) {
    return isLegend ? 'shiny-glow-gold-mini' : 'shiny-glow-purple-mini';
  }
  return isLegend ? 'shiny-glow-gold' : 'shiny-glow-purple';
}

/**
 * Retorna informações completas de brilho e estilo para badges/labels
 */
export function getPokemonShineBadge(pokemonId: number, variant?: string) {
  const isShiny = variant === 'shiny';
  const isLegendary = isLegendaryPokemon(pokemonId);

  if (!isShiny) {
    return {
      isShiny: false,
      isLegendary,
      type: 'none' as const,
      label: isLegendary ? 'Lendário' : '',
      cssClass: '',
      color: isLegendary ? '#f59e0b' : '',
    };
  }

  if (isLegendary) {
    return {
      isShiny: true,
      isLegendary: true,
      type: 'gold' as const,
      label: 'Lendário Shiny ✨👑',
      cssClass: 'shiny-glow-gold',
      color: '#facc15',
    };
  }

  return {
    isShiny: true,
    isLegendary: false,
    type: 'purple' as const,
    label: 'Shiny ✨',
    cssClass: 'shiny-glow-purple',
    color: '#c084fc',
  };
}
