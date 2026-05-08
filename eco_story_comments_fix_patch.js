/**
 * EcoQuest 댓글 영역 자동 유지 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단에 추가 (eco_story_comments_patch.js 다음)
 *   <script src="eco_story_comments_fix_patch.js"></script>
 *
 * 문제: 댓글 작성 후 피드 재렌더링 시 댓글 영역이 닫혀서 안 보임
 * 해결: 한 번 펼친 댓글 영역은 자동으로 다시 열어주고 댓글 렌더링
 */

(function () {
  'use strict';

  // 펼쳐진 댓글 영역 추적
  const _openComments = new Set();

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

  // ─── ehToggleComments 오버라이드 (열림/닫힘 상태 추적) ───
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

  // ─── ehSubmitComment 후킹 (작성 후 열림 보장) ───
  const _origSubmit = window.ehSubmitComment;
  if (typeof _origSubmit === 'function') {
    window.ehSubmitComment = async function (verifId) {
      _openComments.add(verifId);
      const r = await _origSubmit.call(this, verifId);
      setTimeout(() => {
        const area = document.getElementById(`ehComments-${verifId}`);
        if (area) {
          area.classList.add('on');
          renderCommentsInArea(verifId);
        }
      }, 150);
      return r;
    };
  }

  // ─── 주기적으로 열림 상태 복구 ───
  setInterval(() => {
    _openComments.forEach(verifId => {
      const area = document.getElementById(`ehComments-${verifId}`);
      if (!area) return;

      if (!area.classList.contains('on')) {
        // 닫혀 있으면 다시 열기
        area.classList.add('on');
        renderCommentsInArea(verifId);
      } else {
        // 열려있어도 댓글 수가 안 맞으면 다시 그리기 (누락 방지)
        const list = area.querySelector('.ehCommentList');
        const item = window._feedItems?.[verifId];
        const expectedCount = item?.comments?.length || 0;
        const actualCount = list?.querySelectorAll('.ehCommentItem').length || 0;
        if (expectedCount !== actualCount && expectedCount > 0) {
          renderCommentsInArea(verifId);
        }
      }
    });
  }, 500);

  console.log('%c[댓글 fix] 영역 열림 상태 자동 유지 ✓', 'color:#2ECC71;font-weight:bold');
})();
