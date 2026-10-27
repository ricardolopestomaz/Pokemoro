/**
 * Catálogo e Mapeamento de Linhas Evolutivas dos Pokémon no Pokémoro.
 * Permite que Study Buddies na coleção evoluam ao atingirem nível 5 de amizade e estudo compartilhado!
 */

export interface EvolutionNode {
  pokemonId: number;
  evolvesToId: number;
  evolvedName: string;
  requiredFriendshipLevel: number;
  description: string;
}

export const EVOLUTION_MAP: Record<number, EvolutionNode> = {
  // Geração 1
  1: { pokemonId: 1, evolvesToId: 2, evolvedName: 'Ivysaur', requiredFriendshipLevel: 5, description: 'Bulbasaur floresce e evolui para Ivysaur!' },
  2: { pokemonId: 2, evolvesToId: 3, evolvedName: 'Venusaur', requiredFriendshipLevel: 5, description: 'Ivysaur atinge a plenitude e evolui para Venusaur!' },
  4: { pokemonId: 4, evolvesToId: 5, evolvedName: 'Charmeleon', requiredFriendshipLevel: 5, description: 'Charmander queima mais forte e evolui para Charmeleon!' },
  5: { pokemonId: 5, evolvesToId: 6, evolvedName: 'Charizard', requiredFriendshipLevel: 5, description: 'Charmeleon abre asas majestosas e evolui para Charizard!' },
  7: { pokemonId: 7, evolvesToId: 8, evolvedName: 'Wartortle', requiredFriendshipLevel: 5, description: 'Squirtle fortalece sua carapaça e evolui para Wartortle!' },
  8: { pokemonId: 8, evolvesToId: 9, evolvedName: 'Blastoise', requiredFriendshipLevel: 5, description: 'Wartortle libera canhões de água e evolui para Blastoise!' },
  10: { pokemonId: 10, evolvesToId: 11, evolvedName: 'Metapod', requiredFriendshipLevel: 5, description: 'Caterpie forma um casulo resistente e evolui para Metapod!' },
  11: { pokemonId: 11, evolvesToId: 12, evolvedName: 'Butterfree', requiredFriendshipLevel: 5, description: 'Metapod rompe o casulo e voa como uma linda Butterfree!' },
  16: { pokemonId: 16, evolvesToId: 17, evolvedName: 'Pidgeotto', requiredFriendshipLevel: 5, description: 'Pidgey ganha penas velozes e evolui para Pidgeotto!' },
  17: { pokemonId: 17, evolvesToId: 18, evolvedName: 'Pidgeot', requiredFriendshipLevel: 5, description: 'Pidgeotto atinge a maestria dos céus e evolui para Pidgeot!' },
  25: { pokemonId: 25, evolvesToId: 26, evolvedName: 'Raichu', requiredFriendshipLevel: 5, description: 'Pikachu canaliza alta voltagem e evolui para Raichu!' },
  63: { pokemonId: 63, evolvesToId: 64, evolvedName: 'Kadabra', requiredFriendshipLevel: 5, description: 'Abra expande seus poderes telecinéticos e evolui para Kadabra!' },
  64: { pokemonId: 64, evolvesToId: 65, evolvedName: 'Alakazam', requiredFriendshipLevel: 5, description: 'Kadabra alcança intelecto supremo e evolui para Alakazam!' },
  66: { pokemonId: 66, evolvesToId: 67, evolvedName: 'Machoke', requiredFriendshipLevel: 5, description: 'Machop desenvolve força incrível e evolui para Machoke!' },
  67: { pokemonId: 67, evolvesToId: 68, evolvedName: 'Machamp', requiredFriendshipLevel: 5, description: 'Machoke ganha quatro punhos poderosos e evolui para Machamp!' },
  74: { pokemonId: 74, evolvesToId: 75, evolvedName: 'Graveler', requiredFriendshipLevel: 5, description: 'Geodude endurece suas rochas e evolui para Graveler!' },
  75: { pokemonId: 75, evolvesToId: 76, evolvedName: 'Golem', requiredFriendshipLevel: 5, description: 'Graveler forma uma couraça impenetrável e evolui para Golem!' },
  92: { pokemonId: 92, evolvesToId: 93, evolvedName: 'Haunter', requiredFriendshipLevel: 5, description: 'Gastly ganha mãos fantasmagóricas e evolui para Haunter!' },
  93: { pokemonId: 93, evolvesToId: 94, evolvedName: 'Gengar', requiredFriendshipLevel: 5, description: 'Haunter salta das sombras como o sorridente Gengar!' },
  111: { pokemonId: 111, evolvesToId: 112, evolvedName: 'Rhydon', requiredFriendshipLevel: 5, description: 'Rhyhorn se levanta sobre duas pernas e evolui para Rhydon!' },
  129: { pokemonId: 129, evolvesToId: 130, evolvedName: 'Gyarados', requiredFriendshipLevel: 5, description: 'Magikarp salta a cachoeira mística e desperta como o titânico Gyarados!' },
  133: { pokemonId: 133, evolvesToId: 134, evolvedName: 'Vaporeon', requiredFriendshipLevel: 5, description: 'Eevee se sintoniza com as correntes de água e evolui para Vaporeon!' },
  147: { pokemonId: 147, evolvesToId: 148, evolvedName: 'Dragonair', requiredFriendshipLevel: 5, description: 'Dratini cresce em aura celestial e evolui para Dragonair!' },
  148: { pokemonId: 148, evolvesToId: 149, evolvedName: 'Dragonite', requiredFriendshipLevel: 5, description: 'Dragonair abraça o carinho e evolui para o generoso Dragonite!' },

  // Geração 2
  152: { pokemonId: 152, evolvesToId: 153, evolvedName: 'Bayleef', requiredFriendshipLevel: 5, description: 'Chikorita exala aroma de folhas frescas e evolui para Bayleef!' },
  153: { pokemonId: 153, evolvesToId: 154, evolvedName: 'Meganium', requiredFriendshipLevel: 5, description: 'Bayleef cura o ambiente e evolui para Meganium!' },
  155: { pokemonId: 155, evolvesToId: 156, evolvedName: 'Quilava', requiredFriendshipLevel: 5, description: 'Cyndaquil acende suas chamas de foco e evolui para Quilava!' },
  156: { pokemonId: 156, evolvesToId: 157, evolvedName: 'Typhlosion', requiredFriendshipLevel: 5, description: 'Quilava ruge com labaredas intensas e evolui para Typhlosion!' },
  158: { pokemonId: 158, evolvesToId: 159, evolvedName: 'Croconaw', requiredFriendshipLevel: 5, description: 'Totodile fortalece sua mordida enérgica e evolui para Croconaw!' },
  159: { pokemonId: 159, evolvesToId: 160, evolvedName: 'Feraligatr', requiredFriendshipLevel: 5, description: 'Croconaw domina as marés e evolui para Feraligatr!' },
  172: { pokemonId: 172, evolvesToId: 25, evolvedName: 'Pikachu', requiredFriendshipLevel: 5, description: 'Pichu se apega aos estudos com carinho e evolui para Pikachu!' },
  175: { pokemonId: 175, evolvesToId: 176, evolvedName: 'Togetic', requiredFriendshipLevel: 5, description: 'Togepi espalha alegria e evolui para Togetic!' },
  179: { pokemonId: 179, evolvesToId: 180, evolvedName: 'Flaaffy', requiredFriendshipLevel: 5, description: 'Mareep acumula eletricidade estática e evolui para Flaaffy!' },
  180: { pokemonId: 180, evolvesToId: 181, evolvedName: 'Ampharos', requiredFriendshipLevel: 5, description: 'Flaaffy brilha como um farol de luz e evolui para Ampharos!' },
  246: { pokemonId: 246, evolvesToId: 247, evolvedName: 'Pupitar', requiredFriendshipLevel: 5, description: 'Larvitar se fecha em casca vulcânica e evolui para Pupitar!' },
  247: { pokemonId: 247, evolvesToId: 248, evolvedName: 'Tyranitar', requiredFriendshipLevel: 5, description: 'Pupitar desperta a força da terra e evolui para Tyranitar!' },

  // Geração 3
  252: { pokemonId: 252, evolvesToId: 253, evolvedName: 'Grovyle', requiredFriendshipLevel: 5, description: 'Treecko aprimora seus reflexos rápidos e evolui para Grovyle!' },
  253: { pokemonId: 253, evolvesToId: 254, evolvedName: 'Sceptile', requiredFriendshipLevel: 5, description: 'Grovyle se torna o mestre da floresta e evolui para Sceptile!' },
  255: { pokemonId: 255, evolvesToId: 256, evolvedName: 'Combusken', requiredFriendshipLevel: 5, description: 'Torchic desfere chutes velozes e evolui para Combusken!' },
  256: { pokemonId: 256, evolvesToId: 257, evolvedName: 'Blaziken', requiredFriendshipLevel: 5, description: 'Combusken salta alto com garras ardentes e evolui para Blaziken!' },
  258: { pokemonId: 258, evolvesToId: 259, evolvedName: 'Marshtomp', requiredFriendshipLevel: 5, description: 'Mudkip firma seus passos e evolui para Marshtomp!' },
  259: { pokemonId: 259, evolvesToId: 260, evolvedName: 'Swampert', requiredFriendshipLevel: 5, description: 'Marshtomp domina o poder das enchentes e evolui para Swampert!' },
  280: { pokemonId: 280, evolvesToId: 281, evolvedName: 'Kirlia', requiredFriendshipLevel: 5, description: 'Ralts dança em harmonia mental e evolui para Kirlia!' },
  281: { pokemonId: 281, evolvesToId: 282, evolvedName: 'Gardevoir', requiredFriendshipLevel: 5, description: 'Kirlia abraça a devoção protetora e evolui para Gardevoir!' },
  287: { pokemonId: 287, evolvesToId: 288, evolvedName: 'Vigoroth', requiredFriendshipLevel: 5, description: 'Slakoth ganha energia inesgotável e evolui para Vigoroth!' },
  288: { pokemonId: 288, evolvesToId: 289, evolvedName: 'Slaking', requiredFriendshipLevel: 5, description: 'Vigoroth descansa majestoso com poder colossal e evolui para Slaking!' },
  371: { pokemonId: 371, evolvesToId: 372, evolvedName: 'Shelgon', requiredFriendshipLevel: 5, description: 'Bagon sonha em voar dentro de sua concha e evolui para Shelgon!' },
  372: { pokemonId: 372, evolvesToId: 373, evolvedName: 'Salamence', requiredFriendshipLevel: 5, description: 'Shelgon finalmente ganha asas e voa livre como Salamence!' },
  374: { pokemonId: 374, evolvesToId: 375, evolvedName: 'Metang', requiredFriendshipLevel: 5, description: 'Beldum se funde magneticamente e evolui para Metang!' },
  375: { pokemonId: 375, evolvesToId: 376, evolvedName: 'Metagross', requiredFriendshipLevel: 5, description: 'Metang atinge o processamento de um supercomputador e evolui para Metagross!' },

  // Geração 4+
  443: { pokemonId: 443, evolvesToId: 444, evolvedName: 'Gabite', requiredFriendshipLevel: 5, description: 'Gible mergulha veloz na areia e evolui para Gabite!' },
  444: { pokemonId: 444, evolvesToId: 445, evolvedName: 'Garchomp', requiredFriendshipLevel: 5, description: 'Gabite cruza o ar em velocidade sônica como Garchomp!' },
  447: { pokemonId: 447, evolvesToId: 448, evolvedName: 'Lucario', requiredFriendshipLevel: 5, description: 'Riolu sintoniza sua aura com o treinador e evolui para Lucario!' },
};

export function getEvolutionOption(pokemonId: number): EvolutionNode | null {
  return EVOLUTION_MAP[pokemonId] || null;
}
