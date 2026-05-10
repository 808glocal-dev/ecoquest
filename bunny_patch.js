(function(){

  const PALETTES=[
    {body:'#FFFFFF',shade:'#F0E0CE',stroke:'#8B6F47',ear:'#FFB6C1',label:'하양'},
    {body:'#F5E6D3',shade:'#D8B898',stroke:'#7D5E47',ear:'#7D5E47',label:'갈얼룩'},
    {body:'#E8E8E8',shade:'#C8C8C8',stroke:'#6B6B6B',ear:'#A9A9A9',label:'회색'},
    {body:'#F5DEB3',shade:'#D8B888',stroke:'#7D5E47',ear:'#C8A878',label:'베이지'},
    {body:'#A0826D',shade:'#7D5E47',stroke:'#5C3A1E',ear:'#5C3A1E',label:'갈색'},
  ];

  const STAGES=[
    {id:0,min:0,name:'회색 도시',bg:'linear-gradient(180deg,#a8a8a8 0%,#888 50%,#666 100%)',
     skyDecor:[{e:'💨',top:8,left:24,size:22,op:.6},{e:'🏭',top:14,right:30,size:24,op:.7},{e:'🌫️',top:36,left:'45%',size:14,op:.5},{e:'🏢',top:60,left:8,size:32,op:.7},{e:'🏬',top:62,right:8,size:30,op:.7}],
     groundDecor:[{e:'🗑️',bottom:6,left:18,size:16},{e:'🚮',bottom:8,left:200,size:15},{e:'⚙️',bottom:6,right:60,size:13,op:.5}],
     msg:'지구가 아파요',sub:'당신의 작은 행동이 변화의 시작이에요',mask:true,hasCars:true},
    {id:1,min:1,name:'새싹',bg:'linear-gradient(180deg,#bee9d4 0%,#A8DC8E 50%,#8BC56F 100%)',
     skyDecor:[{e:'☁️',top:8,left:24,size:22,op:.85},{e:'🌤️',top:6,right:14,size:22}],
     groundDecor:[{e:'🌱',bottom:6,left:18,size:14},{e:'🌿',bottom:4,left:80,size:13},{e:'🌷',bottom:8,left:200,size:14}],
     msg:'당신이 시작했어요',sub:'첫 풀이 자라났어요',mask:false},
    {id:2,min:5,name:'들판',bg:'linear-gradient(180deg,#87CEEB 0%,#B5DCF0 45%,#A8DC8E 50%,#76B947 100%)',
     skyDecor:[{e:'☁️',top:8,left:24,size:22,op:.85},{e:'☀️',top:6,right:14,size:24},{e:'🦋',top:32,left:'50%',size:16},{e:'🐦',top:18,right:36,size:16,op:.8}],
     groundDecor:[{e:'🌷',bottom:8,left:18,size:16},{e:'🌼',bottom:6,left:90,size:15},{e:'🌾',bottom:12,left:160,size:14}],
     msg:'잃어버린 친구가 돌아와요',sub:'나비와 새가 다시 찾아왔어요',mask:false},
    {id:3,min:20,name:'숲',bg:'linear-gradient(180deg,#7AB85F 0%,#A8DC8E 40%,#5a9a3a 100%)',
     skyDecor:[{e:'☀️',top:6,right:14,size:22,op:.9},{e:'🦋',top:30,left:'45%',size:16}],
     groundDecor:[{e:'🌲',bottom:6,left:60,size:24},{e:'🍄',bottom:4,left:130,size:14},{e:'💧',bottom:14,left:200,size:14},{e:'🐿️',bottom:8,right:80,size:16}],
     msg:'생태계가 살아나요',sub:'나무와 시냇물이 흐르는 숲이 됐어요',mask:false},
    {id:4,min:50,name:'회복된 지구',bg:'linear-gradient(180deg,#1a1a3e 0%,#3d2966 40%,#5a9a3a 75%,#76B947 100%)',
     skyDecor:[{e:'🌙',top:8,right:14,size:24},{e:'⭐',top:18,left:50,size:14},{e:'⭐',top:36,left:'40%',size:12,op:.9},{e:'✨',top:8,left:140,size:14}],
     groundDecor:[{e:'🌳',bottom:6,left:18,size:24},{e:'🌸',bottom:4,left:80,size:14},{e:'✨',bottom:18,left:160,size:14}],
     msg:'당신이 지킨 작은 지구',sub:'별빛 아래 평화로운 토끼 마을이 됐어요',mask:false},
  ];

  const SUB_DECORS={0:[],1:['🌸','🌺','🌻','🌷','🌿','🌱','🌾','🦋'],2:['🌷','🌼','🦋','🌹','🐝','🌺','🍀','🌻'],3:['🌳','🍃','🐦','🦋','🌲','🌿','🦔','🌷'],4:['⭐','✨','💫','🌟','💖','🌙','⭐','✨']};

  const SEASONS=[
    {month:5,minCo2:75,emoji:'🦦',name:'수달',theme:'한강에 친구가 살게',desc:'줍깅·비치깅',tag:'멸종위기 1급'},
    {month:6,minCo2:100,emoji:'🐿️',name:'하늘다람쥐',theme:'도심에 숲을',desc:'대중교통·자전거',tag:'천연기념물'},
    {month:7,minCo2:150,emoji:'🐐',name:'산양',theme:'리필 마을을 세워줘',desc:'제로웨이스트샵',tag:'멸종위기 1급'},
    {month:8,minCo2:200,emoji:'🐢',name:'푸른바다거북',theme:'바다를 살려줘',desc:'해양 보호',tag:'멸종위기 2급'},
  ];

  const BUNNY_MSGS_STATIC=[
    "오늘 날씨 좋아!","주인 보고 싶었어 💕","쓰담쓰담 해줘서 고마워!","심심했는데 와줘서 좋아!",
    "햇볕 따스해 좋아!","주인 덕분에 우리가 살 수 있어 💕","환경 지켜줘서 너무 고마워!","우리 가족 행복해!",
    "예전엔 회색 도시였는데 이젠 풀밭이야!","주인 행동이 우리 세계를 바꿨어!","오늘도 미션 했지? 짱이야!",
    "내일도 미션 화이팅!","텀블러 써줘서 고마워!","줍깅 했다며? 멋져!","대중교통 타줘서 우리 공기 좋아졌어!",
    "자동차 1km 안 타면 CO₂ 0.21kg 줄어!","텀블러 한 번에 11g 절감!","나무 1그루는 1년에 21kg 흡수해!",
    "일회용컵 분해는 500년 걸려 😱","비닐봉지 분해는 100년!","수달은 한강에 다시 살게 됐어 🦦",
    "주인이 최고야!","오늘도 고생했어!","쉬엄쉬엄 해, 환경은 마라톤이야 🏃","사랑해 💕","안아줘! 🤗",
    "포근해!","벚꽃 피는 봄이야! 🌸","녹음이 짙어! 🌿","환기 자주 시켜!","오늘 점심은 뭐 먹을까?",
    "잠이 솔솔 와... 😴","친구들이랑 놀고 있었어!","주인은 환경 영웅이야!","우리 오래오래 같이 살자 💕",
    "미세먼지 없는 날이 좋아!","비 오면 풀이 더 잘 자라!","꽃밭 가꿔줘서 고마워!","에코퀘스트 짱! 💚",
    "주인이 우리 마을 지킴이야!","어제보다 오늘이 더 푸르러!","주인 옆이 제일 좋아 ❤️"
  ];

  function getStage(co2){for(let i=STAGES.length-1;i>=0;i--){if(co2>=STAGES[i].min)return STAGES[i];}return STAGES[0];}
  function getNextStage(co2){const cur=getStage(co2);const idx=STAGES.indexOf(cur);return idx<STAGES.length-1?STAGES[idx+1]:null;}
  function getStageProgress(co2){const cur=getStage(co2);const nxt=getNextStage(co2);if(!nxt)return 1;return Math.min(1,(co2-cur.min)/(nxt.min-cur.min));}
  function getImpact(co2){return {trees:(co2/21.4).toFixed(1),carKm:Math.round(co2/0.21),cups:Math.round(co2/0.011),sqm:Math.round(co2*0.6)};}

  function getRandomBunnyMsg(){
    const imp=getImpact(_myCo2);
    const dynamic=[
      `지금까지 ${_myCo2.toFixed(1)}kg 줄였어! 멋지다!`,
      `우리 가족 ${(_myBunny?.bunnies||[]).length}마리야!`,
      `주인 덕분에 나무 ${imp.trees}그루 산 거야!`,
      `자동차 ${imp.carKm}km 안 탄 효과야! 🚗`,
    ];
    const all=[...BUNNY_MSGS_STATIC,...dynamic];
    return all[Math.floor(Math.random()*all.length)];
  }

  let _myCo2=0,_airQuality=null;

  async function fetchAirQuality(){
    try{
      const r=await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=37.5&longitude=126.9&current=pm10,pm2_5');
      const d=await r.json();
      if(d.current){
        _airQuality={pm25:Math.round(d.current.pm2_5||0),pm10:Math.round(d.current.pm10||0)};
        if(document.getElementById('bunnyGameMain')&&_myBunny) renderBunnyMap();
      }
    }catch(e){console.log('[bunny] 공기 실패');}
  }
  function getAirStatus(){
    if(!_airQuality) return {label:'정보 없음',icon:'❓',color:'#888',mask:false,msg:''};
    const pm=_airQuality.pm25;
    if(pm<15) return {label:'좋음',icon:'✨',color:'#00BFA5',mask:false,msg:'토끼들이 신났어요!'};
    if(pm<35) return {label:'보통',icon:'☁️',color:'#43A047',mask:false,msg:''};
    if(pm<75) return {label:'나쁨',icon:'🌫️',color:'#FF8F00',mask:true,msg:'마스크 자동 착용'};
    return {label:'매우 나쁨',icon:'⚠️',color:'#D32F2F',mask:true,msg:'외출 자제'};
  }

  async function refreshMyCo2(){
    if(!window.ME) return 0;
    if(window.UDATA){
      const keys=['co2Saved','totalCo2','co2','totalCO2','CO2','co2_saved','co2Reduced','co2_reduced'];
      for(const k of keys){const v=Number(window.UDATA[k]); if(!isNaN(v)&&v>0){_myCo2=v;return _myCo2;}}
    }
    try{
      const q=window.FB.query(window.FB.collection(window.FB.db,"missionLogs"),window.FB.where("uid","==",window.ME.uid));
      const snap=await window.FB.getDocs(q);
      let sum=0,count=0;
      snap.forEach(d=>{const dt=d.data(); const v=Number(dt.co2||dt.co2Reduced||0); if(!isNaN(v))sum+=v; count++;});
      if(sum>0){_myCo2=sum;return _myCo2;}
      if(count>0){_myCo2=count*0.5;return _myCo2;}
    }catch(e){}
    _myCo2=0; return 0;
  }

  function bunnySvg(colorIdx,mood,withMask){
    const p=PALETTES[Math.min(colorIdx,4)]; let eye;
    if(mood==='sleep') eye=`<path d="M 19 24 Q 22 27 25 24" stroke="${p.stroke}" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M 31 24 Q 34 27 37 24" stroke="${p.stroke}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    else if(mood==='happy') eye=`<path d="M 19 26 Q 22 23 25 26" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M 31 26 Q 34 23 37 26" stroke="#1a1a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    else eye=`<ellipse cx="22" cy="26" rx="2.6" ry="3.2" fill="#1a1a1a"/><ellipse cx="34" cy="26" rx="2.6" ry="3.2" fill="#1a1a1a"/><ellipse cx="23" cy="24.8" rx="1.2" ry="1.5" fill="#fff"/><ellipse cx="35" cy="24.8" rx="1.2" ry="1.5" fill="#fff"/><circle cx="21.3" cy="27.3" r=".4" fill="#fff" opacity=".7"/><circle cx="33.3" cy="27.3" r=".4" fill="#fff" opacity=".7"/>`;
    const mask=withMask?`<g><ellipse cx="28" cy="35" rx="11" ry="5" fill="#A8E6F0" stroke="#5d9aaa" stroke-width=".5" opacity=".95"/><line x1="17" y1="35" x2="14" y2="32" stroke="#5d9aaa" stroke-width=".5"/><line x1="39" y1="35" x2="42" y2="32" stroke="#5d9aaa" stroke-width=".5"/></g>`:'';
    return `<svg viewBox="0 0 60 70" style="width:60px;height:70px;display:block;overflow:visible">
      <ellipse cx="30" cy="68" rx="17" ry="1.5" fill="${p.stroke}" opacity=".15"/>
      <path d="M 16 52 C 13 65 22 66 30 65 C 38 66 47 65 44 52 C 46 42 38 38 30 38 C 22 38 14 42 16 52 Z" fill="${p.body}" stroke="${p.stroke}" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M 38 42 C 44 46 46 56 44 62 C 41 60 38 50 38 42 Z" fill="${p.shade}" opacity=".55"/>
      <ellipse cx="28" cy="26" rx="16" ry="14.5" fill="${p.body}" stroke="${p.stroke}" stroke-width=".8"/>
      <path d="M 36 14 C 42 16 43 28 41 36 C 38 37 32 37 30 35 C 32 28 33 18 36 14 Z" fill="${p.shade}" opacity=".45"/>
      <path d="M 19 14 C 13 3 17 0 20 1 C 23 4 24 12 22 16 Z" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <path d="M 19 13 C 16 5 18 3 19 3 C 21 5 22 11 21 14 Z" fill="${p.ear}" opacity=".85"/>
      <path d="M 36 12 C 35 3 39 0 41 1 C 43 4 41 11 38 14 Z" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <path d="M 36.5 11 C 36 4 38 3 39 3 C 40 5 39 10 37 12 Z" fill="${p.ear}" opacity=".85"/>
      ${eye}
      <line x1="13" y1="32" x2="5" y2="31" stroke="${p.stroke}" stroke-width=".5" stroke-linecap="round" opacity=".7"/>
      <line x1="13" y1="33.5" x2="4" y2="34" stroke="${p.stroke}" stroke-width=".5" stroke-linecap="round" opacity=".7"/>
      <path d="M 26 32 Q 28 31.5 29 32.5 Q 29 34 27.5 34.5 Q 25.5 34 25 32.8 Q 25.5 32 26 32 Z" fill="#FF9FB0" stroke="${p.stroke}" stroke-width=".4"/>
      <path d="M 27 34.5 L 27 35.8" stroke="${p.stroke}" stroke-width=".7" stroke-linecap="round"/>
      <path d="M 27 35.8 Q 25 36.8 24 36.3" stroke="${p.stroke}" stroke-width=".7" fill="none" stroke-linecap="round"/>
      <path d="M 27 35.8 Q 29 36.8 30 36.3" stroke="${p.stroke}" stroke-width=".7" fill="none" stroke-linecap="round"/>
      <ellipse cx="22" cy="60" rx="4" ry="3" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <ellipse cx="36" cy="60" rx="4" ry="3" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      <circle cx="46" cy="50" r="3.5" fill="${p.body}" stroke="${p.stroke}" stroke-width=".7"/>
      ${mask}
    </svg>`;
  }

  let _myBunny=null,_petTimer=0,_bunnyChars=[],_animLoop=null,_lastSpawnedKey='',_adoptColor=0,_lastStageId=-1,_isFirstAdopt=false;

  async function loadBunny(){
    if(!window.ME||!window.FB){setTimeout(loadBunny,500); return;}
    try{
      const ref=window.FB.doc(window.FB.db,"bunnies",window.ME.uid);
      const snap=await window.FB.getDoc(ref);
      if(snap.exists()){
        _myBunny=snap.data();
        if(!_myBunny.bunnies||!Array.isArray(_myBunny.bunnies)) _myBunny.bunnies=[];
        if(!_myBunny.decorations||!Array.isArray(_myBunny.decorations)) _myBunny.decorations=[];
        if(!_myBunny.inventory) _myBunny.inventory={};
        if(_myBunny.friendCount!==undefined && _myBunny.bunnies.length===0){
          const cnt=_myBunny.friendCount+1;
          for(let i=0;i<cnt;i++) _myBunny.bunnies.push({name:i===0?"꼬미":`토끼${i+1}`,color:0});
          delete _myBunny.friendCount; delete _myBunny.carrots;
          await window.FB.setDoc(ref,_myBunny);
        }
      } else {
        _myBunny={happiness:0,bunnies:[],decorations:[],inventory:{},createdAt:window.FB.serverTimestamp()};
        try { await window.FB.setDoc(ref,_myBunny); }
        catch(e) { console.log("[bunny] 첫 저장 실패 (권한?):",e.message); }
      }
      await refreshMyCo2();
      _lastStageId=getStage(_myCo2).id;
      renderBunnyMap();
    }catch(e){
      console.log("토끼 로드 실패:",e.message);
      const c=document.getElementById("bunnyGameMain");
      if(c) c.innerHTML='<div style="text-align:center;padding:40px;color:#888;font-size:13px">⚠️ 토끼 로딩 실패<br/><br/><span style="color:#aaa;font-size:11px">'+e.message+'</span><br/><br/><button onclick="location.reload()" style="margin-top:12px;padding:10px 20px;background:#2ECC71;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit">🔄 새로고침</button></div>';
    }
  }

  async function saveBunny(){
    if(!window.ME||!_myBunny) return;
    try{
      await window.FB.setDoc(window.FB.doc(window.FB.db,"bunnies",window.ME.uid),_myBunny);
      renderBunnyStats();
      const cnt=(_myBunny.bunnies||[]).length;
      const colors=(_myBunny.bunnies||[]).map(b=>b.color).join(',');
      const stageId=getStage(_myCo2).id;
      const decoCount=(_myBunny.decorations||[]).length;
      const newKey=`${cnt}_${colors}_${stageId}_${decoCount}`;
      if(newKey!==_lastSpawnedKey){spawnBunnies(_myBunny.bunnies||[]); applyStageBg(getStage(_myCo2));}
    }catch(e){console.log("토끼 저장 실패:",e.message);}
  }

  function checkStageUp(){
    const cur=getStage(_myCo2);
    if(_lastStageId>=0&&cur.id>_lastStageId){const prevId=_lastStageId; _lastStageId=cur.id; setTimeout(()=>showStageUp(cur,prevId),800);}
    else _lastStageId=cur.id;
  }

  function initBunnyOnMap(){
    const tryAdd=()=>{
      const mapPage=document.getElementById("page-map"); if(!mapPage) return false;
      if(document.getElementById("bunnyGameMain")) return true;
      mapPage.innerHTML='<div id="bunnyGameMain"><div style="text-align:center;padding:40px;color:#888;font-size:13px">🐰 로딩 중...</div></div>';
      window.drawMap=function(){renderBunnyMap(); refreshAndUpdate();};
      loadBunny();
      return true;
    };
    if(!tryAdd()) setTimeout(initBunnyOnMap,1000);
  }

  function flashPlayground(){
    const pg=document.getElementById('bunnyPlayground'); if(!pg) return;
    const flash=document.createElement('div');
    flash.style.cssText='position:absolute;inset:0;background:radial-gradient(circle,rgba(255,255,200,.6) 0%,transparent 70%);pointer-events:none;z-index:99;animation:flashFade 1s ease-out';
    pg.appendChild(flash);
    setTimeout(()=>flash.remove(),1000);
  }
  function sproutNewElement(){
    const pg=document.getElementById('bunnyPlayground'); if(!pg) return;
    const stage=getStage(_myCo2); if(stage.id===0) return;
    const list=SUB_DECORS[stage.id]||['🌸','🌺','🌻','🌷'];
    const e=document.createElement('div'); e.className='stage-decor sprout-anim';
    const isSky=Math.random()<0.3 && stage.id>=2;
    if(isSky) e.style.cssText=`position:absolute;top:${30+Math.random()*60}px;left:${20+Math.random()*240}px;font-size:${14+Math.random()*6}px;z-index:3;transform-origin:center;animation:sproutGrow 1.4s cubic-bezier(.5,2,.3,.8)`;
    else e.style.cssText=`position:absolute;bottom:${4+Math.random()*22}px;left:${20+Math.random()*240}px;font-size:${14+Math.random()*8}px;z-index:3;transform-origin:center bottom;animation:sproutGrow 1.4s cubic-bezier(.5,2,.3,.8)`;
    e.textContent=list[Math.floor(Math.random()*list.length)];
    pg.appendChild(e);
  }

  async function refreshAndUpdate(){
    const prev=_myCo2;
    await refreshMyCo2();
    if(prev!==_myCo2){
      flashPlayground(); sproutNewElement();
      setTimeout(()=>{
        renderBunnyStats();
        const stage=getStage(_myCo2); applyStageBg(stage);
        const cnt=(_myBunny?.bunnies||[]).length;
        const colors=(_myBunny?.bunnies||[]).map(b=>b.color).join(',');
        const decoCount=(_myBunny?.decorations||[]).length;
        const newKey=`${cnt}_${colors}_${stage.id}_${decoCount}`;
        if(newKey!==_lastSpawnedKey) spawnBunnies(_myBunny?.bunnies||[]);
        checkStageUp();
      },1500);
    }
  }

  function renderBunnyMap(){
    const c=document.getElementById("bunnyGameMain"); if(!c) return;
    if(!_myBunny){c.innerHTML='<div style="text-align:center;padding:40px;color:#888;font-size:13px">🐰 로딩 중...</div>'; return;}
    if((_myBunny.bunnies||[]).length===0){renderFirstAdopt(); return;}

    const stage=getStage(_myCo2); const next=getNextStage(_myCo2); const air=getAirStatus();

    c.innerHTML=`
      <div style="margin:12px 12px 8px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:14px;padding:10px 14px;color:#fff">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div>
            <div style="font-size:9px;color:rgba(255,255,255,.6);font-weight:600;letter-spacing:1px">🌍 내 지구 — STAGE ${stage.id+1}/5</div>
            <div style="font-size:14px;font-weight:900;color:#a8f0c6;margin-top:1px">${stage.name} · CO₂ ${_myCo2.toFixed(1)}kg</div>
          </div>
          <button onclick="shareCurrentBunny()" style="background:rgba(255,255,255,.2);border:none;border-radius:10px;padding:6px 10px;font-size:11px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit">📸 공유</button>
        </div>
        <div style="font-size:10px;color:rgba(255,255,255,.7);margin-bottom:5px">${next?`다음: ${next.name} <b style="color:#a8f0c6">${(next.min-_myCo2).toFixed(1)}kg 더!</b>`:'<b style="color:#FFD700">최종 단계 ✨</b>'}</div>
        ${next?`<div style="height:5px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden"><div style="width:${Math.min(100,getStageProgress(_myCo2)*100)}%;height:100%;background:linear-gradient(90deg,#a8f0c6,#FFD700);transition:width .8s"></div></div>`:''}
      </div>

      ${_airQuality?`<div style="margin:0 12px 12px;background:#fff;border:1.5px solid ${air.color};border-radius:12px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px"><div style="font-size:20px">${air.icon}</div><div><div style="font-size:10px;color:#888;font-weight:600">오늘 미세먼지</div><div style="font-size:13px;font-weight:900;color:${air.color}">${air.label} <span style="font-size:10px;color:#888">PM2.5 ${_airQuality.pm25}</span></div></div></div>
        ${air.msg?`<div style="font-size:10px;color:${air.color};font-weight:700;text-align:right">${air.msg}</div>`:''}
      </div>`:''}

      <div id="bunnyPlayground" style="position:relative;margin:0 12px;height:260px;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);user-select:none;transition:background 1.5s">
        <div id="bunnyHelpText" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:12px;padding:3px 10px;font-size:10px;color:#444;font-weight:600;pointer-events:none;z-index:5">"${stage.msg}" · 토끼 탭하면 메시지!</div>
      </div>
      <div id="bunnyStats"></div>
    `;
    applyStageBg(stage);
    renderBunnyStats();
    setTimeout(()=>spawnBunnies(_myBunny.bunnies||[]),100);
  }

  function renderFirstAdopt(){
    const c=document.getElementById("bunnyGameMain"); if(!c) return;
    c.innerHTML=`
      <div style="margin:24px 16px;text-align:center">
        <div style="background:linear-gradient(135deg,#fff,#fff8e1);border-radius:20px;padding:32px 20px;border:2px solid #FFE082;box-shadow:0 4px 20px rgba(0,0,0,.05)">
          <div style="font-size:64px;margin-bottom:12px">🐰</div>
          <div style="font-size:20px;font-weight:900;color:#1B5E20;margin-bottom:8px">아직 토끼가 없어요!</div>
          <div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:24px">나의 환경 행동이<br/>토끼 가족의 세계를 바꿔요 🌍<br/>첫 토끼를 입양하고 시작해 볼까요?</div>
          <button onclick="adoptBunny(true)" style="background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border:none;border-radius:14px;padding:14px 32px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(196,69,105,.3)">🐰 첫 토끼 입양하기</button>
        </div>
      </div>
    `;
  }

  function applyStageBg(stage){
    const pg=document.getElementById('bunnyPlayground'); if(!pg) return;
    pg.style.background=stage.bg;
    pg.querySelectorAll('.stage-decor, .stage-car, .user-decor').forEach(el=>el.remove());

    const air=getAirStatus();
    if(air.mask){
      const fog=document.createElement('div'); fog.className='stage-decor';
      fog.style.cssText='position:absolute;inset:0;background:radial-gradient(circle at 50% 60%,rgba(180,170,150,.35) 0%,rgba(180,170,150,.15) 60%,transparent 100%);pointer-events:none;z-index:4';
      pg.appendChild(fog);
    }

    const decors=[...(stage.skyDecor||[]).map(d=>({...d})),...(stage.groundDecor||[]).map(d=>({...d}))];
    decors.forEach(d=>{
      const el=document.createElement('div'); el.className='stage-decor';
      let s=`position:absolute;font-size:${d.size||14}px;opacity:${d.op||.85};pointer-events:none;z-index:2;`;
      if(d.top!==undefined) s+=`top:${typeof d.top==='string'?d.top:d.top+'px'};`;
      if(d.bottom!==undefined) s+=`bottom:${d.bottom}px;`;
      if(d.left!==undefined) s+=`left:${typeof d.left==='string'?d.left:d.left+'px'};`;
      if(d.right!==undefined) s+=`right:${d.right}px;`;
      el.style.cssText=s; el.textContent=d.e;
      pg.appendChild(el);
    });

    const progress=getStageProgress(_myCo2); const filled=Math.floor(progress*8);
    const subList=SUB_DECORS[stage.id]||[];
    for(let i=0;i<filled&&i<subList.length;i++){
      const e=document.createElement('div'); e.className='stage-decor';
      const isSky=stage.id>=2&&(i%3===0); const seed=(i*97)%240;
      if(isSky) e.style.cssText=`position:absolute;top:${30+(i*23)%60}px;left:${20+seed}px;font-size:${13+(i%4)*2}px;opacity:.85;z-index:2;pointer-events:none`;
      else e.style.cssText=`position:absolute;bottom:${4+(i*7)%22}px;left:${20+seed}px;font-size:${13+(i%4)*2}px;opacity:.85;z-index:2;pointer-events:none`;
      e.textContent=subList[i];
      pg.appendChild(e);
    }

    if(stage.hasCars){
      const cars=[
        {emoji:'🚗',size:20,top:120,delay:0,duration:9,dir:'ltr'},
        {emoji:'🚙',size:20,top:140,delay:3,duration:11,dir:'rtl'},
        {emoji:'🚌',size:22,top:160,delay:6,duration:13,dir:'ltr'},
        {emoji:'🚛',size:22,top:180,delay:1,duration:15,dir:'rtl'},
      ];
      cars.forEach(c=>{
        const el=document.createElement('div'); el.className='stage-car stage-decor';
        el.style.cssText=`position:absolute;top:${c.top}px;font-size:${c.size}px;z-index:3;pointer-events:none;${c.dir==='ltr'?'left:-40px':'right:-40px'};animation:${c.dir==='ltr'?'carLtr':'carRtl'} ${c.duration}s linear ${c.delay}s infinite;${c.dir==='rtl'?'transform:scaleX(-1);':''}`;
        el.textContent=c.emoji;
        pg.appendChild(el);
      });
    }

    // 사용자 영구 데코 (z-index 5로 상승, 잘 보이게)
    (_myBunny?.decorations||[]).forEach(d=>{
      const el=document.createElement('div'); el.className='user-decor';
      el.style.cssText=`position:absolute;left:${d.x}px;top:${d.y}px;font-size:${d.size||28}px;z-index:5;pointer-events:none;text-shadow:0 2px 4px rgba(0,0,0,.15);filter:drop-shadow(0 2px 3px rgba(0,0,0,.2))`;
      el.textContent=d.emoji;
      pg.appendChild(el);
    });
  }

  function renderBunnyStats(){
    const c=document.getElementById("bunnyStats"); if(!c||!_myBunny) return;
    const bunnies=_myBunny.bunnies||[]; const happiness=_myBunny.happiness||0;
    const inv=_myBunny.inventory||{};
    const invKeys=Object.keys(inv).filter(k=>inv[k] && inv[k].count>0);
    const totalInv=invKeys.reduce((s,k)=>s+inv[k].count,0);
    const decoCount=(_myBunny.decorations||[]).length;
    const imp=getImpact(_myCo2);

    c.innerHTML=`
      <div style="margin:12px">
        ${_myCo2>0?`<div style="background:linear-gradient(135deg,#fff,#f0fbf4);border-radius:14px;padding:12px 14px;margin-bottom:12px;border:1.5px solid #a8e6c5">
          <div style="font-size:10px;color:#1a6b3a;font-weight:700;letter-spacing:1.5px;margin-bottom:8px">💚 내가 만든 임팩트</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🌳</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.trees}그루</div><div style="font-size:9px;color:#888">나무 1년 분량</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🚗</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.carKm}km</div><div style="font-size:9px;color:#888">차 안 탄 효과</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">☕</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.cups}개</div><div style="font-size:9px;color:#888">일회용컵 효과</div></div>
            <div style="background:#fff;border-radius:8px;padding:8px;text-align:center"><div style="font-size:18px">🐰</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.sqm}평</div><div style="font-size:9px;color:#888">토끼가 살 숲</div></div>
          </div>
        </div>`:''}

        <div style="background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;padding:14px 16px;text-align:center;border:2px solid #FFE082;margin-bottom:12px">
          <div style="font-size:11px;color:#689F38;font-weight:700;letter-spacing:2px">🐰 MY BUNNY FAMILY</div>
          <div style="font-size:18px;font-weight:900;color:#1B5E20;margin-top:4px">우리 토끼 ${bunnies.length}마리 · 정원 데코 ${decoCount}개 🌳</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:10px"><span style="color:#555;font-weight:600">😊 행복도</span><span style="color:#e91e63;font-weight:700">${happiness}/100</span></div>
          <div style="height:8px;background:#fce4ec;border-radius:4px;overflow:hidden;margin-top:4px"><div style="width:${Math.min(100,happiness)}%;height:100%;background:linear-gradient(90deg,#f06292,#e91e63);transition:width .5s"></div></div>
          ${happiness>=100?'<div style="font-size:11px;color:#C44569;margin-top:6px;font-weight:700">✨ 새 토끼를 입양할 수 있어요!</div>':''}
        </div>

        <button onclick="adoptBunny()" ${happiness<100?'disabled':''} style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;background:${happiness<100?'#f5f5f5':'linear-gradient(135deg,#FF6B9D,#C44569)'};color:${happiness<100?'#aaa':'#fff'};border:none;border-radius:12px;font-size:14px;cursor:${happiness<100?'default':'pointer'};font-family:inherit;font-weight:700;width:100%;margin-bottom:12px"><span>🐰 새 토끼 입양하기</span><span style="font-weight:600">${happiness<100?`행복 ${100-happiness} 더`:'✨ 가능!'}</span></button>

        <!-- 🎒 내 아이템 (인벤토리) -->
        ${invKeys.length>0 ? `
        <div style="background:linear-gradient(135deg,#fff,#fff0f5);border-radius:14px;padding:14px 12px;margin-bottom:12px;border:2px solid #FFB6C1">
          <div style="font-size:12px;font-weight:900;color:#C44569;margin-bottom:10px;text-align:center">🎒 내 아이템 (총 ${totalInv}개)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${invKeys.map(id=>{
              const it=inv[id];
              return `<button onclick="useItem('${id}')" style="display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #FFE082;border-radius:10px;padding:8px 10px;cursor:pointer;font-family:inherit;text-align:left;width:100%">
                <div style="font-size:24px;flex-shrink:0">${it.emoji}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:11px;font-weight:900;color:#5D4037">${it.name}</div>
                  <div style="font-size:9px;color:#888">x${it.count} · 😊+${it.happiness}</div>
                </div>
                <div style="background:linear-gradient(135deg,#FF6B9D,#C44569);color:#fff;border-radius:8px;padding:4px 8px;font-size:9px;font-weight:900;flex-shrink:0">사용</div>
              </button>`;
            }).join('')}
          </div>
          <div style="font-size:10px;color:#888;text-align:center;margin-top:8px;font-style:italic">탭하면 토끼한테 줘요!</div>
        </div>
        ` : `
        <div style="margin-bottom:12px;padding:14px;background:#fafafa;border-radius:14px;border:1px dashed #ccc;text-align:center">
          <div style="font-size:12px;color:#888;font-weight:700">🎒 아직 아이템이 없어요</div>
          <div style="font-size:10px;color:#aaa;margin-top:4px">상점(🛒)에서 사면 여기 담겨요!</div>
        </div>`}

        <div style="padding:11px 13px;background:#f0fbf4;border-radius:10px;font-size:11px;color:#1B5E20;line-height:1.8;margin-bottom:12px">
          💡 상점 (🛒) → 베리로 사기 → 인벤토리 (🎒) 담김<br/>
          💡 인벤토리에서 [사용] 누르면 토끼한테 줘요!<br/>
          💡 꾸미기 (🌳) 사면 정원에 영구 배치!
        </div>

        <div style="margin-bottom:12px;padding:14px 12px;background:#fff;border-radius:12px;border:1px solid #d8eedd">
          <div style="font-size:11px;font-weight:900;color:#1a2e1a;margin-bottom:12px;text-align:center">🐾 우리 토끼 가족</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
            ${bunnies.map((b)=>`<div style="text-align:center;padding:6px 4px;background:#f8fdf9;border-radius:10px;min-width:62px;border:1px solid #eee"><div style="height:54px;display:flex;justify-content:center;align-items:flex-end;overflow:hidden"><div style="transform:scale(.7);transform-origin:center bottom">${bunnySvg(b.color,'normal',false)}</div></div><div style="font-size:10px;color:#444;margin-top:3px;font-weight:700">${b.name}</div></div>`).join('')}
          </div>
        </div>

        <div style="padding:14px 12px;background:linear-gradient(135deg,#fff,#fff8e1);border-radius:14px;border:2px dashed #FFD54F">
          <div style="font-size:11px;font-weight:900;color:#8D6E1B;margin-bottom:4px;text-align:center">🌟 한정판 친구 — 멸종위기종</div>
          <div style="font-size:10px;color:#888;text-align:center;margin-bottom:12px">CO₂ 더 모으면 만날 수 있어요!</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${SEASONS.map(s=>{
              const unlocked=_myCo2>=s.minCo2; const remain=Math.max(0,s.minCo2-_myCo2);
              const prog=Math.min(100,(_myCo2/s.minCo2)*100);
              return `<div style="background:${unlocked?'#fff':'#fafafa'};border-radius:10px;padding:10px 8px;text-align:center;border:1px solid ${unlocked?'#FFE082':'#e8e8e8'};position:relative">
                <div style="font-size:36px;line-height:1.1;filter:${unlocked?'none':'grayscale(.85) opacity(.5)'}">${s.emoji}</div>
                <div style="font-size:11px;font-weight:900;color:${unlocked?'#5D4037':'#999'};margin-top:6px">${s.month}월 · ${s.name}</div>
                <div style="font-size:9px;color:#888;margin-top:2px">"${s.theme}"</div>
                <div style="height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;margin-top:6px"><div style="width:${prog}%;height:100%;background:linear-gradient(90deg,#FFD54F,#FF8F00);transition:width .8s"></div></div>
                <div style="font-size:9px;color:${unlocked?'#27AE60':'#FF8F00'};margin-top:4px;font-weight:700">${unlocked?'✨ 해금!':`${remain.toFixed(0)}kg 더`}</div>
                <div style="position:absolute;top:6px;right:6px;background:#FFE082;color:#8D6E1B;font-size:8px;font-weight:700;padding:2px 5px;border-radius:7px">${s.tag}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div style="height:20px"></div>
      </div>
    `;
  }

  // ═══ 아이템 사용 (인벤토리) ═══
  window.useItem=async function(itemId){
    if(!_myBunny || !_myBunny.inventory || !_myBunny.inventory[itemId]) return;
    const item=_myBunny.inventory[itemId];
    if(item.count<1) return;

    // 시각 효과 먼저
    showItemUsage(item);

    // 차감
    item.count--;
    const usedItem={...item};
    if(item.count<=0) delete _myBunny.inventory[itemId];
    _myBunny.happiness=Math.min(100,(_myBunny.happiness||0)+(item.happiness||0));

    await saveBunny();
    
    // 토끼들 신난 점프
    setTimeout(()=>{_bunnyChars.forEach((_,i)=>setTimeout(()=>bigJump(i),i*80));},300);

    setTimeout(()=>window.toast(`🎉 "${usedItem.name}" 사용! 행복 +${usedItem.happiness}`),200);
  };

  function showItemUsage(item){
    const pg=document.getElementById('bunnyPlayground'); if(!pg) return;
    
    // 큰 이모지 등장
    const big=document.createElement('div');
    big.style.cssText=`position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:72px;z-index:60;pointer-events:none;animation:itemUse 1.6s ease-out;text-shadow:0 6px 16px rgba(0,0,0,.3);filter:drop-shadow(0 4px 12px rgba(0,0,0,.2))`;
    big.textContent=item.emoji;
    pg.appendChild(big);

    // +N 😊
    const heart=document.createElement('div');
    heart.style.cssText=`position:absolute;top:30%;left:50%;transform:translateX(-50%);font-size:20px;font-weight:900;color:#e91e63;z-index:61;pointer-events:none;animation:heartFloat 2s ease-out;text-shadow:0 2px 8px rgba(255,255,255,.9)`;
    heart.textContent=`+${item.happiness} 😊`;
    pg.appendChild(heart);

    setTimeout(()=>{big.remove(); heart.remove();},1700);
  }

  // ═══ 입양 ═══
  window.adoptBunny=function(isFirst){
    if(!_myBunny) return;
    _isFirstAdopt=isFirst===true;
    if(!_isFirstAdopt && (_myBunny.happiness||0)<100){window.toast("행복도 100 필요해요!"); return;}
    _adoptColor=0;
    const old=document.getElementById('ovAdopt'); if(old) old.remove();
    const modal=document.createElement('div');
    modal.id='ovAdopt'; modal.className='overlay on';
    const titleText=_isFirstAdopt?'첫 토끼 입양하기 🎉':'새 토끼 입양하기';
    const subText=_isFirstAdopt?'우리 첫 토끼 이름을 지어주세요!':'우리 가족이 될 토끼를 골라요!';
    modal.innerHTML=`<div class="modal" style="padding:24px 20px 20px"><button class="modal-close" onclick="document.getElementById('ovAdopt').remove()">✕</button><div style="text-align:center;margin-bottom:14px"><div style="font-size:48px">🐰</div><div style="font-size:17px;font-weight:900;margin-top:6px;color:#1B5E20">${titleText}</div><div style="font-size:12px;color:#888;margin-top:6px">${subText}</div></div><div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#555">🎨 색깔 선택</div><div style="display:flex;gap:6px;justify-content:space-between;margin-bottom:16px">${PALETTES.map((p,i)=>`<button id="cpb-${i}" onclick="selectAdoptColor(${i})" style="flex:1;background:${i===0?'#f0fbf4':'#fff'};border:${i===0?'2.5px solid #2ECC71':'1.5px solid #ddd'};border-radius:12px;padding:6px 2px;cursor:pointer;font-family:inherit;text-align:center"><div style="height:60px;display:flex;justify-content:center;align-items:flex-end;overflow:hidden"><div style="transform:scale(.7);transform-origin:center bottom">${bunnySvg(i,'normal',false)}</div></div><div style="font-size:9px;color:#666;margin-top:2px;font-weight:700">${p.label}</div></button>`).join('')}</div><div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#555">✏️ 이름 (직접 지어주세요!)</div><input id="newBunnyName" class="inp" placeholder="예: 꼬미, 토토, 보리, 마루..." maxlength="6" style="text-align:center;font-size:15px;font-weight:700"/><div style="font-size:10px;color:#aaa;text-align:center;margin-top:4px">최대 6글자</div><div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-gray" style="flex:1" onclick="document.getElementById('ovAdopt').remove()">취소</button><button class="btn btn-g" style="flex:1" onclick="confirmAdopt()">🎉 입양!</button></div></div>`;
    document.body.appendChild(modal);
    setTimeout(()=>{const inp=document.getElementById('newBunnyName'); if(inp){inp.focus(); inp.onkeydown=(e)=>{if(e.key==='Enter')window.confirmAdopt();};}},100);
  };
  window.selectAdoptColor=function(idx){
    _adoptColor=idx;
    PALETTES.forEach((_,i)=>{const btn=document.getElementById('cpb-'+i); if(!btn)return; btn.style.background=i===idx?'#f0fbf4':'#fff'; btn.style.border=i===idx?'2.5px solid #2ECC71':'1.5px solid #ddd';});
  };
  window.confirmAdopt=async function(){
    if(!_myBunny) return;
    const inp=document.getElementById('newBunnyName');
    let name=inp?.value?.trim()||'';
    if(!name){window.toast("이름을 지어주세요!"); return;}
    if(name.length>6) name=name.substring(0,6);
    if(!_myBunny.bunnies) _myBunny.bunnies=[];
    _myBunny.bunnies.push({name,color:_adoptColor});
    if(!_isFirstAdopt) _myBunny.happiness=0;
    await saveBunny();
    document.getElementById('ovAdopt')?.remove();
    if(_isFirstAdopt) renderBunnyMap();
    setTimeout(()=>{_bunnyChars.forEach((_,i)=>setTimeout(()=>bigJump(i),i*100));},300);
    window.toast(`🎉 "${name}" 우리 가족이 됐어요!`);
    _isFirstAdopt=false;
  };

  function spawnBunnies(bunniesData){
    const playground=document.getElementById('bunnyPlayground'); if(!playground) return;
    playground.querySelectorAll('.bunny-char, .bunny-extra').forEach(el=>el.remove());
    _bunnyChars=[];
    const w=playground.offsetWidth||320;
    const groundTop=130, groundBottom=195;
    const showCount=Math.min(bunniesData.length,12);
    const stage=getStage(_myCo2); const air=getAirStatus();

    for(let i=0;i<showCount;i++){
      const bdata=bunniesData[i];
      const wrap=document.createElement('div'); wrap.className='bunny-char';
      wrap.style.cssText=`position:absolute;cursor:pointer;user-select:none;z-index:${20+i};will-change:left,top,transform;line-height:0`;
      const withMask=(stage.mask&&i===0)||air.mask;
      wrap.innerHTML=`<div class="bunny-svg">${bunnySvg(bdata.color,'normal',withMask)}</div><div class="bunny-grass" style="position:absolute;top:30px;left:-12px;font-size:14px;display:none;line-height:1">🌿</div><div class="bunny-zzz" style="position:absolute;top:-10px;right:-4px;font-size:12px;display:none;line-height:1;animation:zzz 1.5s infinite">💤</div><div class="msg-bubble" style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#fff;border:1.5px solid #FFB6C1;color:#5D4037;font-size:10px;font-weight:700;padding:4px 10px;border-radius:12px;white-space:nowrap;max-width:180px;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.15);display:none;line-height:1.3;text-overflow:ellipsis;overflow:hidden"></div>`;
      const idx=i;
      wrap.onclick=(e)=>{e.stopPropagation(); showBunnyMsg(idx); bigJump(idx); window.petBunny();};
      playground.appendChild(wrap);
      const bunny={el:wrap,name:bdata.name,color:bdata.color,withMask,
        x:20+Math.random()*(w-80), y:groundTop+Math.random()*(groundBottom-groundTop),
        vx:0, hopOffset:Math.random()*Math.PI*2, facing:Math.random()<0.5?-1:1,
        stateTimer:60+Math.floor(Math.random()*80), state:'walk', groundTop, groundBottom, bubbleTimer:null};
      setState(bunny,'walk');
      _bunnyChars.push(bunny);
    }

    if(bunniesData.length>12){
      const more=document.createElement('div'); more.className='bunny-extra';
      more.style.cssText='position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.85);border-radius:10px;padding:3px 10px;font-size:11px;font-weight:700;color:#5D4037;z-index:100';
      more.textContent=`+${bunniesData.length-12}마리 더!`;
      playground.appendChild(more);
    }
    const colors=bunniesData.map(b=>b.color).join(',');
    const decoCount=(_myBunny?.decorations||[]).length;
    _lastSpawnedKey=`${bunniesData.length}_${colors}_${stage.id}_${decoCount}`;
    if(!document.getElementById('bunnyAnimStyle')){
      const style=document.createElement('style'); style.id='bunnyAnimStyle';
      style.textContent=`@keyframes zzz{0%{opacity:0;transform:translateY(0)}50%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}@keyframes stageUpFade{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes flashFade{0%{opacity:1}100%{opacity:0}}@keyframes sproutGrow{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.4) rotate(10deg)}100%{transform:scale(1) rotate(0)}}@keyframes carLtr{0%{left:-40px}100%{left:calc(100% + 40px)}}@keyframes carRtl{0%{right:-40px}100%{right:calc(100% + 40px)}}@keyframes itemUse{0%{transform:translate(-50%,-50%) scale(0) rotate(-180deg);opacity:0}15%{transform:translate(-50%,-50%) scale(1.4) rotate(0);opacity:1}70%{transform:translate(-50%,-50%) scale(1.1) rotate(0);opacity:1}100%{transform:translate(-50%,-50%) scale(.6) rotate(360deg);opacity:0}}@keyframes heartFloat{0%{transform:translateX(-50%) translateY(0);opacity:0}20%{opacity:1}100%{transform:translateX(-50%) translateY(-50px);opacity:0}}`;
      document.head.appendChild(style);
    }
    startBunnyAnim();
  }

  function showBunnyMsg(idx){
    const b=_bunnyChars[idx]; if(!b) return;
    const bubble=b.el.querySelector('.msg-bubble'); if(!bubble) return;
    bubble.textContent=`${b.name}: ${getRandomBunnyMsg()}`;
    bubble.style.transform=`translateX(-50%) scaleX(${b.facing})`;
    bubble.style.display='block';
    clearTimeout(b.bubbleTimer);
    b.bubbleTimer=setTimeout(()=>{bubble.style.display='none';},3500);
  }
  function setState(b,newState){
    b.state=newState;
    const grass=b.el.querySelector('.bunny-grass'),zzz=b.el.querySelector('.bunny-zzz'),svg=b.el.querySelector('.bunny-svg');
    if(grass) grass.style.display=newState==='eat'?'block':'none';
    if(zzz) zzz.style.display=newState==='rest'?'block':'none';
    let mood='normal'; if(newState==='rest') mood='sleep'; else if(newState==='eat') mood='happy';
    if(svg) svg.innerHTML=bunnySvg(b.color,mood,b.withMask);
    if(newState==='walk'){b.vx=(Math.random()<0.5?-1:1)*(0.4+Math.random()*0.4); b.facing=b.vx>0?1:-1;}
    else if(newState==='run'){b.vx=(Math.random()<0.5?-1:1)*(1.4+Math.random()*0.6); b.facing=b.vx>0?1:-1;}
    else b.vx=0;
  }
  function startBunnyAnim(){
    if(_animLoop){clearInterval(_animLoop); _animLoop=null;}
    let frame=0;
    _animLoop=setInterval(()=>{
      frame++;
      const playground=document.getElementById('bunnyPlayground');
      if(!playground){clearInterval(_animLoop); _animLoop=null; return;}
      const w=playground.offsetWidth||320;
      _bunnyChars.forEach((b)=>{
        b.stateTimer--;
        if(b.stateTimer<=0){
          const r=Math.random(); let newState;
          if(r<0.40) newState='walk'; else if(r<0.60) newState='eat'; else if(r<0.75) newState='look'; else if(r<0.88) newState='rest'; else newState='run';
          setState(b,newState); b.stateTimer=70+Math.floor(Math.random()*110);
        }
        let yOffset=0,extraTransform='';
        if(b.state==='walk'){b.x+=b.vx; yOffset=Math.abs(Math.sin(frame*0.18+b.hopOffset))*8;}
        else if(b.state==='run'){b.x+=b.vx; yOffset=Math.abs(Math.sin(frame*0.32+b.hopOffset))*16;}
        else if(b.state==='eat') extraTransform=` rotate(${Math.sin(frame*0.4)*1.5}deg)`;
        else if(b.state==='rest') yOffset=Math.sin(frame*0.08)*1.5;
        else if(b.state==='look') yOffset=Math.sin(frame*0.1)*1;
        if(b.x<5){b.x=5; if(b.vx!==0){b.vx=Math.abs(b.vx); b.facing=1;}}
        if(b.x>w-65){b.x=w-65; if(b.vx!==0){b.vx=-Math.abs(b.vx); b.facing=-1;}}
        b.el.style.left=b.x+'px'; b.el.style.top=(b.y-yOffset)+'px';
        b.el.style.transform=`scaleX(${b.facing})`+extraTransform;
        const bubble=b.el.querySelector('.msg-bubble');
        if(bubble&&bubble.style.display==='block') bubble.style.transform=`translateX(-50%) scaleX(${b.facing})`;
      });
    },50);
  }
  function bigJump(idx){
    const b=_bunnyChars[idx]; if(!b) return;
    const el=b.el;
    el.style.transition='transform .35s cubic-bezier(.5,2,.3,.8)';
    el.style.transform=`scaleX(${b.facing}) translateY(-25px) scale(1.2)`;
    const svg=el.querySelector('.bunny-svg');
    if(svg) svg.innerHTML=bunnySvg(b.color,'happy',b.withMask);
    setTimeout(()=>{
      el.style.transition='transform .25s';
      el.style.transform=`scaleX(${b.facing}) scale(1)`;
      setTimeout(()=>{
        el.style.transition='';
        if(svg&&b.state!=='eat'&&b.state!=='rest') svg.innerHTML=bunnySvg(b.color,'normal',b.withMask);
      },250);
    },350);
  }

  function showStageUp(stage){
    const imp=getImpact(_myCo2);
    const old=document.getElementById('ovStageUp'); if(old) old.remove();
    const modal=document.createElement('div'); modal.id='ovStageUp';
    modal.style.cssText=`position:fixed;inset:0;background:${stage.bg};z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 20px;animation:stageUpFade .8s ease-out;overflow-y:auto`;
    modal.innerHTML=`
      <div style="text-align:center;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.3);max-width:340px">
        <div style="font-size:11px;font-weight:700;letter-spacing:3px;opacity:.85">STAGE ${stage.id+1}/5 도달</div>
        <div style="font-size:32px;font-weight:900;margin-top:8px">${stage.name}</div>
        <div style="font-size:15px;margin-top:14px;font-weight:700">"${stage.msg}"</div>
        <div style="font-size:12px;margin-top:6px;opacity:.9">${stage.sub}</div>
      </div>
      <div style="background:rgba(255,255,255,.95);border-radius:18px;padding:18px;margin-top:24px;width:100%;max-width:340px;box-shadow:0 10px 30px rgba(0,0,0,.3)">
        <div style="font-size:10px;color:#1a6b3a;font-weight:700;letter-spacing:2px;text-align:center;margin-bottom:12px">💚 당신이 만든 진짜 변화</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🌳</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.trees}그루</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🚗</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.carKm}km</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">☕</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.cups}개</div></div>
          <div style="background:#f0fbf4;border-radius:10px;padding:10px;text-align:center"><div style="font-size:24px">🐰</div><div style="font-weight:900;color:#1B5E20;margin-top:2px">${imp.sqm}평</div></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:20px;width:100%;max-width:340px">
        <button onclick="shareCurrentBunny()" style="flex:1;background:#fff;border:none;border-radius:14px;padding:14px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;color:#C44569">📸 인증 공유</button>
        <button onclick="document.getElementById('ovStageUp').remove()" style="flex:1;background:rgba(0,0,0,.4);border:1.5px solid rgba(255,255,255,.3);color:#fff;border-radius:14px;padding:14px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">계속하기</button>
      </div>`;
    document.body.appendChild(modal);
  }

  window.shareCurrentBunny=async function(){
    const stage=getStage(_myCo2); const imp=getImpact(_myCo2);
    const bunnies=_myBunny?.bunnies||[];
    const text=`🐰 EcoQuest — 우리 토끼 가족 ${bunnies.length}마리!
✨ STAGE ${stage.id+1}/5 ${stage.name} · CO₂ ${_myCo2.toFixed(1)}kg

💚 내가 만든 임팩트:
🌳 나무 ${imp.trees}그루 분량
🚗 자동차 ${imp.carKm}km 안 탄 효과
☕ 일회용컵 ${imp.cups}개 안 만든 효과

"${stage.msg}"

#에코퀘스트 #EcoQuest #환경챌린지 #제로웨이스트
https://eco-quest.kr`;
    try{
      if(navigator.share) await navigator.share({title:`EcoQuest`,text,url:'https://eco-quest.kr'});
      else{await navigator.clipboard.writeText(text); window.toast('📋 복사됨! SNS에 붙여넣기!');}
    }catch(e){console.log('공유 취소');}
  };

  window.petBunny=async function(){
    if(!_myBunny) return;
    if(Date.now()-_petTimer<800) return;
    _petTimer=Date.now();
    _myBunny.happiness=Math.min(100,(_myBunny.happiness||0)+1);
    await saveBunny();
  };

  // ═══ 외부 (shop)에서 호출 ═══
  // 인벤토리에 추가
  window._bunnyAddInventory=async function(item){
    if(!_myBunny) return;
    if(!_myBunny.inventory) _myBunny.inventory={};
    if(!_myBunny.inventory[item.id]){
      _myBunny.inventory[item.id]={count:0, emoji:item.emoji, name:item.name, happiness:item.happiness||0};
    }
    _myBunny.inventory[item.id].count++;
    await saveBunny();
  };
  // 영구 데코 추가 (꾸미기)
  window._bunnyAddDecoration=async function(deco){
    if(!_myBunny) return;
    if(!_myBunny.decorations) _myBunny.decorations=[];
    _myBunny.decorations.push(deco);
    await saveBunny();
  };

  function hookSaveMission(){
    if(window._bunnyHookedSaveMission) return;
    const orig=window.saveMission;
    if(typeof orig!=="function"){setTimeout(hookSaveMission,1000); return;}
    window.saveMission=async function(uid,m){
      const res=await orig(uid,m);
      if(res&&uid===window.ME?.uid&&_myBunny) setTimeout(()=>refreshAndUpdate(),1500);
      return res;
    };
    window._bunnyHookedSaveMission=true;
  }
  function hookJoinGathering(){
    if(window._bunnyHookedJoinGathering) return;
    const orig=window.joinGathering;
    if(typeof orig!=="function"){setTimeout(hookJoinGathering,1000); return;}
    window.joinGathering=async function(gid){
      await orig(gid);
      if(_myBunny) setTimeout(()=>refreshAndUpdate(),1500);
    };
    window._bunnyHookedJoinGathering=true;
  }

  function changeTabIcon(){
    const tryIt=()=>{
      const tabs=document.querySelectorAll('.tb'); if(!tabs.length) return false;
      let found=false;
      tabs.forEach(tab=>{
        if(tab.dataset.page==='map'){
          const ic=tab.querySelector('.ic'); if(ic) ic.textContent='🌍';
          for(const node of tab.childNodes){if(node.nodeType===3&&node.textContent.trim()){node.textContent='지구'; break;}}
          found=true;
        }
      });
      return found;
    };
    if(!tryIt()){let attempts=0; const interval=setInterval(()=>{attempts++; if(tryIt()||attempts>10) clearInterval(interval);},500);}
  }

  function boot(){
    if(!window.FB){setTimeout(boot,500); return;}
    initBunnyOnMap();
    hookSaveMission();
    hookJoinGathering();
    changeTabIcon();
    fetchAirQuality();
    setInterval(fetchAirQuality,30*60*1000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,1500));
  else setTimeout(boot,1500);

})();
