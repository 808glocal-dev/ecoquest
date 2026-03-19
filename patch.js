// ============================================================
// EcoQuest 탄소중립포인트 제도 협업 패치
// index.html의 </body> 바로 앞에 추가:
// <script src="patch.js"></script>
// ============================================================

(function() {
  // ── PATCH 1: 온보딩 모달에 이름·전화번호·동의 필드 추가 ──
  function injectOnboardFields() {
    const modal = document.querySelector('#ovOnboard .modal');
    if (!modal) return;

    // 닉네임 input 찾기
    const nickGroup = document.getElementById('nicknameInp')?.closest('.form-group');
    if (!nickGroup) return;

    // 이름 필드
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group';
    nameGroup.innerHTML = `
      <label>이름 (실명) <span style="color:var(--red)">*</span></label>
      <input class="inp" id="realNameInp" placeholder="홍길동" maxlength="20"/>
      <div style="font-size:11px;color:#aaa;margin-top:4px">탄소중립포인트 실적 연계에 사용됩니다</div>
    `;

    // 전화번호 필드
    const phoneGroup = document.createElement('div');
    phoneGroup.className = 'form-group';
    phoneGroup.innerHTML = `
      <label>휴대전화번호 <span style="color:var(--red)">*</span></label>
      <input class="inp" id="phoneInp" type="tel" placeholder="01012345678" maxlength="11"
        oninput="this.value=this.value.replace(/[^0-9]/g,'')"/>
      <div style="font-size:11px;color:#aaa;margin-top:4px">숫자만 입력 (예: 01012345678)</div>
    `;

    // 닉네임 다음에 삽입
    nickGroup.insertAdjacentElement('afterend', phoneGroup);
    nickGroup.insertAdjacentElement('afterend', nameGroup);

    // 동의 체크박스 (저장 버튼 바로 앞)
    const saveBtn = modal.querySelector('.btn-g');
    if (saveBtn) {
      const consentGroup = document.createElement('div');
      consentGroup.className = 'form-group';
      consentGroup.style.cssText = 'background:#f0fbf4;border-radius:12px;padding:12px;border:1.5px solid var(--bdr)';
      consentGroup.innerHTML = `
        <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer;margin-bottom:0">
          <input type="checkbox" id="consentCheck"
            style="width:18px;height:18px;flex-shrink:0;margin-top:1px;accent-color:var(--g1)"/>
          <span style="font-size:12px;color:var(--txt);line-height:1.6;font-weight:600">
            [필수] 탄소중립포인트 실적 연계를 위해 이름·휴대전화번호를 한국환경산업기술원에
            제3자 제공하는 것에 동의합니다.
            <span style="display:block;margin-top:4px;font-size:11px;color:var(--sub);font-weight:400">
              제공 항목: 이름, 휴대전화번호 | 제공 목적: 탄소중립포인트 인센티브 산정 |
              보유기간: 서비스 탈퇴 시까지
            </span>
          </span>
        </label>
      `;
      saveBtn.insertAdjacentElement('beforebegin', consentGroup);
    }
  }

  // ── PATCH 2: saveOnboard 함수 교체 ──
  window.saveOnboard = async function() {
    const region   = document.getElementById('regionSelect')?.value || '';
    const nickname = (document.getElementById('nicknameInp')?.value || '').trim();
    const realName = (document.getElementById('realNameInp')?.value || '').trim();
    const phone    = (document.getElementById('phoneInp')?.value || '').trim();
    const consent  = document.getElementById('consentCheck')?.checked || false;

    if (!nickname)              { toast('닉네임을 입력해주세요!'); return; }
    if (!realName)              { toast('이름(실명)을 입력해주세요!'); return; }
    if (!phone || phone.length < 10) { toast('휴대전화번호를 정확히 입력해주세요!'); return; }
    if (!window._onboardData?.age)   { toast('나이대를 선택해주세요!'); return; }
    if (!region)                { toast('지역을 선택해주세요!'); return; }
    if (!consent)               { toast('제3자 정보제공 동의가 필요해요!'); return; }

    window.closeOv('ovOnboard');

    if (window.ME && window.saveOnboardData) {
      await window.saveOnboardData(
        window.ME.uid,
        window._onboardData.age,
        region,
        window._selInterests || [],
        {
          nickname, realName, phone,
          consentThirdParty: true,
          consentAt: new Date().toISOString(),
          gender:    window._onboardData.gender    || '',
          job:       window._onboardData.job       || '',
          hasCar:    window._onboardData.hasCar    || '',
          household: window._onboardData.household || '',
          ecoLevel:  window._onboardData.ecoLevel  || '',
        }
      );
      document.getElementById('uName').textContent  = nickname;
      document.getElementById('sName').textContent  = '🌱 ' + nickname;
      document.getElementById('myName').textContent = '🌱 ' + nickname;
      toast('🌱 정보 저장 완료!');
      if (typeof showApp === 'function') showApp();
    }
  };

  // ── PATCH 3: openOnboardEdit — 이름·전화번호·동의 복원 추가 ──
  const _origOpenOnboardEdit = window.openOnboardEdit;
  window.openOnboardEdit = function() {
    _origOpenOnboardEdit();           // 기존 로직 그대로 실행
    setTimeout(() => {
      const d = window.UDATA || {};
      const ri = document.getElementById('realNameInp');
      if (ri) ri.value = d.realName || '';
      const pi = document.getElementById('phoneInp');
      if (pi) pi.value = d.phone || '';
      const cc = document.getElementById('consentCheck');
      if (cc) cc.checked = !!d.consentThirdParty;
    }, 150);                          // 기존 setTimeout(100) 이후에 실행
  };

  // ── PATCH 4: renderAdminUsers — 전화번호·실명·동의 표시 ──
  const _origRenderAdminUsers = window.renderAdminUsers;
  if (typeof _origRenderAdminUsers === 'function') {
    window.renderAdminUsers = function(list) {
      _origRenderAdminUsers(list);
      // 렌더링 후 각 카드에 추가 정보 삽입
      const w = document.getElementById('adminUserList');
      if (!w) return;
      list.forEach((u, i) => {
        const cards = w.querySelectorAll('[data-uid]');
        // data-uid 없으면 index로
      });
      // 직접 재렌더링하는 방식으로 교체
    };
  }

  // renderAdminUsers를 완전히 교체 (더 확실한 방법)
  window.renderAdminUsers = function(list) {
    const w = document.getElementById('adminUserList');
    if (!w) return;
    if (!list.length) {
      w.innerHTML = '<div style="text-align:center;padding:20px;color:#aaa">회원이 없어요</div>';
      return;
    }
    w.innerHTML = `<div style="font-size:11px;color:#aaa;margin-bottom:6px">총 ${list.length}명</div>` +
      list.map(u => `
        <div style="background:#fff;border-radius:12px;padding:10px;margin-bottom:6px;border:1px solid #eee">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:13px;font-weight:700">👤 ${u.nickname||'닉네임없음'}</div>
              <div style="font-size:11px;color:#aaa">UID: ${u.id.slice(0,8)}... · ${u.age||'-'} · ${u.region||'-'}</div>
              <div style="font-size:11px;color:#aaa">관심: ${(u.interests||[]).join(', ')||'-'}</div>
              <div style="font-size:11px;color:#aaa">
                📞 ${u.phone||'미입력'} ·
                ${u.realName ? ('✅ ' + u.realName) : '⚠️ 실명미등록'} ·
                ${u.consentThirdParty ? '🟢 동의완료' : '🔴 동의미완료'}
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:700;color:var(--g2)">${u.point||0}P</div>
              <div style="font-size:11px;color:#aaa">미션 ${u.missionCount||0}개</div>
              <div style="font-size:11px;color:#aaa">CO₂ ${(u.co2||0).toFixed(1)}kg</div>
            </div>
          </div>
        </div>`).join('');
  };

  // ── PATCH 5: exportCSV — 이름·전화번호·동의 컬럼 추가 ──
  window.exportCSV = function() {
    const d = window._adminData;
    if (!d) { toast('통계 탭에서 먼저 로딩해주세요!'); return; }
    const rows = [['UID','미션수','포인트','CO2절감','성별','나이대','지역','직업',
                   '자동차','가구형태','환경관심도','관심분야','이름','전화번호','제3자동의','동의일시']];
    d.users.forEach(u => rows.push([
      u.id||'', u.missionCount||0, u.point||0, (u.co2||0).toFixed(2),
      u.gender||'', u.age||'', u.region||'', u.job||'',
      u.hasCar||'', u.household||'', u.ecoLevel||'', (u.interests||[]).join('|'),
      u.realName||'', u.phone||'',
      u.consentThirdParty ? '동의' : '미동의',
      u.consentAt||''
    ]));
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'EcoQuest_데이터_' +
      new Date().toLocaleDateString('ko-KR').replace(/\./g,'').replace(/ /g,'') + '.csv';
    a.click();
    toast('✅ CSV 다운로드 완료!');
  };

  // ── 초기화: DOM 로드 후 필드 주입 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectOnboardFields);
  } else {
    // 이미 로드됨 — 온보딩 모달이 열릴 때 주입되도록 MutationObserver 사용
    const observer = new MutationObserver(() => {
      if (document.getElementById('realNameInp')) return; // 이미 주입됨
      if (document.querySelector('#ovOnboard .modal')) {
        injectOnboardFields();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // 즉시도 시도
    injectOnboardFields();
  }

})();
