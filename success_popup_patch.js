// success_popup_patch.js
(function(){
  'use strict';

  /* 1. 미션별 1차 출처 매핑 */
  const SOURCES = {
    m1:  {co2:0.332, ref:'환경부 일회용품 사용규제 LCA 보고서 (2023)'},
    m2:  {co2:1.17,  ref:'국토교통부 수송부문 온실가스 통계 (2023) · IPCC AR6'},
    m3:  {co2:0.8,   ref:'FAO 식품 탄소발자국 보고서 (2021)'},
    m4:  {co2:0.13,  ref:'한국전력공사 전력 배출계수 0.4594 kgCO₂/kWh (2024)'},
    m5:  {co2:0.21,  ref:'환경부 자원순환정보시스템 폐기물 매립 배출계수 (2023)'},
    m6:  {co2:0.15,  ref:'환경부 비닐봉투 LCA 평가 (2022)'},
    m7:  {co2:0.38,  ref:'에너지공단 가정용 가스보일러 효율 기준 (2023)'},
    m8:  {co2:1.05,  ref:'IPCC AR6 도로운송 배출계수 0.21 kgCO₂/km'},
    m11: {co2:0.5,   ref:'환경부 생활폐기물 매립 시 메탄 발생계수 (IPCC)'},
    m12: {co2:0.3,   ref:'환경부 일회용 플라스틱 수저·포크 LCA (2023)'},
    m13: {co2:0.25,  ref:'한국환경공단 다회용기 vs 일회용기 LCA 비교 (2022)'},
    m14: {co2:0.12,  ref:'에너지관리공단 대기전력 가이드라인 (2023)'},
    m15: {co2:0.6,   ref:'환경부 음식물쓰레기 CH₄ 발생량 (IPCC AR6)'},
    m17: {co2:1.2,   ref:'옥스퍼드 Poore & Nemecek 식품 탄소발자국 연구 (2018)'},
    m20: {co2:0.02,  ref:'환경부 종이영수증 LCA (2023)'},
    m27: {co2:5.0,   ref:'국립산림과학원 소나무 연간 CO₂ 흡수량 5.0kg/그루 (2022)'},
    m41: {co2:0.05,  ref:'환경부 환경교육 진흥 보고서 (2023)'},
    m42: {co2:0.05,  ref:'환경부 환경교육 진흥 보고서 (2023)'},
    m43: {co2:0.03,  ref:'환경부 환경교육 진흥 보고서 (2023)'},
    m44: {co2:0.01,  ref:'환경부 ESG 정보공시 가이드라인 (2024)'},
    m45: {co2:0.02,  ref:'환경부 환경교육 진흥 보고서 (2023)'},
  };
  window.MISSION_SOURCES = SOURCES;

  /* 2. AI 표현 자연스럽게 — '🤖 AI 분석' → '✨ 인증하기' */
  function softenAILabels(){
    const t = document.getElementById('aiTitle');
    if(t && /^✨|^📸/.test(t.textContent)===false){}
    // 버튼 텍스트 자연스럽게
    const ana = document.getElementById('btnAnalyze');
    if(ana && ana.textContent.includes('AI')) ana.textContent = '✨ 인증하기';
    // 미션 카드 'AI인증' 배지 톤다운
    document.querySelectorAll('.badge-ai').forEach(b=>{
      if(b.textContent.includes('AI')) b.textContent='✨인증';
    });
  }

  /* 3. 성공 팝업 (확 뜨고 2.5초 후 자동 닫힘) */
  function ensureSuccessOverlay(){
    if(document.getElementById('ehSuccessOv')) return;
    const el = document.createElement('div');
    el.id = 'ehSuccessOv';
    el.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9000;
      display:none;align-items:center;justify-content:center;padding:24px;
      animation:ehFade .25s ease;
    `;
    el.innerHTML = `
      <div id="ehSuccessCard" style="
        background:linear-gradient(160deg,#0f3d20,#1a6b3a 50%,#2ECC71);
        color:#fff;border-radius:24px;padding:28px 24px;max-width:340px;width:100%;
        text-align:center;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.4);
        animation:ehPop .35s cubic-bezier(.34,1.56,.64,1);overflow:hidden">
        <div style="position:absolute;right:-20px;bottom:-20px;font-size:140px;opacity:.1">🌍</div>
        <div id="ehSucEmoji" style="font-size:60px;margin-bottom:8px;animation:ehBounce .6s ease">🌱</div>
        <div style="font-size:13px;color:rgba(255,255,255,.75);font-weight:700;margin-bottom:4px">인증 완료!</div>
        <div id="ehSucName" style="font-size:18px;font-weight:900;margin-bottom:14px"></div>

        <div style="background:rgba(255,255,255,.15);border-radius:16px;padding:14px;margin-bottom:12px">
          <div style="font-size:11px;color:rgba(255,255,255,.7);margin-bottom:2px">방금 절감한 CO₂</div>
          <div id="ehSucCo2" style="font-size:32px;font-weight:900;color:#a8f0c6;line-height:1.2">0kg</div>
          <div id="ehSucAnalogy" style="font-size:11px;color:rgba(255,255,255,.8);margin-top:4px"></div>
        </div>

        <div style="background:rgba(255,255,255,.12);border-radius:12px;padding:10px;margin-bottom:12px">
          <div style="font-size:10px;color:rgba(255,255,255,.6);margin-bottom:2px">누적 CO₂ 절감</div>
          <div id="ehSucCum" style="font-size:16px;font-weight:900">0kg</div>
          <div id="ehSucTree" style="font-size:11px;color:rgba(255,255,255,.75);margin-top:2px"></div>
        </div>

        <div id="ehSucRef" style="font-size:9px;color:rgba(255,255,255,.45);line-height:1.5;margin-top:6px"></div>

        <button onclick="document.getElementById('ehSuccessOv').style.display='none'"
          style="margin-top:14px;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.4);
          border-radius:12px;padding:10px 24px;color:#fff;font-size:13px;font-weight:700;
          cursor:pointer;font-family:inherit;width:100%">확인 ✓</button>
      </div>
    `;
    document.body.appendChild(el);

    const sty = document.createElement('style');
    sty.textContent = `
      @keyframes ehFade { from{opacity:0} to{opacity:1} }
      @keyframes ehPop { from{transform:scale(.7);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes ehBounce { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
    `;
    document.head.appendChild(sty);
  }

  function showSuccess(mission){
    ensureSuccessOverlay();
    const src = SOURCES[mission.id];
    const co2 = mission.co2 || src?.co2 || 0;
    const ref = src?.ref || '한국환경공단·IPCC AR6 평균 배출계수';
    const cumCo2 = (window.UDATA?.co2 || 0);
    const trees = (cumCo2 / 21.4);

    // 비유 (의미 부여)
    const analogyMap = {
      m1:`☕ 일회용 종이컵 3개 안 쓴 효과`,
      m2:`🚗 승용차 9km 안 탄 효과`,
      m3:`🐄 축산 탄소 ${(co2*1000).toFixed(0)}g 줄임`,
      m5:`💧 정수기 하루치 에너지 절감`,
      m8:`🛵 오토바이 5km 운행 회피`,
      m11:`♻️ 쓰레기 1kg 매립 회피`,
      m15:`🍜 라면 2봉지 생산 탄소 줄임`,
      m27:`🌳 1년간 자란 묘목 한 그루 분량`,
    };
    const analogy = analogyMap[mission.id] || `🌱 ${(co2*1000).toFixed(0)}g 탄소를 줄였어요`;
    const treeMsg = cumCo2 < 1 ? '씨앗을 막 심은 단계 🌰'
                  : cumCo2 < 5 ? `새싹이 자라고 있어요 🌿`
                  : cumCo2 < 21.4 ? `나무 한 그루의 ${Math.floor(cumCo2/21.4*100)}%까지 자랐어요`
                  : `🌳 나무 ${trees.toFixed(1)}그루 심은 효과`;

    document.getElementById('ehSucEmoji').textContent = mission.emoji || '🌱';
    document.getElementById('ehSucName').textContent = mission.name || '미션 완료';
    document.getElementById('ehSucCo2').textContent = `-${co2.toFixed(2)}kg`;
    document.getElementById('ehSucAnalogy').textContent = analogy;
    document.getElementById('ehSucCum').textContent = `${cumCo2.toFixed(1)}kg`;
    document.getElementById('ehSucTree').textContent = treeMsg;
    document.getElementById('ehSucRef').textContent = `📚 ${ref}`;

    document.getElementById('ehSuccessOv').style.display = 'flex';

    // 2.5초 후 자동 닫힘 (사용자가 확인 누르면 즉시)
    clearTimeout(window._ehSucTimer);
    window._ehSucTimer = setTimeout(()=>{
      const ov = document.getElementById('ehSuccessOv');
      if(ov) ov.style.display = 'none';
    }, 3500);
  }
  window.ehShowSuccess = showSuccess;

  /* 4. doComplete 훅 — 토스트 대신 팝업 */
  function hookDoComplete(){
    if(window._ehDoCompleteHooked) return;
    const orig = window.doComplete;
    if(typeof orig !== 'function'){ setTimeout(hookDoComplete, 500); return; }
    window.doComplete = async function(...args){
      const savedMission = window._curM ? {...window._curM} : null;
      const result = await orig.apply(this, args);
      if(savedMission){
        setTimeout(()=>showSuccess(savedMission), 300);
      }
      return result;
    };
    window._ehDoCompleteHooked = true;
    console.log('[success_popup] ✅ doComplete 훅 적용');
  }

  /* 5. 실행 */
  function run(){
    softenAILabels();
    ensureSuccessOverlay();
    hookDoComplete();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(run,300));
  else setTimeout(run,300);
  [800,2000,4000].forEach(t=>setTimeout(run,t));
})();
