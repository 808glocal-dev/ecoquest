/* ================================================================
   EcoQuest – eco_story_card_v2.js  v2-FORCE-2 (모바일/PC 통일판)
   ----------------------------------------------------------------
   - 모바일과 PC 모두 100% 동일한 인스타식 1열 카드
   - 헤더 → 사진 → 좋아요 → 글(+더보기) 순서
   - 강제 !important로 옛 CSS 완전 덮어쓰기
   - PC에서만 가운데 정렬 (max-width 500px)
   - 다중 후킹 + 중복 방지 가드
   ================================================================ */
(function () {
  'use strict';

  console.log('[eco_story_card v2-FORCE-2] 🚀 시작 - 모바일/PC 동일 인스타식');

  /* ─── CSS (모바일/PC 동일, !important 강제) ─── */
  const css = `
    /* 카드 컨테이너 - 모든 화면에서 동일 */
    .ehStoryCard {
      background: #fff !important;
      border-radius: 14px !important;
      margin-bottom: 16px !important;
      border: 1px solid #e8e8e8 !important;
      overflow: hidden !important;
      padding: 0 !important;
      cursor: default !important;
      width: auto !important;
      max-width: 100% !important;
      display: block !important;
    }
    .ehStoryCard:hover {
      border-color: var(--g1) !important;
      box-shadow: none !important;
      transform: none !important;
    }

    /* 헤더 */
    .ehStoryCard .ehSCHead {
      padding: 12px 14px !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }

    /* 사진 - 모바일/PC 동일 풀폭 */
    .ehStoryCard .ehSCImg {
      width: 100% !important;
      height: auto !important;
      max-height: 500px !important;
      object-fit: cover !important;
      margin: 0 !important;
      border-radius: 0 !important;
      display: block !important;
      cursor: pointer !important;
      background: #fafafa !important;
    }

    /* 액션 (좋아요) - 사진 바로 아래 */
    .ehSCActions {
      padding: 8px 12px 4px !important;
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    .ehSCActions .ehLikeBtn {
      padding: 8px 10px !important;
      font-size: 14px !important;
    }
    .ehSCActions .ehLikeBtn .ic { font-size: 18px !important; }

    /* 콘텐츠 (제목+본문) - 좋아요 아래 */
    .ehSCContent {
      padding: 0 14px 14px !important;
    }
    .ehStoryCard .ehSCTitle {
      font-size: 16px !important;
      font-weight: 800 !important;
      margin: 0 0 6px 0 !important;
      line-height: 1.4 !important;
      letter-spacing: -0.3px !important;
      color: var(--txt) !important;
    }
    .ehStoryCard .ehSCBody {
      font-size: 14px !important;
      color: #3a3a3a !important;
      line-height: 1.7 !important;
      margin: 0 !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
    }
    .ehStoryCard .ehSCBody.clip {
      display: -webkit-box !important;
      -webkit-line-clamp: 4 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }
    .ehSCExpandBtn {
      background: none !important;
      border: none !important;
      color: var(--sub) !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      padding: 6px 0 0 !important;
      font-family: inherit !important;
      display: block !important;
    }
    .ehSCExpandBtn:hover { color: var(--g1) !important; }

    /* 옛 푸터 강제 숨김 */
    .ehStoryCard .ehSCFoot { display: none !important; }

    /* PC만 가운데 정렬 (모바일은 풀폭) */
    @media (min-width: 768px) {
      #feedList {
        max-width: 500px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    }
  `;

  // 옛 스타일 제거 후 새로 적용 (캐시 갱신)
  const oldStyle = document.getElementById('eco_story_card_v2_style');
  if (oldStyle) oldStyle.remove();
  const styleEl = document.createElement('style');
  styleEl.id = 'eco_story_card_v2_style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ─── 헬퍼 ─── */
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function splitTitleBody(text) {
    if (!text) return { title: '', body: '' };
    const lines = text.split('\n');
    if (lines[0].startsWith('# ')) {
      return { title: lines[0].slice(2).trim(), body: lines.slice(1).join('\n').trim() };
    }
    return { title: '', body: text };
  }

  /* ─── 더보기 ─── */
  window.ehExpandCard = function (id) {
    const body = document.querySelector(`[data-body="${id}"]`);
    const btn  = document.querySelector(`[data-expand="${id}"]`);
    if (body) body.classList.remove('clip');
    if (btn)  btn.style.display = 'none';
  };

  /* ─── 인스타식 카드 렌더링 ─── */
  function renderInstaCard(v) {
    const { title, body } = splitTitleBody(v.comment || '');
    const time = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const avatar = v.userPhoto ? `<img src="${escapeHtml(v.userPhoto)}"/>` : '👤';
    const liked = (v.likes || []).includes(window.ME?.uid);
    const likeCount = (v.likes || []).length;
    const showExpand = body.length > 200;

    return `
      <div class="ehStoryCard">
        <div class="ehSCHead">
          <div class="ehSCAvatar">${avatar}</div>
          <div class="ehSCMeta">
            <div class="ehSCName">${escapeHtml(v.userName || '익명')}</div>
            <div class="ehSCMission">${v.missionEmoji || ''} ${escapeHtml(v.missionName || '')} · ${time}</div>
          </div>
        </div>
        ${v.thumb ? `<img class="ehSCImg" src="${escapeHtml(v.thumb)}" alt="" onclick="openFeedDetail('${v.id}')"/>` : ''}
        <div class="ehSCActions">
          <button class="ehLikeBtn ${liked ? 'on' : ''}" data-like="${v.id}"
                  onclick="event.stopPropagation();toggleLike('${v.id}')">
            <span class="ic">${liked ? '❤️' : '🤍'}</span>
            <span class="count">${likeCount}</span>
          </button>
        </div>
        ${(title || body) ? `
          <div class="ehSCContent">
            ${title ? `<div class="ehSCTitle">${escapeHtml(title)}</div>` : ''}
            ${body ? `
              <div class="ehSCBody ${showExpand ? 'clip' : ''}" data-body="${v.id}">${escapeHtml(body)}</div>
              ${showExpand ? `<button class="ehSCExpandBtn" data-expand="${v.id}" onclick="ehExpandCard('${v.id}')">... 더보기</button>` : ''}
            ` : ''}
          </div>
        ` : ''}
      </div>`;
  }

  /* ─── rerenderToInsta (중복 방지 가드) ─── */
  let _isRerendering = false;
  function rerenderToInsta() {
    if (_isRerendering) return;
    _isRerendering = true;
    try {
      const feedList = document.getElementById('feedList');
      if (!feedList) return;

      const existingCards = feedList.querySelectorAll('.ehStoryCard');
      if (!existingCards.length) return;

      const items = window._feedItems || {};
      const all = window._allFeedItems || [];

      const ids = [];
      existingCards.forEach(card => {
        const onclick = card.getAttribute('onclick') || '';
        const m = onclick.match(/openFeedDetail\('([^']+)'\)/);
        if (m) ids.push(m[1]);
        else {
          const likeBtn = card.querySelector('[data-like]');
          if (likeBtn) ids.push(likeBtn.dataset.like);
        }
      });

      const stories = ids
        .map(id => items[id] || all.find(v => v.id === id))
        .filter(Boolean);

      if (!stories.length) return;

      const newHTML = stories.map(renderInstaCard).join('');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newHTML;

      const firstCard = existingCards[0];
      const parent = firstCard.parentNode;
      [...tempDiv.children].forEach(c => parent.insertBefore(c, firstCard));
      existingCards.forEach(c => c.remove());
    } finally {
      _isRerendering = false;
    }
  }
  window._rerenderToInsta = rerenderToInsta;

  /* ─── 후킹 (다중 시점) ─── */
  function setupHooks() {
    const _origRender = window._ehRenderFeed;
    if (typeof _origRender === 'function' && !window._ehInstaCardHooked) {
      window._ehRenderFeed = function (w) {
        const r = _origRender.call(this, w);
        setTimeout(rerenderToInsta, 30);
        return r;
      };
      window.renderFeedGrid = window._ehRenderFeed;
      window._ehInstaCardHooked = true;
    }

    const _origLoadFeed = window.loadFeed;
    if (typeof _origLoadFeed === 'function' && !window._ehInstaLoadHooked) {
      window.loadFeed = async function () {
        const r = await _origLoadFeed.call(this);
        setTimeout(rerenderToInsta, 150);
        return r;
      };
      window._ehInstaLoadHooked = true;
    }
  }

  setTimeout(() => { setupHooks(); rerenderToInsta(); }, 500);
  [1500, 3000, 5000, 8000].forEach(t => setTimeout(() => {
    setupHooks();
    rerenderToInsta();
  }, t));

  // 카테고리 chip 클릭 후 (모바일 터치 포함)
  document.addEventListener('click', e => {
    if (e.target.closest('.ehSChip')) {
      setTimeout(rerenderToInsta, 100);
      setTimeout(rerenderToInsta, 400);
    }
  }, true);

  console.log('[eco_story_card v2-FORCE-2] ✅ 인스타식 카드 적용 완료');
})();
