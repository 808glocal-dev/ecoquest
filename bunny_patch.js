(function(){

  // ═══ SVG 토끼 (모두 같은 작은 사이즈, 색상만 5종) ═══
  const PALETTES = [
    {head:'#A0826D', body:'#FAF0E6', ear:'#7D5E47', earIn:'#BFA088', muzzle:'#FFF8F0', tail:'#FFF'},
    {head:'#D3D3D3', body:'#FFF',    ear:'#A9A9A9', earIn:'#C8C8C8', muzzle:'#FFF',    tail:'#FFF'},
    {head:'#FFFFFF', body:'#FFFFFF', ear:'#E8B4BC', earIn:'#FFE4E1', muzzle:'#FFF',    tail:'#FFF'},
    {head:'#E8C9A0', body:'#E8C9A0', ear:'#C8A878', earIn:'#D8B888', muzzle:'#FFF8DC', tail:'#FFF8DC'},
    {head:'#8B6F47', body:'#8B6F47', ear:'#5C3A1E', earIn:'#7D5E47', muzzle:'#E8DCC4', tail:'#E8DCC4'},
  ];
  const BUNNY_SIZE = 0.85;

  function bunnySvg(colorIdx, mood){
    const p = PALETTES[Math.min(colorIdx, 4)];
    let eye;
    if(mood === 'sleep'){
      eye = `<path d="M61 27 Q63 28 65 27" stroke="#222" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    } else if(mood === 'happy'){
      eye = `<path d="M61 27 Q63 25.5 65 27" stroke="#222" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    } else {
      eye = `<circle cx="63" cy="27" r="1.7" fill="#222"/>
             <circle cx="63.5" cy="26.5" r=".5" fill="#fff"/>`;
    }
    const showMuzzle = p.muzzle && p.muzzle !== p.head;
    return `<svg viewBox="0 0 80 58" style="width:${72*BUNNY_SIZE}px;height:${52*BUNNY_SIZE}px;display:block;overflow:visible">
      <ellipse cx="40" cy="55" rx="30" ry="2" fill="#000" opacity=".18"/>
      <ellipse cx="54" cy="13" rx="3.2" ry="9.5" fill="${p.ear}" transform="rotate(-15 54 13)"/>
      <ellipse cx="54" cy="14" rx="1.4" ry="6.5" fill="${p.earIn}" transform="rotate(-15 54 14)"/>
      <ellipse cx="62" cy="12" rx="3.2" ry="9.5" fill="${p.ear}" transform="rotate(10 62 12)"/>
      <ellipse cx="62" cy="13" rx="1.4" ry="6.5" fill="${p.earIn}" transform="rotate(10 62 13)"/>
      <circle cx="9" cy="36" r="4.5" fill="${p.tail}"/>
      <ellipse cx="38" cy="38" rx="24" ry="15" fill="${p.body}"/>
      <circle cx="20" cy="36" r="13" fill="${p.body}"/>
      <circle cx="60" cy="28" r="13" fill="${p.head}"/>
      ${showMuzzle ? `<ellipse cx="68" cy="32" rx="8" ry="6" fill="${p.muzzle}" opacity=".88"/>` : ''}
      ${eye}
      <ellipse cx="73" cy="32" rx="1.5" ry="1.2" fill="#E89AAB"/>
      <path d="M73 33.3 Q72 34.5 70.5 34" stroke="#3D2817" stroke-width=".7" fill="none" stroke-linecap="round"/>
      <ellipse cx="22" cy="51" rx="9" ry="3.5" fill="${p.body}"/>
      <ellipse cx="52" cy="50" rx="3" ry="3.2" fill="${p.body}"/>
      <ellipse cx="58" cy="50" rx="3" ry="3.2" fill="${p.head}"/>
    </svg>`;
  }

  // ═══ 상태 ═══
  let _myBunny = null, _petTimer = 0, _bunnyChars = [], _animLoop = null, _lastSpawnedKey = '';

  async function loadBunny(){
    if(!window.ME || !window.FB) return;
    try {
      const ref = window.FB.doc(window.FB.db, "bunnies", window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      if(snap.exists()){
        _myBunny = snap.data();
        // 마이그레이션: friendCount → bunnies 배열
        if(!_myBunny.bunnies || !Array.isArray(_myBunny.bunnies)){
          const cnt = (_myBunny.friendCount || 0) + 1;
          _myBunny.bunnies = [];
          for(let i = 0; i < cnt; i++){
            _myBunny.bunnies.push({
              name: i === 0 ? "꼬미" : `토끼${i+1}`,
              color: i === 0 ? 0 : Math.floor(Math.random() * 5)
            });
          }
          delete _myBunny.friendCount;
          await window.FB.setDoc(ref, _myBunny);
        }
      } else {
        _myBunny = {
          carrots: 0, happiness: 0,
          bunnies: [{name: "꼬미", color: 0}],
          createdAt: window.FB.serverTimestamp()
        };
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
      const cnt = (_myBunny.bunnies || []).length;
      const colors = (_myBunny.bunnies || []).map(b => b.color).join(',');
      const newKey = `${cnt}_${colors}`;
      if(newKey !== _lastSpawnedKey){ spawnBunnies(_myBunny.bunnies || []); }
    } catch(e){console.log("토끼 저장 실패:", e.message);}
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
    const globalCo2 = parseFloat(document.getElementById("bCo2")?.textContent) || 0;
    const totalTrees = (globalCo2 / 21.4).toFixed(1);

    c.innerHTML = `
      <div style="margin:12px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:14px;padding:10px 14px;color:#fff;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:9px;color:rgba(255,255,255,.6);font-weight:600;letter-spacing:1px">🌍 우리가 함께 지킨 지구</div>
          <div style="font-size:13px;font-weight:900;color:#a8f0c6;margin-top:1px">CO₂ ${globalCo2.toFixed(1)}kg · 🌳 ${totalTrees}그루</div>
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
        <div id="bunnyHelpText" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:12px;padding:3px 10px;font-size:10px;color:#444;font-weight:600;pointer-events:none;z-index:5">토끼를 탭하면 이름이 보여요!</div>
      </div>

      <div id="bunnyStats"></div>
    `;
    renderBunnyStats();
    setTimeout(() => spawnBunnies(_myBunny.bunnies || []), 100);
  }

  function renderBunnyStats(){
    const c = document.getElementById("bunnyStats");
    if(!c || !_myBunny) return;
    const bunnies = _myBunny.bunnies || [];
    const happiness = _myBunny.happiness || 0;
    const carrots = _myBunny.carrots || 0;
    const myPoints = window.UDATA?.point || 0;

    c.innerHTML = `
      <div style="margin:12px">
        <div style="background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;padding:14px 16px;text-align:center;border:2px solid #FFE082;margin-bottom:12px">
          <div style="font-size:11px;color:#689F38;font-weight:700;letter-spacing:2px">🐰 MY BUNNY FAMILY</div>
          <div style="font-size:18px;font-weight:900;color:#1B5E20;margin-top:4px">우리 토끼 ${bunnies.length}마리</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px">
            <span style="color:#555;font-weight:600">😊 행복도</span>
            <span style="color:#e91e63;font-weight:700">${happiness}/100</span>
          </div>
          <div style="height:8px;background:#fce4ec;border-radius:4px;overflow:hidden;margin-top:4px">
            <div style="width:${Math.min(100,happiness)}%;height:100%;background:linear-gradient(90deg,#f06292,#e91e63);transition:width .5s"></div>
          </div>
          ${happiness >= 100 ? '<div style="font-size:11px;color:#C44569;margin-top:6px;font-weight:700">✨ 새 토끼를 입양할 수 있어요!</div>' : ''}
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
          <button onclick="adoptBunny()" ${happiness < 100 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${happiness < 100 ? '#f5f5f5' : 'linear-gradient(135deg,#FF6B9D,#C44569)'};color:${happiness < 100 ? '#aaa' : '#fff'};border:none;border-radius:12px;font-size:14px;cursor:${happiness < 100 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🐰 새 토끼 입양하기</span><span style="font-weight:600">${happiness < 100 ? `행복 ${100-happiness} 더` : '✨ 가능!'}</span>
          </button>
        </div>

        <div style="margin-top:12px;padding:11px 13px;background:#f0fbf4;border-radius:10px;font-size:11px;color:#1B5E20;line-height:1.8">
          💡 미션 1개 완료 = 🥕 +1 자동 · 깅 참여 = 🥕 +5<br/>
          💡 토끼 직접 탭 = 이름 보기 + 쓰다듬기 (행복+1)<br/>
          💡 행복도 100 → 새 토끼 입양 가능
        </div>

        <div style="margin-top:12px;padding:14px 12px;background:#fff;border-radius:12px;border:1px solid #d8eedd">
          <div style="font-size:11px;font-weight:900;color:#1a2e1a;margin-bottom:12px;text-align:center">🐾 우리 토끼 가족</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
            ${bunnies.map((b, i) => {
              const sm = bunnySvg(b.color, 'normal').replace(`width:${72*BUNNY_SIZE}px`, `width:42px`).replace(`height:${52*BUNNY_SIZE}px`, `height:30px`);
              return `<div style="text-align:center;padding:6px 4px;background:#f8fdf9;border-radius:10px;min-width:54px;border:1px solid #eee">
                <div style="height:34px;display:flex;justify-content:center;align-items:flex-end">${sm}</div>
                <div style="font-size:10px;color:#444;margin-top:3px;font-weight:700">${b.name}</div>
              </div>`;
            }).join('')}
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
    const old = document.getElementById('ovAdopt');
    if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovAdopt';
    modal.className = 'overlay on';
    modal.innerHTML = `
      <div class="modal" style="padding:24px 20px 20px">
        <button class="modal-close" onclick="document.getElementById('ovAdopt').remove()">✕</button>
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:48px">🐰</div>
          <div style="font-size:17px;font-weight:900;margin-top:6px;color:#1B5E20">새 토끼 입양하기</div>
          <div style="font-size:12px;color:#888;margin-top:6px">우리 가족이 될 토끼 이름을 지어주세요!</div>
        </div>
        <input id="newBunnyName" class="inp" placeholder="예: 꼬미, 토토, 보리, 마루..." maxlength="6" style="text-align:center;font-size:15px;font-weight:700"/>
        <div style="font-size:10px;color:#aaa;text-align:center;margin-top:6px">최대 6글자</div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn btn-gray" style="flex:1" onclick="document.getElementById('ovAdopt').remove()">취소</button>
          <button class="btn btn-g" style="flex:1" onclick="confirmAdopt()">🎉 입양!</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
      const inp = document.getElementById('newBunnyName');
      if(inp){
        inp.focus();
        inp.onkeydown = (e) => { if(e.key === 'Enter') window.confirmAdopt(); };
      }
    }, 100);
  };

  window.confirmAdopt = async function(){
    if(!_myBunny) return;
    const inp = document.getElementById('newBunnyName');
    let name = inp?.value?.trim() || '';
    if(!name) name = `토끼${(_myBunny.bunnies?.length || 0) + 1}`;
    if(name.length > 6) name = name.substring(0, 6);
    if(!_myBunny.bunnies) _myBunny.bunnies = [];
    _myBunny.bunnies.push({name, color: Math.floor(Math.random() * 5)});
    _myBunny.happiness = 0;
    await saveBunny();
    document.getElementById('ovAdopt')?.remove();
    setTimeout(() => { _bunnyChars.forEach((_, i) => setTimeout(() => bigJump(i), i * 100)); }, 300);
    window.toast(`🎉 "${name}" 우리 가족이 됐어요!`);
  };

  // ═══ 토끼 캐릭터 생성 + 행동 ═══
  function spawnBunnies(bunniesData){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;
    playground.querySelectorAll('.bunny-char, .bunny-extra').forEach(el => el.remove());
    _bunnyChars = [];
    const w = playground.offsetWidth || 320;
    const groundTop = 140;
    const groundBottom = 210;
    const showCount = Math.min(bunniesData.length, 12);

    for(let i = 0; i < showCount; i++){
      const bdata = bunniesData[i];
      const wrap = document.createElement('div');
      wrap.className = 'bunny-char';
      wrap.style.cssText = `position:absolute;cursor:pointer;user-select:none;z-index:${20+i};will-change:left,top,transform;line-height:0`;
      wrap.innerHTML = `
        <div class="bunny-svg">${bunnySvg(bdata.color, 'normal')}</div>
        <div class="bunny-grass" style="position:absolute;top:24px;left:-10px;font-size:14px;display:none;line-height:1">🌿</div>
        <div class="bunny-zzz" style="position:absolute;top:-10px;right:-4px;font-size:12px;display:none;line-height:1;animation:zzz 1.5s infinite">💤</div>
        <div class="name-bubble" style="position:absolute;top:-20px;left:50%;transform:translateX(-50%);background:#fff;border:1.5px solid #FFB6C1;color:#5D4037;font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;white-space:nowrap;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.15);display:none;line-height:1.3">${bdata.name}</div>
      `;
      const idx = i;
      wrap.onclick = (e) => {
        e.stopPropagation();
        showName(idx);
        bigJump(idx);
        window.petBunny();
      };
      playground.appendChild(wrap);

      const bunny = {
        el: wrap, name: bdata.name, color: bdata.color,
        x: 20 + Math.random() * (w - 90),
        y: groundTop + Math.random() * (groundBottom - groundTop),
        vx: 0,
        hopOffset: Math.random() * Math.PI * 2,
        facing: Math.random() < 0.5 ? -1 : 1,
        stateTimer: 60 + Math.floor(Math.random() * 80),
        state: 'walk', groundTop, groundBottom,
        bubbleTimer: null
      };
      setState(bunny, 'walk');
      _bunnyChars.push(bunny);
    }

    if(bunniesData.length > 12){
      const more = document.createElement('div');
      more.className = 'bunny-extra';
      more.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;color:#5D4037;z-index:100';
      more.textContent = `+${bunniesData.length - 12}마리 더!`;
      playground.appendChild(more);
    }

    const colors = bunniesData.map(b => b.color).join(',');
    _lastSpawnedKey = `${bunniesData.length}_${colors}`;

    if(!document.getElementById('bunnyAnimStyle')){
      const style = document.createElement('style');
      style.id = 'bunnyAnimStyle';
      style.textContent = `@keyframes zzz { 0%{opacity:0;transform:translateY(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-8px)} }`;
      document.head.appendChild(style);
    }

    startBunnyAnim();
  }

  function showName(idx){
    const b = _bunnyChars[idx];
    if(!b) return;
    const bubble = b.el.querySelector('.name-bubble');
    if(!bubble) return;
    // 말풍선은 facing 영향 받지 않게 transform 보정
    bubble.style.transform = `translateX(-50%) scaleX(${b.facing})`;
    bubble.style.display = 'block';
    clearTimeout(b.bubbleTimer);
    b.bubbleTimer = setTimeout(() => { bubble.style.display = 'none'; }, 2000);
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
    if(svg) svg.innerHTML = bunnySvg(b.color, mood);
    if(newState === 'walk'){
      b.vx = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);
      b.facing = b.vx > 0 ? 1 : -1;
    } else if(newState === 'run'){
      b.vx = (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 0.6);
      b.facing = b.vx > 0 ? 1 : -1;
    } else { b.vx = 0; }
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
        let yOffset = 0, extraTransform = '';
        if(b.state === 'walk'){ b.x += b.vx; yOffset = Math.abs(Math.sin(frame * 0.18 + b.hopOffset)) * 8; }
        else if(b.state === 'run'){ b.x += b.vx; yOffset = Math.abs(Math.sin(frame * 0.32 + b.hopOffset)) * 16; }
        else if(b.state === 'eat'){ const wiggle = Math.sin(frame * 0.4) * 3; extraTransform = ` rotate(${wiggle * 0.4}deg)`; }
        else if(b.state === 'rest'){ yOffset = Math.sin(frame * 0.08) * 1.5; }
        else if(b.state === 'look'){ yOffset = Math.sin(frame * 0.1) * 1; }
        if(b.x < 5){ b.x = 5; if(b.vx !== 0){ b.vx = Math.abs(b.vx); b.facing = 1; }}
        if(b.x > w - 75){ b.x = w - 75; if(b.vx !== 0){ b.vx = -Math.abs(b.vx); b.facing = -1; }}
        b.el.style.left = b.x + 'px';
        b.el.style.top = (b.y - yOffset) + 'px';
        b.el.style.transform = `scaleX(${b.facing})` + extraTransform;
        // 말풍선 transform 보정 (display:block일 때만)
        const bubble = b.el.querySelector('.name-bubble');
        if(bubble && bubble.style.display === 'block'){
          bubble.style.transform = `translateX(-50%) scaleX(${b.facing})`;
        }
      });
    }, 50);
  }

  function bigJump(idx){
    const b = _bunnyChars[idx];
    if(!b) return;
    const el = b.el;
    el.style.transition = 'transform .35s cubic-bezier(.5,2,.3,.8)';
    el.style.transform = `scaleX(${b.facing}) translateY(-25px) scale(1.2)`;
    const svg = el.querySelector('.bunny-svg');
    if(svg) svg.innerHTML = bunnySvg(b.color, 'happy');
    setTimeout(() => {
      el.style.transition = 'transform .25s';
      el.style.transform = `scaleX(${b.facing}) scale(1)`;
      setTimeout(() => {
        el.style.transition = '';
        if(svg && b.state !== 'eat' && b.state !== 'rest') svg.innerHTML = bunnySvg(b.color, 'normal');
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

  // ═══ 탭바 아이콘 변경 ═══
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
              node.textContent = '토끼'; break;
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
