// sw.js - Service Worker Gasikara Explorer V2.5.3
// Tous les chemins sont RELATIFS : le site est servi dans un sous-dossier (GitHub Pages /guide-madagascar-v2/).
const CACHE_VERSION = 'gasikara-v2.5.3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const CRITICAL_ASSETS = [
  './',
  './index.html',
  './circuit.html',
  './manifest.json',
  './images/logo/favicon.png',
  './css/cards-2026.css',
  './css/styles-premium.css',
  './js/app.min.js',
  './js/gsap-config.js',
  './js/animations.js',
  './js/modules/map.js',
  './js/modules/cities.js',
  './js/modules/spots.js',
  './js/modules/itineraries.js',
  './js/modules/tools.js',
  './data/lieux.js',
  './data/avis.js',
  './data/itineraires.js',
  './data/phrases.js',
  './images/placeholder.jpg',
  './images/placeholder-hotel.jpg',
  './images/placeholder-restaurant.jpg',
  './images/placeholder-bar.jpg',
  './images/placeholder-nature.jpg',
  './images/placeholder-spot.jpg'
];

// INSTALLATION
self.addEventListener('install', (event) => {
  console.log('[SW v2.5.3] Installation...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cache assets critiques');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation réussie');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Erreur installation:', err);
        throw err;
      })
  );
});

// ACTIVATION
self.addEventListener('activate', (event) => {
  console.log('[SW v2.5.3] Activation...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('gasikara-') && 
                           name !== STATIC_CACHE && 
                           name !== DYNAMIC_CACHE)
            .map(name => {
              console.log('[SW] Suppression cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Ensure we only handle http/https requests
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|webp|svg|woff2?)$/i.test(url.pathname);
  const isDocument = request.destination === 'document' || url.pathname.endsWith('/');
  
  if (isStaticAsset) {
    // CACHE FIRST pour assets
    event.respondWith(
      caches.match(request, { ignoreSearch: true })
        .then(cached => {
          if (cached) return cached;
          
          return fetch(request).then(response => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
            }
            return response;
          });
        })
    );
  } else if (isDocument) {
    // NETWORK FIRST pour HTML
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }).then(cached => cached || caches.match('./index.html')))
    );
  }
});
