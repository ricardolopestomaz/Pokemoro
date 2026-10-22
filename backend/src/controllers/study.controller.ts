import { Router, Request, Response } from 'express';
import { StudyService } from '../services/study.service.js';

export function createStudyController(studyService = new StudyService()): Router {
  const router = Router();
  const getUserId = (req: Request) => (req.headers['x-user-id'] as string) || 'local-student-01';

  // GET /api/study/subjects
  router.get('/subjects', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const list = studyService.listSubjects(userId);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/study/subjects
  router.post('/subjects', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { name, color, icon } = req.body;
      if (!name) return res.status(400).json({ error: 'Nome da matéria é obrigatório' });

      const created = studyService.createSubject(userId, name, color, icon);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/study/sessions/start
  router.post('/sessions/start', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { subjectId, mode, targetDurationMinutes } = req.body;
      if (!subjectId || !mode) {
        return res.status(400).json({ error: 'subjectId e mode são obrigatórios' });
      }

      const session = studyService.startSession(userId, {
        subjectId,
        mode,
        targetDurationMinutes: Number(targetDurationMinutes) || 25,
      });

      res.status(201).json(session);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/study/sessions/end
  router.post('/sessions/end', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { sessionId, actualDurationMinutes, interruptedEarly, timeSpentOutOfAppSeconds } = req.body;

      if (!sessionId || actualDurationMinutes === undefined) {
        return res.status(400).json({ error: 'sessionId e actualDurationMinutes são obrigatórios' });
      }

      const summary = studyService.endSession(userId, {
        sessionId,
        actualDurationMinutes: Number(actualDurationMinutes),
        interruptedEarly: Boolean(interruptedEarly),
        timeSpentOutOfAppSeconds: Number(timeSpentOutOfAppSeconds) || 0,
      });

      res.json(summary);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/study/sessions/recent
  router.get('/sessions/recent', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const limit = Number(req.query.limit) || 10;
      const history = studyService.listRecentSessions(userId, limit);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
