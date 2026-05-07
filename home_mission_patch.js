/* ================================================================
   EcoQuest – home_mission_patch.js  v4
   1. 홈 "🏢 소속 기업/단체" 강제 숨김
   2. 홈 미션 + 챌린지 통합 카드 (인증 버튼 내장)
   3. 챌린지 탭 카테고리 필터 7개 (chip)  ← v4 신규
   4. 카드 hover tooltip
   5. 환경 콘텐츠 챌린지 5종 추가 (m41~m45 / id 36~40)
   ================================================================ */
(function () {
  'use strict';

  /* ─── CSS ─── */
  const css = `
    /* 홈 기업 섹션 강제 숨김 */
    #page-home #companySec,
    #page-home #companyBox,
    #page-home #companyPageBox,
    #page-home #companySection,
    #page-home #homeCompanySection { display: none !important; }

    /* 기존 "⚡ 오늘의 미션" 섹션 숨김 */
    #page-home #missionScroll,
    #page-home .sec.eh-old-mission-sec { display: none !important; }

    /* 지도 탭 "총 참여자" 카드 숨김 (숫자가 안 채워져서) */
    #page-map div:has(> #forestTotal) { display: none !important; }

    /* 통합 챌린지 카드 */
    .ehChalCard {
      background:#fff; border-radius:16px; padding:14px;
      margin:0 12px 10px; border:1.5px solid var(--g1);
      box-shadow:0 2px 10px rgba(46,204,113,.12);
    }
    .ehChalCard.done { border-color:#a8f0c6; background:#f8fdf9; }
    .ehChalHead { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
    .ehChalEmoji { font-size:36px; line-height:1; }
    .ehChalInfo { flex:1; min-width:0; }
    .ehChalTitle {
      font-size:14px; font-weight:900; color:var(--txt);
      overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    }
    .ehChalMeta { font-size:11px; color:var(--sub); margin-top:2px; }
    .ehChalCount { text-align:right; flex-shrink:0; }
    .ehChalCountN { font-size:14px; font-weight:900; color:var(--g2); }
    .ehChalCountP { font-size:10px; color:var(--sub); }
    .ehBar {
      background:#e0f2e7; border-radius:6px; height:6px;
      overflow:hidden; margin-bottom:12px;
    }
    .ehBarFill {
      height:100%; border-radius:6px;
      background:linear-gradient(90deg,var(--g1),var(--acc));
      transition:width .5s;
    }
    .ehVerifyBtn {
      width:100%; background:linear-gradient(135deg,var(--g1),var(--g2));
      color:#fff; border:none; border-radius:12px;
      padding:14px; font-size:14px; font-weight:900;
      cursor:pointer; font-family:inherit;
      display:flex; align-items:center; justify-content:center; gap:8px;
      box-shadow:0 4px 14px rgba(46,204,113,.35);
      animation:ehVerifPulse 1.8s ease-in-out infinite;
      transition:transform .1s;
    }
    .ehVerifyBtn:active { transform:scale(.97); }
    .ehVerifyBtn .ehSub { font-size:11px; opacity:.9; font-weight:700; }
    @keyframes ehVerifPulse {
      0%,100% { box-shadow:0 4px 14px rgba(46,204,113,.35); }
      50%     { box-shadow:0 6px 22px rgba(46,204,113,.55); }
    }
    .ehDoneBox {
      background:#f0fbf4; border:1.5px solid var(--g1);
      border-radius:12px; padding:14px; text-align:center;
      font-size:13px; font-weight:800; color:var(--g2);
    }
    .ehDoneBox .ehSm { font-size:11px; color:var(--sub); font-weight:600; margin-top:2px; }
    .ehCancel {
      background:none; color:var(--sub); border:none; font-size:11px;
      cursor:pointer; font-family:inherit; text-decoration:underline;
      padding:6px 0; margin-top:4px; display:block; margin-left:auto;
    }
    .ehCancel:hover { color:var(--red); }
    .ehEmpty {
      background:#fff; border-radius:14px;
      padding:20px 16px; margin:0 12px 10px;
      border:1.5px dashed var(--bdr); text-align:center;
    }
    .ehEmpty .ehEmojiBig { font-size:36px; margin-bottom:10px; }
    .ehEmpty .ehTxt { font-size:14px; font-weight:800; color:var(--txt); margin-bottom:4px; }
    .ehEmpty .ehSub2 { font-size:12px; color:var(--sub); margin-bottom:14px; }
    .ehEmpty .ehGoBtn {
      background:linear-gradient(135deg,var(--g1),var(--g2));
      color:#fff; border:none; border-radius:12px;
      padding:12px 24px; font-size:14px; font-weight:900;
      cursor:pointer; font-family:inherit;
    }

    /* ─── 챌린지 카테고리 chip ─── */
    #ehCatChips {
      display:flex; gap:6px; padding:4px 12px 10px;
      overflow-x:auto; -webkit-overflow-scrolling:touch;
    }
    #ehCatChips::-webkit-scrollbar { display:none; }
    .ehChip {
      flex-shrink:0; background:#fff; border:1.5px solid var(--bdr);
      color:var(--sub); padding:7px 12px; border-radius:20px;
      font-size:12px; font-weight:700; cursor:pointer; font-family:inherit;
      white-space:nowrap; transition:all .15s;
    }
    .ehChip:hover { border-color:var(--g1); color:var(--g2); }
    .ehChip.on { background:var(--g1); color:#fff; border-color:var(--g1); }
  `;
  if (!document.getElementById('home_mission_patch_style')) {
    const style = document.createElement('style');
    style.id = 'home_mission_patch_style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ─── 카테고리 정의 ─── */
  const CATEGORIES = [
    {id:'all',       label:'전체',         icon:'🌍'},
    {id:'food',      label:'먹거리',       icon:'🍽️'},
    {id:'transport', label:'이동',         icon:'🚌'},
    {id:'waste',     label:'제로웨이스트', icon:'♻️'},
    {id:'energy',    label:'에너지',       icon:'💡'},
    {id:'nature',    label:'자연',         icon:'🌿'},
    {id:'learn',     label:'학습·생활',    icon:'📚'},
    {id:'eco10',     label:'생태십계명',   icon:'✝️'},
  ];

  const CAT_MAP = {
    // 먹거리
    3:'food', 10:'food', 12:'food',
    // 이동
    2:'transport', 5:'transport', 17:'transport',
    // 제로웨이스트
    1:'waste', 4:'waste', 7:'waste', 8:'waste', 11:'waste',
    13:'waste', 16:'waste', 19:'waste', 20:'waste', 25:'waste',
    // 에너지
    9:'energy', 15:'energy', 23:'energy',
    // 자연
    6:'nature', 14:'nature', 21:'nature', 22:'nature',
    // 학습·생활
    18:'learn', 24:'learn', 36:'learn', 37:'learn', 38:'learn', 39:'learn', 40:'learn',
    // 생태십계명
    26:'eco10', 27:'eco10', 28:'eco10', 29:'eco10', 30:'eco10',
    31:'eco10', 32:'eco10', 33:'eco10', 34:'eco10', 35:'eco10',
  };
  window._ehCurCat = window._ehCurCat || 'all';

  /* ─── 1. 홈 기업 섹션 JS 제거 ─── */
  function removeCompanyFromHome() {
    const home = document.getElementById('page-home');
    if (!home) return;
    home.querySelectorAll('#companySec, #companyBox, #companyPageBox, #companySection, #homeCompanySection')
      .forEach(el => el.remove());
    home.querySelectorAll('div').forEach(div => {
      const txt = (div.innerText || '').trim();
      if (!txt || txt.length > 100) return;
      if (/(?:🏢\s*)?소속\s*기업\s*\/?\s*단체/.test(txt)) {
        const next = div.nextElementSibling;
        if (next) {
          const nt = (next.innerText || '').trim();
          if ((next.id && /company/i.test(next.id)) || /불러오기|로딩/.test(nt) || nt.length < 40) next.remove();
        }
        const parent = div.parentElement;
        if (parent && parent !== home && parent.children.length <= 3 && /소속\s*기업/.test(parent.innerText || '')) {
          parent.remove();
        } else { div.remove(); }
      }
    });
  }

  /* ─── 2. "⚡ 오늘의 미션" sec 헤더 숨김 ─── */
  function hideOldMissionSec() {
    const ms = document.getElementById('missionScroll');
    if (!ms) return;
    const prev = ms.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('sec')) {
      prev.classList.add('eh-old-mission-sec');
    }
  }

  /* 지도 탭 "총 참여자" 카드 JS fallback */
  function hideForestTotal() {
    const el = document.getElementById('forestTotal');
    if (el && el.parentElement) el.parentElement.style.display = 'none';
  }

  /* ─── 신규 회원 섹션 (TOP 기여자 아래) ─── */
  async function renderNewcomers() {
    const topEl = document.getElementById('topContrib');
    if (!topEl || !window.FB?.getDocs) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const now = Date.now();
      const SEVEN = 7 * 86400 * 1000;

      const recent = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.createdAt?.seconds && (now - u.createdAt.seconds * 1000) < SEVEN)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 8);

      // 기존 섹션 있으면 제거 후 다시 그리기
      const existing = document.getElementById('ehNewcomers');
      if (existing) existing.remove();
      if (!recent.length) return;

      const wrap = document.createElement('div');
      wrap.id = 'ehNewcomers';
      wrap.style.cssText = 'padding:0 12px 20px';
      wrap.innerHTML = `
        <div style="font-size:15px;font-weight:900;color:var(--txt);margin:18px 0 8px">
          🌱 새로 가입한 멤버 (최근 7일)
        </div>
        ${recent.map(u => {
          const co2 = u.co2 || 0;
          const tree = co2 >= 1 ? '🌿' : '🌱';
          const days = Math.floor((now - u.createdAt.seconds * 1000) / 86400000);
          const daysLbl = days === 0 ? '오늘 가입' : `${days}일 전 가입`;
          const isMe = u.id === window.ME?.uid;
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#fff;border-radius:12px;margin-bottom:6px;border:1px solid var(--bdr)">
              <div style="font-size:24px">${tree}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${u.nickname || '익명 지구지킴이'}${isMe ? ' 🌟' : ''}
                </div>
                <div style="font-size:11px;color:var(--sub)">${daysLbl} · 미션 ${u.missionCount || 0}개</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:900;color:var(--g2)">${co2.toFixed(1)}kg</div>
                <div style="font-size:10px;color:var(--sub)">CO₂ 절감</div>
              </div>
            </div>`;
        }).join('')}
      `;
      topEl.parentNode.insertBefore(wrap, topEl.nextSibling);
    } catch (e) { console.warn('[home_mission_patch] newcomer 실패', e); }
  }

  /* loadTopContrib 후크 */
  const _origLoadTopContrib = window.loadTopContrib;
  if (typeof _origLoadTopContrib === 'function' && !window._ehNewcomerHooked) {
    window.loadTopContrib = async function () {
      const r = await _origLoadTopContrib.apply(this, arguments);
      setTimeout(renderTodayActivity, 100);
      setTimeout(renderNewcomers, 200);
      return r;
    };
    window._ehNewcomerHooked = true;
  }

  /* ─── 🔥 오늘의 활약 (TOP 기여자 위) ─── */
  let _todayActCache = null;
  let _todayActCacheTime = 0;
  const TODAY_ACT_CACHE_MS = 3 * 60 * 1000; // 3분 캐시

  async function renderTodayActivity() {
    const topEl = document.getElementById('topContrib');
    if (!topEl || !window.FB?.getDocs || !window.FB?.query) return;
    try {
      const now = Date.now();
      let ranked, userMap;

      // 캐시 확인
      if (_todayActCache && (now - _todayActCacheTime) < TODAY_ACT_CACHE_MS) {
        ({ ranked, userMap } = _todayActCache);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const q = window.FB.query(
          window.FB.collection(window.FB.db, 'missionLogs'),
          window.FB.where('date', '==', today)
        );
        const snap = await window.FB.getDocs(q);
        const logs = snap.docs.map(d => d.data());

        // uid별 그룹핑
        const byUser = {};
        logs.forEach(l => {
          if (!l.uid) return;
          if (!byUser[l.uid]) byUser[l.uid] = { count: 0, co2: 0 };
          byUser[l.uid].count++;
          byUser[l.uid].co2 += (l.co2 || 0);
        });

        ranked = Object.entries(byUser)
          .map(([uid, d]) => ({ uid, ...d }))
          .sort((a, b) => b.count - a.count || b.co2 - a.co2)
          .slice(0, 5);

        // 닉네임 매핑
        userMap = {};
        await Promise.all(ranked.map(async r => {
          try {
            const u = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', r.uid));
            if (u.exists()) userMap[r.uid] = u.data();
          } catch (e) {}
        }));

        _todayActCache = { ranked, userMap };
        _todayActCacheTime = now;
      }

      // 기존 섹션 제거 후 새로 그리기
      const existing = document.getElementById('ehTodayActivity');
      if (existing) existing.remove();
      if (!ranked.length) return;

      const wrap = document.createElement('div');
      wrap.id = 'ehTodayActivity';
      wrap.style.cssText = 'padding:0 12px';
      const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];

      wrap.innerHTML = `
        <div style="font-size:15px;font-weight:900;color:var(--txt);margin:14px 0 8px;display:flex;align-items:center;gap:6px">
          🔥 오늘의 활약
          <span style="background:linear-gradient(135deg,#ff6b6b,#ee5a52);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px">LIVE</span>
        </div>
        ${ranked.map((r, i) => {
          const u = userMap[r.uid] || {};
          const isMe = r.uid === window.ME?.uid;
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:10px;background:linear-gradient(90deg,#fff,#fff8e1);border-radius:12px;margin-bottom:6px;border:1px solid #ffe0a3">
              <div style="font-size:18px">${medals[i]}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${u.nickname || '익명 지구지킴이'}${isMe ? ' 🌟' : ''}
                </div>
                <div style="font-size:11px;color:var(--sub)">오늘 미션 <b style="color:#e67e22">${r.count}개</b> 인증</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:900;color:var(--g2)">${r.co2.toFixed(2)}kg</div>
                <div style="font-size:10px;color:var(--sub)">오늘 절감</div>
              </div>
            </div>`;
        }).join('')}
      `;
      // TOP 기여자 위에 삽입
      topEl.parentNode.insertBefore(wrap, topEl.previousElementSibling || topEl);
    } catch (e) { console.warn('[home_mission_patch] todayActivity 실패', e); }
  }

  /* ─── 3. 통합 챌린지 카드 ─── */
  function startMissionFromChal(challengeId) {
    if (!window.ME) { window.toast && window.toast('로그인이 필요해요!'); return; }
    if (typeof MISSIONS === 'undefined' || typeof CHALLENGES === 'undefined') return;
    const ac = (window.UDATA?.activeChallenges || []).find(a => a.challengeId === challengeId);
    if (!ac) return;
    const m = MISSIONS.find(x => x.id === ac.missionId);
    if (!m || !window.openAI) return;
    window.openAI(m, window.ME.uid, challengeId);
  }
  window.ehStartMissionFromChal = startMissionFromChal;

  function ehRenderHomeChalls() {
    const w = document.getElementById('homeChallList');
    if (!w) return;
    if (typeof CHALLENGES === 'undefined' || typeof MISSIONS === 'undefined') return;
    const validIds = CHALLENGES.map(c => c.missionId);
    const active = (window.UDATA?.activeChallenges || []).filter(ac => validIds.includes(ac.missionId));

    if (!active.length) {
      w.innerHTML = `
        <div class="ehEmpty">
          <div class="ehEmojiBig">🌱</div>
          <div class="ehTxt">참여 중인 챌린지가 없어요</div>
          <div class="ehSub2">챌린지에 참여하면<br/>오늘 할 미션이 여기 나타나요!</div>
          <button class="ehGoBtn" onclick="window.goPage&&window.goPage('chal')">🏆 챌린지 참여하기</button>
        </div>`;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    w.innerHTML = active.map(ac => {
      const chal = CHALLENGES.find(c => c.id === ac.challengeId);
      const m = MISSIONS.find(x => x.id === ac.missionId);
      if (!chal || !m) return '';
      const doneToday = (window.UDATA?.verifiedDates || {})[ac.challengeId] === today;
      const totalNeeded = ac.freq === 'daily' ? ac.weeks*7
                        : ac.freq === 'w5'    ? ac.weeks*5
                        : ac.freq === 'w3'    ? ac.weeks*3
                        :                       ac.weeks*1;
      const completed = (window.UDATA?.completedDates || {})[ac.challengeId] || 0;
      const pct = Math.min(100, Math.floor(completed/totalNeeded*100));
      const daysLeft = ac.endDate ? Math.max(0, Math.ceil((new Date(ac.endDate) - new Date())/86400000)) : '?';
      const freqLbl = ac.freq === 'daily' ? '매일' : ac.freq === 'w5' ? '주 5일' : ac.freq === 'w3' ? '주 3일' : '주 1일';

      return `
        <div class="ehChalCard ${doneToday ? 'done' : ''}">
          <div class="ehChalHead">
            <div class="ehChalEmoji">${chal.emoji}</div>
            <div class="ehChalInfo">
              <div class="ehChalTitle">${chal.title}</div>
              <div class="ehChalMeta">${freqLbl} · ${ac.weeks}주 · ${daysLeft}일 남음</div>
            </div>
            <div class="ehChalCount">
              <div class="ehChalCountN">${completed}/${totalNeeded}</div>
              <div class="ehChalCountP">${pct}%</div>
            </div>
          </div>
          <div class="ehBar"><div class="ehBarFill" style="width:${pct}%"></div></div>
          ${doneToday
            ? `<div class="ehDoneBox">✅ 오늘 인증 완료!<div class="ehSm">내일 또 도전해요</div></div>`
            : `<button class="ehVerifyBtn" onclick="ehStartMissionFromChal(${ac.challengeId})">
                 📸 오늘 인증하기
                 <span class="ehSub">+${m.point}P · -${m.co2}kg CO₂</span>
               </button>`
          }
          <button class="ehCancel" onclick="cancelChal(${ac.challengeId})">챌린지 취소</button>
        </div>`;
    }).join('');
  }

  function installRenderHomeOverride() {
    if (window._ehRenderHomeChalls_installed) return;
    window.renderHomeChalls = ehRenderHomeChalls;
    window._ehRenderHomeChalls_installed = true;
    try { ehRenderHomeChalls(); } catch(e){}
  }

  /* ─── 4. 챌린지 탭 카테고리 chip ─── */
  function ensureCategoryChips() {
    const sec = document.getElementById('sec-official');
    if (!sec || document.getElementById('ehCatChips')) return;

    const chipsRow = document.createElement('div');
    chipsRow.id = 'ehCatChips';
    chipsRow.innerHTML = CATEGORIES.map(c => `
      <button data-cat="${c.id}" class="ehChip${c.id === window._ehCurCat ? ' on' : ''}">
        ${c.icon} ${c.label}
      </button>
    `).join('');

    const secHdr = sec.querySelector('.sec');
    if (secHdr && secHdr.nextSibling) sec.insertBefore(chipsRow, secHdr.nextSibling);
    else sec.insertBefore(chipsRow, sec.firstChild);

    chipsRow.querySelectorAll('.ehChip').forEach(b => {
      b.onclick = () => {
        window._ehCurCat = b.dataset.cat;
        chipsRow.querySelectorAll('.ehChip').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        if (typeof renderOfficialChallenges === 'function') renderOfficialChallenges();
      };
    });
  }

  function installRenderOfficialOverride() {
    if (window._ehRenderOC_installed) return;
    window.renderOfficialChallenges = async function () {
      const grid = document.getElementById('officialGrid');
      if (!grid || typeof CHALLENGES === 'undefined') return;

      const cat = window._ehCurCat || 'all';
      const filtered = cat === 'all'
        ? CHALLENGES.slice()
        : CHALLENGES.filter(c => CAT_MAP[c.id] === cat);

      if (!filtered.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--sub);font-size:13px">이 카테고리에 챌린지가 없어요</div>';
        return;
      }

      grid.innerHTML = filtered.map(c => `
        <div class="cg-card" onclick="openChal(${c.id})">
          <div class="cg-img">
            ${c.emoji}
            <span class="official-tag">공식챌린지</span>
            <span class="cg-cnt" id="chal-cnt-${c.id}">👥 ${c.baseParticipants.toLocaleString()}명</span>
            ${c.hot ? '<span class="hot-badge">HOT</span>' : ''}
          </div>
          <div class="cg-body">
            <div class="cg-title">${c.title}</div>
            <div class="cg-meta">${c.freqOptions?.[0]==="daily"?"매일":c.freqOptions?.[0]==="w1"?"주 1회":"주 3일~"} · AI인증</div>
          </div>
        </div>`).join('');

      try {
        if (window.FB?.getDoc) {
          const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'stats', 'challenges'));
          if (snap.exists()) {
            const counts = snap.data();
            filtered.forEach(c => {
              const el = document.getElementById(`chal-cnt-${c.id}`);
              if (el) {
                const total = counts[`c${c.id}`] || 0;
                el.textContent = `👥 ${total.toLocaleString()}명`;
              }
            });
          }
        }
      } catch(e) {}
    };
    window._ehRenderOC_installed = true;
  }

  /* ─── 5. tooltip ─── */
  function addTooltips() {
    document.querySelectorAll('.cg-card').forEach(card => {
      const t = card.querySelector('.cg-title')?.textContent.trim();
      if (t && card.title !== t) card.title = t;
    });
    document.querySelectorAll('.book-card').forEach(card => {
      const t = card.querySelector('.book-title')?.textContent.trim();
      if (t && card.title !== t) card.title = t;
    });
    document.querySelectorAll('.tb').forEach(b => {
      const txt = (b.innerText || '').replace(/\s+/g, ' ').trim();
      if (txt && !b.title) b.title = txt;
    });
  }

  /* ─── 6. 환경 콘텐츠 챌린지 추가 ─── */
  const NEW_MISSIONS = [
    {id:"m41",emoji:"🎬",name:"환경 다큐 시청",point:100,co2:0.05,kw:"다큐멘터리, TV 화면, 영상"},
    {id:"m42",emoji:"🎥",name:"환경 영화 관람",point:100,co2:0.05,kw:"영화, 영화관, 티켓, 스크린"},
    {id:"m43",emoji:"📖",name:"환경 도서 읽기",point:80, co2:0.03,kw:"책, 독서, 도서, 페이지"},
    {id:"m44",emoji:"📰",name:"ESG 뉴스 정독",point:30, co2:0.01,kw:"뉴스, 기사, 신문"},
    {id:"m45",emoji:"🎧",name:"환경 팟캐스트/유튜브",point:50,co2:0.02,kw:"팟캐스트, 유튜브, 영상, 이어폰"},
  ];
  const NEW_CHALLENGES = [
    {id:36,emoji:"🎬",title:"환경 다큐 보기",
     desc:"기후·환경 다큐를 시청하고 화면을 인증해요. (예: 비포 더 플러드, 카우스피라시, 씨스피라시)",
     tag:"📚 콘텐츠",baseParticipants:78,hot:false,missionId:"m41",freqOptions:["w3","w1"]},
    {id:37,emoji:"🎥",title:"환경 영화 관람",
     desc:"환경·생태 주제 영화를 보고 인증해요. (예: 옥자, 월-E, 아바타: 물의 길)",
     tag:"📚 콘텐츠",baseParticipants:64,hot:false,missionId:"m42",freqOptions:["w1"]},
    {id:38,emoji:"📖",title:"환경 도서 읽기",
     desc:"환경·기후 관련 책 30분 이상 독서 후 인증해요.",
     tag:"📚 콘텐츠",baseParticipants:42,hot:false,missionId:"m43",freqOptions:["daily","w5","w3"]},
    {id:39,emoji:"📰",title:"ESG 뉴스 정독",
     desc:"환경·ESG 기사 1편을 끝까지 읽고 인증해요. 매일 작은 학습이 쌓여요.",
     tag:"📚 콘텐츠",baseParticipants:91,hot:true,missionId:"m44",freqOptions:["daily","w5","w3"]},
    {id:40,emoji:"🎧",title:"환경 팟캐스트·유튜브",
     desc:"환경 주제 팟캐스트나 유튜브 영상을 시청하고 인증해요.",
     tag:"📚 콘텐츠",baseParticipants:53,hot:false,missionId:"m45",freqOptions:["daily","w5","w3"]},
  ];

  let _injected = false;
  function injectChallenges() {
    if (_injected) return true;
    try {
      if (typeof MISSIONS === 'undefined' || typeof CHALLENGES === 'undefined') return false;
      NEW_MISSIONS.forEach(m => { if (!MISSIONS.find(x => x.id === m.id)) MISSIONS.push(m); });
      NEW_CHALLENGES.forEach(c => { if (!CHALLENGES.find(x => x.id === c.id)) CHALLENGES.push(c); });
      _injected = true;
      console.log('[home_mission_patch v4] ✅ 통합 카드 + 카테고리 7개 + 콘텐츠 챌린지 5종');
      return true;
    } catch(e) {
      console.warn('[home_mission_patch v4] inject 실패', e);
      return false;
    }
  }

  /* ─── 실행 ─── */
  function run() {
    try { removeCompanyFromHome();        } catch(e){}
    try { hideOldMissionSec();            } catch(e){}
    try { hideForestTotal();              } catch(e){}
    // 지도 탭 보일 때 newcomer + todayActivity 갱신
    if (document.getElementById('page-map')?.classList.contains('on')) {
      try { renderTodayActivity(); } catch(e){}
      try { renderNewcomers();     } catch(e){}
    }
    try { installRenderHomeOverride();    } catch(e){}
    try { installRenderOfficialOverride();} catch(e){}
    try { ensureCategoryChips();          } catch(e){}
    try { addTooltips();                  } catch(e){}
    try { injectChallenges();             } catch(e){}
    // 카테고리 칩 + 콘텐츠 챌린지 적용 후 다시 그리기
    if (typeof renderOfficialChallenges === 'function') {
      try { renderOfficialChallenges(); } catch(e){}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 200));
  } else {
    setTimeout(run, 200);
  }
  [800, 1500, 3000, 5000, 8000].forEach(t => setTimeout(run, t));

  ['showApp','goPage','renderTodayQuests','loadCompanySec','loadCompanyPage']
    .forEach(fn => {
      if (typeof window[fn] !== 'function') return;
      const orig = window[fn];
      window[fn] = function (...a) {
        const r = orig.apply(this, a);
        setTimeout(run, 250);
        return r;
      };
    });

  function startObserver() {
    const home = document.getElementById('page-home');
    if (home && window.MutationObserver) {
      let pending = false;
      new MutationObserver(() => {
        if (pending) return;
        pending = true;
        setTimeout(() => {
          try { removeCompanyFromHome(); hideOldMissionSec(); addTooltips(); } catch(e){}
          pending = false;
        }, 150);
      }).observe(home, { childList: true, subtree: true });
    }
    const chal = document.getElementById('page-chal');
    if (chal && window.MutationObserver) {
      let pending2 = false;
      new MutationObserver(() => {
        if (pending2) return;
        pending2 = true;
        setTimeout(() => {
          try { ensureCategoryChips(); addTooltips(); } catch(e){}
          pending2 = false;
        }, 150);
      }).observe(chal, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(startObserver, 500));
  } else {
    setTimeout(startObserver, 500);
  }
})();
