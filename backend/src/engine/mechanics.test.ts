import test from 'node:test';
import assert from 'node:assert/strict';
import { StudySessionRepository } from '../db/repositories/study-session.repository.js';
import { UserRepository } from '../db/repositories/user.repository.js';
import { PokemonRepository } from '../db/repositories/pokemon.repository.js';
import { CoffeeBreakService } from '../services/coffee-break.service.js';
import { closeDatabase } from '../db/client.js';
import crypto from 'crypto';

test('Mecânica: Bônus Deep Focus (1.2x se <= 60s fora do app, 1.0x se > 60s)', () => {
  const userRepo = new UserRepository();
  const sessionRepo = new StudySessionRepository();
  const userId = crypto.randomUUID();
  userRepo.createInitialUser(userId, 'Estudante Focado');

  const subject = sessionRepo.createSubject(userId, 'Física Quântica');

  // Sessão 1: Estudou 25m, saiu apenas 30s do app -> DEEP FOCUS 1.2x
  const s1 = sessionRepo.startSession(userId, {
    subjectId: subject.id,
    mode: 'CLASSIC_25',
    targetDurationMinutes: 25,
  });
  const sum1 = sessionRepo.completeSession(userId, {
    sessionId: s1.sessionId,
    actualDurationMinutes: 25,
    interruptedEarly: false,
    timeSpentOutOfAppSeconds: 30,
  }, 1);

  assert.equal(sum1.isDeepFocusEarned, true);
  assert.equal(sum1.deepFocusMultiplier, 1.2);

  // Sessão 2: Estudou 25m, mas saiu 90s (> 60s) -> SEM Deep Focus (1.0x)
  const s2 = sessionRepo.startSession(userId, {
    subjectId: subject.id,
    mode: 'CLASSIC_25',
    targetDurationMinutes: 25,
  });
  const sum2 = sessionRepo.completeSession(userId, {
    sessionId: s2.sessionId,
    actualDurationMinutes: 25,
    interruptedEarly: false,
    timeSpentOutOfAppSeconds: 90,
  }, 1);

  assert.equal(sum2.isDeepFocusEarned, false);
  assert.equal(sum2.deepFocusMultiplier, 1.0);
  assert.ok(sum1.focusPowerEarned > sum2.focusPowerEarned);
});

