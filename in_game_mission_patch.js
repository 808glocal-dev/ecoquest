/* =====================================================
   EcoQuest – 게임(농장) 속 "내 챌린지" 바 (① 기능, v5)
   - v4 + 인증 모달 여는 동안 _eqUserCert 플래그가 안 꺼지게 가드(_eqCertOpening)
   ★ 모든 패치보다 "뒤"에 로드 (맨 끝)
   ===================================================== */
(function () {
  'use strict';

  function findMission(id) {
    return (typeof MISSIONS !== 'undefined') ? MISSIONS.find(x => x.id === id) : null;
  }
  function freqN(ac) {
    return ac.freqPerWeek ?? (ac.freq === 'daily' ? 7 : (parseInt((ac.freq || 'w1').replace('w', '')) || 1));
  }
  function activeList() {
    const validIds = (typeof CHALLENGES !== 'undefined') ? CHALLENGES.map(c => c.missionId) : null;
    const today = new Date().toISOString().split('T')[0];
    return (window.UDATA?.activeChallenges || []).filter(ac =>
      (!ac.endDate || ac.endDate >= today) && (!validIds || validIds.includes(ac.missionId))
    );
  }

  // 모달이 사용자에 의해 "진짜로" 닫힐 때만 플래그 해제 (여는 중엔 무시)
  const _origCloseOv = window.closeOv;
  window.closeOv = function (id) {
    if (id === 'ovAI' && !window._eqCertOpening) window._eqUserCert = false;
    if (_origCloseOv) _origCloseOv(id);
  };

  window.startInGameChallenge = function (chalId) {
    const ac = (window.UDATA?.activeChallenges || []).find(a => a.challengeId === chalId);
    if (!ac) { if (window.toast) toast('챌린지 정보를 못 찾았어요'); return; }
    const today = new Date().toISOString().split('T')[0];
    if ((window.UDATA?.verifiedDates || {})[chalId] === today) {
      if (window.toast) toast('오늘 이미 인증했어요! 내일 또 도전해요 ✅'); return;
    }
    const m = findMission(ac.missionId);
    if (!m) { if (window.toast) toast('미션 정보를 못 찾았어요'); return; }
    window._eqUserCert = true;       // ★ 사용자가 직접 연 인증
    window._eqCertOpening = true;    // ★ 여는 동안 플래그 보호 (openAI 내부 closeOv 무시)
    if (typeof window.openAI === 'function') window.openAI(m, window.ME && window.ME.uid, chalId);
    setTimeout(() => { window._eqCertOpening = false; }, 800);
    console.log('[in_game] 인증 모달 open · _eqUserCert=true');
  };

  function chipsHtml() {
    const active = activeList();
    if (!active.length) {
      const guest = !window.ME;
      return `<div style="width:100%;text-align:center;color:rgba(255,255,255,.85);font-size:12px;padding:6px 2px 2px">
        ${guest ? '로그인하고 챌린지에 참여해봐요' : '참여 중인 챌린지가 없어요'}
        <button onclick="goPage('chal')" style="display:block;margin:8px auto 0;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);border-radius:10px;padding:7px 14px;color:#fff;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit">챌린지 참여하기 🏆</button>
      </div>`;
    }
    const today = new Date().toISOString().split('T')[0];
    return active.map(ac => {
      const m = findMission(ac.missionId);
      const emoji = ac.emoji || (m ? m.emoji : '🌱');
      const title = ac.challengeTitle || (m ? m.name : '미션');
      const n = freqN(ac);
      const total = n * (ac.weeks || 2);
      const done = (window.UDATA?.completedDates || {})[ac.challengeId] || 0;
      const freqLabel = n >= 7 ? '매일' : '주' + n;
      const doneToday = (window.UDATA?.verifiedDates || {})[ac.challengeId] === today;
      return `<button onclick="startInGameChallenge(${ac.challengeId})"
        style="flex:0 0 auto;position:relative;background:${doneToday ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.16)'};
               border:1.5px solid rgba(255,255,255,${doneToday ? '.25' : '.4'});border-radius:14px;padding:9px 10px;
               color:#fff;font-family:inherit;cursor:pointer;text-align:center;min-width:80px;max-width:118px;${doneToday ? 'opacity:.75' : ''}">
        ${doneToday ? '<div style="position:absolute;top:3px;right:6px;font-size:11px">✅</div>' : ''}
        <div style="font-size:24px;line-height:1">${emoji}</div>
        <div style="font-size:11px;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${title}</div>
        <div style="font-size:9px;opacity:.85;margin-top:1px">${done}/${total} · ${freqLabel}</div>
      </button>`;
    }).join('');
  }

  function renderBar() {
    const chips = document.getElementById('inGameMissionChips');
    if (chips) chips.innerHTML = chipsHtml();
  }

  function inject() {
    const mapPage = document.getElementById('page-map');
    if (!mapPage) return;
    if (document.getElementById('inGameMissionBar')) return;
    const bar = document.createElement('div');
    bar.id = 'inGameMissionBar';
    bar.innerHTML = `
      <div style="margin:12px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:16px;
                  padding:12px 12px 10px;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.08)">
        <div style="font-size:13px;font-weight:900">🎮 내 지구에서 챌린지 인증</div>
        <div style="font-size:11px;color:rgba(255,255,255,.7);margin:2px 0 10px">인증하면 눈앞에서 지구가 자라요 🌱</div>
        <div id="inGameMissionChips" style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px"></div>
      </div>`;
    const pg = document.getElementById('bunnyPlayground');
    if (pg && pg.parentElement) pg.insertAdjacentElement('afterend', bar);
    else mapPage.insertBefore(bar, mapPage.firstChild);
    renderBar();
    console.log('[in_game_mission] 바 삽입됨 · 챌린지', activeList().length, '개');
  }

  const _origRTQ = window.renderTodayQuests;
  window.renderTodayQuests = function (uid) {
    if (_origRTQ) _origRTQ(uid);
    renderBar();
  };

  function watch() {
    const mapPage = document.getElementById('page-map');
    if (!mapPage) { setTimeout(watch, 600); return; }
    inject();
    new MutationObserver(() => inject()).observe(mapPage, { childList: true, subtree: true });
  }

  const _origGoPage = window.goPage;
  if (typeof _origGoPage === 'function') {
    window.goPage = function (name) {
      const r = _origGoPage.apply(this, arguments);
      if (name === 'map') { setTimeout(() => { inject(); renderBar(); }, 200); setTimeout(() => { inject(); renderBar(); }, 1000); }
      return r;
    };
  }

  console.log('[in_game_mission] v5 loaded');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(watch, 1200));
  else setTimeout(watch, 1200);

})();
