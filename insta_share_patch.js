/* =====================================================
   EcoQuest – insta_share_patch.js v1
   - 인증샷 → 에코퀘스트 템플릿(브랜딩+챌린지+CO₂) 자동 합성 후 공유
   - ① 찍을 때: success_popup의 ehShareInsta를 템플릿 버전으로 교체
   - ② 과거: openMyGallery() → verifications에서 내 인증 모아보기 → 탭하면 템플릿 공유
   - 사진은 verifications 컬렉션(thumb/image)에서 읽음
   ★ 로드 위치: success_popup_patch.js "뒤"
   ===================================================== */
(function(){
  'use strict';
  if(window._eqInstaLoaded) return;
  window._eqInstaLoaded=true;

  // ★★★ 디자인 설정 — 데모에서 맘에 든 걸로 바꿔 ★★★
  const TPL = { theme:'light', watermark:'bottom' };  // theme:'light'|'dark' · watermark:'bottom'|'center'

  function makeEcoCard({src, name, emoji, co2, date}){
    return new Promise((resolve)=>{
      const W=1080,H=1350;
      const c=document.createElement('canvas'); c.width=W; c.height=H;
      const ctx=c.getContext('2d');
      const T = TPL.theme==='dark'
        ? {bg:'#0C3A1E',card:'#114a28',ink:'#fdf8ee',sub:'#9fc6a8',brand:'#fdf8ee',chipBg:'#f2cf6b',chipInk:'#0C3A1E',foot:'#7fae8c',pb:'#1d5e36'}
        : {bg:'#fdf8ee',card:'#ffffff',ink:'#143a1e',sub:'#6f8a6a',brand:'#0C3A1E',chipBg:'#f2cf6b',chipInk:'#5a4500',foot:'#8a9a85',pb:'#e8e0cc'};
      function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
      function paint(img){
        ctx.fillStyle=T.bg; ctx.fillRect(0,0,W,H);
        ctx.textAlign='center';
        ctx.fillStyle=T.brand; ctx.font='800 60px -apple-system,sans-serif'; ctx.fillText('🌿 EcoQuest',W/2,110);
        ctx.fillStyle=T.sub; ctx.font='600 28px -apple-system,sans-serif'; ctx.fillText('함께 지킨 지구',W/2,152);
        const px=90,py=200,pw=W-180,ph=pw;
        ctx.save(); rr(px,py,pw,ph,40); ctx.clip();
        if(img){ const ir=img.width/img.height,br=pw/ph; let sw,sh,sx,sy;
          if(ir>br){sh=img.height;sw=sh*br;sx=(img.width-sw)/2;sy=0;} else {sw=img.width;sh=sw/br;sx=0;sy=(img.height-sh)/2;}
          ctx.drawImage(img,sx,sy,sw,sh,px,py,pw,ph);
        } else { const g=ctx.createLinearGradient(px,py,px+pw,py+ph); g.addColorStop(0,'#bcdcc4'); g.addColorStop(1,'#7fae8c'); ctx.fillStyle=g; ctx.fillRect(px,py,pw,ph); }
        ctx.restore();
        ctx.strokeStyle=T.pb; ctx.lineWidth=3; rr(px,py,pw,ph,40); ctx.stroke();
        if(TPL.watermark==='center'){ ctx.save(); ctx.globalAlpha=.22; ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.font='800 52px -apple-system,sans-serif'; ctx.translate(px+pw/2,py+ph/2); ctx.rotate(-Math.PI/12); ctx.fillText('eco-quest.kr',0,0); ctx.restore(); }
        const cy=py+ph+34,cx=90,cw=W-180,ch=210;
        ctx.fillStyle=T.card; rr(cx,cy,cw,ch,32); ctx.fill();
        ctx.textAlign='left'; ctx.fillStyle=T.sub; ctx.font='700 26px -apple-system,sans-serif'; ctx.fillText('오늘의 챌린지',cx+40,cy+58);
        ctx.fillStyle=T.ink; ctx.font='800 44px -apple-system,sans-serif';
        let title=(emoji?emoji+' ':'')+(name||'환경 미션'); if(title.length>14) title=title.slice(0,14)+'…';
        ctx.fillText(title,cx+40,cy+112);
        const co2s=(parseFloat(co2)||0).toFixed(1);
        const chipW=300,chipH=84,chipX=cx+cw-chipW-32,chipY=cy+ch-chipH-30;
        ctx.fillStyle=T.chipBg; rr(chipX,chipY,chipW,chipH,42); ctx.fill();
        ctx.textAlign='center'; ctx.fillStyle=T.chipInk; ctx.font='800 40px -apple-system,sans-serif'; ctx.fillText('🌍 '+co2s+'kg',chipX+chipW/2,chipY+38);
        ctx.font='700 22px -apple-system,sans-serif'; ctx.fillText('CO₂ 절감',chipX+chipW/2,chipY+68);
        if(date){ ctx.textAlign='left'; ctx.fillStyle=T.sub; ctx.font='600 26px -apple-system,sans-serif'; ctx.fillText('📅 '+date,cx+40,cy+ch-46); }
        ctx.textAlign='center'; ctx.fillStyle=T.brand; ctx.font='800 34px -apple-system,sans-serif'; ctx.fillText('eco-quest.kr',W/2,H-72);
        ctx.fillStyle=T.foot; ctx.font='600 26px -apple-system,sans-serif'; ctx.fillText('@ecoquest_kr · 작은 행동이 지구를 바꿔요',W/2,H-36);
        resolve(c.toDataURL('image/jpeg',0.9));
      }
      if(!src){ paint(null); return; }
      const img=new Image(); img.crossOrigin='anonymous';
      img.onload=()=>paint(img); img.onerror=()=>paint(null);
      img.src = (src.startsWith('data:')||src.startsWith('http')) ? src : ('data:image/jpeg;base64,'+src);
    });
  }
  window.makeEcoCard=makeEcoCard;

  async function shareCard(dataUrl, name, co2){
    const text = `오늘 "${name||'환경 미션'}" 인증 완료! 🌱\n방금 CO₂ ${(parseFloat(co2)||0).toFixed(2)}kg을 줄였어요.\n\n나도 환경 미션하고 농가 과일 받기 🍎\n👉 eco-quest.kr\n\n#에코퀘스트 #EcoQuest #환경챌린지 #탄소중립 @ecoquest_kr`;
    try{
      const blob=await (await fetch(dataUrl)).blob();
      const file=new File([blob],'ecoquest.jpg',{type:'image/jpeg'});
      if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file],text,title:'EcoQuest'}); return; }
      if(navigator.share){ await navigator.share({title:'EcoQuest',text,url:'https://eco-quest.kr'}); return; }
      await navigator.clipboard.writeText(text); window.toast&&toast('📋 복사됐어요! 인스타에 붙여넣기');
    }catch(e){ if(e&&e.name!=='AbortError') console.log('[insta]',e.message); }
  }
  window.eqShareCard=shareCard;

  /* ── ① 찍을 때 공유: 템플릿 버전으로 교체 ── */
  window.ehShareInsta = async function(){
    clearTimeout(window._ehSucTimer);
    const m=window._lastShareMission||{};
    const co2=window._lastShareCo2||m.co2||0;
    const src=window._lastShareImg||'';
    const date=new Date().toLocaleDateString('ko-KR');
    window.toast&&toast('🎨 인증카드 만드는 중...');
    const card=await makeEcoCard({src, name:m.name, emoji:m.emoji, co2, date});
    await shareCard(card, m.name, co2);
  };

  /* ── ② 과거 인증 갤러리 + 공유 ── */
  window.openMyGallery = async function(){
    if(!window.ME){ window.toast&&toast('로그인이 필요해요'); return; }
    document.getElementById('ovMyGal')?.remove();
    const ov=document.createElement('div'); ov.id='ovMyGal';
    ov.style.cssText='position:fixed;inset:0;background:rgba(40,50,38,.6);z-index:9300;display:flex;align-items:flex-end;justify-content:center';
    ov.innerHTML=`<div style="background:#fffdf6;width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:18px 16px 28px;max-height:84vh;overflow-y:auto;font-family:-apple-system,sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:16px;font-weight:800;color:#1B5E20">📸 내 인증 기록</div>
        <button onclick="document.getElementById('ovMyGal').remove()" style="background:#eee;border:none;border-radius:50%;width:30px;height:30px;font-size:15px;cursor:pointer">✕</button>
      </div>
      <div style="font-size:11px;color:#a99;margin-bottom:12px">사진을 탭하면 에코퀘스트 카드로 인스타 공유돼요</div>
      <div id="myGalGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><div style="grid-column:1/4;text-align:center;color:#a99;padding:30px;font-size:13px">불러오는 중...</div></div>
    </div>`;
    ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
    try{
      const q=window.FB.query(window.FB.collection(window.FB.db,'verifications'), window.FB.where('uid','==',window.ME.uid));
      const snap=await window.FB.getDocs(q);
      const items=snap.docs.map(d=>({id:d.id,...d.data()})).filter(v=>v.createdAt?.seconds).sort((a,b)=>b.createdAt.seconds-a.createdAt.seconds);
      window._myGalItems={}; items.forEach(v=>window._myGalItems[v.id]=v);
      const grid=document.getElementById('myGalGrid');
      if(!items.length){ grid.innerHTML='<div style="grid-column:1/4;text-align:center;color:#a99;padding:30px;font-size:13px">아직 인증 기록이 없어요 🌱</div>'; return; }
      grid.innerHTML=items.map(v=>{
        const img=v.photo||v.image||v.imageUrl||v.thumb||'';
        const cov=img?((img.startsWith('data:')||img.startsWith('http'))?img:'data:image/jpeg;base64,'+img):'';
        return `<div onclick="eqGalShare('${v.id}')" style="aspect-ratio:1;border-radius:10px;overflow:hidden;background:#e8f0e4;cursor:pointer;position:relative">
          ${cov?`<img src="${cov}" style="width:100%;height:100%;object-fit:cover"/>`:`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px">${v.missionEmoji||'🌱'}</div>`}
          <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.55));padding:12px 6px 5px;color:#fff;font-size:9px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.missionName||''}</div>
          <div style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);border-radius:6px;padding:1px 5px;font-size:12px">📤</div>
        </div>`;
      }).join('');
    }catch(e){ const g=document.getElementById('myGalGrid'); if(g) g.innerHTML='<div style="grid-column:1/4;text-align:center;color:#c66;padding:30px;font-size:13px">불러오기 실패</div>'; }
  };
  window.eqGalShare = async function(id){
    const v=(window._myGalItems||{})[id]; if(!v) return;
    const img=v.photo||v.image||v.imageUrl||v.thumb||'';
    const co2=v.co2 || (window.MISSION_SOURCES&&window.MISSION_SOURCES[v.missionId]?.co2) || 0;
    const date=v.createdAt?.seconds?new Date(v.createdAt.seconds*1000).toLocaleDateString('ko-KR'):'';
    window.toast&&toast('🎨 인증카드 만드는 중...');
    const card=await makeEcoCard({src:img, name:v.missionName, emoji:v.missionEmoji, co2, date});
    await shareCard(card, v.missionName, co2);
  };

  function boot(){
    console.log('%c[insta_share v1] 📸 템플릿 공유','color:#fff;background:#DD2A7B;padding:4px 8px;border-radius:4px;font-weight:bold');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1300));
  else setTimeout(boot,1300);
})();
