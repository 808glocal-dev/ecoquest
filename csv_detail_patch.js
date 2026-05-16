// csv_detail_patch.js
(function(){
  'use strict';

  function buildCSV(){
    const d = window._adminData;
    if(!d){ window.toast && window.toast("통계 탭에서 먼저 로딩해주세요!"); return; }

    // 1) uid별 미션 횟수 집계
    const userMissionCount = {};
    (d.logs || []).forEach(l => {
      if(!l.uid || !l.missionId) return;
      if(!userMissionCount[l.uid]) userMissionCount[l.uid] = {};
      userMissionCount[l.uid][l.missionId] = (userMissionCount[l.uid][l.missionId]||0) + 1;
    });

    // 2) 미션 ID 전체 목록 (헤더용)
    const allMissionIds = [...new Set((d.logs||[]).map(l=>l.missionId).filter(Boolean))].sort();
    const missionName = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.name) || id;

    // 3) 시트 1: 회원별 상세 (미션별 횟수 컬럼)
    const baseCols = ["닉네임","UID","총미션","포인트","CO2절감(kg)","성별","나이대","지역","직업","자동차","가구","환경관심","관심분야","가입일"];
    const missionCols = allMissionIds.map(id => `[${id}] ${missionName(id)}`);
    const rows = [[...baseCols, ...missionCols]];

    d.users.forEach(u => {
      const createdAt = u.createdAt?.seconds ? new Date(u.createdAt.seconds*1000).toISOString().split('T')[0] : '';
      const counts = userMissionCount[u.id] || {};
      const row = [
        u.nickname || '익명',
        u.id || '',
        u.missionCount || 0,
        u.point || 0,
        (u.co2||0).toFixed(2),
        u.gender||'', u.age||'', u.region||'', u.job||'',
        u.hasCar||'', u.household||'', u.ecoLevel||'',
        (u.interests||[]).join('|'),
        createdAt,
        ...allMissionIds.map(id => counts[id] || 0)
      ];
      rows.push(row);
    });

    // 4) 시트 2: 미션별 집계
    rows.push([], ['=== 미션별 전체 인증 횟수 ==='], ['미션ID','미션명','인증횟수','참여인원','평균CO₂절감(kg)']);
    allMissionIds.forEach(id => {
      const logs = (d.logs||[]).filter(l => l.missionId === id);
      const uids = new Set(logs.map(l => l.uid));
      const avgCo2 = logs.reduce((s,l)=>s+(l.co2||0),0) / Math.max(1, logs.length);
      rows.push([id, missionName(id), logs.length, uids.size, avgCo2.toFixed(3)]);
    });

    // 5) 시트 3: 기업별 (있으면)
    return rows;
  }

  async function exportCSVDetail(){
    const rows = buildCSV();
    if(!rows) return;

    // 기업 데이터 붙이기
    try {
      const coSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
      const cos = coSnap.docs.map(d=>({id:d.id, ...d.data()}));
      const users = window._adminData?.users || [];
      rows.push([], ['=== 기업 참여 현황 ==='], ['기업명','업종','멤버수','CO2절감(kg)','미션건수','초대코드']);
      cos.forEach(co => {
        const mbs = users.filter(u => u.companyId === co.id);
        rows.push([
          co.name||'', co.type||'', mbs.length,
          mbs.reduce((s,u)=>s+(u.co2||0),0).toFixed(1),
          mbs.reduce((s,u)=>s+(u.missionCount||0),0),
          co.inviteCode||''
        ]);
      });
    } catch(e) {}

    // CSV escape (콤마/줄바꿈 대응)
    const escape = v => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const csv = rows.map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `EcoQuest_상세데이터_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.toast && window.toast('✅ 상세 CSV 다운로드 완료!');
  }

  // 기존 exportCSV 덮어쓰기
  function install(){
    window.exportCSV = exportCSVDetail;
    console.log('[csv_detail] ✅ 개인별 미션 횟수 포함');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
