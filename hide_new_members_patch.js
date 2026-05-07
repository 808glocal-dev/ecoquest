/**
 * EcoQuest 신규 멤버 섹션 숨김 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단에 추가
 *   <script src="hide_new_members_patch.js"></script>
 *
 * 동작: "🌱 새로 가입한 멤버 (최근 7일)" 섹션을 화면에서 숨김
 * - 헤더 + 카드 모두 제거
 * - 페이지 전환 / 데이터 갱신 시에도 자동 재실행
 *
 * 💡 이 패치는 시각적으로만 숨길 뿐, 데이터는 그대로 보존됨
 *    (관리자 페이지에서는 여전히 회원 정보 확인 가능)
 */

(function(){
  'use strict';

  function hideNewMemberSection() {
    // 1) 신규 멤버 카드 숨김 (오늘 가입 / N일 전 가입 패턴)
    const allDivs = document.querySelectorAll('div');
    for (const card of allDivs) {
      if (card.dataset.nmHidden) continue;
      const text = card.textContent || '';
      // 작은 카드이면서 "가입" 텍스트 포함하는 경우
      if (card.children.length <= 6
        && text.length < 120
        && /(오늘 가입|일 전 가입)/.test(text)
        && /미션 \d+개/.test(text)) {
        card.dataset.nmHidden = 'true';
        card.style.display = 'none';
      }
    }

    // 2) "새로 가입한 멤버" 헤더 숨김
    const elements = document.querySelectorAll('div, h2, h3, h4, p, span');
    for (const el of elements) {
      if (el.dataset.nmHidden) continue;
      const text = (el.textContent || '').trim();
      if (text.length < 40 && /새로\s*가입한?\s*멤버/.test(text)) {
        el.dataset.nmHidden = 'true';
        el.style.display = 'none';
      }
    }
  }

  // 초기 실행 (여러 타이밍에 걸쳐 안정성 확보)
  function start() {
    hideNewMemberSection();
    setTimeout(hideNewMemberSection, 300);
    setTimeout(hideNewMemberSection, 1000);
    setTimeout(hideNewMemberSection, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // 페이지 전환 시 재실행
  if (window.goPage) {
    const origGoPage = window.goPage;
    window.goPage = function(...args) {
      const r = origGoPage.apply(this, args);
      setTimeout(hideNewMemberSection, 200);
      setTimeout(hideNewMemberSection, 800);
      return r;
    };
  }

  // 랭킹 새로고침 시 재실행
  if (window.loadTopContrib) {
    const origLoadTop = window.loadTopContrib;
    window.loadTopContrib = async function(...args) {
      const r = await origLoadTop.apply(this, args);
      setTimeout(hideNewMemberSection, 300);
      return r;
    };
  }

  // 지도 그리기 시 재실행
  if (window.drawMap) {
    const origDrawMap = window.drawMap;
    window.drawMap = function(...args) {
      const r = origDrawMap.apply(this, args);
      setTimeout(hideNewMemberSection, 200);
      return r;
    };
  }

  // MutationObserver - 새 카드가 동적으로 추가될 때도 감지
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      let hasNewNodes = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          hasNewNodes = true;
          break;
        }
      }
      if (hasNewNodes) {
        hideNewMemberSection();
      }
    });
    if (document.body) {
      observer.observe(document.body, {childList: true, subtree: true});
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {childList: true, subtree: true});
      });
    }
  }

  window.HideNewMembersPatch = { hide: hideNewMemberSection };
})();
