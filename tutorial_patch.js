// tutorial_patch.js - 인터랙티브 튜토리얼 (z-index 수정)
(function(){
  
  const STEPS = [
    {
      target: '.tb[data-page="chal"]',
      title: '1단계: 챌린지 참여하기',
      desc: '하단의 "🏆 챌린지" 탭을 눌러보세요!',
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
      desc: '챌린지에 참여하셨어요!\n"🏠 홈" 탭을 눌러 오늘의 미션을 확인해봐요!',
      position: 'top'
    },
    {
      target: '#missionScroll .mc',
      title: '4단계: 미션 인증',
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
      title: '6단계: 내 활동',
      desc: '"📊 내활동" 탭에서\n지금까지의 CO₂ 절감량을 볼 수 있어요!',
      position: 'top'
    },
    {
      target: '.tb[data-page="company"]',
      title: '7단계: 소속',
      desc: '"🏢 소속" 탭에서\n우리 팀과 함께 환경 운동을 해봐요!',
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
  let spotlight = null;
  let tooltip = null;
  let darkOverlay = null;

  function showStartIntro(){
    const intro = document.createElement('div');
    intro.id = 'tutIntroModal';
    intro.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.8);
      z-index:99999;display:flex;align-items:center;justify-content:center;
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

  window.showTutorial = () => {
    currentStep = 0;
    addStyles();
    showStartIntro();
  };

  window._startTutorialSteps = () => {
    const intro = document.getElementById('tutIntroModal');
    if(intro) intro.remove();
    showStep(0);
  };

  window._skipTutorial = () => {
    cleanup();
    localStorage.setItem('eq_tutorial_done', '1');
  };

  function addStyles(){
    if(document.getElementById('tutorialStyle')) return;
    const style = document.createElement('style');
    style.id = 'tutorialStyle';
    style.textContent = `
      @keyframes tutPulseRing {
        0% { box-shadow: 0 0 0 0 rgba(46,204,113,1), 0 0 30px 10px rgba(46,204,113,.6); }
        50% { box-shadow: 0 0 0 20px rgba(46,204,113,0), 0 0 30px 10px rgba(46,204,113,.9); }
        100% { box-shadow: 0 0 0 0 rgba(46,204,113,0), 0 0 30px 10px rgba(46,204,113,.6); }
      }
      @keyframes tutBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes tutFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes tutGlow {
        0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.7; transform: translateX(-50%) scale(1.05); }
      }
      .tut-dark-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.75);
        z-index: 999990 !important;
        pointer-events: auto;
      }
      .tut-spotlight {
        position: fixed !important;
        border-radius: 14px !important;
        pointer-events: none !important;
        z-index: 999995 !important;
        border: 4px solid #2ECC71 !important;
        background: transparent !important;
        animation: tutPulseRing 1.2s ease-in-out infinite !important;
        transition: all .3s ease !important;
      }
      .tut-clickable-wrap {
        position: fixed !important;
        z-index: 999996 !important;
        cursor: pointer !important;
      }
      .tut-tooltip {
        position: fixed !important;
        z-index: 999998 !important;
        background: #fff !important;
        border-radius: 16px !important;
        padding: 14px 16px !important;
        box-shadow: 0 12px 40px rgba(0,0,0,.5) !important;
        max-width: 260px !important;
        animation: tutFadeIn .3s ease !important;
        border: 2px solid #2ECC71 !important;
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
        position: fixed !important;
        font-size: 44px !important;
        z-index: 999997 !important;
        pointer-events: none !important;
        animation: tutBounce .7s ease-in-out infinite !important;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,.6)) !important;
      }
      .tut-click-here {
        position: fixed !important;
        z-index: 999997 !important;
        background: linear-gradient(135deg,#F39C12,#E67E22) !important;
        color: #fff !important;
        border-radius: 20px !important;
        padding: 8px 16px !important;
        font-size: 13px !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
        animation: tutGlow 1.2s ease-in-out infinite !important;
        box-shadow: 0 6px 20px rgba(243,156,18,.6) !important;
        pointer-events: none !important;
      }
      .tut-skip {
        position: fixed !important;
        top: 12px !important;
        right: 12px !important;
        z-index: 999999 !important;
        background: rgba(0,0,0,.9) !important;
        color: #fff !important;
        border: none !important;
        border-radius: 20px !important;
        padding: 8px 16px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        font-family: inherit !important;
      }
      .tut-progress {
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
    `;
    document.head.appendChild(style);
  }

  function showStep(idx){
    currentStep = idx;
    const step = STEPS[idx];
    if(!step){ endTutorial(); return; }

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

    const prog = document.getElementById('tutProgress');
    if(prog) prog.textContent = `📖 사용법 ${idx+1} / ${STEPS.length}`;

    removeSpotlight();
    removeTooltip();

    if(step.center){
      showCenterModal(step);
      return;
    }

    if(step.waitForPage){
      setTimeout(() => showStepElement(step), 600);
    } else {
      showStepElement(step);
    }
  }

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
    
    if(rect.top < 80 || rect.bottom > window.innerHeight - 80){
      el.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(() => highlightAndTooltip(el, step), 500);
      return;
    }

    // 어두운 오버레이
    darkOverlay = document.createElement('div');
    darkOverlay.className = 'tut-dark-overlay';
    darkOverlay.onclick = (e) => e.stopPropagation();
    document.body.appendChild(darkOverlay);

    // 스포트라이트 (타겟 위치 하이라이트)
    spotlight = document.createElement('div');
    spotlight.className = 'tut-spotlight';
    const pad = 6;
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.width = (rect.width + pad*2) + 'px';
    spotlight.style.height = (rect.height + pad*2) + 'px';
    document.body.appendChild(spotlight);

    // 클릭 가능 영역 (투명, 오버레이 위에서 클릭받음)
    const clickArea = document.createElement('div');
    clickArea.className = 'tut-clickable-wrap';
    clickArea.style.left = rect.left + 'px';
    clickArea.style.top = rect.top + 'px';
    clickArea.style.width = rect.width + 'px';
    clickArea.style.height = rect.height + 'px';
    clickArea.onclick = (e) => {
      e.stopPropagation();
      // 원래 엘리먼트 클릭 이벤트 트리거
      el.click();
      setTimeout(() => showStep(currentStep + 1), 400);
    };
    document.body.appendChild(clickArea);

    // 손가락
    const finger = document.createElement('div');
    finger.className = 'tut-finger';
    finger.id = 'tutFinger';
    finger.textContent = '👆';
    
    // "여기를 눌러주세요!" 라벨
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

    const tRect = tooltip.getBoundingClientRect();
    let tLeft, tTop;
    
    if(step.position === 'top'){
      tLeft = rect.left + rect.width/2 - tRect.width/2;
      tTop = rect.top - tRect.height - 55;
      tooltip.innerHTML += '<div class="tut-arrow-down"></div>';
      
      finger.style.left = (rect.left + rect.width/2 - 22) + 'px';
      finger.style.top = (rect.top - 52) + 'px';
      
      clickLabel.style.left = (rect.left + rect.width/2) + 'px';
      clickLabel.style.top = (rect.top - 90) + 'px';
      clickLabel.style.transform = 'translateX(-50%)';
    } else {
      tLeft = rect.left + rect.width/2 - tRect.width/2;
      tTop = rect.bottom + 65;
      tooltip.innerHTML = tooltip.innerHTML + '<div class="tut-arrow-up"></div>';
      
      finger.style.left = (rect.left + rect.width/2 - 22) + 'px';
      finger.style.top = (rect.bottom + 10) + 'px';
      
      clickLabel.style.left = (rect.left + rect.width/2) + 'px';
      clickLabel.style.top = (rect.bottom + 22) + 'px';
      clickLabel.style.transform = 'translateX(-50%)';
    }

    tLeft = Math.max(12, Math.min(window.innerWidth - tRect.width - 12, tLeft));
    tTop = Math.max(60, tTop);
    
    tooltip.style.left = tLeft + 'px';
    tooltip.style.top = tTop + 'px';

    document.body.appendChild(finger);
    document.body.appendChild(clickLabel);
  }

  function showCenterModal(step){
    const modal = document.createElement('div');
    modal.id = 'tutCenterModal';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.8);
      z-index:999999;display:flex;align-items:center;justify-content:center;
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

  function removeSpotlight(){
    if(spotlight){ spotlight.remove(); spotlight = null; }
    if(darkOverlay){ darkOverlay.remove(); darkOverlay = null; }
    const finger = document.getElementById('tutFinger');
    if(finger) finger.remove();
    const label = document.getElementById('tutClickLabel');
    if(label) label.remove();
    const clickArea = document.querySelector('.tut-clickable-wrap');
    if(clickArea) clickArea.remove();
  }

  function removeTooltip(){
    if(tooltip){ tooltip.remove(); tooltip = null; }
  }

  function endTutorial(){
    cleanup();
    localStorage.setItem('eq_tutorial_done', '1');
  }
  window._endTutorial = endTutorial;

  function cleanup(){
    removeSpotlight();
    removeTooltip();
    document.querySelectorAll('.tut-skip, .tut-progress, #tutCenterModal, #tutIntroModal').forEach(e => e.remove());
  }

  function checkAndShow(){
    if(!window.ME) return;
    if(localStorage.getItem('eq_tutorial_done')) return;
    setTimeout(() => {
      if(window.UDATA?.age && !localStorage.getItem('eq_tutorial_done')){
        showTutorial();
      }
    }, 3000);
  }

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
