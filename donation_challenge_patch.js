/**
 * EcoQuest 기부형 챌린지 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단에 추가
 *   <script src="donation_challenge_patch.js"></script>
 *
 * 기능:
 * 1. 챌린지 탭의 페이백 구조를 '기부형 챌린지' 디자인으로 교체
 * 2. 포트원(PortOne v2) 결제 연동
 * 3. 기본은 TEST MODE — 실제 결제 안 됨 (PG 가입 후 전환)
 *
 * 사전 준비 (TEST MODE 끄기 전에):
 * - PortOne 가입 → Store ID, Channel Key, API Secret 발급
 * - 아래 PORTONE_CONFIG 채우기
 * - Vercel 환경변수 PORTONE_API_SECRET 설정
 * - /api/payment-verify.js 배포
 * - TEST_MODE = false 로 변경
 */

(function(){
  'use strict';

  // ═══════════════════════════════════════════
  // ⚙️ 설정 (포트원 가입 후 채우기)
  // ═══════════════════════════════════════════
  const TEST_MODE = true;  // 실서비스 전환 시 false
  const PORTONE_CONFIG = {
    storeId: 'store-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',     // 포트원 콘솔 → 스토어 ID
    channelKey: 'channel-key-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX', // 포트원 콘솔 → 채널 키
  };

  // ═══════════════════════════════════════════
  // 📦 PortOne SDK 로드
  // ═══════════════════════════════════════════
  let _portoneLoaded = null;
  function loadPortOne() {
    if (_portoneLoaded) return _portoneLoaded;
    _portoneLoaded = new Promise((resolve, reject) => {
      if (window.PortOne) return resolve(window.PortOne);
      const script = document.createElement('script');
      script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
      script.onload = () => resolve(window.PortOne);
      script.onerror = () => reject(new Error('PortOne SDK 로드 실패'));
      document.head.appendChild(script);
    });
    return _portoneLoaded;
  }

  // ═══════════════════════════════════════════
  // 🎨 페이백 구조 UI 교체
  // ═══════════════════════════════════════════
  function updatePaybackUI() {
    const paybackBox = document.querySelector('.payback-info');
    if (!paybackBox || paybackBox.dataset.donationApplied) return;
    paybackBox.dataset.donationApplied = 'true';

    paybackBox.style.cssText = 'margin:12px;background:linear-gradient(135deg,#fffbf0,#fff8e1);border-radius:14px;padding:14px;border:1.5px solid #F39C12';
    paybackBox.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span style="font-size:22px">🎁</span>
        <div style="font-size:15px;font-weight:900;color:#8B5E04">미션 성공하면 받는 돈</div>
      </div>
      <div style="font-size:13px;color:#8B5E04;line-height:1.5;margin-bottom:12px;font-weight:700">
        참가비 환급 + 보너스 받기! 🌟
      </div>

      <!-- 메인 보상 박스 (강조) -->
      <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;border:2px solid #F39C12;box-shadow:0 2px 6px rgba(243,156,18,0.15)">
        <div style="font-size:11px;font-weight:700;color:#8B5E04;margin-bottom:8px">💡 예시 — 1만원 걸고 100% 성공한 경우</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px">
          <span style="color:var(--sub)">참가비 환급</span>
          <span style="font-weight:900;color:var(--txt)">10,000원</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;border-top:1px solid #fff3cd">
          <span style="color:var(--sub)">🎁 보너스 추가</span>
          <span style="font-weight:900;color:#F39C12">+ 1,000~3,000원</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0 4px;font-size:14px;border-top:2px solid #F39C12;margin-top:4px">
          <span style="font-weight:700;color:#8B5E04">총 받는 돈</span>
          <span style="font-weight:900;color:#F39C12;font-size:16px">≈ 11,000~13,000원 ✨</span>
        </div>
      </div>

      <!-- 달성률별 환급 -->
      <div style="background:#fff;border-radius:10px;padding:10px 12px;margin-bottom:8px;border:1px solid var(--bdr)">
        <div style="font-size:11px;font-weight:700;color:var(--g2);margin-bottom:6px">📊 달성률별 환급</div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px"><span style="color:var(--sub)">100% 달성</span><span style="font-weight:700;color:#F39C12">환급 + 🎁 보너스</span></div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;border-top:1px solid #f0f0f0"><span style="color:var(--sub)">85% 이상</span><span style="font-weight:700;color:var(--g2)">100% 환급</span></div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;border-top:1px solid #f0f0f0"><span style="color:var(--sub)">85% 미만</span><span style="font-weight:700;color:var(--txt)">달성률만큼 환급</span></div>
      </div>

      <!-- 실패 시 (보조 메시지) -->
      <div style="background:#f0fbf4;border-radius:10px;padding:10px;font-size:11px;color:var(--g2);line-height:1.7">
        🌳 <b>못 채운 만큼은 의미있게</b><br/>
        받지 못한 참가비는 환경 캠페인에 쓰여요<br/>
        <span style="color:var(--sub);font-weight:500">제로웨이스트 매장 협업 · 나무심기 · 환경 NGO 후원</span><br/>
        <span style="color:var(--sub);font-weight:500">📊 분기별 사용 내역 투명 공개</span>
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--bdr);font-size:10px;color:var(--sub);font-weight:600">
          💡 앱 운영비는 1% 미만 — 99% 이상이 환경에
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════
  // 💳 결제 진행
  // ═══════════════════════════════════════════
  /**
   * 챌린지 참가비 결제
   * @param {object} opts
   * @param {string} opts.challengeId
   * @param {string} opts.challengeName
   * @param {number} opts.amount - 원 단위
   * @returns {Promise<boolean>}
   */
  window.requestChallengePayment = async function(opts) {
    const { challengeId, challengeName, amount } = opts;
    const user = window.ME;

    if (!user) {
      window.toast?.('로그인이 필요해요!');
      return false;
    }
    if (!challengeId || !amount) {
      window.toast?.('잘못된 결제 정보예요');
      return false;
    }

    // ─ 테스트 모드 ─
    if (TEST_MODE) {
      if (!confirm(`[🧪 테스트 모드]\n\n${challengeName}\n참가비: ${amount.toLocaleString()}원\n\n실제 결제는 안 일어나요. 진행할까요?`)) return false;
      await savePaymentRecord({
        challengeId, challengeName, amount,
        uid: user.uid,
        paymentId: `test_${Date.now()}`,
        status: 'test_paid',
        isTest: true
      });
      window.toast?.('🧪 테스트 결제 완료! (실결제 X)');
      return true;
    }

    // ─ 실결제 모드 ─
    try {
      const PortOne = await loadPortOne();
      const paymentId = `eq_${challengeId}_${user.uid.slice(0,8)}_${Date.now()}`;

      const response = await PortOne.requestPayment({
        storeId: PORTONE_CONFIG.storeId,
        channelKey: PORTONE_CONFIG.channelKey,
        paymentId,
        orderName: `EcoQuest 챌린지: ${challengeName}`,
        totalAmount: amount,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
        customer: {
          customerId: user.uid,
          fullName: window.UDATA?.nickname || user.displayName || '지구지킴이',
          email: user.email || '',
        },
        customData: JSON.stringify({ challengeId, challengeName, uid: user.uid })
      });

      if (response.code !== undefined) {
        window.toast?.('결제 취소: ' + (response.message || '사용자 취소'));
        return false;
      }

      // ─ 서버 검증 ─
      const verifyRes = await fetch('/api/payment-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: response.paymentId,
          expectedAmount: amount,
          uid: user.uid,
          challengeId
        })
      });
      const result = await verifyRes.json();

      if (!result.success) {
        window.toast?.('결제 검증 실패: ' + (result.reason || '알 수 없음'));
        return false;
      }

      await savePaymentRecord({
        challengeId, challengeName, amount,
        uid: user.uid,
        paymentId: response.paymentId,
        status: 'paid',
        isTest: false
      });
      window.toast?.('🎉 결제 완료! 챌린지를 시작해봐요');
      return true;

    } catch (e) {
      console.error('[Payment]', e);
      window.toast?.('결제 오류: ' + e.message);
      return false;
    }
  };

  async function savePaymentRecord(data) {
    if (!window.FB) return;
    try {
      await window.FB.addDoc(window.FB.collection(window.FB.db, 'payments'), {
        uid: data.uid,
        challengeId: data.challengeId,
        challengeName: data.challengeName,
        amount: data.amount,
        paymentId: data.paymentId,
        status: data.status,
        isTest: data.isTest || false,
        createdAt: window.FB.serverTimestamp()
      });
    } catch(e) { console.error('[Payment Save]', e); }
  }

  // ═══════════════════════════════════════════
  // 🚀 초기화
  // ═══════════════════════════════════════════
  function init() {
    updatePaybackUI();

    if (TEST_MODE) {
      console.log('%c[기부형 챌린지] 🧪 TEST MODE — 실제 결제 안 됨', 'color:#F39C12;font-weight:bold');
    } else {
      console.log('%c[기부형 챌린지] ✅ 실서비스 모드', 'color:#2ECC71;font-weight:bold');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  // 챌린지 탭 진입 시 다시 적용
  if (window.goPage) {
    const origGoPage = window.goPage;
    window.goPage = function(...args) {
      const r = origGoPage.apply(this, args);
      setTimeout(updatePaybackUI, 100);
      return r;
    };
  }

  window.DonationChallenge = {
    pay: window.requestChallengePayment,
    updateUI: updatePaybackUI,
    config: PORTONE_CONFIG,
    testMode: TEST_MODE
  };
})();
