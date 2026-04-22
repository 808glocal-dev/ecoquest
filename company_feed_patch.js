// company_feed_patch.js - 소속 팀 인증 피드
(function(){

  async function renderCompanyFeed(){
    try{
      const myUid = window.ME?.uid;
      const myCompanyId = window.UDATA?.companyId;
      
      if(!myUid || !myCompanyId) return;

      // 소속 페이지 찾기
      const companyPage = document.getElementById('page-company');
      if(!companyPage) return;

      // 기존 피드 컨테이너 제거
      const existing = document.getElementById('companyFeedSection');
      if(existing) existing.remove();

      // 같은 소속 유저 UID 목록 찾기
      const usersSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'users'));
      const memberUids = usersSnap.docs
        .filter(d => d.data().companyId === myCompanyId)
        .map(d => d.id);

      if(!memberUids.length) return;

      // 닉네임 맵 만들기
      const nicknameMap = {};
      usersSnap.docs.forEach(d => {
        if(memberUids.includes(d.id)){
          nicknameMap[d.id] = d.data().nickname || '익명';
        }
      });

      // 소속 회사 정보
      const coSnap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'companies', myCompanyId));
      const coName = coSnap.exists() ? coSnap.data().name : '우리 팀';

      // 인증 데이터 가져오기
      const verifSnap = await window.FB.getDocs(window.FB.collection(window.FB.db, 'verifications'));
      const items = verifSnap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(v => memberUids.includes(v.uid)) // 같은 소속만
        .filter(v => v.isPublic) // 공개만
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 30);

      // 피드 섹션 생성
      const section = document.createElement('div');
      section.id = 'companyFeedSection';
      section.style.cssText = 'padding:12px;margin-top:8px';

      if(!items.length){
        section.innerHTML = `
          <div style="
            background:#fff;border-radius:14px;padding:20px;
            border:1px solid var(--bdr);text-align:center;
          ">
            <div style="font-size:15px;font-weight:900;color:var(--txt);margin-bottom:6px">
              📸 ${coName} 인증 피드
            </div>
            <div style="font-size:13px;color:var(--sub);line-height:1.6">
              아직 우리 소속 인증샷이 없어요!<br/>
              첫 번째 인증샷을 올려봐요 🌱
            </div>
          </div>
        `;
      } else {
        section.innerHTML = `
          <div style="
            display:flex;align-items:center;justify-content:space-between;
            margin-bottom:10px;padding:0 4px;
          ">
            <div style="font-size:15px;font-weight:900;color:var(--txt)">
              📸 ${coName} 인증 피드
            </div>
            <div style="font-size:11px;color:var(--sub)">
              총 ${items.length}개
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px">
            ${items.map(v => {
              const nick = nicknameMap[v.uid] || v.userName || '익명';
              return `
                <div onclick="window.openCompanyFeedDetail('${v.id}')" style="
                  position:relative;aspect-ratio:1;background:#f0f0f0;
                  cursor:pointer;border-radius:6px;overflow:hidden;
                ">
                  ${v.thumb 
                    ? `<img src="${v.thumb}" style="width:100%;height:100%;object-fit:cover"/>` 
                    : `<div style="
                        width:100%;height:100%;display:flex;
                        align-items:center;justify-content:center;
                        font-size:32px;
                        background:linear-gradient(135deg,#f0fbf4,#e8f5e9);
                      ">${v.missionEmoji || '🌱'}</div>`
                  }
                  <div style="
                    position:absolute;bottom:0;left:0;right:0;
                    background:linear-gradient(transparent,rgba(0,0,0,.65));
                    padding:6px 6px 4px;
                  ">
                    <div style="
                      font-size:10px;color:#fff;font-weight:700;
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                    ">${v.missionEmoji || ''} ${nick}</div>
                    <div style="
                      font-size:9px;color:rgba(255,255,255,.85);
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                    ">${v.missionName || ''}</div>
                  </div>
                  ${v.comment ? `
                    <div style="
                      position:absolute;top:4px;right:4px;
                      background:rgba(0,0,0,.55);border-radius:6px;
                      padding:1px 5px;font-size:9px;color:#fff;
                    ">💬</div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;

        // 상세 팝업용 데이터 저장
        window._companyFeedItems = {};
        items.forEach(v => {
          window._companyFeedItems[v.id] = {
            ...v,
            userName: nicknameMap[v.uid] || v.userName || '익명'
          };
        });
      }

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
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="
          width:36px;height:36px;border-radius:50%;overflow:hidden;
          background:linear-gradient(135deg,var(--g1),var(--g2));
          display:flex;align-items:center;justify-content:center;
          font-size:16px;flex-shrink:0;
        ">
          ${v.userPhoto 
            ? `<img src="${v.userPhoto}" style="width:100%;height:100%;object-fit:cover"/>` 
            : '👤'}
        </div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:var(--txt)">${v.userName}</div>
          <div style="font-size:11px;color:var(--sub)">${window.timeAgo(v.createdAt?.seconds)}</div>
        </div>
      </div>
      ${v.thumb 
        ? `<img src="${v.thumb}" style="width:100%;border-radius:12px;max-height:280px;object-fit:cover;margin-bottom:10px"/>` 
        : ''
      }
      <div style="background:#f0fbf4;border-radius:10px;padding:8px 12px;margin-bottom:8px">
        <span style="font-size:13px;font-weight:700;color:var(--g2)">
          ✅ ${v.missionEmoji} ${v.missionName}
        </span>
      </div>
      ${v.comment 
        ? `<div style="background:#f8f8f8;border-radius:10px;padding:10px 12px;font-size:13px;color:var(--txt);line-height:1.6">💬 "${v.comment}"</div>` 
        : ''
      }
    `;

    window.openOv('ovFeedDetail');
  };

  // 소속 탭 진입 시 자동 실행
  const origGoPage = window.goPage;
  if(typeof origGoPage === 'function'){
    window.goPage = function(name){
      origGoPage.apply(this, arguments);
      if(name === 'company'){
        setTimeout(renderCompanyFeed, 400);
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
