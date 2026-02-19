const CACHE_NAME = 'ramadhan-journal-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
  // Cache CDN eksternal agar UI tidak hancur saat offline
  './style.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Quicksand:wght@500;700&display=swap'
];

// 1. Install Service Worker & Cache Aset
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset ke cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Service Worker & Hapus Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Menghapus cache lama:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. Fetch Strategy: Cache First, Network Fallback (Stale-While-Revalidate untuk CDN)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jangan cache request ke Google Script (API) agar data selalu real-time
  if (url.origin.includes('script.google.com')) {
    return; // Biarkan browser menangani request jaringan normal
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, pakai itu. Jika tidak, ambil dari internet.
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        // Opsional: Cache aset baru yang di-fetch secara dinamis
        return caches.open(CACHE_NAME).then((cache) => {
           // Cek validitas response sebelum cache
           if (event.request.method === 'GET' && networkResponse.status === 200) {
               cache.put(event.request, networkResponse.clone());
           }
           return networkResponse;
        });
      });
    })
  );

});
