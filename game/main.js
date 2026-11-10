import {showEcoGames,loadEcoProgress} from './play.js';
import {COLLECT,DECOR,loadBag,saveBag,findDecor,canCraft,craft,collect,awardVerified} from './items.js';
import {WorldEngine,WORLDS} from './engine.js';
import {MISSIONS} from './missions.js';
import {initializeSession,observeSession,login,logout,fetchProfile,loadMyRecords,getGlobal,submitVerifiedMission,getSession,enterSharedPlanet,exitSharedPlanet,updateSharedPosition} from './data.js';
const el=id=>document.getElementById(id),safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let bag=loadBag(null),bagUID=null;
function currentBagUid(){return getSession().user?.uid||null}
function storeBag(){saveBag(bagUID,bag)}
function syncBag(){const uid=currentBagUid();if(uid!==bagUID){bagUID=uid;bag=loadBag(uid)}if(engine){engine.setCollectedKeys(bag.collected);engine.setHomeDecor(bag.placed)}}
let activeMission=null,nearStation=null,share=false,publishStats=false,worldMode='orbit',panelKind='',toastTimer=null,audio=null,recordCache=[],travelers=[];
function notify(msg){const o=el('toast');o.textContent=msg;o.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>o.classList.remove('show'),3300)}
function status(txt){notify(txt)}
function modeChanged(mode,world){worldMode=mode;el('world').classList.toggle('landed',mode==='land');el('location').textContent=mode==='land'?`${world.name} · ${world.detail}`:mode==='approach'?`${world.name} · 접근 중`:'말없이 떠다니는 우주';el('approach').hidden=mode!=='approach';el('orbitBtn').hidden=mode!=='land';el('sitBtn').hidden=mode!=='land';el('nearBtn').hidden=true;el('touchPad').style.display=mode==='land'?'grid':'none';nearStation=null;el('leftTips').textContent=mode==='land'?`${world.detail} · 어디까지든 천천히 걸어가요.\nWASD·방향키 산책 · 바닥 클릭 이동 · 드래그 회전`: '마우스 드래그 · 우주 둘러보기  |  휠 · 확대/축소  |  행성 클릭 · 접근';if(mode==='approach'){el('planetName').textContent=world.name;el('planetInfo').textContent=world.detail}if(mode==='land'){syncBag();engine?.setVisitors([]);exitSharedPlanet();share=false;if(panelKind==='friends')renderFriends()}else{engine?.setVisitors([]);exitSharedPlanet();share=false}}
let engine;try{engine=new WorldEngine(el('game'),{onMode:modeChanged,onStatus:status,onNearby:station=>{nearStation=station;el('nearBtn').hidden=!station;el('nearBtn').textContent=station?.kind==='collect'?'✨ 줍기':station?.kind==='play'?'🎮 환경놀이 시작':'📷 장소 살펴보기';if(station)notify(station.kind==='play'?'🎮 이곳에서 환경놀이를 할 수 있어요.':station.kind==='collect'?'✨ 반짝이는 물건이에요. 가까이서 살펴보세요.':station.kind==='mission'?`📷 ${station.missionName||'작은 실천'} 장소예요.`:'작은 장소에 도착했어요.')},onPosition(p){if(share)updateSharedPosition(p.x,p.z)}})}catch(e){console.error(e);notify('3D 시작 오류: '+e.message)}
function showPanel(kind,title,subtitle='뽀송별'){panelKind=kind;el('panel').hidden=false;el('panelTitle').textContent=title;el('panelSubtitle').textContent=subtitle;el('panelBody').replaceChildren();}
function closePanel(){panelKind='';el('panel').hidden=true}
function makeButton(label,cb,{className='item',disabled=false}={}){const b=document.createElement('button');b.type='button';b.className=className;b.textContent=label;b.disabled=disabled;b.addEventListener('click',cb);return b}
function makeParagraph(text,cls='subtext'){const p=document.createElement('p');p.className=cls;p.textContent=text;return p}
function makeElement(tag,cls,txt){const e=document.createElement(tag);e.className=cls||'';e.textContent=txt||'';return e}
function buttonMissions(filterWorld=null){showPanel('quests','작은 실천들',filterWorld?WORLDS.find(x=>x.id===filterWorld).name:'40개의 작은 실천');const box=el('panelBody');box.append(makeParagraph('원할 때만 해도 괜찮아요. 미션에 성공하면 기록과 추정 CO₂ 수치가 쌓여요.'));
const row=makeElement('div','row');row.append(makeButton('전체 40개',()=>buttonMissions(null),{className:'pill'}));WORLDS.forEach(w=>row.append(makeButton(w.name,()=>buttonMissions(w.id),{className:'pill'})));box.append(row);
const list=makeElement('div','group');const items=filterWorld?MISSIONS.filter(m=>m.planet===filterWorld):MISSIONS;items.forEach(m=>{const b=document.createElement('button');b.className='item';const head=makeElement('strong','',`${m.emoji} ${m.name}`),sub=makeElement('small','',`${WORLDS.find(w=>w.id===m.planet).name} · 추정 ${m.estimatedCo2}kg CO₂`);b.append(head,sub);b.addEventListener('click',()=>selectMission(m));list.append(b)});box.append(list);}
function selectMission(m){
 activeMission=m;
 const world=WORLDS.find(w=>w.id===m.planet);
 showPanel('mission',`${m.emoji} ${m.name}`,world.name);
 const box=el('panelBody');
 box.append(makeParagraph('이 미션은 '+world.name+'의 작은 카메라 장소에서 진행할 수 있어요. 마음이 내킬 때 천천히 찾아가요.'));
 box.append(makeParagraph('📸 사진에서 보일 내용: '+m.keywords,'status'));
 const here=engine?.mode==='land'&&engine.world.id===m.planet;
 const atPlace=here&&nearStation?.missionId===m.id;
 if(!atPlace){
  if(here){
   const station=engine.stations.find(s=>s.missionId===m.id);
   if(station)box.append(makeButton('🚶 카메라 장소로 산책하기',()=>{engine.destination={x:station.x+1.3,z:station.z+.3};engine.avatar.sit=false;closePanel();notify('토끼가 카메라 장소를 향해 걸어가요. 도착하면 장소 살펴보기를 눌러 주세요.')},{className:'primary'}));
  }else{
   box.append(makeButton('🪐 '+world.name+'로 여행하기',()=>{closePanel();engine.setOrbit();engine.approach(WORLDS.findIndex(w=>w.id===m.planet));notify('착륙한 뒤 이 별의 카메라를 찾아가요.')},{className:'primary'}));
  }
  box.append(makeParagraph('게임 화면에서 실제 카메라 장소에 도착하기 전에는 인증이 열리지 않아요.','note'));
  return;
 }
 const session=getSession();
 if(!session.user)box.append(makeParagraph('기록을 저장하려면 기존 계정으로 로그인해 주세요.'));
 box.append(makeButton(session.user?'📷 여기서 AI 사진 인증하기':'🔐 로그인 후 인증하기',async()=>{
  if(!getSession().user){try{await login()}catch(e){notify('로그인 실패: '+e.message)}return}
  el('photo').click();
 },{className:'primary'}));
 box.append(makeParagraph('사진 검증에 성공한 기록만 서버에서 저장하며, 클라이언트는 포인트를 직접 바꾸지 않아요.','note'));
}

