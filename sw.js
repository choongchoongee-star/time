// 간단한 오프라인 캐시 서비스워커 (네트워크 우선 + 캐시 폴백)
var CACHE = "tlb-v2";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // 일부 아이콘이 없어도 설치가 실패하지 않도록 개별 처리
      return Promise.all(ASSETS.map(function (url) {
        return c.add(url).catch(function () {});
      }));
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 네트워크 우선: 온라인이면 항상 최신을 받고, 받은 응답을 캐시에 갱신.
// 네트워크 실패(오프라인) 시에만 캐시로 폴백.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy).catch(function () {}); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        return cached || caches.match("./index.html");
      });
    })
  );
});
