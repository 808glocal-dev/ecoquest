// bunny_animal_display_patch.js v1
// 들판의 토끼 캐릭터 element에서, 데이터가 토끼가 아닌 (type='korean') 친구는
// 큰 이모지로 표시 (토끼 SVG 대체)
(function(){
  'use strict';

  function fixAnimalDisplay(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    const bunnies = window._myBunny?.bunnies || [];
    const charElements = playground.querySelectorAll('.bunny-char');

    bunnies.forEach((bunnyData, i) => {
      const el = charElements[i];
      if(!el) return;

      const isKorean = bunnyData.type === 'korean' && bunnyData.emoji;

      // 이미 처리된 element인지 확인 (species ID 비교)
      const targetSpecies = isKorean ? bunnyData.species : 'rabbit';
      if(el.dataset.eqAnimal === targetSpecies) return;

      const svgWrap = el.querySelector('.bunny-svg');
      if(!svgWrap) return;

      if(isKorean){
        // 🌳 천연기념물 → 큰 이모지로 교체
        svgWrap.innerHTML = `
          <div style="width:60px;height:70px;display:flex;align-items:flex-end;justify-content:center;line-height:1">
            <div style="font-size:54px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">${bunnyData.emoji}</div>
          </div>
        `;
        el.dataset.eqAnimal = bunnyData.species;
      } else {
        // 🐰 토끼는 그대로 두기 (bunny_patch.js의 SVG 유지)
        el.dataset.eqAnimal = 'rabbit';
      }
    });
  }

  function boot(){
    fixAnimalDisplay();
    // 자주 체크 (1초마다) — bunny_patch.js가 새로 그릴 때마다 따라잡음
    setInterval(fixAnimalDisplay, 1000);

    // MutationObserver — bunnyPlayground 변화 감지하면 즉시 fix
    const observer = new MutationObserver(() => {
      fixAnimalDisplay();
    });
    const playground = document.getElementById('bunnyPlayground');
    if(playground){
      observer.observe(playground, { childList: true, subtree: false });
    } else {
      // playground 아직 없으면 body 관찰 → 생기면 fix
      const bodyObs = new MutationObserver(() => {
        const pg = document.getElementById('bunnyPlayground');
        if(pg){
          bodyObs.disconnect();
          observer.observe(pg, { childList: true, subtree: false });
          fixAnimalDisplay();
        }
      });
      bodyObs.observe(document.body, { childList: true, subtree: true });
    }

    console.log('%c[bunny_animal_display v1] 🐢🦦🐐 천연기념물 들판 표시','color:#fff;background:#1B5E20;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4500));
  else setTimeout(boot, 4500);
})();
