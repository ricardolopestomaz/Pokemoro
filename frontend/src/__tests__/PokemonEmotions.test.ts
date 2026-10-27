import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPokemonReaction,
  canTriggerHeartReaction,
  recordHeartReaction,
  resetReactionRateLimiter,
} from '../lib/pokemonEmotions';

describe('Sistema de Emoções Harmônicas dos Pokémon (Apenas Coração Anti-Spam)', () => {
  beforeEach(() => {
    resetReactionRateLimiter();
  });

  it('deve gerar exclusivamente reação de amor e afeto (<3)', () => {
    const reaction = getPokemonReaction(1, 0, 1);
    expect(reaction.emotion).toBe('loving');
    expect(reaction.emoji).toBe('<3');
    expect(reaction.wakesUp).toBe(false);
  });

  it('NUNCA deve acordar o Pokémon nem gerar raiva por múltiplos cliques', () => {
    // Mesmo no 3º, 4º ou 10º clique, não acorda e não gera irritação
    const r3 = getPokemonReaction(1, 0, 3);
    expect(r3.emotion).toBe('loving');
    expect(r3.wakesUp).toBe(false);

    const r4 = getPokemonReaction(1, 0, 4);
    expect(r4.emotion).toBe('loving');
    expect(r4.wakesUp).toBe(false);
  });

  it('deve permitir no máximo 2 corações a cada 5 minutos (300.000 ms)', () => {
    const baseTime = 1000000;

    // 1ª reação: permitida
    expect(canTriggerHeartReaction(baseTime)).toBe(true);
    expect(recordHeartReaction(baseTime)).toBe(true);

    // 2ª reação: permitida
    expect(canTriggerHeartReaction(baseTime + 10000)).toBe(true);
    expect(recordHeartReaction(baseTime + 10000)).toBe(true);

    // 3ª tentativa no mesmo intervalo de 5 minutos: BLOQUEADA (anti-spam)
    expect(canTriggerHeartReaction(baseTime + 20000)).toBe(false);
    expect(recordHeartReaction(baseTime + 20000)).toBe(false);

    // Após 5 minutos (300.001 ms da 1ª reação): nova reação permitida
    const after5Min = baseTime + 5 * 60 * 1000 + 1000;
    expect(canTriggerHeartReaction(after5Min)).toBe(true);
    expect(recordHeartReaction(after5Min)).toBe(true);
  });
});
