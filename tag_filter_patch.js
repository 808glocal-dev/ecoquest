// tag_filter_patch.js - 챌린지 태그 필터 버튼
(function(){
  
  let currentFilter = 'all'; // 현재 선택된 필터
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 필터 버튼 UI 추가
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function addFilterButtons(){
    const secOfficial = document.getElementById('sec-official');
    if(!secOfficial) return;
    if(document.getElementById('tagFilterBar')) return; // 이미 있음
    
    // 필터 버튼 HTML
    const filterBar = document.createElement('div');
    filterBar.id = 'tagFilterBar';
    filterBar.style.cssText = `
      display:flex;gap:6px;padding:10px 12px;
      overflow-x:auto;overflow-y:hidden;
      scrollbar-width:none;-ms-overflow-style:none;
      background:#fff;border-bottom:1px solid var(--bdr);
      position:sticky;top:0;z-index:10;
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
    
    // 공식 챌린지 섹션 맨 위에 삽입
    secOfficial.insertBefore(filterBar, secOfficial.firstChild);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 필터 적용
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window._filterByTag = (tag) => {
    currentFilter = tag;
    
    // 버튼 active 상태 업데이트
    document.querySelectorAll('.tag-btn').forEach(btn => {
      if(btn.dataset.tag === tag){
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // 카드 필터링
    const cards = document.querySelectorAll('#sec-official .cg-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
      if(tag === 'all'){
        card.style.display = '';
        visibleCount++;
      } else {
        // 카드 안의 태그 찾기
        const tagEl = card.querySelector('[class*="tag"]') 
                   || card.querySelector('span');
        const cardText = card.textContent || '';
        
        if(cardText.includes(tag)){
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      }
    });
    
    // HOT 섹션이나 다른 섹션 타이틀도 처리
    const sections = document.querySelectorAll('#sec-official > div[style*="font-weight"]');
    sections.forEach(sec => {
      if(tag === 'all'){
        sec.style.display = '';
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
  };
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 초기화 - 챌린지 탭 진입 시 적용
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function init(){
    // 공식 챌린지 탭 클릭 시 필터 버튼 추가
    const origSetCTab = window.setCTab;
    if(typeof origSetCTab === 'function'){
      window.setCTab = function(t){
        origSetCTab.apply(this, arguments);
        if(t === 'official'){
          setTimeout(() => {
            addFilterButtons();
            // 이전 필터 유지
            if(currentFilter && currentFilter !== 'all'){
              window._filterByTag(currentFilter);
            }
          }, 300);
        }
      };
    }
    
    // 챌린지 페이지 진입 시에도 한 번
    setTimeout(addFilterButtons, 2000);
    
    // 챌린지 다시 렌더될 때마다 필터 재적용
    const origRenderChallenges = window.renderChallenges;
    if(typeof origRenderChallenges === 'function'){
      window.renderChallenges = function(){
        origRenderChallenges.apply(this, arguments);
        setTimeout(() => {
          addFilterButtons();
          if(currentFilter && currentFilter !== 'all'){
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
  
  console.log('[tag_filter_patch] 태그 필터 로드됨');
})();
