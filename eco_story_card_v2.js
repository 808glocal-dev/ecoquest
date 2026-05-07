/* ================================================================
   EcoQuest – eco_story_card_v2.js
   에코 스토리 카드를 인스타 피드 스타일로 변경
   - 헤더(아바타+이름) → 사진(풀폭) → 좋아요 → 제목+본문 → 더보기
   - 본문 4줄까지 표시 → "... 더보기" 클릭 시 인라인 확장
   - PC 가운데 정렬 (max-width 500px, 인스타와 동일)
   - 사진 클릭 시 상세 모달 열림
   ================================================================ */
(function () {
  'use strict';

  /* ─── CSS 덮어쓰기 ─── */
  const css = `
    /* 카드 컨테이너 */
    .ehStoryCard {
      background: #fff !important;
      border-radius: 14px !important;
      margin-bottom: 16px !important;
      border: 1px solid var(--bdr) !important;
      overflow: hidden !important;
      padding: 0 !important;
      cursor: default !important;
      transition: border-color .15s !important;
    }
    .ehStoryCard:hover { border-color: var(--g1) !important; box-shadow: none !important; }

    /* 헤더 */
    .ehStoryCard .ehSCHead {
      padding: 12px 14px !important;
      margin-bottom: 0 !important;
    }

    /* 사진 (풀폭, 큼직하게) */
    .ehStoryCard .ehSCImg {
      width: 100% !important;
      max-height: 600px !important;
      object-fit: cover !important;
      margin: 0 !important;
      border-radius: 0 !important;
      display: block !important;
      cursor: pointer;
      background: #fafafa;
    }

    /* 액션 (좋아요) - 사진 바로 아래 */
    .ehSCActions {
      padding: 8px 12px 4px !important;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ehSCActions .ehLikeBtn {
      padding: 8px 10px !important;
      font-size: 14px !important;
    }
    .ehSCActions .ehLikeBtn .ic { font-size: 18px !important; }

    /* 본문 영역 */
    .ehSCContent {
      padding: 0 14px 14px !important;
    }
    .ehStoryCard .ehSCTitle {
      font-size: 16px !important;
      font-weight: 800 !important;
      margin-bottom: 6px !important;
      line-height: 1.4 !important;
      letter-spacing: -0.3px;
    }
    .ehStoryCard .ehSCBody {
      font-size: 14px !important;
      color: #3a3a3a !important;
      line-height: 1.7 !important;
      margin-bottom: 0 !important;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .ehStoryCard .ehSCBody.clip {
      display: -webkit-box !important;
      -webkit-line-clamp: 4 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }

    /* 더보기 버튼 */
    .ehSCExpandBtn {
      background: none;
      border: none;
      color: var(--sub);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 0 0;
      font-family: inherit;
      display: block;
    }
    .ehSCExpandBtn:hover { color: var(--g1); }

    /* 기존 푸터(좋아요+더보기 한 줄) 숨김 */
    .ehStoryCard .ehSCFoot { display: none !important; }

    /* PC 가운데 정렬 (인스타식) */
    @media (min-width: 768px) {
      #feedList {
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
      }
    }
  `;
  if (!document.getElementById('eco_story_card_v2_style')) {
    const s = document.createElement('style');
    s.id = 'eco_story_card_v2_style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ─── 헬퍼 ─── */
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function splitTitleBody(text) {
    if (!text) return { title:'', body:'' };
    const lines = text.split('\n');
    if (lines[0].startsWith('# ')) {
      return { title: lines[0].slice(2).trim(), body: lines.slice(1).join('\n').trim() };
    }
    return { title:'', body:text };
  }

  /* ─── "더보기" 인라인 확장 ─── */
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
    const showExpand = body.length > 200;  // 200자 넘으면 더보기

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

  /* ─── 기존 카드를 인스타식으로 교체 ─── */
  function rerenderToInsta() {
    const feedList = document.getElementById('feedList');
    if (!feedList) return;

    const existingCards = feedList.querySelectorAll('.ehStoryCard');
    if (!existingCards.length) return;

    const all = window._allFeedItems || [];
    const items = window._feedItems || {};

    // 기존 카드들의 id를 순서대로 추출
    const ids = [];
    existingCards.forEach(card => {
      // onclick 속성에서 id 추출
      const onclick = card.getAttribute('onclick') || '';
      const m = onclick.match(/openFeedDetail\('([^']+)'\)/);
      if (m) ids.push(m[1]);
      else {
        // fallback: data-like 속성에서 id 추출
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

    // 첫 카드 위치에 새 카드들 삽입 + 기존 카드 제거
    const firstCard = existingCards[0];
    const parent = firstCard.parentNode;
    [...tempDiv.children].forEach(c => parent.insertBefore(c, firstCard));
    existingCards.forEach(c => c.remove());
  }

  /* ─── _ehRenderFeed 후킹 ─── */
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

  setTimeout(setupHooks, 500);
  [1500, 3000, 5000].forEach(t => setTimeout(() => {
    setupHooks();
    rerenderToInsta();
  }, t));

  // 카테고리 chip 클릭도 감지
  document.addEventListener('click', e => {
    if (e.target.closest('.ehSChip')) {
      setTimeout(rerenderToInsta, 100);
    }
  }, true);

  console.log('[eco_story_card_v2] ✅ 인스타식 카드 (사진→좋아요→글) 적용');
})();
