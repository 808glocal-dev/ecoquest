/* =====================================================
   EcoQuest – B2B 소속 운영자 전용 생성 + 로고 패치
   - 일반 유저: 소속 직접 생성 불가 (가입 코드로만 참여)
   - 운영자(808glocal)만 소속 생성/관리 + 로고 등록
   - 회사 로고(이미지) 표시 지원
   ★ 반드시 company_page_patch.js / corporate 패치보다 "뒤"에 로드할 것
   ===================================================== */
(function () {
  'use strict';

  function isCoAdmin() {
    return !!(window.ME && window.ADMIN && window.ME.email === window.ADMIN);
  }

  // 로고 HTML (logoUrl 있으면 이미지, 없으면 이모지)
  function coLogo(co, size) {
    const s = size || 32;
    if (co && co.logoUrl) {
      return `<div style="width:${s}px;height:${s}px;border-radius:9px;overflow:hidden;flex-shrink:0;background:#f0f0f0;display:flex;align-items:center;justify-content:center">
                <img src="${co.logoUrl}" style="width:100%;height:100%;object-fit:cover"/>
              </div>`;
    }
    return `<div style="font-size:${s}px;line-height:1">${(co && co.emoji) || '🏢'}</div>`;
  }
  window.coLogo = coLogo;

  /* ───────── 1. 일반 유저 자가 생성 차단 ───────── */
  window.openCreateCompany = function () {
    if (isCoAdmin()) { openCompanyAdmin(); return; }
    if (window.toast) toast('소속은 운영자가 직접 만들어 드려요. 받은 가입 코드를 입력해 참여하세요 🔑');
  };
  // 방어적 차단 (모달 우회 시)
  window.submitCreateCompany = function () {
    if (!isCoAdmin()) { if (window.toast) toast('소속은 운영자만 생성할 수 있어요'); return; }
    if (window.adminCreateCompany) window.adminCreateCompany();
  };

  /* ───────── 2. 운영자 소속 관리 모달 ───────── */
  window._coEmoji = '🏢';
  window._coLogoData = '';

  window.openCompanyAdmin = function () {
    if (!isCoAdmin()) { if (window.toast) toast('운영자만 접근 가능해요'); return; }
    document.getElementById('coAdminOv')?.remove();
    window._coEmoji = '🏢';
    window._coLogoData = '';

    const d = document.createElement('div');
    d.id = 'coAdminOv';
    d.className = 'overlay on';
    d.innerHTML = `
      <div class="modal">
        <div class="handle" onclick="document.getElementById('coAdminOv').remove()"></div>
        <button class="modal-close" onclick="document.getElementById('coAdminOv').remove()">✕</button>
        <div class="modal-title">🛠 소속(B2B) 관리</div>
        <div class="modal-desc">운영자가 소속을 만들고, 가입 코드를 고객사에 전달해요</div>

        <div style="background:#f0fbf4;border-radius:14px;padding:14px;border:1px solid var(--bdr);margin-bottom:16px">
          <div style="font-size:13px;font-weight:900;color:var(--txt);margin-bottom:12px">➕ 새 소속 만들기</div>

          <div class="form-group">
            <label>로고 / 아이콘</label>
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
              <img id="coLogoPrev" src="" style="width:48px;height:48px;border-radius:10px;object-fit:cover;display:none;border:1px solid var(--bdr)"/>
              <div style="flex:1">
                <input class="inp" id="acoLogoUrl" placeholder="로고 이미지 URL (선택)" style="margin-bottom:6px;font-size:12px"/>
                <label style="display:inline-block;background:#fff;border:1.5px solid var(--bdr);border-radius:10px;padding:7px 12px;font-size:12px;font-weight:700;color:var(--g2);cursor:pointer;font-family:inherit">
                  📁 이미지 업로드
                  <input type="file" accept="image/*" style="display:none" onchange="window._onAcoLogo(this)"/>
                </label>
              </div>
            </div>
            <div style="font-size:11px;color:var(--sub);margin-bottom:4px">또는 이모지 선택</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${['🏢','🌿','🏭','🏦','🏥','🏫','🏪','💼','🌱','⚡','🔋','🌊'].map(e =>
                `<button onclick="window._acoSelEmoji('${e}',this)"
                  style="font-size:22px;padding:5px;border:2px solid ${e==='🏢'?'var(--g1)':'transparent'};border-radius:8px;cursor:pointer;background:none">${e}</button>`
              ).join('')}
            </div>
          </div>

          <div class="form-group">
            <label>소속명 <span style="color:var(--red)">*</span></label>
            <input class="inp" id="acoName" placeholder="예) ㈜MYSC, 서울환경연합" maxlength="24"/>
          </div>
          <div class="form-group">
            <label>업종/분야 (선택)</label>
            <input class="inp" id="acoType" placeholder="예) 임팩트투자, IT, 비영리" maxlength="20"/>
          </div>
          <button class="btn btn-g" onclick="window.adminCreateCompany()">소속 생성 🏢</button>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:13px;font-weight:900;color:var(--txt)">📋 등록된 소속</div>
          <button onclick="window.renderAdminCompanyList()" style="font-size:12px;color:var(--sub);background:none;border:none;cursor:pointer;font-family:inherit">새로고침</button>
        </div>
        <div id="adminCoList"><div style="text-align:center;color:var(--sub);font-size:12px;padding:12px">로딩 중...</div></div>
      </div>`;
    document.body.appendChild(d);
    d.addEventListener('click', e => { if (e.target === d) d.remove(); });
    renderAdminCompanyList();
  };

  window._acoSelEmoji = function (e, btn) {
    window._coEmoji = e;
    document.querySelectorAll('#coAdminOv button[style*="font-size:22px"]')
      .forEach(b => b.style.borderColor = 'transparent');
    btn.style.borderColor = 'var(--g1)';
  };

  window._onAcoLogo = function (input) {
    const f = input.files && input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async ev => {
      try {
        const b64 = ev.target.result.split(',')[1];
        const compressed = window.compressImage
          ? await window.compressImage(b64, 200)
          : ev.target.result;
        window._coLogoData = compressed;
        const prev = document.getElementById('coLogoPrev');
        if (prev) { prev.src = compressed; prev.style.display = 'block'; }
        if (window.toast) toast('로고 이미지 준비됐어요 🖼️');
      } catch (e) { if (window.toast) toast('이미지 처리 실패'); }
    };
    r.readAsDataURL(f);
  };

  window.adminCreateCompany = async function () {
    if (!isCoAdmin() || !window.FB) { if (window.toast) toast('운영자만 가능해요'); return; }
    const name = document.getElementById('acoName')?.value?.trim();
    if (!name) { if (window.toast) toast('소속명을 입력해주세요!'); return; }
    const type = document.getElementById('acoType')?.value?.trim() || '';
    const urlInput = document.getElementById('acoLogoUrl')?.value?.trim() || '';
    const logoUrl = window._coLogoData || urlInput || '';
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await window.FB.addDoc(window.FB.collection(window.FB.db, 'companies'), {
        name,
        emoji: window._coEmoji || '🏢',
        logoUrl,
        type,
        inviteCode: code,
        ownerUid: window.ME.uid,          // 운영자가 소유 = 관리자
        ownerName: window.UDATA?.nickname || window.ME.displayName || '운영자',
        memberCount: 0,                    // 운영자는 멤버 아님 (통계 오염 방지)
        members: [],
        createdByAdmin: true,
        createdAt: window.FB.serverTimestamp(),
      });
      // 폼 초기화
      window._coLogoData = ''; window._coEmoji = '🏢';
      ['acoName', 'acoType', 'acoLogoUrl'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      const prev = document.getElementById('coLogoPrev'); if (prev) prev.style.display = 'none';
      if (window.toast) toast(`✅ "${name}" 생성! 가입 코드: ${code}`);
      renderAdminCompanyList();
    } catch (e) { if (window.toast) toast('생성 실패: ' + e.message); }
  };

  window.renderAdminCompanyList = async function () {
    const el = document.getElementById('adminCoList');
    if (!el || !window.FB) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
      const cos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      if (!cos.length) {
        el.innerHTML = '<div style="text-align:center;color:var(--sub);font-size:12px;padding:12px">아직 등록된 소속이 없어요</div>';
        return;
      }
      el.innerHTML = cos.map(co => {
        const mc = co.memberCount ?? (co.members || []).length;
        return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#fff;border-radius:12px;margin-bottom:6px;border:1px solid var(--bdr)">
          ${coLogo(co, 38)}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${co.name}${co.type ? ` <span style="font-size:10px;color:var(--sub)">· ${co.type}</span>` : ''}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
              <span style="font-size:10px;color:var(--sub)">가입코드</span>
              <span style="font-size:13px;font-weight:900;letter-spacing:2px;color:var(--g2)">${co.inviteCode || '-'}</span>
              <button onclick="navigator.clipboard.writeText('${co.inviteCode || ''}').then(()=>toast('코드 복사됐어요!'))" style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;border:1px solid var(--bdr);background:#f0fbf4;color:var(--g2);cursor:pointer;font-family:inherit">복사</button>
              <span style="font-size:10px;color:var(--sub);margin-left:auto">👥 ${mc}명</span>
            </div>
          </div>
          <button onclick="window.openDeleteCompany('${co.id}',${mc})" style="background:#fff0f0;color:var(--red);border:none;border-radius:8px;padding:6px 9px;font-size:12px;cursor:pointer;font-family:inherit;flex-shrink:0">🗑️</button>
        </div>`;
      }).join('');
    } catch (e) {
      el.innerHTML = `<div style="text-align:center;color:var(--sub);font-size:12px;padding:12px">불러오기 실패<br><small>${e.message || ''}</small></div>`;
    }
  };

  /* ───────── 3. 소속 페이지 후처리 (생성 버튼 차단 + 로고 + 운영자 진입점) ───────── */
  function postProcessBox(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    if (!isCoAdmin()) {
      box.querySelectorAll('button[onclick*="openCreateCompany"]').forEach(b => b.remove());
    }
    if (isCoAdmin() && !window.UDATA?.companyId && !box.querySelector('#adminCoManageBtn')) {
      const btn = document.createElement('button');
      btn.id = 'adminCoManageBtn';
      btn.className = 'btn btn-b';
      btn.style.cssText = 'padding:11px;margin-top:8px';
      btn.textContent = '🛠 소속(B2B) 만들기 · 관리';
      btn.onclick = () => openCompanyAdmin();
      box.appendChild(btn);
    }
  }

  async function swapHeaderLogo(boxId) {
    const cid = window.UDATA?.companyId;
    if (!cid || !window.FB) return;
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', cid));
      if (!snap.exists()) return;
      const co = snap.data();
      if (!co.logoUrl) return;
      const box = document.getElementById(boxId);
      if (!box) return;
      const node = box.querySelector('div[style*="font-size:36px"], div[style*="font-size:32px"]');
      if (node) node.outerHTML = coLogo(co, 40);
    } catch (_) {}
  }

  const _origLoadCompanyPage = window.loadCompanyPage;
  window.loadCompanyPage = async function () {
    if (_origLoadCompanyPage) await _origLoadCompanyPage();
    postProcessBox('companyPageBox');
    swapHeaderLogo('companyPageBox');
  };

  const _origLoadCompanySec = window.loadCompanySec;
  window.loadCompanySec = async function () {
    if (_origLoadCompanySec) await _origLoadCompanySec();
    postProcessBox('companyBox');
    swapHeaderLogo('companyBox');
  };

  /* ───────── 4. 소속 랭킹 로고 표시 (재구현) ───────── */
  window.loadCompanyRank = async function () {
    const el = document.getElementById('companyRankPage');
    if (!el || !window.FB) return;
    try {
      const [coSnap, uSnap] = await Promise.all([
        window.FB.getDocs(window.FB.collection(window.FB.db, 'companies')),
        window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
      ]);
      const allUsers = uSnap.docs.map(d => d.data());
      const coStats = coSnap.docs.map(d => ({ id: d.id, ...d.data() })).map(co => {
        const members = allUsers.filter(u => u.companyId === co.id);
        return { co, members, totalCo2: members.reduce((s, u) => s + (u.co2 || 0), 0), totalMission: members.reduce((s, u) => s + (u.missionCount || 0), 0) };
      }).filter(s => s.totalCo2 > 0).sort((a, b) => b.totalCo2 - a.totalCo2).slice(0, 5);

      if (!coStats.length) {
        el.innerHTML = `<div style="background:#fff;border-radius:14px;padding:20px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:32px;margin-bottom:8px">🏢</div><div style="font-size:13px;font-weight:700;color:var(--txt)">아직 참여 소속이 없어요</div></div>`;
        return;
      }
      el.innerHTML = coStats.map((s, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:#fff;border-radius:12px;margin-bottom:6px;border:1px solid var(--bdr)">
          <div style="font-size:20px">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</div>
          ${coLogo(s.co, 30)}
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--txt)">${s.co.name}</div>
            <div style="font-size:11px;color:var(--sub)">👥 ${s.members.length}명 · ✅ ${s.totalMission}건</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px;font-weight:900;color:var(--g2)">${s.totalCo2.toFixed(1)}kg</div>
            <div style="font-size:10px;color:var(--sub)">CO₂</div>
          </div>
        </div>`).join('');
    } catch (e) {
      el.innerHTML = `<div style="background:#fff;border-radius:14px;padding:20px;text-align:center;border:1px solid var(--bdr)"><div style="font-size:13px;color:var(--sub)">불러오기 실패 😢<br><small>${e.message || ''}</small></div></div>`;
    }
  };

})();