test('Mecânica: Biscoitos (Basic +1, Great +3, Master instantâneo) e Hungry (3x)', () => {
  const userRepo = new UserRepository();
  const pokemonRepo = new PokemonRepository();
  const coffeeBreak = new CoffeeBreakService(userRepo, pokemonRepo);

  const userId = crypto.randomUUID();
  userRepo.createInitialUser(userId, 'Treinador de Biscoito');

  // Dá estoque de biscoitos para teste
  userRepo.updateInventory(userId, { basic: 5, great: 2, master: 1 });

  // Cria um Coffee Break ativo com 1 Pokémon Faminto (Caterpie) e 1 Normal (Pikachu)
  coffeeBreak.setActiveCoffeeBreak(userId, 'sess_test_biscuit', 300, 'greengrass', [
    {
      spawnId: 'sp_caterpie_hungry',
      pokemonId: 10,
      pokemonName: 'Caterpie',
      variant: 'regular',
      sleepStyle: 1,
      currentFriendshipPoints: 0,
      maxFriendshipPoints: 5,
      isAlreadyRecruited: false,
      isHungry: true, // FAMINTO!
      isFull: false,
      spriteSleepUrl: 'sprites/sleep/regular/0010-1.png',
      spriteMenuUrl: 'sprites/menu/regular/0010.png',
      canvasPosition: { x: 0.5, y: 0.5 },
    },
    {
      spawnId: 'sp_pikachu_normal',
      pokemonId: 25,
      pokemonName: 'Pikachu',
      variant: 'regular',
      sleepStyle: 1,
      currentFriendshipPoints: 0,
      maxFriendshipPoints: 5,
      isAlreadyRecruited: false,
      isHungry: false, // NORMAL
      isFull: false,
      spriteSleepUrl: 'sprites/sleep/regular/0025-1.png',
      spriteMenuUrl: 'sprites/menu/regular/0025.png',
      canvasPosition: { x: 0.3, y: 0.3 },
    },
  ]);

  // 1. Alimenta Caterpie Faminto com Biscoito Básico: 1 ponto * 3 = 3 pontos!
  const feedHungry = coffeeBreak.feedPokemon(userId, 'sp_caterpie_hungry', 'BASIC');
  assert.equal(feedHungry.wasHungry, true);
  assert.equal(feedHungry.pointsAdded, 3);
  assert.equal(feedHungry.newFriendshipPoints, 3);

  // 2. Alimenta Pikachu Normal com Biscoito Great (+3 pontos)
  const feedGreat = coffeeBreak.feedPokemon(userId, 'sp_pikachu_normal', 'GREAT');
  assert.equal(feedGreat.wasHungry, false);
  assert.equal(feedGreat.pointsAdded, 3);
  assert.equal(feedGreat.newFriendshipPoints, 3);

  // 3. Alimenta Pikachu com Biscoito Master (Recrutamento instantâneo da barra inteira)
  // Garante que não está marcado como saciado para o teste do Master
  const pikachuSpawn = coffeeBreak.getActiveCoffeeBreak(userId)!.spawns.find((s) => s.spawnId === 'sp_pikachu_normal')!;
  pikachuSpawn.isFull = false;

  const feedMaster = coffeeBreak.feedPokemon(userId, 'sp_pikachu_normal', 'MASTER');
  assert.equal(feedMaster.isRecruited, true);
  assert.ok(feedMaster.recruitedPokemon);
  assert.equal(feedMaster.recruitedPokemon?.role, 'SUBJECT_EXACT');

  // 4. Testa a mecânica de Saciado (isFull = true deve lançar erro se tentar alimentar de novo)
  pikachuSpawn.isFull = true;
  assert.throws(
    () => coffeeBreak.feedPokemon(userId, 'sp_pikachu_normal', 'BASIC'),
    /Este Pokémon já está satisfeito/
  );
});

test('Mecânica: Equipe de 5 Study Buddies e Focus Dex', () => {
  const userRepo = new UserRepository();
  const pokemonRepo = new PokemonRepository();
  const userId = crypto.randomUUID();
  userRepo.createInitialUser(userId, 'Colecionador');

  // Recruta 6 Pokémon
  const p1 = pokemonRepo.recruitPokemon(userId, 10, 'Caterpie 1');
  const p2 = pokemonRepo.recruitPokemon(userId, 25, 'Pikachu 1');
  const p3 = pokemonRepo.recruitPokemon(userId, 1, 'Bulbasaur 1');
  const p4 = pokemonRepo.recruitPokemon(userId, 4, 'Charmander 1');
  const p5 = pokemonRepo.recruitPokemon(userId, 7, 'Squirtle 1');
  const p6 = pokemonRepo.recruitPokemon(userId, 133, 'Eevee 1');

  // Define equipe com 5 Pokémon (limite do jogo)
  pokemonRepo.setActiveTeam(userId, [p1.id, p2.id, p3.id, p4.id, p5.id]);

  const team = pokemonRepo.listUserPokemon(userId);
  assert.equal(team.length, 6);

  // Registra poses na Dex
  pokemonRepo.recordDexEntry(userId, 10, 1, false);
  pokemonRepo.recordDexEntry(userId, 10, 2, false);
  pokemonRepo.recordDexEntry(userId, 25, 1, true); // Shiny Pikachu!

  const dex = pokemonRepo.getFocusDex(userId);
  assert.ok(dex.totalDiscovered >= 3);
  assert.ok(dex.completionPercentage > 0);
  assert.ok(dex.entries.find((e: any) => e.pokemonId === 10)?.isRecruited);
});

test.after(() => {
  closeDatabase();
});
