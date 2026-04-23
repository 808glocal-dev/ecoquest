// tag_filter_patch.js - 챌린지 태그 필터 (데이터 기반)
(function(){
  
  let currentFilter = 'all';
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 필터 버튼 추가
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
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
          transition: all 0.2s;
        }
        .tag-btn.active {
          background: linear-gradient(135deg,#2ECC71,#27AE60);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(46,204,113,.3);
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
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 필터 적용 (CHALLENGES 배열 기반!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window._filterByTag = (tag) => {
    currentFilter = tag;
    
    // 버튼 active 상태
    document.querySelectorAll('.tag-btn').forEach(btn => {
      if(btn.dataset.tag === tag){
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // CHALLENGES 배열에서 해당 tag를 가진 id들 찾기
    const matchingIds = new Set();
    if(window.CHALLENGES){
      window.CHALLENGES.forEach(c => {
        if(tag === 'all' || c.tag === tag){
          matchingIds.add(String(c.id));
        }
      });
    }
    
    // 모든 카드 검사
    const cards = document.querySelectorAll('#sec-official .cg-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
      // 카드에서 challenge id 찾기
      // onclick 속성에서 id 추출 (예: onclick="openChalDetail(26)")
      const onclickAttr = card.getAttribute('onclick') || '';
      const idMatch = onclickAttr.match(/\d+/);
      const cardId = idMatch ? idMatch[0] : null;
      
      if(tag === 'all'){
        card.style.display = '';
        visibleCount++;
      } else if(cardId && matchingIds.has(cardId)){
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // HOT 섹션 헤더 숨기기/보이기 (전체가 아닐 때)
    const hotSection = document.querySelector('#sec-official .hot-section, #sec-official > [data-section="hot"]');
    
    // 섹션 타이틀들 처리
    const sectionTitles = document.querySelectorAll('#sec-official > div');
    sectionTitles.forEach(el => {
      const text = el.textContent || '';
      // "🔥 인기" 또는 "📋 전체" 같은 타이틀
      if(text.includes('🔥') || text.includes('📋') || text.includes('인기') || text.includes('전체 챌린지')){
        if(tag === 'all'){
          el.style.display = '';
        } else {
          // 이 섹션 안에 보이는 카드 있는지 확인
          const nextCards = [];
          let next = el.nextElementSibling;
          while(next && !next.matches('div[style*="font-weight"]')){
            if(next.classList.contains('cg-card')){
              nextCards.push(next);
            }
            next = next.nextElementSibling;
          }
          const hasVisible = nextCards.some(c => c.style.display !== 'none');
          el.style.display = hasVisible ? '' : 'none';
        }
      }
    });
    
    // 결과 없을 때
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
    
    console.log(`[filter] ${tag} → ${visibleCount}개 카드 표시`);
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 초기화
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
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
    
    // renderChallenges 오버라이드
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
  
  console.log('[tag_filter_patch v2] 데이터 기반 필터');
})();
