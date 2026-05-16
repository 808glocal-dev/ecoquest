// company_ranking_patch.js v8 — 1초 자동 보호 + 다른 patch 충돌 강제 해결
(function(){
  'use strict';

  let _rendering = false;
  let _lastTs = 0;

  /* ===== 우리 거 렌더링 ===== */
  async function renderOurRanking(){
    if(_rendering) return;
    if(Date.now() - _lastTs < 800) return;
    _rendering = true;
    _lastTs = Date.now();

    try {
      const page = document.getElementById('page-company');
      if(!page) return;

      let wrap = document.getElementById('eqCompanyRanking');
      if(wrap) wrap.remove();

      wrap = document.createElement('div');
      wrap.id = 'eqCompanyRanking';
      wrap.style.cssText = 'padding: 0 12px 20px;';
      wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">랭킹 불러오는 중...</div>';
      page.insertBefore(wrap, page.firstChild);

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
        return {co, totalCo2:members.reduce((s,u)=>s+(u.co2||0),0), totalMission:members.reduce((s,u)=>s+(u.missionCount||0),0), memberCount:members.length};
      }).filter(c => c.memberCount > 0).sort((a,b) => b.totalCo2 - a.totalCo2);

      const myRankAll = myUid ? allUsers.findIndex(u => u.id === myUid) + 1 : 0;
      const myCompanyRank = myCompanyId ? companyRanking.findIndex(c => c.co.id === myCompanyId) + 1 : 0;
      const totalUsers = allUsers.length;
      const medals = ['🥇','🥈','🥉'];

      const renderUser = (u, i) => {
        const isMe = u.id === myUid;
        const rk = i < 3 ? medals[i] : `<span style="font-size:13px;font-weight:900;color:var(--sub)">${i+1}위</span>`;
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe?'#f0fbf4':'#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMe?'var(--g1)':'var(--bdr)'}">
          <div style="font-size:20px;width:36px;text-align:center">${rk}</div>
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

      const renderCo = (c, i) => {
        const isMine = myCompanyId === c.co.id;
        const rk = i < 3 ? medals[i] : `<span style="font-size:13px;font-weight:900;color:var(--sub)">${i+1}위</span>`;
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMine?'#f0fbf4':'#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMine?'var(--g1)':'var(--bdr)'}">
          <div style="font-size:20px;width:36px;text-align:center">${rk}</div>
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
        html += `<div style="background:linear-gradient(135deg,#0f3d20,#2ECC71);border-radius:16px;padding:16px;margin:14px 0 16px;color:#fff;box-shadow:0 4px 14px rgba(46,204,113,.25)">
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:10px;text-align:center">🌟 내 순위</div>
          <div style="display:flex;gap:6px">${cards.join('<div style="width:1px;background:rgba(255,255,255,.2)"></div>')}</div>
        </div>`;
      } else if(myUid && totalUsers > 0){
        html += `<div style="background:linear-gradient(135deg,#74b9ff,#0984e3);border-radius:16px;padding:14px;margin:14px 0 16px;color:#fff;text-align:center">
          <div style="font-size:13px;font-weight:700">🌱 첫 미션을 시작해서 랭킹에 도전해요!</div>
        </div>`;
      }

      if(companyRanking.length){
        html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🏢 소속 랭킹 (${companyRanking.length}곳)</div>`;
        html += companyRanking.slice(0, 10).map(renderCo).join('');
        if(myCompanyId && myCompanyRank > 10){
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderCo(companyRanking[myCompanyRank - 1], myCompanyRank - 1);
        }
      }

      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🌍 개인 랭킹 (전체 ${totalUsers}명)</div>`;
      if(allUsers.length === 0){
        html += '<div style="text-align:center;padding:20px;color:var(--sub);font-size:12px;background:#fafafa;border-radius:12px">아직 활동 중인 사용자가 없어요</div>';
      } else {
        html += allUsers.slice(0, 10).map(renderUser).join('');
        if(myUid && myRankAll > 10){
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderUser(allUsers[myRankAll - 1], myRankAll - 1);
        }
      }

      wrap.innerHTML = html;
      console.log('[company_ranking v8] ✅ 렌더 - 회사', companyRanking.length, '명/개인', totalUsers);
    } catch(e){
      console.error('[company_ranking v8]', e);
    } finally {
      _rendering = false;
    }
  }

  /* ===== 기존 중복 강제 숨김 (공격적) ===== */
  function hideOld(){
    const page = document.getElementById('page-company');
    if(!page) return;

    // 페이지의 모든 div/section/h*를 검사
    page.querySelectorAll('div, section, h1, h2, h3, h4, h5').forEach(el => {
      if(el.dataset.eqHiddenOld) return;
      if(el.id === 'eqCompanyRanking') return;
      if(el.contains(document.getElementById('eqCompanyRanking'))) return;

      const txt = (el.textContent || '').slice(0, 300).trim();
      if(!txt || txt.length > 800) return;

      // 패턴 매칭: 우리 거가 아닌 중복 섹션
      const patterns = [
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*임직원\s*현황/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*Top\s*멤버/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*소속\s*(CO|랭킹|순위)/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*기업\s*랭킹/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*참여\s*인원/,
      ];

      for(const p of patterns){
        if(p.test(txt)){
          // 부모 컨테이너 찾기 (해당 섹션의 박스)
          let target = el;
          // 너무 좁으면 부모로 확장 (헤더 + 내용 박스 통째로 숨김)
          for(let i = 0; i < 3; i++){
            if(!target.parentElement || target.parentElement === page) break;
            const ptxt = (target.parentElement.textContent || '').trim();
            if(ptxt.length > 1500) break; // 너무 큰 영역은 멈춤
            // 부모도 같은 패턴을 포함하면 부모로
            if(p.test(ptxt.slice(0, 300))){
              target = target.parentElement;
            } else {
              break;
            }
          }
          if(target !== page && target !== document.getElementById('eqCompanyRanking') && !target.contains(document.getElementById('eqCompanyRanking'))){
            target.style.display = 'none';
            target.dataset.eqHiddenOld = '1';
          }
          break;
        }
      }
    });
  }

  /* ===== 1초마다 자동 보호 (공격적) ===== */
  setInterval(() => {
    const page = document.getElementById('page-company');
    if(!page) return;
    const isActive = page.classList.contains('on') || (page.style.display !== 'none' && page.offsetParent !== null);
    if(!isActive) return;

    hideOld();

    if(!document.getElementById('eqCompanyRanking')){
      renderOurRanking();
    }
  }, 1000);

  /* ===== goPage 후킹 ===== */
  function hookGoPage(){
    if(window._eqRankingHooked) return;
    if(typeof window.goPage !== 'function'){ setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === 'company'){
        setTimeout(() => { renderOurRanking(); hideOld(); }, 300);
        setTimeout(() => { renderOurRanking(); hideOld(); }, 800);
        setTimeout(() => { hideOld(); }, 1500);
      }
      return r;
    };
    window._eqRankingHooked = true;
  }

  hookGoPage();

  // 즉시 한 번 시도
  setTimeout(() => {
    const page = document.getElementById('page-company');
    if(page && (page.classList.contains('on') || page.offsetParent !== null)){
      renderOurRanking();
      hideOld();
    }
  }, 2000);

  console.log('%c[company_ranking v8] ☢️ 1초 강제 보호 + 강력 hide','color:#fff;background:#000;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
