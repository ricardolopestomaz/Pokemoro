import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request, ApiError } from '../api/client';
import { api } from '../api/endpoints';

describe('api/client.ts & api/endpoints.ts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('request deve retornar JSON quando resposta for 200 OK', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ status: 'ok' }),
    });

    const res = await request<{ status: string }>('/api/health');
    expect(res).toEqual({ status: 'ok' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/health'),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('request deve lançar ApiError com mensagem do backend em caso de erro HTTP', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'Você não possui biscoitos' }),
    });

    await expect(request('/api/coffee-break/feed')).rejects.toThrow(ApiError);
    await expect(request('/api/coffee-break/feed')).rejects.toThrow('Você não possui biscoitos');
  });

  it('getActiveBreak deve retornar null quando não houver break ativo', async () => {
    const result = await api.getActiveBreak();
    expect(result).toBeNull();
  });

  it('startSession deve chamar offlineEngine.startSession e retornar sessionId', async () => {
    const res = await api.startSession('subj-1', 'CLASSIC_25', 25);
    expect(res.sessionId).toBeDefined();
    expect(typeof res.sessionId).toBe('string');
  });

  it('feed deve chamar offlineEngine.feedPokemon', async () => {
    // Inicia uma sessão e finaliza para gerar um break
    await api.startSession('subj-1', 'CLASSIC_25', 25);
    await api.endSession({
      durationSeconds: 1500,
      completedNormally: true,
      distractionsCount: 0,
      mode: 'CLASSIC_25',
    });

    const activeBreak = await api.getActiveBreak();
    expect(activeBreak).not.toBeNull();
    if (activeBreak && activeBreak.spawns.length > 0) {
      const spawn = activeBreak.spawns[0];
      const res = await api.feed(spawn.spawnId, 'POKE');
      expect(res.pointsAdded).toBeGreaterThan(0);
    }
  });
});
