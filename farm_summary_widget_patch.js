// farm_summary_widget_patch.js v2
// 우리 동네 카드 옆(wrapper)에 "내 농장 현황" 배치 — 베리/수확/토끼/배송 + 보유 작물 TOP
(function(){
  'use strict';

  let _expandTried = false;

  const CROP_MAP = {
    carrot:'🥕', lettuce:'🥬', strawberry:'🍓', tomato:'🍅', corn:'🌽', pepper:'🌶️',
    broccoli:'🥦', onion:'🧅', garlic:'🧄', eggplant:'🍆', pumpkin:'🎃', apple:'🍎'
  };

  function findLocalCard(){
    let bestCard = null;
    document.querySelectorAll('div, section').forEach(el => {
      if(el.id === 'eqMySummaryCard' || el.id === 'eqLocalWrapper') return;
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

  function tryExpandLocalCard(){
    if(_expandTried) return;
    setTimeout(() => {
      const card = findLocalCard();
      if(!card){ setTimeout(tryExpandLocalCard, 2000); return; }
      _expandTried = true;
      const txt = card.textContent || '';
      if(/펼치기|더\s*보기/.test(txt)){
        let clickTarget = card.querySelector('[onclick]') || card;
        try { clickTarget.click(); console.log('[summary] 우리 동네 자동 펼침'); } catch(e){}
      }
    }, 1500);
  }

  /* wrapper로 감싸서 옆에 배치 */
  function ensureSummaryCard(){
    const localCard = findLocalCard();
    if(!localCard) return;

    // wrapper 만들기 (한 번만)
    let wrapper = document.getElementById('eqLocalWrapper');
    if(!wrapper){
      wrapper = document.createElement('div');
      wrapper.id = 'eqLocalWrapper';
      wrapper.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;align-items:stretch;margin:8px 12px';

      localCard.parentElement.insertBefore(wrapper, localCard);
      wrapper.appendChild(localCard);

      localCard.style.flex = '2';
      localCard.style.minWidth = '320px';
      localCard.style.margin = '0';
      localCard.style.maxWidth = '';
    }

    let myCard = document.getElementById('eqMySummaryCard');
    if(!myCard){
      myCard = document.createElement('div');
      myCard.id = 'eqMySummaryCard';
      myCard.style.cssText = 'flex:1;min-width:240px;max-width:420px';
      myCard.dataset.eqExpanded = 'true';
      wrapper.appendChild(myCard);
    }

    updateSummaryCard();
  }

  function updateSummaryCard(){
    const myCard = document.getElementById('eqMySummaryCard');
    if(!myCard) return;

    const point = window.UDATA?.point || 0;
    const harvested = window.UDATA?.harvestedCrops || {};
    const totalCrops = Object.values(harvested).reduce((s,n)=>s+n,0);
    const variety = Object.keys(harvested).filter(k => harvested[k] > 0).length;
    const bunnies = (window._myBunny?.bunnies || []).length || 1;

    const isExpanded = myCard.dataset.eqExpanded !== 'false';

    const cropEntries = Object.entries(harvested)
      .filter(([_, n]) => n > 0)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 6);

    myCard.innerHTML = `
      <div style="background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;padding:14px;border:2px solid #FFE082;box-shadow:0 2px 8px rgba(0,0,0,.06);height:100%;display:flex;flex-direction:column">

        <div style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;margin-bottom:${isExpanded?'12px':'0'}" onclick="window.eqToggleSummary()">
          <div style="font-size:13px;font-weight:900;color:#5D4037">🌟 내 농장 현황</div>
          <div style="font-size:10px;color:#888">${isExpanded ? '▲ 접기' : '▼ 펼치기'}</div>
        </div>

        ${isExpanded ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="background:#fff8e1;border-radius:10px;padding:10px;text-align:center;border:1px solid #FFE082">
            <div style="font-size:22px;line-height:1">💰</div>
            <div style="font-size:16px;font-weight:900;color:#B8860B;margin-top:4px">${point.toLocaleString()}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">베리(P)</div>
          </div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center;border:1px solid #c8e6c9">
            <div style="font-size:22px;line-height:1">🌾</div>
            <div style="font-size:16px;font-weight:900;color:#1B5E20;margin-top:4px">${totalCrops}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">수확 ${variety}/12종</div>
          </div>
          <div style="background:#fce4ec;border-radius:10px;padding:10px;text-align:center;border:1px solid #f8bbd0">
            <div style="font-size:22px;line-height:1">🐰</div>
            <div style="font-size:16px;font-weight:900;color:#C44569;margin-top:4px">${bunnies}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">우리 가족</div>
          </div>
          <div style="background:#fff3e0;border-radius:10px;padding:10px;text-align:center;border:1px solid #ffe0b2">
            <div style="font-size:22px;line-height:1">📦</div>
            <div style="font-size:16px;font-weight:900;color:#e67e22;margin-top:4px">${totalCrops}</div>
            <div style="font-size:9px;color:#888;margin-top:2px">배송 대기</div>
          </div>
        </div>

        ${cropEntries.length > 0 ? `
        <div style="margin-top:10px;padding:10px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:10px;border:1.5px solid #c8e6c9;flex:1">
          <div style="font-size:10px;color:#1B5E20;font-weight:900;margin-bottom:6px;display:flex;justify-content:space-between">
            <span>📦 보유 작물 창고</span>
            <span style="color:#e67e22;background:#fff3e0;padding:1px 7px;border-radius:6px;font-size:9px">배송대기</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${cropEntries.map(([id, n]) => `<span style="background:#fff;padding:3px 8px;border-radius:8px;font-size:11px;font-weight:700;color:#1B5E20;border:1px solid #c8e6c9;white-space:nowrap">${CROP_MAP[id] || '🌾'} ×${n}</span>`).join('')}
          </div>
        </div>
        ` : `
        <div style="margin-top:10px;padding:14px;background:#fafafa;border:1.5px dashed #ddd;border-radius:10px;text-align:center;color:#888;font-size:11px;flex:1;display:flex;flex-direction:column;justify-content:center">
          <div style="font-size:24px;margin-bottom:4px">🌱</div>
          <div style="font-weight:700;color:#5D4037">수확물 없음</div>
          <div style="margin-top:3px;font-size:10px">들판에서 농사 시작!</div>
        </div>
        `}

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

    console.log('%c[farm_summary_widget v2] 🌟 옆 배치 + 수확물 창고 표시','color:#fff;background:#FF9800;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4500));
  else setTimeout(boot, 4500);
})();
