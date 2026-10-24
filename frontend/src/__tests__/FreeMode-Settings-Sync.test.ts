import { describe, it, expect, beforeEach } from 'vitest';
import { offlineEngine } from '../lib/offline-engine';
import { loadSettings, saveSettings, LOW_POWER_PRESET, DEFAULT_SETTINGS } from '../lib/settings';
import { syncQueue } from '../lib/sync-queue';

describe('Validação Rigorosa do Modo Livre (Cronômetro sem Meta)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve BLOQUEAR Coffee Break e retornar 0 Pokémon quando o Modo Livre durar menos de 10 minutos', () => {
    offlineEngine.startSession('default', 'FREE_STOPWATCH', 0);
    
    // Simula encerramento após 5 minutos de foco livre
    const summary = offlineEngine.endSession({
      sessionId: 'test-free-under-10',
      mode: 'FREE_STOPWATCH',
      actualDurationMinutes: 5,
      interruptedEarly: true,
      timeSpentOutOfAppSeconds: 10,
    });

    expect(summary.minutesLogged).toBe(5);
    expect(summary.isCoffeeBreakUnlocked).toBe(false);
    expect(summary.spawnsCount).toBe(0);
    expect(summary.focusCoinsEarned).toBeGreaterThan(0); // Apenas moedas
    expect(offlineEngine.getActiveBreak()).toBeNull();
  });

  it('deve LIBERAR Coffee Break com EXATAMENTE 1 Pokémon quando o Modo Livre alcançar 10 minutos ou mais', () => {
    offlineEngine.startSession('default', 'FREE_STOPWATCH', 0);

    // Simula encerramento com 12 minutos de foco livre sem interrupção precoce
    const summary = offlineEngine.endSession({
      sessionId: 'test-free-10-plus',
      mode: 'FREE_STOPWATCH',
      actualDurationMinutes: 12,
      interruptedEarly: false,
      timeSpentOutOfAppSeconds: 10,
    });

    expect(summary.minutesLogged).toBe(12);
    expect(summary.isCoffeeBreakUnlocked).toBe(true);
    expect(summary.spawnsCount).toBe(1); // Exatamente 1 criatura para o modo livre
    
    const activeBreak = offlineEngine.getActiveBreak();
    expect(activeBreak).not.toBeNull();
    expect(activeBreak?.spawns.length).toBe(1);
  });
});

describe('Gerenciador de Configurações para Low-End Devices', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve carregar as configurações padrão quando nada foi salvo', () => {
    const settings = loadSettings();
    expect(settings.lowPowerMode).toBe(false);
    expect(settings.enableFoilEffect).toBe(true);
    expect(settings.enableConfetti).toBe(true);
  });

  it('deve salvar e carregar o preset do Modo Econômico (Low Power)', () => {
    saveSettings(LOW_POWER_PRESET);
    const settings = loadSettings();
    expect(settings.lowPowerMode).toBe(true);
    expect(settings.enableFoilEffect).toBe(false);
    expect(settings.enableConfetti).toBe(false);
    expect(settings.enableTeamRoaming).toBe(false);
    expect(settings.enableVisualEffects).toBe(false);
  });
});

describe('Fila de Sincronização Offline-First e Leaderboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve enfileirar sessões localmente sem duplicidade de clientSessionId', () => {
    syncQueue.enqueue({
      clientSessionId: 'sess-uuid-01',
      mode: 'CLASSIC_25',
      actualDurationMinutes: 25,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isDeepFocus: true,
      streakDays: 1,
      appVersion: '1.0.0',
    }, false);

    // Tenta reinserir o mesmo ID
    syncQueue.enqueue({
      clientSessionId: 'sess-uuid-01',
      mode: 'CLASSIC_25',
      actualDurationMinutes: 25,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isDeepFocus: true,
      streakDays: 1,
      appVersion: '1.0.0',
    }, false);

    const pending = syncQueue.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].clientSessionId).toBe('sess-uuid-01');
  });

  it('deve esvaziar a fila ao sincronizar com sucesso', async () => {
    syncQueue.enqueue({
      clientSessionId: 'sess-flush-01',
      mode: 'EXTENDED_50',
      actualDurationMinutes: 50,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isDeepFocus: true,
      streakDays: 2,
      appVersion: '1.0.0',
    }, false);

    const res = await syncQueue.flushQueue();
    expect(res).not.toBeNull();
    expect(res?.success).toBe(true);
    expect(res?.processedSessionIds).toContain('sess-flush-01');
    expect(syncQueue.getPending().length).toBe(0);
  });

  it('deve consultar o Leaderboard ordenado', async () => {
    const leaderboard = await syncQueue.getLeaderboard({ timeframe: 'weekly' });
    expect(leaderboard.entries.length).toBeGreaterThan(0);
    expect(leaderboard.entries[0].rank).toBe(1);
  });
});
