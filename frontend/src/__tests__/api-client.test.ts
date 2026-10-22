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

  it('getActiveBreak deve retornar null quando backend responder 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: 'Nenhum coffee break ativo' }),
    });

    const result = await api.getActiveBreak();
    expect(result).toBeNull();
  });

  it('startSession deve enviar payload com subjectId, mode e targetDurationMinutes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ sessionId: 'sess-123' }),
    });

    const res = await api.startSession('subj-1', 'CLASSIC_25', 25);
    expect(res.sessionId).toBe('sess-123');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/study/sessions/start'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ subjectId: 'subj-1', mode: 'CLASSIC_25', targetDurationMinutes: 25 }),
      })
    );
  });

  it('feed deve enviar spawnId e biscuitType corretamente', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ pointsAdded: 3, newFriendshipPoints: 5, isRecruited: true }),
    });

    const res = await api.feed('spawn-99', 'GREAT');
    expect(res.isRecruited).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/coffee-break/feed'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ spawnId: 'spawn-99', biscuitType: 'GREAT' }),
      })
    );
  });
});
