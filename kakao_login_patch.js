/* =====================================================
   EcoQuest – 카카오 로그인 패치 v7
   인가 코드 즉시 처리 (만료 방지)
   ===================================================== */
(function () {
  'use strict';

  const KAKAO_JS_KEY = '649f9467c7050c5be787d09b97ed7023';

  function getRedirectUri() {
    return window.location.origin + '/';
  }

  function loadKakaoSDK() {
    return new Promise((res) => {
      if (window.Kakao && window.Kakao.isInitialized()) { res(); return; }
      if (window.Kakao) { window.Kakao.init(KAKAO_JS_KEY); res(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = () => { window.Kakao.init(KAKAO_JS_KEY); res(); };
      document.head.appendChild(s);
    });
  }

  async function handleKakaoCode(code) {
    toast('카카오 로그인 처리 중...');
    const redirectUri = getRedirectUri();
    try {
      const r = await fetch('/api/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });
      const data = await r.json();
      if (data.error) {
        toast('카카오 오류: ' + data.error);
        console.error('카카오 에러 상세:', data);
        return;
      }

      const { id: kakaoId, nickname, profileImage } = data;
      const fakeEmail = 'kakao_' + kakaoId + '@ecoquest.kakao';
      const fakePassword = 'kko_' + kakaoId + '_eq2024!';

      // Firebase Auth 모듈 로드
      const mod = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js');
      const auth = mod.getAuth();

      try {
        await mod.signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
        toast('카카오 로그인 성공!');
      } catch (e) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
          const cred = await mod.createUserWithEmailAndPassword(auth, fakeEmail, fakePassword);
          await mod.updateProfile(cred.user, {
            displayName: nickname,
            photoURL: profileImage || null,
          });
          toast('카카오로 가입됐어요!');
        } else {
          toast('Firebase 오류: ' + e.code);
        }
      }
    } catch (e) {
      toast('처리 오류: ' + e.message);
    }
  }

  // 페이지 로드 시 카카오 코드 즉시 처리
  async function checkKakaoRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    // URL에서 code 즉시 제거
    window.history.replaceState({}, '', window.location.pathname);

    // 코드 즉시 처리 (만료 방지 - 대기 없음)
    await handleKakaoCode(code);
  }

  async function doKakaoLogin() {
    await loadKakaoSDK();
    window.Kakao.Auth.authorize({
      redirectUri: getRedirectUri(),
    });
  }

  async function injectKakaoBtn() {
    if (document.getElementById('btnKakaoLogin')) return;
    const googleBtn = document.getElementById('btnLogin');
    if (!googleBtn) return;
    await loadKakaoSDK();

    const kakaoBtn = document.createElement('button');
    kakaoBtn.id = 'btnKakaoLogin';
    kakaoBtn.style.cssText = [
      'display:flex', 'align-items:center', 'gap:10px',
      'background:#FEE500', 'color:#191919', 'border:none',
      'border-radius:16px', 'padding:16px 28px',
      'font-size:15px', 'font-weight:700', 'cursor:pointer',
      'font-family:inherit',
      'box-shadow:0 8px 24px rgba(0,0,0,.15)',
      'width:100%', 'max-width:320px',
      'justify-content:center', 'margin-top:12px'
    ].join(';');
    kakaoBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><path d="M11 2C5.925 2 2 5.364 2 9.5c0 2.636 1.643 4.95 4.142 6.28L5.2 19.5l4.643-3.077c.38.052.765.077 1.157.077 5.075 0 9-3.364 9-7.5S16.075 2 11 2z" fill="#191919"/></svg> 카카오로 시작하기';
    kakaoBtn.onclick = doKakaoLogin;
    googleBtn.parentElement.insertBefore(kakaoBtn, googleBtn.nextSibling);
  }

  function watchLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    if (!loginScreen) return;
    if (loginScreen.style.display === 'flex') injectKakaoBtn();
    const observer = new MutationObserver(() => {
      if (loginScreen.style.display === 'flex') injectKakaoBtn();
    });
    observer.observe(loginScreen, { attributes: true, attributeFilter: ['style'] });
  }

  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    const origClick = logoutBtn.onclick;
    logoutBtn.onclick = function () {
      if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Auth.getAccessToken()) {
        window.Kakao.Auth.logout();
      }
      if (origClick) origClick.call(this);
    };
  }

  // 카카오 리다이렉트 코드 즉시 처리
  checkKakaoRedirect();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchLoginScreen);
  } else {
    watchLoginScreen();
  }
  setTimeout(watchLoginScreen, 800);
  setTimeout(watchLoginScreen, 2000);

})();
