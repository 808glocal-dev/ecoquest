// csv_detail_patch.js v10
// ─────────────────────────────────────────────────────────────
// 이 파일 하나면 됩니다. monthly_* 패치들은 모두 삭제하세요.
//
// CSV 버튼 한 번 → 파일이 회사 수만큼 각각 다운로드됩니다.
//   1) EcoQuest_전체요약_날짜.csv      — 월별 전체 / 월별×기업 / 월별×미션 / 기업 누적
//   2) EcoQuest_[회사명]_날짜.csv      — 회사별. 월별 요약 + 회원×월 + 미션×월 (합계 자동)
//
// 월 판정 기준: missionLogs 의 date 필드
// ─────────────────────────────────────────────────────────────
(function(){
  'use strict';

  const DT = ['date','createdAt','completedAt','ts','timestamp'];
  const r2 = n => Math.round(n*100)/100;
  const today = () => new Date().toISOString().split('T')[0];

  function monthKey(v){
    if(v == null) return null;
    let d;
    if(typeof v === 'string'){
      const m = v.match(/^(\d{4})[-./]?(\d{1,2})/);
      if(m) return m[1] + '-' + String(m[2]).padStart(2,'0');
      d = new Date(v);
    } else if(typeof v === 'number'){ d = new Date(v < 1e12 ? v*1000 : v); }
    else if(typeof v.toDate === 'function'){ d = v.toDate(); }
    else if(v.seconds != null){ d = new Date(v.seconds*1000); }
    else if(v instanceof Date){ d = v; }
    if(!d || isNaN(d.getTime())) return null;
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  }
  const rowMonth = r => { for(const k of DT) if(r[k] != null){ const m = monthKey(r[k]); if(m) return m; } return null; };

  /* ── 다운로드 (자기 파일은 가로채기 우회) ── */
  const origAnchorClick = HTMLAnchorElement.prototype.click;
  function download(filename, rows){
    const esc = v => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    };
    const csv = rows.map(r => (r||[]).map(esc).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'}));
    a.download = filename;
    a._eqOwn = true;
    origAnchorClick.call(a);
  }

  /* ── 데이터 수집 ── */
  async function gather(){
    const [userSnap, coSnap, logSnap] = await Promise.all([
      window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'companies')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'missionLogs')),
    ]);

    const users = {};      userSnap.docs.forEach(d => users[d.id] = Object.assign({id:d.id}, d.data()));
    const comps = {};      coSnap.docs.forEach(d => comps[d.id] = Object.assign({id:d.id}, d.data()));
    const logs  = logSnap.docs.map(d => d.data());

    const mCo2  = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.co2) || 0;
    const mName = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.name) || id;

    const coNameOf = uid => {
      const u = users[uid];
      if(!u || !u.companyId) return '(소속 없음)';
      return (comps[u.companyId] && comps[u.companyId].name) || u.companyId;
    };
    const nickOf = uid => (users[uid] && users[uid].nickname) || '(미상)';

    const months = new Set();
    const byCo = {}, byMember = {}, byType = {}, byCoType = {};
    let dated = 0, undated = 0;

    logs.forEach(l => {
      const mo = rowMonth(l);
      if(!mo){ undated++; return; }
      dated++; months.add(mo);

      const uid = l.uid || 'unknown';
      const c   = coNameOf(uid);
      const mid = l.missionId || '?';
      const co2 = (typeof l.co2 === 'number' && !isNaN(l.co2)) ? l.co2 : mCo2(mid);

      const a = byCo[c+'|'+mo] = byCo[c+'|'+mo] || {c, mo, n:0, v:0, u:new Set()};
      a.n++; a.v += co2; a.u.add(uid);

      const b = byMember[c+'|'+uid+'|'+mo] = byMember[c+'|'+uid+'|'+mo] || {c, uid, mo, n:0, v:0};
      b.n++; b.v += co2;

      const t = byType[mid+'|'+mo] = byType[mid+'|'+mo] || {mid, mo, n:0, v:0};
      t.n++; t.v += co2;

      const ct = byCoType[c+'|'+mid+'|'+mo] = byCoType[c+'|'+mid+'|'+mo] || {c, mid, mo, n:0, v:0};
      ct.n++; ct.v += co2;
    });

    return {
      users, comps, logs, months:[...months].sort(),
      byCo, byMember, byType, byCoType,
      dated, undated, mName, mCo2, coNameOf, nickOf,
      companyNames: [...new Set(Object.values(byCo).map(x=>x.c))].sort()
    };
  }

  /* ── 월별 요약 블록 (합계 자동) ── */
  function monthlyBlock(D, filterCo){
    const M = D.months;
    const rows = [];
    rows.push(['월','활동 회원수','미션수','CO2 절감(kg)','자동차 환산(km)','일회용컵 환산(개)','나무(그루)']);

    let tn = 0, tv = 0; const tu = new Set();
    M.forEach(mo => {
      const recs = Object.values(D.byCo).filter(x => x.mo === mo && (!filterCo || x.c === filterCo));
      if(!recs.length) return;
      let n=0, v=0; const u=new Set();
      recs.forEach(x => { n+=x.n; v+=x.v; x.u.forEach(k=>u.add(k)); });
      tn += n; tv += v; u.forEach(k=>tu.add(k));
      rows.push([mo, u.size, n, r2(v), Math.round(v/0.21), Math.round(v/0.011), r2(v/21.4)]);
    });
    rows.push(['합계', tu.size, tn, r2(tv), Math.round(tv/0.21), Math.round(tv/0.011), r2(tv/21.4)]);
    return rows;
  }

  /* ── 회원 × 월 블록 (행 합계 + 열 합계) ── */
  function memberBlock(D, coName){
    const M = D.months;
    const rows = [];
    rows.push(['닉네임',
      ...M.map(mo => mo + ' 미션'),
      ...M.map(mo => mo + ' CO2(kg)'),
      '합계 미션','합계 CO2(kg)']);

    const per = {};
    Object.values(D.byMember).filter(x => x.c === coName).forEach(x => {
      const p = per[x.uid] = per[x.uid] || {n:{}, v:{}, tn:0, tv:0};
      p.n[x.mo] = x.n; p.v[x.mo] = x.v; p.tn += x.n; p.tv += x.v;
    });

    const colN = {}, colV = {};
    M.forEach(mo => { colN[mo] = 0; colV[mo] = 0; });
    let gn = 0, gv = 0;

    Object.keys(per).sort((a,b) => per[b].tv - per[a].tv).forEach(uid => {
      const p = per[uid];
      M.forEach(mo => { colN[mo] += (p.n[mo]||0); colV[mo] += (p.v[mo]||0); });
      gn += p.tn; gv += p.tv;
      rows.push([D.nickOf(uid),
        ...M.map(mo => p.n[mo] || 0),
        ...M.map(mo => r2(p.v[mo] || 0)),
        p.tn, r2(p.tv)]);
    });

    rows.push(['합계',
      ...M.map(mo => colN[mo]),
      ...M.map(mo => r2(colV[mo])),
      gn, r2(gv)]);

    return { rows, memberCount: Object.keys(per).length };
  }

  /* ── 미션종류 × 월 블록 ── */
  function typeBlock(D, filterCo){
    const M = D.months;
    const src = filterCo
      ? Object.values(D.byCoType).filter(x => x.c === filterCo)
      : Object.values(D.byType);

    const rows = [];
    rows.push(['미션ID','미션명',
      ...M.map(mo => mo + ' 건수'),
      ...M.map(mo => mo + ' CO2(kg)'),
      '합계 건수','합계 CO2(kg)']);

    const mids = [...new Set(src.map(x => x.mid))].sort((a,b) =>
      (parseInt(String(a).replace(/\D/g,''))||999) - (parseInt(String(b).replace(/\D/g,''))||999));

    const colN = {}, colV = {};
    M.forEach(mo => { colN[mo] = 0; colV[mo] = 0; });
    let gn = 0, gv = 0;

    mids.forEach(mid => {
      const n = {}, v = {};
      src.filter(x => x.mid === mid).forEach(x => { n[x.mo] = x.n; v[x.mo] = x.v; });
      let rn = 0, rv = 0;
      M.forEach(mo => {
        rn += (n[mo]||0); rv += (v[mo]||0);
        colN[mo] += (n[mo]||0); colV[mo] += (v[mo]||0);
      });
      gn += rn; gv += rv;
      rows.push([mid, D.mName(mid),
        ...M.map(mo => n[mo] || 0),
        ...M.map(mo => r2(v[mo] || 0)),
        rn, r2(rv)]);
    });

    rows.push(['','합계',
      ...M.map(mo => colN[mo]),
      ...M.map(mo => r2(colV[mo])),
      gn, r2(gv)]);

    return rows;
  }

  /* ── 회사별 파일 ── */
  function companyRows(D, coName){
    const rows = [];
    const mb = memberBlock(D, coName);

    rows.push(['EcoQuest 탄소감축 리포트']);
    rows.push(['기업', coName]);
    rows.push(['기간', D.months.length ? (D.months[0] + ' ~ ' + D.months[D.months.length-1]) : '-']);
    rows.push(['활동 회원 수', mb.memberCount]);
    rows.push(['생성일', today()]);
    rows.push([]);

    rows.push(['=== 월별 요약 ===']);
    monthlyBlock(D, coName).forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['=== 회원별 · 월별 ===']);
    mb.rows.forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['=== 미션종류별 · 월별 ===']);
    typeBlock(D, coName).forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['※ CO2 절감량은 활동별 배출계수 기반 추정치입니다.']);
    rows.push(['※ 환산 기준 — 자동차 0.21kgCO2/km, 일회용컵 0.011kg/개, 나무 21.4kg/그루·년']);
    return rows;
  }

  /* ── 전체요약 파일 ── */
  function overallRows(D){
    const rows = [];
    rows.push(['EcoQuest 전체 요약']);
    rows.push(['생성일', today()]);
    rows.push(['missionLogs 총 건수', D.logs.length]);
    rows.push(['월별 집계 성공', D.dated]);
    rows.push(['날짜 없어 제외', D.undated]);
    rows.push(['인식된 월', D.months.join(' / ') || '(없음)']);
    rows.push([]);

    rows.push(['=== 월별 전체 합계 ===']);
    monthlyBlock(D, null).forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['=== 월별 × 기업 ===']);
    rows.push(['월','기업','활동 회원수','미션수','CO2 절감(kg)','1인당(kg)']);
    Object.values(D.byCo)
      .sort((a,b) => a.mo === b.mo ? b.v - a.v : a.mo.localeCompare(b.mo))
      .forEach(x => rows.push([x.mo, x.c, x.u.size, x.n, r2(x.v), x.u.size ? r2(x.v/x.u.size) : 0]));
    rows.push([]);

    rows.push(['=== 기업별 누적 (전 기간) ===']);
    rows.push(['기업','활동 회원수','미션수','CO2 절감(kg)','1인당(kg)']);
    D.companyNames.forEach(c => {
      const recs = Object.values(D.byCo).filter(x => x.c === c);
      let n=0, v=0; const u=new Set();
      recs.forEach(x => { n+=x.n; v+=x.v; x.u.forEach(k=>u.add(k)); });
      rows.push([c, u.size, n, r2(v), u.size ? r2(v/u.size) : 0]);
    });
    rows.push([]);

    rows.push(['=== 월별 × 미션종류 (전체) ===']);
    typeBlock(D, null).forEach(r => rows.push(r));
    return rows;
  }

  /* ── 메인 ── */
  async function exportDetailedCSV(opts){
    opts = opts || {};
    try{
      window.toast && window.toast('📊 집계 중...');
      const D = await gather();

      if(!D.months.length){
        window.toast && window.toast('날짜 있는 로그가 없어 월별 집계 불가');
        console.warn('[csv v10] 샘플 로그:', D.logs[0]);
        return;
      }

      const targets = opts.only ? [opts.only] : D.companyNames;
      const files = [];

      if(!opts.only) files.push(['EcoQuest_전체요약_' + today() + '.csv', overallRows(D)]);
      targets.forEach(c => {
        const safe = String(c).replace(/[\\/:*?"<>|]/g, '_');
        files.push(['EcoQuest_' + safe + '_' + today() + '.csv', companyRows(D, c)]);
      });

      files.forEach((f, i) => setTimeout(() => download(f[0], f[1]), i * 700));

      window.toast && window.toast('✅ ' + files.length + '개 파일 다운로드 (' + D.months.join(', ') + ')');
      console.log('%c[csv v10] ✅ ' + files.length + '개 파일',
        'color:#fff;background:#1a6b3a;padding:3px 8px;border-radius:4px');
      console.log('월:', D.months.join(', '));
      console.log('집계 ' + D.dated + '건 / 날짜없어 제외 ' + D.undated + '건');
      console.log('파일:', files.map(f=>f[0]).join('\n  '));
    } catch(e){
      window.toast && window.toast('실패: ' + e.message);
      console.error('[csv v10]', e);
    }
  }

  window.exportDetailedCSV = exportDetailedCSV;
  window.exportCompanyCSV  = c => exportDetailedCSV({ only: c });

  /* ── 버튼 연결 ── */
  HTMLAnchorElement.prototype.click = function(){
    const dl = (this.download || '');
    if(dl.toLowerCase().endsWith('.csv') && !this._eqOwn){
      console.log('[csv v10] 가로채기:', dl);
      setTimeout(() => exportDetailedCSV(), 50);
      return;
    }
    return origAnchorClick.apply(this, arguments);
  };

  document.addEventListener('click', function(e){
    const el = e.target.closest('button, a');
    if(!el) return;
    const text = (el.textContent || '').trim();
    const onclick = el.getAttribute('onclick') || '';
    if(/csv/i.test(text) || /csv/i.test(onclick)){
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      exportDetailedCSV();
      return false;
    }
  }, true);

  function install(){
    window.exportCSV = exportDetailedCSV;
    if('ehExportCSV' in window)  window.ehExportCSV  = exportDetailedCSV;
    if('esgExportCSV' in window) window.esgExportCSV = exportDetailedCSV;
  }
  install();
  setInterval(install, 1000);

  console.log('%c[csv v10] 회사별 월별 CSV 준비됨','color:#fff;background:#1a1a2e;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
