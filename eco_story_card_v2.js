/* ================================================================
   EcoQuest – eco_story_card_v2.js  v2-FORCE-6 (전체 비우기판)
   ----------------------------------------------------------------
   ★ 핵심 변경: #feedList를 통째로 비우고 chip + 헤더만 보존
   - 위 3x3 그리드, "더보기" 버튼, 다른 patch가 그린 카드 전부 제거
   - 모든 카테고리 1열 인스타식으로 통일
   - 글 없는 사진 인증도 좋아요/댓글 동일
   ================================================================ */
(function () {
  'use strict';

  console.log('[eco_story_card v2-FORCE-6] 🚀 시작 - feedList 완전 비우기 모드');

  /* ─── PWA SW 자동 갱신 ─── */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.update().catch(() => {}));
    }).catch(() => {});
  }

  /* ─── CSS ─── */
  const css = `
    #feedList {
      display: block !important;
      grid-template-columns: none !important;
      column-count: 1 !important;
      gap: 0 !important;
    }
    #feedList > * {
      width: auto !important;
      max-width: 100% !important;
      grid-column: auto !important;
    }

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
    .ehSCContent { padding: 0 14px 14px !important; }
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

  /* ─── ★ 통합 렌더링: feedList 통째로 비우고 다시 그리기 ─── */
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

      // ★ 보존할 요소만 골라내기 (chip, 섹션 헤더)
      const preserve = [...feedList.children].filter(el =>
        el.classList.contains('ehSChips') ||
        el.classList.contains('ehSecHead') ||
        el.classList.contains('ehSecHeader') ||
        el.classList.contains('ehSectionHead') ||
        ['H1', 'H2', 'H3'].includes(el.tagName)
      );

      // ★ feedList 통째로 비움 (위 그리드, 더보기, 다른 카드 모두 제거)
      feedList.innerHTML = '';

      // 보존 요소 다시 추가
      preserve.forEach(el => feedList.appendChild(el));

      // 새 인스타 카드 추가
      if (filtered.length) {
        const newHTML = filtered.slice(0, 30).map(renderInstaCard).join('');
        feedList.insertAdjacentHTML('beforeend', newHTML);
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

  document.addEventListener('click', e => {
    if (e.target.closest('.ehSChip')) {
      setTimeout(rerenderToInsta, 100);
      setTimeout(rerenderToInsta, 400);
    }
  }, true);

  console.log('[eco_story_card v2-FORCE-6] ✅ feedList 완전 비우기 + 1열 인스타피드 적용');
})();
