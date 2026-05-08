/**
 * EcoQuest 댓글 자동 유지 patch.js (v2 - 강화)
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단에 추가
 *   <script src="eco_story_comments_fix_patch.js"></script>
 *
 * v2 변경: MutationObserver로 즉시 반응, 100ms 폴링, 깜빡임 제거
 */

(function () {
  'use strict';

  const _openComments = new Set();
  let _busy = false;

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function shortTime(ts) {
    if (!ts) return '';
    const sec = (Date.now() - ts) / 1000;
    if (sec < 60) return '방금 전';
    if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
    return `${Math.floor(sec / 86400)}일 전`;
  }

  function renderCommentsInArea(verifId) {
    const area = document.getElementById(`ehComments-${verifId}`);
    if (!area) return;
    const list = area.querySelector('.ehCommentList');
    if (!list) return;

    const item = window._feedItems?.[verifId];
    const comments = (item?.comments || []).slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    if (!comments.length) {
      list.innerHTML = '<div class="ehNoComments">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</div>';
      return;
    }

    list.innerHTML = comments.map(c => {
      const avatar = c.userPhoto ? `<img src="${escapeHtml(c.userPhoto)}"/>` : '👤';
      const isMe = c.uid === window.ME?.uid;
      return `
        <div class="ehCommentItem">
          <div class="ehCommentAvatar">${avatar}</div>
          <div class="ehCommentBody">
            <div class="ehCommentName">${escapeHtml(c.userName || '익명')}</div>
            <div class="ehCommentText">${escapeHtml(c.text || '')}</div>
            <div class="ehCommentMeta">
              <span class="ehCommentTime">${shortTime(c.createdAt)}</span>
              ${isMe ? `<button class="ehCommentDelBtn" onclick="ehDeleteComment('${verifId}','${c.id}')">삭제</button>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function restoreArea(verifId) {
    const area = document.getElementById(`ehComments-${verifId}`);
    if (!area) return;
    if (!area.classList.contains('on')) {
      area.classList.add('on');
    }
    // 댓글 수 체크 후 다를 때만 리렌더
    const list = area.querySelector('.ehCommentList');
    const item = window._feedItems?.[verifId];
    const expected = item?.comments?.length || 0;
    const actual = list?.querySelectorAll('.ehCommentItem').length || 0;
    if (expected !== actual || (expected === 0 && !list?.querySelector('.ehNoComments'))) {
      renderCommentsInArea(verifId);
    }
  }

  function restoreAll() {
    if (_busy) return;
    _busy = true;
    try {
      _openComments.forEach(restoreArea);
    } finally {
      _busy = false;
    }
  }

  // ─── ehToggleComments 오버라이드 ───
  window.ehToggleComments = function (verifId) {
    const area = document.getElementById(`ehComments-${verifId}`);
    if (!area) return;
    const wasOn = area.classList.contains('on');
    area.classList.toggle('on');
    if (wasOn) {
      _openComments.delete(verifId);
    } else {
      _openComments.add(verifId);
      renderCommentsInArea(verifId);
      setTimeout(() => area.querySelector('input')?.focus(), 100);
    }
  };

  // ─── ehSubmitComment 후킹 ───
  function hookSubmit() {
    const _orig = window.ehSubmitComment;
    if (typeof _orig !== 'function' || window._ehFixSubmitHooked) return;
    window._ehFixSubmitHooked = true;
    window.ehSubmitComment = async function (verifId) {
      _openComments.add(verifId);
      const r = await _orig.call(this, verifId);
      // 즉시 + 짧은 간격으로 여러번 복구
      restoreArea(verifId);
      setTimeout(() => restoreArea(verifId), 50);
      setTimeout(() => restoreArea(verifId), 200);
      setTimeout(() => restoreArea(verifId), 600);
      return r;
    };
  }
  hookSubmit();
  setInterval(hookSubmit, 1000); // 다른 패치가 덮어쓸 경우 대비

  // ─── 빠른 폴링 (100ms) ───
  setInterval(restoreAll, 100);

  // ─── MutationObserver - 피드 변화 즉시 감지 ───
  let _observer = null;
  function startObserving() {
    const feed = document.getElementById('feedList');
    if (!feed) {
      setTimeout(startObserving, 300);
      return;
    }
    if (_observer) _observer.disconnect();
    _observer = new MutationObserver(() => {
      // 즉시 + 약간 딜레이 후 한 번 더
      restoreAll();
      setTimeout(restoreAll, 30);
      setTimeout(restoreAll, 150);
    });
    _observer.observe(feed, { childList: true, subtree: true });
  }
  startObserving();

  // 페이지 전환 후에도 다시 감지
  if (window.goPage) {
    const _origGo = window.goPage;
    window.goPage = function (...args) {
      const r = _origGo.apply(this, args);
      setTimeout(startObserving, 200);
      setTimeout(restoreAll, 300);
      return r;
    };
  }

  console.log('%c[댓글 fix v2] 강화 모드 ✓ (100ms + MutationObserver)', 'color:#2ECC71;font-weight:bold');
})();
