// bunny_modal_isolate_patch.js v6
// 자동으로 튀는 ovAI만 닫고, 사용자가 직접 연 "챌린지 인증" 모달은 유지
//   - window._eqUserCert(in_game_mission_patch.js) 가 true면 닫지 않음
//   - 닫을 때 콘솔 경고 로그 → 범인 확인용
(function(){
  'use strict';
  function closeAutoOvAI(){
    const mapPage = document.getElementById('page-map');
    if(!mapPage || !mapPage.classList.contains('on')) return;
    const ovAI = document.getElementById('ovAI');
    if(ovAI && ovAI.classList.contains('on')){
      if(window._eqUserCert) return;   // 사용자가 연 인증 모달이면 닫지 않음
      ovAI.classList.remove('on');
      console.warn('[isolate v6] ovAI 닫음 · _eqUserCert =', window._eqUserCert);
    }
  }
  function boot(){
    setInterval(closeAutoOvAI, 150);
    console.log('%c[bunny_modal_isolate v6] 🌱 자동 ovAI만 닫음','color:#fff;background:#2E7D32;padding:4px 8px;border-radius:4px;font-weight:bold');
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1500));
  else setTimeout(boot, 1500);
})();
