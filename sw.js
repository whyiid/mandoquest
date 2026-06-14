/* MandoQuest service worker — cache-first for offline play */
const CACHE = 'mandoquest-v12';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './sfx.js',
  './audio/manifest.js',
  './manifest.json',
  './icons/icon.svg'
];
// Individual audio clips (audio/<id>.m4a) are not precached — the fetch
// handler below runtime-caches them on first play, so they go offline as
// the child uses them without bloating the install step.

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      // runtime-cache same-origin GETs so the app keeps working offline after first visit
      if (res && res.ok && e.request.url.startsWith(self.location.origin)) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
