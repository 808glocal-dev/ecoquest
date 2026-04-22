// tutorial_patch.js - 인터랙티브 튜토리얼 (안내 + 클릭 유도)
(function(){
  
  const STEPS = [
    {
      target: '.tb[data-page="chal"]',
      title: '1단계: 챌린지 참여하기',
      desc: '먼저 하단의 "🏆 챌린지" 탭을 눌러보세요!',
      position: 'top'
    },
    {
      target: '.cg-card',
      title: '2단계: 미션 선택',
      desc: '마음에 드는 챌린지를 하나 골라 눌러보세요!',
      position: 'bottom',
      waitForPage: 'chal'
    },
    {
      target: '.tb[data-page="home"]',
      title: '3단계: 홈으로 돌아가기',
      desc: '챌린지에 참여하셨어요!\n이제 "🏠 홈" 탭을 눌러 오늘의 미션을 확인해봐요!',
      position: 'top'
    },
    {
      target: '#missionScroll .mc',
      title: '4단계: 미션 인증하기',
      desc: '오늘의 미션 카드를 눌러\n사진으로 인증해보세요!',
      position: 'bottom',
      waitForPage: 'home'
    },
    {
      target: '.tb[data-page="map"]',
      title: '5단계: 나무 확인',
      desc: '"🌍 지도" 탭에서\n내가 키운 나무를 확인해봐요!',
      position: 'top'
    },
    {
      target: '.tb[data-page="activity"]',
      title: '6단계: 내 활동 보기',
      desc: '"📊 내활동" 탭에서\n지금까지의 CO₂ 절감량을 볼 수 있어요!',
      position: 'top'
    },
    {
      target: '.tb[data-page="company"]',
      title: '7단계: 소속',
      desc: '마지막으로 "🏢 소속" 탭에서\n우리 팀과 함께 환경 운동을 해봐요!',
      position: 'top'
    },
    {
      title: '🎉 완료!',
      desc: '이제 EcoQuest 사용법을 다 익히셨어요!\n지구를 지키는 여정, 시작해볼까요? 🌱',
      center: true,
      isLast: true
    }
  ];

  let currentStep = 0;
  let overlay = null;
  let spotlight = null;
  let tooltip = null;

  // ━━━━━━━━━━━━━━━━━━━━━━━
  // 시작 안내 팝업 (NEW!)
  // ━━━━━━━━━━━━━━━━━━━━━━━
  function showStartIntro(){
    const intro = document.createElement('div');
    intro.id = 'tutIntroModal';
    intro.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.8);
      z-index:10000;display:flex;align-items:center;justify-content:center;
      padding:20px;animation:tutFadeIn .3s ease;
    `;
    intro.innerHTML = `
      <div style="
        background:#fff;border-radius:24px;
        max-width:340px;width:100%;padding:32px 24px 24px;
        text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);
      ">
        <div style="font-size:72px;margin-bottom:16px;animation:tutBounce 1.5s ease-in-out infinite">📖</div>
        
        <div style="font-size:22px;font-weight:900;color:#1a2e1a;margin-bottom:10px;line-height:1.4">
          EcoQuest<br/>사용법 안내
        </div>
        
        <div style="font-size:13px;color:#666;line-height:1.8;margin-bottom:20px">
          지금부터 EcoQuest 사용법을<br/>
          <b style="color:#2ECC71">직접 따라하며</b> 배워볼게요!
        </div>

        <div style="background:#f0fbf4;border-radius:14px;padding:14px;margin-bottom:20px;text-align:left">
          <div style="font-size:12px;font-weight:700;color:#1a6b3a;margin-bottom:8px">📌 이렇게 진행돼요</div>
          <div style="font-size:12px;color:#555;line-height:1.9">
            1️⃣ 👆 손가락이 눌러야 할 곳을 가리켜요<br/>
            2️⃣ ✨ 반짝이는 버튼을 직접 눌러주세요<br/>
            3️⃣ 📱 자동으로 다음 단계로 넘어가요
          </div>
        </div>

        <div style="font-size:11px;color:#888;margin-bottom:20px">
          💡 언제든 우측 상단 <b>✕ 건너뛰기</b>로 종료 가능해요
        </div>

        <div style="display:flex;gap:8px">
          <button onclick="window._skipTutorial()" style="
            flex:1;padding:13px;border:1.5px solid #ddd;
            background:#fff;border-radius:12px;
            font-size:13px;font-weight:700;cursor:pointer;
            color:#666;font-family:inherit;
          ">나중에 할게요</button>
          <button onclick="window._startTutorialSteps()" style="
            flex:2;padding:13px;border:none;
            background:linear-gradient(135deg,#2ECC71,#27AE60);
            color:#fff;border-radius:12px;
            font-size:14px;font-weight:900;cursor:pointer;
            font-family:inherit;
            box-shadow:0 4px 12px rgba(46,204,113,.3);
          ">시작하기! 🌱</button>
        </div>
      </div>
    `;
    document.body.appendChild(intro);
  }

  // 메인 시작 함수
  window.showTutorial = () => {
    currentStep = 0;
    createOverlay();
    showStartIntro(); // 먼저 안내 팝업 
  };

  // 안내 팝업에서 "시작하기" 누르면
  window._startTutorialSteps = () => {
    const intro = document.getElementById('tutIntroModal');
    if(intro) intro.remove();
    showStep(0);
  };

  // 안내 팝업에서 "나중에" 누르면
  window._skipTutorial = () => {
    cleanup();
    localStorage.setItem('eq_tutorial_done', '1');
  };

  // 오버레이 생성
  function createOverlay(){
    cleanup();
    
    overlay = document.createElement('div');
    overlay.id = 'tutorialOverlayBg';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9998;pointer-events:none;
    `;
    document.body.appendChild(overlay);

    // 스타일 추가
    if(!document.getElementById('tutorialStyle')){
      const style = document.createElement('style');
      style.id = 'tutorialStyle';
      style.textContent = `
        @keyframes tutPulse {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(46,204,113,.9), 0 0 0 9999px rgba(0,0,0,.75); 
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 0 16px rgba(46,204,113,0), 0 0 0 9999px rgba(0,0,0,.75); 
            transform: scale(1.02);
          }
        }
        @keyframes tutBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes tutFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tutGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .tut-spotlight {
          position: fixed;
          border-radius: 14px;
          pointer-events: none;
          z-index: 9999;
          animation: tutPulse 1.5s ease-in-out infinite;
          transition: all .3s ease;
          border: 3px solid #2ECC71;
        }
        .tut-tooltip {
          position: fixed;
          z-index: 10000;
          background: #fff;
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,.4);
          max-width: 260px;
          animation: tutFadeIn .3s ease;
          border: 2px solid #2ECC71;
        }
        .tut-arrow-down {
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
        .tut-arrow-up {
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
        .tut-finger {
          position: fixed;
          font-size: 40px;
          z-index: 10001;
          pointer-events: none;
          animation: tutBounce .8s ease-in-out infinite;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,.5));
        }
        .tut-click-here {
          position: fixed;
          z-index: 10001;
          background: #F39C12;
          color: #fff;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
          animation: tutGlow 1.2s ease-in-out infinite;
          box-shadow: 0 4px 12px rgba(243,156,18,.5);
          pointer-events: none;
        }
        .tut-skip {
          position: fixed;
          top: 12px;
          right: 12px;
          z-index: 10002;
          background: rgba(0,0,0,.8);
          color: #fff;
          border: none;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .tut-progress {
          position: fixed;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10002;
          background: linear-gradient(135deg,#2ECC71,#27AE60);
          color: #fff;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 900;
          box-shadow: 0 4px 12px rgba(46,204,113,.4);
        }
      `;
      document.head.appendChild(style);
    }
  }

  // 단계 표시
  function showStep(idx){
    currentStep = idx;
    const step = STEPS[idx];
    if(!step){ endTutorial(); return; }

    // 종료 버튼 & 진행 표시 추가 (한 번만)
    if(!document.querySelector('.tut-skip')){
      const skipBtn = document.createElement('button');
      skipBtn.className = 'tut-skip';
      skipBtn.textContent = '✕ 건너뛰기';
      skipBtn.onclick = endTutorial;
      document.body.appendChild(skipBtn);

      const progress = document.createElement('div');
      progress.className = 'tut-progress';
      progress.id = 'tutProgress';
      document.body.appendChild(progress);
    }

    // 진행 표시 업데이트
    const prog = document.getElementById('tutProgress');
    if(prog) prog.textContent = `📖 사용법 ${idx+1} / ${STEPS.length}`;

    // 기존 스포트라이트/툴팁 제거
    removeSpotlight();
    removeTooltip();

    // 완료 단계 (중앙 팝업)
    if(step.center){
      showCenterModal(step);
      return;
    }

    // 페이지 전환 기다리기
    if(step.waitForPage){
      setTimeout(() => showStepElement(step), 600);
    } else {
      showStepElement(step);
    }
  }

  // 엘리먼트 하이라이트 + 툴팁 표시
  function showStepElement(step){
    const el = document.querySelector(step.target);
    if(!el){
      setTimeout(() => {
        const retry = document.querySelector(step.target);
        if(retry) highlightAndTooltip(retry, step);
        else showStep(currentStep + 1);
      }, 800);
      return;
    }
    highlightAndTooltip(el, step);
  }

  function highlightAndTooltip(el, step){
    const rect = el.getBoundingClientRect();
    
    // 스크롤해서 보이게
    if(rect.top < 80 || rect.bottom > window.innerHeight - 80){
      el.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(() => highlightAndTooltip(el, step), 500);
      return;
    }

    // 스포트라이트
    spotlight = document.createElement('div');
    spotlight.className = 'tut-spotlight';
    const pad = 6;
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.width = (rect.width + pad*2) + 'px';
    spotlight.style.height = (rect.height + pad*2) + 'px';
    document.body.appendChild(spotlight);

    // 손가락 
    const finger = document.createElement('div');
    finger.className = 'tut-finger';
    finger.id = 'tutFinger';
    finger.textContent = '👆';
    
    // "여기를 눌러주세요!" 라벨 (NEW!)
    const clickLabel = document.createElement('div');
    clickLabel.className = 'tut-click-here';
    clickLabel.id = 'tutClickLabel';
    clickLabel.textContent = '👆 여기를 눌러주세요!';
    
    // 툴팁
    tooltip = document.createElement('div');
    tooltip.className = 'tut-tooltip';
    tooltip.innerHTML = `
      <div style="font-size:13px;font-weight:900;color:#1a2e1a;margin-bottom:6px">
        ${step.title}
      </div>
      <div style="font-size:12px;color:#555;line-height:1.6;white-space:pre-line">
        ${step.desc}
      </div>
    `;
    document.body.appendChild(tooltip);

    // 툴팁 위치 계산
    const tRect = tooltip.getBoundingClientRect();
    let tLeft, tTop;
    
    if(step.position === 'top'){
      // 타겟 위에 표시
      tLeft = rect.left + rect.width/2 - tRect.width/2;
      tTop = rect.top - tRect.height - 50;
      tooltip.innerHTML += '<div class="tut-arrow-down"></div>';
      
      finger.style.left = (rect.left + rect.width/2 - 20) + 'px';
      finger.style.top = (rect.top - 48) + 'px';
      
      // 라벨: 손가락 위에
      clickLabel.style.left = (rect.left + rect.width/2) + 'px';
      clickLabel.style.top = (rect.top - 80) + 'px';
      clickLabel.style.transform = 'translateX(-50%)';
    } else {
      // 타겟 아래에 표시
      tLeft = rect.left + rect.width/2 - tRect.width/2;
      tTop = rect.bottom + 60;
      tooltip.innerHTML = tooltip.innerHTML + '<div class="tut-arrow-up"></div>';
      
      finger.style.left = (rect.left + rect.width/2 - 20) + 'px';
      finger.style.top = (rect.bottom + 8) + 'px';
      
      clickLabel.style.left = (rect.left + rect.width/2) + 'px';
      clickLabel.style.top = (rect.bottom + 18) + 'px';
      clickLabel.style.transform = 'translateX(-50%)';
    }

    // 화면 밖 방지
    tLeft = Math.max(12, Math.min(window.innerWidth - tRect.width - 12, tLeft));
    tTop = Math.max(60, tTop);
    
    tooltip.style.left = tLeft + 'px';
    tooltip.style.top = tTop + 'px';

    document.body.appendChild(finger);
    document.body.appendChild(clickLabel);

    // 클릭 감지 → 다음 단계
    const clickHandler = (e) => {
      el.removeEventListener('click', clickHandler, true);
      setTimeout(() => showStep(currentStep + 1), 400);
    };
    el.addEventListener('click', clickHandler, true);
    
    window._tutCleanup = () => el.removeEventListener('click', clickHandler, true);
  }

  // 완료 모달
  function showCenterModal(step){
    const modal = document.createElement('div');
    modal.id = 'tutCenterModal';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.8);
      z-index:10000;display:flex;align-items:center;justify-content:center;
      padding:20px;
    `;
    modal.innerHTML = `
      <div style="
        background:#fff;border-radius:24px;
        max-width:340px;padding:32px 24px;text-align:center;
        animation:tutFadeIn .4s ease;
        box-shadow:0 20px 60px rgba(0,0,0,.4);
      ">
        <div style="font-size:72px;margin-bottom:12px">🎉</div>
        <div style="font-size:22px;font-weight:900;color:#1a2e1a;margin-bottom:10px">
          ${step.title}
        </div>
        <div style="font-size:13px;color:#555;line-height:1.8;margin-bottom:24px;white-space:pre-line">
          ${step.desc}
        </div>
        <button onclick="window._endTutorial()" style="
          width:100%;padding:14px;border:none;
          background:linear-gradient(135deg,#2ECC71,#27AE60);
          color:#fff;border-radius:14px;
          font-size:15px;font-weight:900;cursor:pointer;
          font-family:inherit;
          box-shadow:0 4px 12px rgba(46,204,113,.3);
        ">시작하기! 🌱</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 스포트라이트 제거
  function removeSpotlight(){
    if(spotlight){ spotlight.remove(); spotlight = null; }
    const finger = document.getElementById('tutFinger');
    if(finger) finger.remove();
    const label = document.getElementById('tutClickLabel');
    if(label) label.remove();
    if(window._tutCleanup){ window._tutCleanup(); window._tutCleanup = null; }
  }

  function removeTooltip(){
    if(tooltip){ tooltip.remove(); tooltip = null; }
  }

  // 완전 종료
  function endTutorial(){
    cleanup();
    localStorage.setItem('eq_tutorial_done', '1');
  }
  window._endTutorial = endTutorial;

  function cleanup(){
    removeSpotlight();
    removeTooltip();
    const bg = document.getElementById('tutorialOverlayBg');
    if(bg) bg.remove();
    const skip = document.querySelector('.tut-skip');
    if(skip) skip.remove();
    const prog = document.getElementById('tutProgress');
    if(prog) prog.remove();
    const modal = document.getElementById('tutCenterModal');
    if(modal) modal.remove();
    const intro = document.getElementById('tutIntroModal');
    if(intro) intro.remove();
  }

  // 신규 유저 자동 실행
  function checkAndShow(){
    if(!window.ME) return;
    if(localStorage.getItem('eq_tutorial_done')) return;
    setTimeout(() => {
      if(window.UDATA?.age && !localStorage.getItem('eq_tutorial_done')){
        showTutorial();
      }
    }, 3000);
  }

  // 헤더에 "사용법 보기" 버튼 추가
  function addTutorialButtonToHeader(){
    if(document.getElementById('tutorialHeaderBtn')) return;
    const logoutBtn = document.getElementById('btnLogout');
    if(!logoutBtn) return;
    
    const btn = document.createElement('button');
    btn.id = 'tutorialHeaderBtn';
    btn.textContent = '📖';
    btn.title = '사용법 보기';
    btn.style.cssText = `
      background:rgba(255,255,255,.2);border:none;border-radius:8px;
      padding:4px 8px;color:#fff;font-size:14px;cursor:pointer;
      margin-right:2px;font-family:inherit;
    `;
    btn.onclick = () => {
      localStorage.removeItem('eq_tutorial_done');
      showTutorial();
    };
    logoutBtn.parentNode.insertBefore(btn, logoutBtn);
  }

  const init = () => {
    addTutorialButtonToHeader();
    checkAndShow();
  };

  if(document.readyState === 'complete'){
    setTimeout(init, 1500);
  } else {
    window.addEventListener('load', () => setTimeout(init, 1500));
  }
})();
