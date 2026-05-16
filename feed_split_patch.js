// feed_split_patch.js
// 홈 피드 → 다른 사람 인증샷만 / 내 인증샷 → 내활동 탭으로 이동
(function(){
  'use strict';

  /* ===== 1. 홈 피드에서 내 인증샷 제외 ===== */
  function hookLoadFeed(){
    if(window._eqFeedSplitHooked) return;
    if(typeof window.loadFeed !== 'function'){ setTimeout(hookLoadFeed, 300); return; }

    const origLoadFeed = window.loadFeed;
    window.loadFeed = async function(){
      const result = await origLoadFeed.apply(this, arguments);
      // 원본이 그린 후, 내 인증샷만 필터링해서 다시 그리기
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
      } catch(e){ console.warn('[feed_split] 홈 피드 필터 실패', e); }
      return result;
    };
    window._eqFeedSplitHooked = true;
    console.log('[feed_split_patch] ✅ 홈 피드에서 내 인증샷 제외');
  }

  /* ===== 2. 내활동 탭에 내 인증샷 섹션 추가 ===== */
  async function renderMyVerifsInActivity(){
    const page = document.getElementById('page-activity');
    if(!page) return;
    if(!window.ME?.uid) return;

    // 기존 섹션 있으면 제거 후 다시
    let wrap = document.getElementById('eqMyVerifsBlock');
    if(wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'eqMyVerifsBlock';
    wrap.style.cssText = 'padding: 0 12px 20px;';
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 8px">
        <div style="font-size:15px;font-weight:900;color:var(--txt)">📸 내 인증 기록</div>
        <span id="eqMyVerifsCount" style="font-size:11px;color:var(--sub)"></span>
      </div>
      <div id="eqMyVerifsGrid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px">
        <div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--sub);font-size:12px">로딩 중...</div>
      </div>
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

      const grid = document.getElementById('eqMyVerifsGrid');
      if(!grid) return;

      if(!myVerifs.length){
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:30px 16px;color:var(--sub);font-size:13px;background:#f8f8f8;border-radius:12px">
            <div style="font-size:32px;margin-bottom:8px">📸</div>
            아직 인증 기록이 없어요!<br/>
            <span style="font-size:11px">미션을 완료하고 첫 인증샷을 남겨봐요 🌱</span>
          </div>`;
        return;
      }

      // 인증샷을 그리드로 저장 (피드 그리드 형식과 동일)
      window._myVerifItems = {};
      myVerifs.forEach(v => { window._myVerifItems[v.id] = v; });

      grid.innerHTML = myVerifs.map(v => {
        const pubBadge = v.isPublic
          ? `<div style="position:absolute;top:4px;left:4px;background:rgba(46,204,113,.9);border-radius:6px;padding:1px 5px;font-size:9px;color:#fff;font-weight:700">🌍</div>`
          : `<div style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,.5);border-radius:6px;padding:1px 5px;font-size:9px;color:#fff;font-weight:700">🔒</div>`;
        return `
          <div onclick="window.eqOpenMyVerif&&window.eqOpenMyVerif('${v.id}')" style="position:relative;aspect-ratio:1;background:#f0f0f0;cursor:pointer;border-radius:4px;overflow:hidden">
            ${v.thumb
              ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji}</div>`
            }
            ${pubBadge}
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.55));padding:4px 5px">
              <div style="font-size:9px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v.missionEmoji} ${v.missionName}</div>
            </div>
          </div>`;
      }).join('');
    } catch(e){
      console.error('[feed_split] 내 인증샷 로딩 실패', e);
    }
  }

  /* ===== 3. 내 인증샷 상세보기 (공개/비공개 토글 + 삭제 가능) ===== */
  window.eqOpenMyVerif = function(id){
    const v = window._myVerifItems?.[id];
    if(!v) return;
    const detail = document.getElementById('feedDetailContent');
    if(!detail) return;
    detail.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--g1),var(--g2));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
          ${v.userPhoto ? `<img src="${v.userPhoto}" style="width:100%;height:100%;object-fit:cover"/>` : '👤'}
        </div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:var(--txt)">${v.userName || '나'}</div>
          <div style="font-size:11px;color:var(--sub)">${window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : ''}</div>
        </div>
      </div>
      ${v.thumb ? `<img src="${v.thumb}" style="width:100%;border-radius:12px;max-height:280px;object-fit:cover;margin-bottom:10px"/>` : ''}
      <div style="background:#f0fbf4;border-radius:10px;padding:8px 12px;margin-bottom:8px">
        <span style="font-size:13px;font-weight:700;color:var(--g2)">✅ ${v.missionEmoji} ${v.missionName}</span>
      </div>
      ${v.comment ? `<div style="background:#f8f8f8;border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt);line-height:1.6;margin-bottom:12px">💬 "${v.comment}"</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:12px">
        <button onclick="window.toggleVerifPub&&window.toggleVerifPub('${v.id}', ${!v.isPublic}, '${window.ME?.uid}');window.closeOv&&window.closeOv('ovFeedDetail');setTimeout(()=>{window.eqRenderMyVerifs&&window.eqRenderMyVerifs()},500);"
          style="flex:1;background:${v.isPublic ? '#f0f0f0' : '#e8f5e9'};color:${v.isPublic ? 'var(--sub)' : 'var(--g2)'};border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
          ${v.isPublic ? '🔒 비공개로' : '🌍 공개로'}
        </button>
        <button onclick="if(confirm('이 인증 기록을 삭제할까요?')){window.deleteVerif&&window.deleteVerif('${v.id}', '${window.ME?.uid}');window.closeOv&&window.closeOv('ovFeedDetail');setTimeout(()=>{window.eqRenderMyVerifs&&window.eqRenderMyVerifs()},500);}"
          style="flex:1;background:#fff0f0;color:var(--red);border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
          🗑️ 삭제
        </button>
      </div>
    `;
    window.openOv && window.openOv('ovFeedDetail');
  };

  window.eqRenderMyVerifs = renderMyVerifsInActivity;

  /* ===== 4. 내활동 탭 진입 시 내 인증샷 갱신 ===== */
  function hookGoPage(){
    if(window._eqActivityHooked) return;
    if(typeof window.goPage !== 'function'){ setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === 'activity') setTimeout(renderMyVerifsInActivity, 300);
      return r;
    };
    window._eqActivityHooked = true;
    console.log('[feed_split_patch] ✅ 내활동 탭에 내 인증샷 추가');
  }

  hookLoadFeed();
  hookGoPage();
})();
