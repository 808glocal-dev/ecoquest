/* ================================================================
   EcoQuest – home_mission_patch.js  v3
   1. 홈 "🏢 소속 기업/단체" CSS 강제 숨김
   2. "⚡ 오늘의 미션" 섹션(missionScroll) 숨김 — 챌린지 카드와 통합
   3. "참여 중인 챌린지" 카드 재설계: 카드 안에 "📸 오늘 인증하기" 버튼
      → 미션과 챌린지가 한 카드로 통합. 누르는 곳 명확.
   4. 카드 hover tooltip
   5. 환경 콘텐츠 챌린지 5종 추가 (m41~m45 / id 36~40)
   ================================================================ */
(function () {
  'use strict';

  /* ─── CSS injection ─── */
  const css = `
    /* 홈에서 기업/단체 섹션 강제 숨김 (별도 '소속' 탭에 있음) */
    #page-home #companySec,
    #page-home #companyBox,
    #page-home #companyPageBox,
    #page-home #companySection,
    #page-home #homeCompanySection { display: none !important; }

    /* 기존 "⚡ 오늘의 미션" 섹션 헤더+스크롤 숨김 (챌린지 카드와 통합되었으므로) */
    #page-home #missionScroll,
    #page-home .sec.eh-old-mission-sec { display: none !important; }

    /* 통합 챌린지 카드 */
    .ehChalCard {
      background: #fff;
      border-radius: 16px;
      padding: 14px;
      margin: 0 12px 10px;
      border: 1.5px solid var(--g1);
      box-shadow: 0 2px 10px rgba(46,204,113,.12);
    }
    .ehChalCard.done { border-color: #a8f0c6; background: #f8fdf9; }

    .ehChalHead {
      display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
    }
    .ehChalEmoji { font-size: 36px; line-height: 1; }
    .ehChalInfo { flex: 1; min-width: 0; }
    .ehChalTitle {
      font-size: 14px; font-weight: 900; color: var(--txt);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .ehChalMeta { font-size: 11px; color: var(--sub); margin-top: 2px; }
    .ehChalCount {
      text-align: right; flex-shrink: 0;
    }
    .ehChalCountN { font-size: 14px; font-weight: 900; color: var(--g2); }
    .ehChalCountP { font-size: 10px; color: var(--sub); }

    .ehBar {
      background: #e0f2e7; border-radius: 6px; height: 6px;
      overflow: hidden; margin-bottom: 12px;
    }
    .ehBarFill {
      height: 100%; border-radius: 6px;
      background: linear-gradient(90deg, var(--g1), var(--acc));
      transition: width .5s;
    }

    .ehVerifyBtn {
      width: 100%;
      background: linear-gradient(135deg, var(--g1), var(--g2));
      color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 14px; font-weight: 900;
      cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: 0 4px 14px rgba(46,204,113,.35);
      animation: ehVerifPulse 1.8s ease-in-out infinite;
      transition: transform .1s;
    }
    .ehVerifyBtn:active { transform: scale(.97); }
    .ehVerifyBtn .ehSub {
      font-size: 11px; opacity: .9; font-weight: 700;
    }
    @keyframes ehVerifPulse {
      0%, 100% { box-shadow: 0 4px 14px rgba(46,204,113,.35); }
      50%      { box-shadow: 0 6px 22px rgba(46,204,113,.55); }
    }

    .ehDoneBox {
      background: #f0fbf4;
      border: 1.5px solid var(--g1);
      border-radius: 12px;
      padding: 14px;
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      color: var(--g2);
    }
    .ehDoneBox .ehSm { font-size: 11px; color: var(--sub); font-weight: 600; margin-top: 2px; }

    .ehCancel {
      background: none; color: var(--sub);
      border: none; font-size: 11px;
      cursor: pointer; font-family: inherit;
      text-decoration: underline;
      padding: 6px 0;
      margin-top: 4px;
      display: block; margin-left: auto;
    }
    .ehCancel:hover { color: var(--red); }

    .ehEmpty {
      background: #fff; border-radius: 14px;
      padding: 20px 16px; margin: 0 12px 10px;
      border: 1.5px dashed var(--bdr); text-align: center;
    }
    .ehEmpty .ehEmojiBig { font-size: 36px; margin-bottom: 10px; }
    .ehEmpty .ehTxt { font-size: 14px; font-weight: 800; color: var(--txt); margin-bottom: 4px; }
    .ehEmpty .ehSub2 { font-size: 12px; color: var(--sub); margin-bottom: 14px; }
    .ehEmpty .ehGoBtn {
      background: linear-gradient(135deg, var(--g1), var(--g2));
      color: #fff; border: none; border-radius: 12px;
      padding: 12px 24px; font-size: 14px; font-weight: 900;
      cursor: pointer; font-family: inherit;
    }
  `;
  if (!document.getElementById('home_mission_patch_style')) {
    const style = document.createElement('style');
    style.id = 'home_mission_patch_style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ─── 1. 홈 기업 섹션 JS 제거 (CSS 보조) ─── */
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

  /* ─── 2. "⚡ 오늘의 미션" sec 헤더에 클래스 추가해서 CSS로 숨김 ─── */
  function hideOldMissionSec() {
    const ms = document.getElementById('missionScroll');
    if (!ms) return;
    const prev = ms.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('sec')) {
      prev.classList.add('eh-old-mission-sec');
    }
  }

  /* ─── 3. 통합 챌린지 카드 재설계 (renderHomeChalls 오버라이드) ─── */
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

  // 원본 renderHomeChalls를 우리 버전으로 교체
  function installRenderOverride() {
    if (window._ehRenderHomeChalls_installed) return;
    window.renderHomeChalls = ehRenderHomeChalls;
    window._ehRenderHomeChalls_installed = true;
    // 즉시 한 번 그려보기
    try { ehRenderHomeChalls(); } catch(e){}
  }

  /* ─── 4. tooltip ─── */
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

  /* ─── 5. 환경 콘텐츠 챌린지 추가 ─── */
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
      if (typeof renderOfficialChallenges === 'function') renderOfficialChallenges();
      _injected = true;
      console.log('[home_mission_patch v3] ✅ 환경 콘텐츠 챌린지 5종 추가 + 카드 통합 완료');
      return true;
    } catch (e) {
      console.warn('[home_mission_patch v3] inject 실패:', e);
      return false;
    }
  }

  /* ─── 실행 ─── */
  function run() {
    try { removeCompanyFromHome(); } catch(e){}
    try { hideOldMissionSec();    } catch(e){}
    try { installRenderOverride();} catch(e){}
    try { addTooltips();          } catch(e){}
    try { injectChallenges();     } catch(e){}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 200));
  } else {
    setTimeout(run, 200);
  }
  [800, 1500, 3000, 5000, 8000].forEach(t => setTimeout(run, t));

  // 함수 후크 — 페이지 전환·렌더 후 자동 재적용
  ['showApp','goPage','renderOfficialChallenges','renderTodayQuests','loadCompanySec','loadCompanyPage']
    .forEach(fn => {
      if (typeof window[fn] !== 'function') return;
      const orig = window[fn];
      window[fn] = function (...a) {
        const r = orig.apply(this, a);
        setTimeout(run, 250);
        return r;
      };
    });

  // page-home 변경 감지 → 즉시 재정리
  function startObserver() {
    const home = document.getElementById('page-home');
    if (!home || !window.MutationObserver) return;
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(startObserver, 500));
  } else {
    setTimeout(startObserver, 500);
  }
})();
