// feed_split_patch.js v2
// 홈 피드에서 내 인증샷만 제외 (내 활동 탭에 추가 안 함 — 이중 표시 방지)
(function(){
  'use strict';

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
      } catch(e){ console.warn('[feed_split] 홈 피드 필터 실패', e); }
      return result;
    };
    window._eqFeedSplitHooked = true;
    console.log('[feed_split_patch v2] ✅ 홈 피드에서 내 인증샷 제외');
  }

  // 혹시 v1이 추가한 섹션 있으면 제거
  function removeOldSection(){
    const el = document.getElementById('eqMyVerifsBlock');
    if(el) el.remove();
  }

  hookLoadFeed();
  removeOldSection();
  setInterval(removeOldSection, 2000); // 혹시 다시 그려져도 계속 제거
})();
