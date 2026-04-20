// global_co2_patch.js
(function(){
  function getAllAnalogies(kg){
    const items = [
      {icon:'🚗', text:`자동차 ${Math.floor(kg/0.21)}km 덜 달린 효과`},
      {icon:'🌳', text:`소나무 ${(kg/6.6).toFixed(1)}그루 1년 흡수량`},
      {icon:'☕', text:`일회용컵 ${Math.floor(kg/0.332)}개 안 쓴 효과`},
      {icon:'🍔', text:`소고기버거 ${Math.floor(kg/3)}개 안 먹은 효과`},
      {icon:'🚌', text:`버스 ${Math.floor(kg/1.17)}회 이용 효과`},
      {icon:'🌬️', text:`에어컨 ${Math.floor(kg/0.69)}시간 덜 튼 효과`},
      {icon:'🧴', text:`텀블러 ${Math.floor(kg/0.332)}번 사용 효과`},
      {icon:'🥗', text:`채식 ${Math.floor(kg/0.8)}끼 선택 효과`},
      {icon:'🚲', text:`자전거로 ${Math.floor(kg/1.05)}번 이동 효과`},
      {icon:'✈️', text:`국내선 ${(kg/90).toFixed(1)}회 안 탄 효과`},
      {icon:'💧', text:`샤워 5분단축 ${Math.floor(kg/0.38)}회 효과`},
      {icon:'📺', text:`TV ${Math.floor(kg/0.046)}시간 덜 본 효과`},
    ];
    const seed = Math.floor(kg * 10);
    const shuffled = items
      .map((v, i) => ({v, r: ((seed + i * 31) % 97) / 97}))
      .sort((a, b) => a.r - b.r)
      .map(x => x.v);
    return shuffled.filter(x => !x.text.match(/\b0\b/) && !x.text.match(/0\.0/)).slice(0, 4);
  }

  function getMainMessage(kg){
    if(kg < 1)    return {emoji:'🌱', msg:'첫 걸음을 시작했어요'};
    if(kg < 5)    return {emoji:'🌱', msg:'작은 실천이 시작됐어요'};
    if(kg < 10)   return {emoji:'🌿', msg:'새싹이 자라고 있어요'};
    if(kg < 15)   return {emoji:'🌿', msg:'환경 습관이 붙고 있어요'};
    if(kg < 20)   return {emoji:'🌿', msg:'꾸준한 실천 멋져요'};
    if(kg < 25)   return {emoji:'🌳', msg:'나무 한 그루 완성!'};
    if(kg < 30)   return {emoji:'🌳', msg:'환경 실천러가 됐어요'};
    if(kg < 35)   return {emoji:'🌳', msg:'큰 변화가 쌓이고 있어요'};
    if(kg < 40)   return {emoji:'🌳', msg:'지구가 고마워해요'};
    if(kg < 45)   return {emoji:'🌳', msg:'환경 실천이 힘이 됐어요'};
    if(kg < 50)   return {emoji:'🌳', msg:'진정한 지구지킴이예요'};
    if(kg < 55)   return {emoji:'🌲', msg:'작은 숲이 되고 있어요'};
    if(kg < 60)   return {emoji:'🌲', msg:'나무들이 자라고 있어요'};
    if(kg < 65)   return {emoji:'🌲', msg:'숲이 만들어지고 있어요'};
    if(kg < 70)   return {emoji:'🌲', msg:'지역 환경 히어로예요'};
    if(kg < 75)   return {emoji:'🌲', msg:'대단한 기여예요'};
    if(kg < 80)   return {emoji:'🌲', msg:'환경 챔피언이에요'};
    if(kg < 85)   return {emoji:'🌲', msg:'꾸준한 힘을 보여줘요'};
    if(kg < 90)   return {emoji:'🌲', msg:'숲이 짙어지고 있어요'};
    if(kg < 95)   return {emoji:'🌲', msg:'환경 마스터예요'};
    if(kg < 100)  return {emoji:'🌲', msg:'100kg 돌파 임박!'};
    if(kg < 110)  return {emoji:'🏕️', msg:'100kg 돌파! 대단해요'};
    if(kg < 120)  return {emoji:'🏕️', msg:'숲 하나가 자라고 있어요'};
    if(kg < 130)  return {emoji:'🏕️', msg:'환경 수호자가 됐어요'};
    if(kg < 140)  return {emoji:'🏕️', msg:'지구의 친구예요'};
    if(kg < 150)  return {emoji:'🏕️', msg:'지속 가능한 변화예요'};
    if(kg < 160)  return {emoji:'🏕️', msg:'큰 숲이 되고 있어요'};
    if(kg < 170)  return {emoji:'🏕️', msg:'대단한 실천가예요'};
    if(kg < 180)  return {emoji:'🏕️', msg:'환경 리더예요'};
    if(kg < 190)  return {emoji:'🏕️', msg:'지구 살리기 앞장서요'};
    if(kg < 200)  return {emoji:'🏕️', msg:'200kg 돌파 임박!'};
    if(kg < 220)  return {emoji:'🌏', msg:'200kg 돌파! 엄청나요'};
    if(kg < 240)  return {emoji:'🌏', msg:'지구가 웃고 있어요'};
    if(kg < 260)  return {emoji:'🌏', msg:'환경의 영웅이에요'};
    if(kg < 280)  return {emoji:'🌏', msg:'모두의 본보기예요'};
    if(kg < 300)  return {emoji:'🌏', msg:'300kg 돌파 임박!'};
    if(kg < 330)  return {emoji:'🌏', msg:'300kg! 숲을 만들었어요'};
    if(kg < 360)  return {emoji:'🌏', msg:'자연의 동반자예요'};
    if(kg < 390)  return {emoji:'🌏', msg:'지구 수호자 등극!'};
    if(kg < 420)  return {emoji:'🌏', msg:'환경 전설이 되고 있어요'};
    if(kg < 450)  return {emoji:'🌏', msg:'큰 숲의 주인이에요'};
    if(kg < 480)  return {emoji:'🌏', msg:'500kg 돌파 임박!'};
    if(kg < 500)  return {emoji:'🌏', msg:'지구를 지키는 큰 힘이에요'};
    if(kg < 600)  return {emoji:'🌍', msg:'500kg 돌파! 대기록!'};
    if(kg < 800)  return {emoji:'🌍', msg:'지구가 숨 쉬고 있어요'};
    if(kg < 1000) return {emoji:'🌍', msg:'1톤 돌파 임박!'};
    return {emoji:'🌍', msg:'거대한 변화를 만들었어요!'};
  }

  async function updateGlobalCO2(){
    try{
      if(!window.FB?.db){ setTimeout(updateGlobalCO2, 1000); return; }
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      let total = 0;
      snap.forEach(d => { total += Number(d.data().co2 || 0); });
      
      const banner = document.querySelector('.earth-banner');
      if(!banner) return;
      
      const co2Text = total >= 1000 
        ? (total/1000).toFixed(1) + 't' 
        : total.toFixed(1) + 'kg';
      const main = getMainMessage(total);
      const analogies = getAllAnalogies(total);
      
      banner.innerHTML = `
        <div class="eb-title" style="font-size:14px;margin-bottom:8px">🌍 우리가 함께 지킨 지구</div>
        <div style="text-align:center;margin-bottom:10px">
          <div style="font-size:11px;color:rgba(255,255,255,.65);margin-bottom:2px">지금까지 누적 CO₂ 절감량</div>
          <div id="bCo2" style="font-size:40px;font-weight:900;color:var(--g1);line-height:1.1;letter-spacing:-1.5px">${co2Text}</div>
          <div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:4px">${main.emoji} ${main.msg}</div>
        </div>
        ${total >= 0.5 ? `
        <div style="background:rgba(255,255,255,.08);border-radius:10px;padding:10px;margin-top:8px">
          <div style="font-size:10px;color:rgba(255,255,255,.6);margin-bottom:6px;text-align:center;letter-spacing:1px">✨ 이 정도의 효과예요 ✨</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${analogies.map(a => `
              <div style="background:rgba(255,255,255,.1);border-radius:8px;padding:8px 10px;display:flex;align-items:center;gap:8px">
                <span style="font-size:18px;flex-shrink:0">${a.icon}</span>
                <span style="font-size:11px;font-weight:600;color:#fff;line-height:1.3;word-break:keep-all">${a.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      `;
      
      console.log('[global_co2]', total.toFixed(2) + 'kg');
    }catch(e){ console.error('[global_co2]', e); }
  }
  
  window.loadGlobalStats = updateGlobalCO2;
  
  setTimeout(updateGlobalCO2, 300);
  setInterval(updateGlobalCO2, 15000);
})();
