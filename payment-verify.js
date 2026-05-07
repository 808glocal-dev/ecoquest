/**
 * EcoQuest 결제 검증 API (Vercel Serverless Function)
 * ─────────────────────────────────────────────
 * 위치: /api/payment-verify.js
 * 호출: POST /api/payment-verify
 * 환경변수 필수: PORTONE_API_SECRET (Vercel 대시보드에서 설정)
 *
 * 동작:
 * 1. 클라이언트가 paymentId 보냄
 * 2. PortOne API로 실제 결제 정보 조회
 * 3. 결제 상태(PAID) 확인
 * 4. 금액 일치 확인 (클라이언트가 보낸 expectedAmount와 비교)
 * 5. 모두 OK면 success: true 반환
 *
 * ⚠️ 보안 핵심: 절대 클라이언트가 보낸 'success' 값을 신뢰하지 말 것!
 *    반드시 서버에서 PortOne API로 재검증해야 함.
 */

export default async function handler(req, res) {
  // CORS (필요 시)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, reason: 'method_not_allowed' });
  }

  const { paymentId, expectedAmount, uid, challengeId } = req.body || {};

  if (!paymentId || !expectedAmount) {
    return res.status(400).json({ success: false, reason: 'missing_params' });
  }

  const apiSecret = process.env.PORTONE_API_SECRET;
  if (!apiSecret) {
    console.error('[payment-verify] PORTONE_API_SECRET 환경변수 미설정');
    return res.status(500).json({ success: false, reason: 'server_misconfigured' });
  }

  try {
    // ─ PortOne v2 API로 결제 정보 조회 ─
    const portoneRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `PortOne ${apiSecret}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!portoneRes.ok) {
      const errorText = await portoneRes.text();
      console.error('[payment-verify] PortOne API 오류:', portoneRes.status, errorText);
      return res.status(500).json({ success: false, reason: 'portone_api_error' });
    }

    const payment = await portoneRes.json();

    // ─ 검증 1: 결제 상태가 PAID인지 ─
    if (payment.status !== 'PAID') {
      return res.json({
        success: false,
        reason: 'not_paid',
        actualStatus: payment.status
      });
    }

    // ─ 검증 2: 금액 일치 확인 ─
    const actualAmount = payment.amount?.total;
    if (actualAmount !== Number(expectedAmount)) {
      console.warn('[payment-verify] 금액 불일치:', {
        expected: expectedAmount,
        actual: actualAmount,
        paymentId
      });
      return res.json({
        success: false,
        reason: 'amount_mismatch',
        expected: expectedAmount,
        actual: actualAmount
      });
    }

    // ─ 검증 3 (선택): customData에서 uid·challengeId 확인 ─
    // try {
    //   const customData = JSON.parse(payment.customData || '{}');
    //   if (customData.uid !== uid || customData.challengeId !== challengeId) {
    //     return res.json({ success: false, reason: 'custom_data_mismatch' });
    //   }
    // } catch(e) {}

    // ─ 검증 통과 ─
    return res.json({
      success: true,
      paymentId: payment.id,
      amount: payment.amount.total,
      status: payment.status,
      paidAt: payment.paidAt
    });

  } catch (e) {
    console.error('[payment-verify] 예외:', e);
    return res.status(500).json({ success: false, reason: 'exception', message: e.message });
  }
}
