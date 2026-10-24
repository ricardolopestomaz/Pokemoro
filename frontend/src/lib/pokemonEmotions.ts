export type PokemonEmotion = 'sad' | 'normal' | 'happy' | 'loving' | 'angry' | 'awake' | 'sleep' | 'music' | 'blush';

export interface PokemonReaction {
  emotion: PokemonEmotion;
  emoji: string;
  emoteSprite: string;
  wakesUp?: boolean;
}

/**
 * Retorna o sprite oficial do balão de emoção pixelado (Pokémon Mystery Dungeon)
 * e o emoji correspondente.
 * 
 * Mecânica de interação progressiva anti-spam:
 * - 1º e 2º cliques: Emoções de carinho e amizade (Loving Heart, Happy, Music, Sleep).
 * - 3º clique: Irritação / Raiva (Balão de fúria / rabisco de irritação).
 * - 4º clique: O Pokémon ACORDA assustado/espreguiçando (Balão de exclamação !) e fica acordado por ~8.5s!
 * - Ao acordar: só reage com emoji mais UMA vez enquanto acordado.
 */
export function getPokemonReaction(
  friendshipLevel: number = 1,
  streakDays: number = 0,
  clickStreak: number = 1,
  isCurrentlyAwake: boolean = false
): PokemonReaction {
  // Se já está acordado, reage com carinho ou cantoria
  if (isCurrentlyAwake) {
    const awakeChoices: { emotion: PokemonEmotion; emoteSprite: string; emoji: string }[] = [
      { emotion: 'blush', emoteSprite: '/sprites/emotes/blush.png', emoji: '🥰' },
      { emotion: 'happy', emoteSprite: '/sprites/emotes/happy.png', emoji: '😊' },
      { emotion: 'music', emoteSprite: '/sprites/emotes/music.png', emoji: '🎵' },
      { emotion: 'loving', emoteSprite: '/sprites/emotes/loving.png', emoji: '<3' },
    ];
    const choice = awakeChoices[Math.floor(Math.random() * awakeChoices.length)];
    return choice;
  }

  // 4º clique: Acorda com balão de exclamação (!)
  if (clickStreak >= 4) {
    return {
      emotion: 'awake',
      emoteSprite: '/sprites/emotes/awake.png',
      emoji: '❗',
      wakesUp: true,
    };
  }

  // 3º clique: Raiva / irritação por ser cutucado
  if (clickStreak === 3) {
    return {
      emotion: 'angry',
      emoteSprite: '/sprites/emotes/angry.png',
      emoji: '💢',
    };
  }

  // 2º clique: Carinho / Amor (Coração pixelado <3)
  if (clickStreak === 2) {
    return {
      emotion: 'loving',
      emoteSprite: '/sprites/emotes/loving.png',
      emoji: '<3',
    };
  }

  // 1º clique: Emoção baseada no estado de amizade e ofensiva
  if (friendshipLevel >= 4 || streakDays >= 3) {
    const highChoices = [
      { emotion: 'loving' as PokemonEmotion, emoteSprite: '/sprites/emotes/loving.png', emoji: '<3' },
      { emotion: 'happy' as PokemonEmotion, emoteSprite: '/sprites/emotes/happy.png', emoji: '😊' },
      { emotion: 'music' as PokemonEmotion, emoteSprite: '/sprites/emotes/music.png', emoji: '🎵' },
    ];
    return highChoices[Math.floor(Math.random() * highChoices.length)];
  }

  if (streakDays === 0 && friendshipLevel <= 1) {
    const sadChoices = [
      { emotion: 'sad' as PokemonEmotion, emoteSprite: '/sprites/emotes/sad.png', emoji: '💧' },
      { emotion: 'loving' as PokemonEmotion, emoteSprite: '/sprites/emotes/loving.png', emoji: '<3' },
    ];
    return sadChoices[Math.floor(Math.random() * sadChoices.length)];
  }

  const normalChoices = [
    { emotion: 'sleep' as PokemonEmotion, emoteSprite: '/sprites/emotes/sleep.png', emoji: '💤' },
    { emotion: 'happy' as PokemonEmotion, emoteSprite: '/sprites/emotes/happy.png', emoji: '😊' },
    { emotion: 'music' as PokemonEmotion, emoteSprite: '/sprites/emotes/music.png', emoji: '🎵' },
  ];
  return normalChoices[Math.floor(Math.random() * normalChoices.length)];
}

