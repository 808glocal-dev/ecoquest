// company_feed_patch.js - 소속 팀 인증 피드 (인스타 스타일)
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

      // 인증 데이터 (같은 소속 + 공개만)
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

      // 인스타 스타일 피드
      const feedHTML = items.map(v => {
        const member = memberMap[v.uid] || {};
        const nickname = member.nickname || v.userName || '익명';
        const avatar = member.photo || v.userPhoto || '';
        const isMe = v.uid === myUid;
        const timeStr = window.timeAgo ? window.timeAgo(v.createdAt?.seconds) : '';

        return `
          <div onclick="window.openCompanyFeedDetail('${v.id}')" style="
            background:#fff;border-radius:16px;
            margin-bottom:12px;overflow:hidden;
            border:1px solid var(--bdr);
            cursor:pointer;transition:transform .15s, box-shadow .15s;
            ${isMe ? 'border:2px solid var(--g1);' : ''}
          " onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'"
            onmouseout="this.style.boxShadow='none'">
            
            <!-- 헤더: 사용자 정보 -->
            <div style="
              padding:10px 12px;display:flex;
              align-items:center;gap:10px;
              border-bottom:1px solid #f5f5f5;
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

            <!-- 코멘트 -->
            ${v.comment 
              ? `<div style="padding:10px 14px;">
                  <div style="font-size:13px;color:var(--txt);line-height:1.6">
                    <b style="color:var(--g2)">${nickname}</b> 
                    ${v.comment}
                  </div>
                </div>` 
              : ''
            }
          </div>
        `;
      }).join('');

      section.innerHTML = headerHTML + feedHTML;

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

  // 상세 팝업
  window.openCompanyFeedDetail = (id) => {
    const v = window._companyFeedItems?.[id];
    if(!v) return;

    const detailEl = document.getElementById('feedDetailContent');
    if(!detailEl) return;

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

  // 첫 로드 시 소속 탭이면 실행
  setTimeout(() => {
    const companyPage = document.getElementById('page-company');
    if(companyPage && companyPage.classList.contains('on')){
      renderCompanyFeed();
    }
  }, 2000);

  window.renderCompanyFeed = renderCompanyFeed;
})();
