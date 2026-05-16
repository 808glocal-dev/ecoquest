// bunny_field_crops_patch.js v1
// 토끼 들판에 텃밭 농작물 6개를 실제 농사짓는 것처럼 시각화
(function(){
  'use strict';

  // 단계별 이모지 (씨앗 → 새싹 → 자라는중 → 수확가능)
  const STAGE_DISPLAY = {
    0: '💧',  // 씨앗 (방금 심음)
    1: '🌱',  // 새싹
    2: '🌿',  // 자라는중
    3: '🌾',  // 수확가능 (기본)
    seed: '💧',
    sprout: '🌱',
    growing: '🌿',
    ready: '🌾',
  };

  // 작물별 수확 가능 시점 이모지
  const CROP_HARVEST = {
    potato: '🥔',
    carrot: '🥕',
    tomato: '🍅',
    corn: '🌽',
    strawberry: '🍓',
    pumpkin: '🎃',
    eggplant: '🍆',
    broccoli: '🥦',
    lettuce: '🥬',
    pepper: '🌶️',
    onion: '🧅',
    garlic: '🧄',
    radish: '🥕',
    cabbage: '🥬',
  };

  function getCropDisplay(plot){
    if(!plot) return {emoji: '🟫', label: '빈 밭'};
    const stage = plot.stage;
    // 수확 가능한 단계 = 작물별 이모지
    if(stage === 3 || stage === 'ready' || stage === 'harvest'){
      return {
        emoji: CROP_HARVEST[plot.crop] || '🌾',
        label: '수확 가능!'
      };
    }
    // 그 외 단계
    const emoji = STAGE_DISPLAY[stage] || '🌱';
    const labelMap = {0:'씨앗', 1:'새싹', 2:'자라는중', seed:'씨앗', sprout:'새싹', growing:'자라는중'};
    return {
      emoji,
      label: labelMap[stage] || '자라는중'
    };
  }

  // 들판에 농작물 그리기
  function renderCropsInField(){
    const playground = document.getElementById('bunnyPlayground');
    if(!playground) return;

    // 기존 농작물 제거
    playground.querySelectorAll('.eq-field-crop, .eq-field-soil, .eq-field-label').forEach(el => el.remove());

    const plots = window.UDATA?.farm?.plots || [];

    // 토양 띠 (농경지처럼 보이게)
    const soil = document.createElement('div');
    soil.className = 'eq-field-soil';
    soil.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:38px;background:linear-gradient(180deg,transparent,rgba(139,111,71,.28) 40%,rgba(139,111,71,.4));pointer-events:none;z-index:1';
    playground.appendChild(soil);

    // 안내 라벨 (탭해서 관리)
    const label = document.createElement('div');
    label.className = 'eq-field-label';
    label.style.cssText = 'position:absolute;bottom:36px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.5);border-radius:12px;padding:2px 10px;font-size:9px;color:#5D4037;font-weight:700;z-index:8;pointer-events:none;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.1)';
    label.textContent = '🌾 내 텃밭 — 작물 탭해서 관리';
    playground.appendChild(label);

    // 6개 농작물 가로 일렬 배치 (들판 하단)
    const positions = ['10%', '24%', '38%', '52%', '66%', '80%'];

    for(let i = 0; i < 6; i++){
      const plot = plots[i];
      const pos = positions[i];
      const display = getCropDisplay(plot);
      const isReady = plot && (plot.stage === 3 || plot.stage === 'ready' || plot.stage === 'harvest');

      // 작물 자체
      const el = document.createElement('div');
      el.className = 'eq-field-crop';
      el.style.cssText = `position:absolute;left:${pos};bottom:6px;transform:translateX(-50%);font-size:26px;cursor:pointer;z-index:7;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));transition:transform .15s${isReady ? ';animation:eqFieldBounce 1.8s ease-in-out infinite' : ''}`;
      el.textContent = display.emoji;
      el.title = `${display.label} - 탭해서 농장 페이지로`;
      el.onclick = (e) => {
        e.stopPropagation();
        if(typeof window.goPage === 'function'){
          window.goPage('farm');
          setTimeout(() => window.toast?.('🌾 농장으로 왔어요! 작물을 관리해보세요'), 200);
        }
      };
      el.onmouseover = () => { el.style.transform = 'translateX(-50%) scale(1.25)'; };
      el.onmouseout = () => { el.style.transform = 'translateX(-50%)'; };
      playground.appendChild(el);

      // 수확 가능하면 ✨ 반짝
      if(isReady){
        const spark = document.createElement('div');
        spark.className = 'eq-field-crop';
        spark.style.cssText = `position:absolute;left:calc(${pos} + 14px);bottom:32px;font-size:14px;z-index:7;pointer-events:none;animation:eqFieldSpark 1.2s ease-in-out infinite`;
        spark.textContent = '✨';
        playground.appendChild(spark);
      }
    }

    // CSS 애니메이션 한 번만 추가
    if(!document.getElementById('eqFieldCropsCss')){
      const s = document.createElement('style');
      s.id = 'eqFieldCropsCss';
      s.textContent = `
        @keyframes eqFieldBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
        @keyframes eqFieldSpark {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `;
      document.head.appendChild(s);
    }
  }

  /* boot */
  function boot(){
    if(!window.FB){ setTimeout(boot, 500); return; }
    renderCropsInField();

    // playground 변할 때 다시 그리기
    const observer = new MutationObserver(() => {
      if(document.getElementById('bunnyPlayground') && !document.querySelector('.eq-field-crop')){
        renderCropsInField();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 30초마다 자동 새로고침 (작물 자라기 반영)
    setInterval(renderCropsInField, 30000);

    console.log('%c[bunny_field_crops v1] 🌾🥕 들판 텃밭 시각화 활성화','color:#fff;background:#8B6F47;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3500));
  else setTimeout(boot, 3500);
})();
