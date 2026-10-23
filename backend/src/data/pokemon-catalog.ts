import { StudyRole } from '../dtos/team.dto.js';

export interface PokemonCatalogEntry {
  id: number;
  name: string;
  role: StudyRole;
  bonus: string;
}

export const AVAILABLE_POKEMON_CATALOG: Record<number, PokemonCatalogEntry> = {
  "1": {
    "id": 1,
    "name": "Bulbasaur",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "2": {
    "id": 2,
    "name": "Ivysaur",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "3": {
    "id": 3,
    "name": "Venusaur",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "4": {
    "id": 4,
    "name": "Charmander",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "5": {
    "id": 5,
    "name": "Charmeleon",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "6": {
    "id": 6,
    "name": "Charizard",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "7": {
    "id": 7,
    "name": "Squirtle",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "8": {
    "id": 8,
    "name": "Wartortle",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "9": {
    "id": 9,
    "name": "Blastoise",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "10": {
    "id": 10,
    "name": "Caterpie",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "11": {
    "id": 11,
    "name": "Metapod",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "12": {
    "id": 12,
    "name": "Butterfree",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "19": {
    "id": 19,
    "name": "Rattata",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "20": {
    "id": 20,
    "name": "Raticate",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "23": {
    "id": 23,
    "name": "Ekans",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "24": {
    "id": 24,
    "name": "Arbok",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "25": {
    "id": 25,
    "name": "Pikachu",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "26": {
    "id": 26,
    "name": "Raichu",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "27": {
    "id": 27,
    "name": "Sandshrew",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "28": {
    "id": 28,
    "name": "Sandslash",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "35": {
    "id": 35,
    "name": "Clefairy",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "36": {
    "id": 36,
    "name": "Clefable",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "37": {
    "id": 37,
    "name": "Vulpix",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "38": {
    "id": 38,
    "name": "Ninetales",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "39": {
    "id": 39,
    "name": "Jigglypuff",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "40": {
    "id": 40,
    "name": "Wigglytuff",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "50": {
    "id": 50,
    "name": "Diglett",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "51": {
    "id": 51,
    "name": "Dugtrio",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "52": {
    "id": 52,
    "name": "Meowth",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "53": {
    "id": 53,
    "name": "Persian",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "54": {
    "id": 54,
    "name": "Psyduck",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "55": {
    "id": 55,
    "name": "Golduck",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "56": {
    "id": 56,
    "name": "Mankey",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "57": {
    "id": 57,
    "name": "Primeape",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "58": {
    "id": 58,
    "name": "Growlithe",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "59": {
    "id": 59,
    "name": "Arcanine",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "69": {
    "id": 69,
    "name": "Bellsprout",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "70": {
    "id": 70,
    "name": "Weepinbell",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "71": {
    "id": 71,
    "name": "Victreebel",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "74": {
    "id": 74,
    "name": "Geodude",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "75": {
    "id": 75,
    "name": "Graveler",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "76": {
    "id": 76,
    "name": "Golem",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "79": {
    "id": 79,
    "name": "Slowpoke",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "80": {
    "id": 80,
    "name": "Slowbro",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "81": {
    "id": 81,
    "name": "Magnemite",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "82": {
    "id": 82,
    "name": "Magneton",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "83": {
    "id": 83,
    "name": "Farfetchd",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "84": {
    "id": 84,
    "name": "Doduo",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "85": {
    "id": 85,
    "name": "Dodrio",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "92": {
    "id": 92,
    "name": "Gastly",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "93": {
    "id": 93,
    "name": "Haunter",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "94": {
    "id": 94,
    "name": "Gengar",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "95": {
    "id": 95,
    "name": "Onix",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "104": {
    "id": 104,
    "name": "Cubone",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "105": {
    "id": 105,
    "name": "Marowak",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "113": {
    "id": 113,
    "name": "Chansey",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "115": {
    "id": 115,
    "name": "Kangaskhan",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "122": {
    "id": 122,
    "name": "Mr-mime",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "127": {
    "id": 127,
    "name": "Pinsir",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "132": {
    "id": 132,
    "name": "Ditto",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "133": {
    "id": 133,
    "name": "Eevee",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "134": {
    "id": 134,
    "name": "Vaporeon",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "135": {
    "id": 135,
    "name": "Jolteon",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "136": {
    "id": 136,
    "name": "Flareon",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "147": {
    "id": 147,
    "name": "Dratini",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "148": {
    "id": 148,
    "name": "Dragonair",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "149": {
    "id": 149,
    "name": "Dragonite",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "150": {
    "id": 150,
    "name": "Mewtwo",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "151": {
    "id": 151,
    "name": "Mew",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "152": {
    "id": 152,
    "name": "Chikorita",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "153": {
    "id": 153,
    "name": "Bayleef",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "154": {
    "id": 154,
    "name": "Meganium",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "155": {
    "id": 155,
    "name": "Cyndaquil",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "156": {
    "id": 156,
    "name": "Quilava",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "157": {
    "id": 157,
    "name": "Typhlosion",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "158": {
    "id": 158,
    "name": "Totodile",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "159": {
    "id": 159,
    "name": "Croconaw",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "160": {
    "id": 160,
    "name": "Feraligatr",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "172": {
    "id": 172,
    "name": "Pichu",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "173": {
    "id": 173,
    "name": "Cleffa",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "174": {
    "id": 174,
    "name": "Igglybuff",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "175": {
    "id": 175,
    "name": "Togepi",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "176": {
    "id": 176,
    "name": "Togetic",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "177": {
    "id": 177,
    "name": "Natu",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "178": {
    "id": 178,
    "name": "Xatu",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "179": {
    "id": 179,
    "name": "Mareep",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "180": {
    "id": 180,
    "name": "Flaaffy",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "181": {
    "id": 181,
    "name": "Ampharos",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "185": {
    "id": 185,
    "name": "Sudowoodo",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "194": {
    "id": 194,
    "name": "Wooper",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "195": {
    "id": 195,
    "name": "Quagsire",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "196": {
    "id": 196,
    "name": "Espeon",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "197": {
    "id": 197,
    "name": "Umbreon",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "198": {
    "id": 198,
    "name": "Murkrow",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "199": {
    "id": 199,
    "name": "Slowking",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "202": {
    "id": 202,
    "name": "Wobbuffet",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "208": {
    "id": 208,
    "name": "Steelix",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "213": {
    "id": 213,
    "name": "Shuckle",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "214": {
    "id": 214,
    "name": "Heracross",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "215": {
    "id": 215,
    "name": "Sneasel",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "225": {
    "id": 225,
    "name": "Delibird",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "228": {
    "id": 228,
    "name": "Houndour",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "229": {
    "id": 229,
    "name": "Houndoom",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "242": {
    "id": 242,
    "name": "Blissey",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "243": {
    "id": 243,
    "name": "Raikou",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "244": {
    "id": 244,
    "name": "Entei",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "245": {
    "id": 245,
    "name": "Suicune",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "246": {
    "id": 246,
    "name": "Larvitar",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "247": {
    "id": 247,
    "name": "Pupitar",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "248": {
    "id": 248,
    "name": "Tyranitar",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "252": {
    "id": 252,
    "name": "Treecko",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "253": {
    "id": 253,
    "name": "Grovyle",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "254": {
    "id": 254,
    "name": "Sceptile",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "255": {
    "id": 255,
    "name": "Torchic",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "256": {
    "id": 256,
    "name": "Combusken",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "257": {
    "id": 257,
    "name": "Blaziken",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "258": {
    "id": 258,
    "name": "Mudkip",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "259": {
    "id": 259,
    "name": "Marshtomp",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "260": {
    "id": 260,
    "name": "Swampert",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "280": {
    "id": 280,
    "name": "Ralts",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "281": {
    "id": 281,
    "name": "Kirlia",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "282": {
    "id": 282,
    "name": "Gardevoir",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "287": {
    "id": 287,
    "name": "Slakoth",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "288": {
    "id": 288,
    "name": "Vigoroth",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "289": {
    "id": 289,
    "name": "Slaking",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "302": {
    "id": 302,
    "name": "Sableye",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "303": {
    "id": 303,
    "name": "Mawile",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "304": {
    "id": 304,
    "name": "Aron",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "305": {
    "id": 305,
    "name": "Lairon",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "306": {
    "id": 306,
    "name": "Aggron",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "311": {
    "id": 311,
    "name": "Plusle",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "312": {
    "id": 312,
    "name": "Minun",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "316": {
    "id": 316,
    "name": "Gulpin",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "317": {
    "id": 317,
    "name": "Swalot",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "328": {
    "id": 328,
    "name": "Trapinch",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "329": {
    "id": 329,
    "name": "Vibrava",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "330": {
    "id": 330,
    "name": "Flygon",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "333": {
    "id": 333,
    "name": "Swablu",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "334": {
    "id": 334,
    "name": "Altaria",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "353": {
    "id": 353,
    "name": "Shuppet",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "354": {
    "id": 354,
    "name": "Banette",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "359": {
    "id": 359,
    "name": "Absol",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "360": {
    "id": 360,
    "name": "Wynaut",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "363": {
    "id": 363,
    "name": "Spheal",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "364": {
    "id": 364,
    "name": "Sealeo",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "365": {
    "id": 365,
    "name": "Walrein",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "371": {
    "id": 371,
    "name": "Bagon",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "372": {
    "id": 372,
    "name": "Shelgon",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "373": {
    "id": 373,
    "name": "Salamence",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "380": {
    "id": 380,
    "name": "Latias",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "381": {
    "id": 381,
    "name": "Latios",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "387": {
    "id": 387,
    "name": "Turtwig",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "388": {
    "id": 388,
    "name": "Grotle",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "389": {
    "id": 389,
    "name": "Torterra",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "390": {
    "id": 390,
    "name": "Chimchar",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "391": {
    "id": 391,
    "name": "Monferno",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "392": {
    "id": 392,
    "name": "Infernape",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "393": {
    "id": 393,
    "name": "Piplup",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "394": {
    "id": 394,
    "name": "Prinplup",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "395": {
    "id": 395,
    "name": "Empoleon",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "403": {
    "id": 403,
    "name": "Shinx",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "404": {
    "id": 404,
    "name": "Luxio",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "405": {
    "id": 405,
    "name": "Luxray",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "425": {
    "id": 425,
    "name": "Drifloon",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "426": {
    "id": 426,
    "name": "Drifblim",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "430": {
    "id": 430,
    "name": "Honchkrow",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "438": {
    "id": 438,
    "name": "Bonsly",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "439": {
    "id": 439,
    "name": "Mime-jr",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "440": {
    "id": 440,
    "name": "Happiny",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "442": {
    "id": 442,
    "name": "Spiritomb",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "447": {
    "id": 447,
    "name": "Riolu",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "448": {
    "id": 448,
    "name": "Lucario",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "453": {
    "id": 453,
    "name": "Croagunk",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "454": {
    "id": 454,
    "name": "Toxicroak",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "459": {
    "id": 459,
    "name": "Snover",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "460": {
    "id": 460,
    "name": "Abomasnow",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "461": {
    "id": 461,
    "name": "Weavile",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "462": {
    "id": 462,
    "name": "Magnezone",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "468": {
    "id": 468,
    "name": "Togekiss",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "470": {
    "id": 470,
    "name": "Leafeon",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "471": {
    "id": 471,
    "name": "Glaceon",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "475": {
    "id": 475,
    "name": "Gallade",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "488": {
    "id": 488,
    "name": "Cresselia",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "491": {
    "id": 491,
    "name": "Darkrai",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "517": {
    "id": 517,
    "name": "Munna",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "518": {
    "id": 518,
    "name": "Musharna",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "557": {
    "id": 557,
    "name": "Dwebble",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "558": {
    "id": 558,
    "name": "Crustle",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "627": {
    "id": 627,
    "name": "Rufflet",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "628": {
    "id": 628,
    "name": "Braviary",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "696": {
    "id": 696,
    "name": "Tyrunt",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "697": {
    "id": 697,
    "name": "Tyrantrum",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "700": {
    "id": 700,
    "name": "Sylveon",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "701": {
    "id": 701,
    "name": "Hawlucha",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "702": {
    "id": 702,
    "name": "Dedenne",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "710": {
    "id": 710,
    "name": "Pumpkaboo-average",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "711": {
    "id": 711,
    "name": "Gourgeist-average",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "714": {
    "id": 714,
    "name": "Noibat",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "715": {
    "id": 715,
    "name": "Noivern",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "736": {
    "id": 736,
    "name": "Grubbin",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "737": {
    "id": 737,
    "name": "Charjabug",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "738": {
    "id": 738,
    "name": "Vikavolt",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "742": {
    "id": 742,
    "name": "Cutiefly",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "743": {
    "id": 743,
    "name": "Ribombee",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "759": {
    "id": 759,
    "name": "Stufful",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "760": {
    "id": 760,
    "name": "Bewear",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "764": {
    "id": 764,
    "name": "Comfey",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "777": {
    "id": 777,
    "name": "Togedemaru",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "778": {
    "id": 778,
    "name": "Mimikyu-disguised",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "780": {
    "id": 780,
    "name": "Drampa",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "845": {
    "id": 845,
    "name": "Cramorant",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "848": {
    "id": 848,
    "name": "Toxel",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "849": {
    "id": 849,
    "name": "Toxtricity-amped",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "906": {
    "id": 906,
    "name": "Sprigatito",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "907": {
    "id": 907,
    "name": "Floragato",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "908": {
    "id": 908,
    "name": "Meowscarada",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "909": {
    "id": 909,
    "name": "Fuecoco",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "910": {
    "id": 910,
    "name": "Crocalor",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "911": {
    "id": 911,
    "name": "Skeledirge",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "912": {
    "id": 912,
    "name": "Quaxly",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "913": {
    "id": 913,
    "name": "Quaxwell",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "914": {
    "id": 914,
    "name": "Quaquaval",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "921": {
    "id": 921,
    "name": "Pawmi",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "922": {
    "id": 922,
    "name": "Pawmo",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "923": {
    "id": 923,
    "name": "Pawmot",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "957": {
    "id": 957,
    "name": "Tinkatink",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  },
  "958": {
    "id": 958,
    "name": "Tinkatuff",
    "role": "SUBJECT_HUMAN",
    "bonus": "+15% de Poder de Foco e concentração sem distrações"
  },
  "959": {
    "id": 959,
    "name": "Tinkaton",
    "role": "ITEMS",
    "bonus": "+15% de chance de coletar Biscoitos e Moedas durante o estudo"
  },
  "974": {
    "id": 974,
    "name": "Cetoddle",
    "role": "STAMINA",
    "bonus": "+10% de resistência e menor desgaste mental"
  },
  "975": {
    "id": 975,
    "name": "Cetitan",
    "role": "ENERGY",
    "bonus": "+15% de motivação e foco constante em sessões longas"
  },
  "980": {
    "id": 980,
    "name": "Clodsire",
    "role": "SUBJECT_EXACT",
    "bonus": "+15% de constância, retenção e ritmo de estudo"
  }
};

export const AVAILABLE_POKEMON_IDS: number[] = Object.keys(AVAILABLE_POKEMON_CATALOG).map(Number);

export const DEFAULT_AVAILABLE_ROSTER = Object.values(AVAILABLE_POKEMON_CATALOG).map(p => ({
  id: p.id,
  name: p.name,
}));
