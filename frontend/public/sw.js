// Service Worker desativado para garantir estabilidade no Android/Capacitor nativo
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    })
  );
});
