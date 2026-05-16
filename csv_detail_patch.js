// csv_detail_patch.js v7
// 핵심 fix: users를 doc.id 포함해서 다시 fetch (기존 _adminData.users는 id 필드 누락)
(function(){
  'use strict';

  async function exportDetailedCSV(){
    if(!window._adminData){ window.toast && window.toast("통계 탭에서 먼저 로딩!"); return; }
    window.toast && window.toast("📊 CSV 생성 중...");

    // ★★★ v7 핵심: users를 doc.id 포함해서 다시 fetch
    const [userSnap, coSnap, vSnap] = await Promise.all([
      window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'companies')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications')).catch(()=>({docs:[]})),
    ]);

    const users = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const companies = coSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const verifs = vSnap.docs ? vSnap.docs.map(x => x.data()) : [];
    const logs = window._adminData.logs || [];

    // ===== 진단 =====
    const usersWithDoneArr = users.filter(u => Array.isArray(u.doneMissions) && u.doneMissions.length > 0);
    const usersWithDoneObj = users.filter(u => u.doneMissions && typeof u.doneMissions === 'object' && !Array.isArray(u.doneMissions) && Object.keys(u.doneMissions).length > 0);
    const sampleUser = users.find(u => (u.missionCount||0) > 5);
    const diag = {
      '전체 user 수': users.length,
      'verifications': verifs.length,
      'missionLogs': logs.length,
      'doneMissions(배열) user': usersWithDoneArr.length,
      'doneMissions(객체) user': usersWithDoneObj.length,
      '예시 user 닉네임': sampleUser?.nickname || '-',
      '예시 user.id': sampleUser?.id || '-',
      '예시 user missionCount': sampleUser?.missionCount || 0,
      '예시 doneMissions 길이': sampleUser?.doneMissions?.length ?? '-',
    };
    console.table(diag);

    /* ===== 3개 소스에서 카운트 ===== */
    const fromVerifs = {};
    verifs.forEach(v => {
      if(!v.uid || !v.missionId) return;
      if(!fromVerifs[v.uid]) fromVerifs[v.uid] = {};
      fromVerifs[v.uid][v.missionId] = (fromVerifs[v.uid][v.missionId]||0) + 1;
    });

    const fromLogs = {};
    logs.forEach(l => {
      if(!l.uid || !l.missionId) return;
      if(!fromLogs[l.uid]) fromLogs[l.uid] = {};
      fromLogs[l.uid][l.missionId] = (fromLogs[l.uid][l.missionId]||0) + 1;
    });

    const fromDone = {};
    users.forEach(u => {
      if(!u.id || !u.doneMissions) return;
      fromDone[u.id] = {};
      if(Array.isArray(u.doneMissions)){
        u.doneMissions.forEach(mid => {
          if(typeof mid === 'string'){
            fromDone[u.id][mid] = (fromDone[u.id][mid]||0) + 1;
          } else if(mid && typeof mid === 'object' && mid.id){
            fromDone[u.id][mid.id] = (fromDone[u.id][mid.id]||0) + 1;
          }
        });
      } else if(typeof u.doneMissions === 'object'){
        Object.entries(u.doneMissions).forEach(([mid, cnt]) => {
          const n = typeof cnt === 'number' ? cnt : (cnt?.count || 1);
          fromDone[u.id][mid] = n;
        });
      }
    });

    // 진단: 각 소스가 카운트한 user 수
    console.log('[csv v7] 카운트 결과:', {
      'fromVerifs user 수': Object.keys(fromVerifs).length,
      'fromLogs user 수': Object.keys(fromLogs).length,
      'fromDone user 수': Object.keys(fromDone).length,
    });

    // 합치기 (3개 소스 중 max)
    const userMissionCount = {};
    const allUids = new Set([...Object.keys(fromVerifs), ...Object.keys(fromLogs), ...Object.keys(fromDone)]);
    allUids.forEach(uid => {
      userMissionCount[uid] = {};
      const allMids = new Set([
        ...Object.keys(fromVerifs[uid]||{}),
        ...Object.keys(fromLogs[uid]||{}),
        ...Object.keys(fromDone[uid]||{}),
      ]);
      allMids.forEach(mid => {
        userMissionCount[uid][mid] = Math.max(
          fromVerifs[uid]?.[mid] || 0,
          fromLogs[uid]?.[mid] || 0,
          fromDone[uid]?.[mid] || 0,
        );
      });
    });

    // 진단 정보에 추가
    diag['카운트된 user 수'] = Object.keys(userMissionCount).length;
    diag['예시 user 미션별 카운트'] = sampleUser ? JSON.stringify(userMissionCount[sampleUser.id]||{}).substr(0,150) : '-';

    // 모든 미션 ID 합집합
    const allMissionIdsSet = new Set();
    Object.values(userMissionCount).forEach(counts => Object.keys(counts).forEach(mid => allMissionIdsSet.add(mid)));
    if(typeof MISSIONS !== 'undefined') MISSIONS.forEach(m => allMissionIdsSet.add(m.id));
    const allMissionIds = [...allMissionIdsSet].sort((a,b)=>{
      const na = parseInt(String(a).replace('m','')) || 0;
      const nb = parseInt(String(b).replace('m','')) || 0;
      return na - nb;
    });

    const mName = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.name) || id;
    const mEmoji = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.emoji) || '';
    const missionCols = allMissionIds.map(id => `${mEmoji(id)}${mName(id)}`);

    const companyStats = companies.map(co => {
      const members = users.filter(u => u.companyId === co.id);
      return {
        co, members,
        totalCo2: members.reduce((s,u)=>s+(u.co2||0),0),
        totalMission: members.reduce((s,u)=>s+(u.missionCount||0),0),
        totalPoint: members.reduce((s,u)=>s+(u.point||0),0),
      };
    }).sort((a,b)=>b.totalCo2-a.totalCo2);

    const noCompUsers = users.filter(u => !u.companyId);
    const rows = [];

    // 진단 정보 박아넣기
    rows.push(['=== 🔍 진단 정보 ===']);
    Object.entries(diag).forEach(([k,v]) => rows.push([k, String(v)]));
    rows.push([]);

    rows.push(['=== 기업별 요약 ===']);
    rows.push(['기업명','유형','회원수','총 CO2(kg)','총 미션','총 포인트','평균 CO2/명','초대코드']);
    companyStats.forEach(s => {
      rows.push([
        s.co.name || '', s.co.type || '', s.members.length,
        s.totalCo2.toFixed(2), s.totalMission, s.totalPoint,
        s.members.length ? (s.totalCo2/s.members.length).toFixed(2) : '0',
        s.co.inviteCode || ''
      ]);
    });
    if(noCompUsers.length){
      const tc = noCompUsers.reduce((s,u)=>s+(u.co2||0),0);
      const tm = noCompUsers.reduce((s,u)=>s+(u.missionCount||0),0);
      const tp = noCompUsers.reduce((s,u)=>s+(u.point||0),0);
      rows.push(['(소속 없음)','',noCompUsers.length,tc.toFixed(2),tm,tp,(tc/noCompUsers.length).toFixed(2),'']);
    }
    rows.push([]);

    const baseCols = ['닉네임','이메일','미션수(전체)','미션별합계','CO2(kg)','포인트','지역','나이대','성별','직업'];
    const renderGroup = (label, members) => {
      rows.push([`=== ${label} 소속 회원 (${members.length}명) ===`]);
      rows.push([...baseCols, ...missionCols]);
      members.forEach(u => {
        const counts = userMissionCount[u.id] || {};
        const sumOfMissions = Object.values(counts).reduce((s,n) => s+n, 0);
        rows.push([
          u.nickname || '익명',
          u.email || '',
          u.missionCount || 0,
          sumOfMissions,
          (u.co2||0).toFixed(2),
          u.point || 0,
          u.region || '',
          u.age || '',
          u.gender || '',
          u.job || '',
          ...allMissionIds.map(id => counts[id] || 0)
        ]);
      });
      rows.push([]);
    };

    companyStats.forEach(s => renderGroup(`[${s.co.name}]`, s.members));
    if(noCompUsers.length) renderGroup('[(소속 없음)]', noCompUsers);

    rows.push(['=== 미션별 전체 인증 현황 ===']);
    rows.push(['미션ID','미션명','총 인증횟수','참여 인원수','CO2/회(kg)','총 CO2 절감(kg)']);
    allMissionIds.forEach(id => {
      let totalCount = 0;
      const participants = new Set();
      Object.keys(userMissionCount).forEach(uid => {
        const cnt = userMissionCount[uid][id] || 0;
        if(cnt > 0){ totalCount += cnt; participants.add(uid); }
      });
      const mission = typeof MISSIONS !== 'undefined' ? MISSIONS.find(m=>m.id===id) : null;
      const co2PerMission = mission?.co2 || 0;
      rows.push([
        id, mName(id), totalCount, participants.size,
        co2PerMission.toFixed(3),
        (totalCount * co2PerMission).toFixed(2)
      ]);
    });

    const escape = v => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const csv = rows.map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `EcoQuest_상세_${new Date().toISOString().split('T')[0]}.csv`;
    a._eqOwn = true;
    a.click();
    window.toast && window.toast('✅ CSV 다운로드 완료!');
    console.log('%c[csv v7] ✅ 다운로드 완료','color:#2ECC71;font-weight:bold');
  }

  // 핵우산 1: anchor.click() 가로채기
  const origAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    const dl = (this.download || '').toLowerCase();
    if(dl.endsWith('.csv') && !this._eqOwn){
      console.log('[csv v7] ⚡ 가로채기:', this.download);
      setTimeout(() => exportDetailedCSV(), 50);
      return;
    }
    return origAnchorClick.apply(this, arguments);
  };

  // 핵우산 2: 버튼 클릭
  document.addEventListener('click', function(e){
    const el = e.target.closest('button, a');
    if(!el) return;
    const text = (el.textContent || '').trim();
    const onclick = el.getAttribute('onclick') || '';
    if(/CSV|csv/i.test(text) || /CSV|csv|exportCSV/i.test(onclick)){
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      exportDetailedCSV();
      return false;
    }
  }, true);

  // 핵우산 3
  function install(){
    window.exportCSV = exportDetailedCSV;
    if('ehExportCSV' in window) window.ehExportCSV = exportDetailedCSV;
    if('esgExportCSV' in window) window.esgExportCSV = exportDetailedCSV;
  }
  install();
  setInterval(install, 1000);

  console.log('%c[csv v7] ☢️ user.id 포함 fetch + 매칭 정상화','color:#fff;background:#1a1a2e;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
