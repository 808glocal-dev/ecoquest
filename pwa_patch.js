/* ==========================================================================
   pwa_patch.js  —  EcoQuest PWA 활성화 패치
   index.html 직접 수정 없이 <head> 태그 주입 + 서비스워커 등록 + 설치 버튼
   로드 위치: index.html 하단 다른 patch.js 들과 함께 <script src="pwa_patch.js"></script>
   ========================================================================== */
(function () {
  // 1) manifest / theme / iOS 메타 태그를 head에 주입
  function injectHead() {
    const head = document.head;
    const add = (tag, attrs) => {
      // 중복 방지
      const key = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join('');
      if (head.querySelector(`${tag}[data-pwa="${btoa(unescape(encodeURIComponent(key))).slice(0,12)}"]`)) return;
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      el.setAttribute('data-pwa', btoa(unescape(encodeURIComponent(key))).slice(0,12));
      head.appendChild(el);
    };
    add('link', { rel: 'manifest', href: '/manifest.json' });
    add('meta', { name: 'theme-color', content: '#1a6b3a' });
    add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
    add('meta', { name: 'apple-mobile-web-app-title', content: 'EcoQuest' });
    add('link', { rel: 'apple-touch-icon', href: '/icons/icon-192.png' });
  }

  // 2) 서비스워커 등록
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
          // 새 버전 감지 시 콘솔 알림 (선택)
          reg.onupdatefound = () => {
            const sw = reg.installing;
            if (!sw) return;
            sw.onstatechange = () => {
              if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] 새 버전 준비됨 — 다음 접속 시 적용');
              }
            };
          };
        })
        .catch((e) => console.log('[PWA] SW 등록 실패:', e.message));
    });
  }

  // 3) '홈 화면에 추가' 설치 버튼 (안드로이드/크롬)
  let deferredPrompt = null;
  function setupInstallButton() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallBtn();
    });
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      const b = document.getElementById('pwaInstallBtn');
      if (b) b.remove();
    });
  }
  function showInstallBtn() {
    if (document.getElementById('pwaInstallBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'pwaInstallBtn';
    btn.textContent = '📲 홈 화면에 앱 설치';
    btn.style.cssText =
      'position:fixed;left:50%;transform:translateX(-50%);bottom:78px;z-index:9998;' +
      'background:linear-gradient(135deg,#1a6b3a,#0f3d20);color:#fff;border:none;' +
      'padding:11px 18px;border-radius:24px;font-size:13px;font-weight:700;font-family:inherit;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer';
    btn.onclick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') btn.remove();
      deferredPrompt = null;
    };
    document.body.appendChild(btn);
    // 10초 뒤 자동으로 살짝 흐리게(방해 최소화)
    setTimeout(() => { if (btn.isConnected) btn.style.opacity = '.85'; }, 10000);
  }

  // 4) iOS 사파리는 beforeinstallprompt 미지원 → 첫 방문 시 안내 배너 1회
  function iosHint() {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (!isIOS || standalone) return;
    if (localStorage.getItem('pwaIosHintShown')) return;
    setTimeout(() => {
      const bar = document.createElement('div');
      bar.style.cssText =
        'position:fixed;left:12px;right:12px;bottom:78px;z-index:9998;background:#fff;' +
        'border:1.5px solid #1a6b3a;border-radius:14px;padding:12px 14px;font-size:12px;' +
        'color:#1a2e1a;line-height:1.6;box-shadow:0 4px 16px rgba(0,0,0,.18)';
      bar.innerHTML =
        '📲 <b>홈 화면에 추가</b>하면 앱처럼 쓸 수 있어요<br>' +
        '사파리 하단 <b>공유 버튼</b> → <b>"홈 화면에 추가"</b>' +
        '<span id="pwaIosX" style="float:right;color:#888;cursor:pointer;font-weight:700">✕</span>';
      document.body.appendChild(bar);
      document.getElementById('pwaIosX').onclick = () => {
        bar.remove();
        localStorage.setItem('pwaIosHintShown', '1');
      };
    }, 3000);
  }

  function boot() {
    injectHead();
    registerSW();
    setupInstallButton();
    iosHint();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
