import { eq, desc } from 'drizzle-orm';
import { getDatabase } from '../client.js';
import { studySessions, subjects, users } from '../schema.js';
import {
  StartStudySessionRequest,
  StartStudySessionResponse,
  EndStudySessionRequest,
  StudySessionSummaryDTO,
} from '../../dtos/study-session.dto.js';
import crypto from 'crypto';

export class StudySessionRepository {
  private db = getDatabase();

  public createSubject(userId: string, name: string, color = '#4CAF50', icon = 'book') {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.insert(subjects).values({
      id,
      userId,
      name,
      color,
      icon,
      totalMinutes: 0,
      createdAt: now,
    }).run();

    return { id, name, color, icon };
  }

  public listSubjects(userId: string) {
    return this.db.select().from(subjects).where(eq(subjects.userId, userId)).all();
  }

  public startSession(userId: string, req: StartStudySessionRequest): StartStudySessionResponse {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.insert(studySessions).values({
      id: sessionId,
      userId,
      subjectId: req.subjectId,
      mode: req.mode,
      targetDurationMinutes: req.targetDurationMinutes,
      actualDurationMinutes: 0,
      timeSpentOutOfAppSeconds: 0,
      isDeepFocus: true,
      deepFocusMultiplier: 1.2,
      streakMultiplier: 1.0,
      focusPowerEarned: 0,
      focusCoinsEarned: 0,
      interruptedEarly: false,
      isCoffeeBreakUnlocked: false,
      startedAt: now,
      completedAt: now,
    }).run();

    return {
      sessionId,
      startedAt: now,
      targetDurationMinutes: req.targetDurationMinutes,
      deepFocusEligible: true,
    };
  }

  public completeSession(
    userId: string,
    req: EndStudySessionRequest,
    streakDays: number
  ): StudySessionSummaryDTO {
    const session = this.db
      .select()
      .from(studySessions)
      .where(eq(studySessions.id, req.sessionId))
      .get();

    if (!session) throw new Error('Session not found');

    const isDeepFocus = req.timeSpentOutOfAppSeconds <= 60; // Tolerância de 1 min
    const deepFocusMultiplier = isDeepFocus ? 1.2 : 1.0;
    const streakMultiplier = 1.0 + Math.min(1.0, streakDays * 0.1); // Bônus de streak progressivo

    const focusPowerEarned = Math.round(
      req.actualDurationMinutes * 10 * streakMultiplier * deepFocusMultiplier
    );

    const focusCoinsEarned = Math.round(req.actualDurationMinutes * 2);
    const isCoffeeBreakUnlocked = !req.interruptedEarly && req.actualDurationMinutes >= session.targetDurationMinutes;

    let spawnsCount = 0;
    if (isCoffeeBreakUnlocked) {
      if (focusPowerEarned > 600) spawnsCount = 5;
      else if (focusPowerEarned > 250) spawnsCount = 4;
      else spawnsCount = 2;
    }

    const now = new Date().toISOString();

    // Atualiza a sessão
    this.db.update(studySessions)
      .set({
        actualDurationMinutes: req.actualDurationMinutes,
        timeSpentOutOfAppSeconds: req.timeSpentOutOfAppSeconds,
        isDeepFocus,
        deepFocusMultiplier,
        streakMultiplier,
        focusPowerEarned,
        focusCoinsEarned,
        interruptedEarly: req.interruptedEarly,
        isCoffeeBreakUnlocked,
        completedAt: now,
      })
      .where(eq(studySessions.id, req.sessionId))
      .run();

    // Atualiza moedas do usuário
    const user = this.db.select().from(users).where(eq(users.id, userId)).get();
    if (user) {
      this.db.update(users)
        .set({ focusCoins: user.focusCoins + focusCoinsEarned })
        .where(eq(users.id, userId))
        .run();
    }

    // Atualiza minutos acumulados da matéria de estudo
    const subject = this.db.select().from(subjects).where(eq(subjects.id, session.subjectId)).get();
    if (subject) {
      this.db.update(subjects)
        .set({ totalMinutes: subject.totalMinutes + req.actualDurationMinutes })
        .where(eq(subjects.id, session.subjectId))
        .run();
    }

    return {
      sessionId: req.sessionId,
      subjectId: session.subjectId,
      minutesLogged: req.actualDurationMinutes,
      isDeepFocusEarned: isDeepFocus,
      deepFocusMultiplier,
      streakMultiplier,
      focusPowerEarned,
      focusCoinsEarned,
      newStreakDays: streakDays,
      streakKept: true,
      isCoffeeBreakUnlocked,
      spawnsCount,
    };
  }

  public listRecentSessions(userId: string, limit = 10) {
    return this.db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.completedAt))
      .limit(limit)
      .all();
  }
}
