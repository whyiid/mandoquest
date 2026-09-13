/* MandoQuest service worker — cache-first for offline play */
const CACHE = 'mandoquest-v31';
// Word clips are audio/0001.mp3 .. audio/0450.mp3 (contiguous). Precache them
// ALL on install so every category has sound offline. The child plays as an
// installed PWA with no wifi; later categories (e.g. Food) were never
// runtime-cached, so their clips 404'd offline and fell back to silent TTS.
// 450 clips ≈ 3.8 MB — trivial for an offline kids' app.
const AUDIO = Array.from({ length: 450 }, (_, i) => './audio/' + String(i + 1).padStart(4, '0') + '.mp3');
// CORE must be cached for the app to run offline at all. AUDIO is desirable but
// optional — see the install handler for why the two are no longer one list.
const CORE = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './sfx.js',
  './speech.js',
  './learning.js',
  './audio/manifest.js',
  './manifest.json',
  './icons/icon.svg'
];

// Install in two stages, and never let audio block the update.
//
// This used to be one addAll() over all 459 entries. addAll is all-or-nothing:
// a single clip failing — one dropped request on a phone — rejected the whole
// install, skipWaiting() never ran, and the OLD worker kept serving the OLD app
// indefinitely. That is how a device ends up months behind while the server is
// current. The nine core files still have to succeed; the 450 clips are fetched
// individually and allowed to fail, because a missing clip only costs that one
// word its recording (speak() falls back to the browser voice) and the runtime
// handler will cache it on first play anyway.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE).then(() => c))
      .then(c => Promise.allSettled(AUDIO.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
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
