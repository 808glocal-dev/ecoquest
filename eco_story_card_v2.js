/* ================================================================
   EcoQuest – eco_story_card_v2.js  v2-FORCE-4 (모바일 그리드 차단판)
   ----------------------------------------------------------------
   - 모든 카테고리(전체/책/영화/글/사진 전부)를 1열 인스타식으로 강제
   - #feedList의 그리드 CSS 강제 무효화 (display:block !important)
   - 글 없는 사진 인증도 좋아요/댓글 동일 동작
   - PWA Service Worker 자동 갱신 시도
   ================================================================ */
(function () {
  'use strict';

  console.log('[eco_story_card v2-FORCE-4] 🚀 시작 - 그리드 차단 + 1열 강제');

  /* ─── PWA SW 자동 갱신 (옛 코드 캐시 깨기) ─── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.update().catch(() => {}));
    }).catch(() => {});
  }

  /* ─── CSS - 그리드 강제 차단 ─── */
  const css = `
    /* feedList 그리드 강제 무효화 (가장 중요!) */
    #feedList,
    .feedList,
    .feed-list {
      display: block !important;
      grid-template-columns: none !important;
      grid-template-rows: none !important;
      gap: 0 !important;
      column-count: 1 !important;
    }
    #feedList > *,
    .feedList > *,
    .feed-list > * {
      width: auto !important;
      max-width: 100% !important;
      grid-column: auto !important;
    }

    /* 카드 컨테이너 */
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
    .ehStoryCard .ehSCHead {
      padding: 12px 14px !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }
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
    .ehStoryCard .ehSCFoot { display: none !important; }

    /* PC만 가운데 정렬 */
    @media (min-width: 768px) {
      #feedList {
        max-width: 500px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
    }
  `;
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

  /* ─── 인스타식 카드 렌더링 (글 없어도 OK) ─── */
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

  /* ─── 카테고리 필터 (사진 카테고리도 1열로) ─── */
  function filterByCategory(items, cat) {
    if (cat === 'all' || !cat) return items.slice();
    if (cat === 'photo') return items.filter(v => v.thumb);
    return items.filter(v => {
      if (v.category) return v.category === cat;
      if (cat === 'book')    return v.missionId === 'm43';
      if (cat === 'movie')   return ['m41', 'm42'].includes(v.missionId);
      if (cat === 'article') return ['m44', 'm45'].includes(v.missionId);
      if (cat === 'review')  return ['m17', 'm18', 'm23'].includes(v.missionId);
      return false;
    });
  }

  /* ─── 통합 렌더링 (모든 카테고리 1열 강제) ─── */
  let _isRerendering = false;
  function rerenderToInsta() {
    if (_isRerendering) return;
    _isRerendering = true;
    try {
      const feedList = document.getElementById('feedList');
      if (!feedList) return;

      const all = window._allFeedItems || [];
      if (!all.length) return;

      const cat = window._ehStoryCurCat || 'all';

      // 모든 카테고리(사진 포함)를 1열 인스타식으로 강제
      const filtered = filterByCategory(all, cat);

      filtered.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });

      if (!filtered.length) {
        feedList.querySelectorAll('.ehStoryCard').forEach(c => c.remove());
        return;
      }

      const newHTML = filtered.slice(0, 30).map(renderInstaCard).join('');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newHTML;
      const newCards = [...tempDiv.children];

      // 옛 카드(.ehStoryCard 외에도 모든 카드 클래스) 제거
      const oldCards = feedList.querySelectorAll(
        '.ehStoryCard, .ehPhotoCard, .ehSCard, .ehFeedCard, .feed-card, .ehFeedItem, [data-feed-item]'
      );

      if (oldCards.length) {
        const firstCard = oldCards[0];
        const parent = firstCard.parentNode;
        newCards.forEach(c => parent.insertBefore(c, firstCard));
        oldCards.forEach(c => c.remove());
      } else {
        const chips = feedList.querySelector('.ehSChips, .ehSecHead');
        if (chips) {
          newCards.reverse().forEach(c => chips.insertAdjacentElement('afterend', c));
        } else {
          newCards.forEach(c => feedList.appendChild(c));
        }
      }
    } finally {
      _isRerendering = false;
    }
  }
  window._rerenderToInsta = rerenderToInsta;

  /* ─── 후킹 ─── */
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

  // chip 클릭 (PC + 모바일 터치)
  document.addEventListener('click', e => {
    if (e.target.closest('.ehSChip')) {
      setTimeout(rerenderToInsta, 100);
      setTimeout(rerenderToInsta, 400);
    }
  }, true);

  console.log('[eco_story_card v2-FORCE-4] ✅ 그리드 차단 + 1열 인스타피드 적용');
})();
