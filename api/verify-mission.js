// api/verify-mission.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'POST only'});

  const { imageBase64, missionName, missionKeywords } = req.body;
  if (!imageBase64 || !missionName) {
    return res.status(400).json({error:'missing fields'});
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({error:'API key not set'});

  const prompt = `당신은 환경 미션 인증 검토 AI예요. 사용자가 "${missionName}" 미션을 수행했다며 사진을 올렸어요.
관련 키워드: ${missionKeywords}

다음 형식 JSON으로만 답해주세요 (다른 텍스트 금지):
{
  "passed": true 또는 false,
  "score": 0~100 정수,
  "title": "짧은 인증 결과 한 줄",
  "comment": "친근하고 따뜻한 톤으로 1~2문장 (존댓말)"
}

판정 기준:
- 사진이 미션 키워드와 명백히 관련 있으면 passed: true
- 관련이 매우 약하거나 부정확하면 passed: false
- 의심스럽지만 가능성 있으면 score를 낮게 주고 passed: true`;

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
            temperature: 0.4,
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
