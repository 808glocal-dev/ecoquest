// bunny_family_hide_patch.js v1
// MY BUNNY FAMILY 카드, 내 당근 카드, 당근사기/먹이/입양 버튼박스, 우리 토끼 가족 그림
// 모두 숨김 (미니 플로팅 바와 중복이라 제거)
(function(){
  'use strict';

  function isProtected(el){
    if(!el) return true;
    if(el.id?.startsWith('eq')) return true; // 우리 거 보호
    if(el.id?.startsWith('page-')) return true;
    if(el.tagName === 'BODY' || el.tagName === 'HTML') return true;
    return false;
  }

  function hideOldFamilyCards(){
    document.querySelectorAll('div').forEach(el => {
      if(isProtected(el)) return;
      if(el.dataset.eqHidFam) return;

      const txt = (el.textContent || '').slice(0, 400);
      if(!txt) return;

      // 1. MY BUNNY FAMILY 카드 (행복도 + 토끼 수)
      if(/MY\s*BUNNY\s*FAMILY/.test(txt) && txt.length < 600){
        el.style.display = 'none';
        el.dataset.eqHidFam = '1';
        return;
      }

      // 2. 내 당근 카드 (단독)
      if(/내\s*당근/.test(txt) && /\d+\s*개/.test(txt) && txt.length < 100){
        el.style.display = 'none';
        el.dataset.eqHidFam = '1';
        return;
      }

      // 3. 당근 사기 / 먹이 주기 / 새 토끼 입양 버튼 박스
      if(/당근\s*사기/.test(txt) && /먹이\s*주기/.test(txt) && /(새\s*토끼\s*입양|입양)/.test(txt) && txt.length < 800){
        el.style.display = 'none';
        el.dataset.eqHidFam = '1';
        return;
      }

      // 4. "우리 토끼 가족" 작은 그림 박스 (들판에 이미 있어서 중복)
      if(/우리\s*토끼\s*가족/.test(txt) && txt.length < 800){
        el.style.display = 'none';
        el.dataset.eqHidFam = '1';
        return;
      }

      // 5. "🐾" 가족 헤더가 있는 작은 카드
      if(/🐾.*우리\s*토끼/.test(txt) && txt.length < 800){
        el.style.display = 'none';
        el.dataset.eqHidFam = '1';
        return;
      }
    });
  }

  function boot(){
    hideOldFamilyCards();
    setInterval(hideOldFamilyCards, 1500);
    console.log('%c[bunny_family_hide v1] 🙈 관리 카드 숨김','color:#fff;background:#9C27B0;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3500));
  else setTimeout(boot, 3500);
})();
