const CACHE_NAME = "whefax-v10.1";
const FILES_TO_CACHE = [
  "/",
  "index.html",
  "styles.css",
  "user.js",
  "backend.js",
  "manifest.json",
  "assets/header.svg",
  "assets/favicon.png"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(c=>c.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r || fetch(e.request))
  );
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.map(k=>k!==CACHE_NAME && caches.delete(k))
    ))
  );
});
