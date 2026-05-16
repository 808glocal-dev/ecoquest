// csv_detail_patch.js v6 (진단 정보 CSV에 박음 + doneMissions 배열/객체 둘 다 처리)
(function(){
  'use strict';

  async function exportDetailedCSV(){
    const d = window._adminData;
    if(!d){ window.toast && window.toast("통계 탭에서 먼저 로딩!"); return; }

    // verifications fetch
    let verifs = [];
    try {
      const vSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
      verifs = vSnap.docs.map(x => x.data());
    } catch(e){ console.warn('[csv v6] verifications 실패', e); }

    // ★★★ 진단 정보 수집
    const usersArr = d.users || [];
    const usersWithDoneArr = usersArr.filter(u => Array.isArray(u.doneMissions) && u.doneMissions.length > 0);
    const usersWithDoneObj = usersArr.filter(u => u.doneMissions && typeof u.doneMissions === 'object' && !Array.isArray(u.doneMissions) && Object.keys(u.doneMissions).length > 0);
    const sampleUser = usersArr.find(u => (u.missionCount||0) > 5);

    const diag = {
      '전체 user 수': usersArr.length,
      'missionCount>0 user 수': usersArr.filter(u => (u.missionCount||0) > 0).length,
      '전체 missionCount 합산': usersArr.reduce((s,u) => s+(u.missionCount||0), 0),
      'verifications 컬렉션 수': verifs.length,
      'missionLogs 컬렉션 수': d.logs?.length || 0,
      'doneMissions(배열) 있는 user': usersWithDoneArr.length,
      'doneMissions(객체) 있는 user': usersWithDoneObj.length,
      '예시 user 닉네임': sampleUser?.nickname || '-',
      '예시 user missionCount': sampleUser?.missionCount || 0,
      '예시 user doneMissions 타입': sampleUser ? (Array.isArray(sampleUser.doneMissions) ? '배열' : typeof sampleUser.doneMissions) : '-',
      '예시 user doneMissions 내용': sampleUser ? JSON.stringify(sampleUser.doneMissions||{}).substr(0,200) : '-',
    };

    console.table(diag);
    window.toast && window.toast(`진단 → V:${verifs.length} L:${d.logs?.length||0} D배열:${usersWithDoneArr.length} D객체:${usersWithDoneObj.length}`);

    /* ===== 미션 카운트 (3개 소스 통합) ===== */
    const fromVerifs = {};
    verifs.forEach(v => {
      if(!v.uid || !v.missionId) return;
      if(!fromVerifs[v.uid]) fromVerifs[v.uid] = {};
      fromVerifs[v.uid][v.missionId] = (fromVerifs[v.uid][v.missionId]||0) + 1;
    });

    const fromLogs = {};
    (d.logs||[]).forEach(l => {
      if(!l.uid || !l.missionId) return;
      if(!fromLogs[l.uid]) fromLogs[l.uid] = {};
      fromLogs[l.uid][l.missionId] = (fromLogs[l.uid][l.missionId]||0) + 1;
    });

    const fromDone = {};
    usersArr.forEach(u => {
      if(!u.id || !u.doneMissions) return;
      fromDone[u.id] = {};
      // 배열: ["m1","m2","m1",...]
      if(Array.isArray(u.doneMissions)){
        u.doneMissions.forEach(mid => {
          if(typeof mid === 'string'){
            fromDone[u.id][mid] = (fromDone[u.id][mid]||0) + 1;
          } else if(mid && mid.id){
            fromDone[u.id][mid.id] = (fromDone[u.id][mid.id]||0) + 1;
          }
        });
      }
      // 객체: {m1: 3, m2: 5, ...}
      else if(typeof u.doneMissions === 'object'){
        Object.entries(u.doneMissions).forEach(([mid, cnt]) => {
          const n = (typeof cnt === 'number') ? cnt : (typeof cnt === 'object' && cnt?.count) ? cnt.count : 1;
          fromDone[u.id][mid] = n;
        });
      }
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

    let companies = [];
    try {
      const coSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
      companies = coSnap.docs.map(x => ({id: x.id, ...x.data()}));
    } catch(e){}

    const companyStats = companies.map(co => {
      const members = usersArr.filter(u => u.companyId === co.id);
      return {
        co, members,
        totalCo2: members.reduce((s,u)=>s+(u.co2||0),0),
        totalMission: members.reduce((s,u)=>s+(u.missionCount||0),0),
        totalPoint: members.reduce((s,u)=>s+(u.point||0),0),
      };
    }).sort((a,b)=>b.totalCo2-a.totalCo2);

    const noCompUsers = usersArr.filter(u => !u.companyId);
    const rows = [];

    // ★★★ CSV 첫 부분에 진단 정보 박아넣기
    rows.push(['=== 🔍 진단 정보 (디버그용) ===']);
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

    const baseCols = ['닉네임','이메일','미션수(전체)','CO2(kg)','포인트','지역','나이대','성별','직업','미션별 합계'];
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
          (u.co2||0).toFixed(2),
          u.point || 0,
          u.region || '',
          u.age || '',
          u.gender || '',
          u.job || '',
          sumOfMissions, // 미션별 합계
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
    console.log('%c[csv v6] ✅ 다운로드 완료 - 진단 포함','color:#2ECC71;font-weight:bold');
  }

  // 핵우산 1: anchor.click() 가로채기
  const origAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    const dl = (this.download || '').toLowerCase();
    if(dl.endsWith('.csv') && !this._eqOwn){
      console.log('[csv v6] ⚡ 다른 CSV 가로채기:', this.download);
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
      console.log('[csv v6] ⚡ 버튼 가로채기:', text || onclick);
      exportDetailedCSV();
      return false;
    }
  }, true);

  // 핵우산 3: window.exportCSV 지속 덮어쓰기
  function install(){
    window.exportCSV = exportDetailedCSV;
    if('ehExportCSV' in window) window.ehExportCSV = exportDetailedCSV;
    if('esgExportCSV' in window) window.esgExportCSV = exportDetailedCSV;
  }
  install();
  setInterval(install, 1000);

  console.log('%c[csv v6] ☢️ 진단 정보 CSV에 포함 + 배열/객체 둘 다 처리','color:#fff;background:#1a1a2e;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
