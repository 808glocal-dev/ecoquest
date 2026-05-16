// farm_system_patch.js v1
// 농장에 밭(6칸) + 씨앗 심기 + 시간 기반 성장 + 수확 + 씨앗 가게 + 보관함
(function(){
  'use strict';

  /* ===== 작물 정의 ===== */
  const CROPS = {
    seed_carrot:     { name:'당근',   emoji:'🥕', buy:50,  sell:80,   growMin:30,  co2:0.1 },
    seed_strawberry: { name:'딸기',   emoji:'🍓', buy:120, sell:200,  growMin:60,  co2:0.2 },
    seed_tomato:     { name:'토마토', emoji:'🍅', buy:200, sell:350,  growMin:120, co2:0.3 },
    seed_corn:       { name:'옥수수', emoji:'🌽', buy:400, sell:700,  growMin:240, co2:0.5 },
    seed_pumpkin:    { name:'호박',   emoji:'🎃', buy:800, sell:1500, growMin:480, co2:1.0 },
  };

  /* ===== 농장 데이터 초기화 ===== */
  async function ensureFarm(){
    if(!window.UDATA) return null;
    if(window.UDATA.farm && Array.isArray(window.UDATA.farm.plots)) return window.UDATA.farm;
    const farm = {
      plots: [null, null, null, null, null, null], // 6칸 밭
      inventory: { seed_carrot: 2 }, // 시작 선물: 당근 씨앗 2개
    };
    window.UDATA.farm = farm;
    if(window.ME?.uid){
      try { await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid), { farm }); } catch(e){}
    }
    return farm;
  }

  /* ===== 작물 상태 ===== */
  function getStage(plot){
    if(!plot || !plot.seedId) return null;
    const crop = CROPS[plot.seedId];
    if(!crop) return null;
    const elapsedMin = (Date.now() - (plot.plantedAt||0)) / 60000;
    if(elapsedMin < crop.growMin * 0.3) return 'seed';
    if(elapsedMin < crop.growMin) return 'sprout';
    return 'mature';
  }
  function getStageEmoji(plot){
    const stage = getStage(plot);
    if(!stage) return '';
    const crop = CROPS[plot.seedId];
    if(stage === 'seed') return '🌱';
    if(stage === 'sprout') return '🌿';
    return crop.emoji;
  }
  function getProgress(plot){
    if(!plot || !plot.seedId) return 0;
    const crop = CROPS[plot.seedId];
    const elapsedMin = (Date.now() - (plot.plantedAt||0)) / 60000;
    return Math.min(100, Math.floor(elapsedMin / crop.growMin * 100));
  }
  function getRemainingTime(plot){
    if(!plot || !plot.seedId) return '';
    const crop = CROPS[plot.seedId];
    const elapsedMin = (Date.now() - (plot.plantedAt||0)) / 60000;
    const remaining = crop.growMin - elapsedMin;
    if(remaining <= 0) return '수확!';
    if(remaining < 1) return Math.ceil(remaining*60) + '초';
    if(remaining < 60) return Math.ceil(remaining) + '분';
    return Math.floor(remaining/60) + 'h ' + Math.ceil(remaining%60) + 'm';
  }

  /* ===== 저장 ===== */
  async function saveFarm(extra){
    if(!window.ME?.uid) return;
    const update = { farm: window.UDATA.farm };
    if(extra) Object.assign(update, extra);
    try { await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid), update); } catch(e){}
  }

  /* ===== 농장 페이지 찾기 ===== */
  function findFarmPage(){
    const activeBtn = document.querySelector('.tb.on');
    const activeName = activeBtn?.dataset?.page;
    if(activeName) {
      const el = document.getElementById('page-' + activeName);
      if(el && /farm|garden|bunny|field/.test(activeName)) return el;
    }
    return document.getElementById('page-farm')
      || document.getElementById('page-garden')
      || document.getElementById('page-bunny')
      || document.getElementById('page-field')
      || null;
  }

  /* ===== 농장 UI ===== */
  async function renderFarmField(){
    await ensureFarm();
    const page = findFarmPage();
    if(!page) return;

    let wrap = document.getElementById('eqFarmField');
    if(wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'eqFarmField';
    wrap.style.cssText = 'padding: 0 12px 20px';

    const farm = window.UDATA.farm;
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 10px">
        <div style="font-size:15px;font-weight:900;color:var(--txt)">🌾 내 밭</div>
        <div style="display:flex;gap:6px">
          <button onclick="window.eqOpenSeedShop()" style="background:linear-gradient(135deg,#F39C12,#E67E22);color:#fff;border:none;border-radius:10px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🌱 씨앗가게</button>
          <button onclick="window.eqOpenInventory()" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;border:none;border-radius:10px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">📦 보관함</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:linear-gradient(180deg,#8B6F47,#6B4F2F);padding:12px;border-radius:14px;border:2px solid #4a3018">
        ${farm.plots.map((plot, i) => renderPlot(plot, i)).join('')}
      </div>
      <div style="font-size:11px;color:var(--sub);margin-top:8px;text-align:center;line-height:1.6">
        💡 빈 밭 탭 → 씨앗 심기<br/>
        🌟 다 자란 작물 탭 → 수확 (포인트 + CO₂ 보너스)
      </div>
    `;
    page.appendChild(wrap);
  }

  function renderPlot(plot, idx){
    if(!plot || !plot.seedId){
      return `
        <div onclick="window.eqOpenPlantModal(${idx})" style="aspect-ratio:1;background:#5a3a20;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px dashed rgba(255,255,255,.2)">
          <span style="font-size:28px;opacity:.4;color:#fff">+</span>
        </div>`;
    }
    const stage = getStage(plot);
    const emoji = getStageEmoji(plot);
    const progress = getProgress(plot);
    const remaining = getRemainingTime(plot);
    const isMature = stage === 'mature';
    return `
      <div onclick="${isMature ? `window.eqHarvest(${idx})` : `window.eqShowPlotInfo(${idx})`}" style="aspect-ratio:1;background:#7a5a3a;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;border:2px solid ${isMature?'#2ECC71':'rgba(255,255,255,.1)'};${isMature?'animation:eqPulse 1.5s ease-in-out infinite':''}">
        <div style="font-size:38px;${stage==='seed'?'transform:scale(.6)':''}">${emoji}</div>
        ${!isMature ? `
          <div style="position:absolute;bottom:4px;left:4px;right:4px;background:rgba(0,0,0,.45);height:4px;border-radius:2px;overflow:hidden">
            <div style="width:${progress}%;height:100%;background:#2ECC71;transition:width .5s"></div>
          </div>
          <div style="position:absolute;top:2px;right:4px;font-size:9px;color:#fff;font-weight:700;background:rgba(0,0,0,.5);border-radius:6px;padding:1px 4px">${remaining}</div>
        ` : `
          <div style="position:absolute;top:2px;right:2px;background:#2ECC71;color:#fff;font-size:9px;font-weight:900;border-radius:6px;padding:2px 6px">수확!</div>
        `}
      </div>`;
  }

  /* ===== 씨앗 심기 모달 ===== */
  window.eqOpenPlantModal = function(plotIdx){
    const farm = window.UDATA.farm;
    const seeds = Object.keys(CROPS).filter(id => (farm.inventory[id]||0) > 0);
    if(!seeds.length){
      window.toast && window.toast('씨앗이 없어요! 🌱 씨앗가게에서 사 오세요');
      return;
    }
    const modal = createModal();
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 30px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:16px">
          <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 12px"></div>
          <div style="font-size:16px;font-weight:900">🌱 어떤 씨앗을 심을까요?</div>
        </div>
        ${seeds.map(seedId => {
          const crop = CROPS[seedId];
          return `
            <button onclick="window.eqPlantSeed(${plotIdx},'${seedId}')" style="display:flex;align-items:center;gap:12px;width:100%;background:#fff;border:1.5px solid var(--bdr);border-radius:12px;padding:12px;margin-bottom:8px;cursor:pointer;font-family:inherit">
              <div style="font-size:32px">${crop.emoji}</div>
              <div style="flex:1;text-align:left">
                <div style="font-size:14px;font-weight:700;color:var(--txt)">${crop.name}</div>
                <div style="font-size:11px;color:var(--sub)">${crop.growMin}분 후 수확 가능 · 보유 ${farm.inventory[seedId]}개</div>
              </div>
              <div style="font-size:14px;color:var(--g2);font-weight:900">+${crop.sell}P</div>
            </button>`;
        }).join('')}
        <button onclick="window.eqCloseModal()" style="width:100%;background:#f0f0f0;color:var(--sub);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px">취소</button>
      </div>`;
  };
  window.eqPlantSeed = async function(plotIdx, seedId){
    const farm = window.UDATA.farm;
    if((farm.inventory[seedId]||0) <= 0) return;
    farm.inventory[seedId]--;
    farm.plots[plotIdx] = { seedId, plantedAt: Date.now() };
    await saveFarm();
    window.eqCloseModal();
    renderFarmField();
    const crop = CROPS[seedId];
    window.toast && window.toast(`🌱 ${crop.emoji} ${crop.name} 심었어요!`);
  };

  window.eqHarvest = async function(plotIdx){
    const plot = window.UDATA.farm.plots[plotIdx];
    if(getStage(plot) !== 'mature') return;
    const crop = CROPS[plot.seedId];
    const harvestId = 'harvest_' + plot.seedId.replace('seed_','');
    const inv = window.UDATA.farm.inventory;
    inv[harvestId] = (inv[harvestId]||0) + 1;
    window.UDATA.farm.plots[plotIdx] = null;
    window.UDATA.co2 = parseFloat((((window.UDATA.co2||0) + crop.co2).toFixed(2)));
    await saveFarm({ co2: window.UDATA.co2 });
    renderFarmField();
    window.updateUI && window.updateUI();
    window.toast && window.toast(`🎉 ${crop.emoji} ${crop.name} 수확! CO₂ +${crop.co2}kg`);
  };
  window.eqShowPlotInfo = function(plotIdx){
    const plot = window.UDATA.farm.plots[plotIdx];
    if(!plot) return;
    const crop = CROPS[plot.seedId];
    window.toast && window.toast(`${crop.emoji} ${crop.name} 자라는 중... ${getRemainingTime(plot)} 남음`);
  };

  /* ===== 씨앗 가게 ===== */
  window.eqOpenSeedShop = function(){
    const modal = createModal();
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 30px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:16px">
          <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 12px"></div>
          <div style="font-size:18px;font-weight:900">🌱 씨앗 가게</div>
          <div style="font-size:12px;color:var(--sub);margin-top:4px">내 포인트: <b style="color:var(--g2)">${(window.UDATA?.point||0).toLocaleString()}P</b></div>
        </div>
        ${Object.entries(CROPS).map(([seedId, crop]) => {
          const can = (window.UDATA?.point||0) >= crop.buy;
          return `
            <div style="display:flex;align-items:center;gap:12px;background:#fff;border:1.5px solid var(--bdr);border-radius:12px;padding:12px;margin-bottom:8px">
              <div style="font-size:36px">${crop.emoji}</div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:700;color:var(--txt)">${crop.name} 씨앗</div>
                <div style="font-size:11px;color:var(--sub)">${crop.growMin}분 키워 +${crop.sell}P (이익 ${crop.sell-crop.buy}P)</div>
                <div style="font-size:10px;color:var(--g2);margin-top:2px">🌍 CO₂ +${crop.co2}kg</div>
              </div>
              <button onclick="window.eqBuySeed('${seedId}')" ${can?'':'disabled'} style="background:${can?'linear-gradient(135deg,#F39C12,#E67E22)':'#ddd'};color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:900;cursor:${can?'pointer':'not-allowed'};font-family:inherit">${crop.buy}P</button>
            </div>`;
        }).join('')}
        <button onclick="window.eqCloseModal()" style="width:100%;background:#f0f0f0;color:var(--sub);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px">닫기</button>
      </div>`;
  };
  window.eqBuySeed = async function(seedId){
    const crop = CROPS[seedId];
    if((window.UDATA?.point||0) < crop.buy){ window.toast && window.toast('포인트가 부족해요!'); return; }
    window.UDATA.point -= crop.buy;
    window.UDATA.farm.inventory[seedId] = (window.UDATA.farm.inventory[seedId]||0) + 1;
    await saveFarm({ point: window.UDATA.point });
    window.updateUI && window.updateUI();
    window.eqOpenSeedShop();
    window.toast && window.toast(`✅ ${crop.emoji} ${crop.name} 씨앗 구매!`);
  };

  /* ===== 보관함 ===== */
  window.eqOpenInventory = function(){
    const modal = createModal();
    const inv = window.UDATA.farm.inventory || {};
    const seeds = Object.entries(inv).filter(([k,v]) => k.startsWith('seed_') && v > 0);
    const harvests = Object.entries(inv).filter(([k,v]) => k.startsWith('harvest_') && v > 0);
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 30px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:16px">
          <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 12px"></div>
          <div style="font-size:18px;font-weight:900">📦 보관함</div>
        </div>
        <div style="font-size:13px;font-weight:900;color:var(--txt);margin-bottom:8px">🌱 씨앗 (${seeds.length}종)</div>
        ${seeds.length ? seeds.map(([id, count]) => {
          const crop = CROPS[id];
          return `
            <div style="display:flex;align-items:center;gap:12px;background:#f8f8f8;border-radius:12px;padding:10px;margin-bottom:6px">
              <div style="font-size:28px">${crop.emoji}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:700">${crop.name} 씨앗</div>
                <div style="font-size:11px;color:var(--sub)">${count}개 보유</div>
              </div>
              <div style="font-size:11px;color:var(--sub)">밭에 심기 →</div>
            </div>`;
        }).join('') : '<div style="text-align:center;padding:14px;color:var(--sub);font-size:12px">씨앗이 없어요. 가게에서 사 보세요!</div>'}
        <div style="font-size:13px;font-weight:900;color:var(--txt);margin:16px 0 8px">🥕 수확물 (${harvests.length}종)</div>
        ${harvests.length ? harvests.map(([id, count]) => {
          const cropKey = id.replace('harvest_','');
          const seedId = 'seed_' + cropKey;
          const crop = CROPS[seedId];
          return `
            <div style="display:flex;align-items:center;gap:12px;background:#f8fdf9;border:1px solid var(--bdr);border-radius:12px;padding:10px;margin-bottom:6px">
              <div style="font-size:28px">${crop.emoji}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:700">${crop.name}</div>
                <div style="font-size:11px;color:var(--sub)">${count}개 보유</div>
              </div>
              <button onclick="window.eqSellHarvest('${cropKey}')" style="background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">+${crop.sell}P 판매</button>
            </div>`;
        }).join('') : '<div style="text-align:center;padding:14px;color:var(--sub);font-size:12px">아직 수확한 게 없어요!</div>'}
        <button onclick="window.eqCloseModal()" style="width:100%;background:#f0f0f0;color:var(--sub);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px">닫기</button>
      </div>`;
  };
  window.eqSellHarvest = async function(cropKey){
    const harvestId = 'harvest_' + cropKey;
    const crop = CROPS['seed_' + cropKey];
    const inv = window.UDATA.farm.inventory;
    if(!inv[harvestId] || inv[harvestId] <= 0) return;
    inv[harvestId]--;
    window.UDATA.point = (window.UDATA.point||0) + crop.sell;
    await saveFarm({ point: window.UDATA.point });
    window.updateUI && window.updateUI();
    window.eqOpenInventory();
    window.toast && window.toast(`💰 ${crop.emoji} +${crop.sell}P!`);
  };

  /* ===== 모달 헬퍼 ===== */
  function createModal(){
    let modal = document.getElementById('eqFarmModal');
    if(modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'eqFarmModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:8000;display:flex;align-items:flex-end;justify-content:center;animation:eqFadeIn .2s';
    modal.onclick = (e) => { if(e.target === modal) window.eqCloseModal(); };
    document.body.appendChild(modal);
    return modal;
  }
  window.eqCloseModal = function(){
    const m = document.getElementById('eqFarmModal');
    if(m) m.remove();
  };

  /* ===== "토끼 상점" → "🐰 토끼 옷장" 이름 변경 ===== */
  function renameBunnyShop(){
    document.querySelectorAll('button').forEach(el => {
      if(el.dataset?.eqRenamed) return;
      const txt = (el.textContent || '').trim();
      if(/^🐰?\s*토끼\s*상점\s*$/.test(txt)){
        el.textContent = '🐰 토끼 옷장';
        el.dataset.eqRenamed = '1';
      }
    });
  }

  /* ===== 1분마다 자동 새로고침 (자라는 거 보이게) ===== */
  setInterval(() => {
    if(document.getElementById('eqFarmField')){
      renderFarmField();
    }
  }, 60000);

  /* ===== 농장 페이지 진입 시 ===== */
  function hookGoPage(){
    if(window._eqFarmHooked) return;
    if(typeof window.goPage !== 'function'){ setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === 'farm' || name === 'garden' || name === 'bunny' || name === 'field'){
        setTimeout(renderFarmField, 400);
        setTimeout(renameBunnyShop, 500);
        setTimeout(renameBunnyShop, 1500);
      }
      return r;
    };
    window._eqFarmHooked = true;
    console.log('[farm_system_patch] ✅ 농장 시스템 활성화');
  }

  // CSS
  if(!document.getElementById('eqFarmCss')){
    const style = document.createElement('style');
    style.id = 'eqFarmCss';
    style.textContent = `
      @keyframes eqPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      @keyframes eqFadeIn { from{opacity:0} to{opacity:1} }
    `;
    document.head.appendChild(style);
  }

  hookGoPage();
})();
