self.addEventListener('install', () => {
    console.log(`installing service worker`);
})

self.addEventListener('activate', () => {
    console.log(`activating service worker`);
})

self.addEventListener('fetch', event => {
    console.log(`fetching...
    ${event.request.url}`);
})