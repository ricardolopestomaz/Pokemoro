import { describe, it, expect, beforeEach } from 'vitest';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  getSupabaseClient,
} from '../lib/supabase';
import { syncQueue } from '../lib/sync-queue';

describe('Supabase Client & Conexão Híbrida Offline-First (Build-Time Security)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve ler credenciais exclusivamente das variáveis de ambiente de compilação (Build-Time)', () => {
    const creds = getSupabaseCredentials();
    expect(creds).toBeDefined();
    expect(typeof creds.url).toBe('string');
    expect(typeof creds.anonKey).toBe('string');
  });

  it('deve desativar e ignorar chamadas a saveSupabaseCredentials para proteger o localStorage', () => {
    saveSupabaseCredentials('https://fake-runtime-url.supabase.co', 'fake-key-12345678901234567890');

    expect(localStorage.getItem('pokemoro_supabase_url')).toBeNull();
    expect(localStorage.getItem('pokemoro_supabase_anon_key')).toBeNull();
  });

  it('deve reportar status consistente de configuração e cliente', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');

    const client = getSupabaseClient();
    if (configured) {
      expect(client).not.toBeNull();
    } else {
      expect(client).toBeNull();
    }
  });

  it('deve consultar o Leaderboard com fallback resiliente para armazenamento local', async () => {
    const leaderboard = await syncQueue.getLeaderboard({ timeframe: 'weekly' });
    expect(leaderboard).not.toBeNull();
    expect(leaderboard.entries.length).toBeGreaterThan(0);
    expect(leaderboard.userSummary).toBeDefined();
    expect(leaderboard.entries[0].rank).toBe(1);
    expect(leaderboard.entries[0].minutesStudied).toBeGreaterThan(0);
  });

  it('deve sincronizar a fila localmente com sucesso mesmo em modo offline', async () => {
    syncQueue.enqueue({
      clientSessionId: 'sess-cloud-test-01',
      mode: 'CLASSIC_25',
      actualDurationMinutes: 25,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isDeepFocus: true,
      streakDays: 3,
      appVersion: '1.0.0',
    }, false);

    const res = await syncQueue.flushQueue();
    expect(res).not.toBeNull();
    expect(res?.success).toBe(true);
    expect(res?.processedSessionIds).toContain('sess-cloud-test-01');
    expect(syncQueue.getPending().length).toBe(0);
  });
});
