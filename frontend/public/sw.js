// Service Worker para Pokémoro PWA (habilita instalação como aplicativo nativo no Android)
const CACHE_NAME = 'pokemoro-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch com fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
