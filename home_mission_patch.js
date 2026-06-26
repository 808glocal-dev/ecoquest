/* ================================================================
   EcoQuest – home_mission_patch.js  v5
   1. 홈 "🏢 소속 기업/단체" 강제 숨김
   2. 홈 미션 + 챌린지 통합 카드 (인증 버튼 내장)
   3. 챌린지 탭 카테고리: 카드 7개 → 탭하면 해당 챌린지만 (v5 변경: chip → card 2단계)
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

    /* ─── 챌린지 카테고리 카드 (v5) ─── */
    #ehCatNav { padding:6px 12px 2px; }
    #ehCatNav .ehBackBtn {
      background:#f0fbf4; border:1.5px solid var(--bdr); border-radius:12px;
      padding:8px 12px; font-size:13px; font-weight:700; color:var(--g2);
      cursor:pointer; font-family:inherit; white-space:nowrap;
    }
  `;
  if (!document.getElementById('home_mission_patch_style')) {
    const style = document.createElement('style');
    style.id = 'home_mission_patch_style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ─── 카테고리 정의 (카드용) ─── */
  const CATEGORIES = [
    {id:'food',      label:'먹거리',     icon:'🥗', sub:'채식 · 음식',          grad:'linear-gradient(135deg,#f6a23c,#ff7a8a)'},
    {id:'transport', label:'이동',       icon:'🚌', sub:'대중교통 · 자전거',     grad:'linear-gradient(135deg,#1565C0,#42a5f5)'},
    {id:'waste',     label:'제로웨이스트', icon:'♻️', sub:'다회용 · 재활용',       grad:'linear-gradient(135deg,#0f9b8e,#2ECC71)'},
    {id:'energy',    label:'에너지',     icon:'💡', sub:'절전 · 태양광',         grad:'linear-gradient(135deg,#f7971e,#ffc83d)'},
    {id:'nature',    label:'자연',       icon:'🌿', sub:'줍깅 · 나무 · 텃밭',    grad:'linear-gradient(135deg,#11998e,#38ef7d)'},
    {id:'learn',     label:'학습·생활',  icon:'📚', sub:'콘텐츠 · 친환경소비',    grad:'linear-gradient(135deg,#8e2de2,#b06ab3)'},
    {id:'eco10',     label:'생태십계명', icon:'✝️', sub:'10가지 생태 실천',      grad:'linear-gradient(135deg,#3a1c71,#5a4fb0)'},
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
    // 학습·생활 (콘텐츠 36~40 포함)
    18:'learn', 24:'learn', 36:'learn', 37:'learn', 38:'learn', 39:'learn', 40:'learn',
    // 생태십계명
    26:'eco10', 27:'eco10', 28:'eco10', 29:'eco10', 30:'eco10',
    31:'eco10', 32:'eco10', 33:'eco10', 34:'eco10', 35:'eco10',
  };
  // v5: null = 카테고리 카드 화면, 그 외 = 선택된 카테고리 id
  window._ehCatView = (typeof window._ehCatView === 'undefined') ? null : window._ehCatView;

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
  const TODAY_ACT_CACHE_MS = 3 * 60 * 1000;

  async function renderTodayActivity() {
    const topEl = document.getElementById('topContrib');
    if (!topEl || !window.FB?.getDocs || !window.FB?.query) return;
    try {
      const now = Date.now();
      let ranked, userMap;

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
      topEl.parentNode.insertBefore(wrap, topEl.previousElementSibling || topEl);
    } catch (e) { console.warn('[home_mission_patch] todayActivity 실패', e); }
  }

  /* ─── 3. 통합 챌린지 카드 (홈) ─── */
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

  /* ─── 4. 챌린지 탭 카테고리 카드 (v5: 카드 7개 → 상세 2단계) ─── */
  function ensureCatNav() {
    const sec = document.getElementById('sec-official');
    const grid = document.getElementById('officialGrid');
    if (!sec || !grid) return null;
    // 구버전 chip 잔재 제거
    const oldChips = document.getElementById('ehCatChips');
    if (oldChips) oldChips.remove();
    let nav = document.getElementById('ehCatNav');
    if (!nav) {
      nav = document.createElement('div');
      nav.id = 'ehCatNav';
      grid.parentNode.insertBefore(nav, grid);
    }
    return nav;
  }

  function ehChalsOfCat(catId) {
    if (typeof CHALLENGES === 'undefined') return [];
    return CHALLENGES.filter(c => CAT_MAP[c.id] === catId);
  }

  function renderCatHome() {
    const grid = document.getElementById('officialGrid');
    if (!grid) return;
    const nav = ensureCatNav();
    if (nav) nav.innerHTML = `<div style="font-size:12px;color:var(--sub);margin:2px 0 10px">🌱 관심 있는 분야를 골라보세요</div>`;

    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '10px';

    grid.innerHTML = CATEGORIES.map((cat, i) => {
      const n = ehChalsOfCat(cat.id).length;
      const isFull = (i === CATEGORIES.length - 1 && CATEGORIES.length % 2 === 1);
      if (isFull) {
        return `
        <div onclick="ehOpenCat('${cat.id}')"
          style="grid-column:1 / 3;background:${cat.grad};border-radius:18px;padding:16px 18px;cursor:pointer;color:#fff;position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;box-shadow:0 4px 14px rgba(0,0,0,.13)">
          <div style="position:absolute;right:-6px;bottom:-14px;font-size:80px;opacity:.16;line-height:1">${cat.icon}</div>
          <div style="font-size:40px;line-height:1;position:relative;z-index:1">${cat.icon}</div>
          <div style="flex:1;position:relative;z-index:1">
            <div style="font-size:17px;font-weight:900">${cat.label}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px">${cat.sub}</div>
          </div>
          <div style="position:relative;z-index:1;background:rgba(255,255,255,.22);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:700;white-space:nowrap">챌린지 ${n}개 ›</div>
        </div>`;
      }
      return `
      <div onclick="ehOpenCat('${cat.id}')"
        style="background:${cat.grad};border-radius:18px;padding:16px 14px;cursor:pointer;color:#fff;position:relative;overflow:hidden;min-height:120px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 14px rgba(0,0,0,.13)">
        <div style="position:absolute;right:-8px;bottom:-10px;font-size:72px;opacity:.16;line-height:1">${cat.icon}</div>
        <div style="position:relative;z-index:1">
          <div style="font-size:30px;line-height:1;margin-bottom:8px">${cat.icon}</div>
          <div style="font-size:16px;font-weight:900;letter-spacing:-.3px">${cat.label}</div>
          <div style="font-size:11px;opacity:.85;margin-top:2px">${cat.sub}</div>
        </div>
        <div style="position:relative;z-index:1;align-self:flex-start;background:rgba(255,255,255,.22);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;margin-top:8px">챌린지 ${n}개 ›</div>
      </div>`;
    }).join('');
  }

  async function renderCatDetail(catId) {
    const cat = CATEGORIES.find(c => c.id === catId);
    const grid = document.getElementById('officialGrid');
    if (!cat || !grid) return;

    const nav = ensureCatNav();
    if (nav) {
      nav.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin:0 0 12px">
          <button class="ehBackBtn" onclick="ehBackToCats()">← 카테고리</button>
          <div style="font-size:22px">${cat.icon}</div>
          <div>
            <div style="font-size:15px;font-weight:900;color:var(--txt)">${cat.label}</div>
            <div style="font-size:11px;color:var(--sub)">${cat.sub} · ${ehChalsOfCat(cat.id).length}개</div>
          </div>
        </div>`;
    }

    // 상세는 앱 기본 .chal-grid 반응형에 맡김
    grid.style.display = '';
    grid.style.gridTemplateColumns = '';
    grid.style.gap = '';

    const list = ehChalsOfCat(catId);
    if (!list.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--sub);font-size:13px">이 카테고리에 챌린지가 없어요</div>';
      return;
    }

    grid.innerHTML = list.map(c => `
      <div class="cg-card" onclick="openChal(${c.id})" title="${c.title}">
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
          list.forEach(c => {
            const el = document.getElementById(`chal-cnt-${c.id}`);
            if (el) { const total = counts[`c${c.id}`] || 0; if (total > 0) el.textContent = `👥 ${total.toLocaleString()}명`; }
          });
        }
      }
    } catch(e) {}
  }

  function ehRenderChalView() {
    if (window._ehCatView) renderCatDetail(window._ehCatView);
    else renderCatHome();
  }

  window.ehOpenCat = function (id) {
    window._ehCatView = id;
    ehRenderChalView();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
  };
  window.ehBackToCats = function () {
    window._ehCatView = null;
    ehRenderChalView();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
  };

  function installRenderOfficialOverride() {
    if (window._ehRenderOC_installed) return;
    window.renderOfficialChallenges = function () { ehRenderChalView(); };
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
      console.log('[home_mission_patch v5] ✅ 통합 카드 + 카테고리 카드 7개 + 콘텐츠 챌린지 5종');
      return true;
    } catch(e) {
      console.warn('[home_mission_patch v5] inject 실패', e);
      return false;
    }
  }

  /* ─── 6.5. 손상된 activeChallenges 자동 복구 ─── */
  let _migrated = false;
  async function migrateActiveChallenges() {
    if (_migrated) return;
    if (!window.ME?.uid || !window.FB?.updateDoc) return;
    if (!Array.isArray(window.UDATA?.activeChallenges)) return;
    if (typeof CHALLENGES === 'undefined') return;

    const active = window.UDATA.activeChallenges;
    let changed = false;
    const fixed = active.map(ac => {
      const chal = CHALLENGES.find(c => c.id === ac.challengeId);
      if (!chal) return ac;
      if (ac.missionId !== chal.missionId) {
        console.log(`[복구] 챌린지#${ac.challengeId} "${chal.title}" missionId: ${ac.missionId} → ${chal.missionId}`);
        changed = true;
        return { ...ac, missionId: chal.missionId, emoji: chal.emoji, challengeTitle: chal.title };
      }
      return ac;
    });

    if (changed) {
      try {
        await window.FB.updateDoc(
          window.FB.doc(window.FB.db, 'users', window.ME.uid),
          { activeChallenges: fixed }
        );
        window.UDATA.activeChallenges = fixed;
        _migrated = true;
        console.log('[복구] ✅ activeChallenges missionId 수정 완료');
        if (typeof ehRenderHomeChalls === 'function') ehRenderHomeChalls();
        if (typeof window.renderTodayQuests === 'function') {
          window.renderTodayQuests(window.ME.uid);
        }
      } catch (e) {
        console.error('[복구] 실패', e);
      }
    } else {
      _migrated = true;
    }
  }

  /* ─── 실행 ─── */
  function run() {
    try { removeCompanyFromHome();        } catch(e){}
    try { hideOldMissionSec();            } catch(e){}
    try { hideForestTotal();              } catch(e){}
    if (document.getElementById('page-map')?.classList.contains('on')) {
      try { renderTodayActivity(); } catch(e){}
      try { renderNewcomers();     } catch(e){}
    }
    try { installRenderHomeOverride();    } catch(e){}
    try { installRenderOfficialOverride();} catch(e){}
    try { injectChallenges();             } catch(e){}
    try { migrateActiveChallenges();      } catch(e){}
    // 카드 + 콘텐츠 챌린지 적용 후 챌린지 화면 다시 그리기
    try { ehRenderChalView(); } catch(e){}
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
          try {
            // chip 잔재 있으면 제거
            const oldChips = document.getElementById('ehCatChips');
            if (oldChips) oldChips.remove();
            addTooltips();
          } catch(e){}
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

  /* ─── joinChal 가드: 패치 미적용 상태 가입 차단 ─── */
  function installJoinChalGuard() {
    if (window._ehJoinChalGuarded) return;
    if (typeof window.joinChal !== 'function') return;
    const origJoin = window.joinChal;
    window.joinChal = async function(title, cid) {
      injectChallenges();
      const chal = (typeof CHALLENGES !== 'undefined') ? CHALLENGES.find(c => c.id === cid) : null;
      if (!chal) {
        console.error('[joinChal 가드] 챌린지 매칭 실패', cid);
        window.toast && window.toast('챌린지 정보 로딩 중이에요. 잠시 후 다시 시도해주세요!');
        return;
      }
      if (typeof MISSIONS === 'undefined' || !MISSIONS.find(m => m.id === chal.missionId)) {
        console.error('[joinChal 가드] 미션 매칭 실패', chal.missionId);
        window.toast && window.toast('미션 정보 로딩 중이에요. 잠시 후 다시 시도해주세요!');
        return;
      }
      return origJoin.apply(this, arguments);
    };
    window._ehJoinChalGuarded = true;
    console.log('[home_mission_patch] ✅ joinChal 가드 적용됨');
  }
  installJoinChalGuard();
  setTimeout(installJoinChalGuard, 1000);
  setTimeout(installJoinChalGuard, 3000);
})();
