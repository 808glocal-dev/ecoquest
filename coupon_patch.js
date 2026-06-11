/* =====================================================
   EcoQuest 쿠폰 패치 v4
   - "할인" → "교환권" 표시 변경
   - 어드민 쿠폰 수정 기능 추가
   ===================================================== */

window.addEventListener('load', () => {
  window.BOOKS = [];
  const shopSec = document.querySelector('#page-shop .sec .sec-t');
  if (shopSec) shopSec.textContent = '🎁 쿠폰 스토어';
  window.renderBooks = renderCouponStore;
  renderCouponStore();
  injectAdminCouponTab();
});

// ── Firebase 쿠폰 조회 ──
async function getCoupons() {
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'coupons'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.active !== false);
  } catch (e) { return []; }
}

async function getMyIssuedCoupons(uid) {
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'couponCodes'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.issuedTo === uid)
      .sort((a, b) => (b.issuedAt?.seconds || 0) - (a.issuedAt?.seconds || 0));
  } catch (e) { return []; }
}

// ── 쿠폰 교환 ──
async function exchangeCoupon(couponId) {
  const uid = window.ME?.uid;
  if (!uid) { toast('로그인이 필요해요!'); return; }
  const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'coupons', couponId));
  if (!snap.exists()) { toast('쿠폰 정보를 찾을 수 없어요'); return; }
  const coupon = { id: snap.id, ...snap.data() };
  if ((coupon.totalQty || 0) - (coupon.usedQty || 0) <= 0) { toast('쿠폰이 모두 소진됐어요 😢'); return; }
  const myPoint = window.UDATA?.point || 0;
  const awardLabel = coupon.awardName ? `${coupon.awardName} 교환권` : '교환권';

  // drainAll 쿠폰은 비밀코드 입력 필요
  if (coupon.drainAll) {
    showDrainCodeModal(coupon, uid, myPoint, awardLabel);
    return;
  }

  // 일반 쿠폰
  const costToUse = coupon.pointCost;
  if (myPoint < costToUse) { toast(`포인트 부족! ${costToUse.toLocaleString()}P 필요`); return; }
  if (!confirm(`${coupon.brandName} ${awardLabel}을 ${costToUse.toLocaleString()}P로 교환할까요?`)) return;
  try {
    const code = `${coupon.codePrefix || 'ECO'}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
    await window.FB.addDoc(window.FB.collection(window.FB.db, 'couponCodes'), {
      couponId, brandName: coupon.brandName, brandEmoji: coupon.brandEmoji || '🎁',
      brandEmail: coupon.brandEmail || '', discount: coupon.discount,
      minPurchase: coupon.minPurchase || 0, code,
      issuedTo: uid, issuedAt: window.FB.serverTimestamp(), isUsed: false,
      pointsSpent: costToUse,
    });
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'coupons', couponId), { usedQty: window.FB.increment(1) });
    const newPoint = Math.max(0, myPoint - costToUse);
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', uid), { point: newPoint });
    window.UDATA.point = newPoint;
    if (window.updateUI) window.updateUI();
    toast('🎉 교환권 발급 완료!');
    renderCouponStore();
    showMyCoupons(uid);
  } catch (e) { toast('교환 실패: ' + e.message); }
}


// ── drainAll 비밀코드 입력 모달 ──
function showDrainCodeModal(coupon, uid, myPoint, awardLabel) {
  document.getElementById('drainCodeOv')?.remove();
  const ov = document.createElement('div');
  ov.id = 'drainCodeOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px;width:100%;max-width:340px;text-align:center">
      <div style="font-size:52px;margin-bottom:8px">${coupon.brandEmoji || '🎁'}</div>
      <div style="font-size:16px;font-weight:900;color:var(--txt);margin-bottom:4px">${coupon.brandName}</div>
      <div style="font-size:13px;color:var(--sub);margin-bottom:20px">${awardLabel}</div>
      <div style="background:#fff8e1;border-radius:12px;padding:12px;margin-bottom:16px;border:1px solid #f39c12;text-align:left">
        <div style="font-size:12px;color:#8B5E04;font-weight:700;margin-bottom:2px">⚠️ 교환 안내</div>
        <div style="font-size:11px;color:#8B5E04;line-height:1.7">수상자에게 전달된 비밀코드를 입력하세요.</div>
        <div style="font-size:13px;font-weight:900;color:#C0392B;margin-top:6px">내 포인트 ${myPoint.toLocaleString()}P 전액 차감</div>
      </div>
      <input id="drainCodeInput" placeholder="비밀코드 입력" maxlength="30"
        style="width:100%;border:1.5px solid #ddd;border-radius:12px;padding:12px;font-size:15px;font-family:inherit;text-align:center;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;box-sizing:border-box"
        onkeydown="if(event.key==='Enter') confirmDrainCode('${coupon.id}')"/>
      <div id="drainCodeError" style="font-size:12px;color:var(--red);margin-bottom:10px;display:none">❌ 코드가 맞지 않아요</div>
      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('drainCodeOv').remove()"
          style="flex:1;padding:12px;border:none;border-radius:12px;background:#f0f0f0;color:var(--sub);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">취소</button>
        <button onclick="confirmDrainCode('${coupon.id}')"
          style="flex:2;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
          확인
        </button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  setTimeout(() => document.getElementById('drainCodeInput')?.focus(), 100);
}

window.confirmDrainCode = async function(couponId) {
  const inputCode = document.getElementById('drainCodeInput')?.value.trim().toUpperCase();
  if (!inputCode) { toast('코드를 입력해주세요!'); return; }

  const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'coupons', couponId));
  if (!snap.exists()) { toast('쿠폰 정보를 찾을 수 없어요'); return; }
  const coupon = { id: snap.id, ...snap.data() };

  // secretCode 필드와 대조
  if (!coupon.secretCode || coupon.secretCode.toUpperCase() !== inputCode) {
    const errEl = document.getElementById('drainCodeError');
    if (errEl) errEl.style.display = 'block';
    return;
  }

  document.getElementById('drainCodeOv')?.remove();
  const uid = window.ME?.uid;
  const myPoint = window.UDATA?.point || 0;
  const awardLabel = coupon.awardName ? `${coupon.awardName} 교환권` : '교환권';

  try {
    const code = `${coupon.codePrefix || 'ECO'}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
    await window.FB.addDoc(window.FB.collection(window.FB.db, 'couponCodes'), {
      couponId, brandName: coupon.brandName, brandEmoji: coupon.brandEmoji || '🎁',
      brandEmail: coupon.brandEmail || '', discount: coupon.discount || 0,
      minPurchase: coupon.minPurchase || 0, code,
      issuedTo: uid, issuedAt: window.FB.serverTimestamp(), isUsed: false,
      pointsSpent: myPoint,
    });
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'coupons', couponId), { usedQty: window.FB.increment(1) });
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', uid), { point: 0 });
    window.UDATA.point = 0;
    if (window.updateUI) window.updateUI();
    toast(`🎉 ${awardLabel} 발급 완료! 포인트 ${myPoint.toLocaleString()}P 차감됐어요`);
    renderCouponStore();
    showMyCoupons(uid);
  } catch(e) { toast('교환 실패: ' + e.message); }
};

