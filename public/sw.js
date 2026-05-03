// ACS Service Worker — minimal MVP
// Strategy:
//  - HTML / Inertia visits: network-first (app must be fresh)
//  - Vite-built /build/* assets: cache-first (versioned filenames are immutable)
//  - Icons / manifest: cache-first
//  - Everything else: pass-through
const CACHE_NAME = 'acs-v1';
const PRECACHE_URLS = [
    '/manifest.json',
    '/icons/icon.svg',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET requests on same origin
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Cache-first for built assets and icons
    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Network-first for everything else (HTML, Inertia)
    event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (_e) {
        return cached || Response.error();
    }
}

async function networkFirst(request) {
    try {
        return await fetch(request);
    } catch (_e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return Response.error();
    }
}
