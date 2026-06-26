/* =====================================================
   EcoQuest – 주차별 인증 진척 표시 패치 (weekly_progress_patch.js)
   ---------------------------------------------------
   ① 인증할 때마다 날짜를 verifLog[chalId] 배열에 쌓음 (기존 데이터 안 건드림)
   ② 홈 "참여 중인 챌린지" 카드에 "이번 주 ✅✅⬜ 2/3" 표시
   - 주차 기준: 달력 월~일
   - 빈도: 챌린지마다 본인이 정한 freqPerWeek 사용
   - 로드 위치: challenges 패치 / gemini_patch.js 보다 뒤
   ===================================================== */
(function () {
  'use strict';

  /* ───────────── 날짜 유틸 ───────────── */

  // YYYY-MM-DD (로컬 기준)
  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 이번 주 월요일 ~ 일요일 (달력 기준)
  function getWeekRange(base) {
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay();                 // 0=일,1=월,...6=토
    const diffToMon = (dow === 0) ? -6 : 1 - dow;  // 일요일이면 -6, 아니면 월요일까지
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { mon, sun };
  }

  // "M/D" 짧은 표기
  function shortMD(d) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  // 챌린지의 주당 목표 횟수
  function weeklyTarget(ac) {
    if (ac.freqPerWeek) return Math.min(7, ac.freqPerWeek);
    if (ac.freq === 'daily') return 7;
    if (ac.freq === 'w5') return 5;
    if (ac.freq === 'w3') return 3;
    const n = parseInt((ac.freq || 'w1').replace('w', '')) || 1;
    return Math.min(7, n);
  }

  // 이번 주에 인증한 횟수 세기 (verifLog 기반)
  function countThisWeek(chalId) {
    const log = (window.UDATA?.verifLog || {})[chalId] || [];
    const { mon, sun } = getWeekRange(new Date());
    const monStr = ymd(mon), sunStr = ymd(sun);
    // 중복 날짜 제거 후 이번 주 범위 안에 드는 날짜만
    const uniq = [...new Set(log)];
    return uniq.filter(ds => ds >= monStr && ds <= sunStr).length;
  }

  /* ───────────── ① 날짜 쌓기 (doComplete 후킹) ───────────── */

  function hookDoComplete() {
    if (window._weeklyHookedDoComplete) return;
    const orig = window.doComplete;
    if (typeof orig !== 'function') { setTimeout(hookDoComplete, 600); return; }

    window.doComplete = async function () {
      // 후킹: 인증 직전 챌린지 id 백업 (원본이 EQ.passed를 false로 만들기 전에)
      const chalIdBefore = window.EQ?.curChalId || null;
      const uidBefore = window.EQ?.curUid || window.ME?.uid || null;

      const res = await orig.apply(this, arguments);

      // 원본 저장이 끝난 뒤, 날짜를 배열에 추가
      try {
        if (chalIdBefore && uidBefore && window.FB) {
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
          // 홈 카드 다시 그리기
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

  // 이번 주 진척 박스 HTML 생성
  function weekBoxHtml(ac) {
    const target = weeklyTarget(ac);
    const done = countThisWeek(ac.challengeId);
    const { mon, sun } = getWeekRange(new Date());

    // ✅ / ⬜ 칩들
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
      <div style="background:${complete ? '#eafaf0' : '#f7faf8'};border:1px solid ${complete ? '#a8e6c5' : 'var(--bdr)'};
                  border-radius:10px;padding:8px 10px;margin-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:10px;color:var(--sub);font-weight:700">
            이번 주 (${shortMD(mon)}~${shortMD(sun)})
          </span>
          <span style="font-size:11px;font-weight:800;color:${complete ? '#1a6b3a' : 'var(--txt)'}">
            ${done}/${target} · ${statusText}
          </span>
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
      try { injectWeekBoxes(); } catch (e) { console.log('[weekly] 주입 실패:', e.message); }
      return r;
    };
    window._weeklyHookedHome = true;
    console.log('[weekly] ✅ renderHomeChalls 후킹 (주차 표시)');
    // 최초 1회
    setTimeout(injectWeekBoxes, 300);
  }

  // 홈 카드들에 주차 박스 끼워넣기
  function injectWeekBoxes() {
    const wrap = document.getElementById('homeChallList');
    if (!wrap) return;

    const active = (window.UDATA?.activeChallenges || []);
    if (!active.length) return;

    // homeChallList 안의 각 카드 = active 순서와 동일하게 그려짐
    // 카드 식별: 카드 안에 openChal(...) onclick 가진 div가 있음
    const cards = wrap.children;
    // active 중 CHALLENGES에 유효한 것만 카드로 그려지므로, 매칭을 위해 필터
    const validIds = (window.CHALLENGES || []).map(c => c.missionId);
    const shown = active.filter(ac => validIds.includes(ac.missionId));

    for (let i = 0; i < cards.length && i < shown.length; i++) {
      const card = cards[i];
      const ac = shown[i];
      if (!ac) continue;
      // 이미 박스 있으면 갱신, 없으면 추가
      const existing = card.querySelector('.weekly-box');
      const html = weekBoxHtml(ac);
      if (existing) {
        existing.outerHTML = `<div class="weekly-box">${html}</div>`;
      } else {
        const holder = document.createElement('div');
        holder.className = 'weekly-box';
        holder.innerHTML = html;
        card.appendChild(holder);
      }
    }
  }

  /* ───────────── 부트 ───────────── */
  function boot() {
    if (!window.FB) { setTimeout(boot, 500); return; }
    hookDoComplete();
    hookRenderHome();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1800));
  else
    setTimeout(boot, 1800);

})();
