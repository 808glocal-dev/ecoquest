// api/verify-mission.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'POST only'});
  const { imageBase64, missionName, missionKeywords } = req.body;
  if (!imageBase64 || !missionName) {
    return res.status(400).json({error:'missing fields'});
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({error:'API key not set'});

  const isMulitap = missionKeywords?.includes('멀티탭') || missionName?.includes('멀티탭');

  const prompt = isMulitap
    ? `당신은 환경 미션 인증 AI예요. 사용자가 "멀티탭 전원 끄기" 미션을 실천했다며 사진을 올렸어요.

passed: false는 아래 두 경우만:
1. 멀티탭 LED 불빛이 명확하게 켜져 있음 (빨간불/초록불이 확실히 보임)
2. 사진에 멀티탭/콘센트/플러그가 전혀 없음

그 외 모든 경우는 passed: true 로 판정하세요.
멀티탭이 보이면, 스위치 상태가 불분명해도, 플러그가 꽂혀있어도 → passed: true

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
{"passed":true,"score":88,"title":"멀티탭 절전 완료!","comment":"대기전력을 차단하셨네요! 지구가 고마워해요 🌍"}`
    : `당신은 환경 미션 인증을 도와주는 친근한 AI예요. 사용자가 "${missionName}" 미션을 실천했다며 사진을 올렸어요.
이 미션의 관련 키워드: ${missionKeywords}
★ 베타 서비스라 관대하게 판정해주세요. 미션 취지에 조금이라도 부합하면 통과시켜주세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
{"passed":true또는false,"score":0~100,"title":"짧은 결과 한 줄","comment":"친근한 톤 1~2문장"}

판정 기준:
- 미션 취지에 조금이라도 부합하면 passed: true
- passed: false는 사진이 미션과 명백히 완전 무관할 때만
- 애매하면 무조건 passed: true`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          contents: [{
            parts: [
              {text: prompt},
              {inline_data: {mime_type: 'image/jpeg', data: imageBase64}}
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    );
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed = {};
    try { parsed = JSON.parse(text); } catch(e) {}

    // Gemini가 빈 응답이거나 passed가 없으면 기본값 true
    if (parsed.passed === undefined || parsed.passed === null) {
      parsed = {
        passed: true,
        score: 85,
        title: '인증 완료!',
        comment: '미션을 잘 실천하셨어요! 지구가 건강해졌어요 🌍'
      };
    }

    return res.status(200).json(parsed);
  } catch(e) {
    console.error('Gemini error', e);
    // API 오류시도 통과 처리
    return res.status(200).json({
      passed: true,
      score: 80,
      title: '인증 완료!',
      comment: '미션을 실천하셨군요! 지구가 건강해졌어요 🌍'
    });
  }
}
