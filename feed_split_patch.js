// feed_split_patch.js v3
// 1) 홈 피드 → 내 인증샷 제외
// 2) 소속 탭에 있는 회사 인증 피드 → 숨김
// 3) 내 활동 탭 → 인스타 스타일 큰 카드로 내 인증샷 표시
(function(){
  'use strict';

  /* 1. 홈 피드에서 내 인증샷 제외 */
  function hookLoadFeed(){
    if(window._eqFeedSplitHooked) return;
    if(typeof window.loadFeed !== 'function'){ setTimeout(hookLoadFeed, 300); return; }
    const origLoadFeed = window.loadFeed;
    window.loadFeed = async function(){
      const result = await origLoadFeed.apply(this, arguments);
      try {
        const all = window._allFeedItems || [];
        const myUid = window.ME?.uid;
        if(myUid){
          window._allFeedItems = all.filter(v => v.uid !== myUid);
          window._feedPage = 0;
          if(typeof window.renderFeedGrid === 'function'){
            const w = document.getElementById('feedList');
            window.renderFeedGrid(w);
          }
        }
      } catch(e){}
      return result;
    };
    window._eqFeedSplitHooked = true;
  }

  /* 2. 소속 탭의 인증 피드 숨기기 (다른 patch가 만든 거) */
  function hideCompanyFeed(){
    const page = document.getElementById('page-company');
    if(!page) return;

    // 알려진 id들
    ['companyFeed','companyFeedList','companyFeedSec','companyFeedBox','companyVerifs','companyVerifList'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.display = 'none';
    });

    // "인증 피드" 텍스트가 있는 헤더 찾고 그 부모 컨테이너 숨김
    page.querySelectorAll('div').forEach(div => {
      if(div.dataset?.eqHidden) return;
      const txt = (div.textContent || '').slice(0, 60);
      if(/인증\s*피드/.test(txt)){
        // 카드 컨테이너 추정: 헤더+그리드를 감싼 div
        let target = div;
        // 최대 5단계 위로 올라가면서 너무 큰 컨테이너 전까진 찾기
        for(let i=0; i<5; i++){
          if(!target.parentElement || target.parentElement === page) break;
          target = target.parentElement;
        }
        if(target && target !== page && !target.dataset.eqHidden){
          target.style.display = 'none';
          target.dataset.eqHidden = '1';
        }
      }
    });
  }

  /* 3. 내 활동 탭에 인스타 스타일 큰 카드 */
  async function renderMyVerifsInActivity(){
    if(!window.ME?.uid) return;
    const page = document.getElementById('page-activity');
    if(!page) return;

    let wrap = document.getElementById('eqMyVerifsBlock');
    if(wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'eqMyVerifsBlock';
    wrap.style.cssText = 'padding: 0 12px 20px;';
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin:18px 0 10px">
        <div style="font-size:15px;font-weight:900;color:var(--txt)">📸 내 인증 기록</div>
        <span id="eqMyVerifsCount" style="font-size:11px;color:var(--sub)"></span>
      </div>
      <div id="eqMyVerifsList"><div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">로딩 중...</div></div>
    `;
    page.appendChild(wrap);

    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
      const myVerifs = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(v => v.uid === window.ME.uid)
        .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));

      const cntEl = document.getElementById('eqMyVerifsCount');
      if(cntEl) cntEl.textContent = `총 ${myVerifs.length}개`;

      const list = document.getElementById('eqMyVerifsList');
      if(!list) return;

      if(!myVerifs.length){
        list.innerHTML = `
          <div style="text-align:center;padding:30px 16px;color:var(--sub);font-size:13px;background:#f8f8f8;border-radius:14px">
            <div style="font-size:36px;margin-bottom:8px">📸</div>
            아직 인증 기록이 없어요!<br/>
            <span style="font-size:11px">미션을 완료하고 첫 인증샷을 남겨봐요 🌱</span>
          </div>`;
        return;
      }

      window._myVerifItems = {};
      myVerifs.forEach(v => { window._myVerifItems[v.id] = v; });

      list.innerHTML = myVerifs.map(v => {
        const time = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
        const pubBadge = v.isPublic
          ? `<span style="background:#e8f5e9;color:var(--g2);font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px">🌍 공개</span>`
          : `<span style="background:#f0f0f0;color:var(--sub);font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px">🔒 비공개</span>`;
        return `
          <div style="background:#fff;border-radius:14px;margin-bottom:12px;border:1px solid var(--bdr);overflow:hidden">
            <div style="padding:10px 12px;display:flex;align-items:center;justify-content:space-between">
              <div style="font-size:13px;font-weight:700;color:var(--txt)">${v.missionEmoji} ${v.missionName}</div>
              <div style="display:flex;gap:6px;align-items:center">${pubBadge}<span style="font-size:10px;color:var(--sub)">${time}</span></div>
            </div>
            ${v.thumb ? `<img src="${v.thumb}" style="width:100%;max-height:420px;object-fit:cover;display:block;cursor:pointer" onclick="window.eqOpenMyVerif&&window.eqOpenMyVerif('${v.id}')"/>` : ''}
            ${v.comment ? `<div style="padding:10px 12px;font-size:13px;color:var(--txt);line-height:1.5;background:#fafafa">💬 ${v.comment}</div>` : ''}
            <div style="padding:8px 12px;display:flex;gap:6px;border-top:1px solid #f0f0f0">
              <button onclick="window.toggleVerifPub&&window.toggleVerifPub('${v.id}', ${!v.isPublic}, '${window.ME?.uid}');setTimeout(()=>window.eqRenderMyVerifs&&window.eqRenderMyVerifs(),500);" style="flex:1;background:${v.isPublic?'#f8f8f8':'#e8f5e9'};color:${v.isPublic?'var(--sub)':'var(--g2)'};border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">${v.isPublic?'🔒 비공개로 변경':'🌍 공개로 변경'}</button>
              <button onclick="if(confirm('이 인증 기록을 삭제할까요?')){window.deleteVerif&&window.deleteVerif('${v.id}', '${window.ME?.uid}');setTimeout(()=>window.eqRenderMyVerifs&&window.eqRenderMyVerifs(),500);}" style="background:#fff0f0;color:var(--red);border:none;border-radius:8px;padding:8px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🗑️</button>
            </div>
          </div>`;
      }).join('');
    } catch(e){ console.error('[feed_split v3]', e); }
  }

  /* 4. 사진 클릭 시 큰 모달 */
  window.eqOpenMyVerif = function(id){
    const v = window._myVerifItems?.[id];
    if(!v || !v.thumb) return;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:20px';
    ov.onclick = () => ov.remove();
    ov.innerHTML = `<img src="${v.thumb}" style="max-width:100%;max-height:90vh;object-fit:contain;border-radius:8px"/>`;
    document.body.appendChild(ov);
  };
  window.eqRenderMyVerifs = renderMyVerifsInActivity;

  /* 5. 기존 작은 카드 #myVerifs 숨김 */
  function hideOldMyVerifs(){
    const el = document.getElementById('myVerifs');
    if(el) el.style.display = 'none';
  }

  /* 6. goPage 후킹 */
  function hookGoPage(){
    if(window._eqActivityHooked) return;
    if(typeof window.goPage !== 'function'){ setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === 'activity'){
        setTimeout(() => { hideOldMyVerifs(); renderMyVerifsInActivity(); }, 300);
      }
      if(name === 'company'){
        setTimeout(hideCompanyFeed, 200);
        setTimeout(hideCompanyFeed, 1000);
        setTimeout(hideCompanyFeed, 2500);
      }
      return r;
    };
    window._eqActivityHooked = true;
    console.log('[feed_split v3] ✅ 적용 완료');
  }

  hookLoadFeed();
  hookGoPage();

  // 소속 탭 DOM 감시 (계속 다시 그려져도 숨김 유지)
  setTimeout(() => {
    const cp = document.getElementById('page-company');
    if(cp && window.MutationObserver){
      let pending = false;
      new MutationObserver(() => {
        if(pending) return;
        pending = true;
        setTimeout(() => { hideCompanyFeed(); pending = false; }, 200);
      }).observe(cp, { childList: true, subtree: true });
    }
  }, 1500);
})();
