(function(){
  const booth = new URLSearchParams(location.search).get('booth');
  if(!booth) return;  // 부스 파라미터 없으면 아무것도 안 함 (일반 접속 영향 0)

  const BOOTHS = {
    ddp: { name: 'DDP 기후테크 컨퍼런스', need: 2,
           msg: '미션 2개 이상 인증하면 안내 데스크에서 못난이 사과를 받아요!' }
  };
  const cfg = BOOTHS[booth];
  if(!cfg) return;

  function showBanner(){
    if(document.getElementById('boothBanner')) return;
    const b = document.createElement('div');
    b.id = 'boothBanner';
    b.style.cssText = 'position:sticky;top:0;z-index:9000;background:linear-gradient(135deg,#0f3d20,#1a6b3a);color:#fff;padding:10px 14px;font-size:12px;font-weight:700;text-align:center;line-height:1.5';
    b.innerHTML = `🌍 ${cfg.name} 부스 모드<br/><span style="font-weight:500;font-size:11px;color:#a8f0c6">${cfg.msg}</span>`;
    document.body.prepend(b);
  }

  // 미션 탭 자동 이동 (탭 라벨에 '미션' 들어간 걸 찾아 클릭)
  function goMissions(){
    for(const t of document.querySelectorAll('.tb')){
      if(t.textContent && t.textContent.includes('미션')){ t.click(); return true; }
    }
    return false;
  }

  function boot(){
    if(!document.querySelector('.tb')){ setTimeout(boot, 600); return; }
    showBanner();
    goMissions();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot, 1500));
  else setTimeout(boot, 1500);
})();
