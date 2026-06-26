/* =====================================================
   EcoQuest – commute_patch.js
   출퇴근(통근) 등록 — Scope 3 Cat.7
   ─────────────────────────────────────────────────────
   • 집↔회사 주소 → 카카오 길찾기로 경로 거리 자동 계산
   • 교통수단 선택 → 수단별 배출계수 적용
   • 주 출근일수 → 연간 통근 배출 추정
   • companyId 로 회사 전체 Scope 3 집계
   ─────────────────────────────────────────────────────
   ★ /api/commute-distance.js + KAKAO_REST_API_KEY 필요
   ★ 로드 위치: 아무 patch 뒤나 OK
   ===================================================== */
(function(){
  'use strict';
  if(window._commuteLoaded) return;
  window._commuteLoaded = true;

  // ───── 교통수단별 배출계수 (gCO₂/km) — 공식값으로 교체 권장 ─────
  const EF = {
    walk_bike: { g:0,   label:'도보·자전거', emoji:'🚶' },
    subway:    { g:26,  label:'지하철·전철', emoji:'🚇' },
    bus:       { g:57,  label:'버스',        emoji:'🚌' },
    car:       { g:210, label:'승용차·택시', emoji:'🚗' },
  };
  const WEEKS_PER_YEAR = 48;   // 연간 근무주 (휴가 등 제외 추정)
  // ───────────────────────────────────────────────────────────

  let _cm = null; // {fromAddr, toAddr, distanceKm, mode, daysPerWeek}

  function annualKg(distanceKm, mode, daysPerWeek){
    const g = (EF[mode]?.g) || 0;
    return distanceKm * 2 * daysPerWeek * WEEKS_PER_YEAR * g / 1000;
  }

  /* ── 소속 탭 진입 버튼 ── */
  function injectEntry(){
    const page = document.getElementById('page-company');
    if(!page) return;
    if(document.getElementById('commuteEntry')) return;
    const has = !!(window.UDATA && window.UDATA.commute);
    const card = document.createElement('div');
    card.id = 'commuteEntry';
    card.style.cssText = 'margin:12px;padding:15px 16px;background:linear-gradient(135deg,#0d47a1,#1976d2);border-radius:14px;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(13,71,161,.25)';
    card.onclick = () => window.openCommute();
    card.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between">
      <div><div style="font-size:14px;font-weight:900">🚇 내 출퇴근 등록 ${has?'<span style="font-size:10px;color:#a8d4ff">✓ 등록됨</span>':''}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.82);margin-top:4px">집↔회사 한 번 등록 → 연간 통근 탄소배출 자동 계산 (Scope 3)</div></div>
      <div style="font-size:22px">📍→🏢</div></div>`;
    page.insertBefore(card, page.firstChild);
  }
  setInterval(injectEntry, 1500);
  setTimeout(injectEntry, 1600);

  /* ── 모달 ── */
  window.openCommute = function(){
    const prev = (window.UDATA && window.UDATA.commute) || null;
    _cm = prev ? { ...prev } : { fromAddr:'', toAddr:'', distanceKm:null, mode:null, daysPerWeek:5 };
    document.getElementById('ovCommute')?.remove();
    const ov = document.createElement('div');
    ov.id = 'ovCommute';
    ov.style.cssText = 'position:fixed;inset:0;background:#0a1530;z-index:11500;display:flex;flex-direction:column;overflow-y:auto';
    ov.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.1)">
        <div style="color:#fff;font-size:14px;font-weight:900">🚇 출퇴근 등록 — Scope 3 통근</div>
        <button onclick="document.getElementById('ovCommute').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;font-family:inherit">✕</button>
      </div>
      <div id="commuteBody" style="flex:1;padding:18px 16px 40px"></div>`;
    document.body.appendChild(ov);
    renderCommute();
  };

  function renderCommute(){
    const b = document.getElementById('commuteBody');
    if(!b) return;
    const s = _cm;
    const inputStyle = 'width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box';

    b.innerHTML = `
      <div style="max-width:460px;margin:0 auto">
        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:6px">🏠 집 주소 (출발지)</div>
        <input id="cmFrom" value="${(s.fromAddr||'').replace(/"/g,'&quot;')}" placeholder="예: 서울 강남구 영동대로 602" style="${inputStyle}"/>
        <div style="height:10px"></div>
        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:6px">🏢 회사 주소 (도착지)</div>
        <input id="cmTo" value="${(s.toAddr||'').replace(/"/g,'&quot;')}" placeholder="예: 서울 성동구 ..." style="${inputStyle}"/>

        <button onclick="window._cmCalcDist()" id="cmCalcBtn" style="width:100%;margin-top:12px;background:#1976d2;color:#fff;border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">📍 거리 계산하기</button>

        <div id="cmDistBox" style="margin-top:14px;${s.distanceKm?'':'display:none'}">
          <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:12px 14px;text-align:center">
            <span style="font-size:11px;color:rgba(255,255,255,.6)">편도 거리</span>
            <div><span id="cmDistVal" style="font-size:26px;font-weight:900;color:#a8d4ff">${s.distanceKm||0}</span> <span style="font-size:13px;color:rgba(255,255,255,.6);font-weight:700">km</span></div>
          </div>
        </div>

        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin:18px 0 8px">🚊 주 교통수단</div>
        <div id="cmModes" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${Object.keys(EF).map(k=>`<button onclick="window._cmPickMode('${k}')" id="cmMode-${k}" style="display:flex;align-items:center;gap:8px;justify-content:center;padding:13px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;border:${s.mode===k?'2px solid #4da3ff':'1.5px solid rgba(255,255,255,.2)'};background:${s.mode===k?'rgba(77,163,255,.18)':'rgba(255,255,255,.06)'};color:#fff"><span style="font-size:18px">${EF[k].emoji}</span>${EF[k].label}</button>`).join('')}
        </div>

        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin:18px 0 8px">📅 주 출근일수 <span style="color:rgba(255,255,255,.45);font-weight:400">(재택·하이브리드 반영)</span></div>
        <div id="cmDays" style="display:flex;gap:6px">
          ${[1,2,3,4,5,6,7].map(n=>`<button onclick="window._cmPickDays(${n})" id="cmDay-${n}" style="flex:1;padding:11px 0;border-radius:9px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:800;border:${s.daysPerWeek===n?'2px solid #4da3ff':'1.5px solid rgba(255,255,255,.2)'};background:${s.daysPerWeek===n?'rgba(77,163,255,.18)':'rgba(255,255,255,.06)'};color:#fff">${n}</button>`).join('')}
        </div>

        <div id="cmResultBox" style="margin-top:20px;${(s.distanceKm&&s.mode)?'':'display:none'}">
          <div style="background:linear-gradient(135deg,#1565c0,#42a5f5);border-radius:16px;padding:18px;text-align:center;color:#fff">
            <div style="font-size:11px;color:rgba(255,255,255,.85);font-weight:700">내 연간 통근 탄소배출 (추정)</div>
            <div style="margin-top:6px"><span id="cmAnnual" style="font-size:32px;font-weight:900">0</span> <span style="font-size:14px;font-weight:700">kg CO₂/년</span></div>
            <div id="cmFormula" style="font-size:10px;color:rgba(255,255,255,.7);margin-top:6px"></div>
          </div>
        </div>

        <button onclick="window._cmSave()" id="cmSaveBtn" style="width:100%;margin-top:16px;background:#fff;color:#0d47a1;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit">저장하기</button>

        <div id="cmCompanyBox" style="margin-top:20px"></div>
      </div>`;
    if(s.distanceKm && s.mode) recalcCommute();
    loadCompanyCommute();
  }

  window._cmCalcDist = async function(){
    const from = document.getElementById('cmFrom')?.value?.trim();
    const to = document.getElementById('cmTo')?.value?.trim();
    if(!from || !to){ window.toast && window.toast('집·회사 주소를 모두 입력해주세요'); return; }
    const btn = document.getElementById('cmCalcBtn');
    btn.disabled = true; btn.textContent = '📍 계산 중...';
    try {
      const r = await fetch('/api/commute-distance', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ from, to })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error || ('서버 '+r.status));
      _cm.fromAddr = from; _cm.toAddr = to; _cm.distanceKm = d.distanceKm;
      document.getElementById('cmDistVal').textContent = d.distanceKm;
      document.getElementById('cmDistBox').style.display = '';
      recalcCommute();
      window.toast && window.toast(`📍 편도 ${d.distanceKm}km`);
    } catch(e){
      console.error('[commute] 거리계산 오류', e);
      window.toast && window.toast('거리 계산 실패: ' + e.message);
    }
    btn.disabled = false; btn.textContent = '📍 거리 다시 계산';
  };

  window._cmPickMode = function(k){
    _cm.mode = k;
    Object.keys(EF).forEach(m=>{
      const el = document.getElementById('cmMode-'+m); if(!el) return;
      const on = m===k;
      el.style.border = on?'2px solid #4da3ff':'1.5px solid rgba(255,255,255,.2)';
      el.style.background = on?'rgba(77,163,255,.18)':'rgba(255,255,255,.06)';
    });
    recalcCommute();
  };
  window._cmPickDays = function(n){
    _cm.daysPerWeek = n;
    [1,2,3,4,5,6,7].forEach(d=>{
      const el = document.getElementById('cmDay-'+d); if(!el) return;
      const on = d===n;
      el.style.border = on?'2px solid #4da3ff':'1.5px solid rgba(255,255,255,.2)';
      el.style.background = on?'rgba(77,163,255,.18)':'rgba(255,255,255,.06)';
    });
    recalcCommute();
  };

  function recalcCommute(){
    if(!_cm.distanceKm || !_cm.mode){ return; }
    const kg = annualKg(_cm.distanceKm, _cm.mode, _cm.daysPerWeek);
    const box = document.getElementById('cmResultBox'); if(box) box.style.display = '';
    const a = document.getElementById('cmAnnual'); if(a) a.textContent = Math.round(kg).toLocaleString();
    const f = document.getElementById('cmFormula');
    if(f){
      const g = EF[_cm.mode].g;
      f.textContent = `${_cm.distanceKm}km × 왕복 × 주 ${_cm.daysPerWeek}일 × ${WEEKS_PER_YEAR}주 × ${g}g`;
    }
  }

  window._cmSave = async function(){
    if(!window.ME || !window.FB){ window.toast && window.toast('로그인이 필요해요'); return; }
    if(!_cm.distanceKm || !_cm.mode){ window.toast && window.toast('거리 계산과 교통수단 선택을 먼저 해주세요'); return; }
    const btn = document.getElementById('cmSaveBtn');
    btn.disabled = true; btn.textContent = '저장 중...';
    try {
      const kg = +annualKg(_cm.distanceKm, _cm.mode, _cm.daysPerWeek).toFixed(1);
      const commute = {
        fromAddr: _cm.fromAddr, toAddr: _cm.toAddr,
        distanceKm: _cm.distanceKm, mode: _cm.mode,
        daysPerWeek: _cm.daysPerWeek, annualKg: kg
      };
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { commute });
      if(window.UDATA) window.UDATA.commute = commute;
      window.toast && window.toast(`✅ 등록 완료! 연간 ${Math.round(kg).toLocaleString()}kg`);
      document.getElementById('ovCommute')?.remove();
    } catch(e){
      console.error('[commute] 저장 오류', e);
      window.toast && window.toast('저장 실패: ' + e.message);
    }
    btn.disabled = false; btn.textContent = '저장하기';
  };

  /* ── 회사 단위 집계 ── */
  async function loadCompanyCommute(){
    const box = document.getElementById('cmCompanyBox');
    if(!box || !window.ME || !window.FB) return;
    const cid = window.UDATA && window.UDATA.companyId;
    if(!cid){ box.innerHTML = ''; return; }
    try {
      const q = window.FB.query(
        window.FB.collection(window.FB.db, 'users'),
        window.FB.where('companyId', '==', cid)
      );
      const snap = await window.FB.getDocs(q);
      let total = 0, registered = 0, members = 0;
      snap.forEach(doc => {
        members++;
        const c = doc.data().commute;
        if(c && typeof c.annualKg === 'number'){ total += c.annualKg; registered++; }
      });
      box.innerHTML = `
        <div style="background:rgba(255,255,255,.05);border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,.12)">
          <div style="font-size:11px;color:#a8d4ff;font-weight:700;letter-spacing:1px;margin-bottom:10px">🏢 우리 회사 통근 배출 (Scope 3 Cat.7)</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;color:rgba(255,255,255,.7)">등록 ${registered}/${members}명 연간 합계</div>
            <div style="font-size:20px;font-weight:900;color:#fff">${Math.round(total).toLocaleString()} <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,.7)">kg/년</span></div>
          </div>
          <div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:8px;line-height:1.5">* 임직원이 각자 등록할수록 정확해져요 · ESG 보고서용 회사 집계</div>
        </div>`;
    } catch(e){
      console.log('[commute] 회사 집계 실패:', e.message);
      box.innerHTML = '';
    }
  }

  console.log('[commute_patch] 로드됨');
})();
