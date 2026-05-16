// farm_system_patch.js v2
// v1 + 농부 아바타 선택 + 농장 배경 진열 + 회수 (사용자별 Firebase 저장)
(function(){
  'use strict';

  /* ===== 작물 ===== */
  const CROPS = {
    seed_carrot:     { name:'당근',   emoji:'🥕', buy:50,  sell:80,   growMin:30,  co2:0.1 },
    seed_strawberry: { name:'딸기',   emoji:'🍓', buy:120, sell:200,  growMin:60,  co2:0.2 },
    seed_tomato:     { name:'토마토', emoji:'🍅', buy:200, sell:350,  growMin:120, co2:0.3 },
    seed_corn:       { name:'옥수수', emoji:'🌽', buy:400, sell:700,  growMin:240, co2:0.5 },
    seed_pumpkin:    { name:'호박',   emoji:'🎃', buy:800, sell:1500, growMin:480, co2:1.0 },
  };

  /* ===== 아바타 ===== */
  const AVATARS = [
    { id: 'farmer_m',   emoji: '👨‍🌾', name: '농부 아저씨' },
    { id: 'farmer_f',   emoji: '👩‍🌾', name: '농부 아주머니' },
    { id: 'farmer_boy', emoji: '🧑‍🌾', name: '농부 청년' },
    { id: 'cat',        emoji: '🐱', name: '고양이' },
    { id: 'dog',        emoji: '🐶', name: '강아지' },
    { id: 'bear',       emoji: '🐻', name: '곰돌이' },
    { id: 'fox',        emoji: '🦊', name: '여우' },
    { id: 'panda',      emoji: '🐼', name: '판다' },
    { id: 'pig',        emoji: '🐷', name: '돼지' },
    { id: 'chick',      emoji: '🐥', name: '병아리' },
    { id: 'frog',       emoji: '🐸', name: '개구리' },
    { id: 'koala',      emoji: '🐨', name: '코알라' },
  ];

  /* ===== 데이터 초기화 ===== */
  async function ensureFarm(){
    if(!window.UDATA) return null;
    let farm = window.UDATA.farm || {};
    if(!Array.isArray(farm.plots)) farm.plots = [null, null, null, null, null, null];
    if(!farm.inventory) farm.inventory = { seed_carrot: 2 };
    if(!farm.avatar) farm.avatar = null;
    if(!Array.isArray(farm.placed)) farm.placed = [];
    window.UDATA.farm = farm;
    if(window.ME?.uid){
      try { await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid), { farm }); } catch(e){}
    }
    return farm;
  }

  /* ===== 작물 상태 ===== */
  function getStage(plot){
    if(!plot || !plot.seedId) return null;
    const crop = CROPS[plot.seedId]; if(!crop) return null;
    const elapsed = (Date.now() - (plot.plantedAt||0)) / 60000;
    if(elapsed < crop.growMin*0.3) return 'seed';
    if(elapsed < crop.growMin) return 'sprout';
    return 'mature';
  }
  function getStageEmoji(plot){
    const s = getStage(plot); if(!s) return '';
    if(s==='seed') return '🌱';
    if(s==='sprout') return '🌿';
    return CROPS[plot.seedId].emoji;
  }
  function getProgress(plot){
    if(!plot || !plot.seedId) return 0;
    const crop = CROPS[plot.seedId];
    return Math.min(100, Math.floor((Date.now()-(plot.plantedAt||0))/60000/crop.growMin*100));
  }
  function getRemainingTime(plot){
    if(!plot || !plot.seedId) return '';
    const crop = CROPS[plot.seedId];
    const r = crop.growMin - (Date.now()-(plot.plantedAt||0))/60000;
    if(r<=0) return '수확!';
    if(r<1) return Math.ceil(r*60)+'초';
    if(r<60) return Math.ceil(r)+'분';
    return Math.floor(r/60)+'h '+Math.ceil(r%60)+'m';
  }

  async function saveFarm(extra){
    if(!window.ME?.uid) return;
    const update = { farm: window.UDATA.farm };
    if(extra) Object.assign(update, extra);
    try { await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid), update); } catch(e){}
  }

  function findFarmPage(){
    const activeBtn = document.querySelector('.tb.on');
    const activeName = activeBtn?.dataset?.page;
    if(activeName){
      const el = document.getElementById('page-' + activeName);
      if(el && /farm|garden|bunny|field/.test(activeName)) return el;
    }
    return document.getElementById('page-farm') || document.getElementById('page-garden') || document.getElementById('page-bunny') || document.getElementById('page-field') || null;
  }

  /* ===== 농장 UI 메인 ===== */
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
    const avatar = AVATARS.find(a => a.id === farm.avatar);

    /* ★ 1. 내 농장 풍경 (아바타 + 진열 아이템) */
    const placedHtml = (farm.placed||[]).map(p => {
      const crop = CROPS['seed_' + p.cropKey];
      if(!crop) return '';
      return `
        <div onclick="window.eqRecallItem('${p.id}')" title="클릭해서 회수"
          style="position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);font-size:30px;cursor:pointer;transition:transform .15s;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))"
          onmouseover="this.style.transform='translate(-50%,-50%) scale(1.15)'"
          onmouseout="this.style.transform='translate(-50%,-50%)'">
          ${crop.emoji}
        </div>`;
    }).join('');

    /* 풍경 영역 */
    wrap.innerHTML = `
      <div style="background:linear-gradient(180deg,#87CEEB 0%,#87CEEB 55%,#90EE90 55%,#90EE90 100%);border-radius:16px;padding:0;margin:14px 0 12px;position:relative;height:200px;overflow:hidden;border:2px solid rgba(0,0,0,.06)">
        <!-- 구름 -->
        <div style="position:absolute;top:12px;left:20px;font-size:24px;opacity:.85">☁️</div>
        <div style="position:absolute;top:20px;right:30px;font-size:20px;opacity:.7">☁️</div>
        <!-- 햇님 -->
        <div style="position:absolute;top:8px;right:60px;font-size:28px">☀️</div>
        <!-- 풀 -->
        <div style="position:absolute;bottom:6px;left:10%;font-size:14px">🌾</div>
        <div style="position:absolute;bottom:8px;left:80%;font-size:14px">🌾</div>
        <div style="position:absolute;bottom:4px;left:45%;font-size:14px">🌾</div>
        <!-- 진열 아이템 -->
        ${placedHtml}
        <!-- 내 아바타 (가운데 하단) -->
        ${avatar
          ? `<div onclick="window.eqOpenAvatarPicker()" title="캐릭터 바꾸기"
              style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);font-size:54px;cursor:pointer;filter:drop-shadow(0 3px 6px rgba(0,0,0,.3));transition:transform .15s"
              onmouseover="this.style.transform='translateX(-50%) scale(1.1)'"
              onmouseout="this.style.transform='translateX(-50%)'">
              ${avatar.emoji}
            </div>
            <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:8px;white-space:nowrap">${avatar.name} · 탭해서 변경</div>`
          : `<div onclick="window.eqOpenAvatarPicker()" 
              style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.7);color:#fff;padding:10px 16px;border-radius:14px;cursor:pointer;font-size:13px;font-weight:700;text-align:center;animation:eqPulse 1.5s ease-in-out infinite">
              🎭 내 캐릭터를 골라주세요
            </div>`
        }
      </div>

      <!-- 버튼들 -->
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button onclick="window.eqOpenSeedShop()" style="flex:1;background:linear-gradient(135deg,#F39C12,#E67E22);color:#fff;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🌱 씨앗가게</button>
        <button onclick="window.eqOpenInventory()" style="flex:1;background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📦 내 창고</button>
        <button onclick="window.eqOpenAvatarPicker()" style="flex:1;background:linear-gradient(135deg,#FD79A8,#E84393);color:#fff;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">🎭 캐릭터</button>
      </div>

      <!-- 밭 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 0 8px">
        <div style="font-size:15px;font-weight:900;color:var(--txt)">🌾 내 밭</div>
        <span style="font-size:11px;color:var(--sub)">${farm.plots.filter(p=>p).length}/${farm.plots.length}칸 사용중</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:linear-gradient(180deg,#8B6F47,#6B4F2F);padding:12px;border-radius:14px;border:2px solid #4a3018">
        ${farm.plots.map((plot, i) => renderPlot(plot, i)).join('')}
      </div>
      <div style="font-size:11px;color:var(--sub);margin-top:8px;text-align:center;line-height:1.6">
        💡 빈 밭 탭 → 씨앗 심기 · 다 자란 작물 탭 → 수확
      </div>
    `;
    page.appendChild(wrap);
  }

  function renderPlot(plot, idx){
    if(!plot || !plot.seedId){
      return `<div onclick="window.eqOpenPlantModal(${idx})" style="aspect-ratio:1;background:#5a3a20;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px dashed rgba(255,255,255,.2)"><span style="font-size:28px;opacity:.4;color:#fff">+</span></div>`;
    }
    const stage = getStage(plot);
    const emoji = getStageEmoji(plot);
    const progress = getProgress(plot);
    const remaining = getRemainingTime(plot);
    const isMature = stage === 'mature';
    return `
      <div onclick="${isMature?`window.eqHarvest(${idx})`:`window.eqShowPlotInfo(${idx})`}" style="aspect-ratio:1;background:#7a5a3a;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;border:2px solid ${isMature?'#2ECC71':'rgba(255,255,255,.1)'};${isMature?'animation:eqPulse 1.5s ease-in-out infinite':''}">
        <div style="font-size:38px;${stage==='seed'?'transform:scale(.6)':''}">${emoji}</div>
        ${!isMature ? `
          <div style="position:absolute;bottom:4px;left:4px;right:4px;background:rgba(0,0,0,.45);height:4px;border-radius:2px;overflow:hidden"><div style="width:${progress}%;height:100%;background:#2ECC71;transition:width .5s"></div></div>
          <div style="position:absolute;top:2px;right:4px;font-size:9px;color:#fff;font-weight:700;background:rgba(0,0,0,.5);border-radius:6px;padding:1px 4px">${remaining}</div>
        ` : `<div style="position:absolute;top:2px;right:2px;background:#2ECC71;color:#fff;font-size:9px;font-weight:900;border-radius:6px;padding:2px 6px">수확!</div>`}
      </div>`;
  }

  /* ===== 아바타 선택 ===== */
  window.eqOpenAvatarPicker = function(){
    const farm = window.UDATA.farm;
    const modal = createModal();
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 30px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:16px">
          <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 12px"></div>
          <div style="font-size:18px;font-weight:900">🎭 내 캐릭터 선택</div>
          <div style="font-size:12px;color:var(--sub);margin-top:4px">농장에 나타날 내 캐릭터를 골라요</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${AVATARS.map(a => {
            const sel = farm.avatar === a.id;
            return `
              <div onclick="window.eqSetAvatar('${a.id}')" style="aspect-ratio:1;background:${sel?'linear-gradient(135deg,#f0fbf4,#e8f5e9)':'#fff'};border:2px solid ${sel?'var(--g2)':'var(--bdr)'};border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:10px">
                <div style="font-size:38px;margin-bottom:4px">${a.emoji}</div>
                <div style="font-size:10px;font-weight:700;color:${sel?'var(--g2)':'var(--txt)'};text-align:center;line-height:1.2">${a.name}</div>
                ${sel?'<div style="font-size:9px;color:var(--g2);margin-top:2px">✓ 선택됨</div>':''}
              </div>`;
          }).join('')}
        </div>
        <button onclick="window.eqCloseModal()" style="width:100%;background:#f0f0f0;color:var(--sub);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px">닫기</button>
      </div>`;
  };
  window.eqSetAvatar = async function(avatarId){
    window.UDATA.farm.avatar = avatarId;
    await saveFarm();
    window.eqCloseModal();
    renderFarmField();
    const a = AVATARS.find(x => x.id === avatarId);
    window.toast && window.toast(`${a.emoji} ${a.name} 선택!`);
  };

  /* ===== 씨앗 심기 / 수확 ===== */
  window.eqOpenPlantModal = function(plotIdx){
    const farm = window.UDATA.farm;
    const seeds = Object.keys(CROPS).filter(id => (farm.inventory[id]||0) > 0);
    if(!seeds.length){ window.toast && window.toast('씨앗이 없어요! 🌱 씨앗가게에서 사 오세요'); return; }
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
    window.UDATA.farm.inventory[harvestId] = (window.UDATA.farm.inventory[harvestId]||0) + 1;
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

  /* ===== 진열 / 회수 ===== */
  window.eqPlaceItem = async function(cropKey){
    const farm = window.UDATA.farm;
    const harvestId = 'harvest_' + cropKey;
    if(!farm.inventory[harvestId] || farm.inventory[harvestId] <= 0) return;
    farm.inventory[harvestId]--;
    if(!farm.placed) farm.placed = [];
    farm.placed.push({
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
      cropKey,
      x: 15 + Math.random()*70,
      y: 25 + Math.random()*45,
    });
    await saveFarm();
    window.eqCloseModal();
    renderFarmField();
    const crop = CROPS['seed_' + cropKey];
    window.toast && window.toast(`✨ ${crop.emoji} 농장에 진열!`);
  };
  window.eqRecallItem = async function(placedId){
    const farm = window.UDATA.farm;
    const idx = farm.placed.findIndex(p => p.id === placedId);
    if(idx === -1) return;
    const item = farm.placed[idx];
    const harvestId = 'harvest_' + item.cropKey;
    farm.inventory[harvestId] = (farm.inventory[harvestId]||0) + 1;
    farm.placed.splice(idx, 1);
    await saveFarm();
    renderFarmField();
    const crop = CROPS['seed_' + item.cropKey];
    window.toast && window.toast(`📦 ${crop.emoji} 창고로 회수!`);
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
        ${Object.entries(CROPS).map(([id, c]) => {
          const can = (window.UDATA?.point||0) >= c.buy;
          return `
            <div style="display:flex;align-items:center;gap:12px;background:#fff;border:1.5px solid var(--bdr);border-radius:12px;padding:12px;margin-bottom:8px">
              <div style="font-size:36px">${c.emoji}</div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:700;color:var(--txt)">${c.name} 씨앗</div>
                <div style="font-size:11px;color:var(--sub)">${c.growMin}분 키워 +${c.sell}P (이익 ${c.sell-c.buy}P)</div>
                <div style="font-size:10px;color:var(--g2);margin-top:2px">🌍 CO₂ +${c.co2}kg</div>
              </div>
              <button onclick="window.eqBuySeed('${id}')" ${can?'':'disabled'} style="background:${can?'linear-gradient(135deg,#F39C12,#E67E22)':'#ddd'};color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:900;cursor:${can?'pointer':'not-allowed'};font-family:inherit">${c.buy}P</button>
            </div>`;
        }).join('')}
        <button onclick="window.eqCloseModal()" style="width:100%;background:#f0f0f0;color:var(--sub);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px">닫기</button>
      </div>`;
  };
  window.eqBuySeed = async function(seedId){
    const c = CROPS[seedId];
    if((window.UDATA?.point||0) < c.buy){ window.toast && window.toast('포인트 부족!'); return; }
    window.UDATA.point -= c.buy;
    window.UDATA.farm.inventory[seedId] = (window.UDATA.farm.inventory[seedId]||0) + 1;
    await saveFarm({ point: window.UDATA.point });
    window.updateUI && window.updateUI();
    window.eqOpenSeedShop();
    window.toast && window.toast(`✅ ${c.emoji} ${c.name} 씨앗 구매!`);
  };

  /* ===== 내 창고 ===== */
  window.eqOpenInventory = function(){
    const modal = createModal();
    const inv = window.UDATA.farm.inventory || {};
    const seeds = Object.entries(inv).filter(([k,v]) => k.startsWith('seed_') && v > 0);
    const harvests = Object.entries(inv).filter(([k,v]) => k.startsWith('harvest_') && v > 0);
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 30px;max-width:480px;width:100%;max-height:85vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:16px">
          <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 12px"></div>
          <div style="font-size:18px;font-weight:900">📦 내 창고</div>
          <div style="font-size:11px;color:var(--sub);margin-top:4px">사용자별로 안전하게 보관 중 🔒</div>
        </div>

        <div style="font-size:13px;font-weight:900;color:var(--txt);margin-bottom:8px">🌱 씨앗 (${seeds.length}종)</div>
        ${seeds.length ? seeds.map(([id, count]) => {
          const c = CROPS[id];
          return `
            <div style="display:flex;align-items:center;gap:12px;background:#f8f8f8;border-radius:12px;padding:10px;margin-bottom:6px">
              <div style="font-size:28px">${c.emoji}</div>
              <div style="flex:1"><div style="font-size:13px;font-weight:700">${c.name} 씨앗</div><div style="font-size:11px;color:var(--sub)">${count}개 보유</div></div>
              <div style="font-size:11px;color:var(--sub)">빈 밭에 심기 →</div>
            </div>`;
        }).join('') : '<div style="text-align:center;padding:14px;color:var(--sub);font-size:12px">씨앗 없음 — 가게에서 구매!</div>'}

        <div style="font-size:13px;font-weight:900;color:var(--txt);margin:16px 0 8px">🥕 수확물 (${harvests.length}종)</div>
        ${harvests.length ? harvests.map(([id, count]) => {
          const cropKey = id.replace('harvest_','');
          const c = CROPS['seed_' + cropKey];
          return `
            <div style="display:flex;align-items:center;gap:10px;background:#f8fdf9;border:1px solid var(--bdr);border-radius:12px;padding:10px;margin-bottom:6px">
              <div style="font-size:28px">${c.emoji}</div>
              <div style="flex:1"><div style="font-size:13px;font-weight:700">${c.name}</div><div style="font-size:11px;color:var(--sub)">${count}개 보유</div></div>
              <button onclick="window.eqPlaceItem('${cropKey}')" style="background:#fff;border:1.5px solid var(--g2);color:var(--g2);border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🏞️ 진열</button>
              <button onclick="window.eqSellHarvest('${cropKey}')" style="background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;border:none;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">+${c.sell}P</button>
            </div>`;
        }).join('') : '<div style="text-align:center;padding:14px;color:var(--sub);font-size:12px">아직 수확한 게 없어요!</div>'}

        <div style="background:#f0fbf4;border-radius:10px;padding:10px;margin-top:14px;font-size:11px;color:var(--sub);line-height:1.6">
          💡 <b>진열</b> 버튼 → 농장 풍경에 작물 놓기<br/>
          💡 진열된 작물 탭 → 다시 창고로 회수<br/>
          💡 <b>판매</b> 버튼 → 포인트로 교환
        </div>

        <button onclick="window.eqCloseModal()" style="width:100%;background:#f0f0f0;color:var(--sub);border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:12px">닫기</button>
      </div>`;
  };
  window.eqSellHarvest = async function(cropKey){
    const harvestId = 'harvest_' + cropKey;
    const c = CROPS['seed_' + cropKey];
    const inv = window.UDATA.farm.inventory;
    if(!inv[harvestId] || inv[harvestId] <= 0) return;
    inv[harvestId]--;
    window.UDATA.point = (window.UDATA.point||0) + c.sell;
    await saveFarm({ point: window.UDATA.point });
    window.updateUI && window.updateUI();
    window.eqOpenInventory();
    window.toast && window.toast(`💰 ${c.emoji} +${c.sell}P!`);
  };

  /* ===== 모달 ===== */
  function createModal(){
    let m = document.getElementById('eqFarmModal');
    if(m) m.remove();
    m = document.createElement('div');
    m.id = 'eqFarmModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:8000;display:flex;align-items:flex-end;justify-content:center;animation:eqFadeIn .2s';
    m.onclick = (e) => { if(e.target === m) window.eqCloseModal(); };
    document.body.appendChild(m);
    return m;
  }
  window.eqCloseModal = function(){
    const m = document.getElementById('eqFarmModal'); if(m) m.remove();
  };

  /* ===== 토끼 상점 이름 변경 ===== */
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

  /* ===== 1분마다 자동 새로고침 ===== */
  setInterval(() => {
    if(document.getElementById('eqFarmField')) renderFarmField();
  }, 60000);

  /* ===== 페이지 진입 ===== */
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
    console.log('[farm_system v2] ✅ 아바타 + 진열 시스템');
  }

  if(!document.getElementById('eqFarmCss')){
    const s = document.createElement('style');
    s.id = 'eqFarmCss';
    s.textContent = `
      @keyframes eqPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      @keyframes eqFadeIn { from{opacity:0} to{opacity:1} }
    `;
    document.head.appendChild(s);
  }

  hookGoPage();
})();
