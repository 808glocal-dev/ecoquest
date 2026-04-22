// tutorial_patch.js - 사용방법 안내 튜토리얼
(function(){
  
  const STEPS = [
    {
      emoji: '🌍',
      title: 'EcoQuest에 오신 걸 환영해요!',
      desc: '매일의 작은 환경 실천이\n지구를 지키는 큰 힘이 돼요.\n\n사용법을 간단히 알려드릴게요!',
      img: '🌱'
    },
    {
      emoji: '🏆',
      title: '1. 챌린지에 참여하세요',
      desc: '"챌린지" 탭에서 원하는 환경 미션을 선택하고\n참여 기간을 정하세요.\n\n예: 텀블러 사용, 대중교통, 분리수거 등',
      img: '📋'
    },
    {
      emoji: '📸',
      title: '2. 미션 사진으로 인증하세요',
      desc: '"홈" 탭에서 오늘의 미션을 확인하고\n사진을 찍어 AI에게 인증받으세요!\n\n텀블러, 대중교통, 채식 등\n일상 속 환경 실천을 증명해요.',
      img: '📱'
    },
    {
      emoji: '🌳',
      title: '3. 나무를 키워요',
      desc: 'CO₂를 절감할수록 내 나무가 자라요.\n\n🌰 도토리 → 🌱 씨앗 → 🌿 새싹\n→ 🌳 나무 → 🌲 큰나무 → 🏕️ 숲\n\n"지도" 탭에서 확인할 수 있어요.',
      img: '🌲'
    },
    {
      emoji: '💚',
      title: '4. 함께해요!',
      desc: '"소속" 탭에서 우리 성당/회사/학교\n사람들과 함께 환경 운동을 해요.\n\n포인트 모아서 스토어에서\n친환경 제품도 받아가세요!',
      img: '👥'
    },
    {
      emoji: '✨',
      title: '준비 완료!',
      desc: '자, 이제 지구를 지키러 가볼까요?\n\n작은 실천이 모여\n큰 변화를 만들어요 🌍',
      img: '🚀'
    }
  ];

  let currentStep = 0;

  function createTutorial(){
    // 기존 튜토리얼 제거
    const existing = document.getElementById('tutorialOverlay');
    if(existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'tutorialOverlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.75);
      z-index:10000;display:flex;align-items:center;justify-content:center;
      padding:20px;animation:fadeIn .3s ease;
    `;
    overlay.innerHTML = renderStep();
    document.body.appendChild(overlay);

    bindEvents();
  }

  function renderStep(){
    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;
    const isFirst = currentStep === 0;
    
    const dots = STEPS.map((_, i) => `
      <span style="
        width:${i === currentStep ? '24px' : '8px'};
        height:8px;
        border-radius:4px;
        background:${i === currentStep ? '#2ECC71' : '#d0e8d6'};
        transition:all .3s;
      "></span>
    `).join('');

    return `
      <div style="
        background:#fff;border-radius:24px;
        max-width:360px;width:100%;
        padding:32px 24px 24px;
        text-align:center;
        box-shadow:0 20px 60px rgba(0,0,0,.3);
        animation:slideUp .4s ease;
      ">
        <!-- 닫기 버튼 -->
        <button onclick="window.closeTutorial()" style="
          position:absolute;top:16px;right:16px;
          background:#f0f0f0;border:none;
          border-radius:50%;width:32px;height:32px;
          font-size:16px;cursor:pointer;
          color:#666;
        ">✕</button>

        <!-- 메인 이미지 -->
        <div style="font-size:72px;margin-bottom:16px">${step.img}</div>
        
        <!-- 제목 -->
        <div style="
          font-size:20px;font-weight:900;
          color:#1a2e1a;margin-bottom:12px;
          line-height:1.4;
        ">${step.emoji} ${step.title}</div>
        
        <!-- 설명 -->
        <div style="
          font-size:14px;color:#555;
          line-height:1.8;margin-bottom:28px;
          white-space:pre-line;
          min-height:100px;
        ">${step.desc}</div>

        <!-- 진행 점 -->
        <div style="
          display:flex;gap:4px;justify-content:center;
          margin-bottom:20px;
        ">${dots}</div>

        <!-- 버튼 -->
        <div style="display:flex;gap:8px">
          ${!isFirst ? `
            <button onclick="window.prevTutorial()" style="
              flex:1;padding:14px;border:1.5px solid #ddd;
              background:#fff;border-radius:14px;
              font-size:14px;font-weight:700;cursor:pointer;
              color:#666;font-family:inherit;
            ">이전</button>
          ` : ''}
          <button onclick="window.nextTutorial()" style="
            flex:2;padding:14px;border:none;
            background:linear-gradient(135deg,#2ECC71,#27AE60);
            color:#fff;border-radius:14px;
            font-size:15px;font-weight:900;cursor:pointer;
            font-family:inherit;
            box-shadow:0 4px 12px rgba(46,204,113,.3);
          ">${isLast ? '시작하기! 🌱' : '다음 →'}</button>
        </div>
      </div>
    `;
  }

  function bindEvents(){
    window.nextTutorial = () => {
      if(currentStep === STEPS.length - 1){
        closeTutorial();
        localStorage.setItem('eq_tutorial_done', '1');
      } else {
        currentStep++;
        document.getElementById('tutorialOverlay').innerHTML = renderStep();
      }
    };

    window.prevTutorial = () => {
      if(currentStep > 0){
        currentStep--;
        document.getElementById('tutorialOverlay').innerHTML = renderStep();
      }
    };

    window.closeTutorial = () => {
      const ov = document.getElementById('tutorialOverlay');
      if(ov){
        ov.style.animation = 'fadeOut .3s ease';
        setTimeout(() => ov.remove(), 300);
      }
    };
  }

  // 첫 방문 시 자동 실행
  window.showTutorial = () => {
    currentStep = 0;
    createTutorial();
  };

  // 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes fadeOut { from{opacity:1} to{opacity:0} }
    @keyframes slideUp { 
      from{opacity:0;transform:translateY(30px)} 
      to{opacity:1;transform:translateY(0)} 
    }
  `;
  document.head.appendChild(style);

  // 마이 탭에 "사용법 다시보기" 버튼 추가
  function addTutorialButton(){
    const myPage = document.getElementById('page-my');
    if(!myPage) return;
    if(document.getElementById('tutorialBtn')) return;

    const btnGroup = myPage.querySelector('div[style*="gap:8px"][style*="padding:0 12px"]');
    if(!btnGroup) return;

    const btn = document.createElement('div');
    btn.id = 'tutorialBtn';
    btn.style.cssText = 'padding:0 12px;margin-bottom:4px';
    btn.innerHTML = `
      <button class="btn btn-g" style="padding:12px;width:100%" onclick="window.showTutorial()">
        📖 사용법 다시보기
      </button>
    `;
    btnGroup.parentNode.insertBefore(btn, btnGroup.nextSibling);
  }

  // 신규 유저면 자동 실행
  function checkAndShow(){
    if(!window.ME) return;
    if(localStorage.getItem('eq_tutorial_done')) return;
    
    // 온보딩 완료 후에 보여주기 (3초 대기)
    setTimeout(() => {
      if(window.UDATA?.age && !localStorage.getItem('eq_tutorial_done')){
        showTutorial();
      }
    }, 3000);
  }

  // 초기 실행
  const init = () => {
    addTutorialButton();
    checkAndShow();
  };

  if(document.readyState === 'complete'){
    setTimeout(init, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(init, 1000));
  }

  // 페이지 전환 시에도 버튼 추가 확인
  const origGoPage = window.goPage;
  if(typeof origGoPage === 'function'){
    window.goPage = function(name){
      origGoPage.apply(this, arguments);
      if(name === 'my') setTimeout(addTutorialButton, 100);
    };
  }
})();
