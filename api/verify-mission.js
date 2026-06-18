// api/verify-mission.js  — 엄격 검증판
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { imageBase64, missionName, missionKeywords } = req.body || {};
  if (!imageBase64 || !missionName) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const prompt = `당신은 환경 미션 인증 사진을 검증하는 엄격한 AI 심사관입니다.
사용자가 "${missionName}" 미션을 실천했다며 사진을 제출했습니다.
이 미션과 관련된 키워드: ${missionKeywords || missionName}

[판정 규칙 — 엄격하게]
- 사진에 이 미션의 핵심 대상이 "실제로" 보일 때만 passed: true 입니다.
   · "식물/텃밭/화분" 미션 → 실제 식물·새싹·화분·텃밭이 보여야 함
   · "텀블러/다회용컵" 미션 → 실제 텀블러나 다회용 컵이 보여야 함
   · "대중교통/출근" 미션 → 지하철·버스·역·정류장·교통카드 등 이동 정황이 보여야 함
   · "분리수거/제로웨이스트" 미션 → 분리배출·재활용·다회용기 등이 보여야 함
- 미션과 무관한 사진(키보드, 빈 책상, 벽, 천장, 사람 얼굴만, 무관한 음식 등 미션 대상이 없음)은 반드시 passed: false 입니다.
- 사진이 흐리거나 대상이 불분명해서 확신할 수 없으면 passed: false 입니다.
- 절대 관대하게 봐주지 마세요. 미션 대상이 명확히 보일 때만 통과시키세요.

[점수]
- score는 미션 적합도 0~100 정수. 통과는 보통 70~95, 불통과는 0~50.

반드시 아래 JSON 형식으로만, 다른 텍스트 없이 응답하세요:
{"passed": true 또는 false, "score": 0~100 정수, "title": "결과 한 줄", "comment": "사용자에게 보여줄 1~2문장(불통과면 무엇이 부족한지 친근하게 안내)", "detected": "사진에서 실제로 보인 핵심 사물 한두 개"}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
            ]
          }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        })
      }
    );

    const data = await r.json();

    // ── Gemini API 자체 에러(키/모델/할당량 등) → 통과 금지, 원인 노출 ──
    if (data.error) {
      console.error('[verify-mission] Gemini API error:', data.error);
      return res.status(200).json({
        passed: false, score: 0,
        title: 'AI 점검이 필요해요',
        comment: 'AI 분석에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요.',
        _debug: data.error.message || 'api_error'
      });
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON 파싱 (코드펜스/잡텍스트 섞여도 JSON만 추출)
    let parsed = null;
    try { parsed = JSON.parse(text); }
    catch (e) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
    }

    // ── 파싱 실패 / 빈 응답 → 통과 금지, 재촬영 유도 (★ 더 이상 fallback true 안 함) ──
    if (!parsed || typeof parsed.passed !== 'boolean') {
      console.warn('[verify-mission] parse fail. raw:', String(text).slice(0, 300));
      return res.status(200).json({
        passed: false, score: 0,
        title: '다시 확인이 필요해요',
        comment: '사진을 제대로 인식하지 못했어요. 미션에 맞는 사진을 더 또렷하게 찍어주세요!',
        _debug: 'parse_fail'
      });
    }

    // ── 정상 결과 ──
    return res.status(200).json({
      passed: parsed.passed === true,
      score: Number.isFinite(parsed.score) ? Math.round(parsed.score) : (parsed.passed ? 80 : 30),
      title: parsed.title || (parsed.passed ? '인증 완료!' : '인증 실패'),
      comment: parsed.comment || (parsed.passed ? '잘 하셨어요!' : '미션에 맞는 사진을 다시 찍어주세요!'),
      detected: parsed.detected || ''
    });

  } catch (e) {
    console.error('[verify-mission] fetch error', e);
    // ── 네트워크/예외 → 통과 금지 ──
    return res.status(200).json({
      passed: false, score: 0,
      title: '연결 오류',
      comment: '잠시 후 다시 시도해주세요.',
      _debug: String(e && e.message || e)
    });
  }
}
