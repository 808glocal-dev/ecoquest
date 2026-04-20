// global_co2_patch.js
(function(){
  async function updateGlobalCO2(){
    try{
      if(!window.FB?.db){ setTimeout(updateGlobalCO2,1000); return; }
      const snap = await window.FB.getDocs(window.FB.collection(window.FB.db,'users'));
      let total = 0;
      snap.forEach(d => { total += Number(d.data().co2 || 0); });
      const el = document.getElementById('bCo2');
      if(el){
        el.textContent = total >= 1000 
          ? (total/1000).toFixed(1) + 't' 
          : total.toFixed(1) + 'kg';
      }
      console.log('[global_co2]', total.toFixed(2) + 'kg');
    }catch(e){ console.error('[global_co2]', e); }
  }
  
  // 기존 loadGlobalStats 덮어쓰기 (에러 방지)
  window.loadGlobalStats = updateGlobalCO2;
  
  setTimeout(updateGlobalCO2, 2000);
  setInterval(updateGlobalCO2, 15000);
})();
