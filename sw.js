const CACHE_NAME = 'saxon-scout-v2026-3';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

// Install: Cache critical core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate for most things, Network Only for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API / Socket / Gemini requests -> Network Only
  // We don't want to cache scouting data submissions or live syncs aggressively
  if (
    url.pathname.startsWith('/api') || 
    url.hostname.includes('googleapis') || 
    url.hostname.includes('socket.io') ||
    url.hostname.includes('thebluealliance')
  ) {
    return;
  }

  // 2. External Libraries (ESM.sh, Tailwind) -> Stale While Revalidate
  // Serve from cache fast, update in background
  if (url.hostname === 'esm.sh' || url.hostname === 'cdn.tailwindcss.com') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. App Shell (HTML, TSX, Local Assets) -> Stale While Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
         if (networkResponse.ok) {
             const clone = networkResponse.clone();
             caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
         // If offline and navigating, return index.html
         if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
         }
      });
      return cachedResponse || fetchPromise;
    })
  );
});