// ── 사용하기 버튼 ──
window.useCouponNow = async function (docId) {
  const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'couponCodes', docId));
  if (!snap.exists()) { toast('쿠폰 정보를 찾을 수 없어요'); return; }
  const c = snap.data();
  if (c.isUsed) { toast('이미 사용된 교환권이에요'); return; }
  document.getElementById('couponUseOv')?.remove();
  const ov = document.createElement('div');
  ov.id = 'couponUseOv';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  const label = c.discount > 0 ? `${c.discount.toLocaleString()}원 교환권` : '교환권';
  ov.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:24px;width:100%;max-width:340px;text-align:center">
      <div style="font-size:52px;margin-bottom:8px">${c.brandEmoji || '🎁'}</div>
      <div style="font-size:16px;font-weight:900;color:var(--txt);margin-bottom:4px">${c.brandName}</div>
      <div style="font-size:13px;color:var(--sub);margin-bottom:16px">${label}</div>
      <div style="background:#f0fbf4;border-radius:12px;padding:16px;margin-bottom:14px;border:1.5px solid var(--g1)">
        <div style="font-size:11px;color:var(--sub);margin-bottom:4px">교환 코드</div>
        <div style="font-size:22px;font-weight:900;letter-spacing:3px;color:var(--txt)">${c.code}</div>
        ${c.minPurchase ? `<div style="font-size:11px;color:var(--sub);margin-top:6px">${c.minPurchase.toLocaleString()}원 이상 구매 시</div>` : ''}
      </div>
      <div style="background:#fff8e1;border-radius:10px;padding:10px;margin-bottom:16px;border:1px solid #f39c12">
        <div style="font-size:12px;color:#8B5E04;font-weight:700">⚠️ 사용하기를 누르면 되돌릴 수 없어요</div>
        <div style="font-size:11px;color:#8B5E04;margin-top:2px">실제 매장에서 사용할 때만 눌러주세요</div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('couponUseOv').remove()"
          style="flex:1;padding:12px;border:none;border-radius:12px;background:#f0f0f0;color:var(--sub);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">취소</button>
        <button onclick="confirmUseCoupon('${docId}')"
          style="flex:2;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
          ✅ 사용했어요!
        </button>
      </div>
    </div>`;
  document.body.appendChild(ov);
};

window.confirmUseCoupon = async function (docId) {
  document.getElementById('couponUseOv')?.remove();
  try {
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'couponCodes', docId), {
      isUsed: true, usedAt: window.FB.serverTimestamp(), usedBy: window.ME?.uid || '',
    });
    toast('✅ 교환권 사용 완료!');
    if (window.ME?.uid) showMyCoupons(window.ME.uid);
  } catch (e) { toast('처리 실패: ' + e.message); }
};

// ── 쿠폰 스토어 렌더링 ──
async function renderCouponStore() {
  const el = document.getElementById('bookList');
  if (!el) return;
  el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">로딩 중...</div>`;
  const coupons = await getCoupons();
  const myPoint = window.UDATA?.point || 0;
  if (!coupons.length) {
    el.innerHTML = `
      <div style="margin:12px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:16px;padding:20px;text-align:center;border:1.5px dashed var(--g1)">
        <div style="font-size:40px;margin-bottom:8px">🌱</div>
        <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:6px">제휴 교환권 준비 중이에요!</div>
        <div style="font-size:12px;color:var(--sub);line-height:1.7">친환경 브랜드와 제휴를 맺고 있어요.<br/>곧 다양한 교환권이 등장할 거예요 🎁</div>
      </div>`;
  } else {
    el.innerHTML = coupons.map(c => {
      const remaining = (c.totalQty||0)-(c.usedQty||0);
      const isDrainAll = c.drainAll === true;
      const canAfford = isDrainAll || myPoint >= c.pointCost;
      const soldOut = remaining <= 0;
      const awardLabel = c.awardName ? `${c.awardName} 교환권` : '교환권';
      const subLabel = c.minPurchase ? `1인 1매 · ${c.minPurchase.toLocaleString()}원 이상` : '1인 1매';
      const pointLabel = isDrainAll ? '보유 포인트 전액' : `${c.pointCost.toLocaleString()}P`;
      return `
        <div style="background:#fff;border-radius:14px;padding:14px;margin:0 12px 10px;border:1.5px solid ${soldOut?'#eee':'var(--bdr)'};opacity:${soldOut?0.6:1}">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#1a6b3a,#2ECC71);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">${c.brandEmoji||'🎁'}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:2px">${c.brandName}</div>
              <div style="font-size:11px;color:var(--sub);margin-bottom:6px">${awardLabel}</div>
              <div style="font-size:11px;color:var(--sub);margin-bottom:8px">${subLabel}</div>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div>
                  <span style="font-size:14px;font-weight:900;color:var(--g2)">${pointLabel}</span>
                  <span style="font-size:10px;color:var(--sub);margin-left:4px">잔여 ${remaining}매</span>
                </div>
                <button onclick="exchangeCoupon('${c.id}')"
                  style="background:${soldOut?'#f0f0f0':canAfford?'linear-gradient(135deg,var(--g1),var(--g2))':'#f0f0f0'};color:${canAfford&&!soldOut?'#fff':'var(--sub)'};border:none;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit"
                  ${soldOut?'disabled':''}>
                  ${soldOut?'소진됨':canAfford?'교환하기':'P 부족'}
                </button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }
  let mySection = document.getElementById('myCouponSection');
  if (!mySection) { mySection = document.createElement('div'); mySection.id = 'myCouponSection'; el.after(mySection); }
  if (window.ME?.uid) showMyCoupons(window.ME.uid);
}
window.renderCouponStore = renderCouponStore;
window.exchangeCoupon = exchangeCoupon;

// ── 내 쿠폰함 ──
async function showMyCoupons(uid) {
  let sec = document.getElementById('myCouponSection');
  if (!sec) { sec = document.createElement('div'); sec.id = 'myCouponSection'; document.getElementById('bookList')?.after(sec); }
  const codes = await getMyIssuedCoupons(uid);
  if (!codes.length) { sec.innerHTML = ''; return; }
  sec.innerHTML = `
    <div style="font-size:15px;font-weight:900;color:var(--txt);margin:12px 12px 8px">🎟️ 내 교환권함</div>
    ${codes.map(c => {
      const label = c.discount > 0 ? `${c.discount.toLocaleString()}원 교환권` : '교환권';
      return `
      <div style="background:${c.isUsed?'#f8f8f8':'#f0fbf4'};border-radius:12px;padding:12px 14px;margin:0 12px 8px;border:1.5px solid ${c.isUsed?'#eee':'var(--g1)'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-size:13px;font-weight:700;color:var(--txt)">${c.brandEmoji||'🎁'} ${c.brandName}</div>
          <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px;background:${c.isUsed?'#eee':'#e8f5e9'};color:${c.isUsed?'#aaa':'var(--g2)'}">
            ${c.isUsed?'✅ 사용완료':'미사용'}
          </span>
        </div>
        <div style="font-size:12px;color:var(--sub);margin-bottom:8px">${label}${c.minPurchase?` · ${c.minPurchase.toLocaleString()}원 이상`:''}</div>
        <div style="background:${c.isUsed?'#eee':'#fff'};border-radius:8px;padding:10px 12px;font-size:16px;font-weight:900;letter-spacing:2px;color:${c.isUsed?'#bbb':'var(--txt)'};text-align:center;border:1px dashed ${c.isUsed?'#ddd':'var(--g1)'};margin-bottom:${c.isUsed?'0':'8px'}">
          ${c.code}
        </div>
        ${!c.isUsed?`
          <button onclick="useCouponNow('${c.id}')"
            style="width:100%;padding:11px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--g1),var(--g2));color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            매장에서 사용하기 ✅
          </button>`:`
          <div style="font-size:11px;color:#bbb;text-align:center;margin-top:4px">
            ${c.usedAt?new Date(c.usedAt.seconds*1000).toLocaleDateString('ko-KR')+' 사용됨':'사용됨'}
          </div>`}
      </div>`;
    }).join('')}`;
}
window.showMyCoupons = showMyCoupons;

// ── 어드민 쿠폰 탭 ──
function injectAdminCouponTab() {
  const tabWrap = document.querySelector('#adminPage .admin-tab')?.parentElement;
  if (tabWrap) {
    const btn = document.createElement('button');
    btn.className = 'admin-tab';
    btn.textContent = '🎁 쿠폰';
    btn.onclick = () => { if (typeof setAdminTab==='function') setAdminTab('coupons', btn); loadAdminCoupons(); };
    tabWrap.appendChild(btn);
  }

  const adminContent = document.getElementById('admin-stats')?.parentElement;
  if (adminContent) {
    const panel = document.createElement('div');
    panel.id = 'admin-coupons';
    panel.style.display = 'none';
    panel.innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:12px">
        <button id="cpTab-list" onclick="setCpTab('list')"
          style="flex:1;padding:8px;border-radius:10px;border:1.5px solid var(--g1);background:var(--g1);color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📋 쿠폰 관리</button>
        <button id="cpTab-history" onclick="setCpTab('history')"
          style="flex:1;padding:8px;border-radius:10px;border:1.5px solid #ddd;background:#fff;color:#666;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📊 발급 내역</button>
      </div>

      <div id="cpPanel-list">
        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;border:1px solid #eee">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">➕ 쿠폰 등록</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <input id="cpBrand" placeholder="브랜드명" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEmoji" placeholder="이모지 (예: ♻️)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEmail" placeholder="브랜드 이메일 (선택)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpDiscount" type="number" placeholder="교환 금액 (원, 0이면 단순 교환권)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpMinPurchase" type="number" placeholder="최소 구매금액 (0이면 제한없음)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpPointCost" type="number" placeholder="필요 포인트" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpTotalQty" type="number" placeholder="총 발행 수량" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpCodePrefix" placeholder="코드 접두어 (예: MYSC-MVP)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <button onclick="addAdminCoupon()" style="background:var(--g1);color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">등록하기</button>
            <input id="cpAwardName" placeholder="상 이름 (예: MVP 1등) — 선택" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:4px 0"><input type="checkbox" id="cpDrainAll" style="width:16px;height:16px;cursor:pointer" onchange="document.getElementById('cpSecretWrap').style.display=this.checked?'block':'none'"/> 포인트 전액 차감 (수상자용)</label>
            <div id="cpSecretWrap" style="display:none">
              <input id="cpSecretCode" placeholder="수상자 비밀코드 (예: WINNER2026)" style="width:100%;border:1.5px solid #f39c12;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit;text-transform:uppercase"/>
              <div style="font-size:11px;color:#8B5E04;margin-top:4px">⚠️ 이 코드를 수상자에게 직접 전달하세요</div>
            </div>
          </div>
        </div>

        <!-- 수정 폼 (숨김) -->
        <div id="cpEditForm" style="display:none;background:#fff8e1;border-radius:14px;padding:14px;margin-bottom:12px;border:1.5px solid #f39c12">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:#8B5E04">✏️ 쿠폰 수정</div>
          <input type="hidden" id="cpEditId"/>
          <div style="display:flex;flex-direction:column;gap:8px">
            <input id="cpEditBrand" placeholder="브랜드명" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditEmoji" placeholder="이모지" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditEmail" placeholder="브랜드 이메일" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditDiscount" type="number" placeholder="교환 금액 (원)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditMinPurchase" type="number" placeholder="최소 구매금액" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditPointCost" type="number" placeholder="필요 포인트" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditTotalQty" type="number" placeholder="총 발행 수량" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditCodePrefix" placeholder="코드 접두어" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <input id="cpEditAwardName" placeholder="상 이름 (예: MVP 1등)" style="border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit"/>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:4px 0">
              <input type="checkbox" id="cpEditDrainAll" style="width:16px;height:16px;cursor:pointer"
                onchange="document.getElementById('cpEditSecretWrap').style.display=this.checked?'block':'none'"/>
              포인트 전액 차감 (수상자용)
            </label>
            <div id="cpEditSecretWrap" style="display:none">
              <input id="cpEditSecretCode" placeholder="수상자 비밀코드" style="width:100%;border:1.5px solid #f39c12;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit;text-transform:uppercase;box-sizing:border-box"/>
              <div style="font-size:11px;color:#8B5E04;margin-top:4px">⚠️ 이 코드를 수상자에게 직접 전달하세요</div>
            </div>
            <div style="display:flex;gap:8px">
              <button onclick="document.getElementById('cpEditForm').style.display='none'" style="flex:1;background:#f0f0f0;color:#666;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">취소</button>
              <button onclick="saveEditCoupon()" style="flex:2;background:#f39c12;color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 저장</button>
            </div>
          </div>
        </div>

        <div style="background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;border:1px solid #eee">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">🔍 코드 검색 · 사용처리</div>
          <div style="display:flex;gap:8px;margin-bottom:10px">
            <input id="cpSearchCode" placeholder="코드 입력" style="flex:1;border:1.5px solid #ddd;border-radius:10px;padding:8px 12px;font-size:13px;font-family:inherit;text-transform:uppercase"/>
            <button onclick="searchCouponCode()" style="background:var(--blue);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">검색</button>
          </div>
          <div id="cpSearchResult"></div>
        </div>

        <div style="background:#fff;border-radius:14px;padding:14px;border:1px solid #eee">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700">등록된 쿠폰</div>
            <button onclick="loadAdminCoupons()" style="background:#f0f0f0;border:none;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit">새로고침</button>
          </div>
          <div id="adminCouponList"><div style="text-align:center;color:#aaa;padding:12px;font-size:12px">로딩 중...</div></div>
        </div>
      </div>

      <div id="cpPanel-history" style="display:none">
        <div style="background:#fff;border-radius:14px;padding:14px;border:1px solid #eee">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-size:13px;font-weight:700">📊 발급 내역</div>
            <div style="display:flex;gap:6px">
              <button onclick="loadCouponHistory()" style="background:#f0f0f0;border:none;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit">새로고침</button>
              <button onclick="exportCouponCSV()" style="background:#1a1a2e;color:#fff;border:none;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">⬇️ CSV</button>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-bottom:10px">
            <button id="cpFilter-all" onclick="filterCouponHistory('all')"
              style="flex:1;padding:6px;border-radius:8px;border:1.5px solid var(--g1);background:var(--g1);color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">전체</button>
            <button id="cpFilter-unused" onclick="filterCouponHistory('unused')"
              style="flex:1;padding:6px;border-radius:8px;border:1.5px solid #ddd;background:#fff;color:#666;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">미사용</button>
            <button id="cpFilter-used" onclick="filterCouponHistory('used')"
              style="flex:1;padding:6px;border-radius:8px;border:1.5px solid #ddd;background:#fff;color:#666;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">사용완료</button>
          </div>
          <div id="couponHistoryList"><div style="text-align:center;color:#aaa;padding:20px;font-size:12px">로딩 중...</div></div>
        </div>
      </div>
    `;
    adminContent.appendChild(panel);
  }

  const origSetAdminTab = window.setAdminTab;
  window.setAdminTab = function(t, el) {
    if (t === 'coupons') {
      ['orders','users','missions','stats'].forEach(id => { const d=document.getElementById('admin-'+id); if(d) d.style.display='none'; });
      const cp = document.getElementById('admin-coupons'); if(cp) cp.style.display='block';
      document.querySelectorAll('.admin-tab').forEach(b=>b.classList.remove('on'));
      if(el) el.classList.add('on');
      loadAdminCoupons();
    } else {
      const cp = document.getElementById('admin-coupons'); if(cp) cp.style.display='none';
      if(origSetAdminTab) origSetAdminTab(t, el);
    }
  };
}

// ── 서브탭 전환 ──
window.setCpTab = function(tab) {
  document.getElementById('cpPanel-list').style.display = tab==='list' ? 'block' : 'none';
  document.getElementById('cpPanel-history').style.display = tab==='history' ? 'block' : 'none';
  document.getElementById('cpTab-list').style.background = tab==='list' ? 'var(--g1)' : '#fff';
  document.getElementById('cpTab-list').style.color = tab==='list' ? '#fff' : '#666';
  document.getElementById('cpTab-list').style.borderColor = tab==='list' ? 'var(--g1)' : '#ddd';
  document.getElementById('cpTab-history').style.background = tab==='history' ? 'var(--g1)' : '#fff';
  document.getElementById('cpTab-history').style.color = tab==='history' ? '#fff' : '#666';
  document.getElementById('cpTab-history').style.borderColor = tab==='history' ? 'var(--g1)' : '#ddd';
  if (tab==='history') loadCouponHistory();
};

// ── 발급 내역 로드 ──
let _allCouponHistory = [];
window.loadCouponHistory = async function() {
  const w = document.getElementById('couponHistoryList');
  if (!w || !window.FB) return;
  w.innerHTML = '<div style="text-align:center;color:#aaa;padding:20px;font-size:12px">로딩 중...</div>';
  try {
    const [codeSnap, userSnap] = await Promise.all([
      window.FB.getDocs(window.FB.collection(window.FB.db, 'couponCodes')),
      window.FB.getDocs(window.FB.collection(window.FB.db, 'users')),
    ]);
    const userMap = {};
    userSnap.docs.forEach(d => { userMap[d.id] = d.data().nickname || '익명'; });
    _allCouponHistory = codeSnap.docs.map(d => ({
      id: d.id, ...d.data(),
      userNickname: userMap[d.data().issuedTo] || '익명',
    })).sort((a,b) => (b.issuedAt?.seconds||0) - (a.issuedAt?.seconds||0));
    renderCouponHistory(_allCouponHistory);
  } catch(e) { w.innerHTML = '<div style="color:red;font-size:12px;padding:12px">로딩 실패</div>'; }
};

function renderCouponHistory(list) {
  const w = document.getElementById('couponHistoryList');
  if (!w) return;
  if (!list.length) { w.innerHTML = '<div style="text-align:center;color:#aaa;padding:20px;font-size:12px">내역이 없어요</div>'; return; }
  w.innerHTML = `
    <div style="font-size:11px;color:#aaa;margin-bottom:8px">총 ${list.length}건</div>
    ${list.map(c => {
      const label = c.discount > 0 ? `${c.discount.toLocaleString()}원 교환권` : '교환권';
      return `
      <div style="padding:10px;background:${c.isUsed?'#f8f8f8':'#f0fbf4'};border-radius:10px;margin-bottom:6px;border:1px solid ${c.isUsed?'#eee':'var(--bdr)'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--txt)">${c.brandEmoji||'🎁'} ${c.brandName}</div>
            <div style="font-size:11px;color:var(--sub);margin-top:2px">👤 ${c.userNickname} · ${label}</div>
            <div style="font-size:11px;color:var(--sub)">🔑 ${c.code}</div>
            <div style="font-size:10px;color:#aaa;margin-top:2px">
              발급: ${c.issuedAt ? new Date(c.issuedAt.seconds*1000).toLocaleDateString('ko-KR') : '-'}
              ${c.isUsed && c.usedAt ? ` · 사용: ${new Date(c.usedAt.seconds*1000).toLocaleDateString('ko-KR')}` : ''}
            </div>
          </div>
          <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:8px;background:${c.isUsed?'#eee':'#e8f5e9'};color:${c.isUsed?'#888':'var(--g2)'};white-space:nowrap;flex-shrink:0">
            ${c.isUsed?'✅ 사용':'미사용'}
          </span>
        </div>
      </div>`;
    }).join('')}`;
}

window.filterCouponHistory = function(type) {
  ['all','unused','used'].forEach(t => {
    const btn = document.getElementById('cpFilter-'+t);
    if (!btn) return;
    const isOn = t === type;
    btn.style.background = isOn ? 'var(--g1)' : '#fff';
    btn.style.color = isOn ? '#fff' : '#666';
    btn.style.borderColor = isOn ? 'var(--g1)' : '#ddd';
  });
  const filtered = type === 'all' ? _allCouponHistory
    : type === 'used' ? _allCouponHistory.filter(c => c.isUsed)
    : _allCouponHistory.filter(c => !c.isUsed);
  renderCouponHistory(filtered);
};

window.exportCouponCSV = function() {
  if (!_allCouponHistory.length) { toast('먼저 내역을 불러와주세요!'); return; }
  const rows = [['브랜드', '교환금액', '코드', '발급자', '발급일', '사용여부', '사용일']];
  _allCouponHistory.forEach(c => {
    rows.push([
      c.brandName || '',
      c.discount ? c.discount + '원' : '교환권',
      c.code || '',
      c.userNickname || '',
      c.issuedAt ? new Date(c.issuedAt.seconds*1000).toLocaleDateString('ko-KR') : '-',
      c.isUsed ? '사용완료' : '미사용',
      c.isUsed && c.usedAt ? new Date(c.usedAt.seconds*1000).toLocaleDateString('ko-KR') : '-',
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'EcoQuest_교환권내역_' + new Date().toLocaleDateString('ko-KR').replace(/\./g,'').replace(/ /g,'') + '.csv';
  a.click();
  toast('✅ CSV 다운로드 완료!');
};

// ── 어드민 쿠폰 목록 ──
async function loadAdminCoupons() {
  const w = document.getElementById('adminCouponList');
  if (!w) return;
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'coupons'));
    const coupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!coupons.length) { w.innerHTML = '<div style="text-align:center;color:#aaa;padding:12px;font-size:12px">등록된 쿠폰이 없어요</div>'; return; }
    w.innerHTML = coupons.map(c => {
      const remaining = (c.totalQty||0)-(c.usedQty||0);
      const label = c.discount > 0 ? `${c.discount.toLocaleString()}원 교환권` : '교환권';
      return `
        <div style="padding:10px;background:#f8fdf9;border-radius:10px;margin-bottom:8px;border:1px solid var(--bdr)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:700">${c.brandEmoji||'🎁'} ${c.brandName}</div>
              <div style="font-size:11px;color:var(--sub)">${label} · ${c.pointCost.toLocaleString()}P · ${c.codePrefix||'ECO'}</div>
              <div style="font-size:11px;color:var(--sub)">${c.brandEmail?`📧 ${c.brandEmail}`:'이메일 없음'}</div>
              <div style="font-size:11px;color:var(--sub)">발행 ${c.totalQty||0} · 사용 ${c.usedQty||0} · <b style="color:${remaining>0?'var(--g2)':'var(--red)'}">잔여 ${remaining}</b></div>
            </div>
            <div style="display:flex;gap:4px;flex-direction:column;align-items:flex-end">
              <button onclick="openEditCoupon('${c.id}')"
                style="background:#fff8e1;color:#8B5E04;border:1px solid #f39c12;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">✏️ 수정</button>
              <button onclick="toggleCouponActive('${c.id}',${!c.active})"
                style="background:${c.active!==false?'#e8f5e9':'#fee'};color:${c.active!==false?'var(--g2)':'var(--red)'};border:none;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">${c.active!==false?'활성':'비활성'}</button>
              <button onclick="deleteCoupon('${c.id}')"
                style="background:#fee;color:var(--red);border:none;border-radius:8px;padding:4px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">삭제</button>
            </div>
          </div>
        </div>`;
    }).join('');
  } catch(e) { w.innerHTML = '<div style="color:red;font-size:12px">로딩 실패</div>'; }
}
window.loadAdminCoupons = loadAdminCoupons;

// ── 수정 폼 열기 ──
window.openEditCoupon = async function(id) {
  const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'coupons', id));
  if (!snap.exists()) { toast('쿠폰 정보를 찾을 수 없어요'); return; }
  const c = snap.data();
  document.getElementById('cpEditId').value = id;
  document.getElementById('cpEditBrand').value = c.brandName || '';
  document.getElementById('cpEditEmoji').value = c.brandEmoji || '🎁';
  document.getElementById('cpEditEmail').value = c.brandEmail || '';
  document.getElementById('cpEditDiscount').value = c.discount || 0;
  document.getElementById('cpEditMinPurchase').value = c.minPurchase || 0;
  document.getElementById('cpEditPointCost').value = c.pointCost || 0;
  document.getElementById('cpEditTotalQty').value = c.totalQty || 0;
  document.getElementById('cpEditCodePrefix').value = c.codePrefix || '';
  document.getElementById('cpEditAwardName').value = c.awardName || '';
  const drainEl = document.getElementById('cpEditDrainAll');
  if (drainEl) {
    drainEl.checked = c.drainAll === true;
    document.getElementById('cpEditSecretWrap').style.display = c.drainAll ? 'block' : 'none';
  }
  document.getElementById('cpEditSecretCode').value = c.secretCode || '';
  const form = document.getElementById('cpEditForm');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// ── 수정 저장 ──
