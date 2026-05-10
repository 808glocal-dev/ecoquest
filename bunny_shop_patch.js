(function(){

  const SHOP_CATS=[
    {id:'food',name:'먹이',emoji:'🍎'},
    {id:'toy', name:'장난감',emoji:'🎀'},
    {id:'home',name:'집/환경',emoji:'🏠'},
    {id:'care',name:'관리',emoji:'💆'},
  ];

  const SHOP_ITEMS=[
    // 먹이 6
    {id:'carrot', cat:'food',emoji:'🥕',name:'당근',          price:10, carrots:1, happiness:0,  desc:'기본 먹이'},
    {id:'grass',  cat:'food',emoji:'🌾',name:'풀 한 다발',    price:30, carrots:1, happiness:10, desc:'먹이 + 행복'},
    {id:'cabbage',cat:'food',emoji:'🥬',name:'양배추',        price:50, carrots:2, happiness:15, desc:'영양 만점'},
    {id:'apple',  cat:'food',emoji:'🍎',name:'사과',          price:80, carrots:3, happiness:25, desc:'달콤한 간식'},
    {id:'vitamin',cat:'food',emoji:'💊',name:'비타민',        price:150,carrots:5, happiness:50, desc:'기운 충전!'},
    {id:'love',   cat:'food',emoji:'💕',name:'사랑의 영양제',price:300,carrots:10,happiness:100,desc:'행복 풀충전 ✨'},
    // 장난감 6
    {id:'ribbon', cat:'toy', emoji:'🎀',name:'리본',          price:50, carrots:0, happiness:8,  desc:'예쁘게 꾸미기'},
    {id:'balloon',cat:'toy', emoji:'🎈',name:'풍선',          price:60, carrots:0, happiness:10, desc:'알록달록'},
    {id:'ball',   cat:'toy', emoji:'⚽',name:'공놀이',        price:80, carrots:0, happiness:12, desc:'신나는 놀이'},
    {id:'teddy',  cat:'toy', emoji:'🧸',name:'곰인형',        price:120,carrots:0, happiness:18, desc:'포근한 친구'},
    {id:'pinata', cat:'toy', emoji:'🪅',name:'피냐타',        price:200,carrots:0, happiness:30, desc:'파티 시간!'},
    {id:'rainbow',cat:'toy', emoji:'🌈',name:'무지개 비행',  price:250,carrots:0, happiness:40, desc:'환상의 시간'},
    // 집/환경 6
    {id:'pot',    cat:'home',emoji:'🪴',name:'화분',          price:80, carrots:0, happiness:10, desc:'초록 한 줌'},
    {id:'flower', cat:'home',emoji:'🌷',name:'꽃밭',          price:120,carrots:0, happiness:15, desc:'향긋한 꽃밭'},
    {id:'tree',   cat:'home',emoji:'🌳',name:'작은 나무',     price:180,carrots:0, happiness:20, desc:'시원한 그늘'},
    {id:'bed',    cat:'home',emoji:'🛏️',name:'푹신한 침대',   price:250,carrots:0, happiness:30, desc:'잠 푹 자기'},
    {id:'house',  cat:'home',emoji:'🏠',name:'토끼 집',       price:400,carrots:0, happiness:50, desc:'안락한 보금자리'},
    {id:'garden', cat:'home',emoji:'🌻',name:'우리 정원',     price:500,carrots:0, happiness:60, desc:'우리만의 정원'},
    // 관리 6
    {id:'brush',  cat:'care',emoji:'🪮',name:'빗질',          price:30, carrots:0, happiness:5,  desc:'반짝반짝'},
    {id:'bath',   cat:'care',emoji:'🛁',name:'목욕',          price:60, carrots:0, happiness:10, desc:'깨끗하게'},
    {id:'sleep',  cat:'care',emoji:'😴',name:'낮잠 시간',     price:80, carrots:0, happiness:12, desc:'달콤한 꿈'},
    {id:'massage',cat:'care',emoji:'💆',name:'마사지',        price:100,carrots:0, happiness:18, desc:'편안한 휴식'},
    {id:'spa',    cat:'care',emoji:'🧖',name:'스파',          price:180,carrots:0, happiness:30, desc:'고급 케어'},
    {id:'doctor', cat:'care',emoji:'🩺',name:'건강 검진',     price:250,carrots:0, happiness:40, desc:'건강 체크'},
  ];

  let _activeCat='food';

  function initShopBtn(){
    const tryAdd=()=>{
      const playground=document.getElementById('bunnyPlayground');
      if(!playground) return false;
      if(document.getElementById('bunnyShopBtn')) return true;
      const btn=document.createElement('button');
      btn.id='bunnyShopBtn';
      btn.onclick=openBunnyShop;
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
      if(item.carrots) effects.push(`🥕 +${item.carrots}`);
      if(item.happiness) effects.push(`😊 +${item.happiness}`);
      return `
        <div style="background:#fff;border:1.5px solid ${can?'#FFE082':'#eee'};border-radius:12px;padding:11px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
          <div style="font-size:32px;line-height:1;flex-shrink:0">${item.emoji}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:900;color:#5D4037">${item.name}</div>
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

      // 토끼에 효과 적용 (bunny_patch가 _bunnyUpdate 함수 노출)
      if(window._bunnyUpdate){
        await window._bunnyUpdate({carrots:item.carrots||0, happiness:item.happiness||0});
      } else {
        // 직접 처리
        const ref=window.FB.doc(window.FB.db,"bunnies",window.ME.uid);
        const snap=await window.FB.getDoc(ref);
        if(snap.exists()){
          const d=snap.data();
          await window.FB.setDoc(ref,{...d, carrots:(d.carrots||0)+(item.carrots||0), happiness:Math.min(100,(d.happiness||0)+(item.happiness||0))});
          if(typeof window.drawMap==='function') window.drawMap();
        }
      }

      const list=document.getElementById('shopItemList');
      const berry=document.getElementById('shopMyBerry');
      if(list) list.innerHTML=renderShopItems(newP);
      if(berry) berry.textContent=newP.toLocaleString()+'🍓';
      const effects=[]; if(item.carrots) effects.push(`🥕+${item.carrots}`); if(item.happiness) effects.push(`😊+${item.happiness}`);
      window.toast(`🎉 "${item.name}" 구매! ${effects.join(' ')}`);
    }catch(e){window.toast("구매 실패: "+e.message);}
  };

  function boot(){
    if(!window.FB){setTimeout(boot,500); return;}
    initShopBtn();
    const observer=new MutationObserver(()=>{
      if(document.getElementById('bunnyPlayground')&&!document.getElementById('bunnyShopBtn')){initShopBtn();}
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,2500));
  else setTimeout(boot,2500);

})();
