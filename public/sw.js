const CACHE_VERSION = 'horas-extras-v4';
const appUrl = (path = '') => new URL(path, self.registration.scope).pathname;
const STATIC_ASSETS = ['', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'default-avatar.svg'].map(appUrl);

const isCacheable = (response) => response?.ok && response.type !== 'opaque';
const cacheResponse = (request, response) => caches.open(CACHE_VERSION).then((cache) => cache.put(request, response));

self.addEventListener('install', (event) => {
  // Do not skip waiting: an open tab keeps using its matching asset set.
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Vite development modules are mutable and must never be served cache-first.
  if (url.pathname.includes('/src/') || url.pathname.includes('/@vite') || url.pathname.includes('/node_modules/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) event.waitUntil(cacheResponse(appUrl('index.html'), response.clone()));
          return response;
        })
        .catch(() => caches.match(appUrl('index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (isCacheable(response)) event.waitUntil(cacheResponse(request, response.clone()));
        return response;
      });
    })
  );
});
