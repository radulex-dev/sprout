/* Sprout service worker.
 *
 * Caching is deliberately minimal: only static shell assets are cached,
 * cache-first. Documents, /api responses, RSC navigation payloads and other
 * per-user data are NEVER cached — the old cache-everything strategy would
 * leak one user's HTML to another. Caching an RSC payload also wedges the
 * client router: the page segment never arrives and the route-level
 * loading.tsx boundary resolves to its skeleton forever, with no error.
 */
const CACHE_VERSION = new URLSearchParams(location.search).get('v') || 'dev';
const CACHE = `sprout-${CACHE_VERSION}`;
const SHELL = ['/favicon.ico', '/icon.svg', '/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png', '/icon-mono.svg', '/manifest.webmanifest'];
const SHELL_PATHS = new Set(SHELL);

globalThis.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => { return cache.addAll(SHELL); }));
    globalThis.skipWaiting();
});

globalThis.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => {
                return Promise.all(keys.reduce((accumulator, key) => {
                    if (key !== CACHE) accumulator.push(caches.delete(key));
                    return accumulator;
                }, []));
            })
            .then(() => { return globalThis.clients.claim(); })
    );
});

globalThis.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== location.origin) return;
    if (event.request.mode === 'navigate') return;
    // RSC navigations look like ordinary same-origin GETs but are per-user
    // flight payloads. Serving a cached one leaves the router's transition
    // stuck on the route-level loading skeleton, silently and permanently —
    // dropping this guard reintroduces that bug.
    if (event.request.headers.get('RSC') === '1') return;
    if (url.pathname.startsWith('/api/')) return;
    // Never add /_next/static here: the browser already revalidates it, and a
    // copy cached here outlives every rebuild (dev chunk names are stable).
    if (!SHELL_PATHS.has(url.pathname)) return;

    event.respondWith(
        caches.match(event.request).then((hit) => {
            return (
                hit ||
                fetch(event.request).then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => { return cache.put(event.request, copy); });
                    return response;
                })
            );
        })
    );
});

globalThis.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        globalThis.clients.matchAll({ type: 'window',
            includeUncontrolled: true }).then((clients) => {
            const open = clients.find((client) => { return 'focus' in client; });
            if (open) return open.focus();
            return globalThis.clients.openWindow(event.notification.data?.url || '/');
        })
    );
});

globalThis.addEventListener('push', (event) => {
    let payload;
    try {
        payload = event.data ? event.data.json() : {};
    } catch {
        payload = {};
    }

    event.waitUntil(
        globalThis.registration.showNotification(payload.title || 'Sprout', {
            body: payload.body || 'A plant needs care.',
            tag: payload.tag,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { url: payload.url || '/' }
        })
    );
});
