// EcoQuest Service Worker
// 버전 올릴 때마다 CACHE 이름의 숫자를 바꾸면 사용자 기기에서 자동 갱신됨
const CACHE = 'ecoquest-v1';

// 설치: 앱 셸(핵심 파일)만 미리 캐시
const CORE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

// 활성화: 옛 캐시 정리
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // GET 이외(POST 등)와 Firebase/Firestore/구글 API 요청은 항상 네트워크로 (캐시 금지)
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const bypass = [
    'firestore.googleapis.com',
    'firebase',
    'googleapis.com',
    'gstatic.com',
    'identitytoolkit',
    'securetoken'
  ];
  if (bypass.some((h) => url.hostname.includes(h))) return;

  // HTML 문서(네비게이션): 네트워크 우선, 실패 시 캐시 (오프라인 대비)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/index.html')))
    );
    return;
  }

  // 정적 자원(js/css/img): 캐시 우선, 없으면 네트워크 후 캐시에 저장
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached)
    )
  );
});