function openStation(){if(!nearStation)return;const {kind}=nearStation;if(kind==='collect'){const st=nearStation;if(engine.collectNearby(st.collectKey)){const gained=collect(bag,st.collectKey,st.collectType);if(gained){storeBag();notify(`${gained.emoji} ${gained.name}을(를) 가방에 넣었어요!`);renderBag();}}return;}if(kind==='play'){openEcoPlay();return;}if(kind==='mission'){const m=MISSIONS.find(m=>m.id===nearStation.missionId);if(m)selectMission(m);else buttonMissions(engine.world.id)}else if(kind==='record')renderRecords();else renderShop()}
function number(n){return (Number(n)||0).toLocaleString('ko-KR')}
function stats(){const d=getSession().profile||{};el('missionNumber').textContent=`🌱 ${number(d.missionCount)}회`;el('co2Number').textContent=`약 ${Number(d.co2||0).toFixed(2)}kg CO₂`;const count=Number(d.missionCount||0);if(engine)engine.setHealing(count);document.documentElement.style.setProperty('--earth-heal',Math.min(1,count/150).toFixed(2));}
function renderBag(){
 syncBag();showPanel('bag','나의 작은 가방','산책하며 발견한 것들');const b=el('panelBody');
 b.append(makeParagraph('✨ 반짝이는 물건 가까이에 가서 ‘줍기’를 눌러보세요. 별마다 다른 수집품이 있어요.'));
 const list=makeElement('div','group');b.append(list);
 for(const item of Object.values(COLLECT)){const row=makeElement('div','item');row.append(makeElement('strong','',`${item.emoji} ${item.name} × ${bag.materials[item.id]||0}`),makeElement('small','',item.description));list.append(row)}
 b.append(makeParagraph(`꾸미기 아이템 ${bag.owned.length}개 · 내 쉼터에 설치 ${bag.placed.length}개`, 'status'));
 b.append(makeButton('🏡 내 쉼터 꾸미러 가기',renderHome,{className:'primary'}));
 b.append(makeParagraph('가방은 이 브라우저에 저장되는 장식용 데이터입니다. 다른 기기와 자동 동기화되지 않고, 기존 포인트와 무관해요.','note'));
}
function renderHome(){
 syncBag();showPanel('home','나만의 작은 쉼터','원할 때 천천히 꾸며요');const b=el('panelBody');
 b.append(makeParagraph('별에 착륙하면 시작 지점 근처에 내 꾸미기 소품이 3D로 나타나요. 최대 6개까지 놓을 수 있어요.'));
 const items=makeElement('div','group');b.append(items);
 for(const d of DECOR){
  const box=makeElement('div','item');box.append(makeElement('strong','',`${d.emoji} ${d.name}`),makeElement('small','',d.desc));
  if(d.kind==='explore')box.append(makeElement('small','',`재료: ${Object.entries(d.cost).map(([k,v])=>`${Object.values(COLLECT).find(i=>i.id===k)?.emoji||'✦'} ${v}`).join(' · ')}`));
  else box.append(makeElement('small','','환경미션 AI 인증 성공으로 얻는 아이템'));
  const owned=bag.owned.includes(d.id),placed=bag.placed.includes(d.id);
  if(owned)box.append(makeButton(placed?'↩️ 쉼터에서 치우기':'🏡 쉼터에 놓기',()=>{
   if(placed)bag.placed=bag.placed.filter(id=>id!==d.id);
   else if(bag.placed.length<6)bag.placed.push(d.id);
   else {notify('쉼터에는 여섯 개까지만 놓을 수 있어요.');return}
   storeBag();engine?.setHomeDecor(bag.placed);renderHome();
  },{className:'pill'}));
  else if(d.kind==='explore')box.append(makeButton('✨ 재료로 만들기',()=>{if(craft(bag,d)){storeBag();notify(d.name+' 완성!');renderHome()}},{className:'pill',disabled:!canCraft(bag,d)}));
  else box.append(makeParagraph('🔒 실천 인증을 통해 발견할 수 있어요.','note'));
  items.append(box);
 }
 b.append(makeParagraph('실제 환경 포인트 차감 없음 · 장식 아이템은 이 기기에서만 보관','note'));
}

