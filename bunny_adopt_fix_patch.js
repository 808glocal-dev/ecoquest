// bunny_adopt_fix_patch.js v2
// 새 친구 입양: 토끼 5색 OR 한국 천연기념물 6종 (랜덤)
(function(){
  'use strict';

  const RABBITS = [
    {color:0, label:'하양 토끼'},
    {color:1, label:'갈얼룩 토끼'},
    {color:2, label:'회색 토끼'},
    {color:3, label:'베이지 토끼'},
    {color:4, label:'갈색 토끼'},
  ];

  const KOREAN = [
    {species:'otter',    emoji:'🦦', name:'수달',         tag:'멸종위기 1급'},
    {species:'squirrel', emoji:'🐿️', name:'하늘다람쥐',   tag:'천연기념물 328호'},
    {species:'goral',    emoji:'🐐', name:'산양',         tag:'멸종위기 1급'},
    {species:'turtle',   emoji:'🐢', name:'푸른바다거북',  tag:'멸종위기 2급'},
    {species:'deer',     emoji:'🦌', name:'사향노루',     tag:'멸종위기 1급'},
    {species:'crane',    emoji:'🦅', name:'두루미',       tag:'천연기념물 202호'},
  ];

  let _bunnyCache = null;

  async function fetchBunnyData(){
    if(!window.ME || !window.FB) return null;
    try {
      const ref = window.FB.doc(window.FB.db, 'bunnies', window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      if(snap.exists()){
        _bunnyCache = snap.data();
        window._myBunny = _bunnyCache;
        return _bunnyCache;
      }
    } catch(e){ console.error('[adopt fetch]', e); }
    return null;
  }

  async function saveBunnyData(data){
    if(!window.ME || !window.FB) return;
    try {
      await window.FB.setDoc(window.FB.doc(window.FB.db, 'bunnies', window.ME.uid), data);
      _bunnyCache = data;
      window._myBunny = data;
    } catch(e){ console.error('[adopt save]', e); }
  }

  /* ===== 입양 모달 ===== */
  window.openAdoptFarmer = async function(){
    let bunny = _bunnyCache;
    if(!bunny) bunny = await fetchBunnyData();
    if(!bunny){ window.toast?.('데이터 로딩 실패'); return; }

    if((bunny.happiness || 0) < 100){
      window.toast?.(`행복도 100 필요해요! (현재 ${bunny.happiness||0})`);
      return;
    }

    const old = document.getElementById('ovAdoptV2'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovAdoptV2';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9800;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div style="background:#fff;border-radius:22px;max-width:440px;width:100%;padding:24px 20px;max-height:90vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:18px">
          <div style="font-size:48px;line-height:1">🎉</div>
          <div style="font-size:19px;font-weight:900;color:#5D4037;margin-top:6px">새 친구 입양하기</div>
          <div style="font-size:11px;color:#888;margin-top:6px">어떤 친구를 데려올까요? 🎰 가챠로 결정!</div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:16px">
          <button onclick="window._eqSelectAdoptCat('rabbit')" style="flex:1;background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:14px;padding:16px 12px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 10px rgba(196,69,105,.3)">
            <div style="font-size:28px;line-height:1">🐰</div>
            <div style="margin-top:6px">토끼 가족</div>
            <div style="font-size:10px;font-weight:400;opacity:.85;margin-top:3px">5색 중 랜덤</div>
          </button>
          <button onclick="window._eqSelectAdoptCat('korean')" style="flex:1;background:linear-gradient(135deg,#27AE60,#1B5E20);color:#fff;border:none;border-radius:14px;padding:16px 12px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 10px rgba(27,94,32,.3)">
            <div style="font-size:28px;line-height:1">🌳</div>
            <div style="margin-top:6px">한국 천연기념물</div>
            <div style="font-size:10px;font-weight:400;opacity:.85;margin-top:3px">6종 중 랜덤</div>
          </button>
        </div>

        <div id="eqAdoptResult" style="text-align:center;padding:24px 16px;background:linear-gradient(135deg,#fafafa,#f5f5f5);border-radius:14px;margin-bottom:14px;color:#888;font-size:12px;border:2px dashed #ddd">
          ↑ 위 카테고리 선택 → 랜덤 결과 표시 ↑
        </div>

        <div id="eqAdoptForm" style="display:none">
          <div style="font-size:12px;font-weight:900;color:#5D4037;margin-bottom:6px">✏️ 이름 짓기</div>
          <input id="eqAdoptName" placeholder="예: 꼬미, 보리, 마루, 두두..." maxlength="8" style="width:100%;border:1.5px solid #ddd;border-radius:12px;padding:13px;font-size:15px;text-align:center;font-weight:700;outline:none;font-family:inherit;margin-bottom:12px"/>
          <div style="display:flex;gap:8px">
            <button onclick="document.getElementById('ovAdoptV2').remove(); window._eqSelectedAdopt = null;" style="flex:1;background:#f0f0f0;border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">취소</button>
            <button onclick="window._eqConfirmAdopt()" style="flex:2;background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">🎉 입양!</button>
          </div>
        </div>

        ${!document.getElementById('eqAdoptFormBack') ? '' : ''}
      </div>
    `;
    document.body.appendChild(modal);
  };

  window._eqSelectedAdopt = null;

  /* 카테고리 선택 → 랜덤 동물 */
  window._eqSelectAdoptCat = function(cat){
    const result = document.getElementById('eqAdoptResult');
    const form = document.getElementById('eqAdoptForm');
    if(!result || !form) return;

    let picked;
    if(cat === 'rabbit'){
      picked = RABBITS[Math.floor(Math.random() * RABBITS.length)];
      window._eqSelectedAdopt = {type:'rabbit', color: picked.color, emoji:'🐰', species:'rabbit', defaultName: picked.label};
      result.innerHTML = `
        <div style="font-size:60px;line-height:1;animation:eqAdoptPop .5s">🐰</div>
        <div style="font-size:18px;font-weight:900;color:#C44569;margin-top:10px">${picked.label}이 왔어요!</div>
        <div style="font-size:11px;color:#888;margin-top:6px">새 토끼 친구를 만났어요</div>
      `;
      result.style.background = 'linear-gradient(135deg,#fff8f0,#fce4ec)';
      result.style.borderStyle = 'solid';
      result.style.borderColor = '#FF6B9D';
    } else {
      picked = KOREAN[Math.floor(Math.random() * KOREAN.length)];
      window._eqSelectedAdopt = {type:'korean', emoji: picked.emoji, species: picked.species, defaultName: picked.name, tag: picked.tag};
      result.innerHTML = `
        <div style="font-size:60px;line-height:1;animation:eqAdoptPop .5s">${picked.emoji}</div>
        <div style="font-size:18px;font-weight:900;color:#1B5E20;margin-top:10px">${picked.name}이 왔어요!</div>
        <div style="font-size:10px;color:#27AE60;font-weight:900;margin-top:6px;background:#e8f5e9;display:inline-block;padding:4px 12px;border-radius:10px;border:1px solid #c8e6c9">${picked.tag}</div>
        <div style="font-size:11px;color:#888;margin-top:8px">한국이 지켜야 할 친구를 만났어요 🌿</div>
      `;
      result.style.background = 'linear-gradient(135deg,#f0fbf4,#e8f5e9)';
      result.style.borderStyle = 'solid';
      result.style.borderColor = '#27AE60';
    }

    form.style.display = 'block';

    if(!document.getElementById('eqAdoptPopCss')){
      const s = document.createElement('style');
      s.id = 'eqAdoptPopCss';
      s.textContent = `@keyframes eqAdoptPop { 0% { transform: scale(.3) rotate(-15deg); opacity: 0; } 60% { transform: scale(1.15) rotate(5deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }`;
      document.head.appendChild(s);
    }

    setTimeout(() => {
      const inp = document.getElementById('eqAdoptName');
      if(inp){ inp.focus(); inp.value = ''; inp.onkeydown = (e) => { if(e.key === 'Enter') window._eqConfirmAdopt(); }; }
    }, 100);
  };

  /* 입양 확정 */
  window._eqConfirmAdopt = async function(){
    const sel = window._eqSelectedAdopt;
    if(!sel){ window.toast?.('카테고리를 선택해주세요'); return; }

    const inp = document.getElementById('eqAdoptName');
    let name = inp?.value?.trim() || '';
    if(!name) name = sel.defaultName || '친구';
    if(name.length > 8) name = name.substring(0, 8);

    let bunny = _bunnyCache;
    if(!bunny) bunny = await fetchBunnyData();
    if(!bunny){ window.toast?.('실패: 데이터'); return; }

    if(!bunny.bunnies) bunny.bunnies = [];

    bunny.bunnies.push({
      name,
      color: sel.type === 'rabbit' ? sel.color : 0,
      type: sel.type,
      species: sel.species,
      emoji: sel.emoji,
      tag: sel.tag || '',
      hat: '👒',
      adoptedAt: Date.now(),
    });

    bunny.happiness = 0;
    await saveBunnyData(bunny);

    document.getElementById('ovAdoptV2')?.remove();
    window._eqSelectedAdopt = null;

    window.toast?.(`🎉 "${name}" 우리 가족이 됐어요!`);

    setTimeout(() => location.reload(), 1500);
  };

  function boot(){
    console.log('%c[bunny_adopt_fix v2] 🐰🌳 토끼 + 천연기념물 입양','color:#fff;background:#27AE60;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3500));
  else setTimeout(boot, 3500);
})();
