/* Service worker – Peta Lokasi DPRKP Ngawi
   Mempercepat kunjungan berikutnya:
   - halaman & kode aplikasi: ambil versi terbaru dari jaringan, cadangan dari cache (offline)
   - library, data, logo: dari cache (berversi ?v=…)
   - ubin citra satelit: disimpan di cache (maks. ±4000 ubin) agar area yang sama tampil instan */
const VERSION = '2026.11.20';
const APP_CACHE = 'peta-app-' + VERSION;
const TILE_CACHE = 'peta-tiles-v1';
const CORE = ['./', 'index.html', 'lib/leaflet/leaflet.js', 'lib/leaflet/leaflet.css', 'lib/leaflet-geoman.min.js', 'lib/leaflet-geoman.css', 'assets/logo-ngawi.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('peta-app-') && k !== APP_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const isTile = u => /(arcgisonline\.com|arcgis\.com)\/.*\/(tile|MapServer\/tile)\//i.test(u) && !/tilemap/i.test(u);
let tileWrites = 0;
async function trimTiles() {
  const c = await caches.open(TILE_CACHE);
  const keys = await c.keys();
  if (keys.length > 4000) await Promise.all(keys.slice(0, keys.length - 3500).map(k => c.delete(k)));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // ubin citra: cache dulu, jaringan bila belum ada
  if (isTile(req.url)) {
    e.respondWith(caches.open(TILE_CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); if (++tileWrites % 200 === 0) trimTiles(); }
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // library, data, gambar: cache dulu
  if (/\/(lib|data|assets)\//.test(url.pathname)) {
    e.respondWith(caches.open(APP_CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  // halaman, js/app.js, css: jaringan dulu (selalu versi terbaru), cache bila offline
  e.respondWith(fetch(req).then(res => {
    if (res.ok) caches.open(APP_CACHE).then(c => c.put(req, res.clone()));
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
});
