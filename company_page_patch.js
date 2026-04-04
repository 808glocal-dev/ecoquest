/* =====================================================
   EcoQuest – 기업 탭 독립 페이지 v3
   - 상단: 소속/임직원현황/랭킹
   - 하단: 인증피드
   ===================================================== */
(function () {
  'use strict';

  function injectCompanyPage() {
    if (document.getElementById('page-company')) return;

    const page = document.createElement('div');
    page.className = 'page';
    page.id = 'page-company';
    page.style.paddingTop = '8px';
    page.innerHTML = `
      <!-- 내 소속 -->
      <div style="padding:0 12px;margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:15px;font-weight:900;color:var(--txt)">🏢 내 소속</div>
          <button onclick="loadCompanyPage()" style="font-size:12px;color:var(--sub);background:none;border:none;cursor:pointer;font-family:inherit">새로고침</button>
        </div>
        <div id="companyPageBox" style="background:#fff;border-radius:14px;padding:14px;border:1px solid var(--bdr);min-height:60px">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로딩 중...</div>
        </div>
      </div>

      <!-- 임직원 현황 -->
      <div id="companyMissionSec" style="padding:0 12px;margin-bottom:12px;display:none">
        <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">📊 임직원 현황</div>
        <div id="companyMissionStats" style="background:#fff;border-radius:14px;padding:14px;border:1px solid var(--bdr)">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로딩 중...</div>
        </div>
      </div>

      <!-- 기업 랭킹 -->
      <div style="padding:0 12px;margin-bottom:12px">
        <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">🏆 기업 CO₂ 랭킹</div>
        <div id="companyRankPage">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:16px">로딩 중...</div>
        </div>
      </div>

      <!-- 인증 피드 (하단) -->
      <div style="padding:0 12px;margin-bottom:4px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:15px;font-weight:900;color:var(--txt)">📸 인증 피드</div>
          <div style="font-size:12px;color:var(--sub);cursor:pointer" onclick="loadCompanyFeed()">새로고침</div>
        </div>
        <div id="companyFeedList" style="padding-bottom:20px">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:16px">로딩 중...</div>
        </div>
      </div>
    `;

    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) tabBar.parentElement.insertBefore(page, tabBar);
  }

  function fixCompanyTabBtn() {
    const old = document.getElementById('tb-company');
    if (old) old.remove();
    const tabBar = document.querySelector('.tab-bar');
    if (!tabBar) return;
    const btn = document.createElement('button');
    btn.className = 'tb';
    btn.id = 'tb-company';
    btn.setAttribute('data-page', 'company');
    btn.innerHTML = '<span class="ic">🏢</span>기업';
    btn.onclick = () => window.goPage && window.goPage('company');
    tabBar.appendChild(btn);
  }

  function patchGoPage() {
    const _orig = window.goPage;
    window.goPage = function (name) {
      if (name === 'company') {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
        document.querySelectorAll('.tb').forEach(b => b.classList.remove('on'));
        const pg = document.getElementById('page-company');
        if (pg) pg.classList.add('on');
        const tb = document.getElementById('tb-company');
        if (tb) tb.classList.add('on');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadCompanyPage();
        loadCompanyRank();
        loadCompanyFeed();
      } else {
        if (_orig) _orig(name);
      }
    };
  }

  // ── 인증 피드 (기업 페이지용) ──
  window.loadCompanyFeed = async function () {
    const w = document.getElementById('companyFeedList');
    if (!w || !window.FB) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(d => d.isPublic)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      if (!items.length) {
        w.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">아직 공개 인증샷이 없어요! 🌱</div>';
        return;
      }

      // 닉네임 맵
      const uids = [...new Set(items.map(v => v.uid).filter(Boolean))];
      const nicknameMap = {};
      await Promise.all(uids.map(async uid => {
        try {
          const usnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', uid));
          if (usnap.exists()) { const d = usnap.data(); nicknameMap[uid] = d.nickname || d.userName || '익명'; }
        } catch (e) {}
      }));

      const shown = items.slice(0, 9);
      const hasMore = items.length > 9;

      w.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px">
          ${shown.map(v => `
            <div style="position:relative;aspect-ratio:1;background:#f0f0f0;cursor:pointer;border-radius:4px;overflow:hidden"
                 onclick="openFeedDetail('${v.id}')">
              ${v.thumb
                ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji}</div>`}
              <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.55));padding:4px 5px">
                <div style="font-size:9px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${v.missionEmoji} ${v.missionName}</div>
              </div>
            </div>`).join('')}
        </div>
        ${hasMore ? `<div style="text-align:center;margin-top:8px;font-size:12px;color:var(--sub)">최근 9개만 표시돼요</div>` : ''}`;
    } catch (e) {
      w.innerHTML = '<div style="text-align:center;color:var(--sub);font-size:12px;padding:16px">불러오기 실패</div>';
    }
  };

  // ── 소속 박스 ──
  window.loadCompanyPage = async function () {
    const box = document.getElementById('companyPageBox');
    if (!box) return;
    if (!window.ME || !window.FB) {
      box.innerHTML = `<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로그인 후 이용 가능해요 🔑</div>`;
      return;
    }
    const cid = window.UDATA?.companyId;
    if (!cid) {
      document.getElementById('companyMissionSec').style.display = 'none';
      box.innerHTML = `
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:28px;margin-bottom:6px">🏢</div>
          <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:3px">소속 기업이 없어요</div>
          <div style="font-size:12px;color:var(--sub);margin-bottom:14px">등록하거나 초대 코드로 참여하세요</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="openCreateCompany()" class="btn btn-g" style="padding:11px">🏢 기업/단체 등록</button>
          <div style="display:flex;gap:8px">
            <input id="coCodeInpPage" class="inp" placeholder="초대 코드 입력" maxlength="8" style="flex:1;text-transform:uppercase"/>
            <button onclick="joinCompanyByCodePage()" class="btn btn-b btn-sm">입장</button>
          </div>
        </div>`;
      return;
    }
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', cid));
      if (!snap.exists()) {
        await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { companyId: null });
        window.UDATA.companyId = null;
        window.loadCompanyPage(); return;
      }
      const co = snap.data();
      const isOwner = co.ownerUid === window.ME.uid;
      const mc = co.memberCount || 1;
      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="font-size:36px">${co.emoji || '🏢'}</div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:900;color:var(--txt)">${co.name}</div>
            <div style="font-size:12px;color:var(--sub);margin-top:2px">멤버 ${mc}명${isOwner ? ' · <b style="color:var(--g2)">관리자</b>' : ''}${co.type ? ` · ${co.type}` : ''}</div>
          </div>
        </div>
        <div style="background:#f0fbf4;border-radius:10px;padding:10px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--bdr)">
          <div>
            <div style="font-size:10px;color:var(--sub)">초대 코드</div>
            <div style="font-size:18px;font-weight:900;letter-spacing:3px;color:var(--txt)">${co.inviteCode || ''}</div>
          </div>
          <button onclick="navigator.clipboard.writeText('${co.inviteCode||''}').then(()=>toast('코드 복사됐어요!'))" class="btn btn-g btn-sm">복사</button>
        </div>
        ${isOwner
          ? `<div style="display:flex;gap:8px">
               <button onclick="openEditCompany('${cid}')" class="btn btn-gray btn-sm" style="flex:1;padding:10px">✏️ 이름 변경</button>
               <button onclick="openDeleteCompany('${cid}',${mc})" style="flex:1;padding:10px;font-size:12px;font-weight:700;background:#fff0f0;color:var(--red);border:none;border-radius:10px;cursor:pointer;font-family:inherit">🗑️ 삭제</button>
             </div>`
          : `<button onclick="leaveCompany('${cid}')" class="btn btn-gray" style="padding:10px;font-size:13px">탈퇴하기</button>`}`;
      document.getElementById('companyMissionSec').style.display = 'block';
      loadCompanyMissionStats(cid);
    } catch (e) {
      box.innerHTML = `<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">불러오기 실패</div>`;
    }
  };

  async function loadCompanyMissionStats(cid) {
    const el = document.getElementById('companyMissionStats');
    if (!el || !window.FB) return;
    try {
      const uSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const members = uSnap.docs.map(d => d.data()).filter(u => u.companyId === cid);
      if (!members.length) { el.innerHTML = '<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">아직 멤버가 없어요</div>'; return; }
      const totalCo2 = members.reduce((s,u) => s+(u.co2||0), 0);
      const totalMission = members.reduce((s,u) => s+(u.missionCount||0), 0);
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:#f0fbf4;border-radius:12px;padding:12px;text-align:center;border:1px solid var(--bdr)">
            <div style="font-size:20px;font-weight:900;color:var(--g2)">${members.length}명</div>
            <div style="font-size:11px;color:var(--sub);margin-top:2px">참여 임직원</div>
          </div>
          <div style="background:#f0fbf4;border-radius:12px;padding:12px;text-align:center;border:1px solid var(--bdr)">
            <div style="font-size:20px;font-weight:900;color:var(--g2)">${totalMission}건</div>
            <div style="font-size:11px;color:var(--sub);margin-top:2px">총 미션</div>
          </div>
          <div style="background:#f0fbf4;border-radius:12px;padding:12px;text-align:center;border:1px solid var(--bdr)">
            <div style="font-size:20px;font-weight:900;color:var(--g2)">${totalCo2.toFixed(1)}kg</div>
            <div style="font-size:11px;color:var(--sub);margin-top:2px">총 CO₂ 절감</div>
          </div>
          <div style="background:#f0fbf4;border-radius:12px;padding:12px;text-align:center;border:1px solid var(--bdr)">
            <div style="font-size:20px;font-weight:900;color:var(--g2)">${(totalCo2/members.length).toFixed(1)}kg</div>
            <div style="font-size:11px;color:var(--sub);margin-top:2px">1인 평균</div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--txt);margin-bottom:8px">🏅 Top 멤버</div>
        ${members.sort((a,b)=>(b.co2||0)-(a.co2||0)).slice(0,5).map((u,i)=>`
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#f8fdf9;border-radius:10px;margin-bottom:6px">
            <div style="font-size:16px">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</div>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:var(--txt)">${u.nickname||'익명'}</div>
              <div style="font-size:11px;color:var(--sub)">미션 ${u.missionCount||0}건</div>
            </div>
            <div style="font-size:13px;font-weight:900;color:var(--g2)">${(u.co2||0).toFixed(1)}kg</div>
          </div>`).join('')}`;
    } catch (e) {
      el.innerHTML = '<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">불러오기 실패</div>';
    }
  }

  async function loadCompanyRank() {
    const el = document.getElementById('companyRankPage');
    if (!el || !window.FB) return;
    try {
      const [coSnap, uSnap] = await Promise.all([
        window.FB.getDocs(window.FB.collection(window.FB.db,'companies')),
        window.FB.getDocs(window.FB.collection(window.FB.db,'users')),
      ]);
      const allUsers = uSnap.docs.map(d => d.data());
      const coStats = coSnap.docs.map(d=>({id:d.id,...d.data()})).map(co=>{
        const members = allUsers.filter(u=>u.companyId===co.id);
        return {co, members, totalCo2:members.reduce((s,u)=>s+(u.co2||0),0), totalMission:members.reduce((s,u)=>s+(u.missionCount||0),0)};
      }).filter(s=>s.totalCo2>0).sort((a,b)=>b.totalCo2-a.totalCo2).slice(0,5);

      if (!coStats.length) {
        el.innerHTML = `<div style="background:#fff;border-radius:14px;padding:20px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:32px;margin-bottom:8px">🏢</div><div style="font-size:13px;font-weight:700;color:var(--txt)">아직 참여 기업이 없어요</div><div style="font-size:12px;color:var(--sub);margin-top:4px">기업을 등록하고 함께 도전해보세요!</div></div>`;
        return;
      }
      el.innerHTML = coStats.map((s,i)=>`
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:#fff;border-radius:12px;margin-bottom:6px;border:1px solid var(--bdr)">
          <div style="font-size:20px">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</div>
          <div style="font-size:26px">${s.co.emoji||'🏢'}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--txt)">${s.co.name}</div>
            <div style="font-size:11px;color:var(--sub)">👥 ${s.members.length}명 · ✅ ${s.totalMission}건</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:900;color:var(--g2)">${s.totalCo2.toFixed(1)}kg</div>
            <div style="font-size:10px;color:var(--sub)">CO₂</div>
          </div>
        </div>`).join('');
    } catch(e) {
      el.innerHTML = '<div style="text-align:center;color:var(--sub);font-size:12px;padding:12px">불러오기 실패</div>';
    }
  }

  window.joinCompanyByCodePage = async function () {
    const code = document.getElementById('coCodeInpPage')?.value?.trim()?.toUpperCase();
    if (!code||code.length<4){toast('코드를 입력해주세요!');return;}
    if (!window.ME||!window.FB){window.showLoginPrompt&&window.showLoginPrompt('로그인 후 참여 가능해요!');return;}
    try {
      const allSnap = await window.FB.getDocs(window.FB.collection(window.FB.db,'companies'));
      const found = allSnap.docs.find(d=>d.data().inviteCode===code);
      if (!found){toast('존재하지 않는 코드예요!');return;}
      const co = found.data();
      if ((co.members||[]).includes(window.ME.uid)){toast('이미 참여 중이에요!');return;}
      await window.FB.updateDoc(window.FB.doc(window.FB.db,'companies',found.id),{members:window.FB.arrayUnion(window.ME.uid),memberCount:window.FB.increment(1)});
      await window.FB.updateDoc(window.FB.doc(window.FB.db,'users',window.ME.uid),{companyId:found.id});
      window.UDATA.companyId = found.id;
      toast(`✅ "${co.name}" 참여 완료!`);
      window.loadCompanyPage();loadCompanyRank();
    } catch(e){toast('참여 실패: '+e.message);}
  };

  const _origShowApp = window.showApp;
  window.showApp = function () {
    if (_origShowApp) _origShowApp();
    setTimeout(() => {
      injectCompanyPage();
      fixCompanyTabBtn();
      patchGoPage();
    }, 200);
  };

  if (document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded',()=>{injectCompanyPage();fixCompanyTabBtn();patchGoPage();});
  } else {
    injectCompanyPage();fixCompanyTabBtn();patchGoPage();
  }

})();
