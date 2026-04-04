// =============================================
// EcoQuest 쿠폰 패치 (coupon_patch.js)
// 기존 patch.js 대신 이 파일로 교체하거나 추가
// =============================================

// ── 1. BOOKS 배열 덮어쓰기 (라니 시리즈 제거) ──
window.addEventListener('load', () => {
  // BOOKS 초기화 (라니 제거, 쿠폰 안내만)
  window.BOOKS = [];

  // 스토어 탭 타이틀 변경
  const shopSec = document.querySelector('#page-shop .sec .sec-t');
  if (shopSec) shopSec.textContent = '🎁 쿠폰 스토어';

  // 스토어 렌더링 오버라이드
  window.renderBooks = renderCouponStore;
  renderCouponStore();

  // 어드민 쿠폰 탭 추가
  injectAdminCouponTab();
});

// ── 2. Firebase 쿠폰 함수 ──
async function getCoupons() {
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'coupons'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.active !== false);
  } catch (e) { return []; }
}

async function getMyIssuedCoupons(uid) {
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'couponCodes'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.issuedTo === uid);
  } catch (e) { return []; }
}

// 쿠폰 교환 (포인트 차감 + 코드 발급)
async function exchangeCoupon(couponId) {
  const uid = window.ME?.uid;
  if (!uid) { toast('로그인이 필요해요!'); return; }

  const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'coupons', couponId));
  if (!snap.exists()) { toast('쿠폰 정보를 찾을 수 없어요'); return; }
  const coupon = { id: snap.id, ...snap.data() };

  const myPoint = window.UDATA?.point || 0;
  if (myPoint < coupon.pointCost) {
    toast(`포인트가 부족해요! ${coupon.pointCost.toLocaleString()}P 필요`);
    return;
  }

  const remaining = (coupon.totalQty || 0) - (coupon.usedQty || 0);
  if (remaining <= 0) { toast('쿠폰이 모두 소진됐어요 😢'); return; }

  if (!confirm(`${coupon.brandName} ${coupon.discount.toLocaleString()}원 쿠폰을 ${coupon.pointCost.toLocaleString()}P로 교환할까요?`)) return;

  try {
    // 코드 생성
    const code = coupon.codePrefix
      ? `${coupon.codePrefix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
      : `ECO-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    // couponCodes에 저장
    await window.FB.addDoc(window.FB.collection(window.FB.db, 'couponCodes'), {
      couponId,
      brandName: coupon.brandName,
      brandEmoji: coupon.brandEmoji || '🎁',
      discount: coupon.discount,
      minPurchase: coupon.minPurchase || 0,
      code,
      issuedTo: uid,
      issuedAt: window.FB.serverTimestamp(),
      isUsed: false,
    });

    // 쿠폰 usedQty +1
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'coupons', couponId), {
      usedQty: window.FB.increment(1),
    });

    // 포인트 차감
    const newPoint = myPoint - coupon.pointCost;
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', uid), { point: newPoint });
    window.UDATA.point = newPoint;
    if (window.updateUI) window.updateUI();

    toast(`🎉 쿠폰 발급 완료! 코드: ${code}`);
    renderCouponStore();
    showMyCoupons(uid);
  } catch (e) {
    toast('교환 실패: ' + e.message);
  }
}

