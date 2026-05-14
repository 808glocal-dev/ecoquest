/* ═══════════════════════════════════════════════════════════════════
   home_layout_fix_patch.js
   - 홈 "참여 중 챌린지" → 가로 스크롤 컴팩트 카드
   - 대기질/따릉이/인천교통 카드 → 지구탭으로 이동 (접기/펼치기)
   - 결과: 홈에서 인증 피드까지 스크롤 거리 단축
   ═══════════════════════════════════════════════════════════════════ */
(function(){

  // ───────── 1. 참여 중 챌린지 → 가로 스크롤 카드 ─────────
  function patchHomeChalls(){
    if(typeof window.renderHomeChalls !== "function"){
      setTimeout(patchHomeChalls, 500);
      return;
    }

    // 스크롤바 숨기는 스타일 1회 주입
    if(!document.getElementById("homeFixStyle")){
      const st = document.createElement("style");
      st.id = "homeFixStyle";
      st.textContent = `
        #homeChallList > .hchall-scroll{
          display:flex;gap:10px;overflow-x:auto;padding:2px 12px 10px;
          -webkit-overflow-scrolling:touch;scrollbar-width:none;
        }
        #homeChallList > .hchall-scroll::-webkit-scrollbar{display:none}
        .hchall-card{
          flex-shrink:0;width:152px;background:#fff;border-radius:14px;
          padding:11px 11px 10px;box-shadow:0 2px 8px rgba(0,0,0,.04);
          position:relative;cursor:pointer;transition:transform .12s
        }
        .hchall-card:active{transform:scale(.97)}
        .hchall-card.done{border:1.5px solid var(--g1);background:#f8fdf9}
        .hchall-card:not(.done){border:1.5px solid var(--bdr)}
        .hchall-x{
          position:absolute;top:6px;right:6px;background:#fff0f0;color:var(--red);
          border:none;width:20px;height:20px;border-radius:50%;font-size:13px;
          font-weight:700;cursor:pointer;font-family:inherit;line-height:1;
          display:flex;align-items:center;justify-content:center;padding:0
        }
        .hchall-add{
          flex-shrink:0;width:80px;background:#f8fdf9;border-radius:14px;
          padding:12px;border:1.5px dashed var(--bdr);cursor:pointer;
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;text-align:center
        }
        #mapDataBannerWrap details > summary::-webkit-details-marker{display:none}
        #mapDataBannerWrap details[open] > summary .map-arrow{transform:rotate(180deg)}
        #mapDataBannerWrap .map-arrow{transition:transform .2s;display:inline-block}
      `;
      document.head.appendChild(st);
    }

    window.renderHomeChalls = function(){
      const w = document.getElementById("homeChallList");
      if(!w) return;

      const active = (window.UDATA?.activeChallenges || []).filter(ac => ac.missionId);

      if(!active.length){
        w.style.padding = "0 12px";
        w.innerHTML = `<div style="text-align:center;padding:18px 12px;color:var(--sub);font-size:13px;background:#f0fbf4;border-radius:14px;border:1.5px dashed var(--bdr)">
          참여 중인 챌린지가 없어요!<br/>
          <button onclick="goPage('chal')" style="margin-top:10px;background:var(--g1);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">챌린지 참여하기 🌱</button>
        </div>`;
        return;
      }

      w.style.padding = "0";
      const today = new Date().toISOString().split("T")[0];

      const cards = active.map(ac => {
        const freqLabel = ac.freq==="daily" ? "매일"
                       : ac.freq==="w5"    ? "주5일"
                       : ac.freq==="w3"    ? "주3일" : "주1일";
        const totalN = ac.freq==="daily" ? ac.weeks*7
                     : ac.freq==="w5"    ? ac.weeks*5
                     : ac.freq==="w3"    ? ac.weeks*3 : ac.weeks*1;
        const done = (window.UDATA?.completedDates || {})[ac.challengeId] || 0;
        const pct = Math.min(100, Math.floor(done / totalN * 100));
        const verifiedToday = (window.UDATA?.verifiedDates || {})[ac.challengeId] === today;
        const emoji = ac.emoji || "🌱";
        const title = ac.challengeTitle || "챌린지";

        return `<div class="hchall-card${verifiedToday?' done':''}" onclick="openChal(${ac.challengeId})">
          <button class="hchall-x" onclick="event.stopPropagation();cancelChal(${ac.challengeId})" title="취소">×</button>
          ${verifiedToday ? '<div style="position:absolute;top:6px;left:6px;background:var(--g1);color:#fff;font-size:9px;font-weight:700;padding:2px 5px;border-radius:6px">✓ 오늘완료</div>' : ''}
          <div style="font-size:30px;line-height:1.1;margin-bottom:6px;margin-top:${verifiedToday?14:0}px">${emoji}</div>
          <div style="font-size:12px;font-weight:700;color:var(--txt);line-height:1.35;height:32px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:6px">${title}</div>
          <div style="font-size:10px;color:var(--sub);margin-bottom:5px">${freqLabel} · ${ac.weeks}주</div>
          <div style="background:#e0f2e7;border-radius:6px;height:5px;overflow:hidden;margin-bottom:4px">
            <div style="width:${pct}%;background:linear-gradient(90deg,var(--g1),var(--acc));height:100%;border-radius:6px;transition:width .5s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:10px;color:var(--sub)">${done}/${totalN}</span>
            <span style="font-size:10px;font-weight:700;color:var(--g2)">${pct}%</span>
          </div>
        </div>`;
      }).join("");

      w.innerHTML = `<div class="hchall-scroll">
        ${cards}
        <div class="hchall-add" onclick="goPage('chal')">
          <div style="font-size:28px;color:var(--g2);margin-bottom:4px;line-height:1">＋</div>
          <div style="font-size:10px;font-weight:700;color:var(--g2);line-height:1.3">더 많은<br/>챌린지</div>
        </div>
      </div>`;
    };

    if(window.UDATA) window.renderHomeChalls();
  }

  // ───────── 2. 대기질/따릉이 카드 → 지구탭(맵) 이동 ─────────
  function moveBannerToMap(){
    const banner  = document.getElementById("seoulDataBanner");
    const mapPage = document.getElementById("page-map");
    if(!banner || !mapPage){
      setTimeout(moveBannerToMap, 800);
      return;
    }
    if(document.getElementById("mapDataBannerWrap")) return;

    const wrap = document.createElement("div");
    wrap.id = "mapDataBannerWrap";
    wrap.style.cssText = "margin:0 12px 14px";
    wrap.innerHTML = `
      <details style="background:#fff;border-radius:14px;border:1px solid var(--bdr);overflow:hidden">
        <summary style="padding:12px 14px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;list-style:none;-webkit-tap-highlight-color:transparent;user-select:none">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:18px">📡</span>
            <span style="font-size:13px;font-weight:700;color:var(--txt)">우리 동네 실시간 데이터</span>
          </div>
          <span style="font-size:11px;color:var(--sub)">탭해서 펼치기 <span class="map-arrow">▾</span></span>
        </summary>
        <div id="mapDataBannerSlot" style="padding:8px 4px 6px;border-top:1px solid var(--bdr)"></div>
      </details>
    `;

    // 토끼 게임 다음에 위치 (지구탭 안)
    mapPage.appendChild(wrap);

    // banner 본체를 slot 안으로 이동 + 외부 margin 제거
    const slot = document.getElementById("mapDataBannerSlot");
    banner.style.margin = "4px 0 0";
    slot.appendChild(banner);
  }

  // ───────── 3. goPage('map') 시 wrap 살아있는지 체크 ─────────
  function hookGoPage(){
    if(window._homeFixGoPageHooked) return;
    const orig = window.goPage;
    if(typeof orig !== "function"){
      setTimeout(hookGoPage, 500);
      return;
    }
    window.goPage = function(name){
      const r = orig.apply(this, arguments);
      if(name === "map"){
        setTimeout(() => {
          const mp = document.getElementById("page-map");
          const b  = document.getElementById("seoulDataBanner");
          if(!mp) return;
          // banner가 mapPage 밖으로 빠졌거나, wrap이 사라졌으면 다시 이동
          if(b && !mp.contains(b)){
            const w = document.getElementById("mapDataBannerWrap");
            if(w && w.parentNode !== mp) w.remove();
            moveBannerToMap();
          } else if(b && !document.getElementById("mapDataBannerWrap")){
            moveBannerToMap();
          }
        }, 300);
      }
      return r;
    };
    window._homeFixGoPageHooked = true;
  }

  // ───────── 부팅 ─────────
  function init(){
    patchHomeChalls();
    moveBannerToMap();
    hookGoPage();
  }

  // bunny_patch.js가 mapPage를 통째로 교체하는 타이밍(1500ms) 이후에 실행
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 2500));
  } else {
    setTimeout(init, 2500);
  }

})();
