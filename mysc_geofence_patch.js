/* =====================================================
   EcoQuest – mysc_geofence_patch.js  v1
   MYSC 파일럿: 출근 체크인 GPS 반경 인증
   ─────────────────────────────────────────────────────
   • MYSC 임직원만 출근 체크인 시 회사 반경 내 위치 검증
   • 중심: 서울 성동구 연무장13길 8 (37.5422, 127.0585)
   • 반경: 500m
   • 반경 밖이면 체크인 차단 (GPS 거부/실패도 차단)
   • GPS는 체크인 시 1회만 요청 (브라우저가 권한 캐싱)
   • MYSC 외 회사·일반 사용자는 기존 방식 그대로 (GPS 미적용)
   ─────────────────────────────────────────────────────
   ★ 로드 위치: commute_challenge_patch.js "뒤"
   ★ _doCommuteCheckin 을 후킹해서 GPS 통과 시에만 원본 실행
   ===================================================== */
(function(){
  'use strict';
  if(window._myscGeofenceLoaded) return;
  window._myscGeofenceLoaded = true;

  // ── MYSC 사무실 좌표 / 반경 ──
  const MYSC_LAT = 37.5422278;
  const MYSC_LNG = 127.0585651;
  const RADIUS_M = 500;

  // ── MYSC companyId (정확 판별) ──
  const MYSC_COMPANY_ID = 'yHHT6T6ieD5ZENAMlwTR';

  // ── 이 사용자가 MYSC 소속인지 판별 ──
  function isMyscUser(){
    const d = window.UDATA || {};
    // 1) companyId 정확 일치 (가장 확실)
    if(d.companyId === MYSC_COMPANY_ID) return true;
    // 2) 보조: companyId/회사명에 mysc 포함
    const cid = (d.companyId || '').toString().toLowerCase();
    const cname = (d.companyName || d.company || '').toString().toLowerCase();
    if(cid.includes('mysc') || cname.includes('mysc')) return true;
    return false;
  }

  // ── 두 좌표 간 거리(m) — Haversine ──
  function distM(lat1, lng1, lat2, lng2){
    const R = 6371000;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // ── GPS 1회 요청 (Promise) ──
  function getPosition(){
    return new Promise((resolve, reject)=>{
      if(!navigator.geolocation){ reject(new Error('NO_GEO')); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos),
        err => reject(err),
        { enableHighAccuracy:true, timeout:10000, maximumAge:60000 }
      );
    });
  }

  // ── 위치 확인 모달 (진행/실패 안내) ──
  function showGeoModal(state, opts){
    opts = opts || {};
    document.getElementById('ovGeoChk')?.remove();
    const ov = document.createElement('div');
    ov.id = 'ovGeoChk'; ov.className = 'overlay on';
    let inner = '';
    if(state === 'checking'){
      inner = `<div style="text-align:center;padding:30px 10px">
        <div style="font-size:44px;margin-bottom:14px">📍</div>
        <div style="font-size:16px;font-weight:900;color:var(--txt);margin-bottom:6px">위치 확인 중...</div>
        <div style="font-size:13px;color:var(--sub);line-height:1.6">회사 근처에 있는지 확인하고 있어요.<br/>위치 권한을 허용해주세요.</div>
        <div style="margin-top:16px"><span style="display:inline-block;font-size:24px;animation:spin 1s linear infinite">⏳</span></div>
      </div>`;
    } else if(state === 'fail_out'){
      inner = `<div style="text-align:center;padding:26px 14px">
        <div style="font-size:44px;margin-bottom:12px">🚫</div>
        <div style="font-size:16px;font-weight:900;color:#c0392b;margin-bottom:8px">회사 반경 밖이에요</div>
        <div style="font-size:13px;color:var(--sub);line-height:1.7">출근 체크인은 <b>회사(MYSC) 500m 이내</b>에서만 가능해요.<br/>현재 회사에서 약 <b>${opts.dist}m</b> 떨어져 있어요.</div>
        <div style="font-size:11px;color:#aaa;margin-top:8px">회사에 도착한 뒤 다시 체크인해주세요.</div>
        <button class="btn btn-gray" style="margin-top:18px" onclick="document.getElementById('ovGeoChk').remove()">확인</button>
      </div>`;
    } else if(state === 'fail_denied'){
      inner = `<div style="text-align:center;padding:26px 14px">
        <div style="font-size:44px;margin-bottom:12px">📍</div>
        <div style="font-size:16px;font-weight:900;color:#c0392b;margin-bottom:8px">위치 권한이 필요해요</div>
        <div style="font-size:13px;color:var(--sub);line-height:1.7">MYSC 출근 체크인은 위치 확인이 필요해요.<br/>브라우저 설정에서 <b>위치 권한을 허용</b>한 뒤 다시 시도해주세요.</div>
        <div style="font-size:11px;color:#aaa;margin-top:8px">아이폰: 설정 → Safari → 위치 / 안드로이드: 브라우저 권한</div>
        <button class="btn btn-gray" style="margin-top:18px" onclick="document.getElementById('ovGeoChk').remove()">확인</button>
      </div>`;
    } else if(state === 'fail_err'){
      inner = `<div style="text-align:center;padding:26px 14px">
        <div style="font-size:44px;margin-bottom:12px">⚠️</div>
        <div style="font-size:16px;font-weight:900;color:#c0392b;margin-bottom:8px">위치를 확인할 수 없어요</div>
        <div style="font-size:13px;color:var(--sub);line-height:1.7">GPS 신호를 받지 못했어요.<br/>실외로 이동하거나 잠시 후 다시 시도해주세요.</div>
        <button class="btn btn-gray" style="margin-top:18px" onclick="document.getElementById('ovGeoChk').remove()">확인</button>
      </div>`;
    }
    ov.innerHTML = `<div class="modal" style="max-width:340px;border-radius:20px">${inner}</div>`;
    document.body.appendChild(ov);
  }
  function closeGeoModal(){ document.getElementById('ovGeoChk')?.remove(); }

  // ── _doCommuteCheckin 후킹 ──
  function hookCheckin(){
    if(typeof window._doCommuteCheckin !== 'function'){ setTimeout(hookCheckin, 600); return; }
    if(window._doCommuteCheckin._geoHooked) return;

    const orig = window._doCommuteCheckin;
    window._doCommuteCheckin = async function(chalId){
      // MYSC 사용자가 아니면 기존 동작 그대로
      if(!isMyscUser()){ return orig.call(this, chalId); }

      // MYSC 사용자 → GPS 반경 검증 먼저
      showGeoModal('checking');
      let pos;
      try {
        pos = await getPosition();
      } catch(err){
        closeGeoModal();
        if(err && (err.code === 1 || err.PERMISSION_DENIED === 1)){
          showGeoModal('fail_denied');           // 권한 거부
        } else {
          showGeoModal('fail_err');               // 타임아웃·신호없음
        }
        return; // 체크인 차단
      }

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const dist = Math.round(distM(lat, lng, MYSC_LAT, MYSC_LNG));

      if(dist > RADIUS_M){
        closeGeoModal();
        showGeoModal('fail_out', {dist});         // 반경 밖 → 차단
        return;
      }

      // 통과 → 위치정보를 잠깐 저장해서 원본이 commuteLogs에 같이 넣게
      window._myscGeo = { lat, lng, dist, verifiedAt: Date.now() };
      closeGeoModal();
      if(window.toast) toast(`📍 회사 반경 확인! (약 ${dist}m)`);
      return orig.call(this, chalId);
    };
    window._doCommuteCheckin._geoHooked = true;
    console.log('%c[mysc_geofence v1] MYSC 출근 GPS 반경 인증 활성 (500m)','color:#fff;background:#6a1b9a;padding:3px 7px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', ()=>setTimeout(hookCheckin, 2000));
  else setTimeout(hookCheckin, 2000);
})();
