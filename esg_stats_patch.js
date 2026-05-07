/* ================================================================
   EcoQuest – esg_stats_patch.js
   ESG 보고서용 다중 시트 xlsx 다운로드
   - SheetJS 동적 로드 (CDN)
   - users / missionLogs / verifications 데이터 집계
   - 7개 시트 한 파일에 통합:
     1. 종합 임팩트 (환산 포함)
     2. 미션별 통계
     3. 시계열 추이 (월별)
     4. 지역별 분포
     5. 연령·성별 분포
     6. 콘텐츠 임팩트 (에코 스토리)
     7. 회원 명부
   ================================================================ */
(function () {
  'use strict';

  /* SheetJS 동적 로드 */
  async function loadSheetJS() {
    if (window.XLSX) return;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('SheetJS 로드 실패'));
      document.head.appendChild(script);
    });
  }

  function categorize(missionId) {
    if (missionId === 'm43') return 'book';
    if (['m41','m42'].includes(missionId)) return 'movie';
    if (['m44','m45'].includes(missionId)) return 'article';
    if (['m17','m18','m23'].includes(missionId)) return 'review';
    return 'story';
  }

  /* 기업/소속 필드: users.companyId → companies 컬렉션 lookup */
  function getCompanyId(u) {
    return u.companyId || u.company || u.companyName || u.affiliation || '';
  }
  async function fetchCompaniesMap() {
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
      const map = {};
      snap.docs.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
      return map;
    } catch (e) { return {}; }
  }
  async function extractCompanyList(users) {
    const coMap = await fetchCompaniesMap();
    const grp = {};
    users.forEach(u => {
      const cid = getCompanyId(u);
      const key = cid || '_none';
      const name = cid ? (coMap[cid]?.name || cid) : '소속 없음';
      if (!grp[key]) grp[key] = { key, name, count: 0 };
      grp[key].count++;
    });
    return Object.values(grp).sort((a, b) => b.count - a.count);
  }

  /* 모든 데이터 fetch */
  async function fetchAllData() {
    const [usersSnap, logsSnap, verifsSnap] = await Promise.all([
      window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'missionLogs')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications')),
    ]);
    return {
      users:  usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      logs:   logsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      verifs: verifsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  }

  /* ─── 시트 1: 종합 임팩트 ─── */
  function buildOverview(data) {
    const { users, logs, verifs } = data;
    const now = Date.now();
    const THIRTY = 30 * 86400 * 1000;

    const totalCO2  = users.reduce((s, u) => s + (u.co2 || 0), 0);
    const totalMis  = logs.length;
    const totalUser = users.length;
    const active30  = users.filter(u => {
      const last = u.lastMissionDate || u.lastLogin;
      if (!last) return false;
      const t = typeof last === 'string'
        ? new Date(last).getTime()
        : (last.seconds ? last.seconds * 1000 : 0);
      return (now - t) < THIRTY;
    }).length;
    const totalStory = verifs.filter(v => v.storyMode || (v.comment && v.comment.length >= 30)).length;
    const totalLike  = verifs.reduce((s, v) => s + ((v.likes || []).length), 0);

    return [
      ['EcoQuest ESG 임팩트 보고서', '', ''],
      [`생성일: ${new Date().toLocaleString('ko-KR')}`, '', ''],
      ['', '', ''],
      ['─── 회원 ───', '', ''],
      ['지표', '값', '설명'],
      ['총 회원 수', totalUser, '누적 가입자'],
      ['활성 회원 수 (최근 30일)', active30, '최근 30일 내 미션 인증한 회원'],
      ['활성률', `${totalUser ? ((active30 / totalUser) * 100).toFixed(1) : 0}%`, ''],
      ['', '', ''],
      ['─── 미션 / 환경 임팩트 ───', '', ''],
      ['총 미션 인증 수', totalMis, ''],
      ['평균 인증 수 (사용자당)', totalUser ? (totalMis / totalUser).toFixed(1) : 0, ''],
      ['총 CO₂ 절감량 (kg)', totalCO2.toFixed(2), '누적'],
      ['', '', ''],
      ['─── 환산 ───', '', ''],
      ['🌳 나무 그루 환산', `${(totalCO2 / 10).toFixed(1)} 그루`, '소나무 1그루 ≈ 연간 CO₂ 10kg 흡수'],
      ['🚗 자동차 km 환산', `${(totalCO2 / 0.21).toFixed(0)} km`, '자동차 1km당 CO₂ 0.21kg'],
      ['✈️ 비행기 시간 환산', `${(totalCO2 / 90).toFixed(2)} 시간/인`, '비행기 1시간/인당 CO₂ 90kg'],
      ['', '', ''],
      ['─── 콘텐츠 ───', '', ''],
      ['📚 에코 스토리 작성 수', totalStory, '30자 이상 후기'],
      ['❤️ 누적 좋아요', totalLike, ''],
    ];
  }

  /* ─── 시트 2: 미션별 통계 ─── */
  function buildMissionStats(data) {
    const { logs } = data;
    const byM = {};
    logs.forEach(l => {
      if (!l.missionId) return;
      if (!byM[l.missionId]) {
        byM[l.missionId] = {
          name: l.missionName || '', emoji: l.missionEmoji || '',
          count: 0, users: new Set(), co2: 0,
        };
      }
      byM[l.missionId].count++;
      byM[l.missionId].co2 += (l.co2 || 0);
      if (l.uid) byM[l.missionId].users.add(l.uid);
    });

    const rows = [['미션ID', '이모지', '미션명', '인증 수', '참여 사용자 수', '누적 CO₂(kg)', '평균 CO₂(kg)/회']];
    Object.entries(byM)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([id, m]) => rows.push([
        id, m.emoji, m.name, m.count, m.users.size,
        +m.co2.toFixed(2),
        m.count ? +(m.co2 / m.count).toFixed(2) : 0
      ]));
    return rows;
  }

  /* ─── 시트 3: 시계열 (월별) ─── */
  function buildTimeSeries(data) {
    const { users, logs, verifs } = data;
    const monthly = {};
    const ensure = k => { if (!monthly[k]) monthly[k] = { signups:0, missions:0, co2:0, stories:0 }; };

    users.forEach(u => {
      if (!u.createdAt?.seconds) return;
      const d = new Date(u.createdAt.seconds * 1000);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      ensure(k); monthly[k].signups++;
    });
    logs.forEach(l => {
      if (!l.date) return;
      const k = String(l.date).slice(0, 7);
      ensure(k); monthly[k].missions++; monthly[k].co2 += (l.co2 || 0);
    });
    verifs.forEach(v => {
      if (!v.createdAt?.seconds) return;
      const d = new Date(v.createdAt.seconds * 1000);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      ensure(k);
      if (v.storyMode || (v.comment && v.comment.length >= 30)) monthly[k].stories++;
    });

    const rows = [['월', '신규 가입', '미션 인증', 'CO₂ 절감(kg)', '에코 스토리(편)']];
    Object.entries(monthly)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([k, v]) => rows.push([k, v.signups, v.missions, +v.co2.toFixed(2), v.stories]));
    return rows;
  }

  /* ─── 시트 4: 지역별 ─── */
  function buildRegionStats(data) {
    const { users } = data;
    const byR = {};
    users.forEach(u => {
      const r = u.region || '미설정';
      if (!byR[r]) byR[r] = { count:0, co2:0, missions:0 };
      byR[r].count++;
      byR[r].co2 += (u.co2 || 0);
      byR[r].missions += (u.missionCount || 0);
    });
    const total = users.length;
    const rows = [['지역', '회원 수', '비율', '누적 CO₂(kg)', '누적 미션 수', '평균 미션/인']];
    Object.entries(byR)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([r, d]) => rows.push([
        r, d.count,
        `${total ? ((d.count / total) * 100).toFixed(1) : 0}%`,
        +d.co2.toFixed(2), d.missions,
        d.count ? +(d.missions / d.count).toFixed(1) : 0
      ]));
    return rows;
  }

  /* ─── 시트 5: 연령·성별 ─── */
  function buildDemographics(data) {
    const { users } = data;
    const byG = {};
    users.forEach(u => {
      const age = u.age || '미설정';
      const gender = u.gender || '미설정';
      const key = `${age}__${gender}`;
      if (!byG[key]) byG[key] = { age, gender, count:0, co2:0, missions:0 };
      byG[key].count++;
      byG[key].co2 += (u.co2 || 0);
      byG[key].missions += (u.missionCount || 0);
    });
    const rows = [['나이대', '성별', '회원 수', '누적 CO₂(kg)', '평균 미션/인']];
    Object.values(byG)
      .sort((a, b) => b.count - a.count)
      .forEach(d => rows.push([
        d.age, d.gender, d.count,
        +d.co2.toFixed(2),
        d.count ? +(d.missions / d.count).toFixed(1) : 0
      ]));
    return rows;
  }

  /* ─── 시트 6: 콘텐츠 임팩트 ─── */
  function buildContentImpact(data) {
    const { verifs } = data;
    const stories = verifs.filter(v => v.storyMode || (v.comment && v.comment.length >= 30));
    const byC = {};
    stories.forEach(v => {
      const cat = v.category || categorize(v.missionId);
      if (!byC[cat]) byC[cat] = { count:0, likes:0, authors:new Set() };
      byC[cat].count++;
      byC[cat].likes += (v.likes || []).length;
      if (v.uid) byC[cat].authors.add(v.uid);
    });
    const label = {
      book:'📖 책', movie:'🎬 영화·다큐', article:'📰 글·콘텐츠',
      review:'♻️ 제품·매장', story:'✨ 일반', photo:'📷 사진'
    };
    const rows = [['카테고리', '글 수', '받은 좋아요', '작성자 수', '평균 좋아요/글']];
    Object.entries(byC)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([k, d]) => rows.push([
        label[k] || k, d.count, d.likes, d.authors.size,
        d.count ? +(d.likes / d.count).toFixed(1) : 0
      ]));
    return rows;
  }

  /* ─── 시트 7: 회원 명부 ─── */
  function buildUserDirectory(data) {
    const { users } = data;
    const emailMap = window._adminEmailMap || {};
    const rows = [['UID','닉네임','이메일','휴대폰','나이대','성별','지역','직업','자동차','가구형태','환경관심도','관심분야','미션수','포인트','CO₂(kg)','가입일']];
    users.forEach(u => {
      const email = u.email || emailMap[u.id] || '';
      const phone = u.phoneNumber || u.phone || u.kakaoPhone || '';
      const created = u.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') || '';
      rows.push([
        u.id || '', u.nickname || '', email, phone,
        u.age || '', u.gender || '', u.region || '', u.job || '',
        u.hasCar || '', u.household || '', u.ecoLevel || '',
        (u.interests || []).join('|'),
        u.missionCount || 0, u.point || 0, +(u.co2 || 0).toFixed(2),
        created
      ]);
    });
    return rows;
  }

  /* ─── 메인: ESG 보고서 다운로드 ─── */
  async function downloadESGReport() {
    const btn = document.getElementById('ehESGBtn');
    const setBtnText = (t, dis = true) => {
      if (!btn) return;
      btn.disabled = dis;
      btn.textContent = t;
    };

    try {
      setBtnText('🔄 데이터 수집 중...', true);
      window.toast?.('데이터 수집 중...');

      // SheetJS 로드 + 데이터 fetch 동시
      const [_, allData] = await Promise.all([loadSheetJS(), fetchAllData()]);

      // 기업 필터 적용 (users.companyId 기준)
      const sel = document.getElementById('ehCompanyFilter');
      const selKey = sel?.value || 'all';
      const selCompany = sel?.options[sel.selectedIndex]?.dataset.companyName || '';
      let data = allData;
      if (selKey !== 'all') {
        let filteredUsers;
        if (selKey === '_none') {
          filteredUsers = allData.users.filter(u => !getCompanyId(u));
        } else {
          filteredUsers = allData.users.filter(u => getCompanyId(u) === selKey);
        }
        const userIdSet = new Set(filteredUsers.map(u => u.id));
        data = {
          users: filteredUsers,
          logs:  allData.logs.filter(l => userIdSet.has(l.uid)),
          verifs: allData.verifs.filter(v => userIdSet.has(v.uid)),
        };
        console.log(`[esg_stats] 기업 필터 적용: ${selCompany || '소속 없음'}, 회원 ${filteredUsers.length}명`);
      }

      if (!data.users.length) {
        window.toast?.('해당 기업에 소속된 회원이 없어요');
        setBtnText('📊 ESG 보고서 다운로드 (xlsx)', false);
        return;
      }

      setBtnText('🔄 보고서 생성 중...', true);

      const wb = XLSX.utils.book_new();
      const sheets = [
        ['종합 임팩트',   buildOverview(data)],
        ['미션별 통계',   buildMissionStats(data)],
        ['시계열 추이',   buildTimeSeries(data)],
        ['지역별 분포',   buildRegionStats(data)],
        ['연령·성별',     buildDemographics(data)],
        ['콘텐츠 임팩트', buildContentImpact(data)],
        ['회원 명부',     buildUserDirectory(data)],
      ];
      sheets.forEach(([name, rows]) => {
        const ws = XLSX.utils.aoa_to_sheet(rows);
        try {
          const colWidths = (rows[0] || []).map((_, i) => ({
            wch: Math.min(40, Math.max(...rows.map(r => String(r[i] ?? '').length)) + 2)
          }));
          ws['!cols'] = colWidths;
        } catch (e) {}
        XLSX.utils.book_append_sheet(wb, ws, name);
      });

      const today = new Date().toISOString().slice(0, 10);
      const tag = (selKey !== 'all')
        ? `_${(selCompany || '소속없음').replace(/[\\/:*?"<>|]/g, '_')}`
        : '';
      XLSX.writeFile(wb, `EcoQuest_ESG보고서${tag}_${today}.xlsx`);
      window.toast?.(`✅ ESG 보고서 다운로드 완료! (${data.users.length}명)`);
    } catch (e) {
      console.error('[esg_stats] 실패', e);
      window.toast?.('생성 실패: ' + (e.message || ''));
    } finally {
      setBtnText('📊 ESG 보고서 다운로드 (xlsx)', false);
    }
  }
  window.downloadESGReport = downloadESGReport;

  /* ─── 어드민 회원 탭에 버튼 + 기업 필터 추가 ─── */
  async function addESGBtn() {
    const adminUsers = document.getElementById('adminUsers');
    if (!adminUsers) return;
    if (document.getElementById('ehESGBtn')) {
      // 이미 있으면 기업 목록만 갱신
      await refreshCompanyList();
      return;
    }

    // 기업 필터 드롭다운 컨테이너
    const wrap = document.createElement('div');
    wrap.id = 'ehESGWrap';
    wrap.style.cssText = 'background:#f7f9fb;border-radius:10px;padding:10px;margin-bottom:10px;border:1px solid #e0e7ee';
    wrap.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:var(--sub);margin-bottom:6px">📊 ESG 보고서</div>
      <div style="display:flex;gap:6px;align-items:stretch;margin-bottom:8px">
        <select id="ehCompanyFilter" style="flex:1;padding:8px 10px;border:1.5px solid var(--bdr);border-radius:8px;background:#fff;font-size:12px;font-family:inherit;font-weight:600;color:var(--txt);cursor:pointer">
          <option value="all">전체 회원</option>
        </select>
        <button id="ehCompanyRefresh" style="background:#fff;border:1.5px solid var(--bdr);border-radius:8px;padding:0 10px;font-size:11px;cursor:pointer;font-family:inherit" title="기업 목록 새로고침">🔄</button>
      </div>
      <button id="ehESGBtn" style="width:100%;background:linear-gradient(135deg,#2c3e50,#34495e);color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,.15)">
        📊 ESG 보고서 다운로드 (xlsx)
      </button>
    `;

    // 기존 CSV 버튼 위에 삽입
    const csvBtn = document.getElementById('ehUserExportBtn');
    if (csvBtn?.parentElement) {
      csvBtn.parentElement.insertBefore(wrap, csvBtn);
    } else {
      adminUsers.insertBefore(wrap, adminUsers.firstChild);
    }

    document.getElementById('ehESGBtn').onclick = downloadESGReport;
    document.getElementById('ehCompanyRefresh').onclick = refreshCompanyList;

    // 첫 로드
    await refreshCompanyList();
  }

  /* 기업 목록 채우기 */
  async function refreshCompanyList() {
    const sel = document.getElementById('ehCompanyFilter');
    if (!sel) return;
    try {
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const list = await extractCompanyList(users);

      const cur = sel.value;
      sel.innerHTML = `<option value="all">전체 회원 (${users.length}명)</option>`;

      list.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.key;
        opt.dataset.companyName = c.name;
        opt.textContent = `${c.name} (${c.count}명)`;
        sel.appendChild(opt);
      });

      if (cur && Array.from(sel.options).some(o => o.value === cur)) {
        sel.value = cur;
      }
      console.log('[esg_stats] 기업 목록:', list);
    } catch (e) {
      console.warn('[esg_stats] 기업 목록 로딩 실패', e);
    }
  }

  setTimeout(addESGBtn, 1000);
  [2000, 3500, 5000, 8000].forEach(t => setTimeout(addESGBtn, t));

  // 어드민 탭 클릭 시도 후크
  const _origGoPage = window.goPage;
  if (typeof _origGoPage === 'function' && !window._ehESGGoPageHooked) {
    window.goPage = function (...a) {
      const r = _origGoPage.apply(this, a);
      setTimeout(addESGBtn, 300);
      return r;
    };
    window._ehESGGoPageHooked = true;
  }

  console.log('[esg_stats_patch] ✅ ESG 보고서 다운로드 준비');
})();
