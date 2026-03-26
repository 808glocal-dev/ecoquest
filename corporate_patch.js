// ====================================================
// EcoQuest 기업(B2B) 기능 패치
// 이 내용을 index.html 의 마지막 </script> 직전에 추가하세요
// ====================================================

// ── 기업 CSS 추가 ──
const corpStyle = document.createElement('style');
corpStyle.textContent = `
.corp-kpi-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}
.corp-kpi{background:#fff;border:1px solid var(--bdr);border-radius:14px;padding:14px;position:relative;overflow:hidden}
.corp-kpi.dark{background:var(--txt);border-color:var(--txt)}
.corp-kpi-label{font-size:10px;font-weight:700;color:var(--sub);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.corp-kpi.dark .corp-kpi-label{color:rgba(255,255,255,.5)}
.corp-kpi-value{font-size:24px;font-weight:900;color:var(--txt);line-height:1}
.corp-kpi.dark .corp-kpi-value{color:var(--g1)}
.corp-kpi-unit{font-size:11px;color:var(--sub);margin-top:2px}
.corp-kpi.dark .corp-kpi-unit{color:rgba(255,255,255,.4)}
.corp-kpi-badge{position:absolute;top:10px;right:10px;background:var(--green-pale,#e8f5ee);color:var(--g2);font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px}
.corp-kpi.dark .corp-kpi-badge{background:rgba(46,204,113,.2);color:var(--g1)}
.corp-rank-item{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--bdr)}
.corp-rank-item:last-child{border:none}
.corp-rank-item.mine{background:#f0fbf4}
.corp-rank-num{font-size:12px;font-weight:900;color:var(--sub);width:18px;text-align:center}
.corp-rank-num.top{color:var(--g2)}
.corp-report-card{background:linear-gradient(135deg,var(--txt) 0%,#1a3d2b 100%);border-radius:16px;padding:18px;margin:0 12px 14px;position:relative;overflow:hidden}
.corp-report-card::before{content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(46,204,113,.15),transparent 70%)}
.corp-plan-option{border:2px solid var(--bdr);border-radius:14px;padding:14px;margin-bottom:8px;cursor:pointer;transition:all .2s}
.corp-plan-option.selected{border-color:var(--g1);background:#f0fbf4}
.corp-join-card{background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border:1.5px solid var(--g1);border-radius:16px;padding:16px;margin:0 12px 14px}
`;
document.head.appendChild(corpStyle);

// ── 탭바에 기업 탭 추가 ──
const tabBar = document.querySelector('.tab-bar');
if (tabBar) {
  const corpTab = document.createElement('button');
  corpTab.className = 'tb';
  corpTab.setAttribute('data-page', 'corporate');
  corpTab.innerHTML = '<span class="ic">🏢</span>기업';
  corpTab.onclick = () => goPage('corporate');
  tabBar.appendChild(corpTab);
}

