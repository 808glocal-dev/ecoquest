/* =====================================================
   EcoQuest – lang_patch.js  (한국어 ↔ English 다국어)
   ─────────────────────────────────────────────────────
   • 우상단 토글 버튼 (EN / 한)
   • 브라우저 언어 자동 감지 (처음 들어온 사람)
   • 화면 한글 텍스트를 사전(DICT)대로 영어로 치환
   • 동적으로 그려지는 화면(patch들)도 자동 재번역
   ─────────────────────────────────────────────────────
   ★ 사용법: 영어로 바꿨을 때 "안 바뀌는 한글"이 보이면,
     그 텍스트를 아래 DICT 에 그대로 복사해서
     "한글": "English" 형태로 한 줄 추가하면 끝!
   ★ 로드 위치: 아무 patch 뒤, <script> 목록 맨 끝 권장
   ===================================================== */
(function(){
  'use strict';
  if(window._eqLangLoaded) return;
  window._eqLangLoaded = true;

  /* ===================================================
     한글 → English 사전  (여기에 계속 추가하세요)
     화면에 보이는 한글을 "정확히 그대로" 왼쪽에 넣어야 바뀝니다.
     =================================================== */
  const DICT = {
    // ── 탭 / 네비게이션 ──
    "홈": "Home",
    "챌린지": "Challenges",
    "지구": "Earth",
    "지도": "Map",
    "내 활동": "Activity",
    "활동": "Activity",
    "마이": "My",
    "소속": "Team",

    // ── 공통 버튼 ──
    "시작하기": "Get Started",
    "가입 없이 시작": "Start without sign-up",
    "인증하기": "Verify",
    "✨ 인증하기": "✨ Verify",
    "완료": "Done",
    "✅ 완료!": "✅ Done!",
    "취소": "Cancel",
    "확인": "OK",
    "확인 ✓": "OK ✓",
    "확인했어요": "Got it",
    "올리기": "Upload",
    "저장": "Save",
    "닫기": "Close",
    "다음": "Next",
    "계속하기": "Continue",

    // ── 인증 흐름 ──
    "인증 완료!": "Verified!",
    "인증 완료": "Verified",
    "인증 실패": "Failed",
    "사진 꾸미기": "Decorate Photo",
    "✨ 다시 확인": "✨ Try Again",
    "✨ 사진을 확인하고 있어요...": "✨ Checking your photo...",
    "잠시만 기다려주세요!": "Just a moment!",
    "글자": "Text",
    "삭제": "Delete",
    "크기": "Size",

    // ── 공개 설정 ──
    "공개": "Public",
    "나만 보기": "Private",
    "📸 인증샷 공개 설정": "📸 Photo visibility",
    "후기 또는 한마디 (선택)": "Comment (optional)",
    "제목 (선택)": "Title (optional)",
    "본문을 자유롭게 작성해주세요... (선택)": "Write freely... (optional)",

    // ── 카메라 ──
    "📷 사진·영상 인증": "📷 Photo / Video",
    "카메라 준비 중이에요": "Preparing camera...",
    "카메라 허용이 필요해요": "Camera permission needed",

    // ── 성공 팝업 ──
    "방금 절감한 CO₂": "CO₂ saved just now",
    "누적 CO₂ 절감": "Total CO₂ saved",
    "📸 인증샷 공유하고 자랑하기": "📸 Share your proof",

    // ── 토끼 / 가든 ──
    "먹이 주기": "Feed",
    "🥕 당근 사기": "🥕 Buy Carrot",
    "당근 사기": "Buy Carrot",
    "🐰 새 토끼 입양하기": "🐰 Adopt a Bunny",
    "새 토끼 입양하기": "Adopt a Bunny",
    "내 당근": "My Carrots",
    "🥕 내 당근": "🥕 My Carrots",
    "행복도": "Happiness",
    "입양!": "Adopt!",
    "🎉 입양!": "🎉 Adopt!",

    // ── 미션 / 챌린지 공통 ──
    "환경 미션": "Eco Mission",
    "친환경 출근 챌린지": "Eco Commute Challenge",
    "친환경 출장 챌린지": "Eco Business Trip Challenge",
    "친환경 출근": "Eco Commute",
    "친환경 출장": "Eco Trip",
    "통근·출장 챌린지": "Commute & Trip Challenges",
    "인기 챌린지": "Popular Challenges",

    // ── 소속 / 브이로그 ──
    "🚇 내 출퇴근 등록": "🚇 Register My Commute",
    "🎬 우리 팀 하루 브이로그": "🎬 Team Daily Vlog",
    "기업 탄소배출 계산": "Company Emissions",
    "내 소속": "My Team"

    // ↑↑↑ 여기 위에 계속 추가하세요. 마지막 줄만 끝에 쉼표(,) 빼기!
    //  예)  "환경을 지켜요": "Protect the Earth",
  };
  /* =================================================== */

  let lang = localStorage.getItem('eq_lang');
  if(!lang) lang = (navigator.language||'').toLowerCase().startsWith('ko') ? 'ko' : 'en';

  function tr(orig){
    const t = orig.trim();
    if(!t) return orig;
    if(lang === 'en' && DICT[t]) return orig.replace(t, DICT[t]);
    return orig;  // 사전에 없으면 원본 그대로
  }

  function walk(root){
    if(!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        if(!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentNode;
        if(p && (p.tagName==='SCRIPT' || p.tagName==='STYLE' || p.id==='eqLangToggle'))
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes=[]; let n;
    while(n=walker.nextNode()) nodes.push(n);
    nodes.forEach(node=>{
      if(node._eqOrig === undefined) node._eqOrig = node.nodeValue; // 원본(한글) 보관
      node.nodeValue = (lang === 'ko') ? node._eqOrig : tr(node._eqOrig);
    });
    // placeholder 도 번역
    if(root.querySelectorAll) root.querySelectorAll('[placeholder]').forEach(el=>{
      if(el._eqPh === undefined) el._eqPh = el.getAttribute('placeholder') || '';
      const orig = el._eqPh;
      el.setAttribute('placeholder', (lang === 'ko') ? orig : tr(orig));
    });
  }

  // 동적 콘텐츠 감지 (번역 중엔 잠깐 끔 → 무한루프 방지)
  const obs = new MutationObserver(()=>{
    obs.disconnect();
    walk(document.body);
    if(lang === 'en') obs.observe(document.body, {childList:true, subtree:true, characterData:true});
  });

  function apply(){
    obs.disconnect();
    walk(document.body);
    if(lang === 'en') obs.observe(document.body, {childList:true, subtree:true, characterData:true});
  }

  function addToggle(){
    if(document.getElementById('eqLangToggle')) return;
    const btn = document.createElement('button');
    btn.id = 'eqLangToggle';
    btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:rgba(255,255,255,.92);border:1.5px solid #2ECC71;border-radius:20px;padding:5px 13px;font-size:12px;font-weight:800;cursor:pointer;color:#1B5E20;font-family:inherit;box-shadow:0 2px 10px rgba(0,0,0,.15)';
    btn.textContent = (lang === 'ko') ? 'EN' : '한';
    btn.onclick = ()=>{
      lang = (lang === 'ko') ? 'en' : 'ko';
      localStorage.setItem('eq_lang', lang);
      btn.textContent = (lang === 'ko') ? 'EN' : '한';
      apply();
    };
    document.body.appendChild(btn);
    document.documentElement.setAttribute('lang', lang);
  }

  function boot(){ addToggle(); apply(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,1500));
  else setTimeout(boot,1500);

  console.log('[lang_patch] 로드됨, 현재 언어:', lang);
})();
