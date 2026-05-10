(function(){

  const SHOP_ITEMS = [
    {id:'carrot',  emoji:'🥕', name:'당근',          price:10,  carrots:1,  happiness:0,  desc:'기본 먹이'},
    {id:'grass',   emoji:'🌾', name:'풀 한 다발',    price:30,  carrots:1,  happiness:10, desc:'먹이 + 행복'},
    {id:'cabbage', emoji:'🥬', name:'양배추',        price:50,  carrots:2,  happiness:15, desc:'영양 만점'},
    {id:'apple',   emoji:'🍎', name:'사과',          price:80,  carrots:3,  happiness:25, desc:'달콤한 간식'},
    {id:'vitamin', emoji:'💊', name:'비타민',        price:150, carrots:5,  happiness:50, desc:'기운 충전!'},
    {id:'love',    emoji:'💕', name:'사랑의 영양제', price:300, carrots:10, happiness:100, desc:'행복 풀 충전 ✨'},
  ];

  function getMyData(){ return window.UDATA || {}; }
  function getMyBunny(){
    return new Promise(async (resolve) => {
      if(!window.ME || !window.FB) { resolve(null); return; }
      try {
        const ref = window.FB.doc(window.FB.db, "bunnies", window.ME.uid);
        const snap = await window.FB.getDoc(ref);
        if(snap.exists()) resolve({ref, data: snap.data()});
        else resolve(null);
      } catch(e){ resolve(null); }
    });
  }

  function initShopBtn(){
    const tryAdd = () => {
      const playground = document.getElementById('bunnyPlayground');
      if(!playground) return false;
      if(document.getElementById('bunnyShopBtn')) return true;
      const btn = document.createElement('button');
      btn.id = 'bunnyShopBtn';
      btn.onclick = openBunnyShop;
      btn.style.cssText = `
        position:absolute;bottom:8px;right:8px;
        background:linear-gradient(135deg,#FF6B9D,#C44569);
        color:#fff;border:none;border-radius:18px;
        padding:8px 14px;font-size:12px;font-weight:900;
        cursor:pointer;font-family:inherit;
        box-shadow:0 4px 12px rgba(196,69,105,.4);
        z-index:30;display:flex;align-items:center;gap:5px
      `;
      btn.innerHTML = '🛒 토끼 상점';
      playground.appendChild(btn);
      return true;
    };
    if(!tryAdd()) setTimeout(initShopBtn, 1000);
  }

  window.openBunnyShop = async function(){
    if(!window.ME){ window.toast("로그인이 필요해요!"); return; }
    const myPoints = getMyData().point || 0;
    const old = document.getElementById('ovBunnyShop');
    if(old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'ovBunnyShop';
    modal.className = 'overlay on';
    modal.innerHTML = `
      <div class="modal" style="padding:0;overflow:hidden">
        <div style="background:linear-gradient(135deg,#FF6B9D,#C44569);padding:20px 18px 16px;color:#fff;position:relative">
          <button onclick="document.getElementById('ovBunnyShop').remove()" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,.25);border:none;border-radius:50%;width:30px;height:30px;font-size:14px;cursor:pointer;color:#fff">✕</button>
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.7)">🛒 BUNNY SHOP</div>
          <div style="font-size:18px;font-weight:900;margin-top:4px">토끼 용품 상점</div>
          <div style="font-size:11px;color:rgba(255,255,255,.85);margin-top:4px">먹이 + 영양제로 토끼 가족을 행복하게!</div>
          <div style="background:rgba(255,255,255,.2);border-radius:12px;padding:8px 12px;margin-top:12px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;font-weight:600">내 베리</span>
            <span style="font-size:18px;font-weight:900" id="shopMyBerry">${myPoints.toLocaleString()}🍓</span>
          </div>
        </div>
        <div style="padding:14px 16px 20px;max-height:60vh;overflow-y:auto" id="shopItemList">
          ${renderShopItems(myPoints)}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  function renderShopItems(myPoints){
    return SHOP_ITEMS.map(item => {
      const can = myPoints >= item.price;
      return `
        <div style="background:#fff;border:1.5px solid ${can ? '#FFE082' : '#eee'};border-radius:14px;padding:12px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
          <div style="font-size:36px;line-height:1;flex-shrink:0">${item.emoji}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:900;color:#5D4037">${item.name}</div>
            <div style="font-size:11px;color:#888;margin-top:2px">${item.desc}</div>
            <div style="font-size:10px;color:#27AE60;margin-top:4px;font-weight:700">
              🥕 +${item.carrots} · 😊 +${item.happiness}
            </div>
          </div>
          <button onclick="buyShopItem('${item.id}')" ${can ? '' : 'disabled'} style="background:${can ? 'linear-gradient(135deg,#2ECC71,#27AE60)' : '#f0f0f0'};color:${can ? '#fff' : '#aaa'};border:none;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:900;cursor:${can ? 'pointer' : 'default'};font-family:inherit;flex-shrink:0;min-width:64px">
            ${item.price}🍓
          </button>
        </div>
      `;
    }).join('');
  }

  window.buyShopItem = async function(itemId){
    const item = SHOP_ITEMS.find(x => x.id === itemId);
    if(!item) return;
    const myPoints = getMyData().point || 0;
    if(myPoints < item.price){ window.toast("베리가 부족해요!"); return; }
    if(!window.ME){ window.toast("로그인이 필요해요!"); return; }

    try {
      // 포인트 차감
      const newP = myPoints - item.price;
      await window.FB.updateDoc(window.FB.doc(window.FB.db, "users", window.ME.uid), {point: newP});
      window.UDATA.point = newP;
      if(window.updateUI) window.updateUI();

      // 토끼 데이터 업데이트
      const bunnyResult = await getMyBunny();
      if(bunnyResult){
        const {ref, data} = bunnyResult;
        const newCarrots = (data.carrots || 0) + item.carrots;
        const newHappiness = Math.min(100, (data.happiness || 0) + item.happiness);
        await window.FB.setDoc(ref, {...data, carrots: newCarrots, happiness: newHappiness});
        // 메모리 업데이트 (bunny_patch의 _myBunny는 closure 안이라 직접 못 건드림)
        // → loadBunny 다시 호출 트리거
        if(typeof window.drawMap === 'function') window.drawMap();
      }

      // 모달 새로고침
      const list = document.getElementById('shopItemList');
      const berry = document.getElementById('shopMyBerry');
      if(list) list.innerHTML = renderShopItems(newP);
      if(berry) berry.textContent = newP.toLocaleString() + '🍓';

      window.toast(`🎉 "${item.name}" 구매! 🥕+${item.carrots} 😊+${item.happiness}`);
    } catch(e){
      window.toast("구매 실패: " + e.message);
    }
  };

  function boot(){
    if(!window.FB){ setTimeout(boot, 500); return; }
    initShopBtn();
    // 토끼 게임 다시 그려질 때마다 버튼도 다시 추가
    const observer = new MutationObserver(() => {
      if(document.getElementById('bunnyPlayground') && !document.getElementById('bunnyShopBtn')){
        initShopBtn();
      }
    });
    observer.observe(document.body, {childList: true, subtree: true});
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 2500));
  } else {
    setTimeout(boot, 2500);
  }

})();
