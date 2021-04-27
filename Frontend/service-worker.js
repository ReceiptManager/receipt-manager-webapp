var version = "0.4.4"

self.addEventListener('install', event => {
  console.log(`installing service worker`);
  
  event.waitUntil(
    caches.open(version)
      .then(cache => cache.addAll([
        './settings/settings.json',
        './img/icon-144.png',
        './img/icon-192.png',
        './lang/de.json',
        './addCategory.js',
        './functions.js',
        './history.js',
        './index.html',
        './index.js',
        './manifest.webmanifest',
        './scann.js',
        './settings.js',
      ]))
  );
});

self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', () => {
  console.log(`activating service worker`);
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});