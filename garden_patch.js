/* =====================================================
   EcoQuest – 정원(미니홈피) v1
   - 챌린지 인증(saveMission) → 정원이 자라고 연출이 뜸
   - 부드러운 일러스트 (캐릭터는 다음 단계)
   - page-map 인수 · users/{uid}.gardenV2 에 저장 (doc4와 충돌 X)
   ★ 모든 farm/bunny 패치보다 "뒤"에 로드 (맨 끝)
   ★ in_game_mission_patch.js 는 빼도 됨 (챌린지 칩이 여기 포함됨)
   ===================================================== */
(function () {
  'use strict';

  /* ---------- 아트 (이모지 없음) ---------- */
  const ART = {
    tree:`<svg width="74" viewBox="0 0 80 92"><rect x="36" y="54" width="8" height="30" rx="4" fill="#b07a52"/><rect x="36" y="54" width="4" height="30" rx="2" fill="#9a663f"/><circle cx="40" cy="38" r="24" fill="#7fae6b"/><circle cx="25" cy="46" r="14" fill="#8cbb77"/><circle cx="55" cy="46" r="14" fill="#6f9a59"/><circle cx="40" cy="29" r="13" fill="#9ecb85"/></svg>`,
    veg0:`<svg width="32" viewBox="0 0 40 36"><ellipse cx="20" cy="30" rx="15" ry="5" fill="#9c7a50"/><path d="M20 28 q0 -8 0 -9 M20 19 q-3 1 -4 3 M20 19 q3 1 4 3" stroke="#7fae6b" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`,
    veg1:`<svg width="40" viewBox="0 0 48 44"><ellipse cx="24" cy="38" rx="18" ry="6" fill="#9c7a50"/><path d="M16 36 q-2 -12 -2 -14 M32 36 q2 -12 2 -14 M24 36 q0 -16 0 -18" stroke="#6f9a59" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="14" cy="20" r="4" fill="#8cbb77"/><circle cx="34" cy="20" r="4" fill="#8cbb77"/><circle cx="24" cy="16" r="5" fill="#9ecb85"/></svg>`,
    veg2:`<svg width="46" viewBox="0 0 54 50"><ellipse cx="27" cy="44" rx="21" ry="6" fill="#9c7a50"/><circle cx="16" cy="30" r="7" fill="#e07a5f"/><circle cx="38" cy="30" r="7" fill="#e07a5f"/><path d="M27 42 q0 -16 0 -20" stroke="#6f9a59" stroke-width="2.6" stroke-linecap="round"/><polygon points="27,16 32,26 22,26" fill="#7fae6b"/></svg>`,
    flower:`<svg width="40" viewBox="0 0 50 44"><ellipse cx="25" cy="38" rx="18" ry="5" fill="#8aa86e"/><g><circle cx="14" cy="28" r="5" fill="#e8a3b0"/><circle cx="14" cy="28" r="2" fill="#fff2c2"/></g><g><circle cx="25" cy="24" r="5" fill="#f2cf6b"/><circle cx="25" cy="24" r="2" fill="#fff7df"/></g><g><circle cx="36" cy="28" r="5" fill="#c79ee0"/><circle cx="36" cy="28" r="2" fill="#fff2c2"/></g><path d="M18 32 v5 M32 32 v5" stroke="#6f9a59" stroke-width="2" stroke-linecap="round"/></svg>`,
    well:`<svg width="60" viewBox="0 0 70 80"><rect x="14" y="44" width="42" height="28" rx="4" fill="#cdb79a"/><path d="M14 50 h42 M14 58 h42 M14 66 h42" stroke="#b09a7d" stroke-width="1.5"/><ellipse cx="35" cy="46" rx="21" ry="6" fill="#7fb6c4"/><ellipse cx="35" cy="45" rx="18" ry="5" fill="#9ad0db"/><rect x="12" y="14" width="5" height="32" fill="#a8744a"/><rect x="53" y="14" width="5" height="32" fill="#a8744a"/><polygon points="35,4 64,20 6,20" fill="#d18a68"/><rect x="6" y="18" width="58" height="5" rx="2" fill="#c47a5a"/></svg>`,
    tumbler:`<svg width="30" viewBox="0 0 36 60"><path d="M9 12 L27 12 L25 54 Q25 57 22 57 L14 57 Q11 57 11 54 Z" fill="#9ad0db"/><path d="M9 12 L27 12 L26 22 L10 22 Z" fill="#bfe4ec"/><rect x="8" y="8" width="20" height="6" rx="3" fill="#5e6b58"/><rect x="14" y="3" width="8" height="6" rx="3" fill="#7c8a76"/></svg>`,
    cup:`<svg width="28" viewBox="0 0 34 50"><path d="M7 14 L27 14 L24 46 Q24 48 22 48 L12 48 Q10 48 10 46 Z" fill="#f4ead2"/><ellipse cx="17" cy="14" rx="10" ry="3" fill="#fff"/></svg>`,
    can:`<svg width="42" viewBox="0 0 56 44"><rect x="10" y="14" width="26" height="22" rx="5" fill="#9ab7c9"/><path d="M36 18 L52 8 L52 12 L40 22 Z" fill="#9ab7c9"/><rect x="48" y="6" width="8" height="4" rx="2" fill="#7d99a8"/><path d="M14 12 q8 -8 18 0" stroke="#7d99a8" stroke-width="3" fill="none"/></svg>`,
    bus:`<svg width="88" viewBox="0 0 110 56"><rect x="6" y="8" width="96" height="34" rx="9" fill="#e0a14e"/><rect x="6" y="8" width="96" height="12" rx="9" fill="#eab565"/><rect x="14" y="16" width="16" height="14" rx="3" fill="#bfe4ec"/><rect x="36" y="16" width="16" height="14" rx="3" fill="#bfe4ec"/><rect x="58" y="16" width="16" height="14" rx="3" fill="#bfe4ec"/><rect x="82" y="16" width="14" height="18" rx="3" fill="#cfeaf0"/><circle cx="28" cy="44" r="8" fill="#4a4038"/><circle cx="28" cy="44" r="3.5" fill="#9aa893"/><circle cx="80" cy="44" r="8" fill="#4a4038"/><circle cx="80" cy="44" r="3.5" fill="#9aa893"/></svg>`,
    busstop:`<svg width="46" viewBox="0 0 54 80"><rect x="24" y="20" width="5" height="54" fill="#7c8a76"/><rect x="14" y="14" width="30" height="10" rx="3" fill="#6f9258"/><text x="29" y="22" font-size="7" fill="#fff" text-anchor="middle" font-family="sans-serif" font-weight="bold">BUS</text><rect x="10" y="34" width="14" height="20" rx="2" fill="#cdb79a"/></svg>`,
    pond:`<svg width="90" viewBox="0 0 96 50"><ellipse cx="48" cy="28" rx="44" ry="18" fill="#7fb6c4"/><ellipse cx="48" cy="26" rx="40" ry="15" fill="#9ad0db"/><ellipse cx="36" cy="22" rx="11" ry="3.5" fill="#bfe4ec" opacity=".8"/><path d="M78 14 q3 8 0 16" stroke="#6f9a59" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,
    turtle:`<svg width="38" viewBox="0 0 52 34"><ellipse cx="26" cy="20" rx="16" ry="11" fill="#6f9a59"/><path d="M26 9 a16 11 0 0 1 16 11 a16 11 0 0 1 -32 0 a16 11 0 0 1 16 -11Z" fill="#7fae6b"/><path d="M26 10 l7 5 l-3 8 l-8 0 l-3 -8Z" fill="#5f8a4c"/><circle cx="44" cy="18" r="5" fill="#9ecb85"/><circle cx="46" cy="17" r="1.2" fill="#3c4a3a"/><ellipse cx="11" cy="27" rx="4" ry="2.5" fill="#9ecb85"/><ellipse cx="41" cy="27" rx="4" ry="2.5" fill="#9ecb85"/></svg>`,
    squirrel:`<svg width="32" viewBox="0 0 46 50"><path d="M30 40 q18 -6 12 -28 q-3 12 -10 16 z" fill="#c98a5a"/><ellipse cx="20" cy="34" rx="11" ry="13" fill="#cf9a6a"/><circle cx="18" cy="18" r="9" fill="#cf9a6a"/><path d="M12 11 q-2 -6 2 -6 q2 1 2 5z" fill="#b87a4a"/><circle cx="16" cy="17" r="1.6" fill="#3c4a3a"/></svg>`,
    bike:`<svg width="46" viewBox="0 0 60 40"><circle cx="14" cy="28" r="10" fill="none" stroke="#5e6b58" stroke-width="2.5"/><circle cx="46" cy="28" r="10" fill="none" stroke="#5e6b58" stroke-width="2.5"/><path d="M14 28 L26 28 L36 14 L46 28 M26 28 L36 14 M22 14 L30 14" stroke="#d18a68" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`,
    leaf:`<svg width="14" viewBox="0 0 16 16"><path d="M2 14 Q8 2 14 2 Q14 8 2 14Z" fill="#8fbd79"/></svg>`,
  };

  /* ---------- 챌린지 종류 → 정원 ---------- */
  function classify(m){
    const s = ((m && (m.name || m.title)) || '') + ' ' + ((m && m.id) || '');
    if (/텃밭|식물|화분|베란다|채소|가드닝|상추|모종/.test(s)) return 'veggie';
    if (/영수증|종이|페이퍼|전자고지/.test(s)) return 'tree';
    if (/자전거|따릉이|도보|걷기|보행/.test(s)) return 'bike';
    if (/대중교통|버스|지하철|전철|기차/.test(s)) return 'bus';
    if (/텀블러|머그|다회용/.test(s)) return 'tumbler';
    if (/빨대|일회용|플라스틱/.test(s)) return 'straw';
    return 'flower';
  }
  const KIND_LABEL = {veggie:'텃밭', tree:'나무', bike:'자전거', bus:'대중교통', tumbler:'텀블러', straw:'바다거북', flower:'꽃'};

  /* ---------- 상태 ---------- */
  const DEFAULT = () => ({ veggie:0, tree:0, bike:0, bus:0, tumbler:0, straw:0, flower:0, animals:[] });
  let G = null;

  function loadGarden(){
    G = (window.UDATA && window.UDATA.gardenV2) ? window.UDATA.gardenV2 : DEFAULT();
    if(!Array.isArray(G.animals)) G.animals = [];
  }
  async function saveGarden(){
    if(!window.ME || !window.UDATA) return;
    window.UDATA.gardenV2 = G;
    try { await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid), { gardenV2: G }); }
    catch(e){ console.log('[garden] save err:', e.message); }
  }

  /* ---------- 챌린지 칩 데이터 (인게임 인증) ---------- */
  function freqN(ac){ return ac.freqPerWeek ?? (ac.freq==='daily'?7:(parseInt((ac.freq||'w1').replace('w',''))||1)); }
  function findMission(id){ return (typeof MISSIONS!=='undefined') ? MISSIONS.find(x=>x.id===id) : null; }
  function activeList(){
    const valid = (typeof CHALLENGES!=='undefined') ? CHALLENGES.map(c=>c.missionId) : null;
    const today = new Date().toISOString().split('T')[0];
    return (window.UDATA?.activeChallenges||[]).filter(ac =>
      (!ac.endDate||ac.endDate>=today) && (!valid||valid.includes(ac.missionId)));
  }
  // 인증 모달이 isolate 패치에 안 닫히게 (플래그)
  if(!window._gardenCloseHooked){
    const _oc = window.closeOv;
    window.closeOv = function(id){ if(id==='ovAI' && !window._eqCertOpening) window._eqUserCert=false; if(_oc) _oc(id); };
    window._gardenCloseHooked = true;
  }
  window.gardenCert = function(chalId){
    const ac = (window.UDATA?.activeChallenges||[]).find(a=>a.challengeId===chalId);
    if(!ac){ window.toast && toast('챌린지 정보를 못 찾았어요'); return; }
    const today = new Date().toISOString().split('T')[0];
    if((window.UDATA?.verifiedDates||{})[chalId]===today){ window.toast && toast('오늘 이미 인증했어요 ✅'); return; }
    const m = findMission(ac.missionId);
    if(!m){ window.toast && toast('미션 정보를 못 찾았어요'); return; }
    window._eqUserCert = true; window._eqCertOpening = true;
    if(typeof window.openAI==='function') window.openAI(m, window.ME && window.ME.uid, chalId);
    setTimeout(()=>{ window._eqCertOpening=false; }, 800);
  };

  /* ---------- 슬롯 ---------- */
  const TREE_SLOTS = [[14,52],[26,49],[38,53],[62,49],[74,52],[86,50]];
  const VEG_SLOTS  = [[20,84],[30,87],[40,84]];
  const FLOWER_SLOTS = [[50,89],[58,86],[66,89],[48,83]];
  const POND=[76,87], WELL=[12,70], BUSSTOP=[88,60], BIKE=[56,85];

  /* ---------- DOM ---------- */
  function host(){ return document.getElementById('farmGameMain'); }
  function scene(){ return document.getElementById('gardenScene'); }
  function isVisible(){ const mp=document.getElementById('page-map'); return mp && mp.classList.contains('on') && scene(); }

  function injectCss(){
    if(document.getElementById('gardenCss')) return;
    const s=document.createElement('style'); s.id='gardenCss';
    s.textContent = `
      #gardenScene{position:relative;width:100%;height:330px;border-radius:24px;overflow:hidden;margin:12px 0;
        box-shadow:0 8px 24px rgba(60,74,58,.10),inset 0 0 0 1px rgba(255,255,255,.5);
        background:linear-gradient(180deg,#cfe9ef 0%,#dceef0 46%,#bcd9a0 46%,#a8cd89 100%);user-select:none}
      #gardenScene .g-sun{position:absolute;top:22px;right:28px;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#ffe9a8,#f6cf6b);box-shadow:0 0 28px rgba(246,207,107,.5)}
      #gardenScene .g-cloud{position:absolute;border-radius:30px;background:rgba(255,255,255,.78)}
      #gardenScene .g-hill{position:absolute;left:-10%;bottom:50%;width:60%;height:84px;background:#b6d49d;border-radius:50%;opacity:.55}
      #gardenScene .g-hill.b{left:40%;width:70%;height:110px;background:#a9cd8d;opacity:.5}
      #gardenScene .g-path{position:absolute;left:0;right:0;bottom:7%;height:24px;background:linear-gradient(180deg,#dcc89a,#cdb682);opacity:0;transition:opacity .6s;border-top:2px solid #c7b079}
      #gardenScene .g-obj{position:absolute;transform:translate(-50%,-86%);transition:transform .5s cubic-bezier(.34,1.56,.64,1),opacity .4s}
      #gardenScene .g-obj svg{display:block;filter:drop-shadow(0 5px 4px rgba(40,55,35,.16))}
      #gardenScene .g-pop{animation:gPop .55s cubic-bezier(.34,1.56,.64,1)}
      @keyframes gPop{0%{transform:translate(-50%,-86%) scale(.2);opacity:0}100%{transform:translate(-50%,-86%) scale(1);opacity:1}}
      #gFx{position:absolute;inset:0;pointer-events:none;overflow:hidden}
      #gFx .g-cross{position:absolute;bottom:8%;left:-30%}
      #gFx .g-cross svg{filter:drop-shadow(0 6px 5px rgba(40,55,35,.2))}
      @keyframes gRide{0%{left:-28%}48%{left:110%}48.01%{transform:scaleX(-1)}100%{left:54%;transform:scaleX(-1)}}
      @keyframes gBus{0%{left:-32%}100%{left:116%}}
      @keyframes gFloatUp{0%{transform:translate(-50%,0);opacity:0}20%{opacity:1}100%{transform:translate(-50%,-44px);opacity:0}}
      @keyframes gDrop{0%{transform:translateY(0);opacity:0}30%{opacity:1}100%{transform:translateY(38px);opacity:0}}
      @keyframes gLeaf{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(110px) rotate(220deg);opacity:0}}
      #gBanner{position:absolute;left:50%;top:12px;transform:translateX(-50%) translateY(-12px);background:#fffdf6;border:1.5px solid #e7ddc6;border-radius:14px;padding:8px 16px;font-family:'Gowun Batang',serif;font-size:13px;font-weight:700;color:#6f9258;box-shadow:0 8px 24px rgba(60,74,58,.1);opacity:0;transition:.4s;z-index:80;white-space:nowrap}
      #gBanner.on{opacity:1;transform:translateX(-50%) translateY(0)}
      .g-chTitle{font-family:'Gowun Batang',serif;font-size:14px;font-weight:700;color:#3c4a3a;margin:4px 4px 8px}
      .g-chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}
      .g-chip{flex:0 0 auto;background:#fffdf6;border:1.5px solid #e7ddc6;border-radius:14px;padding:9px 11px;cursor:pointer;text-align:center;min-width:78px;box-shadow:0 4px 14px rgba(60,74,58,.08);font-family:inherit;position:relative}
      .g-chip .gk{font-size:22px;line-height:1}
      .g-chip .gn{font-size:11px;font-weight:700;color:#3c4a3a;margin-top:3px;white-space:nowrap}
      .g-chip .gc{font-size:9px;color:#7c8a76;margin-top:1px}
      .g-chip.done{opacity:.6}
      .g-foot{display:flex;align-items:center;justify-content:space-between;margin:12px 4px 0;font-size:11px;color:#a99}
      .g-foot b{color:#6f9258}
      .g-redeem{background:#6f9258;color:#fff;border:none;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
    `;
    document.head.appendChild(s);
    // 폰트 (있으면 중복 무시됨)
    if(!document.getElementById('gardenFont')){
      const l=document.createElement('link'); l.id='gardenFont'; l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap';
      document.head.appendChild(l);
    }
  }

  function renderGarden(){
    const h = host(); if(!h) return;
    injectCss();
    h.innerHTML = `
      <div style="padding:0 12px 16px">
        <div id="gardenScene">
          <div class="g-sun"></div>
          <div class="g-cloud" style="top:28px;left:34px;width:52px;height:17px"></div>
          <div class="g-cloud" style="top:48px;left:92px;width:32px;height:11px;opacity:.7"></div>
          <div class="g-cloud" style="top:20px;left:150px;width:40px;height:14px;opacity:.85"></div>
          <div class="g-hill"></div><div class="g-hill b"></div>
          <div class="g-path" id="gPath"></div>
          <div id="gObjects"></div>
          <div id="gFx"></div>
          <div id="gBanner"></div>
        </div>
        <div class="g-chTitle">오늘의 챌린지 — 인증하면 정원이 자라요</div>
        <div class="g-chips" id="gChips"></div>
        <div class="g-foot">
          <span>총 인증 <b id="gTotal">0</b>회 · 돌아온 동물 <b id="gAnimals">0</b>종</span>
          <span id="gRedeemWrap"></span>
        </div>
      </div>`;
    renderObjects();
    renderChips();
  }

  function place(art,x,y,z,pop){
    const d=document.createElement('div'); d.className='g-obj'+(pop?' g-pop':'');
    d.style.cssText=`left:${x}%;top:${y}%;z-index:${z||Math.round(y)}`;
    d.innerHTML=art; document.getElementById('gObjects').appendChild(d);
  }
  function renderObjects(){
    const o=document.getElementById('gObjects'); if(!o) return;
    o.innerHTML='';
    for(let i=0;i<Math.min(G.tree,TREE_SLOTS.length);i++) place(ART.tree,TREE_SLOTS[i][0],TREE_SLOTS[i][1],30+i);
    for(let i=0;i<VEG_SLOTS.length;i++){ const lvl=G.veggie-i; if(lvl<=0) continue; place(lvl>=3?ART.veg2:lvl===2?ART.veg1:ART.veg0, VEG_SLOTS[i][0],VEG_SLOTS[i][1]); }
    for(let i=0;i<Math.min(G.flower,FLOWER_SLOTS.length);i++) place(ART.flower,FLOWER_SLOTS[i][0],FLOWER_SLOTS[i][1]);
    if(G.tumbler>0) place(ART.well,WELL[0],WELL[1]);
    if(G.bus>0) place(ART.busstop,BUSSTOP[0],BUSSTOP[1]);
    if(G.straw>0){ place(ART.pond,POND[0],POND[1],40); for(let i=0;i<Math.min(G.straw,3);i++) place(ART.turtle,POND[0]-10+i*10,POND[1]-1,50+i); }
    if(G.bike>0) place(ART.bike,BIKE[0],BIKE[1],55);
    if(G.animals.includes('squirrel')) place(ART.squirrel,28,44,70);
    const p=document.getElementById('gPath'); if(p) p.style.opacity=(G.bike>0||G.bus>0)?'1':'0';
    const tot=document.getElementById('gTotal'); if(tot) tot.textContent=G.veggie+G.tree+G.bike+G.bus+G.tumbler+G.straw+G.flower;
    const an=document.getElementById('gAnimals'); if(an) an.textContent=G.animals.length;
    // 수확물 교환(쿠폰) 통로 유지
    const rw=document.getElementById('gRedeemWrap');
    if(rw){ rw.innerHTML = (typeof window.openExchangeRequest==='function') ? `<button class="g-redeem" onclick="window.openExchangeRequest()">🎟️ 수확물 교환</button>` : ''; }
  }

  function renderChips(){
    const c=document.getElementById('gChips'); if(!c) return;
    const active=activeList();
    if(!active.length){
      c.innerHTML=`<div style="color:#7c8a76;font-size:12px;padding:6px 2px">참여 중인 챌린지가 없어요 · <a onclick="goPage('chal')" style="color:#6f9258;font-weight:700;cursor:pointer">참여하기</a></div>`;
      return;
    }
    const today=new Date().toISOString().split('T')[0];
    c.innerHTML=active.map(ac=>{
      const m=findMission(ac.missionId);
      const kind=classify(m||{name:ac.challengeTitle});
      const ico={veggie:ART.veg1,tree:ART.tree,bike:ART.bike,bus:ART.busstop,tumbler:ART.tumbler,straw:ART.cup,flower:ART.flower}[kind];
      const n=freqN(ac); const total=n*(ac.weeks||2);
      const done=(window.UDATA?.completedDates||{})[ac.challengeId]||0;
      const doneToday=(window.UDATA?.verifiedDates||{})[ac.challengeId]===today;
      return `<div class="g-chip ${doneToday?'done':''}" onclick="gardenCert(${ac.challengeId})">
        <div class="gk" style="display:flex;justify-content:center;align-items:flex-end;height:26px">${ico}</div>
        <div class="gn">${ac.challengeTitle||(m?m.name:'미션')}</div>
        <div class="gc">${done}/${total}${doneToday?' · 오늘 완료':''}</div>
      </div>`;
    }).join('');
  }

  /* ---------- 연출 ---------- */
  function pctToPx(xp,yp){ const r=scene().getBoundingClientRect(); return {x:r.width*xp/100, y:r.height*yp/100}; }
  function floatText(text,xp,yp){
    const fxd=document.getElementById('gFx'); if(!fxd) return;
    const t=document.createElement('div');
    t.style.cssText=`position:absolute;left:${xp}%;top:${yp}%;transform:translate(-50%,0);font-family:'Gowun Batang',serif;font-size:12px;font-weight:700;color:#6f9258;background:rgba(255,253,246,.92);padding:3px 10px;border-radius:10px;opacity:0;animation:gFloatUp 1.4s ease-out forwards;box-shadow:0 4px 10px rgba(0,0,0,.08)`;
    t.textContent=text; fxd.appendChild(t); setTimeout(()=>t.remove(),1500);
  }
  function leaves(x,y){ const fxd=document.getElementById('gFx'); if(!fxd) return;
    for(let i=0;i<6;i++){ const l=document.createElement('div');
      l.style.cssText=`position:absolute;left:${x+(Math.random()*40-20)}px;top:${y}px;opacity:0;animation:gLeaf ${1+Math.random()}s ease-in forwards;animation-delay:${Math.random()*.3}s`;
      l.innerHTML=ART.leaf; fxd.appendChild(l); setTimeout(()=>l.remove(),1700); } }
  function drops(x,y){ const fxd=document.getElementById('gFx'); if(!fxd) return;
    for(let i=0;i<5;i++){ const d=document.createElement('div');
      d.style.cssText=`position:absolute;left:${x+(Math.random()*24-12)}px;top:${y}px;width:5px;height:8px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#9ad0db;opacity:0;animation:gDrop .7s ease-in forwards;animation-delay:${i*.06}s`;
      fxd.appendChild(d); setTimeout(()=>d.remove(),900); } }
  function crosser(art,dur,anim){ const fxd=document.getElementById('gFx'); if(!fxd) return;
    const c=document.createElement('div'); c.className='g-cross'; c.style.animation=`${anim} ${dur}s ease-in-out forwards`;
    c.innerHTML=art; fxd.appendChild(c); setTimeout(()=>c.remove(),dur*1000+60); }

  function playMoment(kind){
    if(!isVisible()) return;
    if(kind==='veggie'){ const s=VEG_SLOTS[Math.min(G.veggie-1,VEG_SLOTS.length-1)]; const p=pctToPx(s[0],s[1]-12); drops(p.x,p.y); floatText('물 주는 중',s[0],s[1]-30); }
    else if(kind==='tree'){ const s=TREE_SLOTS[Math.min(G.tree-1,TREE_SLOTS.length-1)]; const p=pctToPx(s[0],s[1]-18); leaves(p.x,p.y); floatText('종이 한 장 = 나무 한 그루',s[0],s[1]-24); }
    else if(kind==='bike'){ crosser(ART.bike,2.6,'gRide'); floatText('자전거로 한 바퀴!',56,40); }
    else if(kind==='bus'){ crosser(ART.bus,3.0,'gBus'); floatText('버스 출발',60,40); }
    else if(kind==='tumbler'){ floatText('일회용컵 대신 텀블러',WELL[0]+12,WELL[1]-22); }
    else if(kind==='straw'){
      const fxd=document.getElementById('gFx');
      if(fxd){ const ring=document.createElement('div');
        ring.style.cssText=`position:absolute;left:${POND[0]}%;top:${POND[1]-2}%;transform:translate(-50%,-50%);width:20px;height:10px;border:2px solid #9ad0db;border-radius:50%`;
        ring.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:.9},{transform:'translate(-50%,-50%) scale(3)',opacity:0}],{duration:900,fill:'forwards'});
        fxd.appendChild(ring); setTimeout(()=>ring.remove(),900); }
      floatText('빨대 없이 — 바다거북이 안전해요',POND[0],POND[1]-22);
    }
    else { const s=FLOWER_SLOTS[Math.min(G.flower-1,FLOWER_SLOTS.length-1)]; floatText('+ 꽃 한 송이',s[0],s[1]-22); }
  }

  /* ---------- 멸종위기종 ---------- */
  let bTimer=null;
  function banner(text){ const b=document.getElementById('gBanner'); if(!b) return; b.textContent=text; b.classList.add('on'); clearTimeout(bTimer); bTimer=setTimeout(()=>b.classList.remove('on'),2800); }
  function checkAnimals(){
    let added=false;
    if(G.straw>=1 && !G.animals.includes('turtle')){ G.animals.push('turtle'); added=true; setTimeout(()=>banner('🐢 바다거북이 정원에 돌아왔어요'),400); }
    if((G.bike+G.bus)>=3 && !G.animals.includes('squirrel')){ G.animals.push('squirrel'); added=true; setTimeout(()=>banner('하늘다람쥐가 나무에 찾아왔어요'),400); }
    return added;
  }

  /* ---------- saveMission 후킹 → 정원 성장 ---------- */
  function hookSave(){
    if(window._gardenHookedSave) return;
    const orig=window.saveMission;
    if(typeof orig!=='function'){ setTimeout(hookSave,1000); return; }
    window.saveMission=async function(uid,m){
      const res=await orig.apply(this,arguments);
      try{
        if(res!==false && uid===(window.ME&&window.ME.uid) && G){
          const kind=classify(m);
          G[kind]=(G[kind]||0)+1;
          checkAnimals();
          await saveGarden();
          if(isVisible()){ renderObjects(); playMoment(kind); }
        }
      }catch(e){ console.log('[garden] grow err:', e.message); }
      return res;
    };
    window._gardenHookedSave=true;
  }

  /* ---------- page-map 인수 ---------- */
  function mount(){
    const mp=document.getElementById('page-map'); if(!mp) return;
    if(!host()){ mp.innerHTML='<div id="farmGameMain"></div>'; }
    if(!scene()) renderGarden();
  }
  window.drawMap=function(){ mount(); renderObjects(); renderChips(); };

  function boot(){
    if(!window.FB || !window.ME){ setTimeout(boot,500); return; }
    loadGarden();
    mount();
    hookSave();
    const mp=document.getElementById('page-map');
    if(mp){ new MutationObserver(()=>{ if(!scene()) mount(); else renderChips(); }).observe(mp,{childList:true,subtree:true}); }
    // 챌린지 참여/취소 시 칩 갱신
    const _rtq=window.renderTodayQuests;
    window.renderTodayQuests=function(uid){ if(_rtq) _rtq(uid); renderChips(); };
    console.log('%c[garden v1] 🌱 챌린지로 자라는 정원','color:#fff;background:#6f9258;padding:4px 8px;border-radius:4px;font-weight:bold');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1800));
  else setTimeout(boot,1800);

})();