// ── 기업 대시보드 페이지 HTML 추가 ──
const appDiv = document.getElementById('app');
const corpPage = document.createElement('div');
corpPage.className = 'page';
corpPage.id = 'page-corporate';
corpPage.innerHTML = `
  <!-- 비로그인/미가입 상태 -->
  <div id="corp-no-company" style="padding:20px">
    <div style="background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:16px;padding:20px;color:#fff;text-align:center;margin-bottom:14px">
      <div style="font-size:40px;margin-bottom:10px">🏢</div>
      <div style="font-size:18px;font-weight:900;margin-bottom:6px">EcoQuest for Business</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.6">직원들의 친환경 활동 데이터를<br/>ESG 보고서로 자동 생성해드려요</div>
    </div>
    <button class="btn btn-g" style="margin-bottom:10px" onclick="openOv('ovCorpCreate')">+ 우리 회사 등록하기</button>
    <button class="btn btn-gray" onclick="openOv('ovCorpJoin')">초대코드로 회사 합류하기</button>
    <div style="margin-top:16px;background:#fff;border-radius:14px;padding:14px;border:1px solid var(--bdr)">
      <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:10px">📋 기업 플랜 혜택</div>
      <div style="font-size:12px;color:var(--sub);line-height:2">
        ✅ 직원 CO₂ 절감량 자동 집계<br/>
        ✅ 기업 간 랭킹 노출<br/>
        ✅ ESG 활동 리포트 PDF/CSV<br/>
        ✅ 앱 내 기업 로고 노출<br/>
        ✅ 전용 미션 생성 (프로+)
      </div>
    </div>
  </div>

  <!-- 가입 후 대시보드 -->
  <div id="corp-dashboard" style="display:none;padding-bottom:20px">
    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#0f3d20,#2ECC71);padding:14px 16px 12px;color:#fff">
      <div style="font-size:10px;color:rgba(255,255,255,.6);font-weight:700;letter-spacing:.5px;margin-bottom:2px">FOR BUSINESS</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:17px;font-weight:900" id="corp-company-name">회사명</div>
        <div style="font-size:11px;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;font-weight:700" id="corp-plan-badge">스탠다드</div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:4px" id="corp-invite-code-display"></div>
    </div>

    <!-- KPI -->
    <div class="corp-kpi-row">
      <div class="corp-kpi dark">
        <div class="corp-kpi-label">이번 달 CO₂ 절감</div>
        <div class="corp-kpi-value" id="corp-co2">0</div>
        <div class="corp-kpi-unit">kg CO₂</div>
        <div class="corp-kpi-badge" id="corp-co2-badge">집계중</div>
      </div>
      <div class="corp-kpi">
        <div class="corp-kpi-label">참여 직원</div>
        <div class="corp-kpi-value" id="corp-members">0</div>
        <div class="corp-kpi-unit">명</div>
      </div>
      <div class="corp-kpi">
        <div class="corp-kpi-label">완료 미션</div>
        <div class="corp-kpi-value" id="corp-missions">0</div>
        <div class="corp-kpi-unit">건</div>
      </div>
      <div class="corp-kpi">
        <div class="corp-kpi-label">기업 랭킹</div>
        <div class="corp-kpi-value" id="corp-rank">#-</div>
        <div class="corp-kpi-unit">전체 기업 중</div>
      </div>
    </div>

    <!-- ESG 리포트 -->
    <div class="corp-report-card">
      <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:4px">📄 ESG 활동 리포트</div>
      <div style="font-size:12px;color:rgba(255,255,255,.55);margin-bottom:14px;line-height:1.5">직원들의 친환경 활동 데이터를<br/>ESG 보고서용 파일로 자동 생성</div>
      <div style="display:flex;gap:14px;margin-bottom:14px">
        <div><div style="font-size:9px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:.5px">기간</div><div style="font-size:13px;font-weight:700;color:var(--g1)" id="corp-report-period">-</div></div>
        <div><div style="font-size:9px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:.5px">포함 데이터</div><div style="font-size:13px;font-weight:700;color:var(--g1)">CO₂·미션·인원</div></div>
        <div><div style="font-size:9px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:.5px">형식</div><div style="font-size:13px;font-weight:700;color:var(--g1)">CSV</div></div>
      </div>
      <button id="corp-report-download-btn" onclick="downloadCorpESGReport()" style="display:none;align-items:center;justify-content:center;gap:8px;background:var(--g1);color:var(--txt);font-size:14px;font-weight:700;padding:12px;border-radius:12px;border:none;width:100%;cursor:pointer;font-family:inherit">
        📥 ESG 리포트 다운로드
      </button>
      <div id="corp-report-noadmin" style="display:none;background:rgba(255,255,255,.1);border-radius:12px;padding:10px;text-align:center;font-size:12px;color:rgba(255,255,255,.6)">
        🔒 ESG 리포트는 회사 관리자만 다운로드할 수 있어요
      </div>
    </div>

    <!-- 직원 참여율 -->
    <div style="background:#fff;border:1px solid var(--bdr);border-radius:16px;padding:14px;margin:0 12px 14px">
      <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:10px">직원 참여 현황</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:26px;font-weight:900;color:var(--txt)" id="corp-participation-pct">0%<span style="font-size:13px;font-weight:500;color:var(--sub)"> 참여 중</span></div>
        <div style="font-size:12px;color:var(--sub)" id="corp-participation-count">0 / 0명</div>
      </div>
      <div style="height:10px;background:#e8f5e9;border-radius:10px;overflow:hidden;margin-bottom:6px">
        <div id="corp-participation-bar" style="height:100%;background:linear-gradient(90deg,var(--g2),var(--g1));border-radius:10px;width:0%;transition:width 1s"></div>
      </div>
    </div>

    <!-- 기업 랭킹 -->
    <div class="sec"><div class="sec-t">🏆 기업 랭킹</div><div class="sec-m" onclick="loadCorpRanking()">새로고침</div></div>
    <div style="background:#fff;border:1px solid var(--bdr);border-radius:14px;overflow:hidden;margin:0 12px 14px" id="corp-ranking-list">
      <div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">로딩 중...</div>
    </div>

    <!-- 최근 직원 활동 -->
    <div class="sec"><div class="sec-t">📸 직원 최근 활동</div></div>
    <div id="corp-activity-feed" style="padding:0 12px 14px">
      <div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">로딩 중...</div>
    </div>

    <!-- 플랜 업그레이드 -->
    <div style="background:#f0fbf4;border:1px solid var(--bdr);border-radius:16px;padding:14px;margin:0 12px;display:flex;align-items:center;gap:12px" onclick="openOv('ovCorpPlan')">
      <div style="font-size:28px;flex-shrink:0">⭐</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:var(--txt)">프리미엄 플랜으로 업그레이드</div>
        <div style="font-size:11px;color:var(--sub);margin-top:2px">전용 미션 생성 + 월간 ESG 보고서</div>
      </div>
      <button style="background:var(--g2);color:#fff;font-size:12px;font-weight:700;padding:8px 14px;border-radius:10px;border:none;cursor:pointer;white-space:nowrap">보기</button>
    </div>
  </div>
`;
appDiv.insertBefore(corpPage, appDiv.querySelector('.tab-bar'));

