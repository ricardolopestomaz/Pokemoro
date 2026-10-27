import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSpawns, rollPokemonSpawns } from './spawn-engine.js';

test('Spawn Engine: Focus Power baixo (<250) deve gerar exatamente 2 Pokémon', () => {
  const spawns = calculateSpawns({
    focusPower: 150,
    streakDays: 1,
  });

  assert.equal(spawns.length, 2);
  assert.ok(spawns[0].sleepStyle >= 1 && spawns[0].sleepStyle <= 3);
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

test('rollPokemonSpawns: T < 50 min (ex: 25 min) deve gerar 0 Pokémon', () => {
  const spawns25 = rollPokemonSpawns(25);
  assert.equal(spawns25.length, 0);

  const spawns49 = rollPokemonSpawns(49);
  assert.equal(spawns49.length, 0);
});

test('rollPokemonSpawns: 50 <= T < 120 min deve gerar exatamente 1 Pokémon com expiração de 30 min e 0% shiny', () => {
  const now = 1700000000000;
  // Sorteio com randomFn determinístico
  const spawns = rollPokemonSpawns(60, {
    now,
    randomFn: () => 0.1, // 10% -> Categoria Base (85% de chance)
  });

  assert.equal(spawns.length, 1);
  assert.equal(spawns[0].variant, 'regular');
  assert.equal(spawns[0].spawnedAt, now);
  assert.equal(spawns[0].expiresAt, now + 30 * 60 * 1000);
});

test('rollPokemonSpawns: 120 <= T < 180 min deve gerar 2 Pokémon com 1% de chance de Shiny', () => {
  const now = 1700000000000;
  // Simula roll de shiny < 1% (0.005)
  const spawns = rollPokemonSpawns(150, {
    now,
    randomFn: () => 0.005, // 0.5 < 1 -> isShiny = true
  });

  assert.equal(spawns.length, 2);
  assert.equal(spawns[0].variant, 'shiny');
  assert.ok(spawns[0].spriteSleepUrl.includes('_s.png'));
  assert.equal(spawns[0].expiresAt, now + 30 * 60 * 1000);
});

test('rollPokemonSpawns: 240 <= T < 300 min (4h) permite Pseudo-Lendário e Lendário', () => {
  // Sorteia Lendário (99 no roll 0-100 para categoria)
  const spawns = rollPokemonSpawns(250, {
    randomFn: () => 0.99,
  });

  assert.equal(spawns.length, 2);
  assert.ok(spawns[0].pokemonId > 0);
  assert.ok([1, 2, 3].includes(spawns[0].sleepStyle));
});

test('rollPokemonSpawns: T >= 360 min (6h+) gera 2 Pokémon com 50% de chance de Shiny', () => {
  // Com roll 0.40 (< 50%), deve ser shiny
  const spawns = rollPokemonSpawns(360, {
    randomFn: () => 0.40,
  });

  assert.equal(spawns.length, 2);
  assert.equal(spawns[0].variant, 'shiny');
});


