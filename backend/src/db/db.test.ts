import test from 'node:test';
import assert from 'node:assert/strict';
import { UserRepository } from './repositories/user.repository.js';
import { StudySessionRepository } from './repositories/study-session.repository.js';
import { PokemonRepository } from './repositories/pokemon.repository.js';
import { calculateSpawns } from '../engine/spawn-engine.js';
import { closeDatabase } from './client.js';

test('Database & Repository: Fluxo completo de estudo, ofensiva e amizade', () => {
  const userRepo = new UserRepository();
  const sessionRepo = new StudySessionRepository();
  const pokemonRepo = new PokemonRepository();

  // 1. Cria usuário inicial
  const user = userRepo.createInitialUser(crypto.randomUUID(), 'Ash Estudioso');
  assert.ok(user.id);
  assert.equal(user.streakDays, 0);
  assert.equal(user.inventory.basic, 3);

  // 2. Registra ofensiva de estudo de hoje
  const today = new Date().toISOString().split('T')[0];
  const { newStreak, kept } = userRepo.updateStreak(user.id, today);
  assert.equal(newStreak, 1);
  assert.equal(kept, true);

  // 3. Cria matéria e inicia/completa um Pomodoro de 25m com Deep Focus
  const subject = sessionRepo.createSubject(user.id, 'Matemática');
  assert.ok(subject.id);

  const sessionStart = sessionRepo.startSession(user.id, {
    subjectId: subject.id,
    mode: 'CLASSIC_25',
    targetDurationMinutes: 25,
  });

  const sessionSummary = sessionRepo.completeSession(
    user.id,
    {
      sessionId: sessionStart.sessionId,
      actualDurationMinutes: 25,
      interruptedEarly: false,
      timeSpentOutOfAppSeconds: 20, // Menos de 60s -> Ganha Deep Focus 1.2x
    },
    newStreak
  );

  assert.equal(sessionSummary.isDeepFocusEarned, true);
  assert.equal(sessionSummary.deepFocusMultiplier, 1.2);
  assert.ok(sessionSummary.focusPowerEarned > 250);
  assert.equal(sessionSummary.isCoffeeBreakUnlocked, true);

  // 4. Sorteia os Pokémon que vieram descansar no intervalo
  const friendships = pokemonRepo.getFriendshipPointsMap(user.id);
  const spawns = calculateSpawns({
    focusPower: sessionSummary.focusPowerEarned,
    streakDays: newStreak,
    existingFriendships: friendships,
  });

  assert.ok(spawns.length >= 3);

  // 5. Alimenta o primeiro Pokémon com biscoito de café (+1 ponto)
  const targetPokemon = spawns[0];
  const feedResult = pokemonRepo.feedPokemon(user.id, targetPokemon.pokemonId, 1);
  assert.ok(feedResult.newPoints >= 1);

  // 6. Alimenta até recrutar (ex: 5 pontos)
  const finalFeed = pokemonRepo.feedPokemon(user.id, targetPokemon.pokemonId, 5);
  assert.equal(finalFeed.isRecruited, true);

  const recruited = pokemonRepo.recruitPokemon(
    user.id,
    targetPokemon.pokemonId,
    `Meu ${targetPokemon.pokemonName}`
  );
  assert.ok(recruited.id);

  // 7. Adiciona à equipe de 5 Study Buddies
  pokemonRepo.setActiveTeam(user.id, [recruited.id]);
  const userTeam = pokemonRepo.listUserPokemon(user.id);
  assert.equal(userTeam.length, 1);
  assert.equal(userTeam[0].pokemonId, targetPokemon.pokemonId);
});

test.after(() => {
  closeDatabase();
});
