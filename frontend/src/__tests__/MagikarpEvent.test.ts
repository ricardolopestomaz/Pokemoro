import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getTimelineForYear,
  determineActiveEventState,
  getMagikarpMilestones,
  saveDevOverride,
} from '../lib/events/magikarpCalendar';
import {
  getLocalUserEventProgress,
  saveLocalUserEventProgress,
  recordEventMinutes,
  claimEventMilestone,
  recordMiniGameJump,
} from '../lib/events/magikarpStorage';

describe('Dia do Magikarp: Calendário Anual Perpétuo & Regras', () => {
  beforeEach(() => {
    localStorage.clear();
    saveDevOverride(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve calcular a linha do tempo perpétua anual com início 72h antes (12 de Novembro)', () => {
    const timeline2026 = getTimelineForYear(2026);
    expect(timeline2026.cycleYear).toBe(2026);

    const teaserDate = new Date(timeline2026.teaserStartsAt);
    const eventDate = new Date(timeline2026.eventStartsAt);
    const climaxDate = new Date(timeline2026.climaxStartsAt);
    const eventEndDate = new Date(timeline2026.eventEndsAt);
    const postEventEndDate = new Date(timeline2026.postEventEndsAt);

    // Teaser começa 72 horas antes do evento
    const diffHours = (eventDate.getTime() - teaserDate.getTime()) / (3600 * 1000);
    expect(diffHours).toBe(72);

    // Clímax inicia 20 horas após o início do Dia D
    const climaxOffset = (climaxDate.getTime() - eventDate.getTime()) / (3600 * 1000);
    expect(climaxOffset).toBe(20);

    // O Dia D dura exatamente 24 horas
    const duration = (eventEndDate.getTime() - eventDate.getTime()) / (3600 * 1000);
    expect(duration).toBe(24);

    // Rescaldo dura 48 horas após o fim do evento
    const postDuration = (postEventEndDate.getTime() - eventEndDate.getTime()) / (3600 * 1000);
    expect(postDuration).toBe(48);
  });

  it('deve identificar a fase inactive quando longe da data do evento', () => {
    // 1 de Julho de 2026
    const mockDate = new Date('2026-07-01T12:00:00Z');
    const state = determineActiveEventState(mockDate, {});

    expect(state.currentPhase).toBe('inactive');
    expect(state.isRainVisualActive).toBe(false);
    expect(state.isDoubleCoinsActive).toBe(false);
  });

  it('deve entrar na fase teaser 72h antes e ativar contagem regressiva e poças', () => {
    // 13 de Novembro de 2026 (dentro das 72h antes de 15/11)
    const mockDate = new Date('2026-11-13T10:00:00.000Z');
    const state = determineActiveEventState(mockDate, {});

    expect(state.currentPhase).toBe('teaser');
    expect(state.isTeaserVisualActive).toBe(true);
    expect(state.isRainVisualActive).toBe(false);
  });

  it('deve entrar na fase live no dia do evento (15 de Novembro) ativando chuva e 2x moedas', () => {
    // 15 de Novembro às 10h00 BRT
    const mockDate = new Date('2026-11-15T13:00:00.000Z');
    const state = determineActiveEventState(mockDate, {});

    expect(state.currentPhase).toBe('live');
    expect(state.isRainVisualActive).toBe(true);
    expect(state.isDoubleCoinsActive).toBe(true);
  });

  it('deve calcular a meta comunitária dinâmica de forma proporcional aos usuários', () => {
    const mockDate = new Date('2026-11-15T13:00:00.000Z');

    // Cenário 1: 2 usuários -> piso de segurança de 300 min (2 x 120 = 240 < 300)
    const state2Users = determineActiveEventState(mockDate, { simulatedUsersCount: 2, simulatedCommunityMinutes: 282 });
    expect(state2Users.communityGoal.targetMinutes).toBe(300);
    expect(state2Users.communityGoal.currentCommunityMinutes).toBe(282);
    expect(state2Users.communityGoal.progressPercentage).toBe(94);
    expect(state2Users.communityGoal.isTargetAchieved).toBe(false);

    // Cenário 2: 5 usuários -> 5 x 120 = 600 min
    const state5Users = determineActiveEventState(mockDate, { simulatedUsersCount: 5, simulatedCommunityMinutes: 600 });
    expect(state5Users.communityGoal.targetMinutes).toBe(600);
    expect(state5Users.communityGoal.progressPercentage).toBe(100);
    expect(state5Users.communityGoal.isTargetAchieved).toBe(true);
  });

  it('deve respeitar overrides de desenvolvimento (forcePhase e simulações)', () => {
    const override = {
      forcePhase: 'climax' as const,
      simulatedCommunityMinutes: 300,
      simulatedUsersCount: 2,
    };
    const state = determineActiveEventState(new Date('2026-01-01'), override);

    expect(state.currentPhase).toBe('climax');
    expect(state.isRainVisualActive).toBe(true);
    expect(state.communityGoal.isTargetAchieved).toBe(true);
  });

  it('deve gerenciar progresso pessoal, metros de salto e resgate de marcos', () => {
    const userId = 'trainer_ash';
    const year = 2026;

    // Registra 50 minutos de estudo
    const progress = recordEventMinutes(userId, year, 50);
    expect(progress.eventMinutesStudied).toBe(50);
    expect(progress.jumpMeters).toBe(500); // 50 * 10

    // Resgata marco de 25 min (Título)
    const updated = claimEventMilestone(userId, year, 'm_25min');
    expect(updated.claimedMilestoneIds).toContain('m_25min');
    expect(updated.unlockedSwimmerTitle).toBe(true);

    // Recorde de salto no mini-game
    const afterJump = recordMiniGameJump(userId, year, 1420);
    expect(afterJump.highestMiniGameJumpMeters).toBe(1420);
  });

  it('deve listar marcos corretamente com status desbloqueado e resgatado', () => {
    const milestones = getMagikarpMilestones(50, 300, 300, ['m_25min']);

    const m25 = milestones.find((m) => m.id === 'm_25min');
    expect(m25?.isUnlocked).toBe(true);
    expect(m25?.isClaimed).toBe(true);

    const m50 = milestones.find((m) => m.id === 'm_50min');
    expect(m50?.isUnlocked).toBe(true);
    expect(m50?.isClaimed).toBe(false);

    const m100 = milestones.find((m) => m.id === 'm_100min');
    expect(m100?.isUnlocked).toBe(false);

    const comm100 = milestones.find((m) => m.id === 'comm_100pct');
    expect(comm100?.isUnlocked).toBe(true);
  });
});
