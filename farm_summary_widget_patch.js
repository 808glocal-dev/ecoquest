// farm_summary_widget_patch.js v1
// 1. "내 농장 현황" 카드 (베리·작물·토끼·배송 4칸) — 우리 동네 카드 옆/아래
// 2. 우리 동네 실시간 데이터 카드 자동 펼침 시도 (한 번만)
// 3. 디폴트 펼침 + 사용자 접기/펼치기 가능
(function(){
  'use strict';

  let _expandTried = false;

  function findLocalCard(){
    let bestCard = null;
    document.querySelectorAll('div, section').forEach(el => {
      if(el.id === 'eqMySummaryCard') return;
      if(el.id?.startsWith('page-')) return;
      const txt = (el.textContent || '').slice(0, 100);
      if(/우리\s*동네\s*실시간\s*데이터/.test(txt)){
        if(!bestCard || el.offsetHeight > bestCard.offsetHeight){
          bestCard = el;
        }
      }
    });
    return bestCard;
  }

  /* 우리 동네 카드 자동 펼침 (한 번만) */
  function tryExpandLocalCard(){
    if(_expandTried) return;
    setTimeout(() => {
      const card = findLocalCard();
      if(!card){ setTimeout(tryExpandLocalCard, 2000); return; }
      _expandTried = true;

      const txt = card.textContent || '';
      // "탭해서 펼치기" / "댐해서 펼치기" / "더 보기" 등의 텍스트 있으면 펼치기
      if(/펼치기|더\s*보기/.test(txt)){
        // 카드 안에서 클릭 가능한 element 찾기
        let clickTarget = null;
        // onclick 속성 가진 element
        card.querySelectorAll('[onclick]').forEach(el => {
          if(!clickTarget) clickTarget = el;
        });
        // 또는 카드 자체 click
        if(!clickTarget) clickTarget = card;
        try {
          clickTarget.click();
          console.log('[summary] 우리 동네 카드 자동 펼침 시도');
        } catch(e){ console.log('[summary] 자동 펼침 실패', e.message); }
      }
    }, 1500);
  }

  /* 내 농장 현황 카드 추가 */
  function ensureSummaryCard(){
    const localCard = findLocalCard();
    if(!localCard) return;

    let myCard = document.getElementById('eqMySummaryCard');
    if(!myCard){
      myCard = document.createElement('div');
      myCard.id = 'eqMySummaryCard';
      myCard.dataset.eqExpanded = 'true'; // 디폴트 펼침
      localCard.insertAdjacentElement('afterend', myCard);
    }
    updateSummaryCard();
  }

  function updateSummaryCard(){
    const myCard = document.getElementById('eqMySummaryCard');
    if(!myCard) return;

    const point = window.UDATA?.point || 0;
    const harvested = window.UDATA?.harvestedCrops || {};
    const totalCrops = Object.values(harvested).reduce((s,n)=>s+n,0);
    const bunnies = (window._myBunny?.bunnies || []).length || 1;
    const deliveryPending = totalCrops;

    const isExpanded = myCard.dataset.eqExpanded !== 'false';

    myCard.innerHTML = `
      <div style="margin:8px 12px;background:#fff;border-radius:14px;padding:12px 14px;border:1.5px solid #FFE082;box-shadow:0 2px 8px rgba(0,0,0,.05)">

        <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none" onclick="window.eqToggleSummary()">
          <div style="font-size:12px;font-weight:900;color:#5D4037">🌟 내 농장 현황</div>
          <div style="font-size:11px;color:#888">${isExpanded ? '▲ 접기' : '▼ 펼치기'}</div>
        </div>

        ${isExpanded ? `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:10px">
          <div style="text-align:center;background:#fff8e1;border-radius:10px;padding:8px 4px;border:1px solid #FFE082">
            <div style="font-size:22px;line-height:1">💰</div>
            <div style="font-size:15px;font-weight:900;color:#B8860B;margin-top:4px">${point.toLocaleString()}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">베리(P)</div>
          </div>
          <div style="text-align:center;background:#f0fbf4;border-radius:10px;padding:8px 4px;border:1px solid #c8e6c9">
            <div style="font-size:22px;line-height:1">🌾</div>
            <div style="font-size:15px;font-weight:900;color:#1B5E20;margin-top:4px">${totalCrops}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">수확 작물</div>
          </div>
          <div style="text-align:center;background:#fce4ec;border-radius:10px;padding:8px 4px;border:1px solid #f8bbd0">
            <div style="font-size:22px;line-height:1">🐰</div>
            <div style="font-size:15px;font-weight:900;color:#C44569;margin-top:4px">${bunnies}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">우리 토끼</div>
          </div>
          <div style="text-align:center;background:#fff3e0;border-radius:10px;padding:8px 4px;border:1px solid #ffe0b2">
            <div style="font-size:22px;line-height:1">📦</div>
            <div style="font-size:15px;font-weight:900;color:#e67e22;margin-top:4px">${deliveryPending}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">배송 대기</div>
          </div>
        </div>
        ` : ''}

      </div>
    `;
  }

  window.eqToggleSummary = function(){
    const myCard = document.getElementById('eqMySummaryCard');
    if(!myCard) return;
    myCard.dataset.eqExpanded = myCard.dataset.eqExpanded === 'false' ? 'true' : 'false';
    updateSummaryCard();
  };

  function boot(){
    tryExpandLocalCard();
    ensureSummaryCard();

    setInterval(ensureSummaryCard, 2000);
    setInterval(updateSummaryCard, 5000);

    console.log('%c[farm_summary_widget v1] 🌟 내 농장 현황 활성화','color:#fff;background:#FF9800;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4500));
  else setTimeout(boot, 4500);
})();
