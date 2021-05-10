importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');

workbox.setConfig({
  debug: false
});

workbox.routing.registerRoute(
    new RegExp('\.js$'),
    new workbox.strategies.StaleWhileRevalidate({
      plugins: [new workbox.broadcastUpdate.BroadcastUpdatePlugin()],
      cacheName: 'page-cache',
    }));

workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/img/'),
    new workbox.strategies.StaleWhileRevalidate({
      plugins: [new workbox.broadcastUpdate.BroadcastUpdatePlugin()],
      cacheName: 'img-cache',
    }));

workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/lang/'),
    new workbox.strategies.StaleWhileRevalidate({
      plugins: [new workbox.broadcastUpdate.BroadcastUpdatePlugin()],
      cacheName: 'lang-cache',
    }));

workbox.routing.registerRoute(
    '/',
    new workbox.strategies.StaleWhileRevalidate({
      plugins: [new workbox.broadcastUpdate.BroadcastUpdatePlugin()],
      cacheName: 'index-cache',
    }));

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});