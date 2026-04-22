// home_feed_heart_patch.js - 홈 피드에 좋아요 하트 (심플)
(function(){

  // 기존 renderFeedGrid 백업
  const origRender = window.renderFeedGrid;

  window.renderFeedGrid = function(w){
    if(!w) w = document.getElementById("feedList");
    if(!w) return;
    
    const all = window._allFeedItems || [];
    const page = window._feedPage || 0;
    const shown = all.slice(0, (page+1)*9);
    const hasMore = all.length > shown.length;
    const myUid = window.ME?.uid;
    const nicknameMap = window._feedNicknameMap || {};
    
    shown.forEach(v => {
      window._feedItems[v.id] = {
        ...v,
        userName: nicknameMap[v.uid] || v.userName || "익명"
      };
    });

    // 스타일
    if(!document.getElementById('homeFeedStyle')){
      const style = document.createElement('style');
      style.id = 'homeFeedStyle';
      style.textContent = `
        #homeFeedGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 3px;
        }
        @media (min-width: 768px) {
          #homeFeedGrid {
            gap: 14px;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const html = shown.map(v => {
      const nick = nicknameMap[v.uid] || v.userName || '익명';
      const likes = v.likes || [];
      const likeCount = likes.length;
      const iLiked = myUid && likes.includes(myUid);
      
      return `
        <div style="position:relative;background:#f0f0f0;aspect-ratio:1;border-radius:6px;overflow:hidden">
          <div onclick="openFeedDetail('${v.id}')" style="width:100%;height:100%;cursor:pointer">
            ${v.thumb 
              ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;background:linear-gradient(135deg,#f0fbf4,#e8f5e9)">${v.missionEmoji||'🌱'}</div>`
            }
            <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:4px 6px 6px">
              <div style="font-size:9px;color:#fff;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${v.missionEmoji||''} ${nick}
              </div>
              <div style="font-size:8px;color:rgba(255,255,255,.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${v.missionName||''}
              </div>
            </div>
          </div>
          <button onclick="event.stopPropagation();window.toggleHomeLike('${v.id}')" 
            id="homeHeart-${v.id}"
            style="
              position:absolute;top:4px;right:4px;
              background:rgba(0,0,0,.4);border:none;
              border-radius:50%;width:30px;height:30px;
              cursor:pointer;font-size:16px;
              display:flex;align-items:center;justify-content:center;
              font-family:inherit;padding:0;
            ">
            ${iLiked ? '❤️' : '🤍'}
          </button>
          ${likeCount > 0 
            ? `<div id="homeLikeCount-${v.id}" style="
                position:absolute;top:4px;left:4px;
                background:rgba(0,0,0,.6);
                color:#fff;border-radius:10px;
                padding:2px 7px;font-size:10px;font-weight:700;
              ">❤️ ${likeCount}</div>`
            : `<div id="homeLikeCount-${v.id}"></div>`
          }
        </div>
      `;
    }).join('');

    w.innerHTML = `
      <div id="homeFeedGrid">${html}</div>
      ${hasMore 
        ? `<button onclick="loadMoreFeed()" style="width:100%;margin-top:10px;padding:10px;background:#f0fbf4;border:1.5px solid var(--bdr);border-radius:12px;font-size:13px;font-weight:700;color:var(--g2);cursor:pointer;font-family:inherit">더보기 (${all.length-shown.length}개 더) ↓</button>`
        : ''
      }
    `;
  };

  // 홈 피드 좋아요
  window.toggleHomeLike = async (verifId) => {
    const myUid = window.ME?.uid;
    if(!myUid){
      if(window.toast) window.toast('로그인이 필요해요!');
      return;
    }

    try{
      const ref = window.FB.doc(window.FB.db, 'verifications', verifId);
      const snap = await window.FB.getDoc(ref);
      if(!snap.exists()) return;
      
      const likes = snap.data().likes || [];
      const iLiked = likes.includes(myUid);
      const newLikes = iLiked 
        ? likes.filter(uid => uid !== myUid) 
        : [...likes, myUid];
      
      await window.FB.updateDoc(ref, { likes: newLikes });
      
      // UI 업데이트
      const heart = document.getElementById(`homeHeart-${verifId}`);
      const count = document.getElementById(`homeLikeCount-${verifId}`);
      if(heart) heart.innerHTML = !iLiked ? '❤️' : '🤍';
      if(count){
        if(newLikes.length > 0){
          count.outerHTML = `<div id="homeLikeCount-${verifId}" style="position:absolute;top:4px;left:4px;background:rgba(0,0,0,.6);color:#fff;border-radius:10px;padding:2px 7px;font-size:10px;font-weight:700">❤️ ${newLikes.length}</div>`;
        } else {
          count.outerHTML = `<div id="homeLikeCount-${verifId}"></div>`;
        }
      }
      
      // 캐시 업데이트
      if(window._feedItems?.[verifId]) window._feedItems[verifId].likes = newLikes;
      if(window._allFeedItems){
        const item = window._allFeedItems.find(i => i.id === verifId);
        if(item) item.likes = newLikes;
      }
    } catch(e){
      console.error(e);
    }
  };

  // 피드 로드 후 리렌더
  setTimeout(() => {
    if(window._allFeedItems && window._allFeedItems.length > 0 && window.renderFeedGrid){
      window.renderFeedGrid();
    }
  }, 2000);

  console.log('[home_feed_heart_patch] 로드됨');
})();
