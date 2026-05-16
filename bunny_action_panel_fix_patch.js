// bunny_action_panel_fix_patch.js v2
// CSS로 강제 - !important로 무조건 우측 사이드 패널
(function(){
  'use strict';

  // ===== CSS 강제 주입 (가장 강력) =====
  function injectCss(){
    if(document.getElementById('eqActPanelCssV2')) return;
    const s = document.createElement('style');
    s.id = 'eqActPanelCssV2';
    s.textContent = `
      /* 액션 모달을 우측 사이드 패널로 강제 */
      #ovInteraction {
        position: fixed !important;
        top: 60px !important;
        right: 8px !important;
        left: auto !important;
        bottom: auto !important;
        background: transparent !important;
        width: 300px !important;
        max-width: 300px !important;
        height: auto !important;
        max-height: calc(100vh - 80px) !important;
        display: block !important;
        inset: auto !important;
        z-index: 9300 !important;
        animation: eqSlideR .3s cubic-bezier(.5,1.6,.4,.9) !important;
        pointer-events: auto !important;
      }
      #ovInteraction > div {
        max-height: calc(100vh - 100px) !important;
        overflow-y: auto !important;
        border-radius: 18px !important;
        box-shadow: 0 10px 40px rgba(0,0,0,.35) !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      @keyframes eqSlideR {
        from { transform: translateX(30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @media (max-width: 480px) {
        #ovInteraction {
          width: 92vw !important;
          max-width: 92vw !important;
          right: 4px !important;
          top: 56px !important;
        }
      }
    `;
    document.head.appendChild(s);
  }

  /* ===== 모달 onclick 비활성화 + 바깥 클릭 닫기 ===== */
  function rebindModalEvents(){
    const modal = document.getElementById('ovInteraction');
    if(!modal || modal.dataset.eqRebound) return;
    modal.dataset.eqRebound = '1';
    // 기존 onclick (전체 화면 클릭 시 닫기) 제거 - 작은 패널이라 의미 없음
    modal.onclick = null;

    // 바깥 클릭 시 닫기
    setTimeout(() => {
      document.addEventListener('click', outsideHandler, true);
    }, 250);
  }

  function outsideHandler(e){
    const modal = document.getElementById('ovInteraction');
    if(!modal){
      document.removeEventListener('click', outsideHandler, true);
      return;
    }
    if(modal.contains(e.target)) return;
    if(e.target.closest('#eqIntMain')) return;
    if(e.target.closest('#ovAdoptFarmer')) return;
    if(e.target.closest('#ovMyPokedex')) return;
    modal.remove();
    document.removeEventListener('click', outsideHandler, true);
  }

  /* ===== 즉시 + 지속 감시 ===== */
  function watch(){
    // 이미 있으면 처리
    rebindModalEvents();

    // MutationObserver - 새로 추가되는 모달 잡기
    const observer = new MutationObserver(() => {
      const modal = document.getElementById('ovInteraction');
      if(modal && !modal.dataset.eqRebound){
        rebindModalEvents();
      }
    });
    observer.observe(document.body, { childList: true, subtree: false });
  }

  /* boot - 빠르게 */
  function boot(){
    injectCss();
    watch();
    console.log('%c[bunny_action_panel_fix v2] 📍 CSS 강제 사이드 패널','color:#fff;background:#9b59b6;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  // DOM ready 즉시
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
