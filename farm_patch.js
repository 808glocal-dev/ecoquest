/* =====================================================
   EcoQuest – 밭 농사 farm_patch.js v3
   - 정원 풍경(gardenScene) 안에 밭 · 칸 탭으로 심기/물주기/수확
   - 수확물: 바구니(현재 보유) + 도감(누적 컬렉션, 차감 X)
   - 🎁 실물 교환소: 직접 키운 작물/꽃을 큰 단위로 모아 신청
     → harvestExchanges 컬렉션 저장(status:pending) → 운영자 확인/발송
   - 포인트 교환권과 완전 별도 트랙 (직접 재배한 것만)
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
  // ★★★ 실물 교환 기준 — 여기 need 숫자만 바꾸면 난이도 조절됨 ★★★
  const GOODS = [
    {id:'fruitbox', e:'🍎', name:'못난이 과일·채소 박스', kind:'crop',   need:500},
    {id:'merch',    e:'🎁', name:'EcoQuest 굿즈 키트',    kind:'flower', need:300},
  ];
  const KIND_NAME = {crop:'작물', flower:'꽃'};
  const STAGE=['🟫','🌱','🌿'];
  const PLOTS=9, MAX_WATER=3;
  let _exMethod='delivery';

  let F=null;
  const def=()=>({pos:null, plots:new Array(PLOTS).fill(null), seeds:{}, basket:{}, collected:{}});

  function loadFarm(){
    F=(window.UDATA&&window.UDATA.farmV1)?window.UDATA.farmV1:def();
    if(!Array.isArray(F.plots)) F.plots=new Array(PLOTS).fill(null);
    while(F.plots.length<PLOTS) F.plots.push(null);
    if(!F.seeds) F.seeds={};
    if(!F.basket) F.basket={};
    if(!F.collected) F.collected={};
  }
  async function saveFarm(){
    if(!window.ME||!window.UDATA) return;
    window.UDATA.farmV1=F;
    try{ await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid),{farmV1:F}); }
    catch(e){ console.log('[farm] save err',e.message); }
  }
  const seedCount=()=>Object.values(F.seeds).reduce((a,b)=>a+b,0);
  const basketCount=()=>Object.values(F.basket).reduce((a,b)=>a+b,0);
  const kindCount=(kind)=>Object.entries(F.basket).reduce((s,[k,v])=>s+((SEEDS[k]||{}).kind===kind?v:0),0);
  function spendBasket(kind, amount){
    let remain=amount;
    for(const k of Object.keys(F.basket)){
      if((SEEDS[k]||{}).kind!==kind) continue;
      const take=Math.min(F.basket[k], remain);
      F.basket[k]-=take; remain-=take;
      if(F.basket[k]<=0) delete F.basket[k];
      if(remain<=0) break;
    }
  }

  function injectCss(){
    if(document.getElementById('eqFarmCss')) return;
    const s=document.createElement('style'); s.id='eqFarmCss';
    s.textContent=`
      #eqFarmPatch{position:absolute;z-index:65;width:120px;touch-action:none}
      #eqFarmPatch .ef-handle{display:flex;align-items:center;gap:3px;background:rgba(255,253,246,.93);border:1px solid #cdb88e;border-radius:8px;padding:3px 5px;margin-bottom:3px;cursor:grab;font-size:10px;font-weight:700;color:#6f5a38;font-family:'Gowun Batang',serif;box-shadow:0 2px 6px rgba(60,74,58,.12)}
      #eqFarmPatch .ef-handle.dragging{cursor:grabbing}
      #eqFarmPatch .ef-hbtn{background:#6f9258;color:#fff;border:none;border-radius:6px;padding:2px 5px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1.4}
      #eqFarmPatch .ef-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}
      #eqFarmPatch .ef-cell{aspect-ratio:1;background:linear-gradient(180deg,#c9a876,#a8855a);border:1px solid #8f6d42;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;position:relative;box-shadow:inset 0 -2px 3px rgba(0,0,0,.14)}
      #eqFarmPatch .ef-cell.empty{background:linear-gradient(180deg,#d8bd8c,#c2a26e);opacity:.92}
      #eqFarmPatch .ef-cell.ready{box-shadow:0 0 0 2px #f2cf6b,inset 0 -2px 3px rgba(0,0,0,.14);animation:efReady 1.2s ease-in-out infinite}
      @keyframes efReady{0%,100%{box-shadow:0 0 0 2px #f2cf6b,inset 0 -2px 3px rgba(0,0,0,.14)}50%{box-shadow:0 0 0 3px #ffe08a,inset 0 -2px 3px rgba(0,0,0,.14)}}
      #eqFarmPatch .ef-dot{position:absolute;bottom:2px;left:0;right:0;display:flex;gap:2px;justify-content:center}
      #eqFarmPatch .ef-dot i{width:3px;height:3px;border-radius:50%;background:#6f9258;display:block}
      .ef-mbg{position:fixed;inset:0;background:rgba(40,50,38,.5);z-index:9100;display:flex;align-items:flex-end;justify-content:center}
      .ef-modal{background:#fffdf6;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:18px 16px 28px;max-height:84vh;overflow-y:auto;font-family:'Gowun Batang',serif}
      .ef-sec-t{font-size:13px;font-weight:700;color:#6f9258;margin:16px 0 8px}
      .ef-goods{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e7ddc6;border-radius:14px;padding:12px;margin-bottom:8px}
      .ef-goods .efg-bar{height:6px;background:#eee4cf;border-radius:4px;overflow:hidden;margin-top:5px}
      .ef-goods .efg-bar>div{height:100%;background:linear-gradient(90deg,#7fae6b,#6f9258);border-radius:4px;transition:width .5s}
      .ef-goods .efg-btn{border:none;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
      .ef-input{width:100%;box-sizing:border-box;border:1.5px solid #e7ddc6;border-radius:10px;padding:11px 12px;font-size:14px;font-family:inherit;margin-top:6px}
      .ef-mbtn{flex:1;border:1.5px solid #e7ddc6;background:#fff;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:#6f5a38}
      .ef-mbtn.on{background:#6f9258;color:#fff;border-color:#6f9258}
      .ef-dex{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
      .ef-dex .efd{background:#fff;border:1px solid #eee;border-radius:10px;padding:8px 4px;text-align:center}
      .ef-dex .efd.lock{opacity:.4}
    `;
    document.head.appendChild(s);
  }

  function cellHTML(p){
    if(!p) return `<div class="ef-cell empty"></div>`;
    const meta=SEEDS[p.type]||{e:'🌱'};
    const grown=p.water>=MAX_WATER;
    const emoji=grown?meta.e:STAGE[Math.min(p.water,STAGE.length-1)];
    let dots='';
    if(!grown) dots='<div class="ef-dot">'+'<i></i>'.repeat(p.water)+'<i style="background:#d8c4a0"></i>'.repeat(MAX_WATER-p.water)+'</div>';
    return `<div class="ef-cell ${grown?'ready':''}">${emoji}${dots}</div>`;
  }

  function renderFarm(){
    const patch=document.getElementById('eqFarmPatch'); if(!patch||!F) return;
    const bc=basketCount();
    patch.innerHTML=`
      <div class="ef-handle">
        <span style="flex:1">🌱 내 밭</span>
        <button class="ef-hbtn" onclick="event.stopPropagation();eqFarmStore()">🛒</button>
        <button class="ef-hbtn" style="background:#c98a5a" onclick="event.stopPropagation();eqBasket()">🧺${bc||''}</button>
      </div>
      <div class="ef-grid">${F.plots.map(cellHTML).join('')}</div>`;
    patch.querySelectorAll('.ef-cell').forEach((c,i)=>{ c.onclick=(e)=>{ e.stopPropagation(); cellTap(i); }; });
    makeFarmDraggable(patch);
  }

  function cellTap(i){
    const p=F.plots[i];
    if(!p) eqPlant(i);
    else if(p.water>=MAX_WATER) eqHarvest(i);
    else eqWater(i);
  }

  window.eqWater=async function(i){
    const p=F.plots[i]; if(!p||p.water>=MAX_WATER) return;
    p.water++; await saveFarm(); renderFarm();
    window.toast&&toast(p.water>=MAX_WATER?'🌟 다 자랐어요! 탭해서 수확하세요':'💧 쑥쑥 자라요');
  };
  window.eqHarvest=async function(i){
    const p=F.plots[i]; if(!p||p.water<MAX_WATER) return;
    F.basket[p.type]=(F.basket[p.type]||0)+1;
    F.collected[p.type]=(F.collected[p.type]||0)+1;   // ★ 도감 누적(차감 안 함)
    F.plots[i]=null;
    await saveFarm(); renderFarm();
    window.toast&&toast(`🧺 ${(SEEDS[p.type]||{}).n||''} 수확! 바구니에 담겼어요`);
  };
  window.eqPlant=function(i){
    if(seedCount()<=0){ window.toast&&toast('씨앗이 없어요. 🛒 상점에서 사세요'); eqFarmStore(); return; }
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
    window.toast&&toast(`${SEEDS[type].e} 심었어요! 칸을 탭해 물을 주세요 💧`);
  };

  /* ---------- 바구니 + 실물 교환소 + 도감 ---------- */
  window.eqBasket=function(){
    const items=Object.entries(F.basket).filter(([k,v])=>v>0);
    const cropC=kindCount('crop'), flowerC=kindCount('flower');
    const have={crop:cropC, flower:flowerC};
    const bg=document.createElement('div'); bg.className='ef-mbg'; bg.id='eqBasketModal';
    bg.innerHTML=`<div class="ef-modal">
      <div style="font-size:15px;font-weight:700;color:#3c4a3a;margin-bottom:4px">🧺 수확 바구니</div>
      ${items.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${items.map(([k,v])=>`<span style="background:#f6f1e3;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:700;color:#6f5a38">${(SEEDS[k]||{}).e||''} ${(SEEDS[k]||{}).n||k} ${v}</span>`).join('')}</div>`
        : `<div style="padding:14px;text-align:center;color:#a99;font-size:12px">아직 수확한 게 없어요 🌱 씨앗 심고 길러보세요!</div>`}

      <div class="ef-sec-t">🎁 실물 교환소 <span style="font-size:10px;color:#a99;font-weight:400">· 직접 키운 것만 (포인트 교환권과 별개)</span></div>
      ${GOODS.map(g=>{
        const cur=have[g.kind]||0; const ok=cur>=g.need; const pct=Math.min(100,cur/g.need*100);
        return `<div class="ef-goods">
          <div style="font-size:30px">${g.e}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#3c4a3a">${g.name}</div>
            <div style="font-size:10px;color:#a99;margin-top:1px">직접 키운 ${KIND_NAME[g.kind]} ${g.need}개 필요</div>
            <div class="efg-bar"><div style="width:${pct}%"></div></div>
            <div style="font-size:10px;color:#6f9258;font-weight:700;margin-top:3px">${cur} / ${g.need}</div>
          </div>
          <button class="efg-btn" ${ok?'':'disabled'} style="background:${ok?'#6f9258':'#e8e8e8'};color:${ok?'#fff':'#aaa'}" onclick="${ok?`eqApplyGoods('${g.id}')`:''}">${ok?'신청':'모으는 중'}</button>
        </div>`;
      }).join('')}

      <div class="ef-sec-t">📖 내 작물 도감 <span style="font-size:10px;color:#a99;font-weight:400">· 지금까지 키운 누적</span></div>
      <div class="ef-dex">
        ${Object.keys(SEEDS).map(k=>{
          const n=F.collected[k]||0; const got=n>0;
          return `<div class="efd ${got?'':'lock'}"><div style="font-size:24px">${got?SEEDS[k].e:'❔'}</div><div style="font-size:10px;font-weight:700;color:#3c4a3a;margin-top:2px">${SEEDS[k].n}</div><div style="font-size:9px;color:#6f9258">${got?'누적 '+n:'미수확'}</div></div>`;
        }).join('')}
      </div>

      <button onclick="document.getElementById('eqBasketModal').remove()" style="width:100%;margin-top:16px;background:#eee;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">닫기</button>
    </div>`;
    bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
    document.body.appendChild(bg);
  };

  window.eqApplyGoods=function(id){
    const g=GOODS.find(x=>x.id===id); if(!g) return;
    if(kindCount(g.kind)<g.need){ window.toast&&toast('수확물이 부족해요'); return; }
    _exMethod='delivery';
    document.getElementById('eqBasketModal')?.remove();
    const bg=document.createElement('div'); bg.className='ef-mbg'; bg.id='eqApplyModal';
    bg.innerHTML=`<div class="ef-modal">
      <div style="text-align:center;margin-bottom:6px"><div style="font-size:42px">${g.e}</div>
        <div style="font-size:16px;font-weight:700;color:#3c4a3a;margin-top:4px">${g.name} 신청</div>
        <div style="font-size:11px;color:#6f9258;margin-top:4px">직접 키운 ${KIND_NAME[g.kind]} ${g.need}개를 사용해요</div></div>
      <div style="font-size:12px;font-weight:700;color:#555;margin-top:14px">받는 분 이름</div>
      <input id="eqExName" class="ef-input" placeholder="이름"/>
      <div style="font-size:12px;font-weight:700;color:#555;margin-top:10px">연락처</div>
      <input id="eqExPhone" class="ef-input" placeholder="010-0000-0000" inputmode="tel"/>
      <div style="font-size:12px;font-weight:700;color:#555;margin-top:10px">수령 방법</div>
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="ef-mbtn on" id="eqMD" onclick="eqExMethod('delivery')">📦 배송</button>
        <button class="ef-mbtn" id="eqMP" onclick="eqExMethod('pickup')">🏃 현장 수령</button>
      </div>
      <div id="eqAddrWrap"><div style="font-size:12px;font-weight:700;color:#555;margin-top:10px">배송 주소</div>
        <input id="eqExAddr" class="ef-input" placeholder="주소를 입력하세요"/></div>
      <div style="display:flex;gap:8px;margin-top:18px">
        <button onclick="document.getElementById('eqApplyModal').remove()" style="flex:1;background:#eee;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">취소</button>
        <button onclick="eqSubmitExchange('${g.id}')" style="flex:1.4;background:#6f9258;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">🎉 교환 신청</button>
      </div>
    </div>`;
    bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
    document.body.appendChild(bg);
  };
  window.eqExMethod=function(m){
    _exMethod=m;
    document.getElementById('eqMD')?.classList.toggle('on',m==='delivery');
    document.getElementById('eqMP')?.classList.toggle('on',m==='pickup');
    const w=document.getElementById('eqAddrWrap'); if(w) w.style.display=(m==='delivery')?'block':'none';
  };
  window.eqSubmitExchange=async function(id){
    const g=GOODS.find(x=>x.id===id); if(!g) return;
    const name=(document.getElementById('eqExName')?.value||'').trim();
    const phone=(document.getElementById('eqExPhone')?.value||'').trim();
    const addr=(document.getElementById('eqExAddr')?.value||'').trim();
    if(!name||!phone){ window.toast&&toast('이름과 연락처를 입력해주세요'); return; }
    if(_exMethod==='delivery' && !addr){ window.toast&&toast('배송 주소를 입력해주세요'); return; }
    if(kindCount(g.kind)<g.need){ window.toast&&toast('수확물이 부족해요'); return; }
    try{
      spendBasket(g.kind, g.need);
      await saveFarm();
      const cref=window.FB.collection(window.FB.db,'harvestExchanges');
      const dref=window.FB.doc(cref);
      await window.FB.setDoc(dref,{
        uid:window.ME.uid, nickname:window.UDATA?.nickname||'',
        goodsId:g.id, goodsName:g.name, kind:g.kind, qty:g.need,
        name, phone, method:_exMethod, address:_exMethod==='delivery'?addr:'',
        status:'pending', createdAt:window.FB.serverTimestamp()
      });
      document.getElementById('eqApplyModal')?.remove();
      renderFarm();
      window.toast&&toast('🎉 교환 신청 완료! 확인 후 연락드릴게요');
    }catch(e){ window.toast&&toast('신청 실패: '+e.message); }
  };

  /* ---------- 씨앗 상점 ---------- */
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

  function makeFarmDraggable(patch){
    const handle=patch.querySelector('.ef-handle'); if(!handle) return;
    handle.addEventListener('pointerdown',function(e){
      if(e.target.closest('.ef-hbtn')) return;   // 버튼 위에선 드래그 무시 → 클릭 정상
      const sc=document.getElementById('gardenScene'); if(!sc) return;
      e.preventDefault();
      const r=sc.getBoundingClientRect();
      handle.classList.add('dragging');
      let moved=false;
      try{ handle.setPointerCapture(e.pointerId); }catch(_){}
      function move(ev){
        const x=Math.max(0,Math.min(70,((ev.clientX-r.left)/r.width)*100));
        const y=Math.max(14,Math.min(72,((ev.clientY-r.top)/r.height)*100));
        patch.style.left=x+'%'; patch.style.top=y+'%'; moved=true;
      }
      function up(){
        handle.classList.remove('dragging');
        handle.removeEventListener('pointermove',move);
        handle.removeEventListener('pointerup',up);
        handle.removeEventListener('pointercancel',up);
        if(moved){ F.pos=[parseFloat(patch.style.left),parseFloat(patch.style.top)]; saveFarm(); }
      }
      handle.addEventListener('pointermove',move);
      handle.addEventListener('pointerup',up);
      handle.addEventListener('pointercancel',up);
    });
  }

  function injectFarm(){
    const sc=document.getElementById('gardenScene'); if(!sc) return;
    if(!document.getElementById('gChips')) return;   // 내 정원에서만
    if(document.getElementById('eqFarmPatch')){ renderFarm(); return; }
    injectCss();
    const patch=document.createElement('div'); patch.id='eqFarmPatch';
    const pos=F.pos||[4,56];
    patch.style.left=pos[0]+'%'; patch.style.top=pos[1]+'%';
    sc.appendChild(patch);
    renderFarm();
  }

  function boot(){
    if(!window.FB||!window.ME||!window.UDATA){ setTimeout(boot,600); return; }
    loadFarm();
    const _dm=window.drawMap;
    if(typeof _dm==='function' && !_dm._eqFarmHooked){
      window.drawMap=function(){ const r=_dm.apply(this,arguments); setTimeout(injectFarm,200); return r; };
      window.drawMap._eqFarmHooked=true;
    }
    injectFarm();
    setInterval(()=>{
      const mp=document.getElementById('page-map');
      if(mp&&mp.classList.contains('on')&&document.getElementById('gardenScene')&&document.getElementById('gChips')&&!document.getElementById('eqFarmPatch'))
        injectFarm();
    },1500);
    console.log('%c[farm v3] 🌱 밭+교환소','color:#fff;background:#c98a5a;padding:4px 8px;border-radius:4px;font-weight:bold');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,2200));
  else setTimeout(boot,2200);
})();
