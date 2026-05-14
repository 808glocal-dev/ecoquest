(function(){

  // ════════════════════════════════════════════════════════
  // 🎨 PALETTES — 토끼 색깔 (그대로 유지, 토끼는 농부 캐릭터로)
  // ════════════════════════════════════════════════════════
  const PALETTES = [
    {body:'#FFFFFF', shade:'#F0E0CE', stroke:'#8B6F47', ear:'#FFB6C1', label:'하양'},
    {body:'#F5E6D3', shade:'#D8B898', stroke:'#7D5E47', ear:'#7D5E47', label:'갈얼룩'},
    {body:'#E8E8E8', shade:'#C8C8C8', stroke:'#6B6B6B', ear:'#A9A9A9', label:'회색'},
    {body:'#F5DEB3', shade:'#D8B888', stroke:'#7D5E47', ear:'#C8A878', label:'베이지'},
    {body:'#A0826D', shade:'#7D5E47', stroke:'#5C3A1E', ear:'#5C3A1E', label:'갈색'},
  ];

  // ════════════════════════════════════════════════════════
  // 🌍 5단계 지구 시스템 (그대로)
  // ════════════════════════════════════════════════════════
  const STAGES = [
    {id:0, min:0,  name:'회색 도시',  bg:'linear-gradient(180deg,#a8a8a8 0%,#888 50%,#666 100%)',
     skyDecor:[{e:'💨',top:8,left:24,size:22,op:.7},{e:'🏭',top:14,right:30,size:22,op:.6},{e:'🌫️',top:36,left:'45%',size:14,op:.5}],
     groundDecor:[{e:'🗑️',bottom:6,left:18,size:16},{e:'🚮',bottom:8,left:200,size:15},{e:'⚙️',bottom:6,right:60,size:13,op:.5}],
     msg:'지구가 아파요', sub:'당신의 작은 행동이 변화의 시작이에요', mask:true},
    {id:1, min:1,  name:'새싹',        bg:'linear-gradient(180deg,#bee9d4 0%,#A8DC8E 50%,#8BC56F 100%)',
     skyDecor:[{e:'☁️',top:8,left:24,size:22,op:.85},{e:'🌤️',top:6,right:14,size:22}],
     groundDecor:[{e:'🌱',bottom:6,left:18,size:14},{e:'🌿',bottom:4,left:80,size:13},{e:'🌷',bottom:8,left:200,size:14},{e:'🌱',bottom:6,right:60,size:13}],
     msg:'당신이 시작했어요', sub:'첫 풀이 자라났어요', mask:false},
    {id:2, min:5,  name:'들판',        bg:'linear-gradient(180deg,#87CEEB 0%,#B5DCF0 45%,#A8DC8E 50%,#76B947 100%)',
     skyDecor:[{e:'☁️',top:8,left:24,size:22,op:.85},{e:'☀️',top:6,right:14,size:24},{e:'🦋',top:32,left:'50%',size:16},{e:'🐦',top:18,right:36,size:16,op:.8}],
     groundDecor:[{e:'🌷',bottom:8,left:18,size:16},{e:'🌼',bottom:6,left:90,size:15},{e:'🌾',bottom:12,left:160,size:14},{e:'🌷',bottom:8,right:60,size:16},{e:'🌼',bottom:10,right:20,size:18}],
     msg:'잃어버린 친구가 돌아와요', sub:'나비와 새가 다시 찾아왔어요', mask:false},
    {id:3, min:20, name:'숲',          bg:'linear-gradient(180deg,#7AB85F 0%,#A8DC8E 40%,#5a9a3a 100%)',
     skyDecor:[{e:'☀️',top:6,right:14,size:22,op:.9},{e:'🦋',top:30,left:'45%',size:16},{e:'🌳',top:50,left:8,size:34,op:.85},{e:'🌳',top:48,right:6,size:32,op:.85}],
     groundDecor:[{e:'🌲',bottom:6,left:60,size:24},{e:'🍄',bottom:4,left:130,size:14},{e:'💧',bottom:14,left:200,size:14},{e:'🐿️',bottom:8,right:80,size:16},{e:'🌲',bottom:6,right:18,size:22}],
     msg:'생태계가 살아나요', sub:'나무와 시냇물이 흐르는 숲이 됐어요', mask:false},
    {id:4, min:50, name:'회복된 지구', bg:'linear-gradient(180deg,#1a1a3e 0%,#3d2966 40%,#5a9a3a 75%,#76B947 100%)',
     skyDecor:[{e:'🌙',top:8,right:14,size:24},{e:'⭐',top:18,left:50,size:14},{e:'⭐',top:36,left:'40%',size:12,op:.9},{e:'✨',top:8,left:140,size:14},{e:'⭐',top:28,right:50,size:14,op:.9}],
     groundDecor:[{e:'🌳',bottom:6,left:18,size:24},{e:'🌸',bottom:4,left:80,size:14},{e:'✨',bottom:18,left:160,size:14},{e:'🌳',bottom:6,right:80,size:24},{e:'🌸',bottom:4,right:30,size:14}],
     msg:'당신이 지킨 작은 지구', sub:'별빛 아래 평화로운 농장이 됐어요', mask:false},
  ];

  // ════════════════════════════════════════════════════════
  // 🌱 농작물 카탈로그 — MVP 12종 (일반 6 + 못난이 6)
  // ════════════════════════════════════════════════════════
  const CROPS = [
    // 일반 (10P 일반 씨앗으로 나올 수 있음)
    {id:'tomato',   name:'토마토',     emoji:'🍅', rarity:'common', story:'붉게 잘 익은 평범한 챔피언'},
    {id:'carrot',   name:'당근',       emoji:'🥕', rarity:'common', story:'주황빛 고운 표준 미인'},
    {id:'lettuce',  name:'상추',       emoji:'🥬', rarity:'common', story:'쌈 싸 먹기 딱 좋은 잎'},
    {id:'corn',     name:'옥수수',     emoji:'🌽', rarity:'common', story:'한 알 한 알 알찬 여름'},
    {id:'eggplant', name:'가지',       emoji:'🍆', rarity:'common', story:'반짝이는 보랏빛'},
    {id:'cucumber', name:'오이',       emoji:'🥒', rarity:'common', story:'시원한 여름의 맛'},
    // 못난이 (25P 못난이 씨앗으로만 나옴, 도감 핵심)
    {id:'tomato_twin',    name:'쌍둥이 토마토', emoji:'🍅', rarity:'ugly', story:'두 알이 붙어 자란 우정 토마토. 맛은 두 배예요.'},
    {id:'carrot_split',   name:'갈래 당근',     emoji:'🥕', rarity:'ugly', story:'땅속 돌을 피해 자란 용감한 당근'},
    {id:'lettuce_giant',  name:'거인 상추',     emoji:'🥬', rarity:'ugly', story:'너무 커서 상점이 거절한 든든이'},
    {id:'corn_short',     name:'꼬마 옥수수',   emoji:'🌽', rarity:'ugly', story:'다 못 자랐지만 단맛은 진해요'},
    {id:'eggplant_dot',   name:'점박이 가지',   emoji:'🍆', rarity:'ugly', story:'햇볕 사랑이 너무 진했나봐요'},
    {id:'cucumber_curve', name:'휜 오이',       emoji:'🥒', rarity:'ugly', story:'여름이 너무 더웠을 뿐이에요'},
  ];

  const STAGE_LABELS = ['씨앗', '새싹', '자라는 중', '수확 가능'];
  const GRID_SIZE = 6; // 텃밭 6칸 (3x2)
  const SEED_PRICE = {common: 10, ugly: 25};

  // ════════════════════════════════════════════════════════
  // 🔧 헬퍼
  // ════════════════════════════════════════════════════════
  function getStage(co2){ for(let i=STAGES.length-1;i>=0;i--){if(co2>=STAGES[i].min)return STAGES[i];} return STAGES[0]; }
  function getNextStage(co2){ const cur=getStage(co2); const idx=STAGES.indexOf(cur); return idx<STAGES.length-1?STAGES[idx+1]:null; }
  function getImpact(co2){ return {trees:(co2/21.4).toFixed(1), carKm:Math.round(co2/0.21), cups:Math.round(co2/0.011), sqm:Math.round(co2*0.6)}; }
  function getCrop(id){ return CROPS.find(c => c.id === id); }
  function randomCrop(rarity){ const arr = CROPS.filter(c => c.rarity === rarity); return arr[Math.floor(Math.random()*arr.length)]; }
  function stageEmoji(stage, cropId){
    if(stage === 0) return '💧';
    if(stage === 1) return '🌱';
    if(stage === 2) return '🌿';
    return getCrop(cropId)?.emoji || '✨'; // 수확 가능 = 작물 모습
  }

  let _myFarm = null, _myCo2 = 0, _lastStageId = -1, _lastDexCount = 0;
  let _bunnyChars = [], _animLoop = null, _lastSpawnedKey = '', _petTimer = 0;

  // ════════════════════════════════════════════════════════
  // 📊 CO₂ 가져오기 (기존과 동일)
  // ════════════════════════════════════════════════════════
  async function refreshMyCo2(){
    if(!window.ME) return 0;
    if(window.UDATA){
      const keys = ['co2Saved','totalCo2','co2','totalCO2','CO2','co2_saved','co2Reduced','co2_reduced'];
      for(const k of keys){
        const v = Number(window.UDATA[k]);
        if(!isNaN(v) && v > 0){ _myCo2 = v; return _myCo2; }
      }
    }
    try {
      const q = window.FB.query(
        window.FB.collection(window.FB.db, "missionLogs"),
        window.FB.where("uid", "==", window.ME.uid)
      );
      const snap = await window.FB.getDocs(q);
      let sum = 0, count = 0;
      snap.forEach(d => {
        const dt = d.data();
        const v = Number(dt.co2 || dt.co2Reduced || 0);
        if(!isNaN(v)) sum += v;
        count++;
      });
      if(sum > 0){ _myCo2 = sum; return _myCo2; }
      if(count > 0){ _myCo2 = count * 0.5; return _myCo2; }
    } catch(e){console.log('[farm] CO2 fetch 실패:', e.message);}
    _myCo2 = 0;
    return 0;
  }

  // ════════════════════════════════════════════════════════
  // 🐰 토끼 SVG (그대로)
  // ════════════════════════════════════════════════════════
  function bunnySvg(colorIdx, mood, withMask){
    const p = PALETTES[Math.min(colorIdx, 4)];
    let eye;
    if(mood==='sleep') eye = `<path d="M 19 24 Q 22 27 25 24" stroke="${p.stroke}" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M 31 24 Q 34 27 37 24" stroke="${p.stroke}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    else if(mood==='happy') eye = `<path d="M 19 26 Q 22 23 25 26" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M 31 26 Q 34 23 37 26" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    else eye = `<ellipse cx="22" cy="26" rx="2.6" ry="3.2" fill="#1a1a1a"/><ellipse cx="34" cy="26" rx="2.6" ry="3.2" fill="#1a1a1a"/><ellipse cx="23" cy="24.8" rx="1.2" ry="1.5" fill="#fff"/><ellipse cx="35" cy="24.8" rx="1.2" ry="1.5" fill="#fff"/><circle cx="21.3" cy="27.3" r=".4" fill="#fff" opacity=".7"/><circle cx="33.3" cy="27.3" r=".4" fill="#fff" opacity=".7"/>`;
    const mask = withMask ? `<g><ellipse cx="28" cy="35" rx="11" ry="5" fill="#A8E6F0" stroke="#5d9aaa" stroke-width=".5" opacity=".95"/><line x1="17" y1="35" x2="14" y2="32" stroke="#5d9aaa" stroke-width=".5"/><line x1="39" y1="35" x2="42" y2="32" stroke="#5d9aaa" stroke-width=".5"/><line x1="28" y1="32" x2="28" y2="38" stroke="#88c5d3" stroke-width=".4" opacity=".5"/></g>` : '';
    return `<svg viewBox="0 0 60 70" style="width:60px;height:70px;display:block;overflow:visible">
      <ellipse cx="30" cy="68" rx="17" ry="1.5" fill="${p.stroke}" opacity=".15"/>
      <path d="M 16 52 C 13 65 22 66 30 65 C 38 66 47 65 44 52 C 46 42 38 38 30 38 C 22 38 14 42 16 52 Z" fill="${p.body}" stroke="${p.stroke}" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M 38 42 C 44 46 46 56 44 62 C 41 60 38 50 38 42 Z" fill="${p.shade}" opacity=".55"/>
      <ellipse cx="28" cy="26" rx="16" ry="14.5" fill="${p.body}" stroke="${p.stroke}" stroke-width=".8"/>
      <path d="M 36 14 C 42 16 43 28 41 36 C 38 37 32 37 30 35 C 32 28 33 18 36 14 Z" fill="${p.shade}" opacity=".45"/>
      <path d="M 19 14 C 13 3 17 0 20 1 C 23 4 24 12 22 16 Z" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <path d="M 19 13 C 16 5 18 3 19 3 C 21 5 22 11 21 14 Z" fill="${p.ear}" opacity=".85"/>
      <path d="M 36 12 C 35 3 39 0 41 1 C 43 4 41 11 38 14 Z" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <path d="M 36.5 11 C 36 4 38 3 39 3 C 40 5 39 10 37 12 Z" fill="${p.ear}" opacity=".85"/>
      ${eye}
      <line x1="13" y1="32" x2="5" y2="31" stroke="${p.stroke}" stroke-width=".5" stroke-linecap="round" opacity=".7"/>
      <line x1="13" y1="33.5" x2="4" y2="34" stroke="${p.stroke}" stroke-width=".5" stroke-linecap="round" opacity=".7"/>
      <line x1="38" y1="33" x2="45" y2="32" stroke="${p.stroke}" stroke-width=".4" stroke-linecap="round" opacity=".6"/>
      <path d="M 26 32 Q 28 31.5 29 32.5 Q 29 34 27.5 34.5 Q 25.5 34 25 32.8 Q 25.5 32 26 32 Z" fill="#FF9FB0" stroke="${p.stroke}" stroke-width=".4"/>
      <path d="M 27 34.5 L 27 35.8" stroke="${p.stroke}" stroke-width=".7" stroke-linecap="round"/>
      <path d="M 27 35.8 Q 25 36.8 24 36.3" stroke="${p.stroke}" stroke-width=".7" fill="none" stroke-linecap="round"/>
      <path d="M 27 35.8 Q 29 36.8 30 36.3" stroke="${p.stroke}" stroke-width=".7" fill="none" stroke-linecap="round"/>
      <ellipse cx="22" cy="60" rx="4" ry="3" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <ellipse cx="36" cy="60" rx="4" ry="3" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <circle cx="46" cy="50" r="3.5" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      ${mask}
    </svg>`;
  }

  // ════════════════════════════════════════════════════════
  // 💾 데이터 로드 (기존 bunnies 컬렉션에 농장 필드 추가)
  // ════════════════════════════════════════════════════════
  async function loadFarm(){
    if(!window.ME || !window.FB) return;
    try {
      const ref = window.FB.doc(window.FB.db, "bunnies", window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      let data = snap.exists() ? snap.data() : {};

      // 기본값
      if(!data.bunnies || !Array.isArray(data.bunnies)) data.bunnies = [{name:"꼬미", color:0}];
      if(!data.seeds) data.seeds = {common: 0, ugly: 0};
      if(!Array.isArray(data.garden) || data.garden.length !== GRID_SIZE){
        data.garden = Array(GRID_SIZE).fill(null);
      }
      if(!data.dex) data.dex = {};       // {cropId: 수확횟수}
      if(!data.harvest) data.harvest = {}; // {cropId: 보유량}

      // 기존 carrots → seeds.common 마이그레이션 (한 번만)
      if(data.carrots && data.carrots > 0){
        data.seeds.common = (data.seeds.common || 0) + data.carrots;
        data.carrots = 0;
      }

      _myFarm = data;
      await refreshMyCo2();
      _lastStageId = getStage(_myCo2).id;
      _lastDexCount = Object.keys(_myFarm.dex).length;

      await window.FB.setDoc(ref, _myFarm); // 마이그레이션 저장
      renderFarmMap();
    } catch(e){console.log("[farm] 로드 실패:", e.message);}
  }

  async function saveFarm(){
    if(!window.ME || !_myFarm) return;
    try {
      await window.FB.setDoc(window.FB.doc(window.FB.db, "bunnies", window.ME.uid), _myFarm);
      renderFarmStats();
      // 토끼 재배치 (도감 진행도로 가족 늘어났을 때)
      const cnt = (_myFarm.bunnies || []).length;
      const colors = (_myFarm.bunnies || []).map(b=>b.color).join(',');
      const stageId = getStage(_myCo2).id;
      const newKey = `${cnt}_${colors}_${stageId}`;
      if(newKey !== _lastSpawnedKey){ spawnBunnies(_myFarm.bunnies || []); applyStageBg(getStage(_myCo2)); }
    } catch(e){console.log("[farm] 저장 실패:", e.message);}
  }

  // ════════════════════════════════════════════════════════
  // 🎯 단계업 / 도감 마일스톤 체크
  // ════════════════════════════════════════════════════════
  function checkStageUp(){
    const cur = getStage(_myCo2);
    if(_lastStageId >= 0 && cur.id > _lastStageId){
      const prevId = _lastStageId;
      _lastStageId = cur.id;
      setTimeout(() => showStageUp(cur), 800);
    } else _lastStageId = cur.id;
  }

  async function checkDexMilestone(){
    if(!_myFarm) return;
    const cnt = Object.keys(_myFarm.dex).length;
    // 6/12 도달 = 새 토끼 영입, 12/12 도달 = 또 하나
    const milestones = [{at:6, name:'보리'}, {at:12, name:'마루'}];
    for(const m of milestones){
      if(_lastDexCount < m.at && cnt >= m.at){
        // 이미 그 이름의 토끼 없으면 영입
        if(!_myFarm.bunnies.find(b => b.name === m.name)){
          _myFarm.bunnies.push({name: m.name, color: Math.floor(Math.random()*5)});
          await saveFarm();
          setTimeout(() => window.toast(`🎉 도감 ${m.at}/12! "${m.name}" 농부가 합류했어요!`), 600);
        }
      }
    }
    _lastDexCount = cnt;
  }

  // ════════════════════════════════════════════════════════
  // 🏗️ 페이지 초기화
  // ════════════════════════════════════════════════════════
  function initFarmOnMap(){
    const tryAdd = () => {
      const mapPage = document.getElementById("page-map");
      if(!mapPage) return false;
      if(document.getElementById("farmGameMain")) return true;
      mapPage.innerHTML = '<div id="farmGameMain"><div style="text-align:center;padding:40px;color:#888;font-size:13px">🌱 농장 로딩 중...</div></div>';
      window.drawMap = function(){ renderFarmMap(); refreshAndUpdate(); };
      loadFarm();
      return true;
    };
    if(!tryAdd()) setTimeout(initFarmOnMap, 1000);
  }

  async function refreshAndUpdate(){
    const prev = _myCo2;
    await refreshMyCo2();
    if(prev !== _myCo2){
      renderFarmStats();
      const stage = getStage(_myCo2);
      applyStageBg(stage);
      checkStageUp();
    }
  }

  // ════════════════════════════════════════════════════════
  // 🖼️ 전체 렌더 (헤더 + 풍경 + 텃밭 + 도감)
  // ════════════════════════════════════════════════════════
  function renderFarmMap(){
    const c = document.getElementById("farmGameMain");
    if(!c) return;
    if(!_myFarm){ c.innerHTML = '<div style="text-align:center;padding:40px;color:#888;font-size:13px">🌱 농장 데이터 로딩 중...</div>'; return; }
    const stage = getStage(_myCo2);
    const next = getNextStage(_myCo2);

    c.innerHTML = `
      <!-- 헤더: 지구 단계 -->
      <div style="margin:12px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:14px;padding:10px 14px;color:#fff">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div>
            <div style="font-size:9px;color:rgba(255,255,255,.6);font-weight:600;letter-spacing:1px">🌍 내 지구 — STAGE ${stage.id+1}/5</div>
            <div style="font-size:14px;font-weight:900;color:#a8f0c6;margin-top:1px">${stage.name} · CO₂ ${_myCo2.toFixed(1)}kg</div>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,.7);text-align:right">${next ? `다음: ${next.name}<br/><b style="color:#a8f0c6">${(next.min - _myCo2).toFixed(1)}kg 더!</b>` : '<b style="color:#FFD700">최종 단계! ✨</b>'}</div>
        </div>
        ${next ? `<div style="height:5px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden"><div style="width:${Math.min(100, ((_myCo2-stage.min)/(next.min-stage.min))*100)}%;height:100%;background:linear-gradient(90deg,#a8f0c6,#FFD700);transition:width .8s"></div></div>` : ''}
      </div>

      <!-- 풍경 (토끼 농부) -->
      <div id="bunnyPlayground" style="position:relative;margin:0 12px;height:260px;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);user-select:none;transition:background 1.5s">
        <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:12px;padding:3px 10px;font-size:10px;color:#444;font-weight:600;pointer-events:none;z-index:5">"${stage.msg}" · 농부 탭하면 이름</div>
      </div>

      <!-- 농장 통계 영역 (텃밭, 도감, 액션) -->
      <div id="farmStats"></div>
    `;
    applyStageBg(stage);
    renderFarmStats();
    setTimeout(() => spawnBunnies(_myFarm.bunnies || []), 100);
  }

  function applyStageBg(stage){
    const pg = document.getElementById('bunnyPlayground');
    if(!pg) return;
    pg.style.background = stage.bg;
    pg.querySelectorAll('.stage-decor').forEach(el => el.remove());
    const decors = [...(stage.skyDecor||[]).map(d=>({...d,zone:'sky'})), ...(stage.groundDecor||[]).map(d=>({...d,zone:'ground'}))];
    decors.forEach(d => {
      const el = document.createElement('div');
      el.className = 'stage-decor';
      let style = `position:absolute;font-size:${d.size||14}px;opacity:${d.op||.85};pointer-events:none;z-index:2;`;
      if(d.top !== undefined) style += `top:${typeof d.top==='string'?d.top:d.top+'px'};`;
      if(d.bottom !== undefined) style += `bottom:${d.bottom}px;`;
      if(d.left !== undefined) style += `left:${typeof d.left==='string'?d.left:d.left+'px'};`;
      if(d.right !== undefined) style += `right:${d.right}px;`;
      el.style.cssText = style;
      el.textContent = d.e;
      pg.appendChild(el);
    });
  }

  // ════════════════════════════════════════════════════════
  // 📋 통계 / 텃밭 / 도감 카드
  // ════════════════════════════════════════════════════════
  function renderFarmStats(){
    const c = document.getElementById("farmStats");
    if(!c || !_myFarm) return;
    const seeds = _myFarm.seeds || {common:0, ugly:0};
    const garden = _myFarm.garden || [];
    const dex = _myFarm.dex || {};
    const dexCount = Object.keys(dex).length;
    const myPoints = window.UDATA?.point || 0;
    const imp = getImpact(_myCo2);
    const bunnies = _myFarm.bunnies || [];

    // 텃밭 그리드 HTML
    let gridHTML = '';
    for(let i=0; i<GRID_SIZE; i++){
      const plot = garden[i];
      if(!plot){
        gridHTML += `<div onclick="openPlantModal(${i})" style="aspect-ratio:1;background:#fff;border:2px dashed #c8a878;border-radius:12px;display:flex;flex-direction:column;justify-content:center;align-items:center;cursor:pointer;transition:all .2s" onmouseover="this.style.background='#fff8e1'" onmouseout="this.style.background='#fff'"><div style="font-size:24px;opacity:.3">➕</div><div style="font-size:9px;color:#aaa;font-weight:700;margin-top:2px">심기</div></div>`;
      } else {
        const isReady = plot.stage >= 3;
        const emoji = stageEmoji(plot.stage, plot.cropId);
        const crop = getCrop(plot.cropId);
        const isUgly = crop?.rarity === 'ugly';
        gridHTML += `<div onclick="${isReady ? `harvestCrop(${i})` : `peekCrop(${i})`}" style="aspect-ratio:1;background:${isReady ? 'linear-gradient(135deg,#fff8e1,#ffe082)' : (isUgly?'#fff5f8':'#f0fbf4')};border:2px solid ${isReady ? '#FF8F00' : (isUgly?'#FFB6C1':'#a8e6c5')};border-radius:12px;display:flex;flex-direction:column;justify-content:center;align-items:center;cursor:pointer;position:relative;${isReady ? 'animation:harvestPulse 1.2s infinite' : ''}"><div style="font-size:${plot.stage>=2?28:22}px">${emoji}</div><div style="font-size:8px;color:#666;font-weight:700;margin-top:2px">${STAGE_LABELS[plot.stage]}</div>${isUgly?'<div style="position:absolute;top:3px;right:3px;background:#FFB6C1;color:#fff;font-size:7px;font-weight:900;padding:1px 4px;border-radius:6px">못난이</div>':''}${isReady?'<div style="position:absolute;top:3px;left:3px;background:#FF8F00;color:#fff;font-size:7px;font-weight:900;padding:1px 4px;border-radius:6px">탭!</div>':''}</div>`;
      }
    }

    // 도감 HTML
    let dexHTML = '';
    CROPS.forEach(crop => {
      const collected = dex[crop.id];
      const isUgly = crop.rarity === 'ugly';
      dexHTML += `<div onclick="${collected ? `showCropStory('${crop.id}')` : ''}" style="aspect-ratio:1;background:${collected?(isUgly?'#fff5f8':'#f0fbf4'):'#f5f5f5'};border:1.5px solid ${collected?(isUgly?'#FFB6C1':'#a8e6c5'):'#e0e0e0'};border-radius:10px;display:flex;flex-direction:column;justify-content:center;align-items:center;cursor:${collected?'pointer':'default'};position:relative"><div style="font-size:22px;filter:${collected?'none':'grayscale(1) opacity(.3)'}">${collected?crop.emoji:'❓'}</div><div style="font-size:8px;color:${collected?'#444':'#bbb'};font-weight:700;margin-top:2px;text-align:center;line-height:1.1">${collected?crop.name:'???'}</div>${collected && collected>1?`<div style="position:absolute;top:2px;right:2px;background:#1B5E20;color:#fff;font-size:8px;font-weight:900;padding:1px 4px;border-radius:6px">×${collected}</div>`:''}${isUgly && collected?'<div style="position:absolute;top:2px;left:2px;font-size:9px">💔</div>':''}</div>`;
    });

    c.innerHTML = `
      <div style="margin:12px">
        <!-- 임팩트 -->
        ${_myCo2 > 0 ? `<div style="background:linear-gradient(135deg,#fff,#f0fbf4);border-radius:14px;padding:12px 14px;margin-bottom:12px;border:1.5px solid #a8e6c5">
          <div style="font-size:10px;color:#1a6b3a;font-weight:700;letter-spacing:1.5px;margin-bottom:8px">💚 내가 만든 임팩트</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🌳</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.trees}그루</div><div style="font-size:9px;color:#888">나무 1년 분량</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🚗</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.carKm}km</div><div style="font-size:9px;color:#888">차 안 탄 효과</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">☕</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.cups}개</div><div style="font-size:9px;color:#888">일회용컵 안 만든 효과</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🐰</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.sqm}평</div><div style="font-size:9px;color:#888">농부가 살 숲</div></div>
          </div>
        </div>` : ''}

        <!-- 씨앗 + 도감 진행도 -->
        <div style="background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;padding:14px 16px;border:2px solid #FFE082;margin-bottom:12px">
          <div style="font-size:11px;color:#689F38;font-weight:700;letter-spacing:2px;text-align:center">🌱 MY FARM</div>
          <div style="display:flex;justify-content:space-around;margin-top:10px;text-align:center">
            <div><div style="font-size:20px">🌱</div><div style="font-size:11px;color:#888;margin-top:2px">일반 씨앗</div><div style="font-size:18px;font-weight:900;color:#1B5E20">${seeds.common}개</div></div>
            <div><div style="font-size:20px">💔</div><div style="font-size:11px;color:#888;margin-top:2px">못난이 씨앗</div><div style="font-size:18px;font-weight:900;color:#C44569">${seeds.ugly}개</div></div>
            <div><div style="font-size:20px">📖</div><div style="font-size:11px;color:#888;margin-top:2px">도감</div><div style="font-size:18px;font-weight:900;color:#5D4037">${dexCount}/12</div></div>
          </div>
          <div style="height:6px;background:#fff;border-radius:3px;overflow:hidden;margin-top:10px"><div style="width:${(dexCount/12)*100}%;height:100%;background:linear-gradient(90deg,#a8f0c6,#FF8F00);transition:width .5s"></div></div>
          ${dexCount >= 12 ? '<div style="font-size:11px;color:#FF8F00;margin-top:6px;font-weight:700;text-align:center">🏆 도감 완성! 진정한 농부!</div>' : ''}
        </div>

        <!-- 텃밭 그리드 -->
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;border:1.5px solid #e8d4b0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-size:12px;font-weight:900;color:#5D4037">🌻 내 텃밭</div>
            <div style="font-size:10px;color:#888">${garden.filter(p=>p).length}/${GRID_SIZE} 칸 사용중</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:6px">${gridHTML}</div>
          <div style="font-size:10px;color:#888;margin-top:8px;text-align:center;line-height:1.6">💡 미션·깅 1회 = 모든 작물 +1성장 · 4단계 도달 시 수확</div>
        </div>

        <!-- 액션 버튼 -->
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
          <button onclick="openSeedShop()" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:linear-gradient(135deg,#FFE082,#FFC107);color:#5D4037;border:none;border-radius:12px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:700"><span>🌱 씨앗 가게</span><span style="font-weight:600">${myPoints}P 보유</span></button>
          <button onclick="openDexModal()" style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:#fff;color:#5D4037;border:1.5px solid #d8b888;border-radius:12px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:700"><span>📖 도감 전체 보기</span><span style="color:#888;font-weight:600">${dexCount}/12 수집</span></button>
        </div>

        <!-- 토끼 농부 가족 -->
        <div style="margin-top:12px;padding:14px 12px;background:#fff;border-radius:12px;border:1px solid #d8eedd">
          <div style="font-size:11px;font-weight:900;color:#1a2e1a;margin-bottom:8px;text-align:center">🐾 우리 농부 가족 (${bunnies.length}명)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
            ${bunnies.map((b)=>`<div style="text-align:center;padding:6px 4px;background:#f8fdf9;border-radius:10px;min-width:62px;border:1px solid #eee"><div style="height:54px;display:flex;justify-content:center;align-items:flex-end;overflow:hidden"><div style="transform:scale(.7);transform-origin:center bottom">${bunnySvg(b.color, 'normal', false)}</div></div><div style="font-size:10px;color:#444;margin-top:3px;font-weight:700">${b.name}</div></div>`).join('')}
          </div>
          <div style="font-size:10px;color:#888;text-align:center;margin-top:8px;line-height:1.6">💡 도감 6/12, 12/12 달성 시 새 농부 합류!</div>
        </div>

        <div style="height:20px"></div>
      </div>
    `;

    // 텃밭 펄스 애니메이션 CSS 한 번만
    if(!document.getElementById('farmAnimStyle')){
      const style = document.createElement('style');
      style.id = 'farmAnimStyle';
      style.textContent = `@keyframes harvestPulse {0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,143,0,.5)} 50%{transform:scale(1.05);box-shadow:0 0 0 8px rgba(255,143,0,0)}}`;
      document.head.appendChild(style);
    }
  }

  // ════════════════════════════════════════════════════════
  // 🛒 씨앗 가게 모달
  // ════════════════════════════════════════════════════════
  window.openSeedShop = function(){
    if(!_myFarm) return;
    const myPoints = window.UDATA?.point || 0;
    document.getElementById('ovSeedShop')?.remove();
    const m = document.createElement('div');
    m.id = 'ovSeedShop'; m.className = 'overlay on';
    m.innerHTML = `<div class="modal" style="padding:24px 20px"><button class="modal-close" onclick="document.getElementById('ovSeedShop').remove()">✕</button>
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:48px">🌱</div>
        <div style="font-size:18px;font-weight:900;margin-top:6px;color:#5D4037">씨앗 가게</div>
        <div style="font-size:12px;color:#888;margin-top:6px">보유: <b style="color:#FF8F00">${myPoints}P</b></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="background:#f0fbf4;border:2px solid #a8e6c5;border-radius:14px;padding:14px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:36px">🌱</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:900;color:#1B5E20">일반 씨앗</div>
              <div style="font-size:11px;color:#666;margin-top:2px">평범한 작물 6종 중 랜덤<br/>토마토·당근·상추·옥수수·가지·오이</div>
            </div>
          </div>
          <button onclick="buySeed('common')" ${myPoints<10?'disabled':''} style="width:100%;margin-top:10px;padding:10px;background:${myPoints<10?'#e0e0e0':'#1B5E20'};color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:${myPoints<10?'default':'pointer'};font-family:inherit">${myPoints<10?'포인트 부족':'10P → 일반 씨앗 1개'}</button>
        </div>
        <div style="background:#fff5f8;border:2px solid #FFB6C1;border-radius:14px;padding:14px;position:relative">
          <div style="position:absolute;top:8px;right:8px;background:#FFB6C1;color:#fff;font-size:9px;font-weight:900;padding:3px 8px;border-radius:8px">희귀</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:36px">💔</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:900;color:#C44569">못난이 씨앗</div>
              <div style="font-size:11px;color:#666;margin-top:2px">못난이 작물 6종 중 랜덤<br/>쌍둥이·갈래·거인·꼬마·점박이·휜</div>
            </div>
          </div>
          <button onclick="buySeed('ugly')" ${myPoints<25?'disabled':''} style="width:100%;margin-top:10px;padding:10px;background:${myPoints<25?'#e0e0e0':'linear-gradient(135deg,#FF6B9D,#C44569)'};color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:${myPoints<25?'default':'pointer'};font-family:inherit">${myPoints<25?'포인트 부족':'25P → 못난이 씨앗 1개'}</button>
        </div>
      </div>
      <div style="font-size:10px;color:#888;text-align:center;margin-top:14px;line-height:1.6">💡 못난이 농산물은 청년·고령 농업인의 폐기 위기 작물에서 영감을 받았어요</div>
    </div>`;
    document.body.appendChild(m);
  };

  window.buySeed = async function(type){
    if(!_myFarm) return;
    const price = SEED_PRICE[type];
    const myPoints = window.UDATA?.point || 0;
    if(myPoints < price){ window.toast("포인트가 부족해요!"); return; }
    try {
      const newP = myPoints - price;
      await window.FB.updateDoc(window.FB.doc(window.FB.db, "users", window.ME.uid), {point: newP});
      window.UDATA.point = newP;
      _myFarm.seeds[type] = (_myFarm.seeds[type] || 0) + 1;
      await saveFarm();
      if(window.updateUI) window.updateUI();
      document.getElementById('ovSeedShop')?.remove();
      window.toast(type==='ugly' ? "💔 못난이 씨앗 1개 획득!" : "🌱 일반 씨앗 1개 획득!");
    } catch(e){ window.toast("실패: "+e.message); }
  };

  // ════════════════════════════════════════════════════════
  // 🌱 심기 모달 (빈 칸 탭)
  // ════════════════════════════════════════════════════════
  window.openPlantModal = function(slot){
    if(!_myFarm) return;
    const seeds = _myFarm.seeds || {common:0, ugly:0};
    document.getElementById('ovPlant')?.remove();
    const m = document.createElement('div');
    m.id = 'ovPlant'; m.className = 'overlay on';
    m.innerHTML = `<div class="modal" style="padding:24px 20px"><button class="modal-close" onclick="document.getElementById('ovPlant').remove()">✕</button>
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:48px">🌻</div>
        <div style="font-size:18px;font-weight:900;margin-top:6px;color:#5D4037">${slot+1}번 칸에 심기</div>
        <div style="font-size:12px;color:#888;margin-top:6px">어떤 씨앗을 심을까요?</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button onclick="plantCrop(${slot}, 'common')" ${seeds.common<1?'disabled':''} style="padding:14px;background:${seeds.common<1?'#f5f5f5':'#f0fbf4'};color:${seeds.common<1?'#aaa':'#1B5E20'};border:2px solid ${seeds.common<1?'#e0e0e0':'#a8e6c5'};border-radius:12px;font-size:14px;cursor:${seeds.common<1?'default':'pointer'};font-family:inherit;font-weight:700;display:flex;align-items:center;justify-content:space-between"><span>🌱 일반 씨앗 심기</span><span style="font-weight:600">${seeds.common}개 보유</span></button>
        <button onclick="plantCrop(${slot}, 'ugly')" ${seeds.ugly<1?'disabled':''} style="padding:14px;background:${seeds.ugly<1?'#f5f5f5':'#fff5f8'};color:${seeds.ugly<1?'#aaa':'#C44569'};border:2px solid ${seeds.ugly<1?'#e0e0e0':'#FFB6C1'};border-radius:12px;font-size:14px;cursor:${seeds.ugly<1?'default':'pointer'};font-family:inherit;font-weight:700;display:flex;align-items:center;justify-content:space-between"><span>💔 못난이 씨앗 심기</span><span style="font-weight:600">${seeds.ugly}개 보유</span></button>
      </div>
      ${seeds.common<1 && seeds.ugly<1 ? '<div style="font-size:11px;color:#888;text-align:center;margin-top:14px">씨앗이 없어요! 가게에서 사거나 미션을 완료하세요</div>' : ''}
    </div>`;
    document.body.appendChild(m);
  };

  window.plantCrop = async function(slot, type){
    if(!_myFarm) return;
    if((_myFarm.seeds[type] || 0) < 1){ window.toast("씨앗이 없어요!"); return; }
    const crop = randomCrop(type);
    _myFarm.seeds[type]--;
    _myFarm.garden[slot] = {cropId: crop.id, stage: 0, plantedAt: Date.now()};
    await saveFarm();
    document.getElementById('ovPlant')?.remove();
    window.toast(`🌱 ${crop.name} 씨앗을 심었어요! 미션하면 자라요`);
  };

  window.peekCrop = function(slot){
    const plot = _myFarm?.garden?.[slot];
    if(!plot) return;
    const crop = getCrop(plot.cropId);
    window.toast(`🌿 ${crop.name} · ${STAGE_LABELS[plot.stage]} (미션하면 더 자라요)`);
  };

  // ════════════════════════════════════════════════════════
  // 🌾 수확
  // ════════════════════════════════════════════════════════
  window.harvestCrop = async function(slot){
    if(!_myFarm) return;
    const plot = _myFarm.garden[slot];
    if(!plot || plot.stage < 3) return;
    const crop = getCrop(plot.cropId);
    if(!crop) return;
    _myFarm.harvest[crop.id] = (_myFarm.harvest[crop.id] || 0) + 1;
    _myFarm.dex[crop.id] = (_myFarm.dex[crop.id] || 0) + 1;
    _myFarm.garden[slot] = null;
    await saveFarm();
    await checkDexMilestone();
    const isNew = _myFarm.dex[crop.id] === 1;
    if(isNew){ showHarvestModal(crop, true); }
    else { window.toast(`🌾 ${crop.emoji} ${crop.name} 수확! (${_myFarm.dex[crop.id]}번째)`); }
  };

  function showHarvestModal(crop, isNew){
    const isUgly = crop.rarity === 'ugly';
    document.getElementById('ovHarvest')?.remove();
    const m = document.createElement('div');
    m.id = 'ovHarvest'; m.className = 'overlay on';
    m.innerHTML = `<div class="modal" style="padding:30px 20px;text-align:center;background:${isUgly?'linear-gradient(135deg,#fff5f8,#ffe6f0)':'linear-gradient(135deg,#f0fbf4,#fff8e1)'}"><button class="modal-close" onclick="document.getElementById('ovHarvest').remove()">✕</button>
      ${isNew ? '<div style="font-size:11px;font-weight:900;color:#C44569;letter-spacing:3px;margin-bottom:4px">✨ NEW! 도감 추가 ✨</div>' : ''}
      <div style="font-size:72px;margin:10px 0">${crop.emoji}</div>
      <div style="font-size:20px;font-weight:900;color:${isUgly?'#C44569':'#1B5E20'}">${crop.name}</div>
      ${isUgly ? '<div style="display:inline-block;background:#FFB6C1;color:#fff;font-size:10px;font-weight:900;padding:3px 10px;border-radius:8px;margin-top:6px">못난이 농산물</div>' : ''}
      <div style="font-size:13px;color:#5D4037;margin-top:14px;line-height:1.6;font-style:italic">"${crop.story}"</div>
      <button onclick="document.getElementById('ovHarvest').remove()" style="margin-top:20px;padding:12px 32px;background:${isUgly?'linear-gradient(135deg,#FF6B9D,#C44569)':'linear-gradient(135deg,#2ECC71,#27AE60)'};color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">고마워요 🌱</button>
    </div>`;
    document.body.appendChild(m);
  }

  // ════════════════════════════════════════════════════════
  // 📖 도감 모달
  // ════════════════════════════════════════════════════════
  window.openDexModal = function(){
    if(!_myFarm) return;
    const dex = _myFarm.dex || {};
    const dexCount = Object.keys(dex).length;
    document.getElementById('ovDex')?.remove();
    const m = document.createElement('div');
    m.id = 'ovDex'; m.className = 'overlay on';
    let dexHTML = '';
    CROPS.forEach(c => {
      const got = dex[c.id];
      const isUgly = c.rarity === 'ugly';
      dexHTML += `<div onclick="${got ? `showCropStory('${c.id}')` : ''}" style="aspect-ratio:1;background:${got?(isUgly?'#fff5f8':'#f0fbf4'):'#f5f5f5'};border:2px solid ${got?(isUgly?'#FFB6C1':'#a8e6c5'):'#e0e0e0'};border-radius:12px;display:flex;flex-direction:column;justify-content:center;align-items:center;cursor:${got?'pointer':'default'};position:relative;padding:4px">
        <div style="font-size:28px;filter:${got?'none':'grayscale(1) opacity(.25)'}">${got?c.emoji:'❓'}</div>
        <div style="font-size:9px;color:${got?'#444':'#bbb'};font-weight:700;margin-top:3px;text-align:center;line-height:1.2">${got?c.name:'???'}</div>
        ${got && got>1?`<div style="position:absolute;top:3px;right:3px;background:#1B5E20;color:#fff;font-size:8px;font-weight:900;padding:1px 5px;border-radius:6px">×${got}</div>`:''}
        ${isUgly && got?'<div style="position:absolute;top:3px;left:3px;font-size:10px">💔</div>':''}
      </div>`;
    });
    m.innerHTML = `<div class="modal" style="padding:24px 18px;max-height:90vh;overflow-y:auto"><button class="modal-close" onclick="document.getElementById('ovDex').remove()">✕</button>
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;color:#888;letter-spacing:2px">FARM DEX</div>
        <div style="font-size:20px;font-weight:900;color:#5D4037;margin-top:2px">농작물 도감 ${dexCount}/12</div>
        <div style="height:6px;background:#f5f5f5;border-radius:3px;overflow:hidden;margin-top:8px"><div style="width:${(dexCount/12)*100}%;height:100%;background:linear-gradient(90deg,#a8f0c6,#FF8F00)"></div></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${dexHTML}</div>
      <div style="font-size:10px;color:#888;text-align:center;margin-top:14px;line-height:1.6">💡 수집된 작물을 탭하면 스토리가 나와요<br/>💔 못난이 농산물도 다 모아야 진짜 농부!</div>
    </div>`;
    document.body.appendChild(m);
  };

  window.showCropStory = function(cropId){
    const crop = getCrop(cropId);
    if(!crop || !_myFarm?.dex?.[cropId]) return;
    const count = _myFarm.dex[cropId];
    const isUgly = crop.rarity === 'ugly';
    document.getElementById('ovStory')?.remove();
    const m = document.createElement('div');
    m.id = 'ovStory'; m.className = 'overlay on';
    m.innerHTML = `<div class="modal" style="padding:28px 22px;text-align:center;background:${isUgly?'linear-gradient(135deg,#fff5f8,#ffe6f0)':'linear-gradient(135deg,#f0fbf4,#fff8e1)'}"><button class="modal-close" onclick="document.getElementById('ovStory').remove()">✕</button>
      <div style="font-size:64px;margin:10px 0">${crop.emoji}</div>
      <div style="font-size:18px;font-weight:900;color:${isUgly?'#C44569':'#1B5E20'}">${crop.name}</div>
      ${isUgly ? '<div style="display:inline-block;background:#FFB6C1;color:#fff;font-size:10px;font-weight:900;padding:3px 10px;border-radius:8px;margin-top:6px">못난이 농산물</div>' : '<div style="display:inline-block;background:#a8e6c5;color:#1B5E20;font-size:10px;font-weight:900;padding:3px 10px;border-radius:8px;margin-top:6px">일반 농산물</div>'}
      <div style="font-size:13px;color:#5D4037;margin-top:16px;line-height:1.7;font-style:italic">"${crop.story}"</div>
      <div style="margin-top:16px;padding:10px;background:rgba(255,255,255,.7);border-radius:10px">
        <div style="font-size:10px;color:#888;font-weight:700;letter-spacing:1px">수확 횟수</div>
        <div style="font-size:22px;font-weight:900;color:${isUgly?'#C44569':'#1B5E20'}">${count}회</div>
      </div>
    </div>`;
    document.body.appendChild(m);
  };

  // ════════════════════════════════════════════════════════
  // 🌅 단계업 모달 (그대로 유지)
  // ════════════════════════════════════════════════════════
  function showStageUp(stage){
    const imp = getImpact(_myCo2);
    document.getElementById('ovStageUp')?.remove();
    const modal = document.createElement('div');
    modal.id = 'ovStageUp';
    modal.style.cssText = `position:fixed;inset:0;background:${stage.bg};z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 20px;overflow-y:auto`;
    modal.innerHTML = `
      <div style="text-align:center;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.3);max-width:340px">
        <div style="font-size:11px;font-weight:700;letter-spacing:3px;opacity:.85">STAGE ${stage.id+1}/5 도달</div>
        <div style="font-size:32px;font-weight:900;margin-top:8px">${stage.name}</div>
        <div style="font-size:15px;margin-top:14px;font-weight:700">"${stage.msg}"</div>
        <div style="font-size:12px;margin-top:6px;opacity:.9">${stage.sub}</div>
      </div>
      <div style="background:rgba(255,255,255,.95);border-radius:18px;padding:18px;margin-top:24px;width:100%;max-width:340px">
        <div style="font-size:10px;color:#1a6b3a;font-weight:700;letter-spacing:2px;text-align:center;margin-bottom:12px">💚 당신이 만든 진짜 변화</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🌳</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.trees}그루</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🚗</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.carKm}km</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">☕</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.cups}개</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🐰</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.sqm}평</div></div>
        </div>
      </div>
      <button onclick="document.getElementById('ovStageUp').remove()" style="margin-top:20px;background:rgba(0,0,0,.4);border:1.5px solid rgba(255,255,255,.3);color:#fff;border-radius:14px;padding:14px 40px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">계속하기</button>`;
    document.body.appendChild(modal);
  }

  // ════════════════════════════════════════════════════════
  // 🐰 토끼 농부 애니메이션 (그대로)
  // ════════════════════════════════════════════════════════
  function spawnBunnies(bunniesData){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;
    playground.querySelectorAll('.bunny-char, .bunny-extra').forEach(el => el.remove());
    _bunnyChars = [];
    const w = playground.offsetWidth || 320;
    const groundTop = 130, groundBottom = 195;
    const showCount = Math.min(bunniesData.length, 12);
    const stage = getStage(_myCo2);

    for(let i=0;i<showCount;i++){
      const bdata = bunniesData[i];
      const wrap = document.createElement('div');
      wrap.className = 'bunny-char';
      wrap.style.cssText = `position:absolute;cursor:pointer;user-select:none;z-index:${20+i};will-change:left,top,transform;line-height:0`;
      const withMask = stage.mask && i === 0;
      wrap.innerHTML = `<div class="bunny-svg">${bunnySvg(bdata.color, 'normal', withMask)}</div><div class="bunny-grass" style="position:absolute;top:30px;left:-12px;font-size:14px;display:none;line-height:1">🌿</div><div class="bunny-zzz" style="position:absolute;top:-10px;right:-4px;font-size:12px;display:none;line-height:1;animation:zzz 1.5s infinite">💤</div><div class="name-bubble" style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#fff;border:1.5px solid #FFB6C1;color:#5D4037;font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;white-space:nowrap;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.15);display:none;line-height:1.3">${bdata.name}</div>`;
      const idx = i;
      wrap.onclick = (e)=>{e.stopPropagation(); showName(idx); bigJump(idx); window.petBunny();};
      playground.appendChild(wrap);

      const bunny = {el:wrap, name:bdata.name, color:bdata.color, withMask,
        x:20+Math.random()*(w-80), y:groundTop+Math.random()*(groundBottom-groundTop),
        vx:0, hopOffset:Math.random()*Math.PI*2, facing:Math.random()<0.5?-1:1,
        stateTimer:60+Math.floor(Math.random()*80), state:'walk', bubbleTimer:null};
      setState(bunny, 'walk');
      _bunnyChars.push(bunny);
    }

    const colors = bunniesData.map(b=>b.color).join(',');
    _lastSpawnedKey = `${bunniesData.length}_${colors}_${stage.id}`;
    if(!document.getElementById('bunnyAnimStyle')){
      const style = document.createElement('style');
      style.id = 'bunnyAnimStyle';
      style.textContent = `@keyframes zzz {0%{opacity:0;transform:translateY(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-8px)}}`;
      document.head.appendChild(style);
    }
    startBunnyAnim();
  }

  function showName(idx){
    const b = _bunnyChars[idx]; if(!b) return;
    const bubble = b.el.querySelector('.name-bubble'); if(!bubble) return;
    bubble.style.transform = `translateX(-50%) scaleX(${b.facing})`;
    bubble.style.display = 'block';
    clearTimeout(b.bubbleTimer);
    b.bubbleTimer = setTimeout(()=>{bubble.style.display='none';}, 2000);
  }
  function setState(b, newState){
    b.state = newState;
    const grass=b.el.querySelector('.bunny-grass'), zzz=b.el.querySelector('.bunny-zzz'), svg=b.el.querySelector('.bunny-svg');
    if(grass) grass.style.display = newState==='eat'?'block':'none';
    if(zzz) zzz.style.display = newState==='rest'?'block':'none';
    let mood='normal'; if(newState==='rest') mood='sleep'; else if(newState==='eat') mood='happy';
    if(svg) svg.innerHTML = bunnySvg(b.color, mood, b.withMask);
    if(newState==='walk'){b.vx=(Math.random()<0.5?-1:1)*(0.4+Math.random()*0.4); b.facing=b.vx>0?1:-1;}
    else if(newState==='run'){b.vx=(Math.random()<0.5?-1:1)*(1.4+Math.random()*0.6); b.facing=b.vx>0?1:-1;}
    else b.vx=0;
  }
  function startBunnyAnim(){
    if(_animLoop){clearInterval(_animLoop); _animLoop=null;}
    let frame = 0;
    _animLoop = setInterval(()=>{
      frame++;
      const playground = document.getElementById('bunnyPlayground');
      if(!playground){clearInterval(_animLoop); _animLoop=null; return;}
      const w = playground.offsetWidth || 320;
      _bunnyChars.forEach((b)=>{
        b.stateTimer--;
        if(b.stateTimer<=0){
          const r=Math.random(); let newState;
          if(r<0.40) newState='walk'; else if(r<0.60) newState='eat'; else if(r<0.75) newState='look'; else if(r<0.88) newState='rest'; else newState='run';
          setState(b, newState); b.stateTimer = 70+Math.floor(Math.random()*110);
        }
        let yOffset=0, extraTransform='';
        if(b.state==='walk'){b.x+=b.vx; yOffset=Math.abs(Math.sin(frame*0.18+b.hopOffset))*8;}
        else if(b.state==='run'){b.x+=b.vx; yOffset=Math.abs(Math.sin(frame*0.32+b.hopOffset))*16;}
        else if(b.state==='eat') extraTransform=` rotate(${Math.sin(frame*0.4)*1.5}deg)`;
        else if(b.state==='rest') yOffset=Math.sin(frame*0.08)*1.5;
        else if(b.state==='look') yOffset=Math.sin(frame*0.1)*1;
        if(b.x<5){b.x=5; if(b.vx!==0){b.vx=Math.abs(b.vx); b.facing=1;}}
        if(b.x>w-65){b.x=w-65; if(b.vx!==0){b.vx=-Math.abs(b.vx); b.facing=-1;}}
        b.el.style.left=b.x+'px'; b.el.style.top=(b.y-yOffset)+'px';
        b.el.style.transform=`scaleX(${b.facing})`+extraTransform;
        const bubble=b.el.querySelector('.name-bubble');
        if(bubble && bubble.style.display==='block') bubble.style.transform=`translateX(-50%) scaleX(${b.facing})`;
      });
    }, 50);
  }
  function bigJump(idx){
    const b = _bunnyChars[idx]; if(!b) return;
    const el = b.el;
    el.style.transition = 'transform .35s cubic-bezier(.5,2,.3,.8)';
    el.style.transform = `scaleX(${b.facing}) translateY(-25px) scale(1.2)`;
    const svg = el.querySelector('.bunny-svg');
    if(svg) svg.innerHTML = bunnySvg(b.color, 'happy', b.withMask);
    setTimeout(()=>{
      el.style.transition = 'transform .25s';
      el.style.transform = `scaleX(${b.facing}) scale(1)`;
      setTimeout(()=>{
        el.style.transition = '';
        if(svg && b.state!=='eat' && b.state!=='rest') svg.innerHTML = bunnySvg(b.color, 'normal', b.withMask);
      }, 250);
    }, 350);
  }
  window.petBunny = async function(){
    // 농부 토끼 쓰다듬기 (단순 인터랙션만, happiness 시스템 없음)
    if(Date.now()-_petTimer < 800) return;
    _petTimer = Date.now();
  };

  // ════════════════════════════════════════════════════════
  // 🌱 작물 성장 트리거 (미션·깅 시 호출)
  // ════════════════════════════════════════════════════════
  function growAllCrops(){
    if(!_myFarm?.garden) return false;
    let grown = false;
    _myFarm.garden.forEach((plot, i) => {
      if(plot && plot.stage < 3){
        plot.stage++;
        grown = true;
      }
    });
    return grown;
  }

  // ════════════════════════════════════════════════════════
  // 🪝 미션·깅 후크 (보상 + 성장)
  // ════════════════════════════════════════════════════════
  function hookSaveMission(){
    if(window._farmHookedSaveMission) return;
    const orig = window.saveMission;
    if(typeof orig !== "function"){setTimeout(hookSaveMission, 1000); return;}
    window.saveMission = async function(uid, m){
      const res = await orig(uid, m);
      if(res && uid === window.ME?.uid && _myFarm){
        // 씨앗 보상: 95% common, 5% ugly
        const isUgly = Math.random() < 0.05;
        const type = isUgly ? 'ugly' : 'common';
        _myFarm.seeds[type] = (_myFarm.seeds[type] || 0) + 1;
        // 모든 작물 성장
        const grown = growAllCrops();
        await saveFarm();
        setTimeout(()=>refreshAndUpdate(), 1500);
        setTimeout(()=>{
          if(isUgly) window.toast("💔 못난이 씨앗 +1! (행운!)");
          else window.toast(`🌱 씨앗 +1${grown?' · 작물이 자랐어요!':''}`);
        }, 1000);
      }
      return res;
    };
    window._farmHookedSaveMission = true;
  }
  function hookJoinGathering(){
    if(window._farmHookedJoinGathering) return;
    const orig = window.joinGathering;
    if(typeof orig !== "function"){setTimeout(hookJoinGathering, 1000); return;}
    window.joinGathering = async function(gid){
      await orig(gid);
      if(_myFarm){
        // 깅 보상: common 4 + ugly 1 보장
        _myFarm.seeds.common = (_myFarm.seeds.common || 0) + 4;
        _myFarm.seeds.ugly = (_myFarm.seeds.ugly || 0) + 1;
        // 모든 작물 성장 +1
        growAllCrops();
        await saveFarm();
        setTimeout(()=>refreshAndUpdate(), 1500);
        setTimeout(()=>window.toast("🥕 깅 참여! 일반 +4, 못난이 +1, 작물 성장!"), 1200);
      }
    };
    window._farmHookedJoinGathering = true;
  }

  // ════════════════════════════════════════════════════════
  // 🏷️ 탭 아이콘 (지구 → 농장)
  // ════════════════════════════════════════════════════════
  function changeTabIcon(){
    const tryIt = () => {
      const tabs = document.querySelectorAll('.tb');
      if(!tabs.length) return false;
      let found = false;
      tabs.forEach(tab=>{
        if(tab.dataset.page === 'map'){
          const ic = tab.querySelector('.ic');
          if(ic) ic.textContent = '🌱';
          for(const node of tab.childNodes){
            if(node.nodeType===3 && node.textContent.trim()){node.textContent='농장'; break;}
          }
          found = true;
        }
      });
      return found;
    };
    if(!tryIt()){
      let attempts = 0;
      const interval = setInterval(()=>{attempts++; if(tryIt() || attempts>10) clearInterval(interval);}, 500);
    }
  }

  // ════════════════════════════════════════════════════════
  // 🚀 부트
  // ════════════════════════════════════════════════════════
  function boot(){
    if(!window.FB){setTimeout(boot, 500); return;}
    initFarmOnMap();
    hookSaveMission();
    hookJoinGathering();
    changeTabIcon();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ()=>setTimeout(boot, 1500));
  else setTimeout(boot, 1500);

})();