function openEcoPlay(worldId=engine?.mode==='land'?engine.world.id:null){
 showEcoGames({worldId,worlds:WORLDS,showPanel,closePanel,el,notify,makeButton,makeParagraph});
}

function renderRecords(){showPanel('records','내 별빛 기록','작은 실천이 쌓이는 곳');const s=getSession(),p=s.profile||{},b=el('panelBody');if(!s.user){b.append(makeParagraph('기록을 보려면 로그인해 주세요.'),makeButton('Google로 로그인',()=>login().catch(e=>notify(e.message)),{className:'primary'}));return}b.append(makeParagraph(`지금까지 ${number(p.missionCount)}번의 실천을 기록했어요.`));b.append(makeElement('div','metric',`약 ${Number(p.co2||0).toFixed(2)}kg CO₂`));b.append(makeParagraph(`기존 포인트 잔액 ${number(p.point)}P (게임 내 추가 보상 없음)`));b.append(makeParagraph('아래는 최근 미션 기록이에요. 기존 인증 내역을 새로운 데이터로 초기화하지 않습니다.','note'));const list=makeElement('div','group');b.append(list);list.append(makeParagraph('기록을 불러오는 중…'));loadMyRecords().then(records=>{if(panelKind!=='records')return;recordCache=records;list.replaceChildren();if(!records.length)list.append(makeParagraph('아직 기록이 없어요.'));records.slice(0,40).forEach(r=>{const div=makeElement('div','item');div.append(makeElement('strong','',String(r.missionName||r.missionId||'작은 실천')),makeElement('small','',`${r.date||''} · 약 ${Number(r.co2||0).toFixed(2)}kg`));list.append(div)})}).catch(e=>list.replaceChildren(makeParagraph('기록을 읽지 못했어요: '+e.message)))}
function renderShop(){showPanel('shop','작은 별상점','기존 포인트를 보관하는 곳');const s=getSession(),b=el('panelBody');b.append(makeParagraph('기존에 가지고 있던 포인트와 주문 기록은 그대로 유지돼요. 새 게임에서는 미션 성공 보상을 별도로 주지 않아요.'));b.append(makeElement('div','metric',s.user?`${number(s.profile?.point)} P`:'로그인 필요'));b.append(makeParagraph('⚠️ 구매·결제·배송 기능은 아직 게임 안으로 옮기는 중이어서 이 화면에서는 결제가 실행되지 않아요. 잘못된 주문이나 포인트 차감을 막기 위한 조치예요.','status'));}
function renderFriends(){showPanel('friends','함께 머무는 별','원할 때만 서로 보여요');const b=el('panelBody');b.append(makeParagraph('같은 별에 온 여행자를 만날 수 있어요. 내가 공개를 켜지 않으면 다른 사람에게 보이지 않아요.'));if(worldMode!=='land'){b.append(makeParagraph('먼저 한 별에 착륙해 주세요.'));return}const s=getSession();if(!s.user){b.append(makeParagraph('실제 친구 만남은 로그인한 회원만 이용해요.'));return}const t=makeElement('label','opt');const chk=document.createElement('input');chk.type='checkbox';chk.checked=share;t.append(chk,document.createTextNode(' 다른 여행자에게 보이기'));b.append(t);const label=makeElement('label','opt');const statsChk=document.createElement('input');statsChk.type='checkbox';statsChk.checked=publishStats;label.append(statsChk,document.createTextNode(' 내 실천 횟수·추정 CO₂도 공개'));b.append(label);const list=makeElement('div','group');b.append(list);const draw=()=>{list.replaceChildren();if(!share){list.append(makeParagraph('공개를 켜야 여행자들을 볼 수 있어요.'));return}if(!travelers.length)list.append(makeParagraph('지금은 조용한 별이에요.'));travelers.forEach(t=>{const item=makeElement('div','item');item.append(makeElement('strong','',`${t.avatar==='bunny'?'🐰':'🌿'} ${String(t.displayName||'여행자').slice(0,20)}`));if(t.missionCount!==null&&t.missionCount!==undefined)item.append(makeElement('small','',`공개한 실천 ${number(t.missionCount)}회`));list.append(item)})};draw();chk.addEventListener('change',async()=>{try{share=chk.checked;if(share){await enterSharedPlanet(engine.world.id,(x,e)=>{travelers=x;engine.setVisitors(x);if(e)notify('친구 연결 설정을 확인해 주세요');if(panelKind==='friends')draw()},{publishStats});notify('이 별에서만 다른 여행자에게 보여요')}else{await exitSharedPlanet();travelers=[]}draw()}catch(e){share=false;chk.checked=false;notify('친구 기능 연결 실패: 권한 규칙을 확인해 주세요')}});statsChk.addEventListener('change',()=>{publishStats=statsChk.checked;if(share){share=false;exitSharedPlanet();notify('공개 설정을 변경했어요. 다시 켜 주세요.');chk.checked=false;draw()}})}
function renderGuide(){showPanel('guide','쉬어 가는 방법','게임 안내');const b=el('panelBody');['우주: 마우스 드래그로 둘러보고 휠로 확대·축소해요. 급하게 이동할 필요 없어요.','행성을 클릭하면 가까이 다가간 뒤, 착륙 버튼을 누를 수 있어요.','지상: WASD 또는 방향키로 걸어요. 바닥 클릭으로도 이동할 수 있어요.','별마다 다른 풍경이 있어요. 걸어가면 새로운 지형이 이어져요. Shift 키를 누르면 조금 빨리 걸을 수 있어요.','벤치 근처에서 앉기 버튼을 누르거나 그냥 가만히 있어도 돼요.','미션 40개는 각 행성의 작은 카메라 장소에 배치되어 있어요. 가까이 가서 장소 살펴보기를 누르세요.','사진 인증은 서버 검증을 통과한 경우에만 기록돼요. 확인 전에는 회원 기록을 변경하지 않아요.','반짝이는 수집품을 주워 가방에 모으고, 모은 재료로 내 쉼터를 꾸며보세요.','별놀이 🎮에서는 사진 없이 별 안에서 직접 환경 게임을 할 수 있어요. 게임 기록은 이 기기에만 저장되며 실제 CO₂와 포인트는 바꾸지 않아요.','아이템은 이 기기에만 저장되는 별도 꾸미기 기록입니다.'].forEach(t=>b.append(makeParagraph('✦ '+t)));if(getSession().user)b.append(makeButton('로그아웃',()=>logout().then(()=>notify('로그아웃 했어요')).catch(e=>notify(e.message)),{className:'quiet'}));}
let ac=null;function musicToggle(){if(audio){audio.close();audio=null;el('musicBtn').textContent='♫ 음악 켜기';return}try{const ctx=new AudioContext(),master=ctx.createGain();master.gain.value=.026;master.connect(ctx.destination);for(const hz of [174.61,220,261.63,349.23]){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=.16;o.connect(g);g.connect(master);o.start()}const slow=ctx.createOscillator(),l=ctx.createGain();slow.frequency.value=.08;l.gain.value=.012;slow.connect(l);l.connect(master.gain);slow.start();audio=ctx;el('musicBtn').textContent='♫ 음악 끄기'}catch(e){notify('이 브라우저는 음악 재생을 지원하지 않아요')}}
async function preparePhoto(file){if(!file)return null;if(!file.type.startsWith('image/'))throw Error('사진 파일만 사용할 수 있어요');if(file.size>12e6)throw Error('12MB 이하의 사진을 선택해 주세요');const bmp=await createImageBitmap(file),max=800,scale=Math.min(1,max/Math.max(bmp.width,bmp.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bmp.width*scale));canvas.height=Math.max(1,Math.round(bmp.height*scale));canvas.getContext('2d').drawImage(bmp,0,0,canvas.width,canvas.height);bmp.close();return canvas.toDataURL('image/jpeg',.77).split(',')[1]}
el('photo').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file||!activeMission)return;const mid=activeMission.id;showPanel('verifying','사진을 살펴보고 있어요','조용한 인증 시간');const box=el('panelBody');box.append(makeParagraph('사진에 실천 내용이 보이는지 AI가 확인하는 중이에요.'));try{const imageBase64=await preparePhoto(file);const response=await submitVerifiedMission(mid,imageBase64);const gift=awardVerified(bag,mid);if(gift)storeBag();box.replaceChildren(makeParagraph('🌿 오늘의 실천이 차곡차곡 기록됐어요.'));box.append(makeParagraph(`예상 CO₂ 회피량 약 ${Number(response.estimatedCo2||0).toFixed(2)}kg`));if(gift)box.append(makeParagraph(`${gift.emoji} 새 꾸미기 아이템: ${gift.name} (기기 내 가방에 저장)`));box.append(makeButton('산책 계속하기',closePanel,{className:'primary'}));stats();notify('초록지구별에 작은 빛이 더해졌어요.')}catch(err){box.replaceChildren(makeParagraph('인증을 마무리하지 못했어요. '+err.message),makeButton('다시 미션 보기',()=>selectMission(MISSIONS.find(m=>m.id===mid)),{className:'primary'}));notify('인증 결과를 확인해 주세요.')}});
el('start').onclick=()=>{el('welcome').hidden=true;el('game').focus();notify('가까이 가고 싶은 행성을 눌러 보세요')};el('landBtn').onclick=()=>{el('landBtn').disabled=true;el('landingFX').classList.add('show');setTimeout(()=>{engine.land();closePanel();el('landingFX').classList.remove('show');el('landBtn').disabled=false;notify('도착했어요. 천천히 둘러봐요.')},680)};el('backOrbit').onclick=()=>engine.setOrbit();el('orbitBtn').onclick=()=>{engine.setOrbit();closePanel()};el('sitBtn').onclick=()=>{engine.sit();el('sitBtn').textContent=engine.avatar.sit?'🌱 일어나기':'🪑 앉기'};el('nearBtn').onclick=openStation;el('musicBtn').onclick=musicToggle;el('panelClose').onclick=closePanel;el('loginBtn').onclick=()=>getSession().user?renderRecords():login().catch(e=>notify('로그인 실패: '+e.message));
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>({play:()=>openEcoPlay(),quests:()=>buttonMissions(worldMode==='land'?engine.world.id:null),bag:renderBag,home:renderHome,records:renderRecords,shop:renderShop,friends:renderFriends,guide:renderGuide}[b.dataset.panel]||renderGuide)());
document.querySelectorAll('[data-dir]').forEach(b=>{let step;const k=b.dataset.dir;const advance=()=>{if(engine.mode!=='land')return;const v=k==='w'?[0,-1]:k==='s'?[0,1]:k==='a'?[-1,0]:[1,0];engine.move(...v)};b.addEventListener('pointerdown',e=>{e.preventDefault();advance();step=setInterval(advance,90)});['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,()=>clearInterval(step)))});
observeSession(({user,profile,ready})=>{syncBag();el('loginBtn').textContent=user?(profile?.nickname||user.displayName||'내 기록'):'로그인';stats();if(user&&panelKind==='mission'&&activeMission)selectMission(activeMission)});
initializeSession().then(()=>{if(getSession().ready)stats()});
window.addEventListener('pagehide',()=>{exitSharedPlanet();if(audio)audio.close()});
