// bunny_modal_isolate_patch.js v4 — 응급 단순 fix
// 캡처 차단 다 제거. 단 하나의 일만:
//   들판 페이지(page-map)에서 ovAI(미션 인증 모달)가 뜨면 즉시 닫음
// → 빈 밭이 확실히 보이고 클릭 가능 → 빈 밭의 원래 onclick으로 씨앗 모달 뜸
(function(){
  'use strict';

  function closeAutoOvAI(){
    const mapPage = document.getElementById('page-map');
    if(!mapPage || !mapPage.classList.contains('on')) return;

    const ovAI = document.getElementById('ovAI');
    if(ovAI && ovAI.classList.contains('on')){
      ovAI.classList.remove('on');
    }
  }

  function boot(){
    setInterval(closeAutoOvAI, 150);
    console.log('%c[bunny_modal_isolate v4] 🌱 들판 ovAI 무력화 전용','color:#fff;background:#D32F2F;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1500));
  else setTimeout(boot, 1500);
})();
