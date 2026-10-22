import { startServer } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
startServer(PORT);
