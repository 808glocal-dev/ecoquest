/**
 * EcoQuest 방 챌린지 모드 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단에 추가
 *   <script src="room_mode_patch.js"></script>
 *
 * ⚠️ donation_challenge_patch.js 보다 뒤에 로드되어야 함
 *   (window.requestChallengePayment 함수에 의존)
 *
 * 기능:
 * 1. 방 만들기 모달에 "🤝 무료 응원형 / 💰 기부형" 모드 선택 추가
 * 2. 모드에 따라 예치금 단위 자동 변경 (포인트 ↔ 원)
 * 3. 기부형은 방 생성·참여 시 결제 진행
 * 4. 방 카드에 모드 뱃지 표시
 * 5. 공식 챌린지에 "💚 무료" 뱃지 추가
 *
 * 기존 방(mode 필드 없는 데이터)은 자동으로 'free'로 처리됨 (하위 호환)
 */

(function(){
  'use strict';

  let _modalInjected = false;

  // ═══════════════════════════════════════════
  // 🎨 방 만들기 모달 - 모드 선택 UI 주입
  // ═══════════════════════════════════════════
  function injectModeSelector() {
    if (_modalInjected) return;
    const depSel = document.getElementById('rDepSel');
    if (!depSel) return;
    const depGroup = depSel.closest('.form-group');
    if (!depGroup) return;

    _modalInjected = true;

    const modeGroup = document.createElement('div');
    modeGroup.className = 'form-group';
    modeGroup.id = 'roomModeGroup';
    modeGroup.innerHTML = `
      <label>방 모드</label>
      <div style="display:flex;gap:8px">
        <button type="button" id="rModeFree" onclick="window.setRoomMode('free')"
          style="flex:1;background:var(--g1);color:#fff;border:1.5px solid var(--g1);border-radius:12px;padding:12px 8px;cursor:pointer;font-family:inherit;font-weight:700;text-align:center;line-height:1.4;transition:all .15s">
          🤝<br/><span style="font-size:11px">무료 응원형</span>
        </button>
        <button type="button" id="rModeDonation" onclick="window.setRoomMode('donation')"
          style="flex:1;background:#fff;color:var(--sub);border:1.5px solid var(--bdr);border-radius:12px;padding:12px 8px;cursor:pointer;font-family:inherit;font-weight:700;text-align:center;line-height:1.4;transition:all .15s">
          💰<br/><span style="font-size:11px">기부형 <span style="color:#F39C12">+🎁</span></span>
        </button>
      </div>
      <div id="rModeDesc" style="font-size:11px;color:var(--g2);margin-top:6px;line-height:1.7;background:#f0fbf4;padding:8px 10px;border-radius:8px">
        🤝 친구끼리 무료로 응원하며 도전. 포인트만 걸어요.
      </div>
    `;
    depGroup.parentElement.insertBefore(modeGroup, depGroup);

    // 예치금 라벨에 ID 부여 (동적 변경용)
    const depLabel = depGroup.querySelector('label');
    if (depLabel) depLabel.id = 'rDepLabel';

    window._rMode = 'free';
  }

  // ═══════════════════════════════════════════
  // 🔄 모드 전환
  // ═══════════════════════════════════════════
  window.setRoomMode = function(mode) {
    window._rMode = mode;
    const freeBtn = document.getElementById('rModeFree');
    const donateBtn = document.getElementById('rModeDonation');
    const desc = document.getElementById('rModeDesc');
    const depLabel = document.getElementById('rDepLabel');

    if (mode === 'free') {
      if (freeBtn) { freeBtn.style.background = 'var(--g1)'; freeBtn.style.color = '#fff'; freeBtn.style.borderColor = 'var(--g1)'; }
      if (donateBtn) { donateBtn.style.background = '#fff'; donateBtn.style.color = 'var(--sub)'; donateBtn.style.borderColor = 'var(--bdr)'; }
      if (desc) {
        desc.style.background = '#f0fbf4';
        desc.style.color = 'var(--g2)';
        desc.innerHTML = '🤝 친구끼리 무료로 응원하며 도전. 포인트만 걸어요.';
      }
      if (depLabel) depLabel.textContent = '예치금 (포인트)';
    } else {
      if (donateBtn) { donateBtn.style.background = '#F39C12'; donateBtn.style.color = '#fff'; donateBtn.style.borderColor = '#F39C12'; }
      if (freeBtn) { freeBtn.style.background = '#fff'; freeBtn.style.color = 'var(--sub)'; freeBtn.style.borderColor = 'var(--bdr)'; }
      if (desc) {
        desc.style.background = '#fffbf0';
        desc.style.color = '#8B5E04';
        desc.innerHTML = '🎁 <b>성공하면 참가비 환급 + 보너스 받기!</b><br/>못 채운 만큼은 환경 캠페인에 의미있게 쓰여요 🌳';
      }
      if (depLabel) depLabel.textContent = '참가비 (원)';
    }
    updateDepositOptions(mode);
  };

  function updateDepositOptions(mode) {
    const depSel = document.getElementById('rDepSel');
    if (!depSel) return;
    if (mode === 'free') {
      depSel.innerHTML = `
        <button class="dep-btn on" onclick="setDep(3000,this)">3천P</button>
        <button class="dep-btn" onclick="setDep(5000,this)">5천P</button>
        <button class="dep-btn" onclick="setDep(10000,this)">1만P</button>
        <button class="dep-btn" onclick="setDep(30000,this)">3만P</button>
        <button class="dep-btn" onclick="setDep(50000,this)">5만P</button>
      `;
      window._rDep = 3000;
    } else {
      depSel.innerHTML = `
        <button class="dep-btn on" onclick="setDep(5000,this)">5천원</button>
        <button class="dep-btn" onclick="setDep(10000,this)">1만원</button>
        <button class="dep-btn" onclick="setDep(30000,this)">3만원</button>
        <button class="dep-btn" onclick="setDep(50000,this)">5만원</button>
      `;
      window._rDep = 5000;
    }
  }

  // ═══════════════════════════════════════════
  // 🏠 방 생성 (결제 통합)
  // ═══════════════════════════════════════════
  window.doCreateRoom = async function() {
    const name = document.getElementById("rNameInp").value.trim();
    if (!name) { window.toast?.("방 이름을 입력해주세요!"); return; }
    if (!window.ME) { window.toast?.("로그인이 필요해요!"); return; }

    const mode = window._rMode || 'free';
    const cidEl = document.getElementById("rChalSel");
    const cid = parseInt(cidEl.value);
    const challengeTitle = cidEl.options[cidEl.selectedIndex]?.text || "";
    const amount = window._rDep || (mode === 'donation' ? 5000 : 3000);

    // 기부형 → 결제 먼저
    if (mode === 'donation') {
      if (!window.requestChallengePayment) {
        window.toast?.('💡 결제 시스템 준비 중. donation_challenge_patch.js 확인 필요');
        return;
      }
      const paid = await window.requestChallengePayment({
        challengeId: `room_create_${Date.now()}`,
        challengeName: name,
        amount
      });
      if (!paid) return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await window.FB.addDoc(window.FB.collection(window.FB.db, "rooms"), {
        name, code, challengeId: cid, challengeTitle,
        hostUid: window.ME.uid, hostName: window.ME.displayName || "익명",
        deposit: amount,
        mode,
        isPublic: window._rPub !== false,
        members: [{uid: window.ME.uid, name: window.ME.displayName || "익명"}],
        status: "open",
        createdAt: window.FB.serverTimestamp()
      });
      window.closeOv?.("ovRoom");
      document.getElementById("rNameInp").value = "";
      navigator.clipboard.writeText(code).catch(() => {});
      window.toast?.("🎉 방 생성! 코드: " + code + " (복사됨)");
      window.loadMyRooms?.();
      window.loadPubRooms?.();
    } catch(e) {
      window.toast?.("방 만들기 실패: " + e.message);
    }
  };

  // ═══════════════════════════════════════════
  // 🚪 방 참여 (결제 통합)
  // ═══════════════════════════════════════════
  async function payIfDonationRoom(room, roomId) {
    if (room.mode !== 'donation') return true; // 무료 방은 통과
    if (!window.requestChallengePayment) {
      window.toast?.('결제 시스템 준비 중');
      return false;
    }
    return await window.requestChallengePayment({
      challengeId: `room_join_${roomId}`,
      challengeName: room.name,
      amount: room.deposit
    });
  }

  window.joinPub = async function(rid) {
    if (!window.ME) { window.toast?.("로그인이 필요해요!"); return; }
    try {
      const roomSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, "rooms", rid));
      if (!roomSnap.exists()) { window.toast?.("방을 찾을 수 없어요"); return; }
      const room = roomSnap.data();

      if (!(await payIfDonationRoom(room, rid))) return;

      await window.FB.updateDoc(window.FB.doc(window.FB.db, "rooms", rid), {
        members: window.FB.arrayUnion({uid: window.ME.uid, name: window.ME.displayName || "익명"})
      });
      window.toast?.("✅ 방에 참여했어요!");
      window.loadMyRooms?.();
      window.loadPubRooms?.();
    } catch(e) {
      window.toast?.("참여 실패: " + e.message);
    }
  };

  window.joinByCode = async function() {
    const code = document.getElementById("codeInp").value.trim().toUpperCase();
    if (code.length < 4) { window.toast?.("코드를 입력해주세요!"); return; }
    if (!window.ME) { window.toast?.("로그인이 필요해요!"); return; }
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "rooms"));
      const found = snap.docs.find(d => d.data().code === code);
      if (!found) { window.toast?.("존재하지 않는 코드예요!"); return; }
      const rd = found.data();
      if (rd.members?.some(m => m.uid === window.ME.uid)) { window.toast?.("이미 참여 중!"); return; }

      if (!(await payIfDonationRoom(rd, found.id))) return;

      await window.FB.updateDoc(window.FB.doc(window.FB.db, "rooms", found.id), {
        members: window.FB.arrayUnion({uid: window.ME.uid, name: window.ME.displayName || "익명"})
      });
      document.getElementById("codeInp").value = "";
      window.toast?.('✅ "' + rd.name + '" 방 입장!');
      window.loadMyRooms?.();
    } catch(e) {
      window.toast?.("입장 실패: " + e.message);
    }
  };

  // ═══════════════════════════════════════════
  // 🎫 방 카드 렌더링 (모드 뱃지 포함)
  // ═══════════════════════════════════════════
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function modeBadge(mode) {
    return mode === 'donation'
      ? '<span style="background:#fffbf0;color:#F39C12;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;margin-left:6px;border:1px solid #F39C12">💰 기부형 +🎁</span>'
      : '<span style="background:#f0fbf4;color:var(--g2);font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;margin-left:6px">🤝 무료</span>';
  }

  window.loadMyRooms = async function() {
    if (!window.ME) return;
    const w = document.getElementById("myRoomList");
    if (!w) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "rooms"));
      const mine = snap.docs
        .filter(d => d.data().members?.some(m => m.uid === window.ME.uid))
        .map(d => ({id: d.id, ...d.data()}))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      if (!mine.length) {
        w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:13px">참여 중인 방이 없어요!</div>';
        return;
      }
      w.innerHTML = mine.map(r => {
        const mode = r.mode || 'free';
        const unit = mode === 'donation' ? '원' : 'P';
        return `<div class="room-card">
          <div class="room-name">👥 ${escapeHtml(r.name)}${modeBadge(mode)}</div>
          <div class="room-meta">${escapeHtml(r.challengeTitle || '')} · ${r.members?.length || 1}명 · ${(r.deposit || 0).toLocaleString()}${unit}</div>
          <div class="room-members">${(r.members || []).map(m => `<span class="member-chip">${escapeHtml(m.name)}</span>`).join("")}</div>
          <div class="room-code-row">
            <div>🔑 <span class="room-code">${escapeHtml(r.code)}</span></div>
            <button class="btn btn-g btn-sm" onclick="navigator.clipboard.writeText('${escapeHtml(r.code)}').then(()=>toast('코드 복사됐어요!'))">복사</button>
          </div>
        </div>`;
      }).join("");
    } catch(e) {}
  };

  window.loadPubRooms = async function() {
    const w = document.getElementById("pubRoomList");
    if (!w) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "rooms"));
      const rooms = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(r => r.isPublic !== false)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 10);

      if (!rooms.length) {
        w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:13px">공개 방이 없어요!</div>';
        return;
      }
      w.innerHTML = rooms.map(r => {
        const mode = r.mode || 'free';
        const unit = mode === 'donation' ? '원' : 'P';
        const joined = r.members?.some(m => m.uid === window.ME?.uid);
        return `<div class="room-card" style="border-color:${joined ? 'var(--g1)' : 'var(--bdr)'}">
          <div class="room-name">👥 ${escapeHtml(r.name)}${modeBadge(mode)}</div>
          <div class="room-meta">${escapeHtml(r.challengeTitle || '')} · ${r.members?.length || 1}명 · ${(r.deposit || 0).toLocaleString()}${unit}</div>
          <button class="btn ${joined ? 'btn-gray' : 'btn-b'}" style="margin-top:6px;padding:10px" onclick="${joined ? `toast('이미 참여 중!')` : `joinPub('${r.id}')`}">
            ${joined ? '✅ 참여 중' : (mode === 'donation' ? '🎁 도전하고 보상받기' : '참여하기')}
          </button>
        </div>`;
      }).join("");
    } catch(e) {}
  };

  // ═══════════════════════════════════════════
  // 💚 공식 챌린지에 "무료" 뱃지 추가
  // ═══════════════════════════════════════════
  function addFreeBadgesToOfficial() {
    const cards = document.querySelectorAll('#officialGrid .cg-card');
    cards.forEach(card => {
      if (card.dataset.freeBadged === 'true') return;
      const img = card.querySelector('.cg-img');
      if (!img) return;
      card.dataset.freeBadged = 'true';
      const badge = document.createElement('span');
      badge.style.cssText = 'position:absolute;bottom:6px;right:6px;background:#e8f5e9;color:var(--g2);font-size:9px;font-weight:700;padding:2px 7px;border-radius:6px;border:1.5px solid var(--g1);z-index:2';
      badge.innerHTML = '💚 무료';
      img.appendChild(badge);
    });
  }

  if (window.renderOfficialChallenges) {
    const orig = window.renderOfficialChallenges;
    window.renderOfficialChallenges = async function(...args) {
      const r = await orig.apply(this, args);
      setTimeout(addFreeBadgesToOfficial, 50);
      setTimeout(addFreeBadgesToOfficial, 500);
      return r;
    };
  }

  // ═══════════════════════════════════════════
  // 🚀 초기화
  // ═══════════════════════════════════════════
  function init() {
    injectModeSelector();
    setTimeout(injectModeSelector, 200);
    setTimeout(injectModeSelector, 1000);
    setTimeout(addFreeBadgesToOfficial, 500);
    setTimeout(addFreeBadgesToOfficial, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // MutationObserver - 동적 렌더링 대응
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      addFreeBadgesToOfficial();
      injectModeSelector();
    });
    if (document.body) {
      observer.observe(document.body, {childList: true, subtree: true});
    }
  }

  console.log('%c[RoomMode] 패치 활성화 ✓ (무료/기부형 방 지원)', 'color:#2ECC71;font-weight:bold');
})();
