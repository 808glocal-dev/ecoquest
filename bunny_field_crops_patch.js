// bunny_field_crops_patch.js v2
// 들판에서 직접 농사 - 페이지 이동 없이 자라고 수확
(function(){
  'use strict';

  // 12가지 작물 (자라는 시간 짧게 - 게임처럼)
  const CROPS = [
    {id:'carrot',     name:'당근',     emoji:'🥕', growMin:5,  reward:50},
    {id:'lettuce',    name:'상추',     emoji:'🥬', growMin:4,  reward:40},
    {id:'strawberry', name:'딸기',     emoji:'🍓', growMin:6,  reward:60},
    {id:'tomato',     name:'토마토',   emoji:'🍅', growMin:7,  reward:65},
    {id:'corn',       name:'옥수수',   emoji:'🌽', growMin:8,  reward:75},
    {id:'pepper',     name:'고추',     emoji:'🌶️', growMin:6,  reward:55},
    {id:'broccoli',   name:'브로콜리', emoji:'🥦', growMin:8,  reward:70},
    {id:'onion',      name:'양파',     emoji:'🧅', growMin:7,  reward:55},
    {id:'garlic',     name:'마늘',     emoji:'🧄', growMin:9,  reward:65},
    {id:'eggplant',   name:'가지',     emoji:'🍆', growMin:10, reward:80},
    {id:'pumpkin',    name:'호박',     emoji:'🎃', growMin:12, reward:100},
    {id:'apple',      name:'사과',     emoji:'🍎', growMin:15, reward:120},
  ];

  // 단계: 0=씨앗 💧, 1=새싹 🌱, 2=잎사귀 🌿, 3=수확가능 (작물별 이모지)
  const STAGE_EMOJI = ['💧', '🌱', '🌿'];

  function getStage(plot){
    if(!plot || !plot.plantedAt) return -1;
    const crop = CROPS.find(c => c.id === plot.crop);
    if(!crop) return -1;
    const elapsedMin = (Date.now() - plot.plantedAt) / 60000;
    const pct = elapsedMin / crop.growMin;
    if(pct >= 1) return 3;
    if(pct >= 0.66) return 2;
    if(pct >= 0.33) return 1;
    return 0;
  }

  function getDisplay(plot){
    if(!plot || !plot.plantedAt) return '🟫';
    const stage = getStage(plot);
    if(stage === 3){
      const crop = CROPS.find(c => c.id === plot.crop);
      return crop ? crop.emoji : '🌾';
    }
    return STAGE_EMOJI[stage] || '🌱';
  }

  async function saveField(){
    if(!window.ME?.uid || !window.UDATA) return;
    try {
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), {
        bunnyField: window.UDATA.bunnyField || {plots: []}
      });
    } catch(e){ console.error('[field] save 실패', e); }
  }

  function ensureField(){
    if(!window.UDATA.bunnyField) window.UDATA.bunnyField = {plots: []};
    if(!window.UDATA.bunnyField.plots) window.UDATA.bunnyField.plots = [];
    while(window.UDATA.bunnyField.plots.length < 6){
      window.UDATA.bunnyField.plots.push(null);
    }
  }

  /* ===== 들판에 농작물 그리기 ===== */
  function renderCrops(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground || !window.UDATA) return;

    ensureField();

    playground.querySelectorAll('.eq-field-crop, .eq-field-soil, .eq-field-label, .eq-field-spark, .eq-field-progress').forEach(el => el.remove());

    // 토양 띠 (농경지처럼)
    const soil = document.createElement('div');
    soil.className = 'eq-field-soil';
    soil.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:42px;background:linear-gradient(180deg,transparent,rgba(139,111,71,.3) 40%,rgba(139,111,71,.45));pointer-events:none;z-index:1';
    playground.appendChild(soil);

    // 안내 라벨
    const plots = window.UDATA.bunnyField.plots;
    const readyCount = plots.filter(p => getStage(p) === 3).length;
    const label = document.createElement('div');
    label.className = 'eq-field-label';
    label.style.cssText = 'position:absolute;bottom:42px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.92);border-radius:12px;padding:3px 12px;font-size:9px;color:#5D4037;font-weight:700;z-index:8;pointer-events:none;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.12)';
    label.textContent = readyCount > 0 ? `🌾 텃밭 — ✨ ${readyCount}개 수확 가능!` : '🌾 텃밭 — 빈 밭 탭해서 씨앗 심기';
    playground.appendChild(label);

    const positions = ['10%', '24%', '38%', '52%', '66%', '80%'];

    for(let i = 0; i < 6; i++){
      const plot = plots[i];
      const pos = positions[i];
      const stage = getStage(plot);
      const display = getDisplay(plot);
      const isReady = stage === 3;
      const isEmpty = !plot;

      const el = document.createElement('div');
      el.className = 'eq-field-crop';
      el.style.cssText = `position:absolute;left:${pos};bottom:8px;transform:translateX(-50%);font-size:${isReady?32:isEmpty?22:26}px;cursor:pointer;z-index:7;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));transition:transform .15s;opacity:${isEmpty?.6:1}${isReady ? ';animation:eqFieldBounce 1.6s ease-in-out infinite' : ''}`;
      el.textContent = display;
      el.dataset.plotIdx = i;
      if(plot && !isReady){
        const crop = CROPS.find(c => c.id === plot.crop);
        const elapsedMin = (Date.now() - plot.plantedAt) / 60000;
        const pct = Math.min(100, Math.round((elapsedMin / crop.growMin) * 100));
        el.title = `${crop?.name||'작물'} 자라는 중 (${pct}%)`;
      } else {
        el.title = isEmpty ? '빈 밭 - 탭해서 씨앗 심기' : `${CROPS.find(c=>c.id===plot.crop)?.name||'작물'} 수확하기!`;
      }
      el.onclick = (e) => {
        e.stopPropagation();
        handleCropClick(i);
      };
      el.onmouseover = () => { el.style.transform = 'translateX(-50%) scale(1.25)'; };
      el.onmouseout = () => { el.style.transform = 'translateX(-50%)'; };
      playground.appendChild(el);

      // 자라는 중 → 진행도 막대
      if(plot && !isReady){
        const crop = CROPS.find(c => c.id === plot.crop);
        const elapsedMin = (Date.now() - plot.plantedAt) / 60000;
        const pct = Math.min(100, (elapsedMin / crop.growMin) * 100);
        const bar = document.createElement('div');
        bar.className = 'eq-field-progress';
        bar.style.cssText = `position:absolute;left:calc(${pos} - 18px);bottom:2px;width:36px;height:3px;background:rgba(0,0,0,.2);border-radius:3px;z-index:6;pointer-events:none;overflow:hidden`;
        bar.innerHTML = `<div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#2ECC71,#F39C12);border-radius:3px"></div>`;
        playground.appendChild(bar);
      }

      // 수확 가능 → ✨
      if(isReady){
        const spark = document.createElement('div');
        spark.className = 'eq-field-spark';
        spark.style.cssText = `position:absolute;left:calc(${pos} + 15px);bottom:36px;font-size:14px;z-index:7;pointer-events:none;animation:eqFieldSpark 1.2s ease-in-out infinite`;
        spark.textContent = '✨';
        playground.appendChild(spark);
      }
    }

    if(!document.getElementById('eqFieldCropsCss')){
      const s = document.createElement('style');
      s.id = 'eqFieldCropsCss';
      s.textContent = `
        @keyframes eqFieldBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
        @keyframes eqFieldSpark {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(s);
    }
  }

  /* ===== 클릭 핸들러 ===== */
  function handleCropClick(idx){
    ensureField();
    const plot = window.UDATA.bunnyField.plots[idx];
    const stage = getStage(plot);

    if(!plot){
      openSeedSelector(idx);
    } else if(stage === 3){
      harvest(idx);
    } else {
      const crop = CROPS.find(c => c.id === plot.crop);
      const elapsedMin = (Date.now() - plot.plantedAt) / 60000;
      const remainMin = Math.max(0, crop.growMin - elapsedMin);
      const pct = Math.round((elapsedMin / crop.growMin) * 100);
      window.toast?.(`🌱 ${crop?.emoji||''} ${crop?.name||'작물'} - ${pct}% (${remainMin.toFixed(1)}분 남음)`);
    }
  }

  /* ===== 씨앗 선택 모달 ===== */
  function openSeedSelector(plotIdx){
    const old = document.getElementById('ovSeedSel'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovSeedSel';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9500;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;max-width:380px;width:100%;padding:22px 20px;max-height:85vh;overflow-y:auto">
        <div style="font-size:42px;margin-bottom:6px;text-align:center">🌱</div>
        <div style="font-size:18px;font-weight:900;color:#5D4037;text-align:center">씨앗 심기</div>
        <div style="font-size:11px;color:#888;margin:6px 0 18px;text-align:center">어떤 작물을 심을까요?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
          ${CROPS.map(c => `
            <button onclick="window.plantSeed(${plotIdx}, '${c.id}')" style="background:#fff;border:1.5px solid #ddd;border-radius:14px;padding:12px 4px;cursor:pointer;font-family:inherit;transition:all .15s">
              <div style="font-size:32px;line-height:1">${c.emoji}</div>
              <div style="font-size:11px;color:#5D4037;margin-top:6px;font-weight:700">${c.name}</div>
              <div style="font-size:9px;color:#888;margin-top:2px">⏰${c.growMin}분</div>
              <div style="font-size:9px;color:#2ECC71;font-weight:700">+${c.reward}P</div>
            </button>
          `).join('')}
        </div>
        <button onclick="document.getElementById('ovSeedSel').remove()" style="background:#f0f0f0;border:none;border-radius:12px;padding:11px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;color:#666">취소</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /* ===== 씨앗 심기 ===== */
  window.plantSeed = async function(plotIdx, cropId){
    ensureField();
    window.UDATA.bunnyField.plots[plotIdx] = {
      crop: cropId,
      plantedAt: Date.now(),
    };
    await saveField();
    renderCrops();
    document.getElementById('ovSeedSel')?.remove();
    const crop = CROPS.find(c => c.id === cropId);
    window.toast?.(`🌱 ${crop?.emoji||''} ${crop?.name||''} 심었어요! ${crop?.growMin||0}분 뒤 수확`);
  };

  /* ===== 수확 ===== */
  async function harvest(plotIdx){
    const plot = window.UDATA.bunnyField.plots[plotIdx];
    if(!plot) return;
    const crop = CROPS.find(c => c.id === plot.crop);
    if(!crop) return;

    // 포인트 지급
    const curP = window.UDATA.point || 0;
    const newP = curP + crop.reward;
    try {
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { point: newP });
      window.UDATA.point = newP;
      window.updateUI && window.updateUI();
    } catch(e){ console.error('[field] harvest 실패', e); }

    // 밭 비우기
    window.UDATA.bunnyField.plots[plotIdx] = null;
    await saveField();
    renderCrops();

    window.toast?.(`🎉 ${crop.emoji} ${crop.name} 수확! +${crop.reward}P`);
  }

  /* ===== boot ===== */
  async function boot(){
    if(!window.FB || !window.ME || !window.UDATA){ setTimeout(boot, 800); return; }

    // Firebase에서 텃밭 로드
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid));
      if(snap.exists() && snap.data().bunnyField){
        window.UDATA.bunnyField = snap.data().bunnyField;
      }
    } catch(e){}

    ensureField();
    renderCrops();

    // playground 다시 그려질 때마다 재렌더
    const observer = new MutationObserver(() => {
      if(document.getElementById('bunnyPlayground') && !document.querySelector('.eq-field-crop')){
        renderCrops();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 20초마다 재렌더 (자라기 반영)
    setInterval(renderCrops, 20000);

    console.log('%c[bunny_field_crops v2] 🌱🥕🍅 들판 농사 활성화 (12종 작물)','color:#fff;background:#27AE60;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3500));
  else setTimeout(boot, 3500);
})();
