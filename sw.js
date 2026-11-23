const CACHE_STATIC_NAME = 'static-geo-v1';
const STATIC_FILES = [
  './',
  './index.html',
  './styles.css',
  './geo-helper.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) => {
      return Promise.all(
        nombres.map((nombre) => {
          if (nombre !== CACHE_STATIC_NAME) {
            return caches.delete(nombre);
          }
        })
      );
    })
  );
});

// Cache First: archivos del App Shell desde caché, el resto a la red.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((respuesta) => {
      return respuesta || fetch(event.request);
    })
  );
});
