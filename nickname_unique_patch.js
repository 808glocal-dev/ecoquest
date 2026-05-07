/* ================================================================
   EcoQuest – nickname_unique_patch.js
   - 닉네임 중복 방지: 같은 닉네임으로 저장 차단
   - users 컬렉션에서 nickname 필드 검색
   - 입력 필드 실시간 체크 + 저장 시점 차단
   ================================================================ */
(function () {
  'use strict';

  console.log('[nickname_unique_patch] 🚀 시작');

  /* ─── 닉네임 중복 체크 헬퍼 (전역 노출) ─── */
  window.checkNicknameDuplicate = async function (nickname, excludeUid) {
    if (!nickname || !window.FB) return false;
    const trimmed = String(nickname).trim();
    if (!trimmed) return false;

    try {
      const q = window.FB.query(
        window.FB.collection(window.FB.db, 'users'),
        window.FB.where('nickname', '==', trimmed)
      );
      const snap = await window.FB.getDocs(q);
      for (const doc of snap.docs) {
        if (doc.id !== excludeUid) {
          return true; // 다른 사용자가 이미 사용 중
        }
      }
      return false;
    } catch (e) {
      console.error('[nickname check] 검색 실패 (보안 규칙 확인 필요)', e);
      return false; // 오류 시 통과 (서비스 중단 방지)
    }
  };

  /* ─── ★ Firestore updateDoc 후킹 (가장 강력) ─── */
  if (window.FB?.updateDoc && !window._nickDupUpdateHooked) {
    const _origUpdate = window.FB.updateDoc;
    window.FB.updateDoc = async function (ref, data, ...rest) {
      // users 컬렉션 + nickname 변경 감지
      if (data?.nickname && ref?.path?.startsWith('users/')) {
        const uid = ref.path.split('/')[1];
        const isDup = await window.checkNicknameDuplicate(data.nickname, uid);
        if (isDup) {
          (window.toast || alert)(`"${data.nickname}"는 이미 사용 중인 닉네임이에요`);
          throw new Error('Duplicate nickname blocked by patch');
        }
      }
      return _origUpdate.call(this, ref, data, ...rest);
    };
    window._nickDupUpdateHooked = true;
  }

  /* ─── setDoc도 후킹 (회원가입/최초 설정) ─── */
  if (window.FB?.setDoc && !window._nickDupSetHooked) {
    const _origSet = window.FB.setDoc;
    window.FB.setDoc = async function (ref, data, ...rest) {
      if (data?.nickname && ref?.path?.startsWith('users/')) {
        const uid = ref.path.split('/')[1];
        const isDup = await window.checkNicknameDuplicate(data.nickname, uid);
        if (isDup) {
          (window.toast || alert)(`"${data.nickname}"는 이미 사용 중인 닉네임이에요`);
          throw new Error('Duplicate nickname blocked by patch');
        }
      }
      return _origSet.call(this, ref, data, ...rest);
    };
    window._nickDupSetHooked = true;
  }

  /* ─── 입력 필드 실시간 체크 ─── */
  function attachNicknameValidator() {
    const selectors = [
      '#nickname',
      '#nicknameInput',
      'input[name="nickname"]',
      '.nicknameInput',
      '[data-field="nickname"]',
      '#nickInput',
      '[placeholder*="닉네임"]',
    ];
    const inputs = new Set();
    selectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (el.tagName === 'INPUT') inputs.add(el);
        });
      } catch (e) {}
    });

    inputs.forEach(input => {
      if (input.dataset.dupChecked === '1') return;
      input.dataset.dupChecked = '1';

      let timer;
      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const val = input.value.trim();
          if (!val || val.length < 2) {
            removeMsg(input);
            input.style.borderColor = '';
            return;
          }
          const isDup = await window.checkNicknameDuplicate(val, window.ME?.uid);
          if (isDup) {
            input.style.borderColor = '#e74c3c';
            showMsg(input, `❌ "${val}"는 이미 사용 중이에요`, '#e74c3c');
          } else {
            input.style.borderColor = '#2ecc71';
            showMsg(input, `✅ 사용 가능한 닉네임이에요`, '#2ecc71');
          }
        }, 400);
      });
    });
  }

  function removeMsg(input) {
    const wrap = input.parentElement;
    if (!wrap) return;
    wrap.querySelectorAll('.ehDupMsg').forEach(m => m.remove());
  }
  function showMsg(input, text, color) {
    const wrap = input.parentElement;
    if (!wrap) return;
    let msg = wrap.querySelector('.ehDupMsg');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'ehDupMsg';
      msg.style.cssText = 'font-size:11px;margin-top:4px;font-weight:600;font-family:inherit';
      wrap.appendChild(msg);
    }
    msg.style.color = color;
    msg.textContent = text;
  }

  /* ─── 자동 적용 + 모달 열림 감지 ─── */
  setTimeout(attachNicknameValidator, 1000);
  [2000, 4000, 8000].forEach(t => setTimeout(attachNicknameValidator, t));

  const _origOpenOv = window.openOv;
  if (typeof _origOpenOv === 'function' && !window._nickOpenHooked) {
    window.openOv = function (id) {
      const r = _origOpenOv.call(this, id);
      setTimeout(attachNicknameValidator, 200);
      return r;
    };
    window._nickOpenHooked = true;
  }

  console.log('[nickname_unique_patch] ✅ 닉네임 중복 방지 활성화');
})();
