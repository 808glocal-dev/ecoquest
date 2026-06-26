/* =====================================================
   EcoQuest – 이번 주 출석 도장판 (weekly_progress_patch.js) v4
   ---------------------------------------------------
   기존 "챌린지 카드 안 N/목표" 방식 폐기 (카드 구조 의존 → 자꾸 안 보임)
   → 홈 상단에 독립 위젯으로 "이번 주 월~일 출석 도장 + 연속일수" 표시
   - 출석 기준: 그날 미션 1개라도 인증 = 출석 (챌린지/일반 미션 모두)
   - 데이터: missionLogs의 date 필드 사용 (이미 매 인증마다 쌓임)
   - saveMission 한 곳만 후킹 → 인증 즉시 오늘 도장
   - 기존 홈 카드 DOM 안 건드림 → 안 깨짐
   ===================================================== */
(function () {
  'use strict';

  function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function getWeekRange(base) {
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay();
    const diffToMon = (dow === 0) ? -6 : 1 - dow;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    return mon; // 월요일
  }

  let _attendDates = new Set(); // 활동한 날짜(YYYY-MM-DD) 전체

  async function loadAttend() {
    if (!window.ME || !window.FB) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'missionLogs'));
      _attendDates = new Set();
      snap.forEach(d => {
        const dt = d.data();
        if (dt.uid === window.ME.uid && dt.date) _attendDates.add(dt.date);
      });
      console.log('[attend] 로드 완료, 활동일수:', _attendDates.size);
      render();
    } catch (e) {
      console.log('[attend] 로드 실패:', e.message);
    }
  }

  // 오늘(또는 어제)부터 거꾸로 연속 출석 일수
  function calcStreak() {
    let s = 0;
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (!_attendDates.has(ymd(d))) d.setDate(d.getDate() - 1); // 오늘 아직이면 어제부터
    while (_attendDates.has(ymd(d))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }

  function ensureWidget() {
    const home = document.getElementById('page-home');
    if (!home) return null;
    let w = document.getElementById('weeklyAttendWidget');
    if (!w) {
      w = document.createElement('div');
      w.id = 'weeklyAttendWidget';
      const statCard = home.querySelector('.stat-card');
      if (statCard) statCard.insertAdjacentElement('afterend', w);
      else home.insertAdjacentElement('afterbegin', w);
    }
    return w;
  }

  function render() {
    const w = ensureWidget();
    if (!w) return;
    const mon = getWeekRange(new Date());
    const todayStr = ymd(new Date());
    const labels = ['월', '화', '수', '목', '금', '토', '일'];

    let cells = '', weekCount = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(mon); day.setDate(mon.getDate() + i);
      const ds = ymd(day);
      const isToday = ds === todayStr;
      const isFuture = ds > todayStr;
      const done = _attendDates.has(ds);
      if (done) weekCount++;

      let mark, bg, border;
      if (done) { mark = '🔥'; bg = '#eafaf0'; border = '#a8e6c5'; }
      else if (isFuture) { mark = '·'; bg = '#f7faf8'; border = 'var(--bdr)'; }
      else { mark = '○'; bg = '#fff'; border = 'var(--bdr)'; }

      cells +=
        '<div style="flex:1;text-align:center">' +
          '<div style="font-size:10px;color:var(--sub);margin-bottom:3px;font-weight:700">' + labels[i] + '</div>' +
          '<div style="aspect-ratio:1;border-radius:10px;background:' + bg + ';border:1.5px solid ' +
            (isToday ? 'var(--g1)' : border) + ';display:flex;align-items:center;justify-content:center;font-size:16px;color:#bbb;' +
            (isToday ? 'box-shadow:0 0 0 2px rgba(46,204,113,.2)' : '') + '">' + mark + '</div>' +
        '</div>';
    }

    const streak = calcStreak();
    const rightTxt = streak > 0
      ? streak + '일 연속 🔥'
      : (weekCount > 0 ? '이번 주 ' + weekCount + '일' : '오늘 첫 인증 도전!');

    w.innerHTML =
      '<div style="margin:0 12px 12px;background:linear-gradient(135deg,#fff,#f0fbf4);border-radius:16px;padding:14px 16px;border:1.5px solid var(--bdr)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
          '<div style="font-size:14px;font-weight:900;color:var(--txt)">🔥 이번 주 출석</div>' +
          '<div style="font-size:12px;font-weight:800;color:var(--g2)">' + rightTxt + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:5px">' + cells + '</div>' +
      '</div>';
  }

  // saveMission 후킹 → 인증 성공 시 오늘 도장 + 즉시 갱신
  function hookSaveMission() {
    if (window._attendHookedSave) return;
    const orig = window.saveMission;
    if (typeof orig !== 'function') { setTimeout(hookSaveMission, 600); return; }
    window.saveMission = async function (uid, m) {
      const res = await orig.apply(this, arguments);
      try {
        if (res && uid === window.ME?.uid) {
          _attendDates.add(ymd(new Date()));
          render();
        }
      } catch (e) { console.log('[attend] 갱신 실패:', e.message); }
      return res;
    };
    window._attendHookedSave = true;
    console.log('[attend] ✅ saveMission 후킹');
  }

  function boot() {
    if (!window.FB || !window.ME) { setTimeout(boot, 600); return; }
    ensureWidget();
    loadAttend();
    hookSaveMission();
    console.log('[attend] 🚀 부트 완료');
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1800));
  else
    setTimeout(boot, 1800);

})();
