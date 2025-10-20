const CACHE = 'whefax-master-v8-3';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', (event) => {
  const u = new URL(event.request.url);
  if (u.pathname.endsWith('/data/deals.json') || u.pathname.endsWith('/data/blog.json')) { return; }
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      if (res && res.ok && event.request.method === 'GET' && res.type !== 'opaque') {
        cache.put(event.request, res.clone());
      }
      return res;
    } catch (e) {
      return cached || Response.error();
    }
  }));
});