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
