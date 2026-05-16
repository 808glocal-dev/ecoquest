// csv_detail_patch.js v2 (강력 가로채기 — 미션별 횟수 컬럼 포함)
(function(){
  'use strict';

  async function exportDetailedCSV(){
    const d = window._adminData;
    if(!d){ window.toast && window.toast("통계 탭에서 먼저 로딩해주세요!"); return; }

    const allMissionIds = [...new Set((d.logs||[]).map(l=>l.missionId).filter(Boolean))]
      .sort((a,b)=>{
        const na = parseInt(String(a).replace('m','')) || 0;
        const nb = parseInt(String(b).replace('m','')) || 0;
        return na - nb;
      });
    const mName = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.name) || id;
    const mEmoji = id => (typeof MISSIONS!=='undefined' && MISSIONS.find(m=>m.id===id)?.emoji) || '';
    const missionCols = allMissionIds.map(id => `${mEmoji(id)}${mName(id)}`);

    const userMissionCount = {};
    (d.logs||[]).forEach(l => {
      if(!l.uid || !l.missionId) return;
      if(!userMissionCount[l.uid]) userMissionCount[l.uid] = {};
      userMissionCount[l.uid][l.missionId] = (userMissionCount[l.uid][l.missionId]||0) + 1;
    });

    let companies = [];
    try {
      const coSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
      companies = coSnap.docs.map(d => ({id: d.id, ...d.data()}));
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

    // === 기업별 요약 ===
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

    // 회원 상세 (미션별 횟수 컬럼 포함)
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

    // === 미션별 전체 인증 현황 ===
    rows.push(['=== 미션별 전체 인증 현황 ===']);
    rows.push(['미션ID','미션명','총 인증횟수','참여 인원수','평균 CO2/회(kg)','총 CO2 절감(kg)']);
    allMissionIds.forEach(id => {
      const logs = (d.logs||[]).filter(l => l.missionId === id);
      const uids = new Set(logs.map(l => l.uid));
      const totalCo2 = logs.reduce((s,l)=>s+(l.co2||0),0);
      rows.push([
        id, mName(id), logs.length, uids.size,
        (totalCo2 / Math.max(1, logs.length)).toFixed(3),
        totalCo2.toFixed(2)
      ]);
    });

    // CSV escape
    const escape = v => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const csv = rows.map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `EcoQuest_상세_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.toast && window.toast('✅ 상세 CSV 다운로드 완료! (미션별 횟수 포함)');
    console.log('[csv_detail_patch v2] ✅ 미션별 횟수 포함 CSV 다운로드');
  }

  // ★ capture 단계에서 CSV 버튼 가로채기 (다른 patch보다 먼저 실행)
  document.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const onclick = btn.getAttribute('onclick') || '';
    if(onclick.includes('exportCSV')){
      e.preventDefault();
      e.stopImmediatePropagation();
      console.log('[csv_detail_patch v2] CSV 버튼 클릭 가로채기 → 상세 버전 실행');
      exportDetailedCSV();
    }
  }, true); // capture: true

  // window.exportCSV도 덮어쓰기 (이중 안전장치)
  function install(){
    window.exportCSV = exportDetailedCSV;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  [500, 2000, 5000, 10000].forEach(t => setTimeout(install, t));

  console.log('[csv_detail_patch v2] ✅ 강력 가로채기 모드 활성화');
})();
