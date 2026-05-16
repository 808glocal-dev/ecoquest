// gemini_patch.js
(function(){
  'use strict';

  // 우리만의 상태 (원본 _curM 등이 모듈 스코프라 외부 접근 불가능해서)
  const EQ = window.EQ = window.EQ || {};
  EQ.curMission = null;
  EQ.curUid = null;
  EQ.curChalId = null;
  EQ.passed = false;

  function init(){
    /* 1. openAI 후킹 — 미션 정보 백업 */
    if(!window._eqOpenAIHooked){
      const origOpenAI = window.openAI;
      window.openAI = function(m, uid, chalId){
        EQ.curMission = m;
        EQ.curUid = uid;
        EQ.curChalId = chalId || null;
        EQ.passed = false;
        window._curM = m; // success_popup_patch.js 호환
        return origOpenAI.apply(this, arguments);
      };
      window._eqOpenAIHooked = true;
    }

    /* 2. 사진 다시 선택 시 passed 리셋 */
    const fileIn = document.getElementById('fileIn');
    if(fileIn && !fileIn._eqHooked){
      fileIn.addEventListener('change', () => { EQ.passed = false; });
      fileIn._eqHooked = true;
    }

    /* 3. doAnalyze 통째 교체 — Gemini API 호출 */
    window.doAnalyze = async function(){
      const imgEl = document.getElementById('prevImg');
      if(!imgEl || !imgEl.src.startsWith('data:')) return;
      const b64 = imgEl.src.split(',')[1];
      if(!b64 || !EQ.curMission) return;

      const btn = document.getElementById('btnAnalyze');
      btn.disabled = true;
      btn.textContent = '✨ 확인 중...';

      const res = document.getElementById('aiRes');
      res.className = 'ai-res analyzing';
      res.style.display = 'block';
      document.getElementById('aiResT').textContent = '✨ 사진을 확인하고 있어요...';
      document.getElementById('aiResTxt').textContent = '잠시만 기다려주세요!';
      document.getElementById('scoreRow').style.display = 'none';
      document.getElementById('scanOv').classList.add('on');

      try {
        const r = await fetch('/api/verify-mission', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            imageBase64: b64,
            missionName: EQ.curMission.name,
            missionKeywords: EQ.curMission.kw || EQ.curMission.name
          })
        });

        if(!r.ok){
          const errText = await r.text();
          throw new Error('서버 ' + r.status + ': ' + errText);
        }

        const data = await r.json();
        document.getElementById('scanOv').classList.remove('on');

        if(data.passed){
          res.className = 'ai-res ok';
          document.getElementById('aiResT').textContent = '✅ ' + (data.title || '인증 완료!');
          document.getElementById('aiResTxt').textContent = data.comment || '잘 하셨어요!';
          EQ.passed = true;
          btn.style.display = 'none';
          document.getElementById('btnDone').style.display = '';
          document.getElementById('pubToggle').style.display = 'block';
          document.getElementById('scoreRow').style.display = 'flex';
          const fill = document.getElementById('scoreFill');
          fill.style.width = (data.score || 85) + '%';
          fill.style.background = 'var(--g1)';
          document.getElementById('scoreLbl').textContent = (data.score || 85) + '점';
        } else {
          res.className = 'ai-res fail';
          document.getElementById('aiResT').textContent = '❌ ' + (data.title || '인증 실패');
          document.getElementById('aiResTxt').textContent = data.comment || '사진을 다시 확인해주세요!';
          btn.disabled = false;
          btn.textContent = '✨ 다시 확인';
        }
      } catch(e){
        document.getElementById('scanOv').classList.remove('on');
        console.error('[gemini_patch] 분석 오류', e);
        res.className = 'ai-res fail';
        document.getElementById('aiResT').textContent = '⚠️ 서버 연결 실패';
        document.getElementById('aiResTxt').textContent = 'API 키 또는 네트워크를 확인해주세요!';
        btn.disabled = false;
        btn.textContent = '✨ 다시 시도';
      }
    };

    /* 4. doComplete 통째 교체 — 원본 로직 복제 + 성공 팝업 트리거 */
    window.doComplete = async function(){
      if(!EQ.passed || !EQ.curMission || !EQ.curUid){
        window.toast && window.toast('먼저 사진을 확인해주세요!');
        return;
      }

      const btn = document.getElementById('btnDone');
      btn.disabled = true;
      btn.textContent = '저장 중...';

      const treeCountText = document.getElementById('treeCountDisp')?.textContent || '1그루';
      const treeCount = parseInt(treeCountText) || 1;
      const pubBtn = document.getElementById('pubBtn');
      const isPublic = pubBtn?.classList.contains('on') !== false;

      const m = EQ.curMission;
      const uid = EQ.curUid;
      const chalId = EQ.curChalId;

      const missionToSave = m.id === 'm27'
        ? {...m, co2: parseFloat((treeCount*5.0).toFixed(2)), point: treeCount*3000}
        : m;

      try {
        const ok = await window.saveMission(uid, missionToSave);
        if(!ok){ btn.disabled=false; btn.textContent='✅ 완료!'; return; }

        if(chalId){
          const today = new Date().toISOString().split('T')[0];
          const vd = window.UDATA.verifiedDates || {};
          vd[chalId] = today;
          const cd = window.UDATA.completedDates || {};
          cd[chalId] = (cd[chalId]||0) + 1;
          window.UDATA.verifiedDates = vd;
          window.UDATA.completedDates = cd;
          await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',uid), {verifiedDates:vd, completedDates:cd});

          const ac = (window.UDATA.activeChallenges||[]).find(a => a.challengeId === chalId);
          if(ac){
            const totalN = ac.freq==='daily'?ac.weeks*7
                         : ac.freq==='w5'?ac.weeks*5
                         : ac.freq==='w3'?ac.weeks*3
                         : ac.weeks*1;
            const doneN = cd[chalId];
            const alreadyBonus = (window.UDATA.chalBonusGranted||{})[chalId];
            if(doneN >= totalN && !alreadyBonus){
              const bonus = Math.round(doneN * m.point * 0.03);
              if(bonus > 0){
                const newP = (window.UDATA.point||0) + bonus;
                await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',uid), {
                  point: newP, [`chalBonusGranted.${chalId}`]: true
                });
                window.UDATA.point = newP;
                window.UDATA.chalBonusGranted = {...(window.UDATA.chalBonusGranted||{}), [chalId]: true};
                window.updateUI && window.updateUI();
                setTimeout(()=>window.toast && window.toast(`🏆 챌린지 완주! 보너스 +${bonus}P!`), 800);
              }
            }
          }
        }

        // 인증 사진 저장
        const comment = document.getElementById('verifComment')?.value?.trim() || '';
        const imgEl = document.getElementById('prevImg');
        if(imgEl?.src?.startsWith('data:')){
          const b64 = imgEl.src.split(',')[1];
          await window.saveVerification(uid, m, b64, isPublic, comment);
        }

        window.closeOv && window.closeOv('ovAI');
        const ci = document.getElementById('verifComment');
        if(ci) ci.value = '';

        window.renderTodayQuests && window.renderTodayQuests(uid);
        window.renderHomeChalls && window.renderHomeChalls();
        if(window.loadFeed) window.loadFeed();
        if(window.ME) window.loadMyVerifs(uid);

        // ★ 성공 팝업 직접 호출 (success_popup_patch.js의 ehShowSuccess)
        if(typeof window.ehShowSuccess === 'function'){
          setTimeout(()=>window.ehShowSuccess(missionToSave), 300);
        } else {
          window.toast && window.toast('🎉 +'+missionToSave.point+'P 적립! CO₂ -'+missionToSave.co2+'kg');
        }

        EQ.passed = false;
      } catch(e){
        console.error('[gemini_patch] doComplete 오류', e);
        window.toast && window.toast('저장 실패: ' + e.message);
      }

      btn.disabled = false;
      btn.textContent = '✅ 완료!';
    };

    console.log('[gemini_patch] ✅ Gemini AI 인증 연결됨');
  }

  function tryInit(){
    if(typeof window.openAI !== 'function'){ setTimeout(tryInit, 300); return; }
    init();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInit);
  else tryInit();
})();
