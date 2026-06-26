/* =====================================================
   EcoQuest – co2_basis_patch.js  v1
   "CO₂ 절감량 계산 기준" 화면 — 정직한 추정치 프레이밍 + 출처/연도
   ─────────────────────────────────────────────────────
   • index.html 안의 기존 <details> 계산기준 블록을 이걸로 대체
     (DOMContentLoaded 후 #co2BasisBox 를 찾아 innerHTML 교체)
   • 핵심 원칙:
     - B2C 미션 숫자 = "행동 동기부여용 교육 추정치"임을 명시 (정밀회계 아님)
     - 통근(대중교통/도보)만 우리 실측 EF(지하철 20.79 등) → "정부 1차 통계" 배지
     - 나머지는 공개 인용값 + 출처·연도 명시, 등급 배지(인용/추정)
     - 명백히 틀렸던 값(텀블러 332g 등) → 출처값 범위로 정정
   ─────────────────────────────────────────────────────
   ★ 로드 위치: emission_factors_patch.js 뒤 (어디든 OK)
   ★ index.html 의 계산기준 <summary>가 들어있는 컨테이너에
     id="co2BasisBox" 가 없다면, 텍스트로 찾아 대체 시도
   ===================================================== */
(function(){
  'use strict';
  if(window._co2BasisLoaded) return;
  window._co2BasisLoaded = true;

  // grade: 'measured'(정부1차 직접산정) | 'cited'(공개 인용) | 'estimate'(교육 추정)
  const ITEMS = [
    { emoji:'🚇', name:'대중교통(지하철)', val:'실측 20.79 gCO₂/인·km', grade:'measured',
      basis:'서울교통공사 2021 전철전력 781,077,082kWh ÷ 승차실적 15,676백만 인·km × GIR 전력계수 0.4173',
      src:'철도통계연보 2021 · 온실가스종합정보센터(GIR) 전력배출계수 2023' },
    { emoji:'🚲', name:'자전거·도보', val:'승용차 210 gCO₂/km 회피', grade:'cited',
      basis:'이동거리 × 승용차 1km 배출 회피량(직접배출 0)',
      src:'공개 인용값(그린피스코리아 등 다수 일치)' },
    { emoji:'🧴', name:'텀블러(종이컵 대체)', val:'종이컵 1개 약 11 gCO₂', grade:'cited',
      basis:'종이컵 1개 제조~폐기 전과정(LCA) 약 11g. 1회 사용=1개 대체 가정',
      src:'녹색연합·그린포스트코리아(2018·2020), 고려대 임송택 LCA 인용' },
    { emoji:'🥗', name:'채식 한 끼', val:'육류 대비 약 0.8 kgCO₂ 절감', grade:'estimate',
      basis:'소고기 60g 감축 ≈ 휘발유차 10km 배출. 한 끼 육류→채식 전환 추정',
      src:'한국일보 한끼밥상 탄소계산기(2021, 한식진흥원 표준조리법)' },
    { emoji:'🍽️', name:'음식 남김 없이', val:'매립 메탄 회피(추정)', grade:'cited',
      basis:'음식물폐기물 1톤 매립 시 메탄 25.71kg 발생 → 잔반 감축분의 매립 회피',
      src:'기후솔루션 보고서(2024.7) 음식물폐기물 메탄배출계수' },
    { emoji:'🚯', name:'줍깅(폐기물 회수)', val:'폐기물 매립 회피(추정)', grade:'estimate',
      basis:'수거한 폐기물의 매립·방치 회피 추정. 품목·처리법에 따라 편차 큼',
      src:'환경부 폐기물 배출계수 · 기후솔루션(2024) 참고' },
    { emoji:'🔌', name:'멀티탭 절전', val:'전력 0.4173 kgCO₂/kWh', grade:'measured',
      basis:'대기전력 절감 kWh × GIR 전력 소비단 배출계수',
      src:'온실가스종합정보센터(GIR) 전력배출계수 2023' },
    { emoji:'🚿', name:'샤워 단축', val:'도시가스 연소 기준(추정)', grade:'estimate',
      basis:'온수 사용시간 단축분의 가스보일러 연소 배출 절감 추정',
      src:'에너지법 시행규칙 발열량(2022) · 도시가스 연소계수 참고' },
  ];

  function badge(grade){
    if(grade==='measured') return '<span style="background:#1a6b3a;color:#fff;font-size:8.5px;font-weight:800;padding:2px 6px;border-radius:7px;white-space:nowrap">정부 1차 통계</span>';
    if(grade==='cited')    return '<span style="background:#2a6fb0;color:#fff;font-size:8.5px;font-weight:800;padding:2px 6px;border-radius:7px;white-space:nowrap">공개 인용</span>';
    return '<span style="background:#8a6d00;color:#fff;font-size:8.5px;font-weight:800;padding:2px 6px;border-radius:7px;white-space:nowrap">교육 추정</span>';
  }

  function buildHTML(){
    const rows = ITEMS.map(it=>`
      <div style="display:flex;gap:10px;padding:9px 11px;background:#f8fdf9;border-radius:10px">
        <span style="font-size:18px;flex-shrink:0">${it.emoji}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
            <span style="font-size:12px;font-weight:700;color:#1a2e1a">${it.name}</span>
            ${badge(it.grade)}
          </div>
          <div style="font-size:11px;font-weight:800;color:var(--g2,#1a6b3a);margin-top:3px">${it.val}</div>
          <div style="font-size:10px;color:var(--sub,#7a8a7e);margin-top:3px;line-height:1.55"><b>🧮</b> ${it.basis}</div>
          <div style="font-size:10px;color:#9aa;margin-top:2px;line-height:1.5"><b>📊</b> ${it.src}</div>
        </div>
      </div>`).join('');

    return `
      <div style="font-size:11px;color:var(--sub,#7a8a7e);margin:10px 0 12px;line-height:1.75">
        아래 숫자는 <b>행동을 응원하기 위한 교육용 추정치</b>예요. 정밀 탄소회계가 아니며,
        실제 배출·절감은 상황에 따라 달라요. <b>등급 배지</b>로 근거 수준을 솔직하게 표시했어요.
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;font-size:9.5px">
        <span style="display:flex;align-items:center;gap:4px">${badge('measured')} <span style="color:#7a8a7e">정부 1차 통계로 직접 산정</span></span>
        <span style="display:flex;align-items:center;gap:4px">${badge('cited')} <span style="color:#7a8a7e">공개 인용값</span></span>
        <span style="display:flex;align-items:center;gap:4px">${badge('estimate')} <span style="color:#7a8a7e">교육용 추정</span></span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">${rows}</div>
      <div style="margin-top:12px;padding:10px 12px;background:#fff8e1;border-radius:10px;border:1px solid #f1c40f;font-size:10px;color:#8B5E04;line-height:1.75">
        ⚠️ B2C 미션 숫자는 <b>참여 동기부여용 추정치</b>예요. 정밀 탄소회계가 필요한 기업용(Scope 3) 데이터는
        <b>출퇴근 통근 실측 기록</b>을 별도로 제공해요.<br/>
        📚 출처: 철도통계연보(2021) · 온실가스종합정보센터(GIR) 전력배출계수(2023) · 기후솔루션 메탄보고서(2024.7) ·
        한국일보 한끼밥상(2021) · 녹색연합/그린포스트(2018·2020) 등. 각 항목 출처는 위에 표기.
      </div>`;
  }

  function findContainer(){
    // 1) 명시적 id
    let box = document.getElementById('co2BasisBox');
    if(box) return box;
    // 2) "CO₂ 절감량 계산 기준" summary 가진 details 의 내부 div 찾기
    const sums = document.querySelectorAll('summary, span');
    for(const el of sums){
      if((el.textContent||'').includes('CO₂ 절감량 계산 기준')){
        const details = el.closest('details') || el.parentElement?.parentElement;
        if(details){
          // summary 다음의 컨텐츠 div
          const content = details.querySelector('div');
          if(content) return content;
        }
      }
    }
    return null;
  }

  function apply(){
    const box = findContainer();
    if(!box){ setTimeout(apply, 800); return; }
    if(box._co2BasisDone) return;
    box.innerHTML = buildHTML();
    box._co2BasisDone = true;
    console.log('%c[co2_basis v1] 계산기준 화면 교체(추정치 프레이밍+출처/연도)','color:#fff;background:#1a6b3a;padding:3px 7px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', ()=>setTimeout(apply, 1200));
  else setTimeout(apply, 1200);
})();
