/* =====================================================
   EcoQuest – lang_patch.js  v3 (한국어 ↔ English 전체 UI)
   ─────────────────────────────────────────────────────
   • 우상단 EN/한 토글 · 브라우저 언어 자동 감지
   • 정확매칭 + 부분매칭 + 숫자/단위 패턴 → 거의 모든 한글 변환
   • 페이지 이동·동적 렌더 후 자동 재번역
   ★ 안 바뀌는 한글 보이면 DICT에 "한글":"English", 한 줄 추가!
   ===================================================== */
(function(){
  'use strict';
  if(window._eqLangLoaded) return;
  window._eqLangLoaded = true;

  const DICT = {
    // ── 탭/네비/헤더 ──
    "홈":"Home","챌린지":"Challenges","지도":"Map","내활동":"Activity","마이":"My","소속":"Team",
    "스토어":"Store","로그아웃":"Log out","가입":"Sign up","게스트":"Guest",
    "잠시만요...":"One moment...","← 뒤로":"← Back","← 앱으로":"← To app","새로고침":"Refresh",

    // ── 로그인 ──
    "작은 행동이 지구를 바꿔요":"Small actions change the Earth",
    "오늘의 환경 미션에 도전하세요!":"Take on today's eco missions!",
    "Google로 시작하기":"Continue with Google",
    "로그인하면 미션 기록이 저장되고":"Sign in to save your records",
    "전 세계 참여자와 함께할 수 있어요":"and join people worldwide",
    "가입 없이 시작":"Start without sign-up","가입 없이 바로보기":"Browse without sign-up",

    // ── 인트로 ──
    "하나라도 했나요?":"any of these?","오늘 이 중에":"Today, did you do",
    "탭 하나로 내 행동의 가치를 확인해요":"See the value of your action in one tap",
    "버스·지하철":"Bus·Subway","타고 왔어요":"I rode","점심에":"At lunch","채식 먹었어요":"ate veggie",
    "텀블러":"Tumbler","썼어요":"I used","걸어서":"On foot","이동했어요":"I traveled",
    "분리수거":"Recycling","했어요":"I did","음식":"Food","다 먹었어요":"finished it",
    "AI가 분석 중이에요...":"AI is analyzing...","행동 패턴 분석 중...":"Analyzing behavior...",
    "버스·지하철 탑승":"Took bus/subway","인증 완료!":"Verified!",
    "방금 절감한 CO₂":"CO₂ just saved","오늘 내 나무":"My tree today","기록 시작하기":"Start tracking",
    "소나무 한 그루가 하루 흡수하는 양이에요":"what a pine tree absorbs in a day",

    // ── 홈 ──
    "우리가 함께 지킨 지구":"The Earth we protect together",
    "지금까지 누적 CO₂ 절감량":"Total CO₂ saved so far",
    "작은 실천이 쌓여 지구가 숨쉬어요":"Small actions let the Earth breathe",
    "완료미션":"Missions","연속일수":"Streak","포인트":"Points","CO₂절감":"CO₂ saved",
    "다음 레벨":"Next level","오늘의 미션":"Today's missions","AI인증":"AI verify",
    "참여 중인 챌린지":"Active challenges","전체보기":"View all",
    "인증 피드":"Verification feed","로딩 중...":"Loading...","대기질 로딩 중...":"Loading air quality...",
    "참여 중인 챌린지가 없어요":"No active challenges",
    "챌린지에 참여하면 오늘의 미션이 여기 나타나요!":"Join a challenge to see today's missions here!",
    "챌린지 참여하기":"Join a challenge","내 환경 기여도":"My eco contribution",
    "이 정도의 효과예요":"here's the impact","대단한 실천가예요":"a true champion!",
    "좋은 시작이에요":"great start!","꾸준히 실천하고 있어요":"keeping it up!","지구 수호자예요":"an Earth guardian!",

    // ── 에코 스토리 ──
    "에코 스토리":"Eco Story","글쓰기":"Write","좋아요":"Like","댓글":"Comment",

    // ── 챌린지 ──
    "공식 챌린지":"Official challenges","방 챌린지":"Room challenges","방 만들기":"Create room",
    "입장":"Join","내 방":"My rooms","공개 방":"Public rooms","방 챌린지 페이백 구조":"Room payback structure",
    "달성":" done","공식챌린지":"Official","참여 중인 방이 없어요!":"No rooms joined!",
    "공개 방이 없어요!":"No public rooms!","참여하기":"Join","참여 중":"Joined",
    "인증 빈도":"Frequency","챌린지 기간":"Duration","완료 보상":"Rewards",
    "매일":"Daily","주 5일":"5x/wk","주 3일":"3x/wk","주 1일":"1x/wk",
    "오늘부터 시작!":"Start today!","인증하기":"Verify","오늘 인증완료":"Verified today",
    "이렇게 인증해 주세요":"How to verify","무료로 참여할 수 있어요":"is free to join",

    // ── 지도 ──
    "EcoQuest 숲":"EcoQuest Forest","우리가 함께 만든 탄소 절감 기록":"Our shared carbon savings",
    "총 참여자":"Participants","CO₂ 절감":"CO₂ saved","심은 나무":"Trees planted",
    "나무를 심는 중...":"Planting trees...","나무 성장 단계":"Tree growth stages",
    "씨앗":"Seed","새싹":"Sprout","나무":"Tree","큰나무":"Big tree","숲":"Forest","도토리":"Acorn",
    "내가 심은 나무":"My tree","첫 미션을 완료해봐요!":"Complete your first mission!",
    "미션을 완료할수록 나무가 자라요":"Your tree grows with each mission",
    "TOP 기여자":"Top contributors","소속 CO₂ 랭킹":"Team CO₂ ranking",
    "아직 기여자가 없어요!":"No contributors yet!","익명 지구지킴이":"Anonymous guardian",
    "아직 참여 기업이 없어요":"No participating companies yet",
    "기업 어드민으로 등록하면 여기 나타나요":"Register as a company admin to appear here",

    // ── 활동 ──
    "나무 그루":"Trees","완료 미션":"Missions done","CO₂ 절감량 계산 기준":"CO₂ calculation basis",
    "탭해서 보기":"Tap to view","주간 미션 현황":"Weekly missions","획득 뱃지":"Badges",
    "미션별 통계":"Mission stats","미션을 완료하면 여기 나타나요!":"Complete missions to see them here!",

    // ── 마이 ──
    "내 프로필":"My profile","스토어":"Store","증명서 발급":"Get certificate",
    "관리자 페이지 열기":"Open admin","내 포인트":"My points","구매하기":"Buy","포인트 부족":"Low points",

    // ── 소속 (회사) ──
    "기업 탄소배출 계산":"Company emissions","전기·가스 고지서 사진":"Photo of electricity/gas bills",
    "AI가 Scope 1·2 자동 산정":"AI auto-calculates Scope 1·2","내 소속":"My team",
    "소속이 없어요":"No team yet","받은 가입 코드를 입력해 참여하세요":"Enter the invite code you received to join",
    "내 출퇴근 등록":"Register my commute","우리 팀 하루 브이로그":"Our team's daily vlog",

    // ── AI 인증 모달 ──
    "미션 인증":"Verify mission","사진을 찍어 AI가 인증해요!":"Take a photo, AI verifies!",
    "사진을 찍거나 선택하세요":"Take or pick a photo","AI가 미션 완료를 확인해요":"AI checks completion",
    "AI 분석":"AI analyze","분석 중...":"Analyzing...",
    "AI가 사진을 분석하고 있어요...":"AI is analyzing your photo...","잠시만 기다려주세요!":"Please wait!",
    "몇 그루 심었나요?":"How many trees?","인증샷 공개 설정":"Photo visibility",
    "공개":"Public","나만 보기":"Private","비공개":"Private","한마디 남기기":"Leave a comment",
    "선택":"optional","취소":"Cancel","완료!":"Done!","닫기":"Close",

    // ── 온보딩 ──
    "EcoQuest 시작하기!":"Start EcoQuest!","닉네임":"Nickname","성별":"Gender","나이대":"Age",
    "지역":"Region","직업":"Job","남성":"Male","여성":"Female","기타":"Other",
    "자동차 보유":"Have a car","가구 형태":"Household","평소 환경에 관심 정도":"Eco interest level",
    "관심 환경 분야":"Eco interests","복수 선택":"multiple","시작하기!":"Start!","저장하기!":"Save!",
    "선택해주세요":"Please select","학생":"Student","직장인":"Worker","자영업":"Self-employed","주부":"Homemaker",
    "있음":"Yes","없음":"No","별로":"Low","보통":"Medium","관심많음":"High",

    // ── 미션 이름 ──
    "텀블러로 카페 이용하기":"Use a tumbler at cafes","대중교통 이용하기":"Use public transport",
    "채식 메뉴 선택하기":"Choose a veggie menu","불필요한 전등 끄기":"Turn off unused lights",
    "분리수거 완벽하게":"Recycle properly","장바구니 사용하기":"Use a shopping bag",
    "샤워 5분 이내로":"Shower under 5 min","자전거/도보 이동":"Bike or walk",
    "식물 물 주기":"Water plants","전자기기 절전 모드":"Device power-save",
    "줍깅 (쓰레기 줍기)":"Plogging (pick litter)","배달앱 일회용품 안 받기":"No delivery utensils",
    "용기내 챌린지":"BYO container","멀티탭 전원 끄기":"Turn off power strip",
    "음식 남김 없이 먹기":"Finish all your food","리필스테이션 이용":"Use a refill station",
    "비건/채식 식당 방문":"Visit a vegan restaurant","빨대 없이 음료 마시기":"Drink without a straw",
    "베란다 텃밭/식물 근황":"Balcony garden update","전자영수증 발급받기":"Get an e-receipt",
    "일회용컵 반환하기":"Return a single-use cup","무공해차 대여하기":"Rent a zero-emission car",
    "친환경제품 구매하기":"Buy eco products","고품질 재활용품 배출":"High-quality recycling",
    "폐휴대폰 반납하기":"Return an old phone","미래세대 실천행동":"Action for future generations",
    "나무 심기":"Plant a tree","베란다 태양광 설치":"Install balcony solar",
    "재생원료 제품 구매":"Buy recycled goods","개인용기 식품포장":"Pack food in own container",
    "자연물에 감사하기":"Give thanks to nature","자연 속 산책":"Walk in nature",
    "냉난방 온도 지키기":"Keep heating/cooling temp","음식물 쓰레기 제로":"Zero food waste",
    "지역 농산물 구매":"Buy local produce","빗물/재사용수 활용":"Use rain/reused water",
    "중고/나눔 이용하기":"Use secondhand/sharing","환경 지식 공유":"Share eco knowledge",
    "몸 건강 챙기기":"Take care of your health","이웃 나눔 실천":"Share with neighbors",
    "텀블러 사용하기":"Use a tumbler","채식 한 끼 먹기":"Eat one veggie meal","분리수거 하기":"Do recycling",

    // ── 공통 토스트/버튼 ──
    "로그인이 필요해요!":"Login required!","포인트가 부족해요!":"Not enough points!",
    "이미 참여 중인 챌린지예요!":"Already joined this challenge!","방 이름을 입력해주세요!":"Enter a room name!",
    "코드를 입력해주세요!":"Enter a code!","존재하지 않는 코드예요!":"Code does not exist!",
    "이미 참여 중인 방이에요!":"Already in this room!","닉네임을 입력해주세요!":"Enter a nickname!",
    "나이대를 선택해주세요!":"Select your age!","지역을 선택해주세요!":"Select your region!",
    "복사":"Copy","공유":"Share","저장":"Save","오늘 이미 인증했어요! 내일 또 도전해요":"Already verified today! Try again tomorrow",
    "챌린지 정보를 찾을 수 없어요":"Challenge not found","미션 정보를 찾을 수 없어요":"Mission not found",
    "책 가격":"Price","구매 후":"After purchase","방 이름":"Room name","챌린지 선택":"Pick challenge",
    "예치금":"Deposit","공개 설정":"Visibility","1주":"1wk","2주":"2wks","4주":"4wks",

    // ── 법적/관리자 ──
    "법적 고지":"Legal","개인정보처리방침":"Privacy Policy","이용약관":"Terms of Service",
    "EcoQuest 관리자":"EcoQuest Admin","주문":"Orders","회원":"Users","미션":"Missions","통계":"Stats",
    "전체 주문":"All orders","처리중":"Pending","완료":"Done","검색":"Search",
    "총 회원":"Total users","총 주문":"Total orders","총 CO₂ 절감":"Total CO₂ saved",
    "총 매출":"Revenue","미션 로그":"Mission logs","보유 포인트":"Points held","완료처리":"Mark done",

    // ── About ──
    "왜 만들었나요?":"Why we built it","어떻게 다른가요?":"How we're different",
    "데이터 철학":"Data philosophy","우리가 꿈꾸는 세상":"The world we dream of",
    "우리의 믿음":"Our belief","에코퀘스트코리아 유한회사":"EcoQuest Korea Ltd."
  };

  // 부분매칭용 키 (2글자+ 한글, 긴 것 우선)
  const PKEYS = Object.keys(DICT).filter(k=>/[가-힣]/.test(k) && k.length>=2).sort((a,b)=>b.length-a.length);

  // 숫자+단위 / 효과 문구 패턴
  function applyPatterns(s){
    return s
      .replace(/TV\s*([\d,\.]+)\s*시간 덜 본 효과/g,'like $1 hrs less TV')
      .replace(/자전거로\s*([\d,\.]+)\s*번 이동 효과/g,'like $1 bike rides')
      .replace(/에어컨\s*([\d,\.]+)\s*시간 덜 튼 효과/g,'like $1 hrs less AC')
      .replace(/일회용컵\s*([\d,\.]+)\s*안 쓴 효과/g,'like $1 fewer cups')
      .replace(/자동차\s*([\d,\.]+)\s*km 안 탄 효과/g,'like $1 km less driving')
      .replace(/나무\s*([\d,\.]+)\s*그루 심은 효과/g,'like planting $1 trees')
      .replace(/서울시민 평균 탄소\s*([\d,\.]+)\s*일치 절감/g,'$1 days of avg citizen carbon')
      .replace(/([\d,\.]+)\s*그루/g,'$1 trees')
      .replace(/([\d,\.]+)\s*마리/g,'$1')
      .replace(/([\d,\.]+)\s*명/g,'$1 people')
      .replace(/([\d,\.]+)\s*건/g,'$1')
      .replace(/([\d,\.]+)\s*회/g,'$1x')
      .replace(/([\d,\.]+)\s*개/g,'$1')
      .replace(/([\d,\.]+)\s*포인트/g,'$1 P')
      .replace(/([\d,\.]+)\s*점/g,'$1 pts')
      .replace(/(\d+)\s*분 전/g,'$1 min ago')
      .replace(/(\d+)\s*시간 전/g,'$1 hr ago')
      .replace(/(\d+)\s*일 전/g,'$1 days ago')
      .replace(/(\d+)\s*일 남음/g,'$1 days left')
      .replace(/게스트(\d+)/g,'Guest$1')
      .replace(/방금/g,'just now')
      .replace(/더!/g,' more!');
  }

  let lang = localStorage.getItem('eq_lang');
  if(!lang) lang = (navigator.language||'').toLowerCase().startsWith('ko') ? 'ko' : 'en';

  function tr(orig){
    const t=(orig||'').trim();
    if(!t || lang!=='en') return orig;
    if(DICT[t]) return orig.replace(t, DICT[t]);   // 1) 정확매칭
    let s = applyPatterns(orig);                    // 2) 숫자/단위 패턴
    for(const k of PKEYS){ if(s.indexOf(k)!==-1) s=s.split(k).join(DICT[k]); } // 3) 부분매칭
    return s;
  }

  function walk(root){
    if(!root) return;
    const wlk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
      if(!n.nodeValue||!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p=n.parentNode;
      if(p&&(p.tagName==='SCRIPT'||p.tagName==='STYLE'||p.id==='eqLangToggle')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const ns=[]; let n;
    while(n=wlk.nextNode()) ns.push(n);
    ns.forEach(node=>{
      if(node._eqOrig===undefined) node._eqOrig=node.nodeValue;
      node.nodeValue=(lang==='ko')?node._eqOrig:tr(node._eqOrig);
    });
    if(root.querySelectorAll) root.querySelectorAll('[placeholder]').forEach(el=>{
      if(el._eqPh===undefined) el._eqPh=el.getAttribute('placeholder')||'';
      el.setAttribute('placeholder',(lang==='ko')?el._eqPh:tr(el._eqPh));
    });
  }

  let _t=null;
  const obs=new MutationObserver(()=>{
    if(lang!=='en') return;
    clearTimeout(_t);
    _t=setTimeout(()=>{
      obs.disconnect();
      walk(document.body);
      obs.observe(document.body,{childList:true,subtree:true,characterData:true});
    },180);
  });

  function apply(){
    obs.disconnect();
    walk(document.body);
    if(lang==='en') obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  // 페이지 전환 후킹 → 전환마다 재번역
  function hookGoPage(){
    if(typeof window.goPage==='function' && !window.goPage._eqHooked){
      const orig=window.goPage;
      window.goPage=function(...a){ const r=orig.apply(this,a); setTimeout(apply,120); setTimeout(apply,600); return r; };
      window.goPage._eqHooked=true;
    } else if(typeof window.goPage!=='function'){ setTimeout(hookGoPage,800); }
  }

 function addToggle(){
    if(document.getElementById('eqLangToggle')) return;
    // ⚙️(openOnboardEdit) 버튼을 찾아 그 "앞"에 🌐 토글 삽입
    const gear = document.querySelector('button[onclick*="openOnboardEdit"]');
    if(!gear){ setTimeout(addToggle, 600); return; }   // 헤더 아직 안 그려졌으면 대기
    const b=document.createElement('button');
    b.id='eqLangToggle';
    b.title='한국어 / English';
    b.style.cssText='background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:4px 8px;color:#fff;font-size:14px;cursor:pointer;margin-right:2px;font-family:inherit;display:inline-flex;align-items:center;gap:3px';
    b.innerHTML=(lang==='ko')?'🌐<span style="font-size:10px;font-weight:800">EN</span>':'🌐<span style="font-size:10px;font-weight:800">한</span>';
    b.onclick=()=>{ lang=(lang==='ko')?'en':'ko'; localStorage.setItem('eq_lang',lang); b.innerHTML=(lang==='ko')?'🌐<span style="font-size:10px;font-weight:800">EN</span>':'🌐<span style="font-size:10px;font-weight:800">한</span>'; apply(); };
    gear.parentNode.insertBefore(b, gear);   // ⚙️ 바로 앞에
    document.documentElement.setAttribute('lang',lang);
  }

  function boot(){ addToggle(); apply(); hookGoPage(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1500));
  else setTimeout(boot,1500);

  console.log('[lang_patch v3] 로드됨, 언어:',lang,'· 사전',Object.keys(DICT).length,'· 부분매칭',PKEYS.length);
})();
