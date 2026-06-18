/* =====================================================
   EcoQuest – photo_decorate_patch.js
   인증 사진 꾸미기 에디터 (필터 · 스티커 · 텍스트)
   + 동영상 인증이면 videoUrl 까지 한 번에 저장
   ─────────────────────────────────────────────────────
   • window.saveVerification 을 가로채서, 저장 직전에 꾸미기 화면을 띄움
   • 꾸민(또는 그대로) 사진을 합성해서 저장
   • 동영상(window._pendingVlogVideo) 있으면 videoUrl 포함해 직접 저장
   • saveVerification 가로채기는 이 패치 한 곳에서만! (camera_force 와 충돌 방지)
   ─────────────────────────────────────────────────────
   ★ 로드 위치: saveVerification 정의보다 "뒤"면 어디든 OK
   ===================================================== */
(function(){
  'use strict';

  const FILTERS = [
    {name:'원본',   css:'none'},
    {name:'밝게',   css:'brightness(1.15) contrast(1.05)'},
    {name:'따뜻',   css:'saturate(1.3) sepia(.15) brightness(1.05)'},
    {name:'시원',   css:'saturate(1.2) hue-rotate(-12deg) brightness(1.05)'},
    {name:'쨍하게', css:'saturate(1.55) contrast(1.18)'},
    {name:'흑백',   css:'grayscale(1) contrast(1.1)'},
    {name:'세피아', css:'sepia(.6) contrast(1.05)'},
    {name:'빈티지', css:'sepia(.3) saturate(1.3) contrast(.95) brightness(1.05)'},
  ];
  const STICKERS = ['🌱','🌍','♻️','💚','🌿','🌳','☀️','🚲','🥕','🍎','🌸','✨','💧','🍃','🐰','📸','👍','🔥'];

  const COMPOSE_MAXW = 1000;
  const JPEG_QUALITY = 0.85;

  let S = null;

  /* ── saveVerification 가로채기 (이 패치 단독) ── */
  function hookSave(){
    if(window._photoDecorHooked) return;
    const orig = window.saveVerification;
    if(typeof orig !== 'function'){ setTimeout(hookSave, 800); return; }
    window.saveVerification = async (uid, m, b64, isPublic, comment) => {
      let finalB64 = b64;
      try{ finalB64 = await openPhotoEditor(b64); }catch(e){ finalB64 = b64; }
      if(finalB64 === null) return false;   // 취소

      // ── 동영상 인증이면 videoUrl 포함해서 직접 저장 ──
      const videoUrl = window._pendingVlogVideo || null;
      window._pendingVlogVideo = null;
      if(videoUrl){
        try{
          const thumb = await window.compressImage(finalB64, 1000);
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
        }catch(e){
          console.error('[photo_decorate] 동영상 저장 실패, 사진으로 대체', e);
          return orig(uid, m, finalB64, isPublic, comment);
        }
      }

      // ── 일반 사진 인증 ──
      return orig(uid, m, finalB64, isPublic, comment);
    };
    window._photoDecorHooked = true;
    console.log('[photo_decorate] saveVerification 후킹 완료 (꾸미기+동영상)');
  }

  function openPhotoEditor(b64){
    return new Promise(resolve=>{
      S = { b64, resolve, filterCss:'none', items:[], sel:-1 };
      buildEditor();
    });
  }

  /* ── 에디터 UI ── */
  function buildEditor(){
    document.getElementById('ovPhotoEdit')?.remove();
    ensureCSS();
    const ov = document.createElement('div');
    ov.id = 'ovPhotoEdit';
    ov.style.cssText = 'position:fixed;inset:0;background:#111;z-index:13500;display:flex;flex-direction:column';
    ov.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;flex-shrink:0">
        <button onclick="window._peCancel()" style="background:rgba(255,255,255,.15);border:none;color:#fff;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">취소</button>
        <div style="color:#fff;font-size:14px;font-weight:900">사진 꾸미기</div>
        <button onclick="window._peDone()" style="background:linear-gradient(135deg,#2ECC71,#27AE60);border:none;color:#fff;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit">올리기</button>
      </div>

      <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:6px 12px">
        <div id="peStage" style="position:relative;max-width:100%;max-height:100%;line-height:0" onpointerdown="window._peStageTap(event)">
          <img id="peImg" src="data:image/jpeg;base64,${S.b64}" style="display:block;max-width:100%;max-height:62vh;border-radius:10px"/>
          <div id="peOverlay" style="position:absolute;inset:0"></div>
        </div>
      </div>

      <div id="peSizeBar" style="display:none;align-items:center;gap:10px;padding:4px 20px;flex-shrink:0">
        <span style="color:#fff;font-size:12px">크기</span>
        <input id="peSize" type="range" min="24" max="140" value="56" oninput="window._peResize(this.value)" style="flex:1"/>
        <button onclick="window._peDelete()" style="background:#e74c3c;border:none;color:#fff;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">삭제</button>
      </div>

      <div style="background:#1c1c1c;padding:10px 0 16px;flex-shrink:0">
        <div style="display:flex;gap:8px;overflow-x:auto;padding:0 14px 10px" class="pe-scroll">
          ${FILTERS.map((f,i)=>`<button onclick="window._peFilter(${i})" id="pef-${i}" style="flex-shrink:0;background:${i===0?'#2ECC71':'rgba(255,255,255,.12)'};border:none;color:#fff;border-radius:18px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${f.name}</button>`).join('')}
        </div>
        <div style="display:flex;gap:6px;overflow-x:auto;padding:0 14px;align-items:center" class="pe-scroll">
          <button onclick="window._peAddText()" style="flex-shrink:0;background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:14px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">✏️ 글자</button>
          ${STICKERS.map(s=>`<button onclick="window._peAddSticker('${s}')" style="flex-shrink:0;background:none;border:none;font-size:26px;cursor:pointer;padding:2px 4px;line-height:1">${s}</button>`).join('')}
        </div>
      </div>`;
    document.body.appendChild(ov);
  }

  function ensureCSS(){
    if(document.getElementById('peStyle')) return;
    const s = document.createElement('style');
    s.id = 'peStyle';
    s.textContent = `
      .pe-scroll{scrollbar-width:none;-ms-overflow-style:none}
      .pe-scroll::-webkit-scrollbar{display:none}
      .pe-item{position:absolute;transform:translate(-50%,-50%);cursor:move;user-select:none;touch-action:none;line-height:1;white-space:nowrap}
      .pe-item.sel{outline:2px dashed #2ECC71;outline-offset:4px;border-radius:4px}
    `;
    document.head.appendChild(s);
  }

  function renderItems(){
    const ov = document.getElementById('peOverlay');
    if(!ov) return;
    ov.innerHTML = '';
    S.items.forEach((it, idx)=>{
      const el = document.createElement('div');
      el.className = 'pe-item' + (idx===S.sel ? ' sel' : '');
      el.style.left = it.xPct + '%';
      el.style.top = it.yPct + '%';
      if(it.type === 'sticker'){
        el.style.fontSize = it.size + 'px';
        el.textContent = it.content;
      } else {
        el.style.fontSize = it.size + 'px';
        el.style.fontWeight = '900';
        el.style.color = '#fff';
        el.style.textShadow = '0 2px 6px rgba(0,0,0,.7), 0 0 2px rgba(0,0,0,.9)';
        el.textContent = it.content;
      }
      makeDraggable(el, idx);
      ov.appendChild(el);
    });
    const bar = document.getElementById('peSizeBar');
    if(bar){
      if(S.sel >= 0){ bar.style.display = 'flex'; document.getElementById('peSize').value = S.items[S.sel].size; }
      else bar.style.display = 'none';
    }
  }

  function makeDraggable(el, idx){
    let dragging = false;
    el.addEventListener('pointerdown', e=>{
      e.stopPropagation(); dragging = true; S.sel = idx; renderItems();
      try{ el.setPointerCapture(e.pointerId); }catch(_){}
    });
    el.addEventListener('pointermove', e=>{
      if(!dragging) return;
      const st = document.getElementById('peStage').getBoundingClientRect();
      let x = ((e.clientX - st.left)/st.width)*100;
      let y = ((e.clientY - st.top)/st.height)*100;
      x = Math.max(2, Math.min(98, x)); y = Math.max(2, Math.min(98, y));
      S.items[idx].xPct = x; S.items[idx].yPct = y;
      el.style.left = x + '%'; el.style.top = y + '%';
    });
    el.addEventListener('pointerup', ()=>{ dragging = false; });
    el.addEventListener('pointercancel', ()=>{ dragging = false; });
  }

  window._peStageTap = function(e){
    if(e.target.id === 'peImg' || e.target.id === 'peOverlay' || e.target.id === 'peStage'){
      S.sel = -1; renderItems();
    }
  };
  window._peAddSticker = function(emoji){
    S.items.push({type:'sticker', content:emoji, xPct:50, yPct:50, size:56});
    S.sel = S.items.length - 1; renderItems();
  };
  window._peAddText = function(){
    const t = (prompt('사진에 넣을 글자를 적어줘 (최대 20자)') || '').trim().slice(0,20);
    if(!t) return;
    S.items.push({type:'text', content:t, xPct:50, yPct:50, size:40});
    S.sel = S.items.length - 1; renderItems();
  };
  window._peResize = function(v){ if(S.sel>=0){ S.items[S.sel].size = +v; renderItems(); } };
  window._peDelete = function(){ if(S.sel>=0){ S.items.splice(S.sel,1); S.sel=-1; renderItems(); } };
  window._peFilter = function(i){
    S.filterCss = FILTERS[i].css;
    const img = document.getElementById('peImg');
    if(img) img.style.filter = S.filterCss === 'none' ? '' : S.filterCss;
    FILTERS.forEach((_,j)=>{ const b=document.getElementById('pef-'+j); if(b) b.style.background = j===i?'#2ECC71':'rgba(255,255,255,.12)'; });
  };

  window._peCancel = function(){
    const res = S?.resolve;
    document.getElementById('ovPhotoEdit')?.remove();
    const r = res; S = null;
    if(r) r(null);
  };
  window._peDone = async function(){
    try{
      const raw = await composeImage();
      const res = S?.resolve;
      document.getElementById('ovPhotoEdit')?.remove();
      const r = res; S = null;
      if(r) r(raw);
    }catch(e){
      console.error('[photo_decorate] 합성 실패', e);
      const res = S?.resolve; const orig = S?.b64;
      document.getElementById('ovPhotoEdit')?.remove();
      const r = res; S = null;
      if(r) r(orig);
    }
  };

  /* ── 합성 ── */
  function composeImage(){
    return new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=>{
        try{
          const scale = Math.min(1, COMPOSE_MAXW / img.width);
          const cw = Math.round(img.width*scale), ch = Math.round(img.height*scale);
          const c = document.createElement('canvas'); c.width = cw; c.height = ch;
          const ctx = c.getContext('2d');
          ctx.filter = (S.filterCss && S.filterCss !== 'none') ? S.filterCss : 'none';
          ctx.drawImage(img, 0, 0, cw, ch);
          ctx.filter = 'none';

          const stage = document.getElementById('peStage');
          const sw = stage ? stage.clientWidth : cw;
          const ratio = cw / (sw || cw);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          S.items.forEach(it=>{
            const x = (it.xPct/100)*cw, y = (it.yPct/100)*ch;
            const fs = Math.max(8, it.size * ratio);
            if(it.type === 'sticker'){
              ctx.font = `${fs}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
              ctx.fillText(it.content, x, y);
            } else {
              ctx.font = `900 ${fs}px sans-serif`;
              ctx.lineWidth = Math.max(2, fs*0.14); ctx.strokeStyle = 'rgba(0,0,0,.6)';
              ctx.strokeText(it.content, x, y);
              ctx.fillStyle = '#fff';
              ctx.fillText(it.content, x, y);
            }
          });
          const dataUrl = c.toDataURL('image/jpeg', JPEG_QUALITY);
          resolve(dataUrl.split(',')[1]);
        }catch(err){ reject(err); }
      };
      img.onerror = reject;
      img.src = 'data:image/jpeg;base64,' + S.b64;
    });
  }

  hookSave();
  console.log('[photo_decorate_patch] 로드됨');
})();
