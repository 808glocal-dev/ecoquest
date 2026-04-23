// tag_filter_patch.js v3 - 제목 기반 매칭
(function(){
  
  let currentFilter = 'all';
  
  function addFilterButtons(){
    const secOfficial = document.getElementById('sec-official');
    if(!secOfficial) return;
    if(document.getElementById('tagFilterBar')) return;
    
    const filterBar = document.createElement('div');
    filterBar.id = 'tagFilterBar';
    filterBar.style.cssText = `
      display:flex;gap:6px;padding:10px 12px;
      overflow-x:auto;overflow-y:hidden;
      scrollbar-width:none;-ms-overflow-style:none;
      background:#fff;border-bottom:1px solid var(--bdr);
    `;
    filterBar.innerHTML = `
      <style>
        #tagFilterBar::-webkit-scrollbar { display: none; }
        .tag-btn {
          flex-shrink: 0; padding: 8px 14px;
          border: 1.5px solid var(--bdr); background: #fff;
          color: var(--sub); border-radius: 20px;
          font-size: 13px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          font-family: inherit;
        }
        .tag-btn.active {
          background: linear-gra
