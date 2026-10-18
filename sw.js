// Talli app: keeps the home and order pages available offline and quick to open. Never caches Google requests.
var CACHE = "talli-v1";
var CORE = ["/", "/order", "/logo.svg", "/mark.svg", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request, url = new URL(req.url);
  if(req.method !== "GET" || url.origin !== location.origin) return;          // order sending and Google look-ups go straight to the network
  if(req.mode === "navigate"){                                                  // pages: newest from the network, cached copy when offline
    e.respondWith(fetch(req).then(function(res){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); return res; })
      .catch(function(){ return caches.match(req, {ignoreSearch:true}).then(function(r){ return r || caches.match("/"); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){
    return r || fetch(req).then(function(res){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); return res; });
  }));
});
