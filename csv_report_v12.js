// csv_report_v12.js   (v11 대체)
// ─────────────────────────────────────────────────────────────
// v10 → v11
//   1) 관리자 → 통계 탭에 회사별 다운로드 버튼 패널 추가 (원하는 것만 받기)
//   2) '회원별 · 월별 · 미션 상세' 섹션 추가 (누가 언제 뭘 했는지)
//   3) '회원 명부' 섹션 추가 (리워드 발송용 · 이메일/휴대폰)
//   4) 회사별 파일은 그 회사가 실제 활동한 월만 열로 생성 (빈 월 제거)
//   5) CSV 버튼은 전체요약 1개만 다운로드 (전부 받기는 패널에서)
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

  /* ── 다운로드 ── */
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

  /* ── 데이터 ── */
  let _D = null;

  async function gather(force){
    if(_D && !force) return _D;

    const [userSnap, coSnap, logSnap] = await Promise.all([
      window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'companies')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'missionLogs')),
    ]);

    const users = {}; userSnap.docs.forEach(d => users[d.id] = Object.assign({id:d.id}, d.data()));
    const comps = {}; coSnap.docs.forEach(d => comps[d.id] = Object.assign({id:d.id}, d.data()));
    const logs  = logSnap.docs.map(d => d.data());

    const mCo2  = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.co2) || 0;
    const mName = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.name) || id;
    const mEmoji= id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.emoji) || '';

    const coNameOf = uid => {
      const u = users[uid];
      if(!u || !u.companyId) return '(소속 없음)';
      return (comps[u.companyId] && comps[u.companyId].name) || u.companyId;
    };
    const nickOf = uid => (users[uid] && users[uid].nickname) || '(미상)';

    const months = new Set();
    const byCo = {}, byMember = {}, byType = {}, byCoType = {}, byMemMis = {};
    const coMonths = {};
    let dated = 0, undated = 0;

    logs.forEach(l => {
      const mo = rowMonth(l);
      if(!mo){ undated++; return; }
      dated++; months.add(mo);

      const uid = l.uid || 'unknown';
      const c   = coNameOf(uid);
      const mid = l.missionId || '?';
      const co2 = (typeof l.co2 === 'number' && !isNaN(l.co2)) ? l.co2 : mCo2(mid);

      (coMonths[c] = coMonths[c] || new Set()).add(mo);

      const a = byCo[c+'|'+mo] = byCo[c+'|'+mo] || {c, mo, n:0, v:0, u:new Set()};
      a.n++; a.v += co2; a.u.add(uid);

      const b = byMember[c+'|'+uid+'|'+mo] = byMember[c+'|'+uid+'|'+mo] || {c, uid, mo, n:0, v:0};
      b.n++; b.v += co2;

      const t = byType[mid+'|'+mo] = byType[mid+'|'+mo] || {mid, mo, n:0, v:0};
      t.n++; t.v += co2;

      const ct = byCoType[c+'|'+mid+'|'+mo] = byCoType[c+'|'+mid+'|'+mo] || {c, mid, mo, n:0, v:0};
      ct.n++; ct.v += co2;

      const mm = byMemMis[c+'|'+uid+'|'+mo+'|'+mid] = byMemMis[c+'|'+uid+'|'+mo+'|'+mid] || {c, uid, mo, mid, n:0, v:0};
      mm.n++; mm.v += co2;
    });

    Object.keys(coMonths).forEach(c => coMonths[c] = [...coMonths[c]].sort());

    _D = {
      users, comps, logs,
      months: [...months].sort(), coMonths,
      byCo, byMember, byType, byCoType, byMemMis,
      dated, undated, mName, mCo2, mEmoji, coNameOf, nickOf,
      companyNames: Object.keys(coMonths).sort()
    };
    return _D;
  }

  const monthsOf = (D, co) => co ? (D.coMonths[co] || []) : D.months;

  /* ── 블록: 월별 요약 ── */
  function monthlyBlock(D, co){
    const M = monthsOf(D, co);
    const rows = [['월','활동 회원수','미션수','CO2 절감(kg)','자동차 환산(km)','일회용컵 환산(개)','나무(그루)']];
    let tn=0, tv=0; const tu=new Set();
    M.forEach(mo => {
      const recs = Object.values(D.byCo).filter(x => x.mo===mo && (!co || x.c===co));
      let n=0, v=0; const u=new Set();
      recs.forEach(x => { n+=x.n; v+=x.v; x.u.forEach(k=>u.add(k)); });
      tn+=n; tv+=v; u.forEach(k=>tu.add(k));
      rows.push([mo, u.size, n, r2(v), Math.round(v/0.21), Math.round(v/0.011), r2(v/21.4)]);
    });
    rows.push(['합계', tu.size, tn, r2(tv), Math.round(tv/0.21), Math.round(tv/0.011), r2(tv/21.4)]);
    return rows;
  }

  /* ── 블록: 회원 × 월 ── */
  function memberBlock(D, co){
    const M = monthsOf(D, co);
    const rows = [['닉네임', ...M.map(m=>m+' 미션'), ...M.map(m=>m+' CO2(kg)'), '합계 미션','합계 CO2(kg)']];
    const per = {};
    Object.values(D.byMember).filter(x => x.c===co).forEach(x => {
      const p = per[x.uid] = per[x.uid] || {n:{},v:{},tn:0,tv:0};
      p.n[x.mo]=x.n; p.v[x.mo]=x.v; p.tn+=x.n; p.tv+=x.v;
    });
    const cN={}, cV={}; M.forEach(m=>{cN[m]=0;cV[m]=0;});
    let gn=0, gv=0;
    const uids = Object.keys(per).sort((a,b)=>per[b].tv-per[a].tv);
    uids.forEach(uid => {
      const p = per[uid];
      M.forEach(m=>{ cN[m]+=(p.n[m]||0); cV[m]+=(p.v[m]||0); });
      gn+=p.tn; gv+=p.tv;
      rows.push([D.nickOf(uid), ...M.map(m=>p.n[m]||0), ...M.map(m=>r2(p.v[m]||0)), p.tn, r2(p.tv)]);
    });
    rows.push(['합계', ...M.map(m=>cN[m]), ...M.map(m=>r2(cV[m])), gn, r2(gv)]);
    return { rows, uids };
  }

  /* ── ★ 블록: 회원 × 월 × 미션 상세 ── */
  function memberMissionBlock(D, co){
    const M = monthsOf(D, co);
    const recs = Object.values(D.byMemMis).filter(x => x.c===co);
    const mids = [...new Set(recs.map(x=>x.mid))].sort((a,b)=>
      (parseInt(String(a).replace(/\D/g,''))||999) - (parseInt(String(b).replace(/\D/g,''))||999));

    const rows = [['닉네임','월', ...mids.map(id => D.mEmoji(id)+D.mName(id)), '월 합계 미션','월 합계 CO2(kg)']];

    const map = {};
    recs.forEach(x => {
      const k = x.uid+'|'+x.mo;
      const e = map[k] = map[k] || {uid:x.uid, mo:x.mo, c:{}, n:0, v:0};
      e.c[x.mid] = x.n; e.n += x.n; e.v += x.v;
    });

    Object.values(map)
      .sort((a,b) => a.uid===b.uid ? a.mo.localeCompare(b.mo) : D.nickOf(a.uid).localeCompare(D.nickOf(b.uid)))
      .forEach(e => rows.push([D.nickOf(e.uid), e.mo, ...mids.map(id => e.c[id]||0), e.n, r2(e.v)]));

    const col = {}; mids.forEach(id => col[id]=0);
    let gn=0, gv=0;
    Object.values(map).forEach(e => { mids.forEach(id => col[id]+=(e.c[id]||0)); gn+=e.n; gv+=e.v; });
    rows.push(['합계','', ...mids.map(id=>col[id]), gn, r2(gv)]);
    return rows;
  }

  /* ── 블록: 미션종류 × 월 ── */
  function typeBlock(D, co){
    const M = monthsOf(D, co);
    const src = co ? Object.values(D.byCoType).filter(x=>x.c===co) : Object.values(D.byType);
    const rows = [['미션ID','미션명', ...M.map(m=>m+' 건수'), ...M.map(m=>m+' CO2(kg)'), '합계 건수','합계 CO2(kg)']];
    const mids = [...new Set(src.map(x=>x.mid))].sort((a,b)=>
      (parseInt(String(a).replace(/\D/g,''))||999) - (parseInt(String(b).replace(/\D/g,''))||999));
    const cN={}, cV={}; M.forEach(m=>{cN[m]=0;cV[m]=0;});
    let gn=0, gv=0;
    mids.forEach(mid => {
      const n={}, v={};
      src.filter(x=>x.mid===mid).forEach(x=>{ n[x.mo]=x.n; v[x.mo]=x.v; });
      let rn=0, rv=0;
      M.forEach(m=>{ rn+=(n[m]||0); rv+=(v[m]||0); cN[m]+=(n[m]||0); cV[m]+=(v[m]||0); });
      gn+=rn; gv+=rv;
      rows.push([mid, D.mName(mid), ...M.map(m=>n[m]||0), ...M.map(m=>r2(v[m]||0)), rn, r2(rv)]);
    });
    rows.push(['','합계', ...M.map(m=>cN[m]), ...M.map(m=>r2(cV[m])), gn, r2(gv)]);
    return rows;
  }

  /* ── 블록: 회원 명부 (발송용) ── */
  function rosterBlock(D, co, uids){
    const rows = [['닉네임','이메일','휴대폰','지역','나이대','성별','직업','누적 CO2(kg)','포인트']];
    uids.forEach(uid => {
      const u = D.users[uid] || {};
      rows.push([
        D.nickOf(uid), u.email||'', u.phoneNumber||u.phone||u.kakaoPhone||'',
        u.region||'', u.age||'', u.gender||'', u.job||'',
        (u.co2||0).toFixed(2), u.point||0
      ]);
    });
    return rows;
  }

  /* ── 회사 파일 ── */
  function companyRows(D, co){
    const M = monthsOf(D, co);
    const mb = memberBlock(D, co);
    const rows = [];

    rows.push(['EcoQuest 탄소감축 리포트']);
    rows.push(['기업', co]);
    rows.push(['기간', M.length ? (M[0] + ' ~ ' + M[M.length-1]) : '-']);
    rows.push(['활동 회원 수', mb.uids.length]);
    rows.push(['생성일', today()]);
    rows.push([]);

    rows.push(['=== 월별 요약 ===']);
    monthlyBlock(D, co).forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['=== 회원별 · 월별 ===']);
    mb.rows.forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['=== 회원별 · 월별 · 미션 상세 ===']);
    memberMissionBlock(D, co).forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['=== 미션종류별 · 월별 ===']);
    typeBlock(D, co).forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['=== 회원 명부 (리워드 발송용 · 외부 공유 시 삭제) ===']);
    rosterBlock(D, co, mb.uids).forEach(r => rows.push(r));
    rows.push([]);

    rows.push(['※ CO2 절감량은 활동별 배출계수 기반 추정치입니다.']);
    rows.push(['※ 환산 — 자동차 0.21kgCO2/km, 일회용컵 0.011kg/개, 나무 21.4kg/그루·년']);
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
    Object.values(D.byCo).sort((a,b)=> a.mo===b.mo ? b.v-a.v : a.mo.localeCompare(b.mo))
      .forEach(x => rows.push([x.mo, x.c, x.u.size, x.n, r2(x.v), x.u.size ? r2(x.v/x.u.size) : 0]));
    rows.push([]);

    rows.push(['=== 기업별 누적 ===']);
    rows.push(['기업','활동 기간','활동 회원수','미션수','CO2 절감(kg)','1인당(kg)']);
    D.companyNames.forEach(c => {
      const M = D.coMonths[c];
      const recs = Object.values(D.byCo).filter(x=>x.c===c);
      let n=0, v=0; const u=new Set();
      recs.forEach(x => { n+=x.n; v+=x.v; x.u.forEach(k=>u.add(k)); });
      rows.push([c, M[0]+' ~ '+M[M.length-1], u.size, n, r2(v), u.size ? r2(v/u.size) : 0]);
    });
    rows.push([]);

    rows.push(['=== 월별 × 미션종류 (전체) ===']);
    typeBlock(D, null).forEach(r => rows.push(r));
    return rows;
  }

  /* ── 실행 ── */
  async function exportOverall(){
    try{
      window.toast && window.toast('집계 중...');
      const D = await gather(true);
      if(!D.months.length){ window.toast && window.toast('날짜 있는 로그가 없어요'); return; }
      download('EcoQuest_전체요약_' + today() + '.csv', overallRows(D));
      window.toast && window.toast('전체요약 다운로드 (' + D.months.join(', ') + ')');
    }catch(e){ window.toast && window.toast('실패: '+e.message); console.error(e); }
  }

  async function exportCompany(co){
    try{
      window.toast && window.toast(co + ' 집계 중...');
      const D = await gather();
      if(!D.coMonths[co]){ window.toast && window.toast(co + ' 활동 기록이 없어요'); return; }
      const safe = String(co).replace(/[\\/:*?"<>|]/g,'_');
      download('EcoQuest_' + safe + '_' + today() + '.csv', companyRows(D, co));
      window.toast && window.toast(co + ' 다운로드 완료');
    }catch(e){ window.toast && window.toast('실패: '+e.message); console.error(e); }
  }

  async function exportAll(){
    try{
      window.toast && window.toast('전체 집계 중...');
      const D = await gather(true);
      const files = [['EcoQuest_전체요약_' + today() + '.csv', overallRows(D)]];
      D.companyNames.forEach(c => {
        const safe = String(c).replace(/[\\/:*?"<>|]/g,'_');
        files.push(['EcoQuest_' + safe + '_' + today() + '.csv', companyRows(D, c)]);
      });
      files.forEach((f,i) => setTimeout(()=>download(f[0], f[1]), i*700));
      window.toast && window.toast(files.length + '개 파일 다운로드');
    }catch(e){ window.toast && window.toast('실패: '+e.message); console.error(e); }
  }

  window.exportOverallCSV = exportOverall;
  window.exportCompanyCSV = exportCompany;
  window.exportAllCSV     = exportAll;
  window.exportDetailedCSV= exportOverall;

  /* ── 버튼 패널 ── */
  const BS = 'padding:9px 12px;border-radius:10px;border:none;font-size:12px;font-weight:700;' +
             'cursor:pointer;font-family:inherit;white-space:nowrap;';

  async function renderPanel(){
    const box = document.getElementById('eqDlBox');
    if(!box) return;
    let D;
    try { D = await gather(); }
    catch(e){ box.innerHTML = shell('<div style="color:#c00;font-size:12px">로딩 실패: '+e.message+'</div>'); return; }

    // onclick 속성을 쓰지 않는다 (다른 패치의 CSV 가로채기에 걸리지 않도록)
    const btns = D.companyNames.map((c, i) => {
      const M = D.coMonths[c];
      const recs = Object.values(D.byCo).filter(x=>x.c===c);
      let v=0; const u=new Set();
      recs.forEach(x=>{ v+=x.v; x.u.forEach(k=>u.add(k)); });
      return '<button data-eqco="' + i + '" ' +
        'style="' + BS + 'background:#f0fbf4;color:#1a6b3a;border:1.5px solid #2ECC71;text-align:left">' +
        '<div style="font-size:12px;font-weight:900">' + c + '</div>' +
        '<div style="font-size:10px;font-weight:400;color:#666;margin-top:2px">' +
        u.size + '명 · ' + r2(v) + 'kg · ' + M.length + '개월</div></button>';
    }).join('');

    box.innerHTML = shell(
      '<div style="display:flex;gap:6px;margin-bottom:8px">' +
        '<button data-eq="overall" style="' + BS + 'background:#1a1a2e;color:#fff;flex:1">📊 전체 요약</button>' +
        '<button data-eq="all" style="' + BS + 'background:#F39C12;color:#fff;flex:1">📦 전부 받기</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + btns + '</div>' +
      '<div style="font-size:10px;color:#aaa;margin-top:8px;line-height:1.6">' +
        '기간 ' + (D.months[0]||'-') + ' ~ ' + (D.months[D.months.length-1]||'-') +
        ' · 로그 ' + D.dated + '건 집계' + (D.undated ? ' · 날짜없어 제외 ' + D.undated + '건' : '') +
      '</div>'
    );

    // 캡처 단계에서 직접 처리 — 다른 리스너보다 먼저 잡고 전파 차단
    box.addEventListener('click', function(e){
      const b = e.target.closest('button');
      if(!b || !box.contains(b)) return;
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
      const kind = b.getAttribute('data-eq');
      const idx  = b.getAttribute('data-eqco');
      if(kind === 'overall') exportOverall();
      else if(kind === 'all') exportAll();
      else if(kind === 'reload') window.eqDlReload();
      else if(idx !== null) exportCompany(D.companyNames[parseInt(idx)]);
    }, true);
  }

  function shell(inner){
    return '<div style="background:#fff;border-radius:14px;padding:14px;border:1px solid #eee;margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<div style="font-size:14px;font-weight:900">📥 리포트 다운로드</div>' +
        '<button data-eq="reload" style="background:#f0f0f0;border:none;border-radius:8px;padding:5px 10px;' +
        'font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">새로고침</button>' +
      '</div>' + inner + '</div>';
  }

  window.eqDlReload = async function(){
    const box = document.getElementById('eqDlBox');
    if(box) box.innerHTML = shell('<div style="color:#aaa;font-size:12px;padding:6px">불러오는 중...</div>');
    await gather(true);
    renderPanel();
  };

  function mount(){
    const stats = document.getElementById('admin-stats');
    if(!stats || stats.style.display === 'none') return;
    if(document.getElementById('eqDlBox')) return;
    const box = document.createElement('div');
    box.id = 'eqDlBox';
    box.innerHTML = shell('<div style="color:#aaa;font-size:12px;padding:6px">불러오는 중...</div>');
    const cards = document.getElementById('adminStatCards');
    if(cards && cards.parentNode === stats) cards.insertAdjacentElement('afterend', box);
    else stats.insertBefore(box, stats.firstChild);
    renderPanel();
  }
  setInterval(mount, 1200);

  /* ── 기존 CSV 버튼 → 전체요약만 ── */
  HTMLAnchorElement.prototype.click = function(){
    const dl = (this.download || '');
    if(dl.toLowerCase().endsWith('.csv') && !this._eqOwn){
      console.log('[csv v12] 가로채기:', dl);
      setTimeout(exportOverall, 50);
      return;
    }
    return origAnchorClick.apply(this, arguments);
  };

  document.addEventListener('click', function(e){
    const el = e.target.closest('button, a');
    if(!el) return;
    if(el.closest('#eqDlBox')) return;
    const text = (el.textContent || '').trim();
    const onclick = el.getAttribute('onclick') || '';
    if(/csv/i.test(text) || /csv/i.test(onclick)){
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
      exportOverall();
      return false;
    }
  }, true);

  function install(){
    window.exportCSV = exportOverall;
    if('ehExportCSV' in window)  window.ehExportCSV  = exportOverall;
    if('esgExportCSV' in window) window.esgExportCSV = exportOverall;
  }
  install();
  setInterval(install, 1000);

  console.log('%c[csv v12] 버튼 패널 + 미션 상세 준비됨','color:#fff;background:#1a1a2e;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
