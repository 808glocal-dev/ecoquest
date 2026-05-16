// bunny_interactions_patch.js v1
// 액션 시뮬레이션(빗질·목욕·간식) + 농부 입양 + 작물 도감 (들판에 통합)
(function(){
  'use strict';

  // ===== 6가지 행위 시뮬레이션 =====
  const ACTIONS = [
    {id:'brush', emoji:'🪮', name:'빗질하기',     happiness:5,  animEmoji:'✨', cooldown:20},
    {id:'bath',  emoji:'🧼', name:'목욕시키기',   happiness:8,  animEmoji:'🫧', cooldown:30},
    {id:'treat', emoji:'🥕', name:'간식주기',     happiness:10, animEmoji:'💕', cooldown:25},
    {id:'play',  emoji:'⚽', name:'공놀이',       happiness:6,  animEmoji:'⚽', cooldown:20},
    {id:'pet',   emoji:'🤚', name:'쓰다듬기',     happiness:3,  animEmoji:'💖', cooldown:10},
    {id:'sing',  emoji:'🎵', name:'노래불러주기', happiness:7,  animEmoji:'🎶', cooldown:30},
  ];

  const POKEDEX_CROPS = [
    {id:'carrot',name:'당근',emoji:'🥕'}, {id:'lettuce',name:'상추',emoji:'🥬'},
    {id:'strawberry',name:'딸기',emoji:'🍓'}, {id:'tomato',name:'토마토',emoji:'🍅'},
    {id:'corn',name:'옥수수',emoji:'🌽'}, {id:'pepper',name:'고추',emoji:'🌶️'},
    {id:'broccoli',name:'브로콜리',emoji:'🥦'}, {id:'onion',name:'양파',emoji:'🧅'},
    {id:'garlic',name:'마늘',emoji:'🧄'}, {id:'eggplant',name:'가지',emoji:'🍆'},
    {id:'pumpkin',name:'호박',emoji:'🎃'}, {id:'apple',name:'사과',emoji:'🍎'},
  ];

  let _cooldown = {};
  let _cachedHappiness = 0;
  let _cachedBunnyCount = 1;
  let _harvestedCrops = {};
  let _lastPlots = [];

  /* ===== Firebase 데이터 ===== */
  async function fetchData(){
    if(!window.ME?.uid) return;
    try {
      const bSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'bunnies', window.ME.uid));
      if(bSnap.exists()){
        const d = bSnap.data();
        _cachedHappiness = d.happiness || 0;
        _cachedBunnyCount = (d.bunnies || []).length || 1;
      }
      const uSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid));
      if(uSnap.exists()){
        _harvestedCrops = uSnap.data().harvestedCrops || {};
      }
    } catch(e){ console.log('[interactions] fetch 실패', e.message); }
  }

  /* ===== 액션 실행 (행복도 ↑ + 애니메이션) ===== */
  async function performAction(actionId){
    const action = ACTIONS.find(a => a.id === actionId);
    if(!action) return;

    // 쿨다운
    const last = _cooldown[actionId] || 0;
    const cdMs = action.cooldown * 1000;
    if(Date.now() - last < cdMs){
      const remain = Math.ceil((cdMs - (Date.now() - last))/1000);
      window.toast?.(`⏱️ ${remain}초 후에 다시 가능해요`);
      return;
    }
    _cooldown[actionId] = Date.now();

    // 토끼들 위에 액션 애니메이션
    const bunnies = document.querySelectorAll('.bunny-char');
    if(!bunnies.length){ window.toast?.('토끼가 없어요!'); return; }

    bunnies.forEach((b) => {
      const anim = document.createElement('div');
      anim.style.cssText = 'position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:30px;z-index:200;pointer-events:none;animation:eqActAnim 1.6s ease-out forwards';
      anim.textContent = action.emoji;
      b.appendChild(anim);
      setTimeout(() => { anim.textContent = action.animEmoji; }, 700);
      setTimeout(() => anim.remove(), 1600);
    });

    // 행복도 증가 (Firebase)
    try {
      const ref = window.FB.doc(window.FB.db, 'bunnies', window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      if(snap.exists()){
        const data = snap.data();
        const newH = Math.min(100, (data.happiness || 0) + action.happiness);
        await window.FB.updateDoc(ref, { happiness: newH });
        _cachedHappiness = newH;
        updateMainBtn();
        if(newH >= 100){
          setTimeout(() => window.toast?.('🎉 행복도 100! 농부 토끼 입양 가능!'), 800);
        }
      }
    } catch(e){ console.error('[interactions]', e); }

    window.toast?.(`${action.emoji} ${action.name}! 😊 +${action.happiness}`);
    // 모달 열려있으면 새로고침
    if(document.getElementById('ovInteraction')) setTimeout(openMenu, 100);
  }

  /* ===== 도감: 수확 자동 추적 ===== */
  async function trackHarvest(){
    const plots = window.UDATA?.bunnyField?.plots || [];
    if(_lastPlots.length === 6){
      for(let i = 0; i < 6; i++){
        const last = _lastPlots[i];
        const cur = plots[i];
        // 작물이 있었다가 사라지면 = 수확됨
        if(last && !cur){
          const cropId = last.crop;
          if(cropId){
            _harvestedCrops[cropId] = (_harvestedCrops[cropId] || 0) + 1;
            try {
              await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), {
                harvestedCrops: _harvestedCrops
              });
              console.log('[interactions] 도감 +1:', cropId);
            } catch(e){}
          }
        }
      }
    }
    _lastPlots = plots.map(p => p ? {...p} : null);
  }

  /* ===== 메인 버튼 (들판 우측 상단) ===== */
  function addMainBtn(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;
    if(document.getElementById('eqIntMain')) return;
    const btn = document.createElement('button');
    btn.id = 'eqIntMain';
    btn.onclick = openMenu;
    btn.style.cssText = 'position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#ff6b9d,#c44569);color:#fff;border:none;border-radius:16px;padding:7px 13px;font-size:11px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(255,107,157,.4);z-index:30;display:flex;align-items:center;gap:4px';
    playground.appendChild(btn);
    updateMainBtn();
  }

  function updateMainBtn(){
    const btn = document.getElementById('eqIntMain');
    if(!btn) return;
    const ready = _cachedHappiness >= 100;
    btn.innerHTML = `🎮 액션${ready ? ' <span style="background:#fff;color:#c44569;border-radius:10px;padding:1px 5px;font-size:9px">✨</span>' : ''}`;
  }

  /* ===== 메인 메뉴 ===== */
  function openMenu(){
    const old = document.getElementById('ovInteraction'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovInteraction';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9300;display:flex;align-items:flex-end;justify-content:center';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    const h = _cachedHappiness;
    const cnt = _cachedBunnyCount;
    const canAdopt = h >= 100;
    const collected = Object.keys(_harvestedCrops).filter(k => _harvestedCrops[k] > 0).length;

    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;max-width:480px;width:100%;max-height:88vh;overflow-y:auto">
        <div style="background:linear-gradient(135deg,#ff6b9d,#c44569);padding:16px;color:#fff;text-align:center;position:relative">
          <button onclick="document.getElementById('ovInteraction').remove()" style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,.25);border:none;border-radius:50%;width:28px;height:28px;font-size:13px;cursor:pointer;color:#fff">✕</button>
          <div style="width:40px;height:4px;background:rgba(255,255,255,.4);border-radius:4px;margin:0 auto 8px"></div>
          <div style="font-size:16px;font-weight:900">🎮 토끼와 함께</div>
          <div style="font-size:11px;color:rgba(255,255,255,.85);margin-top:4px">행복한 시간을 보내요!</div>
        </div>

        <div style="padding:14px 16px">

          <div style="background:#fff0f6;border-radius:14px;padding:12px 14px;margin-bottom:14px;border:1.5px solid #f8b6cc">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#5D4037;margin-bottom:6px">
              <span style="font-weight:700">😊 행복도</span>
              <span style="font-weight:900;color:#c44569">${h}/100</span>
            </div>
            <div style="background:#fce4ec;border-radius:6px;height:8px;overflow:hidden">
              <div style="width:${Math.min(100,h)}%;height:100%;background:linear-gradient(90deg,#f06292,#c44569);transition:width .5s"></div>
            </div>
            ${canAdopt ? '<div style="font-size:11px;color:#c44569;margin-top:6px;font-weight:700;text-align:center">✨ 새 농부 입양 가능!</div>' : `<div style="font-size:10px;color:#888;margin-top:6px;text-align:center">행복 ${100-h} 더 채우면 새 농부 입양 가능</div>`}
          </div>

          <div style="font-size:13px;font-weight:900;color:#5D4037;margin-bottom:8px">💕 토끼와 놀기 (행복도 ↑)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
            ${ACTIONS.map(a => `
              <button onclick="window.performBunnyAction('${a.id}')" style="background:#fff;border:1.5px solid #f8b6cc;border-radius:14px;padding:12px 4px;cursor:pointer;font-family:inherit;text-align:center;transition:all .15s">
                <div style="font-size:30px;line-height:1">${a.emoji}</div>
                <div style="font-size:11px;color:#5D4037;margin-top:4px;font-weight:700">${a.name}</div>
                <div style="font-size:9px;color:#c44569;font-weight:700;margin-top:2px">😊 +${a.happiness}</div>
              </button>
            `).join('')}
          </div>

          <button onclick="window.openAdoptFarmer()" ${canAdopt?'':'disabled'} style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:${canAdopt?'linear-gradient(135deg,#FF6B9D,#C44569)':'#f5f5f5'};color:${canAdopt?'#fff':'#aaa'};border:none;border-radius:14px;font-size:14px;cursor:${canAdopt?'pointer':'default'};font-family:inherit;font-weight:700;width:100%;margin-bottom:8px">
            <span>🐰+ 새 농부 데려오기</span>
            <span style="font-weight:600;font-size:12px">${canAdopt?'✨ 지금!':`행복 ${100-h} 더`}</span>
          </button>
          <div style="font-size:10px;color:#888;margin-bottom:18px;text-align:center">현재 농부 ${cnt}마리</div>

          <button onclick="window.openCropPokedex()" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:linear-gradient(135deg,#27AE60,#2ECC71);color:#fff;border:none;border-radius:14px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:700;width:100%;margin-bottom:8px">
            <span>📔 작물 도감 보기</span>
            <span style="font-weight:600;font-size:12px">${collected}/12</span>
          </button>

          <div style="height:20px"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /* ===== 농부 입양 ===== */
  window.openAdoptFarmer = function(){
    document.getElementById('ovInteraction')?.remove();
    if(typeof window.adoptBunny === 'function'){
      window.adoptBunny();
    } else {
      window.toast?.('입양 시스템 로딩 실패. 새로고침 해주세요.');
    }
  };

  /* ===== 도감 ===== */
  window.openCropPokedex = async function(){
    await fetchData();
    const old = document.getElementById('ovPokedex'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovPokedex';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9400;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    const total = POKEDEX_CROPS.length;
    const obtained = Object.keys(_harvestedCrops).filter(k => _harvestedCrops[k] > 0).length;
    const totalCount = Object.values(_harvestedCrops).reduce((s, n) => s + n, 0);

    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;max-width:400px;width:100%;padding:22px 20px;max-height:88vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:42px;margin-bottom:6px">📔</div>
          <div style="font-size:18px;font-weight:900;color:#5D4037">작물 도감</div>
          <div style="font-size:12px;color:#888;margin-top:4px">${obtained}/${total}종 발견 · 총 ${totalCount}개 수확</div>
          <div style="background:#f0fbf4;border-radius:6px;height:6px;margin-top:8px;overflow:hidden">
            <div style="width:${(obtained/total)*100}%;height:100%;background:linear-gradient(90deg,#27AE60,#F39C12);transition:width .5s"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
          ${POKEDEX_CROPS.map(c => {
            const cnt = _harvestedCrops[c.id] || 0;
            const has = cnt > 0;
            return `
              <div style="background:${has?'#f0fbf4':'#fafafa'};border:1.5px solid ${has?'#a8e6c5':'#eee'};border-radius:14px;padding:12px 4px;text-align:center;${has?'':'opacity:.55;filter:grayscale(.8)'}">
                <div style="font-size:32px;line-height:1">${has?c.emoji:'❓'}</div>
                <div style="font-size:11px;color:#5D4037;margin-top:6px;font-weight:700">${has?c.name:'???'}</div>
                <div style="font-size:9px;color:#888;margin-top:2px">${has?`x${cnt}개`:'아직 X'}</div>
              </div>
            `;
          }).join('')}
        </div>
        ${obtained === total ? '<div style="background:#fff8e1;border-radius:12px;padding:12px;text-align:center;font-size:13px;font-weight:700;color:#8D6E1B;margin-bottom:12px">🏆 도감 완성! 모든 작물을 수확했어요!</div>' : ''}
        <button onclick="document.getElementById('ovPokedex').remove()" style="background:#f0f0f0;border:none;border-radius:12px;padding:11px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;color:#666">닫기</button>
      </div>
    `;
    document.body.appendChild(modal);
  };

  window.performBunnyAction = performAction;

  /* ===== boot ===== */
  async function boot(){
    if(!window.FB || !window.ME){ setTimeout(boot, 800); return; }
    await fetchData();
    addMainBtn();

    const observer = new MutationObserver(() => {
      if(document.getElementById('bunnyPlayground') && !document.getElementById('eqIntMain')){
        addMainBtn();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // CSS 애니메이션
    if(!document.getElementById('eqIntCss')){
      const s = document.createElement('style');
      s.id = 'eqIntCss';
      s.textContent = `
        @keyframes eqActAnim {
          0% { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.6); }
          30% { opacity: 1; transform: translateX(-50%) translateY(-15px) scale(1.4); }
          60% { opacity: 1; transform: translateX(-50%) translateY(-25px) scale(1.2); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-45px) scale(1); }
        }
      `;
      document.head.appendChild(s);
    }

    // 도감 자동 추적 (3초마다 plots 변화 체크)
    setInterval(trackHarvest, 3000);
    // 데이터 갱신 (1분)
    setInterval(async () => { await fetchData(); updateMainBtn(); }, 60000);

    console.log('%c[bunny_interactions v1] 🎮 액션+농부+도감 활성화','color:#fff;background:#c44569;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4000));
  else setTimeout(boot, 4000);
})();
