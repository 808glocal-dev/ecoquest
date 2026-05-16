// bunny_inventory_patch.js v1
// bunny_shop_patch.js와 짝꿍 - 인벤토리 저장/표시/배치/회수 시스템
(function(){
  'use strict';

  /* ===== Firebase 저장 ===== */
  async function saveBunnyData(){
    if(!window.ME?.uid || !window.UDATA) return;
    try {
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), {
        bunnyInventory: window.UDATA.bunnyInventory || [],
        bunnyDecorations: window.UDATA.bunnyDecorations || [],
        bunnyPlaced: window.UDATA.bunnyPlaced || [],
      });
    } catch(e){ console.error('[bunny_inv] save 실패', e); }
  }

  /* ===== bunny_shop_patch.js가 호출하는 함수 정의 ===== */
  window._bunnyAddInventory = async function(item){
    if(!window.UDATA.bunnyInventory) window.UDATA.bunnyInventory = [];
    window.UDATA.bunnyInventory.push({
      ...item,
      uid: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
      addedAt: Date.now()
    });
    await saveBunnyData();
    console.log('[bunny_inv] 인벤토리 추가:', item.name);
  };

  window._bunnyAddDecoration = async function(deco){
    if(!window.UDATA.bunnyDecorations) window.UDATA.bunnyDecorations = [];
    window.UDATA.bunnyDecorations.push({ ...deco, addedAt: Date.now() });
    await saveBunnyData();
    renderDecorationsAndPlaced();
    console.log('[bunny_inv] 데코 배치:', deco.emoji);
  };

  /* ===== 🎒 가방 버튼 추가 (토끼 상점 버튼 옆) ===== */
  function addInventoryBtn(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return false;
    if(document.getElementById('bunnyInvBtn')) return true;
    const btn = document.createElement('button');
    btn.id = 'bunnyInvBtn';
    btn.onclick = openInventory;
    btn.style.cssText = `position:absolute;bottom:8px;right:108px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;border:none;border-radius:18px;padding:8px 14px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(108,92,231,.4);z-index:30;display:flex;align-items:center;gap:5px`;
    const cnt = (window.UDATA?.bunnyInventory||[]).length;
    btn.innerHTML = `🎒 내 가방${cnt > 0 ? ` <span style="background:#fff;color:#6c5ce7;border-radius:10px;padding:1px 6px;font-size:10px">${cnt}</span>` : ''}`;
    playground.appendChild(btn);
    return true;
  }

  function updateBagBadge(){
    const btn = document.getElementById('bunnyInvBtn');
    if(!btn) return;
    const cnt = (window.UDATA?.bunnyInventory||[]).length;
    btn.innerHTML = `🎒 내 가방${cnt > 0 ? ` <span style="background:#fff;color:#6c5ce7;border-radius:10px;padding:1px 6px;font-size:10px">${cnt}</span>` : ''}`;
  }

  /* ===== 인벤토리 모달 ===== */
  window.openInventory = function(){
    const inv = window.UDATA?.bunnyInventory || [];
    const placed = window.UDATA?.bunnyPlaced || [];
    const decorations = window.UDATA?.bunnyDecorations || [];

    const old = document.getElementById('ovBunnyInv'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovBunnyInv';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9000;display:flex;align-items:flex-end;justify-content:center';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;max-width:480px;width:100%;max-height:88vh;overflow:hidden;display:flex;flex-direction:column">
        <div style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);padding:18px;color:#fff;text-align:center;position:relative;flex-shrink:0">
          <button onclick="document.getElementById('ovBunnyInv').remove()" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,.25);border:none;border-radius:50%;width:30px;height:30px;font-size:14px;cursor:pointer;color:#fff">✕</button>
          <div style="width:40px;height:4px;background:rgba(255,255,255,.4);border-radius:4px;margin:0 auto 8px"></div>
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.85)">🎒 MY BAG</div>
          <div style="font-size:18px;font-weight:900;margin-top:4px">내 가방</div>
          <div style="font-size:10px;color:rgba(255,255,255,.85);margin-top:4px">🛒 상점에서 산 물건들 · 농장에 꺼내서 사용해요</div>
        </div>
        <div style="padding:14px 16px;overflow-y:auto;flex:1">

          <!-- 보관 중인 아이템 -->
          <div style="font-size:13px;font-weight:900;color:#5D4037;margin-bottom:10px">📦 보관 중 (${inv.length}개)</div>
          ${inv.length ? inv.map(item => `
            <div style="background:#fff;border:1.5px solid #E0E0FF;border-radius:12px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
              <div style="font-size:28px;flex-shrink:0">${item.emoji}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:#5D4037">${item.name}</div>
                <div style="font-size:10px;color:#888">${item.happiness ? `😊 행복 +${item.happiness}` : ''}</div>
              </div>
              <button onclick="window.usePlaceItem('${item.uid}')" style="background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;border:none;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0">🏞️ 농장에 꺼내기</button>
            </div>`).join('') : `
            <div style="text-align:center;padding:30px 16px;color:#999;background:#fafafa;border-radius:12px">
              <div style="font-size:36px;margin-bottom:8px">📭</div>
              <div style="font-size:12px">아직 산 물건이 없어요!</div>
              <div style="font-size:10px;margin-top:4px">🛒 토끼 상점에서 사보세요</div>
            </div>`}

          <!-- 농장에 꺼낸 거 -->
          ${placed.length ? `
            <div style="font-size:13px;font-weight:900;color:#5D4037;margin:16px 0 8px">🏞️ 농장에 꺼낸 거 (${placed.length}개)</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px">농장 배경의 작물을 탭하면 가방으로 돌아와요</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px">
              ${placed.map(p => `
                <div style="background:#f0fbf4;border:1px solid #c8e6c9;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:24px">${p.emoji}</div>
                  <div style="font-size:9px;color:#666;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
                </div>`).join('')}
            </div>
          ` : ''}

          <!-- 영구 데코 -->
          ${decorations.length ? `
            <div style="font-size:13px;font-weight:900;color:#5D4037;margin:16px 0 8px">🌳 정원 데코 (${decorations.length}개)</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px">영구 배치되었어요 (위치 자동)</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:6px">
              ${decorations.map(d => `
                <div style="background:#fffbe6;border:1px solid #ffe082;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:22px">${d.emoji}</div>
                </div>`).join('')}
            </div>
          ` : ''}

          <div style="margin-top:16px;padding:11px 12px;background:#f0fbf4;border-radius:10px;font-size:11px;color:#1B5E20;line-height:1.7">
            💡 <b>꺼내기</b> → 농장 배경에 등장<br/>
            💡 <b>회수</b> → 농장 작물 탭하면 가방으로<br/>
            💡 모든 데이터는 안전하게 저장돼요 🔒
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  /* ===== 인벤토리 → 농장에 꺼내기 ===== */
  window.usePlaceItem = async function(itemUid){
    const inv = window.UDATA.bunnyInventory || [];
    const idx = inv.findIndex(x => x.uid === itemUid);
    if(idx === -1) return;
    const item = inv[idx];

    if(!window.UDATA.bunnyPlaced) window.UDATA.bunnyPlaced = [];
    window.UDATA.bunnyPlaced.push({
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
      itemId: item.id,
      emoji: item.emoji,
      name: item.name,
      happiness: item.happiness || 0,
      x: 15 + Math.random()*70,
      y: 25 + Math.random()*50,
    });
    inv.splice(idx, 1);
    await saveBunnyData();
    renderDecorationsAndPlaced();
    updateBagBadge();
    window.toast && window.toast(`✨ ${item.emoji} ${item.name} 농장에 꺼냄!`);
    window.openInventory(); // 모달 새로고침
  };

  /* ===== 농장 작물 클릭 → 가방으로 회수 ===== */
  window.recallPlacedItem = async function(placedId){
    const placed = window.UDATA.bunnyPlaced || [];
    const idx = placed.findIndex(p => p.id === placedId);
    if(idx === -1) return;
    const item = placed[idx];

    if(!window.UDATA.bunnyInventory) window.UDATA.bunnyInventory = [];
    window.UDATA.bunnyInventory.push({
      id: item.itemId,
      emoji: item.emoji,
      name: item.name,
      happiness: item.happiness || 0,
      uid: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
    });
    placed.splice(idx, 1);
    await saveBunnyData();
    renderDecorationsAndPlaced();
    updateBagBadge();
    window.toast && window.toast(`📦 ${item.emoji} 가방으로 회수!`);
  };

  /* ===== 농장 배경에 데코 + 배치 아이템 그리기 ===== */
  function renderDecorationsAndPlaced(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    playground.querySelectorAll('.eq-bunny-deco, .eq-bunny-placed').forEach(el => el.remove());

    // 영구 데코 (꾸미기 아이템)
    const decorations = window.UDATA?.bunnyDecorations || [];
    decorations.forEach(d => {
      const el = document.createElement('div');
      el.className = 'eq-bunny-deco';
      el.style.cssText = `position:absolute;left:${d.x}px;top:${d.y}px;font-size:${d.size||28}px;pointer-events:none;z-index:5;filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))`;
      el.textContent = d.emoji;
      playground.appendChild(el);
    });

    // 인벤토리에서 꺼낸 거 (회수 가능)
    const placed = window.UDATA?.bunnyPlaced || [];
    placed.forEach(p => {
      const el = document.createElement('div');
      el.className = 'eq-bunny-placed';
      el.style.cssText = `position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);font-size:30px;cursor:pointer;z-index:6;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));transition:transform .15s`;
      el.textContent = p.emoji;
      el.title = `${p.name} (탭 → 가방으로 회수)`;
      el.onclick = () => window.recallPlacedItem(p.id);
      el.onmouseover = () => { el.style.transform = 'translate(-50%,-50%) scale(1.2)'; };
      el.onmouseout = () => { el.style.transform = 'translate(-50%,-50%)'; };
      playground.appendChild(el);
    });
  }

  /* ===== boot ===== */
  function boot(){
    if(!window.FB){ setTimeout(boot, 500); return; }
    addInventoryBtn();
    renderDecorationsAndPlaced();

    // playground 다시 그려져도 버튼 + 그림 유지
    const observer = new MutationObserver(() => {
      if(document.getElementById('bunnyPlayground')){
        if(!document.getElementById('bunnyInvBtn')){
          addInventoryBtn();
          renderDecorationsAndPlaced();
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('%c[bunny_inventory_patch] ✅ 인벤토리 시스템 활성화','color:#fff;background:#6c5ce7;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3000));
  else setTimeout(boot, 3000);
})();
