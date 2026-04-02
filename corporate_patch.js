/* =====================================================
   EcoQuest – 자유 빈도 선택 패치
   주 1~7회 자유 설정 + 참여 후 변경 가능
   ===================================================== */
(function () {
  'use strict';

  function freqHint(n) {
    return ['','가볍게 시작','균형잡힌 페이스','추천 💚','활발하게','열심히!','거의 매일','매일! 🌍'][Math.min(n,7)] || '';
  }
  window._fhintOf = freqHint;

  function calcTotal(ac) {
    const n = ac.freqPerWeek
      ?? (ac.freq === 'daily' ? 7
        : ac.freq === 'w5'   ? 5
        : ac.freq === 'w3'   ? 3
        : parseInt((ac.freq || 'w1').replace('w', '')) || 1);
    return n * (ac.weeks || 2);
  }

  let _freq = 3, _weeks = 2;

  window.openChal = function (id) {
    const c = CHALLENGES.find(x => x.id === id);
    if (!c) return;
    _freq = 3; _weeks = 2;
    drawModal(c);
    openOv('ovChal');
  };

  function drawModal(c) {
    const root = document.getElementById('chalDetail');
    if (!root) return;
    const m    = MISSIONS.find(x => x.id === c.missionId);
    const tot  = _freq * _weeks;
    const pts  = (c.baseParticipants || 0) + Math.floor(Math.random() * 50);
    const earn = m ? m.point * tot : 0;
    const co2  = m ? (m.co2 * tot).toFixed(1) : 0;

    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="font-size:40px">${c.emoji}</div>
        <div>
          <div style="font-size:10px;font-weight:700;background:var(--g1);color:#fff;
                      padding:2px 8px;border-radius:8px;display:inline-block;margin-bottom:4px">공식 챌린지</div>
          <div style="font-size:17px;font-weight:900;color:var(--txt)">${c.title}</div>
          <div style="font-size:12px;color:var(--sub);margin-top:2px">⭐ 4.8 · 👥 ${pts.toLocaleString()}명</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--sub);margin-bottom:18px;line-height:1.6">${c.desc}</div>

      <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:8px">📅 주 몇 회 인증할까요?</div>
      <div style="display:flex;align-items:center;gap:14px;background:#f0fbf4;border-radius:16px;
                  padding:16px;margin-bottom:8px;border:1.5px solid #c8e6c9">
        <button onclick="_adjF(-1,${c.id})"
          style="width:40px;height:40px;border-radius:50%;border:2px solid var(--g1);background:#fff;
                 font-size:24px;font-weight:900;cursor:pointer;color:var(--g2);
                 display:flex;align-items:center;justify-content:center;flex-shrink:0">−</button>
        <div style="flex:1;text-align:center">
          <div id="_fval" style="font-size:32px;font-weight:900;color:var(--g2);line-height:1.1">
            ${_freq >= 7 ? '매일' : '주 ' + _freq + '회'}
          </div>
          <div id="_fhint" style="font-size:11px;color:var(--sub);margin-top:6px">${freqHint(_freq)}</div>
        </div>
        <button onclick="_adjF(1,${c.id})"
          style="width:40px;height:40px;border-radius:50%;border:2px solid var(--g1);background:var(--g1);
                 font-size:24px;font-weight:900;cursor:pointer;color:#fff;
                 display:flex;align-items:center;justify-content:center;flex-shrink:0">+</button>
      </div>
      <div style="font-size:11px;color:var(--sub);text-align:center;margin-bottom:18px">
        주 1회 ~ 매일(주 7회) · 참여 후에도 변경 가능해요
      </div>

      <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:8px">🗓️ 챌린지 기간</div>
      <div style="display:flex;gap:6px;margin-bottom:16px">
        ${[1,2,4,8].map(w => `<button class="dep-btn${_weeks===w?' on':''}" style="flex:1"
            onclick="_adjW(${w},${c.id})">${w}주</button>`).join('')}
      </div>

      <div style="background:linear-gradient(135deg,#f0fbf4,#e8f5e9);border-radius:14px;
                  padding:14px;margin-bottom:14px;border:1px solid var(--bdr)">
        <div style="font-size:12px;font-weight:700;color:var(--g2);margin-bottom:10px">🏅 예상 달성 보상</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
          <div style="background:#fff;border-radius:10px;padding:9px">
            <div id="_rtot" style="font-size:19px;font-weight:900;color:var(--g2)">${tot}회</div>
            <div style="font-size:10px;color:var(--sub);margin-top:2px">총 인증</div>
          </div>
          <div style="background:#fff;border-radius:10px;padding:9px">
            <div id="_rpts" style="font-size:19px;font-weight:900;color:var(--acc)">+${earn.toLocaleString()}P</div>
            <div style="font-size:10px;color:var(--sub);margin-top:2px">예상 포인트</div>
          </div>
          <div style="background:#fff;border-radius:10px;padding:9px">
            <div id="_rco2" style="font-size:19px;font-weight:900;color:var(--blue)">-${co2}kg</div>
            <div style="font-size:10px;color:var(--sub);margin-top:2px">CO₂ 절감</div>
          </div>
        </div>
      </div>

      <div style="background:#1a2e1a;border-radius:12px;padding:12px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:6px">📸 인증 방법</div>
        <div style="font-size:12px;color:rgba(255,255,255,.75);line-height:1.8">
          🤖 AI가 인증샷을 자동으로 확인해요<br>
          ✅ 하루 0시~자정 사이에 언제든 인증<br>
          ✅ 카메라 촬영 또는 사진첩 모두 가능
        </div>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn btn-gray" style="flex:1" onclick="closeOv('ovChal')">닫기</button>
        <button class="btn btn-g" style="flex:2"
          onclick="_doJoin('${c.title.replace(/'/g,"\\'")}',${c.id})">
          🌱 지금 시작!
        </button>
      </div>`;
  }

  window._adjF = function (d, cid) {
    _freq = Math.max(1, Math.min(7, _freq + d));
    drawModal(CHALLENGES.find(x => x.id === cid));
  };
  window._adjW = function (w, cid) {
    _weeks = w;
    drawModal(CHALLENGES.find(x => x.id === cid));
  };

  window._doJoin = async function (title, cid) {
    if (!window.ME) { toast('로그인이 필요해요!'); return; }
    const ch = CHALLENGES.find(x => x.id === cid);
    if (!ch) return;

    const active = window.UDATA?.activeChallenges || [];
    if (active.some(a => a.challengeId === cid)) { toast('이미 참여 중인 챌린지예요!'); return; }

    closeOv('ovChal');
    const start = new Date().toISOString().split('T')[0];
    const end   = new Date(Date.now() + _weeks * 7 * 86400000).toISOString().split('T')[0];

    const entry = {
      challengeId:    cid,
      challengeTitle: title,
      emoji:          ch.emoji,
      missionId:      ch.missionId,
      freq:           _freq >= 7 ? 'daily' : 'w' + _freq,
      freqPerWeek:    _freq,
      weeks:          _weeks,
      deposit:        0,
      startDate:      start,
      endDate:        end,
    };

    try {
      const newActive = [...active, entry];
      await window.FB.updateDoc(
        window.FB.doc(window.FB.db, 'users', window.ME.uid),
        { activeChallenges: newActive }
      );
      window.UDATA.activeChallenges = newActive;
      renderTodayQuests(window.ME.uid);
      renderHomeChalls();
      try {
        await window.FB.setDoc(
          window.FB.doc(window.FB.db, 'stats', 'challenges'),
          { [`c${cid}`]: window.FB.increment(1) }, { merge: true }
        );
      } catch (_) {}
      toast(`🎉 "${title}" ${_freq >= 7 ? '매일' : '주 ' + _freq + '회'} ${_weeks}주 챌린지 시작!`);
      renderOfficialChallenges();
    } catch(e) { toast('참여 실패: ' + e.message); }
  };

  window.renderHomeChalls = function () {
    const w = document.getElementById('homeChallList');
    if (!w) return;

    const validIds = CHALLENGES.map(c => c.missionId);
    const active   = (window.UDATA?.activeChallenges || [])
                       .filter(ac => validIds.includes(ac.missionId));

    if (!active.length) {
      w.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--sub);font-size:13px">
          참여 중인 챌린지가 없어요!<br>
          <button onclick="goPage('chal')"
            style="margin-top:10px;background:var(--g1);color:#fff;border:none;
                   border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700;
                   cursor:pointer;font-family:inherit">챌린지 참여하기 🌱</button>
        </div>`;
      return;
    }

    w.innerHTML = active.map(ac => {
      const chal = CHALLENGES.find(c => c.id === ac.challengeId);
      if (!chal) return '';
      const n        = ac.freqPerWeek ?? (ac.freq==='daily'?7:parseInt((ac.freq||'w1').replace('w',''))||1);
      const fLabel   = n >= 7 ? '매일' : `주 ${n}회`;
      const total    = calcTotal(ac);
      const done     = (window.UDATA?.completedDates || {})[ac.challengeId] || 0;
      const pct      = Math.min(100, Math.floor(done / total * 100));
      const daysLeft = ac.endDate
        ? Math.max(0, Math.ceil((new Date(ac.endDate) - new Date()) / 86400000)) : '?';

      return `
        <div style="background:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px;border:1.5px solid var(--g1)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer"
               onclick="openChal(${chal.id})">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:24px">${chal.emoji}</span>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--txt)">${chal.title}</div>
                <div style="font-size:11px;color:var(--sub);margin-top:2px">
                  ${fLabel} · ${ac.weeks}주 · ${daysLeft}일 남음
                </div>
              </div>
            </div>
            <span style="background:#e8f5e9;color:var(--g2);font-size:11px;font-weight:700;
                         padding:3px 8px;border-radius:10px;white-space:nowrap">${done}/${total}</span>
          </div>
          <div style="background:#e0f2e7;border-radius:6px;height:6px;overflow:hidden;margin-bottom:8px">
            <div style="width:${pct}%;background:linear-gradient(90deg,var(--g1),var(--acc));
                        height:100%;border-radius:6px;transition:width .5s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;gap:8px;align-items:center">
              <span style="font-size:11px;color:var(--sub)">${pct}% 달성</span>
              <button onclick="event.stopPropagation();openChangeFreq(${ac.challengeId})"
                style="font-size:11px;padding:3px 8px;border-radius:8px;border:1px solid var(--bdr);
                       background:#fff;color:var(--sub);cursor:pointer;font-family:inherit;font-weight:600">
                ✏️ 빈도 변경
              </button>
            </div>
            <button onclick="event.stopPropagation();cancelChal(${ac.challengeId})"
              style="background:#fff0f0;color:var(--red);border:none;border-radius:8px;
                     padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">
              취소
            </button>
          </div>
        </div>`;
    }).join('');
  };

  window.renderTodayQuests = function (uid) {
    const wrap = document.getElementById('missionScroll');
    if (!wrap) return;
    wrap.innerHTML = '';

    const validIds = CHALLENGES.map(c => c.missionId);
    const today    = new Date().toISOString().split('T')[0];
    const active   = (window.UDATA?.activeChallenges || []).filter(ac =>
      (!ac.endDate || ac.endDate >= today) && validIds.includes(ac.missionId)
    );

    if (!active.length) {
      wrap.innerHTML = `
        <div style="width:100%;padding:8px 4px">
          <div style="background:#f0fbf4;border-radius:14px;padding:16px;text-align:center;border:1.5px dashed var(--bdr)">
            <div style="font-size:28px;margin-bottom:8px">🌱</div>
            <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">참여 중인 챌린지가 없어요</div>
            <div style="font-size:12px;color:var(--sub);margin-bottom:12px">챌린지에 참여하면 오늘의 미션이 여기 나타나요!</div>
            <button class="btn btn-g" style="padding:10px" onclick="goPage('chal')">챌린지 참여하기 🏆</button>
          </div>
        </div>`;
      return;
    }

    active.forEach(ac => {
      const m = MISSIONS.find(x => x.id === ac.missionId);
      if (!m) return;

      const n         = ac.freqPerWeek ?? (ac.freq==='daily'?7:parseInt((ac.freq||'w1').replace('w',''))||1);
      const fBadge    = n >= 7 ? '매일' : `주 ${n}회`;
      const total     = calcTotal(ac);
      const done      = (window.UDATA?.completedDates || {})[ac.challengeId] || 0;
      const pct       = Math.min(100, Math.floor(done / total * 100));
      const doneToday = (window.UDATA?.verifiedDates || {})[ac.challengeId] === today;

      const el = document.createElement('div');
      el.className = 'mc' + (doneToday ? ' done' : '');
      el.innerHTML = `
        <div style="position:absolute;top:6px;right:6px;font-size:9px;font-weight:700;
                    background:var(--g1);color:#fff;padding:1px 5px;border-radius:6px">${fBadge}</div>
        <div class="mc-emoji">${m.emoji}</div>
        <div class="mc-name">${m.name}</div>
        <div style="font-size:10px;color:var(--sub);margin-bottom:4px;overflow:hidden;
                    text-overflow:ellipsis;white-space:nowrap">${ac.challengeTitle}</div>
        <div style="background:#e0f2e7;border-radius:6px;height:4px;overflow:hidden;margin-bottom:6px">
          <div style="width:${pct}%;background:var(--g1);height:100%;border-radius:6px"></div>
        </div>
        <div class="mc-badges">
          <span class="badge badge-p">+${m.point}P</span>
          <span class="badge badge-c">-${m.co2}kg</span>
          <span class="badge badge-ai">🤖AI</span>
        </div>`;

      if (!doneToday && uid) el.onclick = () => openAI(m, uid, ac.challengeId);
      wrap.appendChild(el);
    });
  };

  window.openChangeFreq = function (challengeId) {
    const ac = (window.UDATA?.activeChallenges || []).find(a => a.challengeId === challengeId);
    if (!ac) return;
    const cur = ac.freqPerWeek ?? (ac.freq==='daily'?7:parseInt((ac.freq||'w1').replace('w',''))||1);

    document.getElementById('freqChangeOv')?.remove();
    const ov = document.createElement('div');
    ov.id = 'freqChangeOv';
    ov.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9990;' +
      'display:flex;align-items:flex-end;justify-content:center';

    ov.innerHTML = `
      <div style="background:#fff;width:100%;max-width:480px;border-radius:24px 24px 0 0;padding:22px 20px 44px">
        <div style="width:40px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 18px"></div>
        <div style="font-size:16px;font-weight:900;color:var(--txt);margin-bottom:4px">✏️ 인증 빈도 변경</div>
        <div style="font-size:12px;color:var(--sub);margin-bottom:20px">변경 후 남은 기간에 새 빈도가 적용돼요</div>

        <div style="display:flex;align-items:center;gap:14px;background:#f0fbf4;border-radius:16px;
                    padding:16px;margin-bottom:8px;border:1.5px solid #c8e6c9">
          <button onclick="_fcAdj(-1)"
            style="width:40px;height:40px;border-radius:50%;border:2px solid var(--g1);background:#fff;
                   font-size:22px;font-weight:900;cursor:pointer;color:var(--g2);
                   display:flex;align-items:center;justify-content:center;flex-shrink:0">−</button>
          <div style="flex:1;text-align:center">
            <div id="_fcVal" data-n="${cur}"
              style="font-size:30px;font-weight:900;color:var(--g2);line-height:1.1">
              ${cur >= 7 ? '매일' : '주 ' + cur + '회'}
            </div>
            <div id="_fcHint" style="font-size:11px;color:var(--sub);margin-top:6px">${freqHint(cur)}</div>
          </div>
          <button onclick="_fcAdj(1)"
            style="width:40px;height:40px;border-radius:50%;border:2px solid var(--g1);background:var(--g1);
                   font-size:22px;font-weight:900;cursor:pointer;color:#fff;
                   display:flex;align-items:center;justify-content:center;flex-shrink:0">+</button>
        </div>
        <div style="font-size:11px;color:var(--sub);text-align:center;margin-bottom:20px">주 1회 ~ 매일</div>

        <div style="display:flex;gap:8px">
          <button onclick="document.getElementById('freqChangeOv').remove()"
            class="btn btn-gray" style="flex:1">취소</button>
          <button onclick="_fcSave(${challengeId})"
            class="btn btn-g" style="flex:2">변경 저장</button>
        </div>
      </div>`;

    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  };

  window._fcAdj = function (d) {
    const el = document.getElementById('_fcVal');
    if (!el) return;
    const n = Math.max(1, Math.min(7, parseInt(el.dataset.n) + d));
    el.dataset.n = n;
    el.textContent = n >= 7 ? '매일' : `주 ${n}회`;
    const hint = document.getElementById('_fcHint');
    if (hint) hint.textContent = freqHint(n);
  };

  window._fcSave = async function (challengeId) {
    const el = document.getElementById('_fcVal');
    if (!el || !window.ME) return;
    const n = parseInt(el.dataset.n);
    if (!n) return;

    try {
      const newActive = (window.UDATA.activeChallenges || []).map(ac =>
        ac.challengeId === challengeId
          ? { ...ac, freqPerWeek: n, freq: n >= 7 ? 'daily' : 'w' + n }
          : ac
      );
      await window.FB.updateDoc(
        window.FB.doc(window.FB.db, 'users', window.ME.uid),
        { activeChallenges: newActive }
      );
      window.UDATA.activeChallenges = newActive;
      document.getElementById('freqChangeOv')?.remove();
      toast(`✅ ${n >= 7 ? '매일' : '주 ' + n + '회'}으로 변경됐어요!`);
      renderHomeChalls();
      renderTodayQuests(window.ME.uid);
    } catch(e) { toast('변경 실패: ' + e.message); }
  };

})();

