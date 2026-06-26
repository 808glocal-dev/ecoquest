// ═══════════════════════════════════════════════════════
// EcoQuest 공식 깅 모임 patch  v2
//  - 회사깅 카테고리 맨 앞
//  - 가로 칩 필터 → 카테고리 그리드(탭하면 진입) + 뒤로가기
//  - 회사깅 스코핑: companyId 있는 깅은 내 소속일 때만 노출 (관리자는 전체)
//  - 등록 폼: 회사깅이면 소속(companies) 선택 → companyId 자동 부여
// ═══════════════════════════════════════════════════════
(function(){

  // ─── 1. 카테고리 12개 (회사깅 맨 앞) ────────────────
  const GATHERING_CATEGORIES = [
    {id:"hoesaging",  emoji:"🏢", name:"회사깅", missionId:"m1",  desc:"우리 회사 임직원 전용 챌린지"},
    {id:"jupging",    emoji:"🚯", name:"줍깅",   missionId:"m11", desc:"줍는 행위 전부"},
    {id:"chaengging", emoji:"🧴", name:"챙깅",   missionId:"m1",  desc:"다회용품 챙기기"},
    {id:"zeroing",    emoji:"♻️", name:"제로깅", missionId:"m13", desc:"친환경 소비 인증"},
    {id:"meokging",   emoji:"🥗", name:"먹깅",   missionId:"m3",  desc:"지속가능한 식사"},
    {id:"mandulging", emoji:"🎨", name:"만들깅", missionId:"m24", desc:"업사이클·DIY"},
    {id:"nolging",    emoji:"🎉", name:"놀깅",   missionId:"m38", desc:"소셜·콘텐츠"},
    {id:"geotging",   emoji:"🚶", name:"걷깅",   missionId:"m8",  desc:"친환경 이동"},
    {id:"nanuging",   emoji:"🤝", name:"나누깅", missionId:"m37", desc:"순환·나눔"},
    {id:"gochiging",  emoji:"🔧", name:"고치깅", missionId:"m25", desc:"수선·수리"},
    {id:"jeolging",   emoji:"💡", name:"절깅",   missionId:"m14", desc:"절전·디지털 디톡스"},
    {id:"kiuging",    emoji:"🌱", name:"키우깅", missionId:"m9",  desc:"식물·자연"},
  ];
  window.GATHERING_CATEGORIES = GATHERING_CATEGORIES;

  let _selectedCat = null;        // null=카테고리 그리드(홈), 그 외=해당 카테고리 진입
  let _allGatherings = [];

  const today = () => new Date().toISOString().split("T")[0];

  // ─── 관리자 판별 ────────────────────────────────────
  function isGatheringAdmin(){
    return window.ME?.email === '808glocal@gmail.com'
      || window.IS_ADMIN === true
      || (typeof window.isCoAdmin === 'function' && window.isCoAdmin());
  }

  // ─── 스코핑: 내게 보이는 깅만 ───────────────────────
  function visibleGatherings(){
    const myCid = window.UDATA?.companyId;
    const admin = isGatheringAdmin();
    return _allGatherings.filter(g => {
      if(g.status === "draft") return false;
      if(g.companyId){                 // 회사깅(소속 전용)
        return admin || g.companyId === myCid;
      }
      return true;                     // 공개 깅
    });
  }

  // ─── 2. sec-room 영역 교체 (그리드 + 상세 컨테이너) ─
  function initGatheringUI(){
    const ctabRoom = document.getElementById("ctab-room");
    if(ctabRoom){ ctabRoom.textContent = "🏃 공식 깅"; ctabRoom.style.display = ""; }
    const secRoom = document.getElementById("sec-room");
    if(secRoom){
      secRoom.innerHTML = `
        <div id="gatheringHome" style="padding:12px"></div>
        <div id="gatheringDetail" style="display:none"></div>
      `;
      loadGatherings();
    }
  }

  // ─── 3. Firestore 로드 → 현재 화면 렌더 ─────────────
  async function loadGatherings(){
    const home = document.getElementById("gatheringHome");
    if(home && !_allGatherings.length) home.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px">로딩 중...</div>';
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "gatherings"));
      _allGatherings = snap.docs.map(d => ({id:d.id, ...d.data()}))
        .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      renderCurrentGatheringView();
    } catch(e){
      if(home) home.innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px">불러오기 실패 😢</div>';
    }
  }
  window._loadGatherings = loadGatherings;

  function renderCurrentGatheringView(){
    const home = document.getElementById("gatheringHome");
    const detail = document.getElementById("gatheringDetail");
    if(_selectedCat){
      if(home) home.style.display = "none";
      if(detail) detail.style.display = "block";
      renderCategoryDetail();
    } else {
      if(detail) detail.style.display = "none";
      if(home) home.style.display = "block";
      renderCategoryHome();
    }
  }

  // ─── 4. 카테고리 그리드(홈) ─────────────────────────
  function renderCategoryHome(){
    const w = document.getElementById("gatheringHome");
    if(!w) return;
    const vis = visibleGatherings();
    const t = today();
    const liveCount = catId => vis.filter(g => g.category===catId && !(g.endDate && g.endDate < t)).length;
    const hasCompany = !!window.UDATA?.companyId;

    const tiles = GATHERING_CATEGORIES.map(c => {
      const n = liveCount(c.id);
      const isCo = c.id === "hoesaging";
      const dim = n === 0 ? 'opacity:.55' : '';
      const badge = n > 0
        ? `<span style="position:absolute;top:7px;right:7px;background:#2ECC71;color:#fff;font-size:10px;font-weight:900;min-width:16px;height:16px;line-height:16px;text-align:center;border-radius:8px;padding:0 4px">${n}</span>`
        : '';
      const coTag = isCo ? `<span style="position:absolute;top:7px;left:7px;background:#fff8e1;color:#b8860b;font-size:8px;font-weight:900;padding:1px 5px;border-radius:6px">전용</span>` : '';
      return `<div onclick="openGatheringCategory('${c.id}')" style="position:relative;background:${isCo?'linear-gradient(135deg,#fff,#f0fbf4)':'#fff'};border:1.5px solid ${isCo?'#a8e6c5':'#d8eedd'};border-radius:14px;padding:16px 8px 13px;text-align:center;cursor:pointer;${dim}">
        ${badge}${coTag}
        <div style="font-size:30px;line-height:1.1">${c.emoji}</div>
        <div style="font-size:12px;font-weight:900;color:#1a2e1a;margin-top:6px">${c.name}</div>
        <div style="font-size:9px;color:#7a9a7a;margin-top:2px">${n>0?`${n}개 진행중`:'준비 중'}</div>
      </div>`;
    }).join("");

    w.innerHTML = `
      <div style="font-size:15px;font-weight:900;color:#1a2e1a;margin:2px 2px 4px">🏃 어떤 깅에 참여할까요?</div>
      <div style="font-size:11px;color:#7a9a7a;margin:0 2px 12px">카테고리를 눌러 들어가세요${hasCompany?'':' · 🏢 회사깅은 소속 가입 시 열려요'}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${tiles}</div>
    `;
  }

  // ─── 5. 카테고리 진입 / 뒤로 ────────────────────────
  window.openGatheringCategory = function(catId){
    _selectedCat = catId;
    renderCurrentGatheringView();
    const sr = document.getElementById("sec-room");
    if(sr) sr.scrollIntoView({behavior:"smooth", block:"start"});
  };
  window.selectGatheringCategory = window.openGatheringCategory; // 구버전 호환
  window.backToGatheringHome = function(){
    _selectedCat = null;
    renderCurrentGatheringView();
  };

  // ─── 6. 카테고리 상세(깅 리스트) ────────────────────
  function emptyState(emoji, title, sub){
    return `<div style="text-align:center;padding:30px 16px;color:#999;font-size:13px;background:#f9f9f9;border-radius:14px">
      <div style="font-size:36px;margin-bottom:10px">${emoji}</div>
      <div style="font-weight:700;color:#666;margin-bottom:4px">${title}</div>
      <div style="font-size:11px">${sub}</div>
    </div>`;
  }

  function renderCategoryDetail(){
    const d = document.getElementById("gatheringDetail");
    if(!d) return;
    const cat = GATHERING_CATEGORIES.find(c => c.id === _selectedCat);
    const t = today();
    const list = visibleGatherings()
      .filter(g => g.category === _selectedCat)
      .sort((a,b) => {
        const rank = g => (g.endDate && g.endDate < t) ? 2 : ((g.startDate && g.startDate > t) ? 1 : 0);
        return rank(a) - rank(b);
      });

    let body;
    if(!list.length){
      if(_selectedCat === "hoesaging" && !window.UDATA?.companyId && !isGatheringAdmin()){
        body = emptyState("🏢", "소속에 가입하면 회사 전용 깅이 보여요", "소속 탭에서 초대 코드로 입장하세요");
      } else {
        body = emptyState("🌱", `${cat?.name||''} 진행 중인 깅이 없어요`, "새 모임이 등록되면 알려드릴게요!");
      }
    } else {
      body = list.map(gatheringCardHtml).join("");
    }

    d.innerHTML = `
      <div style="padding:12px 12px 0">
        <button onclick="backToGatheringHome()" style="background:none;border:none;color:#2ECC71;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;padding:4px 0;margin-bottom:4px">← 카테고리</button>
        <div style="font-size:18px;font-weight:900;color:#1a2e1a">${cat?.emoji||''} ${cat?.name||''}</div>
        <div style="font-size:11px;color:#7a9a7a;margin:2px 0 12px">${cat?.desc||''}</div>
      </div>
      <div style="padding:0 12px 16px">${body}</div>
    `;
  }

  // ─── 7. 깅 카드 HTML ────────────────────────────────
  function gatheringCardHtml(g){
    const cat = GATHERING_CATEGORIES.find(c => c.id === g.category);
    const isJoined = (window.UDATA?.joinedGatherings||[]).includes(g.id);
    const t = today();
    const dDay = g.endDate ? Math.ceil((new Date(g.endDate) - new Date())/86400000) : null;
    const isUpcoming = g.startDate && g.startDate > t;
    const isEnded = g.endDate && g.endDate < t;
    const cnt = g.participantCount || 0;

    let statusBadge = "";
    if(isUpcoming) statusBadge = `<span style="background:#eee;color:#666;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700">곧 시작</span>`;
    else if(isEnded) statusBadge = `<span style="background:#fff5f5;color:#c0392b;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700">종료</span>`;
    else if(dDay !== null) statusBadge = `<span style="background:#ffe8e6;color:#c0392b;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700">D-${dDay}</span>`;

    let btnText, btnBg, btnColor, btnBorder;
    if(isJoined){btnText='✅ 참여중'; btnBg='#f0f0f0'; btnColor='#999'; btnBorder='none';}
    else if(isUpcoming){btnText='🔔 알림 받기'; btnBg='#fff'; btnColor='#666'; btnBorder='1px solid #d8eedd';}
    else if(isEnded){btnText='종료된 깅'; btnBg='#f0f0f0'; btnColor='#999'; btnBorder='none';}
    else {btnText='참여하기 →'; btnBg='#2ECC71'; btnColor='#fff'; btnBorder='none';}

    return `<div style="background:#fff;border:1px solid #d8eedd;border-radius:14px;padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap">
        <span style="background:#e8f5e9;color:#1a6b3a;font-size:10px;padding:2px 7px;border-radius:6px;font-weight:700">${cat?.emoji||''} ${cat?.name||''}</span>
        ${g.companyId ? `<span style="background:#eef3ff;color:#3a5ba0;font-size:10px;padding:2px 7px;border-radius:6px;font-weight:700">🏢 소속 전용</span>` : ""}
        ${g.partnerName ? `<span style="background:#fff8e1;color:#b8860b;font-size:10px;padding:2px 7px;border-radius:6px;font-weight:700">⭐ ${g.partnerName}</span>` : ""}
        ${statusBadge}
      </div>
      <div style="font-size:14px;font-weight:900;color:#1a2e1a;margin-bottom:3px">${g.emoji||''} ${g.name}</div>
      ${g.description ? `<div style="font-size:11px;color:#7a9a7a;margin-bottom:6px;line-height:1.5">${g.description}</div>` : ""}
      <div style="font-size:11px;color:#7a9a7a;margin-bottom:10px">📅 ${g.startDate||'?'} ~ ${g.endDate||'?'} · 👥 ${cnt}명${g.reward?` · 🪙 +${g.reward}P`:""}</div>
      <button onclick="joinGathering('${g.id}')" style="width:100%;padding:9px;background:${btnBg};color:${btnColor};border:${btnBorder};border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${btnText}</button>
    </div>`;
  }

  // ─── 8. 참여하기 ────────────────────────────────────
  window.joinGathering = async function(gid){
    if(!window.ME){window.toast("로그인이 필요해요!"); return;}
    const g = _allGatherings.find(x => x.id === gid);
    if(!g) return;
    const t = today();
    if(g.startDate && g.startDate > t){window.toast(`🔔 ${g.startDate}부터 시작해요!`); return;}
    if(g.endDate && g.endDate < t){window.toast("종료된 깅이에요!"); return;}
    const joined = window.UDATA?.joinedGatherings || [];
    if(joined.includes(gid)){window.toast("이미 참여 중이에요! ✅"); return;}

    try {
      const newJoined = [...joined, gid];
      await window.FB.updateDoc(window.FB.doc(window.FB.db, "users", window.ME.uid), {joinedGatherings: newJoined});
      window.UDATA.joinedGatherings = newJoined;
      await window.FB.updateDoc(window.FB.doc(window.FB.db, "gatherings", gid), {participantCount: window.FB.increment(1)});
      await window.FB.addDoc(window.FB.collection(window.FB.db, "gatheringParticipants"), {
        gatheringId: gid, gatheringName: g.name,
        uid: window.ME.uid,
        userName: window.UDATA?.nickname || window.ME.displayName || "익명",
        userEmail: window.ME.email || "",
        companyId: window.UDATA?.companyId || null,
        joinedAt: window.FB.serverTimestamp()
      });
      window.toast(`🎉 "${g.name}" 참여 완료!`);
      loadGatherings();   // 현재 화면(상세) 유지하며 갱신
    } catch(e){
      window.toast("참여 실패: " + e.message);
    }
  };

  // ─── 9. 어드민 탭 추가 ──────────────────────────────
  function initAdminGatheringTab(){
    if(document.getElementById("admin-tab-gathering")) return;
    const adminTabsArea = document.querySelector('#adminPage div[style*="overflow-x:auto"]');
    if(!adminTabsArea) return;
    const btn = document.createElement("button");
    btn.id = "admin-tab-gathering";
    btn.className = "admin-tab";
    btn.textContent = "📣 깅";
    btn.onclick = function(){ window.setAdminTab('gathering', this); };
    adminTabsArea.appendChild(btn);

    const adminInner = document.querySelector('#adminPage > div[style*="padding:12px"]');
    if(adminInner && !document.getElementById("admin-gathering")){
      const div = document.createElement("div");
      div.id = "admin-gathering";
      div.style.display = "none";
      div.innerHTML = `
        <button onclick="openGatheringForm()" style="width:100%;background:#2ECC71;color:#fff;border:none;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:8px">+ 새 공식 깅 등록</button>
        <button onclick="loadAdminGatherings()" style="width:100%;background:#f0f0f0;color:#333;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px">새로고침</button>
        <div id="adminGatheringList"><div style="text-align:center;padding:20px;color:#aaa">로딩 중...</div></div>
      `;
      adminInner.appendChild(div);
    }
  }

  // ─── 10. 어드민: 깅 리스트 ──────────────────────────
  window.loadAdminGatherings = async function(){
    const w = document.getElementById("adminGatheringList");
    if(!w) return;
    w.innerHTML = '<div style="text-align:center;padding:20px;color:#aaa">로딩 중...</div>';
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "gatherings"));
      const list = snap.docs.map(d => ({id:d.id, ...d.data()}))
        .sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
      if(!list.length){
        w.innerHTML = '<div style="text-align:center;padding:30px 16px;color:#aaa;font-size:13px">등록된 깅이 없어요.<br/>위 + 버튼으로 첫 깅을 등록해보세요!</div>';
        return;
      }
      const t = today();
      w.innerHTML = list.map(g => {
        const cat = GATHERING_CATEGORIES.find(c => c.id === g.category);
        const isUpcoming = g.startDate && g.startDate > t;
        const isEnded = g.endDate && g.endDate < t;
        const status = isUpcoming ? "대기" : (isEnded ? "종료" : "진행중");
        const statusColor = isUpcoming ? "#999" : (isEnded ? "#c0392b" : "#27AE60");
        return `<div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:8px;border:1px solid #eee">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="flex:1;min-width:0">
              <div style="font-size:11px;color:#999">${cat?.emoji||''} ${cat?.name||''} · ${g.startDate||'?'}~${g.endDate||'?'}</div>
              <div style="font-size:14px;font-weight:700;margin:3px 0">${g.emoji||''} ${g.name}</div>
              <div style="font-size:12px;color:#666">👥 ${g.participantCount||0}명${g.reward?` · 🪙 ${g.reward}P`:""}</div>
              <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
                <span style="font-size:11px;font-weight:700;color:${statusColor};background:#f8f8f8;padding:3px 8px;border-radius:8px">${status}</span>
                ${g.companyId ? `<span style="font-size:11px;font-weight:700;color:#3a5ba0;background:#eef3ff;padding:3px 8px;border-radius:8px">🏢 소속전용</span>` : ''}
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
              <button onclick="viewGatheringParticipants('${g.id}','${(g.name||'').replace(/'/g,"\\'")}')" style="background:#3498db;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">참여자</button>
              <button onclick="editGathering('${g.id}')" style="background:#f0f0f0;color:#333;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">수정</button>
              <button onclick="deleteGathering('${g.id}')" style="background:#fff0f0;color:#E74C3C;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">삭제</button>
            </div>
          </div>
        </div>`;
      }).join("");
    } catch(e){
      w.innerHTML = '<div style="padding:12px;color:red;font-size:12px">로딩 실패: ' + e.message + '</div>';
    }
  };

  // ─── 11. 어드민: 등록·수정 폼 ───────────────────────
  let _editingId = null;
  window.openGatheringForm = function(data){
    _editingId = data?.id || null;
    const old = document.getElementById("ovGathering");
    if(old) old.remove();
    const overlay = document.createElement("div");
    overlay.id = "ovGathering";
    overlay.className = "overlay on";
    overlay.innerHTML = `
      <div class="modal">
        <div class="handle" onclick="closeOv('ovGathering')"></div>
        <button class="modal-close" onclick="closeOv('ovGathering')">✕</button>
        <div class="modal-title">${_editingId ? '✏️ 깅 수정' : '📣 새 공식 깅 등록'}</div>
        <div class="modal-desc">모임 이름은 '깅'으로 끝나야 해요 🌱</div>
        <div class="form-group">
          <label>카테고리 *</label>
          <select class="sel" id="gtCat" onchange="toggleGatheringCompanyField()">
            ${GATHERING_CATEGORIES.map(c => `<option value="${c.id}" ${data?.category===c.id?'selected':''}>${c.emoji} ${c.name}</option>`).join("")}
          </select>
        </div>
        <div class="form-group" id="gtCompanyGroup" style="display:none">
          <label>소속 * (회사깅 전용)</label>
          <select class="sel" id="gtCompany"><option value="">소속 불러오는 중...</option></select>
          <div style="font-size:10px;color:#999;margin-top:4px">선택한 소속의 임직원에게만 이 깅이 보여요</div>
        </div>
        <div class="form-group">
          <label>모임 이름 * (예: 9월 한강 새벽깅)</label>
          <input class="inp" id="gtName" placeholder="끝이 '깅'으로" value="${(data?.name||'').replace(/"/g,'&quot;')}"/>
        </div>
        <div class="form-group">
          <label>대표 이모지</label>
          <input class="inp" id="gtEmoji" placeholder="🌅" maxlength="4" value="${data?.emoji||''}"/>
        </div>
        <div class="form-group">
          <label>설명 (선택)</label>
          <input class="inp" id="gtDesc" placeholder="어떤 모임인지 한 줄" value="${(data?.description||'').replace(/"/g,'&quot;')}"/>
        </div>
        <div style="display:flex;gap:8px">
          <div class="form-group" style="flex:1">
            <label>시작일 *</label>
            <input class="inp" id="gtStart" type="date" value="${data?.startDate||new Date().toISOString().split('T')[0]}"/>
          </div>
          <div class="form-group" style="flex:1">
            <label>종료일 *</label>
            <input class="inp" id="gtEnd" type="date" value="${data?.endDate||''}"/>
          </div>
        </div>
        <div class="form-group">
          <label>보상 포인트</label>
          <input class="inp" id="gtReward" type="number" placeholder="100" value="${data?.reward||100}"/>
        </div>
        <div class="form-group">
          <label>제휴 파트너 (선택)</label>
          <input class="inp" id="gtPartner" placeholder="예: 스타벅스" value="${(data?.partnerName||'').replace(/"/g,'&quot;')}"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-gray" style="flex:1" onclick="closeOv('ovGathering')">취소</button>
          <button class="btn btn-g" style="flex:2" onclick="saveGathering()">${_editingId ? '수정 완료' : '공개 게시'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    fillGatheringCompanies(data?.companyId || "");
    toggleGatheringCompanyField();
  };

  // 회사깅이면 소속 선택칸 노출
  window.toggleGatheringCompanyField = function(){
    const cat = document.getElementById("gtCat")?.value;
    const grp = document.getElementById("gtCompanyGroup");
    if(grp) grp.style.display = (cat === "hoesaging") ? "block" : "none";
  };

  // 소속 목록 채우기
  async function fillGatheringCompanies(selectedId){
    const sel = document.getElementById("gtCompany");
    if(!sel) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "companies"));
      const cos = snap.docs.map(d => ({id:d.id, ...d.data()}));
      if(!cos.length){ sel.innerHTML = '<option value="">등록된 소속이 없어요</option>'; return; }
      sel.innerHTML = '<option value="">소속 선택...</option>' +
        cos.map(c => `<option value="${c.id}" ${c.id===selectedId?'selected':''}>${c.emoji||'🏢'} ${c.name}</option>`).join("");
    } catch(e){
      sel.innerHTML = '<option value="">불러오기 실패</option>';
    }
  }

  window.saveGathering = async function(){
    const name = document.getElementById("gtName").value.trim();
    const cat = document.getElementById("gtCat").value;
    const start = document.getElementById("gtStart").value;
    const end = document.getElementById("gtEnd").value;
    if(!name){window.toast("모임 이름을 입력해주세요!"); return;}
    if(!name.endsWith("깅")){window.toast("모임 이름은 '깅'으로 끝나야 해요! 🌱"); return;}
    if(!start || !end){window.toast("기간을 입력해주세요!"); return;}
    if(end < start){window.toast("종료일이 시작일보다 빠를 수 없어요!"); return;}

    // 회사깅이면 소속 필수
    let companyId = null;
    if(cat === "hoesaging"){
      companyId = document.getElementById("gtCompany")?.value || "";
      if(!companyId){window.toast("회사깅은 소속을 선택해야 해요! 🏢"); return;}
    }

    const data = {
      category: cat, name,
      emoji: document.getElementById("gtEmoji").value.trim() || "🌱",
      description: document.getElementById("gtDesc").value.trim(),
      startDate: start, endDate: end,
      reward: parseInt(document.getElementById("gtReward").value) || 0,
      partnerName: document.getElementById("gtPartner").value.trim(),
      companyId: companyId,                 // 회사깅=소속ID / 그 외=null
      isOfficial: true, status: "active",
      missionId: GATHERING_CATEGORIES.find(c => c.id === cat)?.missionId || ""
    };

    try {
      if(_editingId){
        await window.FB.updateDoc(window.FB.doc(window.FB.db, "gatherings", _editingId), data);
        window.toast("✅ 깅 수정 완료!");
      } else {
        data.participantCount = 0;
        data.createdAt = window.FB.serverTimestamp();
        await window.FB.addDoc(window.FB.collection(window.FB.db, "gatherings"), data);
        window.toast("🎉 새 깅 등록 완료!");
      }
      window.closeOv("ovGathering");
      window.loadAdminGatherings();
      loadGatherings();
    } catch(e){
      window.toast("저장 실패: " + e.message);
    }
  };

  window.editGathering = async function(gid){
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, "gatherings", gid));
      if(!snap.exists()){window.toast("깅을 찾을 수 없어요"); return;}
      window.openGatheringForm({id:gid, ...snap.data()});
    } catch(e){
      window.toast("불러오기 실패: " + e.message);
    }
  };

  window.deleteGathering = async function(gid){
    if(!confirm("이 깅을 삭제할까요? 참여자 데이터도 함께 사라져요.")) return;
    try {
      await window.FB.deleteDoc(window.FB.doc(window.FB.db, "gatherings", gid));
      window.toast("🗑️ 삭제됐어요");
      window.loadAdminGatherings();
      loadGatherings();
    } catch(e){
      window.toast("삭제 실패: " + e.message);
    }
  };

  window.viewGatheringParticipants = async function(gid, gname){
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, "gatheringParticipants"));
      const list = snap.docs.map(d => d.data()).filter(p => p.gatheringId === gid)
        .sort((a,b) => (b.joinedAt?.seconds||0) - (a.joinedAt?.seconds||0));
      const old = document.getElementById("ovParticipants");
      if(old) old.remove();
      const overlay = document.createElement("div");
      overlay.id = "ovParticipants";
      overlay.className = "overlay on";
      overlay.innerHTML = `
        <div class="modal">
          <div class="handle" onclick="closeOv('ovParticipants')"></div>
          <button class="modal-close" onclick="closeOv('ovParticipants')">✕</button>
          <div class="modal-title">👥 ${gname}</div>
          <div class="modal-desc">참여자 ${list.length}명</div>
          ${list.length ? list.map(p => `
            <div style="background:#f8fdf9;border-radius:10px;padding:10px;margin-bottom:6px;border:1px solid #d8eedd">
              <div style="font-size:13px;font-weight:700">${p.userName||'익명'}</div>
              <div style="font-size:11px;color:#888">${p.userEmail||"-"}</div>
              <div style="font-size:10px;color:#aaa;margin-top:3px">${p.joinedAt?.toDate?.()?.toLocaleString("ko-KR") || "-"}</div>
            </div>
          `).join("") : '<div style="text-align:center;padding:20px;color:#aaa">아직 참여자가 없어요</div>'}
        </div>
      `;
      document.body.appendChild(overlay);
    } catch(e){
      window.toast("불러오기 실패: " + e.message);
    }
  };

  // ─── 12. setAdminTab 확장 ───────────────────────────
  window.setAdminTab = function(t, el){
    ["orders","users","missions","stats","gathering"].forEach(id => {
      const d = document.getElementById("admin-"+id);
      if(d) d.style.display = id===t ? "block" : "none";
    });
    document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("on"));
    if(el) el.classList.add("on");
    if(t==="stats" && window.loadAdminStats) window.loadAdminStats();
    if(t==="orders" && window.loadAdminOrders) window.loadAdminOrders();
    if(t==="missions" && window.loadMissionLogs) window.loadMissionLogs();
    if(t==="users" && window.loadAllUsers) window.loadAllUsers();
    if(t==="gathering" && window.loadAdminGatherings) window.loadAdminGatherings();
  };

  // ─── 13. setCTab 확장 ───────────────────────────────
  window.setCTab = function(t){
    document.getElementById("ctab-official").classList.toggle("on", t==="official");
    document.getElementById("ctab-room").classList.toggle("on", t==="room");
    document.getElementById("sec-official").style.display = t==="official" ? "block" : "none";
    document.getElementById("sec-room").style.display = t==="room" ? "block" : "none";
    if(t==="room") loadGatherings();
  };

  // ─── 14. openAdmin 확장 ─────────────────────────────
  const _origOpenAdmin = window.openAdmin;
  window.openAdmin = function(){
    if(_origOpenAdmin) _origOpenAdmin();
    setTimeout(initAdminGatheringTab, 200);
  };

  // ─── 15. 부팅 ───────────────────────────────────────
  function boot(){
    if(!window.FB){ setTimeout(boot, 500); return; }
    initGatheringUI();
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 800));
  } else {
    setTimeout(boot, 800);
  }

})();
