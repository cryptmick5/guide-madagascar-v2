// sw.js - Service Worker Gasikara Explorer V2.6.0
// Tous les chemins sont RELATIFS : le site est servi dans un sous-dossier (GitHub Pages /guide-madagascar-v2/).
const CACHE_VERSION = 'gasikara-v2.6.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
// Les tuiles de carte survivent aux mises à jour de l'application
const TILES_CACHE = 'gasikara-tuiles';
const MAX_TUILES = 600;

function limiterCache(nom, max) {
  caches.open(nom).then(cache => cache.keys().then(keys => {
    if (keys.length > max) keys.slice(0, keys.length - max).forEach(k => cache.delete(k));
  }));
}

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
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/markercluster/leaflet.markercluster.js',
  './vendor/markercluster/MarkerCluster.css',
  './vendor/markercluster/MarkerCluster.Default.css',
  './vendor/gsap/gsap.min.js',
  './vendor/gsap/ScrollTrigger.min.js',
  './vendor/gsap/Flip.min.js',
  './vendor/fontawesome/css/all.min.css',
  './vendor/fontawesome/webfonts/fa-solid-900.woff2',
  './vendor/fontawesome/webfonts/fa-regular-400.woff2',
  './vendor/fontawesome/webfonts/fa-brands-400.woff2',
  './js/circuit-renderer.js',
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
  console.log('[SW v2.6.0] Installation...');
  
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
  console.log('[SW v2.6.0] Activation...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('gasikara-') && 
                           name !== STATIC_CACHE && 
                           name !== DYNAMIC_CACHE &&
                           name !== TILES_CACHE)
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

  // Fond de carte et polices (autres domaines) : gardés en cache au fil de la navigation,
  // pour que les zones déjà consultées restent visibles sans réseau.
  const estTuile = url.hostname === 'tile.openstreetmap.org' || url.hostname.endsWith('basemaps.cartocdn.com');
  const estPolice = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (estTuile || estPolice) {
    const nomCache = estTuile ? TILES_CACHE : DYNAMIC_CACHE;
    event.respondWith(
      caches.open(nomCache).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(request, response.clone());
              if (estTuile) limiterCache(nomCache, MAX_TUILES);
            }
            return response;
          });
        })
      )
    );
    return;
  }
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
