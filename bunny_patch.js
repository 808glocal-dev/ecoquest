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
      renderBunnyMap();
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

    const friends = _myBunny.friendCount || 0;
    const happiness = _myBunny.happiness || 0;
    const carrots = _myBunny.carrots || 0;
    const lv = getBunnyLevel(friends);
    const next = getNextLevel(friends);
    const myPoints = window.UDATA?.point || 0;
    const totalRabbits = friends + 1;
    const rabbitDisplay = '🐰'.repeat(Math.min(totalRabbits, 8));

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

      <div style="margin:0 12px 12px;background:linear-gradient(180deg,#E8F5E9,#FFF8E1);border-radius:18px;padding:24px 20px;text-align:center;box-shadow:0 4px 16px rgba(46,204,113,.1)">
        <div style="font-size:11px;color:#689F38;font-weight:700;letter-spacing:2px;margin-bottom:8px">🐰 MY BUNNY FAMILY</div>
        <div style="font-size:60px;line-height:1.2;margin:12px 0;letter-spacing:-4px">${rabbitDisplay}</div>
        <div style="font-size:20px;font-weight:900;color:#1B5E20">${lv.name}</div>
        <div style="font-size:12px;color:#689F38;margin-top:4px">친구 토끼 ${friends}마리</div>

        <div style="background:#fff;border-radius:14px;padding:14px;margin-top:18px;text-align:left">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
            <span style="color:#555;font-weight:600">😊 행복도</span>
            <span style="color:#e91e63;font-weight:700">${happiness}/100</span>
          </div>
          <div style="height:10px;background:#fce4ec;border-radius:5px;overflow:hidden">
            <div style="width:${Math.min(100,happiness)}%;height:100%;background:linear-gradient(90deg,#f06292,#e91e63);transition:width .5s"></div>
          </div>
          ${happiness >= 100 ? '<div style="font-size:11px;color:#C44569;margin-top:8px;font-weight:700;text-align:center">✨ 친구 토끼를 늘릴 수 있어요!</div>' : ''}
        </div>
      </div>

      <div style="margin:0 12px 12px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#FFF8E1;border-radius:14px;margin-bottom:14px;border:2px solid #FFE082">
          <div style="font-size:14px;font-weight:700;color:#8D6E1B">🥕 내 당근</div>
          <div style="font-size:22px;font-weight:900;color:#B8860B">${carrots}개</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <button onclick="buyCarrot()" ${myPoints < 10 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:${myPoints < 10 ? '#f5f5f5' : '#fff'};color:${myPoints < 10 ? '#aaa' : '#5D4037'};border:1.5px solid ${myPoints < 10 ? '#e0e0e0' : '#FFD54F'};border-radius:14px;font-size:14px;cursor:${myPoints < 10 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🥕 당근 사기</span>
            <span style="color:#FF8F00;font-weight:600">10P → 1개</span>
          </button>

          <button onclick="feedBunny()" ${carrots < 1 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:${carrots < 1 ? '#f5f5f5' : 'linear-gradient(135deg,#2ECC71,#27AE60)'};color:${carrots < 1 ? '#aaa' : '#fff'};border:none;border-radius:14px;font-size:14px;cursor:${carrots < 1 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🍴 먹이 주기</span>
            <span style="font-weight:600">${carrots < 1 ? '당근 부족' : '당근 -1, 행복+10'}</span>
          </button>

          <button onclick="petBunny()" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;color:#5D4037;border:1.5px solid #d8eedd;border-radius:14px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:700">
            <span>🤲 쓰다듬기</span>
            <span style="color:#888;font-weight:400">행복+1 (5초 쿨)</span>
          </button>

          <button onclick="addFriend()" ${happiness < 100 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:${happiness < 100 ? '#f5f5f5' : 'linear-gradient(135deg,#FF6B9D,#C44569)'};color:${happiness < 100 ? '#aaa' : '#fff'};border:none;border-radius:14px;font-size:14px;cursor:${happiness < 100 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🐰 친구 토끼 늘리기</span>
            <span style="font-weight:600">${happiness < 100 ? `행복 ${100-happiness} 더` : '✨ 가능!'}</span>
          </button>
        </div>

        <div style="margin-top:14px;padding:12px 14px;background:#f0fbf4;border-radius:12px;font-size:12px;color:#1B5E20;line-height:1.8">
          💡 EcoQuest 미션 1개 완료 = 🥕 +1 자동 지급<br/>
          💡 깅 모임 참여 = 🥕 +5 보너스<br/>
          💡 ${next ? `다음 단계: 친구 ${next.min}마리 → ${next.name}` : '✨ 최고 단계 도달!'}
        </div>

        <div style="margin-top:14px;padding:14px;background:#fff;border-radius:14px;border:1px solid #d8eedd">
          <div style="font-size:12px;font-weight:900;color:#1a2e1a;margin-bottom:10px">🌱 토끼 가족 성장 단계</div>
          <div style="display:flex;justify-content:space-between;text-align:center">
            ${BUNNY_LEVELS.map((l) => `
              <div style="opacity:${friends >= l.min ? 1 : 0.3};flex:1">
                <div style="font-size:22px">${l.emoji}</div>
                <div style="font-size:9px;color:#666;margin-top:3px;font-weight:700">${l.name}</div>
                <div style="font-size:9px;color:#999;margin-top:1px">${l.min === 0 ? '시작' : '친구 ' + l.min + '+'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

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
    window.toast("🍴 토끼가 행복해해요! 행복도 +10");
  };

  window.petBunny = async function(){
    if(!_myBunny) return;
    if(Date.now() - _petTimer < 5000){window.toast("토끼가 좀 쉬고 싶대요 ☺️"); return;}
    _petTimer = Date.now();
    _myBunny.happiness = Math.min(100, (_myBunny.happiness||0) + 1);
    await saveBunny();
    window.toast("🤲 쓰다듬쓰다듬 (행복+1)");
  };

  window.addFriend = async function(){
    if(!_myBunny) return;
    if((_myBunny.happiness||0) < 100){window.toast("행복도 100 필요해요!"); return;}
    _myBunny.friendCount = (_myBunny.friendCount || 0) + 1;
    _myBunny.happiness = 0;
    await saveBunny();
    const lv = getBunnyLevel(_myBunny.friendCount);
    window.toast(`🎉 친구 토끼 늘었어요! (${_myBunny.friendCount}마리 · ${lv.name})`);
  };

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
