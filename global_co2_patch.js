// global_co2_patch.js
(function(){
  function getAnalogy(kg){
    if(kg < 1)   return {icon:'🌱', main:'첫 걸음', sub:'작은 실천이 지구를 바꿔요'};
    if(kg < 5)   return {icon:'☕', main:`일회용컵 ${Math.floor(kg/0.332)}개`, sub:'안 쓴 효과예요'};
    if(kg < 10)  return {icon:'🌿', main:'소나무 반 그루', sub:'1년간 흡수하는 양이에요'};
    if(kg < 15)  return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'덜 달린 효과예요'};
    if(kg < 20)  return {icon:'🌳', main:`소나무 ${(kg/6.6).toFixed(1)}그루`, sub:'1년간 흡수하는 양'};
    if(kg < 25)  return {icon:'🌬️', main:`에어컨 ${Math.floor(kg/0.69)}시간`, sub:'덜 튼 효과예요'};
    if(kg < 30)  return {icon:'🍔', main:`소고기버거 ${Math.floor(kg/3)}개`, sub:'안 먹은 효과'};
    if(kg < 35)  return {icon:'🚌', main:`버스 ${Math.floor(kg/1.17)}회`, sub:'이용한 효과'};
    if(kg < 40)  return {icon:'🌳', main:`소나무 ${(kg/6.6).toFixed(1)}그루`, sub:'1년간 흡수량'};
    if(kg < 45)  return {icon:'🛵', main:`배달 일회용품 ${Math.floor(kg/0.3)}번`, sub:'거절 효과예요'};
    if(kg < 50)  return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'서울-수원 왕복!'};
    if(kg < 55)  return {icon:'🥗', main:`채식 ${Math.floor(kg/0.8)}끼`, sub:'선택한 효과'};
    if(kg < 60)  return {icon:'💧', main:`샤워 5분단축 ${Math.floor(kg/0.38)}회`, sub:'물 절약!'};
    if(kg < 65)  return {icon:'🌳', main:`소나무 ${(kg/6.6).toFixed(1)}그루`, sub:'1년간 흡수량'};
    if(kg < 70)  return {icon:'🧴', main:`텀블러 ${Math.floor(kg/0.332)}번`, sub:'사용한 효과'};
    if(kg < 75)  return {icon:'🚲', main:`자전거 ${Math.floor(kg/1.05)}번`, sub:'이동 효과'};
    if(kg < 80)  return {icon:'🏠', main:'가정 한 달 전기', sub:'배출량 절감!'};
    if(kg < 85)  return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 90)  return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'서울-대전 편도'};
    if(kg < 95)  return {icon:'♻️', main:`분리수거 ${Math.floor(kg/0.21)}회`, sub:'실천 효과'};
    if(kg < 100) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 105) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수량'};
    if(kg < 110) return {icon:'🍔', main:`소고기버거 ${Math.floor(kg/3)}개`, sub:'안 먹은 효과'};
    if(kg < 115) return {icon:'🧺', main:`건조기 ${Math.floor(kg/1.15)}번`, sub:'덜 돌린 효과'};
    if(kg < 120) return {icon:'✈️', main:`국내선 ${(kg/90).toFixed(1)}회`, sub:'안 탄 효과'};
    if(kg < 125) return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'서울-부산 편도급'};
    if(kg < 130) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 135) return {icon:'🌬️', main:`에어컨 ${Math.floor(kg/0.69)}시간`, sub:'덜 튼 효과'};
    if(kg < 140) return {icon:'🥗', main:`채식 ${Math.floor(kg/0.8)}끼`, sub:'선택한 효과'};
    if(kg < 145) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 150) return {icon:'🚌', main:`버스 ${Math.floor(kg/1.17)}회`, sub:'이용한 효과'};
    if(kg < 155) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 160) return {icon:'☕', main:`일회용컵 ${Math.floor(kg/0.332)}개`, sub:'안 쓴 효과'};
    if(kg < 165) return {icon:'🏭', main:'소규모 공장', sub:'하루 배출량!'};
    if(kg < 170) return {icon:'🧴', main:`텀블러 ${Math.floor(kg/0.332)}번`, sub:'사용한 효과'};
    if(kg < 175) return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'덜 달린 효과'};
    if(kg < 180) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 185) return {icon:'🍽️', main:'1인 한 달', sub:'식생활 탄소!'};
    if(kg < 190) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 195) return {icon:'🚲', main:`자전거 ${Math.floor(kg/1.05)}번`, sub:'이동 효과'};
    if(kg < 200) return {icon:'✈️', main:`국내선 ${(kg/90).toFixed(1)}회`, sub:'안 탄 효과'};
    if(kg < 205) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수량'};
    if(kg < 210) return {icon:'🚙', main:`서울-부산 ${Math.floor(kg/84)}회`, sub:'왕복 안 한 효과'};
    if(kg < 215) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 220) return {icon:'💡', main:'가정 2달 전기', sub:'배출량 절감'};
    if(kg < 225) return {icon:'🍔', main:`소고기버거 ${Math.floor(kg/3)}개`, sub:'안 먹은 효과'};
    if(kg < 230) return {icon:'🌬️', main:`에어컨 ${Math.floor(kg/0.69)}시간`, sub:'덜 튼 효과'};
    if(kg < 235) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 240) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 245) return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'덜 달린 효과'};
    if(kg < 250) return {icon:'🏠', main:'한 가구 한 달', sub:'평균 배출량!'};
    if(kg < 255) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 260) return {icon:'🚌', main:`버스 ${Math.floor(kg/1.17)}회`, sub:'이용한 효과'};
    if(kg < 265) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 270) return {icon:'✈️', main:`국내선 ${(kg/90).toFixed(1)}회`, sub:'안 탄 효과'};
    if(kg < 275) return {icon:'🥗', main:`채식 ${Math.floor(kg/0.8)}끼`, sub:'선택한 효과'};
    if(kg < 280) return {icon:'🧴', main:`텀블러 ${Math.floor(kg/0.332)}번`, sub:'사용한 효과'};
    if(kg < 285) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 290) return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'덜 달린 효과'};
    if(kg < 295) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 300) return {icon:'🏭', main:'공장 이틀치', sub:'탄소 배출량!'};
    if(kg < 305) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 310) return {icon:'🍔', main:`소고기버거 ${Math.floor(kg/3)}개`, sub:'안 먹은 효과'};
    if(kg < 315) return {icon:'🚙', main:`서울-부산 ${Math.floor(kg/84)}회`, sub:'왕복 안 한 효과'};
    if(kg < 320) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 325) return {icon:'🧺', main:`건조기 ${Math.floor(kg/1.15)}번`, sub:'덜 돌린 효과'};
    if(kg < 330) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 335) return {icon:'🚲', main:`자전거 ${Math.floor(kg/1.05)}번`, sub:'이동 효과'};
    if(kg < 340) return {icon:'✈️', main:`국내선 ${Math.floor(kg/90)}회`, sub:'안 탄 효과'};
    if(kg < 345) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 350) return {icon:'🏠', main:'4인 가구 한 달', sub:'평균 배출량!'};
    if(kg < 355) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 360) return {icon:'☕', main:`일회용컵 ${Math.floor(kg/0.332)}개`, sub:'안 쓴 효과'};
    if(kg < 365) return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'덜 달린 효과'};
    if(kg < 370) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 375) return {icon:'🌬️', main:`에어컨 ${Math.floor(kg/0.69)}시간`, sub:'덜 튼 효과'};
    if(kg < 380) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 385) return {icon:'🥗', main:`채식 ${Math.floor(kg/0.8)}끼`, sub:'선택한 효과'};
    if(kg < 390) return {icon:'🍔', main:`소고기버거 ${Math.floor(kg/3)}개`, sub:'안 먹은 효과'};
    if(kg < 395) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 400) return {icon:'🌲', main:'작은 숲', sub:'일주일 흡수량!'};
    if(kg < 405) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 410) return {icon:'🚙', main:`서울-부산 ${Math.floor(kg/84)}회`, sub:'왕복 안 한 효과'};
    if(kg < 415) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 420) return {icon:'✈️', main:`국내선 ${Math.floor(kg/90)}회`, sub:'안 탄 효과'};
    if(kg < 425) return {icon:'🧴', main:`텀블러 ${Math.floor(kg/0.332)}번`, sub:'사용한 효과'};
    if(kg < 430) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 435) return {icon:'🚌', main:`버스 ${Math.floor(kg/1.17)}회`, sub:'이용한 효과'};
    if(kg < 440) return {icon:'🏘️', main:'10가구 한 달', sub:'전기 배출량!'};
    if(kg < 445) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 450) return {icon:'🚗', main:`자동차 ${Math.floor(kg/0.21)}km`, sub:'덜 달린 효과'};
    if(kg < 455) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 460) return {icon:'🍔', main:`소고기버거 ${Math.floor(kg/3)}개`, sub:'안 먹은 효과'};
    if(kg < 465) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 470) return {icon:'✈️', main:`국내선 ${Math.floor(kg/90)}회`, sub:'안 탄 효과'};
    if(kg < 475) return {icon:'🌬️', main:`에어컨 ${Math.floor(kg/0.69)}시간`, sub:'덜 튼 효과'};
    if(kg < 480) return {icon:'🌲', main:`소나무 ${Math.floor(kg/6.6)}그루`, sub:'1년간 흡수'};
    if(kg < 485) return {icon:'🥗', main:`채식 ${Math.floor(kg/0.8)}끼`, sub:'선택한 효과'};
    if(kg < 490) return {icon:'🌳', main:`나무 ${(kg/21.4).toFixed(1)}그루`, sub:'평생 흡수량'};
    if(kg < 495) return {icon:'🏕️', main:'숲 하나 완성!', sub:'대단한 기여예요'};
    if(kg < 500) return {icon:'🌳', main:`나무 ${Math.floor(kg/21.4)}그루`, sub:'평생 흡수량!`};
    return {icon:'🌍', main:'거대한 숲!', sub:`나무 ${Math.floor(kg/21.4)}그루 분량`};
  }

  async function updateGlobalCO2(){
    try{
      if(!window.FB?.db){ setTimeout(updateGlobalCO2, 1000); return; }
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      let total = 0;
      snap.forEach(d => { total += Number(d.data().co2 || 0); });
      
      const banner = document.querySelector('.earth-banner');
      if(banner && !banner.dataset.patched){
        const analogy = getAnalogy(total);
        const co2Text = total >= 1000 
          ? (total/1000).toFixed(1) + 't' 
          : total.toFixed(1) + 'kg';
        
        banner.innerHTML = `
          <div class="eb-title" style="font-size:13px;margin-bottom:10px">🌍 우리가 함께 지킨 지구</div>
          <div style="display:flex;align-items:center;gap:14px">
            <div style="flex:0 0 auto;text-align:center;min-width:100px">
              <div style="font-size:10px;color:rgba(255,255,255,.6);margin-bottom:2px">누적 CO₂ 절감</div>
              <div id="bCo2" style="font-size:28px;font-weight:900;color:var(--g1);line-height:1.1;letter-spacing:-1px">${co2Text}</div>
            </div>
            <div style="flex:1;border-left:1px solid rgba(255,255,255,.2);padding-left:14px;min-width:0">
              <div style="font-size:28px;line-height:1;margin-bottom:4px" id="bIcon">${analogy.icon}</div>
              <div id="bMain" style="font-size:15px;font-weight:900;color:#fff;line-height:1.3;word-break:keep-all">${analogy.main}</div>
              <div id="bSub" style="font-size:11px;color:rgba(255,255,255,.7);margin-top:2px;word-break:keep-all">${analogy.sub}</div>
            </div>
          </div>
        `;
        banner.dataset.patched = '1';
      }else if(banner){
        const analogy = getAnalogy(total);
        const co2Text = total >= 1000 
          ? (total/1000).toFixed(1) + 't' 
          : total.toFixed(1) + 'kg';
        const c = document.getElementById('bCo2');
        const i = document.getElementById('bIcon');
        const m = document.getElementById('bMain');
        const s = document.getElementById('bSub');
        if(c) c.textContent = co2Text;
        if(i) i.textContent = analogy.icon;
        if(m) m.textContent = analogy.main;
        if(s) s.textContent = analogy.sub;
      }
      
      console.log('[global_co2]', total.toFixed(2) + 'kg');
    }catch(e){ console.error('[global_co2]', e); }
  }
  
  window.loadGlobalStats = updateGlobalCO2;
  
  setTimeout(updateGlobalCO2, 300);
  setInterval(updateGlobalCO2, 15000);
})();
