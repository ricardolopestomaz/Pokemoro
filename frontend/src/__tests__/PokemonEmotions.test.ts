import { describe, it, expect } from 'vitest';
import { getPokemonReaction } from '../lib/pokemonEmotions';

describe('Sistema de Emoções dos Pokémon da Equipe', () => {
  it('deve gerar reações de afeto e amor (<3) no segundo toque', () => {
    const reaction = getPokemonReaction(2, 0, 2);
    expect(reaction.emotion).toBe('loving');
    expect(reaction.emoji).toBe('<3');
    expect(reaction.emoteSprite).toBe('/sprites/emotes/loving.png');
  });

  it('deve gerar reação de irritação/raiva no 3º toque consecutivo anti-spam', () => {
    const reaction = getPokemonReaction(1, 0, 3);
    expect(reaction.emotion).toBe('angry');
    expect(reaction.emoji).toBe('💢');
    expect(reaction.emoteSprite).toBe('/sprites/emotes/angry.png');
  });

  it('deve acordar o Pokémon no 4º toque consecutivo', () => {
    const reaction = getPokemonReaction(1, 0, 4);
    expect(reaction.emotion).toBe('awake');
    expect(reaction.emoji).toBe('❗');
    expect(reaction.emoteSprite).toBe('/sprites/emotes/awake.png');
    expect(reaction.wakesUp).toBe(true);
  });

  it('deve gerar reações especiais quando o Pokémon já está acordado', () => {
    const reaction = getPokemonReaction(1, 0, 1, true);
    expect(['happy', 'loving', 'blush', 'music']).toContain(reaction.emotion);
    expect(['🥰', '😊', '🎵', '<3']).toContain(reaction.emoji);
    expect(reaction.emoteSprite).toMatch(/^\/sprites\/emotes\/.+\.png$/);
  });

  it('deve gerar reação predominantemente feliz/amorosa para Pokémon com alta amizade ou ofensiva', () => {
    const reactionHigh = getPokemonReaction(4, 5, 1);
    expect(['happy', 'loving', 'music']).toContain(reactionHigh.emotion);
    expect(reactionHigh.emoteSprite).toMatch(/^\/sprites\/emotes\/.+\.png$/);
  });

  it('deve gerar reação triste ou carente quando ofensiva for 0 e amizade baixa', () => {
    const reactionSad = getPokemonReaction(1, 0, 1);
    expect(['sad', 'loving']).toContain(reactionSad.emotion);
    expect(['💧', '<3']).toContain(reactionSad.emoji);
    expect(reactionSad.emoteSprite).toMatch(/^\/sprites\/emotes\/.+\.png$/);
  });
});

