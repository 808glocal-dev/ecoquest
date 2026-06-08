(function(){
  // 화면을 덮어 탭 클릭을 먹는 '투명 전체화면 레이어'를 통과시킨다.
  // 진짜 모달(.overlay)과 탭바/페이지 콘텐츠는 절대 건드리지 않는다.
  function unblock(){
    const tb = document.querySelector('.tab-bar');
    if(!tb) return;
    const r = tb.getBoundingClientRect();
    const y = r.top + r.height/2;                 // 탭바 세로 중앙
    const xs = [innerWidth*0.15, innerWidth*0.5, innerWidth*0.85];
    xs.forEach(x=>{
      let el = document.elementFromPoint(x, y);
      let guard = 0;
      while(el && guard++ < 6){
        if(el.closest && el.closest('.tab-bar')) return;        // 탭바면 정상
        if(el.classList && el.classList.contains('overlay')) return; // 진짜 모달은 보존
        const cs = getComputedStyle(el);
        const full = el.offsetWidth >= innerWidth*0.9 && el.offsetHeight >= innerHeight*0.5;
        if((cs.position === 'fixed' || cs.position === 'absolute') && full){
          el.style.pointerEvents = 'none';        // 투명 차단막 → 클릭 통과
          return;
        }
        el = el.parentElement;
      }
    });
    // 탭 버튼은 항상 클릭 가능하게
    tb.style.pointerEvents = 'auto';
    tb.querySelectorAll('.tb').forEach(b => b.style.pointerEvents = 'auto');
  }

  function run(){ try{ unblock(); }catch(e){} }

  if(document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 600));
  else setTimeout(run, 600);

  // 다른 패치가 다시 덮어도 계속 풀어줌
  setInterval(run, 1500);
  console.log('[tab_unblock] 🔓 탭 클릭 보호 적용');
})();
