/* =====================================================
   EcoQuest – emission_factors_patch.js  v1
   교통수단별 배출계수(EF) 단일 정의 — 출처·계산식·등급 포함
   ─────────────────────────────────────────────────────
   ★ 모든 통근/대중교통 계산은 이 파일의 window.ECOQUEST_EF 만 참조
     → 계수 바꿀 일 생기면 여기 한 곳만 수정하면 앱·보고서 전부 반영
   ★ 로드 위치: commute_patch.js / commute_challenge_patch.js "앞"
   ─────────────────────────────────────────────────────
   값 단위: gCO₂(eq)/km (1인 기준)
   grade: 'measured' = 정부 1차 통계로 직접 산정
          'cited'    = 공개 인용값 (1차 미확보, 추후 검증)
   ===================================================== */
(function(){
  'use strict';
  if(window.ECOQUEST_EF) return;

  window.ECOQUEST_EF = {
    car: {
      g: 210, label: '승용차·택시', emoji: '🚗', grade: 'cited', isBaseline: true,
      source: '공개 인용값 (그린피스코리아·언론 다수 일치)',
      formula: '승용차 1km 주행 시 약 210gCO₂ (1인 탑승 기준). 친환경 통근의 회피배출 산정용 baseline.',
      note: '여러 출처가 210g로 일치. 회피배출 계산의 비교 기준값으로 사용.'
    },
    bus: {
      g: 27.7, label: '버스', emoji: '🚌', grade: 'cited',
      source: '공개 인용값 (그린피스코리아 등)',
      formula: '버스 1인·km당 약 27.7gCO₂ (평균 재차인원 반영된 1인 기준).',
      note: '정부가 버스의 「연료소비÷인km」를 한 통계로 공표하지 않아 1차 산정 미확보. 공개 인용값 사용, 추후 KOTEMS 실측 확인 시 교체.'
    },
    subway: {
      g: 20.79, label: '지하철·전철', emoji: '🚇', grade: 'measured',
      source: '정부 1차 통계 직접 산정 — 2021 철도통계연보 + GIR 전력배출계수',
      formula: '서울교통공사 2021 전철전력 781,077,082 kWh ÷ 승차실적 15,676백만 인·km × GIR 전력 소비단계수 0.4173 kgCO₂eq/kWh = 20.79 gCO₂eq/인·km',
      note: '흔히 인용되는 1.53g은 실측 대비 약 13배 과소. 본 값은 정부 1차 통계로 직접 계산.'
    },
    walk_bike: {
      g: 0, label: '도보·자전거', emoji: '🚶', grade: 'measured',
      source: '직접배출 없음',
      formula: '운행 단계 직접 탄소배출 0.',
      note: '연료·전력을 쓰지 않으므로 운행 직접배출 0.'
    }
  };

  // baseline(승용차) 계수 — 회피배출 계산 기준
  window.ECOQUEST_EF_BASELINE_G = window.ECOQUEST_EF.car.g;

  /* 거리(편도 km)·수단 → 실제배출/회피배출 (kg) 계산
     반환: { actualKg, avoidedKg, roundTripKm, ef } */
  window.ecoCalcCommute = function(distanceKmOneway, mode){
    const ef = window.ECOQUEST_EF[mode] || window.ECOQUEST_EF.walk_bike;
    const baseG = window.ECOQUEST_EF_BASELINE_G;
    const rt = (Number(distanceKmOneway)||0) * 2;          // 왕복
    const actualKg  = +(rt * ef.g / 1000).toFixed(3);       // 실제 배출
    const avoidedKg = +(rt * Math.max(0, baseG - ef.g) / 1000).toFixed(3); // 승용차 대비 회피
    return { actualKg, avoidedKg, roundTripKm: +rt.toFixed(2), ef };
  };

  /* 챌린지/모달에 붙일 "출처·계산식" 설명 HTML (수단 1개) */
  window.ecoEfExplain = function(mode, opts){
    const ef = window.ECOQUEST_EF[mode]; if(!ef) return '';
    const compact = opts && opts.compact;
    const badge = ef.grade === 'measured'
      ? '<span style="background:#1a6b3a;color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px">정부 1차 통계 직접 산정</span>'
      : '<span style="background:#8a6d00;color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px">공개 인용값</span>';
    return `<div style="background:#f6faf7;border:1px solid #d8eedd;border-radius:10px;padding:${compact?'9px 11px':'12px 14px'};font-size:11px;color:#33493a;line-height:1.65">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <span style="font-size:15px">${ef.emoji}</span>
        <b style="font-size:12px;color:#1a2e1a">${ef.label} · ${ef.g} gCO₂/${mode==='car'?'km':'인·km'}</b>
        ${badge}
      </div>
      <div style="margin-bottom:3px"><b>📊 출처</b> · ${ef.source}</div>
      <div style="margin-bottom:3px"><b>🧮 계산</b> · ${ef.formula}</div>
      <div style="color:#7a8a7e"><b>ℹ️</b> ${ef.note}</div>
    </div>`;
  };

  console.log('%c[emission_factors v1] 🌍 EF 단일정의 로드 (지하철 20.79 실측)','color:#fff;background:#1a6b3a;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
