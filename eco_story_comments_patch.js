/* ================================================================
   EcoQuest – eco_story_comments_patch.js v2 (SAFE)
   - 무한 루프 방지: MutationObserver 제거
   - 카운트 비교 후 변경 (불필요한 DOM mutation 방지)
   - _ehRenderFeed 후킹 + 가벼운 polling만 사용
   - v2 미적용 상태에서도 동작 (.ehSCActions 없으면 좋아요 옆에 붙임)
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
    .ehCommentTime { font-size: 10px; color: var(--sub); }
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

  /* ─── 댓글 카운트 캐시 (불필요한 DOM 변경 방지) ─── */
  const _lastCounts = {};

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
      const item = window._feedItems?.[verifId];
      const allItem = (window._allFeedItems || []).find(v => v.id === verifId);
      const newComments = [...(item?.comments || []), newComment];

      await window.FB.updateDoc(
        window.FB.doc(window.FB.db, 'verifications', verifId),
        { comments: newComments }
      );

      if (item) item.comments = newComments;
      if (allItem) allItem.comments = newComments;
      _lastCounts[verifId] = newComments.length;

      input.value = '';
      ehRenderComments(verifId);

      const cntEl = document.querySelector(`[data-comment="${verifId}"] .count`);
      if (cntEl) cntEl.textContent = newComments.length;
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
      _lastCounts[verifId] = newComments.length;
      ehRenderComments(verifId);

      const cntEl = document.querySelector(`[data-comment="${verifId}"] .count`);
      if (cntEl) cntEl.textContent = newComments.length;
    } catch (e) {
      window.toast?.('댓글 삭제 실패: ' + (e.message || ''));
    }
  };

  /* ─── 카드에 댓글 버튼/영역 inject (안전 버전) ─── */
  function injectComments() {
    const cards = document.querySelectorAll('.ehStoryCard');
    if (!cards.length) return;

    cards.forEach(card => {
      const likeBtn = card.querySelector('[data-like]');
      if (!likeBtn) return;
      const verifId = likeBtn.dataset.like;

      const item = window._feedItems?.[verifId];
      const cnt = item?.comments?.length || 0;

      const existingBtn = card.querySelector(`[data-comment="${verifId}"]`);
      if (existingBtn) {
        // 카운트가 실제로 변경된 경우에만 DOM 업데이트 (무한 루프 방지)
        if (_lastCounts[verifId] !== cnt) {
          const cntEl = existingBtn.querySelector('.count');
          if (cntEl) cntEl.textContent = cnt;
          _lastCounts[verifId] = cnt;
        }
        return;
      }

      // 새 카드: 댓글 버튼 추가
      const actionsDiv = card.querySelector('.ehSCActions');
      if (actionsDiv) {
        // v2 인스타식 카드 (.ehSCActions 존재)
        const btn = document.createElement('button');
        btn.className = 'ehCommentBtn';
        btn.dataset.comment = verifId;
        btn.innerHTML = `<span class="ic">💬</span><span class="count">${cnt}</span>`;
        btn.onclick = (e) => {
          e.stopPropagation();
          window.ehToggleComments(verifId);
        };
        actionsDiv.appendChild(btn);
      } else {
        // v2 미적용 (옛 카드): 좋아요 버튼 옆에 직접 붙이기
        const likeBtnParent = likeBtn.parentElement;
        if (likeBtnParent) {
          const btn = document.createElement('button');
          btn.className = 'ehCommentBtn';
          btn.dataset.comment = verifId;
          btn.style.cssText = 'margin-left:8px';
          btn.innerHTML = `<span class="ic">💬</span><span class="count">${cnt}</span>`;
          btn.onclick = (e) => {
            e.stopPropagation();
            window.ehToggleComments(verifId);
          };
          likeBtn.insertAdjacentElement('afterend', btn);
        }
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

      _lastCounts[verifId] = cnt;
    });
  }

  /* ─── 후킹 (MutationObserver 사용 안 함) ─── */
  function setupHooks() {
    const _origRender = window._ehRenderFeed;
    if (typeof _origRender === 'function' && !window._ehCmtRenderHooked) {
      window._ehRenderFeed = function (w) {
        const r = _origRender.call(this, w);
        setTimeout(injectComments, 100);
        return r;
      };
      window._ehCmtRenderHooked = true;
    }

    const _origLoad = window.loadFeed;
    if (typeof _origLoad === 'function' && !window._ehCmtLoadHooked) {
      window.loadFeed = async function () {
        const r = await _origLoad.call(this);
        setTimeout(injectComments, 250);
        return r;
      };
      window._ehCmtLoadHooked = true;
    }
  }

  setTimeout(() => { setupHooks(); injectComments(); }, 800);
  [1500, 3000, 6000].forEach(t => setTimeout(() => {
    setupHooks();
    injectComments();
  }, t));

  document.addEventListener('click', e => {
    if (e.target.closest('.ehSChip')) {
      setTimeout(injectComments, 300);
    }
  }, true);

  console.log('[eco_story_comments_patch v2-SAFE] ✅ 안전 모드 댓글 기능 활성화');
})();
