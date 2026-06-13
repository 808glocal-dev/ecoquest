/* =====================================================
   EcoQuest – guest_mode_patch.js
   게스트(익명) 진입 + 이어받기 가입 + 컨퍼런스 QR
   ─────────────────────────────────────────────────────
   • "구경만 할게요" / ?booth=xxx QR 스캔 → 익명 로그인 즉시 진입
   • 닉네임 자동: 컨퍼런스(?booth)=서울기후테크컨퍼런스2026게스트N
                 일반 구경하기=게스트N   (stats/global 카운터로 순번)
   • 절감량·미션·챌린지 전부 일반 회원과 동일 동작
   • 가입(구글/카카오) 시 linkWithCredential로 게스트 수치 그대로 이어받기
   • 익명도 totalUsers 카운트 (원본 loadUser가 처리)
   ─────────────────────────────────────────────────────
   ★ 로드 위치: kakao_login_patch.js 바로 "위"에 넣어주세요.
     (카카오 이어받기 redirect를 원본보다 먼저 가로채야 함)
   ===================================================== */
(function () {
  'use strict';
  console.log('[guest_mode_patch] 🚀 시작');

  const params  = new URLSearchParams(location.search);
  const BOOTH   = params.get('booth');     // 'ddp' 등 → 컨퍼런스 게스트
  const IS_CONF = !!BOOTH;
  const FB_AUTH = 'https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js';
  const FB_FS   = 'https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js';
  const KAKAO_KEY      = '649f9467c7050c5be787d09b97ed7023';
  const KAKAO_REDIRECT = 'https://www.eco-quest.kr';

  let _authMod = null, _auth = null, _fsMod = null;
  let _firstAuth = true, _guestStarting = false;

  async function authMod(){ if(!_authMod){ _authMod = await import(FB_AUTH); _auth = _authMod.getAuth(); } return _authMod; }
  async function fsMod(){ if(!_fsMod){ _fsMod = await import(FB_FS); } return _fsMod; }

  function isGuestUser(){ return !!(window.ME && window.ME.isAnonymous); }
  function setText(id,t){ const el=document.getElementById(id); if(el) el.textContent=t; }
  function hideIntro(){ try{localStorage.setItem('eq_intro_done','1');}catch(e){} const el=document.getElementById('introScreen'); if(el) el.style.display='none'; }
  function waitFor(cond, timeout){
    return new Promise(res=>{
      const t0=Date.now();
      const iv=setInterval(()=>{ let ok=false; try{ok=cond();}catch(e){}
        if(ok || Date.now()-t0>timeout){ clearInterval(iv); res(ok); } },100);
    });
  }

  /* ════════ 카카오 redirect 즉시 가로채기 (원본보다 먼저) ════════ */
  // 가입(이어받기) 흐름으로 돌아온 거면 code를 보관하고 URL에서 즉시 제거 →
  // 원본 kakao_login_patch가 일반 가입으로 처리하는 걸 막는다.
  (function earlyKakaoGuard(){
    const code = params.get('code');
    if(code && localStorage.getItem('eq_kakao_linking')==='1'){
      window._eqKakaoLinkCode = code;
      try{ history.replaceState({}, '', location.pathname); }catch(e){}
    }
  })();

  /* ════════ 게스트 닉네임 카운터 (atomic) ════════ */
  async function assignGuestNickname(){
    const prefix = IS_CONF ? '서울기후테크컨퍼런스2026게스트' : '게스트';
    const field  = IS_CONF ? 'confGuestCount' : 'guestCount';
    let n = 0;
    try{
      const fs = await fsMod();
      const ref = window.FB.doc(window.FB.db,'stats','global');
      await fs.runTransaction(window.FB.db, async (t)=>{
        const s = await t.get(ref);
        n = (((s.exists()? s.data() : {})[field]) || 0) + 1;
        t.set(ref, { [field]: n }, { merge:true });
      });
    }catch(e){ n = Date.now() % 100000; } // 트랜잭션 실패 시 fallback
    return prefix + n;
  }

  /* ════════ 게스트 진입 (익명 로그인) ════════ */
  async function startGuest(){
    if(_guestStarting) return;
    _guestStarting = true;
    window.GUEST_MODE = true;
    // 자동 사용법/온보딩 투어 차단 (방어)
    try{ localStorage.setItem('eq_onboarding_done','1'); localStorage.setItem('eq_slideshow_done','1'); }catch(e){}
    try{
      const mod = await authMod();
      if(_auth.currentUser){ return; }     // 이미 로그인(실계정/복원된 익명)
      await mod.signInAnonymously(_auth);   // → onAuthStateChanged 가 잡음
    }catch(e){
      _guestStarting = false;
      window.toast && window.toast('게스트 진입 실패: '+(e.code||e.message));
    }
  }

  /* ════════ 온보딩 모달 차단 (openOv 후킹) ════════ */
  function hookOpenOv(){
    if(window._guestOpenOvHooked) return;
    const orig = window.openOv;
    if(typeof orig !== 'function'){ setTimeout(hookOpenOv,300); return; }
    window.openOv = function(id){
      if(window.GUEST_MODE && isGuestUser() && id==='ovOnboard') return; // 게스트는 온보딩 X
      return orig.apply(this, arguments);
    };
    window._guestOpenOvHooked = true;
  }

  /* ════════ 게스트 로그인 후처리 ════════ */
  async function handleGuestPostLogin(user){
    window.GUEST_MODE = true;
    window.ME = user;
    await waitFor(()=> window.UDATA, 5000);  // 원본 loadUser 가 UDATA 채울 때까지
    if(!window.UDATA) window.UDATA = {};

    if(!window.UDATA.nickname){
      const nick = await assignGuestNickname();
      try{ const fs = await fsMod();
        await fs.updateDoc(window.FB.doc(window.FB.db,'users',user.uid), { nickname:nick, isGuest:true });
      }catch(e){}
      window.UDATA.nickname = nick;
      window.UDATA.isGuest  = true;
    }
    const n = window.UDATA.nickname;
    setText('uName', n); setText('sName','🌱 '+n); setText('myName','🌱 '+n);

    window.closeOv && window.closeOv('ovOnboard');
    window.updateUI && window.updateUI();
    window.showApp  && window.showApp();
    window.renderTodayQuests && window.renderTodayQuests(user.uid);
    window.renderHomeChalls  && window.renderHomeChalls();
    setTimeout(()=>{ window.loadFeed && window.loadFeed(); }, 500);

    injectSignupUI();
    // 컨퍼런스 부스 진입이면 바로 챌린지 탭으로 (booth_patch goMissions 버그 보완)
    if(BOOTH){ setTimeout(()=>{ window.goPage && window.goPage('chal'); }, 1200); }
  }

  /* ════════ 가입(이어받기) UI ════════ */
  function injectSignupUI(){
    const logoutBtn = document.getElementById('btnLogout');
    if(logoutBtn && isGuestUser()){
      if(!logoutBtn._origOnclick) logoutBtn._origOnclick = logoutBtn.onclick;
      logoutBtn.textContent = '가입하기';
      logoutBtn.onclick = openGuestSignup;
      logoutBtn.style.background = 'rgba(255,255,255,.35)';
      logoutBtn.style.fontWeight = '800';
    }
    const myPage = document.getElementById('page-my');
    if(myPage && isGuestUser() && !document.getElementById('guestSignupBanner')){
      const banner = document.createElement('div');
      banner.id = 'guestSignupBanner';
      banner.style.cssText = 'margin:12px;padding:14px 16px;background:linear-gradient(135deg,#fff8e1,#fffde7);border:1.5px solid #F39C12;border-radius:14px';
      banner.innerHTML = `<div style="font-size:13px;font-weight:900;color:#8B5E04;margin-bottom:4px">🌱 지금은 게스트로 둘러보는 중이에요</div><div style="font-size:11px;color:#8B5E04;line-height:1.6;margin-bottom:10px">가입하면 지금까지 쌓은 기록(절감량·미션·챌린지)이 그대로 저장되고, 닉네임도 원하는 걸로 바꿀 수 있어요!</div><button onclick="window._openGuestSignup()" style="width:100%;background:linear-gradient(135deg,#F39C12,#E67E22);color:#fff;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">📲 가입하고 기록 저장하기</button>`;
      myPage.insertBefore(banner, myPage.firstChild);
    }
  }

  function openGuestSignup(){
    document.getElementById('ovGuestSignup')?.remove();
    const m = document.createElement('div');
    m.id = 'ovGuestSignup'; m.className = 'overlay on';
    m.innerHTML = `<div class="modal" style="padding:24px 20px 28px">
      <button class="modal-close" onclick="document.getElementById('ovGuestSignup').remove()">✕</button>
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:44px">🌱</div>
        <div style="font-size:18px;font-weight:900;color:#1B5E20;margin-top:8px">가입하고 기록 저장하기</div>
        <div style="font-size:12px;color:#888;margin-top:8px;line-height:1.6">아래 버튼을 누르면 끝!<br/>처음이면 새로 가입, 이미 계정이 있으면<br/>그 계정으로 자동 로그인돼요.</div>
      </div>
      <button onclick="window._guestUpgradeGoogle()" style="display:flex;align-items:center;gap:10px;justify-content:center;width:100%;background:#fff;color:#333;border:1.5px solid #ddd;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px"><img src="https://www.google.com/favicon.ico" width="20" height="20"/> Google로 계속하기</button>
      <button onclick="window._guestUpgradeKakao()" style="display:flex;align-items:center;gap:10px;justify-content:center;width:100%;background:#FEE500;color:#191919;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">💬 카카오로 계속하기</button>
      <div style="font-size:11px;color:#aaa;text-align:center;margin-top:14px">게스트로 쌓은 절감량·미션·챌린지 기록은<br/>그대로 옮겨가요. 사라지지 않아요 🌍</div>
    </div>`;
    document.body.appendChild(m);
  }
  window._openGuestSignup = openGuestSignup;

  function backupGuestForMerge(){
    const d = window.UDATA || {};
    try{ localStorage.setItem('eq_guest_merge', JSON.stringify({
      co2:d.co2||0, missionCount:d.missionCount||0, point:d.point||0, doneMissions:d.doneMissions||[]
    })); }catch(e){}
  }

  /* ── 구글 이어받기 ── */
  window._guestUpgradeGoogle = async function(){
    if(!isGuestUser()){ window.toast && window.toast('이미 가입돼 있어요'); return; }
    const mod = await authMod();
    const provider = new mod.GoogleAuthProvider();
    try{
      await mod.linkWithPopup(_auth.currentUser, provider);   // 익명 → 구글 (uid 유지, 데이터 보존)
      window.GUEST_MODE = false;
      try{ const fs = await fsMod(); await fs.updateDoc(window.FB.doc(window.FB.db,'users',_auth.currentUser.uid), {isGuest:false}); }catch(e){}
      if(window.UDATA) window.UDATA.isGuest = false;
      document.getElementById('ovGuestSignup')?.remove();
      window.toast && window.toast('🎉 가입 완료! 기록이 저장됐어요');
      restoreLogoutBtn();
      setTimeout(()=>{ window.openOnboardEdit && window.openOnboardEdit(); }, 600); // 닉네임 변경 유도
    }catch(e){
      if(e.code==='auth/credential-already-in-use' || e.code==='auth/email-already-in-use'){
        // 이미 가입한 구글 계정 → 멈추지 말고 그 계정으로 "로그인" (게스트 수치 합산)
        backupGuestForMerge();
        document.getElementById('ovGuestSignup')?.remove();
        window.toast && window.toast('이미 가입한 계정이에요. 그 계정으로 로그인할게요!');
        try{
          await mod.signInWithPopup(_auth, provider);   // 기존 계정 진입
        }catch(e2){
          // 팝업이 또 막히면 credential 로 한 번 더 시도
          const cred = mod.GoogleAuthProvider.credentialFromError(e);
          if(cred){ try{ await mod.signInWithCredential(_auth, cred); }catch(e3){ window.toast && window.toast('로그인 실패: '+e3.code); } }
          else if(!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e2.code))
            window.toast && window.toast('로그인 실패: '+(e2.code||e2.message));
        }
      } else if(['auth/popup-blocked','auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e.code)){
        window.toast && window.toast('팝업이 막혔어요. 다시 시도해주세요');
      } else window.toast && window.toast('가입 실패: '+(e.code||e.message));
    }
  };

  /* ── 이미 계정 있는 사람: 게스트 빠져나가서 로그인 화면으로 ── */
  window._guestSwitchLogin = async function(){
    document.getElementById('ovGuestSignup')?.remove();
    window.GUEST_MODE = false;
    _guestStarting = false;
    try{ localStorage.removeItem('eq_guest_merge'); }catch(e){}
    const mod = await authMod();
    try{ await mod.signOut(_auth); }catch(e){}
    const app = document.getElementById('app'); if(app) app.style.display = 'none';
    const login = document.getElementById('loginScreen'); if(login) login.style.display = 'flex';
  };

  /* ── 카카오 이어받기 (redirect) ── */
  function loadKakaoSDK(){
    return new Promise(res=>{
      if(window.Kakao && window.Kakao.isInitialized()){ res(); return; }
      if(window.Kakao){ window.Kakao.init(KAKAO_KEY); res(); return; }
      const s=document.createElement('script');
      s.src='https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'; s.crossOrigin='anonymous';
      s.onload=()=>{ window.Kakao.init(KAKAO_KEY); res(); };
      document.head.appendChild(s);
    });
  }
  window._guestUpgradeKakao = async function(){
    if(!isGuestUser()){ window.toast && window.toast('이미 가입돼 있어요'); return; }
    try{ localStorage.setItem('eq_kakao_linking','1'); }catch(e){}
    backupGuestForMerge();
    try{
      if(!window.Kakao) await loadKakaoSDK();
      window.Kakao.Auth.authorize({ redirectUri: KAKAO_REDIRECT, throughTalk:false });
    }catch(e){ window.toast && window.toast('카카오 연결 실패'); localStorage.removeItem('eq_kakao_linking'); }
  };

  // 카카오 redirect 복귀 후 link 처리 (earlyKakaoGuard 가 잡아둔 code)
  async function handleKakaoLinkReturn(){
    const code = window._eqKakaoLinkCode;
    if(!code) return;
    window._eqKakaoLinkCode = null;
    try{
      const r = await fetch('/api/kakao', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code, redirectUri: KAKAO_REDIRECT }) });
      const data = await r.json();
      if(data.error){ window.toast && window.toast('카카오 오류: '+data.error); return; }
      const fakeEmail = 'kakao_'+data.id+'@ecoquest.kakao';
      const fakePw    = 'kko_'+data.id+'_eq2024!';
      const mod = await authMod();
      const cred = mod.EmailAuthProvider.credential(fakeEmail, fakePw);
      await waitFor(()=> _auth.currentUser, 5000);
      const cur = _auth.currentUser;
      if(cur && cur.isAnonymous){
        try{
          await mod.linkWithCredential(cur, cred);   // 익명 → 카카오(이메일) (데이터 보존)
          try{ await mod.updateProfile(cur, { displayName:data.nickname, photoURL:data.profileImage||null }); }catch(e){}
          window.GUEST_MODE = false;
          try{ const fs = await fsMod(); await fs.updateDoc(window.FB.doc(window.FB.db,'users',cur.uid), {isGuest:false}); }catch(e){}
          if(window.UDATA) window.UDATA.isGuest = false;
          localStorage.removeItem('eq_guest_merge'); // link 성공 → 머지 불필요
          window.toast && window.toast('🎉 카카오 가입 완료! 기록이 저장됐어요');
        }catch(e2){
          if(e2.code==='auth/email-already-in-use' || e2.code==='auth/credential-already-in-use'){
            // 이미 카카오 가입한 계정 → 기존 로그인 + 머지(eq_guest_merge 사용)
            try{ await mod.signInWithEmailAndPassword(_auth, fakeEmail, fakePw); }
            catch(e3){ window.toast && window.toast('로그인 실패: '+e3.code); }
          } else window.toast && window.toast('가입 실패: '+e2.code);
        }
      }
    }catch(e){ window.toast && window.toast('카카오 처리 오류'); }
  }

  // 기존 계정으로 로그인했을 때 게스트 수치 합산
  async function applyMergeIfNeeded(user){
    const raw = localStorage.getItem('eq_guest_merge');
    if(!raw) return;
    localStorage.removeItem('eq_guest_merge');
    try{
      const g = JSON.parse(raw);
      await waitFor(()=> window.UDATA, 5000);
      const cur = window.UDATA || {};
      const merged = {
        co2:          parseFloat(((cur.co2||0)+(g.co2||0)).toFixed(2)),
        missionCount: (cur.missionCount||0)+(g.missionCount||0),
        point:        (cur.point||0)+(g.point||0),
        doneMissions: [...new Set([...(cur.doneMissions||[]), ...(g.doneMissions||[])])]
      };
      const fs = await fsMod();
      await fs.updateDoc(window.FB.doc(window.FB.db,'users',user.uid), merged);
      Object.assign(window.UDATA, merged);
      window.updateUI && window.updateUI();
      if((g.co2||0)>0 || (g.missionCount||0)>0) window.toast && window.toast('🎉 게스트 기록을 합쳤어요!');
    }catch(e){}
  }

  function restoreLogoutBtn(){
    const logoutBtn = document.getElementById('btnLogout');
    if(logoutBtn){
      logoutBtn.textContent = '로그아웃';
      logoutBtn.style.background = '';
      logoutBtn.style.fontWeight = '';
      if(logoutBtn._origOnclick) logoutBtn.onclick = logoutBtn._origOnclick;
    }
    document.getElementById('guestSignupBanner')?.remove();
  }

  /* ════════ "구경만 할게요" 가로채기 ════════ */
  function hookSkipIntro(){
    if(window._guestSkipHooked) return;
    const orig = window.skipIntro;
    if(typeof orig !== 'function'){ setTimeout(hookSkipIntro,300); return; }
    window.skipIntro = function(){ hideIntro(); startGuest(); };
    window._guestSkipHooked = true;
  }

  /* ════════ 로그인 화면에 "구경만 할게요" 버튼 ════════ */
  function injectGuestBtnOnLogin(){
    const loginScreen = document.getElementById('loginScreen');
    if(!loginScreen) return;
    const add = ()=>{
      if(loginScreen.style.display !== 'flex') return;
      if(document.getElementById('btnGuestPeek')) return;
      const b = document.createElement('button');
      b.id = 'btnGuestPeek';
      b.textContent = '👀 가입 없이 구경만 할게요';
      b.style.cssText = 'background:transparent;border:1.5px solid rgba(255,255,255,.4);color:#fff;border-radius:14px;padding:14px 28px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;max-width:320px;margin-top:14px';
      b.onclick = ()=> startGuest();
      const anchor = document.getElementById('btnKakaoLogin') || document.getElementById('btnLogin');
      if(anchor && anchor.parentElement) anchor.parentElement.insertBefore(b, anchor.nextSibling);
      else loginScreen.appendChild(b);
    };
    add();
    new MutationObserver(add).observe(loginScreen, { attributes:true, attributeFilter:['style'] });
  }

  /* ════════ auth 리스너 ════════ */
  async function setupAuthListener(){
    const mod = await authMod();
    mod.onAuthStateChanged(_auth, async (user)=>{
      if(_firstAuth){
        _firstAuth = false;
        if(!user){
          // 비로그인 첫 상태: QR(?booth) 로 들어왔으면 자동 게스트 진입
          if(BOOTH && !params.get('code')){ hideIntro(); startGuest(); }
          return;
        }
      }
      if(!user) return;
      if(user.isAnonymous){
        await handleGuestPostLogin(user);
      } else {
        window.GUEST_MODE = false;
        await applyMergeIfNeeded(user);   // 게스트→실계정 전환 머지
        restoreLogoutBtn();
      }
    });
  }

  /* ════════ 부트 ════════ */
  async function boot(){
    if(!window.FB){ setTimeout(boot,300); return; }
    hookOpenOv();
    hookSkipIntro();
    injectGuestBtnOnLogin();
    setupAuthListener();
    handleKakaoLinkReturn();   // earlyKakaoGuard 가 잡아둔 카카오 code 처리
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,400));
  else setTimeout(boot,400);

})();
