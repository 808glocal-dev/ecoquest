// tag_filter_patch.js - 데이터 배열 기반 필터 (v3)
(function(){
  
  let currentFilter = 'all';
  
  function addFilterButtons(){
    const secOfficial = document.getElementById('sec-official');
    if(!secOfficial) return;
    if(document.getElementById('tagFilterBar')) return;
    
    const filterBar = document.createElement('div');
    filterBar.id = 'tagFilterBar';
    filterBar.style.cssText = `
      display:flex;gap:6px;padding:10px 12px;
      overflow-x:auto;overflow-y:hidden;
      scrollbar-width:none;-ms-overflow-style:none;
      background:#fff;border-bottom:1px solid var(--bdr);
    `;
    filterBar.innerHTML = `
      <style>
        #tagFilterBar::-webkit-scrollbar { display: none; }
        .tag-btn {
          flex-shrink: 0;
          padding: 8px 14px;
          border: 1.5px solid var(--bdr);
          background: #fff;
          color: var(--sub);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
        }
        .tag-btn.active {
          background: linear-gradient(135deg,#2ECC71,#27AE60);
          color: #fff;
          border-color: transparent;
        }
      </style>
      <button class="tag-btn active" data-tag="all" onclick="window._filterByTag('all')">전체</button>
      <button class="tag-btn" data-tag="🌿 환경" onclick="window._filterByTag('🌿 환경')">🌿 환경</button>
      <button class="tag-btn" data-tag="🚌 교통" onclick="window._filterByTag('🚌 교통')">🚌 교통</button>
      <button class="tag-btn" data-tag="🥗 식품" onclick="window._filterByTag('🥗 식품')">🥗 식품</button>
      <button class="tag-btn" data-tag="♻️ 제로웨이스트" onclick="window._filterByTag('♻️ 제로웨이스트')">♻️ 제로웨이스트</button>
      <button class="tag-btn" data-tag="💡 절전" onclick="window._filterByTag('💡 절전')">💡 절전</button>
      <button class="tag-btn" data-tag="🛒 친환경소비" onclick="window._filterByTag('🛒 친환경소비')">🛒 친환경소비</button>
      <button class="tag-btn" data-tag="🌍 환경활동" onclick="window._filterByTag('🌍 환경활동')">🌍 환경활동</button>
      <button class="tag-btn" data-tag="🌊 해양" onclick="window._filterByTag('🌊 해양')">🌊 해양</button>
      <button class="tag-btn" data-tag="✝️ 생태십계명" onclick="window._filterByTag('✝️ 생태십계명')">✝️ 생태십계명</button>
    `;
    
    secOfficial.insertBefore(filterBar, secOfficial.firstChild);
  }
  
  window._filterByTag = (tag) => {
    currentFilter = tag;
    
    // 버튼 active
    document.querySelectorAll('.tag-btn').forEach(btn => {
      if(btn.dataset.tag === tag){
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // CHALLENGES 배열에서 id → tag 매핑 만들기
    const idToTag = {};
    if(window.CHALLENGES){
      window.CHALLENGES.forEach(c => {
        idToTag[c.id] = c.tag;
      });
    }
    
    const cards = document.querySelectorAll('#sec-official .cg-card');
    let visibleCount = 0;
    
    cards.forEach((card, index) => {
      // 카드 제목으로 CHALLENGES 배열과 매칭
      const titleEl = card.querySelector('[class*="title"]') 
                   || card.querySelector('h3') 
                   || card.querySelectorAll('div')[3]; // 4번째 div가 보통 제목
      
      // 카드의 모든 텍스트 가져오기
      const cardText = card.textContent || '';
      
      // CHALLENGES 배열에서 이 카드와 매칭되는 챌린지 찾기
      let matchedChal = null;
      if(window.CHALLENGES){
        matchedChal = window.CHALLENGES.find(c => cardText.includes(c.title));
      }
      
      if(tag === 'all'){
        card.style.display = '';
        visibleCount++;
      } else if(matchedChal && matchedChal.tag === tag){
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // 빈 메시지
    let emptyMsg = document.getElementById('filterEmptyMsg');
    if(visibleCount === 0 && tag !== 'all'){
      if(!emptyMsg){
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'filterEmptyMsg';
        emptyMsg.style.cssText = `
          text-align:center;padding:40px 20px;
          color:var(--sub);font-size:13px;line-height:1.8;
        `;
        emptyMsg.innerHTML = `
          <div style="font-size:40px;margin-bottom:10px">🔍</div>
          <div>이 카테고리에 챌린지가 없어요!</div>
        `;
        document.getElementById('sec-official').appendChild(emptyMsg);
      }
      emptyMsg.style.display = '';
    } else if(emptyMsg){
      emptyMsg.style.display = 'none';
    }
    
    // 공식 챌린지 헤더 (🔥 공식 챌린지) 숨기기/보이기
    const headers = document.querySelectorAll('#sec-official > div');
    headers.forEach(h => {
      const txt = h.textContent || '';
      if(txt.includes('🔥 공식') || txt.includes('공식 챌린지')){
        h.style.display = tag === 'all' ? '' : 'none';
      }
    });
    
    console.log(`[filter v3] ${tag} → ${visibleCount}개 표시`);
  };
  
  function init(){
    const origSetCTab = window.setCTab;
    if(typeof origSetCTab === 'function'){
      window.setCTab = function(t){
        origSetCTab.apply(this, arguments);
        if(t === 'official'){
          setTimeout(() => {
            addFilterButtons();
            if(currentFilter !== 'all'){
              window._filterByTag(currentFilter);
            }
          }, 300);
        }
      };
    }
    
    setTimeout(addFilterButtons, 2000);
    
    const origRender = window.renderChallenges;
    if(typeof origRender === 'function'){
      window.renderChallenges = function(){
        origRender.apply(this, arguments);
        setTimeout(() => {
          addFilterButtons();
          if(currentFilter !== 'all'){
            window._filterByTag(currentFilter);
          }
        }, 200);
      };
    }
  }
  
  if(document.readyState === 'complete'){
    setTimeout(init, 1500);
  } else {
    window.addEventListener('load', () => setTimeout(init, 1500));
  }
  
  console.log('[tag_filter_patch v3] 제목 기반 매칭');
})();
