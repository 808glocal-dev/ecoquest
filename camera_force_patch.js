/* =====================================================
   EcoQuest – camera_force_patch.js  (동영상 지원판)
   6겹 검증 L1·L2 + 동영상 인증
   ─────────────────────────────────────────────────────
   • L1: 갤러리 차단, 인앱 카메라 실시간 촬영만
   • L2: 사진에 은은한 동적 워터마크 (날짜·시간·코드)
   • 촬영 버튼: 탭 = 사진 / 꾹 누르면 = 동영상(최대 5초)
   • 동영상 → Firebase Storage 업로드 → verifications.videoUrl
   • 동영상의 마지막 프레임을 사진으로 떠서 AI 인증에 사용
   • 동영상엔 워터마크 없음(원본), 사진에만 워터마크
   ─────────────────────────────────────────────────────
   ★ Blaze 플랜 + Storage 활성화 필요 (동영상)
   ★ 로드 위치: gemini_patch.js 뒤
   ===================================================== */
(function(){
  'use strict';
  if(window._cameraForceLoaded) return;
  window._cameraForceLoaded = true;

  const FILE_INPUT_ID = 'fileIn';
  const MAX_VIDEO_MS   = 5000;   // 동영상 최대 5초
  const LONGPRESS_MS   = 350;    // 이 시간 이상 누르면 동영상 모드
  let _stream = null;

  /* ── fileIn 클릭 가로채기 → 카메라 모달 ── */
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
      fileIn.setAttribute('capture', 'environment');
    }
  }

  /* ── saveVerification 후킹: 동영상 URL 포함 저장 ── */
  function hookSaveVerif(){
    if(window._camSVHooked) return;
    const orig = window.saveVerification;
    if(typeof orig !== 'function'){ setTimeout(hookSaveVerif, 800); return; }
    window._camSVHooked = true;
    window.saveVerification = async (uid, m, b64, isPublic, comment) => {
      const videoUrl = window._pendingVlogVideo || null;
      window._pendingVlogVideo = null;
      // 동영상 없으면 기존 흐름(=꾸미기 포함) 그대로
      if(!videoUrl) return orig(uid, m, b64, isPublic, comment);
      // 동영상 있으면 videoUrl 포함해서 직접 저장
      try {
        const thumb = await window.compressImage(b64, 1000);
        await window.FB.addDoc(window.FB.collection(window.FB.db, "verifications"), {
          uid,
          userName: window.UDATA?.nickname || window.ME?.displayName || "익명",
          userPhoto: window.ME?.photoURL || "",
          missionId: m.id, missionName: m.name, missionEmoji: m.emoji,
          isPublic, thumb, videoUrl, type: 'video',
          comment: comment || "",
          createdAt: window.FB.serverTimestamp()
        });
        return true;
      } catch(e){
        console.error('[camera] 동영상 인증 저장 실패', e);
        return orig(uid, m, b64, isPublic, comment);
      }
    };
    console.log('[camera_force] saveVerification 후킹 완료(동영상)');
  }

  /* ── 카메라 모달 ── */
  async function openCamera(){
    document.getElementById('ovCamera')?.remove();
    const modal = document.createElement('div');
    modal.id = 'ovCamera';
    modal.style.cssText = 'position:fixed;inset:0;background:#000;z-index:12000;display:flex;flex-direction:column';
    modal.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;color:#fff">
        <div style="font-size:14px;font-weight:900">📷 사진·영상 인증</div>
        <button id="camClose" style="background:rgba(255,255,255,.2);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;font-family:inherit">✕</button>
      </div>
      <div style="flex:1;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">
        <video id="camVideo" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
        <div id="camWm" style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.6);font-size:11px;font-weight:500;letter-spacing:.5px;text-shadow:0 1px 3px rgba(0,0,0,.7);pointer-events:none;white-space:nowrap"></div>
        <div id="camRecBadge" style="display:none;position:absolute;top:14px;left:50%;transform:translateX(-50%);background:rgba(231,76,60,.92);color:#fff;font-size:12px;font-weight:800;padding:5px 14px;border-radius:20px;align-items:center"><span style="display:inline-block;width:8px;height:8px;background:#fff;border-radius:50%;margin-right:7px;animation:camBlink 1s infinite"></span><span id="camRecTime">REC 0.0s</span></div>
        <div id="camUploading" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.65);align-items:center;justify-content:center;flex-direction:column;color:#fff;font-size:14px;font-weight:700"><div style="font-size:36px;margin-bottom:10px">📤</div>동영상 올리는 중...</div>
      </div>
      <div style="padding:10px 18px 4px;text-align:center;color:#fff;font-size:11px;opacity:.65">🔒 실시간 촬영만 인증 · <b style="color:#fff;opacity:1">탭 = 사진 / 꾹 누르면 = 동영상</b></div>
      <div style="display:flex;align-items:center;justify-content:center;gap:34px;padding:6px 20px 34px">
        <button id="camFlip" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:50px;height:50px;border-radius:50%;font-size:20px;cursor:pointer;font-family:inherit">🔄</button>
        <button id="camShoot" style="background:#fff;border:5px solid rgba(255,255,255,.4);width:72px;height:72px;border-radius:50%;cursor:pointer;touch-action:none"></button>
        <div style="width:50px"></div>
      </div>
      <canvas id="camCanvas" style="display:none"></canvas>`;
    document.body.appendChild(modal);

    if(!document.getElementById('camBlinkStyle')){
      const st = document.createElement('style');
      st.id = 'camBlinkStyle';
      st.textContent = '@keyframes camBlink{0%,100%{opacity:1}50%{opacity:.2}}';
      document.head.appendChild(st);
    }

    let facing = 'environment';
    const video = document.getElementById('camVideo');

    // 워터마크 텍스트 (사진에만)
    const now = new Date();
    const ts = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} `
             + `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const code = Math.random().toString(36).substring(2,6).toUpperCase();
    const wmText = `${ts} · ${code}`;
    document.getElementById('camWm').textContent = wmText;

    let _recorder=null, _chunks=[], _recording=false, _recStart=0,
        _recTimer=null, _maxTimer=null, _pressTimer=null, _videoMime='video/webm';

    async function start(){
      if(_stream) _stream.getTracks().forEach(t=>t.stop());
      try {
        _stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode: facing }, audio:true });
        video.srcObject = _stream;
      } catch(e){
        try { // 오디오 거부 시 비디오만
          _stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode: facing }, audio:false });
          video.srcObject = _stream;
        } catch(e2){
          window.toast && window.toast('카메라 권한이 필요해요. 설정에서 허용해주세요.');
          cleanup();
        }
      }
    }
    function cleanup(){
      if(_recTimer) clearInterval(_recTimer);
      if(_maxTimer) clearTimeout(_maxTimer);
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
      // 은은한 워터마크 (사진에만)
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

    /* 동영상 녹화 */
    function pickMime(){
      const cands=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
      for(const c of cands){ if(window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c; }
      return '';
    }
    function startRecording(){
      if(!_stream || _recording) return;
      _chunks=[]; _videoMime = pickMime();
      try { _recorder = _videoMime ? new MediaRecorder(_stream,{mimeType:_videoMime}) : new MediaRecorder(_stream); }
      catch(e){ window.toast && window.toast('이 브라우저는 동영상 녹화를 지원하지 않아요'); return; }
      _recorder.ondataavailable = (ev)=>{ if(ev.data && ev.data.size>0) _chunks.push(ev.data); };
      _recorder.onstop = ()=> finishRecording();
      _recorder.start();
      _recording = true; _recStart = Date.now();
      document.getElementById('camRecBadge').style.display='flex';
      document.getElementById('camShoot').style.background='#e74c3c';
      _recTimer = setInterval(()=>{
        const s=((Date.now()-_recStart)/1000).toFixed(1);
        const el=document.getElementById('camRecTime'); if(el) el.textContent=`REC ${s}s`;
      }, 100);
      _maxTimer = setTimeout(()=>{ if(_recording) stopRecording(); }, MAX_VIDEO_MS);
    }
    function stopRecording(){
      if(!_recording) return;
      _recording = false;
      clearInterval(_recTimer); clearTimeout(_maxTimer);
      try { _recorder.stop(); } catch(e){}
    }
    async function finishRecording(){
      const elapsed = Date.now() - _recStart;
      const badge = document.getElementById('camRecBadge'); if(badge) badge.style.display='none';
      // 너무 짧으면(0.6초 미만) 사진으로 처리
      if(elapsed < 600 || !_chunks.length){
        capturePhotoBlob((blob)=>{ cleanup(); injectPhoto(blob); });
        return;
      }
      // 끝 프레임 사진 먼저 캡처(스트림 살아있을 때) → 업로드 → 사진 주입
      capturePhotoBlob(async (photoBlob)=>{
        const videoBlob = new Blob(_chunks, {type:_videoMime||'video/webm'});
        const up = document.getElementById('camUploading'); if(up) up.style.display='flex';
        try {
          const url = await uploadVideo(videoBlob, _videoMime);
          window._pendingVlogVideo = url;
          window.toast && window.toast('🎬 동영상 업로드 완료!');
        } catch(e){
          console.error('[camera] 동영상 업로드 실패', e);
          window.toast && window.toast('동영상 업로드 실패 — 사진만 인증돼요');
        }
        cleanup();
        injectPhoto(photoBlob);   // 사진 → 기존 AI 인증 흐름
      });
    }

    /* 버튼: pointerdown(꾹 감지) / pointerup(사진 or 정지) */
    const shootBtn = document.getElementById('camShoot');
    shootBtn.addEventListener('pointerdown', (e)=>{
      e.preventDefault();
      _pressTimer = setTimeout(()=>{ startRecording(); }, LONGPRESS_MS);
    });
    shootBtn.addEventListener('pointerup', ()=>{
      clearTimeout(_pressTimer);
      if(_recording) stopRecording();
      else takePhoto();
    });

    document.getElementById('camClose').onclick = cleanup;
    document.getElementById('camFlip').onclick = ()=>{ facing = facing==='environment'?'user':'environment'; start(); };

    start();
  }

  /* ── Firebase Storage 동영상 업로드 ── */
  async function uploadVideo(blob, mime){
    if(!window.ME) throw new Error('로그인이 필요해요');
    const mod = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js");
    const storage = mod.getStorage();
    const ext = (mime && mime.includes('mp4')) ? 'mp4' : 'webm';
    const path = `vlogs/${window.ME.uid}/${Date.now()}.${ext}`;
    const sref = mod.ref(storage, path);
    await mod.uploadBytes(sref, blob, { contentType: mime || 'video/webm' });
    return await mod.getDownloadURL(sref);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(hook,1000); setTimeout(hookSaveVerif,1200); });
  } else {
    setTimeout(hook,1000); setTimeout(hookSaveVerif,1200);
  }
})();
