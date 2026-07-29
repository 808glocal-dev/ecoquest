/* monthly_csv_patch.js  v2
   변경점 (v1 → v2)
   1) 관리자 → 통계 → "⬇️ CSV" 버튼(exportCSV) 자체를 월별 버전으로 덮어씀
      → 기존에 누르던 그 버튼에서 바로 월별이 나옴
   2) 📊 플로팅 버튼은 관리자에게만 표시
   3) monthlyCsvDebug() 진단 함수 추가
*/
(function(){
  'use strict';

  /* ── 날짜 → 'YYYY-MM' ───────────────────────── */
  function toMonthKey(v){
    if(v == null) return null;
    let d;
    if(typeof v === 'string'){
      const m = v.match(/^(\d{4})[-./]?(\d{1,2})/);
      if(m) return m[1] + '-' + String(m[2]).padStart(2,'0');
      d = new Date(v);
    } else if(typeof v === 'number'){
      d = new Date(v < 1e12 ? v * 1000 : v);
    } else if(typeof v.toDate === 'function'){
      d = v.toDate();
    } else if(v.seconds != null){
      d = new Date(v.seconds * 1000);
    } else if(v instanceof Date){
      d = v;
    }
    if(!d || isNaN(d.getTime())) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  const DATE_KEYS = ['date','createdAt','completedAt','ts','timestamp','day','regDate'];
  const CO2_KEYS  = ['co2','co2Reduced','co2Saved','CO2','co2_reduced','reduction'];

  function pickMonth(r){
    for(const k of DATE_KEYS){
      if(r[k] != null){ const m = toMonthKey(r[k]); if(m) return m; }
    }
    return null;
  }
  function pickCo2(r){
    for(const k of CO2_KEYS){
      const v = Number(r[k]);
      if(!isNaN(v) && v !== 0) return v;
    }
    return 0;
  }
  function pickType(r){
    return (r.missionName || r.missionId || r.type || r.title || '기타');
  }
  const r2 = n => Math.round(n * 100) / 100;
  const toast = m => { if(window.toast) window.toast(m); else console.log(m); };

  /* ── 데이터 로드 ────────────────────────────── */
  let _cache = null;

  async function loadAll(force){
    if(_cache && !force) return _cache;
    if(!window.FB || !window.FB.db) throw new Error('Firebase 미초기화');

    const snap = await window.FB.getDocs(
      window.FB.collection(window.FB.db, 'missionLogs')
    );
    const logs = [];
    snap.forEach(d => logs.push(Object.assign({ _id: d.id }, d.data())));

    const names = {}, users = [];
    try {
      const us = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      us.forEach(d => {
        const u = Object.assign({ id: d.id }, d.data());
        users.push(u);
        names[d.id] = u.nickname || u.name || u.displayName || u.email || d.id;
      });
    } catch(e){ console.log('[monthlyCsv] users 로드 스킵:', e.message); }

    _cache = { logs, names, users };
    return _cache;
  }

  /* ── 집계 ───────────────────────────────────── */
  function aggregate(logs, from, to){
    const byMonth = {}, byUser = {}, byType = {};
    let dated = 0, undated = 0;

    logs.forEach(r => {
      const m = pickMonth(r);
      if(!m){ undated++; return; }
      dated++;
      if(from && m < from) return;
      if(to   && m > to)   return;

      const uid  = r.uid || r.userId || r.user || 'unknown';
      const co2  = pickCo2(r);
      const type = pickType(r);

      if(!byMonth[m]) byMonth[m] = { cnt:0, co2:0, users:new Set() };
      byMonth[m].cnt++; byMonth[m].co2 += co2; byMonth[m].users.add(uid);

      const uk = m + '|' + uid;
      if(!byUser[uk]) byUser[uk] = { month:m, uid, cnt:0, co2:0 };
      byUser[uk].cnt++; byUser[uk].co2 += co2;

      const tk = m + '|' + type;
      if(!byType[tk]) byType[tk] = { month:m, type, cnt:0, co2:0 };
      byType[tk].cnt++; byType[tk].co2 += co2;
    });

    return { byMonth, byUser, byType, dated, undated, total: logs.length };
  }

  /* ── CSV 저장 ───────────────────────────────── */
  function saveCsv(filename, rows){
    const csv = rows.map(row =>
      (row || []).map(cell => {
        const s = (cell == null ? '' : String(cell));
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',')
    ).join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  }

  function range(){
    const f = (document.getElementById('mcFrom') || {}).value || '';
    const t = (document.getElementById('mcTo')   || {}).value || '';
    return { from:f.trim(), to:t.trim() };
  }
  const stamp = (f,t) => (f || 'all') + '_' + (t || 'all');

  /* ── 섹션 빌더 ──────────────────────────────── */
  function sectionSummary(agg){
    const months = Object.keys(agg.byMonth).sort();
    const rows = [['=== 월별 요약 ==='], ['월','참여자수','미션수','CO2절감(kg)','1인당 평균(kg)']];
    let tc = 0, tm = 0;
    const allUsers = new Set();
    months.forEach(m => {
      const d = agg.byMonth[m];
      const uc = d.users.size;
      d.users.forEach(u => allUsers.add(u));
      tc += d.co2; tm += d.cnt;
      rows.push([m, uc, d.cnt, r2(d.co2), uc ? r2(d.co2 / uc) : 0]);
    });
    rows.push(['합계', allUsers.size, tm, r2(tc), allUsers.size ? r2(tc/allUsers.size) : 0]);
    rows.push([]);
    rows.push(['환산 · 자동차 주행(km)', Math.round(tc / 0.21)]);
    rows.push(['환산 · 일회용컵(개)',    Math.round(tc / 0.011)]);
    rows.push(['환산 · 나무(그루/년)',   r2(tc / 21.4)]);
    return rows;
  }

  function sectionByUser(agg, names){
    const list = Object.values(agg.byUser).sort((a,b) =>
      a.month === b.month ? b.co2 - a.co2 : a.month.localeCompare(b.month));
    const rows = [['=== 월별 × 참여자 ==='], ['월','참여자','미션수','CO2절감(kg)','uid']];
    list.forEach(d => rows.push([d.month, names[d.uid] || d.uid, d.cnt, r2(d.co2), d.uid]));
    return rows;
  }

  function sectionByType(agg){
    const list = Object.values(agg.byType).sort((a,b) =>
      a.month === b.month ? b.co2 - a.co2 : a.month.localeCompare(b.month));
    const rows = [['=== 월별 × 미션종류 ==='], ['월','미션','건수','CO2절감(kg)']];
    list.forEach(d => rows.push([d.month, d.type, d.cnt, r2(d.co2)]));
    return rows;
  }

  function sectionUsersCumulative(users){
    const rows = [['=== 회원 누적 (기존 형식) ==='],
      ['UID','닉네임','미션수','포인트','CO2절감','성별','나이대','지역','직업','자동차','가구형태','환경관심도','관심분야']];
    users.forEach(u => rows.push([
      u.id||'', u.nickname||'', u.missionCount||0, u.point||0, (u.co2||0).toFixed(2),
      u.gender||'', u.age||'', u.region||'', u.job||'', u.hasCar||'',
      u.household||'', u.ecoLevel||'', (u.interests||[]).join('|')
    ]));
    return rows;
  }

  /* ── ① 통합 CSV (기존 관리자 버튼 대체) ─────── */
  async function exportMonthlyAll(){
    try{
      toast('📊 월별 집계 중...');
      const { logs, names, users } = await loadAll(true);
      const { from, to } = range();
      const agg = aggregate(logs, from, to);

      if(!Object.keys(agg.byMonth).length){
        toast('집계할 데이터가 없어요 (로그 ' + agg.total + '건)');
        console.warn('[monthlyCsv] 날짜 인식 실패. 샘플:', logs[0]);
        return;
      }

      const rows = []
        .concat(sectionSummary(agg), [[]])
        .concat(sectionByUser(agg, names), [[]])
        .concat(sectionByType(agg), [[]])
        .concat(sectionUsersCumulative(users));

      if(agg.undated) rows.push([], ['* 날짜 없는 로그(집계 제외)', agg.undated]);

      saveCsv('ecoquest_monthly_' + stamp(from,to) + '.csv', rows);
      toast('✅ 월별 CSV 다운로드 (로그 ' + agg.dated + '건 집계)');
    } catch(e){ toast('실패: ' + e.message); console.error(e); }
  }

  /* ── ② 개별 내보내기 ───────────────────────── */
  async function exportOne(kind){
    try{
      const { logs, names } = await loadAll();
      const { from, to } = range();
      const agg = aggregate(logs, from, to);
      if(!Object.keys(agg.byMonth).length){ toast('해당 기간 데이터가 없어요'); return; }

      let rows, fn;
      if(kind === 'summary'){ rows = sectionSummary(agg);        fn = 'summary'; }
      else if(kind === 'user'){ rows = sectionByUser(agg,names); fn = 'by_user'; }
      else { rows = sectionByType(agg);                          fn = 'by_type'; }

      saveCsv('ecoquest_monthly_' + fn + '_' + stamp(from,to) + '.csv', rows);
      toast('📊 내보냈어요');
    } catch(e){ toast('실패: ' + e.message); console.error(e); }
  }

  window.exportMonthlyAll     = exportMonthlyAll;
  window.exportMonthlySummary = () => exportOne('summary');
  window.exportMonthlyByUser  = () => exportOne('user');
  window.exportMonthlyByType  = () => exportOne('type');
  window.reloadMonthlyCsv     = async () => { _cache = null; await loadAll(true); toast('🔄 새로 불러옴'); };

  /* ── 진단 ───────────────────────────────────── */
  window.monthlyCsvDebug = async function(){
    const { logs } = await loadAll(true);
    const agg = aggregate(logs, '', '');
    const months = Object.keys(agg.byMonth).sort();
    console.log('── monthlyCsv 진단 ──');
    console.log('missionLogs 총 건수 :', agg.total);
    console.log('날짜 인식 성공      :', agg.dated);
    console.log('날짜 인식 실패      :', agg.undated);
    console.log('인식된 월           :', months.join(', ') || '(없음)');
    months.forEach(m => console.log('  ' + m + ' → ' + agg.byMonth[m].cnt + '건 / ' +
      r2(agg.byMonth[m].co2) + 'kg / ' + agg.byMonth[m].users.size + '명'));
    if(logs[0]) console.log('로그 샘플 필드:', Object.keys(logs[0]).join(', '));
    toast('진단 결과는 콘솔(F12)에 출력했어요');
    return agg;
  };

  /* ── 기존 관리자 CSV 버튼 덮어쓰기 ──────────── */
  function overrideAdminCsv(){
    if(window._mcOverridden) return true;
    if(typeof window.exportCSV !== 'function') return false;
    window._mcOriginalExportCSV = window.exportCSV;
    window.exportCSV = exportMonthlyAll;
    window._mcOverridden = true;
    console.log('[monthlyCsv] 관리자 CSV 버튼 → 월별 버전으로 교체됨');
    return true;
  }

  /* ── 플로팅 패널 (관리자 전용) ──────────────── */
  function isAdmin(){
    return window.ME && window.ADMIN && window.ME.email === window.ADMIN;
  }

  function buildPanel(){
    if(document.getElementById('mcPanelBtn')) return;

    const btn = document.createElement('div');
    btn.id = 'mcPanelBtn';
    btn.textContent = '📊';
    btn.style.cssText =
      'position:fixed;right:14px;bottom:82px;width:44px;height:44px;border-radius:22px;' +
      'background:#1a1a2e;color:#fff;display:flex;align-items:center;justify-content:center;' +
      'font-size:20px;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;z-index:9998';
    btn.onclick = () => {
      const p = document.getElementById('mcPanel');
      p.style.display = (p.style.display === 'none') ? 'block' : 'none';
    };
    document.body.appendChild(btn);

    const bs = 'width:100%;padding:11px;margin-top:7px;border:none;border-radius:9px;' +
               'font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;';

    const panel = document.createElement('div');
    panel.id = 'mcPanel';
    panel.style.cssText =
      'position:fixed;right:14px;bottom:134px;width:240px;background:#fff;border-radius:14px;' +
      'padding:14px;box-shadow:0 8px 28px rgba(0,0,0,.25);z-index:9999;display:none;font-family:inherit';
    panel.innerHTML =
      '<div style="font-size:12px;font-weight:900;color:#1a2e1a;margin-bottom:10px">📊 월별 CSV</div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">' +
        '<input id="mcFrom" placeholder="2026-07" style="width:50%;padding:7px;border:1px solid #ddd;border-radius:7px;font-size:12px;font-family:inherit;text-align:center"/>' +
        '<span style="font-size:11px;color:#888">~</span>' +
        '<input id="mcTo" placeholder="2026-08" style="width:50%;padding:7px;border:1px solid #ddd;border-radius:7px;font-size:12px;font-family:inherit;text-align:center"/>' +
      '</div>' +
      '<div style="font-size:10px;color:#aaa;margin-bottom:6px">비우면 전체 기간</div>' +
      '<button onclick="exportMonthlyAll()" style="' + bs + 'background:#1a1a2e;color:#fff">전체 (통합 CSV)</button>' +
      '<button onclick="exportMonthlySummary()" style="' + bs + 'background:#1a6b3a;color:#fff">월별 요약</button>' +
      '<button onclick="exportMonthlyByUser()" style="' + bs + 'background:#2ECC71;color:#fff">월별 × 참여자</button>' +
      '<button onclick="exportMonthlyByType()" style="' + bs + 'background:#FFB300;color:#5D4037">월별 × 미션종류</button>' +
      '<button onclick="monthlyCsvDebug()" style="' + bs + 'background:#f0f0f0;color:#666">🔍 진단</button>' +
      '<div onclick="document.getElementById(\'mcPanel\').style.display=\'none\'" ' +
        'style="text-align:center;font-size:11px;color:#aaa;margin-top:9px;cursor:pointer">닫기</div>';
    document.body.appendChild(panel);
  }

  function removePanel(){
    ['mcPanelBtn','mcPanel'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.remove();
    });
  }

  /* ── 부팅 ───────────────────────────────────── */
  let _tries = 0;
  function boot(){
    _tries++;
    if(!window.FB && _tries < 40){ setTimeout(boot, 500); return; }

    overrideAdminCsv();
    if(!window._mcOverridden && _tries < 40) setTimeout(boot, 500);

    if(isAdmin()) buildPanel(); else removePanel();

    console.log('[monthlyCsv] v2 ready · monthlyCsvDebug() 로 진단 가능');
  }

  // 로그인 상태가 늦게 잡히므로 주기적으로 관리자 여부 재확인
  setInterval(() => {
    if(isAdmin()) { buildPanel(); overrideAdminCsv(); }
    else removePanel();
  }, 3000);

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1500));
  else
    setTimeout(boot, 1500);

})();
