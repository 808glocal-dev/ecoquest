// bunny_field_layout_patch.js v2
// 1. 가방·토끼상점 버튼 위로 이동
// 2. 농장 페이지 완전 재구성: 수확물 창고 + 실제 배송 대기 표시
(function(){
  'use strict';

  const CROPS = [
    {id:'carrot',name:'당근',emoji:'🥕'},
    {id:'lettuce',name:'상추',emoji:'🥬'},
    {id:'strawberry',name:'딸기',emoji:'🍓'},
    {id:'tomato',name:'토마토',emoji:'🍅'},
    {id:'corn',name:'옥수수',emoji:'🌽'},
    {id:'pepper',name:'고추',emoji:'🌶️'},
    {id:'broccoli',name:'브로콜리',emoji:'🥦'},
    {id:'onion',name:'양파',emoji:'🧅'},
    {id:'garlic',name:'마늘',emoji:'🧄'},
    {id:'eggplant',name:'가지',emoji:'🍆'},
    {id:'pumpkin',name:'호박',emoji:'🎃'},
    {id:'apple',name:'사과',emoji:'🍎'},
  ];

  /* ===== 1. 가방·상점 버튼 위로 ===== */
  function moveShopButtons(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    const allBtns = Array.from(playground.querySelectorAll('button'));
    const shopBtn = allBtns.find(b => /토끼\s*상점/.test(b.textContent || ''));
    if(shopBtn && !shopBtn.dataset.eqMoved){
      shopBtn.style.cssText = 'position:absolute;top:48px;right:8px;background:linear-gradient(135deg,#ff8a65,#ff5722);color:#fff;border:none;border-radius:14px;padding:6px 12px;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 10px rgba(255,87,34,.4);z-index:31;display:flex;align-items:center;gap:4px';
      shopBtn.dataset.eqMoved = '1';
    }
    const bagBtn = document.getElementById('bunnyInvBtn');
    if(bagBtn && !bagBtn.dataset.eqMoved){
      bagBtn.style.cssText = 'position:absolute;top:88px;right:8px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;border:none;border-radius:14px;padding:6px 12px;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 10px rgba(108,92,231,.4);z-index:31;display:flex;align-items:center;gap:4px';
      bagBtn.dataset.eqMoved = '1';
    }
  }

  /* ===== 2. 농장 페이지 - 모든 기존 콘텐츠 숨김 + 수확물 창고 ===== */
  function transformFarmPage(){
    const farmPage = document.getElementById('page-farm');
    if(!farmPage) return;
    const isActive = farmPage.classList.contains('on') || (farmPage.style.display !== 'none' && farmPage.offsetParent !== null);
    if(!isActive) return;

    // 우리 거 외 모든 직접 자식 숨김
    Array.from(farmPage.children).forEach(child => {
      if(child.id === 'eqMyHarvestStore') return;
      if(child.dataset.eqHiddenFarm) return;
      child.style.display = 'none';
      child.dataset.eqHiddenFarm = '1';
    });

    // 우리 거 없으면 추가
    if(!document.getElementById('eqMyHarvestStore')){
      addHarvestStore(farmPage);
    } else {
      updateHarvestStore();
    }
  }

  function addHarvestStore(farmPage){
    const store = document.createElement('div');
    store.id = 'eqMyHarvestStore';
    farmPage.insertBefore(store, farmPage.firstChild);
    updateHarvestStore();
  }

  function updateHarvestStore(){
    const store = document.getElementById('eqMyHarvestStore');
    if(!store) return;
    const harvested = window.UDATA?.harvestedCrops || {};
    const totalCount = Object.values(harvested).reduce((s,n)=>s+n,0);
    const variety = Object.keys(harvested).filter(k => harvested[k] > 0).length;
    const hasCrops = CROPS.filter(c => (harvested[c.id]||0) > 0);
    const noCrops = CROPS.filter(c => !(harvested[c.id]||0));

    store.innerHTML = `
      <div style="margin:12px;background:#fff;border-radius:18px;padding:18px 16px;border:1.5px solid #d8eedd;box-shadow:0 2px 12px rgba(0,0,0,.05)">

        <div style="text-align:center;margin-bottom:18px">
          <div style="font-size:11px;color:#27AE60;font-weight:700;letter-spacing:2.5px">🌾 MY HARVEST</div>
          <div style="font-size:19px;font-weight:900;color:#1B5E20;margin-top:4px">내 농작물 창고</div>
          <div style="font-size:11px;color:#888;margin-top:4px">📦 수확한 작물이 모이는 곳</div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:16px">
          <div style="flex:1;background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:14px;padding:14px 8px;text-align:center;border:1.5px solid #c8e6c9">
            <div style="font-size:28px;font-weight:900;color:#1B5E20">${totalCount}</div>
            <div style="font-size:10px;color:#666;margin-top:2px">개 수확</div>
          </div>
          <div style="flex:1;background:linear-gradient(135deg,#fff8e1,#fffde7);border-radius:14px;padding:14px 8px;text-align:center;border:1.5px solid #ffe082">
            <div style="font-size:28px;font-weight:900;color:#8D6E1B">${variety}<span style="font-size:14px;color:#999">/12</span></div>
            <div style="font-size:10px;color:#666;margin-top:2px">종류</div>
          </div>
        </div>

        ${hasCrops.length > 0 ? `
        <div style="font-size:13px;font-weight:900;color:#1B5E20;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          📦 보유 작물 <span style="background:#fff3e0;color:#e67e22;font-size:10px;padding:2px 8px;border-radius:10px">배송 대기</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px">
          ${hasCrops.map(c => `
            <div style="background:linear-gradient(135deg,#fff,#f0fbf4);border:1.5px solid #a8e6c5;border-radius:14px;padding:14px 6px;text-align:center;position:relative">
              <div style="position:absolute;top:6px;right:6px;background:#FF6B9D;color:#fff;font-size:9px;font-weight:900;padding:1px 6px;border-radius:8px">×${harvested[c.id]}</div>
              <div style="font-size:36px;line-height:1">${c.emoji}</div>
              <div style="font-size:11px;color:#5D4037;margin-top:6px;font-weight:900">${c.name}</div>
              <div style="font-size:9px;color:#e67e22;margin-top:3px;font-weight:700">📦 배송대기</div>
            </div>
          `).join('')}
        </div>
        ` : `
        <div style="background:#fafafa;border:1.5px dashed #ddd;border-radius:14px;padding:30px 16px;text-align:center;color:#888;margin-bottom:16px">
          <div style="font-size:44px;margin-bottom:8px">🌱</div>
          <div style="font-size:13px;font-weight:700;color:#5D4037">아직 수확한 작물이 없어요!</div>
          <div style="font-size:11px;margin-top:6px;color:#999">들판에서 농사를 시작해보세요</div>
        </div>
        `}

        ${noCrops.length > 0 ? `
        <div style="font-size:11px;font-weight:700;color:#999;margin-bottom:6px">🔍 아직 안 키운 작물 (${noCrops.length}종)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:18px;background:#fafafa;border-radius:12px;padding:12px">
          ${noCrops.map(c => `<span style="font-size:22px;filter:grayscale(.9);opacity:.55" title="${c.name} 아직 미수확">${c.emoji}</span>`).join('')}
        </div>
        ` : ''}

        <div style="background:linear-gradient(135deg,#fff8e1,#fffde7);border-radius:14px;padding:14px;text-align:center;margin-bottom:14px;border:2px solid #FFD54F">
          <div style="font-size:28px;margin-bottom:4px">🚚</div>
          <div style="font-size:13px;font-weight:900;color:#8D6E1B">실제 배송 시스템 곧 오픈!</div>
          <div style="font-size:11px;color:#8D6E1B;margin-top:6px;line-height:1.7">EcoQuest는 게임 속 수확량만큼<br/>진짜 신선 채소를 집으로 배송해드릴 예정이에요 🥬</div>
        </div>

        <div style="display:flex;gap:8px">
          <button onclick="window.goPage&&window.goPage('map')" style="flex:2;background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">
            🌍 들판에서 농사짓기
          </button>
          <button onclick="window.openMyPokedex&&window.openMyPokedex()" style="flex:1;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit">
            📔 도감
          </button>
        </div>

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
      const farmPage = document.getElementById('page-farm');
      if(farmPage && (farmPage.classList.contains('on') || (farmPage.style.display !== 'none' && farmPage.offsetParent !== null))){
        transformFarmPage();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 1초마다 강제 보호
    setInterval(() => {
      moveShopButtons();
      const farmPage = document.getElementById('page-farm');
      if(farmPage && (farmPage.classList.contains('on') || (farmPage.style.display !== 'none' && farmPage.offsetParent !== null))){
        transformFarmPage();
      }
    }, 1000);

    // 30초마다 수확물 카운트 갱신
    setInterval(() => {
      if(document.getElementById('eqMyHarvestStore')) updateHarvestStore();
    }, 30000);

    console.log('%c[bunny_field_layout v2] 🌾 농작물 창고 + 버튼 재배치','color:#fff;background:#27AE60;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4000));
  else setTimeout(boot, 4000);
})();
