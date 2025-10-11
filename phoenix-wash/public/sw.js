const CACHE = 'phx-employee-v1';
const ASSETS = [
    '/', '/employee/login', '/employee/admin',
    '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
});
self.addEventListener('fetch', (e) => {
    const req = e.request;
    e.respondWith(
        caches.match(req).then(res => res || fetch(req).catch(() => caches.match('/employee/login')))
    );
});
