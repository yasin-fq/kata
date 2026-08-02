// Service Worker untuk Katakita - mendukung penggunaan offline
// Strategi:
//  - network-first untuk navigasi (cegah cache offline saat server hidup)
//  - network-first untuk config.js (supaya perubahan devMode/appsScriptUrl langsung efektif)
//  - cache-first untuk aset statis lainnya (_next/static, gambar, font)

const CACHE_VERSION = "v1.5.0";
const STATIC_CACHE = `baca-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `baca-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "offline.html";

// File yang SELALU diambil dari network dulu (jangan cache-first):
// config.js bisa diubah user tanpa rebuild, jadi harus selalu fresh.
const NETWORK_FIRST_FILES = ["/config.js", "config.js"];

// Daftar file inti yang di-cache saat instalasi (app shell)
// CATATAN: config.js sengaja TIDAK di pre-cache supaya selalu diambil dari network
const PRECACHE_URLS = [
  "./",
  "./offline.html",
  "./manifest.json",
  "./favicon.ico",
  "./favicon.png",
  "./favicon.svg",
  "./katakita-owl.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
];

// ===== INSTALL: pre-cache app shell =====
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn("[SW] Gagal cache:", url, err);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE: bersihkan cache lama =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Cek apakah request adalah config.js (selalu network-first)
function isNetworkFirstFile(url) {
  const pathname = url.pathname;
  if (pathname === "/config.js" || pathname.endsWith("/config.js")) return true;
  return false;
}

// ===== FETCH: strategi caching =====
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya tangani permintaan GET
  if (request.method !== "GET") return;

  // Lewati permintaan non-http(s) (mis. chrome-extension)
  if (!url.protocol.startsWith("http")) return;

  // ===== config.js: NETWORK-FIRST dengan bypass browser cache =====
  // File ini bisa diubah user tanpa rebuild, jadi harus SELALU fresh.
  // Gunakan cache: 'no-cache' supaya fetch selalu validasi ke server
  // (mengabaikan HTTP heuristic caching browser).
  if (isNetworkFirstFile(url)) {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then((response) => {
          // Simpan versi baru ke cache sebagai fallback offline
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Network gagal (offline) - gunakan cache terakhir
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback terakhir: response kosong supaya app tidak crash
          return new Response(
            "// config.js tidak tersedia (offline). Menggunakan default.",
            { headers: { "Content-Type": "application/javascript" } }
          );
        })
    );
    return;
  }

  // Untuk navigasi halaman: network-first dengan fallback cache, lalu offline
  // Hanya fallback ke offline jika network BENAR-BENAR gagal (bukan error HTTP)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Hanya cache response sukses (200)
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          // Network gagal total (server down/offline) - coba cache
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback terakhir: halaman offline
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          // Atau cached root
          return caches.match("/");
        })
    );
    return;
  }

  // Untuk aset statis (_next/static, gambar, font): cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname.match(/\.(?:png|jpg|jpeg|svg|gif|webp|woff2?|ttf|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ===== MESSAGE: kontrol dari halaman =====
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
