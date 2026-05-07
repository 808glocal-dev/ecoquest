/**
 * EcoQuest 공식 기부형 챌린지 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단에 추가 (room_mode_patch.js 다음)
 *   <script src="donation_official_challenges_patch.js"></script>
 *
 * 기능:
 * 1. "준비중" 가림 제거 → 방 챌린지 다시 활성화
 * 2. 방 챌린지 탭 상단에 "공식 기부형 챌린지" 섹션 추가
 * 3. 2~4주 장기 챌린지 4종 카드 표시
 * 4. 카드 클릭 → 모달 → 참가비 선택 → 결제 → Firestore 저장
 *
 * 의존성: donation_challenge_patch.js (window.requestChallengePayment 필요)
 */

(function(){
  'use strict';

  // ═══════════════════════════════════════════
  // 📋 공식 기부형 챌린지 (4종)
  // ═══════════════════════════════════════════
  const DONATION_CHALLENGES = [
    {
      id: 'd-tumbler-2w',
      emoji: '🥤',
      title: '카페 텀블러 챌린지',
      description: '2주 동안 카페에서 일회용컵 대신 텀블러로 음료 받기',
      weeks: 2,
      missionsPerWeek: 5,
      totalMissions: 10,
      co2PerMission: 0.05,
      hint: '바리스타가 텀블러에 음료를 따라주는 사진 또는 텀블러+영수증',
      hot: true
    },
    {
      id: 'd-container-3w',
      emoji: '🥡',
      title: '용기내 챌린지',
      description: '3주 동안 포장·배달 시 다회용기 사용하기',
      weeks: 3,
      missionsPerWeek: 3,
      totalMissions: 9,
      co2PerMission: 0.15,
      hint: '내가 가져간 다회용기에 담긴 음식 사진',
      hot: false
    },
    {
      id: 'd-transit-3w',
      emoji: '🚌',
      title: '대중교통 출퇴근 챌린지',
      description: '3주 동안 자가용 대신 대중교통으로 이동하기',
      weeks: 3,
      missionsPerWeek: 5,
      totalMissions: 15,
      co2PerMission: 1.5,
      hint: '교통카드 결제 화면 또는 버스/지하철 내부 사진',
      hot: false
    },
    {
      id: 'd-vegan-4w',
      emoji: '🥗',
      title: '비건 한 끼 챌린지',
      description: '4주 동안 주 3회 채식 한 끼 실천하기',
      weeks: 4,
      missionsPerWeek: 3,
      totalMissions: 12,
      co2PerMission: 0.8,
      hint: '채식으로 차려진 식사 사진 (고기·생선·달걀·유제품 X)',
      hot: false
    }
  ];

  const FEE_OPTIONS = [5000, 10000, 20000, 30000]; // 원

  // ═══════════════════════════════════════════
  // 🎨 스타일 주입
  // ═══════════════════════════════════════════
  function injectStyles() {
    if (document.getElementById('dc-official-styles')) return;
    const style = document.createElement('style');
    style.id = 'dc-official-styles';
    style.textContent = `
      .dc-section { margin: 0 12px 16px; }
      .dc-sec-header { display: flex; align-items: center; justify-content: space-between; margin: 12px 0 8px; }
      .dc-sec-title { font-size: 15px; font-weight: 900; color: #8B5E04; display: flex; align-items: center; gap: 4px; }
      .dc-sec-sub { font-size: 11px; color: var(--sub); margin-bottom: 10px; line-height: 1.6; }
      .dc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .dc-card { background: linear-gradient(135deg, #fffbf0, #fff8e1); border: 1.5px solid #F39C12; border-radius: 14px; padding: 10px; cursor: pointer; transition: transform .15s, box-shadow .15s; position: relative; overflow: hidden; }
      .dc-card:active { transform: scale(0.97); box-shadow: 0 4px 12px rgba(243,156,18,0.2); }
      .dc-card-emoji { font-size: 36px; text-align: center; padding: 8px 0 4px; }
      .dc-card-title { font-size: 13px; font-weight: 900; color: #8B5E04; line-height: 1.3; margin-bottom: 4px; }
      .dc-card-meta { font-size: 11px; color: var(--sub); line-height: 1.5; }
      .dc-card-hot { position: absolute; top: 6px; right: 6px; background: #e74c3c; color: #fff; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 6px; }
      .dc-card-bonus { position: absolute; top: 6px; left: 6px; background: #F39C12; color: #fff; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 6px; }
      .dc-fee-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; }
      .dc-fee-btn { padding: 12px 8px; border-radius: 10px; border: 1.5px solid var(--bdr); background: #fff; color: var(--txt); font-weight: 700; font-family: inherit; cursor: pointer; transition: all .15s; }
      .dc-fee-btn.on { background: #F39C12; color: #fff; border-color: #F39C12; }
      .dc-reward-box { background: #fff; border: 2px solid #F39C12; border-radius: 12px; padding: 12px; margin: 12px 0; box-shadow: 0 2px 6px rgba(243,156,18,0.12); }
      .dc-reward-line { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 13px; }
      .dc-reward-total { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; margin-top: 4px; border-top: 2px solid #F39C12; font-size: 14px; }
      .dc-info-row { font-size: 11px; color: var(--sub); padding: 4px 0; line-height: 1.6; }
      .dc-info-label { color: #8B5E04; font-weight: 700; min-width: 60px; display: inline-block; }
    `;
    document.head.appendChild(style);
  }

  // ═══════════════════════════════════════════
  // 🛠️ sec-room 보장 (없으면 생성, 비어있으면 채움)
  // ═══════════════════════════════════════════
  function ensureSecRoom() {
    let sec = document.getElementById('sec-room');

    if (!sec) {
      // sec-room 자체가 없음 → 생성
      const chalPage = document.getElementById('page-chal')
        || document.getElementById('page-challenge')
        || document.querySelector('.page[id*="chal"]');
      if (!chalPage) return null;
      sec = document.createElement('div');
      sec.id = 'sec-room';
      sec.style.display = 'none';
      chalPage.appendChild(sec);
    }

    // 비어있으면 기본 방 챌린지 UI 복구
    if (sec.children.length === 0 || !document.getElementById('myRoomList')) {
      // 기존 자식들 보존 후 재구성
      sec.innerHTML = `
        <div class="payback-info" style="margin:12px"></div>

        <div class="sec" style="margin-top:12px"><div class="sec-t">👥 친구·동료와 함께</div></div>
        <div style="margin:0 12px 12px">
          <button class="btn btn-b" style="width:100%;padding:14px;font-size:14px" onclick="openCreateRoom()">
            ➕ 새 방 만들기
          </button>
        </div>

        <div class="sec"><div class="sec-t">📌 내가 참여중인 방</div></div>
        <div id="myRoomList" style="margin:0 12px"></div>

        <div class="sec" style="margin-top:12px"><div class="sec-t">🌍 공개된 방</div></div>
        <div id="pubRoomList" style="margin:0 12px"></div>

        <div class="sec" style="margin-top:12px"><div class="sec-t">🔑 코드로 입장</div></div>
        <div style="margin:0 12px 12px;display:flex;gap:6px">
          <input class="inp" id="codeInp" placeholder="방 코드 입력 (6자리)" style="flex:1;text-transform:uppercase"/>
          <button class="btn btn-g" onclick="joinByCode()">입장</button>
        </div>
      `;
    }

    return sec;
  }

  // ═══════════════════════════════════════════
  // 🧹 "준비중" 가림 제거
  // ═══════════════════════════════════════════
  function clearPreparingOverlay() {
    // sec-room 강제 표시
    const sec = document.getElementById('sec-room');
    if (sec) {
      sec.style.removeProperty('opacity');
      sec.style.removeProperty('filter');
      sec.style.removeProperty('pointer-events');
      sec.classList.remove('hidden', 'disabled', 'preparing');
    }

    // chal page 안의 "준비중" 텍스트 가진 요소 숨김
    const chalPage = document.getElementById('page-chal') || document.getElementById('page-challenge');
    if (chalPage) {
      chalPage.querySelectorAll('div, p, span, h2, h3').forEach(el => {
        if (el.dataset.dcCleared) return;
        // dc-official-section 안의 "준비중"은 무시 (오탐 방지)
        if (el.closest('#dc-official-section')) return;
        const text = (el.textContent || '').trim();
        if (text.length < 80 && /^[\s🚧⏳]*준비\s*중|coming\s*soon|업데이트\s*예정[\s.…]*$/i.test(text)) {
          el.dataset.dcCleared = 'true';
          el.style.display = 'none';
        }
      });
    }
  }

  // ═══════════════════════════════════════════
  // 📝 공식 기부형 섹션 주입 (sec-room 상단)
  // ═══════════════════════════════════════════
  function injectDonationSection() {
    const secRoom = ensureSecRoom();
    if (!secRoom) return;
    if (document.getElementById('dc-official-section')) return;

    const wrap = document.createElement('div');
    wrap.id = 'dc-official-section';
    wrap.className = 'dc-section';
    wrap.innerHTML = `
      <div class="dc-sec-header">
        <div class="dc-sec-title">🎁 공식 기부형 챌린지</div>
      </div>
      <div class="dc-sec-sub">2~4주 장기 챌린지 · 성공하면 환급+보너스, 못 채운 만큼은 환경 캠페인에 사용</div>
      <div class="dc-grid" id="dc-grid"></div>
    `;

    // sec-room 맨 앞에 삽입
    secRoom.insertBefore(wrap, secRoom.firstChild);

    // 카드 렌더
    const grid = document.getElementById('dc-grid');
    grid.innerHTML = DONATION_CHALLENGES.map(c => `
      <div class="dc-card" onclick="window.openDonationChallenge('${c.id}')">
        ${c.hot ? '<span class="dc-card-hot">HOT</span>' : ''}
        <span class="dc-card-bonus">+🎁</span>
        <div class="dc-card-emoji">${c.emoji}</div>
        <div class="dc-card-title">${c.title}</div>
        <div class="dc-card-meta">${c.weeks}주 · 주 ${c.missionsPerWeek}회<br/>총 ${c.totalMissions}회 인증</div>
      </div>
    `).join('');
  }

  // ═══════════════════════════════════════════
  // 💬 모달 HTML 주입
  // ═══════════════════════════════════════════
  function injectModalHtml() {
    if (document.getElementById('ovDonationChal')) return;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'ovDonationChal';
    ov.innerHTML = `
      <div class="modal" style="max-width:380px">
        <div class="handle" onclick="closeOv('ovDonationChal')"></div>
        <button class="modal-close" onclick="closeOv('ovDonationChal')">✕</button>
        <div id="dcModalContent"></div>
      </div>
    `;
    document.body.appendChild(ov);
  }

  // ═══════════════════════════════════════════
  // 🪟 챌린지 상세 모달 열기
  // ═══════════════════════════════════════════
  let _selectedFee = FEE_OPTIONS[1]; // 기본 1만원
  let _currentChallenge = null;

  window.openDonationChallenge = function(id) {
    const c = DONATION_CHALLENGES.find(x => x.id === id);
    if (!c) return;
    _currentChallenge = c;
    _selectedFee = FEE_OPTIONS[1];

    injectModalHtml();

    const content = document.getElementById('dcModalContent');
    if (!content) return;

    const totalCo2 = (c.totalMissions * c.co2PerMission).toFixed(1);

    content.innerHTML = `
      <div style="text-align:center;padding-top:8px">
        <div style="font-size:48px">${c.emoji}</div>
        <div style="font-size:18px;font-weight:900;color:#8B5E04;margin-top:4px">${c.title}</div>
      </div>

      <div style="background:#fffbf0;border-radius:10px;padding:10px 12px;margin:12px 0;font-size:12px;color:#8B5E04;line-height:1.6">
        ${c.description}
      </div>

      <div style="background:#fff;border:1px solid var(--bdr);border-radius:10px;padding:10px 12px;margin-bottom:12px">
        <div class="dc-info-row"><span class="dc-info-label">📅 기간</span> ${c.weeks}주 (${c.weeks * 7}일)</div>
        <div class="dc-info-row"><span class="dc-info-label">🎯 미션</span> 주 ${c.missionsPerWeek}회 · 총 ${c.totalMissions}회</div>
        <div class="dc-info-row"><span class="dc-info-label">🌳 절감</span> 약 ${totalCo2}kg CO₂ (100% 성공 시)</div>
        <div class="dc-info-row"><span class="dc-info-label">📸 인증</span> ${c.hint}</div>
      </div>

      <div style="font-size:13px;font-weight:900;color:var(--txt);margin-bottom:6px">💰 참가비 선택</div>
      <div class="dc-fee-grid" id="dcFeeGrid">
        ${FEE_OPTIONS.map(f => `
          <button class="dc-fee-btn ${f === _selectedFee ? 'on' : ''}" onclick="window._dcSelectFee(${f}, this)">
            ${f.toLocaleString()}원
          </button>
        `).join('')}
      </div>

      <div class="dc-reward-box" id="dcRewardBox"></div>

      <div style="background:#f0fbf4;border-radius:10px;padding:10px;margin:8px 0;font-size:11px;color:var(--g2);line-height:1.7">
        🌳 <b>못 채운 만큼은 환경에 의미있게</b><br/>
        <span style="color:var(--sub);font-weight:500">제로웨이스트 매장 협업 · 나무심기 · 환경 NGO 후원</span><br/>
        <span style="color:var(--sub);font-weight:500;font-size:10px">앱 운영비 1% 미만 — 99% 이상이 환경에</span>
      </div>

      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-gray" style="flex:1" onclick="closeOv('ovDonationChal')">취소</button>
        <button class="btn" style="flex:2;background:#F39C12;color:#fff" onclick="window.submitDonationChallenge()">🎁 도전하고 보상받기</button>
      </div>
    `;

    updateRewardBox();
    window.openOv?.('ovDonationChal');
  };

  window._dcSelectFee = function(fee, btn) {
    _selectedFee = fee;
    document.querySelectorAll('#dcFeeGrid .dc-fee-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    updateRewardBox();
  };

  function updateRewardBox() {
    const box = document.getElementById('dcRewardBox');
    if (!box) return;
    const fee = _selectedFee;
    const minBonus = Math.round(fee * 0.10);
    const maxBonus = Math.round(fee * 0.30);
    const minTotal = fee + minBonus;
    const maxTotal = fee + maxBonus;

    box.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:#8B5E04;margin-bottom:6px">💡 100% 성공 시 받는 돈</div>
      <div class="dc-reward-line">
        <span style="color:var(--sub)">참가비 환급</span>
        <span style="font-weight:900;color:var(--txt)">${fee.toLocaleString()}원</span>
      </div>
      <div class="dc-reward-line">
        <span style="color:var(--sub)">🎁 보너스 추가</span>
        <span style="font-weight:900;color:#F39C12">+ ${minBonus.toLocaleString()}~${maxBonus.toLocaleString()}원</span>
      </div>
      <div class="dc-reward-total">
        <span style="font-weight:700;color:#8B5E04">총 받는 돈</span>
        <span style="font-weight:900;color:#F39C12;font-size:15px">≈ ${minTotal.toLocaleString()}~${maxTotal.toLocaleString()}원 ✨</span>
      </div>
    `;
  }

  // ═══════════════════════════════════════════
  // 💳 참여하기 (결제 → Firestore 저장)
  // ═══════════════════════════════════════════
  window.submitDonationChallenge = async function() {
    if (!_currentChallenge) return;
    if (!window.ME) { window.toast?.('로그인이 필요해요!'); return; }

    if (!window.requestChallengePayment) {
      window.toast?.('결제 시스템 준비 중. donation_challenge_patch.js 확인 필요');
      return;
    }

    const c = _currentChallenge;
    const fee = _selectedFee;

    // 결제 진행
    const paid = await window.requestChallengePayment({
      challengeId: c.id,
      challengeName: c.title,
      amount: fee
    });

    if (!paid) return;

    // Firestore 저장
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + c.weeks * 7);

      await window.FB.addDoc(window.FB.collection(window.FB.db, 'donation_participations'), {
        uid: window.ME.uid,
        nickname: window.UDATA?.nickname || window.ME.displayName || '지구지킴이',
        challengeId: c.id,
        challengeTitle: c.title,
        challengeEmoji: c.emoji,
        weeks: c.weeks,
        totalMissions: c.totalMissions,
        missionsPerWeek: c.missionsPerWeek,
        co2PerMission: c.co2PerMission,
        fee,
        startDate: window.FB.serverTimestamp(),
        endDateMs: endDate.getTime(),
        progress: 0,
        completedMissions: 0,
        status: 'active',
        createdAt: window.FB.serverTimestamp()
      });

      window.closeOv?.('ovDonationChal');
      window.toast?.('🎉 챌린지 참여 완료! 화이팅 🌱');

      // 내 진행중 챌린지 다시 로드
      setTimeout(loadMyDonationChallenges, 500);
    } catch(e) {
      console.error('[DonationChal Save]', e);
      window.toast?.('저장 실패: ' + e.message);
    }
  };

  // ═══════════════════════════════════════════
  // 📋 내 진행중 챌린지 로드 (간단 표시)
  // ═══════════════════════════════════════════
  async function loadMyDonationChallenges() {
    if (!window.ME || !window.FB) return;
    const section = document.getElementById('dc-official-section');
    if (!section) return;

    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'donation_participations'));
      const mine = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(p => p.uid === window.ME.uid && p.status === 'active')
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      // 기존 표시 제거
      const old = document.getElementById('dc-my-active');
      if (old) old.remove();

      if (!mine.length) return;

      const myBox = document.createElement('div');
      myBox.id = 'dc-my-active';
      myBox.style.cssText = 'background:#fff;border:1.5px solid var(--g1);border-radius:12px;padding:10px 12px;margin-bottom:12px';
      myBox.innerHTML = `
        <div style="font-size:12px;font-weight:900;color:var(--g2);margin-bottom:8px">🌱 내 진행중 챌린지 (${mine.length})</div>
        ${mine.map(p => {
          const remainDays = Math.max(0, Math.ceil((p.endDateMs - Date.now()) / 86400000));
          const progress = Math.round(((p.completedMissions || 0) / p.totalMissions) * 100);
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-top:1px solid #f0f0f0">
              <div style="font-size:24px">${p.challengeEmoji}</div>
              <div style="flex:1">
                <div style="font-size:12px;font-weight:700;color:var(--txt)">${p.challengeTitle}</div>
                <div style="font-size:10px;color:var(--sub)">D-${remainDays} · ${p.completedMissions || 0}/${p.totalMissions}회 (${progress}%)</div>
              </div>
              <div style="font-size:11px;font-weight:900;color:#F39C12">${p.fee?.toLocaleString()}원</div>
            </div>
          `;
        }).join('')}
      `;
      section.appendChild(myBox);
    } catch(e) {
      console.warn('[DonationChal Load]', e);
    }
  }

  // ═══════════════════════════════════════════
  // 🚀 초기화
  // ═══════════════════════════════════════════
  function init() {
    injectStyles();
    clearPreparingOverlay();
    injectDonationSection();
    injectModalHtml();
    setTimeout(loadMyDonationChallenges, 800);
  }

  function reapply() {
    clearPreparingOverlay();
    injectDonationSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 페이지 전환 시 재시도
  if (window.goPage) {
    const orig = window.goPage;
    window.goPage = function(...args) {
      const r = orig.apply(this, args);
      setTimeout(reapply, 100);
      setTimeout(() => loadMyDonationChallenges(), 600);
      return r;
    };
  }

  // 챌린지 탭 클릭 시 — 방 챌린지를 강제로 살림
  const _origGoSec = window.goSec;
  window.goSec = function(name) {
    // 1) 원본 goSec 시도 (있으면)
    if (_origGoSec) {
      try { _origGoSec(name); } catch(e) {}
    }

    // 2) 모든 sec-* 숨김
    document.querySelectorAll('[id^="sec-"]').forEach(s => {
      s.style.display = 'none';
    });

    // 3) 선택된 탭 보장
    if (name === 'room') {
      const sec = ensureSecRoom();
      if (sec) {
        sec.style.setProperty('display', 'block', 'important');
        clearPreparingOverlay();
        injectDonationSection();
        // 방 데이터 로드
        setTimeout(() => {
          window.loadMyRooms?.();
          window.loadPubRooms?.();
          loadMyDonationChallenges();
        }, 100);
      }
    } else {
      const sec = document.getElementById('sec-' + name);
      if (sec) sec.style.display = 'block';
    }

    // 4) 탭 버튼 active 상태
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name)?.classList.add('active');
  };

  // 탭 버튼 직접 클릭 리스너 (백업)
  function bindTabRoomClick() {
    const tabRoom = document.getElementById('tab-room');
    if (!tabRoom || tabRoom.dataset.dcBound) return;
    tabRoom.dataset.dcBound = 'true';
    tabRoom.addEventListener('click', (e) => {
      // onclick의 goSec과 충돌 방지: 약간 딜레이
      setTimeout(() => window.goSec('room'), 10);
    });
  }
  setInterval(bindTabRoomClick, 1500);
  setTimeout(bindTabRoomClick, 100);
  setTimeout(bindTabRoomClick, 1000);

  // MutationObserver
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      reapply();
    });
    if (document.body) {
      observer.observe(document.body, {childList: true, subtree: true});
    }
  }

  console.log('%c[공식 기부형] 패치 활성화 ✓ (4개 챌린지 등록)', 'color:#F39C12;font-weight:bold');
})();
