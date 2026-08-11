const CACHE = 'quantro-v1.6.0';
const SHELL = ['/index.html', '/blog.html', '/quantro-lab.html', '/quantro.js', '/lab-core.js'];

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
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const cached = await c.match(new Request(norm));
        fetch(e.request)
          .then((r) => {
            if (r.ok) {
              const clone = r.clone();
              caches.open(CACHE).then((cc) => cc.put(new Request(norm), clone));
            }
          })
          .catch(() => {});
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
