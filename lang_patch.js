/* =====================================================
   EcoQuest – lang_patch.js  (한국어 ↔ English 전체 UI 번역)
   ─────────────────────────────────────────────────────
   • 우상단 토글 (EN / 한) · 브라우저 언어 자동 감지
   • 화면 한글을 사전(DICT)대로 영어 치환 + 동적 화면 자동 재번역
   • "3그루 / 20.9kg / 5분 전" 같은 숫자+단위도 패턴으로 자동 변환
   ─────────────────────────────────────────────────────
   ★ 안 바뀌는 한글이 보이면 DICT에 "한글":"English", 한 줄 추가!
   ★ 로드 위치: <script> 목록 맨 끝 (지금 위치 OK)
   ===================================================== */
(function(){
  'use strict';
  if(window._eqLangLoaded) return;
  window._eqLangLoaded = true;

  /* =========== 한글 → English 사전 =========== */
  const DICT = {
    // ── 탭 / 네비 / 헤더 ──
    "홈":"Home","챌린지":"Challenges","지도":"Map","내활동":"Activity","마이":"My","소속":"Team","로그아웃":"Log out",
    "잠시만요...":"One moment...","← 뒤로":"← Back","← 앱으로":"← To app",

    // ── 로그인 ──
    "작은 행동이 지구를 바꿔요":"Small actions change the Earth",
    "오늘의 환경 미션에 도전하세요!":"Take on today's eco missions!",
    "Google로 시작하기":"Continue with Google",
    "로그인하면 미션 기록이 저장되고":"Sign in to save your records",
    "전 세계 참여자와 함께할 수 있어요 🌱":"and join people worldwide 🌱",

    // ── 인트로 ──
    "하나라도 했나요?":"any of these?","오늘 이 중에":"Today, did you do",
    "탭 하나로 내 행동의 가치를 확인해요":"See the value of your action in one tap",
    "버스·지하철":"Bus·Subway","타고 왔어요":"I rode","점심에":"At lunch","채식 먹었어요":"ate veggie",
    "텀블러":"Tumbler","썼어요":"I used","걸어서":"On foot","이동했어요":"I traveled",
    "분리수거":"Recycling","했어요":"I did","음식":"Food","다 먹었어요":"finished it",
    "구경만 할게요 →":"Just browsing →","일단 구경할게요 →":"Look around first →",
    "AI가 분석 중이에요...":"AI is analyzing...","행동 패턴 분석 중...":"Analyzing behavior...",
    "버스·지하철 탑승":"Took bus/subway","✅ 인증 완료!":"✅ Verified!",
    "방금 절감한 CO₂":"CO₂ just saved","오늘 내 나무":"My tree today","🌱 기록 시작하기":"🌱 Start tracking",
    "🌳 소나무 한 그루가 하루 흡수하는 양이에요":"🌳 What a pine tree absorbs in a day",

    // ── 홈 ──
    "🌍 우리가 함께 지킨 지구":"🌍 The Earth we protect together",
    "지금까지 누적 CO₂ 절감량":"Total CO₂ saved so far",
    "작은 실천이 쌓여 지구가 숨쉬어요 🌱":"Small actions let the Earth breathe 🌱",
    "완료미션":"Missions","연속일수":"Streak","포인트":"Points","CO₂절감":"CO₂ saved",
    "다음 레벨":"Next level","⚡ 오늘의 미션":"⚡ Today's missions","🤖 AI인증":"🤖 AI verify",
    "🏆 참여 중인 챌린지":"🏆 Active challenges","전체보기 ›":"View all ›","전체보기":"View all",
    "새로고침":"Refresh","📸 인증 피드":"📸 Verification feed","로딩 중...":"Loading...",
    "📡 대기질 로딩 중...":"📡 Loading air quality...",
    "참여 중인 챌린지가 없어요":"No active challenges",
    "챌린지에 참여하면 오늘의 미션이 여기 나타나요!":"Join a challenge to see today's missions here!",
    "챌린지 참여하기 🏆":"Join a challenge 🏆","챌린지 참여하기 🌱":"Join a challenge 🌱",
    "🏅 내 환경 기여도":"🏅 My eco contribution",

    // ── 챌린지 ──
    "🏅 공식 챌린지":"🏅 Official challenges","🔥 공식 챌린지":"🔥 Official challenges",
    "👥 방 챌린지":"👥 Room challenges","+ 방 만들기":"+ Create room","입장":"Join",
    "🏠 내 방":"🏠 My rooms","🌍 공개 방":"🌍 Public rooms",
    "👥 방 챌린지 페이백 구조":"👥 Room payback structure",
    "100% 달성":"100% complete","85% 이상":"85% or more","85% 미만":"under 85%","앱 수수료":"App fee",
    "공식챌린지":"Official","공식 챌린지":"Official challenge",
    "참여 중인 방이 없어요!":"No rooms joined!","공개 방이 없어요!":"No public rooms!",
    "참여하기":"Join","✅ 참여 중":"✅ Joined",

    // ── 지도 ──
    "🌍 EcoQuest 숲":"🌍 EcoQuest Forest","우리가 함께 만든 탄소 절감 기록":"Our shared carbon savings",
    "총 참여자":"Participants","CO₂ 절감":"CO₂ saved","심은 나무 🌳":"Trees planted 🌳",
    "나무를 심는 중...":"Planting trees...","🌱 나무 성장 단계":"🌱 Tree growth stages",
    "씨앗":"Seed","새싹":"Sprout","나무":"Tree","큰나무":"Big tree","숲":"Forest",
    "🌳 내가 심은 나무":"🌳 My tree","첫 미션을 완료해봐요!":"Complete your first mission!",
    "미션을 완료할수록 나무가 자라요":"Your tree grows with each mission",
    "🏆 TOP 기여자":"🏆 Top contributors","🏢소속 CO₂ 랭킹":"🏢 Team CO₂ ranking",
    "아직 기여자가 없어요!":"No contributors yet!",

    // ── 활동 ──
    "나무 그루":"Trees","완료 미션":"Missions done","📐 CO₂ 절감량 계산 기준":"📐 CO₂ calc basis",
    "탭해서 보기 ▾":"Tap to view ▾","📅 주간 미션 현황":"📅 Weekly missions",
    "🏅 획득 뱃지":"🏅 Badges","📊 미션별 통계":"📊 Mission stats",
    "미션을 완료하면 여기 나타나요!":"Complete missions to see them here!",
    "텀블러 사용":"Tumbler use","대중교통 이용":"Public transport","채식 한 끼":"One veggie meal",
    "자전거/도보":"Bike/Walk","줍깅":"Plogging","멀티탭 절전":"Power strip off",
    "샤워 5분":"5-min shower","음식 남김 없이":"No leftovers",

    // ── 마이 ──
    "내 프로필":"My profile","🛒 스토어":"🛒 Store","🏆 증명서 발급":"🏆 Get certificate",
    "🔐 관리자 페이지 열기":"🔐 Open admin","📦 스토어":"📦 Store","내 포인트:":"My points:",
    "구매하기 📚":"Buy 📚","포인트 부족":"Low points",

    // ── AI 인증 모달 ──
    "미션 인증":"Verify mission","사진을 찍어 AI가 인증해요!":"Take a photo, AI verifies!",
    "사진을 찍거나 선택하세요":"Take or pick a photo","AI가 미션 완료를 확인해요":"AI checks completion",
    "🤖 AI 분석":"🤖 AI analyze","🔍 분석 중...":"🔍 Analyzing...",
    "🤖 AI가 사진을 분석하고 있어요...":"🤖 AI is analyzing your photo...","잠시만 기다려주세요!":"Please wait!",
    "🌳 몇 그루 심었나요?":"🌳 How many trees?","📸 인증샷 공개 설정":"📸 Photo visibility",
    "🌍 공개":"🌍 Public","🔒 나만 보기":"🔒 Private","🔒 비공개":"🔒 Private",
    "💬 한마디 남기기 (선택)":"💬 Comment (optional)","취소":"Cancel","✅ 완료!":"✅ Done!","닫기":"Close",

    // ── 온보딩 ──
    "🌍 EcoQuest 시작하기!":"🌍 Start EcoQuest!","닉네임":"Nickname","성별":"Gender","나이대":"Age",
    "지역":"Region","직업":"Job","남성":"Male","여성":"Female","기타":"Other",
    "자동차 보유":"Have a car","가구 형태":"Household","평소 환경에 관심 정도":"Eco interest level",
    "관심 환경 분야 (복수 선택)":"Eco interests (multiple)","시작하기! 🌱":"Start! 🌱","저장하기! ✅":"Save! ✅",
    "선택해주세요":"Please select","🎓 학생":"🎓 Student","💼 직장인":"💼 Worker","🏪 자영업":"🏪 Self-employed",
    "🏠 주부":"🏠 Homemaker","🚗 있음":"🚗 Yes","🚶 없음":"🚶 No","1인":"1","2인":"2","3~4인":"3-4","5인+":"5+",
    "😐 별로":"😐 Low","🌱 보통":"🌱 Medium","🌍 관심많음":"🌍 High",

    // ── 미션 이름 (MISSIONS) ──
    "텀블러로 카페 이용하기":"Use a tumbler at cafes","대중교통 이용하기":"Use public transport",
    "채식 메뉴 선택하기":"Choose a veggie menu","불필요한 전등 끄기":"Turn off unused lights",
    "분리수거 완벽하게":"Recycle properly","장바구니 사용하기":"Use a shopping bag",
    "샤워 5분 이내로":"Shower under 5 min","자전거/도보 이동":"Bike or walk",
    "식물 물 주기":"Water plants","전자기기 절전 모드":"Device power-save",
    "줍깅 (쓰레기 줍기)":"Plogging (pick litter)","배달앱 일회용품 안 받기":"No delivery utensils",
    "용기내 챌린지":"Bring-your-own container","멀티탭 전원 끄기":"Turn off power strip",
    "음식 남김 없이 먹기":"Finish all your food","리필스테이션 이용":"Use a refill station",
    "비건/채식 식당 방문":"Visit a vegan restaurant","빨대 없이 음료 마시기":"Drink without a straw",
    "베란다 텃밭/식물 근황":"Balcony garden update","전자영수증 발급받기":"Get an e-receipt",
    "일회용컵 반환하기":"Return a single-use cup","무공해차 대여하기":"Rent a zero-emission car",
    "친환경제품 구매하기":"Buy eco products","고품질 재활용품 배출":"High-quality recycling",
    "폐휴대폰 반납하기":"Return an old phone","미래세대 실천행동":"Action for future generations",
    "나무 심기":"Plant a tree","베란다 태양광 설치":"Install balcony solar",
    "재생원료 제품 구매":"Buy recycled-material goods","개인용기 식품포장":"Pack food in own container",
    "자연물에 감사하기":"Give thanks to nature","자연 속 산책":"Walk in nature",
    "냉난방 온도 지키기":"Keep heating/cooling temp","음식물 쓰레기 제로":"Zero food waste",
    "지역 농산물 구매":"Buy local produce","빗물/재사용수 활용":"Use rain/reused water",
    "중고/나눔 이용하기":"Use secondhand/sharing","환경 지식 공유":"Share eco knowledge",
    "몸 건강 챙기기":"Take care of your health","이웃 나눔 실천":"Share with neighbors",

    // ── 챌린지 제목 ──
    "텀블러 사용하기":"Use a tumbler","채식 한 끼 먹기":"Eat one veggie meal","분리수거 하기":"Do recycling",
    "리필스테이션 이용":"Use refill station","음식 남김 없이 먹기":"Finish all food",

    // ── 공통 토스트/버튼/메시지 ──
    "로그인이 필요해요!":"Login required!","포인트가 부족해요!":"Not enough points!",
    "포인트 부족!":"Low points!","이미 참여 중인 챌린지예요!":"Already joined this challenge!",
    "방 이름을 입력해주세요!":"Enter a room name!","코드를 입력해주세요!":"Enter a code!",
    "존재하지 않는 코드예요!":"Code does not exist!","이미 참여 중인 방이에요!":"Already in this room!",
    "닉네임을 입력해주세요!":"Enter a nickname!","나이대를 선택해주세요!":"Select your age!",
    "지역을 선택해주세요!":"Select your region!","복사":"Copy","📤 공유":"📤 Share","💾 저장":"💾 Save",
    "방 만들기!":"Create room!","방 만들기":"Create room","방 이름":"Room name","챌린지 선택":"Pick challenge",
    "예치금":"Deposit","공개 설정":"Visibility","오늘 이미 인증했어요! 내일 또 도전해요 ✅":"Already verified today! Try again tomorrow ✅",
    "챌린지 정보를 찾을 수 없어요":"Challenge not found","미션 정보를 찾을 수 없어요":"Mission not found",
    "닫기":"Close","구매하기":"Buy","책 가격":"Price","내 포인트":"My points","구매 후":"After purchase",
    "📸 인증하기":"📸 Verify","✅ 오늘 인증완료":"✅ Verified today","🌱 오늘부터 시작!":"🌱 Start today!",
    "📅 인증 빈도":"📅 Frequency","🗓️ 챌린지 기간":"🗓️ Duration","🏅 완료 보상":"🏅 Rewards",
    "매일":"Daily","주 5일":"5x/week","주 3일":"3x/week","주 1일":"1x/week","주 5일":"5/week",
    "1주":"1wk","2주":"2wks","4주":"4wks",
    "📸 이렇게 인증해 주세요":"📸 How to verify",
    "�Quest 챌린지는 무료로 참여할 수 있어요!":"EcoQuest challenges are free!",
    "🥇":"🥇",

    // ── 법적 고지 ──
    "📋 법적 고지":"📋 Legal","개인정보처리방침 · 이용약관":"Privacy Policy · Terms",
    "개인정보처리방침":"Privacy Policy","이용약관":"Terms of Service",

    // ── 관리자 ──
    "🔐 EcoQuest 관리자":"🔐 EcoQuest Admin","📦 주문":"📦 Orders","👥 회원":"👥 Users",
    "🏃 미션":"🏃 Missions","📊 통계":"📊 Stats","전체 주문":"All orders","처리중":"Pending","완료":"Done",
    "검색":"Search","총 회원":"Total users","총 주문":"Total orders","총 CO₂ 절감":"Total CO₂ saved",
    "총 매출":"Revenue","미션 로그":"Mission logs","보유 포인트":"Points held","완료처리":"Mark done",

    // ── About 모달 ──
    "왜 만들었나요?":"Why we built it","어떻게 다른가요?":"How we're different",
    "데이터 철학":"Data philosophy","우리가 꿈꾸는 세상":"The world we dream of",
    "우리의 믿음":"Our belief","에코퀘스트코리아 유한회사":"EcoQuest Korea Ltd."
  };
  /* =========================================== */

  // 숫자+단위 패턴 (변수 섞인 텍스트 자동 변환)
  function applyPatterns(s){
    return s
      .replace(/(\d[\d,\.]*)\s*그루/g,'$1 trees')
      .replace(/(\d[\d,\.]*)\s*마리/g,'$1')
      .replace(/(\d[\d,\.]*)\s*명/g,'$1 people')
      .replace(/(\d[\d,\.]*)\s*회/g,'$1x')
      .replace(/(\d[\d,\.]*)\s*개/g,'$1')
      .replace(/(\d[\d,\.]*)\s*포인트/g,'$1 P')
      .replace(/(\d[\d,\.]*)\s*점/g,'$1 pts')
      .replace(/(\d+)\s*분 전/g,'$1 min ago')
      .replace(/(\d+)\s*시간 전/g,'$1 hr ago')
      .replace(/(\d+)\s*일 전/g,'$1 days ago')
      .replace(/(\d+)\s*일 남음/g,'$1 days left')
      .replace(/(\d+)\s*주/g,'$1 weeks')
      .replace(/방금/g,'just now')
      .replace(/달성/g,' done')
      .replace(/더!/g,' more!')
      .replace(/명 참가중/g,' joining');
  }

  let lang = localStorage.getItem('eq_lang');
  if(!lang) lang = (navigator.language||'').toLowerCase().startsWith('ko') ? 'ko' : 'en';

  function tr(orig){
    const t = (orig||'').trim();
    if(!t) return orig;
    if(lang !== 'en') return orig;
    if(DICT[t]) return orig.replace(t, DICT[t]);
    const p = applyPatterns(t);
    if(p !== t) return orig.replace(t, p);
    return orig;
  }

  function walk(root){
    if(!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        if(!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentNode;
        if(p && (p.tagName==='SCRIPT'||p.tagName==='STYLE'||p.id==='eqLangToggle')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes=[]; let n;
    while(n=walker.nextNode()) nodes.push(n);
    nodes.forEach(node=>{
      if(node._eqOrig === undefined) node._eqOrig = node.nodeValue;
      node.nodeValue = (lang==='ko') ? node._eqOrig : tr(node._eqOrig);
    });
    if(root.querySelectorAll) root.querySelectorAll('[placeholder]').forEach(el=>{
      if(el._eqPh === undefined) el._eqPh = el.getAttribute('placeholder')||'';
      el.setAttribute('placeholder', (lang==='ko') ? el._eqPh : tr(el._eqPh));
    });
  }

  const obs = new MutationObserver(()=>{
    obs.disconnect();
    walk(document.body);
    if(lang==='en') obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  });

  function apply(){
    obs.disconnect();
    walk(document.body);
    if(lang==='en') obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  function addToggle(){
    if(document.getElementById('eqLangToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'eqLangToggle';
    btn.style.cssText='position:fixed;top:10px;right:10px;z-index:99999;background:rgba(255,255,255,.92);border:1.5px solid #2ECC71;border-radius:20px;padding:5px 13px;font-size:12px;font-weight:800;cursor:pointer;color:#1B5E20;font-family:inherit;box-shadow:0 2px 10px rgba(0,0,0,.15)';
    btn.textContent = (lang==='ko') ? 'EN' : '한';
    btn.onclick = ()=>{
      lang = (lang==='ko') ? 'en' : 'ko';
      localStorage.setItem('eq_lang', lang);
      btn.textContent = (lang==='ko') ? 'EN' : '한';
      apply();
    };
    document.body.appendChild(btn);
    document.documentElement.setAttribute('lang', lang);
  }

  function boot(){ addToggle(); apply(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1500));
  else setTimeout(boot,1500);

  console.log('[lang_patch v2] 로드됨, 언어:', lang, '· 사전', Object.keys(DICT).length, '개');
})();
