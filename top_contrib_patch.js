/**
 * EcoQuest TOP 기여자 랭킹 개선 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단 다른 patch들 사이에 추가
 *   <script src="top_contrib_patch.js"></script>
 *
 * 기능:
 * - 일반 유저: CO₂ > 0 기여자만 표시
 * - 관리자(808glocal@gmail.com): 신규 멤버(CO₂ = 0)도 표시, "신규" 뱃지
 *   신규 멤버는 가입일 최신순으로 맨 아래 정렬
 * - 더보기 버튼으로 끝까지 펼침 / 접기 가능
 * - 5위까지는 메달, 6위 이후는 숫자
 * - 기존 기업 랭킹 유지
 */

(function(){
  'use strict';

  const PAGE_SIZE = 5;
  let _list = [];
  let _showAll = false;

  function co2ToTree(co2kg){
    if(co2kg>=100)return{emoji:"🏕️",label:"숲"};
    if(co2kg>=50)return{emoji:"🌲",label:"큰나무"};
    if(co2kg>=21.4)return{emoji:"🌳",label:"나무"};
    if(co2kg>=5)return{emoji:"🌿",label:"새싹"};
    if(co2kg>=1)return{emoji:"🌱",label:"씨앗"};
    return{emoji:"🌰",label:"도토리"};
  }

  function escapeHtml(s){
    if(s==null)return'';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── 메인: loadTopContrib 오버라이드 ──
  window.loadTopContrib = async function(){
    const w = document.getElementById("topContrib");
    if(!w) return;

    const isAdmin = window.ME?.email === window.ADMIN;

    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "users"));
      const users = snap.docs.map(d => ({id: d.id, ...d.data()}));

      // CO₂ 기여자 (활동 있는 사람) - CO₂ 내림차순
      const contributors = users
        .filter(u => (u.co2 || 0) > 0)
        .sort((a, b) => (b.co2 || 0) - (a.co2 || 0));

      if (isAdmin) {
        // 관리자는 신규 멤버도 표시 (CO₂ 0, 가입일 최신순으로 맨 아래)
        const newMembers = users
          .filter(u => (u.co2 || 0) <= 0)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        _list = [...contributors, ...newMembers];
      } else {
        // 일반 유저는 기여자만
        _list = contributors;
      }

      _showAll = false;
      render();
    } catch(e) {
      w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:12px">불러오기 실패</div>';
    }

    // 기업 랭킹 (기존 기능 유지)
    await loadCompanyRank();
  };

  function render(){
    const w = document.getElementById("topContrib");
    if(!w) return;

    const isAdmin = window.ME?.email === window.ADMIN;

    if (!_list.length) {
      w.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">아직 기여자가 없어요!</div>';
      return;
    }

    const showCount = _showAll ? _list.length : Math.min(PAGE_SIZE, _list.length);
    const shown = _list.slice(0, showCount);
    const remaining = _list.length - showCount;
    const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];

    let html = shown.map((u, i) => {
      const tree = co2ToTree(u.co2 || 0);
      const isMine = u.id === window.ME?.uid;
      const isNew = (u.co2 || 0) <= 0; // 신규 멤버 (활동 0)
      const rankDisplay = i < 5
        ? medals[i]
        : `<span style="font-size:13px;color:var(--sub);font-weight:700">${i+1}</span>`;

      return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#fff;border-radius:12px;margin-bottom:6px;border:1px solid var(--bdr)${isNew ? ';opacity:0.65;background:#fafafa' : ''}">
        <div style="font-size:${i<5?'20px':'14px'};min-width:28px;text-align:center">${rankDisplay}</div>
        <div style="font-size:28px">${tree.emoji}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${escapeHtml(u.nickname || "익명 지구지킴이")}${isMine ? " 🌟" : ""}${isNew && isAdmin ? '<span style="font-size:10px;color:#888;font-weight:600;margin-left:6px;background:#f0f0f0;padding:1px 7px;border-radius:8px">신규</span>' : ''}
          </div>
          <div style="font-size:11px;color:var(--sub)">${tree.label} · 미션 ${u.missionCount || 0}개</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:900;color:${isNew ? 'var(--sub)' : 'var(--g2)'}">${(u.co2 || 0).toFixed(1)}kg</div>
          <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
        </div>
      </div>`;
    }).join("");

    if (remaining > 0) {
      html += `<button id="topContribMoreBtn" style="width:100%;margin-top:6px;padding:10px;background:#f0fbf4;border:1.5px solid var(--bdr);border-radius:12px;font-size:13px;font-weight:700;color:var(--g2);cursor:pointer;font-family:inherit">더보기 (${remaining}명 더) ↓</button>`;
    } else if (_showAll && _list.length > PAGE_SIZE) {
      html += `<button id="topContribLessBtn" style="width:100%;margin-top:6px;padding:8px;background:transparent;border:none;font-size:12px;color:var(--sub);cursor:pointer;font-family:inherit">접기 ↑</button>`;
    }

    w.innerHTML = html;

    const moreBtn = document.getElementById("topContribMoreBtn");
    if (moreBtn) moreBtn.onclick = () => { _showAll = true; render(); };
    const lessBtn = document.getElementById("topContribLessBtn");
    if (lessBtn) lessBtn.onclick = () => { _showAll = false; render(); };
  }

  // ── 기업 랭킹 (기존 기능 유지) ──
  async function loadCompanyRank(){
    try {
      const crEl = document.getElementById('companyRank');
      if (!crEl) return;
      const [coSnap, uSnap] = await Promise.all([
        window.FB.getDocs(window.FB.collection(window.FB.db, 'companies')),
        window.FB.getDocs(window.FB.collection(window.FB.db, 'users'))
      ]);
      const allUsers = uSnap.docs.map(d => d.data());
      const companies = coSnap.docs.map(d => ({id: d.id, ...d.data()}));
      const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
      const coStats = companies.map(co => {
        const members = allUsers.filter(u => u.companyId === co.id);
        const totalCo2 = members.reduce((s, u) => s + (u.co2 || 0), 0);
        const totalMission = members.reduce((s, u) => s + (u.missionCount || 0), 0);
        return {co, members, totalCo2, totalMission};
      }).filter(s => s.totalCo2 > 0).sort((a, b) => b.totalCo2 - a.totalCo2).slice(0, 5);

      if (!coStats.length) {
        crEl.innerHTML = '<div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">🏢소속 CO₂ 랭킹</div><div style="text-align:center;padding:16px;background:#fff;border-radius:12px;border:1px solid var(--bdr);font-size:13px;color:var(--sub)">아직 참여 기업이 없어요<br/>기업 어드민으로 등록하면 여기 나타나요 🌱</div>';
      } else {
        crEl.innerHTML = `<div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">🏢소속 CO₂ 랭킹</div>` +
          coStats.map((s, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#fff;border-radius:12px;margin-bottom:6px;border:1px solid var(--bdr)">
              <div style="font-size:20px">${medals[i]}</div>
              <div style="font-size:24px">${s.co.emoji || '🏢'}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:700;color:var(--txt)">${escapeHtml(s.co.name)}</div>
                <div style="font-size:11px;color:var(--sub)">👥 ${s.members.length}명 · ✅ ${s.totalMission}건</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:14px;font-weight:900;color:var(--g2)">${s.totalCo2.toFixed(1)}kg</div>
                <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
              </div>
            </div>`).join('');
      }
    } catch(e) {}
  }
})();
