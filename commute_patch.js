/* =====================================================
   EcoQuest – 범용 댓글/방명록 comment_patch.js v1
   - openComments(type, targetId, title) 한 줄로 어디든 댓글창
     · type: 'photo'(인증사진) | 'vlog'(브이로그) | 'garden'(정원 방명록)
   - Firestore 'comments' 컬렉션 / 신고·본인삭제(미성년자 보호)
   - 정원: 내 정원 + 이웃 정원에 📖 방명록 버튼 자동 연동
   ★ garden_patch.js "뒤"에 로드
   ===================================================== */
(function(){
  'use strict';
  if(window._eqCommentLoaded) return;
  window._eqCommentLoaded=true;

  function injectCss(){
    if(document.getElementById('eqcCss')) return;
    const s=document.createElement('style'); s.id='eqcCss';
    s.textContent=`
      .eqc-bg{position:fixed;inset:0;background:rgba(40,50,38,.5);z-index:9200;display:flex;align-items:flex-end;justify-content:center}
      .eqc-modal{background:#fffdf6;width:100%;max-width:480px;border-radius:20px 20px 0 0;display:flex;flex-direction:column;max-height:80vh;font-family:'Gowun Batang',serif}
      .eqc-head{display:flex;align-items:center;justify-content:space-between;padding:16px 16px 10px;font-size:15px;font-weight:700;color:#3c4a3a;border-bottom:1px solid #f0e9d6}
      .eqc-x{background:#eee;border:none;border-radius:50%;width:28px;height:28px;font-size:14px;cursor:pointer}
      .eqc-list{flex:1;overflow-y:auto;padding:12px 16px;min-height:120px}
      .eqc-empty{text-align:center;color:#a99;font-size:13px;padding:30px 0;line-height:1.7}
      .eqc-item{padding:10px 0;border-bottom:1px solid #f4eeDF}
      .eqc-meta{display:flex;gap:8px;align-items:center;font-size:11px;color:#a99}
      .eqc-meta b{color:#6f9258;font-size:12px}
      .eqc-text{font-size:14px;color:#3c4a3a;margin-top:3px;line-height:1.5;word-break:break-word}
      .eqc-actions{margin-top:3px}
      .eqc-actions button{background:none;border:none;font-size:10px;color:#bbb;cursor:pointer;padding:0;font-family:inherit}
      .eqc-input-row{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #f0e9d6;background:#fffdf6}
      .eqc-input{flex:1;border:1.5px solid #e7ddc6;border-radius:20px;padding:10px 14px;font-size:14px;font-family:inherit;outline:none}
      .eqc-send{background:#6f9258;color:#fff;border:none;border-radius:20px;padding:0 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
    `;
    document.head.appendChild(s);
  }

  const esc=s=>String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  function fmtTime(ts){ if(!ts||!ts.seconds) return ''; const d=new Date(ts.seconds*1000); const diff=(Date.now()-d.getTime())/1000;
    if(diff<60)return '방금'; if(diff<3600)return Math.floor(diff/60)+'분 전'; if(diff<86400)return Math.floor(diff/3600)+'시간 전'; return (d.getMonth()+1)+'/'+d.getDate(); }

  async function loadComments(type,targetId){
    const q=window.FB.query(
      window.FB.collection(window.FB.db,'comments'),
      window.FB.where('type','==',type),
      window.FB.where('targetId','==',String(targetId))
    );
    const snap=await window.FB.getDocs(q);
    const arr=[]; snap.forEach(d=>{ const v=d.data(); if(!v.deleted) arr.push({id:d.id,...v}); });
    arr.sort((a,b)=>(a.ts?.seconds||0)-(b.ts?.seconds||0));
    return arr;
  }

  window.openComments=function(type,targetId,title){
    if(!window.FB){ return; }
    injectCss();
    title=title||'💬 댓글';
    const old=document.getElementById('eqcModal'); if(old) old.remove();
    const bg=document.createElement('div'); bg.className='eqc-bg'; bg.id='eqcModal';
    bg.innerHTML=`<div class="eqc-modal">
      <div class="eqc-head"><span>${esc(title)}</span><button class="eqc-x" onclick="document.getElementById('eqcModal').remove()">✕</button></div>
      <div class="eqc-list" id="eqcList"><div class="eqc-empty">불러오는 중...</div></div>
      <div class="eqc-input-row">
        <input id="eqcInput" class="eqc-input" placeholder="따뜻한 응원을 남겨주세요 🌱" maxlength="200"/>
        <button class="eqc-send" onclick="eqcSend('${type}','${targetId}')">남기기</button>
      </div>
    </div>`;
    bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();});
    document.body.appendChild(bg);
    eqcRefresh(type,targetId);
    setTimeout(()=>{const inp=document.getElementById('eqcInput'); if(inp) inp.onkeydown=e=>{if(e.key==='Enter')eqcSend(type,targetId);};},100);
  };

  async function eqcRefresh(type,targetId){
    const list=document.getElementById('eqcList'); if(!list) return;
    try{
      const arr=await loadComments(type,targetId);
      if(!arr.length){ list.innerHTML='<div class="eqc-empty">아직 댓글이 없어요.<br/>첫 응원을 남겨보세요 🌱</div>'; return; }
      const me=window.ME&&window.ME.uid;
      list.innerHTML=arr.map(c=>`<div class="eqc-item">
        <div class="eqc-meta"><b>${esc(c.nick||'익명')}</b><span>${fmtTime(c.ts)}</span></div>
        <div class="eqc-text">${esc(c.text)}</div>
        <div class="eqc-actions">${c.uid===me?`<button onclick="eqcDelete('${c.id}','${type}','${targetId}')">삭제</button>`:`<button onclick="eqcReport('${c.id}')">신고</button>`}</div>
      </div>`).join('');
      list.scrollTop=list.scrollHeight;
    }catch(e){ list.innerHTML='<div class="eqc-empty">불러오기 실패</div>'; console.log('[comment]',e.message); }
  }

  window.eqcSend=async function(type,targetId){
    const inp=document.getElementById('eqcInput'); if(!inp) return;
    const text=inp.value.trim(); if(!text) return;
    if(!window.ME){ window.toast&&toast('로그인이 필요해요'); return; }
    inp.value='';
    try{
      const dref=window.FB.doc(window.FB.collection(window.FB.db,'comments'));
      await window.FB.setDoc(dref,{ type, targetId:String(targetId), uid:window.ME.uid,
        nick:window.UDATA?.nickname||'익명 지구지킴이', text, ts:window.FB.serverTimestamp() });
      eqcRefresh(type,targetId);
    }catch(e){ window.toast&&toast('등록 실패: '+e.message); }
  };
  window.eqcDelete=async function(id,type,targetId){
    try{ await window.FB.updateDoc(window.FB.doc(window.FB.db,'comments',id),{deleted:true}); eqcRefresh(type,targetId); }
    catch(e){ window.toast&&toast('삭제 실패'); }
  };
  window.eqcReport=async function(id){
    try{
      const dref=window.FB.doc(window.FB.collection(window.FB.db,'commentReports'));
      await window.FB.setDoc(dref,{commentId:id, by:window.ME?.uid||'', ts:window.FB.serverTimestamp()});
      window.toast&&toast('신고 접수됐어요. 검토할게요');
    }catch(e){ window.toast&&toast('신고 실패'); }
  };

  /* ---------- 정원 방명록 연동 ---------- */
  function addMyGardenBtn(){
    const visitBtn=document.getElementById('gVisitBtn');
    if(!visitBtn || document.getElementById('eqcGardenBtn') || !window.ME) return;
    const b=document.createElement('button'); b.id='eqcGardenBtn'; b.textContent='📖 방명록';
    b.style.cssText='background:#fffdf6;border:1.5px solid #e7ddc6;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:700;color:#6f9258;cursor:pointer;font-family:inherit';
    b.onclick=()=>openComments('garden', window.ME.uid, '🌿 내 정원 방명록');
    visitBtn.parentNode.insertBefore(b, visitBtn);
  }
  function addVisitGardenBtn(uid){
    const exitBtn=document.querySelector('button[onclick="gardenExit()"]');
    if(!exitBtn || document.getElementById('eqcVisitBtn')) return;
    const b=document.createElement('button'); b.id='eqcVisitBtn'; b.textContent='📖 방명록 남기기';
    b.style.cssText='background:#6f9258;color:#fff;border:none;border-radius:10px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-right:6px';
    b.onclick=()=>openComments('garden', uid, '🌿 이 정원 방명록');
    exitBtn.parentNode.insertBefore(b, exitBtn);
  }

  function boot(){
    if(!window.FB){ setTimeout(boot,600); return; }
    // 내 정원 버튼: drawMap 후킹 + 주기 체크
    const _dm=window.drawMap;
    if(typeof _dm==='function' && !_dm._eqcHooked){
      window.drawMap=function(){ const r=_dm.apply(this,arguments); setTimeout(addMyGardenBtn,250); return r; };
      window.drawMap._eqcHooked=true;
    }
    // 이웃 정원 방문 후킹
    const _gv=window.gardenVisit;
    if(typeof _gv==='function' && !_gv._eqcHooked){
      window.gardenVisit=function(uid){ const r=_gv.apply(this,arguments); setTimeout(()=>addVisitGardenBtn(uid),250); return r; };
      window.gardenVisit._eqcHooked=true;
    }
    setInterval(()=>{ if(document.getElementById('gVisitBtn')) addMyGardenBtn(); },1600);
    console.log('%c[comment v1] 💬 댓글/방명록','color:#fff;background:#6f9258;padding:4px 8px;border-radius:4px;font-weight:bold');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,2400));
  else setTimeout(boot,2400);
})();
