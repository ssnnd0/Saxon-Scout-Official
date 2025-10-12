// Saxon Scout Service Worker for PWA functionality
const CACHE_NAME = 'saxon-scout-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app/assets/Logo+611.png',
  '/app/assets/Logo+611+Black+Name.webp',
  '/app/assets/Logo+611+White+Name.webp',
  '/app/assets/gamepiece.png'
];

// Install event: cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response or offline message
          return caches.match(request)
            .then((cached) => cached || offlineResponse());
        })
    );
    return;
  }

  // Assets: cache-first
  if (
    request.method === 'GET' &&
    (url.pathname.startsWith('/app/') ||
     url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.webp') ||
     url.pathname.endsWith('.jpg') ||
     url.pathname.endsWith('.jpeg') ||
     url.pathname.endsWith('.svg'))
  ) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const cacheCopy = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, cacheCopy);
                });
              }
              return response;
            })
            .catch(() => offlineResponse());
        })
    );
    return;
  }

  // HTML/SPA routes: network-first, fallback to cached index.html
  if (request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html')
            .then((cached) => cached || offlineResponse());
        })
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});

// Offline fallback response
function offlineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Saxon Scout - Offline</title>
        <style>
          body {
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }
          .offline-container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          h1 { color: #0066cc; margin-top: 0; }
          p { color: #666; line-height: 1.6; }
          .icon { font-size: 3rem; margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="icon">📡</div>
          <h1>Offline Mode</h1>
          <p>Saxon Scout is currently offline. Your local data is saved and will sync when you're back online.</p>
          <p>You can continue using cached features.</p>
        </div>
      </body>
    </html>`,
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html; charset=utf-8'
      })
    }
  );
}

// Handle background sync for offline match submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scouting-data') {
    event.waitUntil(syncScoutingData());
  }
});

async function syncScoutingData() {
  try {
    // This would sync any pending scouting data when connection is restored
    console.log('Syncing scouting data...');
    // Implementation would fetch pending records and upload them
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}