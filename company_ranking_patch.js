// company_ranking_patch.js v4
// 소속 탭 = 🏢 소속 랭킹(회사들) + 🌍 개인 랭킹(전체 앱)
(function(){
  'use strict';

  async function renderCompanyTabRanking(){
    const page = document.getElementById('page-company');
    if(!page) return;

    let wrap = document.getElementById('eqCompanyRanking');
    if(wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'eqCompanyRanking';
    wrap.style.cssText = 'padding: 0 12px 20px;';
    wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 불러오는 중...</div>';
    page.appendChild(wrap);

    try {
      const [userSnap, coSnap] = await Promise.all([
        window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
        window.FB.getDocs(window.FB.collection(window.FB.db, 'companies')),
      ]);

      const allUsers = userSnap.docs.map(d => ({id: d.id, ...d.data()}))
        .filter(u => (u.missionCount||0) > 0)
        .sort((a,b) => (b.co2||0)-(a.co2||0));
      const companies = coSnap.docs.map(d => ({id: d.id, ...d.data()}));

      const myUid = window.ME?.uid;
      const myCompanyId = window.UDATA?.companyId;

      // 소속(기업) 랭킹
      const companyRanking = companies.map(co => {
        const members = allUsers.filter(u => u.companyId === co.id);
        return {
          co,
          totalCo2: members.reduce((s,u) => s+(u.co2||0), 0),
          totalMission: members.reduce((s,u) => s+(u.missionCount||0), 0),
          memberCount: members.length,
        };
      }).filter(c => c.memberCount > 0).sort((a,b) => b.totalCo2 - a.totalCo2);

      const myRankAll = myUid ? allUsers.findIndex(u => u.id === myUid) + 1 : 0;
      const myCompanyRank = myCompanyId ? companyRanking.findIndex(c => c.co.id === myCompanyId) + 1 : 0;
      const totalUsers = allUsers.length;

      const medals = ['🥇','🥈','🥉'];

      const renderUserRow = (u, i) => {
        const isMe = u.id === myUid;
        const rankIcon = i < 3 ? medals[i] : `<span style="font-size:13px;font-weight:900;color:var(--sub)">${i+1}위</span>`;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'#f0fbf4':'#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMe?'var(--g1)':'var(--bdr)'}">
            <div style="font-size:20px;width:36px;text-align:center">${rankIcon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.nickname || '익명'}${isMe?' 🌟':''}</div>
              <div style="font-size:11px;color:var(--sub)">미션 ${u.missionCount||0}개 · ${(u.point||0).toLocaleString()}P</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:13px;font-weight:900;color:var(--g2)">${(u.co2||0).toFixed(1)}kg</div>
              <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
            </div>
          </div>`;
      };

      const renderCoRow = (c, i) => {
        const isMine = myCompanyId === c.co.id;
        const rankIcon = i < 3 ? medals[i] : `<span style="font-size:13px;font-weight:900;color:var(--sub)">${i+1}위</span>`;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMine?'#f0fbf4':'#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMine?'var(--g1)':'var(--bdr)'}">
            <div style="font-size:20px;width:36px;text-align:center">${rankIcon}</div>
            <div style="font-size:24px">${c.co.emoji||'🏢'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.co.name}${isMine?' 🌟':''}</div>
              <div style="font-size:11px;color:var(--sub)">${c.memberCount}명 · ${c.totalMission}건 인증</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:13px;font-weight:900;color:var(--g2)">${c.totalCo2.toFixed(1)}kg</div>
              <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
            </div>
          </div>`;
      };

      let html = '';

      // ★ 내 순위 카드
      if(myUid && myRankAll > 0){
        const cards = [];
        if(myCompanyId && myCompanyRank > 0){
          cards.push(`<div style="text-align:center;flex:1"><div style="font-size:11px;color:rgba(255,255,255,.75);margin-bottom:2px">🏢 우리 회사</div><div style="font-size:24px;font-weight:900">${myCompanyRank}위</div><div style="font-size:10px;color:rgba(255,255,255,.65)">/ ${companyRanking.length}곳</div></div>`);
        }
        cards.push(`<div style="text-align:center;flex:1"><div style="font-size:11px;color:rgba(255,255,255,.75);margin-bottom:2px">🌍 전체 앱</div><div style="font-size:24px;font-weight:900">${myRankAll}위</div><div style="font-size:10px;color:rgba(255,255,255,.65)">/ ${totalUsers}명</div></div>`);

        html += `
          <div style="background:linear-gradient(135deg,#0f3d20,#2ECC71);border-radius:16px;padding:16px;margin:14px 0 16px;color:#fff;box-shadow:0 4px 14px rgba(46,204,113,.25)">
            <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:10px;text-align:center">🌟 내 순위</div>
            <div style="display:flex;gap:6px">${cards.join('<div style="width:1px;background:rgba(255,255,255,.2)"></div>')}</div>
          </div>
        `;
      }

      // 🏢 소속 랭킹
      if(companyRanking.length){
        html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🏢 소속 랭킹 (${companyRanking.length}곳)</div>`;
        html += companyRanking.slice(0, 10).map(renderCoRow).join('');
        if(myCompanyId && myCompanyRank > 10){
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderCoRow(companyRanking[myCompanyRank - 1], myCompanyRank - 1);
        }
      }

      // 🌍 개인 랭킹 (= 전체 앱, 소속 없는 사람 포함)
      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🌍 개인 랭킹 (전체 ${totalUsers}명)</div>`;
      html += allUsers.slice(0, 10).map(renderUserRow).join('');
      if(myUid && myRankAll > 10){
        html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
        html += renderUserRow(allUsers[myRankAll - 1], myRankAll - 1);
      }

      wrap.innerHTML = html;
      console.log('[company_ranking v4] 렌더링 완료 - 회사', companyRanking.length, '개 / 개인', totalUsers, '명');
    } catch(e){
      console.error('[company_ranking v4]', e);
      wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 로딩 실패</div>';
    }
  }

  function hookGoPage(){
    if(window._eqRankingHooked) return;
    if(typeof window.goPage !== 'function'){ setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === 'company') setTimeout(renderCompanyTabRanking, 400);
      return r;
    };
    window._eqRankingHooked = true;
    console.log('[company_ranking v4] ✅ 소속+개인 두 랭킹');
  }
  hookGoPage();
})();
