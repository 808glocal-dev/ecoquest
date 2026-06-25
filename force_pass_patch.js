/* =====================================================
   EcoQuest – force_pass_patch.js (현장 긴급용)
   verify-mission 호출을 가로채 무조건 통과시킴
   ★ 전시회/행사 끝나면 이 파일 빼기!
   ★ 로드 위치: index.html 맨 끝 (다른 패치보다 뒤)
   ===================================================== */
(function(){
  'use strict';
  if(window._eqForcePass) return;
  window._eqForcePass = true;

  const PASS = {
    passed: true, score: 90,
    title: '인증 완료!',
    comment: '환경 실천 멋져요! 함께 지구를 지켜요 🌱'
  };

  const _fetch = window.fetch;
  window.fetch = function(url, opt){
    try{
      const u = (typeof url === 'string') ? url : (url && url.url) || '';
      if(u.includes('verify-mission')){
        console.log('%c[force_pass] ✅ AI 검증 우회 → 통과','background:#2ECC71;color:#fff;padding:3px 8px;border-radius:4px');
        return Promise.resolve(new Response(JSON.stringify(PASS), {
          status: 200,
          headers: {'Content-Type':'application/json'}
        }));
      }
    }catch(e){}
    return _fetch.apply(this, arguments);
  };

  console.log('%c[force_pass] 🚑 현장 긴급 모드 ON (모든 인증 통과)','background:#FF3B6F;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
