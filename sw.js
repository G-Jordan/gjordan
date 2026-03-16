const CACHE = 'g73-static-v2';
const STATIC = [
  '/', '/index.html', '/style.css', '/css/main.css', '/css/g73-fixes.css', '/css/eq.css',
  '/js/site-core.js', '/js/theme/theme-bridge.js', '/js/theme/shared-theme-binder.js', '/js/index/index-boot.js',
  '/js/main.js', '/manifest.json', '/browserconfig.xml', '/humans.txt', '/icons/icon-192.png', '/icons/icon-512.png', '/G73.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function staleWhileRevalidate(req){
  return caches.match(req).then(hit => {
    const fetchPromise = fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE).then(cache => cache.put(req, res.clone()));
      return res;
    }).catch(() => hit);
    return hit || fetchPromise;
  });
}

function networkFirst(req){
  return fetch(req).then(res => {
    if (res && res.ok) caches.open(CACHE).then(cache => cache.put(req, res.clone()));
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (/\.(?:css|js|png|jpg|jpeg|webp|svg|ico|json|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  event.respondWith(networkFirst(req));
});
