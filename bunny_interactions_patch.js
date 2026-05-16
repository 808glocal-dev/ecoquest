// bunny_interactions_patch.js v2
// 모달 X → 들판 바로 아래 미니 플로팅 바 (행복도 + 6개 버튼)
// PC·모바일 둘 다 토끼 가리지 않음
(function(){
  'use strict';

  // 6가지 행위 (이모지 + 행복도 + 쿨다운초)
  const ACTIONS = [
    {id:'brush',  emoji:'🪮', name:'빗질',     happy:5,  cool:20},
    {id:'bath',   emoji:'🧼', name:'목욕',     happy:8,  cool:30},
    {id:'snack',  emoji:'🥕', name:'간식',     happy:10, cool:25},
    {id:'play',   emoji:'⚽', name:'공놀이',    happy:6,  cool:20},
    {id:'pet',    emoji:'🤚', name:'쓰담',     happy:3,  cool:10},
    {id:'sing',   emoji:'🎵', name:'노래',     happy:7,  cool:30},
  ];

  const _lastAct = {};

  /* 미니 플로팅 바 ensure + render */
  function ensureMiniBar(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    let bar = document.getElementById('eqMiniActionBar');
    if(!bar){
      bar = document.createElement('div');
      bar.id = 'eqMiniActionBar';
      playground.insertAdjacentElement('afterend', bar);
    }
    renderMiniBar();
  }

  function renderMiniBar(){
    const bar = document.getElementById('eqMiniActionBar');
    if(!bar) return;
    const happiness = window._myBunny?.happiness || 0;
    const bunniesCount = (window._myBunny?.bunnies || []).length;

    bar.innerHTML = `
      <div style="margin:8px 12px;background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;padding:12px 14px;border:1.5px solid #FFE082;box-shadow:0 2px 8px rgba(0,0,0,.06)">

        <!-- 행복도 + 토끼 수 (한 줄) -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
          <div style="font-size:12px;font-weight:900;color:#5D4037">😊 토끼 돌보기 <span style="color:#888;font-weight:400">· ${bunniesCount}마리</span></div>
          <div style="display:flex;align-items:center;gap:6px;flex:1;max-width:160px">
            <div style="flex:1;height:7px;background:#fce4ec;border-radius:4px;overflow:hidden">
              <div style="width:${Math.min(100, happiness)}%;height:100%;background:linear-gradient(90deg,#f06292,#e91e63);transition:width .4s"></div>
            </div>
            <span style="font-size:11px;font-weight:900;color:#e91e63;min-width:32px;text-align:right">${happiness}/100</span>
          </div>
        </div>

        <!-- 6개 액션 버튼 가로 -->
        <div style="display:grid;grid-template-columns:repeat(6, 1fr);gap:5px">
          ${ACTIONS.map(a => {
            const last = _lastAct[a.id] || 0;
            const remain = Math.max(0, Math.ceil((a.cool * 1000 - (Date.now() - last)) / 1000));
            const onCool = remain > 0;
            return `
              <button onclick="window.eqDoAction('${a.id}')" ${onCool?'disabled':''} title="${a.name} +${a.happy} 행복도" style="background:${onCool?'#f5f5f5':'#fff'};border:1.5px solid ${onCool?'#e0e0e0':'#FFD54F'};border-radius:10px;padding:8px 4px;cursor:${onCool?'not-allowed':'pointer'};font-family:inherit;opacity:${onCool?.5:1};transition:transform .1s" onmousedown="this.style.transform='scale(.95)'" onmouseup="this.style.transform=''">
                <div style="font-size:22px;line-height:1">${a.emoji}</div>
                <div style="font-size:9px;color:#5D4037;margin-top:3px;font-weight:700">${a.name}</div>
                <div style="font-size:8px;color:${onCool?'#aaa':'#888'};margin-top:1px">${onCool?`${remain}s`:`+${a.happy}`}</div>
              </button>
            `;
          }).join('')}
        </div>

        ${happiness >= 100 ? `
        <button onclick="window.openAdoptFarmer&&window.openAdoptFarmer()" style="width:100%;background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:10px;padding:9px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;margin-top:8px;box-shadow:0 3px 8px rgba(196,69,105,.3)">
          🎉 새 토끼 입양 가능!
        </button>
        ` : ''}

      </div>
    `;
  }

  /* 액션 실행 (모달 X · 즉시) */
  window.eqDoAction = async function(actionId){
    if(!window.ME || !window._myBunny) return;
    const action = ACTIONS.find(a => a.id === actionId);
    if(!action) return;

    const now = Date.now();
    const last = _lastAct[actionId] || 0;
    if(now - last < action.cool * 1000){
      const remain = Math.ceil((action.cool * 1000 - (now - last)) / 1000);
      window.toast?.(`⏰ ${action.name} ${remain}초 후에 다시!`);
      return;
    }
    _lastAct[actionId] = now;

    // 행복도 증가
    window._myBunny.happiness = Math.min(100, (window._myBunny.happiness || 0) + action.happy);

    try {
      await window.FB.setDoc(window.FB.doc(window.FB.db, 'bunnies', window.ME.uid), window._myBunny);
    } catch(e){ console.error('[interactions]', e); }

    // 토끼 위 액션 이모지 띄우기
    showActionAnimation(action.emoji);

    // UI 갱신
    renderMiniBar();
    if(window.renderBunnyStats) window.renderBunnyStats();

    window.toast?.(`${action.emoji} ${action.name}! 행복도 +${action.happy}`);

    // 쿨다운 카운트다운 (1초마다 새로고침)
    const intId = setInterval(() => {
      const r = Math.max(0, action.cool - Math.floor((Date.now() - _lastAct[actionId]) / 1000));
      if(r <= 0) { clearInterval(intId); renderMiniBar(); return; }
      renderMiniBar();
    }, 1000);
  };

  /* 토끼들 위에 액션 이모지 떠오름 */
  function showActionAnimation(emoji){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;
    const bunnies = playground.querySelectorAll('.bunny-char');
    if(!bunnies.length) return;

    bunnies.forEach((b, i) => {
      setTimeout(() => {
        const anim = document.createElement('div');
        anim.style.cssText = `position:absolute;left:${parseFloat(b.style.left || '50') + 25}px;top:${parseFloat(b.style.top || '120') - 10}px;font-size:24px;z-index:60;pointer-events:none;animation:eqActAnim 1.6s ease-out forwards`;
        anim.textContent = emoji;
        playground.appendChild(anim);
        setTimeout(() => anim.remove(), 1700);
      }, i * 80);
    });

    if(!document.getElementById('eqActAnimCss')){
      const s = document.createElement('style');
      s.id = 'eqActAnimCss';
      s.textContent = `@keyframes eqActAnim { 0% { opacity: 1; transform: translateY(0) scale(.5); } 30% { transform: translateY(-15px) scale(1.3); } 100% { opacity: 0; transform: translateY(-40px) scale(1); } }`;
      document.head.appendChild(s);
    }
  }

  /* ===== 도감 자동 추적 (수확 카운트) — 안전망 ===== */
  let _lastPlots = null;
  function trackHarvest(){
    if(!window.UDATA?.bunnyField?.plots) return;
    const plots = window.UDATA.bunnyField.plots;
    if(_lastPlots === null){ _lastPlots = JSON.stringify(plots); return; }
    const cur = JSON.stringify(plots);
    if(cur === _lastPlots) return;

    // 이전 plot 중 stage 3였는데 사라진 거 찾기
    try {
      const prev = JSON.parse(_lastPlots);
      for(let i = 0; i < 6; i++){
        const pp = prev[i], cp = plots[i];
        if(pp && pp.crop && !cp){
          // 수확됨 — harvestedCrops는 crops_patch v3에서 처리됨
        }
      }
    } catch(e){}
    _lastPlots = cur;
  }

  /* boot */
  function boot(){
    ensureMiniBar();

    setInterval(() => {
      ensureMiniBar();
      trackHarvest();
    }, 1500);

    // 액션 모달 / 사이드 패널 제거 (기존 v1 잔존)
    const oldModal = document.getElementById('ovInteraction');
    if(oldModal) oldModal.remove();
    const oldFix = document.getElementById('eqActionPanelFixCss');
    if(oldFix) oldFix.remove();

    // 기존 v1의 액션 버튼 (들판 우측 상단 🎮 액션) 제거
    setInterval(() => {
      const playground = document.getElementById('bunnyPlayground');
      if(!playground) return;
      const allBtns = Array.from(playground.querySelectorAll('button'));
      const oldActionBtn = allBtns.find(b => /🎮\s*액션|^액션$/.test((b.textContent || '').trim()));
      if(oldActionBtn) oldActionBtn.remove();
    }, 1500);

    console.log('%c[bunny_interactions v2] 🎮 미니 플로팅 바 활성화','color:#fff;background:#e91e63;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4000));
  else setTimeout(boot, 4000);
})();
