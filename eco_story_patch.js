/* ================================================================
   EcoQuest – eco_story_patch.js  v3
   "에코 스토리" 통합 + 블로그 형식 + 좋아요
   1. 인증 모달 = 제목 + 본문(textarea) (모든 챌린지 통일)
   2. 본문 30자 이상 → storyMode + 카테고리 자동 매핑 + 30P 보너스
   3. 홈 피드 = 카테고리 chip + 블로그 카드 + 사진 그리드
   4. ✏️ 글쓰기 버튼 (챌린지 인증 안 거치고 직접 글)
   5. ❤️ 좋아요 (toggle, 카운트 표시)
   6. 상세 보기 = 전체 글 (제목·본문·이미지·좋아요)
   ================================================================ */
(function () {
  'use strict';

  /* ─── CSS ─── */
  const css = `
    /* 카테고리 chip */
    #ehStoryChips {
      display:flex; gap:6px; padding:0 0 12px;
      overflow-x:auto; -webkit-overflow-scrolling:touch;
    }
    #ehStoryChips::-webkit-scrollbar { display:none; }
    .ehSChip {
      flex-shrink:0; background:#fff; border:1.5px solid var(--bdr);
      color:var(--sub); padding:6px 12px; border-radius:18px;
      font-size:12px; font-weight:700; cursor:pointer; font-family:inherit;
      white-space:nowrap; transition:all .15s;
    }
    .ehSChip:hover { border-color:var(--g1); color:var(--g2); }
    .ehSChip.on { background:var(--g1); color:#fff; border-color:var(--g1); }

    /* 블로그 카드 */
    .ehStoryCard {
      background:#fff; border-radius:14px; padding:16px;
      margin-bottom:10px; border:1px solid var(--bdr);
      cursor:pointer; transition:border-color .15s, box-shadow .15s;
    }
    .ehStoryCard:hover { border-color:var(--g1); box-shadow:0 4px 14px rgba(46,204,113,.1); }
    .ehSCHead { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
    .ehSCAvatar {
      width:36px; height:36px; border-radius:50%; overflow:hidden;
      background:linear-gradient(135deg,var(--g1),var(--g2));
      display:flex; align-items:center; justify-content:center;
      font-size:14px; flex-shrink:0; color:#fff;
    }
    .ehSCAvatar img { width:100%; height:100%; object-fit:cover; }
    .ehSCMeta { flex:1; min-width:0; }
    .ehSCName { font-size:13px; font-weight:700; color:var(--txt); }
    .ehSCMission { font-size:11px; color:var(--sub); margin-top:1px; }
    .ehSCTitle {
      font-size:17px; font-weight:900; color:var(--txt);
      margin-bottom:8px; line-height:1.4; letter-spacing:-0.3px;
    }
    .ehSCBody {
      font-size:14px; color:#3a3a3a; line-height:1.75;
      margin-bottom:12px; white-space:pre-wrap; word-break:break-word;
    }
    .ehSCBody.clip {
      display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical;
      overflow:hidden;
    }
    .ehSCImg {
      width:100%; border-radius:10px; max-height:280px;
      object-fit:cover; margin-bottom:10px;
    }
    .ehSCFoot {
      display:flex; justify-content:space-between; align-items:center;
      padding-top:10px; border-top:1px solid #f0f0f0;
    }

    /* 좋아요 */
    .ehLikeBtn {
      background:none; border:none;
      display:inline-flex; align-items:center; gap:5px;
      font-size:13px; font-weight:700; color:var(--sub);
      padding:6px 12px; border-radius:18px;
      cursor:pointer; font-family:inherit;
      transition:background .15s, color .15s;
    }
    .ehLikeBtn:hover { background:#fff0f0; }
    .ehLikeBtn.on { color:var(--red); }
    .ehLikeBtn.on .ic { animation:ehHeartPop .3s ease; }
    @keyframes ehHeartPop {
      0%,100% { transform:scale(1); }
      50%     { transform:scale(1.45); }
    }

    .ehSCMore { color:var(--sub); font-size:12px; cursor:pointer; }
    .ehSCMore:hover { color:var(--g1); }
    .ehStorySub {
      font-size:12px; color:var(--sub); font-weight:700;
      margin:8px 0 8px; padding-top:4px;
    }

    /* 인증 모달 textarea */
    #verifComment {
      resize:vertical !important; min-height:60px;
      font-family:inherit !important;
    }
    #verifTitle {
      font-weight:700; margin-bottom:6px; width:100%;
    }
    #ehStoryHint {
      font-size:11px; color:var(--sub); margin-top:4px; line-height:1.5;
    }
    #ehStoryHint b { color:var(--g2); }

    /* 글쓰기 버튼 */
    #ehWriteBtn {
      background:linear-gradient(135deg,var(--g1),var(--g2));
      color:#fff; border:none; border-radius:16px;
      padding:7px 14px; font-size:12px; font-weight:800;
      cursor:pointer; font-family:inherit;
      box-shadow:0 2px 8px rgba(46,204,113,.3);
      margin-left:auto; margin-right:8px;
    }
  `;
  if (!document.getElementById('eco_story_patch_style')) {
    const s = document.createElement('style');
    s.id = 'eco_story_patch_style';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ─── 카테고리 ─── */
  const STORY_CATS = [
    { id:'all',     label:'전체',       icon:'📚' },
    { id:'book',    label:'책',         icon:'📖' },
    { id:'movie',   label:'영화·다큐',   icon:'🎬' },
    { id:'article', label:'글·콘텐츠',   icon:'📰' },
    { id:'review',  label:'제품·매장',   icon:'♻️' },
    { id:'photo',   label:'사진만',      icon:'📷' },
  ];
  function categorize(missionId) {
    if (missionId === 'm43') return 'book';
    if (['m41','m42'].includes(missionId)) return 'movie';
    if (['m44','m45'].includes(missionId)) return 'article';
    if (['m17','m18','m23'].includes(missionId)) return 'review';
    return 'story';
  }
  window._ehStoryCurCat = window._ehStoryCurCat || 'all';

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  // 제목 추출 (첫 줄이 # 으로 시작하면)
  function splitTitleBody(text) {
    if (!text) return { title:'', body:'' };
    const lines = text.split('\n');
    if (lines[0].startsWith('# ')) {
      return { title: lines[0].slice(2).trim(), body: lines.slice(1).join('\n').trim() };
    }
    return { title:'', body:text };
  }
  function combineTitleBody(title, body) {
    return title ? `# ${title}\n\n${body}` : body;
  }

  /* ─── 1. 인증 모달: 제목 + 본문(textarea) 통일 ─── */
  function expandCommentInput() {
    const old = document.getElementById('verifComment');
    if (!old) return;

    // 제목 input 추가 (먼저 verifTitle이 없으면 만들기)
    let titleInp = document.getElementById('verifTitle');
    if (!titleInp) {
      titleInp = document.createElement('input');
      titleInp.id = 'verifTitle';
      titleInp.className = 'inp';
      titleInp.type = 'text';
      titleInp.placeholder = '📝 제목 (선택)';
      titleInp.maxLength = 60;
      titleInp.style.cssText = 'font-size:14px;padding:10px 12px;font-weight:700;width:100%;margin-bottom:6px';
      old.parentNode.insertBefore(titleInp, old);
    }

    // 본문을 textarea로 변환
    if (old.tagName !== 'TEXTAREA') {
      const ta = document.createElement('textarea');
      ta.id = 'verifComment';
      ta.className = old.className || 'inp';
      ta.placeholder = '본문을 자유롭게 작성해주세요...\n30자 이상 쓰면 에코 스토리에 게시되고 +30P!';
      ta.maxLength = 1000;
      ta.rows = 4;
      ta.style.cssText = 'font-size:13px;padding:10px 12px;resize:vertical;font-family:inherit;width:100%';
      old.parentNode.replaceChild(ta, old);

      // 라벨 변경
      const label = ta.previousElementSibling?.previousElementSibling;
      if (label && /한마디/.test(label.textContent || '')) {
        label.innerHTML = '📝 후기 또는 한마디 (선택)';
      }

      // 도움말
      if (!document.getElementById('ehStoryHint')) {
        const hint = document.createElement('div');
        hint.id = 'ehStoryHint';
        hint.innerHTML = '💡 본문 <b>30자 이상</b> 쓰면 자동으로 <b>📚 에코 스토리</b>에 게시 + <b>30P 보너스</b>';
        ta.parentNode.insertBefore(hint, ta.nextSibling);
      }

      // 글자수 카운터
      const counter = document.createElement('div');
      counter.id = 'ehStoryCounter';
      counter.style.cssText = 'font-size:11px;color:var(--sub);text-align:right;margin-top:2px';
      counter.textContent = '0 / 1000';
      ta.parentNode.insertBefore(counter, ta.nextSibling);
      ta.addEventListener('input', () => {
        const len = ta.value.length;
        counter.textContent = `${len} / 1000`;
        counter.style.color = len >= 30 ? 'var(--g2)' : 'var(--sub)';
        counter.style.fontWeight = len >= 30 ? '700' : '400';
      });
    }
  }

  /* ─── 2. saveVerification 오버라이드 (제목 합치기, 카테고리, 보너스) ─── */
  window.saveVerification = async (uid, m, b64, isPublic, comment) => {
    try {
      const thumb = await window.compressImage(b64, 400);
      const title = (document.getElementById('verifTitle')?.value || '').trim();
      const body = (comment || '').trim();
      const fullText = combineTitleBody(title, body);
      const storyMode = body.length >= 30;
      const category = storyMode ? categorize(m.id) : 'photo';

      await window.FB.addDoc(window.FB.collection(window.FB.db, 'verifications'), {
        uid,
        userName: window.UDATA?.nickname || window.ME?.displayName || '익명',
        userPhoto: window.ME?.photoURL || '',
        missionId: m.id,
        missionName: m.name,
        missionEmoji: m.emoji,
        isPublic,
        thumb,
        comment: fullText,
        storyMode,
        category,
        likes: [],
        createdAt: window.FB.serverTimestamp(),
      });

      // 후기 보너스 +30P
      if (storyMode && uid) {
        try {
          const newP = (window.UDATA?.point || 0) + 30;
          await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', uid), { point: newP });
          if (window.UDATA) window.UDATA.point = newP;
          window.updateUI && window.updateUI();
          setTimeout(() => window.toast?.('📝 후기 작성 보너스 +30P!'), 1500);
        } catch (e) {}
      }
      // 제목 input 초기화
      const titleInp = document.getElementById('verifTitle');
      if (titleInp) titleInp.value = '';
      return true;
    } catch (e) {
      console.log('인증 저장 오류', e);
      return false;
    }
  };

  /* ─── 3. 좋아요 toggle ─── */
  window.toggleLike = async function (verifId) {
    if (!window.ME) { window.toast?.('로그인이 필요해요!'); return; }
    const item = window._feedItems?.[verifId];
    if (!item) return;

    const liked = (item.likes || []).includes(window.ME.uid);
    const newLikes = liked
      ? (item.likes || []).filter(u => u !== window.ME.uid)
      : [...(item.likes || []), window.ME.uid];

    // 즉시 UI 업데이트
    item.likes = newLikes;
    document.querySelectorAll(`[data-like="${verifId}"]`).forEach(btn => {
      btn.classList.toggle('on', !liked);
      const ic = btn.querySelector('.ic');
      const cnt = btn.querySelector('.count');
      if (ic) ic.textContent = !liked ? '❤️' : '🤍';
      if (cnt) cnt.textContent = newLikes.length;
    });

    try {
      await window.FB.updateDoc(
        window.FB.doc(window.FB.db, 'verifications', verifId),
        { likes: newLikes }
      );
    } catch (e) {
      // 실패 시 롤백
      item.likes = liked ? [...newLikes, window.ME.uid] : newLikes.filter(u => u !== window.ME.uid);
      document.querySelectorAll(`[data-like="${verifId}"]`).forEach(btn => {
        btn.classList.toggle('on', liked);
        const ic = btn.querySelector('.ic');
        const cnt = btn.querySelector('.count');
        if (ic) ic.textContent = liked ? '❤️' : '🤍';
        if (cnt) cnt.textContent = item.likes.length;
      });
      window.toast?.('좋아요 실패: ' + (e.message || ''));
    }
  };

  /* ─── 4. 피드 렌더링 ─── */
  function renderCategoryChips() {
    return `<div id="ehStoryChips">
      ${STORY_CATS.map(c => `
        <button class="ehSChip${c.id === window._ehStoryCurCat ? ' on' : ''}" data-cat="${c.id}">
          ${c.icon} ${c.label}
        </button>
      `).join('')}
    </div>`;
  }
  function bindChipClicks(w) {
    w.querySelectorAll('.ehSChip').forEach(b => {
      b.onclick = () => {
        window._ehStoryCurCat = b.dataset.cat;
        ehRenderFeed(w);
      };
    });
  }

  function renderStoryCard(v) {
    const { title, body } = splitTitleBody(v.comment || '');
    const preview = body.length > 240 ? body.slice(0, 240) + '…' : body;
    const time = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const avatar = v.userPhoto ? `<img src="${escapeHtml(v.userPhoto)}"/>` : '👤';
    const liked = (v.likes || []).includes(window.ME?.uid);
    const likeCount = (v.likes || []).length;

    return `
      <div class="ehStoryCard" onclick="window._ehLastDetailId='${v.id}';ehOpenDetail('${v.id}')">
        <div class="ehSCHead">
          <div class="ehSCAvatar">${avatar}</div>
          <div class="ehSCMeta">
            <div class="ehSCName">${escapeHtml(v.userName || '익명')}</div>
            <div class="ehSCMission">${v.missionEmoji || ''} ${escapeHtml(v.missionName || '')} · ${time}</div>
          </div>
        </div>
        ${title ? `<div class="ehSCTitle">${escapeHtml(title)}</div>` : ''}
        <div class="ehSCBody clip">${escapeHtml(preview)}</div>
        ${v.thumb ? `<img class="ehSCImg" src="${escapeHtml(v.thumb)}" alt=""/>` : ''}
        <div class="ehSCFoot">
          <button class="ehLikeBtn ${liked ? 'on' : ''}" data-like="${v.id}"
                  onclick="event.stopPropagation();toggleLike('${v.id}')">
            <span class="ic">${liked ? '❤️' : '🤍'}</span>
            <span class="count">${likeCount}</span>
          </button>
          <span class="ehSCMore">더보기 →</span>
        </div>
      </div>`;
  }

  function renderPhotoCell(v) {
    const liked = (v.likes || []).includes(window.ME?.uid);
    const cnt = (v.likes || []).length;
    return `
      <div onclick="window._ehLastDetailId='${v.id}';ehOpenDetail('${v.id}')" style="position:relative;aspect-ratio:1;background:#f0f0f0;cursor:pointer;border-radius:6px;overflow:hidden">
        ${v.thumb
          ? `<img src="${escapeHtml(v.thumb)}" style="width:100%;height:100%;object-fit:cover"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji || '📷'}</div>`}
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.55));padding:4px 5px">
          <div style="font-size:9px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${v.missionEmoji || ''} ${escapeHtml(v.missionName || '')}
          </div>
        </div>
        <div data-like="${v.id}" onclick="event.stopPropagation();toggleLike('${v.id}')"
             style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);border-radius:11px;padding:2px 7px;font-size:10px;color:#fff;display:flex;align-items:center;gap:3px;cursor:pointer;font-weight:700"
             title="좋아요">
          <span class="ic" style="font-size:11px">${liked?'❤️':'🤍'}</span>
          <span class="count">${cnt}</span>
        </div>
      </div>`;
  }

  function ehRenderFeed(w) {
    if (!w) w = document.getElementById('feedList');
    if (!w) return;

    const all = window._allFeedItems || [];
    const cat = window._ehStoryCurCat || 'all';
    const nicknameMap = window._feedNicknameMap || {};
    window._feedItems = window._feedItems || {};
    all.forEach(v => {
      window._feedItems[v.id] = { ...v, userName: nicknameMap[v.uid] || v.userName || '익명' };
    });

    const isStory = v => v.storyMode || (v.comment && v.comment.length >= 30);
    let stories, photos;
    if (cat === 'all') {
      stories = all.filter(isStory);
      photos  = all.filter(v => !isStory(v));
    } else if (cat === 'photo') {
      stories = [];
      photos  = all.filter(v => !isStory(v));
    } else {
      const matchCat = v => {
        if (v.category) return v.category === cat;
        if (cat === 'book')    return v.missionId === 'm43';
        if (cat === 'movie')   return v.missionId === 'm41' || v.missionId === 'm42';
        if (cat === 'article') return v.missionId === 'm44' || v.missionId === 'm45';
        if (cat === 'review')  return ['m17','m18','m23'].includes(v.missionId);
        return false;
      };
      stories = all.filter(v => isStory(v) && matchCat(v));
      photos  = [];
    }

    let html = renderCategoryChips();

    if (!stories.length && !photos.length) {
      html += cat === 'all' ? `
        <div style="background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:14px;padding:20px 18px;border:1.5px solid var(--g1);margin-top:8px">
          <div style="text-align:center;margin-bottom:14px">
            <div style="font-size:36px;margin-bottom:6px">📚</div>
            <div style="font-size:14px;font-weight:900;color:var(--txt)">첫 작가가 되어주세요!</div>
            <div style="font-size:12px;color:var(--sub);margin-top:4px;line-height:1.6">
              아직 에코 스토리가 비어있어요.<br/>당신의 첫 글이 다른 사람을 움직여요 🌱
            </div>
          </div>
          <div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;color:var(--g2);margin-bottom:6px">💡 이런 글을 기다려요</div>
            <div style="font-size:12px;color:#555;line-height:1.9">
              ✨ 환경 다큐 보고 받은 충격<br/>
              ✨ 텀블러 한 달 사용 후기<br/>
              ✨ 비건 식당 첫 방문기<br/>
              ✨ 제로웨이스트 살림 팁
            </div>
          </div>
          <button onclick="window.openWriteModal&&window.openWriteModal()"
            style="width:100%;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit">
            ✏️ 첫 글 쓰기 →
          </button>
        </div>
      ` : `
        <div style="text-align:center;padding:30px;color:var(--sub);font-size:13px">
          이 카테고리에 글이 없어요!<br/>챌린지 인증할 때 후기를 써보세요 📝
        </div>`;
      w.innerHTML = html;
      bindChipClicks(w);
      return;
    }

    if (stories.length) {
      if (cat === 'all' && photos.length) {
        html += `<div class="ehStorySub">📝 후기 (${stories.length})</div>`;
      }
      html += stories.slice(0, 20).map(renderStoryCard).join('');
    }
    if (photos.length) {
      if (cat === 'all' && stories.length) {
        html += `<div class="ehStorySub">📷 사진 인증 (${photos.length})</div>`;
      }
      html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px">${
        photos.slice(0, 18).map(renderPhotoCell).join('')
      }</div>`;
    }

    w.innerHTML = html;
    bindChipClicks(w);
    console.log('[eco_story] 피드 그림:', { stories: stories.length, photos: photos.length, cat });
  }
  window.renderFeedGrid = ehRenderFeed;
  window._ehRenderFeed = ehRenderFeed;

  /* ─── 5. 섹션 헤더 변경 + 글쓰기 버튼 ─── */
  function renameFeedHeader() {
    const home = document.getElementById('page-home');
    if (!home) return;
    home.querySelectorAll('.sec-t').forEach(el => {
      const t = (el.innerText || '').trim();
      if (t === '📸 인증 피드') el.textContent = '📚 에코 스토리';
    });
  }

  function addWriteButton() {
    const home = document.getElementById('page-home');
    if (!home) return;
    let sectionT = null;
    home.querySelectorAll('.sec-t').forEach(el => {
      const t = (el.innerText || '').trim();
      if (t === '📚 에코 스토리') sectionT = el;
    });
    if (!sectionT) return;
    const sec = sectionT.closest('.sec');
    if (!sec || sec.querySelector('#ehWriteBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'ehWriteBtn';
    btn.textContent = '✏️ 글쓰기';
    btn.onclick = () => window.openWriteModal();
    const secM = sec.querySelector('.sec-m');
    if (secM) sec.insertBefore(btn, secM);
    else sec.appendChild(btn);
  }

  /* ─── 6. 상세 보기 (제목·본문·좋아요) ─── */
  window.ehOpenDetail = function (id) {
    console.log('[eco_story] ehOpenDetail 호출:', id);
    const v = window._feedItems?.[id];
    if (!v) { console.warn('[eco_story] _feedItems에서 못 찾음', id); return; }
    const detail = document.getElementById('feedDetailContent');
    if (!detail) return;
    const { title, body } = splitTitleBody(v.comment || '');
    const time = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const isStory = v.storyMode || (v.comment && v.comment.length >= 30);
    const liked = (v.likes || []).includes(window.ME?.uid);
    const likeCount = (v.likes || []).length;

    detail.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--g1),var(--g2));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;color:#fff">
          ${v.userPhoto ? `<img src="${escapeHtml(v.userPhoto)}" style="width:100%;height:100%;object-fit:cover"/>` : '👤'}
        </div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:var(--txt)">${escapeHtml(v.userName || '익명')}</div>
          <div style="font-size:11px;color:var(--sub)">${time}</div>
        </div>
      </div>

      <div style="background:#f0fbf4;border-radius:10px;padding:8px 12px;margin-bottom:14px">
        <span style="font-size:13px;font-weight:700;color:var(--g2)">✅ ${v.missionEmoji || ''} ${escapeHtml(v.missionName || '')}</span>
      </div>

      ${title ? `<div style="font-size:20px;font-weight:900;color:var(--txt);margin-bottom:14px;line-height:1.3;letter-spacing:-0.4px">${escapeHtml(title)}</div>` : ''}

      ${v.thumb ? `<img src="${escapeHtml(v.thumb)}" style="width:100%;border-radius:12px;max-height:340px;object-fit:cover;margin-bottom:14px"/>` : ''}

      ${body
        ? (isStory
            ? `<div style="font-size:15px;color:var(--txt);line-height:1.85;white-space:pre-wrap;word-break:break-word;padding:4px 2px;margin-bottom:14px">${escapeHtml(body)}</div>`
            : `<div style="background:#f8f8f8;border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt);line-height:1.6;margin-bottom:14px">💬 "${escapeHtml(body)}"</div>`)
        : ''}

      <div style="border-top:1px solid #f0f0f0;padding-top:14px;margin-top:8px;display:flex;justify-content:flex-start;align-items:center;gap:12px">
        <button class="ehLikeBtn ${liked ? 'on' : ''}" data-like="${v.id}"
                onclick="toggleLike('${v.id}')"
                style="background:none;border:1.5px solid var(--bdr);border-radius:22px;padding:8px 16px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;${liked ? 'color:var(--red);border-color:#ffd0d0;background:#fff5f5' : 'color:var(--sub)'}">
          <span class="ic" style="font-size:16px">${liked ? '❤️' : '🤍'}</span>
          <span class="count">${likeCount}</span>
          <span style="font-weight:600">좋아요</span>
        </button>
      </div>
    `;
    window.openOv && window.openOv('ovFeedDetail');
  };

  // 강제 오버라이드 (원본이 함수 선언이어도 덮어쓰기 시도)
  window.openFeedDetail = window.ehOpenDetail;
  try { globalThis.openFeedDetail = window.ehOpenDetail; } catch (e) {}

  /* ─── 안전장치: ovFeedDetail 모달 열림 감지 → 좋아요 버튼 없으면 동적 삽입 ─── */
  window._ehLastDetailId = null;
  function watchDetailModal() {
    const ov = document.getElementById('ovFeedDetail');
    if (!ov || ov._ehDetailWatched) return;
    new MutationObserver(() => {
      if (ov.classList.contains('on')) {
        setTimeout(() => {
          const detail = document.getElementById('feedDetailContent');
          if (!detail) return;
          // 우리 좋아요 버튼이 이미 있으면 스킵
          if (detail.querySelector('.ehLikeBtn')) return;
          // 없으면 마지막으로 클릭한 글의 좋아요 버튼 동적 삽입
          if (!window._ehLastDetailId) return;
          const v = window._feedItems?.[window._ehLastDetailId];
          if (!v) return;
          const liked = (v.likes || []).includes(window.ME?.uid);
          const likeCount = (v.likes || []).length;
          const wrap = document.createElement('div');
          wrap.style.cssText = 'border-top:1px solid #f0f0f0;padding-top:14px;margin-top:14px;display:flex;justify-content:flex-start';
          wrap.innerHTML = `
            <button class="ehLikeBtn ${liked ? 'on' : ''}" data-like="${v.id}"
                    onclick="toggleLike('${v.id}')"
                    style="background:none;border:1.5px solid var(--bdr);border-radius:22px;padding:8px 16px;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;${liked ? 'color:var(--red);border-color:#ffd0d0;background:#fff5f5' : 'color:var(--sub)'}">
              <span class="ic" style="font-size:16px">${liked ? '❤️' : '🤍'}</span>
              <span class="count">${likeCount}</span>
              <span style="font-weight:600">좋아요</span>
            </button>`;
          detail.appendChild(wrap);
          console.log('[eco_story] 좋아요 버튼 동적 삽입 완료');
        }, 100);
      }
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    ov._ehDetailWatched = true;
  }
  setTimeout(watchDetailModal, 800);

  /* ─── 7. 글쓰기 모달 ─── */
  const WRITE_CATS = [
    { cat:'book',    mid:'m43', icon:'📖', label:'책' },
    { cat:'movie',   mid:'m42', icon:'🎬', label:'영화·다큐' },
    { cat:'article', mid:'m44', icon:'📰', label:'글·콘텐츠' },
    { cat:'review',  mid:'m18', icon:'♻️', label:'제품·매장' },
    { cat:'story',   mid:'m38', icon:'✨', label:'일반' },
  ];
  function ensureWriteModal() {
    if (document.getElementById('ovWriteStory')) return;
    const modal = document.createElement('div');
    modal.className = 'overlay';
    modal.id = 'ovWriteStory';
    modal.innerHTML = `
      <div class="modal">
        <div class="handle" onclick="closeOv('ovWriteStory')"></div>
        <button class="modal-close" onclick="closeOv('ovWriteStory')">✕</button>
        <div class="modal-title">✏️ 에코 스토리 쓰기</div>
        <div class="modal-desc">환경에 대한 글을 자유롭게! 30자 이상 쓰면 <b style="color:var(--g2)">+30P</b></div>

        <div class="form-group">
          <label>카테고리 <span style="color:var(--red)">*</span></label>
          <div style="display:flex;gap:6px;flex-wrap:wrap" id="ehWriteCatSel">
            ${WRITE_CATS.map(c => `
              <button class="dep-btn" data-cat="${c.cat}" data-mid="${c.mid}">${c.icon} ${c.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>제목 (선택)</label>
          <input class="inp" id="ehWriteTitle" placeholder="예) 비포 더 플러드를 보고" maxlength="60"/>
        </div>
        <div class="form-group">
          <label>본문 <span style="color:var(--red)">*</span></label>
          <textarea class="inp" id="ehWriteBody" placeholder="자유롭게 후기/생각/팁을 적어주세요..."
                    rows="8" style="font-family:inherit;resize:vertical;min-height:160px"></textarea>
          <div id="ehWriteCount" style="font-size:11px;color:var(--sub);text-align:right;margin-top:4px">0 / 1000</div>
        </div>
        <div class="form-group">
          <label>사진 첨부 (선택)</label>
          <div onclick="document.getElementById('ehWritePhoto').click()"
               style="background:#f8f8f8;border:2px dashed var(--bdr);border-radius:14px;min-height:90px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:14px;overflow:hidden">
            <div id="ehWritePhotoPlaceholder" style="text-align:center">
              <div style="font-size:28px">📷</div>
              <div style="font-size:12px;color:var(--sub);margin-top:4px">탭하여 사진 추가</div>
            </div>
            <img id="ehWritePhotoPreview" style="display:none;max-width:100%;max-height:240px;border-radius:8px"/>
          </div>
          <input type="file" id="ehWritePhoto" accept="image/*" style="display:none"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-gray" style="flex:1" onclick="closeOv('ovWriteStory')">취소</button>
          <button class="btn btn-g" style="flex:2" onclick="submitStory()">📝 게시하기</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) window.closeOv?.('ovWriteStory'); });

    modal.querySelectorAll('#ehWriteCatSel .dep-btn').forEach(b => {
      b.onclick = () => {
        modal.querySelectorAll('#ehWriteCatSel .dep-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      };
    });

    const body = modal.querySelector('#ehWriteBody');
    const count = modal.querySelector('#ehWriteCount');
    body.addEventListener('input', () => {
      const len = body.value.length;
      count.textContent = `${len} / 1000`;
      count.style.color = len >= 30 ? 'var(--g2)' : 'var(--sub)';
      count.style.fontWeight = len >= 30 ? '700' : '400';
    });

    modal.querySelector('#ehWritePhoto').onchange = function (e) {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = ev => {
        window._ehWritePhotoB64 = ev.target.result.split(',')[1];
        modal.querySelector('#ehWritePhotoPreview').src = ev.target.result;
        modal.querySelector('#ehWritePhotoPreview').style.display = 'block';
        modal.querySelector('#ehWritePhotoPlaceholder').style.display = 'none';
      };
      r.readAsDataURL(f);
    };
  }
  window.openWriteModal = function () {
    if (!window.ME) { window.toast?.('로그인이 필요해요!'); return; }
    ensureWriteModal();
    document.querySelectorAll('#ehWriteCatSel .dep-btn').forEach(b => b.classList.remove('on'));
    document.querySelector('#ehWriteCatSel .dep-btn[data-cat="story"]')?.classList.add('on');
    document.getElementById('ehWriteTitle').value = '';
    document.getElementById('ehWriteBody').value = '';
    document.getElementById('ehWriteCount').textContent = '0 / 1000';
    document.getElementById('ehWritePhotoPreview').style.display = 'none';
    document.getElementById('ehWritePhotoPreview').src = '';
    document.getElementById('ehWritePhotoPlaceholder').style.display = 'block';
    window._ehWritePhotoB64 = null;
    window.openOv?.('ovWriteStory');
  };
  window.submitStory = async function () {
    const selBtn = document.querySelector('#ehWriteCatSel .dep-btn.on');
    if (!selBtn) { window.toast?.('카테고리를 선택해주세요!'); return; }
    const cat = selBtn.dataset.cat;
    const missionId = selBtn.dataset.mid;
    const title = document.getElementById('ehWriteTitle').value.trim();
    const body  = document.getElementById('ehWriteBody').value.trim();
    if (body.length < 30) { window.toast?.('본문을 30자 이상 작성해주세요!'); return; }
    if (typeof MISSIONS === 'undefined') return;
    const m = MISSIONS.find(x => x.id === missionId);
    if (!m) { window.toast?.('카테고리 오류'); return; }
    const fullText = combineTitleBody(title, body);

    try {
      let thumb = '';
      if (window._ehWritePhotoB64 && window.compressImage) {
        thumb = await window.compressImage(window._ehWritePhotoB64, 400);
      }
      await window.FB.addDoc(window.FB.collection(window.FB.db, 'verifications'), {
        uid: window.ME.uid,
        userName: window.UDATA?.nickname || window.ME?.displayName || '익명',
        userPhoto: window.ME?.photoURL || '',
        missionId: m.id, missionName: m.name, missionEmoji: m.emoji,
        isPublic: true, thumb, comment: fullText,
        storyMode: true, category: cat, writeMode: true,
        likes: [],
        createdAt: window.FB.serverTimestamp(),
      });
      try {
        const newP = (window.UDATA?.point || 0) + 30;
        await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { point: newP });
        if (window.UDATA) window.UDATA.point = newP;
        window.updateUI?.();
      } catch (e) {}
      window.closeOv?.('ovWriteStory');
      window.toast?.('✅ 에코 스토리 게시 완료! +30P');
      if (window.loadFeed) window.loadFeed();
    } catch (e) {
      window.toast?.('게시 실패: ' + (e.message || ''));
    }
  };

  /* ─── 실행 ─── */
  function run() {
    try { renameFeedHeader(); } catch(e){}
    try { addWriteButton();   } catch(e){}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 200));
  } else {
    setTimeout(run, 200);
  }
  [800, 1500, 3000, 5000].forEach(t => setTimeout(run, t));

  function watchAiModal() {
    const ov = document.getElementById('ovAI');
    if (!ov || ov._ehStoryWatched) return;
    new MutationObserver(() => {
      if (ov.classList.contains('on')) setTimeout(expandCommentInput, 80);
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    ov._ehStoryWatched = true;
  }
  setTimeout(watchAiModal, 800);

  const _origLoadFeed = window.loadFeed;
  if (typeof _origLoadFeed === 'function' && !window._ehStoryFeedHooked) {
    window.loadFeed = async function () {
      const r = await _origLoadFeed.call(this);
      setTimeout(() => ehRenderFeed(), 100);
      return r;
    };
    window._ehStoryFeedHooked = true;
  }

  const _origGoPage = window.goPage;
  if (typeof _origGoPage === 'function' && !window._ehStoryGoPageHooked) {
    window.goPage = function (...a) {
      const r = _origGoPage.apply(this, a);
      setTimeout(() => { renameFeedHeader(); addWriteButton(); }, 200);
      return r;
    };
    window._ehStoryGoPageHooked = true;
  }

  console.log('[eco_story_patch v3] ✅ 통일된 글쓰기 + 블로그 카드 + 좋아요');
})();
