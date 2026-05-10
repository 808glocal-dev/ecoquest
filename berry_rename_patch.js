(function(){

  const SKIP_TAGS = new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION']);
  const SKIP_IDS = new Set(['fileIn','codeInp','rNameInp','nicknameInp','newBunnyName','verifComment','newBunnyName']);

  function shouldSkip(node){
    if(!node || !node.parentElement) return true;
    let el = node.parentElement;
    while(el){
      if(SKIP_TAGS.has(el.tagName)) return true;
      if(el.id && SKIP_IDS.has(el.id)) return true;
      if(el.contentEditable === 'true') return true;
      el = el.parentElement;
    }
    return false;
  }

  function transform(text){
    let t = text;
    // "포인트" → "베리"
    t = t.replace(/포인트/g, '베리');
    // 숫자 + P (예: 50P, 1,000P, 50 P)
    t = t.replace(/(\d{1,3}(?:,\d{3})*|\d+)\s*P\b/g, '$1🍓');
    // "P 적립" / "P 사용" / "P 부족"
    t = t.replace(/\bP\s+적립/g, '🍓 적립');
    t = t.replace(/\bP\s+사용/g, '🍓 사용');
    t = t.replace(/\bP\s+부족/g, '🍓 부족');
    t = t.replace(/\bP\s+필요/g, '🍓 필요');
    return t === text ? null : t;
  }

  function renameAll(){
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => shouldSkip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
      });
      let node, count = 0;
      while(node = walker.nextNode()){
        const newText = transform(node.textContent);
        if(newText !== null){ node.textContent = newText; count++; }
      }
      if(count > 0) console.log('[berry_rename] ' + count + '곳 변경');
    } catch(e){console.log('[berry_rename] 오류:', e.message);}
  }

  // toast 함수 hook (포인트 부족 등 토스트도 베리로)
  function hookToast(){
    if(window._berryHookedToast) return;
    const orig = window.toast;
    if(typeof orig !== 'function'){ setTimeout(hookToast, 1000); return; }
    window.toast = function(msg){
      let m = msg;
      if(typeof m === 'string'){
        m = m.replace(/포인트/g, '베리');
        m = m.replace(/(\d{1,3}(?:,\d{3})*|\d+)\s*P\b/g, '$1🍓');
        m = m.replace(/\bP\b/g, '🍓');
      }
      return orig(m);
    };
    window._berryHookedToast = true;
  }

  // 이벤트 기반 보정 (사용자 액션 후)
  function setupListeners(){
    document.addEventListener('click', () => setTimeout(renameAll, 100), true);
    document.addEventListener('input', () => setTimeout(renameAll, 100), true);
  }

  function boot(){
    renameAll();
    hookToast();
    setupListeners();
    // 초기 + 주기 보정
    setTimeout(renameAll, 1000);
    setTimeout(renameAll, 3000);
    setInterval(renameAll, 5000);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 2000));
  } else {
    setTimeout(boot, 2000);
  }
})();
