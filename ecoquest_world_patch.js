/* EcoQuest World Game Patch
 * 기존 Firebase / saveMission / missionLogs / bunny_patch.js를 삭제하거나 수정하지 않는 화면 확장 패치.
 * 설치 순서: bunny_patch.js 다음, 기존 HTML의 </body> 직전에서 로드.
 */
(function () {
  "use strict";

  const STYLE_ID = "eq-world-game-style";
  const ROOT_ID = "eqWorldGame";
  const BUNNY_ID = "bunnyGameMain";
  const TRACE_LEVELS = [
    { min: 0, name: "회색의 지구", title: "아직 작은 흔적을 기다리고 있어요", sub: "첫 번째 환경 미션을 완료해 지구에 초록빛을 더해 주세요.", color: "#a7adb4", emoji: "🌫️" },
    { min: 1, name: "첫 번째 새싹", title: "지구에 첫 생명이 피어났어요", sub: "작은 실천 하나가 변화의 시작이에요.", color: "#9bdc9c", emoji: "🌱" },
    { min: 5, name: "초록 들판", title: "꽃과 나비가 돌아오고 있어요", sub: "지구에 다섯 개의 소중한 흔적이 쌓였어요.", color: "#75c98b", emoji: "🌼" },
    { min: 15, name: "생명의 숲", title: "숲에 친구들이 찾아왔어요", sub: "꾸준한 실천이 생태계의 풍경을 바꿔요.", color: "#3b9b72", emoji: "🌳" },
    { min: 30, name: "야생의 귀환", title: "멸종위기종 친구들이 돌아와요", sub: "당신의 흔적이 모여 더 큰 회복을 만들어요.", color: "#247b72", emoji: "🦦" },
    { min: 50, name: "함께 회복한 지구", title: "지구가 한층 더 푸르게 빛나요", sub: "작은 행동들이 모여 살아 숨 쉬는 별을 만들었어요.", color: "#2878a8", emoji: "🌍" }
  ];
  const RETURNING_FRIENDS = [
    { min: 1, emoji: "🦋", name: "나비" },
    { min: 5, emoji: "🐝", name: "꿀벌" },
    { min: 15, emoji: "🦔", name: "고슴도치" },
    { min: 30, emoji: "🦦", name: "수달" },
    { min: 50, emoji: "🐢", name: "바다거북" }
  ];

  let traceCount = 0;
  let lastUid = "";
  let refreshTimer = null;
  let saveHooked = false;
  let observer = null;

  const $ = (id) => document.getElementById(id);
  const safeNum = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;

  function currentStage(count) {
    let stage = TRACE_LEVELS[0];
    for (const item of TRACE_LEVELS) if (count >= item.min) stage = item;
    return stage;
  }
  function nextStage(count) {
    return TRACE_LEVELS.find(item => item.min > count) || null;
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function installStyle() {
    if ($(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${ROOT_ID}{font-family:inherit;color:#18372f;padding:0 0 28px;overflow:hidden}
      #${ROOT_ID} *{box-sizing:border-box}
      #${ROOT_ID} .eq-hero{position:relative;min-height:390px;padding:25px 18px 22px;overflow:hidden;background:radial-gradient(ellipse at 50% 42%,#173f64 0%,#102747 43%,#08172c 100%);color:#fff;text-align:center}
      #${ROOT_ID} .eq-stars{position:absolute;inset:0;opacity:.8;background-image:radial-gradient(2px 2px at 12% 18%,#fff 55%,transparent 60%),radial-gradient(1px 1px at 25% 70%,#fff 55%,transparent 60%),radial-gradient(2px 2px at 80% 22%,#fff 55%,transparent 60%),radial-gradient(1px 1px at 68% 65%,#fff 55%,transparent 60%),radial-gradient(1px 1px at 91% 52%,#fff 55%,transparent 60%),radial-gradient(2px 2px at 43% 12%,#fff 55%,transparent 60%);pointer-events:none}
      #${ROOT_ID} .eq-kicker{position:relative;z-index:2;font-size:10px;letter-spacing:3px;font-weight:800;color:#a9d9ef}
      #${ROOT_ID} .eq-headline{position:relative;z-index:2;margin:8px 0 0;font-size:21px;line-height:1.35;font-weight:900}
      #${ROOT_ID} .eq-subtitle{position:relative;z-index:2;margin:7px 0 0;font-size:12px;line-height:1.6;color:#c6dce8}
      #${ROOT_ID} .eq-orbit{position:relative;z-index:1;width:230px;height:230px;margin:8px auto 0;border-radius:50%;display:grid;place-items:center}
      #${ROOT_ID} .eq-orbit:before,#${ROOT_ID} .eq-orbit:after{content:"";position:absolute;border:1px solid rgba(177,225,255,.22);border-radius:50%;inset:7px;transform:rotate(-22deg) scaleY(.36)}
      #${ROOT_ID} .eq-orbit:after{inset:-4px;transform:rotate(28deg) scaleY(.48);border-color:rgba(177,225,255,.13)}
      #${ROOT_ID} .eq-earth{position:relative;width:184px;height:184px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 31% 25%,#b5f4ee 0%,#48c5bb 18%,#1476a2 48%,#103a68 76%,#081d3e 100%);box-shadow:inset -17px -13px 28px rgba(0,0,0,.42),inset 8px 7px 18px rgba(255,255,255,.42),0 0 28px rgba(102,213,255,.42),0 0 70px rgba(58,171,214,.2);animation:eqEarthFloat 7s ease-in-out infinite}
      #${ROOT_ID} .eq-land{position:absolute;inset:0;width:100%;height:100%;opacity:.95;filter:drop-shadow(1px 2px 1px rgba(0,0,0,.16))}
      #${ROOT_ID} .eq-cloud{position:absolute;inset:-5%;border-radius:50%;background:repeating-linear-gradient(165deg,transparent 0 23px,rgba(255,255,255,.10) 25px 28px,transparent 31px 48px);mix-blend-mode:screen;opacity:.55}
      #${ROOT_ID} .eq-glow{position:absolute;inset:0;border-radius:50%;box-shadow:inset 9px 0 20px rgba(255,255,255,.17),inset -18px -4px 22px rgba(0,0,0,.22);pointer-events:none}
      #${ROOT_ID} .eq-float{position:absolute;z-index:3;font-size:24px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.25));animation:eqDrift 5s ease-in-out infinite}
      #${ROOT_ID} .eq-f1{left:5px;top:49px}.eq-f2{right:1px;top:88px;animation-delay:-1.8s}.eq-f3{left:22px;bottom:26px;animation-delay:-3s}.eq-f4{right:24px;bottom:12px;font-size:19px;animation-delay:-.8s}
      #${ROOT_ID} .eq-orbit-label{position:relative;z-index:2;margin-top:-3px;font-size:11px;color:#d6edf6;font-weight:700}
      #${ROOT_ID} .eq-panel{margin:12px 13px 0;padding:15px;border:1px solid #e3eee8;border-radius:17px;background:#fff;box-shadow:0 5px 18px rgba(22,65,47,.055)}
      #${ROOT_ID} .eq-panel-title{font-size:13px;font-weight:900;color:#183d30;margin-bottom:10px}
      #${ROOT_ID} .eq-progress-line{height:9px;background:#edf3ef;border-radius:20px;overflow:hidden}
      #${ROOT_ID} .eq-progress-fill{height:100%;border-radius:20px;background:linear-gradient(90deg,#80d69d,#28a879);transition:width .6s}
      #${ROOT_ID} .eq-progress-meta{display:flex;justify-content:space-between;gap:10px;margin-top:7px;font-size:10px;color:#72847b}
      #${ROOT_ID} .eq-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      #${ROOT_ID} .eq-stat{padding:12px 8px;border-radius:12px;background:#f4faf6;text-align:center}
      #${ROOT_ID} .eq-stat strong{display:block;font-size:21px;color:#22744d}
      #${ROOT_ID} .eq-stat span{font-size:10px;color:#718279}
      #${ROOT_ID} .eq-friends{display:flex;gap:8px;overflow:auto;padding:2px 1px 5px}
      #${ROOT_ID} .eq-friend{flex:0 0 76px;text-align:center;padding:10px 5px;border-radius:12px;background:#f6f8f7;border:1px solid #edf0ee}
      #${ROOT_ID} .eq-friend .emoji{font-size:27px;filter:grayscale(1);opacity:.38}
      #${ROOT_ID} .eq-friend.unlocked{background:#f0faf3;border-color:#cdebd7}
      #${ROOT_ID} .eq-friend.unlocked .emoji{filter:none;opacity:1}
      #${ROOT_ID} .eq-friend b{display:block;font-size:10px;margin-top:4px;color:#3c5548}
      #${ROOT_ID} .eq-friend small{font-size:9px;color:#84948b}
      #${ROOT_ID} .eq-action{display:block;width:100%;border:0;border-radius:12px;padding:13px 15px;background:linear-gradient(135deg,#269b68,#167b55);color:#fff;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;margin-top:10px}
      #${ROOT_ID} .eq-note{font-size:10px;line-height:1.65;color:#84928a;margin-top:9px}
      #${ROOT_ID} .eq-bunny-heading{display:flex;justify-content:space-between;align-items:center;margin:0 13px;padding:18px 3px 0;font-size:13px;font-weight:900;color:#234b38}
      #${ROOT_ID} #${BUNNY_ID}{margin-top:0}
      #${ROOT_ID} .eq-bunny-caption{margin:7px 13px 0;font-size:10px;line-height:1.6;color:#85938b}
      @keyframes eqEarthFloat{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
      @keyframes eqDrift{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-12px) rotate(6deg)}}
      @media(min-width:700px){#${ROOT_ID} .eq-hero{border-radius:0 0 26px 26px}#${ROOT_ID} .eq-panel{max-width:620px;margin-left:auto;margin-right:auto}#${ROOT_ID} .eq-orbit{width:250px;height:250px}#${ROOT_ID} .eq-earth{width:194px;height:194px}}
    `;
    document.head.appendChild(style);
  }

  function earthSvg() {
    return `<svg class="eq-land" viewBox="0 0 200 200" aria-hidden="true">
      <path fill="#72c88d" d="M37 36l17-9 15 5 7 13-8 8-2 13-12 8-7 18-11 3-8-15-9-7 3-15-8-9 8-10z"/>
      <path fill="#58b978" d="M68 96l16 5 9 14-4 15-9 13-5 21-10 9-8-15 2-18-7-17 4-15z"/>
      <path fill="#8bd18e" d="M104 35l16-10 22 4 13 12 19 5 5 14-12 10-17-4-11 10-13-6-10 8-13-9-14-1-8-13 8-11z"/>
      <path fill="#68bf7d" d="M111 91l15-5 13 10 2 17-10 13-3 22-13 16-10-12 1-19-8-14 5-16z"/>
      <path fill="#9cda9b" d="M159 128l12-7 10 7-2 13-12 8-10-8z"/>
      <path fill="#a6dca0" d="M22 118l8-5 7 7-4 10-8-2z"/>
    </svg>`;
  }

  function shellHtml() {
    return `
      <section class="eq-hero">
        <div class="eq-stars"></div>
        <div class="eq-kicker">ECOQUEST · HEALING PLANET</div>
        <h2 class="eq-headline" id="eqStageTitle">작은 흔적이 지구를 바꿔요</h2>
        <p class="eq-subtitle" id="eqStageSub">오늘의 작은 실천으로 지구에 생명을 돌려주세요.</p>
        <div class="eq-orbit">
          <span class="eq-float eq-f1">🦋</span><span class="eq-float eq-f2">🐦</span>
          <span class="eq-float eq-f3">🌿</span><span class="eq-float eq-f4">✨</span>
          <div class="eq-earth" id="eqEarth">${earthSvg()}<div class="eq-cloud"></div><div class="eq-glow"></div></div>
        </div>
        <div class="eq-orbit-label" id="eqStageName">🌫️ 회색의 지구</div>
      </section>

      <section class="eq-panel">
        <div class="eq-panel-title">🌱 나의 지구 회복 여정</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong id="eqTraceCount" style="font-size:20px;color:#22744d">0개</strong>
          <span id="eqNextLabel" style="font-size:10px;color:#718279">첫 흔적을 기다리는 중</span>
        </div>
        <div class="eq-progress-line"><div class="eq-progress-fill" id="eqProgressFill" style="width:0%"></div></div>
        <div class="eq-progress-meta"><span id="eqCurrentStage">회색의 지구</span><span id="eqNextStage">첫 번째 새싹까지 1개</span></div>
        <p class="eq-note">환경 미션을 인증할 때마다 지구에 흔적이 하나씩 쌓여요. 흔적은 미션 기록을 기준으로 계산하며, 미션 참여는 언제든 자율적으로 할 수 있어요.</p>
      </section>

      <section class="eq-panel">
        <div class="eq-panel-title">💚 내가 남긴 지구의 흔적</div>
        <div class="eq-stat-grid">
          <div class="eq-stat"><strong id="eqStatTraces">0</strong><span>인증한 환경 미션</span></div>
          <div class="eq-stat"><strong id="eqStatCO2">약 0kg</strong><span>기록된 CO₂ 회피배출량</span></div>
        </div>
      </section>

      <section class="eq-panel">
        <div class="eq-panel-title">🦔 돌아오는 지구 친구들</div>
        <div class="eq-friends" id="eqFriends"></div>
        <div class="eq-note">친구들은 지구 회복 여정을 보여주는 게임 연출이에요. 실제 야생동물의 개체 수나 서식지 회복을 의미하지는 않아요.</div>
      </section>

      <div class="eq-bunny-heading"><span>🐰 나의 토끼 가족</span><span style="font-size:10px;color:#829188;font-weight:600">기존 가족 데이터 유지</span></div>
      <p class="eq-bunny-caption">입양한 토끼, 행복도, 아이템, 정원 꾸미기는 기존 시스템 그대로 이용할 수 있어요.</p>
      <div id="${BUNNY_ID}"><div style="padding:25px;text-align:center;color:#87958d;font-size:12px">🐰 토끼 친구들을 불러오는 중...</div></div>
    `;
  }

  function renderFriends(count) {
    const wrap = $("eqFriends");
    if (!wrap) return;
    wrap.innerHTML = RETURNING_FRIENDS.map(friend => {
      const unlocked = count >= friend.min;
      return `<div class="eq-friend ${unlocked ? "unlocked" : ""}">
        <div class="emoji">${friend.emoji}</div>
        <b>${friend.name}</b>
        <small>${unlocked ? "돌아왔어요!" : `${friend.min}개부터`}</small>
      </div>`;
    }).join("");
  }

  function renderWorld() {
    const root = $(ROOT_ID);
    if (!root) return;
    const stage = currentStage(traceCount);
    const next = nextStage(traceCount);
    const prev = [...TRACE_LEVELS].reverse().find(item => item.min <= traceCount) || TRACE_LEVELS[0];
    const progress = next ? Math.max(0, Math.min(100, ((traceCount - prev.min) / (next.min - prev.min)) * 100)) : 100;
    $("eqStageTitle").textContent = stage.title;
    $("eqStageSub").textContent = stage.sub;
    $("eqStageName").textContent = `${stage.emoji} ${stage.name}`;
    $("eqTraceCount").textContent = `${traceCount}개`;
    $("eqStatTraces").textContent = String(traceCount);
    $("eqCurrentStage").textContent = stage.name;
    $("eqNextStage").textContent = next ? `${next.name}까지 ${Math.max(0, next.min - traceCount)}개` : "모든 단계 회복 완료 ✨";
    $("eqNextLabel").textContent = next ? `다음 단계까지 ${next.min - traceCount}개` : "지구 회복 여정 완주!";
    $("eqProgressFill").style.width = `${progress}%`;
    const earth = $("eqEarth");
    if (earth) {
      earth.style.filter = traceCount >= 1 ? "saturate(1.04)" : "grayscale(.82) saturate(.35)";
      earth.style.boxShadow = traceCount >= 30
        ? "inset -17px -13px 28px rgba(0,0,0,.42),0 0 34px rgba(100,239,180,.55),0 0 80px rgba(58,221,166,.3)"
        : "";
    }
    renderFriends(traceCount);
    const co2 = safeNum(window.UDATA && (window.UDATA.co2 ?? window.UDATA.totalCo2 ?? window.UDATA.co2Saved));
    $("eqStatCO2").textContent = `약 ${co2.toFixed(2)}kg`;
  }

  async function refreshTraces() {
    const uid = window.ME && window.ME.uid;
    if (!uid || !window.FB) {
      traceCount = 0;
      renderWorld();
      return;
    }
    if (lastUid && lastUid !== uid) traceCount = 0;
    lastUid = uid;
    try {
      const q = window.FB.query(
        window.FB.collection(window.FB.db, "missionLogs"),
        window.FB.where("uid", "==", uid)
      );
      const snap = await window.FB.getDocs(q);
      traceCount = snap.size;
    } catch (err) {
      console.warn("[EcoQuest World] 미션 기록을 불러오지 못했습니다.", err);
      // 권한/네트워크 오류 시 0으로 덮어쓰지 않고 기존 표시를 유지
    }
    renderWorld();
  }

  function ensureShell() {
    const page = $("page-map");
    if (!page) return false;
    let root = $(ROOT_ID);
    if (!root) {
      page.innerHTML = `<div id="${ROOT_ID}">${shellHtml()}</div>`;
      root = $(ROOT_ID);
    } else if (!$(BUNNY_ID)) {
      const bunny = document.createElement("div");
      bunny.id = BUNNY_ID;
      bunny.innerHTML = '<div style="padding:25px;text-align:center;color:#87958d;font-size:12px">🐰 토끼 친구들을 불러오는 중...</div>';
      root.appendChild(bunny);
    }
    return !!root;
  }

  function queueRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (ensureShell()) {
        refreshTraces();
        if (typeof window.drawMap === "function") window.drawMap();
      }
    }, 900);
  }

  function hookSaveMission() {
    if (saveHooked) return;
    const original = window.saveMission;
    if (typeof original !== "function") return;
    window.saveMission = async function (uid, mission) {
      const result = await original.apply(this, arguments);
      if (result && uid && uid === (window.ME && window.ME.uid)) queueRefresh();
      return result;
    };
    saveHooked = true;
  }

  function install() {
    installStyle();
    if (!ensureShell()) return false;
    renderWorld();
    hookSaveMission();
    refreshTraces();
    // bunny_patch.js가 먼저 실행된 경우 기존 drawMap()이 새 토끼 컨테이너를 채운다.
    if (typeof window.drawMap === "function") {
      try { window.drawMap(); } catch (e) { console.warn("[EcoQuest World] 토끼 화면 연결 대기", e); }
    }
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      hookSaveMission();
      // bunny_patch.js가 먼저 기존 토끼 컨테이너를 만들고 초기화를 시작할 때까지 기다린다.
      if (window.FB && $("page-map") && $(BUNNY_ID) && window._bunnyHookedSaveMission) {
        install();
        clearInterval(timer);
      } else if (tries > 80) {
        clearInterval(timer);
        console.warn("[EcoQuest World] Firebase 또는 지도 페이지를 찾지 못했습니다.");
      }
    }, 250);
    // 로그인/페이지 이동 후에도 토끼 컨테이너가 유지되도록 확인
    if (window.MutationObserver && $("page-map")) {
      observer = new MutationObserver(() => {
        const page = $("page-map");
        if (page && !$(ROOT_ID)) install();
      });
      observer.observe($("page-map"), { childList: true });
    }
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && $("page-map") && $("page-map").classList.contains("on")) queueRefresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  // 외부에서 수동 새로고침할 수 있는 공개 함수
  window.refreshEcoQuestWorld = queueRefresh;
})();
