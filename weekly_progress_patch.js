/* =====================================================
   EcoQuest – 주차별 인증 진척 표시 패치 (weekly_progress_patch.js) v3
   ---------------------------------------------------
   ① 인증할 때마다 verifLog[challengeId]에 오늘 날짜를 쌓음
   ② 홈 "참여 중인 챌린지" 카드 맨 아래에 "이번 주 ✅✅⬜ 2/3" 표시
   - 주차 기준: 달력 월~일
   - 빈도: ac.freq (daily/w5/w3/w1) 사용
   ---------------------------------------------------
   v3 핵심 수정:
   - doComplete 안의 _curChalId가 window에 없어서 챌린지 id를 못 잡던 문제
     → 원본이 남기는 window.UDATA.verifiedDates(=오늘 인증한 챌린지)에서 역으로 채움
   - 실제 홈 카드는 이미 세로(column) 구조 → 억지로 감싸지 말고 맨 아래에 박스만 append
   - 카드 매칭을 renderHomeChalls의 필터와 동일하게 맞춤 (missionId 유효 + challengeId 존재)
   ===================================================== */
(function () {
  'use strict';

  /* ───────────── 날짜 유틸 ───────────── */
  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function getWeekRange(base) {
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay();                         // 0=일,1=월,...6=토
    const diffToMon = (dow === 0) ? -6 : 1 - dow;   // 일요일이면 -6, 아니면 월요일까지
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { mon, sun };
  }
  function shortMD(d) { return `${d.getMonth() + 1}/${d.getDate()}`; }

  // 챌린지의 주당 목표 횟수 (daily=7, w5=5, w3=3, w1=1)
  function weeklyTarget(ac) {
    if (ac.freqPerWeek) return Math.min(7, ac.freqPerWeek);
    if (ac.freq === 'daily') return 7;
    if (ac.freq === 'w5') return 5;
    if (ac.freq === 'w3') return 3;
    const n = parseInt((ac.freq || 'w1').replace('w', '')) || 1;
    return Math.min(7, n);
  }

  // 이번 주에 인증한 횟수 (verifLog 기반, 중복 날짜 제거)
  function countThisWeek(chalId) {
    const log = (window.UDATA?.verifLog || {})[chalId] || [];
    const { mon, sun } = getWeekRange(new Date());
    const monStr = ymd(mon), sunStr = ymd(sun);
    const uniq = [...new Set(log)];
    return uniq.filter(ds => ds >= monStr && ds <= sunStr).length;
  }

  /* ───────────── ① 날짜 쌓기 (doComplete 후킹) ───────────── */
  // 원본 doComplete가 끝나면 window.UDATA.verifiedDates[chalId]에 오늘 날짜가 들어있음.
  // 그걸 읽어서 verifLog[chalId]에 오늘 날짜를 보장(없으면 추가)한다.
  function hookDoComplete() {
    if (window._weeklyHookedDoComplete) return;
    const orig = window.doComplete;
    if (typeof orig !== 'function') { setTimeout(hookDoComplete, 600); return; }

    window.doComplete = async function () {
      const res = await orig.apply(this, arguments);
      try {
        const today = ymd(new Date());
        const vd = window.UDATA?.verifiedDates || {};
        const vlog = window.UDATA?.verifLog || {};
        let changed = false;
        for (const cid in vd) {
          if (vd[cid] === today) {
            if (!vlog[cid]) vlog[cid] = [];
            if (!vlog[cid].includes(today)) { vlog[cid].push(today); changed = true; }
          }
        }
        if (changed && window.ME && window.FB) {
          window.UDATA.verifLog = vlog;
          await window.FB.updateDoc(
            window.FB.doc(window.FB.db, 'users', window.ME.uid),
            { verifLog: vlog }
          );
        }
        if (window.renderHomeChalls) window.renderHomeChalls();
      } catch (e) {
        console.log('[weekly] verifLog 저장 실패:', e.message);
      }
      return res;
    };
    window._weeklyHookedDoComplete = true;
    console.log('[weekly] ✅ doComplete 후킹 (verifiedDates 기반 날짜 쌓기)');
  }

  /* ───────────── ② 홈 카드에 주차 표시 주입 ───────────── */
  function weekBoxHtml(ac) {
    const target = weeklyTarget(ac);
    const done = countThisWeek(ac.challengeId);
    const { mon, sun } = getWeekRange(new Date());

    let dots = '';
    for (let i = 0; i < target; i++) {
      dots += (i < done)
        ? '<span style="font-size:15px;line-height:1">✅</span>'
        : '<span style="font-size:15px;line-height:1;opacity:.35">⬜</span>';
    }

    const complete = done >= target;
    const remain = Math.max(0, target - done);
    const statusText = complete
      ? '<span style="color:#1a6b3a;font-weight:800">다 했어요! 🎉</span>'
      : '<span style="color:var(--sub)">' + remain + '번 더!</span>';

    return '' +
      '<div style="background:' + (complete ? '#eafaf0' : '#f7faf8') + ';border:1px solid ' + (complete ? '#a8e6c5' : 'var(--bdr)') + ';' +
      'border-radius:10px;padding:8px 10px;margin-top:8px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">' +
          '<span style="font-size:10px;color:var(--sub);font-weight:700">이번 주 (' + shortMD(mon) + '~' + shortMD(sun) + ')</span>' +
          '<span style="font-size:11px;font-weight:800;color:' + (complete ? '#1a6b3a' : 'var(--txt)') + '">' + done + '/' + target + ' · ' + statusText + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap">' + dots + '</div>' +
      '</div>';
  }

  function hookRenderHome() {
    if (window._weeklyHookedHome) return;
    const orig = window.renderHomeChalls;
    if (typeof orig !== 'function') { setTimeout(hookRenderHome, 600); return; }

    window.renderHomeChalls = function () {
      const r = orig.apply(this, arguments);
      requestAnimationFrame(() => {
        try { injectWeekBoxes(); } catch (e) { console.log('[weekly] 주입 실패:', e.message); }
      });
      return r;
    };
    window._weeklyHookedHome = true;
    console.log('[weekly] ✅ renderHomeChalls 후킹 (주차 표시)');
    setTimeout(injectWeekBoxes, 300);
  }

  function injectWeekBoxes() {
    const wrap = document.getElementById('homeChallList');
    if (!wrap) return;

    const active = (window.UDATA?.activeChallenges || []);
    if (!active.length) return;

    const chals = (window.CHALLENGES || []);
    const validMissionIds = chals.map(c => c.missionId);

    // renderHomeChalls와 동일한 순서/필터로 실제 그려진 카드와 1:1 매칭
    const shown = active
      .filter(ac => validMissionIds.includes(ac.missionId))
      .filter(ac => chals.some(c => c.id === ac.challengeId));

    const cards = wrap.children;
    for (let i = 0; i < cards.length && i < shown.length; i++) {
      const card = cards[i];
      const ac = shown[i];
      if (!ac) continue;

      // 카드는 이미 세로 구조 → 맨 아래에 박스만 추가/갱신 (감싸지 않음)
      let box = card.querySelector('.weekly-box');
      if (!box) {
        box = document.createElement('div');
        box.className = 'weekly-box';
        card.appendChild(box);
      }
      box.innerHTML = weekBoxHtml(ac);
    }
  }

  /* ───────────── 부트 ───────────── */
  function boot() {
    if (!window.FB) { setTimeout(boot, 500); return; }
    hookDoComplete();
    hookRenderHome();
    console.log('[weekly] 🚀 부트 완료');
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1800));
  else
    setTimeout(boot, 1800);

})();
