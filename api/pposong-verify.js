/** 새 뽀송별 전용 보안 인증: 미션/CO2 값은 서버 목록만 사용, Firebase Admin 트랜잭션으로 1일 1회 제한 */
import admin from 'firebase-admin';
import catalog from './mission-catalog.js';
function bootstrap(){if(admin.apps.length)return admin.app();let credential;if(process.env.FIREBASE_SERVICE_ACCOUNT_JSON){const obj=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);credential=admin.credential.cert(obj)}else{throw Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing')}return admin.initializeApp({credential})}
const error=(res,status,message)=>res.status(status).json({error:message});
const KST=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function parseReply(v){const t=v?.candidates?.[0]?.content?.parts?.[0]?.text||'';try{return JSON.parse(t)}catch{const m=t.match(/\{[\s\S]*?\}/);if(m){try{return JSON.parse(m[0])}catch{}}return null}}
export default async function handler(req,res){
 if(req.method!=='POST')return error(res,405,'POST 요청만 가능해요');
 if(!process.env.GEMINI_API_KEY||!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)return error(res,503,'인증 서버 설정이 아직 완료되지 않았어요');
 const {missionId,imageBase64}=req.body||{},mission=catalog.find(m=>m.id===missionId);
 if(!mission||typeof imageBase64!=='string'||imageBase64.length<128||imageBase64.length>650000||!/^[A-Za-z0-9+/=]+$/.test(imageBase64))return error(res,400,'미션 ID 또는 이미지 형식이 올바르지 않아요');
 const header=req.headers.authorization||'',token=header.startsWith('Bearer ')?header.slice(7):null;if(!token)return error(res,401,'로그인이 필요해요');
 let uid,db,F,day=KST(),userRef,claimRef;
 try{bootstrap();const u=await admin.auth().verifyIdToken(token,true);uid=u.uid;db=admin.firestore();F=admin.firestore.FieldValue;userRef=db.collection('users').doc(uid);claimRef=userRef.collection('dailyClaims').doc(day+'_'+mission.id);
 const [usr,claimed]=await Promise.all([userRef.get(),claimRef.get()]);if(!usr.exists)return error(res,403,'기존 회원 등록이 먼저 필요해요');if(claimed.exists)return error(res,409,'오늘 이 미션은 이미 인증했어요');
 const attempts=userRef.collection('verificationAttempts').doc(day);await db.runTransaction(async tx=>{const doc=await tx.get(attempts),n=doc.exists?Number(doc.get('count')||0):0;if(n>=12)throw Object.assign(new Error('오늘의 인증 요청 횟수를 초과했어요'),{status:429});tx.set(attempts,{count:n+1,updatedAt:F.serverTimestamp()},{merge:true})});
 }catch(e){console.error('auth/quota error',e.code||e.message);return error(res,e.status||401,e.status?e.message:'인증 상태 또는 서버 설정을 확인해 주세요')}
 const prompt=`당신은 실생활 환경 행동 사진을 엄격히 확인합니다. 사용자가 ${mission.name} 실천을 했다고 합니다. 관련 단서: ${mission.keywords}. 사진에서 실제 핵심 대상이 명백하게 보여야만 passed true. 무관한 이미지, 흐릿한 이미지, 빈 화면은 반드시 false. 사진만으로 행동을 보장할 수 없을 경우 보수적으로 판정. 출력은 JSON 객체만: {"passed":false,"comment":"간결한 한국어 판정 이유"}`;
 let result;try{const resp=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+encodeURIComponent(process.env.GEMINI_API_KEY),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt},{inline_data:{mime_type:'image/jpeg',data:imageBase64}}]}],generationConfig:{temperature:0.1,responseMimeType:'application/json'}})});if(!resp.ok)throw Error('AI verification '+resp.status);result=parseReply(await resp.json());if(result?.passed!==true)return error(res,422,result?.comment||'사진에서 미션 내용을 확인하지 못했어요')}catch(e){console.error(e);return error(res,502,'AI 분석 연결을 확인해 주세요. 기록은 저장되지 않았어요')}
 try{
  const logRef=db.collection('missionLogs').doc(),verifyRef=db.collection('verifications').doc(),globalRef=db.collection('stats').doc('global');
  await db.runTransaction(async tx=>{
   const [claim,userDoc]=await Promise.all([tx.get(claimRef),tx.get(userRef)]);
   if(claim.exists)throw Object.assign(new Error('이미 인증된 미션이에요'),{status:409});if(!userDoc.exists)throw Object.assign(new Error('회원 문서를 찾을 수 없어요'),{status:403});
   const u=userDoc.data(),cnt=Number(u.missionCount||0),co2=Number(u.co2||0),oldDone=Array.isArray(u.doneMissions)?u.doneMissions:[];
   tx.create(claimRef,{missionId:mission.id,date:day,verified:true,createdAt:F.serverTimestamp()});
   // 기존 포인트는 보존, 새 게임에서는 점수·보상 적립하지 않음
   tx.update(userRef,{missionCount:cnt+1,co2:Number((co2+mission.estimatedCo2).toFixed(3)),doneMissions:[...oldDone,mission.id],lastAt:F.serverTimestamp(),lastMissionDate:day});
   tx.set(logRef,{uid,missionId:mission.id,missionName:mission.name,co2:mission.estimatedCo2,point:0,source:'pposong',date:day,age:u.age||'',region:u.region||'',createdAt:F.serverTimestamp()});
   tx.set(verifyRef,{uid,missionId:mission.id,missionName:mission.name,missionEmoji:mission.emoji,isPublic:false,comment:'뽀송별에서 인증',thumb:'data:image/jpeg;base64,'+imageBase64,createdAt:F.serverTimestamp()});
   tx.set(globalRef,{totalCo2:F.increment(mission.estimatedCo2)},{merge:true});
  });
  res.status(200).json({ok:true,missionId:mission.id,estimatedCo2:mission.estimatedCo2,description:'기존 회원 기록에 저장했어요'});
 }catch(e){console.error('commit rejected',e.message);error(res,e.status||500,e.status?e.message:'저장이 완료되지 않았어요. 다시 확인해 주세요')}
}