/* =====================================================
   교통 미션 패치 – 자전거 + 대중교통 선택
   ===================================================== */
(function () {
  'use strict';

  const _origBike = window.loadSeoulBike;
  window.loadSeoulBike = async function () {
    if (_origBike) await _origBike();
    patchTransportButtons();
  };

  const _origIncheon = window.loadIncheonTransport;
  window.loadIncheonTransport = async function () {
    if (_origIncheon) await _origIncheon();
    patchTransportButtons();
  };

  function patchTransportButtons() {
    const bm = document.getElementById('bikeMission');
    if (bm && !bm._patched) {
      bm._patched = true;
      bm.innerHTML = `
        <div style="font-size:11px;color:rgba(255,255,255,.75);font-weight:700;margin-bottom:6px">
          💡 오늘 교통 미션 선택하기
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="startBikeMission()"
            style="flex:1;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.4);
                   border-radius:12px;padding:10px 6px;cursor:pointer;font-family:inherit;color:#fff;
                   text-align:center;line-height:1.4">
            <div style="font-size:20px;margin-bottom:2px">🚲</div>
            <div style="font-size:12px;font-weight:700">자전거·도보</div>
            <div style="font-size:10px;opacity:.8;margin-top:2px">-1.05kg CO₂</div>
          </button>
          <button onclick="startBusMission()"
            style="flex:1;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.4);
                   border-radius:12px;padding:10px 6px;cursor:pointer;font-family:inherit;color:#fff;
                   text-align:center;line-height:1.4">
            <div style="font-size:20px;margin-bottom:2px">🚌</div>
            <div style="font-size:12px;font-weight:700">대중교통</div>
            <div style="font-size:10px;opacity:.8;margin-top:2px">-1.17kg CO₂</div>
          </button>
        </div>`;
    }

    const im = document.getElementById('incheonTransMission');
    if (im && !im._patched) {
      im._patched = true;
      im.innerHTML = `
        <div style="font-size:11px;color:rgba(255,255,255,.75);font-weight:700;margin-bottom:6px">
          💡 오늘 교통 미션 선택하기
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="startBusMission()"
            style="flex:1;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.4);
                   border-radius:12px;padding:10px 6px;cursor:pointer;font-family:inherit;color:#fff;
                   text-align:center;line-height:1.4">
            <div style="font-size:20px;margin-bottom:2px">🚇</div>
            <div style="font-size:12px;font-weight:700">지하철·버스</div>
            <div style="font-size:10px;opacity:.8;margin-top:2px">-1.17kg CO₂</div>
          </button>
          <button onclick="startBikeMission()"
            style="flex:1;background:rgba(255,255,255,.18);border:1.5px solid rgba(255,255,255,.4);
                   border-radius:12px;padding:10px 6px;cursor:pointer;font-family:inherit;color:#fff;
                   text-align:center;line-height:1.4">
            <div style="font-size:20px;margin-bottom:2px">🚶</div>
            <div style="font-size:12px;font-weight:700">도보·자전거</div>
            <div style="font-size:10px;opacity:.8;margin-top:2px">-1.05kg CO₂</div>
          </button>
        </div>`;
    }
  }

  window.startBikeMission = function () {
    const uid = window.ME?.uid;
    if (!uid) { if (window.showLoginPrompt) window.showLoginPrompt('미션 인증은 로그인 후 가능해요! 🌱'); else toast('로그인이 필요해요!'); return; }
    const m = MISSIONS.find(x => x.id === 'm8');
    if (m) openAI(m, uid, null);
  };

  window.startBusMission = function () {
    const uid = window.ME?.uid;
    if (!uid) { if (window.showLoginPrompt) window.showLoginPrompt('미션 인증은 로그인 후 가능해요! 🌱'); else toast('로그인이 필요해요!'); return; }
    const m = MISSIONS.find(x => x.id === 'm2');
    if (m) openAI(m, uid, null);
  };

})();

