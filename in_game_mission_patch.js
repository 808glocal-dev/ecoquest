/* =====================================================
   EcoQuest – 게임 속 "내 챌린지" 바 (① 기능, v2)
   - 내 지구(토끼 월드) 안에 "내가 참여 중인 챌린지"를 띄움
   - 홈의 오늘의 미션(activeChallenges)과 동일 데이터
   - 칩 탭 → 기존 openAI(m, uid, challengeId) 호출 (진행도·완주 로직 그대로)
   - 인증 성공 → CO₂↑ → 내 지구 성장
   ★ 토끼/farm 패치 + 챌린지(빈도) 패치보다 "뒤"에 로드 (맨 끝)
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
    const validIds = (typeof CHALLENGES !== 'undefined') ? CHALLENGES.map(c => c.missionId) : [];
    const today = new Date().toISOString().split('T')[0];
    return (window.UDATA?.activeChallenges || []).filter(ac =>
      (!ac.endDate || ac.endDate >= today) && validIds.includes(ac.missionId)
    );
  }

  window.startInGameChallenge = function (chalId) {
    const ac = (window.UDATA?.activeChallenges || []).find(a => a.challengeId === chalId);
    if (!ac) { if (window.toast) toast('챌린지 정보를 못 찾았어요'); return; }
    const today = new Date().toISOString().split('T')[0];
    if ((window.UDATA?.verifiedDates || {})[chalId] === today) {
      if (window.toast) toast('오늘 이미 인증했어요! 내일 또 도전해요 ✅'); return;
    }
    const m = findMission(ac.missionId);
    if (!m) { if (window.toast) toast('미션 정보를 못 찾았어요'); return; }
    if (typeof window.openAI === 'function') window.openAI(m, window.ME && window.ME.uid, chalId);
  };

  function chipsHtml() {
    const active = activeList();
    if (!active.length) {
      return `<div style="width:100%;text-align:center;color:rgba(255,255,255,.85);font-size:12px;padding:6px 2px 2px">
        참여 중인 챌린지가 없어요
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
    const main = document.getElementById('bunnyGameMain');
    if (!main) return;
    if (document.getElementById('inGameMissionBar')) return;
    const bar = document.createElement('div');
    bar.id = 'inGameMissionBar';
    bar.innerHTML = `
      <div style="margin:0 12px 12px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:16px;
                  padding:12px 12px 10px;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.08)">
        <div style="font-size:13px;font-weight:900">🎮 내 지구에서 챌린지 인증</div>
        <div style="font-size:11px;color:rgba(255,255,255,.7);margin:2px 0 10px">인증하면 눈앞에서 지구가 자라요 🌱</div>
        <div id="inGameMissionChips" style="display:flex;gap:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px"></div>
      </div>`;
    const pg = document.getElementById('bunnyPlayground');
    if (pg && pg.parentElement) pg.insertAdjacentElement('afterend', bar);
    else main.insertBefore(bar, main.firstChild);
    renderBar();
  }

  // 인증/참여/취소 시 홈 미션이 갱신되는 타이밍에 게임 바도 같이 갱신
  const _origRTQ = window.renderTodayQuests;
  window.renderTodayQuests = function (uid) {
    if (_origRTQ) _origRTQ(uid);
    renderBar();
  };

  function watch() {
    const mapPage = document.getElementById('page-map');
    if (!mapPage) { setTimeout(watch, 800); return; }
    inject();
    new MutationObserver(() => inject()).observe(mapPage, { childList: true, subtree: true });
  }

  const _origGoPage = window.goPage;
  if (typeof _origGoPage === 'function') {
    window.goPage = function (name) {
      const r = _origGoPage.apply(this, arguments);
      if (name === 'map') { setTimeout(() => { inject(); renderBar(); }, 300); setTimeout(() => { inject(); renderBar(); }, 1200); }
      return r;
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(watch, 1500));
  else setTimeout(watch, 1500);

})();
