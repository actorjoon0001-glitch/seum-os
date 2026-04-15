// 세움디자인하우징 OS Service Worker
// 기존 캐싱 동작이 배포 후에도 stale 자원을 돌려주는 문제가 생겨
// 이 워커는 활성화 즉시 모든 캐시를 비우고 스스로 등록 해제한다.
// 이후에는 일반 네트워크 요청만 남는다.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      var names = await caches.keys();
      await Promise.all(names.map(function (n) { return caches.delete(n); }));
    } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
  })());
});

// fetch 핸들러는 일부러 추가하지 않는다 (no-op fetch 경고 제거 + 오버헤드 제거).
