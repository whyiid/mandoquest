/* MandoQuest service worker — cache-first for offline play */
const CACHE = 'mandoquest-v15';
// Word clips are audio/0001.mp3 .. audio/0166.mp3 (contiguous). Precache them
// ALL on install so every category has sound offline. The child plays as an
// installed PWA with no wifi; later categories (e.g. Food) were never
// runtime-cached, so their clips 404'd offline and fell back to silent TTS.
// 166 clips ≈ 1.4 MB — trivial for an offline kids' app.
const AUDIO = Array.from({ length: 166 }, (_, i) => './audio/' + String(i + 1).padStart(4, '0') + '.mp3');
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './sfx.js',
  './audio/manifest.js',
  './manifest.json',
  './icons/icon.svg',
  ...AUDIO
];

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
    }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
  );
});
