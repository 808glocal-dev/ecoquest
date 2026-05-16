// company_ranking_patch.js v2
// 소속 탭에 "내 순위" 강조 + 우리 회사 + 전체 앱 랭킹
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
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const allUsers = snap.docs.map(d => ({id: d.id, ...d.data()}))
        .filter(u => (u.missionCount||0) > 0)  // 활동 없는 사람 제외
        .sort((a,b) => (b.co2||0)-(a.co2||0));

      const myUid = window.ME?.uid;
      const myCompanyId = window.UDATA?.companyId;

      // 전체 앱 순위 (소속 무관)
      const myRankAll = myUid ? allUsers.findIndex(u => u.id === myUid) + 1 : 0;
      const totalUsers = allUsers.length;

      // 우리 회사 순위
      const companyUsers = myCompanyId
        ? allUsers.filter(u => u.companyId === myCompanyId)
        : [];
      const myRankCompany = myUid ? companyUsers.findIndex(u => u.id === myUid) + 1 : 0;

      const medals = ['🥇','🥈','🥉'];

      const renderRow = (u, i) => {
        const isMe = u.id === myUid;
        const rankIcon = i < 3 ? medals[i] : `<span style="font-size:14px;font-weight:900;color:var(--sub)">${i+1}위</span>`;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'#f0fbf4':'#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMe?'var(--g1)':'var(--bdr)'}">
            <div style="font-size:20px;width:36px;text-align:center">${rankIcon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${u.nickname || '익명'}${isMe?' 🌟':''}
              </div>
              <div style="font-size:11px;color:var(--sub)">미션 ${u.missionCount||0}개 · ${(u.point||0).toLocaleString()}P</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:13px;font-weight:900;color:var(--g2)">${(u.co2||0).toFixed(1)}kg</div>
              <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
            </div>
          </div>`;
      };

      let html = '';

      // ★ 내 순위 요약 카드 (맨 위, 강조)
      if(myUid && myRankAll > 0){
        const myInCompany = myCompanyId
          ? `<div style="text-align:center;flex:1">
              <div style="font-size:11px;color:rgba(255,255,255,.75);margin-bottom:2px">🏢 우리 회사</div>
              <div style="font-size:24px;font-weight:900">${myRankCompany}위</div>
              <div style="font-size:10px;color:rgba(255,255,255,.65)">/ ${companyUsers.length}명</div>
            </div>`
          : `<div style="text-align:center;flex:1">
              <div style="font-size:11px;color:rgba(255,255,255,.75);margin-bottom:2px">🏢 우리 회사</div>
              <div style="font-size:13px;font-weight:700;margin-top:4px">소속 없음</div>
            </div>`;

        html += `
          <div style="background:linear-gradient(135deg,#0f3d20,#2ECC71);border-radius:16px;padding:16px;margin:14px 0 16px;color:#fff;box-shadow:0 4px 14px rgba(46,204,113,.25)">
            <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:10px;text-align:center">🌟 내 순위</div>
            <div style="display:flex;gap:8px">
              ${myInCompany}
              <div style="width:1px;background:rgba(255,255,255,.2)"></div>
              <div style="text-align:center;flex:1">
                <div style="font-size:11px;color:rgba(255,255,255,.75);margin-bottom:2px">🌍 전체 앱</div>
                <div style="font-size:24px;font-weight:900">${myRankAll}위</div>
                <div style="font-size:10px;color:rgba(255,255,255,.65)">/ ${totalUsers}명</div>
              </div>
            </div>
          </div>
        `;
      }

      // 우리 회사 멤버 랭킹
      if(companyUsers.length){
        html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🏢 우리 회사 랭킹 (${companyUsers.length}명)</div>`;
        const topCompany = companyUsers.slice(0, 10);
        html += topCompany.map(renderRow).join('');

        // 내가 TOP 10 밖이면 내 위치 별도 표시
        if(myRankCompany > 10){
          const me = companyUsers[myRankCompany - 1];
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderRow(me, myRankCompany - 1);
        }
      }

      // 전체 앱 TOP 10 (소속 없는 사람 포함)
      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🌍 전체 앱 랭킹 (${totalUsers}명)</div>`;
      const topAll = allUsers.slice(0, 10);
      html += topAll.map(renderRow).join('');

      // 내가 TOP 10 밖이면 내 위치 별도 표시
      if(myRankAll > 10){
        const me = allUsers[myRankAll - 1];
        html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
        html += renderRow(me, myRankAll - 1);
      }

      wrap.innerHTML = html;
    } catch(e){
      console.error('[company_ranking v2] 실패', e);
      wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 로딩 실패</div>';
    }
  }

  function hookGoPage(){
    if(window._eqRankingHooked) return;
    if(typeof window.goPage !== 'function'){ setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === 'company') setTimeout(renderCompanyTabRanking, 300);
      return r;
    };
    window._eqRankingHooked = true;
    console.log('[company_ranking_patch v2] ✅ 소속 탭 개인 랭킹 추가 (내 순위 강조)');
  }
  hookGoPage();
})();
