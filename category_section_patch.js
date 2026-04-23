// category_section_patch.js - 공식 챌린지를 카테고리별 섹션으로
(function(){

  const CATEGORY_ORDER = [
    { tag: '🌿 환경', title: '환경' },
    { tag: '🚌 교통', title: '교통' },
    { tag: '🥗 식품', title: '식품' },
    { tag: '♻️ 제로웨이스트', title: '제로웨이스트' },
    { tag: '💡 절전', title: '절전' },
    { tag: '🛒 친환경소비', title: '친환경소비' },
    { tag: '🌍 환경활동', title: '환경활동' },
    { tag: '🌊 해양', title: '해양' },
    { tag: '✝️ 생태십계명', title: '생태 십계명' }
  ];

  function reorganizeByCategory(){
    const secOfficial = document.getElementById('sec-official');
    if(!secOfficial) return;
    if(!window.CHALLENGES || !window.CHALLENGES.length) return;
    if(secOfficial.getAttribute('data-reorganized')) return;
    
    // 기존 카드들 수집
    const allCards = Array.from(secOfficial.querySelectorAll('.cg-card'));
    if(allCards.length === 0){
      // 카드 아직 렌더링 안 됨, 잠시 후 재시도
      setTimeout(reorganizeByCategory, 500);
      return;
    }
    
    // 카드와 챌린지 매칭
    const cardByChalId = {};
    allCards.forEach(card => {
      const text = card.textContent || '';
      const chal = window.CHALLENGES.find(c => text.includes(c.title));
      if(chal){
        cardByChalId[chal.id] = card;
      }
    });
    
    // 기존 콘텐츠 숨기기 (제거 아님, 재사용)
    const container = document.createElement('div');
    container.id = 'categorySections';
    container.style.cssText = 'padding: 8px 0';
    
    // HOT 섹션 (맨 위)
    const hotChalls = window.CHALLENGES.filter(c => c.hot);
    if(hotChalls.length > 0){
      container.appendChild(createSection({
        title: '🔥 인기 챌린지',
        subtitle: '지금 가장 뜨거운 챌린지!',
        challenges: hotChalls,
        cardByChalId,
        highlight: false
      }));
    }
    
    // 카테고리별 섹션
    CATEGORY_ORDER.forEach(cat => {
      const challs = window.CHALLENGES.filter(c => c.tag === cat.tag);
      if(challs.length === 0) return;
      
      container.appendChild(createSection({
        title: cat.tag,
        subtitle: `${challs.length}개의 챌린지`,
        challenges: challs,
        cardByChalId,
        highlight: cat.tag === '✝️ 생태십계명'
      }));
    });
    
    // 기존 카드들 제거
    allCards.forEach(card => card.remove());
    
    // 헤더(공식 챌린지 제목) 찾아서 남기고, 그 뒤에 container 삽입
    const existingHeader = secOfficial.querySelector('div[style*="font-weight"]');
    if(existingHeader){
      existingHeader.parentNode.insertBefore(container, existingHeader.nextSibling);
    } else {
      secOfficial.appendChild(container);
    }
    
    secOfficial.setAttribute('data-reorganized', 'true');
    
    console.log('[category_section] ✅ 카테고리별 재구성 완료');
  }

  function createSection({title, subtitle, challenges, cardByChalId, highlight}){
    const section = document.createElement('div');
    section.style.cssText = `margin: 16px 0; ${highlight ? 'background:linear-gradient(180deg,#fffaf0,transparent);border-radius:16px;padding:4px 0 12px;margin:16px 8px;border-top:3px solid #F39C12;' : ''}`;
    
    // 헤더
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 14px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    header.innerHTML = `
      <div>
        <div style="font-size:15px;font-weight:900;color:${highlight ? '#8B5E04' : 'var(--txt)'}">
          ${title}
        </div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px">
          ${subtitle}
        </div>
      </div>
    `;
    section.appendChild(header);
    
    // 카드 그리드
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px;
      padding: 0 12px;
    `;
    
    challenges.forEach(chal => {
      const originalCard = cardByChalId[chal.id];
      if(originalCard){
        // 원본 카드 복제 (이벤트도 유지)
        const clone = originalCard.cloneNode(true);
        clone.onclick = () => {
          if(typeof window.openChal === 'function'){
            window.openChal(chal.id);
          }
        };
        
        // 생태 십계명이면 ✝️ 테두리 추가
        if(highlight){
          clone.style.border = '1.5px solid #F39C12';
        }
        
        grid.appendChild(clone);
      }
    });
    
    section.appendChild(grid);
    return section;
  }

  function init(){
    const origSetCTab = window.setCTab;
    if(typeof origSetCTab === 'function'){
      window.setCTab = function(t){
        origSetCTab.apply(this, arguments);
        if(t === 'official'){
          setTimeout(() => {
            const sec = document.getElementById('sec-official');
            if(sec) sec.removeAttribute('data-reorganized');
            reorganizeByCategory();
          }, 500);
        }
      };
    }
    
    const origRender = window.renderChallenges;
    if(typeof origRender === 'function'){
      window.renderChallenges = function(){
        origRender.apply(this, arguments);
        setTimeout(() => {
          const sec = document.getElementById('sec-official');
          if(sec) sec.removeAttribute('data-reorganized');
          reorganizeByCategory();
        }, 500);
      };
    }
    
    setTimeout(reorganizeByCategory, 2500);
  }

  if(document.readyState === 'complete'){
    setTimeout(init, 1500);
  } else {
    window.addEventListener('load', () => setTimeout(init, 1500));
  }

  console.log('[category_section_patch] 로드됨');
})();
