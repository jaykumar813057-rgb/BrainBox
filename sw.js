/* Offline support: network-first, cache fallback. Update aane par V badal do (brainbox-v2 ...). */
const V='brainbox-v2';
const ASSETS=['./','index.html','memora.html','mergex.html','lb.js','core.js','ui.css','manifest.json','icon-192.png','icon-512.png'];

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(
  fetch(r).then(res=>{
   const cp=res.clone();
   caches.open(V).then(c=>c.put(r,cp));
   return res;
  }).catch(()=>caches.match(r).then(m=>m||caches.match('index.html')))
 );
});
