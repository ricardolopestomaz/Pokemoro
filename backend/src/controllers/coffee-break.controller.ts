import { Router, Request, Response } from 'express';
import { CoffeeBreakService } from '../services/coffee-break.service.js';

export function createCoffeeBreakController(coffeeBreakService = new CoffeeBreakService()): Router {
  const router = Router();
  const getUserId = (req: Request) => (req.headers['x-user-id'] as string) || 'local-student-01';

  // GET /api/coffee-break/active
  router.get('/active', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const active = coffeeBreakService.getActiveCoffeeBreak(userId);
      if (!active) {
        return res.status(404).json({ message: 'Nenhum Coffee Break ativo no momento.' });
      }
      res.json(active);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/coffee-break/feed
  router.post('/feed', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { spawnId, biscuitType } = req.body;

      if (!spawnId || !biscuitType) {
        return res.status(400).json({ error: 'spawnId e biscuitType são obrigatórios' });
      }

      const result = coffeeBreakService.feedPokemon(userId, spawnId, biscuitType);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