window.saveEditCoupon = async function() {
  const id = document.getElementById('cpEditId')?.value;
  if (!id) { toast('수정할 쿠폰을 찾을 수 없어요'); return; }
  const brand = document.getElementById('cpEditBrand')?.value.trim();
  const emoji = document.getElementById('cpEditEmoji')?.value.trim() || '🎁';
  const email = document.getElementById('cpEditEmail')?.value.trim() || '';
  const discount = parseInt(document.getElementById('cpEditDiscount')?.value) || 0;
  const minPurchase = parseInt(document.getElementById('cpEditMinPurchase')?.value) || 0;
  const pointCost = parseInt(document.getElementById('cpEditPointCost')?.value) || 0;
  const totalQty = parseInt(document.getElementById('cpEditTotalQty')?.value) || 0;
  const codePrefix = document.getElementById('cpEditCodePrefix')?.value.trim().toUpperCase() || 'ECO';
  const awardName = document.getElementById('cpEditAwardName')?.value.trim() || '';
  const drainAll = document.getElementById('cpEditDrainAll')?.checked || false;
  const secretCode = document.getElementById('cpEditSecretCode')?.value.trim().toUpperCase() || '';
  if (drainAll && !secretCode) { toast('수상자용 비밀코드를 입력해주세요!'); return; }
  if (!brand || !totalQty) { toast('브랜드명, 수량은 필수예요!'); return; }
  try {
    await window.FB.updateDoc(window.FB.doc(window.FB.db, 'coupons', id), {
      brandName: brand, brandEmoji: emoji, brandEmail: email,
      discount, minPurchase, pointCost, totalQty, codePrefix,
      awardName, drainAll, secretCode,
    });
    toast('✅ 수정 완료!');
    document.getElementById('cpEditForm').style.display = 'none';
    loadAdminCoupons();
    renderCouponStore();
  } catch(e) { toast('수정 실패: ' + e.message); }
};

