// bunny_modal_isolate_patch.js v3
// v2의 문제: stopImmediatePropagation이 빈 밭의 onclick까지 막음 → 씨앗 모달 안 뜸
// v3 fix:
//   1. stopPropagation만 (빈 밭 onclick 작동)
//   2. 들판 페이지(page-map)에서 자동 트리거된 미션 모달만 닫기 (다른 페이지는 보호)
(function(){
  'use strict';

  /* 빈 밭 클릭이 부모로 전파만 차단 — onclick은 작동 */
  function blockCapture(){
    document.querySelectorAll('.eq-field-crop').forEach(el => {
      if(el.dataset.eqCaptureBlock) return;

      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      }, { capture: true });

      el.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { capture: true });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        // stopImmediatePropagation 제거! → 빈 밭의 onclick 정상 작동
      }, { capture: true });

      el.dataset.eqCaptureBlock = '1';
    });
  }

  /* 들판 페이지에서 자동으로 뜬 미션 모달(ovAI) 닫기
     - 다른 페이지에서는 ovAI 보호 (사용자가 직접 미션 인증할 수 있게)
     - 씨앗 모달(ovSeedSel)은 절대 안 닫음 */
  function closeAutoMissionOnFarm(){
    // 들판 페이지에 있을 때만 작동
    const mapPage = document.getElementById('page-map');
    if(!mapPage || !mapPage.classList.contains('on')) return;

    const ovAI = document.getElementById('ovAI');
    if(!ovAI || !ovAI.classList.contains('on')) return;

    // 우리 씨앗 모달이 떠 있으면 절대 우선 → 미션 모달 닫기
    const seedModal = document.getElementById('ovSeedSel');
    if(seedModal){
      ovAI.classList.remove('on');
      console.log('[modal_isolate v3] 씨앗 모달 보호 → 자동 미션 모달 닫음');
      return;
    }

    // 들판 페이지에서 자전거/도보 등 미션 모달이 뜨면 자동 트리거 → 닫기
    const txt = (ovAI.textContent || '').slice(0, 300);
    const hasMissionKeyword = /자전거|도보|버스|대중교통|채식|텀블러|줍깅|분리수거/.test(txt);
    const hasAiKeyword = /사진|AI|찍거나|인증/.test(txt);
    // 씨앗 관련 텍스트가 있으면 절대 안 닫음 (안전장치)
    const hasSeedKeyword = /씨앗|베리|작물|심기/.test(txt);

    if(hasMissionKeyword && hasAiKeyword && !hasSeedKeyword){
      ovAI.classList.remove('on');
      console.log('[modal_isolate v3] 들판의 자동 트리거 미션 모달 닫음');
    }
  }

  function boot(){
    blockCapture();
    setInterval(blockCapture, 500);
    setInterval(closeAutoMissionOnFarm, 300);
    console.log('%c[bunny_modal_isolate v3] 🛡️ stopProp 전용 + 들판 자동 모달 닫기','color:#fff;background:#1976D2;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3500));
  else setTimeout(boot, 3500);
})();
