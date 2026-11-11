// Compta Médecin — fonctionnement hors ligne.
// Ce fichier ne met en cache que le programme (pages, icônes). Les données restent dans le téléphone
// (IndexedDB) et ne transitent jamais par ce fichier ni par le site.
const VERSION = "compta-v1";
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Hors ligne d'abord : on répond avec la copie locale, et on rafraîchit la copie en arrière-plan
// quand le réseau est disponible (la nouvelle version sert à l'ouverture suivante).
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await cache.match("./index.html") : null);
    const network = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return cached || (await network) || new Response("Hors ligne", { status: 503 });
  }));
});
