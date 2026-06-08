/* =====================================================
   EcoQuest – 미니홈피 ① 내 캐릭터(아바타)
   - 살아있는 농장(page-map / #bunnyPlayground) 위에 내 아바타를 세움
   - 탭 → 캐릭터 선택. doc4(농장) 데이터는 안 건드림 (users 문서에 따로 저장)
   - 농장이 다시 그려져도 아바타 자동 재삽입
   ★ 모든 farm 패치보다 "뒤"에 로드 (맨 끝)
   ===================================================== */
(function () {
  'use strict';

  const AVATARS = [
    { id:'farmer_m', emoji:'👨‍🌾', name:'농부 아저씨' },
    { id:'farmer_f', emoji:'👩‍🌾', name:'농부 아주머니' },
    { id:'farmer_boy', emoji:'🧑‍🌾', name:'농부 청년' },
    { id:'cat', emoji:'🐱', name:'고양이' },
    { id:'dog', emoji:'🐶', name:'강아지' },
    { id:'bear', emoji:'🐻', name:'곰돌이' },
    { id:'fox', emoji:'🦊', name:'여우' },
    { id:'panda', emoji:'🐼', name:'판다' },
    { id:'pig', emoji:'🐷', name:'돼지' },
    { id:'chick', emoji:'🐥', name:'병아리' },
    { id:'frog', emoji:'🐸', name:'개구리' },
    { id:'koala', emoji:'🐨', name:'코알라' },
  ];

  function curAvatar(){ return window.UDATA && window.UDATA.avatar; }

  window.mhSetAvatar = async function (id) {
    if (!window.ME || !window.UDATA) return;
    window.UDATA.avatar = id;
    try { await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { avatar: id }); }
    catch (e) { console.log('[minihompy] avatar 저장 실패:', e.message); }
    closePicker();
    injectAvatar(true);
    const a = AVATARS.find(x => x.id === id);
    if (window.toast) window.toast(`${a.emoji} ${a.name} 선택!`);
  };

  function closePicker(){ const m = document.getElementById('mhAvatarPicker'); if (m) m.remove(); }

  window.mhOpenAvatarPicker = function () {
    closePicker();
    const cur = curAvatar();
    const m = document.createElement('div');
    m.id = 'mhAvatarPicker';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9000;display:flex;align-items:flex-end;justify-content:center';
    m.onclick = (e) => { if (e.target === m) closePicker(); };
    m.innerHTML = `
      <div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 28px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto">
        <div style="text-align:center;margin-bottom:14px">
          <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 12px"></div>
          <div style="font-size:18px;font-weight:900;color:#1B5E20">🎭 내 캐릭터</div>
          <div style="font-size:12px;color:#888;margin-top:4px">내 농장에 나타날 캐릭터를 골라요</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          ${AVATARS.map(a => {
            const sel = cur === a.id;
            return `<div onclick="mhSetAvatar('${a.id}')" style="aspect-ratio:1;background:${sel ? '#f0fbf4' : '#fff'};border:2px solid ${sel ? '#2ECC71' : '#e5e5e5'};border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:8px">
              <div style="font-size:36px;line-height:1">${a.emoji}</div>
              <div style="font-size:10px;font-weight:700;color:${sel ? '#1B5E20' : '#555'};margin-top:4px;text-align:center;line-height:1.2">${a.name}</div>
              ${sel ? '<div style="font-size:9px;color:#2ECC71;margin-top:2px">✓</div>' : ''}
            </div>`;
          }).join('')}
        </div>
        <button onclick="document.getElementById('mhAvatarPicker').remove()" style="width:100%;background:#f0f0f0;color:#666;border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:14px">닫기</button>
      </div>`;
    document.body.appendChild(m);
  };

  function injectAvatar(force) {
    const pg = document.getElementById('bunnyPlayground');
    if (!pg) return;
    const existing = pg.querySelector('.mh-avatar');
    if (existing && !force) return;
    if (existing) existing.remove();
    const a = AVATARS.find(x => x.id === curAvatar());
    const el = document.createElement('div');
    el.className = 'mh-avatar';
    if (a) {
      el.style.cssText = 'position:absolute;left:50%;bottom:12px;transform:translateX(-50%);font-size:46px;z-index:40;cursor:pointer;filter:drop-shadow(0 3px 5px rgba(0,0,0,.35));line-height:1';
      el.textContent = a.emoji;
      el.title = '탭해서 캐릭터 변경';
    } else {
      el.style.cssText = 'position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:40;cursor:pointer;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;padding:8px 14px;border-radius:12px;white-space:nowrap;animation:mhPulse 1.5s ease-in-out infinite';
      el.textContent = '🎭 내 캐릭터 고르기';
    }
    el.onclick = (e) => { e.stopPropagation(); window.mhOpenAvatarPicker(); };
    pg.appendChild(el);
  }

  if (!document.getElementById('mhAvatarCss')) {
    const s = document.createElement('style');
    s.id = 'mhAvatarCss';
    s.textContent = '@keyframes mhPulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.06)}}';
    document.head.appendChild(s);
  }

  function watch() {
    const mapPage = document.getElementById('page-map');
    if (!mapPage) { setTimeout(watch, 600); return; }
    injectAvatar();
    new MutationObserver(() => injectAvatar()).observe(mapPage, { childList: true, subtree: true });
  }

  console.log('[minihompy_avatar] v1 loaded');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(watch, 1600));
  else setTimeout(watch, 1600);

})();
