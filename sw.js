const CACHE_NAME = 'mg-guide-cache-v2026-FINAL-1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './circuit.html',
  './css/style.css',
  './css/styles-premium.css?v=2026.FINAL.1',
  './css/mobile-cards-v5.css?v=2026.FINAL.1',
  './css/cards-2026.css?v=2026.FINAL.1',
  './js/app.js',
  './data/lieux.js',
  './data/itineraires.js',
  './data/phrases.js',
  './manifest.json',
  './images/logo/favicon.png', // Correct path existant
  './icon-192.svg',           // Valid existing file
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force activation immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activate Event: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control of all clients immediately
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // CRITICAL FIX: Ignore non-http requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // 1. STRATEGIE IMAGES : Cache First, puis Network (et mise en cache dynamique)
  if (url.pathname.includes('/images/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          // Si trouvé en cache, on retourne
          if (response) return response;

          // Sinon on va chercher sur le réseau
          return fetch(event.request).then(networkResponse => {
            // On met en cache pour la prochaine fois
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 2. STRATEGIE APP SHELL : Cache First (Statique)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
