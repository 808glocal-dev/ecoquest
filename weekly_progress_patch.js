/* =====================================================
   EcoQuest – 주차별 인증 진척 표시 패치 (weekly_progress_patch.js) v2
   ---------------------------------------------------
   ① 인증할 때마다 날짜를 verifLog[challengeId] 배열에 쌓음 (기존 데이터 안 건드림)
   ② 홈 "참여 중인 챌린지" 카드에 "이번 주 ✅✅⬜ 2/3" 표시
   - 주차 기준: 달력 월~일
   - 빈도: freqPerWeek 있으면 그걸, 없으면 ac.freq(daily/w5/w3) 사용
   - 로드 위치: challenges 패치 / gemini_patch.js 보다 뒤
   ---------------------------------------------------
   v2 수정:
   - 카드가 flex row라 박스가 안 보이던 문제 → 카드를 column으로 감싸 박스를 아래에 배치
   - 매칭 키 오류 수정 (c.missionId → c.id, ac.missionId → ac.challengeId)
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

  // 챌린지의 주당 목표 횟수
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
  function hookDoComplete() {
    if (window._weeklyHookedDoComplete) return;
    const orig = window.doComplete;
    if (typeof orig !== 'function') { setTimeout(hookDoComplete, 600); return; }

    window.doComplete = async function () {
      // 인증 직전 챌린지 id 백업 (원본이 상태를 리셋하기 전에)
      const chalIdBefore =
        window.EQ?.curChalId ??
        window._curChalId ??            // index.html 전역 변수 케이스
        null;
      const uidBefore =
        window.EQ?.curUid ??
        window._curUid ??
        window.ME?.uid ??
        null;

      const res = await orig.apply(this, arguments);

      try {
        if (chalIdBefore && uidBefore && window.FB && window.UDATA) {
          const today = ymd(new Date());
          const vlog = window.UDATA.verifLog || {};
          if (!vlog[chalIdBefore]) vlog[chalIdBefore] = [];
          if (!vlog[chalIdBefore].includes(today)) {
            vlog[chalIdBefore].push(today);
            window.UDATA.verifLog = vlog;
            await window.FB.updateDoc(
              window.FB.doc(window.FB.db, 'users', uidBefore),
              { verifLog: vlog }
            );
          }
          if (window.renderHomeChalls) window.renderHomeChalls();
        }
      } catch (e) {
        console.log('[weekly] verifLog 저장 실패:', e.message);
      }
      return res;
    };
    window._weeklyHookedDoComplete = true;
    console.log('[weekly] ✅ doComplete 후킹 (날짜 쌓기)');
  }

  /* ───────────── ② 홈 카드에 주차 표시 주입 ───────────── */

  // 이번 주 진척 박스 HTML
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
      ? `<span style="color:#1a6b3a;font-weight:800">다 했어요! 🎉</span>`
      : `<span style="color:var(--sub)">${remain}번 더!</span>`;

    return `
      <div style="background:${complete ? '#eafaf0' : '#f7faf8'};border:1px solid ${complete ? '#a8e6c5' : 'var(--bdr,#e5e7eb)'};
                  border-radius:10px;padding:8px 10px;margin-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:10px;color:var(--sub);font-weight:700">이번 주 (${shortMD(mon)}~${shortMD(sun)})</span>
          <span style="font-size:11px;font-weight:800;color:${complete ? '#1a6b3a' : 'var(--txt)'}">${done}/${target} · ${statusText}</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${dots}</div>
      </div>`;
  }

  // renderHomeChalls 후킹 → 그려진 카드 안에 주차 박스 삽입
  function hookRenderHome() {
    if (window._weeklyHookedHome) return;
    const orig = window.renderHomeChalls;
    if (typeof orig !== 'function') { setTimeout(hookRenderHome, 600); return; }

    window.renderHomeChalls = function () {
      const r = orig.apply(this, arguments);
      // innerHTML 갱신이 끝난 직후 주입
      requestAnimationFrame(() => { try { injectWeekBoxes(); } catch (e) { console.log('[weekly] 주입 실패:', e.message); } });
      return r;
    };
    window._weeklyHookedHome = true;
    console.log('[weekly] ✅ renderHomeChalls 후킹 (주차 표시)');
    setTimeout(injectWeekBoxes, 300); // 최초 1회
  }

  // 홈 카드들에 주차 박스 끼워넣기
  function injectWeekBoxes() {
    const wrap = document.getElementById('homeChallList');
    if (!wrap) return;

    const active = (window.UDATA?.activeChallenges || []);
    if (!active.length) return;

    // 실제 홈 카드는 CHALLENGES에 매칭되는 active만 그려짐 (c.id === ac.challengeId)
    const chals = (window.CHALLENGES || []);
    const shown = active.filter(ac => chals.some(c => c.id === ac.challengeId));

    const cards = wrap.children;
    for (let i = 0; i < cards.length && i < shown.length; i++) {
      const card = cards[i];
      const ac = shown[i];
      if (!ac) continue;

      // ── 핵심 수정: flex row 카드 → column으로 감싸기 (1회만) ──
      // 기존 카드는 display:flex;justify-content:space-between 한 줄짜리.
      // 그 안에 박스를 그냥 넣으면 오른쪽에 끼여 안 보임.
      // 기존 자식들을 row wrapper로 묶고, 카드를 block으로 바꿔 박스를 아래에 깔아준다.
      if (!card.dataset.weeklyWrapped) {
        const inner = document.createElement('div');
        inner.style.cssText = 'display:flex;align-items:center;justify-content:space-between';
        while (card.firstChild) inner.appendChild(card.firstChild);
        card.appendChild(inner);
        card.style.display = 'block';
        card.dataset.weeklyWrapped = '1';
      }

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
