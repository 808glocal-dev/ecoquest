// bunny_grid_kill_patch.js v1
// 6칸 격자 직접 매칭 강제 숨김 (다른 patch가 못 잡는 격자도 처리)
(function(){
  'use strict';

  const OUR_IDS = new Set([
    'eqMyHarvestStore', 'eqMySummaryCard', 'eqLocalWrapper', 'eqMiniActionBar',
    'eqSeedSelector', 'ovSeedSel', 'ovExchange', 'ovAdoptV2', 'eqAdoptResult', 'eqAdoptForm'
  ]);

  function inOurArea(el){
    let p = el;
    while(p && p.tagName !== 'BODY'){
      if(OUR_IDS.has(p.id)) return true;
      // 모달 영역도 보호
      if(p.id?.startsWith('ov') && p.style?.position === 'fixed') return true;
      p = p.parentElement;
    }
    return false;
  }

  function killGrids(){
    document.querySelectorAll('div').forEach(el => {
      if(OUR_IDS.has(el.id)) return;
      if(el.id?.startsWith('page-')) return;
      if(el.tagName === 'BODY' || el.tagName === 'HTML') return;
      if(el.dataset.eqGridKill) return;
      if(inOurArea(el)) return;

      // CSS grid 매칭
      const style = window.getComputedStyle(el);
      if(style.display !== 'grid') return;

      const childCount = el.children.length;
      if(childCount < 4 || childCount > 9) return; // 6칸 격자 범위

      // 식물 관련 텍스트
      const txt = (el.textContent || '').slice(0, 1500);
      const plantWords = (txt.match(/심기|새싹|씨앗|텃밭/g) || []).length;

      if(plantWords >= 3 && txt.length < 2000){
        el.style.setProperty('display', 'none', 'important');
        el.dataset.eqGridKill = '1';

        // 같은 카드의 헤더("내 텃밭")도 같이 숨김
        let prev = el.previousElementSibling;
        if(prev && /내\s*텃밭|MY\s*FARM/.test(prev.textContent || '')){
          prev.style.setProperty('display', 'none', 'important');
          prev.dataset.eqGridKill = '1';
        }
      }
    });

    // MY FARM 통계 카드 (일반/못난이 씨앗)도 직접 매칭
    document.querySelectorAll('div').forEach(el => {
      if(OUR_IDS.has(el.id)) return;
      if(el.id?.startsWith('page-')) return;
      if(el.dataset.eqGridKill) return;
      if(inOurArea(el)) return;

      const txt = (el.textContent || '').slice(0, 600);
      if(/MY\s*FARM/.test(txt) && /(일반\s*씨앗|못난이\s*씨앗|도감)/.test(txt) && txt.length < 800){
        el.style.setProperty('display', 'none', 'important');
        el.dataset.eqGridKill = '1';
      }
    });
  }

  function boot(){
    killGrids();
    setInterval(killGrids, 1000);
    console.log('%c[bunny_grid_kill v1] 🔪 6칸 격자 + MY FARM 강제 숨김','color:#fff;background:#D32F2F;padding:4px 8px;border-radius:4px;font-weight:bold');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 3000));
  else setTimeout(boot, 3000);
})();
