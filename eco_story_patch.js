/* ================================================================
   EcoQuest – eco_story_patch.js
   인증 피드를 "📚 에코 스토리"로 통합 + 후기 작성 기능
   1. 인증 모달의 한마디 입력 → textarea로 확장 (1000자)
   2. 30자 이상 쓰면 storyMode + 카테고리 자동 매핑
   3. 후기 작성 시 +30P 보너스
   4. 홈 피드를 카테고리 chip + 후기카드/사진그리드 혼합으로
   5. 후기 상세 보기 (전체 글)
   ================================================================ */
(function () {
  'use strict';

  /* ─── CSS ─── */
  const css = `
    /* 에코 스토리 카테고리 chip */
    #ehStoryChips {
      display:flex; gap:6px; padding:0 0 10px;
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

    /* 후기 카드 */
    .ehStoryCard {
      background:#fff; border-radius:14px; padding:14px;
      margin-bottom:10px; border:1px solid var(--bdr);
    }
    .ehStoryCard:hover { border-color:var(--g1); }
    .ehSCHead { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .ehSCAvatar {
      width:32px; height:32px; border-radius:50%; overflow:hidden;
      background:linear-gradient(135deg,var(--g1),var(--g2));
      display:flex; align-items:center; justify-content:center;
      font-size:14px; flex-shrink:0; color:#fff;
    }
    .ehSCAvatar img { width:100%; height:100%; object-fit:cover; }
    .ehSCMeta { flex:1; min-width:0; }
    .ehSCName { font-size:13px; font-weight:700; color:var(--txt); }
    .ehSCMission { font-size:11px; color:var(--sub); margin-top:1px; }
    .ehSCTitle { font-size:15px; font-weight:900; color:var(--txt); margin-bottom:6px; line-height:1.4; }
    .ehSCBody {
      font-size:13px; color:#444; line-height:1.7;
      margin-bottom:10px; white-space:pre-wrap; word-break:break-word;
    }
    .ehSCBody.clip {
      display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical;
      overflow:hidden;
    }
    .ehSCImg { width:100%; border-radius:10px; max-height:240px; object-fit:cover; margin-bottom:8px; }
    .ehSCFoot {
      display:flex; justify-content:space-between; align-items:center;
      font-size:12px; padding-top:6px; border-top:1px solid #f0f0f0;
    }
    .ehSCBadge { color:var(--g2); font-weight:700; }
    .ehSCMore { color:var(--sub); cursor:pointer; }
    .ehSCMore:hover { color:var(--g1); }

    /* 후기 작성 토글/필드 */
    #verifComment {
      resize:vertical !important;
      min-height:44px;
      font-family:inherit !important;
    }
    #ehStoryHint {
      font-size:11px; color:var(--sub); margin-top:4px; line-height:1.5;
    }
    #ehStoryHint b { color:var(--g2); }

    /* 섹션 sub-header (전체 모드일 때) */
    .ehStorySub {
      font-size:12px; color:var(--sub); font-weight:700;
      margin:8px 0 8px; padding-top:4px;
    }
  `;
  if (!document.getElementById('eco_story_patch_style')) {
    const s = document.createElement('style');
    s.id = 'eco_story_patch_style';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  /* ─── 카테고리 정의 ─── */
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
    if (missionId === 'm41' || missionId === 'm42') return 'movie';
    if (missionId === 'm44' || missionId === 'm45') return 'article';
    if (missionId === 'm17' || missionId === 'm18' || missionId === 'm23') return 'review';
    return 'story';
  }

  window._ehStoryCurCat = window._ehStoryCurCat || 'all';

  /* ─── 1. 인증 모달의 verifComment를 textarea로 확장 ─── */
  function expandCommentInput() {
    const old = document.getElementById('verifComment');
    if (!old) return;
    if (old.tagName === 'TEXTAREA') return; // 이미 변환됨

    const ta = document.createElement('textarea');
    ta.id = 'verifComment';
    ta.className = old.className || 'inp';
    ta.placeholder = '한마디 또는 자세한 후기를 남겨주세요...\n(30자 이상 쓰면 에코 스토리에 게시돼요 +30P)';
    ta.maxLength = 1000;
    ta.rows = 3;
    ta.style.cssText = 'font-size:13px;padding:10px 12px;resize:vertical;font-family:inherit;width:100%';
    old.parentNode.replaceChild(ta, old);

    // 라벨 텍스트 변경
    const label = ta.previousElementSibling;
    if (label && label.style && /한마디/.test(label.textContent)) {
      label.innerHTML = '📝 후기 또는 한마디 (선택)';
    }

    // 도움말 추가
    if (!document.getElementById('ehStoryHint')) {
      const hint = document.createElement('div');
      hint.id = 'ehStoryHint';
      hint.innerHTML = '💡 <b>30자 이상</b> 쓰면 자동으로 <b>📚 에코 스토리</b>에 게시되고 <b>+30P 보너스</b>!';
      ta.parentNode.insertBefore(hint, ta.nextSibling);
    }

    // 글자수 카운터
    const counter = document.createElement('div');
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

  /* ─── 2. saveVerification 오버라이드 ─── */
  window.saveVerification = async (uid, m, b64, isPublic, comment) => {
    try {
      const thumb = await window.compressImage(b64, 400);
      const trimmed = (comment || '').trim();
      const storyMode = trimmed.length >= 30;
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
        comment: trimmed,
        storyMode,
        category,
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
      return true;
    } catch (e) {
      console.log('인증 저장 오류', e);
      return false;
    }
  };

  /* ─── 3. 피드 렌더링 (에코 스토리 통합) ─── */
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

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function renderStoryCard(v) {
    const text = v.comment || '';
    const preview = text.length > 280 ? text.slice(0, 280) + '…' : text;
    const time = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const avatar = v.userPhoto
      ? `<img src="${v.userPhoto}"/>`
      : '👤';
    return `
      <div class="ehStoryCard" onclick="openFeedDetail('${v.id}')">
        <div class="ehSCHead">
          <div class="ehSCAvatar">${avatar}</div>
          <div class="ehSCMeta">
            <div class="ehSCName">${escapeHtml(v.userName || '익명')}</div>
            <div class="ehSCMission">${v.missionEmoji || ''} ${escapeHtml(v.missionName || '')} · ${time}</div>
          </div>
        </div>
        <div class="ehSCBody clip">${escapeHtml(preview)}</div>
        ${v.thumb ? `<img class="ehSCImg" src="${v.thumb}" alt=""/>` : ''}
        <div class="ehSCFoot">
          <span class="ehSCBadge">📝 에코 스토리</span>
          <span class="ehSCMore">더보기 →</span>
        </div>
      </div>`;
  }

  function renderPhotoCell(v) {
    return `
      <div onclick="openFeedDetail('${v.id}')" style="position:relative;aspect-ratio:1;background:#f0f0f0;cursor:pointer;border-radius:6px;overflow:hidden">
        ${v.thumb
          ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji || '📷'}</div>`}
        <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.55));padding:4px 5px">
          <div style="font-size:9px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${v.missionEmoji || ''} ${escapeHtml(v.missionName || '')}
          </div>
        </div>
        ${v.comment ? '<div style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);border-radius:6px;padding:1px 5px;font-size:9px;color:#fff">💬</div>' : ''}
      </div>`;
  }

  function ehRenderFeed(w) {
    if (!w) w = document.getElementById('feedList');
    if (!w) return;

    const all = window._allFeedItems || [];
    const cat = window._ehStoryCurCat || 'all';
    const nicknameMap = window._feedNicknameMap || {};

    // 닉네임 동기화
    window._feedItems = window._feedItems || {};
    all.forEach(v => {
      window._feedItems[v.id] = { ...v, userName: nicknameMap[v.uid] || v.userName || '익명' };
    });

    // 후기/사진 분리
    const isStory = v => v.storyMode || (v.comment && v.comment.length >= 30);
    let stories, photos;

    if (cat === 'all') {
      stories = all.filter(isStory);
      photos  = all.filter(v => !isStory(v));
    } else if (cat === 'photo') {
      stories = [];
      photos  = all.filter(v => !isStory(v));
    } else {
      // 카테고리별 후기만
      const matchCat = v => {
        if (v.category) return v.category === cat;
        // 백필: 옛 데이터엔 category 없음
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
      const isFirstWriter = cat === 'all';
      html += isFirstWriter ? `
        <div style="background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:14px;padding:20px 18px;border:1.5px solid var(--g1);margin-top:8px">
          <div style="text-align:center;margin-bottom:14px">
            <div style="font-size:36px;margin-bottom:6px">📚</div>
            <div style="font-size:14px;font-weight:900;color:var(--txt)">첫 작가가 되어주세요!</div>
            <div style="font-size:12px;color:var(--sub);margin-top:4px;line-height:1.6">
              아직 에코 스토리가 비어있어요.<br/>
              당신의 첫 글이 다른 사람을 움직여요 🌱
            </div>
          </div>
          <div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;color:var(--g2);margin-bottom:6px">💡 이런 글을 기다리고 있어요</div>
            <div style="font-size:12px;color:#555;line-height:1.9">
              ✨ 환경 다큐 보고 받은 충격<br/>
              ✨ 텀블러 한 달 사용 후기<br/>
              ✨ 비건 식당 첫 방문기<br/>
              ✨ 제로웨이스트 살림 팁
            </div>
          </div>
          <div style="font-size:11px;color:var(--sub);text-align:center;line-height:1.6;margin-bottom:10px">
            챌린지 인증할 때 <b style="color:var(--g2)">30자 이상 후기</b>를 쓰면<br/>
            자동으로 게시되고 <b style="color:var(--g2)">+30P 보너스</b>!
          </div>
          <button onclick="window.goPage&&window.goPage('chal')"
            style="width:100%;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit">
            🏆 챌린지 둘러보기 →
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

    // 후기 카드들
    if (stories.length) {
      if (cat === 'all' && photos.length) {
        html += `<div class="ehStorySub">📝 후기 (${stories.length})</div>`;
      }
      html += stories.slice(0, 20).map(renderStoryCard).join('');
    }

    // 사진 그리드
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
  }
  window.renderFeedGrid = ehRenderFeed; // 기존 호출 호환
  window._ehRenderFeed = ehRenderFeed;

  /* ─── 4. 인증 피드 섹션 헤더 변경 ─── */
  function renameFeedHeader() {
    const home = document.getElementById('page-home');
    if (!home) return;
    home.querySelectorAll('.sec-t').forEach(el => {
      const t = (el.innerText || '').trim();
      if (t === '📸 인증 피드') {
        el.textContent = '📚 에코 스토리';
      }
    });
  }

  /* ─── 5. openFeedDetail 오버라이드 (전체 후기 표시) ─── */
  window.openFeedDetail = function (id) {
    const v = window._feedItems?.[id];
    if (!v) return;
    const detail = document.getElementById('feedDetailContent');
    if (!detail) return;
    const time = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const isStory = v.storyMode || (v.comment && v.comment.length >= 30);

    detail.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--g1),var(--g2));display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;color:#fff">
          ${v.userPhoto ? `<img src="${v.userPhoto}" style="width:100%;height:100%;object-fit:cover"/>` : '👤'}
        </div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:var(--txt)">${escapeHtml(v.userName || '익명')}</div>
          <div style="font-size:11px;color:var(--sub)">${time}</div>
        </div>
        ${isStory ? '<span style="background:#f0fbf4;color:var(--g2);font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px">📝 에코 스토리</span>' : ''}
      </div>

      <div style="background:#f0fbf4;border-radius:10px;padding:8px 12px;margin-bottom:12px">
        <span style="font-size:13px;font-weight:700;color:var(--g2)">✅ ${v.missionEmoji || ''} ${escapeHtml(v.missionName || '')}</span>
      </div>

      ${v.thumb ? `<img src="${v.thumb}" style="width:100%;border-radius:12px;max-height:320px;object-fit:cover;margin-bottom:12px"/>` : ''}

      ${v.comment
        ? (isStory
            ? `<div style="font-size:14px;color:var(--txt);line-height:1.8;white-space:pre-wrap;word-break:break-word;padding:4px 2px">${escapeHtml(v.comment)}</div>`
            : `<div style="background:#f8f8f8;border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt);line-height:1.6">💬 "${escapeHtml(v.comment)}"</div>`)
        : ''}
    `;
    window.openOv && window.openOv('ovFeedDetail');
  };

  /* ─── 실행 ─── */
  function run() {
    try { renameFeedHeader(); } catch(e){}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 200));
  } else {
    setTimeout(run, 200);
  }
  [800, 1500, 3000, 5000].forEach(t => setTimeout(run, t));

  // ovAI 모달 열릴 때 textarea 변환
  function watchAiModal() {
    const ov = document.getElementById('ovAI');
    if (!ov || ov._ehStoryWatched) return;
    new MutationObserver(() => {
      if (ov.classList.contains('on')) {
        setTimeout(expandCommentInput, 80);
      }
    }).observe(ov, { attributes: true, attributeFilter: ['class'] });
    ov._ehStoryWatched = true;
  }
  setTimeout(watchAiModal, 800);

  // 함수 후크 (loadFeed 완료 후 카테고리 chip 그리기)
  const _origLoadFeed = window.loadFeed;
  if (typeof _origLoadFeed === 'function') {
    window.loadFeed = async function () {
      const r = await _origLoadFeed.call(this);
      // _allFeedItems가 채워진 후 다시 그리기
      setTimeout(() => ehRenderFeed(), 100);
      return r;
    };
  }

  console.log('[eco_story_patch] ✅ 에코 스토리 통합 완료');

  /* ================================================================
     ✏️ 직접 글쓰기 (챌린지 인증 안 거치고)
     ================================================================ */
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
          <div id="ehWritePhotoArea" onclick="document.getElementById('ehWritePhoto').click()"
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

    // overlay 클릭으로 닫기
    modal.addEventListener('click', e => { if (e.target === modal) window.closeOv?.('ovWriteStory'); });

    // 카테고리 선택
    modal.querySelectorAll('#ehWriteCatSel .dep-btn').forEach(b => {
      b.onclick = () => {
        modal.querySelectorAll('#ehWriteCatSel .dep-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      };
    });

    // 글자수
    const body = modal.querySelector('#ehWriteBody');
    const count = modal.querySelector('#ehWriteCount');
    body.addEventListener('input', () => {
      const len = body.value.length;
      count.textContent = `${len} / 1000`;
      count.style.color = len >= 30 ? 'var(--g2)' : 'var(--sub)';
      count.style.fontWeight = len >= 30 ? '700' : '400';
    });

    // 사진
    modal.querySelector('#ehWritePhoto').onchange = function (e) {
      const f = e.target.files[0];
      if (!f) return;
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
    // 초기화
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

    const fullText = title ? `# ${title}\n\n${body}` : body;

    try {
      let thumb = '';
      if (window._ehWritePhotoB64 && window.compressImage) {
        thumb = await window.compressImage(window._ehWritePhotoB64, 400);
      }

      await window.FB.addDoc(window.FB.collection(window.FB.db, 'verifications'), {
        uid: window.ME.uid,
        userName: window.UDATA?.nickname || window.ME?.displayName || '익명',
        userPhoto: window.ME?.photoURL || '',
        missionId: m.id,
        missionName: m.name,
        missionEmoji: m.emoji,
        isPublic: true,
        thumb,
        comment: fullText,
        storyMode: true,
        category: cat,
        writeMode: true,
        createdAt: window.FB.serverTimestamp(),
      });

      // +30P 보너스
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
      window.toast?.('게시 실패: ' + e.message);
    }
  };

  /* "📚 에코 스토리" 섹션 헤더에 ✏️ 글쓰기 버튼 삽입 */
  function addWriteButton() {
    const home = document.getElementById('page-home');
    if (!home) return;

    let sectionT = null;
    home.querySelectorAll('.sec-t').forEach(el => {
      const t = (el.innerText || '').trim();
      if (t === '📚 에코 스토리' || t === '📸 인증 피드') sectionT = el;
    });
    if (!sectionT) return;
    const sec = sectionT.closest('.sec');
    if (!sec || sec.querySelector('#ehWriteBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'ehWriteBtn';
    btn.style.cssText = `
      background: linear-gradient(135deg, var(--g1), var(--g2));
      color: #fff; border: none; border-radius: 16px;
      padding: 7px 14px; font-size: 12px; font-weight: 800;
      cursor: pointer; font-family: inherit;
      box-shadow: 0 2px 8px rgba(46,204,113,.3);
      margin-left: auto; margin-right: 8px;
    `;
    btn.textContent = '✏️ 글쓰기';
    btn.onclick = () => window.openWriteModal();

    const secM = sec.querySelector('.sec-m');
    if (secM) sec.insertBefore(btn, secM);
    else sec.appendChild(btn);
  }

  // 실행 + 후크
  setTimeout(addWriteButton, 500);
  [1500, 3000, 5000].forEach(t => setTimeout(addWriteButton, t));
  const _origGoPage = window.goPage;
  if (typeof _origGoPage === 'function' && !window._ehWriteBtnHooked) {
    window.goPage = function (...a) {
      const r = _origGoPage.apply(this, a);
      setTimeout(addWriteButton, 200);
      return r;
    };
    window._ehWriteBtnHooked = true;
  }

  console.log('[eco_story_patch] ✅ 글쓰기 버튼 + 모달 추가');
})();
