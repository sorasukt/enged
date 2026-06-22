const CACHE_NAME = 'sorasukt-pwa-v2';
const ASSETS_TO_CACHE = [
    '/enged/',
    '/enged/index.html',
    '/enged/404.html',
    '/enged/budget.html',
    '/enged/checkup.html',
    '/enged/sys.html',
    '/enged/CSS/index.css',
    '/enged/CSS/system.css',
    '/enged/CSS/maintenance.css',
    '/enged/CSS/budget.css',
    '/enged/CSS/checkup.css',
    '/enged/CSS/sys.css',
    '/enged/CSS/404.css',
    '/enged/JavaScript/pwa.js',
    '/enged/JavaScript/system.js',
    '/enged/JavaScript/maintenance.js',
    '/enged/JavaScript/budget.js',
    '/enged/JavaScript/checkup.js',
    '/enged/JavaScript/sys.js',
    '/enged/vote/index.html',
    '/enged/vote/CSS/index.css',
    '/enged/vote/CSS/backend.css',
    '/enged/vote/CSS/base44.css',
    '/enged/vote/CSS/info.css',
    '/enged/vote/CSS/ivote.css',
    '/enged/vote/CSS/results.css',
    '/enged/vote/JavaScript/index.js',
    '/enged/vote/JavaScript/backend.js',
    '/enged/vote/JavaScript/base44.js',
    '/enged/vote/JavaScript/info.js',
    '/enged/vote/JavaScript/ivote.js',
    '/enged/vote/JavaScript/results.js',
    '/enged/img/enged-192.png',
    '/enged/img/enged-512.png',
    '/enged/img/enged.png',
    '/enged/img/icon-192.png',
    '/enged/img/icon-512.png',
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
