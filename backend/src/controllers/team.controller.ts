import { Router, Request, Response } from 'express';
import { TeamService } from '../services/team.service.js';

export function createTeamController(teamService = new TeamService()): Router {
  const router = Router();
  const getUserId = (req: Request) => (req.headers['x-user-id'] as string) || 'local-student-01';

  // GET /api/team
  router.get('/', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const team = teamService.getActiveTeam(userId);
      res.json(team);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/team
  router.post('/', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { pokemonIds } = req.body;

      if (!Array.isArray(pokemonIds)) {
        return res.status(400).json({ error: 'pokemonIds deve ser um array' });
      }

      const updated = teamService.setTeam(userId, pokemonIds);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET /api/team/collection
  router.get('/collection', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const collection = teamService.listAllPokemon(userId);
      res.json(collection);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/team/dex (Focus Dex / Álbum de Poses)
  router.get('/dex', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const dex = teamService.getFocusDex(userId);
      res.json(dex);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/team/dex/photo (Salva fotografia capturada no acampamento)
  router.post('/dex/photo', (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { pokemonId, sleepStyle, isShiny, photoDataUrl } = req.body;

      if (!pokemonId || !sleepStyle || !photoDataUrl) {
        return res.status(400).json({ error: 'pokemonId, sleepStyle e photoDataUrl são obrigatórios' });
      }

      const result = teamService.saveDexPhoto(
        userId,
        Number(pokemonId),
        Number(sleepStyle),
        Boolean(isShiny),
        String(photoDataUrl)
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}

