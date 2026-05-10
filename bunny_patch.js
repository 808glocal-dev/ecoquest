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
      updateBunnyEntry();
    } catch(e){console.log("토끼 로드 실패:", e.message);}
  }

  async function saveBunny(){
    if(!window.ME || !_myBunny) return;
    try {
      await window.FB.setDoc(window.FB.doc(window.FB.db, "bunnies", window.ME.uid), _myBunny);
      updateBunnyEntry();
      if(document.getElementById("bunnyContent")) renderBunny();
    } catch(e){console.log("토끼 저장 실패:", e.message);}
  }

  function initBunnyUI(){
    const tryAdd = () => {
      const myPage = document.getElementById("page-my");
      if(!myPage) return false;
      if(document.getElementById("bunnyEntryWrap")) return true;
      const adminArea = document.getElementById("adminArea");
      const wrap = document.createElement("div");
      wrap.id = "bunnyEntryWrap";
      wrap.style.cssText = "padding:0 12px;margin-bottom:6px";
      wrap.innerHTML = `
        <button id="bunnyEntryBtn" onclick="openBunny()" style="width:100%;padding:14px;background:linear-gradient(135deg,#FFE0B2,#FFCCBC);color:#5D4037;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 8px rgba(255,176,140,.25)">
          <span>🐰 내 토끼 키우기</span>
          <span id="bunnyEntryInfo" style="font-size:11px;color:#8D6E63;font-weight:600">탭해서 시작!</span>
        </button>
      `;
    const statCard = myPage.querySelector('.stat-card');
      try{
        if(statCard && statCard.nextSibling){
          myPage.insertBefore(wrap, statCard.nextSibling);
        } else {
          myPage.appendChild(wrap);
        }
      }catch(e){ myPage.appendChild(wrap); }
  
      loadBunny();
      return true;
    };
    if(!tryAdd()) setTimeout(initBunnyUI, 1000);
  }

  function updateBunnyEntry(){
    const info = document.getElementById("bunnyEntryInfo");
    if(!info || !_myBunny) return;
    const lv = getBunnyLevel(_myBunny.friendCount || 0);
    info.textContent = `${lv.emoji} ${lv.name} · 🥕${_myBunny.carrots||0}`;
  }

  window.openBunny = function(){
    if(!window.ME){window.toast("로그인이 필요해요!"); return;}
    if(!_myBunny){loadBunny(); setTimeout(window.openBunny, 600); return;}
    const old = document.getElementById("ovBunny");
    if(old) old.remove();
    const modal = document.createElement("div");
    modal.id = "ovBunny";
    modal.className = "overlay on";
    modal.innerHTML = `
      <div class="modal" style="padding:0;overflow:hidden">
        <div class="handle" onclick="closeOv('ovBunny')" style="margin:14px auto 8px"></div>
        <button class="modal-close" onclick="closeOv('ovBunny')">✕</button>
        <div id="bunnyContent"></div>
      </div>
    `;
    document.body.appendChild(modal);
    renderBunny();
  };

  function renderBunny(){
    const c = document.getElementById("bunnyContent");
    if(!c || !_myBunny) return;
    const friends = _myBunny.friendCount || 0;
    const happiness = _myBunny.happiness || 0;
    const carrots = _myBunny.carrots || 0;
    const lv = getBunnyLevel(friends);
    const next = getNextLevel(friends);
    const myPoints = window.UDATA?.point || 0;
    const totalRabbits = friends + 1;
    const rabbitDisplay = '🐰'.repeat(Math.min(totalRabbits, 5)) + (totalRabbits > 5 ? `+${totalRabbits-5}` : '');

    c.innerHTML = `
      <div style="background:linear-gradient(180deg,#E8F5E9,#FFF8E1);padding:24px 20px 20px;text-align:center">
        <div style="font-size:10px;color:#689F38;font-weight:700;letter-spacing:2px;margin-bottom:6px">🐰 MY BUNNY</div>
        <div style="font-size:48px;line-height:1.3;margin:8px 0;letter-spacing:-2px">${rabbitDisplay}</div>
        <div style="font-size:17px;font-weight:900;color:#1B5E20">${lv.name}</div>
        <div style="font-size:11px;color:#689F38;margin-top:3px">친구 토끼 ${friends}마리</div>
        <div style="background:#fff;border-radius:12px;padding:12px 14px;margin-top:14px;text-align:left">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
            <span style="color:#555;font-weight:600">😊 행복도</span>
            <span style="color:#e91e63;font-weight:700">${happiness}/100</span>
          </div>
          <div style="height:8px;background:#fce4ec;border-radius:4px;overflow:hidden">
            <div style="width:${Math.min(100,happiness)}%;height:100%;background:linear-gradient(90deg,#f06292,#e91e63);transition:width .5s"></div>
          </div>
          ${happiness >= 100 ? '<div style="font-size:10px;color:#C44569;margin-top:6px;font-weight:700">✨ 친구 토끼를 늘릴 수 있어요!</div>' : ''}
        </div>
      </div>
      <div style="padding:14px 20px 20px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#FFF8E1;border-radius:12px;margin-bottom:12px;border:1.5px solid #FFE082">
          <div style="font-size:13px;font-weight:700;color:#8D6E1B">🥕 내 당근</div>
          <div style="font-size:18px;font-weight:900;color:#B8860B">${carrots}개</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="buyCarrot()" ${myPoints < 10 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${myPoints < 10 ? '#f5f5f5' : '#fff'};color:${myPoints < 10 ? '#aaa' : '#5D4037'};border:1.5px solid ${myPoints < 10 ? '#e0e0e0' : '#FFD54F'};border-radius:12px;font-size:13px;cursor:${myPoints < 10 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🥕 당근 사기</span>
            <span style="color:#FF8F00;font-weight:600">10P → 1개</span>
          </button>
          <button onclick="feedBunny()" ${carrots < 1 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${carrots < 1 ? '#f5f5f5' : 'linear-gradient(135deg,#2ECC71,#27AE60)'};color:${carrots < 1 ? '#aaa' : '#fff'};border:none;border-radius:12px;font-size:13px;cursor:${carrots < 1 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🍴 먹이 주기</span>
            <span style="font-weight:600">${carrots < 1 ? '당근 부족' : '당근 -1, 행복+10'}</span>
          </button>
          <button onclick="petBunny()" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;color:#5D4037;border:1.5px solid #d8eedd;border-radius:12px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:700">
            <span>🤲 쓰다듬기</span>
            <span style="color:#888;font-weight:400">행복+1 (5초 쿨)</span>
          </button>
          <button onclick="addFriend()" ${happiness < 100 ? 'disabled' : ''} style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${happiness < 100 ? '#f5f5f5' : 'linear-gradient(135deg,#FF6B9D,#C44569)'};color:${happiness < 100 ? '#aaa' : '#fff'};border:none;border-radius:12px;font-size:13px;cursor:${happiness < 100 ? 'default' : 'pointer'};font-family:inherit;font-weight:700">
            <span>🐰 친구 토끼 늘리기</span>
            <span style="font-weight:600">${happiness < 100 ? `행복 ${100-happiness} 더` : '✨ 가능!'}</span>
          </button>
        </div>
        <div style="margin-top:14px;padding:11px 13px;background:#f0fbf4;border-radius:10px;font-size:11px;color:#1B5E20;line-height:1.8">
          💡 EcoQuest 미션 1개 완료 = 🥕 +1 자동<br/>
          💡 깅 모임 참여 = 🥕 +5 보너스<br/>
          💡 ${next ? `다음 단계: 친구 ${next.min}마리 → ${next.name}` : '✨ 최고 단계 도달!'}
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
    if(Date.now() - _petTimer < 5000){
      window.toast("토끼가 좀 쉬고 싶대요 ☺️");
      return;
    }
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
    initBunnyUI();
    hookSaveMission();
    hookJoinGathering();
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 1500));
  } else {
    setTimeout(boot, 1500);
  }

})();
