/* ================================================================
   EcoQuest – eco_story_comments_patch.js
   에코 스토리 카드에 댓글 기능 추가
   - ❤️ 옆에 💬 댓글 버튼 (카운트 표시)
   - 클릭 시 카드 하단에 댓글 영역 인라인 펼침
   - 댓글 작성/삭제 (본인 댓글만 삭제 가능)
   - Firestore: verifications/{id}.comments 배열에 저장
   - eco_story_card_v2.js 다음에 로드해야 함
   ================================================================ */
(function () {
  'use strict';

  /* ─── CSS ─── */
  const css = `
    .ehSCActions { gap: 4px !important; }
    .ehCommentBtn {
      background: none;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
      font-weight: 700;
      color: var(--sub);
      padding: 8px 10px;
      border-radius: 18px;
      cursor: pointer;
      font-family: inherit;
      transition: background .15s, color .15s;
    }
    .ehCommentBtn:hover { background: #f0f0f0; color: var(--g2); }
    .ehCommentBtn .ic { font-size: 18px; }

    .ehSCComments {
      border-top: 1px solid #f5f5f5;
      padding: 12px 14px;
      display: none;
      background: #fafafa;
    }
    .ehSCComments.on { display: block; }

    .ehCommentList { margin-bottom: 8px; }

    .ehCommentItem {
      display: flex;
      gap: 8px;
      padding: 6px 0;
      align-items: flex-start;
    }
    .ehCommentAvatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--g1), var(--g2));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #fff;
      flex-shrink: 0;
      overflow: hidden;
    }
    .ehCommentAvatar img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .ehCommentBody { flex: 1; min-width: 0; }
    .ehCommentName {
      font-size: 12px;
      font-weight: 700;
      color: var(--txt);
      margin-bottom: 2px;
    }
    .ehCommentText {
      font-size: 13px;
      color: #444;
      line-height: 1.5;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .ehCommentMeta {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-top: 3px;
    }
    .ehCommentTime {
      font-size: 10px;
      color: var(--sub);
    }
    .ehCommentDelBtn {
      background: none;
      border: none;
      color: var(--sub);
      font-size: 10px;
      cursor: pointer;
      padding: 0 2px;
      font-family: inherit;
      text-decoration: underline;
    }
    .ehCommentDelBtn:hover { color: var(--red); }

    .ehCommentForm {
      display: flex;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
    .ehCommentForm input {
      flex: 1;
      border: 1px solid var(--bdr);
      border-radius: 18px;
      padding: 8px 12px;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      background: #fff;
      min-width: 0;
    }
    .ehCommentForm input:focus { border-color: var(--g1); }
    .ehCommentForm button {
      background: var(--g1);
      color: #fff;
      border: none;
      border-radius: 18px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      flex-shrink: 0;
    }
    .ehCommentForm button:hover { background: var(--g2); }
    .ehCommentForm button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .ehNoComments {
      font-size: 12px;
      color: var(--sub);
      text-align: center;
      padding: 12px 0;
    }
  `;
  if (!document.getElementById('eco_comments_style')) {
    const s = document.createElement('style');
    s.id = 'eco_comments_style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ─── 헬퍼 ─── */
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

  /* ─── 댓글 토글 ─── */
  window.ehToggleComments = function (verifId) {
    const area = document.getElementById(`ehComments-${verifId}`);
    if (!area) return;
    const wasOn = area.classList.contains('on');
    area.classList.toggle('on');
    if (!wasOn) {
      ehRenderComments(verifId);
      setTimeout(() => area.querySelector('input')?.focus(), 100);
    }
  };

  /* ─── 댓글 렌더링 ─── */
  function ehRenderComments(verifId) {
    const area = document.getElementById(`ehComments-${verifId}`);
    if (!area) return;
    const list = area.querySelector('.ehCommentList');
    if (!list) return;

    const item = window._feedItems?.[verifId];
    const comments = (item?.comments || []).slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

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

  /* ─── 댓글 작성 ─── */
  window.ehSubmitComment = async function (verifId) {
    if (!window.ME) {
      window.toast?.('로그인이 필요해요!');
      return;
    }
    const area = document.getElementById(`ehComments-${verifId}`);
    const input = area?.querySelector('input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 500) {
      window.toast?.('댓글은 500자 이내로 작성해주세요');
      return;
    }

    const submitBtn = area.querySelector('.ehCommentForm button');
    if (submitBtn) submitBtn.disabled = true;

    const newComment = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      uid: window.ME.uid,
      userName: window.UDATA?.nickname || window.ME?.displayName || '익명',
      userPhoto: window.ME?.photoURL || '',
      text,
      createdAt: Date.now(),
    };

    try {
      // 로컬 상태에서 현재 댓글 + 새 댓글 합치기 (read-modify-write)
      const item = window._feedItems?.[verifId];
      const allItem = (window._allFeedItems || []).find(v => v.id === verifId);
      const newComments = [...(item?.comments || []), newComment];

      await window.FB.updateDoc(
        window.FB.doc(window.FB.db, 'verifications', verifId),
        { comments: newComments }
      );

      // 로컬 상태 업데이트
      if (item) item.comments = newComments;
      if (allItem) allItem.comments = newComments;

      input.value = '';
      ehRenderComments(verifId);

      // 카운트 업데이트
      document.querySelectorAll(`[data-comment="${verifId}"] .count`).forEach(el => {
        el.textContent = newComments.length;
      });
    } catch (e) {
      console.error('[comments] 작성 실패', e);
      window.toast?.('댓글 작성 실패: ' + (e.message || ''));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  /* ─── 댓글 삭제 ─── */
  window.ehDeleteComment = async function (verifId, commentId) {
    if (!confirm('댓글을 삭제할까요?')) return;

    const item = window._feedItems?.[verifId];
    const allItem = (window._allFeedItems || []).find(v => v.id === verifId);
    if (!item?.comments) return;

    const newComments = item.comments.filter(c => c.id !== commentId);

    try {
      await window.FB.updateDoc(
        window.FB.doc(window.FB.db, 'verifications', verifId),
        { comments: newComments }
      );
      item.comments = newComments;
      if (allItem) allItem.comments = newComments;
      ehRenderComments(verifId);
      document.querySelectorAll(`[data-comment="${verifId}"] .count`).forEach(el => {
        el.textContent = newComments.length;
      });
    } catch (e) {
      window.toast?.('댓글 삭제 실패: ' + (e.message || ''));
    }
  };

  /* ─── 카드에 댓글 버튼/영역 inject ─── */
  function injectComments() {
    document.querySelectorAll('.ehStoryCard').forEach(card => {
      const likeBtn = card.querySelector('[data-like]');
      if (!likeBtn) return;
      const verifId = likeBtn.dataset.like;

      const item = window._feedItems?.[verifId];
      const cnt = item?.comments?.length || 0;

      // 이미 있으면 카운트만 갱신
      const existingBtn = card.querySelector(`[data-comment="${verifId}"]`);
      if (existingBtn) {
        const cntEl = existingBtn.querySelector('.count');
        if (cntEl) cntEl.textContent = cnt;
        return;
      }

      // 댓글 버튼 추가 (좋아요 옆)
      const actionsDiv = card.querySelector('.ehSCActions');
      if (actionsDiv) {
        const btn = document.createElement('button');
        btn.className = 'ehCommentBtn';
        btn.dataset.comment = verifId;
        btn.innerHTML = `<span class="ic">💬</span><span class="count">${cnt}</span>`;
        btn.onclick = (e) => {
          e.stopPropagation();
          window.ehToggleComments(verifId);
        };
        actionsDiv.appendChild(btn);
      }

      // 댓글 영역 추가 (카드 끝)
      if (!card.querySelector(`#ehComments-${verifId}`)) {
        const area = document.createElement('div');
        area.className = 'ehSCComments';
        area.id = `ehComments-${verifId}`;
        area.innerHTML = `
          <div class="ehCommentList"></div>
          <div class="ehCommentForm">
            <input type="text" placeholder="댓글 달기..." maxlength="500"
                   onkeydown="if(event.key==='Enter'){event.preventDefault();ehSubmitComment('${verifId}')}"/>
            <button onclick="ehSubmitComment('${verifId}')">등록</button>
          </div>
        `;
        card.appendChild(area);
      }
    });
  }

  /* ─── MutationObserver로 카드 변화 감지 ─── */
  let observer = null;
  function setupObserver() {
    const feedList = document.getElementById('feedList');
    if (!feedList || observer) return;
    observer = new MutationObserver(() => {
      injectComments();
    });
    observer.observe(feedList, { childList: true, subtree: true });
  }

  setTimeout(() => { setupObserver(); injectComments(); }, 800);
  [1500, 3000, 5000, 8000].forEach(t => setTimeout(() => {
    setupObserver();
    injectComments();
  }, t));

  console.log('[eco_story_comments_patch] ✅ 댓글 기능 활성화');
})();
