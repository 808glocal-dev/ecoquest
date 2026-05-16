// bunny_field_layout_patch.js v5
// 1. 어디 페이지에 있든 MY FARM, 내 텃밭 카드 전역 숨김
// 2. 농장 페이지(page-farm) = 수확물 창고 + 쿠폰 교환
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

  const STORES = [
    {id:'thepicker', name:'더피커', desc:'서울 성동구'},
    {id:'almang', name:'알맹상점', desc:'서울 마포구'},
    {id:'jigushop', name:'지구샵', desc:'서울 강남구'},
    {id:'other', name:'기타 매장 (직접 입력)', desc:''},
  ];

  /* ===== CSS - page-farm 다른 콘텐츠 숨김 ===== */
  function injectCss(){
    if(document.getElementById('eqFarmPageCss')) return;
    const s = document.createElement('style');
    s.id = 'eqFarmPageCss';
    s.textContent = `
      #page-farm > *:not(#eqMyHarvestStore) {
        display: none !important;
      }
      #eqMyHarvestStore { display: block !important; }
    `;
    document.head.appendChild(s);
  }

  /* ===== 🌐 전역 MY FARM / 내 텃밭 카드 강제 숨김 ===== */
  function hideOldFarmEverywhere(){
    // body 전체에서 검색 (어느 페이지에 있든)
    document.querySelectorAll('div, section').forEach(el => {
      if(el.id === 'eqMyHarvestStore') return;
      if(el.contains(document.getElementById('eqMyHarvestStore'))) return;
      if(el.dataset.eqHiddenFarmCard) return;

      const txt = (el.textContent || '').slice(0, 400).trim();
      if(!txt || txt.length > 800) return;

      // 식별 패턴
      const isMyFarmCard = /MY\s*FARM/.test(txt) && /(일반\s*씨앗|못난이\s*씨앗|도감)/.test(txt);
      const isFieldGrid = /내\s*텃밭/.test(txt) && /(칸\s*사용|심기|새싹|씨앗)/.test(txt);
      const isPlotsBox = /일반\s*씨앗.*못난이\s*씨앗/.test(txt) || /못난이\s*씨앗.*일반\s*씨앗/.test(txt);

      if(isMyFarmCard || isFieldGrid || isPlotsBox){
        el.style.display = 'none';
        el.dataset.eqHiddenFarmCard = '1';
      }
    });
  }

  /* ===== 가방·상점 버튼 위로 ===== */
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

  /* ===== 수확물 창고 ===== */
  function ensureHarvestStore(){
    const farmPage = document.getElementById('page-farm');
    if(!farmPage) return;

    let store = document.getElementById('eqMyHarvestStore');
    if(!store){
      store = document.createElement('div');
      store.id = 'eqMyHarvestStore';
      farmPage.insertBefore(store, farmPage.firstChild);
    }
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
              <div style="position:absolute;top:6px;right:6px;background:#FF6B9D;color:#fff;font-size:10px;font-weight:900;padding:2px 7px;border-radius:10px">×${harvested[c.id]}</div>
              <div style="font-size:38px;line-height:1">${c.emoji}</div>
              <div style="font-size:11px;color:#5D4037;margin-top:6px;font-weight:900">${c.name}</div>
              <div style="font-size:9px;color:#e67e22;margin-top:3px;font-weight:700">📦 배송대기</div>
            </div>
          `).join('')}
        </div>

        <button onclick="window.openExchangeRequest()" style="width:100%;background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:14px;padding:14px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:14px;box-shadow:0 4px 12px rgba(196,69,105,.3)">
          🎟️ 쿠폰으로 교환 신청
        </button>
        ` : `
        <div style="background:#fafafa;border:1.5px dashed #ddd;border-radius:14px;padding:30px 16px;text-align:center;color:#888;margin-bottom:16px">
          <div style="font-size:44px;margin-bottom:8px">🌱</div>
          <div style="font-size:13px;font-weight:700;color:#5D4037">아직 수확한 작물이 없어요!</div>
          <div style="font-size:11px;margin-top:6px;color:#999">들판에서 농사를 시작해보세요</div>
        </div>
        `}

        <div style="background:linear-gradient(135deg,#f0f4ff,#e8edff);border-radius:14px;padding:14px;margin-bottom:14px;border:1.5px solid #c5cae9;cursor:pointer;transition:transform .15s" onclick="window.openMyPokedex&&window.openMyPokedex()" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:32px">📔</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:900;color:#1A237E">작물 도감</div>
              <div style="font-size:11px;color:#5C6BC0;margin-top:2px">${variety}/12 종 발견 · 탭해서 자세히 →</div>
              <div style="background:#fff;border-radius:6px;height:6px;margin-top:6px;overflow:hidden">
                <div style="width:${(variety/12)*100}%;height:100%;background:linear-gradient(90deg,#5C6BC0,#3F51B5);transition:width .5s"></div>
              </div>
            </div>
          </div>
        </div>

        ${noCrops.length > 0 ? `
        <div style="font-size:11px;font-weight:700;color:#999;margin-bottom:6px">🔍 아직 안 키운 작물 (${noCrops.length}종)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;background:#fafafa;border-radius:12px;padding:12px;justify-content:center">
          ${noCrops.map(c => `<span style="font-size:24px;filter:grayscale(.9);opacity:.55" title="${c.name} 아직 미수확">${c.emoji}</span>`).join('')}
        </div>
        ` : ''}

        <div style="background:linear-gradient(135deg,#fff8e1,#fffde7);border-radius:14px;padding:14px;text-align:center;border:2px solid #FFD54F">
          <div style="font-size:28px;margin-bottom:4px">🎟️</div>
          <div style="font-size:13px;font-weight:900;color:#8D6E1B">쿠폰 교환으로 받아가요!</div>
          <div style="font-size:11px;color:#8D6E1B;margin-top:6px;line-height:1.7">신청한 작물을 제로웨이스트 상점으로<br/>발송 · 현장에서 본인 확인 후 수령 🥬</div>
        </div>

      </div>
    `;
  }

  /* ===== 쿠폰 교환 모달 ===== */
  window.openExchangeRequest = function(){
    const harvested = window.UDATA?.harvestedCrops || {};
    const hasCrops = CROPS.filter(c => (harvested[c.id]||0) > 0);
    if(!hasCrops.length){ window.toast?.('교환할 작물이 없어요!'); return; }

    const old = document.getElementById('ovExchange'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovExchange';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9700;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div style="background:#fff;border-radius:22px;max-width:420px;width:100%;padding:24px 20px;max-height:88vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:18px">
          <div style="font-size:42px;margin-bottom:6px">🎟️</div>
          <div style="font-size:18px;font-weight:900;color:#5D4037">쿠폰 교환 신청</div>
          <div style="font-size:11px;color:#888;margin-top:6px">수확물을 제로웨이스트 상점에서 받아가세요</div>
        </div>
        <div style="font-size:13px;font-weight:900;color:#5D4037;margin-bottom:8px">📦 교환할 작물</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:16px">
          ${hasCrops.map(c => `
            <div style="background:#f8fdf9;border:1.5px solid #c8e6c9;border-radius:12px;padding:10px;display:flex;align-items:center;gap:8px">
              <div style="font-size:28px">${c.emoji}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:11px;font-weight:900;color:#5D4037">${c.name}</div>
                <div style="font-size:10px;color:#888;margin-bottom:3px">보유 ${harvested[c.id]}개</div>
                <input type="number" id="qty-${c.id}" min="0" max="${harvested[c.id]}" value="${harvested[c.id]}" style="width:100%;border:1px solid #ddd;border-radius:6px;padding:5px;font-size:13px;text-align:center;font-family:inherit;outline:none;font-weight:700"/>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="font-size:13px;font-weight:900;color:#5D4037;margin-bottom:8px">🏪 받을 매장</div>
        <select id="exchangeStore" style="width:100%;border:1.5px solid #ddd;border-radius:12px;padding:12px;font-size:14px;font-family:inherit;outline:none;margin-bottom:8px;background:#fff;font-weight:700">
          ${STORES.map(s => `<option value="${s.id}|${s.name}">${s.name}${s.desc?` · ${s.desc}`:''}</option>`).join('')}
        </select>
        <input id="exchangeStoreOther" placeholder="기타 매장명 직접 입력" style="width:100%;border:1.5px solid #ddd;border-radius:12px;padding:12px;font-size:14px;font-family:inherit;outline:none;margin-bottom:14px;display:none"/>
        <div style="font-size:13px;font-weight:900;color:#5D4037;margin-bottom:8px">📞 연락처 <span style="font-size:11px;color:#888;font-weight:400">(선택)</span></div>
        <input id="exchangeContact" placeholder="전화 또는 카톡 ID" style="width:100%;border:1.5px solid #ddd;border-radius:12px;padding:12px;font-size:14px;font-family:inherit;outline:none;margin-bottom:14px"/>
        <div style="background:#fff8e1;border-radius:10px;padding:11px 13px;font-size:11px;color:#8D6E1B;line-height:1.7;margin-bottom:16px">
          💡 신청 후 EcoQuest가 매장에 발송<br/>
          💡 매장에서 본인 확인 후 수령 (1-2주)<br/>
          💡 신청한 만큼 창고에서 차감
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="document.getElementById('ovExchange').remove()" style="flex:1;background:#f0f0f0;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">취소</button>
          <button onclick="window._submitExchange()" style="flex:2;background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">🎟️ 신청하기</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('exchangeStore').addEventListener('change', (e) => {
      const otherInput = document.getElementById('exchangeStoreOther');
      otherInput.style.display = e.target.value.startsWith('other') ? 'block' : 'none';
    });
  };

  window._submitExchange = async function(){
    const harvested = window.UDATA?.harvestedCrops || {};
    const items = [];
    let totalCount = 0;

    CROPS.forEach(c => {
      const inp = document.getElementById(`qty-${c.id}`);
      if(!inp) return;
      const qty = parseInt(inp.value) || 0;
      if(qty > 0 && qty <= (harvested[c.id] || 0)){
        items.push({cropId: c.id, cropName: c.name, cropEmoji: c.emoji, count: qty});
        totalCount += qty;
      }
    });

    if(!totalCount){ window.toast?.('교환할 수량을 입력해주세요'); return; }

    const storeSel = document.getElementById('exchangeStore').value;
    let storeName = storeSel.split('|')[1] || '';
    if(storeSel.startsWith('other')){
      storeName = document.getElementById('exchangeStoreOther')?.value?.trim() || '기타 매장';
    }
    const contact = document.getElementById('exchangeContact')?.value?.trim() || '';

    try {
      await window.FB.addDoc(window.FB.collection(window.FB.db, 'couponRequests'), {
        uid: window.ME.uid,
        userName: window.UDATA?.nickname || window.ME.displayName || '익명',
        userEmail: window.ME.email || '',
        items, totalCount, targetStore: storeName, contact,
        status: 'pending', createdAt: window.FB.serverTimestamp(),
      });

      const newHarvested = {...harvested};
      items.forEach(item => {
        newHarvested[item.cropId] = Math.max(0, (newHarvested[item.cropId] || 0) - item.count);
        if(newHarvested[item.cropId] === 0) delete newHarvested[item.cropId];
      });
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), {
        harvestedCrops: newHarvested
      });
      window.UDATA.harvestedCrops = newHarvested;

      document.getElementById('ovExchange')?.remove();
      window.toast?.(`🎉 ${totalCount}개 신청 완료! ${storeName}으로 보낼게요`);
      updateHarvestStore();
    } catch(e){
      console.error('[exchange]', e);
      window.toast?.('신청 실패: ' + e.message);
    }
  };

  /* boot */
  function boot(){
    injectCss();
    moveShopButtons();
    hideOldFarmEverywhere(); // 전역 숨김
    ensureHarvestStore();

    setInterval(() => {
      injectCss();
      moveShopButtons();
      hideOldFarmEverywhere(); // 1초마다 전역 보호
      ensureHarvestStore();
    }, 1000);

    setInterval(updateHarvestStore, 30000);

    console.log('%c[bunny_field_layout v5] 🌾 전역 숨김 + 수확물 창고','color:#fff;background:#27AE60;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 2000));
  else setTimeout(boot, 2000);
})();
