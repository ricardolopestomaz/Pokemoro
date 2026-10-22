import { Router, Request, Response } from 'express';
import { UserService } from '../services/user.service.js';

export function createUserController(userService = new UserService()): Router {
  const router = Router();

  // Helper para obter ID do usuário padrão offline
  const getUserId = (req: Request) => (req.headers['x-user-id'] as string) || 'local-student-01';

  // GET /api/user/profile
  router.get('/profile', (req: Request, res: Response) => {
    try {
      const user = userService.getOrCreateDefaultUser();
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/user/environment
  router.post('/environment', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { environment } = req.body;
      if (!environment) return res.status(400).json({ error: 'Cenário obrigatório' });

      const updated = userService.setEnvironment(userId, environment);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST /api/user/biscuits/buy
  router.post('/biscuits/buy', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { biscuitType, quantity } = req.body;
      if (!biscuitType) return res.status(400).json({ error: 'biscuitType obrigatório' });

      const updated = userService.buyBiscuits(userId, biscuitType, quantity || 1);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
