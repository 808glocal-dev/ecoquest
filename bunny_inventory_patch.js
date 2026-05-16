// bunny_inventory_patch.js v2
// 가방 + 드래그로 이동 + 농장 풍경 강화 (풀/꽃/햇님/농지)
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

  /* ===== bunny_shop_patch가 호출하는 함수 정의 ===== */
  window._bunnyAddInventory = async function(item){
    if(!window.UDATA.bunnyInventory) window.UDATA.bunnyInventory = [];
    window.UDATA.bunnyInventory.push({
      ...item,
      uid: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
      addedAt: Date.now()
    });
    await saveBunnyData();
    updateBagBadge();
    console.log('[bunny_inv] 인벤토리 추가:', item.name);
  };

  window._bunnyAddDecoration = async function(deco){
    if(!window.UDATA.bunnyDecorations) window.UDATA.bunnyDecorations = [];
    window.UDATA.bunnyDecorations.push({ ...deco, addedAt: Date.now() });
    await saveBunnyData();
    renderDecorationsAndPlaced();
    console.log('[bunny_inv] 데코 배치:', deco.emoji);
  };

  /* ===== 🎒 가방 버튼 (토끼 상점 옆) ===== */
  function addInventoryBtn(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return false;
    if(document.getElementById('bunnyInvBtn')) return true;
    const btn = document.createElement('button');
    btn.id = 'bunnyInvBtn';
    btn.onclick = openInventory;
    btn.style.cssText = `position:absolute;bottom:8px;right:118px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;border:none;border-radius:18px;padding:8px 14px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(108,92,231,.4);z-index:30;display:flex;align-items:center;gap:5px`;
    playground.appendChild(btn);
    updateBagBadge();
    return true;
  }

  function updateBagBadge(){
    const btn = document.getElementById('bunnyInvBtn');
    if(!btn) return;
    const cnt = (window.UDATA?.bunnyInventory||[]).length;
    btn.innerHTML = `🎒 가방${cnt > 0 ? ` <span style="background:#fff;color:#6c5ce7;border-radius:10px;padding:1px 6px;font-size:10px;font-weight:900">${cnt}</span>` : ''}`;
  }

  /* ===== 🌾 농장 풍경 강화 (풀/꽃/햇님/농지 추가) ===== */
  function addFarmDecor(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;
    if(document.getElementById('eqFarmDecor')) return;

    const decor = document.createElement('div');
    decor.id = 'eqFarmDecor';
    decor.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2';
    decor.innerHTML = `
      <!-- 햇님 -->
      <div style="position:absolute;top:10px;right:60px;font-size:28px;filter:drop-shadow(0 2px 4px rgba(255,200,0,.4))">☀️</div>
      <!-- 구름 -->
      <div style="position:absolute;top:15px;left:50px;font-size:22px;opacity:.85">☁️</div>
      <div style="position:absolute;top:30px;left:35%;font-size:18px;opacity:.7">☁️</div>
      <!-- 나비 -->
      <div style="position:absolute;top:60px;left:60%;font-size:18px;animation:eqFloat 3s ease-in-out infinite">🦋</div>
      <!-- 풀 (하단) -->
      <div style="position:absolute;bottom:6px;left:5%;font-size:14px">🌿</div>
      <div style="position:absolute;bottom:8px;left:14%;font-size:13px">🌾</div>
      <div style="position:absolute;bottom:5px;left:22%;font-size:14px">🌿</div>
      <div style="position:absolute;bottom:7px;left:32%;font-size:14px">🌷</div>
      <div style="position:absolute;bottom:10px;left:42%;font-size:13px">🌸</div>
      <div style="position:absolute;bottom:8px;left:55%;font-size:14px">🌻</div>
      <div style="position:absolute;bottom:6px;left:66%;font-size:13px">🌿</div>
      <div style="position:absolute;bottom:9px;left:76%;font-size:14px">🌷</div>
      <div style="position:absolute;bottom:6px;left:86%;font-size:13px">🌾</div>
      <div style="position:absolute;bottom:8px;left:93%;font-size:14px">🌿</div>
      <!-- 농지 줄무늬 (땅 표현) -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(180deg,transparent,rgba(139,111,71,.18));pointer-events:none"></div>
    `;
    playground.appendChild(decor);
  }

  /* ===== 가방 모달 ===== */
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
          <div style="font-size:10px;color:rgba(255,255,255,.85);margin-top:4px">🛒 토끼 상점에서 산 물건들</div>
        </div>
        <div style="padding:14px 16px;overflow-y:auto;flex:1">

          <div style="font-size:13px;font-weight:900;color:#5D4037;margin-bottom:10px">📦 보관 중 (${inv.length}개)</div>
          ${inv.length ? inv.map(item => `
            <div style="background:#fff;border:1.5px solid #E0E0FF;border-radius:12px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
              <div style="font-size:30px;flex-shrink:0">${item.emoji}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:#5D4037">${item.name}</div>
                <div style="font-size:10px;color:#888">${item.happiness ? `😊 행복 +${item.happiness}` : ''}</div>
              </div>
              <button onclick="window.usePlaceItem('${item.uid}')" style="background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;border:none;border-radius:8px;padding:7px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0">🏞️ 농장 꺼내기</button>
            </div>`).join('') : `
            <div style="text-align:center;padding:30px 16px;color:#999;background:#fafafa;border-radius:12px">
              <div style="font-size:36px;margin-bottom:8px">📭</div>
              <div style="font-size:12px">아직 산 물건이 없어요!</div>
              <div style="font-size:10px;margin-top:4px">🛒 토끼 상점에서 사보세요</div>
            </div>`}

          ${placed.length ? `
            <div style="font-size:13px;font-weight:900;color:#5D4037;margin:16px 0 8px">🏞️ 농장에 꺼낸 거 (${placed.length}개)</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px">농장에서 <b>드래그</b>해서 이동 · <b>탭</b>해서 가방으로 회수</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px">
              ${placed.map(p => `
                <div style="background:#f0fbf4;border:1px solid #c8e6c9;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:24px">${p.emoji}</div>
                  <div style="font-size:9px;color:#666;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name||''}</div>
                </div>`).join('')}
            </div>
          ` : ''}

          ${decorations.length ? `
            <div style="font-size:13px;font-weight:900;color:#5D4037;margin:16px 0 8px">🌳 정원 데코 (${decorations.length}개)</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:6px">
              ${decorations.map(d => `
                <div style="background:#fffbe6;border:1px solid #ffe082;border-radius:10px;padding:8px;text-align:center">
                  <div style="font-size:22px">${d.emoji}</div>
                </div>`).join('')}
            </div>
          ` : ''}

          <div style="margin-top:16px;padding:11px 12px;background:#f0fbf4;border-radius:10px;font-size:11px;color:#1B5E20;line-height:1.7">
            💡 <b>꺼내기</b> → 농장에 등장<br/>
            💡 농장에서 작물 <b>드래그</b> → 원하는 위치로 이동<br/>
            💡 농장에서 작물 <b>탭(클릭만)</b> → 가방으로 회수<br/>
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
      x: 30 + Math.random()*40,
      y: 40 + Math.random()*30,
    });
    inv.splice(idx, 1);
    await saveBunnyData();
    renderDecorationsAndPlaced();
    updateBagBadge();
    window.toast && window.toast(`✨ ${item.emoji} ${item.name} 농장에 꺼냄! 드래그해서 이동하세요`);
    window.openInventory();
  };

  /* ===== 회수 ===== */
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

  /* ===== 드래그 시스템 ===== */
  let _drag = null;

  function startDrag(e, placedId){
    e.preventDefault();
    e.stopPropagation();
    const el = document.querySelector(`[data-placed-id="${placedId}"]`);
    const playground = document.getElementById('bunnyPlayground');
    if(!el || !playground) return;
    const pRect = playground.getBoundingClientRect();
    const sx = e.touches ? e.touches[0].clientX : e.clientX;
    const sy = e.touches ? e.touches[0].clientY : e.clientY;

    _drag = { el, placedId, pRect, startX: sx, startY: sy, moved: false, finalX: null, finalY: null };
    el.style.cursor = 'grabbing';
    el.style.zIndex = '20';
    el.style.transform = 'translate(-50%,-50%) scale(1.2)';

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
  }

  function onDrag(e){
    if(!_drag) return;
    e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    if(Math.abs(x - _drag.startX) > 5 || Math.abs(y - _drag.startY) > 5) _drag.moved = true;

    const xPct = Math.max(3, Math.min(97, ((x - _drag.pRect.left) / _drag.pRect.width) * 100));
    const yPct = Math.max(10, Math.min(90, ((y - _drag.pRect.top) / _drag.pRect.height) * 100));
    _drag.el.style.left = xPct + '%';
    _drag.el.style.top = yPct + '%';
    _drag.finalX = xPct;
    _drag.finalY = yPct;
  }

  async function endDrag(e){
    if(!_drag) return;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', endDrag);

    _drag.el.style.cursor = 'grab';
    _drag.el.style.zIndex = '6';
    _drag.el.style.transform = 'translate(-50%,-50%)';

    if(_drag.moved && _drag.finalX !== null){
      // 위치 저장
      const placed = window.UDATA.bunnyPlaced || [];
      const item = placed.find(p => p.id === _drag.placedId);
      if(item){
        item.x = _drag.finalX;
        item.y = _drag.finalY;
        await saveBunnyData();
      }
    } else if(!_drag.moved){
      // 클릭만 → 회수
      window.recallPlacedItem(_drag.placedId);
    }
    _drag = null;
  }

  /* ===== 데코 + 배치 아이템 렌더 ===== */
  function renderDecorationsAndPlaced(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    playground.querySelectorAll('.eq-bunny-deco, .eq-bunny-placed').forEach(el => el.remove());

    const decorations = window.UDATA?.bunnyDecorations || [];
    decorations.forEach(d => {
      const el = document.createElement('div');
      el.className = 'eq-bunny-deco';
      el.style.cssText = `position:absolute;left:${d.x}px;top:${d.y}px;font-size:${d.size||28}px;pointer-events:none;z-index:5;filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))`;
      el.textContent = d.emoji;
      playground.appendChild(el);
    });

    const placed = window.UDATA?.bunnyPlaced || [];
    placed.forEach(p => {
      const el = document.createElement('div');
      el.className = 'eq-bunny-placed';
      el.dataset.placedId = p.id;
      el.style.cssText = `position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);font-size:32px;cursor:grab;z-index:6;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));user-select:none;touch-action:none;transition:transform .15s`;
      el.textContent = p.emoji;
      el.title = `${p.name} (드래그=이동 · 탭=회수)`;
      el.onmousedown = (e) => startDrag(e, p.id);
      el.ontouchstart = (e) => startDrag(e, p.id);
      playground.appendChild(el);
    });
  }

  /* ===== boot ===== */
  function boot(){
    if(!window.FB){ setTimeout(boot, 500); return; }
    addInventoryBtn();
    addFarmDecor();
    renderDecorationsAndPlaced();

    const observer = new MutationObserver(() => {
      if(document.getElementById('bunnyPlayground')){
        if(!document.getElementById('bunnyInvBtn')) addInventoryBtn();
        if(!document.getElementById('eqFarmDecor')) addFarmDecor();
        if(!document.querySelector('.eq-bunny-placed') && (window.UDATA?.bunnyPlaced||[]).length > 0) renderDecorationsAndPlaced();
        if(!document.querySelector('.eq-bunny-deco') && (window.UDATA?.bunnyDecorations||[]).length > 0) renderDecorationsAndPlaced();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // CSS animation
    if(!document.getElementById('eqInvCss')){
      const s = document.createElement('style');
      s.id = 'eqInvCss';
      s.textContent = `@keyframes eqFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`;
      document.head.appendChild(s);
    }

    console.log('%c[bunny_inventory v2] ✅ 가방 + 드래그 + 농장 풍경','color:#fff;background:#6c5ce7;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3000));
  else setTimeout(boot, 3000);
})();
