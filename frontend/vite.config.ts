/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'serve-root-apk',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/pokemoro.apk' || req.url === '/Pokemoro.apk') {
            const apkPath = path.resolve(__dirname, '../Pokemoro.apk');
            if (fs.existsSync(apkPath)) {
              res.writeHead(200, {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Disposition': 'attachment; filename="Pokemoro.apk"',
              });
              fs.createReadStream(apkPath).pipe(res);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  server: { host: '0.0.0.0', port: 5173 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
