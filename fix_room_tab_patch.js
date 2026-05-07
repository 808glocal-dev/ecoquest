/**
 * EcoQuest 방 챌린지 탭 활성화 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단에 추가 (마지막에)
 *   <script src="fix_room_tab_patch.js"></script>
 *
 * 동작:
 * 1. ctab-room 버튼의 toast 메시지 onclick을 setCTab('room')으로 교체
 * 2. "준비중" 뱃지 제거
 * 3. 내 방·공개 방 섹션 숨김 (헤더 + 리스트)
 */

(function(){
  'use strict';

  // ═══════════════════════════════════════════
  // 🔧 ctab-room 버튼 활성화
  // ═══════════════════════════════════════════
  function fixRoomTab() {
    const btn = document.getElementById('ctab-room');
    if (!btn || btn.dataset.activated === 'true') return;
    btn.dataset.activated = 'true';

    // "준비중" 뱃지 제거 + 텍스트 정리
    btn.innerHTML = '👥 방 챌린지';

    // 기존 onclick (toast 띄우는) 제거
    btn.removeAttribute('onclick');

    // 새 onclick 등록
    btn.onclick = function() {
      if (typeof window.setCTab === 'function') {
        window.setCTab('room');
      } else {
        // setCTab 없을 때 직접 처리 (백업)
        document.querySelectorAll('.ctab').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        const secOff = document.getElementById('sec-official');
        const secRoom = document.getElementById('sec-room');
        if (secOff) secOff.style.display = 'none';
        if (secRoom) secRoom.style.display = 'block';
      }
    };

    console.log('[방챌린지] ctab-room 활성화 ✓');
  }

  // ═══════════════════════════════════════════
  // 🙈 내 방·공개 방 섹션 숨김
  // ═══════════════════════════════════════════
  function hideRoomLists() {
    ['myRoomList', 'pubRoomList'].forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.dataset.frtHidden === 'true') return;
      el.dataset.frtHidden = 'true';
      el.style.display = 'none';
      // 직전 sec 헤더 (📌 내 방 / 🌍 공개 방) 숨김
      const prev = el.previousElementSibling;
      if (prev && prev.classList.contains('sec')) {
        prev.style.display = 'none';
      }
    });
  }

  // ═══════════════════════════════════════════
  // 🚀 실행
  // ═══════════════════════════════════════════
  function run() {
    fixRoomTab();
    hideRoomLists();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  setTimeout(run, 100);
  setTimeout(run, 500);
  setTimeout(run, 1500);
  // 다른 패치가 다시 그릴 가능성 대비 영구 폴링
  setInterval(run, 3000);

  console.log('%c[방챌린지 활성화] ✓ 패치 로드됨', 'color:#2ECC71;font-weight:bold');
})();
