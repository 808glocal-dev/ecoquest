(function(){

  // ═══ 색상 5종 ═══
  const PALETTES = [
    {body:'#FFFFFF', shade:'#F0E0CE', stroke:'#8B6F47', ear:'#FFB6C1', label:'하양'},
    {body:'#F5E6D3', shade:'#D8B898', stroke:'#7D5E47', ear:'#7D5E47', label:'갈얼룩'},
    {body:'#E8E8E8', shade:'#C8C8C8', stroke:'#6B6B6B', ear:'#A9A9A9', label:'회색'},
    {body:'#F5DEB3', shade:'#D8B888', stroke:'#7D5E47', ear:'#C8A878', label:'베이지'},
    {body:'#A0826D', shade:'#7D5E47', stroke:'#5C3A1E', ear:'#5C3A1E', label:'갈색'},
  ];

  // ═══ 5단계 세계관 ═══
  const STAGES = [
    {id:0, min:0,  name:'회색 도시',   bg:'linear-gradient(180deg,#a8a8a8 0%,#888 50%,#666 100%)',
     skyDecor:[{e:'💨',top:8,left:24,size:22,op:.7},{e:'🏭',top:14,right:30,size:22,op:.6},{e:'🌫️',top:36,left:'45%',size:14,op:.5}],
     groundDecor:[{e:'🗑️',bottom:6,left:18,size:16},{e:'🚮',bottom:8,left:200,size:15},{e:'⚙️',bottom:6,right:60,size:13,op:.5}],
     msg:'지구가 아파요', sub:'당신의 작은 행동이 변화의 시작이에요', mask:true},
    {id:1, min:1,  name:'새싹',         bg:'linear-gradient(180deg,#bee9d4 0%,#A8DC8E 50%,#8BC56F 100%)',
     skyDecor:[{e:'☁️',top:8,left:24,size:22,op:.85},{e:'🌤️',top:6,right:14,size:22}],
     groundDecor:[{e:'🌱',bottom:6,left:18,size:14},{e:'🌿',bottom:4,left:80,size:13},{e:'🌷',bottom:8,left:200,size:14},{e:'🌱',bottom:6,right:60,size:13}],
     msg:'당신이 시작했어요', sub:'첫 풀이 자라났어요', mask:false},
    {id:2, min:5,  name:'들판',         bg:'linear-gradient(180deg,#87CEEB 0%,#B5DCF0 45%,#A8DC8E 50%,#76B947 100%)',
     skyDecor:[{e:'☁️',top:8,left:24,size:22,op:.85},{e:'☀️',top:6,right:14,size:24},{e:'🦋',top:32,left:'50%',size:16},{e:'🐦',top:18,right:36,size:16,op:.8}],
     groundDecor:[{e:'🌷',bottom:8,left:18,size:16},{e:'🌼',bottom:6,left:90,size:15},{e:'🌾',bottom:12,left:160,size:14},{e:'🌷',bottom:8,right:60,size:16},{e:'🌼',bottom:10,right:20,size:18}],
     msg:'잃어버린 친구가 돌아와요', sub:'나비와 새가 다시 찾아왔어요', mask:false},
    {id:3, min:20, name:'숲',           bg:'linear-gradient(180deg,#7AB85F 0%,#A8DC8E 40%,#5a9a3a 100%)',
     skyDecor:[{e:'☀️',top:6,right:14,size:22,op:.9},{e:'🦋',top:30,left:'45%',size:16},{e:'🌳',top:50,left:8,size:34,op:.85},{e:'🌳',top:48,right:6,size:32,op:.85}],
     groundDecor:[{e:'🌲',bottom:6,left:60,size:24},{e:'🍄',bottom:4,left:130,size:14},{e:'💧',bottom:14,left:200,size:14},{e:'🐿️',bottom:8,right:80,size:16},{e:'🌲',bottom:6,right:18,size:22}],
     msg:'생태계가 살아나요', sub:'나무와 시냇물이 흐르는 숲이 됐어요', mask:false},
    {id:4, min:50, name:'회복된 지구', bg:'linear-gradient(180deg,#1a1a3e 0%,#3d2966 40%,#5a9a3a 75%,#76B947 100%)',
     skyDecor:[{e:'🌙',top:8,right:14,size:24},{e:'⭐',top:18,left:50,size:14},{e:'⭐',top:36,left:'40%',size:12,op:.9},{e:'✨',top:8,left:140,size:14},{e:'⭐',top:28,right:50,size:14,op:.9}],
     groundDecor:[{e:'🌳',bottom:6,left:18,size:24},{e:'🌸',bottom:4,left:80,size:14},{e:'✨',bottom:18,left:160,size:14},{e:'🌳',bottom:6,right:80,size:24},{e:'🌸',bottom:4,right:30,size:14}],
     msg:'당신이 지킨 작은 지구', sub:'별빛 아래 평화로운 토끼 마을이 됐어요', mask:false},
  ];

  function getStage(co2){ for(let i=STAGES.length-1;i>=0;i--){if(co2>=STAGES[i].min)return STAGES[i];} return STAGES[0]; }
  function getNextStage(co2){ const cur=getStage(co2); const idx=STAGES.indexOf(cur); return idx<STAGES.length-1?STAGES[idx+1]:null; }

  function getImpact(co2){
    return {
      trees: (co2/21.4).toFixed(1),
      carKm: Math.round(co2/0.21),
      cups: Math.round(co2/0.011),
      sqm: Math.round(co2*0.6)
    };
  }

  // ═══ SVG 토끼 (V4 손그림) ═══
  function bunnySvg(colorIdx, mood, withMask){
    const p = PALETTES[Math.min(colorIdx, 4)];
    let eye;
    if(mood==='sleep'){
      eye = `<path d="M 19 24 Q 22 27 25 24" stroke="${p.stroke}" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M 31 24 Q 34 27 37 24" stroke="${p.stroke}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    } else if(mood==='happy'){
      eye = `<path d="M 19 26 Q 22 23 25 26" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M 31 26 Q 34 23 37 26" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    } else {
      eye = `<ellipse cx="22" cy="26" rx="2.6" ry="3.2" fill="#1a1a1a"/><ellipse cx="34" cy="26" rx="2.6" ry="3.2" fill="#1a1a1a"/><ellipse cx="23" cy="24.8" rx="1.2" ry="1.5" fill="#fff"/><ellipse cx="35" cy="24.8" rx="1.2" ry="1.5" fill="#fff"/><circle cx="21.3" cy="27.3" r=".4" fill="#fff" opacity=".7"/><circle cx="33.3" cy="27.3" r=".4" fill="#fff" opacity=".7"/>`;
    }
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

  // ═══ 상태 ═══
  let _myBunny = null, _petTimer = 0, _bunnyChars = [], _animLoop = null, _lastSpawnedKey = '', _adoptColor = 0, _lastStageId = -1;

  async function loadBunny(){
    if(!window.ME || !window.FB) return;
    try {
      const ref = window.FB.doc(window.FB.db, "bunnies", window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      if(snap.exists()){
        _myBunny = snap.data();
        if(!_myBunny.bunnies || !Array.isArray(_myBunny.bunnies)){
          const cnt = (_myBunny.friendCount || 0) + 1;
          _myBunny.bunnies = [];
          for(let i=0;i<cnt;i++) _myBunny.bunnies.push({name: i===0?"꼬미":`토끼${i+1}`, color: 0});
          delete _myBunny.friendCount;
          await window.FB.setDoc(ref, _myBunny);
        }
        if(typeof _myBunny.totalCo2 !== 'number') _myBunny.totalCo2 = 0;
      } else {
        _myBunny = {carrots:0, happiness:0, totalCo2:0, bunnies:[{name:"꼬미", color:0}], createdAt: window.FB.serverTimestamp()};
        await window.FB.setDoc(ref, _myBunny);
      }
      _lastStageId = getStage(_myBunny.totalCo2 || 0).id;
      renderBunnyMap();
    } catch(e){console.log("토끼 로드 실패:", e.message);}
  }

  async function saveBunny(){
    if(!window.ME || !_myBunny) return;
    try {
      await window.FB.setDoc(window.FB.doc(window.FB.db, "bunnies", window.ME.uid), _myBunny);
      renderBunnyStats();
      const cnt = (_myBunny.bunnies || []).length;
      const colors = (_myBunny.bunnies || []).map(b => b.color).join(',');
      const stageId = getStage(_myBunny.totalCo2 || 0).id;
      const newKey = `${cnt}_${colors}_${stageId}`;
      if(newKey !== _lastSpawnedKey){ spawnBunnies(_myBunny.bunnies || []); applyStageBg(getStage(_myBunny.totalCo2 || 0)); }
    } catch(e){console.log("토끼 저장 실패:", e.message);}
  }

  function checkStageUp(){
    if(!_myBunny) return;
    const cur = getStage(_myBunny.totalCo2 || 0);
    if(_lastStageId >= 0 && cur.id > _lastStageId){
      const prevId = _lastStageId;
      _lastStageId = cur.id;
      setTimeout(() => showStageUp(cur, prevId), 800);
    } else {
      _lastStageId = cur.id;
    }
  }

  function initBunnyOnMap(){
    const tryAdd = () => {
      const mapPage = document.getElementById("page-map");
      if(!mapPage) return false;
      if(document.getElementById("bunnyGameMain")) return true;
      mapPage.innerHTML = '<div id="bunnyGameMain"><div style="text-align:center;padding:40px;color:#888;font-size:13px">🐰 토끼 게임 로딩 중...</div></div>';
      window.drawMap = function(){ renderBunnyMap(); };
      loadBunny();
      return true;
    };
    if(!tryAdd()) setTimeout(initBunnyOnMap, 1000);
  }

  function renderBunnyMap(){
    const c = document.getElementById("bunnyGameMain");
    if(!c) return;
    if(!_myBunny){ c.innerHTML = '<div style="text-align:center;padding:40px;color:#888;font-size:13px">🐰 토끼 데이터 로딩 중...</div>'; return; }
    const myCo2 = _myBunny.totalCo2 || 0;
    const stage = getStage(myCo2);
    const next = getNextStage(myCo2);

    c.innerHTML = `
      <div style="margin:12px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:14px;padding:10px 14px;color:#fff">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div>
            <div style="font-size:9px;color:rgba(255,255,255,.6);font-weight:600;letter-spacing:1px">🌍 내 토끼 세계 — STAGE ${stage.id+1}/5</div>
            <div style="font-size:14px;font-weight:900;color:#a8f0c6;margin-top:1px">${stage.name} · CO₂ ${myCo2.toFixed(1)}kg</div>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,.7);text-align:right">${next ? `다음: ${next.name}<br/><b style="color:#a8f0c6">${(next.min - myCo2).toFixed(1)}kg 더!</b>` : '<b style="color:#FFD700">최종 단계 도달! ✨</b>'}</div>
        </div>
        ${next ? `<div style="height:5px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden"><div style="width:${Math.min(100, ((myCo2-stage.min)/(next.min-stage.min))*100)}%;height:100%;background:linear-gradient(90deg,#a8f0c6,#FFD700);transition:width .8s"></div></div>` : ''}
      </div>

      <div id="bunnyPlayground" style="position:relative;margin:0 12px;height:260px;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);user-select:none;transition:background 1.5s">
        <div id="bunnyHelpText" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:12px;padding:3px 10px;font-size:10px;color:#444;font-weight:600;pointer-events:none;z-index:5">"${stage.msg}" · 토끼 탭하면 이름</div>
      </div>

      <div id="bunnyStats"></div>
    `;
    applyStageBg(stage);
    renderBunnyStats();
    setTimeout(() => spawnBunnies(_myBunny.bunnies || []), 100);
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

  function renderBunnyStats(){
    const c = document.getElementById("bunnyStats");
    if(!c || !_myBunny) return;
    const bunnies = _myBunny.bunnies || [];
    const happiness = _myBunny.happiness || 0;
    const carrots = _myBunny.carrots || 0;
    const myPoints = window.UDATA?.point || 0;
    const myCo2 = _myBunny.totalCo2 || 0;
    const imp = getImpact(myCo2);

    c.innerHTML = `
      <div style="margin:12px">
        ${myCo2 > 0 ? `<div style="background:linear-gradient(135deg,#fff,#f0fbf4);border-radius:14px;padding:12px 14px;margin-bottom:12px;border:1.5px solid #a8e6c5">
          <div style="font-size:10px;color:#1a6b3a;font-weight:700;letter-spacing:1.5px;margin-bottom:8px">💚 내가 만든 임팩트</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🌳</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.trees}그루</div><div style="font-size:9px;color:#888">나무 1년 분량</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🚗</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.carKm}km</div><div style="font-size:9px;color:#888">차 안 탄 효과</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">☕</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.cups}개</div><div style="font-size:9px;color:#888">일회용컵 안 만든 효과</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🐰</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.sqm}평</div><div style="font-size:9px;color:#888">토끼가 살 숲</div></div>
          </div>
        </div>` : ''}

        <div style="background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;padding:14px 16px;text-align:center;border:2px solid #FFE082;margin-bottom:12px">
          <div style="font-size:11px;color:#689F38;font-weight:700;letter-spacing:2px">🐰 MY BUNNY FAMILY</div>
          <div style="font-size:18px;font-weight:900;color:#1B5E20;margin-top:4px">우리 토끼 ${bunnies.length}마리</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px"><span style="color:#555;font-weight:600">😊 행복도</span><span style="color:#e91e63;font-weight:700">${happiness}/100</span></div>
          <div style="height:8px;background:#fce4ec;border-radius:4px;overflow:hidden;margin-top:4px"><div style="width:${Math.min(100,happiness)}%;height:100%;background:linear-gradient(90deg,#f06292,#e91e63);transition:width .5s"></div></div>
          ${happiness >= 100 ? '<div style="font-size:11px;color:#C44569;margin-top:6px;font-weight:700">✨ 새 토끼를 입양할 수 있어요!</div>' : ''}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#FFF8E1;border-radius:14px;margin-bottom:12px;border:2px solid #FFE082">
          <div style="font-size:14px;font-weight:700;color:#8D6E1B">🥕 내 당근</div><div style="font-size:22px;font-weight:900;color:#B8860B">${carrots}개</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="buyCarrot()" ${myPoints<10?'disabled':''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${myPoints<10?'#f5f5f5':'#fff'};color:${myPoints<10?'#aaa':'#5D4037'};border:1.5px solid ${myPoints<10?'#e0e0e0':'#FFD54F'};border-radius:12px;font-size:14px;cursor:${myPoints<10?'default':'pointer'};font-family:inherit;font-weight:700"><span>🥕 당근 사기</span><span style="color:#FF8F00;font-weight:600">10P → 1개</span></button>
          <button onclick="feedBunny()" ${carrots<1?'disabled':''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${carrots<1?'#f5f5f5':'linear-gradient(135deg,#2ECC71,#27AE60)'};color:${carrots<1?'#aaa':'#fff'};border:none;border-radius:12px;font-size:14px;cursor:${carrots<1?'default':'pointer'};font-family:inherit;font-weight:700"><span>🍴 먹이 주기</span><span style="font-weight:600">${carrots<1?'당근 부족':'당근 -1, 행복+10'}</span></button>
          <button onclick="adoptBunny()" ${happiness<100?'disabled':''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${happiness<100?'#f5f5f5':'linear-gradient(135deg,#FF6B9D,#C44569)'};color:${happiness<100?'#aaa':'#fff'};border:none;border-radius:12px;font-size:14px;cursor:${happiness<100?'default':'pointer'};font-family:inherit;font-weight:700"><span>🐰 새 토끼 입양하기</span><span style="font-weight:600">${happiness<100?`행복 ${100-happiness} 더`:'✨ 가능!'}</span></button>
        </div>

        <div style="margin-top:12px;padding:11px 13px;background:#f0fbf4;border-radius:10px;font-size:11px;color:#1B5E20;line-height:1.8">
          💡 미션 1개 = 🥕+1 + CO₂ 누적 · 깅 참여 = 🥕+5 + CO₂ 2kg<br/>
          💡 토끼 탭 = 이름 + 쓰다듬기 (행복+1)<br/>
          💡 누적 CO₂가 단계를 올려요 (5단계 = 50kg)
        </div>

        <div style="margin-top:12px;padding:14px 12px;background:#fff;border-radius:12px;border:1px solid #d8eedd">
          <div style="font-size:11px;font-weight:900;color:#1a2e1a;margin-bottom:12px;text-align:center">🐾 우리 토끼 가족</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
            ${bunnies.map((b) => `<div style="text-align:center;padding:6px 4px;background:#f8fdf9;border-radius:10px;min-width:62px;border:1px solid #eee"><div style="height:54px;display:flex;justify-content:center;align-items:flex-end;overflow:hidden"><div style="transform:scale(.7);transform-origin:center bottom">${bunnySvg(b.color, 'normal', false)}</div></div><div style="font-size:10px;color:#444;margin-top:3px;font-weight:700">${b.name}</div></div>`).join('')}
          </div>
        </div>
        <div style="height:20px"></div>
      </div>
    `;
  }

  // ═══ 입양 모달 ═══
  window.adoptBunny = function(){
    if(!_myBunny) return;
    if((_myBunny.happiness || 0) < 100){window.toast("행복도 100 필요해요!"); return;}
    _adoptColor = 0;
    const old = document.getElementById('ovAdopt'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovAdopt'; modal.className = 'overlay on';
    modal.innerHTML = `<div class="modal" style="padding:24px 20px 20px"><button class="modal-close" onclick="document.getElementById('ovAdopt').remove()">✕</button><div style="text-align:center;margin-bottom:14px"><div style="font-size:48px">🐰</div><div style="font-size:17px;font-weight:900;margin-top:6px;color:#1B5E20">새 토끼 입양하기</div><div style="font-size:12px;color:#888;margin-top:6px">우리 가족이 될 토끼를 골라요!</div></div><div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#555">🎨 색깔 선택</div><div style="display:flex;gap:6px;justify-content:space-between;margin-bottom:16px">${PALETTES.map((p,i)=>`<button id="cpb-${i}" onclick="selectAdoptColor(${i})" style="flex:1;background:${i===0?'#f0fbf4':'#fff'};border:${i===0?'2.5px solid #2ECC71':'1.5px solid #ddd'};border-radius:12px;padding:6px 2px;cursor:pointer;font-family:inherit;text-align:center"><div style="height:60px;display:flex;justify-content:center;align-items:flex-end;overflow:hidden"><div style="transform:scale(.7);transform-origin:center bottom">${bunnySvg(i,'normal',false)}</div></div><div style="font-size:9px;color:#666;margin-top:2px;font-weight:700">${p.label}</div></button>`).join('')}</div><div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#555">✏️ 이름</div><input id="newBunnyName" class="inp" placeholder="예: 꼬미, 토토, 보리, 마루..." maxlength="6" style="text-align:center;font-size:15px;font-weight:700"/><div style="font-size:10px;color:#aaa;text-align:center;margin-top:4px">최대 6글자</div><div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-gray" style="flex:1" onclick="document.getElementById('ovAdopt').remove()">취소</button><button class="btn btn-g" style="flex:1" onclick="confirmAdopt()">🎉 입양!</button></div></div>`;
    document.body.appendChild(modal);
    setTimeout(() => { const inp = document.getElementById('newBunnyName'); if(inp){inp.focus(); inp.onkeydown = (e)=>{if(e.key==='Enter')window.confirmAdopt();};}}, 100);
  };
  window.selectAdoptColor = function(idx){
    _adoptColor = idx;
    PALETTES.forEach((_,i)=>{const btn=document.getElementById('cpb-'+i); if(!btn)return; btn.style.background=i===idx?'#f0fbf4':'#fff'; btn.style.border=i===idx?'2.5px solid #2ECC71':'1.5px solid #ddd';});
  };
  window.confirmAdopt = async function(){
    if(!_myBunny) return;
    const inp = document.getElementById('newBunnyName');
    let name = inp?.value?.trim() || '';
    if(!name) name = `토끼${(_myBunny.bunnies?.length || 0) + 1}`;
    if(name.length > 6) name = name.substring(0, 6);
    if(!_myBunny.bunnies) _myBunny.bunnies = [];
    _myBunny.bunnies.push({name, color: _adoptColor});
    _myBunny.happiness = 0;
    await saveBunny();
    document.getElementById('ovAdopt')?.remove();
    setTimeout(() => { _bunnyChars.forEach((_,i) => setTimeout(() => bigJump(i), i*100)); }, 300);
    window.toast(`🎉 "${name}" 우리 가족이 됐어요!`);
  };

  // ═══ 캐릭터 + 행동 ═══
  function spawnBunnies(bunniesData){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;
    playground.querySelectorAll('.bunny-char, .bunny-extra').forEach(el => el.remove());
    _bunnyChars = [];
    const w = playground.offsetWidth || 320;
    const groundTop = 130, groundBottom = 195;
    const showCount = Math.min(bunniesData.length, 12);
    const stage = getStage(_myBunny?.totalCo2 || 0);

    for(let i=0; i<showCount; i++){
      const bdata = bunniesData[i];
      const wrap = document.createElement('div');
      wrap.className = 'bunny-char';
      wrap.style.cssText = `position:absolute;cursor:pointer;user-select:none;z-index:${20+i};will-change:left,top,transform;line-height:0`;
      const withMask = stage.mask && i === 0; // 1단계일 때 첫 토끼만 마스크
      wrap.innerHTML = `<div class="bunny-svg">${bunnySvg(bdata.color, 'normal', withMask)}</div><div class="bunny-grass" style="position:absolute;top:30px;left:-12px;font-size:14px;display:none;line-height:1">🌿</div><div class="bunny-zzz" style="position:absolute;top:-10px;right:-4px;font-size:12px;display:none;line-height:1;animation:zzz 1.5s infinite">💤</div><div class="name-bubble" style="position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#fff;border:1.5px solid #FFB6C1;color:#5D4037;font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;white-space:nowrap;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.15);display:none;line-height:1.3">${bdata.name}</div>`;
      const idx = i;
      wrap.onclick = (e) => { e.stopPropagation(); showName(idx); bigJump(idx); window.petBunny(); };
      playground.appendChild(wrap);

      const bunny = {el:wrap, name:bdata.name, color:bdata.color, withMask,
        x: 20 + Math.random() * (w - 80),
        y: groundTop + Math.random() * (groundBottom - groundTop),
        vx: 0, hopOffset: Math.random() * Math.PI * 2,
        facing: Math.random() < 0.5 ? -1 : 1,
        stateTimer: 60 + Math.floor(Math.random() * 80),
        state: 'walk', groundTop, groundBottom, bubbleTimer: null};
      setState(bunny, 'walk');
      _bunnyChars.push(bunny);
    }

    if(bunniesData.length > 12){
      const more = document.createElement('div');
      more.className = 'bunny-extra';
      more.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;color:#5D4037;z-index:100';
      more.textContent = `+${bunniesData.length-12}마리 더!`;
      playground.appendChild(more);
    }

    const colors = bunniesData.map(b => b.color).join(',');
    _lastSpawnedKey = `${bunniesData.length}_${colors}_${stage.id}`;
    if(!document.getElementById('bunnyAnimStyle')){
      const style = document.createElement('style');
      style.id = 'bunnyAnimStyle';
      style.textContent = `@keyframes zzz { 0%{opacity:0;transform:translateY(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-8px)} } @keyframes stageUpFade { 0%{opacity:0;transform:scale(.8)} 100%{opacity:1;transform:scale(1)} }`;
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
    b.bubbleTimer = setTimeout(() => { bubble.style.display = 'none'; }, 2000);
  }
  function setState(b, newState){
    b.state = newState;
    const grass = b.el.querySelector('.bunny-grass'), zzz = b.el.querySelector('.bunny-zzz'), svg = b.el.querySelector('.bunny-svg');
    if(grass) grass.style.display = newState === 'eat' ? 'block' : 'none';
    if(zzz) zzz.style.display = newState === 'rest' ? 'block' : 'none';
    let mood = 'normal';
    if(newState === 'rest') mood = 'sleep';
    else if(newState === 'eat') mood = 'happy';
    if(svg) svg.innerHTML = bunnySvg(b.color, mood, b.withMask);
    if(newState === 'walk'){ b.vx = (Math.random()<0.5?-1:1)*(0.4+Math.random()*0.4); b.facing = b.vx>0?1:-1; }
    else if(newState === 'run'){ b.vx = (Math.random()<0.5?-1:1)*(1.4+Math.random()*0.6); b.facing = b.vx>0?1:-1; }
    else { b.vx = 0; }
  }
  function startBunnyAnim(){
    if(_animLoop){ clearInterval(_animLoop); _animLoop = null; }
    let frame = 0;
    _animLoop = setInterval(() => {
      frame++;
      const playground = document.getElementById('bunnyPlayground');
      if(!playground){ clearInterval(_animLoop); _animLoop = null; return; }
      const w = playground.offsetWidth || 320;
      _bunnyChars.forEach((b) => {
        b.stateTimer--;
        if(b.stateTimer <= 0){
          const r = Math.random(); let newState;
          if(r<0.40) newState='walk'; else if(r<0.60) newState='eat'; else if(r<0.75) newState='look'; else if(r<0.88) newState='rest'; else newState='run';
          setState(b, newState);
          b.stateTimer = 70 + Math.floor(Math.random()*110);
        }
        let yOffset = 0, extraTransform = '';
        if(b.state === 'walk'){ b.x += b.vx; yOffset = Math.abs(Math.sin(frame*0.18+b.hopOffset))*8; }
        else if(b.state === 'run'){ b.x += b.vx; yOffset = Math.abs(Math.sin(frame*0.32+b.hopOffset))*16; }
        else if(b.state === 'eat'){ extraTransform = ` rotate(${Math.sin(frame*0.4)*1.5}deg)`; }
        else if(b.state === 'rest'){ yOffset = Math.sin(frame*0.08)*1.5; }
        else if(b.state === 'look'){ yOffset = Math.sin(frame*0.1)*1; }
        if(b.x < 5){ b.x = 5; if(b.vx !== 0){ b.vx = Math.abs(b.vx); b.facing = 1; }}
        if(b.x > w-65){ b.x = w-65; if(b.vx !== 0){ b.vx = -Math.abs(b.vx); b.facing = -1; }}
        b.el.style.left = b.x+'px';
        b.el.style.top = (b.y - yOffset)+'px';
        b.el.style.transform = `scaleX(${b.facing})` + extraTransform;
        const bubble = b.el.querySelector('.name-bubble');
        if(bubble && bubble.style.display === 'block') bubble.style.transform = `translateX(-50%) scaleX(${b.facing})`;
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
    setTimeout(() => {
      el.style.transition = 'transform .25s';
      el.style.transform = `scaleX(${b.facing}) scale(1)`;
      setTimeout(() => {
        el.style.transition = '';
        if(svg && b.state !== 'eat' && b.state !== 'rest') svg.innerHTML = bunnySvg(b.color, 'normal', b.withMask);
      }, 250);
    }, 350);
  }

  // ═══ 단계 업 모달 ═══
  function showStageUp(stage, prevId){
    const imp = getImpact(_myBunny.totalCo2 || 0);
    const old = document.getElementById('ovStageUp'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovStageUp';
    modal.style.cssText = `position:fixed;inset:0;background:${stage.bg};z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 20px;animation:stageUpFade .8s ease-out`;
    modal.innerHTML = `
      <div style="text-align:center;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.3);max-width:340px">
        <div style="font-size:11px;font-weight:700;letter-spacing:3px;opacity:.85">STAGE ${stage.id+1}/5 도달</div>
        <div style="font-size:32px;font-weight:900;margin-top:8px">${stage.name}</div>
        <div style="font-size:15px;margin-top:14px;font-weight:700">"${stage.msg}"</div>
        <div style="font-size:12px;margin-top:6px;opacity:.9">${stage.sub}</div>
      </div>
      <div style="background:rgba(255,255,255,.95);border-radius:18px;padding:18px;margin-top:24px;width:100%;max-width:340px;box-shadow:0 10px 30px rgba(0,0,0,.3)">
        <div style="font-size:10px;color:#1a6b3a;font-weight:700;letter-spacing:2px;text-align:center;margin-bottom:12px">💚 당신이 만든 진짜 변화</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🌳</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.trees}그루</div><div style="font-size:9px;color:#666">나무 1년치</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🚗</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.carKm}km</div><div style="font-size:9px;color:#666">차 안 탄 거</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">☕</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.cups}개</div><div style="font-size:9px;color:#666">일회용컵 안 쓴 거</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🐰</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.sqm}평</div><div style="font-size:9px;color:#666">토끼가 살 숲</div></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:20px;width:100%;max-width:340px">
        <button onclick="shareStageCard(${stage.id})" style="flex:1;background:#fff;border:none;border-radius:14px;padding:14px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;color:#C44569">📸 인증 공유</button>
        <button onclick="document.getElementById('ovStageUp').remove()" style="flex:1;background:rgba(0,0,0,.4);border:1.5px solid rgba(255,255,255,.3);color:#fff;border-radius:14px;padding:14px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">계속하기</button>
      </div>`;
    document.body.appendChild(modal);
  }

  window.shareStageCard = async function(stageId){
    const stage = STAGES[stageId];
    const imp = getImpact(_myBunny.totalCo2 || 0);
    const text = `🌍 EcoQuest STAGE ${stageId+1}/5 — ${stage.name} 도달!\n"${stage.msg}"\n\n💚 내가 만든 임팩트:\n🌳 나무 ${imp.trees}그루 · 🚗 자동차 ${imp.carKm}km · ☕ 일회용컵 ${imp.cups}개\n\n#에코퀘스트 #EcoQuest #환경챌린지\nhttps://eco-quest.kr`;
    try {
      if(navigator.share){
        await navigator.share({title:`EcoQuest STAGE ${stageId+1}`, text, url:'https://eco-quest.kr'});
      } else {
        await navigator.clipboard.writeText(text);
        window.toast('📋 클립보드에 복사됐어요! 인스타에 붙여넣기!');
      }
    } catch(e){console.log('공유 취소:', e.message);}
  };

  // ═══ 액션 ═══
  window.buyCarrot = async function(){
    if(!window.ME || !_myBunny) return;
    const myPoints = window.UDATA?.point || 0;
    if(myPoints < 10){window.toast("포인트가 부족해요!"); return;}
    try {
      const newP = myPoints - 10;
      await window.FB.updateDoc(window.FB.doc(window.FB.db, "users", window.ME.uid), {point: newP});
      window.UDATA.point = newP;
      _myBunny.carrots = (_myBunny.carrots || 0) + 1;
      await saveBunny();
      if(window.updateUI) window.updateUI();
      window.toast("🥕 당근 1개 샀어요!");
    } catch(e){window.toast("실패: " + e.message);}
  };
  window.feedBunny = async function(){
    if(!_myBunny) return;
    if((_myBunny.carrots||0) < 1){window.toast("당근이 부족해요!"); return;}
    _myBunny.carrots--;
    _myBunny.happiness = Math.min(100, (_myBunny.happiness||0) + 10);
    await saveBunny();
    _bunnyChars.forEach((_,i) => setTimeout(() => bigJump(i), i*80));
    window.toast("🍴 토끼들이 행복해해요! 행복도 +10");
  };
  window.petBunny = async function(){
    if(!_myBunny) return;
    if(Date.now() - _petTimer < 800) return;
    _petTimer = Date.now();
    _myBunny.happiness = Math.min(100, (_myBunny.happiness||0) + 1);
    await saveBunny();
  };

  // ═══ Hooks (CO2 누적 + 단계 변환 감지) ═══
  function hookSaveMission(){
    if(window._bunnyHookedSaveMission) return;
    const orig = window.saveMission;
    if(typeof orig !== "function"){setTimeout(hookSaveMission, 1000); return;}
    window.saveMission = async function(uid, m){
      const res = await orig(uid, m);
      if(res && _myBunny && uid === window.ME?.uid){
        _myBunny.carrots = (_myBunny.carrots || 0) + 1;
        const co2 = (m && (m.co2 || m.co2Reduced)) || 0.5;
        _myBunny.totalCo2 = (_myBunny.totalCo2 || 0) + co2;
        await saveBunny();
        checkStageUp();
      }
      return res;
    };
    window._bunnyHookedSaveMission = true;
  }
  function hookJoinGathering(){
    if(window._bunnyHookedJoinGathering) return;
    const orig = window.joinGathering;
    if(typeof orig !== "function"){setTimeout(hookJoinGathering, 1000); return;}
    window.joinGathering = async function(gid){
      await orig(gid);
      if(_myBunny){
        _myBunny.carrots = (_myBunny.carrots || 0) + 5;
        _myBunny.totalCo2 = (_myBunny.totalCo2 || 0) + 2;
        await saveBunny();
        checkStageUp();
        setTimeout(() => window.toast("🥕 깅 참여 +5! CO₂ +2kg"), 1200);
      }
    };
    window._bunnyHookedJoinGathering = true;
  }

  function changeTabIcon(){
    const tryIt = () => {
      const tabs = document.querySelectorAll('.tb');
      if(!tabs.length) return false;
      let found = false;
      tabs.forEach(tab => {
        if(tab.dataset.page === 'map'){
          const ic = tab.querySelector('.ic');
          if(ic) ic.textContent = '🐰';
          for(const node of tab.childNodes){
            if(node.nodeType === 3 && node.textContent.trim()){ node.textContent = '토끼'; break; }
          }
          found = true;
        }
      });
      return found;
    };
    if(!tryIt()){
      let attempts = 0;
      const interval = setInterval(() => { attempts++; if(tryIt() || attempts>10) clearInterval(interval); }, 500);
    }
  }

  function boot(){
    if(!window.FB){setTimeout(boot, 500); return;}
    initBunnyOnMap();
    hookSaveMission();
    hookJoinGathering();
    changeTabIcon();
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 1500));
  } else {
    setTimeout(boot, 1500);
  }

})();
