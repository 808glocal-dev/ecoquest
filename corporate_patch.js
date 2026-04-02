/* =====================================================
   EcoQuest – 자유 빈도 선택 패치
   주 1~7회 자유 설정 + 참여 후 변경 가능
   ===================================================== */
(function () {
  'use strict';

  /* ── 빈도 힌트 텍스트 ── */
  function freqHint(n) {
    return ['','가볍게 시작','균형잡힌 페이스','추천 💚','활발하게','열심히!','거의 매일','매일! 🌍'][Math.min(n,7)] || '';
  }
  window._fhintOf = freqHint; // overlay 버튼 onclick에서 참조

  /* ── 총 필요 횟수 계산 (freqPerWeek 우선, 구버전 호환) ── */
  function calcTotal(ac) {
    const n = ac.freqPerWeek
      ?? (ac.freq === 'daily' ? 7
        : ac.freq === 'w5'   ? 5
        : ac.freq === 'w3'   ? 3
        : parseInt((ac.freq || 'w1').replace('w', '')) || 1);
    return n * (ac.weeks || 2);
  }

  /* ── 현재 선택 상태 ── */
  let _freq = 3, _weeks = 2;

  /* =====================================================
     openChal – 챌린지 상세 모달 (자유 빈도)
     ===================================================== */
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

  /* =====================================================
     _doJoin – 챌린지 참여 저장
     ===================================================== */
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
      freq:           _freq >= 7 ? 'daily' : 'w' + _freq,  // 구버전 호환
      freqPerWeek:    _freq,                                 // 실제 숫자
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

  /* =====================================================
     renderHomeChalls – 빈도·진행률 표시 패치
     ===================================================== */
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

  /* =====================================================
     renderTodayQuests – 빈도 배지 + 진행률 패치
     ===================================================== */
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

  /* =====================================================
     openChangeFreq – 참여 후 빈도 변경 모달
     ===================================================== */
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
