/* =====================================================
   EcoQuest – 종합 수정 패치 v7
   1. 마이 탭 → 스토어로 변환
   2. 내활동에 증명서 발급 + 내 정보 버튼 추가
   3. 인증기록 내활동에만
   4. 관리자 버튼 관리자만
   5. 로그아웃 UI 초기화
   6. 참여자 실시간 업데이트
   ===================================================== */
(function () {
  'use strict';

  function waitForFB(cb) {
    const t = setInterval(() => { if (window.FB) { clearInterval(t); cb(); } }, 80);
  }

  // ── 1. 참여자 숫자 실시간 업데이트 ──
 async function updateStats() {
  if (window.loadGlobalStats) window.loadGlobalStats();
}

  async function trackTodayUser() {
    if (!window.FB || !window.ME?.uid) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const uSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid));
      if (!uSnap.exists() || uSnap.data().lastActiveDate === today) return;
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

  // ── 3. 마이 탭 → 스토어로 변환 ──
  function convertMyToStore() {
    // 탭 버튼 변경
    const myTab = document.querySelector('.tb[data-page="my"]');
    if (myTab) {
      myTab.innerHTML = '<span class="ic">🛒</span>스토어';
      myTab.setAttribute('data-page', 'shop');
      myTab.onclick = () => window.goPage && window.goPage('shop');
    }

    // page-my 숨기고 page-shop으로 대체
    const myPage = document.getElementById('page-my');
    if (myPage) myPage.style.display = 'none';

    // 관리자 버튼을 page-shop으로 이동
    const adminArea = document.getElementById('adminArea');
    const shopPage = document.getElementById('page-shop');
    if (adminArea && shopPage && !shopPage.querySelector('#adminArea')) {
      shopPage.appendChild(adminArea);
    }
  }

  // ── 4. 내활동에 증명서 + 내 정보 버튼 추가 ──
  function addCertToActivity() {
    const actPage = document.getElementById('page-activity');
    if (!actPage || actPage.querySelector('#actCertBtn')) return;

    // 맨 위에 버튼 추가
    const btnWrap = document.createElement('div');
    btnWrap.id = 'actCertBtn';
    btnWrap.style.cssText = 'display:flex;gap:8px;padding:12px 12px 0;';
    btnWrap.innerHTML = `
      <button class="btn btn-g" style="flex:1;padding:10px;font-size:13px" onclick="showCert()">🏆 증명서 발급</button>
      <button class="btn btn-gray" style="flex:1;padding:10px;font-size:13px" onclick="openOnboardEdit()">✏️ 내 정보 수정</button>
    `;
    actPage.insertBefore(btnWrap, actPage.firstChild);
  }

  // ── 5. 인증기록 내활동에만 ──
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

  // ── 6. 전체 페이지 인증기록/주문 삭제 ──
  function removeVerifAndOrders() {
    document.querySelectorAll('.sec').forEach(sec => {
      const txt = sec.textContent || '';
      if (txt.includes('인증 기록') || txt.includes('내 주문')) sec.remove();
    });
    ['myVerifs','myOrders'].forEach(id => {
      const el = document.getElementById(id); if (el) el.remove();
    });
    const companySec = document.getElementById('companySec');
    if (companySec) companySec.remove();
  }

  // ── 7. 기업 탭 패딩 제거 ──
  function fixCompanyTab() {
    const btn = document.getElementById('tb-company');
    if (btn) {
      btn.setAttribute('data-page', 'company');
      btn.onclick = () => { if (window.goPage) window.goPage('company'); };
    }
    const pg = document.getElementById('page-company');
    if (pg) { pg.style.paddingTop = '0'; pg.style.marginTop = '0'; }
  }

  // ── 8. 내활동 인증기록 로드 ──
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

  // ── 9. 로그아웃 UI 초기화 ──
  function setupLogout() {
    const logoutBtn = document.getElementById('btnLogout');
    if (!logoutBtn || logoutBtn._fixPatched) return;
    logoutBtn._fixPatched = true;
    logoutBtn.addEventListener('click', () => {
      ['uName','sMission','sStreak','sPoint','sCo2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = id === 'uName' ? '-' : '0';
      });
      const uAvatar = document.getElementById('uAvatar');
      if (uAvatar) uAvatar.innerHTML = '👤';
      const sName  = document.getElementById('sName');
      const myName = document.getElementById('myName');
      if (sName)  sName.textContent  = '🌱 지구지킴이';
      if (myName) myName.textContent = '내 프로필';
      const sLv  = document.getElementById('sLv');
      const myLv = document.getElementById('myLv');
      if (sLv)  sLv.textContent  = 'Lv.1 씨앗';
      if (myLv) myLv.textContent = 'Lv.1 씨앗';
      window.ME    = null;
      window.UDATA = null;
      const adminArea = document.getElementById('adminArea');
      if (adminArea) adminArea.style.display = 'none';
    }, true);
    // 500ms 후 한번 더
    logoutBtn.addEventListener('click', () => setTimeout(() => {
      const uName = document.getElementById('uName');
      if (uName && uName.textContent !== '-') uName.textContent = '-';
    }, 500));
  }

  // ── 전체 적용 ──
  function applyFixes() {
    fixAdminButton();
    removeVerifAndOrders();
    fixCompanyTab();
    convertMyToStore();
    addCertToActivity();
    moveVerifToActivity();
    setupLogout();
    waitForFB(() => { updateStats(); trackTodayUser(); });
  }

  const _origShowApp = window.showApp;
  window.showApp = function () {
    if (_origShowApp) _origShowApp();
    setTimeout(applyFixes, 600);
  };

  const _origEnterGuest = window.enterGuest;
  window.enterGuest = function () {
    if (_origEnterGuest) _origEnterGuest();
    setTimeout(applyFixes, 600);
  };

  const _origGoPage = window.goPage;
  window.goPage = function(name) {
    if (_origGoPage) _origGoPage(name);
    if (name === 'company') {
      setTimeout(() => {
        const pg = document.getElementById('page-company');
        if (pg) { pg.style.paddingTop = '0'; pg.style.marginTop = '0'; }
        removeVerifAndOrders();
      }, 80);
    }
  };

  setInterval(() => waitForFB(updateStats), 30000);

  // MutationObserver
  const observer = new MutationObserver(() => {
    const companySec = document.getElementById('companySec');
    if (companySec) companySec.remove();
  });

  function init() {
    removeVerifAndOrders();
    fixCompanyTab();
    convertMyToStore();
    addCertToActivity();
    moveVerifToActivity();
    setupLogout();
    waitForFB(updateStats);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
