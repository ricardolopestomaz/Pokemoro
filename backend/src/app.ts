import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { createUserController } from './controllers/user.controller.js';
import { createStudyController } from './controllers/study.controller.js';
import { createCoffeeBreakController } from './controllers/coffee-break.controller.js';
import { createTeamController } from './controllers/team.controller.js';

export function createApp(): Express {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Servir assets estáticos (sprites e cenários gerados)
  const rootDir = path.resolve(process.cwd(), '..');
  app.use('/sprites', express.static(path.join(rootDir, 'sprites')));
  app.use('/assets', express.static(path.join(rootDir, 'assets')));

  // Rotas da API
  app.use('/api/user', createUserController());
  app.use('/api/study', createStudyController());
  app.use('/api/coffee-break', createCoffeeBreakController());
  app.use('/api/team', createTeamController());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'Pokémoro API', version: '1.0.0' });
  });

  return app;
}

export function startServer(port = 3001) {
  const app = createApp();
  return app.listen(port, () => {
    console.log(`[Pokémoro API] Servidor rodando na porta ${port}`);
    console.log(`[Pokémoro API] Health check: http://localhost:${port}/api/health`);
  });
}
