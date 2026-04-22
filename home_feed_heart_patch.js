// home_feed_heart_patch.js - 홈 탭 피드에 좋아요 하트 추가
(function(){

  function renderHomeFeedWithHeart(w){
    if(!w) w = document.getElementById("feedList");
    if(!w) return;
    
    const all = window._allFeedItems || [];
    const page = window._feedPage || 0;
    const shown = all.slice(0, (page+1)*9);
    const hasMore = all.length > shown.length;
    const myUid = window.ME?.uid;
    
    shown.forEach(v => {
      window._feedItems[v.id] = {
        ...v,
        userName: (window._feedNicknameMap||{})[v.uid] || v.userName || "익명"
      };
    });

    // 소속 정보도 필요하면 가져오기 (아바타용)
    const nicknameMap = window._feedNicknameMap || {};
    const memberMap = {};
    Object.keys(nicknameMap).forEach(uid => {
      memberMap[uid] = { nickname: nicknameMap[uid], photo: '' };
    });

    // 카드 렌더링 (공통 함수 사용)
    const cardsHTML = shown.map(v => {
      if(typeof window.renderFeedCard === 'function'){
        return window.renderFeedCard(v, memberMap, myUid, 'home');
      }
      // 폴백 (기존 방식)
      return renderSimpleCard(v, myUid);
    }).join('');

    w.innerHTML = `
      <div id="homeFeedGrid">${cardsHTML}</div>
      ${hasMore 
        ? `<button onclick="loadMoreFeed()" style="
            width:100%;margin-top:10px;padding:10px;
            background:#f0fbf4;border:1.5px solid var(--bdr);
            border-radius:12px;font-size:13px;font-weight:700;
            color:var(--g2);cursor:pointer;font-family:inherit;
          ">더보기 (${all.length - shown.length}개 더) ↓</button>` 
        : ''
      }
    `;

    // 홈 피드 반응형 스타일
    if(!document.getElementById('homeFeedStyle')){
      const style = document.createElement('style');
      style.id = 'homeFeedStyle';
      style.textContent = `
        #homeFeedGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          #homeFeedGrid {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 14px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function renderSimpleCard(v, myUid){
    const nickname = v.userName || '익명';
    const isMe = v.uid === myUid;
    const timeStr = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';
    const likes = v.likes || [];
    const likeCount = likes.length;
    const iLiked = myUid && likes.includes(myUid);

    return `
      <div style="
        background:#fff;border-radius:16px;
        overflow:hidden;
        border:${isMe ? '2px solid var(--g1)' : '1px solid var(--bdr)'};
      ">
        <div onclick="openFeedDetail('${v.id}')" style="
          padding:10px 12px;display:flex;align-items:center;gap:10px;
          border-bottom:1px solid #f5f5f5;cursor:pointer;
        ">
          <div style="
            width:36px;height:36px;border-radius:50%;
            background:linear-gradient(135deg,var(--g1),var(--g2));
            display:flex;align-items:center;justify-content:center;
            font-size:16px;color:#fff;font-weight:700;flex-shrink:0;
          ">${nickname[0] || '👤'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${nickname}${isMe ? ' <span style="color:var(--g1);font-size:11px">(나)</span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--sub);margin-top:1px">${timeStr}</div>
          </div>
          <div style="background:#f0fbf4;border-radius:10px;padding:4px 10px;font-size:11px;font-weight:700;color:var(--g2);white-space:nowrap">
            ${v.missionEmoji || '🌱'} ${v.missionName || ''}
          </div>
        </div>
        <div onclick="openFeedDetail('${v.id}')" style="cursor:pointer">
          ${v.thumb 
            ? `<div style="width:100%;aspect-ratio:1;background:#f0f0f0;overflow:hidden">
                <img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>
              </div>`
            : `<div style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:72px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji || '🌱'}</div>`
          }
        </div>
        <div style="padding:8px 14px 4px;display:flex;align-items:center;gap:8px">
          <button 
            class="heart-btn ${iLiked ? 'liked' : ''}" 
            onclick="event.stopPropagation();window.toggleLike('${v.id}','home')"
            id="heart-${v.id}"
            style="background:none;border:none;cursor:pointer;font-size:22px;padding:4px;font-family:inherit;line-height:1">
            ${iLiked ? '❤️' : '🤍'}
          </button>
          <span id="likeCount-${v.id}" style="font-size:13px;font-weight:700;color:var(--txt)">
            ${likeCount > 0 ? `좋아요 ${likeCount}개` : '첫 좋아요를 눌러주세요'}
          </span>
        </div>
        ${v.comment 
          ? `<div style="padding:4px 14px 12px">
              <div style="font-size:13px;color:var(--txt);line-height:1.6">
                <b style="color:var(--g2)">${nickname}</b> ${v.comment}
              </div>
            </div>`
          : `<div style="padding-bottom:10px"></div>`
        }
      </div>
    `;
  }

  // 기존 renderFeedGrid 덮어쓰기
  const origRenderFeedGrid = window.renderFeedGrid;
  window.renderFeedGrid = renderHomeFeedWithHeart;

  // 기존 openFeedDetail도 하트 포함 버전으로
  const origOpenFeedDetail = window.openFeedDetail;
  window.openFeedDetail = (id) => {
    if(typeof window.openFeedDetailFrom === 'function'){
      window.openFeedDetailFrom('home', id);
    } else if(origOpenFeedDetail){
      origOpenFeedDetail(id);
    }
  };

  // 피드 로딩 후 강제 리렌더
  setTimeout(() => {
    if(window._allFeedItems && window._allFeedItems.length > 0){
      renderHomeFeedWithHeart();
    }
  }, 2000);

  console.log('[home_feed_heart_patch] 로드됨');
})();
