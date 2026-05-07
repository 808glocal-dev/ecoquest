/* ================================================================
   EcoQuest – admin_user_info_patch.js  v2
   1. 온보딩 모달에 이메일/휴대폰번호 입력 필드 추가 (필수)
   2. 가입 시 email/phoneNumber를 users 도큐먼트에 저장
   3. 관리자 → 회원 탭에 "📥 회원 CSV 다운로드" 버튼
   4. 회원 카드에 닉네임/이메일/전화 표시
   5. 검색창 → 닉네임/이메일/전화로 검색
   6. orders 컬렉션에서 이메일 백필 (기존 회원)
   ================================================================ */
(function () {
  'use strict';

  /* 자체 캐시 — 원본의 _allUsers는 let이라 window에 없어서 직접 캐시 */
  let _ehAllUsersCache = [];

  /* ──────────────────────────────────────
     1. 온보딩 모달에 입력 필드 동적 삽입
     ────────────────────────────────────── */
  function addContactFieldsToOnboard() {
    const modal = document.querySelector('#ovOnboard .modal');
    if (!modal) return;
    if (modal.querySelector('#emailInp')) return;       // 이미 있음

    const nickGroup = modal.querySelector('#nicknameInp')?.closest('.form-group');
    if (!nickGroup) return;

    // 이메일
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    emailGroup.innerHTML = `
      <label>이메일 <span style="color:var(--red)">*</span></label>
      <input class="inp" id="emailInp" type="email" autocomplete="email"
             placeholder="example@email.com"/>`;

    // 휴대폰번호 (선택)
    const phoneGroup = document.createElement('div');
    phoneGroup.className = 'form-group';
    phoneGroup.innerHTML = `
      <label>휴대폰번호 <span style="color:var(--sub);font-weight:400">(선택)</span></label>
      <input class="inp" id="phoneInp" type="tel" inputmode="numeric"
             autocomplete="tel" placeholder="010-1234-5678 (쿠폰 받으려면 입력)"/>
      <div style="font-size:11px;color:var(--sub);margin-top:4px;line-height:1.5">
        선택 입력. 입력 시 제휴 매장 쿠폰·중요 안내에만 사용해요. 마케팅 발송 X
      </div>`;

    nickGroup.parentElement.insertBefore(emailGroup, nickGroup.nextSibling);
    nickGroup.parentElement.insertBefore(phoneGroup, emailGroup.nextSibling);

    // 자동 채우기
    const emailInp = document.getElementById('emailInp');
    if (emailInp && !emailInp.value) {
      emailInp.value = window.UDATA?.email || window.ME?.email || '';
    }
    const phoneInp = document.getElementById('phoneInp');
    if (phoneInp && !phoneInp.value) {
      phoneInp.value = window.UDATA?.phoneNumber || window.UDATA?.phone || '';
    }

    // 휴대폰 자동 하이픈
    if (phoneInp) {
      phoneInp.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 7)      e.target.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7);
        else if (v.length > 3) e.target.value = v.slice(0,3) + '-' + v.slice(3);
        else                   e.target.value = v;
      });
    }
  }

  /* 모달 열릴 때 자동 삽입 */
  function watchOnboardModal() {
    const ov = document.getElementById('ovOnboard');
    if (!ov || ov._ehWatched) return;
    new MutationObserver(() => {
      if (ov.classList.contains('on')) setTimeout(addContactFieldsToOnboard, 80);
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    ov._ehWatched = true;
  }

  /* ──────────────────────────────────────
     2. saveOnboard 후크 → email/phone 검증 + 저장
     ────────────────────────────────────── */
  const _origSaveOnboard = window.saveOnboard;
  if (typeof _origSaveOnboard === 'function') {
    window.saveOnboard = async function () {
      const email = document.getElementById('emailInp')?.value.trim() || '';
      const phone = document.getElementById('phoneInp')?.value.trim() || '';

      if (!email) { window.toast?.('이메일을 입력해주세요!'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        window.toast?.('올바른 이메일 형식이 아니에요!'); return;
      }
      // 휴대폰은 선택. 입력했을 때만 형식 검증
      if (phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
          window.toast?.('휴대폰번호 형식이 올바르지 않아요!'); return;
        }
      }

      const r = await _origSaveOnboard.call(this);

      try {
        if (window.ME && window.FB?.updateDoc) {
          const updates = { email };
          if (phone) updates.phoneNumber = phone;
          await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), updates);
          Object.assign(window.UDATA || {}, updates);
        }
      } catch (e) { console.warn('[admin_user_info] email/phone 저장 실패', e); }

      return r;
    };
  }

  /* openOnboardEdit (편집 시 기존 값 복원) */
  const _origOpenEdit = window.openOnboardEdit;
  if (typeof _origOpenEdit === 'function') {
    window.openOnboardEdit = function () {
      _origOpenEdit.call(this);
      setTimeout(() => {
        addContactFieldsToOnboard();
        const d = window.UDATA || {};
        const e = document.getElementById('emailInp');
        const p = document.getElementById('phoneInp');
        if (e) e.value = d.email || window.ME?.email || '';
        if (p) p.value = d.phoneNumber || d.phone || '';
      }, 200);
    };
  }

  /* ──────────────────────────────────────
     3. ME(Auth)의 email을 users에 자동 저장
     ────────────────────────────────────── */
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

  /* ──────────────────────────────────────
     4. orders → 이메일 백필 매핑
     ────────────────────────────────────── */
  async function buildEmailMap() {
    if (window._adminEmailMap) return window._adminEmailMap;
    const map = {};
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'orders'));
      snap.docs.forEach(d => {
        const x = d.data();
        if (x.uid && x.userEmail && !map[x.uid]) map[x.uid] = x.userEmail;
      });
    } catch (e) {}
    window._adminEmailMap = map;
    return map;
  }

  /* ──────────────────────────────────────
     5. renderAdminUsers 오버라이드
     ────────────────────────────────────── */
  window.renderAdminUsers = function (list) {
    // 받은 list를 캐시 (원본 loadAllUsers가 호출할 때마다 갱신됨)
    if (Array.isArray(list)) _ehAllUsersCache = list;
    if (!list) list = _ehAllUsersCache;

    const w = document.getElementById('adminUserList');
    if (!w) return;
    if (!list || !list.length) {
      w.innerHTML = '<div style="text-align:center;padding:20px;color:#aaa">회원이 없어요</div>';
      return;
    }
    const emailMap = window._adminEmailMap || {};

    w.innerHTML = `<div style="font-size:11px;color:#aaa;margin-bottom:6px">총 ${list.length}명</div>` +
      list.map(u => {
        const email = u.email || emailMap[u.id] || '-';
        const phone = u.phoneNumber || u.phone || u.kakaoPhone || '-';
        const has = email !== '-' || phone !== '-';
        return `
          <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:6px;border:1px solid ${has ? '#e8f5e9' : '#eee'}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
              <div style="flex:1;min-width:0;font-size:12px;line-height:1.7">
                <div style="font-size:14px;font-weight:700;color:#333;margin-bottom:6px">👤 ${u.nickname || '닉네임없음'}</div>
                <div style="color:#444;word-break:break-all"><span style="color:#888">📧</span> ${email}</div>
                <div style="color:#444"><span style="color:#888">📱</span> ${phone}</div>
                <div style="color:#888;margin-top:4px;font-size:11px">${u.age || '-'} · ${u.gender || '-'} · ${u.region || '-'} · ${u.job || '-'}</div>
                <div style="color:#bbb;font-size:11px">UID: ${u.id ? u.id.slice(0, 14) + '…' : '-'}</div>
                <div style="color:#bbb;font-size:11px">관심: ${(u.interests || []).join(', ') || '-'}</div>
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

  /* loadAllUsers 후크 → email 백필 */
  const _origLoadAll = window.loadAllUsers;
  if (typeof _origLoadAll === 'function') {
    window.loadAllUsers = async function () {
      await _origLoadAll.call(this);
      await buildEmailMap();
      if (_ehAllUsersCache.length) window.renderAdminUsers(_ehAllUsersCache);
      addExportBtn();
    };
  }

  /* 검색 확장 */
  window.searchAdminUsers = function () {
    const q = (document.getElementById('userSearchInp')?.value || '').toLowerCase().trim();
    if (!q) { window.renderAdminUsers(_ehAllUsersCache); return; }
    const emailMap = window._adminEmailMap || {};
    const filtered = _ehAllUsersCache.filter(u => {
      const email = (u.email || emailMap[u.id] || '').toLowerCase();
      const phone = (u.phoneNumber || u.phone || u.kakaoPhone || '').toLowerCase();
      const nick  = (u.nickname || '').toLowerCase();
      return nick.includes(q) || email.includes(q) || phone.includes(q) ||
             (u.region || '').toLowerCase().includes(q) ||
             (u.age    || '').toLowerCase().includes(q);
    });
    window.renderAdminUsers(filtered);
  };

  function updatePlaceholder() {
    const inp = document.getElementById('userSearchInp');
    if (inp && !inp.dataset.ehUpdated) {
      inp.placeholder = '닉네임 / 이메일 / 전화 검색';
      inp.dataset.ehUpdated = '1';
    }
  }

  /* ──────────────────────────────────────
     6. 회원 탭 "📥 CSV 다운로드" 버튼
     ────────────────────────────────────── */
  function addExportBtn() {
    const adminUsers = document.getElementById('admin-users');
    if (!adminUsers || document.getElementById('ehUserExportBtn')) return;
    const allBtn = adminUsers.querySelector('button[onclick*="loadAllUsers"]');
    if (!allBtn) return;

    const btn = document.createElement('button');
    btn.id = 'ehUserExportBtn';
    btn.style.cssText = 'width:100%;background:#1a1a2e;color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px';
    btn.textContent = '📥 회원 CSV 다운로드 (이메일·전화 포함)';
    btn.onclick = exportUsersCSV;
    allBtn.parentElement.insertBefore(btn, allBtn.nextSibling);
  }

  async function exportUsersCSV() {
    let users = _ehAllUsersCache;

    // 1차: 같은 페이지 글로벌 스코프의 _allUsers 직접 참조 시도
    if (!users.length) {
      try {
        if (typeof _allUsers !== 'undefined' && Array.isArray(_allUsers) && _allUsers.length) {
          users = _allUsers;
          _ehAllUsersCache = _allUsers;
        }
      } catch (e) {}
    }

    // 2차: loadAllUsers 호출
    if (!users.length) {
      window.toast?.('회원 정보 로딩 중...');
      if (typeof window.loadAllUsers === 'function') {
        await window.loadAllUsers();
        users = _ehAllUsersCache;
        // 다시 글로벌 변수도 시도
        if (!users.length) {
          try {
            if (typeof _allUsers !== 'undefined' && _allUsers.length) {
              users = _allUsers;
              _ehAllUsersCache = _allUsers;
            }
          } catch (e) {}
        }
      }
    }

    // 3차: 직접 Firestore fetch (마지막 fallback)
    if (!users.length) {
      try {
        window.toast?.('직접 조회 중...');
        const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
        users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        _ehAllUsersCache = users;
      } catch (e) {
        console.error('[admin_user_info] 직접 fetch 실패', e);
        window.toast?.('회원 조회 실패: ' + (e.message || ''));
        return;
      }
    }

    console.log('[admin_user_info] CSV 시도:', {
      cacheLen: _ehAllUsersCache.length,
      usersLen: users.length,
      globalAllUsers: (typeof _allUsers === 'undefined') ? 'undefined' : `array(${_allUsers?.length})`
    });

    if (!users.length) {
      window.toast?.('회원이 한 명도 없어요'); return;
    }

    await buildEmailMap();
    const emailMap = window._adminEmailMap || {};

    const rows = [
      ['UID','닉네임','이메일','휴대폰번호','나이대','성별','지역','직업','자동차','가구형태','환경관심도','관심분야','미션수','포인트','CO2절감(kg)','가입일']
    ];
    users.forEach(u => {
      const email = u.email || emailMap[u.id] || '';
      const phone = u.phoneNumber || u.phone || u.kakaoPhone || '';
      const created = u.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '';
      rows.push([
        u.id || '', u.nickname || '', email, phone,
        u.age || '', u.gender || '', u.region || '', u.job || '',
        u.hasCar || '', u.household || '', u.ecoLevel || '',
        (u.interests || []).join('|'),
        u.missionCount || 0, u.point || 0, (u.co2 || 0).toFixed(2),
        created
      ]);
    });

    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `EcoQuest_회원목록_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    window.toast?.('✅ 회원 CSV 다운로드 완료!');
  }
  window.exportUsersCSV = exportUsersCSV;

  /* admin 페이지 열릴 때 버튼 자동 삽입 */
  function watchAdminPage() {
    const ap = document.getElementById('adminPage');
    if (!ap || ap._ehWatched) return;
    new MutationObserver(() => {
      if (ap.style.display !== 'none') {
        setTimeout(() => { addExportBtn(); updatePlaceholder(); }, 100);
      }
    }).observe(ap, { attributes: true, attributeFilter: ['style'] });
    ap._ehWatched = true;
  }

  /* ──────────────────────────────────────
     실행
     ────────────────────────────────────── */
  function run() {
    try { addContactFieldsToOnboard(); } catch(e){}
    try { watchOnboardModal();         } catch(e){}
    try { watchAdminPage();            } catch(e){}
    try { addExportBtn();              } catch(e){}
    try { updatePlaceholder();         } catch(e){}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 300));
  } else {
    setTimeout(run, 300);
  }
  [1000, 2500, 5000].forEach(t => setTimeout(run, t));

  console.log('[admin_user_info_patch v2] ✅ 온보딩 입력 + CSV 다운로드 + 회원 표시');
})();
