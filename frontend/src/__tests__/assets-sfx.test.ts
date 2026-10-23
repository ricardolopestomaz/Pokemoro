import { describe, it, expect } from 'vitest';
import {
  formatTime,
  envUrl,
  sleepSprite,
  menuSprite,
  ENVIRONMENTS,
  STYLE_NAMES,
  ROLE_INFO,
} from '../lib/assets';
import { sfx, setMuted, isMuted } from '../lib/sfx';

describe('lib/assets.ts', () => {
  it('formatTime deve formatar segundos no formato MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(3000)).toBe('50:00');
  });

  it('formatTime deve tratar valores negativos arredondando para 00:00', () => {
    expect(formatTime(-10)).toBe('00:00');
  });

  it('envUrl deve retornar a URL correta para cenários conhecidos', () => {
    const greengrass = envUrl('greengrass');
    expect(greengrass).toContain('/assets/cenario_pokemon_sleep_9_16.png');

    const beach = envUrl('beach');
    expect(beach).toContain('/assets/cenario_praia_ciano.png');

    const tundra = envUrl('tundra');
    expect(tundra).toContain('/assets/cenario_tundra_neve.png');
  });

  it('envUrl deve retornar greengrass como fallback para cenários inexistentes', () => {
    const unknown = envUrl('cenario_inexistente');
    expect(unknown).toContain('/assets/cenario_pokemon_sleep_9_16.png');
  });

  it('sleepSprite deve gerar caminhos com 4 dígitos e sufixos de shiny', () => {
    // Regular
    const bulba = sleepSprite(1, 1, 'regular');
    expect(bulba).toContain('/sprites/sleep/regular/0001-1.png');

    // Shiny
    const pikachuShiny = sleepSprite(25, 2, 'shiny');
    expect(pikachuShiny).toContain('/sprites/sleep/shiny/0025-2_s.png');
  });

  it('menuSprite deve gerar caminhos de menu corretos', () => {
    const charmander = menuSprite(4, 'regular');
    expect(charmander).toContain('/sprites/menu/regular/0004.png');

    const squirtleShiny = menuSprite(7, 'shiny');
    expect(squirtleShiny).toContain('/sprites/menu/shiny/0007_s.png');
  });

  it('ENVIRONMENTS deve conter todos os 5 ambientes do Pokémoro', () => {
    expect(ENVIRONMENTS).toHaveProperty('greengrass');
    expect(ENVIRONMENTS).toHaveProperty('beach');
    expect(ENVIRONMENTS).toHaveProperty('tundra');
    expect(ENVIRONMENTS).toHaveProperty('cave');
    expect(ENVIRONMENTS).toHaveProperty('study_room');
  });

  it('STYLE_NAMES deve mapear estilos 1, 2 e 3 com descrições amigáveis', () => {
    expect(STYLE_NAMES[1]).toBe('Dormindo de Lado');
    expect(STYLE_NAMES[2]).toBe('Dormindo Aconchegado');
    expect(STYLE_NAMES[3]).toBe('Dormindo de Barriga');
  });

  it('ROLE_INFO deve cobrir todos os 5 papéis de estudo', () => {
    expect(ROLE_INFO.SUBJECT_EXACT.emoji).toBe('🛡️');
    expect(ROLE_INFO.STAMINA.emoji).toBe('🌿');
    expect(ROLE_INFO.ITEMS.emoji).toBe('☕');
    expect(ROLE_INFO.ENERGY.emoji).toBe('🔥');
    expect(ROLE_INFO.SUBJECT_HUMAN.emoji).toBe('🎯');
  });
});

describe('lib/sfx.ts', () => {
  it('deve disparar efeitos sonoros sem lançar exceções', () => {
    expect(() => sfx.tap()).not.toThrow();
    expect(() => sfx.start()).not.toThrow();
    expect(() => sfx.bell()).not.toThrow();
    expect(() => sfx.munch()).not.toThrow();
    expect(() => sfx.fanfare()).not.toThrow();
    expect(() => sfx.warn()).not.toThrow();
  });

  it('deve respeitar a função de mute', () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(() => sfx.tap()).not.toThrow();

    setMuted(false);
    expect(isMuted()).toBe(false);
  });
});
