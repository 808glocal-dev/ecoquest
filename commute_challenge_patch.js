/* =====================================================
   EcoQuest – commute_challenge_patch.js
   출근·출장 챌린지 (Scope 3 Cat.7 / Cat.6)
   ─────────────────────────────────────────────────────
   • 기존 MISSIONS / CHALLENGES 배열에 출근·출장 미션을 추가
   • 참여 → 사진 인증(카메라 L1·L2 강제) → 미션 완료 → verifications 저장
   • "검증된 통근/출장 1차 데이터"가 쌓이는 챌린지
   ─────────────────────────────────────────────────────
   ★ 로드 위치: commute_patch.js 뒤
   ※ co2 값은 잠정 추정치 — 통근 등록(거리·수단) 연동 시 정밀화 예정
   ===================================================== */
(function(){
  'use strict';
  if(window._commuteChalLoaded) return;
  window._commuteChalLoaded = true;

  function inject(){
    // 메인 스크립트의 전역 MISSIONS / CHALLENGES 배열에 접근
    if(typeof MISSIONS === 'undefined' || typeof CHALLENGES === 'undefined'){
      setTimeout(inject, 500); return;
    }
    try {
      // ── 미션 추가 ──
      if(!MISSIONS.find(m=>m.id==='m_commute')){
        MISSIONS.push(
          {id:"m_commute",emoji:"🚇",name:"친환경 출근 인증",point:80,co2:1.17,
           kw:"대중교통, 지하철, 버스, 자전거, 도보, 출근, 통근, 정류장, 역, 승강장"},
          {id:"m_trip",emoji:"🚄",name:"친환경 출장 인증",point:150,co2:5.0,
           kw:"KTX, 기차, 고속버스, 대중교통, 출장, 역, 승차권, 탑승권, 플랫폼, 열차"}
        );
      }
      // ── 챌린지 추가 ──
      if(!CHALLENGES.find(c=>c.id===101)){
        CHALLENGES.push(
          {id:101,emoji:"🚇",title:"친환경 출근 챌린지",
           desc:"대중교통·자전거·도보로 출근하고 사진으로 인증해요! 검증된 통근(Scope 3) 1차 데이터가 쌓여요. 회사 단위 탄소 감축의 핵심이에요.",
           tag:"🏢 통근 Scope3",baseParticipants:0,hot:true,missionId:"m_commute",
           freqOptions:["daily","w5","w3"]},
          {id:102,emoji:"🚄",title:"친환경 출장 챌린지",
           desc:"비행기·자가용 대신 KTX·대중교통으로 출장하고 사진으로 인증해요! 검증된 출장(Scope 3) 1차 데이터가 쌓여요.",
           tag:"🏢 출장 Scope3",baseParticipants:0,hot:false,missionId:"m_trip",
           freqOptions:["w1","w3"]}
        );
      }
      // 공식 챌린지 그리드 다시 그리기 (추가분 노출)
      window.renderOfficialChallenges && window.renderOfficialChallenges();
      console.log('[commute_challenge] 출근·출장 챌린지 추가 완료');
    } catch(e){
      console.error('[commute_challenge] MISSIONS/CHALLENGES 접근 실패:', e);
    }
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject, 1500));
  else
    setTimeout(inject, 1500);
})();
