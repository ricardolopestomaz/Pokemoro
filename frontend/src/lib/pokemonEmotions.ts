export type PokemonEmotion = 'loving';

export interface PokemonReaction {
  emotion: 'loving';
  emoji: string;
  emoteSprite: string;
  wakesUp: false;
}

// Histórico de reações para taxa anti-spam rigorosa: máximo 2 a cada 5 minutos (300.000 ms)
const HEART_WINDOW_MS = 5 * 60 * 1000;
const MAX_HEARTS_PER_WINDOW = 2;
let reactionTimestamps: number[] = [];

/**
 * Verifica se uma nova reação de coração pode ser exibida respeitando a cota de 2 a cada 5 minutos.
 */
export function canTriggerHeartReaction(now: number = Date.now()): boolean {
  reactionTimestamps = reactionTimestamps.filter((t) => now - t < HEART_WINDOW_MS);
  return reactionTimestamps.length < MAX_HEARTS_PER_WINDOW;
}

/**
 * Registra o timestamp de uma reação de coração concedida.
 */
export function recordHeartReaction(now: number = Date.now()): boolean {
  if (!canTriggerHeartReaction(now)) {
    return false;
  }
  reactionTimestamps.push(now);
  return true;
}

/**
 * Zera o histórico de reações (útil para testes unitários).
 */
export function resetReactionRateLimiter(): void {
  reactionTimestamps = [];
}

/**
 * Retorna a reação suave, harmônica e exclusiva de coração (<3),
 * sem irritação, sem acordar por cliques insistentes e sem spam.
 */
export function getPokemonReaction(
  _friendshipLevel: number = 1,
  _streakDays: number = 0,
  _clickStreak: number = 1,
  _isCurrentlyAwake: boolean = false
): PokemonReaction {
  return {
    emotion: 'loving',
    emoji: '<3',
    emoteSprite: '/sprites/emotes/loving.png',
    wakesUp: false,
  };
}
