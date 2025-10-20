const CACHE_NAME = "whefax-v10";
const FILES = [
  "index.html","styles.css","user.js","backend.js",
  "manifest.json","assets/header.svg","data/deals.json"
];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>x!==CACHE_NAME&&caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  e.respondWith(
    caches.match(e.request).then(r=>{
      const f=fetch(e.request).then(res=>{
        if(res&&res.ok)caches.open(CACHE_NAME).then(c=>c.put(e.request,res.clone()));
        return res;
      }).catch(()=>r);
      return r||f;
    })
  );
});
