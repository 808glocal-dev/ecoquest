// talent_link_patch.js — 첫 화면(#welcome) 아래에 기업 대상 "Korean Talent Partner" 페이지 링크 추가
// index.html의 기존 내용과 game/main.js는 건드리지 않음
(function () {
  function addTalentLink() {
    var welcome = document.getElementById('welcome');
    if (!welcome || document.getElementById('talentPartnerLink')) return;

    var link = document.createElement('a');
    link.id = 'talentPartnerLink';
    link.href = '/talent.html';
    link.textContent = 'For business · Korean Talent Partner →';
    link.setAttribute('aria-label', 'EcoQuest Korea Korean Talent Partner page for businesses');
    link.style.cssText = [
      'display:inline-block',
      'margin-top:18px',
      'padding:10px 16px',
      'min-height:44px',
      'line-height:24px',
      'font-size:13px',
      'color:#cfd8ff',
      'text-decoration:none',
      'border:1px solid rgba(207,216,255,0.35)',
      'border-radius:999px',
      'pointer-events:auto'
    ].join(';');

    link.addEventListener('click', function (e) { e.stopPropagation(); });
    welcome.appendChild(link);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTalentLink);
  } else {
    addTalentLink();
  }
})();
