/* Service worker de Flip Phone MTL.
   Nécessaire uniquement si tu héberges l'application : ouvert en fichier
   local, le HTML est déjà autonome et ne charge rien du réseau.
   Un service worker ne peut pas être inliné — la spécification refuse les
   scripts en blob: et en data:, quelle que soit l'origine. Ce fichier doit
   donc être déposé à côté du HTML, servi en HTTPS.
   Stratégie : cache d'abord, réseau ensuite, mise à jour en arrière-plan. */

var CACHE = 'flip-mtl-v1';

self.addEventListener('install', function (e) {
  /* Rien à pré-charger : le HTML est un fichier unique, il entre en cache
     à la première visite. On active immédiatement. */
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (noms) {
        return Promise.all(noms.filter(function (n) { return n !== CACHE; })
          .map(function (n) { return caches.delete(n); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      /* Servi depuis le cache, puis rafraîchi en silence pour la prochaine
         ouverture : le démarrage n'attend jamais le réseau. */
      var reseau = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copie = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copie); }).catch(function () {});
        }
        return res;
      }).catch(function () {
        return hit || caches.match('./') || caches.match('index.html');
      });
      return hit || reseau;
    })
  );
});
