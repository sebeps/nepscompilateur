const V = 'bilan-v10', SHARED = 'bilan-shared';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './logo-neps.png', './vendor/xlsx.full.min.js', './vendor/jsQR.js', './worker.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V && x !== SHARED).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  // Réception de fichiers partagés depuis le menu "Partager" d'Android
  if (r.method === 'POST' && u.searchParams.has('share')) {
    e.respondWith((async () => {
      const fd = await r.formData(), c = await caches.open(SHARED);
      for (const f of fd.getAll('files')) {
        await c.put(new Request(new URL('./shared/' + encodeURIComponent(f.name), self.registration.scope).href), new Response(f));
      }
      return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (r.method === 'GET' && u.hostname === 'cdn.jsdelivr.net' && /jsqr/i.test(u.pathname)) { // lecteur de QR codes : mis en cache à la première utilisation
    e.respondWith(caches.open(V).then(async c => {
      const h = await c.match(r); if (h) return h;
      try { const res = await fetch(r); if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; } catch (x) { return Response.error(); }
    }));
    return;
  }
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.endsWith('index.json') || u.pathname.includes('/files/')) return; // données : toujours réseau
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || (r.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
