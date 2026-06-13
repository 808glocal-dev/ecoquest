// company_ranking_patch.js v9 — 소속 탭=소속 랭킹만 / 개인 랭킹=지도(지구) 탭으로 분리
(function(){
  'use strict';

  let _rendering = false, _lastTs = 0;
  let _renderingMap = false, _lastTsMap = 0;
  const medals = ['🥇','🥈','🥉'];

  /* ===== 공용 렌더러 ===== */
  function renderUser(u, i, myUid){
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
  }

  function renderCo(c, i, myCompanyId){
    const isMine = myCompanyId === c.co.id;
    const rk = i < 3 ? medals[i] : `<span style="font-size:13px;font-weight:900;color:var(--sub)">${i+1}위</span>`;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMine?'#f0fbf4':'#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMine?'var(--g1)':'var(--bdr)'}">
      <div style="font-size:20px;width:36px;text-align:center">${rk}</div>
      ${window.coLogo?window.coLogo(c.co,28):`<div style="font-size:24px">${c.co.emoji||'🏢'}</div>`}
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.co.name}${isMine?' 🌟':''}</div>
        <div style="font-size:11px;color:var(--sub)">${c.memberCount}명 · ${c.totalMission}건 인증</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:13px;font-weight:900;color:var(--g2)">${c.totalCo2.toFixed(1)}kg</div>
        <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
      </div>
    </div>`;
  }

  /* ===== 소속 탭 (page-company): 소속 랭킹만 ===== */
  async function renderOurRanking(){
    if(_rendering) return;
    if(Date.now() - _lastTs < 800) return;
    _rendering = true; _lastTs = Date.now();
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
      const allUsers = userSnap.docs.map(d => ({id:d.id, ...d.data()})).filter(u => (u.missionCount||0) > 0).sort((a,b)=>(b.co2||0)-(a.co2||0));
      const companies = coSnap.docs.map(d => ({id:d.id, ...d.data()}));
      const myUid = window.ME?.uid;
      const myCompanyId = window.UDATA?.companyId;

      const companyRanking = companies.map(co => {
        const members = allUsers.filter(u => u.companyId === co.id);
        return {co, totalCo2:members.reduce((s,u)=>s+(u.co2||0),0), totalMission:members.reduce((s,u)=>s+(u.missionCount||0),0), memberCount:members.length};
      }).sort((a,b) => b.totalCo2 - a.totalCo2);
      const myCompanyRank = myCompanyId ? companyRanking.findIndex(c => c.co.id === myCompanyId) + 1 : 0;

      let html = '';
      if(myUid && myCompanyId && myCompanyRank > 0){
        html += `<div style="background:linear-gradient(135deg,#0f3d20,#2ECC71);border-radius:16px;padding:16px;margin:14px 0 16px;color:#fff;box-shadow:0 4px 14px rgba(46,204,113,.25);text-align:center">
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:8px">🏢 우리 회사 순위</div>
          <div style="font-size:30px;font-weight:900">${myCompanyRank}위 <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,.7)">/ ${companyRanking.length}곳</span></div>
        </div>`;
      }

      if(companyRanking.length){
        html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 10px">🏢 소속 랭킹 (${companyRanking.length}곳)</div>`;
        html += companyRanking.slice(0, 10).map((c,i)=>renderCo(c,i,myCompanyId)).join('');
        if(myCompanyId && myCompanyRank > 10){
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderCo(companyRanking[myCompanyRank - 1], myCompanyRank - 1, myCompanyId);
        }
      } else {
        html += '<div style="text-align:center;padding:20px;color:var(--sub);font-size:12px;background:#fafafa;border-radius:12px">아직 소속이 없어요</div>';
      }

      wrap.innerHTML = html;
      console.log('[company_ranking v9] ✅ 소속 -', companyRanking.length, '곳');
    } catch(e){ console.error('[company_ranking v9]', e); }
    finally { _rendering = false; }
  }

  /* ===== 지도(지구) 탭 (page-map): 개인 랭킹 — 토끼 게임 아래 ===== */
  async function renderPersonalRanking(){
    if(_renderingMap) return;
    if(Date.now() - _lastTsMap < 800) return;
    _renderingMap = true; _lastTsMap = Date.now();
    try {
      const page = document.getElementById('page-map');
      if(!page) return;
      let wrap = document.getElementById('eqPersonalRanking');
      if(wrap) wrap.remove();
      wrap = document.createElement('div');
      wrap.id = 'eqPersonalRanking';
      wrap.style.cssText = 'padding: 0 12px 28px;';
      wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">개인 랭킹 불러오는 중...</div>';
      page.appendChild(wrap);   // 토끼 게임 아래에 붙임

      const userSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const allUsers = userSnap.docs.map(d => ({id:d.id, ...d.data()})).filter(u => (u.missionCount||0) > 0).sort((a,b)=>(b.co2||0)-(a.co2||0));
      const myUid = window.ME?.uid;
      const myRankAll = myUid ? allUsers.findIndex(u => u.id === myUid) + 1 : 0;
      const totalUsers = allUsers.length;

      let html = `<div style="height:8px;border-top:1px solid var(--bdr);margin:4px 0 14px"></div>`;
      if(myUid && myRankAll > 0){
        html += `<div style="background:linear-gradient(135deg,#74b9ff,#0984e3);border-radius:16px;padding:16px;margin:0 0 16px;color:#fff;text-align:center;box-shadow:0 4px 14px rgba(9,132,227,.25)">
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:8px">🌍 전체 앱에서 내 순위</div>
          <div style="font-size:30px;font-weight:900">${myRankAll}위 <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,.7)">/ ${totalUsers}명</span></div>
        </div>`;
      } else if(myUid){
        html += `<div style="background:linear-gradient(135deg,#74b9ff,#0984e3);border-radius:16px;padding:14px;margin:0 0 16px;color:#fff;text-align:center"><div style="font-size:13px;font-weight:700">🌱 첫 미션을 하면 전체 랭킹에 올라요!</div></div>`;
      }
      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:6px 0 10px">🌍 개인 랭킹 (전체 ${totalUsers}명)</div>`;
      if(!allUsers.length){
        html += '<div style="text-align:center;padding:20px;color:var(--sub);font-size:12px;background:#fafafa;border-radius:12px">아직 활동 중인 사용자가 없어요</div>';
      } else {
        html += allUsers.slice(0, 10).map((u,i)=>renderUser(u,i,myUid)).join('');
        if(myUid && myRankAll > 10){
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderUser(allUsers[myRankAll - 1], myRankAll - 1, myUid);
        }
      }

      wrap.innerHTML = html;
      console.log('[company_ranking v9] ✅ 개인 -', totalUsers, '명');
    } catch(e){ console.error('[company_ranking v9 personal]', e); }
    finally { _renderingMap = false; }
  }

  /* ===== 소속 탭 기존 중복 강제 숨김 (page-company 전용) ===== */
  function hideOld(){
    const page = document.getElementById('page-company');
    if(!page) return;
    page.querySelectorAll('div, section, h1, h2, h3, h4, h5').forEach(el => {
      if(el.dataset.eqHiddenOld) return;
      if(el.id === 'eqCompanyRanking') return;
      if(el.contains(document.getElementById('eqCompanyRanking'))) return;
      const txt = (el.textContent || '').slice(0, 300).trim();
      if(!txt || txt.length > 800) return;
      const patterns = [
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*임직원\s*현황/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*Top\s*멤버/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*기업\s*랭킹/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*소속\s*(CO|랭킹|순위)/,
        /^[🏆📊🌳🌱🥇🥈🥉🏢]?\s*참여\s*인원/,
      ];
      for(const p of patterns){
        if(p.test(txt)){
          let target = el;
          for(let i = 0; i < 3; i++){
            if(!target.parentElement || target.parentElement === page) break;
            const ptxt = (target.parentElement.textContent || '').trim();
            if(ptxt.length > 1500) break;
            if(p.test(ptxt.slice(0, 300))) target = target.parentElement; else break;
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

  /* ===== 1초 자동 보호 ===== */
  setInterval(() => {
    const cp = document.getElementById('page-company');
    if(cp){
      const active = cp.classList.contains('on') || (cp.style.display !== 'none' && cp.offsetParent !== null);
      if(active){ hideOld(); if(!document.getElementById('eqCompanyRanking')) renderOurRanking(); }
    }
    const mp = document.getElementById('page-map');
    if(mp){
      const active = mp.classList.contains('on') || (mp.style.display !== 'none' && mp.offsetParent !== null);
      if(active && window.ME && !document.getElementById('eqPersonalRanking')) renderPersonalRanking();
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
      if(name === 'map'){
        setTimeout(renderPersonalRanking, 600);
        setTimeout(renderPersonalRanking, 1400);
      }
      return r;
    };
    window._eqRankingHooked = true;
  }
  hookGoPage();

  setTimeout(() => {
    const cp = document.getElementById('page-company');
    if(cp && (cp.classList.contains('on') || cp.offsetParent !== null)){ renderOurRanking(); hideOld(); }
    const mp = document.getElementById('page-map');
    if(mp && (mp.classList.contains('on') || mp.offsetParent !== null)) renderPersonalRanking();
  }, 2200);

  window.renderOurRanking = renderOurRanking;
  window.renderPersonalRanking = renderPersonalRanking;
  console.log('%c[company_ranking v9] 소속/개인 분리 로드','color:#fff;background:#000;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
