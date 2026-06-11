/* =====================================================
   EcoQuest – 초대 링크 자동 소속 등록 패치
   - eco-quest.kr?invite=XXXX 접속 시 로그인 후 자동 등록
   - 소속 삭제는 808glocal@gmail.com(운영자)만 가능
   ===================================================== */
(function () {
  'use strict';

  // ── URL에서 invite 코드 읽기 ──
  function getInviteCode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite')?.toUpperCase() || null;
  }

  // ── localStorage에 임시 저장 (로그인 전 보존) ──
  const INVITE_KEY = 'eq_pending_invite';

  function savePendingInvite(code) {
    if (code) localStorage.setItem(INVITE_KEY, code);
  }

  function getPendingInvite() {
    return localStorage.getItem(INVITE_KEY);
  }

  function clearPendingInvite() {
    localStorage.removeItem(INVITE_KEY);
  }

  // ── 소속 자동 등록 함수 ──
  async function autoJoinCompany(code) {
    if (!code || !window.ME || !window.FB) return;
    if (window.UDATA?.companyId) return; // 이미 소속 있으면 스킵

    try {
      const allSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
      const found = allSnap.docs.find(d => d.data().inviteCode === code);
      if (!found) { clearPendingInvite(); return; }

      const co = found.data();
      if ((co.members || []).includes(window.ME.uid)) {
        // 이미 멤버면 companyId만 업데이트
        await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { companyId: found.id });
        window.UDATA.companyId = found.id;
        clearPendingInvite();
        toast(`✅ "${co.name}" 소속으로 연결됐어요!`);
        if (window.loadCompanyPage) window.loadCompanyPage();
        return;
      }

      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'companies', found.id), {
        members: window.FB.arrayUnion(window.ME.uid),
        memberCount: window.FB.increment(1),
      });
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { companyId: found.id });
      window.UDATA.companyId = found.id;

      clearPendingInvite();

      // URL에서 invite 파라미터 제거 (깔끔하게)
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url.toString());

      toast(`🎉 "${co.name}" 소속으로 자동 등록됐어요!`);

      // 소속 탭으로 이동
      setTimeout(() => {
        if (window.goPage) window.goPage('company');
      }, 1000);

    } catch (e) {
      console.log('[invite] 자동 등록 실패:', e.message);
      clearPendingInvite();
    }
  }

  // ── 페이지 로드 시 invite 코드 확인 ──
  const urlCode = getInviteCode();
  if (urlCode) savePendingInvite(urlCode);

  // ── loadUser 훅 — 로그인 완료 후 자동 등록 ──
  const _origLoadUser = window.loadUser;
  window.loadUser = async function (uid) {
    if (_origLoadUser) await _origLoadUser(uid);
    const code = getPendingInvite();
    if (code) {
      // UDATA 로드 후 약간 딜레이
      setTimeout(() => autoJoinCompany(code), 800);
    }
  };

  // ── showApp 훅 (게스트 → 로그인 전환 시) ──
  const _origShowApp = window.showApp;
  window.showApp = function () {
    if (_origShowApp) _origShowApp();
    const code = getPendingInvite();
    if (code && window.ME) {
      setTimeout(() => autoJoinCompany(code), 1200);
    }
  };

  // ── 삭제 버튼: 808만 보이게 패치 ──
  // company_page_patch.js의 loadCompanyPage 래핑
  const _origLoadCompanyPage = window.loadCompanyPage;
  window.loadCompanyPage = async function () {
    if (_origLoadCompanyPage) await _origLoadCompanyPage();
    patchDeleteButtons();
  };

  // loadCompanySec도 래핑
  const _origLoadCompanySec = window.loadCompanySec;
  window.loadCompanySec = async function () {
    if (_origLoadCompanySec) await _origLoadCompanySec();
    patchDeleteButtons();
  };

  function patchDeleteButtons() {
    const isAdmin = window.ME?.email === window.ADMIN;

    // 삭제 버튼 찾아서 808 아니면 숨기기
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.includes('🗑️') && btn.getAttribute('onclick')?.includes('openDeleteCompany')) {
        btn.style.display = isAdmin ? '' : 'none';
      }
    });

    // isOwner지만 808 아닌 경우 삭제 버튼 행 조정
    if (!isAdmin) {
      document.querySelectorAll('[onclick*="openDeleteCompany"]').forEach(el => {
        el.style.display = 'none';
        // 이름변경 버튼이 혼자 남으면 전체 너비로
        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(c => c !== el && c.style.display !== 'none');
          siblings.forEach(s => s.style.flex = '1');
        }
      });
    }
  }

  // openDeleteCompany도 808 체크 추가
  const _origOpenDeleteCompany = window.openDeleteCompany;
  window.openDeleteCompany = function (cid, memberCount) {
    if (window.ME?.email !== window.ADMIN) {
      toast('소속 삭제는 운영자만 가능해요!');
      return;
    }
    if (_origOpenDeleteCompany) _origOpenDeleteCompany(cid, memberCount);
  };

  // ── 초대 링크 배너 표시 (invite 파라미터 있을 때) ──
  function showInviteBanner(code) {
    if (!code) return;
    const existing = document.getElementById('inviteBanner');
    if (existing) return;

    const tryShow = () => {
      const ls = document.getElementById('loginScreen');
      if (!ls || ls.style.display === 'none') return;

      const banner = document.createElement('div');
      banner.id = 'inviteBanner';
      banner.style.cssText =
        'background:linear-gradient(135deg,#1B6B3A,#2ECC71);padding:10px 16px;' +
        'text-align:center;color:#fff;font-size:12px;font-weight:700;' +
        'position:fixed;top:0;left:0;right:0;z-index:9999;';
      banner.innerHTML = `
        🌍 초대 링크로 접속하셨어요!
        로그인 후 소속에 자동으로 등록돼요 🎉
      `;
      document.body.prepend(banner);

      // 로그인 완료 후 배너 제거
      const obs = new MutationObserver(() => {
        if (ls.style.display === 'none') {
          banner.remove();
          obs.disconnect();
        }
      });
      obs.observe(ls, { attributes: true, attributeFilter: ['style'] });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(tryShow, 500));
    } else {
      setTimeout(tryShow, 500);
    }
  }

  if (urlCode) showInviteBanner(urlCode);

  console.log('[invite_patch] 로드 완료', urlCode ? `초대코드: ${urlCode}` : '');

})();
