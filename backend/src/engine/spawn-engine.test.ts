import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSpawns } from './spawn-engine.js';

test('Spawn Engine: Focus Power baixo (<250) deve gerar exatamente 2 Pokémon', () => {
  const spawns = calculateSpawns({
    focusPower: 150,
    streakDays: 1,
  });

  assert.equal(spawns.length, 2);
  assert.equal(spawns[0].sleepStyle, 1);
  assert.ok(spawns[0].pokemonId > 0);
  assert.ok(spawns[0].spriteSleepUrl.includes('sprites/sleep/'));
});

test('Spawn Engine: Focus Power alto (>600) deve gerar 5 Pokémon', () => {
  const spawns = calculateSpawns({
    focusPower: 800,
    streakDays: 7,
  });

  assert.equal(spawns.length, 5);
  // Garante que não repete Pokémon na mesma sessão se a lista tiver opções
  const ids = spawns.map((s) => s.pokemonId);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, 5);
});

test('Spawn Engine: Deve respeitar amizade pré-existente sem zerar', () => {
  const existingFriendships = { 10: 4 }; // Caterpie com 4/5 corações
  const spawns = calculateSpawns({
    focusPower: 100,
    streakDays: 1,
    availablePokemon: [{ id: 10, name: 'Caterpie' }],
    existingFriendships,
  });

  assert.equal(spawns[0].pokemonId, 10);
  assert.equal(spawns[0].currentFriendshipPoints, 4);
  assert.equal(spawns[0].isAlreadyRecruited, false);
});

test('Spawn Engine: Pokémon recrutado só aparece em poses inéditas', () => {
  // Pikachu (25) já virou amigo e já teve poses 1 e 2 descobertas
  const spawns = calculateSpawns({
    focusPower: 300,
    streakDays: 3,
    availablePokemon: [{ id: 25, name: 'Pikachu' }],
    recruitedPokemonIds: [25],
    discoveredDexStyles: { 25: [1, 2] },
    forcedSpawnCount: 1,
  });

  assert.equal(spawns[0].pokemonId, 25);
  // OBRIGATORIAMENTE deve ser a pose 3 (única inédita)
  assert.equal(spawns[0].sleepStyle, 3);
});

test('Spawn Engine: Prioriza espécies com poses inéditas sobre Pokémon 100% completos', () => {
  // Caterpie (10) tem todas as 3 poses descobertas e é amigo
  // Bulbasaur (1) ainda tem poses a descobrir
  const spawns = calculateSpawns({
    focusPower: 200,
    streakDays: 2,
    availablePokemon: [
      { id: 10, name: 'Caterpie' },
      { id: 1, name: 'Bulbasaur' },
    ],
    recruitedPokemonIds: [10],
    discoveredDexStyles: { 10: [1, 2, 3], 1: [1] },
    forcedSpawnCount: 1,
  });

  // Deve priorizar Bulbasaur (que ainda tem poses inéditas)
  assert.equal(spawns[0].pokemonId, 1);
});

