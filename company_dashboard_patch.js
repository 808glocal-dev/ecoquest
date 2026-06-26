// =====================================================
//  EcoQuest – 소속 탭 조직 대시보드  v1
//  ⚠️ company_ranking_patch.js 를 "대체"하는 파일입니다.
//     (둘 다 로드하면 서로 싸웁니다 → 기존 ranking 패치 태그 제거 후 이걸로 교체)
//  ⚠️ 반드시 company_page_patch.js "뒤"에 로드하세요.
//
//  하는 일
//   - company_page 가 만든 임직원현황(#companyMissionSec)·소속CO₂랭킹(#companyRankPage)
//     을 ID로 깔끔하게 숨김 (기존 regex hideOld 방식 폐기)
//   - 내 소속 박스(#companyPageBox=코드·관리자 버튼)는 건드리지 않음 → 관리자 버튼 유지
//   - 그 아래에 조직 대시보드(현황/캠페인/사내랭킹/소속비교) 주입
//   - 개인 랭킹은 기존대로 지도(지구) 탭 하단에 유지
// =====================================================
(function () {
  'use strict';

  const medals = ['🥇', '🥈', '🥉'];
  let _busy = false, _last = 0;
  let _busyMap = false, _lastMap = 0;

  const num = v => { const n = Number(v); return isNaN(n) ? 0 : n; };
  // co2 는 user 문서 co2 가 정식 필드. 혹시 모를 변형 키 방어.
  const getCo2 = u => num(u.co2 ?? u.co2Saved ?? u.totalCo2 ?? u.co2Reduced);
  const getMc  = u => num(u.missionCount);

  function weekRange() {
    const now = new Date();
    const day = (now.getDay() + 6) % 7;            // 월=0
    const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - day);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const f = d => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${f(mon)}~${f(sun)}`;
  }

  // bunny_patch 와 동일 환산계수
  function impact(co2) {
    return { trees: (co2 / 21.4).toFixed(1), carKm: Math.round(co2 / 0.21), cups: Math.round(co2 / 0.011) };
  }

  /* ===== 공용 행 렌더러 ===== */
  function renderUser(u, i, myUid) {
    const isMe = u.id === myUid;
    const rk = i < 3 ? medals[i] : `<span style="font-size:13px;font-weight:900;color:var(--sub)">${i + 1}위</span>`;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMe ? '#f0fbf4' : '#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMe ? 'var(--g1)' : 'var(--bdr)'}">
      <div style="font-size:20px;width:36px;text-align:center">${rk}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.nickname || '익명'}${isMe ? ' 🌟' : ''}</div>
        <div style="font-size:11px;color:var(--sub)">미션 ${getMc(u)}개 · ${(num(u.point)).toLocaleString()}P</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:13px;font-weight:900;color:var(--g2)">${getCo2(u).toFixed(1)}kg</div>
        <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
      </div>
    </div>`;
  }

  function renderCo(c, i, myCid) {
    const isMine = myCid === c.co.id;
    const rk = i < 3 ? medals[i] : `<span style="font-size:13px;font-weight:900;color:var(--sub)">${i + 1}위</span>`;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:${isMine ? '#f0fbf4' : '#fff'};border-radius:12px;margin-bottom:6px;border:1.5px solid ${isMine ? 'var(--g1)' : 'var(--bdr)'}">
      <div style="font-size:20px;width:36px;text-align:center">${rk}</div>
      ${window.coLogo ? window.coLogo(c.co, 28) : `<div style="font-size:24px">${c.co.emoji || '🏢'}</div>`}
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.co.name}${isMine ? ' 🌟' : ''}</div>
        <div style="font-size:11px;color:var(--sub)">${c.memberCount}명 · ${c.totalMission}건 인증</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:13px;font-weight:900;color:var(--g2)">${c.totalCo2.toFixed(1)}kg</div>
        <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
      </div>
    </div>`;
  }

  /* ===== 소속 탭 대시보드 ===== */
  async function renderDashboard() {
    if (_busy || Date.now() - _last < 700) return;
    _busy = true; _last = Date.now();
    try {
      const page = document.getElementById('page-company');
      if (!page) return;

      // 1) 기존 중복 섹션 ID로 숨김 + 옛 ranking 패치 잔재 제거
      ['companyMissionSec', 'companyRankPage'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
      const oldRk = document.getElementById('eqCompanyRanking'); if (oldRk) oldRk.remove();

      // 2) 내 소속 박스 바로 아래에 대시보드 앵커
      const box = document.getElementById('companyPageBox');
      const anchor = box ? box.parentElement : page.firstElementChild;
      let dash = document.getElementById('eqOrgDashboard');
      if (!dash) {
        dash = document.createElement('div');
        dash.id = 'eqOrgDashboard';
        if (anchor && anchor.parentElement) anchor.parentElement.insertBefore(dash, anchor.nextSibling);
        else page.appendChild(dash);
      }

      if (!window.ME || !window.FB) { dash.innerHTML = ''; return; }
      const cid = window.UDATA?.companyId;
      if (!cid) { dash.innerHTML = ''; return; } // 소속 없으면 등록 UI(#companyPageBox)만

      dash.innerHTML = '<div style="padding:20px;text-align:center;color:var(--sub);font-size:12px">대시보드 불러오는 중...</div>';

      const [uSnap, coSnap] = await Promise.all([
        window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
        window.FB.getDocs(window.FB.collection(window.FB.db, 'companies')),
      ]);
      const allUsers = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const companies = coSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const members = allUsers.filter(u => u.companyId === cid);
      const myUid = window.ME.uid;
      const myCo = companies.find(c => c.id === cid);

      const totalCo2 = members.reduce((s, u) => s + getCo2(u), 0);
      const totalMc  = members.reduce((s, u) => s + getMc(u), 0);
      const active   = members.filter(u => getMc(u) > 0).length;
      const avg      = members.length ? totalCo2 / members.length : 0;
      const partRate = members.length ? Math.round(active / members.length * 100) : 0;
      const imp      = impact(totalCo2);

      // 회사 vs 회사 랭킹
      const coRank = companies.map(co => {
        const ms = allUsers.filter(u => u.companyId === co.id);
        return { co, totalCo2: ms.reduce((s, u) => s + getCo2(u), 0), totalMission: ms.reduce((s, u) => s + getMc(u), 0), memberCount: ms.length };
      }).sort((a, b) => b.totalCo2 - a.totalCo2);
      const myRank = coRank.findIndex(c => c.co.id === cid) + 1;

      let html = '';

      // ─── 존1: 우리 회사 현황 ───
      html += `<div style="padding:0 12px;margin-top:4px">`;
      if (myRank > 0) {
        html += `<div style="background:linear-gradient(135deg,#0f3d20,#2ECC71);border-radius:16px;padding:14px 16px;margin-bottom:14px;color:#fff;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 14px rgba(46,204,113,.25)">
          <div><div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.9)">🏢 전체 소속 순위</div><div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px">우리 회사가 만든 데이터</div></div>
          <div style="font-size:26px;font-weight:900;white-space:nowrap">${myRank}위 <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,.7)">/ ${coRank.length}곳</span></div>
        </div>`;
      }
      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">📊 우리 회사 현황</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div style="background:#fff;border-radius:12px;padding:13px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:21px;font-weight:900;color:var(--g2)">${members.length}명</div><div style="font-size:11px;color:var(--sub);margin-top:2px">참여 멤버</div></div>
          <div style="background:#fff;border-radius:12px;padding:13px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:21px;font-weight:900;color:var(--g2)">${totalMc}건</div><div style="font-size:11px;color:var(--sub);margin-top:2px">총 인증</div></div>
          <div style="background:#fff;border-radius:12px;padding:13px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:21px;font-weight:900;color:var(--g2)">${totalCo2.toFixed(1)}kg</div><div style="font-size:11px;color:var(--sub);margin-top:2px">누적 CO₂</div></div>
          <div style="background:#fff;border-radius:12px;padding:13px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:21px;font-weight:900;color:var(--g2)">${avg.toFixed(1)}kg</div><div style="font-size:11px;color:var(--sub);margin-top:2px">1인 평균</div></div>
        </div>
        <div style="font-size:10px;color:var(--sub);line-height:1.7;padding:2px 2px 0">* 누적 CO₂는 멤버 인증 행동 기반 <b>회피배출 추정치</b>예요 (평소 대비). 🌳 ${imp.trees}그루 · 🚗 ${imp.carKm}km · ☕ ${imp.cups}개</div>
      </div>`;

      // ─── 존3: 우리 회사 랭킹 ───
      html += `<div style="padding:0 12px;margin-top:18px">
        <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">🏅 우리 회사 랭킹</div>
        ${members.length
          ? members.slice().sort((a, b) => getCo2(b) - getCo2(a)).slice(0, 10).map((u, i) => renderUser(u, i, myUid)).join('')
          : '<div style="text-align:center;padding:18px;color:var(--sub);font-size:12px;background:#fff;border-radius:12px;border:1px solid var(--bdr)">아직 멤버가 없어요</div>'}
      </div>`;

      // ─── 존4: 소속 간 비교 (secondary) ───
      const coTop = coRank.filter(c => c.totalCo2 > 0).slice(0, 5);
      html += `<div style="padding:0 12px;margin-top:20px;margin-bottom:24px">
        <div style="font-size:13px;font-weight:900;color:var(--sub);margin-bottom:8px">🏢 소속 간 비교 (${coRank.length}곳)</div>
        ${coTop.length ? coTop.map((c, i) => renderCo(c, i, cid)).join('') : '<div style="text-align:center;padding:14px;color:var(--sub);font-size:11px">비교할 소속이 아직 없어요</div>'}
      </div>`;

      dash.innerHTML = html;
      console.log('[org_dashboard v1] ✅ 멤버', members.length, '· 참여율', partRate + '%');
    } catch (e) {
      const d = document.getElementById('eqOrgDashboard');
      if (d) d.innerHTML = `<div style="padding:16px;text-align:center;color:var(--sub);font-size:12px">대시보드 오류 😢<br><small>${e.message || ''}</small></div>`;
      console.error('[org_dashboard v1]', e);
    } finally { _busy = false; }
  }

  /* ===== 지도(지구) 탭: 개인 랭킹 — 토끼 게임 아래 (기존 기능 유지) ===== */
  async function renderPersonalRanking() {
    if (_busyMap || Date.now() - _lastMap < 800) return;
    _busyMap = true; _lastMap = Date.now();
    try {
      const page = document.getElementById('page-map');
      if (!page) return;
      let wrap = document.getElementById('eqPersonalRanking');
      if (wrap) wrap.remove();
      wrap = document.createElement('div');
      wrap.id = 'eqPersonalRanking';
      wrap.style.cssText = 'padding: 0 12px 28px;';
      wrap.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">개인 랭킹 불러오는 중...</div>';
      page.appendChild(wrap);

      const userSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const allUsers = userSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => getMc(u) > 0).sort((a, b) => getCo2(b) - getCo2(a));
      const myUid = window.ME?.uid;
      const myRankAll = myUid ? allUsers.findIndex(u => u.id === myUid) + 1 : 0;
      const totalUsers = allUsers.length;

      let html = `<div style="height:8px;border-top:1px solid var(--bdr);margin:4px 0 14px"></div>`;
      if (myUid && myRankAll > 0) {
        html += `<div style="background:linear-gradient(135deg,#74b9ff,#0984e3);border-radius:16px;padding:16px;margin:0 0 16px;color:#fff;text-align:center;box-shadow:0 4px 14px rgba(9,132,227,.25)">
          <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,.85);margin-bottom:8px">🌍 전체 앱에서 내 순위</div>
          <div style="font-size:30px;font-weight:900">${myRankAll}위 <span style="font-size:14px;font-weight:600;color:rgba(255,255,255,.7)">/ ${totalUsers}명</span></div>
        </div>`;
      } else if (myUid) {
        html += `<div style="background:linear-gradient(135deg,#74b9ff,#0984e3);border-radius:16px;padding:14px;margin:0 0 16px;color:#fff;text-align:center"><div style="font-size:13px;font-weight:700">🌱 첫 미션을 하면 전체 랭킹에 올라요!</div></div>`;
      }
      html += `<div style="font-size:15px;font-weight:900;color:var(--txt);margin:6px 0 10px">🌍 개인 랭킹 (전체 ${totalUsers}명)</div>`;
      if (!allUsers.length) {
        html += '<div style="text-align:center;padding:20px;color:var(--sub);font-size:12px;background:#fafafa;border-radius:12px">아직 활동 중인 사용자가 없어요</div>';
      } else {
        html += allUsers.slice(0, 10).map((u, i) => renderUser(u, i, myUid)).join('');
        if (myUid && myRankAll > 10) {
          html += `<div style="text-align:center;color:var(--sub);font-size:11px;padding:6px">⋯</div>`;
          html += renderUser(allUsers[myRankAll - 1], myRankAll - 1, myUid);
        }
      }
      wrap.innerHTML = html;
    } catch (e) { console.error('[org_dashboard v1 personal]', e); }
    finally { _busyMap = false; }
  }

  /* ===== 1초 보호 (ID 숨김만, regex 안 씀) ===== */
  setInterval(() => {
    const cp = document.getElementById('page-company');
    if (cp) {
      const active = cp.classList.contains('on') || (cp.style.display !== 'none' && cp.offsetParent !== null);
      if (active) {
        ['companyMissionSec', 'companyRankPage'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
        if (!document.getElementById('eqOrgDashboard')) renderDashboard();
      }
    }
    const mp = document.getElementById('page-map');
    if (mp) {
      const active = mp.classList.contains('on') || (mp.style.display !== 'none' && mp.offsetParent !== null);
      if (active && window.ME && !document.getElementById('eqPersonalRanking')) renderPersonalRanking();
    }
  }, 1000);

  /* ===== goPage 후킹 ===== */
  function hookGoPage() {
    if (window._eqDashHooked) return;
    if (typeof window.goPage !== 'function') { setTimeout(hookGoPage, 300); return; }
    const orig = window.goPage;
    window.goPage = function (name) {
      const r = orig.apply(this, arguments);
      if (name === 'company') { setTimeout(renderDashboard, 300); setTimeout(renderDashboard, 800); }
      if (name === 'map') { setTimeout(renderPersonalRanking, 600); setTimeout(renderPersonalRanking, 1400); }
      return r;
    };
    window._eqDashHooked = true;
  }
  hookGoPage();

  setTimeout(() => {
    const cp = document.getElementById('page-company');
    if (cp && (cp.classList.contains('on') || cp.offsetParent !== null)) renderDashboard();
    const mp = document.getElementById('page-map');
    if (mp && (mp.classList.contains('on') || mp.offsetParent !== null)) renderPersonalRanking();
  }, 2200);

  window.renderOrgDashboard = renderDashboard;
  window.renderPersonalRanking = renderPersonalRanking;
  console.log('%c[org_dashboard v1] 소속 대시보드 로드', 'color:#fff;background:#0f3d20;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
