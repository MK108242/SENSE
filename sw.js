// リフォーム現地調査 オフライン用サービスワーカー
// アプリを更新したら VERSION を変えてください
const VERSION = 'v18';
const CACHE = 'genchi-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('genchi-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 保存済みのファイルをすぐ表示し、通信できるときは裏で最新版に更新
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // 同じ場所に置く図面アプリ（/zumen/）には関与しない
  if (url.pathname.startsWith(new URL('./zumen/', self.registration.scope).pathname)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: true}) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response('オフラインです', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }));
});
