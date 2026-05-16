// bunny_adopt_fix_patch.js v1
// 새 농부 입양 자체 구현 - bunny_patch의 _myBunny 의존 X (Firebase 직접)
(function(){
  'use strict';

  const PALETTES = [
    {body:'#FFFFFF', stroke:'#8B6F47', ear:'#FFB6C1', label:'하양'},
    {body:'#F5E6D3', stroke:'#7D5E47', ear:'#7D5E47', label:'갈얼룩'},
    {body:'#E8E8E8', stroke:'#6B6B6B', ear:'#A9A9A9', label:'회색'},
    {body:'#F5DEB3', stroke:'#7D5E47', ear:'#C8A878', label:'베이지'},
    {body:'#A0826D', stroke:'#5C3A1E', ear:'#5C3A1E', label:'갈색'},
  ];

  let _selColor = 0;

  /* ===== 입양 메인 함수 (덮어쓰기) ===== */
  window.openAdoptFarmer = async function(){
    document.getElementById('ovInteraction')?.remove();

    if(!window.ME?.uid){ window.toast?.('로그인이 필요해요'); return; }

    // Firebase에서 최신 데이터
    try {
      const ref = window.FB.doc(window.FB.db, 'bunnies', window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      if(!snap.exists()){
        window.toast?.('토끼 데이터를 못 찾았어요. 들판에 한번 들어가주세요.');
        return;
      }
      const data = snap.data();
      const happiness = data.happiness || 0;

      if(happiness < 100){
        window.toast?.(`😊 행복도 ${happiness}/100 — ${100-happiness} 더 채워야 입양 가능!`);
        return;
      }

      // 행복도 충분 → 모달 띄우기
      showAdoptModal(data);
    } catch(e){
      console.error('[adopt]', e);
      window.toast?.('입양 시스템 오류: '+e.message);
    }
  };

  /* ===== 입양 모달 ===== */
  function showAdoptModal(currentData){
    _selColor = 0;
    const old = document.getElementById('ovAdoptFarmer'); if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovAdoptFarmer';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9700;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

    const curCount = (currentData.bunnies || []).length;

    modal.innerHTML = `
      <div style="background:#fff;border-radius:22px;max-width:400px;width:100%;padding:24px 20px;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:54px">🐰</div>
          <div style="font-size:18px;font-weight:900;color:#1B5E20;margin-top:6px">새 농부 데려오기</div>
          <div style="font-size:11px;color:#888;margin-top:6px">현재 ${curCount}마리 · 우리 가족이 될 토끼를 골라요!</div>
        </div>

        <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#555">🎨 색깔 선택</div>
        <div id="adoptColorOpts" style="display:flex;gap:5px;margin-bottom:18px">
          ${PALETTES.map((p, i) => `
            <button onclick="window._selAdoptColor(${i})" data-idx="${i}" style="flex:1;background:${i===0?'#f0fbf4':'#fff'};border:${i===0?'2.5px solid #2ECC71':'1.5px solid #ddd'};border-radius:12px;padding:10px 2px;cursor:pointer;font-family:inherit;text-align:center;transition:all .15s">
              <div style="width:32px;height:32px;border-radius:50%;background:${p.body};border:1.5px solid ${p.stroke};margin:0 auto"></div>
              <div style="font-size:9px;color:#666;margin-top:4px;font-weight:700">${p.label}</div>
            </button>
          `).join('')}
        </div>

        <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#555">✏️ 이름 짓기</div>
        <input id="newFarmerName" placeholder="예: 꼬미, 토토, 보리, 마루..." maxlength="6" style="width:100%;border:1.5px solid #ddd;border-radius:12px;padding:13px;font-size:15px;font-weight:700;text-align:center;font-family:inherit;outline:none;color:#5D4037"/>
        <div style="font-size:10px;color:#aaa;text-align:center;margin-top:6px">최대 6글자 (안 적으면 "토끼${curCount+1}")</div>

        <div style="display:flex;gap:8px;margin-top:18px">
          <button onclick="document.getElementById('ovAdoptFarmer').remove()" style="flex:1;background:#f0f0f0;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#666">취소</button>
          <button onclick="window._confirmAdoptFarmer()" style="flex:2;background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(196,69,105,.4)">🎉 입양하기!</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
      const inp = document.getElementById('newFarmerName');
      if(inp){
        inp.focus();
        inp.onkeydown = (e) => { if(e.key === 'Enter') window._confirmAdoptFarmer(); };
      }
    }, 100);
  }

  /* ===== 색깔 선택 ===== */
  window._selAdoptColor = function(idx){
    _selColor = idx;
    document.querySelectorAll('#adoptColorOpts button').forEach(b => {
      const i = parseInt(b.dataset.idx);
      b.style.background = i === idx ? '#f0fbf4' : '#fff';
      b.style.border = i === idx ? '2.5px solid #2ECC71' : '1.5px solid #ddd';
    });
  };

  /* ===== 입양 확정 ===== */
  window._confirmAdoptFarmer = async function(){
    if(!window.ME?.uid) return;

    const btn = event?.target;
    if(btn){ btn.disabled = true; btn.textContent = '저장 중...'; }

    try {
      const ref = window.FB.doc(window.FB.db, 'bunnies', window.ME.uid);
      const snap = await window.FB.getDoc(ref);
      if(!snap.exists()){
        window.toast?.('데이터 오류');
        return;
      }
      const data = snap.data();

      // 다시 한번 행복도 체크
      if((data.happiness || 0) < 100){
        document.getElementById('ovAdoptFarmer')?.remove();
        window.toast?.('행복도가 부족해요!');
        return;
      }

      if(!data.bunnies) data.bunnies = [];

      // 이름 처리
      const inp = document.getElementById('newFarmerName');
      let name = inp?.value?.trim() || '';
      if(!name) name = `토끼${data.bunnies.length + 1}`;
      if(name.length > 6) name = name.substring(0, 6);

      // 새 토끼 추가
      data.bunnies.push({
        name,
        color: _selColor,
        hat: '👒', // 농부 모자 기본
      });
      data.happiness = 0; // 행복도 리셋

      // Firebase 저장
      await window.FB.setDoc(ref, data);

      document.getElementById('ovAdoptFarmer')?.remove();
      window.toast?.(`🎉 "${name}" 우리 가족이 됐어요! 화면 새로고침 중...`);

      // 1.5초 뒤 새로고침 (bunny_patch가 새 토끼 인식하도록)
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch(e){
      console.error('[adopt confirm]', e);
      window.toast?.('입양 실패: '+e.message);
      if(btn){ btn.disabled = false; btn.textContent = '🎉 입양하기!'; }
    }
  };

  console.log('%c[bunny_adopt_fix v1] 🐰+ 입양 자체구현 활성화','color:#fff;background:#C44569;padding:4px 8px;border-radius:4px;font-weight:bold');
})();
