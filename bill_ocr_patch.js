/* =====================================================
   EcoQuest – bill_ocr_patch.js
   기업 탄소경영 — 전기·가스 고지서 OCR → Scope 1·2 자동 산정
   ─────────────────────────────────────────────────────
   • 고지서 사진 → /api/ocr-bill (Gemini Vision) → 사용량 추출
   • 추출값은 직접 수정 가능 (OCR 100% 아니므로 감사 대응용)
   • 배출계수 곱 → Scope 2(전력)·Scope 1(가스) → 합산 CO₂eq
   ─────────────────────────────────────────────────────
   ★ /api/ocr-bill.js 서버 파일 + GEMINI_API_KEY 환경변수 필요
   ★ 로드 위치: 아무 patch 뒤나 OK
   ===================================================== */
(function(){
  'use strict';
  if(window._billOcrLoaded) return;
  window._billOcrLoaded = true;

  // ───── 배출계수 (최신 공고값으로 교체하세요) ─────
  const EF_ELEC = 0.4173;   // 전력  kgCO₂eq/kWh  (2023년도 확정 / 2025.12.17 기후에너지환경부 공표)
  const EF_GAS  = 2.176;    // 도시가스 kgCO₂/m³
  const EF_HEAT = 0.2;      // 지역난방 열 kgCO₂/Mcal  (추정값 — 한국지역난방공사 해당연도 스팀 배출계수로 교체 권장)
  // ───────────────────────────────────────────────

  let _billState = null; // { company, period, elecKwh, gasM3, imgB64 }

  /* ── 소속 탭 진입 버튼 ── */
  function injectEntry(){
    const page = document.getElementById('page-company');
    if(!page) return;
    // 베타 단계: 소속 여부 상관없이 모두 노출
    if(document.getElementById('billOcrEntry')) return;
    const card = document.createElement('div');
    card.id = 'billOcrEntry';
    card.style.cssText = 'margin:12px;padding:15px 16px;background:linear-gradient(135deg,#0f3d20,#1a6b3a);border-radius:14px;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(15,61,32,.25)';
    card.onclick = () => window.openBillOCR();
    card.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between">
      <div><div style="font-size:14px;font-weight:900">🏭 기업 탄소배출 계산</div>
      <div style="font-size:11px;color:rgba(255,255,255,.82);margin-top:4px">전기·가스 고지서 사진 → AI가 Scope 1·2 자동 산정</div></div>
      <div style="font-size:22px">📄→📊</div></div>`;
    page.insertBefore(card, page.firstChild);
  }
  setInterval(injectEntry, 1500);
  setTimeout(injectEntry, 1600);

  /* ── 메인 모달 ── */
  window.openBillOCR = function(){
    _billState = null;
    document.getElementById('ovBillOCR')?.remove();
    const ov = document.createElement('div');
    ov.id = 'ovBillOCR';
    ov.style.cssText = 'position:fixed;inset:0;background:#0a1f12;z-index:11500;display:flex;flex-direction:column;overflow-y:auto';
    ov.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.1)">
        <div style="color:#fff;font-size:14px;font-weight:900">🏭 기업 탄소경영 — Scope 1·2 고지서 OCR</div>
        <button onclick="document.getElementById('ovBillOCR').remove()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer;font-family:inherit">✕</button>
      </div>
      <div id="billBody" style="flex:1;padding:18px 16px 40px"></div>
      <input id="billFileIn" type="file" accept="image/*" style="display:none"/>`;
    document.body.appendChild(ov);
    document.getElementById('billFileIn').addEventListener('change', onBillFile);
    renderBillUpload();
  };

  function renderBillUpload(){
    const b = document.getElementById('billBody');
    if(!b) return;
    b.innerHTML = `
      <div style="max-width:440px;margin:0 auto">
        <div onclick="document.getElementById('billFileIn').click()" style="background:rgba(255,255,255,.06);border:2px dashed rgba(168,240,198,.5);border-radius:18px;padding:48px 20px;text-align:center;cursor:pointer">
          <div style="font-size:54px;margin-bottom:14px">📄</div>
          <div style="font-size:16px;font-weight:900;color:#a8f0c6">고지서·관리비 사진 올리기</div>
          <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:8px;line-height:1.7">전기요금 청구서, 도시가스 고지서,<br/>아파트 관리비 고지서 모두 가능해요</div>
        </div>
        <div style="margin-top:20px;background:rgba(255,255,255,.05);border-radius:12px;padding:14px 16px">
          <div style="font-size:11px;color:#a8f0c6;font-weight:700;margin-bottom:8px">📊 어떻게 계산되나요?</div>
          <div style="font-size:11px;color:rgba(255,255,255,.7);line-height:1.9">
            ① AI가 전기(kWh)·가스(m³)·난방·온수(Mcal) 사용량 추출<br/>
            ② 전기·지역난방=Scope 2 / 도시가스=Scope 1<br/>
            ③ 배출계수 곱해서 합산 → 총 CO₂eq<br/>
            <span style="color:rgba(255,255,255,.5)">* 수도는 탄소배출이 거의 없어 제외 · 추출값 수정 가능</span>
          </div>
        </div>
      </div>`;
  }

  async function onBillFile(e){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      let b64 = String(reader.result).split(',')[1];
      // 압축 (Vercel 4.5MB 제한 회피)
      if(typeof window.compressImage === 'function'){
        try { b64 = (await window.compressImage(b64, 1280)).split(',')[1]; }catch(_){}
      }
      _billState = { imgB64: b64 };
      renderBillAnalyzing();
      await analyzeBill(b64);
    };
    reader.readAsDataURL(file);
  }

  function renderBillAnalyzing(){
    const b = document.getElementById('billBody');
    if(!b) return;
    b.innerHTML = `
      <div style="max-width:440px;margin:0 auto;text-align:center;padding-top:40px">
        <img src="data:image/jpeg;base64,${_billState.imgB64}" style="max-width:100%;max-height:240px;border-radius:14px;margin-bottom:24px;box-shadow:0 6px 20px rgba(0,0,0,.4)"/>
        <div style="font-size:34px;margin-bottom:12px;animation:billSpin 1.2s linear infinite;display:inline-block">⚙️</div>
        <div style="font-size:15px;font-weight:900;color:#a8f0c6">고지서를 판독하고 있어요...</div>
        <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:8px">Gemini Vision이 사용량을 추출 중</div>
      </div>
      <style>@keyframes billSpin{to{transform:rotate(360deg)}}</style>`;
  }

  async function analyzeBill(b64){
    try {
      const r = await fetch('/api/ocr-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64 })
      });
      if(!r.ok){
        const t = await r.text();
        throw new Error('서버 ' + r.status + ': ' + t);
      }
      const data = await r.json();
      _billState.company = data.company || '';
      _billState.period  = data.period || '';
      _billState.elecKwh = data.elecKwh;
      _billState.gasM3   = data.gasM3;
      _billState.heatMcal = data.heatMcal;
      _billState.hotWaterMcal = data.hotWaterMcal;
      renderBillResult();
    } catch(e){
      console.error('[bill_ocr] 분석 오류', e);
      const b = document.getElementById('billBody');
      if(b) b.innerHTML = `<div style="max-width:440px;margin:0 auto;text-align:center;padding-top:50px">
        <div style="font-size:44px;margin-bottom:14px">⚠️</div>
        <div style="font-size:15px;font-weight:900;color:#ff8f8f">판독 실패</div>
        <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:8px;line-height:1.7">${e.message}<br/>API 키(GEMINI_API_KEY)와 /api/ocr-bill 배포를 확인해주세요</div>
        <button onclick="window.openBillOCR()" style="margin-top:20px;background:#2ECC71;color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit">다시 시도</button>
      </div>`;
    }
  }

  function renderBillResult(){
    const b = document.getElementById('billBody');
    if(!b) return;
    const s = _billState;
    const inp = (id, val, unit) => `<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border-radius:10px;padding:10px 14px">
        <input id="${id}" type="number" inputmode="decimal" value="${val ?? ''}" placeholder="0" oninput="window._billRecalc()" style="flex:1;background:none;border:none;color:#fff;font-size:20px;font-weight:900;font-family:inherit;outline:none;width:100%"/>
        <span style="font-size:13px;color:rgba(255,255,255,.6);font-weight:700">${unit}</span>
      </div>`;

    b.innerHTML = `
      <div style="max-width:480px;margin:0 auto">
        <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:18px;flex-wrap:wrap">
          <img src="data:image/jpeg;base64,${s.imgB64}" style="width:120px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.4)"/>
          <div style="flex:1;min-width:140px">
            <div style="font-size:10px;color:#a8f0c6;font-weight:700;letter-spacing:1px">✓ Gemini Vision 판독 완료</div>
            <div style="font-size:15px;font-weight:900;color:#fff;margin-top:4px">${s.company || '고객명 미확인'}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:2px">${s.period || ''}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:8px;line-height:1.5">숫자가 틀렸으면<br/>직접 고칠 수 있어요 ✏️</div>
          </div>
        </div>

        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:6px">⚡ 전력 사용량</div>
        ${inp('billElec', s.elecKwh, 'kWh')}
        <div style="height:10px"></div>
        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:6px">🔥 도시가스 사용량</div>
        ${inp('billGas', s.gasM3, 'm³')}
        <div style="height:10px"></div>
        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:6px">♨️ 난방 (지역난방)</div>
        ${inp('billHeat', s.heatMcal, 'Mcal')}
        <div style="height:10px"></div>
        <div style="font-size:12px;color:rgba(255,255,255,.7);font-weight:700;margin-bottom:6px">🚿 급탕·온수</div>
        ${inp('billHotWater', s.hotWaterMcal, 'Mcal')}

        <div style="margin-top:20px;background:rgba(255,255,255,.05);border-radius:14px;padding:16px">
          <div style="font-size:11px;color:#a8f0c6;font-weight:700;margin-bottom:12px">배출계수 자동 적용 <span style="color:rgba(255,255,255,.4);font-weight:400">(전력 ${EF_ELEC} · 가스 ${EF_GAS} · 열 ${EF_HEAT})</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-size:12px;color:rgba(255,255,255,.7)"><b style="color:#fff">Scope 2</b> 전력 <span id="billElecCalc" style="color:rgba(255,255,255,.5)"></span></div>
            <div id="billElecKg" style="font-size:14px;font-weight:900;color:#a8f0c6">0 kg</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-size:12px;color:rgba(255,255,255,.7)"><b style="color:#fff">Scope 1</b> 가스 <span id="billGasCalc" style="color:rgba(255,255,255,.5)"></span></div>
            <div id="billGasKg" style="font-size:14px;font-weight:900;color:#a8f0c6">0 kg</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:12px;color:rgba(255,255,255,.7)"><b style="color:#fff">Scope 2</b> 지역난방 열 <span id="billHeatCalc" style="color:rgba(255,255,255,.5)"></span></div>
            <div id="billHeatKg" style="font-size:14px;font-weight:900;color:#a8f0c6">0 kg</div>
          </div>
        </div>

        <div style="margin-top:14px;background:linear-gradient(135deg,#1a6b3a,#2ECC71);border-radius:16px;padding:18px;text-align:center;color:#fff">
          <div style="font-size:11px;color:rgba(255,255,255,.85);font-weight:700">Scope 1 · 2 총 배출량</div>
          <div style="margin-top:6px"><span id="billTotal" style="font-size:34px;font-weight:900">0</span> <span style="font-size:15px;font-weight:700">kg CO₂eq</span></div>
        </div>

        <div style="display:flex;gap:8px;margin-top:16px">
          <button onclick="document.getElementById('billFileIn').click()" style="flex:1;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:12px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">📄 다른 고지서</button>
          <button onclick="window._billShare()" style="flex:1;background:#fff;border:none;color:#1a6b3a;border-radius:12px;padding:13px;font-size:13px;font-weight:900;cursor:pointer;font-family:inherit">📋 결과 복사</button>
        </div>
      </div>`;
    window._billRecalc();
  }

  window._billRecalc = function(){
    const elec = parseFloat(document.getElementById('billElec')?.value) || 0;
    const gas  = parseFloat(document.getElementById('billGas')?.value) || 0;
    const heat = parseFloat(document.getElementById('billHeat')?.value) || 0;
    const hotW = parseFloat(document.getElementById('billHotWater')?.value) || 0;
    const heatTotal = heat + hotW;   // 난방 + 급탕 모두 지역난방 열(Mcal)
    const elecKg = elec * EF_ELEC;
    const gasKg  = gas * EF_GAS;
    const heatKg = heatTotal * EF_HEAT;
    const total  = elecKg + gasKg + heatKg;
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    set('billElecCalc', elec ? `${elec.toLocaleString()} × ${EF_ELEC}` : '');
    set('billGasCalc',  gas  ? `${gas.toLocaleString()} × ${EF_GAS}` : '');
    set('billHeatCalc', heatTotal ? `${heatTotal.toLocaleString()} × ${EF_HEAT}` : '');
    set('billElecKg', `${Math.round(elecKg).toLocaleString()} kg`);
    set('billGasKg',  `${Math.round(gasKg).toLocaleString()} kg`);
    set('billHeatKg', `${Math.round(heatKg).toLocaleString()} kg`);
    set('billTotal',  Math.round(total).toLocaleString());
    if(_billState){ _billState.elecKwh = elec; _billState.gasM3 = gas; _billState.heatMcal = heat; _billState.hotWaterMcal = hotW; }
  };

  window._billShare = function(){
    const s = _billState; if(!s) return;
    const elec = s.elecKwh || 0, gas = s.gasM3 || 0;
    const heat = (s.heatMcal || 0) + (s.hotWaterMcal || 0);
    const elecKg = Math.round(elec*EF_ELEC), gasKg = Math.round(gas*EF_GAS), heatKg = Math.round(heat*EF_HEAT);
    const lines = [`[EcoQuest 탄소경영 — Scope 1·2]`, `${s.company||''} ${s.period||''}`];
    if(elec) lines.push(`⚡ 전력 ${elec.toLocaleString()} kWh → Scope 2 ${elecKg.toLocaleString()} kg`);
    if(gas)  lines.push(`🔥 가스 ${gas.toLocaleString()} m³ → Scope 1 ${gasKg.toLocaleString()} kg`);
    if(heat) lines.push(`♨️ 지역난방 ${heat.toLocaleString()} Mcal → Scope 2 ${heatKg.toLocaleString()} kg`);
    lines.push(`─────────────`);
    lines.push(`총 ${(elecKg+gasKg+heatKg).toLocaleString()} kg CO₂eq`);
    lines.push(`(배출계수: 전력 ${EF_ELEC}, 가스 ${EF_GAS}, 열 ${EF_HEAT})`);
    const text = lines.join('\n');
    if(navigator.clipboard){ navigator.clipboard.writeText(text).then(()=>window.toast && window.toast('📋 결과가 복사됐어요!')); }
  };

  console.log('[bill_ocr_patch] 로드됨');
})();
