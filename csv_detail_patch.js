// csv_detail_patch.js v5 (verifications + logs + doneMissions 통합 + 진단 로그)
(function(){
  'use strict';

  async function exportDetailedCSV(){
    const d = window._adminData;
    if(!d){ window.toast && window.toast("통계 탭에서 먼저 로딩해주세요!"); return; }

    // ★★★ v5: 3개 소스에서 모두 카운트해서 max 값 사용
    // 1) verifications 컬렉션 (사진 인증 = 가장 정확)
    let verifs = [];
    try {
      const vSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
      verifs = vSnap.docs.map(x => x.data());
    } catch(e){ console.warn('[csv v5] verifications 로딩 실패', e); }

    const fromVerifs = {};
    verifs.forEach(v => {
      if(!v.uid || !v.missionId) return;
      if(!fromVerifs[v.uid]) fromVerifs[v.uid] = {};
      fromVerifs[v.uid][v.missionId] = (fromVerifs[v.uid][v.missionId]||0) + 1;
    });

    // 2) missionLogs 컬렉션
    const fromLogs = {};
    (d.logs||[]).forEach(l => {
      if(!l.uid || !l.missionId) return;
      if(!fromLogs[l.uid]) fromLogs[l.uid] = {};
      fromLogs[l.uid][l.missionId] = (fromLogs[l.uid][l.missionId]||0) + 1;
    });

    // 3) users.doneMissions 배열
    const fromDone = {};
    (d.users||[]).forEach(u => {
      if(!u.id || !Array.isArray(u.doneMissions)) return;
      fromDone[u.id] = {};
      u.doneMissions.forEach(mid => {
        fromDone[u.id][mid] = (fromDone[u.id][mid]||0) + 1;
      });
    });

    // 합치기 (각 미션별 max)
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

    // 진단 로그
    console.log('%c[csv v5 진단]','color:#fff;background:#2ECC71;padding:2px 8px;border-radius:4px;font-weight:bold', {
      'verifications': verifs.length,
      'missionLogs': d.logs?.length || 0,
      'users w/ doneMissions': (d.users||[]).filter(u => u.doneMissions?.length > 0).length,
      'verifications 카운트된 user 수': Object.keys(fromVerifs).length,
      'logs 카운트된 user 수': Object.keys(fromLogs).length,
      'doneMissions 카운트된 user 수': Object.keys(fromDone).length,
    });

    // 모든 미션 ID 합집합
    const allMissionIdsSet = new Set();
    (d.users || []).forEach(u => (u.doneMissions || []).forEach(mid => allMissionIdsSet.add(mid)));
    (d.logs || []).forEach(l => l.missionId && allMissionIdsSet.add(l.missionId));
    verifs.forEach(v => v.missionId && allMissionIdsSet.add(v.missionId));
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
      const members = (d.users||[]).filter(u => u.companyId === co.id);
      return {
        co, members,
        totalCo2: members.reduce((s,u)=>s+(u.co2||0),0),
        totalMission: members.reduce((s,u)=>s+(u.missionCount||0),0),
        totalPoint: members.reduce((s,u)=>s+(u.point||0),0),
      };
    }).sort((a,b)=>b.totalCo2-a.totalCo2);

    const noCompUsers = (d.users||[]).filter(u => !u.companyId);
    const rows = [];

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

    const baseCols = ['닉네임','이메일','미션수','CO2(kg)','포인트','지역','나이대','성별','직업'];
    const renderGroup = (label, members) => {
      rows.push([`=== ${label} 소속 회원 (${members.length}명) ===`]);
      rows.push([...baseCols, ...missionCols]);
      members.forEach(u => {
        const counts = userMissionCount[u.id] || {};
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
    console.log('%c[csv v5] ✅ 다운로드 완료','color:#2ECC71;font-weight:bold');
  }

  // 핵우산 1: anchor.click() 가로채기
  const origAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){
    const dl = (this.download || '').toLowerCase();
    if(dl.endsWith('.csv') && !this._eqOwn){
      console.log('[csv v5] ⚡ 다른 CSV 가로채기:', this.download);
      setTimeout(() => exportDetailedCSV(), 50);
      return;
    }
    return origAnchorClick.apply(this, arguments);
  };

  // 핵우산 2: 버튼 클릭 가로채기
  document.addEventListener('click', function(e){
    const el = e.target.closest('button, a');
    if(!el) return;
    const text = (el.textContent || '').trim();
    const onclick = el.getAttribute('onclick') || '';
    if(/CSV|csv/i.test(text) || /CSV|csv|exportCSV/i.test(onclick)){
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      console.log('[csv v5] ⚡ 버튼 가로채기:', text || onclick);
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

  console.log('%c[csv v5] ☢️ verifications + logs + doneMissions 통합','color:#fff;background:#1a1a2e;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
