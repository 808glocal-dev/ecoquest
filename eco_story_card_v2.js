/* ================================================================
   EcoQuest – eco_story_card_v2.js  v2-FORCE-5 (중복 그리드 제거판)
   ----------------------------------------------------------------
   - 위에 뜨는 3x3 사진 그리드 자동 감지 + 숨김 (중복 제거)
   - 모든 카테고리(전체/책/영화/글/사진) 1열 인스타식
   - 글 없는 사진 인증도 좋아요/댓글 동일
   - 모바일/PC 100% 동일
   ================================================================ */
(function () {
  'use strict';

  console.log('[eco_story_card v2-FORCE-5] 🚀 시작 - 중복 그리드 제거 + 1열 인스타피드');

  /* ─── PWA SW 자동 갱신 ─── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.update().catch(() => {}));
    }).catch(() => {});
  }

  /* ─── CSS ─── */
  const css = `
    /* feedList 그리드 강제 차단 */
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

    /* PC 가운데 정렬 */
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

  /* ─── 인스타식 카드 ─── */
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

  /* ─── 카테고리 필터 ─── */
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

  /* ─── 통합 렌더링 ─── */
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

      // 렌더링 후 중복 그리드 자동 감지/숨김
      setTimeout(hideRedundantGrids, 50);
    } finally {
      _isRerendering = false;
    }
  }
  window._rerenderToInsta = rerenderToInsta;

  /* ─── 중복 사진 그리드 자동 감지 + 숨김 ─── */
  function hideRedundantGrids() {
    const feedList = document.getElementById('feedList');
    if (!feedList) return;

    // 1. feedList 부모의 형제 중 그리드+이미지3개+이상 있는 영역 숨김
    const parent = feedList.parentElement;
    if (parent) {
      [...parent.children].forEach(el => {
        if (el === feedList) return;
        if (el.dataset.v5Hidden === '1') return;
        const cs = getComputedStyle(el);
        const isGrid = cs.display === 'grid' || cs.display === 'inline-grid';
        if (isGrid) {
          const imgs = el.querySelectorAll('img');
          if (imgs.length >= 3) {
            el.style.display = 'none';
            el.dataset.v5Hidden = '1';
            console.log('[v5] 중복 사진 그리드 숨김 (외부):', el.className || el.id || el.tagName);
          }
        }
      });
    }

    // 2. feedList 안의 그리드 자식 (보존 영역 제외) 숨김
    [...feedList.children].forEach(el => {
      if (el.dataset.v5Hidden === '1') return;
      // 보존: chip, 헤더, 우리 인스타 카드
      if (el.classList.contains('ehSChips')) return;
      if (el.classList.contains('ehSecHead')) return;
      if (el.classList.contains('ehStoryCard')) return;
      if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') return;

      const cs = getComputedStyle(el);
      const isGrid = cs.display === 'grid' || cs.display === 'inline-grid';
      if (isGrid) {
        const imgs = el.querySelectorAll('img');
        if (imgs.length >= 3) {
          el.style.display = 'none';
          el.dataset.v5Hidden = '1';
          console.log('[v5] 중복 사진 그리드 숨김 (내부):', el.className || el.id);
        }
      }
    });

    // 3. 의심되는 셀렉터들 직접 숨김
    const suspects = [
      '.ehPhotoGrid', '.photoGrid', '#photoGrid',
      '.feedPhotos', '.miniPhotos', '.photoPreview',
      '.ehMiniGallery', '.ehFeedPreview',
      '[class*="photo-grid"]', '[class*="photoGrid"]', '[class*="mini-gallery"]'
    ];
    suspects.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          if (el.dataset.v5Hidden === '1') return;
          el.style.display = 'none';
          el.dataset.v5Hidden = '1';
          console.log('[v5] 의심 셀렉터 숨김:', sel);
        });
      } catch (e) {}
    });
  }

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

  setTimeout(() => { setupHooks(); rerenderToInsta(); hideRedundantGrids(); }, 500);
  [1500, 3000, 5000, 8000].forEach(t => setTimeout(() => {
    setupHooks();
    rerenderToInsta();
    hideRedundantGrids();
  }, t));

  document.addEventListener('click', e => {
    if (e.target.closest('.ehSChip')) {
      setTimeout(rerenderToInsta, 100);
      setTimeout(rerenderToInsta, 400);
      setTimeout(hideRedundantGrids, 500);
    }
  }, true);

  console.log('[eco_story_card v2-FORCE-5] ✅ 중복 그리드 제거 + 1열 인스타피드 적용');
})();
