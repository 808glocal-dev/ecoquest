(function(){

  const SHOP_CATS=[
    {id:'food',name:'먹이',emoji:'🍎'},
    {id:'toy', name:'장난감',emoji:'🎀'},
    {id:'deco',name:'꾸미기',emoji:'🌳'},
    {id:'care',name:'관리',emoji:'💆'},
  ];

  const SHOP_ITEMS=[
    // 먹이 6
    {id:'grass',  cat:'food',emoji:'🌾',name:'풀 한 다발',    price:30, happiness:10, desc:'기본 먹이'},
    {id:'cabbage',cat:'food',emoji:'🥬',name:'양배추',        price:50, happiness:18, desc:'영양 만점'},
    {id:'apple',  cat:'food',emoji:'🍎',name:'사과',          price:80, happiness:25, desc:'달콤한 간식'},
    {id:'berry',  cat:'food',emoji:'🍓',name:'딸기',          price:100,happiness:30, desc:'토끼들이 좋아해요'},
    {id:'vitamin',cat:'food',emoji:'💊',name:'비타민',        price:150,happiness:50, desc:'기운 충전!'},
    {id:'love',   cat:'food',emoji:'💕',name:'사랑의 영양제',price:300,happiness:100,desc:'행복 풀충전 ✨'},
    // 장난감 6
    {id:'ribbon', cat:'toy', emoji:'🎀',name:'리본',          price:50, happiness:8,  desc:'예쁘게 꾸미기'},
    {id:'balloon',cat:'toy', emoji:'🎈',name:'풍선',          price:60, happiness:10, desc:'알록달록'},
    {id:'ball',   cat:'toy', emoji:'⚽',name:'공놀이',        price:80, happiness:12, desc:'신나는 놀이'},
    {id:'teddy',  cat:'toy', emoji:'🧸',name:'곰인형',        price:120,happiness:18, desc:'포근한 친구'},
    {id:'pinata', cat:'toy', emoji:'🪅',name:'피냐타',        price:200,happiness:30, desc:'파티 시간!'},
    {id:'rainbow',cat:'toy', emoji:'🌈',name:'무지개',        price:250,happiness:40, desc:'환상의 시간'},
    // 꾸미기 12 (영구 배치)
    {id:'rock',     cat:'deco',emoji:'🪨',name:'바위',     price:30, deco:true, size:24, desc:'정원 한 구석'},
    {id:'tulip',    cat:'deco',emoji:'🌷',name:'튤립',     price:50, deco:true, size:26, desc:'영구 배치'},
    {id:'mushroom', cat:'deco',emoji:'🍄',name:'버섯',     price:60, deco:true, size:26, desc:'숲 분위기'},
    {id:'butterfly',cat:'deco',emoji:'🦋',name:'나비',     price:80, deco:true, size:26, desc:'살랑살랑'},
    {id:'rose',     cat:'deco',emoji:'🌹',name:'장미',     price:100,deco:true, size:28, desc:'우아한 꽃'},
    {id:'sunflower',cat:'deco',emoji:'🌻',name:'해바라기', price:120,deco:true, size:30, desc:'태양을 향해'},
    {id:'pine',     cat:'deco',emoji:'🌲',name:'소나무',   price:180,deco:true, size:36, desc:'사계절 푸르게'},
    {id:'tree',     cat:'deco',emoji:'🌳',name:'큰 나무',  price:200,deco:true, size:40, desc:'시원한 그늘'},
    {id:'palm',     cat:'deco',emoji:'🌴',name:'야자수',   price:250,deco:true, size:38, desc:'휴양지 느낌'},
    {id:'bee',      cat:'deco',emoji:'🐝',name:'벌집',     price:120,deco:true, size:26, desc:'꿀이 가득'},
    {id:'house',    cat:'deco',emoji:'🏡',name:'작은 집',  price:350,deco:true, size:38, desc:'토끼 보금자리'},
    {id:'fountain', cat:'deco',emoji:'⛲',name:'분수',     price:400,deco:true, size:36, desc:'분수가 솟구쳐!'},
    // 관리 6
    {id:'brush',  cat:'care',emoji:'🪮',name:'빗질',          price:30, happiness:5,  desc:'반짝반짝'},
    {id:'bath',   cat:'care',emoji:'🛁',name:'목욕',          price:60, happiness:10, desc:'깨끗하게'},
    {id:'sleep',  cat:'care',emoji:'😴',name:'낮잠',          price:80, happiness:12, desc:'달콤한 꿈'},
    {id:'massage',cat:'care',emoji:'💆',name:'마사지',        price:100,happiness:18, desc:'편안한 휴식'},
    {id:'spa',    cat:'care',emoji:'🧖',name:'스파',          price:180,happiness:30, desc:'고급 케어'},
    {id:'doctor', cat:'care',emoji:'🩺',name:'건강 검진',     price:250,happiness:40, desc:'건강 체크'},
  ];

  let _activeCat='food';

  function initShopBtn(){
    const tryAdd=()=>{
      const playground=document.getElementById('bunnyPlayground');
      if(!playground) return false;
      if(document.getElementById('bunnyShopBtn')) return true;
      const btn=document.createElement('button');
      btn.id='bunnyShopBtn'; btn.onclick=openBunnyShop;
      btn.style.cssText=`position:absolute;bottom:8px;right:8px;background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:18px;padding:8px 14px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(196,69,105,.4);z-index:30;display:flex;align-items:center;gap:5px`;
      btn.innerHTML='🛒 토끼 상점';
      playground.appendChild(btn);
      return true;
    };
    if(!tryAdd()) setTimeout(initShopBtn,1000);
  }

  window.openBunnyShop=async function(){
    if(!window.ME){window.toast("로그인이 필요해요!"); return;}
    _activeCat='food';
    const myPoints=window.UDATA?.point||0;
    const old=document.getElementById('ovBunnyShop'); if(old) old.remove();
    const modal=document.createElement('div');
    modal.id='ovBunnyShop'; modal.className='overlay on';
    modal.innerHTML=`
      <div class="modal" style="padding:0;overflow:hidden;max-width:420px">
        <div style="background:linear-gradient(135deg,#FF6B9D,#C44569);padding:18px 18px 14px;color:#fff;position:relative">
          <button onclick="document.getElementById('ovBunnyShop').remove()" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,.25);border:none;border-radius:50%;width:30px;height:30px;font-size:14px;cursor:pointer;color:#fff">✕</button>
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.7)">🛒 BUNNY SHOP</div>
          <div style="font-size:18px;font-weight:900;margin-top:4px">토끼 용품 상점</div>
          <div style="font-size:10px;color:rgba(255,255,255,.85);margin-top:4px">사면 인벤토리 (🎒) 에 담겨요!</div>
          <div style="background:rgba(255,255,255,.2);border-radius:10px;padding:7px 12px;margin-top:10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:11px;font-weight:600">내 베리</span>
            <span style="font-size:16px;font-weight:900" id="shopMyBerry">${myPoints.toLocaleString()}🍓</span>
          </div>
        </div>
        <div id="shopCatTabs" style="display:flex;background:#f8f8f8;border-bottom:1px solid #eee">
          ${SHOP_CATS.map(c=>`<button onclick="selectShopCat('${c.id}')" id="catBtn-${c.id}" style="flex:1;background:${c.id===_activeCat?'#fff':'transparent'};border:none;border-bottom:${c.id===_activeCat?'2.5px solid #C44569':'2.5px solid transparent'};padding:10px 4px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;color:${c.id===_activeCat?'#C44569':'#666'}">${c.emoji} ${c.name}</button>`).join('')}
        </div>
        <div style="padding:12px 14px 18px;max-height:60vh;overflow-y:auto" id="shopItemList">
          ${renderShopItems(myPoints)}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  window.selectShopCat=function(catId){
    _activeCat=catId;
    SHOP_CATS.forEach(c=>{
      const btn=document.getElementById('catBtn-'+c.id); if(!btn) return;
      btn.style.background=c.id===catId?'#fff':'transparent';
      btn.style.borderBottom=c.id===catId?'2.5px solid #C44569':'2.5px solid transparent';
      btn.style.color=c.id===catId?'#C44569':'#666';
    });
    const list=document.getElementById('shopItemList');
    if(list) list.innerHTML=renderShopItems(window.UDATA?.point||0);
  };

  function renderShopItems(myPoints){
    const items=SHOP_ITEMS.filter(i=>i.cat===_activeCat);
    return items.map(item=>{
      const can=myPoints>=item.price;
      const effects=[];
      if(item.happiness) effects.push(`사용 시 😊 +${item.happiness}`);
      if(item.deco) effects.push(`🌳 정원에 영구 배치`);
      const tagText=item.deco?'🌳 즉시 배치':'🎒 인벤토리';
      return `
        <div style="background:#fff;border:1.5px solid ${can?'#FFE082':'#eee'};border-radius:12px;padding:11px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
          <div style="font-size:32px;line-height:1;flex-shrink:0">${item.emoji}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:900;color:#5D4037">${item.name} <span style="font-size:9px;font-weight:700;color:#C44569;background:#FFF0F5;padding:1px 5px;border-radius:5px;margin-left:4px">${tagText}</span></div>
            <div style="font-size:10px;color:#888;margin-top:2px">${item.desc}</div>
            <div style="font-size:10px;color:#27AE60;margin-top:4px;font-weight:700">${effects.join(' · ')}</div>
          </div>
          <button onclick="buyShopItem('${item.id}')" ${can?'':'disabled'} style="background:${can?'linear-gradient(135deg,#2ECC71,#27AE60)':'#f0f0f0'};color:${can?'#fff':'#aaa'};border:none;border-radius:10px;padding:8px 12px;font-size:11px;font-weight:900;cursor:${can?'pointer':'default'};font-family:inherit;flex-shrink:0;min-width:60px">
            ${item.price}🍓
          </button>
        </div>
      `;
    }).join('');
  }

  window.buyShopItem=async function(itemId){
    const item=SHOP_ITEMS.find(x=>x.id===itemId); if(!item) return;
    const myPoints=window.UDATA?.point||0;
    if(myPoints<item.price){window.toast("베리가 부족해요!"); return;}
    if(!window.ME){window.toast("로그인이 필요해요!"); return;}
    try{
      const newP=myPoints-item.price;
      await window.FB.updateDoc(window.FB.doc(window.FB.db,"users",window.ME.uid),{point:newP});
      window.UDATA.point=newP;
      if(window.updateUI) window.updateUI();

      // 꾸미기 → 영구 배치 (즉시 화면에)
      if(item.deco){
        const deco={
          id:`${item.id}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          emoji:item.emoji,
          x:30+Math.random()*220,
          y:130+Math.random()*60,
          size:item.size||28,
        };
        if(window._bunnyAddDecoration) await window._bunnyAddDecoration(deco);
        window.toast(`🌳 "${item.name}" 정원에 배치됐어요!`);
      } else {
        // 인벤토리에 추가
        if(window._bunnyAddInventory){
          await window._bunnyAddInventory({
            id:item.id, emoji:item.emoji, name:item.name, happiness:item.happiness||0
          });
        }
        window.toast(`🎒 "${item.name}" 인벤토리에 담겼어요!`);
      }

      const list=document.getElementById('shopItemList');
      const berry=document.getElementById('shopMyBerry');
      if(list) list.innerHTML=renderShopItems(newP);
      if(berry) berry.textContent=newP.toLocaleString()+'🍓';
    }catch(e){window.toast("구매 실패: "+e.message);}
  };

  function boot(){
    if(!window.FB){setTimeout(boot,500); return;}
    initShopBtn();
    const observer=new MutationObserver(()=>{
      if(document.getElementById('bunnyPlayground')&&!document.getElementById('bunnyShopBtn')) initShopBtn();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,2500));
  else setTimeout(boot,2500);

})();
