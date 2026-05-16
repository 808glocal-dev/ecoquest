// company_ranking_patch.js
(function(){
  'use strict';

  async function renderCompanyTabRanking(){
    const page = document.getElementById('page-company');
    if(!page) return;

    // 기존 랭킹 있으면 제거 후 다시
    let wrap = document.getElementById('eqCompanyRanking');
    if(wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'eqCompanyRanking';
    wrap.style.cssText = 'padding: 0 12px 20px;';
    wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 불러오는 중...</div>';
    page.appendChild(wrap);

    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const users = snap.docs.map(d => ({id: d.id, ...d.data()}))
        .filter(u => (u.missionCount||0) > 0);

      const myCompanyId = window.UDATA?.companyId;
      const sameCompany = myCompanyId
        ? users.filter(u => u.companyId === myCompanyId).sort((a,b) => (b.co2||0)-(a.co2||0)).slice(0,10)
        : [];

      const topAll = [...users].sort((a,b) => (b.co2||0)-(a.co2||0)).slice(0,10);
      const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

      const renderRow = (u, i) => {
        const isMe = u.id === window.ME?.uid;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'#f0fbf4':'#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMe?'var(--g1)':'var(--bdr)'}">
            <div style="font-size:18px;width:28px;text-align:center">${medals[i] || (i+1)}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${u.nickname || '익명'}${isMe?' 🌟 (나)':''}
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

      if(sameCompany.length){
        html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🏢 우리 소속 개인 랭킹 (${sameCompany.length}명)</div>`;
        html += sameCompany.map(renderRow).join('');
      }

      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🏆 전체 개인 TOP 10</div>`;
      html += topAll.map(renderRow).join('');

      wrap.innerHTML = html;
    } catch(e){
      console.error('[company_ranking] 실패', e);
      wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 로딩 실패</div>';
    }
  }

  // 소속 탭 진입 시 랭킹 갱신
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
    console.log('[company_ranking_patch] ✅ 소속 탭 개인 랭킹 추가');
  }
  hookGoPage();
})();
