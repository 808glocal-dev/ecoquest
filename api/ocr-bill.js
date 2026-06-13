// /api/ocr-bill.js  — 전기/가스 고지서 OCR (Gemini Vision)
// ★ /api/ 폴더에 넣으세요 (verify-mission.js 와 같은 위치)
// ★ 환경변수 GEMINI_API_KEY 를 verify-mission.js 가 쓰는 이름과 똑같이 맞추세요.
//   (verify-mission.js 열어서 process.env.XXX 이름 확인 → 다르면 아래 KEY 줄을 그 이름으로)

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const { imageBase64 } = req.body || {};
  if(!imageBase64){
    res.status(400).json({ error: 'no image' });
    return;
  }

  const KEY = process.env.GEMINI_API_KEY;   // ← verify-mission.js 와 동일한 환경변수명인지 확인!
  if(!KEY){
    res.status(500).json({ error: 'GEMINI_API_KEY 가 설정되지 않았어요' });
    return;
  }

  const prompt = `너는 한국의 전기요금 청구서·도시가스 요금 고지서를 판독하는 OCR 엔진이야.
이미지에서 아래 정보를 찾아 JSON으로만 응답해 (다른 말 없이 JSON만):
{
  "company": "고객명 또는 기관/회사명 (없으면 \\"\\")",
  "period": "청구월 또는 사용월 (예: \\"2026.05\\", 없으면 \\"\\")",
  "elecKwh": 전력 사용량(kWh) 숫자만, 없으면 null,
  "gasM3": 도시가스 사용량(m³ 또는 ㎥) 숫자만, 없으면 null
}
규칙:
- '사용 전력량', '사용량', 'kWh' 옆의 숫자가 전력 사용량이야.
- 도시가스는 'm³' 또는 '㎥' 또는 'N㎥' 단위의 사용량이야.
- 금액(원)은 절대 사용량으로 쓰지 마. 사용량(kWh, m³)만 추출해.
- 숫자에서 콤마(,)는 제거하고 순수 숫자로.
- 못 찾은 항목은 null.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`,
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
          generationConfig: { temperature: 0, responseMimeType: 'application/json' }
        })
      }
    );

    const data = await r.json();
    if(!r.ok){
      res.status(500).json({ error: 'gemini error', detail: data });
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch(e){
      const clean = text.replace(/```json|```/g, '').trim();
      try { parsed = JSON.parse(clean); }
      catch(e2){ parsed = { company:'', period:'', elecKwh:null, gasM3:null, raw:text }; }
    }

    res.status(200).json({
      company: parsed.company || '',
      period:  parsed.period || '',
      elecKwh: (parsed.elecKwh === null || parsed.elecKwh === undefined) ? null : Number(parsed.elecKwh),
      gasM3:   (parsed.gasM3 === null || parsed.gasM3 === undefined) ? null : Number(parsed.gasM3)
    });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
}
