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

  const prompt = `너는 한국의 전기요금 청구서·도시가스 고지서·아파트 관리비 고지서를 판독하는 OCR 엔진이야.
이미지에서 아래 정보를 찾아 JSON으로만 응답해 (다른 말 없이 JSON만):
{
  "company": "고객명/세대/기관명 (없으면 \\"\\")",
  "period": "청구월 또는 사용월 (예: \\"2026.05\\", 없으면 \\"\\")",
  "elecKwh": 전력 사용량(kWh) 숫자만, 없으면 null,
  "gasM3": 도시가스 사용량(m³ 또는 ㎥) 숫자만, 없으면 null,
  "heatMcal": 난방 사용량(Mcal) 숫자만, 없으면 null,
  "hotWaterMcal": 급탕(온수) 사용량(Mcal) 숫자만, 없으면 null
}
규칙:
- 아파트 관리비 고지서는 전기/수도/난방/급탕(온수)/가스 항목이 한 장에 섞여 있어.
- 전기: 'kWh' 단위 사용량. (관리비는 금액만 크게 나오고 kWh는 작게 적힐 수 있어, 그래도 찾아봐)
- 도시가스: 'm³' 또는 '㎥' 단위 사용량.
- 난방: '난방' 항목의 사용량. 보통 'Mcal' 단위. (만약 'MWh'로 적혀 있으면 ×860 해서 Mcal로 환산)
- 급탕/온수: '급탕' 또는 '온수' 항목의 사용량. 보통 'Mcal' 단위.
- 수도(상수도·하수도)는 무시해 — 추출하지 마.
- 금액(원)은 절대 사용량으로 쓰지 마. 사용량 단위(kWh, m³, Mcal)만 추출해.
- 숫자에서 콤마(,)는 제거하고 순수 숫자로.
- 못 찾은 항목은 null.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`,
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
      catch(e2){ parsed = { company:'', period:'', elecKwh:null, gasM3:null, heatMcal:null, hotWaterMcal:null, raw:text }; }
    }

    const num = (v) => (v === null || v === undefined || v === '') ? null : Number(v);
    res.status(200).json({
      company: parsed.company || '',
      period:  parsed.period || '',
      elecKwh:      num(parsed.elecKwh),
      gasM3:        num(parsed.gasM3),
      heatMcal:     num(parsed.heatMcal),
      hotWaterMcal: num(parsed.hotWaterMcal)
    });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
}
