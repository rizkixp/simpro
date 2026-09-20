// SDI Smart School - Progressive Web App Service Worker
// Version: 1.0.0

const CACHE_NAME = 'sdi-smart-school-v1';

// Critical static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/icons/icon.svg',
  '/manifest.webmanifest',
];

// 1. Install event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Pre-caching non-fatal warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up previous cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch event: Strategic caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Ignore Next.js hot module reloading & browser extensions
  if (
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('hot-update') ||
    url.protocol.startsWith('chrome-extension') ||
    url.hostname.includes('supabase.co')
  ) {
    return;
  }

  // A. Navigation requests (HTML pages): Network-First with Cache Fallback
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
          // Fallback to cache if network is offline
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          
          const cachedDashboard = await caches.match('/dashboard');
          if (cachedDashboard) return cachedDashboard;

          return caches.match('/');
        })
    );
    return;
  }

  // B. Static assets (images, css, fonts, js bundles): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css');

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
  }
});
