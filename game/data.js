/* 기존 Firebase 프로젝트 읽기. 서버가 검증한 인증만 기록하며 클라이언트는 포인트를 쓰지 않습니다. */
const CONFIG={apiKey:'AIzaSyAMpLdwkyXS1usudjbkI7BcyjvbY8VZzxY',authDomain:'ecoquest-c6380.firebaseapp.com',projectId:'ecoquest-c6380',storageBucket:'ecoquest-c6380.firebasestorage.app',messagingSenderId:'403119608388',appId:'1:403119608388:web:6ab39c611d0df9a81ea211'};
let auth,db,F,A,ready=false,user=null,profile=null,initPromise;
const listeners=new Set();const emit=()=>listeners.forEach(f=>f({user,profile,ready}));
export function observeSession(fn){listeners.add(fn);fn({user,profile,ready});return()=>listeners.delete(fn)}
export async function initializeSession(){if(initPromise)return initPromise;initPromise=(async()=>{try{
 const fa=await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js');
 A=await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js');
 F=await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
 const app=fa.getApps().length?fa.getApps()[0]:fa.initializeApp(CONFIG);auth=A.getAuth(app);db=F.getFirestore(app);
 A.onAuthStateChanged(auth,async next=>{user=next;profile=null;if(user){try{profile=await fetchProfile()}catch(e){console.warn('회원 읽기 실패',e);}}ready=true;emit()});
 }catch(e){ready=true;emit();console.warn('Firebase 연결 불가: 체험 모드로 계속 진행',e)}})();return initPromise}
export async function login(){if(!auth){await initializeSession();if(!auth)throw Error('로그인 모듈 연결에 실패했습니다')}return A.signInWithPopup(auth,new A.GoogleAuthProvider())}
export async function logout(){if(auth)await A.signOut(auth)}
export async function fetchProfile(){if(!user||!db)return null;const s=await F.getDoc(F.doc(db,'users',user.uid));profile=s.exists()?s.data():null;emit();return profile}
export function getSession(){return{user,profile,ready}}
export async function loadMyRecords(){if(!user||!db)return [];const q=F.query(F.collection(db,'missionLogs'),F.where('uid','==',user.uid),F.limit(100));const s=await F.getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))}
export async function getGlobal(){if(!db)return null;const d=await F.getDoc(F.doc(db,'stats','global'));return d.exists()?d.data():null}
export async function submitVerifiedMission(missionId,imageBase64){if(!user)throw Error('로그인이 필요해요');let token=await user.getIdToken();let response=await fetch('/api/pposong-verify',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({missionId,imageBase64})});let data=await response.json().catch(()=>({error:'서버 응답을 읽을 수 없어요'}));if(!response.ok)throw Error(data.error||data.comment||'인증 실패');await fetchProfile();return data}
/* 접속 기능은 보안 규칙이 배포된 뒤에만 사용. 허락 없이 저장하지 않습니다. */
let timer=null,unsub=null,activePlanet=null,lastPresenceUpdate=0;
export async function enterSharedPlanet(planet,onTravelers,{publishStats=false}={}){
 if(!user||!db)throw Error('로그인이 필요해요');await exitSharedPlanet();activePlanet=planet;const me=F.doc(db,'pposongPresence',user.uid);
 const write=()=>F.setDoc(me,{visible:true,planet,displayName:(profile?.nickname||user.displayName||'여행자').slice(0,20),avatar:'bunny',x:0,z:0,missionCount:publishStats?Number(profile?.missionCount||0):null,estimatedCo2:publishStats?Number(profile?.co2||0):null,updatedAt:F.serverTimestamp()},{merge:false});
 await write();timer=setInterval(()=>write().catch(console.warn),15000);
 const q=F.query(F.collection(db,'pposongPresence'),F.where('visible','==',true),F.where('planet','==',planet),F.limit(40));
 unsub=F.onSnapshot(q,s=>{const t=Date.now()/1000;const people=s.docs.filter(d=>d.id!==user.uid).map(d=>({uid:d.id,...d.data()})).filter(x=>t-(x.updatedAt?.seconds||0)<55);onTravelers(people)},e=>onTravelers([],e));return true}
export async function updateSharedPosition(x,z){if(!activePlanet||!user||!db||Date.now()-lastPresenceUpdate<4500)return;lastPresenceUpdate=Date.now();try{await F.updateDoc(F.doc(db,'pposongPresence',user.uid),{x:Math.max(-100000,Math.min(100000,Number(x)||0)),z:Math.max(-100000,Math.min(100000,Number(z)||0)),updatedAt:F.serverTimestamp()})}catch(e){console.warn('위치 전송 실패',e)}}
export async function exitSharedPlanet(){activePlanet=null;if(timer){clearInterval(timer);timer=null}if(unsub){unsub();unsub=null}if(user&&db){try{await F.deleteDoc(F.doc(db,'pposongPresence',user.uid))}catch(e){console.warn('여행자 공개 해제 실패',e)}}}
