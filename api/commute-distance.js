// /api/commute-distance.js  — 출발지·도착지 주소 → 경로 거리(km)
// ★ /api/ 폴더에 넣으세요 (ocr-bill.js 와 같은 위치)
// ★ 환경변수 KAKAO_REST_API_KEY 필요 (카카오 디벨로퍼스 REST API 키)
//   - 주소→좌표: 카카오 로컬 API (dapi.kakao.com)
//   - 좌표→거리: 카카오모빌리티 길찾기 (apis-navi.kakaomobility.com)

export default async function handler(req, res){
  if(req.method !== 'POST'){
    res.status(405).json({ error: 'POST only' });
    return;
  }

  const { from, to } = req.body || {};
  if(!from || !to){
    res.status(400).json({ error: '출발지·도착지 주소를 모두 입력해주세요' });
    return;
  }

  const KEY = process.env.KAKAO_REST_API_KEY;
  if(!KEY){
    res.status(500).json({ error: 'KAKAO_REST_API_KEY 가 설정되지 않았어요' });
    return;
  }

  // 주소 → 좌표 (카카오 로컬)
  async function geocode(addr){
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(addr)}`,
      { headers: { Authorization: `KakaoAK ${KEY}` } }
    );
    const d = await r.json();
    if(!r.ok) throw new Error(`주소 변환 실패 (${r.status}): ${JSON.stringify(d)}`);
    const doc = d.documents && d.documents[0];
    if(!doc) throw new Error(`주소를 찾을 수 없어요: "${addr}" — 도로명/지번 주소로 다시 입력해보세요`);
    return { x: doc.x, y: doc.y, name: doc.address_name }; // x=경도, y=위도
  }

  try {
    const o = await geocode(from);
    const dst = await geocode(to);

    // 좌표 → 경로 거리 (카카오모빌리티 자동차 길찾기)
    const url = `https://apis-navi.kakaomobility.com/v1/directions`
      + `?origin=${o.x},${o.y}&destination=${dst.x},${dst.y}&priority=RECOMMEND`;
    const r2 = await fetch(url, { headers: { Authorization: `KakaoAK ${KEY}` } });
    const d2 = await r2.json();

    if(!r2.ok){
      // 401/403 이면 카카오모빌리티 길찾기 사용 신청이 필요할 수 있음
      throw new Error(`길찾기 실패 (${r2.status}): ${JSON.stringify(d2)}`);
    }

    const route = d2.routes && d2.routes[0];
    if(!route || route.result_code !== 0){
      throw new Error(`경로를 찾을 수 없어요${route ? ' (' + route.result_msg + ')' : ''}`);
    }

    const distM = route.summary.distance; // meters
    res.status(200).json({
      distanceKm: +(distM / 1000).toFixed(1),
      fromName: o.name,
      toName: dst.name
    });
  } catch(e){
    res.status(500).json({ error: e.message });
  }
}
