
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('fin-le-v1').then(cache => cache.addAll([
      './',
      './index.html',
      './app.js',
      './data.json',
      './manifest.json',
      './icons/icon-192.png',
      './icons/icon-512.png'
    ]))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
