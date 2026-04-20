// global_co2_patch.js
(function(){
  function getAnalogy(kg){
    if(kg < 1)   return '🌱 작은 실천이 쌓여 지구가 숨쉬어요';
    if(kg < 5)   return `☕ 일회용컵 ${Math.floor(kg/0.332)}개 안 쓴 효과예요`;
    if(kg < 10)  return `🌿 소나무 1그루가 반년간 흡수하는 양이에요`;
    if(kg < 15)  return `🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`;
    if(kg < 20)  return `🌳 소나무 ${(kg/6.6).toFixed(1)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 25)  return `💡 가정 전기 ${Math.floor(kg/0.46)}kWh 절약 효과예요 (약 4일치)`;
    if(kg < 30)  return `🍔 소고기 버거 ${Math.floor(kg/3)}개 안 먹은 효과예요`;
    if(kg < 35)  return `🚌 서울-인천 버스 ${Math.floor(kg/1.17)}회 이용 효과예요`;
    if(kg < 40)  return `🌳 소나무 ${(kg/6.6).toFixed(1)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 45)  return `🛵 배달앱 일회용품 ${Math.floor(kg/0.3)}번 거절 효과예요`;
    if(kg < 50)  return `🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요 (서울-수원 왕복)`;
    if(kg < 55)  return `🥗 채식 식단 ${Math.floor(kg/0.8)}끼 선택 효과예요`;
    if(kg < 60)  return `💧 샤워 5분 단축 ${Math.floor(kg/0.38)}회 효과예요`;
    if(kg < 65)  return `🌳 소나무 ${(kg/6.6).toFixed(1)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 70)  return `🧴 텀블러 ${Math.floor(kg/0.332)}번 사용 효과예요`;
    if(kg < 75)  return `🚲 자전거로 ${Math.floor(kg/1.05)}번 이동한 효과예요`;
    if(kg < 80)  return `🏠 가정 한 달 전기요금치 탄소를 줄였어요`;
    if(kg < 85)  return `🌲 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 90)  return `🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요 (서울-대전 편도)`;
    if(kg < 95)  return `♻️ 분리수거 ${Math.floor(kg/0.21)}회 실천 효과예요`;
    if(kg < 100) return `🌳 나무 ${(kg/21.4).toFixed(1)}그루가 평생 흡수하는 양이에요`;
    if(kg < 110) return `🌲 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 120) return `✈️ 국내선 비행 ${(kg/90).toFixed(1)}회 안 탄 효과예요`;
    if(kg < 130) return `🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요 (서울-강릉 왕복)`;
    if(kg < 140) return `🌳 나무 ${(kg/21.4).toFixed(1)}그루가 평생 흡수하는 양이에요`;
    if(kg < 150) return `🌲 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 160) return `🏭 소규모 사업장 하루치 배출량을 줄였어요`;
    if(kg < 170) return `🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`;
    if(kg < 180) return `🌳 나무 ${(kg/21.4).toFixed(1)}그루가 평생 흡수하는 양이에요`;
    if(kg < 190) return `🍽️ 한국인 1명 한 달치 식생활 탄소를 줄였어요`;
    if(kg < 200) return `🌲 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 220) return `🚙 서울-부산 ${Math.floor(kg/84)}회 왕복 안 한 효과예요`;
    if(kg < 240) return `🌳 나무 ${(kg/21.4).toFixed(1)}그루가 평생 흡수하는 양이에요`;
    if(kg < 260) return `🏠 한국 가구 한 달 평균 전기 배출량 만큼 줄였어요`;
    if(kg < 280) return `✈️ 국내선 비행 ${Math.floor(kg/90)}회 안 탄 효과예요`;
    if(kg < 300) return `🌲 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 320) return `🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`;
    if(kg < 340) return `🌳 나무 ${(kg/21.4).toFixed(1)}그루가 평생 흡수하는 양이에요`;
    if(kg < 360) return `🏭 소규모 공장 하루 배출량을 줄였어요`;
    if(kg < 380) return `🌲 작은 숲이 일주일간 흡수하는 양이에요`;
    if(kg < 400) return `🚙 서울-부산 ${Math.floor(kg/84)}회 왕복 안 한 효과예요`;
    if(kg < 420) return `🌳 나무 ${(kg/21.4).toFixed(1)}그루가 평생 흡수하는 양이에요`;
    if(kg < 440) return `🏘️ 10가구 한 달 전기 배출량 만큼 줄였어요`;
    if(kg < 460) return `✈️ 국내선 비행 ${Math.floor(kg/90)}회 안 탄 효과예요`;
    if(kg < 480) return `🌲 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`;
    if(kg < 500) return `🌳 나무 ${Math.floor(kg/21.4)}그루가 평생 흡수하는 양이에요`;
    return `🌍 지구를 지키는 큰 숲을 만들고 있어요! (${(kg/21.4).toFixed(0)}그루 분량)`;
  }

  async function updateGlobalCO2(){
    try{
      if(!window.FB?.db){ setTimeout(updateGlobalCO2, 1000); return; }
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      let total = 0;
      snap.forEach(d => { total += Number(d.data().co2 || 0); });
      
      const el = document.getElementById('bCo2');
      if(el){
        el.textContent = total >= 1000 
          ? (total/1000).toFixed(1) + 't' 
          : total.toFixed(1) + 'kg';
      }
      
      const banner = document.querySelector('.earth-banner');
      if(banner){
        const subEl = banner.querySelector('div[style*="margin-top:6px"]');
        if(subEl) subEl.textContent = getAnalogy(total);
      }
      
      console.log('[global_co2]', total.toFixed(2) + 'kg');
    }catch(e){ console.error('[global_co2]', e); }
  }
  
  window.loadGlobalStats = updateGlobalCO2;
  
  setTimeout(updateGlobalCO2, 300);
  setInterval(updateGlobalCO2, 15000);
})();
