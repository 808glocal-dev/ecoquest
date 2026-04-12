/* =====================================================
   EcoQuest – 카카오 로그인 패치
   ===================================================== */
(function () {
  'use strict';

  const KAKAO_JS_KEY = '649f9467c7050c5be787d09b97ed7023';

  // 카카오 SDK 로드
  function loadKakaoSDK() {
    return new Promise((res) => {
      if (window.Kakao) { res(); return; }
      const s = document.createElement('script');
      s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      s.onload = () => {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JS_KEY);
        }
        res();
      };
      document.head.appendChild(s);
    });
  }

  // 카카오 로그인 버튼 주입
  async function injectKakaoBtn() {
    await loadKakaoSDK();

    const loginScreen = document.getElementById('loginScreen');
    if (!loginScreen) return;
    if (loginScreen.querySelector('#btnKakaoLogin')) return;

    // 구글 버튼 아래에 카카오 버튼 추가
    const googleBtn = document.getElementById('btnLogin');
    if (!googleBtn) return;

    const kakaoBtn = document.createElement('button');
    kakaoBtn.id = 'btnKakaoLogin';
    kakaoBtn.style.cssText = `
      display:flex;align-items:center;gap:12px;
      background:#FEE500;color:#000;border:none;
      border-radius:16px;padding:16px 28px;
      font-size:15px;font-weight:700;cursor:pointer;
      font-family:inherit;box-shadow:0 8px 24px rgba(0,0,0,.15);
      width:100%;max-width:320px;justify-content:center;margin-top:12px;
    `;
    kakaoBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C5.58 2 2 4.91 2 8.5c0 2.28 1.46 4.28 3.67 5.47l-.94 3.5 4.07-2.68c.39.05.79.08 1.2.08 4.42 0 8-2.91 8-6.5S14.42 2 10 2z" fill="#000"/>
      </svg>
      카카오로 시작하기
    `;

    kakaoBtn.onclick = doKakaoLogin;
    googleBtn.parentElement.insertBefore(kakaoBtn, googleBtn.nextSibling);
  }

  // 카카오 로그인 실행
  async function doKakaoLogin() {
    await loadKakaoSDK();
    window.Kakao.Auth.login({
      success: async (authObj) => {
        try {
          // 카카오 유저 정보 가져오기
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: async (res) => {
              const kakaoId = res.id;
              const nickname = res.kakao_account?.profile?.nickname || '카카오유저';
              const profileImg = res.kakao_account?.profile?.profile_image_url || '';

              // Firebase 이메일 계정으로 변환 (카카오ID 기반)
              const fakeEmail = `kakao_${kakaoId}@ecoquest.kakao`;
              const fakePassword = `kakao_${kakaoId}_ecoquest_2024`;

              try {
                // 먼저 로그인 시도
                const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js');
                const auth = getAuth();
                await signInWithEmailAndPassword(auth, fakeEmail, fakePassword);
                toast('🟡 카카오 로그인 성공!');
              } catch (loginErr) {
                if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/invalid-email') {
                  // 첫 로그인 → 계정 생성
                  try {
                    const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js');
                    const auth = getAuth();
                    const cred = await createUserWithEmailAndPassword(auth, fakeEmail, fakePassword);
                    await updateProfile(cred.user, { displayName: nickname, photoURL: profileImg });
                    toast('🎉 카카오 계정으로 가입됐어요!');
                  } catch (createErr) {
                    toast('가입 실패: ' + createErr.message);
                  }
                } else {
                  toast('로그인 실패: ' + loginErr.message);
                }
              }
            },
            fail: (err) => {
              toast('카카오 정보 가져오기 실패');
              console.error(err);
            }
          });
        } catch (e) {
          toast('오류: ' + e.message);
        }
      },
      fail: (err) => {
        toast('카카오 로그인 취소됐어요');
        console.error(err);
      }
    });
  }

  // 로그인 화면 감지 후 버튼 주입
  function watchLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    if (!loginScreen) return;

    const observer = new MutationObserver(() => {
      if (loginScreen.style.display !== 'none') {
        injectKakaoBtn();
      }
    });
    observer.observe(loginScreen, { attributes: true, attributeFilter: ['style'] });

    // 이미 보이고 있으면 바로 주입
    if (loginScreen.style.display === 'flex') {
      injectKakaoBtn();
    }
  }

  // 로그아웃 시 카카오도 같이 로그아웃
  const _origLogout = document.getElementById('btnLogout')?.onclick;
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    const origClick = logoutBtn.onclick;
    logoutBtn.onclick = async () => {
      if (window.Kakao?.Auth?.getAccessToken()) {
        window.Kakao.Auth.logout();
      }
      if (origClick) origClick();
    };
  }

  // 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchLoginScreen);
  } else {
    watchLoginScreen();
  }

  // showApp/onAuthStateChanged 이후에도 로그인 화면 감지
  setTimeout(watchLoginScreen, 500);
  setTimeout(watchLoginScreen, 1500);

})();