window.addAdminCoupon = async function() {
  const brand = document.getElementById('cpBrand')?.value.trim();
  const emoji = document.getElementById('cpEmoji')?.value.trim() || '🎁';
  const email = document.getElementById('cpEmail')?.value.trim() || '';
  const discount = parseInt(document.getElementById('cpDiscount')?.value) || 0;
  const minPurchase = parseInt(document.getElementById('cpMinPurchase')?.value) || 0;
  const pointCost = parseInt(document.getElementById('cpPointCost')?.value) || 0;
  const totalQty = parseInt(document.getElementById('cpTotalQty')?.value) || 0;
  const codePrefix = document.getElementById('cpCodePrefix')?.value.trim().toUpperCase() || 'ECO';
  const awardName = document.getElementById('cpAwardName')?.value.trim() || '';
  const drainAll = document.getElementById('cpDrainAll')?.checked || false;
  const secretCode = (document.getElementById('cpSecretCode')?.value.trim().toUpperCase()) || '';
  if (drainAll && !secretCode) { toast('수상자용 비밀코드를 입력해주세요!'); return; }
  if (!brand || !totalQty) { toast('브랜드명, 수량은 필수예요!'); return; }
  try {
    await window.FB.addDoc(window.FB.collection(window.FB.db,'coupons'), {
      brandName:brand, brandEmoji:emoji, brandEmail:email,
      discount, minPurchase, pointCost, totalQty, usedQty:0,
      codePrefix, awardName, drainAll, secretCode,
      active:true, createdAt:window.FB.serverTimestamp(),
    });
    toast('✅ 쿠폰 등록 완료!');
    ['cpBrand','cpEmoji','cpEmail','cpDiscount','cpMinPurchase','cpPointCost','cpTotalQty','cpCodePrefix','cpAwardName','cpSecretCode'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    const cb=document.getElementById('cpDrainAll'); if(cb) cb.checked=false;
    const sw=document.getElementById('cpSecretWrap'); if(sw) sw.style.display='none';
    loadAdminCoupons(); renderCouponStore();
  } catch(e) { toast('등록 실패: '+e.message); }
};

window.searchCouponCode = async function() {
  const code = document.getElementById('cpSearchCode')?.value.trim().toUpperCase();
  if (!code) { toast('코드를 입력해주세요!'); return; }
  const res = document.getElementById('cpSearchResult'); if (!res) return;
  res.innerHTML = '<div style="font-size:12px;color:#aaa">검색 중...</div>';
  try {
    const snap = await window.FB.getDocs(window.FB.collection(window.FB.db,'couponCodes'));
    const found = snap.docs.map(d=>({id:d.id,...d.data()})).find(c=>c.code===code);
    if (!found) { res.innerHTML='<div style="background:#fee;border-radius:10px;padding:10px;font-size:12px;color:var(--red)">❌ 존재하지 않는 코드예요</div>'; return; }
    const label = found.discount > 0 ? `${found.discount.toLocaleString()}원 교환권` : '교환권';
    res.innerHTML = `
      <div style="background:${found.isUsed?'#f8f8f8':'#f0fbf4'};border-radius:10px;padding:12px;border:1.5px solid ${found.isUsed?'#eee':'var(--g1)'}">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">${found.brandEmoji||'🎁'} ${found.brandName}</div>
        <div style="font-size:12px;color:var(--sub);margin-bottom:4px">${label} · <b>${found.code}</b></div>
        <div style="font-size:12px;font-weight:700;color:${found.isUsed?'var(--red)':'var(--g2)'};margin-bottom:8px">${found.isUsed?'✅ 이미 사용됨':'🟢 미사용'}</div>
        ${!found.isUsed?`<button onclick="markCouponUsed('${found.id}')" style="background:var(--g1);color:#fff;border:none;border-radius:10px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%">✅ 사용 완료 처리</button>`:''}
      </div>`;
  } catch(e) { res.innerHTML='<div style="color:red;font-size:12px">검색 실패</div>'; }
};

window.markCouponUsed = async function(docId) {
  if (!confirm('이 교환권을 사용완료 처리할까요?')) return;
  try {
    await window.FB.updateDoc(window.FB.doc(window.FB.db,'couponCodes',docId),{isUsed:true,usedAt:window.FB.serverTimestamp()});
    toast('✅ 사용처리 완료!');
    document.getElementById('cpSearchCode').value='';
    document.getElementById('cpSearchResult').innerHTML='';
  } catch(e) { toast('처리 실패: '+e.message); }
};

window.toggleCouponActive = async function(id, newVal) {
  try {
    await window.FB.updateDoc(window.FB.doc(window.FB.db,'coupons',id),{active:newVal});
    toast(newVal?'✅ 활성화됐어요':'🔒 비활성화됐어요');
    loadAdminCoupons(); renderCouponStore();
  } catch(e) { toast('변경 실패'); }
};

window.deleteCoupon = async function(id) {
  if (!confirm('이 쿠폰을 삭제할까요?')) return;
  try {
    await window.FB.deleteDoc(window.FB.doc(window.FB.db,'coupons',id));
    toast('🗑️ 삭제됐어요'); loadAdminCoupons(); renderCouponStore();
  } catch(e) { toast('삭제 실패'); }
};
