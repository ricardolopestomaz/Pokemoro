import { describe, it, expect } from 'vitest';
import {
  formatLocalDate,
  getDaysDifference,
  splitSessionAcrossDays,
  evaluateStreakOnSession,
  isStreakBroken,
  getStreakStatus,
} from '../lib/date-utils';

describe('date-utils & Regras de Ofensiva / Diário', () => {
  describe('splitSessionAcrossDays', () => {
    it('deve dividir dinamicamente uma sessão que começou sábado e terminou domingo', () => {
      // Começou sábado 24/10/2026 às 23:45 e terminou domingo 25/10/2026 às 00:15 (30 minutos)
      const startedAt = new Date(2026, 9, 24, 23, 45, 0).toISOString();
      const completedAt = new Date(2026, 9, 25, 0, 15, 0).toISOString();

      const splits = splitSessionAcrossDays({
        startedAt,
        completedAt,
        actualDurationMinutes: 30,
      });

      expect(splits).toHaveLength(2);
      expect(splits[0].dateStr).toBe('2026-10-24');
      expect(splits[0].minutes).toBe(15);

      expect(splits[1].dateStr).toBe('2026-10-25');
      expect(splits[1].minutes).toBe(15);
    });

    it('deve dividir proporcionalmente se a sessão começou às 23:50 e terminou às 00:15 (25 minutos)', () => {
      const startedAt = new Date(2026, 9, 24, 23, 50, 0).toISOString();
      const completedAt = new Date(2026, 9, 25, 0, 15, 0).toISOString();

      const splits = splitSessionAcrossDays({
        startedAt,
        completedAt,
        actualDurationMinutes: 25,
      });

      expect(splits).toHaveLength(2);
      expect(splits[0].dateStr).toBe('2026-10-24');
      expect(splits[0].minutes).toBe(10); // 23:50 até 00:00 = 10 min

      expect(splits[1].dateStr).toBe('2026-10-25');
      expect(splits[1].minutes).toBe(15); // 00:00 até 00:15 = 15 min
    });

    it('deve manter todos os minutos no mesmo dia se a sessão não atravessou a meia-noite', () => {
      const startedAt = new Date(2026, 9, 24, 14, 0, 0).toISOString();
      const completedAt = new Date(2026, 9, 24, 14, 25, 0).toISOString();

      const splits = splitSessionAcrossDays({
        startedAt,
        completedAt,
        actualDurationMinutes: 25,
      });

      expect(splits).toHaveLength(1);
      expect(splits[0].dateStr).toBe('2026-10-24');
      expect(splits[0].minutes).toBe(25);
    });
  });

  describe('evaluateStreakOnSession (Regra Duolingo)', () => {
    it('deve creditar a ofensiva para o dia em que o estudo COMEÇOU', () => {
      // Se começou no sábado (2026-10-24)
      const res = evaluateStreakOnSession(2, '2026-10-23', '2026-10-24', true);
      expect(res.newStreak).toBe(3);
      expect(res.streakKept).toBe(true);
      expect(res.newLastStudyDate).toBe('2026-10-24');
    });

    it('não deve contar o domingo ainda se a sessão foi iniciada no sábado', () => {
      // Usuário tinha streak 3 e última data 2026-10-23 (sexta)
      // Estudou no sábado às 23:45 e terminou no domingo às 00:15.
      // O início foi 2026-10-24 (sábado).
      const res = evaluateStreakOnSession(3, '2026-10-23', '2026-10-24', true);

      expect(res.newLastStudyDate).toBe('2026-10-24');
      // No domingo (2026-10-25), o status da ofensiva indica que o domingo NÃO foi completado ainda
      const sundayStatus = getStreakStatus(res.newStreak, res.newLastStudyDate, '2026-10-25');
      expect(sundayStatus.activeToday).toBe(false); // Foguinho de domingo NÃO foi contado ainda!
      expect(sundayStatus.pendingToday).toBe(true); // Está pendente para o domingo
      expect(sundayStatus.streakDays).toBe(4); // Sequência de 4 dias preservada de sábado
    });

    it('só deve creditar o domingo após uma sessão cujo início seja domingo', () => {
      // Sessão de domingo realizada
      const resSunday = evaluateStreakOnSession(4, '2026-10-24', '2026-10-25', true);
      expect(resSunday.newStreak).toBe(5);
      expect(resSunday.newLastStudyDate).toBe('2026-10-25');

      const sundayStatus = getStreakStatus(resSunday.newStreak, resSunday.newLastStudyDate, '2026-10-25');
      expect(sundayStatus.activeToday).toBe(true); // Foguinho do domingo agora sim está aceso!
      expect(sundayStatus.pendingToday).toBe(false);
    });
  });

  describe('isStreakBroken & Zerar à meia-noite', () => {
    it('não deve quebrar a ofensiva no dia seguinte (domingo) se estudou no sábado', () => {
      // Estudou sábado (24), hoje é domingo (25): ainda há tempo de estudar
      expect(isStreakBroken('2026-10-24', '2026-10-25')).toBe(false);
    });

    it('deve quebrar a ofensiva se o dia de ontem passou sem nenhum estudo (segunda-feira 00:00)', () => {
      // Estudou no sábado (24), mas domingo (25) passou em branco.
      // Agora é segunda-feira (26). A ofensiva deve ser zerada!
      expect(isStreakBroken('2026-10-24', '2026-10-26')).toBe(true);
    });

    it('deve zerar o status da ofensiva quando a data de estudo tiver estourado o prazo', () => {
      const status = getStreakStatus(5, '2026-10-24', '2026-10-26');
      expect(status.isZero).toBe(true);
      expect(status.streakDays).toBe(0);
      expect(status.activeToday).toBe(false);
      expect(status.pendingToday).toBe(false);
    });
  });
});
