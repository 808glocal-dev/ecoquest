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

다음 형식 JSON으로만 답해주세요 (다른 텍스트 절대 금지):
{
  "passed": true 또는 false,
  "score": 0~100 정수,
  "title": "짧은 인증 결과 한 줄",
  "comment": "친근하고 따뜻한 톤으로 1~2문장 (존댓말)"
}`
    : `당신은 환경 미션 인증을 도와주는 친근한 AI예요. 사용자가 "${missionName}" 미션을 실천했다며 사진을 올렸어요.
이 미션의 관련 키워드: ${missionKeywords}
★ 중요: 지금은 베타 서비스라 관대하게 판정해주세요. 사용자가 환경 실천을 하려는 선의를 믿고, 미션 취지에 조금이라도 부합하면 통과시켜주세요.
다음 형식 JSON으로만 답해주세요 (다른 텍스트 절대 금지):
{
  "passed": true 또는 false,
  "score": 0~100 정수,
  "title": "짧은 인증 결과 한 줄",
  "comment": "친근하고 따뜻한 톤으로 1~2문장 (존댓말)"
}
판정 기준 (관대 모드):
- 사진이 미션 취지에 조금이라도 부합하면 passed: true (확실하면 score 85~100, 애매하면 70~84)
- 채식 미션: 과일, 생채소, 샐러드, 야채요리, 비건식 등 모든 식물성 음식이면 통과
- 절전 미션: 멀티탭뿐 아니라 일반 콘센트, 플러그, 충전기, USB를 뽑은 사진도 통과
- 교통/도보 미션: 길, 신발, 걷는 모습, 자전거, 버스·지하철 등 이동 관련이면 통과
- 그 외 미션도 키워드와 같은 카테고리에 속하면 폭넓게 통과
- passed: false는 사진이 미션과 명백히 완전 무관할 때만. 이 경우에도 따뜻하게 안내해주세요.
- 판단이 조금이라도 애매하면 무조건 통과(passed: true) 쪽으로 기울여주세요.`;

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
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch(e) {
    console.error('Gemini error', e);
    return res.status(500).json({error: e.message, passed: false});
  }
}
