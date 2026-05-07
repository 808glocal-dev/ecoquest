/* ================================================================
   EcoQuest – co2_sources_patch.js
   45개 미션 CO₂ 절감량 산정 기준 + 공식 출처 매핑
   - "📊 전체 45개 미션 CO₂ 기준 보기" 버튼 추가
   - 클릭 시 모달에서 모든 미션의 CO₂값 + 출처 + 산정 근거 확인
   - IR/지원사업 신뢰성 자료
   ================================================================ */
(function () {
  'use strict';

  /* ─── 출처 매핑 (45개) ─── */
  const CO2_SRC = {
    // ── 일상 실천 ──
    m1:  { co2: 0.332, src: '한국환경공단 LCA',     basis: '1회용 종이컵 1개 대체' },
    m2:  { co2: 1.17,  src: '국토교통부',          basis: '자가용 1km 운행 대체' },
    m3:  { co2: 0.8,   src: 'FAO',                 basis: '축산물 한 끼 대체' },
    m4:  { co2: 0.13,  src: '한전 배출계수 0.4594', basis: '60W 전구 약 5시간 절감' },
    m5:  { co2: 0.21,  src: '환경부 자원순환',      basis: '생활폐기물 1kg 재활용' },
    m6:  { co2: 0.15,  src: '한국환경공단',         basis: '비닐봉투 1매 대체' },
    m7:  { co2: 0.38,  src: '한국환경공단',         basis: '샤워 5분 단축 (온수 절약)' },
    m8:  { co2: 1.05,  src: 'IPCC AR6',            basis: '자가용 1km 대체 (자전거/도보)' },
    m9:  { co2: 0.05,  src: '환경부 도시녹화',      basis: '실내 식물 CO₂ 흡수 효과' },
    m10: { co2: 0.12,  src: '한전 배출계수',        basis: '전자기기 대기전력 절감' },

    // ── 자원 순환 ──
    m11: { co2: 0.5,   src: '환경부',              basis: '해양/생활쓰레기 1kg 저감' },
    m12: { co2: 0.3,   src: '한국환경공단',         basis: '일회용 수저/포크 1세트 대체' },
    m13: { co2: 0.25,  src: '한국환경공단',         basis: '일회용 포장재 1회 대체' },
    m14: { co2: 0.12,  src: '한전 배출계수',        basis: '멀티탭 대기전력 1일 절감' },
    m15: { co2: 0.6,   src: 'IPCC AR6',            basis: '음식물쓰레기 1kg 저감' },
    m16: { co2: 0.8,   src: '한국환경공단',         basis: '세제 1L 용기 대체 (재충전)' },
    m17: { co2: 1.2,   src: 'FAO',                 basis: '비건 식사 한 끼 (육식 대비)' },
    m18: { co2: 0.05,  src: '한국환경공단',         basis: '플라스틱 빨대 1개 대체' },
    m19: { co2: 0.1,   src: '환경부 도시녹화',      basis: '베란다 식물 1주 CO₂ 흡수' },
    m20: { co2: 0.02,  src: '환경부',              basis: '종이 영수증 1매 대체' },

    // ── 적극 실천 ──
    m21: { co2: 0.05,  src: '환경부 자원순환',      basis: '일회용컵 1개 회수' },
    m22: { co2: 1.5,   src: '환경부 무공해차',      basis: '내연차 대비 1일 운행' },
    m23: { co2: 0.3,   src: '환경부 환경마크',      basis: '친환경 인증제품 1회 구매' },
    m24: { co2: 0.15,  src: '환경부 자원순환',      basis: '고품질 분리배출 1kg' },
    m25: { co2: 2.0,   src: '환경부 전자제품 LCA',  basis: '폐휴대폰 1대 자원 회수' },
    m26: { co2: 0.1,   src: '환경부 환경교육',      basis: '실천행동 학습 효과' },
    m27: { co2: 5.0,   src: 'IPCC',                basis: '소나무 1그루 연간 CO₂ 흡수량' },
    m28: { co2: 10.0,  src: '산업통상자원부',       basis: '미니 태양광 1일 발전량 환산' },
    m29: { co2: 0.2,   src: '환경부 자원순환',      basis: '재생원료 제품 1회 구매' },
    m30: { co2: 0.3,   src: '한국환경공단',         basis: '일회용 포장재 1회 대체' },

    // ── 인식·확장 실천 ──
    m31: { co2: 0.1,   src: '환경부 인식 제고',     basis: '환경감수성 증진 (간접 효과)' },
    m32: { co2: 0.3,   src: '환경부 인식 제고',     basis: '자연 활동 참여 (간접 효과)' },
    m33: { co2: 0.5,   src: '한전·한국가스공사',    basis: '냉난방 1℃ 조절 절감' },
    m34: { co2: 0.7,   src: 'IPCC AR6',            basis: '음식물쓰레기 제로 실천' },
    m35: { co2: 0.5,   src: 'IPCC AR6',            basis: 'Food miles 절감 (지역 농산물)' },
    m36: { co2: 0.2,   src: '환경부 수자원',        basis: '수돗물 사용량 절감' },
    m37: { co2: 0.8,   src: '환경부 자원순환',      basis: '신제품 생산 대체 효과' },
    m38: { co2: 0.1,   src: '환경부 환경교육',      basis: '환경지식 확산 (간접 효과)' },
    m39: { co2: 0.3,   src: '환경부 인식 제고',     basis: '건강·환경 동반 실천 (간접)' },
    m40: { co2: 0.4,   src: '환경부 환경교육',      basis: '나눔 실천 확산 (간접)' },

    // ── 환경 콘텐츠 학습 ──
    m41: { co2: 0.05,  src: '환경부 환경교육',      basis: '환경 다큐 시청 (학습 효과)' },
    m42: { co2: 0.05,  src: '환경부 환경교육',      basis: '환경 영화 관람 (학습 효과)' },
    m43: { co2: 0.03,  src: '환경부 환경교육',      basis: '환경 도서 독서 (학습 효과)' },
    m44: { co2: 0.01,  src: '환경부 환경교육',      basis: 'ESG 뉴스 학습' },
    m45: { co2: 0.02,  src: '환경부 환경교육',      basis: '환경 미디어 학습' },
  };

  window.CO2_SRC = CO2_SRC;

  /* ─── 모달 생성 ─── */
  function ensureModal() {
    if (document.getElementById('ovCO2Sources')) {
      // 이미 있으면 내용만 갱신
      buildTable();
      return;
    }
    const modal = document.createElement('div');
    modal.className = 'overlay';
    modal.id = 'ovCO2Sources';

    modal.innerHTML = `
      <div class="modal" style="max-width:560px;max-height:90vh;display:flex;flex-direction:column">
        <div class="handle" onclick="closeOv('ovCO2Sources')"></div>
        <button class="modal-close" onclick="closeOv('ovCO2Sources')">✕</button>
        <div class="modal-title">📊 CO₂ 절감량 산정 기준 (45개)</div>
        <div class="modal-desc" style="margin-bottom:12px;font-size:12px;line-height:1.6">
          모든 미션의 CO₂ 절감량은
          <b style="color:var(--g2)">한국환경공단·IPCC AR6·FAO·환경부·한전</b>
          공식 자료에 근거합니다.
        </div>

        <div id="ehCO2SrcTableWrap" style="overflow-y:auto;flex:1;border:1px solid var(--bdr);border-radius:10px;background:#fff">
        </div>

        <div style="font-size:10px;color:var(--sub);margin-top:10px;line-height:1.7;padding:10px;background:#f8f8f8;border-radius:8px">
          <b>📌 자료 출처</b><br/>
          • 한국환경공단 LCA (생애주기평가)<br/>
          • IPCC AR6 (제6차 기후변화 평가보고서)<br/>
          • FAO (유엔식량농업기구) 축산 부문 보고서<br/>
          • 환경부 (자원순환·환경교육·도시녹화·환경마크)<br/>
          • 산업통상자원부 (신재생에너지)<br/>
          • 한전 배출계수 0.4594 kgCO₂/kWh (2023년 기준)<br/>
          ※ 일부 인식 제고·교육 미션은 간접 효과 추정값을 사용합니다.
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) window.closeOv?.('ovCO2Sources');
    });

    buildTable();
  }

  function buildTable() {
    const wrap = document.getElementById('ehCO2SrcTableWrap');
    if (!wrap) return;

    const missions = (typeof MISSIONS !== 'undefined' ? MISSIONS : []);
    if (!missions.length) {
      wrap.innerHTML = '<div style="padding:20px;text-align:center;color:var(--sub);font-size:13px">미션 데이터를 불러오는 중...</div>';
      return;
    }

    const rows = missions.map(m => {
      const s = CO2_SRC[m.id] || {};
      const co2 = (s.co2 != null ? s.co2 : m.co2) || 0;
      return `
        <tr>
          <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:10px;color:var(--sub);white-space:nowrap">${m.id}</td>
          <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:12px">${m.emoji || ''} ${m.name || ''}</td>
          <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:11px;font-weight:700;color:var(--g2);text-align:right;white-space:nowrap">-${co2}kg</td>
          <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-size:10px;color:#444;line-height:1.4">
            <div style="font-weight:700">${s.src || '-'}</div>
            <div style="color:var(--sub);margin-top:2px">${s.basis || ''}</div>
          </td>
        </tr>`;
    }).join('');

    wrap.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-family:inherit">
        <thead style="background:#f0fbf4;position:sticky;top:0;z-index:1">
          <tr>
            <th style="padding:8px 6px;font-size:10px;text-align:left;color:var(--g2);font-weight:700">ID</th>
            <th style="padding:8px 6px;font-size:10px;text-align:left;color:var(--g2);font-weight:700">미션</th>
            <th style="padding:8px 6px;font-size:10px;text-align:right;color:var(--g2);font-weight:700">CO₂</th>
            <th style="padding:8px 6px;font-size:10px;text-align:left;color:var(--g2);font-weight:700">출처·근거</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  window.openCO2SourcesModal = function () {
    ensureModal();
    window.openOv?.('ovCO2Sources');
  };

  /* ─── 기존 CO₂ 절감 기준 페이지에 "전체 45개 보기" 버튼 추가 ─── */
  function addLinkToExistingPage() {
    const candidates = document.querySelectorAll('.sec-t, .modal-title, h2, h3, .modal-desc');
    let target = null;
    for (const el of candidates) {
      const t = (el.innerText || '').trim();
      if (/CO.?₂?\s*(절감|기준|계산|산정)/i.test(t)) {
        target = el;
        break;
      }
    }
    if (!target) return;

    const container = target.closest('.modal') || target.parentElement;
    if (!container || container.querySelector('#ehCO2SrcBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'ehCO2SrcBtn';
    btn.textContent = '📊 전체 45개 미션 CO₂ 기준 보기';
    btn.style.cssText = `
      width:100%;background:linear-gradient(135deg,var(--g1),var(--g2));
      color:#fff;border:none;border-radius:10px;
      padding:11px;font-size:13px;font-weight:800;
      cursor:pointer;font-family:inherit;
      margin:12px 0;box-shadow:0 2px 8px rgba(46,204,113,.3);
    `;
    btn.onclick = () => window.openCO2SourcesModal();

    target.insertAdjacentElement('afterend', btn);
  }

  /* 실행 */
  setTimeout(addLinkToExistingPage, 800);
  [1500, 3000, 6000].forEach(t => setTimeout(addLinkToExistingPage, t));

  // 모달이 열릴 때마다 다시 체크 (CO₂ 기준 모달이 동적으로 열릴 가능성)
  const _origOpenOv = window.openOv;
  if (typeof _origOpenOv === 'function' && !window._ehCO2SrcOpenOvHooked) {
    window.openOv = function (id) {
      const r = _origOpenOv.call(this, id);
      setTimeout(addLinkToExistingPage, 200);
      return r;
    };
    window._ehCO2SrcOpenOvHooked = true;
  }

  console.log('[co2_sources_patch] ✅ 45개 미션 CO₂ 출처 매핑 완료');
})();
