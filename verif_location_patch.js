/* =====================================================
   EcoQuest – 인증기록 위치 정리 패치
   - 내 인증기록: 내활동(page-activity)에만
   - 인증피드: 홈(page-home)에만
   - 마이/기업 등 나머지: 제거
   ===================================================== */
(function () {
  'use strict';

  function fixVerifLocation() {
    // 1. page-my에서 인증기록 섹션 숨기기
    const myPage = document.getElementById('page-my');
    if (myPage) {
      // "내 인증 기록" 섹션 헤더 + 목록 숨기기
      myPage.querySelectorAll('.sec').forEach(sec => {
        if (sec.textContent.includes('내 인증 기록') || sec.textContent.includes('인증 기록')) {
          sec.style.display = 'none';
        }
      });
      const myVerifs = document.getElementById('myVerifs');
      if (myVerifs) myVerifs.style.display = 'none';

      // 주문 섹션도 마이에서 숨기기 (필요시)
      // myPage.querySelectorAll('.sec').forEach(sec => {
      //   if (sec.textContent.includes('내 주문')) sec.style.display = 'none';
      // });
    }

    // 2. page-activity(내활동)에 인증기록 섹션 추가
    const actPage = document.getElementById('page-activity');
    if (actPage && !document.getElementById('actVerifSec')) {
      const sec = document.createElement('div');
      sec.id = 'actVerifSec';
      sec.innerHTML = `
        <div class="sec"><div class="sec-t">📸 내 인증 기록</div></div>
        <div id="actVerifList" style="padding:0 12px 20px"></div>
      `;
      actPage.appendChild(sec);
    }
  }

  // 내활동 탭 클릭 시 인증기록 로드
  const _origRenderActivity = window.renderActivity;
  window.renderActivity = function () {
    if (_origRenderActivity) _origRenderActivity();
    loadActVerifs();
  };

  async function loadActVerifs() {
    const w = document.getElementById('actVerifList');
    if (!w || !window.ME || !window.FB) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
      const uid = window.ME.uid;
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.uid === uid)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 30);

      if (!items.length) {
        w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:12px">아직 인증 기록이 없어요!</div>';
        return;
      }
      w.innerHTML = items.map(v => `
        <div style="background:#fff;border-radius:14px;padding:12px;margin-bottom:10px;border:1px solid var(--bdr);display:flex;gap:10px;align-items:flex-start">
          <div style="width:64px;height:64px;border-radius:10px;overflow:hidden;flex-shrink:0;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:24px">
            ${v.thumb ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>` : v.missionEmoji}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--txt)">${v.missionEmoji} ${v.missionName}</div>
            <div style="font-size:11px;color:var(--sub);margin-top:2px">${timeAgo(v.createdAt?.seconds)}</div>
            <div style="display:flex;gap:6px;margin-top:6px;align-items:center">
              <button onclick="toggleVerifPub('${v.id}',${!v.isPublic},'${uid}')"
                style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;background:${v.isPublic ? '#e8f5e9' : '#f0f0f0'};color:${v.isPublic ? 'var(--g2)' : 'var(--sub)'}">
                ${v.isPublic ? '🌍 공개' : '🔒 비공개'}
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

  // 초기화
  function init() {
    fixVerifLocation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // showApp 이후에도 한번 더 실행
  const _origShowApp = window.showApp;
  window.showApp = function () {
    if (_origShowApp) _origShowApp();
    setTimeout(fixVerifLocation, 500);
  };

})();
