// feed_split_patch.js v4
// 홈 피드 → 내 인증샷 제외 + 내 활동 탭 → 3단 작은 그리드 (클릭 시 큰 모달)
(function(){
  'use strict';

  /* 1. 홈 피드에서 내 거 제외 */
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

  /* 2. 소속 탭의 회사 인증 피드 숨김 */
  function hideCompanyFeed(){
    const page = document.getElementById('page-company');
    if(!page) return;
    ['companyFeed','companyFeedList','companyFeedSec','companyFeedBox','companyVerifs','companyVerifList'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.style.display = 'none';
    });
    page.querySelectorAll('div').forEach(div => {
      if(div.dataset?.eqHidden) return;
      const txt = (div.textContent || '').slice(0, 60);
      if(/인증\s*피드/.test(txt) && !div.querySelector('#eqCompanyRanking')){
        let target = div;
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

  /* 3. 내 활동 탭 → 3단 작은 그리드 */
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
      <div id="eqMyVerifsGrid"><div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">로딩 중...</div></div>
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

      const gridWrap = document.getElementById('eqMyVerifsGrid');
      if(!gridWrap) return;

      if(!myVerifs.length){
        gridWrap.innerHTML = `
          <div style="text-align:center;padding:30px 16px;color:var(--sub);font-size:13px;background:#f8f8f8;border-radius:14px">
            <div style="font-size:36px;margin-bottom:8px">📸</div>
            아직 인증 기록이 없어요!<br/>
            <span style="font-size:11px">미션을 완료하고 첫 인증샷을 남겨봐요 🌱</span>
          </div>`;
        return;
      }

      window._myVerifItems = {};
      myVerifs.forEach(v => { window._myVerifItems[v.id] = v; });

      // 3단 작은 그리드 (인스타 프로필 스타일)
      gridWrap.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px">
          ${myVerifs.map(v => {
            const pubBadge = v.isPublic
              ? `<div style="position:absolute;top:3px;left:3px;background:rgba(46,204,113,.9);border-radius:5px;padding:1px 4px;font-size:8px;color:#fff;font-weight:700">🌍</div>`
              : `<div style="position:absolute;top:3px;left:3px;background:rgba(0,0,0,.55);border-radius:5px;padding:1px 4px;font-size:8px;color:#fff;font-weight:700">🔒</div>`;
            return `
              <div onclick="window.eqOpenMyVerif&&window.eqOpenMyVerif('${v.id}')" style="position:relative;aspect-ratio:1;background:#f0f0f0;cursor:pointer;border-radius:4px;overflow:hidden">
                ${v.thumb
                  ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>`
                  : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:30px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji}</div>`
                }
                ${pubBadge}
                <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.65));padding:3px 4px">
                  <div style="font-size:8px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v.missionEmoji} ${v.missionName||''}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      `;
    } catch(e){ console.error('[feed_split v4]', e); }
  }

  /* 4. 작은 사진 클릭 → 큰 모달 (사진 + 정보 + 토글/삭제) */
  window.eqOpenMyVerif = function(id){
    const v = window._myVerifItems?.[id];
    if(!v) return;
    const time = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const ov = document.createElement('div');
    ov.id = 'eqVerifModal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';
    ov.onclick = (e) => { if(e.target === ov) ov.remove(); };
    ov.innerHTML = `
      <div style="background:#fff;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto">
        ${v.thumb ? `<img src="${v.thumb}" style="width:100%;max-height:60vh;object-fit:contain;display:block;background:#000"/>` : ''}
        <div style="padding:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:14px;font-weight:700;color:var(--txt)">${v.missionEmoji} ${v.missionName}</div>
            <div style="font-size:11px;color:var(--sub)">${time}</div>
          </div>
          ${v.comment ? `<div style="background:#f8f8f8;border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt);line-height:1.5;margin-bottom:12px">💬 ${v.comment}</div>` : ''}
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <button onclick="window.toggleVerifPub&&window.toggleVerifPub('${v.id}', ${!v.isPublic}, '${window.ME?.uid}');document.getElementById('eqVerifModal')?.remove();setTimeout(()=>window.eqRenderMyVerifs&&window.eqRenderMyVerifs(),500);" style="flex:1;background:${v.isPublic?'#f8f8f8':'#e8f5e9'};color:${v.isPublic?'var(--sub)':'var(--g2)'};border:none;border-radius:8px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${v.isPublic?'🔒 비공개로':'🌍 공개로'}</button>
            <button onclick="if(confirm('이 인증 기록을 삭제할까요?')){window.deleteVerif&&window.deleteVerif('${v.id}', '${window.ME?.uid}');document.getElementById('eqVerifModal')?.remove();setTimeout(()=>window.eqRenderMyVerifs&&window.eqRenderMyVerifs(),500);}" style="background:#fff0f0;color:var(--red);border:none;border-radius:8px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🗑️ 삭제</button>
          </div>
          <button onclick="document.getElementById('eqVerifModal')?.remove()" style="width:100%;background:#f0f0f0;color:var(--sub);border:none;border-radius:8px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">닫기</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
  };
  window.eqRenderMyVerifs = renderMyVerifsInActivity;

  /* 5. 기존 작은 카드 (#myVerifs) 숨김 */
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
      }
      return r;
    };
    window._eqActivityHooked = true;
    console.log('[feed_split v4] ✅ 3단 그리드 모드');
  }

  hookLoadFeed();
  hookGoPage();
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
