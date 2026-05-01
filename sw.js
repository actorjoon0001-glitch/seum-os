// 세움디자인하우징 OS Service Worker
// Web Push 수신 + 알림 클릭 처리.
// 의도적으로 fetch 핸들러는 두지 않는다 (캐시 사용 안 함 → stale 자원 사고 방지).

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    // 과거 캐시가 남아 있다면 일괄 정리
    try {
      var names = await caches.keys();
      await Promise.all(names.map(function (n) { return caches.delete(n); }));
    } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
  })());
});

self.addEventListener('push', function (event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    try { data = { body: event.data && event.data.text() }; } catch (__) {}
  }
  var title = data.title || '세움 OS 알림';
  var options = {
    body: data.body || '',
    icon: '/icons/seum-os-192.png',
    badge: '/icons/seum-os-192.png',
    tag: data.tag || ('seum-' + Date.now()),
    renotify: true,
    data: {
      url: data.url || '/dashboard.html',
      contractId: data.contractId || null
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || '/dashboard.html';
  event.waitUntil((async function () {
    var winList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < winList.length; i++) {
      var c = winList[i];
      try {
        if (c.url.indexOf(target) !== -1 && 'focus' in c) return c.focus();
      } catch (_) {}
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
