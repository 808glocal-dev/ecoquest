/* =====================================================
   EcoQuest – commute_calc_patch.js
   출근/출장 인증 → 거리 × 배출계수 자동 CO₂ 계산
   ─────────────────────────────────────────────────────
   • 출근(id 101): UDATA.commute(거리·수단) 기반 자동계산
                   미등록 시 "먼저 출퇴근 등록" 안내하고 인증 막음
   • 출장(id 102): 인증 직전 거리·수단 입력받아 자동계산
   • 절감식(편도 1회 회피분): 거리 × (승용차계수 − 실제수단계수) ÷ 1000
   • 출근·출장 챌린지를 카테고리 카드 "이동(transport)"에 등록
   ─────────────────────────────────────────────────────
   ★ 로드 위치: commute_challenge_patch.js 뒤, home_mission_patch.js 뒤
   ===================================================== */
(function () {
  'use strict';
  if (window._commuteCalcLoaded) return;
  window._commuteCalcLoaded = true;

  // 교통수단별 배출계수 (gCO₂/km) — commute_patch.js의 EF와 동일
  const EF = {
    walk_bike: { g: 0,   label: '도보·자전거', emoji: '🚶' },
    subway:    { g: 26,  label: '지하철·전철', emoji: '🚇' },
    bus:       { g: 57,  label: '버스',        emoji: '🚌' },
    car:       { g: 210, label: '승용차·택시', emoji: '🚗' },
  };
  const CAR_EF = 210; // 승용차 기준(회피 배출 계산용)

  // 편도 1회 회피 절감량(kg) = 거리 × (승용차 − 실제수단) ÷ 1000
  function avoidedKg(distanceKm, mode) {
    const g = EF[mode]?.g ?? 0;
    const saved = distanceKm * Math.max(0, (CAR_EF - g)) / 1000;
    return Math.max(0, +saved.toFixed(2));
  }

  /* ── 1. 출근·출장 챌린지를 "이동" 카테고리 카드에 등록 ── */
  function registerCategory() {
    // home_mission_patch v5의 CAT_MAP은 클로저라 직접 못 건드림 →
    // 대신 renderOfficialChallenges가 쓰는 전역 매핑이 있으면 보강.
    // v5는 CAT_MAP이 내부 변수이므로, 여기서는 ehOpenCat 호출 시
    // CHALLENGES를 직접 필터하도록 transport 카드에 포함되게 한다.
    // → home_mission_patch v5는 CAT_MAP[c.id]로 거르므로, 101/102가
    //   매핑에 없으면 안 보인다. window._ehExtraCat로 보강 신호를 남기고,
    //   매핑 보강은 아래 patchCatMap()에서 처리.
    patchCatMap();
  }

  // home_mission_patch v5가 노출하는 게 없으므로, 안전하게
  // renderOfficialChallenges를 한 번 더 감싸서 transport에 101/102 포함.
  function patchCatMap() {
    if (window._ehCommuteCatPatched) return;
    // v5는 window.ehOpenCat / renderCatDetail이 CAT_MAP을 내부 참조.
    // 우리가 접근 가능한 지점은 window.CHALLENGES 뿐 → 카테고리 상세를
    // 직접 다시 그리는 래퍼를 transport 한정으로 덮어쓴다.
    const origOpen = window.ehOpenCat;
    if (typeof origOpen !== 'function') { setTimeout(patchCatMap, 600); return; }
    window.ehOpenCat = function (id) {
      origOpen(id);
      if (id === 'transport') setTimeout(injectCommuteCards, 60);
    };
    window._ehCommuteCatPatched = true;
  }

  // 이동 카테고리 상세 화면에 출근/출장 카드를 직접 끼워넣기
  function injectCommuteCards() {
    const grid = document.getElementById('officialGrid');
    if (!grid || typeof CHALLENGES === 'undefined') return;
    [101, 102].forEach(cid => {
      if (document.querySelector(`#officialGrid [data-commute="${cid}"]`)) return;
      const c = CHALLENGES.find(x => x.id === cid);
      if (!c) return;
      const card = document.createElement('div');
      card.className = 'cg-card';
      card.setAttribute('data-commute', cid);
      card.setAttribute('onclick', `openChal(${cid})`);
      card.title = c.title;
      card.innerHTML = `
        <div class="cg-img">
          ${c.emoji}
          <span class="official-tag">공식챌린지</span>
          <span class="cg-cnt">👥 ${(c.baseParticipants || 0).toLocaleString()}명</span>
          ${c.hot ? '<span class="hot-badge">HOT</span>' : ''}
        </div>
        <div class="cg-body">
          <div class="cg-title">${c.title}</div>
          <div class="cg-meta">Scope3 · AI인증</div>
        </div>`;
      grid.appendChild(card);
    });
  }

  /* ── 2. 출근/출장 인증 가로채기 (openAI 래핑) ── */
  // 출근(m_commute)·출장(m_trip) 미션이면 인증 전에 거리·수단 확정
  function wrapOpenAI() {
    const orig = window.openAI;
    if (typeof orig !== 'function') { setTimeout(wrapOpenAI, 500); return; }
    if (window._commuteOpenAIWrapped) return;

    window.openAI = function (m, uid, chalId) {
      // 출근
      if (m && m.id === 'm_commute') {
        const cm = window.UDATA?.commute;
        if (!cm || !cm.distanceKm || !cm.mode) {
          // 미등록 → 안내하고 막기
          promptRegisterCommute();
          return;
        }
        // 등록돼 있으면 그 거리·수단으로 co2 동적 세팅
        const kg = avoidedKg(cm.distanceKm, cm.mode);
        const patched = { ...m, co2: kg };
        window._commuteLastInfo = { type: '출근', distanceKm: cm.distanceKm, mode: cm.mode, kg };
        return orig(patched, uid, chalId);
      }
      // 출장 → 거리 입력 모달 먼저
      if (m && m.id === 'm_trip') {
        askTripDistance((distanceKm, mode) => {
          const kg = avoidedKg(distanceKm, mode);
          const patched = { ...m, co2: kg };
          window._commuteLastInfo = { type: '출장', distanceKm, mode, kg };
          orig(patched, uid, chalId);
        });
        return;
      }
      return orig(m, uid, chalId);
    };
    window._commuteOpenAIWrapped = true;
  }

  /* ── 출퇴근 미등록 안내 ── */
  function promptRegisterCommute() {
    document.getElementById('ovCommuteNeed')?.remove();
    const ov = document.createElement('div');
    ov.id = 'ovCommuteNeed';
    ov.className = 'overlay on';
    ov.innerHTML = `
      <div class="modal" style="padding:26px 22px 30px;text-align:center">
        <div style="font-size:48px;margin-bottom:10px">🚇</div>
        <div style="font-size:17px;font-weight:900;color:#1a2e1a;margin-bottom:8px">먼저 출퇴근을 등록해주세요</div>
        <div style="font-size:13px;color:#666;line-height:1.7;margin-bottom:20px">
          집↔회사 거리와 교통수단을 한 번 등록하면,<br/>
          출근 인증할 때마다 실제 거리 기반으로<br/>
          <b style="color:#2ECC71">정확한 CO₂ 절감량이 자동 계산</b>돼요.
        </div>
        <button onclick="document.getElementById('ovCommuteNeed').remove();window.openCommute&&window.openCommute()"
          style="width:100%;background:linear-gradient(135deg,#0d47a1,#1976d2);color:#fff;border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:10px">
          📍 지금 출퇴근 등록하기
        </button>
        <button onclick="document.getElementById('ovCommuteNeed').remove()"
          style="width:100%;background:#f0f0f0;color:#888;border:none;border-radius:12px;padding:12px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:600">
          나중에
        </button>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  }

  /* ── 출장 거리·수단 입력 모달 ── */
  function askTripDistance(onConfirm) {
    document.getElementById('ovTripDist')?.remove();
    window._tripMode = 'subway';
    window._tripDist = '';
    const ov = document.createElement('div');
    ov.id = 'ovTripDist';
    ov.className = 'overlay on';
    ov.innerHTML = `
      <div class="modal" style="padding:24px 20px 30px">
        <div class="modal-title">🚄 출장 정보 입력</div>
        <div class="modal-desc">이번 출장의 편도 거리와 교통수단을 입력하면 CO₂ 절감량이 자동 계산돼요.</div>

        <div class="form-group">
          <label>편도 거리 (km)</label>
          <input class="inp" id="tripDistInp" type="number" inputmode="decimal" placeholder="예: 서울→부산 약 325" oninput="window._tripDistChange(this.value)"/>
        </div>

        <div class="form-group">
          <label>교통수단</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="tripModeSel">
            ${Object.keys(EF).map(k => `
              <button type="button" onclick="window._tripPickMode('${k}')" id="tripMode-${k}"
                style="display:flex;align-items:center;gap:6px;justify-content:center;padding:11px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;border:${k==='subway'?'2px solid var(--g1)':'1.5px solid var(--bdr)'};background:${k==='subway'?'#f0fbf4':'#fff'};color:var(--txt)">
                <span style="font-size:17px">${EF[k].emoji}</span>${EF[k].label}
              </button>`).join('')}
          </div>
        </div>

        <div id="tripPreview" style="background:#f0fbf4;border-radius:12px;padding:12px 14px;margin-bottom:14px;border:1px solid var(--bdr);text-align:center;display:none">
          <div style="font-size:11px;color:var(--sub)">예상 절감량 (승용차 대비)</div>
          <div style="font-size:24px;font-weight:900;color:var(--g2)" id="tripPreviewVal">0kg</div>
        </div>

        <div style="display:flex;gap:8px">
          <button class="btn btn-gray" style="flex:1" onclick="document.getElementById('ovTripDist').remove()">취소</button>
          <button class="btn btn-g" style="flex:2" onclick="window._tripConfirm()">📸 인증하러 가기</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });

    window._tripPickMode = function (k) {
      window._tripMode = k;
      Object.keys(EF).forEach(m => {
        const el = document.getElementById('tripMode-' + m);
        if (!el) return;
        const on = m === k;
        el.style.border = on ? '2px solid var(--g1)' : '1.5px solid var(--bdr)';
        el.style.background = on ? '#f0fbf4' : '#fff';
      });
      updateTripPreview();
    };
    window._tripDistChange = function (v) { window._tripDist = v; updateTripPreview(); };
    function updateTripPreview() {
      const d = parseFloat(window._tripDist);
      const box = document.getElementById('tripPreview');
      const val = document.getElementById('tripPreviewVal');
      if (!box || !val) return;
      if (!d || d <= 0) { box.style.display = 'none'; return; }
      box.style.display = 'block';
      val.textContent = avoidedKg(d, window._tripMode) + 'kg';
    }
    window._tripConfirm = function () {
      const d = parseFloat(window._tripDist);
      if (!d || d <= 0) { window.toast && window.toast('편도 거리를 입력해주세요!'); return; }
      document.getElementById('ovTripDist')?.remove();
      onConfirm(d, window._tripMode);
    };
  }

  /* ── 부트 ── */
  function boot() {
    registerCategory();
    wrapOpenAI();
    console.log('[commute_calc_patch] ✅ 출근/출장 거리×배출계수 자동계산 로드');
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1800));
  else
    setTimeout(boot, 1800);
})();
