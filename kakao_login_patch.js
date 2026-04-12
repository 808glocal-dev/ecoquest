/* =====================================================
   EcoQuest – 카카오 로그인 패치 v3
   Kakao SDK v2 - authorize 방식
   ===================================================== */
(function () {
  'use strict';

  const KAKAO_JS_KEY = '649f9467c7050c5be787d09b97ed7023';

  // 카카오 SDK 로드
  function loadKakaoSDK() {
    return new Promise((res) => {
      if (window.Kakao && window.Kakao.isInitialized()) { res(); return; }
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY); res(); return;
      }
      const s = document.createElement('script');
      s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      s.crossOrigin = 'anonymous';
      s.onload = () => { window.Kakao.init(KAKAO_JS_KEY); res(); };
      document.head.appendChild(s);
    });
  }

  // 카카오 access token으로 유저 정보 가져오기
  function getKakaoUserInfo(accessToken) {
    return new Promise((res, rej) => {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: res,
        fail: rej
      });
    });
  }

  // Firebase 이메일/비밀번호로 카카오 계정 처리
  async function handleKakaoUser(kakaoId, nickname, profileImg) {
    const fakeEmail = `kakao_${kakaoId}@ecoquest.kakao`;
    const fakePassword = `kko_${kakaoId}_eq2024!`;

    try {
      const mod = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js');
      const auth = mod.getAuth();

      try {
        // 로그인 시도
        await mod.signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
        toast('🟡 카카오 로그인 성공!');
      } catch (e) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
          // 신규 → 계정 생성
          const cred = await mod.createUserWithEmailAndPassword(auth, fakeEmail, fakePassword);
          await mod.updateProfile(cred.user, {
            displayName: nickname,
            photoURL: profileImg || null
          });
          toast('🎉 카카오로 가입됐어요!');
        } else {
          toast('Firebase 오류: ' + e.code);
        }
      }
    } catch(e) {
      toast('오류: ' + e.message);
    }
  }

  // 카카오 로그인 버튼 클릭
  async function doKakaoLogin() {
    try {
      await loadKakaoSDK();
    } catch(e) {
      toast('카카오 SDK 오류'); return;
    }

    // SDK v2: authorize 팝업 방식
    window.Kakao.Auth.authorize({
      redirectUri: window.location.origin,
      prompt: 'login',
      throughTalk: false,
    });
  }

  // 페이지 로드 시 카카오 인증 코드 처리 (리다이렉트 후)
  async function handleKakaoRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    // URL에서 code 제거
    window.history.replaceState({}, '', window.location.pathname);

    toast('카카오 인증 처리 중...');

    try {
      await loadKakaoSDK();

      // access token 교환 (REST API - CORS 문제로 직접 호출)
      // 대신 SDK의 getAccessToken 방식 사용
      // code를 받아서 Kakao.Auth.setAccessToken 없이
      // REST API로 token 교환 필요
      // Vercel 서버리스 함수 없이 하려면 팝업 방식 사용

      // 팝업 방식으로 전환 안내
      toast('리다이렉트 방식은 서버가 필요해요. 팝업 방식으로 다시 눌러주세요!');
    } catch(e) {
      toast('처리 오류: ' + e.message);
    }
  }

  // 팝업 방식으로 완전 전환
  async function doKakaoLoginPopup() {
    try {
      await loadKakaoSDK();
    } catch(e) {
      toast('카카오 SDK 오류'); return;
    }

    // SDK v2 팝업 방식
    window.Kakao.Auth.loginForm({
      success: async function(authObj) {
        toast('카카오 정보 불러오는 중...');
        try {
          const res = await getKakaoUserInfo(authObj.access_token);
          const kakaoId = String(res.id);
          const nickname = res.kakao_account?.profile?.nickname
            || res.properties?.nickname
            || '카카오유저';
          const profileImg = res.kakao_account?.profile?.profile_image_url
            || res.properties?.profile_image || '';
          await handleKakaoUser(kakaoId, nickname, profileImg);
        } catch(e) {
          toast('유저 정보 오류: ' + e.message);
        }
      },
      fail: function(err) {
        console.log('카카오 로그인 실패', err);
        toast('카카오 로그인 취소됐어요');
      }
    });
  }

  // 카카오 버튼 주입
  async function injectKakaoBtn() {
    if (document.getElementById('btnKakaoLogin')) return;
    const googleBtn = document.getElementById('btnLogin');
    if (!googleBtn) return;

    await loadKakaoSDK();

    const kakaoBtn = document.createElement('button');
    kakaoBtn.id = 'btnKakaoLogin';
    kakaoBtn.style.cssText = `
      display:flex;align-items:center;gap:10px;
      background:#FEE500;color:#191919;border:none;
      border-radius:16px;padding:16px 28px;
      font-size:15px;font-weight:700;cursor:pointer;
      font-family:inherit;
      box-shadow:0 8px 24px rgba(0,0,0,.15);
      width:100%;max-width:320px;
      justify-content:center;margin-top:12px;
    `;
    kakaoBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 2C5.925 2 2 5.364 2 9.5c0 2.636 1.643 4.95 4.142 6.28L5.2 19.5l4.643-3.077c.38.052.765.077 1.157.077 5.075 0 9-3.364 9-7.5S16.075 2 11 2z" fill="#191919"/>
      </svg>
      카카오로 시작하기
    `;
    kakaoBtn.onclick = doKakaoLoginPopup;
    googleBtn.parentElement.insertBefore(kakaoBtn, googleBtn.nextSibling);
  }

  // 로그인 화면 감지
  function watchLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    if (!loginScreen) return;
    if (loginScreen.style.display === 'flex') injectKakaoBtn();
    const observer = new MutationObserver(() => {
      if (loginScreen.style.display === 'flex') injectKakaoBtn();
    });
    observer.observe(loginScreen, { attributes: true, attributeFilter: ['style'] });
  }

  // 로그아웃 시 카카오도 같이
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    const origClick = logoutBtn.onclick;
    logoutBtn.onclick = function() {
      if (window.Kakao?.isInitialized() && window.Kakao?.Auth?.getAccessToken()) {
        window.Kakao.Auth.logout();
      }
      if (origClick) origClick.call(this);
    };
  }

  // 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchLoginScreen);
  } else {
    watchLoginScreen();
  }
  setTimeout(watchLoginScreen, 800);
  setTimeout(watchLoginScreen, 2000);

})();
