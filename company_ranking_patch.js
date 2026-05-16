// company_ranking_patch.js v6
// v5 + 하단 중복 "소속 랭킹" 강제 숨김 (우리 거 이후 형제들 검사)
(function(){
  'use strict';

  async function renderCompanyTabRanking(){
    const page = document.getElementById('page-company');
    if(!page) return;

    let wrap = document.getElementById('eqCompanyRanking');
    if(wrap) wrap.remove();

    wrap = document.createElement('div');
    wrap.id = 'eqCompanyRanking';
    wrap.style.cssText = 'padding: 0 12px 20px; order: -1;';
    wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 불러오는 중...</div>';
    page.insertBefore(wrap, page.firstChild);

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

      if(companyRanking.length){
        html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🏢 소속 랭킹 (${companyRanking.length}곳)</div>`;
        html += companyRanking.slice(0, 10).map(renderCoRow).join('');
        if(myCompanyId && myCompanyRank > 10){
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderCoRow(companyRanking[myCompanyRank - 1], myCompanyRank - 1);
        }
      }

      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🌍 개인 랭킹 (전체 ${totalUsers}명)</div>`;
      html += allUsers.slice(0, 10).map(renderUserRow).join('');
      if(myUid && myRankAll > 10){
        html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
        html += renderUserRow(allUsers[myRankAll - 1], myRankAll - 1);
      }

      wrap.innerHTML = html;
    } catch(e){
      console.error('[company_ranking v6]', e);
      wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 로딩 실패</div>';
    }
  }

  /* ★★★ v6 강화: 우리 거 이후 형제 + 페이지 전체 후손 검사 */
  function hideOldRanking(){
    const page = document.getElementById('page-company');
    if(!page) return;
    const ours = document.getElementById('eqCompanyRanking');

    // 1. 우리 거 이후의 모든 형제 검사
    if(ours){
      let cur = ours.nextElementSibling;
      while(cur){
        const next = cur.nextElementSibling; // 미리 저장 (display:none 해도 안전)
        const txt = (cur.textContent || '').slice(0, 200);
        if(/소속\s*(CO|랭킹|순위)|Top\s*멤버|임직원\s*현황|기업\s*랭킹/i.test(txt) && !cur.dataset.eqHiddenOld){
          cur.style.display = 'none';
          cur.dataset.eqHiddenOld = '1';
        }
        cur = next;
      }
    }

    // 2. 페이지 안의 모든 후손 검사 (헤더로 보이는 짧은 텍스트)
    page.querySelectorAll('div, section, h1, h2, h3, h4').forEach(el => {
      if(el.dataset?.eqHiddenOld) return;
      if(ours && (el === ours || ours.contains(el) || el.contains(ours))) return;
      const txt = (el.textContent || '').slice(0, 60).trim();
      // 헤더 패턴 (짧은 텍스트 + 랭킹 관련 키워드)
      if(txt.length > 0 && txt.length < 50 && /^[🏆🥇📊🌳🌱🥈🥉]?\s*(소속\s*(CO|랭킹|순위)|Top\s*멤버|임직원\s*현황|기업\s*랭킹)/i.test(txt)){
        // 카드 컨테이너까지 올라가기
        let target = el;
        for(let i=0; i<5; i++){
          if(!target.parentElement || target.parentElement === page) break;
          target = target.parentElement;
        }
        if(target && target !== page && target !== ours && !target.dataset.eqHiddenOld && (!ours || !target.contains(ours))){
          target.style.display = 'none';
          target.dataset.eqHiddenOld = '1';
        }
      }
    });
  }

  function setupAll(){
    renderCompanyTabRanking();
    setTimeout(hideOldRanking, 300);
    setTimeout(hideOldRanking, 1000);
    setTimeout(hideOldRanking, 2500);
  }

  function hookGoPage(){
    if(window._eqRankingHooked) return;
    if(typeof window.goPage !== 'function'){ setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === 'company') setTimeout(setupAll, 400);
      return r;
    };
    window._eqRankingHooked = true;
  }

  function watchPage(){
    setTimeout(() => {
      const page = document.getElementById('page-company');
      if(!page) return;
      let pending = false;
      new MutationObserver(() => {
        if(pending) return;
        if(page.style.display === 'none' && !page.classList.contains('on')) return;
        const ours = document.getElementById('eqCompanyRanking');
        if(!ours || !page.contains(ours)){
          pending = true;
          setTimeout(() => { setupAll(); pending = false; }, 200);
        } else {
          pending = true;
          setTimeout(() => { hideOldRanking(); pending = false; }, 200);
        }
      }).observe(page, { childList: true, subtree: false });
    }, 1500);
  }

  // ★ 매 1.5초마다 한 번씩 강제 숨김 (다른 patch가 다시 그려도 우리가 다시 숨김)
  setInterval(() => {
    const page = document.getElementById('page-company');
    if(page && page.classList.contains('on')) hideOldRanking();
  }, 1500);

  hookGoPage();
  watchPage();

  setTimeout(() => {
    const page = document.getElementById('page-company');
    if(page && page.classList.contains('on')) setupAll();
  }, 1000);

  console.log('[company_ranking v6] ☢️ 강화 — 형제+후손 모두 검사 + setInterval');
})();
