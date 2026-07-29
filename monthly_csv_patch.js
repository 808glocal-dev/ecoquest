/* monthly_csv_patch.js  v1
   missionLogs를 월별로 집계해서 CSV 3종 내보내기
   - 월별 요약        : 월 / 참여자수 / 미션수 / CO2
   - 월별 × 참여자    : 월 / 이름 / 미션수 / CO2
   - 월별 × 미션종류  : 월 / 미션 / 건수 / CO2
   기존 csv_detail_patch.js 와 독립. index.html 수정 불필요.
*/
(function(){
  'use strict';

  /* ── 날짜 → 'YYYY-MM' ───────────────────────── */
  function toMonthKey(v){
    if(v == null) return null;
    let d;
    if(typeof v === 'string'){
      const m = v.match(/^(\d{4})[-./]?(\d{2})/);
      if(m) return m[1] + '-' + m[2];
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
  const TYPE_KEYS = ['type','missionType','mission','title','name'];

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
    for(const k of TYPE_KEYS){
      if(typeof r[k] === 'string' && r[k].trim()) return r[k].trim();
    }
    return '기타';
  }
  const r1 = n => Math.round(n * 10) / 10;
  const r2 = n => Math.round(n * 100) / 100;

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

    const names = {};
    try {
      const us = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      us.forEach(d => {
        const u = d.data() || {};
        names[d.id] = u.name || u.nickname || u.displayName || u.email || d.id;
      });
    } catch(e){ console.log('[monthlyCsv] users 로드 스킵:', e.message); }

    _cache = { logs, names };
    return _cache;
  }

  /* ── 집계 ───────────────────────────────────── */
  function aggregate(logs, from, to){
    const byMonth = {}, byUser = {}, byType = {};
    let skipped = 0;

    logs.forEach(r => {
      const m = pickMonth(r);
      if(!m){ skipped++; return; }
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

    return { byMonth, byUser, byType, skipped };
  }

  /* ── CSV 저장 ───────────────────────────────── */
  function saveCsv(filename, rows){
    const csv = rows.map(row =>
      row.map(cell => {
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
  function stamp(from, to){
    return (from || 'all') + '_' + (to || 'all');
  }
  function toast(msg){
    if(window.toast) window.toast(msg); else console.log(msg);
  }

  /* ── 내보내기 3종 ───────────────────────────── */
  window.exportMonthlySummary = async function(){
    try{
      const { logs } = await loadAll();
      const { from, to } = range();
      const { byMonth, skipped } = aggregate(logs, from, to);

      const months = Object.keys(byMonth).sort();
      if(!months.length){ toast('해당 기간 데이터가 없어요'); return; }

      const rows = [['월','참여자수','미션수','CO2절감(kg)','1인당 평균(kg)']];
      let tc = 0, tm = 0;
      const allUsers = new Set();

      months.forEach(m => {
        const d = byMonth[m];
        const uc = d.users.size;
        d.users.forEach(u => allUsers.add(u));
        tc += d.co2; tm += d.cnt;
        rows.push([m, uc, d.cnt, r2(d.co2), uc ? r2(d.co2 / uc) : 0]);
      });
      rows.push([]);
      rows.push(['합계', allUsers.size, tm, r2(tc), allUsers.size ? r2(tc/allUsers.size) : 0]);
      rows.push([]);
      rows.push(['환산 · 자동차 주행(km)', Math.round(tc / 0.21)]);
      rows.push(['환산 · 일회용컵(개)',    Math.round(tc / 0.011)]);
      rows.push(['환산 · 나무(그루/년)',   r1(tc / 21.4)]);
      if(skipped) rows.push(['* 날짜 없는 로그(제외)', skipped]);

      saveCsv('ecoquest_monthly_summary_' + stamp(from,to) + '.csv', rows);
      toast('📊 월별 요약 내보냄');
    } catch(e){ toast('실패: ' + e.message); console.error(e); }
  };

  window.exportMonthlyByUser = async function(){
    try{
      const { logs, names } = await loadAll();
      const { from, to } = range();
      const { byUser } = aggregate(logs, from, to);

      const list = Object.values(byUser).sort((a,b) =>
        a.month === b.month ? b.co2 - a.co2 : a.month.localeCompare(b.month)
      );
      if(!list.length){ toast('해당 기간 데이터가 없어요'); return; }

      const rows = [['월','참여자','미션수','CO2절감(kg)','uid']];
      list.forEach(d => rows.push([d.month, names[d.uid] || d.uid, d.cnt, r2(d.co2), d.uid]));

      saveCsv('ecoquest_monthly_by_user_' + stamp(from,to) + '.csv', rows);
      toast('📊 월별 참여자별 내보냄');
    } catch(e){ toast('실패: ' + e.message); console.error(e); }
  };

  window.exportMonthlyByType = async function(){
    try{
      const { logs } = await loadAll();
      const { from, to } = range();
      const { byType } = aggregate(logs, from, to);

      const list = Object.values(byType).sort((a,b) =>
        a.month === b.month ? b.co2 - a.co2 : a.month.localeCompare(b.month)
      );
      if(!list.length){ toast('해당 기간 데이터가 없어요'); return; }

      const rows = [['월','미션','건수','CO2절감(kg)']];
      list.forEach(d => rows.push([d.month, d.type, d.cnt, r2(d.co2)]));

      saveCsv('ecoquest_monthly_by_type_' + stamp(from,to) + '.csv', rows);
      toast('📊 월별 미션종류별 내보냄');
    } catch(e){ toast('실패: ' + e.message); console.error(e); }
  };

  window.reloadMonthlyCsv = async function(){
    _cache = null;
    await loadAll(true);
    toast('🔄 데이터 새로 불러옴');
  };

  /* ── 플로팅 패널 ────────────────────────────── */
  function buildPanel(){
    if(document.getElementById('mcPanelBtn')) return;

    const btn = document.createElement('div');
    btn.id = 'mcPanelBtn';
    btn.textContent = '📊';
    btn.style.cssText =
      'position:fixed;right:14px;bottom:78px;width:44px;height:44px;border-radius:22px;' +
      'background:#1a6b3a;color:#fff;display:flex;align-items:center;justify-content:center;' +
      'font-size:20px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;z-index:9998';
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
      'position:fixed;right:14px;bottom:130px;width:236px;background:#fff;border-radius:14px;' +
      'padding:14px;box-shadow:0 8px 28px rgba(0,0,0,.22);z-index:9999;display:none;' +
      'font-family:inherit';
    panel.innerHTML =
      '<div style="font-size:12px;font-weight:900;color:#1a2e1a;margin-bottom:10px">📊 월별 CSV 내보내기</div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">' +
        '<input id="mcFrom" placeholder="2026-07" style="width:50%;padding:7px;border:1px solid #ddd;border-radius:7px;font-size:12px;font-family:inherit;text-align:center"/>' +
        '<span style="font-size:11px;color:#888">~</span>' +
        '<input id="mcTo" placeholder="2026-08" style="width:50%;padding:7px;border:1px solid #ddd;border-radius:7px;font-size:12px;font-family:inherit;text-align:center"/>' +
      '</div>' +
      '<div style="font-size:10px;color:#aaa;margin-bottom:6px">비우면 전체 기간</div>' +
      '<button onclick="exportMonthlySummary()" style="' + bs + 'background:#1a6b3a;color:#fff">월별 요약</button>' +
      '<button onclick="exportMonthlyByUser()" style="' + bs + 'background:#2ECC71;color:#fff">월별 × 참여자</button>' +
      '<button onclick="exportMonthlyByType()" style="' + bs + 'background:#FFB300;color:#5D4037">월별 × 미션종류</button>' +
      '<button onclick="reloadMonthlyCsv()" style="' + bs + 'background:#f0f0f0;color:#666">데이터 새로고침</button>' +
      '<div onclick="document.getElementById(\'mcPanel\').style.display=\'none\'" ' +
        'style="text-align:center;font-size:11px;color:#aaa;margin-top:9px;cursor:pointer">닫기</div>';
    document.body.appendChild(panel);
  }

  function boot(){
    if(!window.FB){ setTimeout(boot, 600); return; }
    buildPanel();
    console.log('[monthlyCsv] ready — exportMonthlySummary() / exportMonthlyByUser() / exportMonthlyByType()');
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1200));
  else
    setTimeout(boot, 1200);

})();
