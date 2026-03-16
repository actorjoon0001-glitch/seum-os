// 세움디자인하우징 OS 기본 서비스 워커
// - PWA 설치 인식용 최소 구현
// - 복잡한 캐싱은 추후 필요 시 추가

self.addEventListener('install', function (event) {
  // 즉시 활성화 필요 시 아래 주석 해제 가능
  // self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  // 이전 버전 정리 등 필요 시 사용
});

self.addEventListener('fetch', function (event) {
  // 기본적으로 네트워크 그대로 사용 (캐싱 없음)
});

