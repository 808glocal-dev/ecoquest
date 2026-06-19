/* =====================================================
   EcoQuest – 밭 농사 farm_patch.js v1
   - 정원(garden_patch) 아래에 "내 밭" 섹션 삽입
   - 베리(포인트)로 씨앗 구매 → 심기 → 물주기 → 수확 → 바구니
   - 수확물은 교환(openExchangeRequest)으로 굿즈·과일 보상 연결
   - users/{uid}.farmV1 에 저장 (garden gardenV2 와 충돌 X)
   ★ garden_patch.js "뒤"에 로드
   ===================================================== */
(function(){
  'use strict';
  if(window._eqFarmLoaded) return;
  window._eqFarmLoaded = true;

  const SEEDS = {
    tulip:{e:'🌷',n:'튤립',price:10,kind:'flower'},
    sunflower:{e:'🌻',n:'해바라기',price:10,kind:'flower'},
    daisy:{e:'🌼',n:'데이지',price:10,kind:'flower'},
    tomato:{e:'🍅',n:'토마토',price:30,kind:'crop'},
    carrot:{e:'🥕',n:'당근',price:30,kind:'crop'},
    strawberry:{e:'🍓',n:'딸기',price:30,kind:'crop'},
  };
  const STAGE = ['🟫','🌱','🌿'];  // water 0,1,2 — 3이면 작물/꽃 이모지
  const PLOTS = 9, MAX_WATER = 3;

  let F = null;
  const def = ()=>({pos:null, plots:new Array(PLOTS).fill(null), seeds:{}, basket:{}});

  function loadFarm(){
    F = (window.UDATA && window.UDATA.farmV1) ? window.UDATA.farmV1 : def();
    if(!Array.isArray(F.plots)) F.plots = new Array(PLOTS).fill(null);
    while(F.plots.length < PLOTS) F.plots.push(null);
    if(!F.seeds) F.seeds = {};
    if(!F.basket) F.basket = {};
  }
  async function saveFarm(){
    if(!window.ME||!window.UDATA) return;
    window.UDATA.farmV1 = F;
    try{ await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid),{farmV1:F}); }
    catch(e){ console.log('[farm] save err',e.message); }
  }
  const seedCount = ()=>Object.values(F.seeds).reduce((a,b)=>a+b,0);

  function injectCss(){
    if(document.getElementById('eqFarmCss')) return;
    const s=document.createElement('style'); s.id='eqFarmCss';
    s.textContent=`
      #eqFarmCard{margin:14px 4px 0;background:#fffdf6;border:1.5px solid #e7ddc6;border-radius:18px;padding:14px;font-family:'Gowun Batang',serif}
      #eqFarmCard .ef-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
      #eqFarmCard .ef-title{font-size:15px;font-weight:700;color:#3c4a3a}
      #eqFarmCard .ef-shop{background:#6f9258;color:#fff;border:none;border-radius:10px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
      #eqFarmGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      .ef-plot{aspect-ratio:1;background:linear-gradient(180deg,#e8dcc0,#d9c8a4);border:1.5px solid #cdb88e;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden}
      .ef-plot .ef-emoji{font-size:30px;line-height:1;margin-bottom:2px}
      .ef-plot .ef-empty{font-size:11px;color:#a08a5c;font-weight:700}
      .ef-plot .ef-act{position:absolute;bottom:4px;left:4px;right:4px;font-size:10px;font-weight:700;border:none;border-radius:7px;padding:4px 0;cursor:pointer;font-family:inherit}
      .ef-water{background:#9ad0db;color:#16505c}
      .ef-harvest{background:#f2cf6b;color:#7a5a10}
      .ef-bar{position:absolute;top:4px;left:6px;right:6px;height:3px;background:rgba(0,0,0,.1);border-radius:3px}
      .ef-bar>div{height:100%;background:#6f9258;border-radius:3px;transition:width .4s}
      #eqFarmBasket{margin-top:12px;padding:10px;background:#f6f1e3;border-radius:12px;font-size:12px;color:#6f5a38;line-height:1.7}
      .ef-mbg{position:fixed;inset:0;background:rgba(40,50,38,.5);z-index:9100;display:flex;align-items:flex-end;justify-content:center}
      .ef-modal{background:#fffdf6;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:18px 16px 28px;max-height:82vh;overflow-y:auto;font-family:'Gowun Batang',serif}
    `;
    document.head.appendChild(s);
  }

  const farmHTML = ()=>`
    <div class="ef-head">
      <div class="ef-title">🌱 내 밭</div>
      <button class="ef-shop" onclick="eqFarmStore()">🛒 씨앗 상점</button>
    </div>
    <div id="eqFarmGrid"></div>
    <div id="eqFarmBasket"></div>
    <div style="font-size:10px;color:#a99;text-align:center;margin-top:8px;line-height:1.6">🌷 베리(포인트)로 씨앗 사서 심고, 💧 물 주면 자라요 · 🧺 수확해서 보상으로 바꿔요</div>`;

  function plotInner(p,i){
    if(!p) return `<div class="ef-empty">+ 씨앗 심기</div>`;
    const meta=SEEDS[p.type]||{e:'🌱'};
    const grown=p.water>=MAX_WATER;
    const emoji=grown?meta.e:STAGE[Math.min(p.water,STAGE.length-1)];
    const pct=Math.min(100,p.water/MAX_WATER*100);
    const act=grown
      ? `<button class="ef-act ef-harvest" onclick="event.stopPropagation();eqHarvest(${i})">🧺 수확</button>`
      : `<button class="ef-act ef-water" onclick="event.stopPropagation();eqWater(${i})">💧 ${p.water}/${MAX_WATER}</button>`;
    return `<div class="ef-bar"><div style="width:${pct}%"></div></div><div class="ef-emoji">${emoji}</div>${act}`;
  }

  function renderFarm(){
    const grid=document.getElementById('eqFarmGrid'); if(!grid||!F) return;
    grid.innerHTML='';
    F.plots.forEach((p,i)=>{
      const d=document.createElement('div'); d.className='ef-plot';
      d.innerHTML=plotInner(p,i);
      if(!p) d.onclick=()=>eqPlant(i);
      grid.appendChild(d);
    });
    const b=document.getElementById('eqFarmBasket');
    if(b){
      const items=Object.entries(F.basket).filter(([k,v])=>v>0);
      if(!items.length) b.innerHTML='🧺 수확 바구니가 비었어요. 씨앗을 심어 길러보세요!';
      else b.innerHTML='🧺 수확 바구니: '+items.map(([k,v])=>`${(SEEDS[k]||{}).e||''}${(SEEDS[k]||{}).n||k} ${v}`).join(' · ')
        +(typeof window.openExchangeRequest==='function'?` <button onclick="window.openExchangeRequest()" style="margin-left:4px;background:#6f9258;color:#fff;border:none;border-radius:8px;padding:4px 9px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">🎟️ 교환</button>`:'');
    }
  }

  window.eqWater=async function(i){
    const p=F.plots[i]; if(!p||p.water>=MAX_WATER) return;
    p.water++; await saveFarm(); renderFarm();
    window.toast&&toast(p.water>=MAX_WATER?'🌟 다 자랐어요! 수확하세요':'💧 쑥쑥 자라요');
  };
  window.eqHarvest=async function(i){
    const p=F.plots[i]; if(!p||p.water<MAX_WATER) return;
    F.basket[p.type]=(F.basket[p.type]||0)+1; F.plots[i]=null;
    await saveFarm(); renderFarm();
    window.toast&&toast(`🧺 ${(SEEDS[p.type]||{}).n||''} 수확! 바구니에 담겼어요`);
  };
  window.eqPlant=function(i){
    if(seedCount()<=0){ window.toast&&toast('씨앗이 없어요. 상점에서 사세요 🛒'); eqFarmStore(); return; }
    const owned=Object.entries(F.seeds).filter(([k,v])=>v>0);
    const bg=document.createElement('div'); bg.className='ef-mbg'; bg.id='eqPlantModal';
    bg.innerHTML=`<div class="ef-modal">
      <div style="font-size:15px;font-weight:700;color:#3c4a3a;margin-bottom:12px">어떤 씨앗을 심을까요?</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${owned.map(([k,v])=>`<button onclick="eqDoPlant(${i},'${k}')" style="background:#fff;border:1.5px solid #e7ddc6;border-radius:12px;padding:12px 4px;cursor:pointer;font-family:inherit"><div style="font-size:28px">${SEEDS[k].e}</div><div style="font-size:11px;font-weight:700;color:#3c4a3a;margin-top:4px">${SEEDS[k].n}</div><div style="font-size:10px;color:#6f9258">보유 ${v}</div></button>`).join('')}
      </div>
      <button onclick="document.getElementById('eqPlantModal').remove()" style="width:100%;margin-top:14px;background:#eee;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">닫기</button>
    </div>`;
    bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
    document.body.appendChild(bg);
  };
  window.eqDoPlant=async function(i,type){
    if((F.seeds[type]||0)<=0) return;
    F.seeds[type]--; F.plots[i]={type,water:0};
    await saveFarm(); document.getElementById('eqPlantModal')?.remove(); renderFarm();
    window.toast&&toast(`${SEEDS[type].e} 심었어요! 물을 주세요 💧`);
  };

  function seedBtn(k,s,pts){
    const can=pts>=s.price;
    return `<button onclick="eqBuySeed('${k}')" ${can?'':'disabled'} style="background:${can?'#fff':'#f3f3f3'};border:1.5px solid ${can?'#e7ddc6':'#e0e0e0'};border-radius:12px;padding:10px 4px;cursor:${can?'pointer':'default'};font-family:inherit"><div style="font-size:26px">${s.e}</div><div style="font-size:11px;font-weight:700;color:#3c4a3a;margin-top:3px">${s.n}</div><div style="font-size:10px;color:${can?'#6f9258':'#bbb'};font-weight:700;margin-top:2px">🫐 ${s.price}</div>${F.seeds[k]?`<div style="font-size:9px;color:#a99">보유 ${F.seeds[k]}</div>`:''}</button>`;
  }
  window.eqFarmStore=function(){
    const pts=window.UDATA?.point||0;
    const bg=document.createElement('div'); bg.className='ef-mbg'; bg.id='eqShopModal';
    bg.innerHTML=`<div class="ef-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:15px;font-weight:700;color:#3c4a3a">🛒 씨앗 상점</div>
        <div style="font-size:13px;font-weight:700;color:#6f9258">🫐 ${pts.toLocaleString()} 베리</div>
      </div>
      <div style="font-size:11px;color:#a99;margin-bottom:12px">베리(포인트)로 씨앗을 사요</div>
      <div style="font-size:12px;font-weight:700;color:#6f9258;margin-bottom:6px">🌸 꽃 (관상용)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
        ${Object.entries(SEEDS).filter(([k,s])=>s.kind==='flower').map(([k,s])=>seedBtn(k,s,pts)).join('')}
      </div>
      <div style="font-size:12px;font-weight:700;color:#6f9258;margin-bottom:6px">🍓 작물 (수확용)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${Object.entries(SEEDS).filter(([k,s])=>s.kind==='crop').map(([k,s])=>seedBtn(k,s,pts)).join('')}
      </div>
      <button onclick="document.getElementById('eqShopModal').remove()" style="width:100%;margin-top:16px;background:#eee;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">닫기</button>
    </div>`;
    bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
    document.body.appendChild(bg);
  };
  window.eqBuySeed=async function(k){
    const s=SEEDS[k]; if(!s) return;
    const pts=window.UDATA?.point||0;
    if(pts<s.price){ window.toast&&toast('베리가 부족해요!'); return; }
    try{
      const np=pts-s.price;
      await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid),{point:np});
      window.UDATA.point=np; F.seeds[k]=(F.seeds[k]||0)+1;
      await saveFarm();
      if(window.updateUI) window.updateUI();
      window.toast&&toast(`${s.e} ${s.n} 씨앗을 샀어요!`);
      document.getElementById('eqShopModal')?.remove(); eqFarmStore(); renderFarm();
    }catch(e){ window.toast&&toast('구매 실패: '+e.message); }
  };

  function injectFarm(){
    const host=document.getElementById('farmGameMain'); if(!host) return;
    if(document.getElementById('eqFarmCard')){ renderFarm(); return; }
    const wrap=host.querySelector('div'); if(!wrap) return;
    injectCss();
    const card=document.createElement('div'); card.id='eqFarmCard'; card.innerHTML=farmHTML();
    wrap.appendChild(card); renderFarm();
  }

  function boot(){
    if(!window.FB||!window.ME||!window.UDATA){ setTimeout(boot,600); return; }
    loadFarm();
    const _dm=window.drawMap;
    if(typeof _dm==='function' && !_dm._eqFarmHooked){
      window.drawMap=function(){ const r=_dm.apply(this,arguments); setTimeout(injectFarm,180); return r; };
      window.drawMap._eqFarmHooked=true;
    }
    injectFarm();
    setInterval(()=>{ const mp=document.getElementById('page-map');
      if(mp&&mp.classList.contains('on')&&document.getElementById('farmGameMain')&&!document.getElementById('eqFarmCard')) injectFarm();
    },1500);
    console.log('%c[farm v1] 🌱 밭','color:#fff;background:#c98a5a;padding:4px 8px;border-radius:4px;font-weight:bold');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,2200));
  else setTimeout(boot,2200);
})();
