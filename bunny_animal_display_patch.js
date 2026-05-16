// bunny_animal_display_patch.js v2
// 천연기념물(거북이/수달 등)이 토끼 SVG로 보이는 문제 fix
// - v1 결함: window._myBunny는 IIFE 변수 → 접근 불가 → 작동 X
// - v2: Firebase에서 자체 fetch + MutationObserver + 1초마다 재적용
(function(){
  'use strict';

  let _bunnies = [];
  let _lastFetch = 0;
  let _pendingFix = false;

  async function fetchBunnies(){
    if(!window.FB || !window.ME?.uid) return;
    if(Date.now() - _lastFetch < 30000) return; // 30초 캐시

    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'bunnies', window.ME.uid));
      if(snap.exists()){
        _bunnies = snap.data().bunnies || [];
        _lastFetch = Date.now();
      }
    } catch(e){ console.error('[animal_display v2] fetch 실패', e); }
  }

  function fixAnimalDisplay(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;
    if(_bunnies.length === 0) return;

    const charElements = playground.querySelectorAll('.bunny-char');

    _bunnies.forEach((bunnyData, i) => {
      const el = charElements[i];
      if(!el) return;

      const isKorean = bunnyData.type === 'korean' && bunnyData.emoji;
      if(!isKorean) return; // 토끼는 그대로

      const svgWrap = el.querySelector('.bunny-svg');
      if(!svgWrap) return;

      // 이미 우리가 만든 이모지 div가 있나?
      const ourEmojiDiv = svgWrap.querySelector('[data-eq-emoji="1"]');
      if(ourEmojiDiv && ourEmojiDiv.dataset.species === bunnyData.species) return; // 이미 처리됨

      // 천연기념물 이모지로 교체
      svgWrap.innerHTML = `
        <div data-eq-emoji="1" data-species="${bunnyData.species}" style="width:60px;height:70px;display:flex;align-items:flex-end;justify-content:center;line-height:1">
          <div style="font-size:54px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">${bunnyData.emoji}</div>
        </div>
      `;
      el.dataset.eqAnimal = bunnyData.species;
    });
  }

  function throttledFix(){
    if(_pendingFix) return;
    _pendingFix = true;
    setTimeout(() => {
      fixAnimalDisplay();
      _pendingFix = false;
    }, 100);
  }

  async function boot(){
    if(!window.FB || !window.ME){ setTimeout(boot, 1000); return; }

    await fetchBunnies();
    fixAnimalDisplay();

    // 1초마다 fetch + 덧칠 (spawnBunnies가 다시 그려도 따라잡음)
    setInterval(async () => {
      await fetchBunnies();
      fixAnimalDisplay();
    }, 1000);

    // MutationObserver - bunnyPlayground 변화 즉시 감지
    function attachObserver(){
      const playground = document.getElementById('bunnyPlayground');
      if(!playground){
        setTimeout(attachObserver, 500);
        return;
      }
      const obs = new MutationObserver((muts) => {
        // 우리가 만든 이모지 div 변화는 무시 (무한 루프 방지)
        const hasRealChange = muts.some(m => {
          if(m.target.dataset?.eqEmoji === '1') return false;
          return Array.from(m.addedNodes).some(n => n.nodeType === 1 && !n.dataset?.eqEmoji);
        });
        if(hasRealChange) throttledFix();
      });
      obs.observe(playground, { childList: true, subtree: true });
    }
    attachObserver();

    console.log('%c[bunny_animal_display v2] 🐢 Firebase fetch + 강화','color:#fff;background:#1B5E20;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4500));
  else setTimeout(boot, 4500);
})();
