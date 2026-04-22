// company_feed_patch.js - 소속 팀 인증 피드 (반응형 + 좋아요)
(function(){

  async function renderCompanyFeed(){
    try{
      const myUid = window.ME?.uid;
      const myCompanyId = window.UDATA?.companyId;
      
      if(!myUid || !myCompanyId) return;

      const companyPage = document.getElementById('page-company');
      if(!companyPage) return;

      const existing = document.getElementById('companyFeedSection');
      if(existing) existing.remove();

      // 반응형 CSS 주입 (한 번만)
      if(!document.getElementById('companyFeedStyle')){
        const style = document.createElement('style');
        style.id = 'companyFeedStyle';
        style.textContent = `
          #companyFeedGrid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }
          @media (min-width: 768px) {
            #companyFeedGrid {
              grid-template-columns: 1fr 1fr 1fr;
              gap: 14px;
            }
          }
          @keyframes heartPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.4); }
            100% { transform: scale(1); }
          }
          .heart-btn {
            transition: transform .15s;
          }
          .heart-btn.liked {
            animation: heartPop .3s ease;
          }
        `;
        document.head.appendChild(style);
      }

      // 소속 멤버 UID 찾기 + 닉네임/아바타 맵
      const usersSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const memberUids = [];
      const memberMap = {};
      usersSnap.docs.forEach(d => {
        const data = d.data();
        if(data.companyId === myCompanyId){
          memberUids.push(d.id);
          memberMap[d.id] = {
            nickname: data.nickname || '익명',
            photo: data.photoURL || ''
          };
        }
      });

      if(!memberUids.length) return;

      // 소속 정보
      const coSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', myCompanyId));
      const coName = coSnap.exists() ? coSnap.data().name : '우리 팀';
      const coEmoji = coSnap.exists() ? (coSnap.data().emoji || '🏢') : '🏢';

      // 인증 데이터
      const verifSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
      const items = verifSnap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(v => memberUids.includes(v.uid))
        .filter(v => v.isPublic)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 30);

      const section = document.createElement('div');
      section.id = 'companyFeedSection';
      section.style.cssText = 'padding:0 12px 16px;margin-top:12px';

      // 헤더
      const headerHTML = `
        <div style="
          background:linear-gradient(135deg,#f0fbf4,#e8f5e9);
          border-radius:14px;padding:14px 16px;
          margin-bottom:12px;border:1.5px solid var(--g1);
          display:flex;align-items:center;justify-content:space-between;
        ">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:28px">${coEmoji}</div>
            <div>
              <div style="font-size:14px;font-weight:900;color:var(--txt)">
                ${coName} 인증 피드
              </div>
              <div style="font-size:11px;color:var(--sub);margin-top:2px">
                👥 ${memberUids.length}명 · 📸 ${items.length}개 인증
              </div>
            </div>
          </div>
          <button onclick="window.renderCompanyFeed()" style="
            background:#fff;border:1px solid var(--bdr);
            border-radius:10px;padding:6px 12px;
            font-size:12px;font-weight:700;
            color:var(--g2);cursor:pointer;
            font-family:inherit;
          ">🔄 새로고침</button>
        </div>
      `;

      if(!items.length){
        section.innerHTML = headerHTML + `
          <div style="
            background:#fff;border-radius:14px;padding:32px 20px;
            border:1px solid var(--bdr);text-align:center;
          ">
            <div style="font-size:48px;margin-bottom:12px">📸</div>
            <div style="font-size:14px;font-weight:700;color:var(--txt);margin-bottom:4px">
              아직 인증샷이 없어요!
            </div>
            <div style="font-size:12px;color:var(--sub);line-height:1.6">
              ${coName}의 첫 번째<br/>
              환경 실천 인증샷을 올려봐요 🌱
            </div>
          </div>
        `;
        companyPage.appendChild(section);
        return;
      }

      // 인스타 스타일 피드 (그리드 반응형)
      const feedHTML = items.map(v => renderFeedCard(v, memberMap, myUid, 'company')).join('');

      section.innerHTML = headerHTML + `<div id="companyFeedGrid">${feedHTML}</div>`;

      // 상세 팝업용 데이터
      window._companyFeedItems = {};
      items.forEach(v => {
        const member = memberMap[v.uid] || {};
        window._companyFeedItems[v.id] = {
          ...v,
          userName: member.nickname || v.userName || '익명',
          userPhoto: member.photo || v.userPhoto || ''
        };
      });

      companyPage.appendChild(section);

    } catch(e){
      console.error('[company_feed]', e);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 공통 피드 카드 렌더러 (홈/소속 공용)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.renderFeedCard = function(v, memberMap, myUid, source){
    const member = memberMap?.[v.uid] || {};
    const nickname = member.nickname || v.userName || '익명';
    const avatar = member.photo || v.userPhoto || '';
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
        <!-- 헤더: 사용자 정보 -->
        <div onclick="window.openFeedDetailFrom('${source}','${v.id}')" style="
          padding:10px 12px;display:flex;
          align-items:center;gap:10px;
          border-bottom:1px solid #f5f5f5;
          cursor:pointer;
        ">
          <div style="
            width:36px;height:36px;border-radius:50%;
            overflow:hidden;flex-shrink:0;
            background:linear-gradient(135deg,var(--g1),var(--g2));
            display:flex;align-items:center;justify-content:center;
            font-size:16px;color:#fff;font-weight:700;
            ${isMe ? 'box-shadow:0 0 0 2px var(--g1);' : ''}
          ">
            ${avatar 
              ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.parentElement.innerHTML='👤'"/>` 
              : (nickname[0] || '👤')}
          </div>
          <div style="flex:1;min-width:0">
            <div style="
              font-size:13px;font-weight:700;color:var(--txt);
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
            ">
              ${nickname}${isMe ? ' <span style="color:var(--g1);font-size:11px">(나)</span>' : ''}
            </div>
            <div style="font-size:11px;color:var(--sub);margin-top:1px">
              ${timeStr}
            </div>
          </div>
          <div style="
            background:#f0fbf4;border-radius:10px;
            padding:4px 10px;font-size:11px;
            font-weight:700;color:var(--g2);
            white-space:nowrap;
          ">
            ${v.missionEmoji || '🌱'} ${v.missionName || ''}
          </div>
        </div>

        <!-- 사진 -->
        <div onclick="window.openFeedDetailFrom('${source}','${v.id}')" style="cursor:pointer">
          ${v.thumb 
            ? `<div style="
                width:100%;aspect-ratio:1;
                background:#f0f0f0;overflow:hidden;
              ">
                <img src="${v.thumb}" style="
                  width:100%;height:100%;object-fit:cover;
                "/>
              </div>` 
            : `<div style="
                width:100%;aspect-ratio:1;
                display:flex;align-items:center;justify-content:center;
                font-size:72px;
                background:linear-gradient(135deg,#f0fbf4,#e8f5e9);
              ">${v.missionEmoji || '🌱'}</div>`
          }
        </div>

        <!-- 하트 + 좋아요 수 -->
        <div style="padding:8px 14px 4px;display:flex;align-items:center;gap:8px">
          <button 
            class="heart-btn ${iLiked ? 'liked' : ''}" 
            onclick="event.stopPropagation();window.toggleLike('${v.id}','${source}')"
            id="heart-${v.id}"
            style="
              background:none;border:none;cursor:pointer;
              font-size:22px;padding:4px;
              font-family:inherit;line-height:1;
            ">
            ${iLiked ? '❤️' : '🤍'}
          </button>
          <span id="likeCount-${v.id}" style="font-size:13px;font-weight:700;color:var(--txt)">
            ${likeCount > 0 ? `좋아요 ${likeCount}개` : '첫 좋아요를 눌러주세요'}
          </span>
        </div>

        <!-- 코멘트 -->
        ${v.comment 
          ? `<div style="padding:4px 14px 12px;">
              <div style="font-size:13px;color:var(--txt);line-height:1.6">
                <b style="color:var(--g2)">${nickname}</b> 
                ${v.comment}
              </div>
            </div>` 
          : `<div style="padding-bottom:10px"></div>`
        }
      </div>
    `;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 좋아요 토글
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.toggleLike = async (verifId, source) => {
    const myUid = window.ME?.uid;
    if(!myUid){
      if(window.toast) window.toast('로그인이 필요해요!');
      return;
    }

    try{
      // 현재 상태 가져오기
      const ref = window.FB.doc(window.FB.db, 'verifications', verifId);
      const snap = await window.FB.getDoc(ref);
      if(!snap.exists()) return;
      
      const data = snap.data();
      const likes = data.likes || [];
      const iLiked = likes.includes(myUid);
      
      let newLikes;
      if(iLiked){
        newLikes = likes.filter(uid => uid !== myUid);
      } else {
        newLikes = [...likes, myUid];
      }
      
      await window.FB.updateDoc(ref, { likes: newLikes });
      
      // UI 즉시 업데이트
      const heartBtn = document.getElementById(`heart-${verifId}`);
      const countEl = document.getElementById(`likeCount-${verifId}`);
      if(heartBtn){
        heartBtn.innerHTML = !iLiked ? '❤️' : '🤍';
        heartBtn.className = 'heart-btn' + (!iLiked ? ' liked' : '');
      }
      if(countEl){
        const newCount = newLikes.length;
        countEl.textContent = newCount > 0 ? `좋아요 ${newCount}개` : '첫 좋아요를 눌러주세요';
      }

      // 캐시된 데이터도 업데이트
      if(window._companyFeedItems?.[verifId]){
        window._companyFeedItems[verifId].likes = newLikes;
      }
      if(window._feedItems?.[verifId]){
        window._feedItems[verifId].likes = newLikes;
      }
      if(window._allFeedItems){
        const item = window._allFeedItems.find(i => i.id === verifId);
        if(item) item.likes = newLikes;
      }
    } catch(e){
      console.error('[toggleLike]', e);
      if(window.toast) window.toast('좋아요 실패: ' + e.message);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  // 상세 팝업 (소속/홈 공용)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━
  window.openFeedDetailFrom = (source, id) => {
    const v = source === 'company' 
      ? window._companyFeedItems?.[id]
      : window._feedItems?.[id];
    if(!v) return;

    const detailEl = document.getElementById('feedDetailContent');
    if(!detailEl) return;

    const likes = v.likes || [];
    const likeCount = likes.length;
    const iLiked = window.ME?.uid && likes.includes(window.ME.uid);

    detailEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="
          width:40px;height:40px;border-radius:50%;overflow:hidden;
          background:linear-gradient(135deg,var(--g1),var(--g2));
          display:flex;align-items:center;justify-content:center;
          font-size:18px;color:#fff;font-weight:700;flex-shrink:0;
        ">
          ${v.userPhoto 
            ? `<img src="${v.userPhoto}" style="width:100%;height:100%;object-fit:cover"/>` 
            : (v.userName[0] || '👤')}
        </div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700;color:var(--txt)">${v.userName}</div>
          <div style="font-size:12px;color:var(--sub)">${window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : ''}</div>
        </div>
      </div>
      ${v.thumb 
        ? `<img src="${v.thumb}" style="width:100%;border-radius:12px;max-height:400px;object-fit:cover;margin-bottom:12px"/>` 
        : ''
      }
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <button 
          onclick="window.toggleLikeDetail('${v.id}','${source}')"
          id="detail-heart-${v.id}"
          style="
            background:none;border:none;cursor:pointer;
            font-size:26px;padding:4px;
            font-family:inherit;line-height:1;
          ">
          ${iLiked ? '❤️' : '🤍'}
        </button>
        <span id="detail-likeCount-${v.id}" style="font-size:14px;font-weight:700;color:var(--txt)">
          ${likeCount > 0 ? `좋아요 ${likeCount}개` : '첫 좋아요를 눌러주세요'}
        </span>
      </div>
      <div style="background:#f0fbf4;border-radius:10px;padding:10px 14px;margin-bottom:10px;border:1px solid var(--bdr)">
        <span style="font-size:13px;font-weight:700;color:var(--g2)">
          ✅ ${v.missionEmoji} ${v.missionName}
        </span>
      </div>
      ${v.comment 
        ? `<div style="background:#f8f8f8;border-radius:10px;padding:12px 14px;font-size:14px;color:var(--txt);line-height:1.7">
            💬 <b>${v.userName}</b>: "${v.comment}"
          </div>` 
        : ''
      }
    `;

    if(typeof window.openOv === 'function') window.openOv('ovFeedDetail');
  };

  // 상세 팝업용 좋아요 토글
  window.toggleLikeDetail = async (verifId, source) => {
    const myUid = window.ME?.uid;
    if(!myUid){
      if(window.toast) window.toast('로그인이 필요해요!');
      return;
    }
    try{
      const ref = window.FB.doc(window.FB.db, 'verifications', verifId);
      const snap = await window.FB.getDoc(ref);
      if(!snap.exists()) return;
      
      const data = snap.data();
      const likes = data.likes || [];
      const iLiked = likes.includes(myUid);
      
      let newLikes;
      if(iLiked){
        newLikes = likes.filter(uid => uid !== myUid);
      } else {
        newLikes = [...likes, myUid];
      }
      
      await window.FB.updateDoc(ref, { likes: newLikes });
      
      // 상세 팝업 UI 업데이트
      const heartBtn = document.getElementById(`detail-heart-${verifId}`);
      const countEl = document.getElementById(`detail-likeCount-${verifId}`);
      if(heartBtn) heartBtn.innerHTML = !iLiked ? '❤️' : '🤍';
      if(countEl){
        const newCount = newLikes.length;
        countEl.textContent = newCount > 0 ? `좋아요 ${newCount}개` : '첫 좋아요를 눌러주세요';
      }
      
      // 그리드도 업데이트
      const gridHeart = document.getElementById(`heart-${verifId}`);
      const gridCount = document.getElementById(`likeCount-${verifId}`);
      if(gridHeart){
        gridHeart.innerHTML = !iLiked ? '❤️' : '🤍';
        gridHeart.className = 'heart-btn' + (!iLiked ? ' liked' : '');
      }
      if(gridCount){
        const newCount = newLikes.length;
        gridCount.textContent = newCount > 0 ? `좋아요 ${newCount}개` : '첫 좋아요를 눌러주세요';
      }

      // 캐시 업데이트
      if(window._companyFeedItems?.[verifId]){
        window._companyFeedItems[verifId].likes = newLikes;
      }
      if(window._feedItems?.[verifId]){
        window._feedItems[verifId].likes = newLikes;
      }
      if(window._allFeedItems){
        const item = window._allFeedItems.find(i => i.id === verifId);
        if(item) item.likes = newLikes;
      }
    } catch(e){
      console.error(e);
    }
  };

  // 소속 탭 진입 시 자동 실행
  const origGoPage = window.goPage;
  if(typeof origGoPage === 'function'){
    window.goPage = function(name){
      origGoPage.apply(this, arguments);
      if(name === 'company'){
        setTimeout(renderCompanyFeed, 500);
      }
    };
  }

  setTimeout(() => {
    const companyPage = document.getElementById('page-company');
    if(companyPage && companyPage.classList.contains('on')){
      renderCompanyFeed();
    }
  }, 2000);

  window.renderCompanyFeed = renderCompanyFeed;
})();
