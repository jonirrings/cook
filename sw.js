const cacheName = 'Cook';
const contentToCache = [
    '/',
    '/index.html',
    '/static/app.mjs',
    '/static/db.mjs',
    '/static/dinner-16.png',
    '/static/dinner-64.png',
    '/static/dinner-128.png',
    '/static/dinner-192.png',
    '/static/dinner-512.png',
    '/static/recipe.json',
    '/static/style.css',
    '/vendor/dexie.min.js',
    '/vendor/lodash.min.js',
];
self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(contentToCache);
        })
    );
});
self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (cacheName.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
    );
});
self.addEventListener('fetch', function (e) {
    e.respondWith(
        caches.match(e.request).then(function (r) {
            console.log('[Service Worker] Fetching resource: ' + e.request.url);
            return r || fetch(e.request).then(function (response) {
                return caches.open(cacheName).then(function (cache) {
                    console.log('[Service Worker] Caching new resource: ' + e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});
