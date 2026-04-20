// activity_analogy_patch.js - 내활동 탭 개인 CO2 비유 (실생활 기준)
(function(){
  function getPersonalAnalogy(kg){
    if(kg <= 0)    return {emoji:'🌱', text:'첫 미션을 완료해봐요!', sub:'작은 실천이 지구를 바꿔요 🌍'};
    if(kg < 0.3)   return {emoji:'🌱', text:`CO₂ ${(kg*1000).toFixed(0)}g 절감!`, sub:'첫 걸음을 뗐어요 🌱'};
    if(kg < 0.5)   return {emoji:'🌱', text:`${(kg*1000).toFixed(0)}g 절감!`, sub:`☕ 일회용컵 1개 안 쓴 효과예요`};
    if(kg < 1)     return {emoji:'🌱', text:`${(kg*1000).toFixed(0)}g 절감!`, sub:`📱 스마트폰 ${Math.floor(kg/0.005)}번 충전 안 한 효과예요`};
    if(kg < 1.5)   return {emoji:'🌱', text:`${kg.toFixed(2)}kg 절감!`, sub:`🚌 버스 1회 이용 효과예요`};
    if(kg < 2)     return {emoji:'🌱', text:`${kg.toFixed(1)}kg 절감!`, sub:`☕ 일회용컵 ${Math.floor(kg/0.332)}개 안 쓴 효과예요`};
    if(kg < 2.5)   return {emoji:'🌱', text:`${kg.toFixed(1)}kg 절감! 꾸준해요`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`};
    if(kg < 3)     return {emoji:'🌱', text:`${kg.toFixed(1)}kg 절감!`, sub:`🥗 채식 식단 ${Math.floor(kg/0.8)}끼 선택 효과예요`};
    if(kg < 3.5)   return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 새싹이 나요`, sub:`📺 TV ${Math.floor(kg/0.046)}시간 덜 본 효과예요`};
    if(kg < 4)     return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🍔 소고기 버거 1개 안 먹은 효과예요`};
    if(kg < 4.5)   return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 환경 실천러`, sub:`🧴 텀블러 ${Math.floor(kg/0.332)}번 사용 효과예요`};
    if(kg < 5)     return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`};
    if(kg < 5.5)   return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 습관이 됐어요`, sub:`🚲 자전거로 ${Math.floor(kg/1.05)}번 이동한 효과예요`};
    if(kg < 6)     return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🥗 채식 식단 ${Math.floor(kg/0.8)}끼 선택 효과예요`};
    if(kg < 6.5)   return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 대단해요`, sub:`🌬️ 에어컨 ${Math.floor(kg/0.69)}시간 덜 튼 효과예요`};
    if(kg < 7)     return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🌳 소나무 1그루가 1년간 흡수하는 양이에요`};
    if(kg < 7.5)   return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 진정한 에코러`, sub:`☕ 일회용컵 ${Math.floor(kg/0.332)}개 안 쓴 효과예요`};
    if(kg < 8)     return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🛵 배달앱 일회용품 ${Math.floor(kg/0.3)}번 거절 효과예요`};
    if(kg < 8.5)   return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 환경 고수`, sub:`🚌 버스 ${Math.floor(kg/1.17)}회 이용 효과예요`};
    if(kg < 9)     return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`};
    if(kg < 9.5)   return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 멋져요`, sub:`🧺 세탁기 ${Math.floor(kg/0.23)}번 덜 돌린 효과예요`};
    if(kg < 10)    return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🍔 소고기 버거 ${Math.floor(kg/3)}개 안 먹은 효과예요`};
    if(kg < 11)    return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 두 자릿수 돌파`, sub:`🌳 소나무 ${(kg/6.6).toFixed(1)}그루가 1년간 흡수하는 양이에요`};
    if(kg < 12)    return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`};
    if(kg < 13)    return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 지구가 고마워해요`, sub:`🧴 텀블러 ${Math.floor(kg/0.332)}번 사용 효과예요`};
    if(kg < 14)    return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감!`, sub:`🥗 채식 식단 ${Math.floor(kg/0.8)}끼 선택 효과예요`};
    if(kg < 15)    return {emoji:'🌿', text:`${kg.toFixed(1)}kg 절감! 대단해요`, sub:`🌳 소나무 ${(kg/6.6).toFixed(1)}그루가 1년간 흡수하는 양이에요`};
    if(kg < 17)    return {emoji:'🌳', text:`${kg.toFixed(1)}kg 절감! 나무가 눈앞`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`};
    if(kg < 19)    return {emoji:'🌳', text:`${kg.toFixed(1)}kg 절감!`, sub:`🌬️ 에어컨 ${Math.floor(kg/0.69)}시간 덜 튼 효과예요`};
    if(kg < 21)    return {emoji:'🌳', text:`${kg.toFixed(1)}kg 절감! 곧 나무 완성`, sub:`☕ 일회용컵 ${Math.floor(kg/0.332)}개 안 쓴 효과예요`};
    if(kg < 23)    return {emoji:'🌳', text:`나무 1그루 완성! 🎉`, sub:`🌳 소나무 1그루가 평생 흡수하는 양이에요`};
    if(kg < 26)    return {emoji:'🌳', text:`나무 ${(kg/21.4).toFixed(1)}그루 살렸어요`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`};
    if(kg < 30)    return {emoji:'🌳', text:`나무 ${(kg/21.4).toFixed(1)}그루! 대단`, sub:`🥗 채식 식단 ${Math.floor(kg/0.8)}끼 선택 효과예요`};
    if(kg < 35)    return {emoji:'🌳', text:`${kg.toFixed(0)}kg 절감! 환경 마스터`, sub:`🍔 소고기 버거 ${Math.floor(kg/3)}개 안 먹은 효과예요`};
    if(kg < 40)    return {emoji:'🌳', text:`나무 ${(kg/21.4).toFixed(1)}그루!`, sub:`🚌 버스 ${Math.floor(kg/1.17)}회 이용 효과예요`};
    if(kg < 45)    return {emoji:'🌳', text:`${kg.toFixed(0)}kg 절감! 에코 챔피언`, sub:`🧺 건조기 ${Math.floor(kg/1.15)}번 덜 돌린 효과예요`};
    if(kg < 50)    return {emoji:'🌳', text:`나무 ${(kg/21.4).toFixed(1)}그루!`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요 (서울-수원 왕복)`};
    if(kg < 60)    return {emoji:'🌲', text:`${kg.toFixed(0)}kg! 작은 숲 시작`, sub:`🌳 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`};
    if(kg < 70)    return {emoji:'🌲', text:`나무 ${(kg/21.4).toFixed(0)}그루!`, sub:`🌬️ 에어컨 ${Math.floor(kg/0.69)}시간 덜 튼 효과예요`};
    if(kg < 80)    return {emoji:'🌲', text:`${kg.toFixed(0)}kg 절감! 숲이 자라요`, sub:`🚗 자동차로 ${Math.floor(kg/0.21)}km 덜 달린 효과예요`};
    if(kg < 90)    return {emoji:'🌲', text:`나무 ${(kg/21.4).toFixed(0)}그루!`, sub:`🏠 4인 가구 한 달 전기 사용량 수준이에요`};
    if(kg < 100)   return {emoji:'🌲', text:`${kg.toFixed(0)}kg! 환경 챔피언`, sub:`✈️ 국내선 비행 ${(kg/90).toFixed(1)}회 안 탄 효과예요`};
    if(kg < 120)   return {emoji:'🌲', text:`${kg.toFixed(0)}kg! 지역 히어로`, sub:`🌳 소나무 ${Math.floor(kg/6.6)}그루가 1년간 흡수하는 양이에요`};
    if(kg < 150)   return {emoji:'🌲', text:`나무 ${Math.floor(kg/21.4)}그루!`, sub:`🚙 서울-부산 ${Math.floor(kg/84)}회 왕복 안 한 효과예요`};
    if(kg < 200)   return {emoji:'🌲', text:`${kg.toFixed(0)}kg! 대단한 숲`, sub:`🏠 4인 가구 두 달 전기 사용량이에요`};
    if(kg < 300)   return {emoji:'🏕️', text:`나무 ${Math.floor(kg/21.4)}그루! 숲의 주인`, sub:`✈️ 국내선 비행 ${Math.floor(kg/90)}회 안 탄 효과예요`};
    if(kg < 500)   return {emoji:'🏕️', text:`${kg.toFixed(0)}kg! 숲을 만들었어요`, sub:`🌲 작은 숲이 한 달간 흡수하는 양이에요`};
    return {emoji:'🏕️', text:`${kg.toFixed(0)}kg! 지구 수호자`, sub:`🌍 당신 덕분에 지구가 숨 쉬어요 (나무 ${Math.floor(kg/21.4)}그루 분량)`};
  }

  function patchActivity(){
    const d = window.UDATA || {};
    const co2 = d.co2 || 0;
    const a = getPersonalAnalogy(co2);
    const emojiEl = document.getElementById('analogyEmoji');
    const textEl = document.getElementById('analogyText');
    const subEl = document.getElementById('analogySub');
    if(emojiEl) emojiEl.textContent = a.emoji;
    if(textEl) textEl.textContent = a.text;
    if(subEl) subEl.textContent = a.sub;
  }

  const origRender = window.renderActivity;
  if(typeof origRender === 'function'){
    window.renderActivity = function(){
      origRender.apply(this, arguments);
      setTimeout(patchActivity, 10);
    };
  }
  
  const origGoPage = window.goPage;
  if(typeof origGoPage === 'function'){
    window.goPage = function(name){
      origGoPage.apply(this, arguments);
      if(name === 'activity') setTimeout(patchActivity, 50);
    };
  }
})();
