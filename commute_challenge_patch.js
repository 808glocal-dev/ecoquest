/* =====================================================
   EcoQuest – commute_challenge_patch.js
   출근·출장 챌린지 (Scope 3 Cat.7 / Cat.6)
   ─────────────────────────────────────────────────────
   • MISSIONS / CHALLENGES 배열에 출근·출장 미션 추가
   • 소속(통근) 탭에도 출근·출장 챌린지 진입 카드 노출
   • 참여 → 사진 인증(카메라 L1·L2 강제) → 미션 완료 → verifications 저장
   ─────────────────────────────────────────────────────
   ★ 로드 위치: commute_patch.js 뒤
   ※ co2 값은 잠정 추정치 — 통근 등록(거리·수단) 연동 시 정밀화 예정
   ===================================================== */
(function(){
  'use strict';
  if(window._commuteChalLoaded) return;
  window._commuteChalLoaded = true;

  /* ── 1) 미션·챌린지 배열에 추가 ── */
  function inject(){
    if(typeof MISSIONS === 'undefined' || typeof CHALLENGES === 'undefined'){
      setTimeout(inject, 500); return;
    }
    try {
      if(!MISSIONS.find(m=>m.id==='m_commute')){
        MISSIONS.push(
          {id:"m_commute",emoji:"🚇",name:"친환경 출근 인증",point:80,co2:1.17,
           kw:"대중교통, 지하철, 버스, 자전거, 도보, 출근, 통근, 정류장, 역, 승강장"},
          {id:"m_trip",emoji:"🚄",name:"친환경 출장 인증",point:150,co2:5.0,
           kw:"KTX, 기차, 고속버스, 대중교통, 출장, 역, 승차권, 탑승권, 플랫폼, 열차"}
        );
      }
      if(!CHALLENGES.find(c=>c.id===101)){
        CHALLENGES.push(
          {id:101,emoji:"🚇",title:"친환경 출근 챌린지",
           desc:"대중교통·자전거·도보로 출근하고 사진으로 인증해요! 검증된 통근(Scope 3) 1차 데이터가 쌓여요. 회사 단위 탄소 감축의 핵심이에요.",
           tag:"🚌 교통",baseParticipants:0,hot:true,missionId:"m_commute",
           freqOptions:["daily","w5","w3"]},
          {id:102,emoji:"🚄",title:"친환경 출장 챌린지",
           desc:"비행기·자가용 대신 KTX·대중교통으로 출장하고 사진으로 인증해요! 검증된 출장(Scope 3) 1차 데이터가 쌓여요.",
           tag:"🚌 교통",baseParticipants:0,hot:false,missionId:"m_trip",
           freqOptions:["w1","w3"]}
        );
      }
      // category_section_patch 는 window.CHALLENGES 를 참조 → 동기화 보장
      if(window.MISSIONS && window.MISSIONS !== MISSIONS && !window.MISSIONS.find(m=>m.id==='m_commute')){
        window.MISSIONS.push(...MISSIONS.filter(m=>m.id==='m_commute'||m.id==='m_trip'));
      } else if(!window.MISSIONS){ window.MISSIONS = MISSIONS; }
      if(window.CHALLENGES && window.CHALLENGES !== CHALLENGES && !window.CHALLENGES.find(c=>c.id===101)){
        window.CHALLENGES.push(...CHALLENGES.filter(c=>c.id===101||c.id===102));
      } else if(!window.CHALLENGES){ window.CHALLENGES = CHALLENGES; }
      window.renderOfficialChallenges && window.renderOfficialChallenges();
      // 카테고리 섹션 다시 그리도록 플래그 리셋
      const _sec = document.getElementById('sec-official');
      if(_sec) _sec.removeAttribute('data-reorganized');
      console.log('[commute_challenge] 출근·출장 챌린지 추가 완료 (tag: 🚌 교통)');
    } catch(e){
      console.error('[commute_challenge] MISSIONS/CHALLENGES 접근 실패:', e);
    }
  }

  /* ── 2) 소속(통근) 탭에 진입 카드 ── */
  function injectCompanyEntry(){
    const page = document.getElementById('page-company');
    if(!page) return;
    // 챌린지가 배열에 들어간 뒤에만
    if(typeof CHALLENGES === 'undefined' || !CHALLENGES.find(c=>c.id===101)) return;
    if(document.getElementById('commuteChalEntry')) return;

    const wrap = document.createElement('div');
    wrap.id = 'commuteChalEntry';
    wrap.style.cssText = 'margin:16px 12px 4px';
    wrap.innerHTML = `
      <div style="font-size:13px;font-weight:900;color:#1a2e1a;margin-bottom:10px">🚊 통근·출장 챌린지 <span style="font-size:10px;color:#7a9a7a;font-weight:600">· Scope 3 사진 인증</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div onclick="window.openChal&&window.openChal(101)" style="background:linear-gradient(135deg,#0d47a1,#1976d2);border-radius:14px;padding:16px 14px;color:#fff;cursor:pointer;text-align:center;box-shadow:0 4px 12px rgba(13,71,161,.2)">
          <div style="font-size:32px;line-height:1">🚇</div>
          <div style="font-size:13px;font-weight:900;margin-top:8px">친환경 출근</div>
          <div style="font-size:10px;color:rgba(255,255,255,.82);margin-top:3px">대중교통·자전거·도보 인증</div>
        </div>
        <div onclick="window.openChal&&window.openChal(102)" style="background:linear-gradient(135deg,#1565c0,#42a5f5);border-radius:14px;padding:16px 14px;color:#fff;cursor:pointer;text-align:center;box-shadow:0 4px 12px rgba(21,101,192,.2)">
          <div style="font-size:32px;line-height:1">🚄</div>
          <div style="font-size:13px;font-weight:900;margin-top:8px">친환경 출장</div>
          <div style="font-size:10px;color:rgba(255,255,255,.82);margin-top:3px">KTX·대중교통 인증</div>
        </div>
      </div>`;

    // 통근 등록 카드(#commuteEntry) 바로 뒤에 삽입, 없으면 맨 끝
    const entry = document.getElementById('commuteEntry');
    if(entry){
      entry.insertAdjacentElement('afterend', wrap);
    } else {
      page.appendChild(wrap);
    }
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', ()=>setTimeout(inject, 1500));
  else
    setTimeout(inject, 1500);

  // 소속 탭은 다른 patch가 다시 그릴 수 있어 주기적으로 재삽입
  setInterval(injectCompanyEntry, 1500);
  setTimeout(injectCompanyEntry, 1700);
})();
