/* monthly_detail_csv_patch.js  v1
   csv_detail_patch.js 는 user.doneMissions(날짜 없음)를 세기 때문에 월별 분리가 불가능.
   이 패치는 missionLogs(date 필드 보유)를 소스로 같은 구조의 리포트를 월별로 생성한다.

   출력 섹션
     1. 월별 × 기업 요약
     2. 기업별 · 월별 × 회원
     3. 월별 × 미션종류
     4. 진단 정보
*/
(function(){
  'use strict';

  const CO2_KEYS  = ['co2','co2Reduced','co2Saved','CO2'];
  const DATE_KEYS = ['date','createdAt','completedAt','ts','timestamp'];
  const r2 = n => Math.round(n*100)/100;
  const toast = m => { if(window.toast) window.toast(m); else console.log(m); };

  function toMonthKey(v){
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
  function pickMonth(r){
    for(const k of DATE_KEYS){ if(r[k] != null){ const m = toMonthKey(r[k]); if(m) return m; } }
    return null;
  }
  function pickCo2(r){
    for(const k of CO2_KEYS){ const v = Number(r[k]); if(!isNaN(v) && v !== 0) return v; }
    return 0;
  }

  /* ── 로드 ───────────────────────────────── */
  async function loadAll(){
    if(!window.FB || !window.FB.db) throw new Error('Firebase 미초기화');
    const C = window.FB.collection, D = window.FB.db, G = window.FB.getDocs;

    const [logSnap, userSnap, coSnap] = await Promise.all([
      G(C(D,'missionLogs')),
      G(C(D,'users')),
      G(C(D,'companies')).catch(()=>({forEach:()=>{}}))
    ]);

    const logs = [];  logSnap.forEach(d => logs.push(Object.assign({_id:d.id}, d.data())));
    const users = {}; userSnap.forEach(d => users[d.id] = Object.assign({id:d.id}, d.data()));
    const companies = {}; coSnap.forEach(d => companies[d.id] = Object.assign({id:d.id}, d.data()));

    return { logs, users, companies };
  }

  /* ── 집계 ───────────────────────────────── */
  function build(logs, users, companies, from, to){
    const NO_CO = '(소속 없음)';
    const coName = uid => {
      const u = users[uid];
      if(!u || !u.companyId) return NO_CO;
      return (companies[u.companyId] && companies[u.companyId].name) || u.companyId;
    };
    const nick = uid => (users[uid] && (users[uid].nickname || users[uid].name)) || '(탈퇴/미상)';

    const months = new Set();
    const coMonth = {};      // 기업|월
    const memberMonth = {};  // 기업|uid|월
    const typeMonth = {};    // 미션|월
    let dated = 0, undated = 0, orphan = 0;

    logs.forEach(r => {
      const m = pickMonth(r);
      if(!m){ undated++; return; }
      dated++;
      if(from && m < from) return;
      if(to   && m > to)   return;
      months.add(m);

      const uid = r.uid || r.userId || 'unknown';
      if(!users[uid]) orphan++;
      const co  = coName(uid);
      const co2 = pickCo2(r);
      const mid = r.missionId || 'unknown';
      const mnm = r.missionName || mid;

      const ck = co + '|' + m;
      if(!coMonth[ck]) coMonth[ck] = { co, month:m, cnt:0, co2:0, users:new Set() };
      coMonth[ck].cnt++; coMonth[ck].co2 += co2; coMonth[ck].users.add(uid);

      const mk = co + '|' + uid + '|' + m;
      if(!memberMonth[mk]) memberMonth[mk] = { co, uid, month:m, cnt:0, co2:0 };
      memberMonth[mk].cnt++; memberMonth[mk].co2 += co2;

      const tk = mid + '|' + m;
      if(!typeMonth[tk]) typeMonth[tk] = { mid, mnm, month:m, cnt:0, co2:0, users:new Set() };
      typeMonth[tk].cnt++; typeMonth[tk].co2 += co2; typeMonth[tk].users.add(uid);
    });

    return { months:[...months].sort(), coMonth, memberMonth, typeMonth,
             dated, undated, orphan, total:logs.length, coName, nick };
  }

  /* ── CSV ────────────────────────────────── */
  function saveCsv(filename, rows){
    const csv = rows.map(row => (row||[]).map(c => {
      const s = (c == null ? '' : String(c));
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    }).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
  }

  function range(){
    const f = (document.getElementById('mdFrom')||{}).value || '';
    const t = (document.getElementById('mdTo')||{}).value || '';
    return { from:f.trim(), to:t.trim() };
  }

  /* ── 메인 ───────────────────────────────── */
  window.exportMonthlyDetail = async function(opts){
    opts = opts || {};
    try{
      toast('📊 missionLogs 집계 중...');
      const { logs, users, companies } = await loadAll();
      const { from, to } = range();
      const B = build(logs, users, companies, from, to);

      if(!B.months.length){
        toast('집계 가능한 데이터가 없어요 (로그 ' + B.total + '건)');
        console.warn('[monthlyDetail] 샘플 로그:', logs[0]);
        return;
      }

      const rows = [];
      const M = B.months;

      /* 1. 월별 × 기업 */
      rows.push(['=== 월별 × 기업 요약 ===']);
      rows.push(['월','기업','활동 회원수','미션수','CO2 절감(kg)','1인당(kg)']);
      const coKeys = Object.values(B.coMonth).sort((a,b)=>
        a.month===b.month ? b.co2-a.co2 : a.month.localeCompare(b.month));
      coKeys.forEach(d => rows.push([
        d.month, d.co, d.users.size, d.cnt, r2(d.co2),
        d.users.size ? r2(d.co2/d.users.size) : 0
      ]));

      /* 월 합계 */
      rows.push([]);
      rows.push(['=== 월별 전체 합계 ===']);
      rows.push(['월','활동 회원수','미션수','CO2 절감(kg)','자동차 환산(km)','일회용컵 환산(개)']);
      M.forEach(m => {
        let cnt=0, co2=0; const us=new Set();
        Object.values(B.coMonth).filter(d=>d.month===m).forEach(d=>{
          cnt+=d.cnt; co2+=d.co2; d.users.forEach(u=>us.add(u));
        });
        rows.push([m, us.size, cnt, r2(co2), Math.round(co2/0.21), Math.round(co2/0.011)]);
      });

      /* 2. 기업별 · 월별 × 회원 */
      const byCo = {};
      Object.values(B.memberMonth).forEach(d => {
        (byCo[d.co] = byCo[d.co] || []).push(d);
      });
      Object.keys(byCo).sort().forEach(co => {
        if(opts.only && co !== opts.only) return;
        rows.push([]);
        rows.push(['=== [' + co + '] 월별 × 회원 ===']);
        rows.push(['닉네임'].concat(M.map(m=>m+' 미션'), M.map(m=>m+' CO2(kg)'), ['합계 미션','합계 CO2(kg)']));

        const perUser = {};
        byCo[co].forEach(d => {
          const u = perUser[d.uid] = perUser[d.uid] || { cnt:{}, co2:{}, tc:0, tco2:0 };
          u.cnt[d.month] = d.cnt; u.co2[d.month] = d.co2;
          u.tc += d.cnt; u.tco2 += d.co2;
        });
        Object.keys(perUser)
          .sort((a,b)=>perUser[b].tco2 - perUser[a].tco2)
          .forEach(uid => {
            const u = perUser[uid];
            rows.push([B.nick(uid)]
              .concat(M.map(m=>u.cnt[m]||0), M.map(m=>r2(u.co2[m]||0)), [u.tc, r2(u.tco2)]));
          });
      });

      /* 3. 월별 × 미션종류 */
      rows.push([]);
      rows.push(['=== 월별 × 미션종류 ===']);
      rows.push(['미션ID','미션명'].concat(M.map(m=>m+' 건수'), M.map(m=>m+' CO2(kg)')));
      const mids = [...new Set(Object.values(B.typeMonth).map(d=>d.mid))];
      mids.forEach(mid => {
        const recs = Object.values(B.typeMonth).filter(d=>d.mid===mid);
        const nm = recs[0].mnm;
        const cnt = {}, co2 = {};
        recs.forEach(d => { cnt[d.month]=d.cnt; co2[d.month]=d.co2; });
        rows.push([mid, nm].concat(M.map(m=>cnt[m]||0), M.map(m=>r2(co2[m]||0))));
      });

      /* 4. 진단 */
      rows.push([]);
      rows.push(['=== 진단 ===']);
      rows.push(['missionLogs 총 건수', B.total]);
      rows.push(['날짜 인식 성공', B.dated]);
      rows.push(['날짜 없음(집계 제외)', B.undated]);
      rows.push(['users에 없는 uid 로그', B.orphan]);
      rows.push(['인식된 월', B.months.join(' / ')]);

      const tag = (from||'all') + '_' + (to||'all');
      saveCsv('EcoQuest_월별_' + tag + '.csv', rows);
      toast('✅ 월별 CSV 완료 (' + B.dated + '건 집계, ' + B.undated + '건 제외)');
      console.log('[monthlyDetail]', B);
    } catch(e){ toast('실패: ' + e.message); console.error(e); }
  };

  window.exportMonthlyMysc = () => window.exportMonthlyDetail({ only:'MYSC' });

  window.monthlyDetailDebug = async function(){
    const { logs, users, companies } = await loadAll();
    const B = build(logs, users, companies, '', '');
    console.log('── 월별 진단 ──');
    console.log('missionLogs 총 :', B.total);
    console.log('날짜 인식 성공 :', B.dated);
    console.log('날짜 없음      :', B.undated);
    console.log('인식된 월      :', B.months.join(', '));
    B.months.forEach(m => {
      let cnt=0, co2=0; const us=new Set();
      Object.values(B.coMonth).filter(d=>d.month===m).forEach(d=>{
        cnt+=d.cnt; co2+=d.co2; d.users.forEach(u=>us.add(u));
      });
      console.log('  ' + m + ' → ' + cnt + '건 / ' + r2(co2) + 'kg / ' + us.size + '명');
    });
    if(logs[0]) console.log('로그 필드:', Object.keys(logs[0]).join(', '));
    toast('진단 결과는 콘솔(F12)에 출력했어요');
    return B;
  };

  /* ── 관리자 전용 버튼 ───────────────────── */
  const isAdmin = () => window.ME && window.ADMIN && window.ME.email === window.ADMIN;

  function buildPanel(){
    if(document.getElementById('mdBtn')) return;

    const btn = document.createElement('div');
    btn.id = 'mdBtn';
    btn.textContent = '📅';
    btn.style.cssText =
      'position:fixed;right:14px;bottom:82px;width:44px;height:44px;border-radius:22px;' +
      'background:#1a1a2e;color:#fff;display:flex;align-items:center;justify-content:center;' +
      'font-size:20px;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;z-index:9998';
    btn.onclick = () => {
      const p = document.getElementById('mdPanel');
      p.style.display = (p.style.display === 'none') ? 'block' : 'none';
    };
    document.body.appendChild(btn);

    const bs = 'width:100%;padding:11px;margin-top:7px;border:none;border-radius:9px;' +
               'font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;';

    const p = document.createElement('div');
    p.id = 'mdPanel';
    p.style.cssText =
      'position:fixed;right:14px;bottom:134px;width:244px;background:#fff;border-radius:14px;' +
      'padding:14px;box-shadow:0 8px 28px rgba(0,0,0,.25);z-index:9999;display:none;font-family:inherit';
    p.innerHTML =
      '<div style="font-size:12px;font-weight:900;color:#1a2e1a;margin-bottom:4px">📅 월별 리포트</div>' +
      '<div style="font-size:10px;color:#aaa;margin-bottom:8px">missionLogs 기준</div>' +
      '<div style="display:flex;gap:6px;align-items:center">' +
        '<input id="mdFrom" placeholder="2026-07" style="width:50%;padding:7px;border:1px solid #ddd;border-radius:7px;font-size:12px;font-family:inherit;text-align:center"/>' +
        '<span style="font-size:11px;color:#888">~</span>' +
        '<input id="mdTo" placeholder="2026-08" style="width:50%;padding:7px;border:1px solid #ddd;border-radius:7px;font-size:12px;font-family:inherit;text-align:center"/>' +
      '</div>' +
      '<div style="font-size:10px;color:#aaa;margin-top:4px">비우면 전체 기간</div>' +
      '<button onclick="exportMonthlyDetail()" style="' + bs + 'background:#1a1a2e;color:#fff">전체 기업 · 월별</button>' +
      '<button onclick="exportMonthlyMysc()" style="' + bs + 'background:#1a6b3a;color:#fff">MYSC만 · 월별</button>' +
      '<button onclick="monthlyDetailDebug()" style="' + bs + 'background:#f0f0f0;color:#666">🔍 진단</button>' +
      '<div onclick="document.getElementById(\'mdPanel\').style.display=\'none\'" ' +
        'style="text-align:center;font-size:11px;color:#aaa;margin-top:9px;cursor:pointer">닫기</div>';
    document.body.appendChild(p);
  }

  function removePanel(){
    ['mdBtn','mdPanel'].forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });
  }

  setInterval(() => { if(isAdmin()) buildPanel(); else removePanel(); }, 3000);

  setTimeout(() => {
    if(isAdmin()) buildPanel();
    console.log('[monthlyDetail] ready · exportMonthlyDetail() / monthlyDetailDebug()');
  }, 2000);

})();
