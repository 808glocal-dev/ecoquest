/* =====================================================
   EcoQuest – company_vlog_patch.js
   소속(팀) 하루 브이로그 — BeReal식 크루 챌린지 (1단계: 사진 기반)
   ─────────────────────────────────────────────────────
   • 회사 멤버들의 그날 환경미션 인증샷을 날짜별로 자동으로 묶음
   • 카드 탭 → 스토리처럼 자동 넘김(컷당 3초) · 닉네임 + 미션 + 시간
   • 오늘 묶음은 VLOG_OPEN_HOUR(기본 16시=4시) 이후에만 공개, 그 전엔 잠금
   • 매일 VLOG_ALARM_HOUR(기본 13시=1시)에 "탄소 제로 타임" 인앱 알림
     (앱을 켜둔 사람 한정. 닫힌 앱 푸시는 2단계 FCM 작업)
   ─────────────────────────────────────────────────────
   ★ 로드 위치: company_feed_patch.js 바로 "아래"에 넣어주세요.
   ===================================================== */
(function(){
  'use strict';

  // ───── 설정값 (시각만 바꾸면 됨, 24시간제) ─────
  const VLOG_ALARM_HOUR = 13;   // 정각 알림 시각 (1시 = 13)
  const VLOG_OPEN_HOUR  = 16;   // 하루 브이로그 공개 시각 (4시 = 16)
  // ───────────────────────────────────────────────

  const KST = 9 * 3600 * 1000;
  function kstDateStr(seconds){ return new Date(seconds*1000 + KST).toISOString().split('T')[0]; }
  function todayKst(){ return new Date(Date.now() + KST).toISOString().split('T')[0]; }
  function nowKstHour(){ return new Date(Date.now() + KST).getUTCHours(); }
  function nowKstMin(){ return new Date(Date.now() + KST).getUTCMinutes(); }

  function formatDateLabel(dt){
    const today = todayKst();
    if(dt === today) return '오늘';
    const yest = new Date(new Date(today+'T00:00:00Z').getTime() - 86400000).toISOString().split('T')[0];
    if(dt === yest) return '어제';
    const [,M,D] = dt.split('-');
    return `${parseInt(M)}월 ${parseInt(D)}일`;
  }

  // 인증 이미지 소스 — 원본 필드가 있으면 우선, 없으면 썸네일
  function imgSrc(v){
    return v.photo || v.image || v.imageUrl || v.fullImage || v.imageData || v.thumb || '';
  }

  /* ════════ 브이로그 섹션 렌더 ════════ */
  async function renderCompanyVlog(){
    try{
      const myUid = window.ME?.uid;
      const myCompanyId = window.UDATA?.companyId;
      if(!myUid || !myCompanyId) return;
      const page = document.getElementById('page-company');
      if(!page) return;
      document.getElementById('companyVlogSection')?.remove();

      // 멤버 맵
      const usersSnap = await window.FB.getDocs(window.FB.collection(window.FB.db,'users'));
      const memberUids = [], memberMap = {};
      usersSnap.docs.forEach(d=>{
        const data = d.data();
        if(data.companyId === myCompanyId){
          memberUids.push(d.id);
          memberMap[d.id] = { nickname: data.nickname || '익명', photo: data.photoURL || '' };
        }
      });
      if(!memberUids.length) return;

      const coSnap = await window.FB.getDoc(window.FB.doc(window.FB.db,'companies',myCompanyId));
      const coName = coSnap.exists() ? (coSnap.data().name || '우리 팀') : '우리 팀';

      // 인증(공개) → 시간순(오래된→최신, 스토리 순서)
      const vSnap = await window.FB.getDocs(window.FB.collection(window.FB.db,'verifications'));
      const items = vSnap.docs.map(d=>({id:d.id, ...d.data()}))
        .filter(v => memberUids.includes(v.uid) && v.isPublic && v.createdAt?.seconds)
        .sort((a,b)=> a.createdAt.seconds - b.createdAt.seconds);

      // 날짜별 그룹
      const byDate = {};
      items.forEach(v=>{ const dt = kstDateStr(v.createdAt.seconds); (byDate[dt] = byDate[dt] || []).push(v); });
      const dates = Object.keys(byDate).sort((a,b)=> b.localeCompare(a)); // 최신 날짜 먼저
      const today = todayKst();
      const hour = nowKstHour();

      window._vlogData = byDate;
      window._vlogMemberMap = memberMap;

      let cards;
      if(!dates.length){
        cards = `<div style="background:#fff;border-radius:14px;padding:28px 20px;border:1px solid var(--bdr);text-align:center"><div style="font-size:40px;margin-bottom:10px">🎬</div><div style="font-size:13px;font-weight:700;color:var(--txt)">아직 팀 브이로그가 없어요</div><div style="font-size:11px;color:var(--sub);margin-top:6px;line-height:1.7">매일 ${VLOG_ALARM_HOUR>12?VLOG_ALARM_HOUR-12:VLOG_ALARM_HOUR}시 알림에 맞춰 환경미션을 찍으면<br/>${VLOG_OPEN_HOUR>12?VLOG_OPEN_HOUR-12:VLOG_OPEN_HOUR}시에 하루 브이로그로 완성돼요!</div></div>`;
      } else {
        cards = dates.map(dt=>{
          const list = byDate[dt];
          const isToday = dt === today;
          const locked = isToday && hour < VLOG_OPEN_HOUR;
          const cover = list[list.length-1];
          const memberCount = new Set(list.map(v=>v.uid)).size;
          const label = formatDateLabel(dt);
          if(locked){
            return `<div style="flex:0 0 86%;scroll-snap-align:center;position:relative;background:linear-gradient(135deg,#0f3d20,#1a2e1a);border-radius:16px;overflow:hidden;aspect-ratio:4/5;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:16px">
              <div style="font-size:38px;margin-bottom:8px">🔒</div>
              <div style="font-size:16px;font-weight:900">${label} 브이로그</div>
              <div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:4px">지금까지 ${list.length}컷 · ${memberCount}명 참여 중</div>
              <div style="font-size:11px;color:#a8f0c6;font-weight:700;margin-top:8px">${VLOG_OPEN_HOUR>12?VLOG_OPEN_HOUR-12:VLOG_OPEN_HOUR}시에 공개돼요 🎬</div>
            </div>`;
          }
          const cov = imgSrc(cover);
          return `<div onclick="window.playVlog('${dt}')" style="flex:0 0 86%;scroll-snap-align:center;position:relative;border-radius:16px;overflow:hidden;aspect-ratio:4/5;cursor:pointer;background:#000;box-shadow:0 4px 16px rgba(0,0,0,.15)">
            ${cov
              ? `<img src="${cov}" style="width:100%;height:100%;object-fit:cover"/>`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:72px;background:linear-gradient(135deg,#1a6b3a,#2ECC71)">${cover.missionEmoji||'🌱'}</div>`}
            <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55))"></div>
            <div style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,.5);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;color:#fff">▶ ${list.length}컷 재생</div>
            ${isToday?'<div style="position:absolute;top:12px;right:12px;background:#FF3B6F;border-radius:20px;padding:4px 11px;font-size:11px;font-weight:900;color:#fff">LIVE</div>':''}
            <div style="position:absolute;bottom:14px;left:16px;right:16px;color:#fff">
              <div style="font-size:20px;font-weight:900">${label} 브이로그</div>
              <div style="font-size:12px;color:rgba(255,255,255,.9);margin-top:3px">${coName} · ${memberCount}명 · ${list.length}개 인증</div>
            </div>
          </div>`;
        }).join('');
      }

      ensureVlogCSS();
      const sec = document.createElement('div');
      sec.id = 'companyVlogSection';
      sec.style.cssText = 'padding:0 12px 8px;margin-top:12px';
      sec.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:15px;font-weight:900;color:var(--txt)">🎬 우리 팀 하루 브이로그</div>
          <button onclick="window.renderCompanyVlog()" style="background:#fff;border:1px solid var(--bdr);border-radius:10px;padding:5px 10px;font-size:11px;font-weight:700;color:var(--g2);cursor:pointer;font-family:inherit">🔄</button>
        </div>
        <div class="vlog-carousel" style="display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 4px 10px;margin:0 -4px">${cards}</div>
        ${dates.length>1?`<div style="text-align:center;font-size:11px;color:var(--sub);margin-top:2px">← 옆으로 넘기면 지난 브이로그 →</div>`:''}`;
      page.appendChild(sec);  // 맨 아래 (ranking이 맨 위 자리 독점해도 충돌 없음)
    }catch(e){ console.error('[company_vlog]', e); }
  }
  window.renderCompanyVlog = renderCompanyVlog;

  /* ════════ 스토리 자동재생 플레이어 ════════ */
  function ensureVlogCSS(){
    if(document.getElementById('vlogKbStyle')) return;
    const s = document.createElement('style');
    s.id = 'vlogKbStyle';
    s.textContent = `
      @keyframes kb0{0%{transform:scale(1.0) translate(0,0)}100%{transform:scale(1.09) translate(-2%,-1%)}}
      @keyframes kb1{0%{transform:scale(1.09) translate(2%,1%)}100%{transform:scale(1.0) translate(0,0)}}
      @keyframes kb2{0%{transform:scale(1.02) translate(2%,-1%)}100%{transform:scale(1.09) translate(-2%,0)}}
      @keyframes kb3{0%{transform:scale(1.09) translate(-1%,1%)}100%{transform:scale(1.02) translate(1%,-1%)}}
      @keyframes vFade{0%{opacity:0}100%{opacity:1}}
      @keyframes vPop{0%{transform:scale(.55);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
      @keyframes vCapUp{0%{transform:translateY(14px);opacity:0}100%{transform:translateY(0);opacity:1}}
      .vlog-carousel{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch}
      .vlog-carousel::-webkit-scrollbar{display:none}
    `;
    document.head.appendChild(s);
  }

  window.playVlog = function(dt){
    ensureVlogCSS();
    const list = (window._vlogData||{})[dt];
    if(!list || !list.length) return;
    document.getElementById('ovVlogPlayer')?.remove();
    const ov = document.createElement('div');
    ov.id = 'ovVlogPlayer';
    ov.style.cssText = 'position:fixed;inset:0;background:#000;z-index:10000;display:flex;flex-direction:column';
    ov.innerHTML = `
      <div id="vlogBars" style="display:flex;gap:4px;padding:14px 12px 6px;z-index:5"></div>
      <div style="display:flex;align-items:center;gap:10px;padding:4px 16px 10px;z-index:5">
        <div id="vlogAvatar" style="width:34px;height:34px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#2ECC71,#27AE60);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0"><div id="vlogName" style="font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div><div id="vlogTime" style="font-size:11px;color:rgba(255,255,255,.7)"></div></div>
        <button onclick="window.closeVlog()" style="background:rgba(255,255,255,.2);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;font-family:inherit;flex-shrink:0">✕</button>
      </div>
      <div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden">
        <img id="vlogImg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:center;will-change:transform,opacity"/>
        <div id="vlogEmoji" style="position:absolute;font-size:120px;display:none"></div>
        <div style="position:absolute;left:0;top:0;bottom:0;width:32%;z-index:6" onclick="window.vlogPrev()"></div>
        <div style="position:absolute;right:0;top:0;bottom:0;width:32%;z-index:6" onclick="window.vlogNext()"></div>
      </div>
      <div id="vlogCaption" style="padding:14px 18px 34px;z-index:5"></div>`;
    document.body.appendChild(ov);
    window._vlogList = list; window._vlogIdx = 0;
    document.getElementById('vlogBars').innerHTML = list.map((_,i)=>
      `<div style="flex:1;height:3px;background:rgba(255,255,255,.3);border-radius:2px;overflow:hidden"><div id="vbar-${i}" style="width:0%;height:100%;background:#fff"></div></div>`).join('');
    showVlogFrame(0);
  };

  function showVlogFrame(i){
    const list = window._vlogList;
    if(!list || !list[i]){ window.closeVlog(); return; }
    window._vlogIdx = i;
    const v = list[i];
    const member = (window._vlogMemberMap||{})[v.uid] || {};
    const name = member.nickname || v.userName || '익명';
    const img = document.getElementById('vlogImg');
    const emo = document.getElementById('vlogEmoji');
    if(!img) return;
    const src = imgSrc(v);
    if(src){
      img.src = src; img.style.display='block'; emo.style.display='none';
      const kb = 'kb' + (i % 4);
      img.style.animation = 'none'; void img.offsetWidth;        // 리셋
      img.style.animation = `vFade .45s ease, ${kb} 3.4s ease-in-out forwards`;
    } else {
      img.style.display='none'; emo.style.display='block'; emo.textContent = v.missionEmoji || '🌱';
      emo.style.animation = 'none'; void emo.offsetWidth;
      emo.style.animation = 'vPop .55s ease';
    }
    document.getElementById('vlogName').textContent = name;
    document.getElementById('vlogTime').textContent = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const av = document.getElementById('vlogAvatar');
    av.innerHTML = member.photo ? `<img src="${member.photo}" style="width:100%;height:100%;object-fit:cover"/>` : (name[0] || '👤');
    const cap = document.getElementById('vlogCaption');
    cap.innerHTML =
      `<div style="display:inline-block;background:rgba(255,255,255,.18);border-radius:12px;padding:6px 12px;color:#fff;font-size:13px;font-weight:700">${v.missionEmoji||'🌱'} ${v.missionName||''}</div>`
      + (v.comment ? `<div style="color:#fff;font-size:14px;margin-top:10px;line-height:1.5">💬 ${v.comment}</div>` : '');
    cap.style.animation = 'none'; void cap.offsetWidth;
    cap.style.animation = 'vCapUp .5s ease';
    list.forEach((_,j)=>{ const b=document.getElementById('vbar-'+j); if(b && j!==i) b.style.cssText='width:'+(j<i?'100':'0')+'%;height:100%;background:#fff'; });
    clearTimeout(window._vlogTimer);
    const bar = document.getElementById('vbar-'+i);
    if(bar){ bar.style.transition='none'; bar.style.width='0%'; void bar.offsetWidth; bar.style.transition='width 3s linear'; bar.style.width='100%'; }
    window._vlogTimer = setTimeout(()=> window.vlogNext(), 3000);
  }
  window.vlogNext = function(){ const i = window._vlogIdx + 1; if(window._vlogList && i < window._vlogList.length) showVlogFrame(i); else window.closeVlog(); };
  window.vlogPrev = function(){ const i = window._vlogIdx - 1; if(i >= 0) showVlogFrame(i); };
  window.closeVlog = function(){ clearTimeout(window._vlogTimer); document.getElementById('ovVlogPlayer')?.remove(); };

  /* ════════ 정각 인앱 알림 (앱 켜둔 사람) ════════ */
  function checkVlogAlarm(){
    if(!window.ME || !window.UDATA?.companyId) return;
    const today = todayKst();
    const key = 'eq_vlog_alarm_' + today;
    if(nowKstHour() === VLOG_ALARM_HOUR && nowKstMin() < 5 && !localStorage.getItem(key)){
      try{ localStorage.setItem(key,'1'); }catch(e){}
      showVlogAlarm();
    }
  }
  function showVlogAlarm(){
    document.getElementById('ovVlogAlarm')?.remove();
    const ov = document.createElement('div');
    ov.id = 'ovVlogAlarm'; ov.className = 'overlay on';
    ov.innerHTML = `<div class="modal" style="padding:28px 22px;text-align:center">
      <div style="font-size:56px;margin-bottom:10px">📸</div>
      <div style="font-size:20px;font-weight:900;color:#1B5E20">탄소 제로 타임!</div>
      <div style="font-size:13px;color:#666;margin-top:10px;line-height:1.7">지금 우리 팀 다같이 찍는 시간이에요.<br/>친환경 일상을 툭 찍어봐요!<br/><b style="color:#2ECC71">${VLOG_OPEN_HOUR>12?VLOG_OPEN_HOUR-12:VLOG_OPEN_HOUR}시에 하루 브이로그로 완성돼요</b></div>
      <button onclick="document.getElementById('ovVlogAlarm').remove();window.goPage&&window.goPage('chal')" style="width:100%;margin-top:18px;background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit">📸 지금 찍으러 가기</button>
      <button onclick="document.getElementById('ovVlogAlarm').remove()" style="background:none;border:none;color:#aaa;font-size:12px;margin-top:12px;cursor:pointer;font-family:inherit">나중에</button>
    </div>`;
    document.body.appendChild(ov);
    try{ if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){}
  }

  /* ════════ 부트 ════════ */
  const origGoPage = window.goPage;
  if(typeof origGoPage === 'function'){
    window.goPage = function(name){ origGoPage.apply(this, arguments); if(name === 'company') setTimeout(renderCompanyVlog, 600); };
  }
  setTimeout(()=>{ const p = document.getElementById('page-company'); if(p && p.classList.contains('on')) renderCompanyVlog(); }, 2200);
  setInterval(checkVlogAlarm, 60*1000);
  setTimeout(checkVlogAlarm, 5000);

  // ranking v8 이 1초마다 페이지를 휘저어 브이로그가 사라지면 자리 복구 (없을 때만 재렌더)
  setInterval(()=>{
    const p = document.getElementById('page-company');
    if(!p) return;
    const active = p.classList.contains('on') || p.offsetParent !== null;
    if(active && window.ME && window.UDATA?.companyId && !document.getElementById('companyVlogSection')){
      renderCompanyVlog();
    }
  }, 1500);

  console.log('[company_vlog_patch] 로드됨');
})();
