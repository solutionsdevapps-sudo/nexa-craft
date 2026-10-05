// NEXA Craft : service worker
// L'interface est mise en cache pour se lancer instantanément.
// Les appels à l'API (Google) ne sont jamais mis en cache.

const CACHE = 'nexa-craft-v1';
const FICHIERS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FICHIERS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(cles) {
      return Promise.all(cles.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {

  const url = new URL(e.request.url);

  // API Google, polices, photos Drive... : toujours directement sur le réseau
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Fichiers de l'application : réseau d'abord (toujours à jour), cache en secours
  e.respondWith(
    fetch(e.request)
      .then(function(reponse) {
        const copie = reponse.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copie); });
        return reponse;
      })
      .catch(function() { return caches.match(e.request); })
  );
});
