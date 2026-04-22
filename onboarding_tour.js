// onboarding_tour.js - 친절한 설명 튜토리얼 (설명 먼저 → 실행)
(function(){

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 단계 구성: 설명(explain) → 클릭(click) 반복
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  const TOUR_STEPS = [
    
    // ═══ 시작 인사 ═══
    {
      type: 'explain',
      emoji: '🌍',
      title: 'EcoQuest에 오신 걸 환영해요!',
      content: `
        <p style="margin-bottom:14px"><b>EcoQuest</b>는 여러분의 환경 실천을 기록하고<br/>지구를 지키는 데 얼마나 도움됐는지 보여주는 앱이에요.</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;font-weight:700;color:#1a6b3a;margin-bottom:6px">✨ 이런 걸 할 수 있어요</div>
          <div style="font-size:12px;color:#555;line-height:1.9">
            🏆 환경 미션 챌린지 참여<br/>
            📸 사진으로 실천 인증<br/>
            🌳 나무 키우기<br/>
            💰 포인트로 친환경 쿠폰 받기<br/>
            👥 우리 팀과 함께 실천하기
          </div>
        </div>
        
        <p style="font-size:12px;color:#888">지금부터 <b style="color:#2ECC71">하나씩 자세히</b> 알려드릴게요!<br/>각 단계에 설명 → 직접 해보기 순서로 진행돼요.</p>
      `,
      btnText: '좋아요, 시작할게요! 🌱'
    },

    // ═══ 1단계: 챌린지 설명 ═══
    {
      type: 'explain',
      emoji: '🏆',
      title: '1단계: 챌린지란?',
      content: `
        <p style="margin-bottom:14px"><b>챌린지</b>는 꾸준히 실천할 환경 미션이에요.<br/>예를 들면:</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:1.9">
            🧴 <b>텀블러 사용하기</b> - 주 5일 × 2주<br/>
            🚌 <b>대중교통 이용하기</b> - 매일 × 4주<br/>
            🥗 <b>채식 한 끼 먹기</b> - 주 3일 × 2주<br/>
            ♻️ <b>분리수거 완벽하게</b> - 주 3일 × 1주
          </div>
        </div>
        
        <p style="font-size:13px;margin-bottom:8px">👉 원하는 <b>주제</b>, <b>빈도</b>, <b>기간</b>을 골라서 시작하면 돼요!</p>
        
        <p style="font-size:12px;color:#888">자, 이제 직접 챌린지 페이지로 가볼까요?<br/>다음 버튼을 누르면 <b style="color:#2ECC71">🏆 챌린지</b> 탭이 반짝일 거예요!</p>
      `,
      btnText: '챌린지 탭 보여주세요 →'
    },

    // ═══ 1단계: 챌린지 탭 클릭 ═══
    {
      type: 'click',
      target: '.tb[data-page="chal"]',
      label: '👆 반짝이는 🏆 챌린지 탭을 눌러주세요!',
      position: 'top'
    },

    // ═══ 2단계: 챌린지 선택 설명 ═══
    {
      type: 'explain',
      emoji: '📋',
      title: '2단계: 챌린지 선택하기',
      content: `
        <p style="margin-bottom:14px">챌린지 목록이 보이시나요?<br/>각 카드에는 이런 정보가 있어요:</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:1.9">
            🖼️ <b>대표 이미지</b> - 어떤 미션인지 한눈에<br/>
            👥 <b>참가자 수</b> - 인기 있는 챌린지 확인<br/>
            🔥 <b>HOT 뱃지</b> - 핫한 챌린지 표시<br/>
            📅 <b>빈도 정보</b> - 얼마나 자주 하는지
          </div>
        </div>
        
        <p style="font-size:13px;margin-bottom:8px">💡 <b>초보자 추천:</b><br/>🧴 텀블러 사용하기 (가장 쉬움!)</p>
        
        <p style="font-size:12px;color:#888">아무거나 마음에 드는 챌린지 카드를 눌러서<br/>어떻게 구성되어 있는지 살펴봐요!</p>
      `,
      btnText: '챌린지 카드 보여주세요 →'
    },

    // ═══ 2단계: 챌린지 카드 클릭 ═══
    {
      type: 'click',
      target: '.cg-card',
      label: '👆 마음에 드는 챌린지를 골라 눌러주세요!',
      position: 'bottom',
      scrollTo: true
    },

    // ═══ 3단계: 챌린지 상세 설명 ═══
    {
      type: 'explain',
      emoji: '⚙️',
      title: '3단계: 챌린지 참여 설정',
      content: `
        <p style="margin-bottom:14px">챌린지 상세 페이지가 열렸나요?<br/>여기서 이런 걸 고를 수 있어요:</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:1.9">
            📅 <b>인증 빈도</b><br/>
            → 매일 / 주 5일 / 주 3일 / 주 1일<br/><br/>
            
            🗓️ <b>챌린지 기간</b><br/>
            → 1주 / 2주 / 4주<br/><br/>
            
            🏅 <b>완료 보상</b><br/>
            → 포인트 + CO₂ 기록 + 뱃지
          </div>
        </div>
        
        <div style="background:#fff8e1;border-radius:12px;padding:10px 12px;margin:10px 0;border-left:3px solid #F39C12">
          <div style="font-size:12px;color:#8B5E04;line-height:1.7">
            💡 <b>완주 팁:</b><br/>
            처음엔 <b>주 3일 × 1주</b> 짧게 시작하세요!<br/>
            중간에 포기하면 일부 포인트 차감되니까요.
          </div>
        </div>
        
        <p style="font-size:12px;color:#888">👉 지금은 <b>"닫기"</b> 눌러서 돌아가고,<br/>실제 참여는 나중에 해봐요!</p>
      `,
      btnText: '이해했어요, 다음 →'
    },

    // ═══ 4단계: 홈으로 돌아가기 설명 ═══
    {
      type: 'explain',
      emoji: '🏠',
      title: '4단계: 홈 탭 - 오늘의 미션',
      content: `
        <p style="margin-bottom:14px">챌린지에 참여하면<br/><b>홈 탭</b>에 오늘의 미션이 나타나요!</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:1.9">
            📅 <b>오늘 할 미션 카드</b>가 보여요<br/>
            ⚡ <b>하루 한 번 인증</b>하면 완료<br/>
            🎯 <b>진행률 막대</b>로 전체 진도 확인<br/>
            🔥 <b>연속 달성</b>하면 추가 보너스!
          </div>
        </div>
        
        <p style="font-size:13px;margin-bottom:8px">또 홈에서는:</p>
        <div style="font-size:12px;color:#555;line-height:1.8;margin-bottom:12px">
          🌍 전 세계 누적 CO₂ 절감량<br/>
          🏅 내 레벨 & 포인트<br/>
          📡 우리 동네 대기질 정보<br/>
          📸 다른 사람들의 인증 피드
        </div>
        
        <p style="font-size:12px;color:#888">홈 탭으로 돌아가봐요!</p>
      `,
      btnText: '홈 탭 보여주세요 →'
    },

    // ═══ 4단계: 홈 탭 클릭 ═══
    {
      type: 'click',
      target: '.tb[data-page="home"]',
      label: '👆 반짝이는 🏠 홈 탭을 눌러주세요!',
      position: 'top'
    },

    // ═══ 5단계: 사진 인증 설명 ═══
    {
      type: 'explain',
      emoji: '📸',
      title: '5단계: 미션 인증하는 법',
      content: `
        <p style="margin-bottom:14px">미션은 <b>사진으로 인증</b>해요!</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:1.9">
            <b>1️⃣ 미션 카드 클릭</b><br/>
            → 카메라/사진첩 열림<br/><br/>
            
            <b>2️⃣ 사진 찍기/선택</b><br/>
            → 텀블러, 대중교통, 분리수거 등<br/><br/>
            
            <b>3️⃣ 🤖 AI 분석 버튼</b><br/>
            → 2초 안에 자동 확인!<br/><br/>
            
            <b>4️⃣ 공개/비공개 선택</b><br/>
            → 피드에 공유할지 결정
          </div>
        </div>
        
        <div style="background:#e3f2fd;border-radius:12px;padding:10px 12px;margin:10px 0;border-left:3px solid #3498DB">
          <div style="font-size:12px;color:#1565C0;line-height:1.7">
            🤖 <b>AI가 어떻게 인증하나요?</b><br/>
            사진을 분석해서 미션 키워드가 보이는지<br/>자동으로 판단해요. 가짜 사진은 걸러져요!
          </div>
        </div>
        
        <p style="font-size:12px;color:#888">지금은 시연으로 보여드릴게요!</p>
      `,
      btnText: '시연 보기 →'
    },

    // ═══ 5단계: 가짜 사진 업로드 시연 ═══
    {
      type: 'demo_upload',
      title: '📸 사진 인증 시연',
      desc: '실제로는 이렇게 진행돼요!',
      demoSteps: [
        { text: '📸 카메라를 열어요...', duration: 1200 },
        { text: '🧴 텀블러 사진을 선택!', duration: 1200 },
        { text: '🤖 AI가 사진을 분석 중...', duration: 1800 },
        { text: '✅ 텀블러 인식 완료!', duration: 1200 },
        { text: '🎉 +50P 적립 · CO₂ -0.332kg', duration: 1500 }
      ]
    },

    // ═══ 6단계: 지도 설명 ═══
    {
      type: 'explain',
      emoji: '🌍',
      title: '6단계: 지도 탭 - 나무 키우기',
      content: `
        <p style="margin-bottom:14px">인증할 때마다 <b>내 나무가 자라요!</b> 🌱</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:2">
            <b>🌰 도토리</b> → 0kg<br/>
            <b>🌱 씨앗</b> → 1kg 이상<br/>
            <b>🌿 새싹</b> → 5kg 이상<br/>
            <b>🌳 나무</b> → 21.4kg 이상 (나무 한 그루!)<br/>
            <b>🌲 큰나무</b> → 50kg 이상<br/>
            <b>🏕️ 숲</b> → 100kg 이상
          </div>
        </div>
        
        <p style="font-size:13px;margin-bottom:8px"><b>지도 탭에서 이런 걸 볼 수 있어요:</b></p>
        <div style="font-size:12px;color:#555;line-height:1.8;margin-bottom:12px">
          🌳 EcoQuest 유저들이 심은 전체 숲<br/>
          🌱 내 나무의 성장 단계<br/>
          🏆 TOP 기여자 랭킹<br/>
          🏢 소속(기업/단체) CO₂ 랭킹
        </div>
        
        <p style="font-size:12px;color:#888">지도 탭으로 가볼까요?</p>
      `,
      btnText: '지도 탭 보여주세요 →'
    },

    // ═══ 6단계: 지도 탭 클릭 ═══
    {
      type: 'click',
      target: '.tb[data-page="map"]',
      label: '👆 반짝이는 🌍 지도 탭을 눌러주세요!',
      position: 'top'
    },

    // ═══ 7단계: 내활동 설명 ═══
    {
      type: 'explain',
      emoji: '📊',
      title: '7단계: 내활동 탭 - 내 성과 보기',
      content: `
        <p style="margin-bottom:14px">내가 지금까지 얼마나 했는지<br/><b>자세한 통계</b>를 볼 수 있어요!</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:2">
            📉 <b>총 CO₂ 절감량</b><br/>
            → 자동차 ○km 안 탄 효과!<br/><br/>
            
            🌳 <b>심은 나무 그루 수</b><br/>
            → 몇 그루를 살렸는지<br/><br/>
            
            📅 <b>주간 미션 차트</b><br/>
            → 요일별 실천 패턴<br/><br/>
            
            🏅 <b>획득한 뱃지</b><br/>
            → 첫걸음, 나무 1그루, 에코마스터 등<br/><br/>
            
            📊 <b>미션별 통계</b><br/>
            → 어떤 실천을 많이 했는지
          </div>
        </div>
        
        <div style="background:#fff8e1;border-radius:12px;padding:10px 12px;margin:10px 0;border-left:3px solid #F39C12">
          <div style="font-size:12px;color:#8B5E04;line-height:1.7">
            📜 <b>증명서 발급</b>도 가능!<br/>
            내 실천 기록을 SNS에 공유하거나<br/>회사 ESG 자료로 활용할 수 있어요.
          </div>
        </div>
        
        <p style="font-size:12px;color:#888">내활동 탭으로 가볼까요?</p>
      `,
      btnText: '내활동 보여주세요 →'
    },

    // ═══ 7단계: 내활동 탭 클릭 ═══
    {
      type: 'click',
      target: '.tb[data-page="activity"]',
      label: '👆 반짝이는 📊 내활동 탭을 눌러주세요!',
      position: 'top'
    },

    // ═══ 8단계: 스토어 설명 ═══
    {
      type: 'explain',
      emoji: '🛒',
      title: '8단계: 스토어 탭 - 포인트로 쿠폰 받기',
      content: `
        <p style="margin-bottom:14px">미션 인증할 때마다 <b>포인트</b>가 쌓이죠?<br/>그 포인트로 진짜 <b>친환경 상품</b>을 받을 수 있어요!</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:2">
            💰 <b>1P = 1원</b> 가치<br/><br/>
            
            🎁 <b>받을 수 있는 것들:</b><br/>
            • EcoQuest 웰컴 기프티콘<br/>
            • 출판사마저 라니 시리즈 도서<br/>
            • 제로웨이스트 브랜드 쿠폰 (준비중)<br/>
            • 친환경 매장 할인권 (준비중)
          </div>
        </div>
        
        <div style="background:#e3f2fd;border-radius:12px;padding:10px 12px;margin:10px 0;border-left:3px solid #3498DB">
          <div style="font-size:12px;color:#1565C0;line-height:1.7">
            🤝 <b>제휴 브랜드 모집 중!</b><br/>
            더피커, 알맹상점 등<br/>제로웨이스트 브랜드와 제휴 준비 중이에요.<br/>
            곧 다양한 쿠폰이 추가돼요!
          </div>
        </div>
        
        <p style="font-size:12px;color:#888">스토어 탭도 한번 볼까요?</p>
      `,
      btnText: '스토어 보여주세요 →'
    },

    // ═══ 8단계: 스토어 탭 클릭 ═══
    {
      type: 'click',
      target: '.tb[data-page="shop"]',
      label: '👆 반짝이는 🛒 스토어 탭을 눌러주세요!',
      position: 'top'
    },

    // ═══ 9단계: 소속 설명 ═══
    {
      type: 'explain',
      emoji: '🏢',
      title: '9단계: 소속 탭 - 함께 실천하기',
      content: `
        <p style="margin-bottom:14px">혼자보다 함께!<br/><b>우리 소속끼리</b> 환경 실천을 할 수 있어요!</p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;color:#555;line-height:2">
            🏢 <b>어떤 소속이 있나요?</b><br/>
            • 회사 (직장인 ESG 참여)<br/>
            • 학교 (교내 환경 동아리)<br/>
            • 성당/교회 (종교 공동체)<br/>
            • 동호회 (환경 관심 모임)<br/><br/>
            
            ✨ <b>소속에서 할 수 있는 것:</b><br/>
            • 우리 소속 전용 인증 피드<br/>
            • 소속 전체 CO₂ 기여도<br/>
            • 다른 소속과 랭킹 비교<br/>
            • 초대 코드로 멤버 모집
          </div>
        </div>
        
        <div style="background:#fff8e1;border-radius:12px;padding:10px 12px;margin:10px 0;border-left:3px solid #F39C12">
          <div style="font-size:12px;color:#8B5E04;line-height:1.7">
            💡 <b>소속 만들기 팁:</b><br/>
            관리자 계정으로 소속을 만들고<br/>친구/동료에게 초대 코드를 공유하세요!
          </div>
        </div>
        
        <p style="font-size:12px;color:#888">마지막! 소속 탭 보러 가요!</p>
      `,
      btnText: '소속 보여주세요 →'
    },

    // ═══ 9단계: 소속 탭 클릭 ═══
    {
      type: 'click',
      target: '.tb[data-page="company"]',
      label: '👆 반짝이는 🏢 소속 탭을 눌러주세요!',
      position: 'top'
    },

    // ═══ 마무리 ═══
    {
      type: 'final',
      emoji: '🎉',
      title: '축하해요! 모두 배우셨어요!',
      content: `
        <p style="margin-bottom:14px">이제 EcoQuest의 모든 기능을 <b>다 알게 됐어요!</b></p>
        
        <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin:14px 0">
          <div style="font-size:12px;font-weight:700;color:#1a6b3a;margin-bottom:6px">📝 배운 내용 요약</div>
          <div style="font-size:12px;color:#555;line-height:1.9">
            ✅ 챌린지 참여 방법<br/>
            ✅ 사진으로 미션 인증하기<br/>
            ✅ 나무 키우기 시스템<br/>
            ✅ 내 활동 통계 확인<br/>
            ✅ 포인트로 쿠폰 받기<br/>
            ✅ 소속 공동체와 함께하기
          </div>
        </div>
        
        <p style="font-size:13px;margin-bottom:8px"><b>이제 진짜로 시작해볼까요?</b></p>
        <div style="font-size:12px;color:#555;line-height:1.8;margin-bottom:14px">
          Google 계정으로 간단히 로그인하고<br/>여러분의 환경 실천 여정을 시작하세요! 🌱
        </div>
      `,
      btnText: '🌱 로그인하고 시작하기',
      skipText: '조금 더 둘러볼게요'
    }
  ];

  let currentStep = 0;
  let spotlight = null;
  let darkOverlay = null;
  let clickArea = null;
  let labelEl = null;
  let fingerEl = null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 시작
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function startTour(){
    if(localStorage.getItem('eq_onboarding_done')) return;
    currentStep = 0;
    addStyles();
    showStep(0);
  }
  window.startOnboardingTour = startTour;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 스타일
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function addStyles(){
    if(document.getElementById('onboardTourStyle')) return;
    const style = document.createElement('style');
    style.id = 'onboardTourStyle';
    style.textContent = `
      @keyframes obPulse {
        0% { box-shadow: 0 0 0 0 rgba(46,204,113,1), 0 0 40px 15px rgba(46,204,113,.7); }
        50% { box-shadow: 0 0 0 24px rgba(46,204,113,0), 0 0 40px 15px rgba(46,204,113,1); }
        100% { box-shadow: 0 0 0 0 rgba(46,204,113,0), 0 0 40px 15px rgba(46,204,113,.7); }
      }
      @keyframes obBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
      }
      @keyframes obFadeIn {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes obGlow {
        0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.85; transform: translateX(-50%) scale(1.06); }
      }
      .ob-dark {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0,0,0,.78) !important;
        z-index: 999990 !important;
      }
      .ob-spotlight {
        position: fixed !important;
        border-radius: 14px !important;
        pointer-events: none !important;
        z-index: 999995 !important;
        border: 4px solid #2ECC71 !important;
        animation: obPulse 1.3s ease-in-out infinite !important;
        transition: all .3s ease !important;
      }
      .ob-click-area {
        position: fixed !important;
        z-index: 999996 !important;
        cursor: pointer !important;
        background: transparent !important;
      }
      .ob-finger {
        position: fixed !important;
        font-size: 48px !important;
        z-index: 999997 !important;
        pointer-events: none !important;
        animation: obBounce .7s ease-in-out infinite !important;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,.6)) !important;
      }
      .ob-label {
        position: fixed !important;
        z-index: 999997 !important;
        background: linear-gradient(135deg,#F39C12,#E67E22) !important;
        color: #fff !important;
        border-radius: 20px !important;
        padding: 10px 18px !important;
        font-size: 13px !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
        animation: obGlow 1.2s ease-in-out infinite !important;
        box-shadow: 0 6px 20px rgba(243,156,18,.6) !important;
        pointer-events: none !important;
      }
      .ob-skip {
        position: fixed !important;
        top: 12px !important;
        right: 12px !important;
        z-index: 999999 !important;
        background: rgba(0,0,0,.85) !important;
        color: #fff !important;
        border: none !important;
        border-radius: 20px !important;
        padding: 8px 16px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        font-family: inherit !important;
      }
      .ob-progress {
        position: fixed !important;
        top: 12px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 999999 !important;
        background: linear-gradient(135deg,#2ECC71,#27AE60) !important;
        color: #fff !important;
        border-radius: 20px !important;
        padding: 8px 16px !important;
        font-size: 12px !important;
        font-weight: 900 !important;
        box-shadow: 0 4px 12px rgba(46,204,113,.5) !important;
      }
      .ob-modal {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0,0,0,.88) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
      }
      .ob-box {
        background: #fff !important;
        border-radius: 24px !important;
        max-width: 360px !important;
        width: 100% !important;
        max-height: 85vh !important;
        overflow-y: auto !important;
        padding: 28px 24px 20px !important;
        text-align: left !important;
        box-shadow: 0 20px 60px rgba(0,0,0,.5) !important;
        animation: obFadeIn .4s ease !important;
      }
      .ob-emoji {
        font-size: 64px !important;
        text-align: center !important;
        margin-bottom: 12px !important;
        animation: obBounce 1.5s ease-in-out infinite !important;
      }
      .ob-title {
        font-size: 20px !important;
        font-weight: 900 !important;
        color: #1a2e1a !important;
        margin-bottom: 14px !important;
        text-align: center !important;
        line-height: 1.4 !important;
      }
      .ob-content {
        font-size: 13px !important;
        color: #555 !important;
        line-height: 1.7 !important;
        margin-bottom: 20px !important;
      }
      .ob-content p {
        margin: 0 !important;
      }
      .ob-btn-p {
        width: 100% !important;
        padding: 14px !important;
        border: none !important;
        background: linear-gradient(135deg,#2ECC71,#27AE60) !important;
        color: #fff !important;
        border-radius: 14px !important;
        font-size: 15px !important;
        font-weight: 900 !important;
        cursor: pointer !important;
        font-family: inherit !important;
        box-shadow: 0 4px 12px rgba(46,204,113,.4) !important;
      }
      .ob-btn-s {
        width: 100% !important;
        padding: 12px !important;
        border: 1.5px solid #ddd !important;
        background: #fff !important;
        color: #666 !important;
        border-radius: 12px !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        font-family: inherit !important;
        margin-top: 8px !important;
      }
      .ob-demo {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0,0,0,.95) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        animation: obFadeIn .3s ease !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 단계 진행
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function showStep(idx){
    currentStep = idx;
    const step = TOUR_STEPS[idx];
    if(!step){ endTour(); return; }

    cleanupCurrent();

    // 상단 UI 추가 (한 번만)
    if(!document.querySelector('.ob-skip')){
      const skipBtn = document.createElement('button');
      skipBtn.className = 'ob-skip';
      skipBtn.textContent = '✕ 건너뛰기';
      skipBtn.onclick = endTour;
      document.body.appendChild(skipBtn);

      const progress = document.createElement('div');
      progress.className = 'ob-progress';
      progress.id = 'obProgress';
      document.body.appendChild(progress);
    }

    const prog = document.getElementById('obProgress');
    if(prog) prog.textContent = `📖 ${idx+1} / ${TOUR_STEPS.length}`;

    // 타입별 처리
    if(step.type === 'explain'){
      showExplainModal(step);
    } else if(step.type === 'click'){
      showClickStep(step);
    } else if(step.type === 'demo_upload'){
      showDemoUpload(step);
    } else if(step.type === 'final'){
      showFinalModal(step);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 설명 모달
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function showExplainModal(step){
    const modal = document.createElement('div');
    modal.className = 'ob-modal';
    modal.id = 'obModal';
    modal.innerHTML = `
      <div class="ob-box">
        <div class="ob-emoji">${step.emoji}</div>
        <div class="ob-title">${step.title}</div>
        <div class="ob-content">${step.content}</div>
        <button class="ob-btn-p" onclick="window._obNext()">${step.btnText}</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 클릭 단계 (스포트라이트)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function showClickStep(step){
    const el = document.querySelector(step.target);
    if(!el){
      setTimeout(() => {
        const retry = document.querySelector(step.target);
        if(retry) highlightElement(retry, step);
        else showStep(currentStep + 1);
      }, 1000);
      return;
    }
    highlightElement(el, step);
  }

  function highlightElement(el, step){
    const rect = el.getBoundingClientRect();
    
    if(step.scrollTo || rect.top < 80 || rect.bottom > window.innerHeight - 80){
      el.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(() => highlightElement(el, step), 600);
      return;
    }

    darkOverlay = document.createElement('div');
    darkOverlay.className = 'ob-dark';
    document.body.appendChild(darkOverlay);

    spotlight = document.createElement('div');
    spotlight.className = 'ob-spotlight';
    const pad = 6;
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.width = (rect.width + pad*2) + 'px';
    spotlight.style.height = (rect.height + pad*2) + 'px';
    document.body.appendChild(spotlight);

    clickArea = document.createElement('div');
    clickArea.className = 'ob-click-area';
    clickArea.style.left = rect.left + 'px';
    clickArea.style.top = rect.top + 'px';
    clickArea.style.width = rect.width + 'px';
    clickArea.style.height = rect.height + 'px';
    clickArea.onclick = (e) => {
      e.stopPropagation();
      el.click();
      setTimeout(() => showStep(currentStep + 1), 600);
    };
    document.body.appendChild(clickArea);

    fingerEl = document.createElement('div');
    fingerEl.className = 'ob-finger';
    fingerEl.textContent = '👆';
    
    labelEl = document.createElement('div');
    labelEl.className = 'ob-label';
    labelEl.textContent = step.label || '👆 여기를 눌러주세요!';
    
    if(step.position === 'top'){
      fingerEl.style.left = (rect.left + rect.width/2 - 24) + 'px';
      fingerEl.style.top = (rect.top - 56) + 'px';
      
      labelEl.style.left = (rect.left + rect.width/2) + 'px';
      labelEl.style.top = (rect.top - 100) + 'px';
      labelEl.style.transform = 'translateX(-50%)';
    } else {
      fingerEl.style.left = (rect.left + rect.width/2 - 24) + 'px';
      fingerEl.style.top = (rect.bottom + 10) + 'px';
      
      labelEl.style.left = (rect.left + rect.width/2) + 'px';
      labelEl.style.top = (rect.bottom + 70) + 'px';
      labelEl.style.transform = 'translateX(-50%)';
    }

    document.body.appendChild(fingerEl);
    document.body.appendChild(labelEl);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 가짜 사진 업로드 시연
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function showDemoUpload(step){
    const screen = document.createElement('div');
    screen.className = 'ob-demo';
    screen.id = 'obDemo';
    screen.innerHTML = `
      <div style="text-align:center;color:#fff;max-width:320px">
        <div style="font-size:16px;font-weight:900;margin-bottom:8px;color:#2ECC71">
          ${step.title}
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,.7);margin-bottom:32px;line-height:1.8">
          ${step.desc}
        </div>
        <div id="obDemoImg" style="font-size:120px;margin-bottom:24px;animation:obBounce 1s ease-in-out infinite">📸</div>
        <div id="obDemoText" style="font-size:14px;font-weight:700;margin-bottom:20px;min-height:40px">
          시작합니다...
        </div>
        <div style="width:240px;height:6px;background:rgba(255,255,255,.1);border-radius:10px;overflow:hidden;margin:0 auto 24px">
          <div id="obDemoBar" style="width:0%;height:100%;background:linear-gradient(90deg,#2ECC71,#F39C12);border-radius:10px;transition:width .5s linear"></div>
        </div>
        <button class="ob-btn-p" id="obDemoNext" style="max-width:240px;margin:0 auto;display:none">계속하기 →</button>
      </div>
    `;
    document.body.appendChild(screen);

    let total = 0;
    step.demoSteps.forEach(s => total += s.duration);
    
    let elapsed = 0;
    let idx = 0;
    
    const run = () => {
      if(idx >= step.demoSteps.length){
        document.getElementById('obDemoNext').style.display = 'block';
        document.getElementById('obDemoNext').onclick = () => {
          screen.remove();
          showStep(currentStep + 1);
        };
        return;
      }
      const s = step.demoSteps[idx];
      const txt = document.getElementById('obDemoText');
      const img = document.getElementById('obDemoImg');
      const bar = document.getElementById('obDemoBar');
      
      if(txt) txt.textContent = s.text;
      if(idx === 1) img.textContent = '🧴';
      else if(idx === 2) img.textContent = '🔍';
      else if(idx === 3) img.textContent = '✅';
      else if(idx === 4) img.textContent = '🎉';
      
      elapsed += s.duration;
      if(bar) bar.style.width = (elapsed/total*100) + '%';
      
      idx++;
      setTimeout(run, s.duration);
    };
    
    run();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 마지막 모달
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function showFinalModal(step){
    const modal = document.createElement('div');
    modal.className = 'ob-modal';
    modal.id = 'obModal';
    modal.innerHTML = `
      <div class="ob-box">
        <div class="ob-emoji">${step.emoji}</div>
        <div class="ob-title">${step.title}</div>
        <div class="ob-content">${step.content}</div>
        <button class="ob-btn-p" onclick="window._obGoLogin()">${step.btnText}</button>
        <button class="ob-btn-s" onclick="window._obFinish()">${step.skipText}</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 이벤트 핸들러
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window._obNext = () => {
    const modal = document.getElementById('obModal');
    if(modal) modal.remove();
    showStep(currentStep + 1);
  };

  window._obGoLogin = () => {
    cleanup();
    localStorage.setItem('eq_onboarding_done', '1');
    if(!window.ME){
      const loginScreen = document.getElementById('loginScreen');
      const app = document.getElementById('app');
      if(app) app.style.display = 'none';
      if(loginScreen) loginScreen.style.display = 'flex';
    }
  };

  window._obFinish = () => {
    cleanup();
    localStorage.setItem('eq_onboarding_done', '1');
  };

  function cleanupCurrent(){
    if(spotlight){ spotlight.remove(); spotlight = null; }
    if(darkOverlay){ darkOverlay.remove(); darkOverlay = null; }
    if(clickArea){ clickArea.remove(); clickArea = null; }
    if(fingerEl){ fingerEl.remove(); fingerEl = null; }
    if(labelEl){ labelEl.remove(); labelEl = null; }
  }

  function endTour(){
    cleanup();
    localStorage.setItem('eq_onboarding_done', '1');
  }

  function cleanup(){
    cleanupCurrent();
    document.querySelectorAll('.ob-skip, .ob-progress, #obModal, #obDemo').forEach(e => e.remove());
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 자동 시작 (한 번만!)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  let _started = false;
  
  function autoStart(){
    if(_started) return;
    if(localStorage.getItem('eq_onboarding_done')) return;
    
    const app = document.getElementById('app');
    const login = document.getElementById('loginScreen');
    const intro = document.getElementById('introScreen');
    
    if(intro && intro.style.display !== 'none') return;
    
    if((app && app.style.display === 'block') || (login && login.style.display === 'flex')){
      if(!window.ME){
        if(login) login.style.display = 'none';
        if(app) app.style.display = 'block';
      }
      _started = true;
      setTimeout(startTour, 1000);
    }
  }

  if(document.readyState === 'complete'){
    setTimeout(autoStart, 2500);
  } else {
    window.addEventListener('load', () => setTimeout(autoStart, 2500));
  }

  // 📖 헤더 버튼
  function addReplayButton(){
    if(document.getElementById('onboardReplayBtn')) return;
    const logoutBtn = document.getElementById('btnLogout');
    if(!logoutBtn) return;
    
    const btn = document.createElement('button');
    btn.id = 'onboardReplayBtn';
    btn.textContent = '📖';
    btn.title = '사용법 다시보기';
    btn.style.cssText = `
      background:rgba(255,255,255,.2);border:none;border-radius:8px;
      padding:4px 8px;color:#fff;font-size:14px;cursor:pointer;
      margin-right:2px;font-family:inherit;
    `;
    btn.onclick = () => {
      localStorage.removeItem('eq_onboarding_done');
      _started = false;
      startTour();
    };
    logoutBtn.parentNode.insertBefore(btn, logoutBtn);
  }

  setTimeout(addReplayButton, 3000);
})();
