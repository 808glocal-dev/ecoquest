/* ================================================================
   EcoQuest – admin_user_info_patch.js
   관리자 → 회원 탭에 닉네임 + 이메일 + 휴대폰번호 표시
   - 신규 가입자: ME(Auth)의 email/phone을 users 도큐먼트에 자동 저장
   - 기존 가입자: orders 컬렉션에서 이메일 매핑 백필
   - 검색창에서 이메일/전화로도 검색 가능
   ================================================================ */
(function () {
  'use strict';

  /* ── 1. 로그인 시 ME의 email/phone을 users 도큐먼트에 자동 저장 ── */
  const _origLoadUser = window.loadUser;
  if (typeof _origLoadUser === 'function') {
    window.loadUser = async function (uid) {
      const r = await _origLoadUser.call(this, uid);
      try {
        if (window.ME && window.UDATA && window.FB?.updateDoc) {
          const me = window.ME;
          const email = me.email || me.providerData?.[0]?.email || '';
          const phone = me.phoneNumber || me.providerData?.[0]?.phoneNumber || '';
          const updates = {};
          if (email && window.UDATA.email !== email) updates.email = email;
          if (phone && window.UDATA.phoneNumber !== phone) updates.phoneNumber = phone;
          if (Object.keys(updates).length) {
            await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', uid), updates);
            Object.assign(window.UDATA, updates);
          }
        }
      } catch (e) {}
      return r;
    };
  }

  /* ── 2. orders에서 이메일 매핑 백필 ── */
  async function buildEmailMap() {
    if (window._adminEmailMap) return window._adminEmailMap;
    const map = {};
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'orders'));
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.uid && data.userEmail && !map[data.uid]) map[data.uid] = data.userEmail;
      });
    } catch (e) {}
    window._adminEmailMap = map;
    return map;
  }

  /* ── 3. renderAdminUsers 오버라이드 ── */
  window.renderAdminUsers = function (list) {
    if (!list) list = window._allUsers || [];
    const w = document.getElementById('adminUserList');
    if (!w) return;
    if (!list.length) {
      w.innerHTML = '<div style="text-align:center;padding:20px;color:#aaa">회원이 없어요</div>';
      return;
    }
    const emailMap = window._adminEmailMap || {};

    w.innerHTML = `<div style="font-size:11px;color:#aaa;margin-bottom:6px">총 ${list.length}명</div>` +
      list.map(u => {
        const email = u.email || emailMap[u.id] || '-';
        const phone = u.phoneNumber || u.phone || u.kakaoPhone || '-';
        const hasContact = email !== '-' || phone !== '-';
        return `
          <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:6px;border:1px solid ${hasContact ? '#e8f5e9' : '#eee'}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
              <div style="flex:1;min-width:0;font-size:12px;line-height:1.7">
                <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:6px">
                  👤 ${u.nickname || '닉네임없음'}
                </div>
                <div style="color:#444;word-break:break-all">
                  <span style="color:#888">📧</span> ${email}
                </div>
                <div style="color:#444">
                  <span style="color:#888">📱</span> ${phone}
                </div>
                <div style="color:#888;margin-top:4px;font-size:11px">
                  ${u.age || '-'} · ${u.gender || '-'} · ${u.region || '-'} · ${u.job || '-'}
                </div>
                <div style="color:#bbb;font-size:11px">
                  UID: ${u.id ? u.id.slice(0, 14) + '…' : '-'}
                </div>
                <div style="color:#bbb;font-size:11px">
                  관심: ${(u.interests || []).join(', ') || '-'}
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:13px;font-weight:700;color:var(--g2)">${(u.point || 0).toLocaleString()}P</div>
                <div style="font-size:11px;color:#aaa">미션 ${u.missionCount || 0}개</div>
                <div style="font-size:11px;color:#aaa">CO₂ ${(u.co2 || 0).toFixed(1)}kg</div>
              </div>
            </div>
          </div>`;
      }).join('');
  };

  /* ── 4. loadAllUsers 후크 → email 백필 후 재렌더 ── */
  const _origLoadAll = window.loadAllUsers;
  if (typeof _origLoadAll === 'function') {
    window.loadAllUsers = async function () {
      await _origLoadAll.call(this);
      await buildEmailMap();
      if (window._allUsers) window.renderAdminUsers(window._allUsers);
    };
  }

  /* ── 5. 검색 확장 (닉네임/이메일/전화) ── */
  window.searchAdminUsers = function () {
    const q = (document.getElementById('userSearchInp')?.value || '').toLowerCase().trim();
    if (!q) {
      window.renderAdminUsers(window._allUsers || []);
      return;
    }
    const emailMap = window._adminEmailMap || {};
    const filtered = (window._allUsers || []).filter(u => {
      const email = (u.email || emailMap[u.id] || '').toLowerCase();
      const phone = (u.phoneNumber || u.phone || u.kakaoPhone || '').toLowerCase();
      const nick = (u.nickname || '').toLowerCase();
      return nick.includes(q) || email.includes(q) || phone.includes(q) ||
             (u.region || '').toLowerCase().includes(q) ||
             (u.age || '').toLowerCase().includes(q);
    });
    window.renderAdminUsers(filtered);
  };

  /* ── 검색창 placeholder 업데이트 ── */
  function updateSearchPlaceholder() {
    const inp = document.getElementById('userSearchInp');
    if (inp && !inp.dataset.ehUpdated) {
      inp.placeholder = '닉네임 / 이메일 / 전화 검색';
      inp.dataset.ehUpdated = '1';
    }
  }
  [500, 2000, 5000].forEach(t => setTimeout(updateSearchPlaceholder, t));

  /* ── CSV 내보내기에도 email/phone 포함 ── */
  const _origExport = window.exportCSV;
  if (typeof _origExport === 'function') {
    window.exportCSV = async function () {
      // 백필 한 번 더
      await buildEmailMap();
      // 원본 호출 (전 부분 그대로 동작)
      return _origExport.call(this);
    };
  }

  console.log('[admin_user_info_patch] ✅ 회원 탭 정보 확장 완료');
})();
