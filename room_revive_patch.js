// room_revive_patch.js - 방 챌린지 부활 + 상세페이지 + 전용피드
(function(){

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. "준비중" 토스트 제거 → 실제 탭 전환
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function enableRoomTab(){
    const roomTab = document.getElementById('ctab-room');
    if(!roomTab) return;
    
    roomTab.onclick = null;
    roomTab.removeAttribute('onclick');
    
    const badge = roomTab.querySelector('span[style*="F39C12"]');
    if(badge) badge.remove();
    
    roomTab.onclick = () => {
      if(typeof window.setCTab === 'function'){
        window.setCTab('room');
      }
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. 방 만들기 모달 - 예치금 제거
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function hideDepositInModal(){
    const modal = document.getElementById('ovRoom');
    if(!modal) return;
    
    const depositGroup = modal.querySelector('#rDepSel');
    if(depositGroup){
      const parent = depositGroup.closest('.form-group');
      if(parent) parent.style.display = 'none';
    }
    
    window._rDep = 0;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. 페이백 안내 → 방 챌린지 소개로 교체
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function replacePaybackInfo(){
    const secRoom = document.getElementById('sec-room');
    if(!secRoom) return;
    
    const paybackBox = secRoom.querySelector('.payback-info');
    if(paybackBox){
      paybackBox.outerHTML = `
        <div style="
          margin:12px;
          background:linear-gradient(135deg,#e8f5e9,#f0fbf4);
          border-radius:14px;padding:14px;
          border:1.5px solid var(--g1);
        ">
          <div style="font-size:14px;font-weight:900;color:var(--g2);margin-bottom:8px">
            👥 방 챌린지란?
          </div>
          <div style="font-size:12px;color:var(--txt);line-height:1.8">
            회사, 성당, 가족, 친구들과 함께<br/>
            환경 실천을 공유하고 응원해요!
          </div>
          <div style="
            margin-top:10px;padding:10px;
            background:#fff;border-radius:10px;
            font-size:11px;color:var(--sub);line-height:1.8;
          ">
            ✨ 초대 코드로 멤버 모집<br/>
            💚 함께 완주 시 특별 뱃지<br/>
            📸 우리끼리 인증샷 공유<br/>
            🏆 방 전체 CO₂ 절감량 확인
          </div>
        </div>
      `;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. 방 만들기 (예치금 없이)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.doCreateRoom = async () => {
    const name = document.getElementById("rNameInp")?.value.trim();
    if(!name){
      if(window.toast) window.toast("방 이름을 입력해주세요!");
      return;
    }
    if(!window.ME){
      if(window.toast) window.toast("로그인이 필요해요!");
      return;
    }
    
    const cid = parseInt(document.getElementById("rChalSel")?.value);
    const chal = window.CHALLENGES?.find(c => c.id === cid) 
              || {title:'환경 챌린지'};
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      await window.FB.addDoc(window.FB.collection(window.FB.db, "rooms"), {
        name,
        code,
        challengeId: cid,
        challengeTitle: chal.title || "",
        hostUid: window.ME.uid,
        hostName: window.UDATA?.nickname || window.ME.displayName || "익명",
        deposit: 0,
        isPublic: window._rPub !== false,
        members: [{
          uid: window.ME.uid, 
          name: window.UDATA?.nickname || window.ME.displayName || "익명"
        }],
        status: "open",
        createdAt: window.FB.serverTimestamp()
      });
      
      if(typeof window.closeOv === 'function') window.closeOv("ovRoom");
      const nameInp = document.getElementById("rNameInp");
      if(nameInp) nameInp.value = "";
      
      navigator.clipboard.writeText(code).catch(() => {});
      
      if(window.toast) {
        window.toast("🎉 방 생성 완료! 코드: " + code + " (복사됨)");
      }
      
      if(typeof window.loadMyRooms === 'function') window.loadMyRooms();
      if(typeof window.loadPubRooms === 'function') window.loadPubRooms();
    } catch(e){
      if(window.toast) window.toast("방 만들기 실패: " + e.message);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. 내 방 목록 (클릭하면 상세 페이지)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.loadMyRooms = async () => {
    if(!window.ME) return;
    const w = document.getElementById("myRoomList");
    if(!w) return;
    
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "rooms"));
      const mine = snap.docs
        .filter(d => d.data().members?.some(m => m.uid === window.ME.uid))
        .map(d => ({id: d.id, ...d.data()}))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      if(!mine.length){
        w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:13px">참여 중인 방이 없어요!<br/>새 방을 만들어 보세요 🌱</div>';
        return;
      }
      
      w.innerHTML = mine.map(r => `
        <div class="room-card" style="cursor:pointer" onclick="window.openRoomDetail('${r.id}')">
          <div class="room-name">👥 ${r.name}</div>
          <div class="room-meta">
            ${r.challengeTitle} · ${r.members?.length || 1}명 참여
          </div>
          <div class="room-members">
            ${(r.members || []).slice(0, 5).map(m => 
              `<span class="member-chip">${m.name}</span>`
            ).join("")}
            ${r.members?.length > 5 ? `<span class="member-chip">+${r.members.length - 5}</span>` : ''}
          </div>
          <div class="room-code-row">
            <div>🔑 <span class="room-code">${r.code}</span></div>
            <button class="btn btn-g btn-sm" 
              onclick="event.stopPropagation();navigator.clipboard.writeText('${r.code}').then(()=>toast('복사됨!'))">
              복사
            </button>
          </div>
          <div style="
            margin-top:8px;padding:6px 12px;
            background:#f0fbf4;border-radius:8px;
            font-size:11px;color:var(--g2);font-weight:700;
            text-align:center;
          ">
            👆 클릭해서 인증 피드 보기
          </div>
        </div>
      `).join("");
    } catch(e){}
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. 공개 방 목록
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.loadPubRooms = async () => {
    const w = document.getElementById("pubRoomList");
    if(!w) return;
    
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "rooms"));
      const rooms = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(r => r.isPublic !== false)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 10);
      
      if(!rooms.length){
        w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:13px">공개 방이 없어요!</div>';
        return;
      }
      
      w.innerHTML = rooms.map(r => {
        const joined = r.members?.some(m => m.uid === window.ME?.uid);
        return `
          <div class="room-card" 
            style="border-color:${joined ? 'var(--g1)' : 'var(--bdr)'};cursor:${joined ? 'pointer' : 'default'}"
            ${joined ? `onclick="window.openRoomDetail('${r.id}')"` : ''}>
            <div class="room-name">👥 ${r.name}</div>
            <div class="room-meta">
              ${r.challengeTitle} · ${r.members?.length || 1}명 참여
            </div>
            <button class="btn ${joined ? 'btn-gray' : 'btn-b'}" 
              style="margin-top:6px;padding:10px" 
              onclick="event.stopPropagation();${joined ? `openRoomDetail('${r.id}')` : `joinPub('${r.id}')`}">
              ${joined ? '📸 피드 보기' : '참여하기'}
            </button>
          </div>
        `;
      }).join("");
    } catch(e){}
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. 방 상세 페이지
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.openRoomDetail = async (roomId) => {
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'rooms', roomId));
      if(!snap.exists()){
        if(window.toast) window.toast('방을 찾을 수 없어요');
        return;
      }
      
      const room = {id: snap.id, ...snap.data()};
      await renderRoomDetail(room);
    } catch(e){
      console.error('[room_detail]', e);
    }
  };

  async function renderRoomDetail(room){
    const memberUids = (room.members || []).map(m => m.uid);
    
    const memberMap = {};
    let totalCo2 = 0;
    let totalMissions = 0;
    
    await Promise.all(memberUids.map(async uid => {
      try {
        const userSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', uid));
        if(userSnap.exists()){
          const d = userSnap.data();
          memberMap[uid] = {
            nickname: d.nickname || '익명',
            photo: d.photoURL || '',
            co2: d.co2 || 0,
            missionCount: d.missionCount || 0
          };
          totalCo2 += (d.co2 || 0);
          totalMissions += (d.missionCount || 0);
        }
      } catch(e){}
    }));

    const verifSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
    const verifs = verifSnap.docs
      .map(d => ({id: d.id, ...d.data()}))
      .filter(v => memberUids.includes(v.uid))
      .filter(v => v.isPublic)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 30);

    const isHost = room.hostUid === window.ME?.uid;
    const isMember = memberUids.includes(window.ME?.uid);
    const trees = (totalCo2 / 21.4).toFixed(1);

    const modal = document.getElementById('ovRoomDetail') || createRoomDetailModal();
    const content = document.getElementById('roomDetailContent');
    
    content.innerHTML = `
      <div style="
        background:linear-gradient(135deg,#1a6b3a,#2ECC71);
        border-radius:18px;padding:16px;color:#fff;
        margin-bottom:12px;
      ">
        <div style="font-size:11px;font-weight:700;opacity:.8;margin-bottom:4px">
          👥 방 챌린지
        </div>
        <div style="font-size:18px;font-weight:900;margin-bottom:4px">
          ${room.name}
        </div>
        <div style="font-size:12px;opacity:.9">
          ${room.challengeTitle || ''}
        </div>
        
        <div style="
          margin-top:12px;background:rgba(255,255,255,.2);
          border-radius:10px;padding:8px 12px;
          display:flex;align-items:center;justify-content:space-between;
        ">
          <div>
            <span style="font-size:11px;opacity:.8">초대 코드</span>
            <span style="font-size:14px;font-weight:900;margin-left:6px;letter-spacing:2px">
              ${room.code}
            </span>
          </div>
          <button onclick="navigator.clipboard.writeText('${room.code}').then(()=>toast('복사됨!'))" 
            style="
              background:#fff;color:var(--g2);border:none;
              border-radius:8px;padding:4px 10px;
              font-size:11px;font-weight:700;cursor:pointer;
              font-family:inherit;
            ">복사</button>
        </div>
      </div>

      <div style="
        background:#fff;border-radius:14px;padding:14px;
        margin-bottom:12px;border:1.5px solid var(--g1);
      ">
        <div style="font-size:13px;font-weight:900;color:var(--txt);margin-bottom:10px">
          🏆 우리 방 성과
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div style="text-align:center;padding:8px;background:#f0fbf4;border-radius:10px">
            <div style="font-size:18px;font-weight:900;color:var(--g2)">
              ${totalCo2.toFixed(1)}
            </div>
            <div style="font-size:10px;color:var(--sub)">총 CO₂ (kg)</div>
          </div>
          <div style="text-align:center;padding:8px;background:#f0fbf4;border-radius:10px">
            <div style="font-size:18px;font-weight:900;color:var(--g2)">
              🌳 ${trees}
            </div>
            <div style="font-size:10px;color:var(--sub)">나무 그루</div>
          </div>
          <div style="text-align:center;padding:8px;background:#f0fbf4;border-radius:10px">
            <div style="font-size:18px;font-weight:900;color:var(--g2)">
              ${totalMissions}
            </div>
            <div style="font-size:10px;color:var(--sub)">완료 미션</div>
          </div>
        </div>
      </div>

      <div style="
        background:#fff;border-radius:14px;padding:14px;
        margin-bottom:12px;border:1px solid var(--bdr);
      ">
        <div style="font-size:13px;font-weight:900;color:var(--txt);margin-bottom:10px">
          👥 참여 멤버 (${memberUids.length}명)
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${(room.members || []).map(m => {
            const info = memberMap[m.uid] || {};
            const isHostMark = m.uid === room.hostUid;
            return `
              <div style="
                background:${isHostMark ? '#fff8e1' : '#f0fbf4'};
                border-radius:16px;padding:4px 12px;
                display:flex;align-items:center;gap:6px;
                border:1px solid ${isHostMark ? '#F39C12' : 'var(--bdr)'};
              ">
                <span style="font-size:13px;font-weight:700;color:var(--txt)">
                  ${isHostMark ? '👑' : '🌱'} ${info.nickname || m.name}
                </span>
                ${info.co2 > 0 ? `
                  <span style="font-size:10px;color:var(--sub)">
                    ${info.co2.toFixed(1)}kg
                  </span>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="margin-bottom:12px">
        <div style="
          display:flex;align-items:center;justify-content:space-between;
          margin-bottom:10px;padding:0 4px;
        ">
          <div style="font-size:13px;font-weight:900;color:var(--txt)">
            📸 우리 방 인증 피드
          </div>
          <div style="font-size:11px;color:var(--sub)">
            총 ${verifs.length}개
          </div>
        </div>
        
        ${verifs.length === 0 ? `
          <div style="
            background:#fff;border-radius:14px;padding:24px;
            border:1px solid var(--bdr);text-align:center;
          ">
            <div style="font-size:40px;margin-bottom:8px">📸</div>
            <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">
              아직 인증샷이 없어요!
            </div>
            <div style="font-size:11px;color:var(--sub);line-height:1.6">
              우리 방 첫 번째 인증샷을<br/>
              올려봐요 🌱
            </div>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
            ${verifs.map(v => {
              const nick = memberMap[v.uid]?.nickname || v.userName || '익명';
              return `
                <div onclick="window.openRoomFeedDetail('${v.id}')" style="
                  position:relative;aspect-ratio:1;background:#f0f0f0;
                  cursor:pointer;border-radius:6px;overflow:hidden;
                ">
                  ${v.thumb 
                    ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>`
                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:36px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji||'🌱'}</div>`
                  }
                  <div style="
                    position:absolute;bottom:0;left:0;right:0;
                    background:linear-gradient(transparent,rgba(0,0,0,.65));
                    padding:5px 6px 4px;
                  ">
                    <div style="font-size:10px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                      ${v.missionEmoji||''} ${nick}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      ${isMember && !isHost ? `
        <button onclick="window.leaveRoom('${room.id}')" style="
          width:100%;padding:12px;
          background:#fff0f0;color:var(--red);
          border:1.5px solid var(--red);border-radius:12px;
          font-size:13px;font-weight:700;cursor:pointer;
          font-family:inherit;
        ">🚪 방 나가기</button>
      ` : ''}
      
      ${isHost ? `
        <button onclick="window.deleteRoom('${room.id}')" style="
          width:100%;padding:12px;
          background:#fff0f0;color:var(--red);
          border:1.5px solid var(--red);border-radius:12px;
          font-size:13px;font-weight:700;cursor:pointer;
          font-family:inherit;
        ">🗑️ 방 삭제 (방장만)</button>
      ` : ''}
    `;

    window._roomFeedItems = {};
    verifs.forEach(v => {
      window._roomFeedItems[v.id] = {
        ...v,
        userName: memberMap[v.uid]?.nickname || v.userName || '익명',
        userPhoto: memberMap[v.uid]?.photo || v.userPhoto || ''
      };
    });

    if(typeof window.openOv === 'function') window.openOv('ovRoomDetail');
  }

  function createRoomDetailModal(){
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'ovRoomDetail';
    overlay.innerHTML = `
      <div class="modal">
        <div class="handle" onclick="closeOv('ovRoomDetail')"></div>
        <button class="modal-close" onclick="closeOv('ovRoomDetail')">✕</button>
        <div id="roomDetailContent"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', e => {
      if(e.target === overlay) closeOv('ovRoomDetail');
    });
    
    return overlay;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. 방 피드 상세 팝업
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.openRoomFeedDetail = (id) => {
    const v = window._roomFeedItems?.[id];
    if(!v) return;

    const detailEl = document.getElementById('feedDetailContent');
    if(!detailEl) return;

    detailEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="
          width:40px;height:40px;border-radius:50%;overflow:hidden;
          background:linear-gradient(135deg,var(--g1),var(--g2));
          display:flex;align-items:center;justify-content:center;
          font-size:18px;color:#fff;font-weight:700;flex-shrink:0;
        ">
          ${v.userPhoto 
            ? `<img src="${v.userPhoto}" style="width:100%;height:100%;object-fit:cover"/>` 
            : (v.userName[0] || '👤')}
        </div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700;color:var(--txt)">${v.userName}</div>
          <div style="font-size:12px;color:var(--sub)">${window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : ''}</div>
        </div>
      </div>
      ${v.thumb 
        ? `<img src="${v.thumb}" style="width:100%;border-radius:12px;max-height:400px;object-fit:cover;margin-bottom:12px"/>`
        : ''
      }
      <div style="background:#f0fbf4;border-radius:10px;padding:10px 14px;margin-bottom:10px;border:1px solid var(--bdr)">
        <span style="font-size:13px;font-weight:700;color:var(--g2)">
          ✅ ${v.missionEmoji} ${v.missionName}
        </span>
      </div>
      ${v.comment 
        ? `<div style="background:#f8f8f8;border-radius:10px;padding:12px 14px;font-size:14px;color:var(--txt);line-height:1.7">
            💬 <b>${v.userName}</b>: "${v.comment}"
          </div>`
        : ''
      }
    `;

    if(typeof window.openOv === 'function') window.openOv('ovFeedDetail');
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. 방 나가기 / 삭제
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.leaveRoom = async (roomId) => {
    if(!confirm('정말 방에서 나가시겠어요?')) return;
    
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'rooms', roomId));
      if(!snap.exists()) return;
      
      const room = snap.data();
      const newMembers = (room.members || []).filter(m => m.uid !== window.ME?.uid);
      
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'rooms', roomId), {
        members: newMembers
      });
      
      if(window.toast) window.toast('🚪 방에서 나왔어요');
      if(typeof window.closeOv === 'function') window.closeOv('ovRoomDetail');
      if(window.loadMyRooms) window.loadMyRooms();
      if(window.loadPubRooms) window.loadPubRooms();
    } catch(e){
      if(window.toast) window.toast('실패: ' + e.message);
    }
  };

  window.deleteRoom = async (roomId) => {
    if(!confirm('정말 방을 삭제하시겠어요?\n모든 멤버가 방에서 나가게 됩니다.')) return;
    
    try {
      await window.FB.deleteDoc(window.FB.doc(window.FB.db, 'rooms', roomId));
      if(window.toast) window.toast('🗑️ 방이 삭제됐어요');
      if(typeof window.closeOv === 'function') window.closeOv('ovRoomDetail');
      if(window.loadMyRooms) window.loadMyRooms();
      if(window.loadPubRooms) window.loadPubRooms();
    } catch(e){
      if(window.toast) window.toast('실패: ' + e.message);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 초기화
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  function init(){
    enableRoomTab();
    replacePaybackInfo();
    
    const origOpenCreateRoom = window.openCreateRoom;
    window.openCreateRoom = () => {
      if(typeof origOpenCreateRoom === 'function') origOpenCreateRoom();
      setTimeout(hideDepositInModal, 100);
    };
    
    const origSetCTab = window.setCTab;
    if(typeof origSetCTab === 'function'){
      window.setCTab = function(t){
        origSetCTab.apply(this, arguments);
        if(t === 'room'){
          setTimeout(() => {
            if(window.loadPubRooms) window.loadPubRooms();
            if(window.loadMyRooms) window.loadMyRooms();
          }, 200);
        }
      };
    }
  }

  if(document.readyState === 'complete'){
    setTimeout(init, 1500);
  } else {
    window.addEventListener('load', () => setTimeout(init, 1500));
  }

  console.log('[room_revive_patch] 방 챌린지 부활 + 상세 + 피드 통합!');
})();
