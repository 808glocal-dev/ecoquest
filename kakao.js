// api/kakao.js - Vercel 서버리스 함수
// 카카오 인증 코드 → 액세스 토큰 → 유저 정보 반환

export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', 'https://eco-quest.kr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'code required' });
  }

  const REST_API_KEY = '11604f4514f1708fe995de19960d0eab';
  const REDIRECT_URI = 'https://eco-quest.kr';

  try {
    // 1. 코드 → 액세스 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description });
    }

    // 2. 액세스 토큰 → 유저 정보
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    return res.status(200).json({
      id: userData.id,
      nickname: userData.kakao_account?.profile?.nickname
        || userData.properties?.nickname
        || '카카오유저',
      profileImage: userData.kakao_account?.profile?.profile_image_url
        || userData.properties?.profile_image
        || '',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
