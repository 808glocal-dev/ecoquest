(function(){

  const BUNNY_LEVELS = [
    {min: 0,  name: "아기 토끼",   emoji: "🐰"},
    {min: 3,  name: "청소년 토끼", emoji: "🐰"},
    {min: 7,  name: "어른 토끼",   emoji: "🐇"},
    {min: 15, name: "부모 토끼",   emoji: "🐇"},
    {min: 30, name: "가족 토끼",   emoji: "🐰"},
  ];

  let _myBunny = null;
  let _petTimer = 0;
  let _bunnyChars = [];
  let _animLoop = null;
  let _lastSpawnedCount = -1;

  function getBunnyLevel(friends){
    let lv = BUNNY_LEVELS[0];
    for(let i = BUNNY_LEVELS.length - 1; i >= 0; i--){
      if(friends >= BUNNY_LEVELS[i].min){lv = BUNNY_LEVELS[i]; break;}
    }
    return lv;
  }

  function getNextLevel(friends){
    return BUNNY_LEVELS.find(l => l.min > friends);
  }

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
      if(targetCount !== _lastSpawnedCount){
        spawnBunnies(targetCount);
      }
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
    if(!_myBunny){
      c.innerHTML = '<div style="text-align:center;padding:40px;color:#888;font-size:13px">🐰 토끼 데이터 로딩 중...</div>';
      return;
    }

    const globalCo2 = parseFloat(document.getElementById("bCo2")?.textContent) || 0;
    const totalUsers = parseInt(document.getElementById("bTotal")?.textContent?.replace(/,/g, "") || "0");
    const totalTrees = (globalCo2 / 21.4).toFixed(1);

    c.innerHTML = `
      <div style="margin:12px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:14px;padding:12px 16px;color:#fff;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:10px;color:rgba(255,255,255,.6);font-weight:600;letter-spacing:1px">🌍 우리가 함께 지킨 지구</div>
          <div style="font-size:14px;font-weight:900;color:#a8f0c6;margin-top:2px">CO₂ ${globalCo2.toFixed(1)}kg · 🌳 ${totalTrees}그루</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;color:rgba(255,255,255,.6);font-weight:600">참여자</div>
          <div style="font-size:14px;font-weight:900">${totalUsers ? totalUsers.toLocaleString() : 0}명</div>
        </div>
      </div>

      <!-- 잔디밭 (토끼들이 뛰어다님) -->
      <div id="bunnyPlayground" style="position:relative;margin:0 12px;height:240px;background:linear-gradient(180deg,#87CEEB 0%,#87CEEB 50%,#A8DC8E 50%,#76B947 100%);border-radius:18px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08);user-select:none">
        <!-- 하늘 장식 -->
        <div style="position:absolute;top:8px;left:24px;font-size:22px;opacity:.85">☁️</div>
        <div style="position:absolute;top:18px;right:36px;font-size:18px;opacity:.7">☁️</div>
        <div style="position:absolute;top:6px;right:14px;font-size:24px">☀️</div>
        <!-- 잔디 장식 -->
        <div style="position:absolute;bottom:6px;left:30px;font-size:14px">🌱</div>
        <div style="position:absolute;bottom:4px;left:200px;font-size:16px">🌿</div>
        <div style="position:absolute;bottom:8px;right:50px;font-size:14px">🌱</div>
        <div style="position:absolute;bottom:6px;right:20px;font-size:18px">🌷</div>
        <div style="position:absolute;bottom:10px;left:120px;font-size:14px">🌾</div>
        <!-- 토끼들은 JS에서 동적 추가 -->
        <div id="bunnyHelpText" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:12px;padding:3px 10px;font-size:10px;color:#444;font-weight:600;pointer-events:none">탭하면 쓰다듬을 수 있어요!</div>
      </div>

      <!-- 토끼 정보 + 액션 (별도 영역에서 업데이트) -->
      <div id="bunnyStats"></div>
    `;

    renderBunnyStats();
    setTimeout(() => spawnBunnies((_myBunny.friendCount || 0) + 1), 100);
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
          💡 토끼 직접 탭하면 쓰다듬을 수 있어요 (행복+1)<br/>
          💡 ${next ? `다음 단계: 친구 ${next.min}마리 → ${next.name}` : '✨ 최고 단계 도달!'}
        </div>

        <div style="margin-top:12px;padding:12px;background:#fff;border-radius:12px;border:1px solid #d8eedd">
          <div style="font-size:11px;font-weight:900;color:#1a2e1a;margin-bottom:8px">🌱 토끼 가족 성장 단계</div>
          <div style="display:flex;justify-content:space-between;text-align:center">
            ${BUNNY_LEVELS.map((l) => `
              <div style="opacity:${friends >= l.min ? 1 : 0.3};flex:1">
                <div style="font-size:20px">${l.emoji}</div>
                <div style="font-size:9px;color:#666;margin-top:2px;font-weight:700">${l.name}</div>
                <div style="font-size:9px;color:#999">${l.min === 0 ? '시작' : l.min + '+'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // === 토끼 캐릭터 생성 + 애니메이션 ===
  function spawnBunnies(count){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    // 기존 토끼들 제거
    playground.querySelectorAll('.bunny-char').forEach(el => el.remove());
    _bunnyChars = [];

    const w = playground.offsetWidth || 320;
    const groundTop = 120;   // 잔디 시작 y
    const groundBottom = 200; // 토끼가 움직일 수 있는 y 최대

    // 최대 12마리까지만 (성능)
    const showCount = Math.min(count, 12);

    for(let i = 0; i < showCount; i++){
      const el = document.createElement('div');
      el.className = 'bunny-char';
      const size = 28 + Math.random() * 8;
      el.style.cssText = `
        position:absolute;
        font-size:${size}px;
        cursor:pointer;
        user-select:none;
        z-index:${10+i};
        will-change:left,top,transform;
        line-height:1;
        text-shadow:0 1px 2px rgba(0,0,0,.15);
      `;
      el.textContent = '🐰';
      const idx = i;
      el.onclick = (e) => {
        e.stopPropagation();
        bigJump(idx);
        window.petBunny();
      };
      playground.appendChild(el);

      _bunnyChars.push({
        el,
        x: 20 + Math.random() * (w - 60),
        y: groundTop + Math.random() * (groundBottom - groundTop),
        vx: (Math.random() - 0.5) * 1.2,
        hopOffset: Math.random() * Math.PI * 2,
        facing: 1,
        idleTimer: 0,
        state: 'walking', // walking, idle, eating
        groundTop,
        groundBottom
      });
    }

    if(count > 12){
      const more = document.createElement('div');
      more.className = 'bunny-char';
      more.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;color:#5D4037';
      more.textContent = `+${count - 12}마리 더!`;
      playground.appendChild(more);
    }

    _lastSpawnedCount = count;
    startBunnyAnim();
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
        // idle 상태면 잠깐 멈춤
        if(b.state === 'idle'){
          b.idleTimer--;
          if(b.idleTimer <= 0){
            b.state = 'walking';
            b.vx = (Math.random() - 0.5) * 1.2;
            b.facing = b.vx > 0 ? 1 : -1;
          }
          // idle 중엔 살짝 좌우 흔들림 (풀 뜯는 느낌)
          const wiggle = Math.sin(frame * 0.4) * 2;
          b.el.style.left = b.x + 'px';
          b.el.style.top = (b.y + wiggle) + 'px';
          b.el.style.transform = `scaleX(${b.facing}) rotate(${wiggle}deg)`;
          return;
        }

        // 이동
        b.x += b.vx;

        // 경계 체크
        if(b.x < 5){ b.x = 5; b.vx = Math.abs(b.vx); b.facing = 1; }
        if(b.x > w - 35){ b.x = w - 35; b.vx = -Math.abs(b.vx); b.facing = -1; }

        // 가끔 idle 상태로 (풀 뜯기)
        if(Math.random() < 0.005){
          b.state = 'idle';
          b.idleTimer = 30 + Math.floor(Math.random() * 50);
          b.vx = 0;
        }

        // 가끔 방향 변경
        if(Math.random() < 0.015){
          b.vx = (Math.random() - 0.5) * 1.2;
          b.facing = b.vx > 0 ? 1 : -1;
        }

        // y축으로도 가끔 이동 (잔디밭 안에서)
        if(Math.random() < 0.01){
          const targetY = b.groundTop + Math.random() * (b.groundBottom - b.groundTop);
          b.y += (targetY - b.y) * 0.05;
        }

        // 점프 애니메이션 (sin 파 - 깡총깡총)
        const hop = Math.abs(Math.sin(frame * 0.18 + b.hopOffset)) * 10;

        b.el.style.left = b.x + 'px';
        b.el.style.top = (b.y - hop) + 'px';
        b.el.style.transform = `scaleX(${b.facing})`;
      });
    }, 50);
  }

  function bigJump(idx){
    const b = _bunnyChars[idx];
    if(!b) return;
    const el = b.el;
    el.style.transition = 'transform .35s cubic-bezier(.5,2,.3,.8)';
    el.style.transform = `scaleX(${b.facing}) translateY(-30px) scale(1.3)`;
    setTimeout(() => {
      el.style.transition = 'transform .25s';
      el.style.transform = `scaleX(${b.facing}) scale(1)`;
      setTimeout(() => { el.style.transition = ''; }, 250);
    }, 350);
  }

  // === 액션 ===
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
    // 모든 토끼들 작은 점프
    _bunnyChars.forEach((_, i) => setTimeout(() => bigJump(i), i * 80));
    window.toast("🍴 토끼들이 행복해해요! 행복도 +10");
  };

  window.petBunny = async function(){
    if(!_myBunny) return;
    if(Date.now() - _petTimer < 800){return;}  // 클릭 spam 방지
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
    // 새 친구 환영 점프
    setTimeout(() => {
      _bunnyChars.forEach((_, i) => setTimeout(() => bigJump(i), i * 100));
    }, 200);
    window.toast(`🎉 친구 토끼 늘었어요! (${_myBunny.friendCount}마리 · ${lv.name})`);
  };

  // === 미션/깅 hook ===
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

  function boot(){
    if(!window.FB){setTimeout(boot, 500); return;}
    initBunnyOnMap();
    hookSaveMission();
    hookJoinGathering();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 1500));
  } else {
    setTimeout(boot, 1500);
  }

})();
