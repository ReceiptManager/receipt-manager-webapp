var version = "0.5.1"
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');

workbox.setConfig({
  debug: false
});

workbox.routing.registerRoute(
  new RegExp('\.js$'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: version,
  }));

workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/img/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: version,
    }));

workbox.routing.registerRoute(
      ({url}) => url.pathname.startsWith('/lang/'),
      new workbox.strategies.StaleWhileRevalidate({
        cacheName: version,
      }));

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});