// SDI Smart School - Progressive Web App Service Worker
// Version: 1.0.2

const isDevHost =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.endsWith('.local');

if (isDevHost) {
  // In development/localhost: immediately self-destruct, clear caches, and unregister
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
    // Completely bypass Service Worker in development
    return;
  });
} else {
  // In Production: Full PWA caching capabilities
  const CACHE_NAME = 'sdi-smart-school-v1';

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

    // Bypass hot-reload, chrome extensions, and Supabase cloud
    if (
      url.pathname.includes('webpack-hmr') ||
      url.pathname.includes('hot-update') ||
      url.protocol.startsWith('chrome-extension') ||
      url.hostname.includes('supabase.co')
    ) {
      return;
    }

    // A. Navigation requests (HTML pages): Network-First with Safe Route-Specific Fallback
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
            // 1. Fallback to exact cached page if available
            const cachedResponse = await caches.match(request);
            if (cachedResponse) return cachedResponse;

            // 2. Only return root shell if user is actually visiting root
            if (url.pathname === '/' || url.pathname === '') {
              const cachedRoot = await caches.match('/');
              if (cachedRoot) return cachedRoot;
            }

            // 3. Only return dashboard shell if user is specifically visiting /dashboard
            if (url.pathname === '/dashboard') {
              const cachedDashboard = await caches.match('/dashboard');
              if (cachedDashboard) return cachedDashboard;
            }

            // 4. For any other link, NEVER return the home page shell
            return new Response('Halaman ini belum tersedia dalam memori offline.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
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
}