// ── 3. 쿠폰 스토어 렌더링 ──
async function renderCouponStore() {
  const el = document.getElementById('bookList');
  if (!el) return;

  const uid = window.ME?.uid;
  const myPoint = window.UDATA?.point || 0;

  el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">쿠폰 로딩 중...</div>`;

  const coupons = await getCoupons();

  if (!coupons.length) {
    el.innerHTML = `
      <div style="margin:12px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:16px;padding:20px;text-align:center;border:1.5px dashed var(--g1)">
        <div style="font-size:40px;margin-bottom:8px">🌱</div>
        <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:6px">제휴 쿠폰을 준비 중이에요!</div>
        <div style="font-size:12px;color:var(--sub);line-height:1.7">친환경 브랜드와 제휴를 맺고 있어요.<br/>곧 다양한 쿠폰이 등장할 거예요 🎁</div>
      </div>
    `;
  } else {
    el.innerHTML = coupons.map(c => {
      const remaining = (c.totalQty || 0) - (c.usedQty || 0);
      const canAfford = myPoint >= c.pointCost;
      const soldOut = remaining <= 0;
      return `
        <div style="background:#fff;border-radius:14px;padding:14px;margin:0 12px 10px;border:1.5px solid ${soldOut ? '#eee' : 'var(--bdr)'};opacity:${soldOut ? 0.6 : 1}">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#1a6b3a,#2ECC71);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">${c.brandEmoji || '🎁'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:11px;font-weight:700;background:#e8f5e9;color:var(--g2);padding:2px 7px;border-radius:8px;display:inline-block;margin-bottom:4px">${c.brandName}</div>
              <div style="font-size:15px;font-weight:900;color:var(--txt)">${c.discount.toLocaleString()}원 할인</div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">${c.minPurchase ? `${c.minPurchase.toLocaleString()}원 이상 구매 시` : '구매금액 제한 없음'} · 1인 1매</div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
                <div>
                  <span style="font-size:14px;font-weight:900;color:var(--g2)">${c.pointCost.toLocaleString()}P</span>
                  <span style="font-size:10px;color:var(--sub);margin-left:4px">잔여 ${remaining}매</span>
                </div>
                <button onclick="exchangeCoupon('${c.id}')"
                  style="background:${soldOut ? '#f0f0f0' : canAfford ? 'linear-gradient(135deg,var(--g1),var(--g2))' : '#f0f0f0'};color:${canAfford && !soldOut ? '#fff' : 'var(--sub)'};border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit"
                  ${soldOut ? 'disabled' : ''}>
                  ${soldOut ? '소진됨' : canAfford ? '교환하기' : 'P 부족'}
                </button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // 내 쿠폰 섹션
  if (uid) {
    const mySection = document.createElement('div');
    mySection.id = 'myCouponSection';
    mySection.style.cssText = 'padding:0 12px;margin-top:4px';
    el.after(mySection);
    showMyCoupons(uid);
  }
}
window.renderCouponStore = renderCouponStore;
window.exchangeCoupon = exchangeCoupon;

async function showMyCoupons(uid) {
  let sec = document.getElementById('myCouponSection');
  if (!sec) {
    sec = document.createElement('div');
    sec.id = 'myCouponSection';
    sec.style.cssText = 'padding:0 12px;margin-top:4px';
    const bl = document.getElementById('bookList');
    if (bl) bl.after(sec);
  }

  const codes = await getMyIssuedCoupons(uid);
  if (!codes.length) { sec.innerHTML = ''; return; }

  sec.innerHTML = `
    <div style="font-size:15px;font-weight:900;color:var(--txt);margin:12px 0 8px">🎟️ 내 쿠폰함</div>
    ${codes.map(c => `
      <div style="background:${c.isUsed ? '#f8f8f8' : '#f0fbf4'};border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1.5px solid ${c.isUsed ? '#eee' : 'var(--g1)'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-size:13px;font-weight:700;color:var(--txt)">${c.brandEmoji || '🎁'} ${c.brandName}</div>
          <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px;background:${c.isUsed ? '#eee' : '#e8f5e9'};color:${c.isUsed ? '#aaa' : 'var(--g2)'}">
            ${c.isUsed ? '사용완료' : '미사용'}
          </span>
        </div>
        <div style="font-size:12px;color:var(--sub);margin-bottom:6px">${c.discount.toLocaleString()}원 할인${c.minPurchase ? ` (${c.minPurchase.toLocaleString()}원 이상)` : ''}</div>
        <div style="background:${c.isUsed ? '#eee' : '#fff'};border-radius:8px;padding:8px 12px;font-size:14px;font-weight:900;letter-spacing:2px;color:${c.isUsed ? '#aaa' : 'var(--txt)'};text-align:center;border:1px dashed ${c.isUsed ? '#ddd' : 'var(--g1)'}">
          ${c.code}
        </div>
        ${!c.isUsed ? `<div style="font-size:11px;color:var(--sub);text-align:center;margin-top:6px">매장에서 이 코드를 보여주세요</div>` : ''}
      </div>
    `).join('')}
  `;
}
window.showMyCoupons = showMyCoupons;

// ── 4. 어드민 쿠폰 탭 주입 ──
function injectAdminCouponTab() {
  // 탭 버튼 추가
  const tabWrap = document.querySelector('#adminPage .admin-tab')?.parentElement;
  if (tabWrap) {
    const btn = document.createElement('button');
    btn.className = 'admin-tab';
    btn.textContent = '🎁 쿠폰';
    btn.onclick = () => {
      if (typeof setAdminTab === 'function') setAdminTab('coupons', btn);
      loadAdminCoupons();
    };
    tabWrap.appendChild(btn);
  }

  // 쿠폰 탭 패널 추가
  const adminContent = document.getElementById('admin-stats')?.parentElement;
  if (adminContent) {
    const panel = document.createElement('div');
    panel.id = 'admin-coupons';
    panel.style.display = 'none';
    panel.innerHTML = `
      <!-- 쿠폰 추가 폼 -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;border:1px solid #eee">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px">➕ 새 쿠폰 등록</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <input id="cpBrand" placeholder="브랜드명 (예: 알맹상점)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
          <input id="cpEmoji" placeholder="이모지 (예: ♻️)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
          <input id="cpDiscount" type="number" placeholder="할인금액 (원, 예: 2000)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
          <input id="cpMinPurchase" type="number" placeholder="최소 구매금액 (원, 0이면 제한없음)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
          <input id="cpPointCost" type="number" placeholder="필요 포인트 (예: 500)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
          <input id="cpTotalQty" type="number" placeholder="총 발행 수량 (예: 50)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
          <input id="cpCodePrefix" placeholder="코드 접두어 (예: ALMANG, 없으면 ECO)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
          <button onclick="addAdminCoupon()" style="background:var(--g1);color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">등록하기</button>
        </div>
      </div>

      <!-- 발급된 쿠폰 코드 검색 + 사용처리 -->
      <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;border:1px solid #eee">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px">🔍 쿠폰 코드 사용처리</div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input id="cpSearchCode" placeholder="코드 입력 (예: ALMANG-AB3CD)" style="flex:1;border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit;text-transform:uppercase"/>
          <button onclick="searchCouponCode()" style="background:var(--blue);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">검색</button>
        </div>
        <div id="cpSearchResult"></div>
      </div>

      <!-- 등록된 쿠폰 목록 -->
      <div style="background:#fff;border-radius:14px;padding:14px;border:1px solid #eee">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-size:13px;font-weight:700">📋 등록된 쿠폰</div>
          <button onclick="loadAdminCoupons()" style="background:#f0f0f0;border:none;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">새로고침</button>
        </div>
        <div id="adminCouponList"><div style="text-align:center;color:#aaa;padding:12px;font-size:12px">로딩 중...</div></div>
      </div>
    `;
    adminContent.appendChild(panel);
  }

  // setAdminTab 오버라이드 (쿠폰 탭 처리 추가)
  const origSetAdminTab = window.setAdminTab;
  window.setAdminTab = function(t, el) {
    if (t === 'coupons') {
      ['orders','users','missions','stats'].forEach(id => {
        const d = document.getElementById('admin-' + id);
        if (d) d.style.display = 'none';
      });
      const cp = document.getElementById('admin-coupons');
      if (cp) cp.style.display = 'block';
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('on'));
      if (el) el.classList.add('on');
      loadAdminCoupons();
    } else {
      const cp = document.getElementById('admin-coupons');
      if (cp) cp.style.display = 'none';
      if (origSetAdminTab) origSetAdminTab(t, el);
    }
  };
}

// 어드민: 쿠폰 목록 로드
async function loadAdminCoupons() {
  const w = document.getElementById('adminCouponList');
  if (!w) return;
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'coupons'));
    const coupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!coupons.length) {
      w.innerHTML = '<div style="text-align:center;color:#aaa;padding:12px;font-size:12px">등록된 쿠폰이 없어요</div>';
      return;
    }
    w.innerHTML = coupons.map(c => {
      const remaining = (c.totalQty || 0) - (c.usedQty || 0);
      return `
        <div style="padding:10px;background:#f8fdf9;border-radius:10px;margin-bottom:8px;border:1px solid var(--bdr)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:700">${c.brandEmoji || '🎁'} ${c.brandName}</div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">${c.discount.toLocaleString()}원 할인 · ${c.pointCost.toLocaleString()}P · 접두어: ${c.codePrefix || 'ECO'}</div>
              <div style="font-size:11px;color:var(--sub)">발행 ${c.totalQty || 0}개 · 사용 ${c.usedQty || 0}개 · <b style="color:${remaining > 0 ? 'var(--g2)' : 'var(--red)'}">잔여 ${remaining}개</b></div>
            </div>
            <div style="display:flex;gap:4px">
              <button onclick="toggleCouponActive('${c.id}',${!c.active})"
                style="background:${c.active !== false ? '#e8f5e9' : '#fee'};color:${c.active !== false ? 'var(--g2)' : 'var(--red)'};border:none;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">
                ${c.active !== false ? '활성' : '비활성'}
              </button>
              <button onclick="deleteCoupon('${c.id}')"
                style="background:#fee;color:var(--red);border:none;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">삭제</button>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (e) {
    w.innerHTML = '<div style="color:red;font-size:12px">로딩 실패: ' + e.message + '</div>';
  }
}
window.loadAdminCoupons = loadAdminCoupons;

// 어드민: 쿠폰 등록
window.addAdminCoupon = async function() {
  const brand = document.getElementById('cpBrand')?.value.trim();
  const emoji = document.getElementById('cpEmoji')?.value.trim() || '🎁';
  const discount = parseInt(document.getElementById('cpDiscount')?.value) || 0;
  const minPurchase = parseInt(document.getElementById('cpMinPurchase')?.value) || 0;
  const pointCost = parseInt(document.getElementById('cpPointCost')?.value) || 0;
  const totalQty = parseInt(document.getElementById('cpTotalQty')?.value) || 0;
  const codePrefix = document.getElementById('cpCodePrefix')?.value.trim().toUpperCase() || 'ECO';

  if (!brand || !discount || !pointCost || !totalQty) {
    toast('브랜드명, 할인금액, 포인트, 수량은 필수예요!');
    return;
  }

  try {
    await window.FB.addDoc(window.FB.collection(window.FB.db, 'coupons'), {
      brandName: brand,
      brandEmoji: emoji,
      discount,
      minPurchase,
      pointCost,
      totalQty,
      usedQty: 0,
      codePrefix,
      active: true,
      createdAt: window.FB.serverTimestamp(),
    });
    toast('✅ 쿠폰 등록 완료!');
    ['cpBrand','cpEmoji','cpDiscount','cpMinPurchase','cpPointCost','cpTotalQty','cpCodePrefix'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    loadAdminCoupons();
    renderCouponStore();
  } catch (e) {
    toast('등록 실패: ' + e.message);
  }
};

// 어드민: 쿠폰 코드 검색 + 사용처리
window.searchCouponCode = async function() {
  const code = document.getElementById('cpSearchCode')?.value.trim().toUpperCase();
  if (!code) { toast('코드를 입력해주세요!'); return; }

  const res = document.getElementById('cpSearchResult');
  if (!res) return;
  res.innerHTML = '<div style="font-size:12px;color:#aaa">검색 중...</div>';

  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'couponCodes'));
    const found = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(c => c.code === code);

    if (!found) {
      res.innerHTML = '<div style="background:#fee;border-radius:10px;padding:10px;font-size:12px;color:var(--red)">❌ 존재하지 않는 코드예요</div>';
      return;
    }

    res.innerHTML = `
      <div style="background:${found.isUsed ? '#f8f8f8' : '#f0fbf4'};border-radius:10px;padding:12px;border:1.5px solid ${found.isUsed ? '#eee' : 'var(--g1)'}">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">${found.brandEmoji || '🎁'} ${found.brandName}</div>
        <div style="font-size:12px;color:var(--sub);margin-bottom:4px">${found.discount.toLocaleString()}원 할인 · 코드: <b>${found.code}</b></div>
        <div style="font-size:11px;color:var(--sub);margin-bottom:8px">발급자 UID: ${found.issuedTo?.slice(0,8)}...</div>
        <div style="font-size:12px;font-weight:700;color:${found.isUsed ? 'var(--red)' : 'var(--g2)'};margin-bottom:8px">
          ${found.isUsed ? '✅ 이미 사용된 쿠폰이에요' : '🟢 미사용 쿠폰 — 사용처리 가능'}
        </div>
        ${!found.isUsed ? `
          <button onclick="markCouponUsed('${found.id}')"
            style="background:var(--g1);color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%">
            ✅ 사용 완료 처리
          </button>` : ''}
      </div>`;
  } catch (e) {
    res.innerHTML = '<div style="color:red;font-size:12px">검색 실패: ' + e.message + '</div>';
  }
};

// 어드민: 사용처리
window.markCouponUsed = async function(docId) {
  if (!confirm('이 쿠폰을 사용완료 처리할까요?')) return;
  try {
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'couponCodes', docId), {
      isUsed: true,
      usedAt: window.FB.serverTimestamp(),
    });
    toast('✅ 사용처리 완료!');
    document.getElementById('cpSearchCode').value = '';
    document.getElementById('cpSearchResult').innerHTML = '';
  } catch (e) {
    toast('처리 실패: ' + e.message);
  }
};

// 어드민: 활성/비활성 토글
window.toggleCouponActive = async function(id, newVal) {
  try {
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'coupons', id), { active: newVal });
    toast(newVal ? '✅ 쿠폰 활성화됐어요' : '🔒 쿠폰 비활성화됐어요');
    loadAdminCoupons();
    renderCouponStore();
  } catch (e) { toast('변경 실패'); }
};

// 어드민: 쿠폰 삭제
window.deleteCoupon = async function(id) {
  if (!confirm('이 쿠폰을 삭제할까요?')) return;
  try {
    await window.FB.deleteDoc(window.FB.doc(window.FB.db, 'coupons', id));
    toast('🗑️ 삭제됐어요');
    loadAdminCoupons();
    renderCouponStore();
  } catch (e) { toast('삭제 실패'); }
};
