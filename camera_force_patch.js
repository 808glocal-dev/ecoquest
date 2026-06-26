/* =====================================================
   EcoQuest – camera_force_patch.js  (사진 전용판 v3)
   인앱 실시간 카메라 인증 (갤러리 차단)
   ─────────────────────────────────────────────────────
   v2(동영상판) → v3 변경점:
   • 동영상·마이크 완전 제거 → getUserMedia 가 audio 요청 안 함
     → iOS Safari 마이크 권한 팝업 사라짐 + 카메라 권한 유지 개선
   • 탭 = 사진 촬영 (꾹/녹화 없음)
   • 사진에 은은한 워터마크(날짜·시간·코드) 유지
   • 한 번 켠 스트림은 모달 닫을 때까지 유지 → 같은 세션 재촬영 시 재요청 안 함
   ─────────────────────────────────────────────────────
   ★ 로드 위치: gemini_patch.js 뒤 (기존 위치 그대로)
   ===================================================== */
(function(){
  'use strict';
  if(window._cameraForceLoaded) return;
  window._cameraForceLoaded = true;

  const FILE_INPUT_ID = 'fileIn';
  let _stream = null;

  /* ── fileIn 클릭 가로채기 → 인앱 카메라 ── */
  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.id === FILE_INPUT_ID){
      e.preventDefault();
      e.stopImmediatePropagation();
      openCamera();
    }
  }, true);

  function hook(){
    const fileIn = document.getElementById(FILE_INPUT_ID);
    if(!fileIn){ setTimeout(hook, 800); return; }
    if(!fileIn._cameraForced){
      fileIn._cameraForced = true;
      // capture 속성 제거: OS 카메라앱 대신 인앱 getUserMedia 사용
      fileIn.removeAttribute('capture');
    }
  }

  /* ── 카메라 모달 ── */
  async function openCamera(){
    document.getElementById('ovCamera')?.remove();
    const modal = document.createElement('div');
    modal.id = 'ovCamera';
    modal.style.cssText = 'position:fixed;inset:0;background:#000;z-index:12000;display:flex;flex-direction:column';
    modal.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;color:#fff">
        <div style="font-size:14px;font-weight:900">📷 사진 인증</div>
        <button id="camClose" style="background:rgba(255,255,255,.2);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;font-family:inherit">✕</button>
      </div>
      <div style="flex:1;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">
        <video id="camVideo" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
        <div id="camWm" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:11px;font-weight:500;letter-spacing:.5px;text-shadow:0 1px 3px rgba(0,0,0,.7);pointer-events:none;white-space:nowrap"></div>
        <div id="camLoading" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;background:#000">
          <div style="width:38px;height:38px;border:3px solid rgba(255,255,255,.25);border-top-color:#2ECC71;border-radius:50%;animation:camSpin .8s linear infinite"></div>
          <div style="font-size:13px;margin-top:14px;opacity:.8">카메라 켜는 중...</div>
        </div>
        <div id="camTapStart" style="display:none;position:absolute;inset:0;flex-direction:column;align-items:center;justify-content:center;color:#fff;background:rgba(0,0,0,.85);cursor:pointer;text-align:center;padding:20px">
          <div style="font-size:40px">👆</div>
          <div style="font-size:15px;font-weight:800;margin-top:10px">화면을 탭해서 카메라를 켜주세요</div>
          <div style="font-size:12px;opacity:.7;margin-top:6px;line-height:1.6">화면이 까맣게 보일 때 한 번 탭하면<br/>카메라가 시작돼요</div>
        </div>
      </div>
      <div style="padding:10px 18px 4px;text-align:center;color:#fff;font-size:11px;opacity:.65">🔒 실시간 촬영만 인증돼요 · 탭해서 촬영</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:34px;padding:6px 20px 34px">
        <button id="camFlip" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:50px;height:50px;border-radius:50%;font-size:20px;cursor:pointer;font-family:inherit">🔄</button>
        <button id="camShoot" style="background:#fff;border:5px solid rgba(255,255,255,.4);width:72px;height:72px;border-radius:50%;cursor:pointer;touch-action:manipulation"></button>
        <div style="width:50px"></div>
      </div>
      <canvas id="camCanvas" style="display:none"></canvas>`;
    document.body.appendChild(modal);

    if(!document.getElementById('camSpinStyle')){
      const st = document.createElement('style');
      st.id = 'camSpinStyle';
      st.textContent = '@keyframes camSpin{to{transform:rotate(360deg)}}';
      document.head.appendChild(st);
    }

    let facing = 'environment';
    const video = document.getElementById('camVideo');

    // 워터마크 텍스트
    const now = new Date();
    const ts = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} `
             + `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const code = Math.random().toString(36).substring(2,6).toUpperCase();
    const wmText = `${ts} · ${code}`;
    document.getElementById('camWm').textContent = wmText;

    function showLoading(on){
      const el = document.getElementById('camLoading');
      if(el) el.style.display = on ? 'flex' : 'none';
    }
    function showTapStart(on){
      const el = document.getElementById('camTapStart');
      if(el) el.style.display = on ? 'flex' : 'none';
    }

    // 비디오가 실제로 프레임을 그릴 때까지 재생 보장 (iOS 까만화면 방지)
    async function playVideo(){
      try {
        await video.play();
      } catch(e){
        // iOS: 자동재생 거부 → 사용자 탭 유도
        showLoading(false);
        showTapStart(true);
        return false;
      }
      return true;
    }

    async function start(){
      showTapStart(false);
      showLoading(true);
      if(_stream) _stream.getTracks().forEach(t=>t.stop());
      try {
        // ★ audio 없음 — 카메라만 요청 (마이크 팝업 X, iOS 권한유지 개선)
        _stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode: facing }, audio:false });
        video.srcObject = _stream;

        // 메타데이터(해상도) 들어오면 재생 시작 → 프레임 확보 후 로딩 해제
        const onReady = async () => {
          const ok = await playVideo();
          if(ok){
            // 실제 프레임 크기가 잡힐 때까지 한 번 더 확인
            if(video.videoWidth > 0){ showLoading(false); }
            else {
              // 드물게 크기 0이면 잠깐 뒤 재확인
              setTimeout(()=>{ if(video.videoWidth>0) showLoading(false); else { showLoading(false); showTapStart(true); } }, 600);
            }
          }
        };
        if(video.readyState >= 1){ onReady(); }
        else { video.onloadedmetadata = onReady; }

        // 안전망: 1.5초 안에 프레임 안 잡히면 탭 유도
        setTimeout(()=>{
          if(_stream && video.videoWidth === 0){
            showLoading(false);
            showTapStart(true);
          }
        }, 1500);

      } catch(e){
        cleanup();
        showCamPermGuide();
      }
    }
    function cleanup(){
      if(_stream){ _stream.getTracks().forEach(t=>t.stop()); _stream=null; }
      modal.remove();
    }

    /* 사진 캡처(워터마크) → blob 콜백 */
    function capturePhotoBlob(cb){
      const w = video.videoWidth, h = video.videoHeight;
      if(!w || !h){ window.toast && window.toast('카메라 준비 중이에요'); return; }
      const canvas = document.getElementById('camCanvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if(facing === 'user'){ ctx.translate(w,0); ctx.scale(-1,1); }
      ctx.drawImage(video, 0, 0, w, h);
      ctx.setTransform(1,0,0,1,0,0);
      // 은은한 워터마크
      const fontSize = Math.max(12, Math.round(w * 0.019));
      ctx.font = `500 ${fontSize}px sans-serif`;
      ctx.textBaseline = 'bottom'; ctx.textAlign = 'center';
      const pad = Math.round(h * 0.028);
      ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 3;
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fillText(wmText, w/2, h - pad);
      ctx.shadowBlur = 0; ctx.textAlign = 'left';
      canvas.toBlob(cb, 'image/jpeg', 0.9);
    }

    function injectPhoto(blob){
      const file = new File([blob], `ecoquest_${code}.jpg`, { type:'image/jpeg' });
      const fileIn = document.getElementById(FILE_INPUT_ID);
      try {
        const dt = new DataTransfer(); dt.items.add(file);
        fileIn.files = dt.files;
      } catch(err){ console.warn('[camera] DataTransfer 미지원', err); }
      fileIn.dispatchEvent(new Event('change', { bubbles:true }));
    }

    /* 탭 = 사진 */
    function takePhoto(){
      capturePhotoBlob((blob)=>{ cleanup(); injectPhoto(blob); });
    }

    const shootBtn = document.getElementById('camShoot');
    shootBtn.addEventListener('click', (e)=>{ e.preventDefault(); takePhoto(); });

    // 까만화면일 때 탭하면 재생 재시도 (iOS 자동재생 거부 대응)
    const tapStart = document.getElementById('camTapStart');
    if(tapStart){
      tapStart.addEventListener('click', async ()=>{
        showTapStart(false);
        showLoading(true);
        if(_stream && video.srcObject){
          const ok = await playVideo();
          if(ok && video.videoWidth>0){ showLoading(false); }
          else { showLoading(false); start(); } // 그래도 안되면 스트림 새로
        } else {
          start();
        }
      });
    }

    document.getElementById('camClose').onclick = cleanup;
    document.getElementById('camFlip').onclick = ()=>{ facing = facing==='environment'?'user':'environment'; start(); };

    start();
  }

  /* ── 카메라 권한 거부 시 안내 모달 ── */
  function showCamPermGuide(){
    document.getElementById('ovCamPerm')?.remove();
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const ov = document.createElement('div');
    ov.id = 'ovCamPerm';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:13000;display:flex;align-items:center;justify-content:center;padding:24px';
    ov.innerHTML = `<div style="background:#fff;border-radius:20px;padding:26px 22px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.3)">
      <div style="font-size:44px">🎥</div>
      <div style="font-size:17px;font-weight:900;color:#1B5E20;margin-top:8px">카메라 허용이 필요해요</div>
      <div style="font-size:13px;color:#666;margin-top:8px;line-height:1.6">실시간 촬영으로만 인증할 수 있어요.<br/>아래 방법으로 카메라를 켜주세요!</div>
      <div style="background:#f0fbf4;border-radius:12px;padding:14px;margin-top:16px;text-align:left;font-size:12px;color:#333;line-height:1.9">
        ${isIOS
          ? `<b>📱 아이폰 (사파리)</b><br/>① 주소창 왼쪽 <b>aA</b> 버튼 → <b>웹사이트 설정</b> → 카메라 <b>"허용"</b><br/>② 또는 <b>설정 앱 → Safari → 카메라 → "허용"</b>`
          : `<b>🔒 권한 허용</b><br/>① 주소창 왼쪽 <b>자물쇠</b> 아이콘 클릭<br/>② 카메라 → <b>"허용"</b>으로 변경 후 새로고침`}
      </div>
      ${isIOS
        ? `<div style="background:#fff8e1;border-radius:12px;padding:12px;margin-top:10px;text-align:left;font-size:12px;color:#8D6E1B;line-height:1.7"><b>💡 매번 묻지 않게 하려면</b><br/>사파리 <b>공유 버튼(□↑)</b> → <b>"홈 화면에 추가"</b> → 그 아이콘으로 열면 권한이 유지돼요!</div>`
        : ''}
      <button onclick="document.getElementById('ovCamPerm').remove()" style="width:100%;margin-top:18px;background:linear-gradient(135deg,#2ECC71,#27AE60);border:none;color:#fff;border-radius:12px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">확인했어요</button>
    </div>`;
    document.body.appendChild(ov);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(hook,1000); });
  } else {
    setTimeout(hook,1000);
  }
})();
