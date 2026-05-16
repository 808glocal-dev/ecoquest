// bunny_modal_isolate_patch.js v2
// v1의 자동 닫기가 씨앗 모달도 오해해서 닫는 문제 → 자동 닫기 모두 제거
// 빈 밭 클릭 캡처 차단만 유지 (자전거 미션 자동 트리거 방지)
(function(){
  'use strict';

  function blockCapture(){
    document.querySelectorAll('.eq-field-crop').forEach(el => {
      if(el.dataset.eqCaptureBlock) return;

      // 빈 밭 클릭이 뒤로 전파 안 되게 (자전거 미션 카드 트리거 방지)
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      }, { capture: true });

      el.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { capture: true });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, { capture: true });

      el.dataset.eqCaptureBlock = '1';
    });
  }

  function boot(){
    blockCapture();
    setInterval(blockCapture, 500);
    console.log('%c[bunny_modal_isolate v2] 🛡️ 캡처 차단 전용 (자동 닫기 제거)','color:#fff;background:#1976D2;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3500));
  else setTimeout(boot, 3500);
})();
