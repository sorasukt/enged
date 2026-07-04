const CACHE_NAME = 'sorasukt-pwa-v2';
const ASSETS_TO_CACHE = [
    'https://solution.litalkeducation.com/',
    'https://solution.litalkeducation.com/index.html',
    'https://solution.litalkeducation.com/404.html',
    'https://solution.litalkeducation.com/budget.html',
    'https://solution.litalkeducation.com/checkup.html',
    'https://solution.litalkeducation.com/sys.html',
    'https://solution.litalkeducation.com/CSS/index.css',
    'https://solution.litalkeducation.com/CSS/system.css',
    'https://solution.litalkeducation.com/CSS/maintenance.css',
    'https://solution.litalkeducation.com/CSS/budget.css',
    'https://solution.litalkeducation.com/CSS/checkup.css',
    'https://solution.litalkeducation.com/CSS/sys.css',
    'https://solution.litalkeducation.com/CSS/404.css',
    'https://solution.litalkeducation.com/JavaScript/pwa.js',
    'https://solution.litalkeducation.com/JavaScript/system.js',
    'https://solution.litalkeducation.com/JavaScript/maintenance.js',
    'https://solution.litalkeducation.com/JavaScript/budget.js',
    'https://solution.litalkeducation.com/JavaScript/checkup.js',
    'https://solution.litalkeducation.com/JavaScript/sys.js',
    'https://solution.litalkeducation.com/vote/index.html',
    'https://solution.litalkeducation.com/vote/CSS/index.css',
    'https://solution.litalkeducation.com/vote/CSS/backend.css',
    'https://solution.litalkeducation.com/vote/CSS/base44.css',
    'https://solution.litalkeducation.com/vote/CSS/info.css',
    'https://solution.litalkeducation.com/vote/CSS/ivote.css',
    'https://solution.litalkeducation.com/vote/CSS/results.css',
    'https://solution.litalkeducation.com/vote/JavaScript/index.js',
    'https://solution.litalkeducation.com/vote/JavaScript/backend.js',
    'https://solution.litalkeducation.com/vote/JavaScript/base44.js',
    'https://solution.litalkeducation.com/vote/JavaScript/info.js',
    'https://solution.litalkeducation.com/vote/JavaScript/ivote.js',
    'https://solution.litalkeducation.com/vote/JavaScript/results.js',
    'https://solution.litalkeducation.com/imghttps://solution.litalkeducation.com-192.png',
    'https://solution.litalkeducation.com/imghttps://solution.litalkeducation.com-512.png',
    'https://solution.litalkeducation.com/imghttps://solution.litalkeducation.com.png',
    'https://solution.litalkeducation.com/img/icon-192.png',
    'https://solution.litalkeducation.com/img/icon-512.png',
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
