// bunny_pokedex_click_patch.js v1
// MY FARM 카드의 "도감 4/12" 부분 클릭 가능하게 + 작물별 수확 카운트 도감 모달
(function(){
  'use strict';

  const CROPS = [
    {id:'carrot',     name:'당근',     emoji:'🥕'},
    {id:'lettuce',    name:'상추',     emoji:'🥬'},
    {id:'strawberry', name:'딸기',     emoji:'🍓'},
    {id:'tomato',     name:'토마토',   emoji:'🍅'},
    {id:'corn',       name:'옥수수',   emoji:'🌽'},
    {id:'pepper',     name:'고추',     emoji:'🌶️'},
    {id:'broccoli',   name:'브로콜리', emoji:'🥦'},
    {id:'onion',      name:'양파',     emoji:'🧅'},
    {id:'garlic',     name:'마늘',     emoji:'🧄'},
    {id:'eggplant',   name:'가지',     emoji:'🍆'},
    {id:'pumpkin',    name:'호박',     emoji:'🎃'},
    {id:'apple',      name:'사과',     emoji:'🍎'},
  ];

  /* ===== 도감 모달 ===== */
  async function openPokedex(){
    let harvested = window.UDATA?.harvestedCrops || {};
    // Firebase에서 최신 데이터
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid));
      if(snap.exists()){
        harvested = snap.data().harvestedCrops || harvested;
        if(window.UDATA) window.UDATA.harvestedCrops = harvested;
      }
    } catch(e){}

    const old = document.getElementById('ovMyPokedex'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovMyPokedex';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9600;display:flex;align-items:center;justify-content:center;padding:20px;animation:eqDexFadeIn .25s ease';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    const total = CROPS.length;
    const obtained = Object.keys(harvested).filter(k => harvested[k] > 0).length;
    const totalCount = Object.values(harvested).reduce((s, n) => s + n, 0);

    // 최다 수확 작물 찾기 (랭킹)
    const sorted = [...CROPS].map(c => ({...c, cnt: harvested[c.id] || 0})).sort((a, b) => b.cnt - a.cnt);
    const top = sorted[0];

    modal.innerHTML = `
      <div style="background:#fff;border-radius:22px;max-width:400px;width:100%;padding:24px 20px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:eqDexSlideUp .35s ease">
        <div style="text-align:center;margin-bottom:18px">
          <div style="font-size:52px;margin-bottom:4px">📔</div>
          <div style="font-size:20px;font-weight:900;color:#5D4037">작물 도감</div>
          <div style="font-size:12px;color:#888;margin-top:6px">${obtained}/${total}종 발견 · 누적 ${totalCount}개 수확</div>
          <div style="background:#f0fbf4;border-radius:8px;height:8px;margin-top:10px;overflow:hidden">
            <div style="width:${(obtained/total)*100}%;height:100%;background:linear-gradient(90deg,#27AE60,#F39C12);transition:width .5s"></div>
          </div>
          ${top && top.cnt > 0 ? `<div style="margin-top:10px;font-size:11px;color:#666;background:#fff8e1;border-radius:10px;padding:6px 12px;display:inline-block">🏆 최다 수확: ${top.emoji} ${top.name} <b style="color:#8D6E1B">${top.cnt}개</b></div>` : ''}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
          ${CROPS.map(c => {
            const cnt = harvested[c.id] || 0;
            const has = cnt > 0;
            return `
              <div style="background:${has?'#f0fbf4':'#fafafa'};border:1.5px solid ${has?'#a8e6c5':'#eee'};border-radius:14px;padding:12px 4px;text-align:center;${has?'':'opacity:.5;filter:grayscale(.85)'}">
                <div style="font-size:36px;line-height:1">${has?c.emoji:'❓'}</div>
                <div style="font-size:12px;color:#5D4037;margin-top:6px;font-weight:900">${has?c.name:'???'}</div>
                <div style="font-size:11px;color:${has?'#27AE60':'#aaa'};margin-top:3px;font-weight:700">${has?`✅ ${cnt}개`:'미발견'}</div>
              </div>
            `;
          }).join('')}
        </div>

        ${obtained === total ? `
          <div style="background:linear-gradient(135deg,#fff8e1,#fff3c4);border-radius:14px;padding:14px;text-align:center;margin-bottom:12px;border:2px solid #FFD54F">
            <div style="font-size:30px;margin-bottom:4px">🏆</div>
            <div style="font-size:13px;font-weight:900;color:#8D6E1B">도감 완성!</div>
            <div style="font-size:11px;color:#8D6E1B;margin-top:2px">모든 작물 수확 마스터! 👑</div>
          </div>
        ` : `
          <div style="background:#f8f8f8;border-radius:10px;padding:10px 12px;font-size:11px;color:#666;text-align:center;margin-bottom:12px;line-height:1.6">
            💡 들판(지구 탭)에서 작물을 심고 수확하면 자동으로 기록돼요<br/>
            <span style="font-size:10px;color:#aaa">${total - obtained}종 남음</span>
          </div>
        `}

        <button onclick="document.getElementById('ovMyPokedex').remove()" style="background:#f0f0f0;border:none;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;color:#666">닫기</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  window.openMyPokedex = openPokedex;

  /* ===== 도감 텍스트 가진 박스 클릭 가능하게 ===== */
  function attachClickHandlers(){
    const farmPage = document.getElementById('page-farm');
    if(!farmPage) return;

    farmPage.querySelectorAll('div').forEach(el => {
      if(el.dataset.eqDexClick) return;
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();

      // 조건: "도감" + 비율 표기 (N/12 등) + 짧은 텍스트 (한 박스 내용만)
      if(/도감/.test(txt) && /\d+\s*\/\s*\d+/.test(txt) && txt.length < 35 && txt.length > 4){
        el.style.cursor = 'pointer';
        el.style.position = 'relative';
        el.style.transition = 'transform .15s, box-shadow .15s';
        el.onclick = (e) => { e.stopPropagation(); openPokedex(); };
        el.onmouseover = () => {
          el.style.transform = 'scale(1.06)';
          el.style.boxShadow = '0 4px 14px rgba(46,204,113,.25)';
        };
        el.onmouseout = () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '';
        };
        el.dataset.eqDexClick = '1';

        // "탭하세요" 안내 표시 (작게)
        const hint = document.createElement('div');
        hint.className = 'eq-dex-hint';
        hint.style.cssText = 'position:absolute;top:-6px;right:-6px;background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;border-radius:20px;padding:2px 6px;font-size:9px;font-weight:900;animation:eqDexHint 2s ease-in-out infinite;box-shadow:0 2px 6px rgba(46,204,113,.5);pointer-events:none;z-index:5';
        hint.textContent = '👆 탭';
        el.appendChild(hint);
      }
    });

    // 우리 카드(eqFarmSummary)에도 도감 부분 클릭 가능하게 — 이미 위 로직이 잡음
  }

  /* ===== CSS ===== */
  function addCss(){
    if(document.getElementById('eqDexCss')) return;
    const s = document.createElement('style');
    s.id = 'eqDexCss';
    s.textContent = `
      @keyframes eqDexFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes eqDexSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes eqDexHint {
        0%, 100% { opacity: .8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.15); }
      }
    `;
    document.head.appendChild(s);
  }

  /* boot */
  function boot(){
    if(!window.FB){ setTimeout(boot, 500); return; }
    addCss();
    attachClickHandlers();

    const observer = new MutationObserver(() => {
      const farmPage = document.getElementById('page-farm');
      if(farmPage && (farmPage.classList.contains('on') || farmPage.style.display !== 'none')){
        attachClickHandlers();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 안전망
    setInterval(attachClickHandlers, 2000);

    console.log('%c[bunny_pokedex_click v1] 📔 도감 카드 클릭 활성화','color:#fff;background:#1A237E;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 4500));
  else setTimeout(boot, 4500);
})();
