/* =====================================================
   EcoQuest – 종합 수정 패치 v3
   1. 오늘/누적 참여자 실시간 업데이트
   2. 관리자 버튼 관리자만 표시
   3. 기업 탭 인증기록/주문 숨기기 + 상단 빈칸 제거
   4. 로그아웃 시 UI 완전 초기화
   ===================================================== */
(function () {
  'use strict';

  function waitForFB(cb) {
    const t = setInterval(() => { if (window.FB) { clearInterval(t); cb(); } }, 80);
  }

  // ── 1. 참여자 숫자 실시간 업데이트 ──
  async function updateStats() {
    if (!window.FB) return;
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'stats', 'global'));
      if (!snap.exists()) return;
      const d = snap.data();
      const today = new Date().toISOString().split('T')[0];
      let todayCount = d.todayUsers || 0;
      if (d.todayDate !== today) todayCount = 0;
      const total = d.totalUsers || 0;
      const co2 = Math.round((d.totalCo2 || 0) * 100) / 100;
      const co2Str = co2 >= 1000 ? (co2/1000).toFixed(1)+'t' : co2.toFixed(1)+'kg';

      const bToday = document.getElementById('bToday');
      const bTotal = document.getElementById('bTotal');
      const bCo2   = document.getElementById('bCo2');
      if (bToday) bToday.textContent = todayCount.toLocaleString();
      if (bTotal) bTotal.textContent = total.toLocaleString();
      if (bCo2)   bCo2.textContent   = co2Str;

      const fTotal = document.getElementById('forestTotal');
      const fCo2   = document.getElementById('forestCo2');
      if (fTotal) fTotal.textContent = total > 0 ? total.toLocaleString()+'명' : '0명';
      if (fCo2)   fCo2.textContent   = co2Str;
    } catch (e) {}
  }

  async function trackTodayUser() {
    if (!window.FB || !window.ME?.uid) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const uSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid));
      if (!uSnap.exists()) return;
      if (uSnap.data().lastActiveDate === today) return;
      const gSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'stats', 'global'));
      if (gSnap.exists() && gSnap.data().todayDate !== today) {
        await window.FB.setDoc(window.FB.doc(window.FB.db,'stats','global'),{todayUsers:1,todayDate:today},{merge:true});
      } else {
        await window.FB.setDoc(window.FB.doc(window.FB.db,'stats','global'),{todayUsers:window.FB.increment(1),todayDate:today},{merge:true});
      }
      await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid),{lastActiveDate:today});
      updateStats();
    } catch (e) {}
  }

  // ── 2. 관리자 버튼 ──
  function fixAdminButton() {
    const adminArea = document.getElementById('adminArea');
    if (!adminArea) return;
    adminArea.style.display = window.ME?.email === window.ADMIN ? 'block' : 'none';
  }

  // ── 3. page-my 정리 ──
  function fixMyPage() {
    const myPage = document.getElementById('page-my');
    if (!myPage) return;
    myPage.querySelectorAll('.sec').forEach(sec => {
      if (sec.textContent.includes('인증 기록') || sec.textContent.includes('내 주문')) {
        sec.style.display = 'none';
      }
    });
    const myVerifs = document.getElementById('myVerifs');
    if (myVerifs) myVerifs.style.display = 'none';
    const myOrders = document.getElementById('myOrders');
    if (myOrders) myOrders.style.display = 'none';
  }

  // ── 4. 기업 탭 정리 + 상단 빈칸 제거 ──
  function fixCompanyPage() {
    // corporate_patch가 마이에 붙인 companySec 제거
    const companySec = document.getElementById('companySec');
    if (companySec) companySec.remove();

    // 탭 버튼 연결 교정
    const oldBtn = document.getElementById('tb-company');
    if (oldBtn && oldBtn.getAttribute('data-page') === 'my') {
      oldBtn.setAttribute('data-page', 'company');
      oldBtn.onclick = () => window.goPage && window.goPage('company');
    }

    // 기업 페이지 상단 패딩 제거
    const companyPage = document.getElementById('page-company');
    if (companyPage) {
      companyPage.style.paddingTop = '0';
      companyPage.style.marginTop = '0';
    }
  }

  // ── 5. 내활동에 인증기록 이동 ──
  function moveVerifToActivity() {
    const actPage = document.getElementById('page-activity');
    if (!actPage || document.getElementById('actVerifSec')) return;
    const sec = document.createElement('div');
    sec.id = 'actVerifSec';
    sec.innerHTML = `
      <div class="sec"><div class="sec-t">📸 내 인증 기록</div></div>
      <div id="actVerifList" style="padding:0 12px 20px"></div>`;
    actPage.appendChild(sec);
  }

  const _origRenderActivity = window.renderActivity;
  window.renderActivity = function () {
    if (_origRenderActivity) _origRenderActivity();
    loadActVerifs();
  };

  async function loadActVerifs() {
    const w = document.getElementById('actVerifList');
    if (!w || !window.ME || !window.FB) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db,'verifications'));
      const uid = window.ME.uid;
      const items = snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(d=>d.uid===uid)
        .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))
        .slice(0,30);
      if (!items.length) { w.innerHTML='<div style="text-align:center;padding:16px;color:var(--sub);font-size:12px">아직 인증 기록이 없어요!</div>'; return; }
      w.innerHTML = items.map(v=>`
        <div style="background:#fff;border-radius:14px;padding:12px;margin-bottom:10px;border:1px solid var(--bdr);display:flex;gap:10px;align-items:flex-start">
          <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:24px">
            ${v.thumb?`<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>`:v.missionEmoji}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--txt)">${v.missionEmoji} ${v.missionName}</div>
            <div style="font-size:11px;color:var(--sub);margin-top:2px">${timeAgo(v.createdAt?.seconds)}</div>
            <div style="display:flex;gap:6px;margin-top:6px">
              <button onclick="toggleVerifPub('${v.id}',${!v.isPublic},'${uid}')"
                style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;background:${v.isPublic?'#e8f5e9':'#f0f0f0'};color:${v.isPublic?'var(--g2)':'var(--sub)'}">
                ${v.isPublic?'🌍 공개':'🔒 비공개'}
              </button>
              <button onclick="deleteVerif('${v.id}','${uid}')"
                style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;background:#fff0f0;color:var(--red)">
                🗑️ 삭제
              </button>
            </div>
          </div>
        </div>`).join('');
    } catch (e) {}
  }

  // ── 6. 로그아웃 UI 완전 초기화 ──
  function setupLogout() {
    const logoutBtn = document.getElementById('btnLogout');
    if (!logoutBtn || logoutBtn._fixPatched) return;
    logoutBtn._fixPatched = true;
    logoutBtn.addEventListener('click', () => {
      const uName   = document.getElementById('uName');
      const uAvatar = document.getElementById('uAvatar');
      const sName   = document.getElementById('sName');
      const myName  = document.getElementById('myName');
      if (uName)   uName.textContent  = '-';
      if (uAvatar) uAvatar.innerHTML  = '👤';
      if (sName)   sName.textContent  = '🌱 지구지킴이';
      if (myName)  myName.textContent = '내 프로필';

      const sMission = document.getElementById('sMission');
      const sStreak  = document.getElementById('sStreak');
      const sPoint   = document.getElementById('sPoint');
      const sCo2     = document.getElementById('sCo2');
      if (sMission) sMission.textContent = '0';
      if (sStreak)  sStreak.textContent  = '0';
      if (sPoint)   sPoint.textContent   = '0';
      if (sCo2)     sCo2.textContent     = '0';

      const sLv  = document.getElementById('sLv');
      const myLv = document.getElementById('myLv');
      if (sLv)  sLv.textContent  = 'Lv.1 씨앗';
      if (myLv) myLv.textContent = 'Lv.1 씨앗';

      window.ME    = null;
      window.UDATA = null;

      const adminArea = document.getElementById('adminArea');
      if (adminArea) adminArea.style.display = 'none';
    });
  }

  // ── showApp 오버라이드 ──
  const _origShowApp = window.showApp;
  window.showApp = function () {
    if (_origShowApp) _origShowApp();
    setTimeout(() => {
      fixAdminButton();
      fixMyPage();
      fixCompanyPage();
      moveVerifToActivity();
      setupLogout();
      waitForFB(() => { updateStats(); trackTodayUser(); });
    }, 600);
  };

  // goPage 오버라이드 - company 탭 열 때도 빈칸 제거
  const _origGoPage = window.goPage;
  window.goPage = function(name) {
    if (_origGoPage) _origGoPage(name);
    if (name === 'company') {
      setTimeout(() => {
        const companyPage = document.getElementById('page-company');
        if (companyPage) {
          companyPage.style.paddingTop = '0';
          companyPage.style.marginTop  = '0';
        }
      }, 50);
    }
  };

  // 30초마다 통계 갱신
  setInterval(() => waitForFB(updateStats), 30000);

  // 초기 실행
  function init() {
    fixMyPage();
    fixCompanyPage();
    moveVerifToActivity();
    setupLogout();
    waitForFB(updateStats);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