// ── 모달들 추가 ──
const modalsHtml = `
<!-- 회사 등록 모달 -->
<div class="overlay" id="ovCorpCreate">
  <div class="modal">
    <div class="handle" onclick="closeOv('ovCorpCreate')"></div>
    <button class="modal-close" onclick="closeOv('ovCorpCreate')">✕</button>
    <div class="modal-title">🏢 회사 등록하기</div>
    <div class="modal-desc">회사를 등록하고 직원들을 초대하면<br/>ESG 활동 데이터가 자동으로 집계돼요.</div>
    <div class="form-group">
      <label>회사명 <span style="color:var(--red)">*</span></label>
      <input class="inp" id="corpNameInp" placeholder="예) 카카오뱅크" maxlength="30"/>
    </div>
    <div class="form-group">
      <label>업종</label>
      <select class="sel" id="corpIndustryInp">
        <option value="">선택해주세요</option>
        <option>IT/테크</option><option>금융/은행</option><option>제조업</option>
        <option>유통/물류</option><option>서비스업</option><option>교육</option>
        <option>의료/헬스케어</option><option>건설/부동산</option><option>기타</option>
      </select>
    </div>
    <div class="form-group">
      <label>직원 규모</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="corpSizeSelect">
        <button class="dep-btn" onclick="selCorpSize('~50인',this)">~50인</button>
        <button class="dep-btn" onclick="selCorpSize('~300인',this)">~300인</button>
        <button class="dep-btn" onclick="selCorpSize('300인+',this)">300인+</button>
      </div>
    </div>
    <div style="background:#f0fbf4;border-radius:12px;padding:12px;margin-bottom:14px;font-size:12px;color:var(--g2);line-height:1.7">
      🎁 첫 2주 무료 체험 제공<br/>
      📧 등록 후 초대코드가 생성돼요
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-gray" style="flex:1" onclick="closeOv('ovCorpCreate')">취소</button>
      <button class="btn btn-g" style="flex:2" onclick="doCreateCompany()">회사 등록하기 🏢</button>
    </div>
  </div>
</div>

<!-- 회사 합류 모달 -->
<div class="overlay" id="ovCorpJoin">
  <div class="modal">
    <div class="handle" onclick="closeOv('ovCorpJoin')"></div>
    <button class="modal-close" onclick="closeOv('ovCorpJoin')">✕</button>
    <div class="modal-title">🔑 회사 합류하기</div>
    <div class="modal-desc">회사 관리자에게 초대코드를 받아 입력하세요.</div>
    <div class="form-group">
      <label>초대코드 6자리</label>
      <input class="inp" id="corpJoinCodeInp" placeholder="예) ABC123" maxlength="6" style="text-transform:uppercase;letter-spacing:3px;font-size:18px;font-weight:700;text-align:center"/>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-gray" style="flex:1" onclick="closeOv('ovCorpJoin')">취소</button>
      <button class="btn btn-b" style="flex:2" onclick="doJoinCompany()">합류하기 ✅</button>
    </div>
  </div>
</div>

<!-- 플랜 선택 모달 -->
<div class="overlay" id="ovCorpPlan">
  <div class="modal">
    <div class="handle" onclick="closeOv('ovCorpPlan')"></div>
    <div style="width:36px;height:4px;background:#e0e0e0;border-radius:2px;margin:0 auto 18px"></div>
    <div class="modal-title">기업 플랜 선택</div>
    <div class="modal-desc" style="margin-bottom:14px">직원 규모와 필요 기능에 맞게 선택하세요.</div>
    <div class="corp-plan-option selected" onclick="selCorpPlan(this,'standard')">
      <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:2px">🌱 스탠다드</div>
      <div style="font-size:20px;font-weight:900;color:var(--g2)">월 99,000원<span style="font-size:12px;font-weight:400;color:var(--sub)"> / 50인 이하</span></div>
      <div style="font-size:11px;color:var(--sub);margin-top:6px;line-height:1.8">✓ 기업 랭킹 등록<br/>✓ 직원 참여 현황 대시보드<br/>✓ 분기별 ESG 리포트 (CSV)</div>
    </div>
    <div class="corp-plan-option" onclick="selCorpPlan(this,'pro')">
      <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:2px">🌳 프로</div>
      <div style="font-size:20px;font-weight:900;color:var(--g2)">월 299,000원<span style="font-size:12px;font-weight:400;color:var(--sub)"> / 300인 이하</span></div>
      <div style="font-size:11px;color:var(--sub);margin-top:6px;line-height:1.8">✓ 스탠다드 모든 기능<br/>✓ 전용 미션 생성 (월 3개)<br/>✓ 월간 ESG 리포트 + CSV<br/>✓ 앱 내 기업 로고 노출</div>
    </div>
    <div class="corp-plan-option" onclick="selCorpPlan(this,'enterprise')">
      <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:2px">🏆 엔터프라이즈</div>
      <div style="font-size:20px;font-weight:900;color:var(--g2)">별도 문의<span style="font-size:12px;font-weight:400;color:var(--sub)"> / 300인 이상</span></div>
      <div style="font-size:11px;color:var(--sub);margin-top:6px;line-height:1.8">✓ 프로 모든 기능<br/>✓ 무제한 전용 미션<br/>✓ 커스텀 ESG 보고서<br/>✓ 전담 매니저 배정</div>
    </div>
    <button style="background:var(--g2);color:#fff;font-size:15px;font-weight:700;padding:14px;border-radius:14px;border:none;width:100%;margin-top:14px;cursor:pointer;font-family:inherit" onclick="toast('📧 808glocal@gmail.com 으로 문의해주세요!');closeOv('ovCorpPlan')">도입 문의하기</button>
  </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalsHtml);

// ── 기업 관련 전역 변수 ──
let _corpSize = '';
let _corpPlan = 'standard';
let _corpData = null; // 현재 유저의 회사 데이터

function selCorpSize(val, el) {
  _corpSize = val;
  document.querySelectorAll('#corpSizeSelect .dep-btn').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
}
window.selCorpSize = selCorpSize;

function selCorpPlan(el, plan) {
  _corpPlan = plan;
  document.querySelectorAll('.corp-plan-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}
window.selCorpPlan = selCorpPlan;

// ── 회사 등록 ──
window.doCreateCompany = async () => {
  const name = document.getElementById('corpNameInp').value.trim();
  const industry = document.getElementById('corpIndustryInp').value;
  if (!name) { toast('회사명을 입력해주세요!'); return; }
  if (!window.ME) { toast('로그인이 필요해요!'); return; }

  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  try {
    const compRef = await window.FB.addDoc(window.FB.collection(window.FB.db, 'companies'), {
      name, industry, size: _corpSize,
      adminUid: window.ME.uid,
      inviteCode: code,
      plan: 'standard',
      createdAt: window.FB.serverTimestamp()
    });
    // 유저에 companyId 연결
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), {
      companyId: compRef.id,
      companyName: name
    });
    window.UDATA.companyId = compRef.id;
    window.UDATA.companyName = name;

    closeOv('ovCorpCreate');
    document.getElementById('corpNameInp').value = '';
    navigator.clipboard.writeText(code).catch(() => {});
    toast(`🎉 "${name}" 등록 완료! 초대코드: ${code} (복사됨)`);
    loadCorpDashboard();
  } catch (e) { toast('등록 실패: ' + e.message); }
};

// ── 회사 합류 ──
window.doJoinCompany = async () => {
  const code = document.getElementById('corpJoinCodeInp').value.trim().toUpperCase();
  if (code.length < 4) { toast('초대코드를 입력해주세요!'); return; }
  if (!window.ME) { toast('로그인이 필요해요!'); return; }
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
    const found = snap.docs.find(d => d.data().inviteCode === code);
    if (!found) { toast('존재하지 않는 초대코드예요!'); return; }
    const cdata = found.data();
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), {
      companyId: found.id,
      companyName: cdata.name
    });
    window.UDATA.companyId = found.id;
    window.UDATA.companyName = cdata.name;
    document.getElementById('corpJoinCodeInp').value = '';
    closeOv('ovCorpJoin');
    toast(`✅ "${cdata.name}" 에 합류했어요!`);
    loadCorpDashboard();
  } catch (e) { toast('합류 실패: ' + e.message); }
};

// ── 대시보드 로드 ──
async function loadCorpDashboard() {
  const noComp = document.getElementById('corp-no-company');
  const dashboard = document.getElementById('corp-dashboard');

  // Firebase에서 최신 유저 데이터 다시 불러오기 (탭 클릭 시마다)
  if (window.ME) {
    try {
      const freshSnap = await window.FB.getDoc(
        window.FB.doc(window.FB.db, 'users', window.ME.uid)
      );
      if (freshSnap.exists()) {
        Object.assign(window.UDATA, freshSnap.data());
      }
    } catch(e) { console.log('유저 데이터 새로고침 실패', e); }
  }

  const companyId = window.UDATA?.companyId;
  if (!companyId) {
    noComp.style.display = 'block';
    dashboard.style.display = 'none';
    return;
  }

  noComp.style.display = 'none';
  dashboard.style.display = 'block';

  try {
    // 회사 정보
    const compSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', companyId));
    if (!compSnap.exists()) return;
    _corpData = { id: compSnap.id, ...compSnap.data() };

    document.getElementById('corp-company-name').textContent = _corpData.name;
    document.getElementById('corp-plan-badge').textContent =
      _corpData.plan === 'pro' ? '🌳 프로' :
      _corpData.plan === 'enterprise' ? '🏆 엔터프라이즈' : '🌱 스탠다드';
    document.getElementById('corp-invite-code-display').textContent =
      `초대코드: ${_corpData.inviteCode} · ${window.UDATA?.companyName || ''}`;

    const now = new Date();
    document.getElementById('corp-report-period').textContent =
      `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

    // 관리자 여부에 따라 리포트 버튼 표시
    const isAdmin = _corpData?.adminUid === window.ME?.uid;
    const dlBtn = document.getElementById('corp-report-download-btn');
    const noAdminMsg = document.getElementById('corp-report-noadmin');
    if (dlBtn) dlBtn.style.display = isAdmin ? 'flex' : 'none';
    if (noAdminMsg) noAdminMsg.style.display = isAdmin ? 'none' : 'block';

    // 전체 유저 중 같은 companyId 가진 사람들 조회
    const userSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
    const members = userSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(u => u.companyId === companyId);

    const totalCo2 = members.reduce((s, u) => s + (u.co2 || 0), 0);
    const totalMissions = members.reduce((s, u) => s + (u.missionCount || 0), 0);
    const activeMembers = members.filter(u => u.missionCount > 0).length;

    // KPI 업데이트
    document.getElementById('corp-co2').textContent = totalCo2.toFixed(1);
    document.getElementById('corp-co2-badge').textContent = `${members.length}명`;
    document.getElementById('corp-members').textContent = activeMembers;
    document.getElementById('corp-missions').textContent = totalMissions;

    // 참여율
    const pct = members.length > 0 ? Math.round(activeMembers / members.length * 100) : 0;
    document.getElementById('corp-participation-pct').innerHTML =
      `${pct}%<span style="font-size:13px;font-weight:500;color:var(--sub)"> 참여 중</span>`;
    document.getElementById('corp-participation-count').textContent =
      `${activeMembers} / ${members.length}명`;
    document.getElementById('corp-participation-bar').style.width = pct + '%';

    // 직원 활동 피드
    renderCorpActivityFeed(members);

    // 전역 저장 (ESG 리포트용)
    window._corpMembers = members;
    window._corpTotalCo2 = totalCo2;
    window._corpTotalMissions = totalMissions;

    // 랭킹
    loadCorpRanking();
  } catch (e) { toast('대시보드 로딩 실패'); }
}
window.loadCorpDashboard = loadCorpDashboard;

