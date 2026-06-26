/* challenge_category_patch.js
 * 공식 챌린지: 전체 나열 → 카테고리 카드(7개) → 탭하면 해당 챌린지만 표시
 * - renderOfficialChallenges 를 덮어씀 (index.html 수정 X)
 * - 분류를 바꾸려면 아래 CATS 의 ids 숫자만 옮기면 됨 (숫자 = CHALLENGES.id)
 * - 기존 category_section_patch.js(전체/먹거리/… 칩)는 빼는 걸 권장 (방어적으로 자동 숨김도 시도함)
 */
(function(){
  'use strict';

  const CATS = [
    {id:'food',    name:'먹거리',     emoji:'🥗', sub:'채식 · 음식',           ids:[3,10,12],                       grad:'linear-gradient(135deg,#f6a23c,#ff7a8a)'},
    {id:'move',    name:'이동',       emoji:'🚌', sub:'대중교통 · 자전거',      ids:[2,5,17],                        grad:'linear-gradient(135deg,#1565C0,#42a5f5)'},
    {id:'zero',    name:'제로웨이스트', emoji:'♻️', sub:'다회용 · 재활용',        ids:[1,4,7,8,11,13,16,19,20,25],     grad:'linear-gradient(135deg,#0f9b8e,#2ECC71)'},
    {id:'energy',  name:'에너지',     emoji:'💡', sub:'절전 · 태양광',          ids:[9,23],                          grad:'linear-gradient(135deg,#f7971e,#ffc83d)'},
    {id:'nature',  name:'자연',       emoji:'🌿', sub:'줍깅 · 나무 · 텃밭',     ids:[6,14,22],                       grad:'linear-gradient(135deg,#11998e,#38ef7d)'},
    {id:'life',    name:'학습·생활',  emoji:'📚', sub:'친환경소비 · 교육',      ids:[15,18,21,24],                   grad:'linear-gradient(135deg,#8e2de2,#b06ab3)'},
    {id:'ecology', name:'생태십계명', emoji:'✝️', sub:'10가지 생태 실천',       ids:[26,27,28,29,30,31,32,33,34,35], grad:'linear-gradient(135deg,#3a1c71,#5a4fb0)'},
  ];

  let _catView = null; // null = 카테고리 목록, 그 외 = 카테고리 id

  function chalsOf(cat){
    const all = window.CHALLENGES || [];
    return cat.ids.map(id => all.find(c => c.id === id)).filter(Boolean);
  }

  function ensureNav(){
    const grid = document.getElementById('officialGrid');
    if(!grid) return null;
    let nav = document.getElementById('catNav');
    if(!nav){
      nav = document.createElement('div');
      nav.id = 'catNav';
      nav.style.cssText = 'padding:0 12px';
      grid.parentNode.insertBefore(nav, grid);
    }
    return nav;
  }

  function renderHome(){
    const grid = document.getElementById('officialGrid');
    if(!grid) return;
    const nav = ensureNav();
    if(nav) nav.innerHTML = `<div style="font-size:12px;color:var(--sub);margin:2px 0 10px">🌱 관심 있는 분야를 골라보세요</div>`;

    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '10px';

    grid.innerHTML = CATS.map((cat,i)=>{
      const n = chalsOf(cat).length;
      const isFull = (i === CATS.length-1 && CATS.length % 2 === 1);
      if(isFull){
        return `
        <div onclick="window.openChalCategory('${cat.id}')"
          style="grid-column:1 / 3;background:${cat.grad};border-radius:18px;padding:16px 18px;cursor:pointer;color:#fff;position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;box-shadow:0 4px 14px rgba(0,0,0,.13)">
          <div style="position:absolute;right:-6px;bottom:-14px;font-size:80px;opacity:.16;line-height:1">${cat.emoji}</div>
          <div style="font-size:40px;line-height:1;position:relative;z-index:1">${cat.emoji}</div>
          <div style="flex:1;position:relative;z-index:1">
            <div style="font-size:17px;font-weight:900">${cat.name}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px">${cat.sub}</div>
          </div>
          <div style="position:relative;z-index:1;background:rgba(255,255,255,.22);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;white-space:nowrap">챌린지 ${n}개 ›</div>
        </div>`;
      }
      return `
      <div onclick="window.openChalCategory('${cat.id}')"
        style="background:${cat.grad};border-radius:18px;padding:16px 14px;cursor:pointer;color:#fff;position:relative;overflow:hidden;min-height:120px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 14px rgba(0,0,0,.13)">
        <div style="position:absolute;right:-8px;bottom:-10px;font-size:72px;opacity:.16;line-height:1">${cat.emoji}</div>
        <div style="position:relative;z-index:1">
          <div style="font-size:30px;line-height:1;margin-bottom:8px">${cat.emoji}</div>
          <div style="font-size:16px;font-weight:900;letter-spacing:-.3px">${cat.name}</div>
          <div style="font-size:11px;opacity:.85;margin-top:2px">${cat.sub}</div>
        </div>
        <div style="position:relative;z-index:1;align-self:flex-start;background:rgba(255,255,255,.22);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;margin-top:8px">챌린지 ${n}개 ›</div>
      </div>`;
    }).join('');
  }

  function renderDetail(catId){
    const cat = CATS.find(c => c.id === catId);
    const grid = document.getElementById('officialGrid');
    if(!cat || !grid) return;

    const nav = ensureNav();
    if(nav){
      nav.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin:0 0 12px">
          <button onclick="window.backToCategories()" style="background:#f0fbf4;border:1.5px solid var(--bdr);border-radius:12px;padding:8px 12px;font-size:13px;font-weight:700;color:var(--g2);cursor:pointer;font-family:inherit;white-space:nowrap">← 카테고리</button>
          <div style="font-size:22px">${cat.emoji}</div>
          <div>
            <div style="font-size:15px;font-weight:900;color:var(--txt)">${cat.name}</div>
            <div style="font-size:11px;color:var(--sub)">${cat.sub} · ${chalsOf(cat).length}개</div>
          </div>
        </div>`;
    }

    // 상세는 앱 기본 .chal-grid 반응형(모바일 2열 / PC 3~4열)에 맡김
    grid.style.display = '';
    grid.style.gridTemplateColumns = '';
    grid.style.gap = '';

    const list = chalsOf(cat);
    grid.innerHTML = list.map(c => `
      <div class="cg-card" onclick="openChal(${c.id})">
        <div class="cg-img">
          ${c.emoji}
          <span class="official-tag">공식챌린지</span>
          <span class="cg-cnt" id="chal-cnt-${c.id}">👥 ${c.baseParticipants.toLocaleString()}명</span>
          ${c.hot ? '<span class="hot-badge">HOT</span>' : ''}
        </div>
        <div class="cg-body">
          <div class="cg-title">${c.title}</div>
          <div class="cg-meta">${c.freqOptions?.[0]==='daily'?'매일':c.freqOptions?.[0]==='w1'?'주 1회':'주 3일~'} · AI인증</div>
        </div>
      </div>`).join('');

    updateCounts(list);
  }

  async function updateCounts(list){
    try{
      if(!window.FB) return;
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db,"stats","challenges"));
      if(snap.exists()){
        const counts = snap.data();
        list.forEach(c=>{
          const el = document.getElementById(`chal-cnt-${c.id}`);
          if(el){ const total = counts[`c${c.id}`]||0; if(total>0) el.textContent = `👥 ${total.toLocaleString()}명`; }
        });
      }
    }catch(e){}
  }

  function render(){
    if(_catView) renderDetail(_catView);
    else renderHome();
  }

  window.openChalCategory = function(id){
    _catView = id; render();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){}
  };
  window.backToCategories = function(){
    _catView = null; render();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){}
  };

  function override(){
    window.renderOfficialChallenges = function(){ render(); };
  }

  // 기존 카테고리 칩(전체/먹거리/…) 잔재 숨김 — 다른 patch가 칩을 만들어도 안 보이게
  const CHIP_LABELS = ['먹거리','이동','제로웨이스트','에너지','자연','학습·생활','생태십계명'];
  function hideOldChips(){
    const sec = document.getElementById('sec-official');
    if(!sec) return;
    // '전체' 라는 글자만 가진 잎(leaf) 요소 찾기
    let leaf = null;
    const nodes = sec.querySelectorAll('*');
    for(const el of nodes){
      if(el.children.length === 0 && (el.textContent||'').trim() === '전체'){ leaf = el; break; }
    }
    if(!leaf) return;
    // 그 위로 올라가면서, 카테고리 칩을 3개 이상 품은 컨테이너 = 칩바 → 숨김
    let node = leaf;
    while(node && node !== sec){
      if(node.id !== 'officialGrid' && node.id !== 'catNav'){
        const txt = node.textContent || '';
        const hits = CHIP_LABELS.filter(l => txt.includes(l)).length;
        if(hits >= 3){ node.style.display = 'none'; return; }
      }
      node = node.parentElement;
    }
  }

  // 칩이 언제 그려지든(다른 patch가 늦게 띄워도) 바로 숨기도록 감시
  function watchChips(){
    const sec = document.getElementById('sec-official');
    if(!sec){ setTimeout(watchChips, 500); return; }
    hideOldChips();
    try{
      const mo = new MutationObserver(()=>hideOldChips());
      mo.observe(sec, {childList:true, subtree:true});
    }catch(e){}
  }

  function boot(){
    if(typeof window.CHALLENGES === 'undefined'){ setTimeout(boot,400); return; }
    override();
    watchChips();
    const grid = document.getElementById('officialGrid');
    if(grid && grid.children.length) render();
    document.querySelectorAll('.tb[data-page="chal"]').forEach(tb=>{
      tb.addEventListener('click', ()=>setTimeout(()=>{ hideOldChips(); render(); }, 120));
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,1200));
  else setTimeout(boot,1200);
})();
