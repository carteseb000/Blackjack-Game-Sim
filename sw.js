const version = '0.1'
const assets = [
	'index.html',
	'sw.js',
	'blackjack.webmanifest'
]

self.addEventListener('install', function(event) {
  console.log('serviceworker installing')
  caches.open(version)
    .then(function(cache) {
      return cache.addAll(assets);
    })
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
