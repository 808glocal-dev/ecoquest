/* =====================================================
   EcoQuest – 기업 탭 v6
   - HTML에 이미 있는 page-company에 내용 채움
   - 내 소속 / 에코 스토어 / 임직원현황 / 랭킹
   ===================================================== */
(function () {
  'use strict';

  function injectCompanyPage() {
    // 이미 있는 page-company 사용, 없으면 생성
    let page = document.getElementById('page-company');
    if (!page) {
      page = document.createElement('div');
      page.className = 'page';
      page.id = 'page-company';
      const tabBar = document.querySelector('.tab-bar');
      if (tabBar) tabBar.parentElement.insertBefore(page, tabBar);
    }

    page.style.paddingTop = '0';
    page.style.marginTop = '0';

    // 내용이 이미 있으면 스킵
    if (page.querySelector('#companyPageBox')) return;

    page.innerHTML = `
      <!-- 내 소속 -->
      <div style="padding:0 12px;margin-bottom:12px;margin-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:15px;font-weight:900;color:var(--txt)">🏢 내 소속</div>
          <button onclick="loadCompanyPage()" style="font-size:12px;color:var(--sub);background:none;border:none;cursor:pointer;font-family:inherit">새로고침</button>
        </div>
        <div id="companyPageBox" style="background:#fff;border-radius:14px;padding:14px;border:1px solid var(--bdr);min-height:60px">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로딩 중...</div>
        </div>
      </div>

      <!-- 에코 스토어 -->
      <div style="padding:0 12px;margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-size:15px;font-weight:900;color:var(--txt)">🛒 에코 스토어</div>
          <div style="font-size:10px;color:var(--sub)">포인트로 친환경 쿠폰 교환</div>
        </div>
        <div style="background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:12px;padding:10px 12px;margin-bottom:8px;border:1px solid var(--bdr)">
          <div style="font-size:11px;color:var(--g2);line-height:1.7">
            🌱 친환경 제품 구매 = CO₂ 절감 기록 → 내 랭킹 상승!<br/>
            🏢 소속 기업 랭킹도 함께 올라가요
          </div>
        </div>
        <div style="background:#f0fbf4;border-radius:10px;padding:8px 12px;margin-bottom:10px;border:1px solid var(--bdr)">
          <span style="font-size:12px;color:var(--sub)">내 포인트: </span>
          <strong style="font-size:14px;color:var(--g2)" id="companyShopPoint">0 P</strong>
        </div>
        <div id="companyStoreList">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:12px">로딩 중...</div>
        </div>
        <div id="companyMyCoupons"></div>
      </div>

      <!-- 임직원 현황 -->
      <div id="companyMissionSec" style="padding:0 12px;margin-bottom:12px;display:none">
        <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">📊 임직원 현황</div>
        <div id="companyMissionStats" style="background:#fff;border-radius:14px;padding:14px;border:1px solid var(--bdr)">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로딩 중...</div>
        </div>
      </div>

      <!-- 기업 CO₂ 랭킹 -->
      <div style="padding:0 12px;margin-bottom:20px">
        <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:8px">🏆 기업 CO₂ 랭킹</div>
        <div id="companyRankPage">
          <div style="text-align:center;color:var(--sub);font-size:12px;padding:16px">로딩 중...</div>
        </div>
      </div>
    `;
  }

  function fixCompanyTabBtn() {
    const btn = document.getElementById('tb-company');
    if (btn) {
      btn.setAttribute('data-page', 'company');
      btn.onclick = () => window.goPage && window.goPage('company');
    }
  }

  function patchGoPage() {
    const _orig = window.goPage;
    window.goPage = function (name) {
      if (name === 'company') {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
        document.querySelectorAll('.tb').forEach(b => b.classList.remove('on'));
        const pg = document.getElementById('page-company');
        if (pg) { pg.classList.add('on'); pg.style.paddingTop = '0'; }
        const tb = document.getElementById('tb-company');
        if (tb) tb.classList.add('on');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadCompanyPage();
        loadCompanyStore();
        loadCompanyRank();
      } else {
        if (_orig) _orig(name);
      }
    };
  }

  // ── 에코 스토어 ──
  window.loadCompanyStore = async function () {
    const el = document.getElementById('companyStoreList');
    const pointEl = document.getElementById('companyShopPoint');
    if (!el) return;
    const myPoint = window.UDATA?.point || 0;
    if (pointEl) pointEl.textContent = myPoint.toLocaleString() + ' P';
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'coupons'));
      const coupons = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.active !== false);
      if (!coupons.length) {
        el.innerHTML = `<div style="background:#fff;border-radius:12px;padding:16px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:28px;margin-bottom:6px">🌱</div><div style="font-size:13px;font-weight:700;color:var(--txt)">제휴 쿠폰 준비 중이에요!</div></div>`;
        return;
      }
      el.innerHTML = coupons.map(c => {
        const remaining = (c.totalQty||0) - (c.usedQty||0);
        const canAfford = myPoint >= c.pointCost;
        const soldOut = remaining <= 0;
        return `
          <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:8px;border:1.5px solid ${soldOut?'#eee':'var(--bdr)'};opacity:${soldOut?0.6:1}">
            <div style="display:flex;gap:10px;align-items:flex-start">
              <div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,#1a6b3a,#2ECC71);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${c.brandEmoji||'🎁'}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:11px;font-weight:700;background:#e8f5e9;color:var(--g2);padding:1px 6px;border-radius:6px;display:inline-block;margin-bottom:3px">${c.brandName}</div>
                <div style="font-size:14px;font-weight:900;color:var(--txt)">${c.discount.toLocaleString()}원 할인</div>
                <div style="font-size:10px;color:var(--g2);margin-top:2px">🌱 사용 시 CO₂ -${c.co2Value||0.3}kg 기록</div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
                  <span style="font-size:13px;font-weight:900;color:var(--g2)">${c.pointCost.toLocaleString()}P</span>
                  <button onclick="exchangeCoupon('${c.id}')"
                    style="background:${soldOut?'#f0f0f0':canAfford?'linear-gradient(135deg,var(--g1),var(--g2))':'#f0f0f0'};color:${canAfford&&!soldOut?'#fff':'var(--sub)'};border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit"
                    ${soldOut?'disabled':''}>
                    ${soldOut?'소진됨':canAfford?'교환하기':'P 부족'}
                  </button>
                </div>
              </div>
            </div>
          </div>`;
      }).join('');
    } catch (e) {
      el.innerHTML = '<div style="text-align:center;color:var(--sub);font-size:12px;padding:12px">로딩 실패</div>';
    }
    if (window.ME?.uid && window.showMyCouponsInCompany) window.showMyCouponsInCompany(window.ME.uid);
  };

  window.showMyCouponsInCompany = async function(uid) {
    const sec = document.getElementById('companyMyCoupons');
    if (!sec || !window.FB) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'couponCodes'));
      const codes = snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(c=>c.issuedTo===uid)
        .sort((a,b)=>(b.issuedAt?.seconds||0)-(a.issuedAt?.seconds||0));
      if (!codes.length) { sec.innerHTML=''; return; }
      sec.innerHTML = `
        <div style="font-size:14px;font-weight:900;color:var(--txt);margin:12px 0 8px">🎟️ 내 쿠폰함</div>
        ${codes.map(c=>`
          <div style="background:${c.isUsed?'#f8f8f8':'#f0fbf4'};border-radius:10px;padding:10px 12px;margin-bottom:6px;border:1.5px solid ${c.isUsed?'#eee':'var(--g1)'}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
              <div style="font-size:12px;font-weight:700">${c.brandEmoji||'🎁'} ${c.brandName} · ${c.discount.toLocaleString()}원</div>
              <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;background:${c.isUsed?'#eee':'#e8f5e9'};color:${c.isUsed?'#aaa':'var(--g2)'}">
                ${c.isUsed?'✅ 사용완료':'미사용'}
              </span>
            </div>
            <div style="font-size:14px;font-weight:900;letter-spacing:2px;color:${c.isUsed?'#bbb':'var(--txt)'};text-align:center;background:${c.isUsed?'#eee':'#fff'};border-radius:6px;padding:6px;border:1px dashed ${c.isUsed?'#ddd':'var(--g1)'};margin-bottom:${c.isUsed?0:'6px'}">
              ${c.code}
            </div>
            ${!c.isUsed?`<button onclick="useCouponNow('${c.id}')" style="width:100%;padding:8px;border:none;border-radius:8px;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">매장에서 사용하기 ✅</button>`:''}
          </div>`).join('')}`;
    } catch(e) {}
  };

  // ── 내 소속 ──
  window.loadCompanyPage = async function () {
    const box = document.getElementById('companyPageBox');
    if (!box) return;
    if (!window.ME || !window.FB) {
      box.innerHTML = `<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로그인 후 이용 가능해요 🔑</div>`;
      return;
    }
    const cid = window.UDATA?.companyId;
    if (!cid) {
      const ms = document.getElementById('companyMissionSec');
      if (ms) ms.style.display = 'none';
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
          <div style="font-size:36px">${co.emoji||'🏢'}</div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:900;color:var(--txt)">${co.name}</div>
            <div style="font-size:12px;color:var(--sub);margin-top:2px">멤버 ${mc}명${isOwner?' · <b style="color:var(--g2)">관리자</b>':''}${co.type?` · ${co.type}`:''}</div>
          </div>
        </div>
        <div style="background:#f0fbf4;border-radius:10px;padding:10px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--bdr)">
          <div>
            <div style="font-size:10px;color:var(--sub)">초대 코드</div>
            <div style="font-size:18px;font-weight:900;letter-spacing:3px;color:var(--txt)">${co.inviteCode||''}</div>
          </div>
          <button onclick="navigator.clipboard.writeText('${co.inviteCode||''}').then(()=>toast('코드 복사됐어요!'))" class="btn btn-g btn-sm">복사</button>
        </div>
        ${isOwner
          ?`<div style="display:flex;gap:8px">
               <button onclick="openEditCompany('${cid}')" class="btn btn-gray btn-sm" style="flex:1;padding:10px">✏️ 이름 변경</button>
               <button onclick="openDeleteCompany('${cid}',${mc})" style="flex:1;padding:10px;font-size:12px;font-weight:700;background:#fff0f0;color:var(--red);border:none;border-radius:10px;cursor:pointer;font-family:inherit">🗑️ 삭제</button>
             </div>`
          :`<button onclick="leaveCompany('${cid}')" class="btn btn-gray" style="padding:10px;font-size:13px">탈퇴하기</button>`}`;
      const ms = document.getElementById('companyMissionSec');
      if (ms) ms.style.display = 'block';
      loadCompanyMissionStats(cid);
    } catch(e) {
      box.innerHTML = `<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">불러오기 실패</div>`;
    }
  };

  async function loadCompanyMissionStats(cid) {
    const el = document.getElementById('companyMissionStats');
    if (!el||!window.FB) return;
    try {
      const uSnap = await window.FB.getDocs(window.FB.collection(window.FB.db,'users'));
      const members = uSnap.docs.map(d=>d.data()).filter(u=>u.companyId===cid);
      if (!members.length) { el.innerHTML='<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">아직 멤버가 없어요</div>'; return; }
      const totalCo2 = members.reduce((s,u)=>s+(u.co2||0),0);
      const totalMission = members.reduce((s,u)=>s+(u.missionCount||0),0);
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
    } catch(e) {
      el.innerHTML = '<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">불러오기 실패</div>';
    }
  }

  async function loadCompanyRank() {
    const el = document.getElementById('companyRankPage');
    if (!el||!window.FB) return;
    try {
      const [coSnap,uSnap] = await Promise.all([
        window.FB.getDocs(window.FB.collection(window.FB.db,'companies')),
        window.FB.getDocs(window.FB.collection(window.FB.db,'users')),
      ]);
      const allUsers = uSnap.docs.map(d=>d.data());
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
      window.loadCompanyPage(); loadCompanyRank();
    } catch(e){toast('참여 실패: '+e.message);}
  };

  function init() {
    injectCompanyPage();
    fixCompanyTabBtn();
    patchGoPage();
  }

  const _origShowApp = window.showApp;
  window.showApp = function () {
    if (_origShowApp) _origShowApp();
    setTimeout(init, 300);
  };

  const _origEnterGuest = window.enterGuest;
  window.enterGuest = function () {
    if (_origEnterGuest) _origEnterGuest();
    setTimeout(init, 300);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
