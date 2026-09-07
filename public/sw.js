const CACHE_NAME = 'ruralcare-static-v1';
const CACHEABLE_DESTINATIONS = new Set(['script', 'style', 'font', 'image']);
const IS_LOCAL_DEVELOPMENT = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => IS_LOCAL_DEVELOPMENT || key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (IS_LOCAL_DEVELOPMENT) return;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (!CACHEABLE_DESTINATIONS.has(request.destination)) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});