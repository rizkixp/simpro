// SIM Sekolah PRO - Progressive Web App Service Worker
// Version: 2.0.0 (Full Offline Cache Engine)

const CACHE_NAME = 'simpro-offline-v2';

const isDevHost =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.endsWith('.local');

if (isDevHost) {
  // In development: bypass Service Worker to avoid hot-reload and HMR conflict
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
    return;
  });
} else {
  // In Production: Full Offline-First Caching Engine
  const PRECACHE_ASSETS = [
    '/',
    '/login',
    '/dashboard',
    '/offline.html',
    '/icons/icon.svg',
    '/manifest.webmanifest',
  ];

  // 1. Install Event: Pre-cache core application shell
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

  // 3. Fetch Event: Strategic Offline Caching
  self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only intercept GET requests
    if (request.method !== 'GET') return;

    // Bypass HMR, Chrome Extensions, and external cloud databases / mutations
    if (
      url.pathname.includes('webpack-hmr') ||
      url.pathname.includes('hot-update') ||
      url.protocol.startsWith('chrome-extension') ||
      url.hostname.includes('supabase.co') ||
      url.pathname.startsWith('/api/')
    ) {
      return;
    }

    // STRATEGY A: Navigation requests (HTML page loads)
    // Network-First with smart Offline Fallback (Exact Cache -> Dashboard Shell -> offline.html)
    if (request.mode === 'navigate') {
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
          .catch(async () => {
            // 1. Try exact cached page
            const cachedPage = await caches.match(request);
            if (cachedPage) return cachedPage;

            // 2. If visiting /dashboard or any dashboard subroute, serve cached dashboard shell
            if (url.pathname.startsWith('/dashboard')) {
              const cachedDashboard = await caches.match('/dashboard');
              if (cachedDashboard) return cachedDashboard;
            }

            // 3. Fallback to root if root was cached
            if (url.pathname === '/' || url.pathname === '') {
              const cachedRoot = await caches.match('/');
              if (cachedRoot) return cachedRoot;
            }

            // 4. Fallback to dedicated Islamic Emerald offline.html
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

    // STRATEGY B: Static Assets & RSC Payloads
    // (/_next/static/*, fonts, icons, images, and Next.js RSC queries)
    const isStaticAsset =
      url.pathname.startsWith('/_next/static') ||
      url.pathname.startsWith('/icons/') ||
      url.searchParams.has('_rsc') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js');

    if (isStaticAsset) {
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