/* ================================================================
   참여자 카운터 · 게스트 모드 · 기업 관리 패치
   ================================================================ */
(function () {
  'use strict';

  function waitForFB(cb) {
    const t = setInterval(() => { if (window.FB) { clearInterval(t); cb(); } }, 80);
  }

  async function trackTodayVisit(uid) {
    if (!window.FB || !uid) return;
    try {
      const today   = new Date().toISOString().split('T')[0];
      const uRef    = window.FB.doc(window.FB.db, 'users', uid);
      const uSnap   = await window.FB.getDoc(uRef);
      if (!uSnap.exists()) return;
      const lastDate = uSnap.data().lastActiveDate || '';
      if (lastDate !== today) {
        await window.FB.setDoc(
          window.FB.doc(window.FB.db, 'stats', 'global'),
          { todayUsers: window.FB.increment(1), todayDate: today },
          { merge: true }
        );
        await window.FB.updateDoc(uRef, { lastActiveDate: today });
        if (window.loadGlobalStats) window.loadGlobalStats();
      }
    } catch (_) {}
  }

  async function resetTodayIfNeeded() {
    if (!window.FB) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const snap  = await window.FB.getDoc(window.FB.doc(window.FB.db, 'stats', 'global'));
      if (snap.exists() && snap.data().todayDate !== today) {
        await window.FB.setDoc(
          window.FB.doc(window.FB.db, 'stats', 'global'),
          { todayUsers: 0, todayDate: today },
          { merge: true }
        );
      }
    } catch (_) {}
  }

  const _origLoadUser = window.loadUser;
  window.loadUser = async function (uid) {
    if (_origLoadUser) await _origLoadUser(uid);
    waitForFB(() => trackTodayVisit(uid));
  };

  setInterval(() => {
    if (window.loadGlobalStats) window.loadGlobalStats();
  }, 30000);

  waitForFB(resetTodayIfNeeded);

  /* ================================================================
     2. 게스트 모드
     ================================================================ */
  window.GUEST_MODE = false;

  function injectGuestBtn() {
    const ls = document.getElementById('loginScreen');
    if (!ls || document.getElementById('btnGuest')) return;

    const wrap = document.createElement('div');
    wrap.style.cssText =
      'width:100%;max-width:320px;text-align:center;margin-top:10px;display:flex;flex-direction:column;align-items:center;gap:6px';
    wrap.innerHTML = `
      <div style="color:rgba(255,255,255,.35);font-size:11px;margin-bottom:2px">─── 또는 ───</div>
      <button id="btnGuest" onclick="enterGuest()"
        style="width:100%;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.3);
               border-radius:16px;padding:14px;font-size:14px;font-weight:700;
               cursor:pointer;font-family:inherit;color:#fff">
        👀 로그인 없이 둘러보기
      </button>
      <p style="color:rgba(255,255,255,.4);font-size:11px;line-height:1.6;margin:0">
        포인트 적립·미션 인증은 로그인 후 가능해요
      </p>`;
    ls.appendChild(wrap);
  }

  window.enterGuest = function () {
    window.GUEST_MODE = true;
    window.ME   = null;
    window.UDATA = {
      point: 0, missionCount: 0, co2: 0,
      doneMissions: [], activeChallenges: [],
      streak: 0, todayMissions: []
    };

    const ls  = document.getElementById('loginScreen');
    const app = document.getElementById('app');
    if (ls)  ls.style.display  = 'none';
    if (app) app.style.display = 'block';

    if (ls) {
      new MutationObserver(() => {
        if (window.GUEST_MODE && ls.style.display !== 'none')
          ls.style.display = 'none';
      }).observe(ls, { attributes: true, attributeFilter: ['style'] });
    }
    if (app) {
      new MutationObserver(() => {
        if (window.GUEST_MODE && app.style.display === 'none')
          app.style.display = 'block';
      }).observe(app, { attributes: true, attributeFilter: ['style'] });
    }

    showGuestBanner();

    waitForFB(() => { if (window.loadGlobalStats) window.loadGlobalStats(); });
    ['updateUI','renderTodayQuests','renderHomeChalls','renderOfficialChallenges','renderBooks']
      .forEach(fn => { if (window[fn]) window[fn](null); });
    setTimeout(() => { if (window.drawMap) window.drawMap(); }, 300);
    setTimeout(() => { if (window.loadFeed) window.loadFeed(); }, 600);
    setTimeout(() => {
      if (typeof loadSeoulAir     === 'function') loadSeoulAir();
      if (typeof loadSeoulBike    === 'function') loadSeoulBike();
      if (typeof loadIncheonTransport === 'function') loadIncheonTransport();
    }, 500);
  };

  function showGuestBanner() {
    if (document.getElementById('guestBanner')) return;
    const b = document.createElement('div');
    b.id = 'guestBanner';
    b.style.cssText =
      'background:linear-gradient(135deg,#F39C12,#e67e22);padding:9px 16px;' +
      'display:flex;align-items:center;justify-content:space-between;' +
      'position:sticky;top:64px;z-index:99;flex-shrink:0';
    b.innerHTML = `
      <div style="font-size:12px;color:#fff;font-weight:700">
        👀 게스트 모드 &nbsp;·&nbsp; 포인트·인증은 로그인 후 가능해요!
      </div>
      <button onclick="leaveGuest()"
        style="background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.5);
               border-radius:8px;padding:5px 12px;color:#fff;font-size:11px;
               font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">
        🔑 로그인
      </button>`;
    const hdr = document.querySelector('.hdr');
    if (hdr) hdr.insertAdjacentElement('afterend', b);
  }

  window.leaveGuest = function () {
    window.GUEST_MODE = false;
    document.getElementById('guestBanner')?.remove();
    document.getElementById('app').style.display           = 'none';
    document.getElementById('loginScreen').style.display   = 'flex';
  };

  window.showLoginPrompt = function (msg) {
    document.getElementById('loginPromptOv')?.remove();
    const d = document.createElement('div');
    d.id = 'loginPromptOv';
    d.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9998;' +
      'display:flex;align-items:flex-end;justify-content:center';
    d.innerHTML = `
      <div style="background:#fff;width:100%;max-width:480px;border-radius:24px 24px 0 0;
                  padding:28px 20px 44px;text-align:center">
        <div style="font-size:40px;margin-bottom:10px">🌍</div>
        <div style="font-size:17px;font-weight:900;color:#1a2e1a;margin-bottom:6px">로그인이 필요해요!</div>
        <div style="font-size:13px;color:#7a9a7a;line-height:1.8;margin-bottom:22px">${msg}</div>
        <button onclick="document.getElementById('loginPromptOv').remove();leaveGuest()"
          style="width:100%;background:linear-gradient(135deg,#2ECC71,#27AE60);color:#fff;
                 border:none;border-radius:14px;padding:14px;font-size:15px;font-weight:700;
                 cursor:pointer;font-family:inherit;margin-bottom:10px;
                 display:flex;align-items:center;justify-content:center;gap:10px">
          <img src="https://www.google.com/favicon.ico" width="16" height="16"/> Google로 로그인
        </button>
        <button onclick="document.getElementById('loginPromptOv').remove()"
          style="width:100%;background:#f0f0f0;color:#7a9a7a;border:none;border-radius:12px;
                 padding:12px;font-size:13px;cursor:pointer;font-family:inherit;font-weight:600">
          계속 둘러보기
        </button>
      </div>`;
    document.body.appendChild(d);
    d.addEventListener('click', e => { if (e.target === d) d.remove(); });
  };

  const _origOpenAI = window.openAI;
  window.openAI = function (m, uid, chalId) {
    if (!window.ME) {
      window.showLoginPrompt(
        '미션 인증과 포인트 적립은<br/>로그인 후 이용할 수 있어요! 🌱<br/>' +
        '<span style="font-size:11px;color:#bbb;display:block;margin-top:4px">둘러보기는 계속 가능해요</span>'
      );
      return;
    }
    if (_origOpenAI) _origOpenAI(m, uid, chalId);
  };

  const _origDoJoin = window._doJoin;
  window._doJoin = function (title, cid) {
    if (!window.ME) { window.showLoginPrompt('챌린지 참여는 로그인 후 가능해요! 🏆'); return; }
    if (_origDoJoin) _origDoJoin(title, cid);
  };

  function setupGuest() {
    injectGuestBtn();
    const ls = document.getElementById('loginScreen');
    if (ls) {
      new MutationObserver(() => {
        if (ls.style.display !== 'none') injectGuestBtn();
      }).observe(ls, { attributes: true, attributeFilter: ['style'] });
    }
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', setupGuest);
  else
    setupGuest();

  /* ================================================================
     3. 기업 이름 관리 (마이 페이지)
     ================================================================ */

  function injectCompanySection() {
    const myPage = document.getElementById('page-my');
    if (!myPage || document.getElementById('companySec')) return;

    const sec = document.createElement('div');
    sec.id = 'companySec';
    sec.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 12px 8px">
        <div style="font-size:15px;font-weight:900;color:var(--txt)">🏢 소속 기업/단체</div>
        <button onclick="loadCompanySec()"
          style="font-size:12px;color:var(--sub);background:none;border:none;cursor:pointer;font-family:inherit">
          새로고침
        </button>
      </div>
      <div id="companyBox" style="margin:0 12px 12px;background:#fff;border-radius:14px;
                                   padding:14px;border:1px solid var(--bdr);min-height:60px">
        <div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로딩 중...</div>
      </div>`;

    myPage.appendChild(sec);
     // 탭바에 기업 버튼 추가
const tabBar = document.querySelector('.tab-bar');
if (tabBar && !document.getElementById('tb-company')) {
  const btn = document.createElement('button');
  btn.className = 'tb';
  btn.id = 'tb-company';
  btn.setAttribute('data-page', 'my');
  btn.innerHTML = '<span class="ic">🏢</span>기업';
  btn.onclick = function() {
    goPage('my');
    setTimeout(() => {
      const sec = document.getElementById('companySec');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };
  tabBar.appendChild(btn);
}
  }

  window.loadCompanySec = async function () {
    const box = document.getElementById('companyBox');
    if (!box) return;

    if (!window.ME || !window.FB) {
      box.innerHTML = `<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">로그인 후 이용 가능해요 🔑</div>`;
      return;
    }

    const cid = window.UDATA?.companyId;

    if (!cid) {
      box.innerHTML = `
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-size:26px;margin-bottom:6px">🏢</div>
          <div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:3px">소속 기업이 없어요</div>
          <div style="font-size:12px;color:var(--sub)">등록하거나 초대 코드로 참여하세요</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="openCreateCompany()" class="btn btn-g" style="padding:11px">🏢 기업/단체 등록</button>
          <div style="display:flex;gap:8px">
            <input id="coCodeInp" class="inp" placeholder="초대 코드 6자리 입력"
                   maxlength="8" style="flex:1;text-transform:uppercase"/>
            <button onclick="joinCompanyByCode()" class="btn btn-b btn-sm">입장</button>
          </div>
        </div>`;
      return;
    }

    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', cid));
      if (!snap.exists()) {
        await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { companyId: null });
        window.UDATA.companyId = null;
        window.loadCompanySec(); return;
      }

      const co       = snap.data();
      const isOwner  = co.ownerUid === window.ME.uid;
      const mc       = co.memberCount || 1;

      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="font-size:32px">${co.emoji || '🏢'}</div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:900;color:var(--txt)">${co.name}</div>
            <div style="font-size:12px;color:var(--sub);margin-top:2px">
              멤버 ${mc}명${isOwner ? ' · <b style="color:var(--g2)">관리자</b>' : ''}
              ${co.type ? ` · ${co.type}` : ''}
            </div>
          </div>
        </div>
        <div style="background:#f0fbf4;border-radius:10px;padding:8px 12px;margin-bottom:12px;
                    display:flex;justify-content:space-between;align-items:center;border:1px solid var(--bdr)">
          <div>
            <div style="font-size:10px;color:var(--sub)">초대 코드</div>
            <div style="font-size:16px;font-weight:900;letter-spacing:2px;color:var(--txt)">${co.inviteCode || ''}</div>
          </div>
          <button onclick="navigator.clipboard.writeText('${co.inviteCode || ''}').then(()=>toast('코드 복사됐어요!'))"
            class="btn btn-g btn-sm">복사</button>
        </div>
        ${isOwner
          ? `<div style="display:flex;gap:8px">
               <button onclick="openEditCompany('${cid}')" class="btn btn-gray btn-sm" style="flex:1;padding:10px">
                 ✏️ 이름 변경
               </button>
               <button onclick="openDeleteCompany('${cid}',${mc})"
                 style="flex:1;padding:10px;font-size:12px;font-weight:700;background:#fff0f0;
                        color:var(--red);border:none;border-radius:10px;cursor:pointer;font-family:inherit">
                 🗑️ 삭제
               </button>
             </div>`
          : `<button onclick="leaveCompany('${cid}')" class="btn btn-gray" style="padding:10px;font-size:13px">
               탈퇴하기
             </button>`}`;
    } catch (_) {
      box.innerHTML = `<div style="text-align:center;color:var(--sub);font-size:12px;padding:8px">불러오기 실패</div>`;
    }
  };

  window.openCreateCompany = function () {
    document.getElementById('coCreateOv')?.remove();
    window._coEmoji = '🏢';
    const d = document.createElement('div');
    d.id = 'coCreateOv'; d.className = 'overlay on';
    d.innerHTML = `
      <div class="modal">
        <div class="handle" onclick="document.getElementById('coCreateOv').remove()"></div>
        <button class="modal-close" onclick="document.getElementById('coCreateOv').remove()">✕</button>
        <div class="modal-title">🏢 기업/단체 등록</div>
        <div class="modal-desc">처음 등록하는 분이 관리자가 돼요</div>
        <div class="form-group">
          <label>아이콘 선택</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${['🏢','🌿','🏭','🏦','🏥','🏫','🏪','💼','🌱','⚡','🔋','🌊'].map(e =>
              `<button onclick="selectCoEmoji('${e}',this)"
                style="font-size:22px;padding:5px;border:2px solid transparent;
                       border-radius:8px;cursor:pointer;background:none">${e}</button>`
            ).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>기업/단체명 <span style="color:var(--red)">*</span></label>
          <input class="inp" id="coNameInp" placeholder="예) ㈜그린코리아, 서울환경연합" maxlength="20"/>
        </div>
        <div class="form-group">
          <label>업종/분야 (선택)</label>
          <input class="inp" id="coTypeInp" placeholder="예) 제조업, IT, 비영리" maxlength="20"/>
        </div>
        <button class="btn btn-g" onclick="submitCreateCompany()">등록하기 🏢</button>
      </div>`;
    document.body.appendChild(d);
    d.addEventListener('click', e => { if (e.target === d) d.remove(); });
  };

  window.selectCoEmoji = function (e, btn) {
    window._coEmoji = e;
    document.querySelectorAll('#coCreateOv button[style*="font-size:22px"]')
      .forEach(b => b.style.borderColor = 'transparent');
    btn.style.borderColor = 'var(--g1)';
  };

  window.submitCreateCompany = async function () {
    if (!window.ME || !window.FB) return;
    const name = document.getElementById('coNameInp')?.value?.trim();
    if (!name) { toast('기업명을 입력해주세요!'); return; }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const ref = await window.FB.addDoc(window.FB.collection(window.FB.db, 'companies'), {
        name,
        emoji:       window._coEmoji || '🏢',
        type:        document.getElementById('coTypeInp')?.value?.trim() || '',
        inviteCode:  code,
        ownerUid:    window.ME.uid,
        ownerName:   window.UDATA?.nickname || window.ME.displayName || '관리자',
        memberCount: 1,
        members:     [window.ME.uid],
        createdAt:   window.FB.serverTimestamp(),
      });
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { companyId: ref.id });
      window.UDATA.companyId = ref.id;
      document.getElementById('coCreateOv')?.remove();
      toast(`🎉 "${name}" 등록 완료! 초대 코드: ${code}`);
      window.loadCompanySec();
    } catch(e) { toast('등록 실패: ' + e.message); }
  };

  window.openEditCompany = function (cid) {
    document.getElementById('coEditOv')?.remove();
    const d = document.createElement('div');
    d.id = 'coEditOv'; d.className = 'overlay on';
    d.innerHTML = `
      <div class="modal">
        <div class="handle" onclick="document.getElementById('coEditOv').remove()"></div>
        <button class="modal-close" onclick="document.getElementById('coEditOv').remove()">✕</button>
        <div class="modal-title">✏️ 기업명 변경</div>
        <div class="form-group" style="margin-top:14px">
          <label>새 기업명</label>
          <input class="inp" id="coEditNameInp" placeholder="새 기업명 입력" maxlength="20"/>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-gray" style="flex:1" onclick="document.getElementById('coEditOv').remove()">취소</button>
          <button class="btn btn-g" style="flex:1" onclick="submitEditCompany('${cid}')">변경하기</button>
        </div>
      </div>`;
    document.body.appendChild(d);
    d.addEventListener('click', e => { if (e.target === d) d.remove(); });
  };

  window.submitEditCompany = async function (cid) {
    const n = document.getElementById('coEditNameInp')?.value?.trim();
    if (!n) { toast('기업명을 입력해주세요!'); return; }
    try {
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'companies', cid), { name: n });
      document.getElementById('coEditOv')?.remove();
      toast('✅ 기업명이 변경됐어요!');
      window.loadCompanySec();
    } catch(e) { toast('실패: ' + e.message); }
  };

  window.openDeleteCompany = function (cid, memberCount) {
    if (memberCount > 1) {
      const ok1 = confirm(
        `⚠️ 현재 ${memberCount}명의 멤버가 소속되어 있어요.\n` +
        `삭제하면 모든 멤버가 탈퇴 처리되고 되돌릴 수 없어요.\n\n정말 삭제하시겠어요?`
      );
      if (!ok1) return;
      const ok2 = confirm('마지막 확인입니다. 기업을 완전히 삭제할까요?');
      if (!ok2) return;
    } else {
      if (!confirm('기업을 삭제할까요?')) return;
    }
    deleteCompany(cid);
  };

  async function deleteCompany(cid) {
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', cid));
      if (snap.exists()) {
        const members = snap.data().members || [];
        await Promise.all(members.map(uid =>
          window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', uid), { companyId: null }).catch(() => {})
        ));
      }
      await window.FB.deleteDoc(window.FB.doc(window.FB.db, 'companies', cid));
      window.UDATA.companyId = null;
      toast('🗑️ 기업이 삭제됐어요');
      window.loadCompanySec();
    } catch(e) { toast('삭제 실패: ' + e.message); }
  }

  window.leaveCompany = async function (cid) {
    if (!window.ME || !window.FB) return;
    if (!confirm('기업에서 탈퇴할까요?')) return;
    try {
      const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', cid));
      if (snap.exists()) {
        const co = snap.data();
        const newMembers = (co.members || []).filter(u => u !== window.ME.uid);
        await window.FB.updateDoc(window.FB.doc(window.FB.db, 'companies', cid), {
          members: newMembers,
          memberCount: Math.max(0, newMembers.length),
        });
      }
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { companyId: null });
      window.UDATA.companyId = null;
      toast('탈퇴했어요');
      window.loadCompanySec();
    } catch(e) { toast('실패: ' + e.message); }
  };

  window.joinCompanyByCode = async function () {
    const code = document.getElementById('coCodeInp')?.value?.trim()?.toUpperCase();
    if (!code || code.length < 4) { toast('코드를 입력해주세요!'); return; }
    if (!window.ME || !window.FB) { window.showLoginPrompt('로그인 후 참여 가능해요!'); return; }
    try {
      const allSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'companies'));
      const found   = allSnap.docs.find(d => d.data().inviteCode === code);
      if (!found) { toast('존재하지 않는 코드예요!'); return; }

      const co = found.data();
      if ((co.members || []).includes(window.ME.uid)) { toast('이미 참여 중이에요!'); return; }

      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'companies', found.id), {
        members:     window.FB.arrayUnion(window.ME.uid),
        memberCount: window.FB.increment(1),
      });
      await window.FB.updateDoc(window.FB.doc(window.FB.db, 'users', window.ME.uid), { companyId: found.id });
      window.UDATA.companyId = found.id;
      toast(`✅ "${co.name}" 참여 완료!`);
      window.loadCompanySec();
    } catch(e) { toast('참여 실패: ' + e.message); }
  };

  const _origShowApp = window.showApp;
  window.showApp = function () {
    if (_origShowApp) _origShowApp();
    setTimeout(() => {
      injectCompanySection();
      waitForFB(() => window.loadCompanySec());
    }, 400);
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', injectCompanySection);
  else
    injectCompanySection();

})();
