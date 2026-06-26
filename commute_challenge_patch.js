/* =====================================================
   EcoQuest – commute_challenge_patch.js  v3
   출근 챌린지 (Scope 3 Cat.7) — 체크인형 + 정직 표시
   ─────────────────────────────────────────────────────
   v2 → v3 변경점
   • 배출계수를 자체 보유하지 않고 window.ECOQUEST_EF(공용)만 참조
   • 체크인 시 "실제배출 + 회피배출" 둘 다 화면에 표시 (절감만 보여주지 않음)
   • 출처·계산식 설명 박스 자동 노출 (ecoEfExplain)
   • 미션 co2(고정 1.17) 대신 등록거리×수단 → 회피배출을 m.co2로 적립
   • commuteLogs 에 actualKg(실제)·avoidedKg(회피) 둘 다 저장 → 보고서 A·B용
   • 출장(102)은 누적형 패치에서 별도 → 여기선 출근(101)만
   ★ 로드 위치: emission_factors_patch.js → commute_patch.js 뒤
   ===================================================== */
(function(){
  'use strict';
  if(window._commuteChalLoaded) return;
  window._commuteChalLoaded = true;

  const COMMUTE_CHAL_IDS = [101];
  window.COMMUTE_CHAL_IDS = COMMUTE_CHAL_IDS;
  function EF(){ return window.ECOQUEST_EF || {}; }

  function inject(){
    if(typeof MISSIONS === 'undefined' || typeof CHALLENGES === 'undefined' || !window.ECOQUEST_EF){
      setTimeout(inject, 500); return;
    }
    try {
      if(!MISSIONS.find(m=>m.id==='m_commute')){
        MISSIONS.push(
          {id:"m_commute",emoji:"🚇",name:"친환경 출근 인증",point:80,co2:1.17,
           kw:"대중교통, 지하철, 버스, 자전거, 도보, 출근, 통근"},
          {id:"m_trip",emoji:"🚄",name:"친환경 출장 인증",point:150,co2:5.0,
           kw:"KTX, 기차, 고속버스, 대중교통, 출장"}
        );
      }
      if(!CHALLENGES.find(c=>c.id===101)){
        CHALLENGES.push(
          {id:101,emoji:"🚇",title:"친환경 출근 챌린지",
           desc:"등록한 집↔회사 경로로 친환경 출근을 '체크인'해요! 사진 대신 1탭, 그날의 통근이 실제배출·회피배출과 함께 검증된 Scope 3 데이터로 쌓여요.",
           tag:"🏢 통근 Scope3",baseParticipants:0,hot:true,missionId:"m_commute",
           freqOptions:["daily","w5","w3"]},
          {id:102,emoji:"🚄",title:"친환경 출장 챌린지",
           desc:"비행기·자가용 대신 KTX·대중교통 출장을 기록해요! 검증된 출장(Scope 3) 1차 데이터가 쌓여요.",
           tag:"🏢 출장 Scope3",baseParticipants:0,hot:false,missionId:"m_trip",
           freqOptions:["w1","w3"]}
        );
      }
      window.renderOfficialChallenges && window.renderOfficialChallenges();
      console.log('[commute_challenge v3] 출근 챌린지(체크인+정직표시) 등록');
    } catch(e){
      console.error('[commute_challenge v3] MISSIONS/CHALLENGES 접근 실패:', e);
    }
  }

  window.openCommuteCheckin = async function(chalId){
    if(!window.ME || !window.FB){ window.toast && toast('로그인이 필요해요'); return; }
    const ac = (window.UDATA?.activeChallenges||[]).find(a=>a.challengeId===chalId);
    if(!ac){ window.toast && toast('먼저 챌린지에 참여해주세요'); return; }
    const today = new Date().toISOString().split("T")[0];
    if((window.UDATA?.verifiedDates||{})[chalId] === today){
      window.toast && toast('오늘 이미 체크인했어요! 내일 또 ✅'); return;
    }
    const commute = window.UDATA?.commute || null;
    if(!commute || !commute.distanceKm || !commute.mode){ showCommuteSetupPrompt(); return; }
    showCheckinSheet(chalId, commute);
  };

  function showCommuteSetupPrompt(){
    const old = document.getElementById('ovCmkSetup'); if(old) old.remove();
    const ov = document.createElement('div');
    ov.id='ovCmkSetup'; ov.className='overlay on';
    ov.innerHTML = `<div class="modal" style="padding:24px 20px 22px">
      <div style="text-align:center">
        <div style="font-size:46px">📍</div>
        <div style="font-size:17px;font-weight:900;color:var(--txt);margin-top:8px">먼저 출퇴근 경로를 등록해요</div>
        <div style="font-size:13px;color:var(--sub);margin-top:8px;line-height:1.7">집↔회사를 한 번 등록하면,<br/>이후엔 <b>1탭으로 매일 체크인</b>할 수 있어요.<br/>그날의 통근이 검증된 데이터로 쌓여요.</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:18px">
        <button class="btn btn-gray" style="flex:1" onclick="document.getElementById('ovCmkSetup').remove()">나중에</button>
        <button class="btn btn-g" style="flex:1.4" onclick="document.getElementById('ovCmkSetup').remove();window.openCommute&&window.openCommute()">📍 경로 등록하기</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }

  function showCheckinSheet(chalId, commute){
    const ef = EF()[commute.mode] || {label:commute.mode, emoji:'🚊', g:0};
    const isGreen = commute.mode !== 'car';
    const calc = window.ecoCalcCommute(commute.distanceKm, commute.mode);
    const today = new Date();
    const timeStr = today.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});

    const old = document.getElementById('ovCmk'); if(old) old.remove();
    const ov = document.createElement('div');
    ov.id='ovCmk'; ov.className='overlay on';
    ov.innerHTML = `<div class="modal" style="padding:22px 20px 22px;max-height:88vh;overflow-y:auto">
      <div class="handle" onclick="closeOv('ovCmk')"></div>
      <button class="modal-close" onclick="closeOv('ovCmk')">✕</button>
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:44px">${ef.emoji}</div>
        <div style="font-size:17px;font-weight:900;color:var(--txt);margin-top:6px">오늘 친환경 출근 체크인</div>
        <div style="font-size:12px;color:var(--sub);margin-top:4px">📅 ${today.getMonth()+1}/${today.getDate()} · 지금 ${timeStr}</div>
      </div>
      <div style="background:#f0f7ff;border:1px solid #cfe3fb;border-radius:12px;padding:13px 14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#3a5ba0;margin-bottom:6px"><span>등록 경로 (편도)</span><span style="font-weight:700">${commute.distanceKm}km · 왕복 ${calc.roundTripKm}km</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#3a5ba0"><span>교통수단</span><span style="font-weight:700">${ef.emoji} ${ef.label}</span></div>
      </div>
      ${isGreen ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="background:#fff;border:1.5px solid #e0e0e0;border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#888;font-weight:700">오늘 실제 배출</div>
          <div style="font-size:20px;font-weight:900;color:#555;margin-top:3px">${calc.actualKg}<span style="font-size:11px">kg</span></div>
          <div style="font-size:9px;color:#aaa;margin-top:2px">대중교통도 0이 아니에요</div>
        </div>
        <div style="background:#f0fbf4;border:1.5px solid #a8e6c5;border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#1a6b3a;font-weight:700">승용차 대비 절감</div>
          <div style="font-size:20px;font-weight:900;color:#1a6b3a;margin-top:3px">${calc.avoidedKg}<span style="font-size:11px">kg</span></div>
          <div style="font-size:9px;color:#5a8a6a;margin-top:2px">회피배출(추정)</div>
        </div>
      </div>
      ${window.ecoEfExplain(commute.mode, {compact:true})}
      <div style="height:12px"></div>
      ` : `
      <div style="font-size:11px;color:#c0392b;background:#fff5f5;border-radius:10px;padding:9px;text-align:center;line-height:1.6;margin-bottom:14px">⚠️ 등록 수단이 '승용차'예요. 친환경 출근 챌린지는 대중교통·자전거·도보 대상이에요.<br/><button onclick="closeOv('ovCmk');window.openCommute&&window.openCommute()" style="background:none;border:none;color:#1976d2;font-weight:700;font-size:11px;cursor:pointer;font-family:inherit;text-decoration:underline;margin-top:4px">수단 변경하기</button></div>
      `}
      <button class="btn ${isGreen?'btn-g':'btn-gray'}" id="cmkDoBtn" ${isGreen?'':'disabled'} onclick="window._doCommuteCheckin(${chalId})">✅ 오늘 친환경 출근 체크인</button>
    </div>`;
    document.body.appendChild(ov);
  }

  window._doCommuteCheckin = async function(chalId){
    const uid = window.ME?.uid;
    if(!uid || !window.FB) return;
    const ac = (window.UDATA?.activeChallenges||[]).find(a=>a.challengeId===chalId);
    const m = MISSIONS.find(x=>x.id===ac?.missionId);
    if(!ac || !m){ window.toast && toast('미션 정보를 찾을 수 없어요'); return; }
    const today = new Date().toISOString().split("T")[0];
    if((window.UDATA?.verifiedDates||{})[chalId] === today){
      closeOv('ovCmk'); window.toast && toast('오늘 이미 체크인했어요 ✅'); return;
    }
    const btn = document.getElementById('cmkDoBtn');
    if(btn){ btn.disabled = true; btn.textContent = '체크인 중...'; }
    const commute = window.UDATA?.commute || {};
    const calc = window.ecoCalcCommute(commute.distanceKm, commute.mode);
    try {
      const mForSave = { ...m, co2: calc.avoidedKg };
      await window.saveMission(uid, mForSave);
      const vd = window.UDATA.verifiedDates || {}; vd[chalId] = today;
      const cd = window.UDATA.completedDates || {}; cd[chalId] = (cd[chalId]||0)+1;
      window.UDATA.verifiedDates = vd; window.UDATA.completedDates = cd;
      await window.FB.updateDoc(window.FB.doc(window.FB.db,"users",uid),{verifiedDates:vd,completedDates:cd});
      await window.FB.addDoc(window.FB.collection(window.FB.db,"commuteLogs"),{
        uid, companyId: window.UDATA?.companyId || null,
        challengeId: chalId, type:'commute',
        mode: commute.mode, modeLabel: (EF()[commute.mode]?.label)||commute.mode,
        distanceKm: Number(commute.distanceKm)||0, roundTripKm: calc.roundTripKm,
        efG: calc.ef.g, efGrade: calc.ef.grade,
        actualKg: calc.actualKg, avoidedKg: calc.avoidedKg,
        date: today, ts: window.FB.serverTimestamp()
      });
      closeOv('ovCmk');
      window.renderHomeChalls && window.renderHomeChalls();
      window.renderTodayQuests && window.renderTodayQuests(uid);
      window.toast && toast(`✅ 체크인! 실제 ${calc.actualKg}kg · 절감 ${calc.avoidedKg}kg`);
    } catch(e){
      console.error('[commute_checkin] 실패', e);
      window.toast && toast('체크인 실패: '+e.message);
      if(btn){ btn.disabled=false; btn.textContent='✅ 오늘 친환경 출근 체크인'; }
    }
  };

  function hookRouting(){
    if(!window._cmkStartHooked && typeof window.startChalVerify === 'function'){
      const _orig = window.startChalVerify;
      window.startChalVerify = function(chalId){
        if(COMMUTE_CHAL_IDS.includes(chalId)){ return window.openCommuteCheckin(chalId); }
        return _orig.apply(this, arguments);
      };
      window._cmkStartHooked = true;
    }
    if(!window._cmkOpenAIHooked && typeof window.openAI === 'function'){
      const _ai = window.openAI;
      window.openAI = function(m, uid, chalId){
        if(chalId && COMMUTE_CHAL_IDS.includes(chalId)){ return window.openCommuteCheckin(chalId); }
        return _ai.apply(this, arguments);
      };
      window._cmkOpenAIHooked = true;
    }
    if(!window._cmkStartHooked || !window._cmkOpenAIHooked) setTimeout(hookRouting, 600);
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(inject,1500); setTimeout(hookRouting,1800); });
  else { setTimeout(inject,1500); setTimeout(hookRouting,1800); }
})();
