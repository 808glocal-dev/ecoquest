// bunny_field_layout_patch.js v1
// 1. 가방·토끼상점 버튼 위로 이동 (들판 농작물 안 가리게)
// 2. 농장 페이지 큰 격자 → 작은 요약 카드로 (들판 데이터와 연동)
(function(){
  'use strict';

  const CROPS = [
    {id:'carrot',name:'당근',emoji:'🥕',growMin:5},
    {id:'lettuce',name:'상추',emoji:'🥬',growMin:4},
    {id:'strawberry',name:'딸기',emoji:'🍓',growMin:6},
    {id:'tomato',name:'토마토',emoji:'🍅',growMin:7},
    {id:'corn',name:'옥수수',emoji:'🌽',growMin:8},
    {id:'pepper',name:'고추',emoji:'🌶️',growMin:6},
    {id:'broccoli',name:'브로콜리',emoji:'🥦',growMin:8},
    {id:'onion',name:'양파',emoji:'🧅',growMin:7},
    {id:'garlic',name:'마늘',emoji:'🧄',growMin:9},
    {id:'eggplant',name:'가지',emoji:'🍆',growMin:10},
    {id:'pumpkin',name:'호박',emoji:'🎃',growMin:12},
    {id:'apple',name:'사과',emoji:'🍎',growMin:15},
  ];

  function getStage(plot){
    if(!plot || !plot.plantedAt) return -1;
    const crop = CROPS.find(c => c.id === plot.crop);
    if(!crop) return -1;
    const pct = ((Date.now() - plot.plantedAt) / 60000) / crop.growMin;
    if(pct >= 1) return 3;
    if(pct >= 0.66) return 2;
    if(pct >= 0.33) return 1;
    return 0;
  }

  function getStageEmoji(plot){
    if(!plot || !plot.plantedAt) return '🟫';
    const stage = getStage(plot);
    if(stage === 3){ const crop = CROPS.find(c => c.id === plot.crop); return crop?.emoji || '🌾'; }
    return ['💧','🌱','🌿'][stage] || '🌱';
  }

  /* ===== 1. 가방·상점 버튼 위로 이동 ===== */
  function moveShopButtons(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    // 토끼 상점 버튼 찾기
    const allBtns = Array.from(playground.querySelectorAll('button'));
    const shopBtn = allBtns.find(b => /토끼\s*상점/.test(b.textContent || ''));
    if(shopBtn && !shopBtn.dataset.eqMoved){
      shopBtn.style.cssText = 'position:absolute;top:48px;right:8px;background:linear-gradient(135deg,#ff8a65,#ff5722);color:#fff;border:none;border-radius:14px;padding:6px 12px;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 10px rgba(255,87,34,.4);z-index:31;display:flex;align-items:center;gap:4px';
      shopBtn.dataset.eqMoved = '1';
    }

    // 가방 버튼 (bunny_inventory_patch가 만든 거)
    const bagBtn = document.getElementById('bunnyInvBtn');
    if(bagBtn && !bagBtn.dataset.eqMoved){
      bagBtn.style.cssText = 'position:absolute;top:88px;right:8px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;border:none;border-radius:14px;padding:6px 12px;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 10px rgba(108,92,231,.4);z-index:31;display:flex;align-items:center;gap:4px';
      bagBtn.dataset.eqMoved = '1';
    }
  }

  /* ===== 2. 농장 페이지 (page-farm) - 큰 격자 숨기고 작은 요약 ===== */
  function transformFarmPage(){
    const farmPage = document.getElementById('page-farm');
    if(!farmPage) return;
    const isActive = farmPage.classList.contains('on') || farmPage.style.display !== 'none';
    if(!isActive) return;

    // 기존 "내 텃밭" 큰 격자 컨테이너 찾기 (텍스트로 식별)
    farmPage.querySelectorAll('div, section').forEach(el => {
      if(el.dataset.eqHiddenFarm || el.id === 'eqFarmSummary') return;
      if(el.contains(document.getElementById('eqFarmSummary'))) return;
      const txt = (el.textContent || '').slice(0, 300);
      // "내 텃밭" + ("칸 사용" 또는 "심기" 또는 "성장") + 텍스트가 너무 길지 않음
      if(/내\s*텃밭/.test(txt) && /(칸\s*사용|심기|새싹|씨앗|성장)/.test(txt) && txt.length < 800){
        // 너무 깊지 않은 부모만 (페이지 전체 가리지 않게)
        let target = el;
        // 너무 짧으면 부모로 확장
        if(txt.length < 100){
          for(let i = 0; i < 3; i++){
            if(target.parentElement && target.parentElement !== farmPage){
              target = target.parentElement;
              if((target.textContent || '').length > 200) break;
            }
          }
        }
        if(target !== farmPage && !target.contains(document.getElementById('eqFarmSummary'))){
          target.style.display = 'none';
          target.dataset.eqHiddenFarm = '1';
        }
      }
    });

    // 우리 요약 카드 추가/갱신
    addFarmSummaryCard(farmPage);
  }

  function addFarmSummaryCard(farmPage){
    const plots = window.UDATA?.bunnyField?.plots || [];
    const harvested = window.UDATA?.harvestedCrops || {};

    const growing = plots.filter(p => p && getStage(p) < 3 && getStage(p) >= 0).length;
    const ready = plots.filter(p => p && getStage(p) === 3).length;
    const empty = plots.filter(p => !p).length;
    const collected = Object.keys(harvested).filter(k => harvested[k] > 0).length;
    const totalHarvest = Object.values(harvested).reduce((s, n) => s + n, 0);

    let card = document.getElementById('eqFarmSummary');
    if(!card){
      card = document.createElement('div');
      card.id = 'eqFarmSummary';
      card.style.cssText = 'margin:12px;background:#fff;border-radius:16px;padding:16px;border:1.5px solid var(--bdr);box-shadow:0 2px 10px rgba(0,0,0,.05)';
      farmPage.insertBefore(card, farmPage.firstChild);
    }

    // 현재 plots 시각화 (작은 띠)
    const plotsViz = plots.length ? plots.map(p => `<span style="font-size:24px">${getStageEmoji(p)}</span>`).join('') :
      '🟫🟫🟫🟫🟫🟫'.split('').map(e => `<span style="font-size:24px">${e}</span>`).join('');

    card.innerHTML = `
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:11px;color:#2ECC71;font-weight:700;letter-spacing:2px">🌾 MY FARM</div>
        <div style="font-size:17px;font-weight:900;color:#1B5E20;margin-top:2px">내 텃밭 현황</div>
      </div>

      <div style="background:linear-gradient(180deg,#bee9d4 0%,#a8dc8e 100%);border-radius:14px;padding:14px 10px;text-align:center;margin-bottom:14px">
        <div style="display:flex;justify-content:center;gap:6px;margin-bottom:6px">${plotsViz}</div>
        <div style="font-size:10px;color:#1B5E20;font-weight:700;background:rgba(255,255,255,.7);border-radius:10px;padding:2px 10px;display:inline-block">실시간 — 들판과 똑같이 자라는 중</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#f0fbf4;border-radius:12px;padding:12px 8px;text-align:center;border:1.5px solid #c8e6c9">
          <div style="font-size:22px">🌱</div>
          <div style="font-size:16px;font-weight:900;color:#1B5E20;margin-top:2px">${growing}개</div>
          <div style="font-size:10px;color:#666">자라는 중</div>
        </div>
        <div style="background:#fff8e1;border-radius:12px;padding:12px 8px;text-align:center;border:1.5px solid #ffe082">
          <div style="font-size:22px">🌾</div>
          <div style="font-size:16px;font-weight:900;color:#8D6E1B;margin-top:2px">${ready}개</div>
          <div style="font-size:10px;color:#666">수확 가능 ${ready > 0 ? '✨' : ''}</div>
        </div>
        <div style="background:#f0f4ff;border-radius:12px;padding:12px 8px;text-align:center;border:1.5px solid #c5cae9">
          <div style="font-size:22px">📔</div>
          <div style="font-size:16px;font-weight:900;color:#1A237E;margin-top:2px">${collected}/12</div>
          <div style="font-size:10px;color:#666">도감 진행</div>
        </div>
        <div style="background:#fff0f6;border-radius:12px;padding:12px 8px;text-align:center;border:1.5px solid #f8b6cc">
          <div style="font-size:22px">🏆</div>
          <div style="font-size:16px;font-weight:900;color:#C44569;margin-top:2px">${totalHarvest}개</div>
          <div style="font-size:10px;color:#666">누적 수확</div>
        </div>
      </div>

      <button onclick="window.goPage&&window.goPage('map')" style="width:100%;background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
        🌍 들판에서 농사짓기
      </button>

      <div style="margin-top:10px;padding:9px 12px;background:#f8fdf9;border-radius:10px;font-size:11px;color:#1B5E20;text-align:center;line-height:1.6">
        💡 농작물은 <b>들판(지구 탭)</b>에서 직접 심고 수확해요<br/>
        <span style="font-size:10px;color:#666">실시간으로 여기와 자동 연동돼요</span>
      </div>
    `;
  }

  /* ===== boot ===== */
  function boot(){
    if(!window.FB){ setTimeout(boot, 500); return; }

    moveShopButtons();
    transformFarmPage();

    const observer = new MutationObserver(() => {
      moveShopButtons();
      // 농장 페이지가 보이면 변환
      const farmPage = document.getElementById('page-farm');
      if(farmPage && (farmPage.classList.contains('on') || farmPage.style.display !== 'none')){
        transformFarmPage();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 주기 체크 (안전망)
    setInterval(() => {
      moveShopButtons();
      const farmPage = document.getElementById('page-farm');
      if(farmPage && (farmPage.classList.contains('on') || farmPage.style.display !== 'none')){
        transformFarmPage();
      }
    }, 2000);

    // 30초마다 요약 카드 데이터 갱신
    setInterval(() => {
      const card = document.getElementById('eqFarmSummary');
      const farmPage = document.getElementById('page-farm');
      if(card && farmPage) addFarmSummaryCard(farmPage);
    }, 30000);

    console.log('%c[bunny_field_layout v1] 🎨 버튼 재배치 + 농장 요약 카드','color:#fff;background:#27AE60;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4000));
  else setTimeout(boot, 4000);
})();
