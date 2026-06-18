/* =====================================================
   EcoQuest – camera_force_patch.js
   6겹 검증 울타리 — L1(인앱 카메라 강제) + L2(동적 워터마크)
   ─────────────────────────────────────────────────────
   • L1: 갤러리/스크린샷 업로드 차단 → 앱에서 실시간 촬영만 인증
   • L2: 촬영 순간 시간+랜덤코드 워터마크 → 과거·남의 사진 재사용 불가
   ─────────────────────────────────────────────────────
   • 기존 인증 흐름(fileIn → prevImg → doAnalyze)에 그대로 연결
   • 로드 위치: gemini_patch.js 뒤
   ===================================================== */
(function(){
  'use strict';
  if(window._cameraForceLoaded) return;
  window._cameraForceLoaded = true;

  const FILE_INPUT_ID = 'fileIn';   // 인증용 파일 입력 id (gemini_patch 기준)
  let _stream = null;

  /* ── fileIn 클릭 가로채기: 갤러리 대신 카메라 모달 ── */
  function hook(){
    const fileIn = document.getElementById(FILE_INPUT_ID);
    if(!fileIn){ setTimeout(hook, 800); return; }
    if(fileIn._cameraForced){ return; }
    fileIn._cameraForced = true;
    fileIn.setAttribute('capture', 'environment'); // 모바일 1차 방어
    console.log('[camera_force] L1·L2 적용됨');
  }
  // 클릭은 document 레벨에서 capture 단계로 가로챔 (label·프로그래밍 클릭 모두 포착)
  document.addEventListener('click', function(e){
    const t = e.target;
    if(t && t.id === FILE_INPUT_ID){
      e.preventDefault();
      e.stopImmediatePropagation();
      openCamera();
    }
  }, true);

  /* ── 인앱 카메라 모달 ── */
  async function openCamera(){
    document.getElementById('ovCamera')?.remove();
    const modal = document.createElement('div');
    modal.id = 'ovCamera';
    modal.style.cssText = 'position:fixed;inset:0;background:#000;z-index:12000;display:flex;flex-direction:column';
    modal.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;color:#fff">
        <div style="font-size:14px;font-weight:900">📷 사진 촬영 인증</div>
        <button id="camClose" style="background:rgba(255,255,255,.2);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;font-family:inherit">✕</button>
      </div>
      <div style="flex:1;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">
        <video id="camVideo" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
        <div id="camWm" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:11px;font-weight:500;letter-spacing:.5px;text-shadow:0 1px 3px rgba(0,0,0,.7);pointer-events:none;white-space:nowrap"></div>
      </div>
      <div style="padding:14px 18px 6px;text-align:center;color:#fff;font-size:11px;opacity:.65">🔒 갤러리 업로드는 막혀 있어요 · 실시간 촬영만 인증됩니다</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:34px;padding:8px 20px 34px">
        <button id="camFlip" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:50px;height:50px;border-radius:50%;font-size:20px;cursor:pointer;font-family:inherit">🔄</button>
        <button id="camShoot" style="background:#fff;border:5px solid rgba(255,255,255,.4);width:72px;height:72px;border-radius:50%;cursor:pointer"></button>
        <div style="width:50px"></div>
      </div>
      <canvas id="camCanvas" style="display:none"></canvas>`;
    document.body.appendChild(modal);

    let facing = 'environment';
    const video = document.getElementById('camVideo');

    // L2 워터마크 텍스트 (촬영 시각 + 랜덤 코드)
    const now = new Date();
    const ts = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} `
             + `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const code = Math.random().toString(36).substring(2,6).toUpperCase();
    const wmText = `${ts} · ${code}`;   // 이름 빼고 날짜·시간·코드만 (은은하게)
    document.getElementById('camWm').textContent = wmText;

    async function start(){
      if(_stream) _stream.getTracks().forEach(t=>t.stop());
      try {
        _stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode: facing }, audio:false });
        video.srcObject = _stream;
      } catch(e){
        console.warn('[camera_force] 카메라 접근 실패', e);
        window.toast && window.toast('카메라 권한이 필요해요. 브라우저/설정에서 허용해주세요.');
        cleanup();
      }
    }
    function cleanup(){
      if(_stream){ _stream.getTracks().forEach(t=>t.stop()); _stream=null; }
      modal.remove();
    }

    document.getElementById('camClose').onclick = cleanup;
    document.getElementById('camFlip').onclick = ()=>{
      facing = (facing === 'environment') ? 'user' : 'environment';
      start();
    };
    document.getElementById('camShoot').onclick = ()=>{
      const w = video.videoWidth, h = video.videoHeight;
      if(!w || !h){ window.toast && window.toast('카메라 준비 중이에요'); return; }
      const canvas = document.getElementById('camCanvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if(facing === 'user'){ ctx.translate(w,0); ctx.scale(-1,1); } // 셀카 좌우반전 보정
      ctx.drawImage(video, 0, 0, w, h);
      ctx.setTransform(1,0,0,1,0,0);

      // ── L2: 동적 워터마크 (은은하게, 하단 중앙, 사진에만) ──
      const fontSize = Math.max(12, Math.round(w * 0.019));
      ctx.font = `500 ${fontSize}px sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'center';
      const pad = Math.round(h * 0.028);
      ctx.shadowColor = 'rgba(0,0,0,.65)';   // 박스 대신 그림자로 가독성만
      ctx.shadowBlur = 3;
      ctx.fillStyle = 'rgba(255,255,255,.55)';  // 반투명 — 안 거슬리게
      ctx.fillText(wmText, w / 2, h - pad);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';

      // ── File 주입 → 기존 인증 흐름(fileIn change) 재활용 ──
      canvas.toBlob((blob)=>{
        const file = new File([blob], `ecoquest_${code}.jpg`, { type:'image/jpeg' });
        const fileIn = document.getElementById(FILE_INPUT_ID);
        try {
          const dt = new DataTransfer();
          dt.items.add(file);
          fileIn.files = dt.files;
        } catch(err){ console.warn('[camera_force] DataTransfer 미지원', err); }
        cleanup();
        // change 이벤트로 기존 미리보기·분석 흐름 트리거
        fileIn.dispatchEvent(new Event('change', { bubbles:true }));
      }, 'image/jpeg', 0.9);
    };

    start();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(hook, 1000));
  else setTimeout(hook, 1000);
})();
