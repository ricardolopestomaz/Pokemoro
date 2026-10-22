import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { closeDatabase } from './db/client.js';
import http from 'http';

test('API REST: Teste de ponta a ponta dos endpoints HTTP', async () => {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.status, 'ok');

    // 2. Perfil do usuário
    const profileRes = await fetch(`${baseUrl}/api/user/profile`);
    const profileJson = await profileRes.json();
    assert.ok(profileJson.id);
    assert.ok(profileJson.activeEnvironment);

    // 3. Criar matéria de estudo
    const subjectRes = await fetch(`${baseUrl}/api/study/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Direito Constitucional', color: '#3F51B5' }),
    });
    const subjectJson = await subjectRes.json();
    assert.ok(subjectJson.id);
    assert.equal(subjectJson.name, 'Direito Constitucional');

    // 4. Iniciar sessão Pomodoro
    const startRes = await fetch(`${baseUrl}/api/study/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: subjectJson.id,
        mode: 'CLASSIC_25',
        targetDurationMinutes: 25,
      }),
    });
    const startJson = await startRes.json();
    assert.ok(startJson.sessionId);

    // 5. Finalizar sessão Pomodoro com Deep Focus
    const endRes = await fetch(`${baseUrl}/api/study/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: startJson.sessionId,
        actualDurationMinutes: 25,
        interruptedEarly: false,
        timeSpentOutOfAppSeconds: 15, // Ganha bônus Deep Focus
      }),
    });
    const endJson = await endRes.json();
    assert.equal(endJson.isDeepFocusEarned, true);
    assert.equal(endJson.isCoffeeBreakUnlocked, true);
    assert.ok(endJson.spawnsCount >= 2);

    // 6. Consultar Coffee Break ativo com os Pokémon descansando
    const breakRes = await fetch(`${baseUrl}/api/coffee-break/active`);
    const breakJson = await breakRes.json();
    assert.equal(breakJson.sessionId, startJson.sessionId);
    assert.ok(breakJson.spawns.length >= 2);

    // 7. Alimentar o primeiro Pokémon com biscoito de café
    const firstSpawn = breakJson.spawns[0];
    const feedRes = await fetch(`${baseUrl}/api/coffee-break/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spawnId: firstSpawn.spawnId,
        biscuitType: 'BASIC',
      }),
    });
    const feedJson = await feedRes.json();
    assert.ok(feedJson.pointsAdded >= 1);
    assert.equal(feedJson.spawnId, firstSpawn.spawnId);

    // 8. Equipe ativa e Focus Dex
    const teamRes = await fetch(`${baseUrl}/api/team`);
    const teamJson = await teamRes.json();
    assert.ok(Array.isArray(teamJson.activeTeam));

    const dexRes = await fetch(`${baseUrl}/api/team/dex`);
    const dexJson = await dexRes.json();
    assert.ok(dexJson.totalDiscovered >= 2);
    assert.ok(dexJson.entries.length > 0);

    // 9. Verificar que os minutos da matéria foram acumulados
    const subjectsRes = await fetch(`${baseUrl}/api/study/subjects`);
    const subjectsJson = await subjectsRes.json();
    const updatedSub = subjectsJson.find((s: any) => s.id === subjectJson.id);
    assert.equal(updatedSub.totalMinutes, 25);

    // 10. Troca de cenário (ex: beach)
    const envRes = await fetch(`${baseUrl}/api/user/environment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: 'beach' }),
    });
    const envJson = await envRes.json();
    assert.equal(envJson.activeEnvironment, 'beach');

    // 11. Compra de biscoito com Moedas de Foco
    const buyRes = await fetch(`${baseUrl}/api/user/biscuits/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biscuitType: 'BASIC', quantity: 1 }),
    });
    const buyJson = await buyRes.json();
    assert.ok(buyJson.inventory.basic >= 1);

    // 12. Sessão interrompida (Penalidade gentil: salva minutos mas bloqueia Coffee Break)
    const start2 = await fetch(`${baseUrl}/api/study/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: subjectJson.id,
        mode: 'CLASSIC_25',
        targetDurationMinutes: 25,
      }),
    }).then((r) => r.json());

    const end2 = await fetch(`${baseUrl}/api/study/sessions/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: start2.sessionId,
        actualDurationMinutes: 12,
        interruptedEarly: true,
        timeSpentOutOfAppSeconds: 10,
      }),
    }).then((r) => r.json());

    assert.equal(end2.minutesLogged, 12);
    assert.equal(end2.isCoffeeBreakUnlocked, false);
    assert.equal(end2.spawnsCount, 0);
  } finally {
    server.close();
    closeDatabase();
  }
});
