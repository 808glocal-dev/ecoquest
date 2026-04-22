// onboarding_tour.js - 첫 방문자용 풀코스 투어 (9단계)
(function(){

  const TOUR_STEPS = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: 환영 인사
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'intro',
      title: '🌍 EcoQuest에 오신 걸 환영해요!',
      desc: '환경 실천을 게임처럼 즐기고\n포인트까지 받는 앱이에요.\n\n지금부터 사용법을\n<b style="color:#2ECC71">직접 따라하며</b> 배워볼게요!',
      btnText: '시작하기! 🌱'
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: 챌린지 탭
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'click',
      target: '.tb[data-page="chal"]',
      title: '1️⃣ 챌린지 참여하기',
      desc: '먼저 하단의<br/><b style="color:#2ECC71">🏆 챌린지</b> 탭을 눌러주세요!',
      position: 'top'
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: 챌린지 선택
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'click',
      target: '.cg-card',
      title: '2️⃣ 챌린지 고르기',
      desc: '마음에 드는 챌린지를<br/>하나 골라 눌러주세요!<br/><br/><span style="font-size:11px;color:#888">예: 텀블러 사용하기 🧴</span>',
      position: 'bottom',
      waitForPage: 'chal',
      scrollTo: true
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 4: 홈으로 이동
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'popup_then_click',
      popupTitle: '👍 잘하셨어요!',
      popupDesc: '챌린지에 참여했어요!\n이제 <b>매일 미션을 인증</b>하면 돼요.\n\n홈으로 돌아가서\n오늘의 미션을 확인해봐요!',
      popupBtn: '다음 →',
      target: '.tb[data-page="home"]',
      title: '3️⃣ 홈으로 돌아가기',
      desc: '하단의 <b style="color:#2ECC71">🏠 홈</b> 탭을 눌러주세요!',
      position: 'top'
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 5: 미션 인증 (가짜 시연)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'demo_upload',
      title: '4️⃣ 미션 인증하기',
      desc: '이제 사진으로 미션을 인증해봐요!\n\n<b>텀블러를 찍어서 올리면</b>\nAI가 자동으로 확인해요 📸',
      demoSteps: [
        { text: '📸 카메라 열기...', duration: 1000 },
        { text: '🤖 AI가 사진 분석 중...', duration: 1500 },
        { text: '✅ 텀블러 인식 완료!', duration: 1000 },
        { text: '🎉 +50P 적립 · CO₂ -0.332kg', duration: 1500 }
      ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 6: 지도 탭 (나무 확인)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'popup_then_click',
      popupTitle: '🌱 나무가 자랐어요!',
      popupDesc: '여러분의 실천이\n<b>진짜 나무를 키워요!</b>\n\n얼마나 지구에 도움됐는지\n지도에서 확인해봐요 🌍',
      popupBtn: '지도 보기 →',
      target: '.tb[data-page="map"]',
      title: '5️⃣ 지도에서 확인',
      desc: '<b style="color:#2ECC71">🌍 지도</b> 탭을 눌러주세요!',
      position: 'top'
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 7: 내 활동 (통계)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'popup_then_click',
      popupTitle: '🌳 이렇게 자란답니다!',
      popupDesc: '🌰 도토리 → 🌱 씨앗 → 🌿 새싹\n→ 🌳 나무 → 🌲 큰나무 → 🏕️ 숲\n\n꾸준히 하면 <b>진짜 숲</b>이 돼요!\n\n내 활동을 더 자세히 볼까요?',
      popupBtn: '내 활동 보기 →',
      target: '.tb[data-page="activity"]',
      title: '6️⃣ 내 활동 확인',
      desc: '<b style="color:#2ECC71">📊 내활동</b> 탭을 눌러주세요!',
      position: 'top'
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 8: 스토어 (쿠폰)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'popup_then_click',
      popupTitle: '💰 포인트로 쿠폰 받기!',
      popupDesc: '미션 인증할 때마다\n<b>포인트가 쌓여요!</b>\n\n쌓인 포인트로\n제로웨이스트 상점,\n연계 브랜드 쿠폰을\n받을 수 있어요 🎁',
      popupBtn: '스토어 보기 →',
      target: '.tb[data-page="shop"]',
      title: '7️⃣ 스토어 확인',
      desc: '<b style="color:#2ECC71">🛒 스토어</b> 탭을 눌러주세요!',
      position: 'top'
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 9: 소속 (커뮤니티)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'popup_then_click',
      popupTitle: '👥 혼자보다 함께!',
      popupDesc: '회사·학교·성당·동호회 등\n<b>우리 소속끼리</b>\n함께 환경 운동을 해봐요!\n\n✨ 소속 인증샷 피드\n✨ 우리 팀 CO₂ 기여도\n✨ 소속별 랭킹',
      popupBtn: '소속 보기 →',
      target: '.tb[data-page="company"]',
      title: '8️⃣ 소속 확인',
      desc: '마지막으로<br/><b style="color:#2ECC71">🏢 소속</b> 탭을 눌러주세요!',
      position: 'top'
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 10: 마지막 (회원가입 유도)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━
    {
      type: 'final',
      title: '🎉 이제 시작할 준비 완료!',
      desc: '지금까지 본 모든 기능을\n실제로 사용하려면\n<b style="color:#2ECC71">간단한 로그인</b>이 필요해요!\n\n💚 포인트 적립\n🌳 나무 키우기\n📸 인증샷 저장\n👥 소속 참여',
      btnText: '🌱 로그인하고 시작하기',
      skipText: '조금 더 구경할게요'
    }
  ];

  let currentStep = 0;
  let spotlight = null;
  let tooltip = null;
  let darkOverlay = null;
  let clickArea = null;
  let isLoggedIn = false;

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 시작 조건 체크
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function shouldStartTour(){
    // 이미 투어 완료했으면 안 함
    if(localStorage.getItem('eq_onboarding_done')) return false;
    // 인트로 화면 뜰 때는 나중에
    const intro = document.getElementById('introScreen');
    if(intro && intro.style.display !== 'none') return false;
    return true;
  }

  function startTour(fromLogin){
    isLoggedIn = !!fromLogin;
    if(localStorage.getItem('eq_onboarding_done')) return;
    currentStep = 0;
    addStyles();
    showStep(0);
  }
  window.startOnboardingTour = startTour;

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 스타일 추가
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function addStyles(){
    if(document.getElementById('onboardTourStyle')) return;
    const style = document.createElement('style');
    style.id = 'onboardTourStyle';
    style.textContent = `
      @keyframes obPulseRing {
        0% { box-shadow: 0 0 0 0 rgba(46,204,113,1), 0 0 40px 15px rgba(46,204,113,.7); }
        50% { box-shadow: 0 0 0 24px rgba(46,204,113,0), 0 0 40px 15px rgba(46,204,113,1); }
        100% { box-shadow: 0 0 0 0 rgba(46,204,113,0), 0 0 40px 15px rgba(46,204,113,.7); }
      }
      @keyframes obBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
      }
      @keyframes obFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes obGlow {
        0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.8; transform: translateX(-50%) scale(1.08); }
      }
      @keyframes obSlideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .ob-dark-overlay {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0,0,0,.78) !important;
        z-index: 999990 !important;
        pointer-events: auto !important;
      }
      .ob-spotlight {
        position: fixed !important;
        border-radius: 14px !important;
        pointer-events: none !important;
        z-index: 999995 !important;
        border: 4px solid #2ECC71 !important;
        background: transparent !important;
        animation: obPulseRing 1.3s ease-in-out infinite !important;
        transition: all .3s ease !important;
      }
      .ob-click-area {
        position: fixed !important;
        z-index: 999996 !important;
        cursor: pointer !important;
        background: transparent !important;
      }
      .ob-tooltip {
        position: fixed !important;
        z-index: 999998 !important;
        background: #fff !important;
        border-radius: 16px !important;
        padding: 14px 16px !important;
        box-shadow: 0 12px 40px rgba(0,0,0,.5) !important;
        max-width: 280px !important;
        animation: obFadeIn .3s ease !important;
        border: 2px solid #2ECC71 !important;
      }
      .ob-arrow-down {
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid #2ECC71;
      }
      .ob-arrow-up {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid #2ECC71;
      }
      .ob-finger {
        position: fixed !important;
        font-size: 48px !important;
        z-index: 999997 !important;
        pointer-events: none !important;
        animation: obBounce .7s ease-in-out infinite !important;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,.6)) !important;
      }
      .ob-click-here {
        position: fixed !important;
        z-index: 999997 !important;
        background: linear-gradient(135deg,#F39C12,#E67E22) !important;
        color: #fff !important;
        border-radius: 20px !important;
        padding: 8px 18px !important;
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
        background: rgba(0,0,0,.85) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
      }
      .ob-modal-box {
        background: #fff !important;
        border-radius: 24px !important;
        max-width: 340px !important;
        width: 100% !important;
        padding: 32px 24px 24px !important;
        text-align: center !important;
        box-shadow: 0 20px 60px rgba(0,0,0,.5) !important;
        animation: obSlideUp .4s ease !important;
      }
      .ob-btn-primary {
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
      .ob-btn-secondary {
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
      .ob-demo-screen {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(0,0,0,.92) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
      }
      .ob-demo-box {
        text-align: center !important;
        color: #fff !important;
        animation: obFadeIn .4s ease !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 단계 표시
  // ━━━━━━━━━━━━━━━━━━━━━━━
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
    if(step.type === 'intro'){
      showIntroModal(step);
    } else if(step.type === 'click'){
      if(step.waitForPage){
        setTimeout(() => showClickStep(step), 600);
      } else {
        showClickStep(step);
      }
    } else if(step.type === 'popup_then_click'){
      showPopup(step, () => showClickStep(step));
    } else if(step.type === 'demo_upload'){
      showDemoUpload(step);
    } else if(step.type === 'final'){
      showFinalModal(step);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 인트로 모달 (1번)
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function showIntroModal(step){
    const modal = document.createElement('div');
    modal.className = 'ob-modal';
    modal.id = 'obIntroModal';
    modal.innerHTML = `
      <div class="ob-modal-box">
        <div style="font-size:80px;margin-bottom:16px;animation:obBounce 1.5s ease-in-out infinite">🌍</div>
        <div style="font-size:22px;font-weight:900;color:#1a2e1a;margin-bottom:12px;line-height:1.4">
          ${step.title}
        </div>
        <div style="font-size:13px;color:#555;line-height:1.8;margin-bottom:20px">
          ${step.desc}
        </div>
        <div style="background:#f0fbf4;border-radius:14px;padding:12px 14px;margin-bottom:20px;text-align:left">
          <div style="font-size:11px;font-weight:700;color:#1a6b3a;margin-bottom:6px">📌 이렇게 진행돼요</div>
          <div style="font-size:11px;color:#555;line-height:1.8">
            1️⃣ 👆 손가락이 눌러야 할 곳을 가리켜요<br/>
            2️⃣ ✨ 반짝이는 버튼을 직접 눌러주세요<br/>
            3️⃣ 📱 자동으로 다음 단계로 넘어가요
          </div>
        </div>
        <button class="ob-btn-primary" onclick="window._obNext()">${step.btnText}</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 설명 팝업 (→ 클릭 단계)
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function showPopup(step, callback){
    const modal = document.createElement('div');
    modal.className = 'ob-modal';
    modal.id = 'obPopupModal';
    modal.innerHTML = `
      <div class="ob-modal-box">
        <div style="font-size:20px;font-weight:900;color:#1a2e1a;margin-bottom:12px">
          ${step.popupTitle}
        </div>
        <div style="font-size:13px;color:#555;line-height:1.8;margin-bottom:20px;white-space:pre-line">
          ${step.popupDesc}
        </div>
        <button class="ob-btn-primary" id="obPopupNext">${step.popupBtn}</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('obPopupNext').onclick = () => {
      modal.remove();
      callback();
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 클릭 단계 (스포트라이트)
  // ━━━━━━━━━━━━━━━━━━━━━━━
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
    
    // 스크롤 필요하면
    if(step.scrollTo || rect.top < 80 || rect.bottom > window.innerHeight - 80){
      el.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(() => highlightElement(el, step), 600);
      return;
    }

    // 어두운 오버레이
    darkOverlay = document.createElement('div');
    darkOverlay.className = 'ob-dark-overlay';
    document.body.appendChild(darkOverlay);

    // 스포트라이트
    spotlight = document.createElement('div');
    spotlight.className = 'ob-spotlight';
    const pad = 6;
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.width = (rect.width + pad*2) + 'px';
    spotlight.style.height = (rect.height + pad*2) + 'px';
    document.body.appendChild(spotlight);

    // 클릭 가능 영역
    clickArea = document.createElement('div');
    clickArea.className = 'ob-click-area';
    clickArea.style.left = rect.left + 'px';
    clickArea.style.top = rect.top + 'px';
    clickArea.style.width = rect.width + 'px';
    clickArea.style.height = rect.height + 'px';
    clickArea.onclick = (e) => {
      e.stopPropagation();
      el.click();
      setTimeout(() => showStep(currentStep + 1), 500);
    };
    document.body.appendChild(clickArea);

    // 손가락
    const finger = document.createElement('div');
    finger.className = 'ob-finger';
    finger.id = 'obFinger';
    finger.textContent = '👆';
    
    // "여기를 눌러주세요!" 라벨
    const clickLabel = document.createElement('div');
    clickLabel.className = 'ob-click-here';
    clickLabel.id = 'obClickLabel';
    clickLabel.textContent = '👆 여기를 눌러주세요!';
    
    // 툴팁
    tooltip = document.createElement('div');
    tooltip.className = 'ob-tooltip';
    tooltip.innerHTML = `
      <div style="font-size:13px;font-weight:900;color:#1a2e1a;margin-bottom:6px">
        ${step.title}
      </div>
      <div style="font-size:12px;color:#555;line-height:1.6">
        ${step.desc}
      </div>
    `;
    document.body.appendChild(tooltip);

    const tRect = tooltip.getBoundingClientRect();
    let tLeft, tTop;
    
    if(step.position === 'top'){
      tLeft = rect.left + rect.width/2 - tRect.width/2;
      tTop = rect.top - tRect.height - 60;
      tooltip.innerHTML += '<div class="ob-arrow-down"></div>';
      
      finger.style.left = (rect.left + rect.width/2 - 24) + 'px';
      finger.style.top = (rect.top - 56) + 'px';
      
      clickLabel.style.left = (rect.left + rect.width/2) + 'px';
      clickLabel.style.top = (rect.top - 98) + 'px';
      clickLabel.style.transform = 'translateX(-50%)';
    } else {
      tLeft = rect.left + rect.width/2 - tRect.width/2;
      tTop = rect.bottom + 68;
      tooltip.innerHTML += '<div class="ob-arrow-up"></div>';
      
      finger.style.left = (rect.left + rect.width/2 - 24) + 'px';
      finger.style.top = (rect.bottom + 10) + 'px';
      
      clickLabel.style.left = (rect.left + rect.width/2) + 'px';
      clickLabel.style.top = (rect.bottom + 24) + 'px';
      clickLabel.style.transform = 'translateX(-50%)';
    }

    tLeft = Math.max(12, Math.min(window.innerWidth - tRect.width - 12, tLeft));
    tTop = Math.max(60, tTop);
    
    tooltip.style.left = tLeft + 'px';
    tooltip.style.top = tTop + 'px';

    document.body.appendChild(finger);
    document.body.appendChild(clickLabel);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 가짜 사진 인증 시연
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function showDemoUpload(step){
    const screen = document.createElement('div');
    screen.className = 'ob-demo-screen';
    screen.id = 'obDemoScreen';
    screen.innerHTML = `
      <div class="ob-demo-box">
        <div style="font-size:16px;font-weight:900;margin-bottom:12px;color:#2ECC71">
          ${step.title}
        </div>
        <div style="font-size:13px;color:rgba(255,255,255,.8);margin-bottom:32px;line-height:1.8;white-space:pre-line">
          ${step.desc}
        </div>
        <div id="obDemoImage" style="font-size:120px;margin-bottom:24px;animation:obBounce 1s ease-in-out infinite">
          🧴
        </div>
        <div id="obDemoText" style="font-size:14px;font-weight:700;color:#fff;margin-bottom:20px;min-height:40px">
          시작합니다...
        </div>
        <div style="width:240px;height:6px;background:rgba(255,255,255,.1);border-radius:10px;overflow:hidden;margin:0 auto 20px">
          <div id="obDemoBar" style="width:0%;height:100%;background:linear-gradient(90deg,#2ECC71,#F39C12);border-radius:10px;transition:width .5s linear"></div>
        </div>
        <button class="ob-btn-primary" id="obDemoSkip" style="max-width:200px;margin:0 auto;display:none">계속하기 →</button>
      </div>
    `;
    document.body.appendChild(screen);

    let totalDuration = 0;
    step.demoSteps.forEach(s => totalDuration += s.duration);
    
    let elapsed = 0;
    let stepIdx = 0;
    
    const runStep = () => {
      if(stepIdx >= step.demoSteps.length){
        document.getElementById('obDemoSkip').style.display = 'block';
        document.getElementById('obDemoSkip').onclick = () => {
          screen.remove();
          showStep(currentStep + 1);
        };
        return;
      }
      const s = step.demoSteps[stepIdx];
      const txtEl = document.getElementById('obDemoText');
      const imgEl = document.getElementById('obDemoImage');
      const barEl = document.getElementById('obDemoBar');
      
      if(txtEl) txtEl.textContent = s.text;
      
      // 이미지 변화
      if(stepIdx === 1) imgEl.textContent = '🔍';
      else if(stepIdx === 2) imgEl.textContent = '✅';
      else if(stepIdx === 3) imgEl.textContent = '🎉';
      
      elapsed += s.duration;
      if(barEl) barEl.style.width = (elapsed/totalDuration*100) + '%';
      
      stepIdx++;
      setTimeout(runStep, s.duration);
    };
    
    runStep();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 마지막 모달 (회원가입 유도)
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function showFinalModal(step){
    const modal = document.createElement('div');
    modal.className = 'ob-modal';
    modal.id = 'obFinalModal';
    modal.innerHTML = `
      <div class="ob-modal-box">
        <div style="font-size:80px;margin-bottom:12px;animation:obBounce 1.5s ease-in-out infinite">🎉</div>
        <div style="font-size:22px;font-weight:900;color:#1a2e1a;margin-bottom:12px">
          ${step.title}
        </div>
        <div style="font-size:13px;color:#555;line-height:1.9;margin-bottom:24px;white-space:pre-line">
          ${step.desc}
        </div>
        <button class="ob-btn-primary" onclick="window._obGoLogin()">${step.btnText}</button>
        <button class="ob-btn-secondary" onclick="window._obFinish()">${step.skipText}</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 다음 단계로
  // ━━━━━━━━━━━━━━━━━━━━━━━
  window._obNext = () => {
    const intro = document.getElementById('obIntroModal');
    if(intro) intro.remove();
    showStep(currentStep + 1);
  };

  // 로그인으로
  window._obGoLogin = () => {
    cleanup();
    localStorage.setItem('eq_onboarding_done', '1');
    // 비로그인 상태면 로그인 화면으로
    if(!window.ME){
      const loginScreen = document.getElementById('loginScreen');
      const app = document.getElementById('app');
      if(app) app.style.display = 'none';
      if(loginScreen) loginScreen.style.display = 'flex';
    }
  };

  // 끝내기 (구경 계속)
  window._obFinish = () => {
    cleanup();
    localStorage.setItem('eq_onboarding_done', '1');
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 정리
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function cleanupCurrent(){
    if(spotlight){ spotlight.remove(); spotlight = null; }
    if(darkOverlay){ darkOverlay.remove(); darkOverlay = null; }
    if(tooltip){ tooltip.remove(); tooltip = null; }
    if(clickArea){ clickArea.remove(); clickArea = null; }
    const finger = document.getElementById('obFinger');
    if(finger) finger.remove();
    const label = document.getElementById('obClickLabel');
    if(label) label.remove();
  }

  function endTour(){
    cleanup();
    localStorage.setItem('eq_onboarding_done', '1');
  }

  function cleanup(){
    cleanupCurrent();
    document.querySelectorAll('.ob-skip, .ob-progress, #obIntroModal, #obPopupModal, #obDemoScreen, #obFinalModal').forEach(e => e.remove());
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 자동 시작 트리거
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function autoStart(){
    if(!shouldStartTour()) return;
    
    // 앱이 보이는 상태 or 로그인 화면인 상태
    const app = document.getElementById('app');
    const login = document.getElementById('loginScreen');
    const intro = document.getElementById('introScreen');
    
    // 인트로 화면이 떠있으면 대기
    if(intro && intro.style.display !== 'none') return;
    
    // 앱이나 로그인 화면이 떠있으면 시작
    if((app && app.style.display === 'block') || (login && login.style.display === 'flex')){
      // 비로그인 상태면 앱 강제로 띄우기 (탭 보게 하기)
      if(!window.ME){
        if(login) login.style.display = 'none';
        if(app) app.style.display = 'block';
      }
      setTimeout(() => startTour(!!window.ME), 800);
    }
  }

  // 페이지 로드 후 자동 체크
  if(document.readyState === 'complete'){
    setTimeout(autoStart, 2000);
  } else {
    window.addEventListener('load', () => setTimeout(autoStart, 2000));
  }

  // 주기적으로 체크 (인트로 끝나고 로그인 화면 뜨면)
  const checkInterval = setInterval(() => {
    if(localStorage.getItem('eq_onboarding_done')){
      clearInterval(checkInterval);
      return;
    }
    autoStart();
  }, 2000);

  // 10초 후 interval 정리
  setTimeout(() => clearInterval(checkInterval), 15000);

  // 헤더 📖 버튼 추가 (기존 튜토리얼이 이미 만들었으면 안 만듦)
  function addReplayButton(){
    if(document.getElementById('tutorialHeaderBtn')) return;
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
      startTour(!!window.ME);
    };
    logoutBtn.parentNode.insertBefore(btn, logoutBtn);
  }

  setTimeout(addReplayButton, 3000);
})();
