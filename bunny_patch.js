(function(){

  // ═══ SVG 토끼 캐릭터 (5단계 색상) ═══
  const PALETTES = [
    {body:'#FFE4E1', ear:'#FFB6C1', earIn:'#FFCCD5', size:0.72, isBaby:true},  // 아기 (분홍)
    {body:'#FFF8DC', ear:'#FFCBAA', earIn:'#FFE4C4', size:0.85},                // 청소년 (크림)
    {body:'#FFFFFF', ear:'#FFB6C1', earIn:'#FFE4E1', size:1.0},                 // 어른 (흰색)
    {body:'#F5DEB3', ear:'#D2B48C', earIn:'#DEB887', size:1.05},                // 부모 (베이지)
    {body:'#A0826D', ear:'#7D5E47', earIn:'#8B6F47', size:1.0},                 // 가족 (갈색)
  ];

  const BUNNY_LEVELS = [
    {min: 0,  name: "아기 토끼"},
    {min: 3,  name: "청소년 토끼"},
    {min: 7,  name: "어른 토끼"},
    {min: 15, name: "부모 토끼"},
    {min: 30, name: "가족 토끼"},
  ];

  function bunnySvg(stageIdx, mood){
    const p = PALETTES[Math.min(stageIdx, 4)];
    let eyes;
    if(mood === 'sleep'){
      eyes = `<path d="M22 30 Q24 32 26 30" stroke="#222" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <path d="M34 30 Q36 32 38 30" stroke="#222" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    } else if(mood === 'happy'){
      eyes = `<path d="M22 31 Q24 28 26 31" stroke="#222" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              <path d="M34 31 Q36 28 38 31" stroke="#222" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    } else {
      eyes = `<circle cx="24" cy="30" r="2.2" fill="#222"/>
              <circle cx="36" cy="30" r="2.2" fill="#222"/>
              <circle cx="24.7" cy="29.3" r=".8" fill="#fff"/>
              <circle cx="36.7" cy="29.3" r=".8" fill="#fff"/>`;
    }
    return `<svg viewBox="0 0 60 75" style="width:${60*p.size}px;height:${75*p.size}px;display:block;overflow:visible">
      <ellipse cx="30" cy="73" rx="20" ry="2.5" fill="#000" opacity=".15"/>
      <ellipse cx="22" cy="11" rx="4.5" ry="11" fill="${p.ear}"/>
      <ellipse cx="22" cy="13" rx="2.2" ry="7.5" fill="${p.earIn}"/>
      <ellipse cx="38" cy="11" rx="4.5" ry="11" fill="${p.ear}"/>
      <ellipse cx="38" cy="13" rx="2.2" ry="7.5" fill="${p.earIn}"/>
      <ellipse cx="30" cy="56" rx="19" ry="13" fill="${p.body}"/>
      <circle cx="30" cy="32" r="16" fill="${p.body}"/>
      ${eyes}
      <ellipse cx="30" cy="36.5" rx="1.8" ry="1.3" fill="#FF6B9D"/>
      <path d="M30 38 L30 39.5 M30 39.5 Q27.5 41.5 26 40.5 M30 39.5 Q32.5 41.5 34 40.5" stroke="#444" stroke-width="1" fill="none" stroke-linecap="round"/>
      ${p.isBaby ? `<circle cx="19" cy="36" r="2.8" fill="#FFB6C1" opacity=".55"/>
                    <circle cx="41" cy="36" r="2.8" fill="#FFB6C1" opacity=".55"/>` : ''}
      <ellipse cx="18" cy="68" rx="6" ry="3.5" fill="${p.ear}"/>
      <ellipse cx="42" cy="68" rx="6" ry="3.5" fill="${p.ear}"/>
      <ellipse cx="22" cy="62" rx="3" ry="2" fill="${p.body}"/>
      <ellipse cx="38" cy="62" rx="3" ry="2" fill="${p.body}"/>
    </svg>`;
  }

  // ═══ 상태 ═══
  let _myBunny = null;
  let _petTimer = 0;
  let _bunnyChars = [];
  let _animLoop = null;
  let _lastSpawnedKey = '';

  function getBunnyLevel(friends){
    let lv = BUNNY_LEVELS[0], idx = 0;
    for(let i = BUNNY_LEVELS.length - 1; i >= 0; i--){
      if(friends >= BUNNY_LEVELS[i].min){lv = BUNNY_LEVELS[i]; idx = i; break;}
    }
    return {...lv, stage: idx};
  }

  function getNextLevel(friends){
    return BUNNY_LEVELS.find(l => l.min > friends);
  }

  // ═══ Firestore ═══
  async function loadBunny(){
    if(!window.ME || !window.FB) return;
    try {
      const ref = window.FB.doc(window.FB.db, "bunnies", window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      if(snap.exists()){
        _myBunny = snap.data();
      } else {
        _myBunny = {carrots: 0, happiness: 0, friendCount: 0, createdAt: window.FB.serverTimestamp()};
        await window.FB.setDoc(ref, _myBunny);
      }
      renderBunnyMap();
    } catch(e){console.log("토끼 로드 실패:", e.message);}
  }

  async function saveBunny(){
    if(!window.ME || !_myBunny) return;
    try {
      await window.FB.setDoc(window.FB.doc(window.FB.db, "bunnies", window.ME.uid), _myBunny);
      renderBunnyStats();
      const targetCount = (_myBunny.friendCount || 0) + 1;
      const lv = getBunnyLevel(_myBunny.friendCount || 0);
      const newKey = `${targetCount}_${lv.stage}`;
      if(newKey !== _lastSpawnedKey){
        spawnBunnies(targetCount, lv.stage);
      }
    } catch(e){console.log("토끼 저장 실패:", e.message);}
  }

  // ═══ 지도 페이지 초기화 ═══
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
    if(!_myBunny){
      c.innerHTML = '<div style="text-align:center;padding:40px;color:#888;font-size:13px">🐰 토끼 데이터 로딩 중...</div>';
      return;
    }
    const globalCo2 = parseFloat(document.getElementById("bCo2")?.textContent) || 0;
    const totalUsers = parseInt(document.getElementById("bTotal")?.textContent?.replace(/,/g, "") || "0");
    const totalTrees = (globalCo2 / 21.4).toFixed(1);

    c.innerHTML = `
      <div style="margin:12px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:14px;padding:10px 14px;color:#fff;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:9px;color:rgba(255,255,255,.6);font-weight:600;letter-spacing:1px">🌍 우리가 함께 지킨 지구</div>
          <div style="font-size:13px;font-weight:900;color:#a8f0c6;margin-top:1px">CO₂ ${globalCo2.toFixed(1)}kg · 🌳 ${totalTrees}그루 · 👥 ${totalUsers ? totalUsers.toLocaleString() : 0}명</div>
        </div>
      </div>

      <div id="bunnyPlayground" style="position:relative;margin:0 12px;height:260px;background:linear-gradient(180deg,#87CEEB 0%,#B5DCF0 45%,#A8DC8E 50%,#76B947 100%);border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);user-select:none">
        <div style="position:absolute;top:8px;left:24px;font-size:22px;opacity:.85">☁️</div>
        <div style="position:absolute;top:18px;right:36px;font-size:18px;opacity:.7">☁️</div>
        <div style="position:absolute;top:38px;left:50%;font-size:14px;opacity:.6">☁️</div>
        <div style="position:absolute;top:6px;right:14px;font-size:24px">☀️</div>
        <div style="position:absolute;bottom:6px;left:18px;font-size:14px">🌱</div>
        <div style="position:absolute;bottom:4px;left:80px;font-size:13px">🌿</div>
        <div style="position:absolute;bottom:8px;left:200px;font-size:16px">🌷</div>
        <div style="position:absolute;bottom:6px;right:60px;font-size:14px">🌱</div>
        <div style="position:absolute;bottom:10px;right:20px;font-size:18px">🌼</div>
        <div style="position:absolute;bottom:12px;left:140px;font-size:12px">🌾</div>
        <div id="bunnyHelpText" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:12px;padding:3px 10px;font-size:10px;color:#444;font-weight:600;pointer-events:none;z-index:5">토끼를 탭해서 쓰다듬어요!</div>
      </div>

      <div id="bunnyStats"></div>
    `;
    renderBunnyStats();
    setTimeout(() => {
      const lv = getBunnyLevel(_myBunny.friendCount || 0);
      spawnBunnies((_myBunny.friendCount || 0) + 1, lv.stage);
    }, 100);
  }

  function renderBunnyStats(){
    const c = document.getElementById("bunnyStats");
    if(!c || !_myBunny) return;
    const friends = _myBunny.friendCount || 0;
    const happiness = _myBunny.happiness || 0;
    const carrots = _myBunny.carrots || 0;
    const lv = getBunnyLevel(friends);
    const next = getNextLevel(friends);
    const myPoints = window.UDATA?.point || 0;

    c.innerHTML = `
      <div style="margin:12px">
        <div style="background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;padding:14px 16px;text-align:center;border:2px solid #FFE082;margin-bottom:12px">
          <div style="font-size:11px;color:#689F38;font-weight:700;letter-spacing:2px">🐰 MY BUNNY FAMILY</div>
          <div style="font-size:18px;font-weight:900;color:#1B5E20;margin-top:4px">${lv.name} · 친구 ${friends}마리</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px">
            <span style="color:#555;font-weight:600">😊 행복도</span>
            <span style="color:#e91e63;font-weight:700">${happiness}/100</span>
          </div>
          <div style="height:8px;background:#fce4ec;border-radius:4px;overflow:hidden;margin-top:4px">
            <div style="width:${Math.min(100,happiness)}%;height:100%;background:linear-gradient(90deg,#f06292,#e91e63);transition:width .5s"></div>
          </div>
          ${happiness >= 100 ? '<div style="font-size:11px;color:#C44569;margin-top:6px;font-weight:700">✨ 친구 토끼를 늘릴 수 있어요!</div>' : ''}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#FFF8E1;border-radius:14px;margin-bottom:12px;border:2px solid #FFE082">
          <div style="font-size:14px;font-weight:700;color:#8D6E1B">🥕 내 당근</div>
          <div style="font-size:22px;font-weight:900;color:#B8860B">${carrots}개</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="buyCarrot()" ${myPoints < 10 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${myPoints < 10 ? '#f5f5f5' : '#fff'};color:${myPoints < 10 ? '#aaa' : '#5D4037'};border:1.5px solid ${myPoints < 10 ? '#e0e0e0' : '#FFD54F'};border-radius:12px;font-size:14px;cursor:${myPoints < 10 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🥕 당근 사기</span><span style="color:#FF8F00;font-weight:600">10P → 1개</span>
          </button>
          <button onclick="feedBunny()" ${carrots < 1 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${carrots < 1 ? '#f5f5f5' : 'linear-gradient(135deg,#2ECC71,#27AE60)'};color:${carrots < 1 ? '#aaa' : '#fff'};border:none;border-radius:12px;font-size:14px;cursor:${carrots < 1 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🍴 먹이 주기</span><span style="font-weight:600">${carrots < 1 ? '당근 부족' : '당근 -1, 행복+10'}</span>
          </button>
          <button onclick="addFriend()" ${happiness < 100 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${happiness < 100 ? '#f5f5f5' : 'linear-gradient(135deg,#FF6B9D,#C44569)'};color:${happiness < 100 ? '#aaa' : '#fff'};border:none;border-radius:12px;font-size:14px;cursor:${happiness < 100 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🐰 친구 토끼 늘리기</span><span style="font-weight:600">${happiness < 100 ? `행복 ${100-happiness} 더` : '✨ 가능!'}</span>
          </button>
        </div>

        <div style="margin-top:12px;padding:11px 13px;background:#f0fbf4;border-radius:10px;font-size:11px;color:#1B5E20;line-height:1.8">
          💡 미션 1개 완료 = 🥕 +1 자동 · 깅 참여 = 🥕 +5<br/>
          💡 토끼 직접 탭 = 쓰다듬기 (행복+1)<br/>
          💡 ${next ? `다음 단계: 친구 ${next.min}마리 → ${next.name}` : '✨ 최고 단계 도달!'}
        </div>

        <div style="margin-top:12px;padding:12px;background:#fff;border-radius:12px;border:1px solid #d8eedd">
          <div style="font-size:11px;font-weight:900;color:#1a2e1a;margin-bottom:10px">🌱 토끼 가족 성장 단계</div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;text-align:center">
            ${BUNNY_LEVELS.map((l, idx) => `
              <div style="opacity:${friends >= l.min ? 1 : 0.35};flex:1">
                <div style="display:flex;justify-content:center;height:50px;align-items:flex-end">${bunnySvg(idx, 'normal').replace('width:'+(60*PALETTES[idx].size), 'width:'+(36*PALETTES[idx].size)).replace('height:'+(75*PALETTES[idx].size), 'height:'+(45*PALETTES[idx].size))}</div>
                <div style="font-size:9px;color:#666;margin-top:3px;font-weight:700">${l.name}</div>
                <div style="font-size:9px;color:#999">${l.min === 0 ? '시작' : l.min + '+'}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="height:20px"></div>
      </div>
    `;
  }

  // ═══ 토끼 캐릭터 생성 + 행동 ═══
  function spawnBunnies(count, stage){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    playground.querySelectorAll('.bunny-char, .bunny-extra').forEach(el => el.remove());
    _bunnyChars = [];

    const w = playground.offsetWidth || 320;
    const groundTop = 130;
    const groundBottom = 200;
    const showCount = Math.min(count, 12);

    for(let i = 0; i < showCount; i++){
      const wrap = document.createElement('div');
      wrap.className = 'bunny-char';
      wrap.style.cssText = `position:absolute;cursor:pointer;user-select:none;z-index:${20+i};will-change:left,top,transform;line-height:0`;
      wrap.innerHTML = `
        <div class="bunny-svg">${bunnySvg(stage, 'normal')}</div>
        <div class="bunny-grass" style="position:absolute;top:30px;left:-12px;font-size:14px;display:none;line-height:1">🌿</div>
        <div class="bunny-zzz" style="position:absolute;top:-12px;right:-8px;font-size:12px;display:none;line-height:1;animation:zzz 1.5s infinite">💤</div>
      `;
      const idx = i;
      wrap.onclick = (e) => {
        e.stopPropagation();
        bigJump(idx);
        window.petBunny();
      };
      playground.appendChild(wrap);

      const bunny = {
        el: wrap,
        x: 20 + Math.random() * (w - 80),
        y: groundTop + Math.random() * (groundBottom - groundTop),
        vx: 0,
        hopOffset: Math.random() * Math.PI * 2,
        facing: Math.random() < 0.5 ? -1 : 1,
        stateTimer: 60 + Math.floor(Math.random() * 80),
        state: 'walk',
        stage: stage,
        groundTop, groundBottom
      };
      setState(bunny, 'walk');
      _bunnyChars.push(bunny);
    }

    if(count > 12){
      const more = document.createElement('div');
      more.className = 'bunny-extra';
      more.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;color:#5D4037;z-index:100';
      more.textContent = `+${count - 12}마리 더!`;
      playground.appendChild(more);
    }

    _lastSpawnedKey = `${count}_${stage}`;

    // CSS 애니메이션 정의 (한 번만)
    if(!document.getElementById('bunnyAnimStyle')){
      const style = document.createElement('style');
      style.id = 'bunnyAnimStyle';
      style.textContent = `@keyframes zzz { 0%{opacity:0;transform:translateY(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-8px)} }`;
      document.head.appendChild(style);
    }

    startBunnyAnim();
  }

  function setState(b, newState){
    b.state = newState;
    const grass = b.el.querySelector('.bunny-grass');
    const zzz = b.el.querySelector('.bunny-zzz');
    const svg = b.el.querySelector('.bunny-svg');

    if(grass) grass.style.display = newState === 'eat' ? 'block' : 'none';
    if(zzz) zzz.style.display = newState === 'rest' ? 'block' : 'none';

    let mood = 'normal';
    if(newState === 'rest') mood = 'sleep';
    else if(newState === 'eat') mood = 'happy';
    if(svg) svg.innerHTML = bunnySvg(b.stage, mood);

    if(newState === 'walk'){
      b.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
      b.facing = b.vx > 0 ? 1 : -1;
    } else if(newState === 'run'){
      b.vx = (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 0.6);
      b.facing = b.vx > 0 ? 1 : -1;
    } else {
      b.vx = 0;
    }
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
        // 상태 타이머
        b.stateTimer--;
        if(b.stateTimer <= 0){
          const r = Math.random();
          let newState;
          if(r < 0.40) newState = 'walk';
          else if(r < 0.60) newState = 'eat';
          else if(r < 0.75) newState = 'look';
          else if(r < 0.88) newState = 'rest';
          else newState = 'run';
          setState(b, newState);
          b.stateTimer = 70 + Math.floor(Math.random() * 110);
        }

        // 상태별 동작
        let yOffset = 0;
        let extraTransform = '';

        if(b.state === 'walk'){
          b.x += b.vx;
          yOffset = Math.abs(Math.sin(frame * 0.18 + b.hopOffset)) * 8;
        } else if(b.state === 'run'){
          b.x += b.vx;
          yOffset = Math.abs(Math.sin(frame * 0.32 + b.hopOffset)) * 16;
        } else if(b.state === 'eat'){
          // 머리 살짝 흔들면서 풀 뜯는 느낌
          const wiggle = Math.sin(frame * 0.4) * 4;
          extraTransform = ` rotate(${wiggle * 0.5}deg)`;
        } else if(b.state === 'rest'){
          // 살짝 위아래 (숨쉬는 느낌)
          yOffset = Math.sin(frame * 0.08) * 1.5;
        } else if(b.state === 'look'){
          // 가끔 살짝 움직임 (호흡)
          yOffset = Math.sin(frame * 0.1) * 1;
        }

        // 경계 체크
        if(b.x < 5){ b.x = 5; if(b.vx !== 0){ b.vx = Math.abs(b.vx); b.facing = 1; }}
        if(b.x > w - 50){ b.x = w - 50; if(b.vx !== 0){ b.vx = -Math.abs(b.vx); b.facing = -1; }}

        b.el.style.left = b.x + 'px';
        b.el.style.top = (b.y - yOffset) + 'px';
        b.el.style.transform = `scaleX(${b.facing})` + extraTransform;
      });
    }, 50);
  }

  function bigJump(idx){
    const b = _bunnyChars[idx];
    if(!b) return;
    const el = b.el;
    el.style.transition = 'transform .35s cubic-bezier(.5,2,.3,.8)';
    el.style.transform = `scaleX(${b.facing}) translateY(-30px) scale(1.25)`;
    // 행복 표정으로 잠깐 변경
    const svg = el.querySelector('.bunny-svg');
    const oldHTML = svg ? svg.innerHTML : '';
    if(svg) svg.innerHTML = bunnySvg(b.stage, 'happy');
    setTimeout(() => {
      el.style.transition = 'transform .25s';
      el.style.transform = `scaleX(${b.facing}) scale(1)`;
      setTimeout(() => {
        el.style.transition = '';
        if(svg && b.state !== 'eat' && b.state !== 'rest') svg.innerHTML = bunnySvg(b.stage, 'normal');
      }, 250);
    }, 350);
  }

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
    _bunnyChars.forEach((_, i) => setTimeout(() => bigJump(i), i * 80));
    window.toast("🍴 토끼들이 행복해해요! 행복도 +10");
  };

  window.petBunny = async function(){
    if(!_myBunny) return;
    if(Date.now() - _petTimer < 800) return;
    _petTimer = Date.now();
    _myBunny.happiness = Math.min(100, (_myBunny.happiness||0) + 1);
    await saveBunny();
  };

  window.addFriend = async function(){
    if(!_myBunny) return;
    if((_myBunny.happiness||0) < 100){window.toast("행복도 100 필요해요!"); return;}
    _myBunny.friendCount = (_myBunny.friendCount || 0) + 1;
    _myBunny.happiness = 0;
    await saveBunny();
    const lv = getBunnyLevel(_myBunny.friendCount);
    setTimeout(() => {
      _bunnyChars.forEach((_, i) => setTimeout(() => bigJump(i), i * 100));
    }, 200);
    window.toast(`🎉 친구 토끼 늘었어요! (${_myBunny.friendCount}마리 · ${lv.name})`);
  };

  // ═══ 미션/깅 hook ═══
  function hookSaveMission(){
    if(window._bunnyHookedSaveMission) return;
    const orig = window.saveMission;
    if(typeof orig !== "function"){setTimeout(hookSaveMission, 1000); return;}
    window.saveMission = async function(uid, m){
      const res = await orig(uid, m);
      if(res && _myBunny && uid === window.ME?.uid){
        _myBunny.carrots = (_myBunny.carrots || 0) + 1;
        await saveBunny();
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
        await saveBunny();
        setTimeout(() => window.toast("🥕 깅 참여 보너스 +5!"), 1200);
      }
    };
    window._bunnyHookedJoinGathering = true;
  }

  // ═══ 탭바 아이콘 변경 (🌍 지도 → 🐰 토끼) ═══
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
            if(node.nodeType === 3 && node.textContent.trim()){
              node.textContent = '토끼';
              break;
            }
          }
          found = true;
        }
      });
      return found;
    };
    if(!tryIt()){
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if(tryIt() || attempts > 10) clearInterval(interval);
      }, 500);
    }
  }

  // ═══ Boot ═══
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
