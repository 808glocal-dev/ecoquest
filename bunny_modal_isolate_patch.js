// bunny_modal_isolate_patch.js v1
// 1. 빈 밭 element 캡처 단계에서 클릭 차단 (자전거 미션 모달 자동 트리거 방지)
// 2. 우리 씨앗 모달 떠 있을 때 다른 overlay 자동 닫기
(function(){
  'use strict';

  /* 빈 밭 element 캡처 단계 차단 */
  function blockCapture(){
    document.querySelectorAll('.eq-field-crop').forEach(el => {
      if(el.dataset.eqCaptureBlock) return;

      // 캡처 단계에서 mousedown/touchstart/click 차단 (뒤로 전파 X)
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      }, { capture: true });

      el.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { capture: true });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        // preventDefault는 안 함 (원래 핸들러 작동해야)
      }, { capture: true });

      el.dataset.eqCaptureBlock = '1';
    });
  }

  /* 우리 씨앗 모달 있을 때 다른 overlay 자동 닫기 */
  function isolateOurModal(){
    const ourModal = document.getElementById('ovSeedSel') || document.getElementById('eqSeedSelector');
    if(!ourModal) return;

    // 우리 모달과 같은 시점에 떠 있는 다른 overlay 닫기
    document.querySelectorAll('.overlay.on').forEach(el => {
      if(el.id === 'ovSeedSel' || el.id === 'eqSeedSelector') return;
      if(el.id?.startsWith('eq')) return;
      el.classList.remove('on');
      console.log('[modal_isolate] 다른 overlay 자동 닫음:', el.id);
    });
  }

  /* 자전거/도보 같은 미션 모달이 _자동으로_ 뜬 경우 닫기
     (사용자가 직접 미션 버튼 누른 게 아니면) */
  let _lastUserClick = 0;
  document.addEventListener('click', () => { _lastUserClick = Date.now(); }, true);

  function closeAutoMissionModal(){
    // 빈 밭 클릭 후 200ms 이내에 뜬 미션 모달은 _자동_으로 간주
    if(Date.now() - _lastUserClick > 500) return;

    document.querySelectorAll('.overlay.on').forEach(el => {
      if(el.id === 'ovSeedSel' || el.id === 'eqSeedSelector') return;
      if(el.id?.startsWith('eq')) return;
      // 미션 모달 패턴
      const txt = (el.textContent || '').slice(0, 200);
      if(/자전거|도보|대중교통|채식|텀블러|줍깅|미션\s*인증/.test(txt) && /사진/.test(txt)){
        el.classList.remove('on');
        console.log('[modal_isolate] 자동 트리거 미션 모달 닫음');
      }
    });
  }

  function boot(){
    blockCapture();
    setInterval(() => {
      blockCapture();
      isolateOurModal();
      closeAutoMissionModal();
    }, 300);

    console.log('%c[bunny_modal_isolate v1] 🛡️ 캡처 차단 + 모달 격리','color:#fff;background:#1976D2;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3500));
  else setTimeout(boot, 3500);
})();
