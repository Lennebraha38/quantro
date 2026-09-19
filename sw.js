const CACHE = 'quantro-v1.11.0';
const SHELL = ['/index.html', '/hakkimizda.html', '/arastirma.html', '/simulasyon.html', '/blog.html', '/quantro-lab.html', '/qtr-admin.html', '/quantro.js', '/lab-core.js', '/style.css', '/app.js', '/manifest.webmanifest', '/css/base.css', '/css/blog.css', '/css/lab.css', '/css/admin.css'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  if (u.pathname.startsWith('/api/')) return;
  if (e.request.method !== 'GET') return;

  const norm = u.pathname === '/' ? '/index.html' : u.pathname;
  const isShell = SHELL.includes(norm);

  if (isShell) {
    // Network-first: güncellemeler hemen görünsün; offline'da cache'e düş.
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        try {
          const fresh = await fetch(e.request);
          if (fresh.ok) {
            c.put(new Request(norm), fresh.clone());
            return fresh;
          }
        } catch (err) {}
        const cached = await c.match(new Request(norm));
        return cached || fetch(e.request).catch(() => cached);
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return r;
      })
      .catch(() =>
        caches.match(e.request).then((hit) =>
          hit || (e.request.mode === 'navigate' ? caches.match('/index.html') : undefined)
        )
      )
  );
});
