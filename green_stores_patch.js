/**
 * EcoQuest 친환경 매장 지도 patch.js
 * ─────────────────────────────────────────────
 * 사용법: index.html 하단 다른 patch들 사이에 추가
 *   <script src="green_stores_patch.js"></script>
 *
 * 동작: page-map (지도 탭)에 '친환경 매장' 섹션 자동 주입
 * 특징: 외부 링크 X (모든 정보 앱 내 표시) / 카테고리·지역 필터 / 기존 디자인 시스템 활용
 * 매장 추가/수정: 아래 STORES 배열만 수정
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // 📍 매장 데이터 (여기만 수정해서 추가/제거)
  // ═══════════════════════════════════════════
  const STORES = [
    {id:"almang",name:"알맹상점",cat:"zero_waste",region:"서울",district:"마포구",address:"서울 마포구 월드컵로25길 47, 3층",lat:37.557761,lng:126.905279,phone:"010-4406-1925",hours:"12:00 - 20:00",closed:"월요일",description:"한국 제로웨이스트 운동의 상징. 화장품·세제·차·원두·향신료 리필스테이션. 매주 수·목 '플라스틱 달고나' 워크숍.",features:["리필스테이션","워크숍","도매"]},
    {id:"jigusyab",name:"지구샵",cat:"vintage",region:"서울",district:"마포구",address:"서울 마포구 동교로 39, 2층",lat:37.552784,lng:126.906605,hours:"13:00 - 20:00 (토·일 13:00-21:00)",description:"망원동의 빈티지·친환경 라이프스타일 편집숍. 의류·액세서리 중심.",features:["빈티지","편집숍"]},
    {id:"hug-a-whale",name:"허그어웨일",cat:"zero_waste",region:"서울",district:"강서구",address:"서울 강서구 화곡로55길 23",lat:37.552699,lng:126.848395,phone:"02-2038-7209",hours:"화-금 11:00-19:30, 토-일 12:00-17:30",closed:"월요일",description:"리필스테이션과 소분숍. 플라스틱 뚜껑·커피찌꺼기·브리타필터·유리공병 가져오면 설거지비누 샘플 증정.",features:["리필스테이션","자원회수"]},
    {id:"annyeong",name:"안녕상점",cat:"zero_waste",region:"서울",district:"도봉구",address:"서울 도봉구 도봉로 823",lat:37.677904,lng:127.044753,hours:"매장 문의",description:"도봉 방학동의 동네 제로웨이스트샵. 친절한 상담과 자원순환 교육 운영.",features:["교육 프로그램"]},
    {id:"song-for-earth",name:"지구를위한노래",cat:"zero_waste",region:"서울",district:"강동구",address:"서울 강동구 풍성로35길 34, 1층",lat:37.533447,lng:127.125476,phone:"070-8095-3534",hours:"수-일 10:30-19:00",closed:"월·화요일",description:"비건 식품과 제로웨이스트 생활용품. 용기 가져오면 도장 적립. 사전 예약 시 비건 식사 제공.",features:["비건","친환경 식품"]},
    {id:"deokbun-ae",name:"덕분愛",cat:"zero_waste",region:"서울",district:"서초구",address:"서울 서초구 효령로 276, 203호",lat:37.484183,lng:127.014291,phone:"02-6092-8575",hours:"월-토 11:00-20:00",closed:"일요일",description:"비건 중심의 제로웨이스트샵. 곡물·파스타·액체비누 등 다양한 리필스테이션.",features:["리필스테이션","비건"]},
    {id:"plafree",name:"플라프리",cat:"zero_waste",region:"서울",district:"동작구",address:"서울 동작구 동작대로 157-4, 1F",lat:37.490588,lng:126.982173,phone:"02-536-8082",hours:"화·목·금·토 12:00-19:00, 수 12:00-20:00",closed:"월·일요일",description:"사당의 작은 제로웨이스트샵. 친절한 설명과 함께 세제·섬유유연제 리필 가능.",features:["리필스테이션"]},
    {id:"plastic-bangatgan",name:"플라스틱방앗간",cat:"upcycling",region:"서울",district:"종로구",address:"서울 종로구 필운대로 23, 1층",lat:37.578111,lng:126.969113,hours:"수-토 10:00-21:00, 일 10:00-20:00",closed:"월·화요일",description:"버려지는 플라스틱 병뚜껑을 모아 새 제품으로 업사이클링하는 공방. 참여형 프로그램 운영.",features:["업사이클링","체험 프로그램"]},
    {id:"one-zeom",name:"원점",cat:"zero_waste",region:"서울",district:"성동구",address:"서울 성동구 아차산로7길 42",lat:37.548611,lng:127.055829,hours:"10:00 - 20:00",description:"성수의 작은 제로웨이스트샵. 병뚜껑을 녹여 키링·코스터·시계 등으로 만드는 기계 보유.",features:["리필스테이션","업사이클링"]},
    {id:"hwagok-soap",name:"화곡비누공방",cat:"workshop",region:"서울",district:"강서구",address:"서울 강서구 곰달래로53길 117, 4층",lat:37.536127,lng:126.856056,phone:"010-2039-0052",hours:"예약 문의",description:"천연비누 만들기 공방. 친환경 비누 클래스 진행.",features:["천연비누","원데이클래스"]},
    {id:"yes-daegu",name:"제로웨이스트샵 예쓰",cat:"zero_waste",region:"대구",district:"수성구",address:"대구 수성구 달구벌대로627길 6-11, 1층",lat:35.842097,lng:128.701902,phone:"053-791-0422",hours:"화-토 13:00-18:00",closed:"월·일요일",description:"가족이 함께 운영하는 동네 제로웨이스트샵. '배려'를 모토로 환경 교육과 상담.",features:["가족 운영","교육"]},
    {id:"ayang-99",name:"제로웨이스트샵 아양로99",cat:"zero_waste",region:"대구",district:"동구",address:"대구 동구 신암동 576-31",lat:35.884036,lng:128.623848,hours:"매장 문의",description:"대구 동구의 친환경 생활용품 전문점.",features:["친환경 생활용품"]},
    {id:"nemo-busan",name:"네모상점",cat:"zero_waste",region:"부산",district:"연제구",address:"부산 연제구 연산동 신금로 25, 2층 227호",lat:35.191485,lng:129.094374,hours:"매장 문의",description:"연산동의 부산 대표 제로웨이스트샵.",features:["친환경 생활용품"]},
    {id:"jigubyul",name:"지구별가게",cat:"zero_waste",region:"제주",district:"제주시",address:"제주 제주시 서사로 173",lat:33.496719,lng:126.520025,phone:"064-711-8291",hours:"월-금 10:00-18:00, 토 11:00-15:00",closed:"일요일",description:"제주의 따뜻한 친환경 가게. 제주 테마 손수건·세탁비누 등 제주 감성 제품.",features:["제주 디자인","친환경 생활용품"]},
    {id:"zerofactory-jeju",name:"제로팩토리",cat:"zero_waste",region:"제주",district:"제주시",address:"제주 제주시 청귤로5길 6, 1층",lat:33.500011,lng:126.538758,phone:"010-9620-1351",hours:"월·금·토·일 10:00-19:00",closed:"화·수·목요일",description:"제주의 제로웨이스트 라이프스타일 가게.",features:["친환경 생활용품"]},
    {id:"zerosystem-mungyeong",name:"제로시스템",cat:"zero_waste",region:"경북",district:"문경시",address:"경북 문경시 모전동 264-1",lat:36.588629,lng:128.188413,phone:"054-552-2285",hours:"매장 문의",description:"문경의 친환경 매장. 햇살상점과 함께 운영되는 지역 제로웨이스트 거점.",features:["지역 거점"]},
  ];

  // ── 카테고리 매핑 ─────────────────
  const CAT_LABEL = {zero_waste:'제로웨이스트', vintage:'빈티지·친환경', upcycling:'업사이클링', workshop:'공방'};
  const CAT_EMOJI = {zero_waste:'🌱', vintage:'👕', upcycling:'♻️', workshop:'🛠️'};

  // ── 스타일 주입 (기존 EcoQuest 디자인 시스템 활용) ─────
  function injectStyles() {
    if (document.getElementById('gs-styles')) return;
    const css = `
      .gs-wrap{margin:0 12px 12px}
      .gs-filter{display:flex;gap:6px;overflow-x:auto;padding:8px 0 12px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      .gs-filter::-webkit-scrollbar{display:none}
      .gs-chip{flex:0 0 auto;padding:6px 12px;border-radius:18px;background:#f0f5f1;color:var(--g2);font-size:12px;border:1.5px solid transparent;cursor:pointer;font-family:inherit;font-weight:600;white-space:nowrap;transition:all .15s}
      .gs-chip.on{background:var(--g1);color:#fff;border-color:var(--g1)}
      .gs-list{display:flex;flex-direction:column;gap:8px}
      .gs-card{background:var(--card);border:1px solid var(--bdr);border-radius:14px;padding:12px 14px;transition:transform .15s,box-shadow .15s;cursor:pointer}
      .gs-card:active{transform:scale(.98);box-shadow:0 2px 8px rgba(46,204,113,.15)}
      .gs-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:4px}
      .gs-name{font-size:14px;font-weight:900;color:var(--txt);margin:0;line-height:1.3}
      .gs-cat{font-size:10px;background:#e8f3ec;color:var(--g2);padding:2px 7px;border-radius:8px;font-weight:700;white-space:nowrap;flex-shrink:0}
      .gs-region{font-size:11px;color:var(--sub);margin:0 0 6px}
      .gs-region::before{content:"📍 "}
      .gs-desc{font-size:12px;color:#3d4f45;line-height:1.5;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .gs-card.expand .gs-desc{-webkit-line-clamp:unset;display:block}
      .gs-features{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
      .gs-feature{font-size:10px;background:#f5f9f6;color:var(--g2);padding:2px 7px;border-radius:8px;font-weight:600}
      .gs-meta{display:none;flex-direction:column;gap:4px;padding-top:8px;border-top:1px dashed var(--bdr);margin-top:6px}
      .gs-card.expand .gs-meta{display:flex}
      .gs-meta-row{font-size:11px;color:var(--sub);display:flex;gap:6px}
      .gs-meta-label{color:#9aaba1;min-width:42px;font-weight:600}
      .gs-empty{text-align:center;padding:24px 16px;color:var(--sub);font-size:12px;background:#f8fdf9;border-radius:12px;border:1.5px dashed var(--bdr)}
      .gs-info{font-size:11px;color:var(--sub);text-align:center;padding:8px 4px;line-height:1.6}
    `;
    const style = document.createElement('style');
    style.id = 'gs-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── 유틸 ─────────────────
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function metaRow(label, value) {
    return `<div class="gs-meta-row"><span class="gs-meta-label">${label}</span><span>${escapeHtml(value)}</span></div>`;
  }

  // ── 카드 렌더링 ─────────────────
  function renderCard(store) {
    const catLabel = CAT_LABEL[store.cat] || '친환경';
    const catEmoji = CAT_EMOJI[store.cat] || '🌿';
    const features = (store.features || [])
      .map((f) => `<span class="gs-feature">${escapeHtml(f)}</span>`)
      .join('');

    return `
      <article class="gs-card" onclick="this.classList.toggle('expand')">
        <div class="gs-card-head">
          <h3 class="gs-name">${catEmoji} ${escapeHtml(store.name)}</h3>
          <span class="gs-cat">${escapeHtml(catLabel)}</span>
        </div>
        <p class="gs-region">${escapeHtml(store.region)} ${escapeHtml(store.district || '')}</p>
        ${store.description ? `<p class="gs-desc">${escapeHtml(store.description)}</p>` : ''}
        ${features ? `<div class="gs-features">${features}</div>` : ''}
        <div class="gs-meta">
          ${store.address ? metaRow('주소', store.address) : ''}
          ${store.hours ? metaRow('운영', store.hours) : ''}
          ${store.closed ? metaRow('휴무', store.closed) : ''}
          ${store.phone ? metaRow('전화', store.phone) : ''}
        </div>
      </article>
    `;
  }

  // ── 메인 ─────────────────
  let activeFilter = '전체';

  function renderList(wrap) {
    const filtered = activeFilter === '전체'
      ? STORES
      : STORES.filter((s) => s.region === activeFilter);

    const listEl = wrap.querySelector('#gs-list');
    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="gs-empty">해당 지역에 등록된 매장이 없어요</div>';
      return;
    }
    listEl.innerHTML = filtered.map(renderCard).join('');
  }

  function renderFilter(wrap) {
    const filterEl = wrap.querySelector('#gs-filter');
    if (!filterEl) return;
    const regions = ['전체', ...new Set(STORES.map((s) => s.region))];
    filterEl.innerHTML = regions
      .map((r) => `<button class="gs-chip ${r === activeFilter ? 'on' : ''}" data-region="${escapeHtml(r)}">${escapeHtml(r)}</button>`)
      .join('');
    filterEl.querySelectorAll('.gs-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.region;
        renderFilter(wrap);
        renderList(wrap);
      });
    });
  }

  function inject() {
    const mapPage = document.getElementById('page-map');
    if (!mapPage) {
      console.warn('[GreenStores] #page-map not found');
      return;
    }
    if (document.getElementById('green-stores-section')) return; // 중복 방지

    injectStyles();

    // 섹션 헤더 추가 (기존 .sec 디자인 사용)
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'sec';
    sectionHeader.innerHTML = `<div class="sec-t">🛒 친환경 매장 둘러보기 <span style="background:#e8f3ec;color:var(--g2);font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;margin-left:6px">${STORES.length}곳</span></div>`;
    mapPage.appendChild(sectionHeader);

    // 컨텐츠 컨테이너
    const wrap = document.createElement('div');
    wrap.id = 'green-stores-section';
    wrap.className = 'gs-wrap';
    wrap.innerHTML = `
      <div class="gs-filter" id="gs-filter"></div>
      <div class="gs-list" id="gs-list"></div>
      <div class="gs-info">💡 카드를 탭하면 자세한 정보를 볼 수 있어요</div>
    `;
    mapPage.appendChild(wrap);

    renderFilter(wrap);
    renderList(wrap);
  }

  // ── 자동 초기화 ─────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // 외부 노출 (필요시 다시 호출 가능)
  window.GreenStoresPatch = { inject, STORES };
})();
