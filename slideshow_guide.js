// slideshow_guide.js - 슬라이드 사용법 가이드 (60대 친화)
(function(){

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 슬라이드 데이터 (총 14페이지)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  const SLIDES = [
    {
      emoji: '🌍',
      title: 'EcoQuest에 오신 걸 환영해요!',
      content: `
        <p>EcoQuest는 일상 속 작은 환경 실천을<br/>기록하고 응원하는 앱이에요.</p>
        <div class="hl-box">
          <div class="hl-title">✨ 이런 걸 할 수 있어요</div>
          <div class="hl-list">
            🏆 환경 도전과제 참여하기<br/>
            📸 사진 찍어서 실천 인증<br/>
            🌳 내가 키우는 나무<br/>
            💰 점수로 친환경 쿠폰 받기<br/>
            👥 우리 모임과 함께 실천
          </div>
        </div>
        <p class="hl-tip">자, 차근차근 알려드릴게요!<br/><b>다음 →</b> 버튼을 눌러주세요.</p>
      `
    },

    {
      emoji: '🏠',
      title: '1️⃣ 홈 - 첫 화면',
      content: `
        <p>앱을 열면 가장 먼저 나오는 화면이에요.</p>
        <div class="hl-box">
          <div class="hl-title">📋 여기서 볼 수 있는 것</div>
          <div class="hl-list">
            🌍 <b>전 세계가 함께 지킨 지구</b><br/>
            → 모든 사람이 줄인 탄소량<br/><br/>
            
            👤 <b>내 정보</b><br/>
            → 내 단계, 점수, 실천 횟수<br/><br/>
            
            ⚡ <b>오늘의 미션</b><br/>
            → 오늘 할 일 카드<br/><br/>
            
            📡 <b>우리 동네 공기 정보</b><br/>
            → 미세먼지, 대기질
          </div>
        </div>
        <p class="hl-tip">💡 매일 한 번 들어와서<br/>오늘의 미션을 확인해 보세요!</p>
      `
    },

    {
      emoji: '🏆',
      title: '2️⃣ 도전과제 - 환경 미션',
      content: `
        <p><b>도전과제(챌린지)</b>는<br/>꾸준히 할 환경 실천이에요.</p>
        <div class="hl-box">
          <div class="hl-title">🌱 어떤 것들이 있나요?</div>
          <div class="hl-list">
            🧴 <b>텀블러 사용하기</b><br/>
            🚌 <b>버스/지하철 타기</b><br/>
            🥗 <b>채식 한 끼 먹기</b><br/>
            ♻️ <b>분리수거 잘하기</b><br/>
            🚲 <b>걸어서 다니기</b><br/>
            🚯 <b>쓰레기 줍기</b><br/>
            🍽️ <b>음식 다 먹기</b>
          </div>
        </div>
        <p>마음에 드는 도전과제를 골라<br/>참여하면 돼요!</p>
      `
    },

    {
      emoji: '⚙️',
      title: '3️⃣ 도전과제 참여 방법',
      content: `
        <p>도전과제 카드를 누르면<br/>이런 화면이 나와요:</p>
        <div class="hl-box">
          <div class="hl-title">📝 정해야 할 것</div>
          <div class="hl-list">
            📅 <b>얼마나 자주?</b><br/>
            → 매일 / 주 5일 / 주 3일 / 주 1일<br/><br/>
            
            🗓️ <b>며칠 동안?</b><br/>
            → 1주 / 2주 / 4주
          </div>
        </div>
        <div class="hl-tip-box">
          💡 <b>처음이라면</b><br/>
          <b>주 3일 × 1주</b>로 짧게 시작하세요!<br/>
          무리하지 말고 천천히 해요 🙂
        </div>
      `
    },

    {
      emoji: '📸',
      title: '4️⃣ 사진으로 인증하기',
      content: `
        <p>매일 미션을 했으면<br/><b>사진을 찍어서 보여주세요.</b></p>
        <div class="hl-box">
          <div class="hl-title">📷 이렇게 해요</div>
          <div class="hl-list">
            <b>1.</b> 미션 카드 누르기<br/>
            <b>2.</b> 카메라로 사진 찍기<br/>
              (사진첩에서 골라도 OK)<br/>
            <b>3.</b> "분석하기" 버튼 누르기<br/>
            <b>4.</b> 자동으로 확인 완료!<br/>
            <b>5.</b> 점수 받기 🎉
          </div>
        </div>
        <div class="hl-info-box">
          🔒 <b>걱정 마세요!</b><br/>
          사진은 안전하게 보호돼요.<br/>
          공개/비공개 선택할 수 있어요.
        </div>
      `
    },

    {
      emoji: '🌍',
      title: '5️⃣ 지도 - 내 나무 키우기',
      content: `
        <p>실천할 때마다<br/><b>내 나무가 자라요!</b> 🌱</p>
        <div class="hl-box">
          <div class="hl-title">🌳 나무 자라는 단계</div>
          <div class="hl-list" style="line-height:2.4">
            <b>🌰 도토리</b> → 시작<br/>
            <b>🌱 씨앗</b> → 1kg 줄임<br/>
            <b>🌿 새싹</b> → 5kg 줄임<br/>
            <b>🌳 나무</b> → 21kg 줄임<br/>
            <b>🌲 큰나무</b> → 50kg 줄임<br/>
            <b>🏕️ 숲</b> → 100kg 줄임!
          </div>
        </div>
        <p class="hl-tip">실천을 많이 할수록<br/>나무가 점점 자라요 🌳</p>
      `
    },

    {
      emoji: '📊',
      title: '6️⃣ 내 활동 - 통계 보기',
      content: `
        <p>내가 지금까지 얼마나 했는지<br/><b>한눈에 볼 수 있어요!</b></p>
        <div class="hl-box">
          <div class="hl-title">📈 보여주는 정보</div>
          <div class="hl-list">
            📉 <b>총 탄소 감소량</b><br/>
            → 자동차 ○km 안 탄 효과!<br/><br/>
            
            🌳 <b>심은 나무 수</b><br/>
            → 몇 그루를 살렸는지<br/><br/>
            
            📅 <b>요일별 실천</b><br/>
            → 어느 요일에 잘했는지<br/><br/>
            
            🏅 <b>받은 메달</b><br/>
            → 첫걸음, 나무 1그루 등
          </div>
        </div>
        <p class="hl-tip">📜 <b>증명서</b>도 발급할 수 있어요!<br/>가족, 친구에게 자랑하세요 😊</p>
      `
    },

    {
      emoji: '🛒',
      title: '7️⃣ 스토어 - 점수로 선물 받기',
      content: `
        <p>실천할 때마다 <b>점수</b>가 쌓여요.<br/>그 점수로 진짜 <b>선물</b>을 받을 수 있어요!</p>
        <div class="hl-box">
          <div class="hl-title">🎁 받을 수 있는 것</div>
          <div class="hl-list">
            🎁 <b>EcoQuest 기프티콘</b><br/>
            📚 <b>출판사마저 책</b><br/>
              (라니 시리즈 등)<br/>
            ☕ <b>친환경 매장 쿠폰</b><br/>
              (준비 중)<br/>
            🛍️ <b>제로웨이스트 상점</b><br/>
              (준비 중)
          </div>
        </div>
        <div class="hl-info-box">
          💰 <b>1점 = 1원</b> 가치예요!<br/>
          꾸준히 모으면 큰 선물도 받을 수 있어요.
        </div>
      `
    },

    {
      emoji: '🏢',
      title: '8️⃣ 소속 - 함께 실천하기',
      content: `
        <p>혼자보다 함께가 더 즐거워요!<br/><b>우리 모임끼리</b> 환경 실천을 해봐요.</p>
        <div class="hl-box">
          <div class="hl-title">👥 어떤 모임이 가능한가요?</div>
          <div class="hl-list">
            🏢 <b>회사</b> (직장 환경 모임)<br/>
            🏫 <b>학교</b> (교내 동아리)<br/>
            ⛪ <b>성당/교회</b> (신자 모임)<br/>
            🏘️ <b>동호회</b> (지역 모임)<br/>
            👨‍👩‍👧 <b>가족</b> (우리 가족)
          </div>
        </div>
        <div class="hl-info-box">
          ✨ <b>소속에서 할 수 있는 것</b><br/>
          • 우리끼리 인증샷 공유<br/>
          • 우리 모임 전체 점수<br/>
          • 다른 모임과 비교
        </div>
      `
    },

    {
      emoji: '👤',
      title: '9️⃣ 내 정보 관리',
      content: `
        <p>오른쪽 위 <b>⚙️ 톱니바퀴</b>를 누르면<br/>내 정보를 바꿀 수 있어요.</p>
        <div class="hl-box">
          <div class="hl-title">📝 바꿀 수 있는 것</div>
          <div class="hl-list">
            📛 별명 (닉네임)<br/>
            👤 성별, 나이대<br/>
            📍 살고 있는 지역<br/>
            💼 직업<br/>
            🏠 가족 형태<br/>
            🌱 관심 있는 환경 분야
          </div>
        </div>
        <p class="hl-tip">💡 정보를 정확히 입력하면<br/>나에게 딱 맞는 미션을 추천해드려요!</p>
      `
    },

    {
      emoji: '⚠️',
      title: '🔟 주의할 점',
      content: `
        <p>몇 가지 알아두면 좋아요!</p>
        <div class="hl-warn-box">
          <div class="hl-warn-title">📌 꼭 기억해주세요</div>
          <div class="hl-list">
            <b>1. 도전과제 중간 포기 시</b><br/>
            → 받은 점수의 20%가 빠져요<br/><br/>
            
            <b>2. 가짜 사진 X</b><br/>
            → 실제로 한 일만 인증해요<br/><br/>
            
            <b>3. 매일 한 번씩만</b><br/>
            → 같은 미션 하루 한 번<br/><br/>
            
            <b>4. 개인정보 보호</b><br/>
            → 사진은 본인이 공개 결정
          </div>
        </div>
        <p class="hl-tip">처음엔 짧게, 천천히 시작해요 🙂</p>
      `
    },

    {
      emoji: '💡',
      title: '꿀팁 모음',
      content: `
        <p>EcoQuest를 더 잘 쓰는 법!</p>
        <div class="hl-box">
          <div class="hl-title">✨ 알아두면 좋은 팁</div>
          <div class="hl-list">
            <b>📅 매일 한 번씩 들어오세요</b><br/>
            → 오늘 미션 확인 + 점수 적립<br/><br/>
            
            <b>👥 가족, 친구와 함께해요</b><br/>
            → 소속 만들어서 같이!<br/><br/>
            
            <b>🌳 작은 실천부터</b><br/>
            → 텀블러 1번도 0.33kg 절감!<br/><br/>
            
            <b>📸 사진 잘 찍기</b><br/>
            → 환하게, 가까이 찍어요<br/><br/>
            
            <b>🏆 도장 깨기</b><br/>
            → 매일 연속하면 보너스!
          </div>
        </div>
      `
    },

    {
      emoji: '❓',
      title: '자주 묻는 질문',
      content: `
        <div class="hl-box">
          <div class="hl-faq-q">Q. 비용이 드나요?</div>
          <div class="hl-faq-a">A. 완전히 무료예요!</div>
          
          <div class="hl-faq-q">Q. 점수는 어디에 쓰나요?</div>
          <div class="hl-faq-a">A. 스토어에서 친환경 선물로 교환해요.</div>
          
          <div class="hl-faq-q">Q. 사진이 부담스러워요</div>
          <div class="hl-faq-a">A. 비공개로 하실 수 있어요. 본인만 봐요.</div>
          
          <div class="hl-faq-q">Q. 미세먼지 정보는 어디서?</div>
          <div class="hl-faq-a">A. 환경부 공식 데이터예요.</div>
          
          <div class="hl-faq-q">Q. 도움이 필요하면?</div>
          <div class="hl-faq-a">A. 808glocal@gmail.com 으로 연락주세요.</div>
        </div>
      `
    },

    {
      emoji: '🎉',
      title: '준비 완료!',
      content: `
        <p>이제 EcoQuest를<br/><b>모두 알게 되셨어요!</b></p>
        <div class="hl-box">
          <div class="hl-title">🌱 시작 추천 순서</div>
          <div class="hl-list">
            <b>1.</b> 도전과제에서 텀블러 사용 선택<br/>
            <b>2.</b> 매일 카페 갈 때 텀블러 챙기기<br/>
            <b>3.</b> 사진 찍어서 인증<br/>
            <b>4.</b> 1주일 후 점수로 선물 받기!
          </div>
        </div>
        <p class="hl-tip">💚 작은 실천이 모여<br/>지구를 살려요!</p>
        <p style="margin-top:18px"><b style="color:#2ECC71">함께 시작해요! 🌍</b></p>
      `,
      isLast: true
    }
  ];

  let currentSlide = 0;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 시작
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.openSlideshowGuide = () => {
    currentSlide = 0;
    addStyles();
    showSlideshow();
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 스타일
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function addStyles(){
    if(document.getElementById('slideStyle')) return;
    const style = document.createElement('style');
    style.id = 'slideStyle';
    style.textContent = `
      @keyframes slideFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideContentIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .slide-overlay {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0,0,0,.85) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 16px !important;
        animation: slideFadeIn .3s ease !important;
      }
      .slide-card {
        background: #fff !important;
        border-radius: 24px !important;
        max-width: 380px !important;
        width: 100% !important;
        max-height: 92vh !important;
        display: flex !important;
        flex-direction: column !important;
        box-shadow: 0 20px 60px rgba(0,0,0,.5) !important;
      }
      .slide-header {
        padding: 16px 20px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        border-bottom: 1px solid #f0f0f0 !important;
      }
      .slide-progress {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #2ECC71 !important;
      }
      .slide-close {
        background: #f0f0f0 !important;
        border: none !important;
        border-radius: 50% !important;
        width: 32px !important;
        height: 32px !important;
        font-size: 16px !important;
        cursor: pointer !important;
        color: #666 !important;
        font-family: inherit !important;
      }
      .slide-body {
        padding: 24px 24px 20px !important;
        flex: 1 !important;
        overflow-y: auto !important;
        animation: slideContentIn .3s ease !important;
      }
      .slide-emoji {
        font-size: 64px !important;
        text-align: center !important;
        margin-bottom: 12px !important;
      }
      .slide-title {
        font-size: 20px !important;
        font-weight: 900 !important;
        color: #1a2e1a !important;
        margin-bottom: 16px !important;
        text-align: center !important;
        line-height: 1.4 !important;
      }
      .slide-content {
        font-size: 15px !important;
        color: #333 !important;
        line-height: 1.8 !important;
      }
      .slide-content p {
        margin: 0 0 12px 0 !important;
      }
      .hl-box {
        background: #f0fbf4 !important;
        border-radius: 14px !important;
        padding: 14px 16px !important;
        margin: 14px 0 !important;
        border: 1px solid #d8eedd !important;
      }
      .hl-title {
        font-size: 13px !important;
        font-weight: 900 !important;
        color: #1a6b3a !important;
        margin-bottom: 10px !important;
      }
      .hl-list {
        font-size: 14px !important;
        color: #333 !important;
        line-height: 2 !important;
      }
      .hl-tip {
        font-size: 13px !important;
        color: #666 !important;
        text-align: center !important;
        margin-top: 14px !important;
      }
      .hl-tip-box {
        background: #fff8e1 !important;
        border-left: 4px solid #F39C12 !important;
        border-radius: 10px !important;
        padding: 12px 14px !important;
        margin: 12px 0 !important;
        font-size: 14px !important;
        color: #8B5E04 !important;
        line-height: 1.7 !important;
      }
      .hl-info-box {
        background: #e3f2fd !important;
        border-left: 4px solid #3498DB !important;
        border-radius: 10px !important;
        padding: 12px 14px !important;
        margin: 12px 0 !important;
        font-size: 14px !important;
        color: #1565C0 !important;
        line-height: 1.7 !important;
      }
      .hl-warn-box {
        background: #fff5f5 !important;
        border-left: 4px solid #E74C3C !important;
        border-radius: 10px !important;
        padding: 12px 14px !important;
        margin: 12px 0 !important;
      }
      .hl-warn-title {
        font-size: 13px !important;
        font-weight: 900 !important;
        color: #C0392B !important;
        margin-bottom: 8px !important;
      }
      .hl-faq-q {
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #1a2e1a !important;
        margin-top: 10px !important;
        margin-bottom: 4px !important;
      }
      .hl-faq-q:first-child { margin-top: 0 !important; }
      .hl-faq-a {
        font-size: 13px !important;
        color: #555 !important;
        margin-bottom: 10px !important;
        padding-left: 14px !important;
      }
      .slide-footer {
        padding: 14px 20px 20px !important;
        border-top: 1px solid #f0f0f0 !important;
      }
      .slide-dots {
        display: flex !important;
        gap: 4px !important;
        justify-content: center !important;
        flex-wrap: wrap !important;
        margin-bottom: 14px !important;
      }
      .slide-dot {
        width: 8px !important;
        height: 8px !important;
        border-radius: 4px !important;
        background: #d0e8d6 !important;
        transition: all .3s !important;
      }
      .slide-dot.active {
        width: 24px !important;
        background: #2ECC71 !important;
      }
      .slide-buttons {
        display: flex !important;
        gap: 10px !important;
      }
      .slide-btn {
        flex: 1 !important;
        padding: 14px !important;
        border: none !important;
        border-radius: 14px !important;
        font-size: 15px !important;
        font-weight: 900 !important;
        cursor: pointer !important;
        font-family: inherit !important;
        transition: all .2s !important;
      }
      .slide-btn-prev {
        background: #f0f0f0 !important;
        color: #666 !important;
      }
      .slide-btn-prev:disabled {
        opacity: 0.4 !important;
        cursor: not-allowed !important;
      }
      .slide-btn-next {
        background: linear-gradient(135deg,#2ECC71,#27AE60) !important;
        color: #fff !important;
        box-shadow: 0 4px 12px rgba(46,204,113,.3) !important;
        flex: 2 !important;
      }
      .slide-btn-finish {
        background: linear-gradient(135deg,#F39C12,#E67E22) !important;
        color: #fff !important;
        box-shadow: 0 4px 12px rgba(243,156,18,.3) !important;
        flex: 2 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 슬라이드 보여주기
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function showSlideshow(){
    const existing = document.getElementById('slideshowOverlay');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'slide-overlay';
    overlay.id = 'slideshowOverlay';
    overlay.innerHTML = renderSlide();
    document.body.appendChild(overlay);
    bindEvents();
  }

  function renderSlide(){
    const slide = SLIDES[currentSlide];
    const isFirst = currentSlide === 0;
    const isLast = slide.isLast || currentSlide === SLIDES.length - 1;

    const dots = SLIDES.map((_, i) => 
      `<div class="slide-dot ${i === currentSlide ? 'active' : ''}"></div>`
    ).join('');

    return `
      <div class="slide-card">
        <div class="slide-header">
          <div class="slide-progress">
            📖 ${currentSlide + 1} / ${SLIDES.length}
          </div>
          <button class="slide-close" onclick="window._closeSlideshow()">✕</button>
        </div>
        
        <div class="slide-body" id="slideBody">
          <div class="slide-emoji">${slide.emoji}</div>
          <div class="slide-title">${slide.title}</div>
          <div class="slide-content">${slide.content}</div>
        </div>

        <div class="slide-footer">
          <div class="slide-dots">${dots}</div>
          <div class="slide-buttons">
            <button class="slide-btn slide-btn-prev" 
              onclick="window._slidePrev()" 
              ${isFirst ? 'disabled' : ''}>
              ← 이전
            </button>
            <button class="slide-btn ${isLast ? 'slide-btn-finish' : 'slide-btn-next'}" 
              onclick="window._slideNext()">
              ${isLast ? '시작하기 🌱' : '다음 →'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents(){
    window._slideNext = () => {
      if(currentSlide >= SLIDES.length - 1){
        // 마지막 슬라이드 - 종료
        closeSlideshow();
        localStorage.setItem('eq_slideshow_done', '1');
        return;
      }
      currentSlide++;
      const overlay = document.getElementById('slideshowOverlay');
      if(overlay) overlay.innerHTML = renderSlide();
      // 스크롤 맨 위로
      const body = document.getElementById('slideBody');
      if(body) body.scrollTop = 0;
    };

    window._slidePrev = () => {
      if(currentSlide <= 0) return;
      currentSlide--;
      const overlay = document.getElementById('slideshowOverlay');
      if(overlay) overlay.innerHTML = renderSlide();
      const body = document.getElementById('slideBody');
      if(body) body.scrollTop = 0;
    };

    window._closeSlideshow = () => {
      closeSlideshow();
      localStorage.setItem('eq_slideshow_done', '1');
    };
  }

  function closeSlideshow(){
    const overlay = document.getElementById('slideshowOverlay');
    if(overlay){
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 자동 시작 (신규 유저)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  let _started = false;

  function autoStart(){
    if(_started) return;
    if(localStorage.getItem('eq_slideshow_done')) return;
    if(localStorage.getItem('eq_onboarding_done')) {
      // 기존 튜토리얼 완료자도 한번은 보여주기
    }
    
    const app = document.getElementById('app');
    const intro = document.getElementById('introScreen');
    
    if(intro && intro.style.display !== 'none') return;
    
    // 앱이 보이거나 로그인 화면이 보이면
    const login = document.getElementById('loginScreen');
    if((app && app.style.display === 'block') || (login && login.style.display === 'flex')){
      _started = true;
      setTimeout(() => {
        window.openSlideshowGuide();
      }, 1500);
    }
  }

  if(document.readyState === 'complete'){
    setTimeout(autoStart, 2500);
  } else {
    window.addEventListener('load', () => setTimeout(autoStart, 2500));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 헤더 📖 버튼
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function addGuideButton(){
    if(document.getElementById('slideGuideBtn')) return;
    
    // 기존 onboardReplayBtn 있으면 그걸 활용
    const existing = document.getElementById('onboardReplayBtn');
    if(existing){
      existing.id = 'slideGuideBtn';
      existing.title = '사용법 보기';
      existing.onclick = () => {
        localStorage.removeItem('eq_slideshow_done');
        window.openSlideshowGuide();
      };
      return;
    }
    
    const logoutBtn = document.getElementById('btnLogout');
    if(!logoutBtn) return;
    
    const btn = document.createElement('button');
    btn.id = 'slideGuideBtn';
    btn.textContent = '📖';
    btn.title = '사용법 보기';
    btn.style.cssText = `
      background:rgba(255,255,255,.2);border:none;border-radius:8px;
      padding:4px 8px;color:#fff;font-size:14px;cursor:pointer;
      margin-right:2px;font-family:inherit;
    `;
    btn.onclick = () => {
      localStorage.removeItem('eq_slideshow_done');
      window.openSlideshowGuide();
    };
    logoutBtn.parentNode.insertBefore(btn, logoutBtn);
  }

  setTimeout(addGuideButton, 3000);

  console.log('[slideshow_guide] 로드됨');
})();