// ── 직원 활동 피드 ──
function renderCorpActivityFeed(members) {
  const w = document.getElementById('corp-activity-feed');
  if (!w) return;
  const active = members.filter(u => u.missionCount > 0)
    .sort((a, b) => (b.co2 || 0) - (a.co2 || 0))
    .slice(0, 8);
  if (!active.length) {
    w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:12px">아직 미션을 완료한 직원이 없어요!</div>';
    return;
  }
  const missionEmojis = ['🚲', '♻️', '🌿', '🚌', '🧴', '🥗', '🔌', '💧'];
  w.innerHTML = `<div style="background:#fff;border:1px solid var(--bdr);border-radius:14px;overflow:hidden">` +
    active.map((u, i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--bdr)${i === active.length - 1 ? ';border:none' : ''}">
        <div style="width:32px;height:32px;border-radius:10px;background:#f0fbf4;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
          ${missionEmojis[i % missionEmojis.length]}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${u.nickname || '익명 직원'}
          </div>
          <div style="font-size:11px;color:var(--sub);margin-top:1px">미션 ${u.missionCount}개 완료</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--g2)">-${(u.co2 || 0).toFixed(1)}kg</div>
      </div>`).join('') + '</div>';
}

// ── 기업 랭킹 ──
window.loadCorpRanking = async () => {
  const w = document.getElementById('corp-ranking-list');
  if (!w) return;
  try {
    const userSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
    const allUsers = userSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.companyId);

    // 회사별 CO₂ 집계
    const corpMap = {};
    allUsers.forEach(u => {
      if (!u.companyId) return;
      if (!corpMap[u.companyId]) {
        corpMap[u.companyId] = { id: u.companyId, name: u.companyName || '미등록', co2: 0, members: 0 };
      }
      corpMap[u.companyId].co2 += (u.co2 || 0);
      if (u.missionCount > 0) corpMap[u.companyId].members++;
    });

    const ranked = Object.values(corpMap).sort((a, b) => b.co2 - a.co2);
    const myCorpId = window.UDATA?.companyId;
    const myRank = ranked.findIndex(c => c.id === myCorpId) + 1;
    if (myRank > 0) document.getElementById('corp-rank').textContent = `#${myRank}`;

    if (!ranked.length) {
      w.innerHTML = '<div style="text-align:center;padding:20px;color:var(--sub);font-size:12px">아직 등록된 기업이 없어요!</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const avatars = ['🏢', '🌍', '⚡', '🌿', '🚀'];
    const colors = ['#d4f1e0', '#e8f0fe', '#fce8e8', '#f5f0ff', '#fff3d4'];

    w.innerHTML = ranked.slice(0, 8).map((c, i) => {
      const isMine = c.id === myCorpId;
      return `<div class="corp-rank-item${isMine ? ' mine' : ''}">
        <div class="corp-rank-num${i < 3 ? ' top' : ''}">${medals[i] || (i + 1)}</div>
        <div style="width:34px;height:34px;border-radius:10px;background:${colors[i % colors.length]};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${avatars[i % avatars.length]}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--txt)">${c.name}${isMine ? ' <span style="background:var(--g2);color:#fff;font-size:9px;padding:1px 5px;border-radius:4px">우리</span>' : ''}</div>
          <div style="font-size:11px;color:var(--sub);margin-top:1px">${c.members}명 참여</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:14px;font-weight:900;color:var(--g2)">${c.co2.toFixed(1)}</div>
          <div style="font-size:10px;color:var(--sub)">kg CO₂</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    w.innerHTML = '<div style="text-align:center;padding:16px;color:var(--sub);font-size:12px">랭킹 로딩 실패</div>';
  }
};

// ── ESG 리포트 CSV 다운로드 ──
window.downloadCorpESGReport = () => {
  // 관리자만 다운로드 가능
  if (_corpData?.adminUid !== window.ME?.uid) {
    toast('🔒 ESG 리포트는 회사 관리자만 다운로드할 수 있어요!');
    return;
  }
  const members = window._corpMembers;
  if (!members || !members.length) { toast('데이터가 없어요! 잠시 후 다시 시도해주세요.'); return; }

  const now = new Date();
  const period = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  const companyName = window.UDATA?.companyName || '회사';

  const rows = [
    ['EcoQuest ESG 활동 리포트'],
    [`회사명: ${companyName}`, `기간: ${period}`, `생성일: ${now.toLocaleDateString('ko-KR')}`],
    [],
    ['=== 요약 ==='],
    ['총 참여 직원', members.filter(u => u.missionCount > 0).length + '명'],
    ['총 CO₂ 절감', (window._corpTotalCo2 || 0).toFixed(2) + 'kg'],
    ['총 미션 완료', (window._corpTotalMissions || 0) + '건'],
    ['CO₂ 환산 나무', (window._corpTotalCo2 / 21.4 || 0).toFixed(1) + '그루'],
    [],
    ['=== 직원별 상세 ==='],
    ['닉네임', '미션 완료 수', 'CO₂ 절감(kg)', '포인트', '레벨', '지역', '나이대'],
    ...members.map(u => [
      u.nickname || '익명',
      u.missionCount || 0,
      (u.co2 || 0).toFixed(2),
      u.point || 0,
      u.missionCount >= 50 ? 'Lv.7+' : u.missionCount >= 25 ? 'Lv.5+' : u.missionCount >= 10 ? 'Lv.3+' : 'Lv.1',
      u.region || '-',
      u.age || '-'
    ])
  ];

  const csv = rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `EcoQuest_ESG리포트_${companyName}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
  a.click();
  toast('✅ ESG 리포트 다운로드 완료!');
};

// ── goPage 확장: corporate 탭 ──
const _origGoPage = window.goPage;
window.goPage = function(name) {
  _origGoPage(name);
  if (name === 'corporate') {
    loadCorpDashboard();
  }
};

// ── loadUser 완료 후 companyId 있으면 프리로드 ──
const _origLoadUser = window.loadUser;
window.loadUser = async function(uid) {
  await _origLoadUser(uid);
  // 이미 회사에 속해 있으면 corporate 탭에서 바로 보이도록
};

console.log('✅ EcoQuest Corporate Patch 로드 완료');
