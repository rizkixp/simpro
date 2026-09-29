// SIM Sekolah PRO - Progressive Web App Service Worker
// Version: 2.1.0 (Safe Resilient Cache Engine)

const CACHE_NAME = 'simpro-offline-v4';

const isDevHost = Boolean(
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.endsWith('.local') ||
  self.location.port === '3000' ||
  self.location.port === '3001' ||
  self.location.hostname.startsWith('192.168.') ||
  self.location.hostname.startsWith('10.') ||
  self.location.hostname.startsWith('172.')
);

if (isDevHost) {
  // In development / local environment: completely bypass and self-destruct
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', () => {
    // Pass-through without caching in dev
    return;
  });
} else {
  // In Production: Only precache static, immutable assets (NEVER precache '/' or dynamic HTML)
  const PRECACHE_ASSETS = [
    '/offline.html',
    '/icons/icon.svg',
    '/manifest.webmanifest',
  ];

  // 1. Install Event: Pre-cache static fallback assets
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(PRECACHE_ASSETS).catch((err) => {
            console.warn('[SW] Pre-caching warning (non-fatal):', err);
          });
        })
        .then(() => self.skipWaiting())
    );
  });

  // 2. Activate Event: Clean up outdated caches & claim clients immediately
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => {
          return Promise.all(
            keys
              .filter((key) => key !== CACHE_NAME)
              .map((key) => {
                console.log('[SW] Deleting obsolete cache:', key);
                return caches.delete(key);
              })
          );
        })
        .then(() => self.clients.claim())
    );
  });

  // 3. Fetch Event: Safe Resilient Caching
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only intercept GET requests
    if (request.method !== 'GET') return;

    // Bypass HMR, Chrome Extensions, external APIs, and Supabase cloud
    if (
      url.pathname.includes('webpack-hmr') ||
      url.pathname.includes('hot-update') ||
      url.protocol.startsWith('chrome-extension') ||
      url.hostname.includes('supabase.co') ||
      url.pathname.startsWith('/api/') ||
      url.searchParams.has('_rsc')
    ) {
      return;
    }

    // STRATEGY A: Navigation requests (HTML page loads) - Always Network-First
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .catch(async () => {
            // Only when completely offline: serve dedicated offline fallback page
            const offlineFallback = await caches.match('/offline.html');
            if (offlineFallback) return offlineFallback;

            return new Response('Aplikasi dalam mode offline.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          })
      );
      return;
    }

    // STRATEGY B: Next.js Static JS Chunks - Network first to avoid ChunkLoadError
    if (url.pathname.startsWith('/_next/static/chunks/')) {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => caches.match(request))
      );
      return;
    }

    // STRATEGY C: Images, Fonts, Icons (Stale-While-Revalidate)
    const isMediaAsset =
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.css');

    if (isMediaAsset) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
      );
      return;
    }
  });
}

// Support messaging for explicit cache purging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
