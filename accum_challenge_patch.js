/* =====================================================
   EcoQuest – accum_challenge_patch.js  v1
   일회성·드문 행동 챌린지를 "누적형"으로 전환
   ─────────────────────────────────────────────────────
   대상(ACCUM_IDS): 102 출장, 17 무공해차, 18 친환경제품,
                    20 폐휴대폰, 22 나무심기, 23 태양광, 24 재생원료
   누적형 = 기간·목표·완주·실패 페널티 없음. "할 때마다 1건 기록".
   ─────────────────────────────────────────────────────
   하는 일
   1) joinChal 후킹: 누적형은 endDate=null, accum:true 로 참여 (실패 판정 제외)
   2) checkFailedChallenges 후킹: 기존에 박힌 endDate 제거(마이그레이션) → 페널티 방지
   3) cancelChal 후킹: 누적형은 차감 없이 자유 중단
   4) renderHomeChalls 오버라이드: 누적형 카드는 "누적 N건"으로 표시
   ★ 로드 위치: commute_challenge_patch.js 뒤
   ===================================================== */
(function(){
  'use strict';
  if(window._accumChalLoaded) return;
  window._accumChalLoaded = true;

  const ACCUM_IDS = [102, 17, 18, 20, 22, 23, 24];
  window.ACCUM_IDS = ACCUM_IDS;
  const isAccum = (id, ac) => ACCUM_IDS.includes(id) || (ac && ac.accum);

  /* ── 1) 참여(joinChal) 후킹 — 누적형은 기간·목표 없이 ── */
  function hookJoin(){
    if(window._accumJoinHooked) return;
    if(typeof window.joinChal !== 'function'){ setTimeout(hookJoin, 500); return; }
    const _orig = window.joinChal;
    window.joinChal = async function(title, cid){
      if(!ACCUM_IDS.includes(cid)) return _orig.apply(this, arguments);
      try{ window.closeOv && window.closeOv('ovChal'); }catch(e){}
      if(!window.ME){ window.toast && toast('로그인이 필요해요!'); return; }
      const ch = (window.CHALLENGES||[]).find(x=>x.id===cid); if(!ch) return;
      const active = window.UDATA?.activeChallenges || [];
      if(active.some(a=>a.challengeId===cid)){ window.toast && toast('이미 참여 중이에요!'); return; }
      const startDate = new Date().toISOString().split('T')[0];
      const entry = { challengeId:cid, challengeTitle:title, emoji:ch.emoji, missionId:ch.missionId,
        accum:true, freq:'accum', weeks:0, startDate, endDate:null };
      try{
        const newActive = [...active, entry];
        await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid), { activeChallenges:newActive });
        window.UDATA.activeChallenges = newActive;
        window.renderTodayQuests && window.renderTodayQuests(window.ME.uid);
        window.renderHomeChalls && window.renderHomeChalls();
        try{ await window.FB.setDoc(window.FB.doc(window.FB.db,'stats','challenges'),{[`c${cid}`]:window.FB.increment(1)},{merge:true}); }catch(e){}
        window.renderOfficialChallenges && window.renderOfficialChallenges();
        window.toast && toast(`🎉 "${title}" 시작! 할 때마다 기록돼요`);
      }catch(e){ window.toast && toast('참여 실패: '+e.message); }
    };
    window._accumJoinHooked = true;
  }

  /* ── 2) 실패 판정 후킹 — 누적형 endDate 제거(마이그레이션) ── */
  async function migrateAccum(uid){
    try{
      const active = window.UDATA?.activeChallenges || [];
      let changed = false;
      active.forEach(ac=>{
        if(ACCUM_IDS.includes(ac.challengeId) && (ac.endDate || !ac.accum)){
          ac.endDate = null; ac.accum = true; ac.freq = 'accum'; ac.weeks = 0; changed = true;
        }
      });
      if(changed && uid && window.FB){
        window.UDATA.activeChallenges = active;
        await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',uid), { activeChallenges:active });
      }
    }catch(e){ console.log('[accum] migrate skip', e.message); }
  }
  function hookFailed(){
    if(window._accumFailedHooked) return;
    if(typeof window.checkFailedChallenges !== 'function'){ setTimeout(hookFailed, 500); return; }
    const _orig = window.checkFailedChallenges;
    window.checkFailedChallenges = async function(uid){
      await migrateAccum(uid);           // 누적형 endDate 먼저 제거 → 페널티 대상에서 빠짐
      return _orig.apply(this, arguments);
    };
    window._accumFailedHooked = true;
  }

  /* ── 3) 취소(cancelChal) 후킹 — 누적형은 차감 없이 중단 ── */
  function hookCancel(){
    if(window._accumCancelHooked) return;
    if(typeof window.cancelChal !== 'function'){ setTimeout(hookCancel, 500); return; }
    const _orig = window.cancelChal;
    window.cancelChal = async function(cid){
      if(!ACCUM_IDS.includes(cid)) return _orig.apply(this, arguments);
      if(!window.ME) return;
      if(!confirm('이 기록 챌린지를 그만둘까요? (차감 없음)')) return;
      try{
        const newActive = (window.UDATA.activeChallenges||[]).filter(a=>a.challengeId!==cid);
        await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid), { activeChallenges:newActive });
        window.UDATA.activeChallenges = newActive;
        window.updateUI && window.updateUI();
        window.renderHomeChalls && window.renderHomeChalls();
        window.renderTodayQuests && window.renderTodayQuests(window.ME.uid);
        window.toast && toast('기록 챌린지를 그만뒀어요');
      }catch(e){ window.toast && toast('실패: '+e.message); }
    };
    window._accumCancelHooked = true;
  }

  /* ── 4) 홈 챌린지 카드 오버라이드 — 누적형은 "누적 N건" ── */
  function hookRenderHome(){
    if(window._accumHomeHooked) return;
    if(typeof window.renderHomeChalls !== 'function'){ setTimeout(hookRenderHome, 500); return; }

    window.renderHomeChalls = function(){
      const w = document.getElementById('homeChallList'); if(!w) return;
      const valid = (window.CHALLENGES||[]).map(c=>c.missionId);
      const active = (window.UDATA?.activeChallenges||[]).filter(ac=>valid.includes(ac.missionId));
      if(!active.length){
        w.innerHTML = `<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">
          참여 중인 챌린지가 없어요!<br/>
          <button onclick="goPage('chal')" style="margin-top:10px;background:var(--g1);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">챌린지 참여하기 🌱</button>
        </div>`;
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      w.innerHTML = active.map(ac=>{
        const chal = (window.CHALLENGES||[]).find(c=>c.id===ac.challengeId);
        if(!chal) return '';
        const doneToday = (window.UDATA?.verifiedDates||{})[ac.challengeId]===today;
        const completed = (window.UDATA?.completedDates||{})[ac.challengeId]||0;

        /* ===== 누적형 카드 ===== */
        if(isAccum(ac.challengeId, ac)){
          return `<div style="background:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1.5px solid var(--g1)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer" onclick="openChal(${chal.id})">
                <span style="font-size:24px">${chal.emoji}</span>
                <div>
                  <div style="font-size:13px;font-weight:700;color:var(--txt)">${chal.title}</div>
                  <div style="font-size:11px;color:var(--sub);margin-top:2px">할 때마다 기록 · 목표·기한 없음</div>
                </div>
              </div>
              <span style="background:#e8f5e9;color:var(--g2);font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px">누적 ${completed}건</span>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:6px">
              ${doneToday
                ? `<span style="background:#e8f5e9;color:var(--g2);font-size:11px;font-weight:700;padding:5px 12px;border-radius:8px">✅ 오늘 기록완료</span>`
                : `<button onclick="startChalVerify(${ac.challengeId})" style="background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;border:none;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">＋ 기록하기</button>`}
              <button onclick="event.stopPropagation();cancelChal(${ac.challengeId})" style="background:#fff0f0;color:var(--red);border:none;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">그만</button>
            </div>
          </div>`;
        }

        /* ===== 일반(반복형) 카드 — 본체와 동일 ===== */
        const freqLabel = ac.freq==='daily'?'매일':ac.freq==='w5'?'주 5일':ac.freq==='w3'?'주 3일':'주 1일';
        const totalNeeded = ac.freq==='daily'?ac.weeks*7:ac.freq==='w5'?ac.weeks*5:ac.freq==='w3'?ac.weeks*3:ac.weeks*1;
        const pct = Math.min(100, Math.floor(completed/totalNeeded*100));
        const daysLeft = ac.endDate?Math.max(0,Math.ceil((new Date(ac.endDate)-new Date())/86400000)):'?';
        return `<div style="background:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1.5px solid var(--g1)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer" onclick="openChal(${chal.id})">
              <span style="font-size:24px">${chal.emoji}</span>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--txt)">${chal.title}</div>
                <div style="font-size:11px;color:var(--sub);margin-top:2px">${freqLabel} · ${ac.weeks}주 · ${daysLeft}일 남음</div>
              </div>
            </div>
            <span style="background:#e8f5e9;color:var(--g2);font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px">${completed}/${totalNeeded}</span>
          </div>
          <div style="background:#e0f2e7;border-radius:6px;height:6px;overflow:hidden;margin-bottom:8px">
            <div style="width:${pct}%;background:linear-gradient(90deg,var(--g1),var(--acc));height:100%;border-radius:6px;transition:width .5s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
            <span style="font-size:11px;color:var(--sub)">${pct}% 달성</span>
            <div style="display:flex;gap:6px">
              ${doneToday
                ? `<span style="background:#e8f5e9;color:var(--g2);font-size:11px;font-weight:700;padding:5px 12px;border-radius:8px">✅ 오늘 인증완료</span>`
                : `<button onclick="startChalVerify(${ac.challengeId})" style="background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;border:none;border-radius:8px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">📸 인증하기</button>`}
              <button onclick="event.stopPropagation();cancelChal(${ac.challengeId})" style="background:#fff0f0;color:var(--red);border:none;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">취소</button>
            </div>
          </div>
        </div>`;
      }).join('');
    };
    window._accumHomeHooked = true;
  }

  /* ── 부팅 ── */
  function boot(){
    hookJoin(); hookFailed(); hookCancel(); hookRenderHome();
    // 이미 로그인 상태면 즉시 마이그레이션 + 재렌더
    setTimeout(async ()=>{
      if(window.ME && window.UDATA){
        await migrateAccum(window.ME.uid);
        window.renderHomeChalls && window.renderHomeChalls();
        window.renderTodayQuests && window.renderTodayQuests(window.ME.uid);
      }
    }, 2000);
    console.log('%c[accum_challenge v1] 누적형 챌린지 전환','color:#fff;background:#1a6b3a;padding:4px 8px;border-radius:4px;font-weight:bold');
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot, 1600));
  else setTimeout(boot, 1600);
})();
