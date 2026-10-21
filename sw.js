// Service worker strony Szóstki Powiatu Piaseczyńskiego
// - strona: ZAWSZE najpierw z sieci (świeże dane), a bez internetu – ostatnia zapisana wersja
// - biblioteki i czcionki: z pamięci podręcznej, w tle odświeżane
// - dane z Arkuszy Google / Apps Script: nigdy nie są przechwytywane (zawsze prosto z sieci)
const VERSION = 'szostki-v1';
const CDN_HOSTS = ['cdn.tailwindcss.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(VERSION).then(c => c.add('./')).catch(() => {}));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./', copy)); }
          return res;
        })
        .catch(() => caches.match('./', { ignoreSearch: true }))
    );
    return;
  }

  if (url.origin === self.location.origin || CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(VERSION).then(cache =>
        cache.match(req).then(hit => {
          const net = fetch(req)
            .then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
            .catch(() => hit);
          return hit || net;
        })
      )
    );
  }
});
