/* 뽀송별 v9 · 네이티브 WebGL / 외부 3D CDN 의존 없음.
   기존 users, missionLogs, point, AI 인증 데이터는 읽기만 하며 변경하지 않습니다. */
(function () {
  'use strict';
  if (window.__PPOSONG_V9) return;
  window.__PPOSONG_V9 = true;
  // Replace an older overlay without changing any legacy business logic or Firebase data.
  try { if (window.PPOSONG3D && typeof window.PPOSONG3D.close === 'function') window.PPOSONG3D.close(); } catch(e) {console.warn('이전 게임 닫기 실패',e)}
  for (const id of ['ps3-root','ps3-launch','pposong-guest']) {const old=document.getElementById(id);if(old)old.remove()}


  const worlds = [
    ['초록숨별','작은 숲과 오솔길', [0.38,0.77,0.52], '#7dcfa9'],
    ['물결퐁별','고요한 바닷바람', [0.31,0.64,0.90], '#80c9e6'],
    ['바람솜별','구름처럼 가벼운 언덕', [0.79,0.71,0.94], '#c9b0ea'],
    ['반짝집별','작은 집과 따뜻한 빛', [0.96,0.74,0.47], '#f2ba87'],
    ['소풍식탁별','느긋한 소풍길', [0.89,0.55,0.58], '#e7a4ad'],
    ['나눔마을별','다정한 만남의 광장', [0.51,0.76,0.83], '#9bd5e2'],
    ['별빛산책별','달빛과 조용한 숲', [0.64,0.60,0.93], '#a6a0e9']
  ];
  const locations=[[-24,10,-18],[-11,-5,-8],[5,8,-23],[24,-9,-4],[43,16,-35],[-37,-15,-46],[21,20,-54]];
  const fallbackMissions = [
    {id:'m1',name:'텀블러 사용하기',emoji:'☕'}, {id:'m2',name:'대중교통 이용하기',emoji:'🚌'},
    {id:'m3',name:'채식 한 끼',emoji:'🥗'}, {id:'m8',name:'걸어서 이동하기',emoji:'🚶'},
    {id:'m11',name:'쓰레기 줍기',emoji:'🌱'}
  ];
  const safeText = s=>String(s==null?'':s);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const missions=()=>Array.isArray(window.__ps3MissionData)&&window.__ps3MissionData.length?window.__ps3MissionData:fallbackMissions;
  // 회원정보 없이 미션 모양만 보여주는 체험 모드. 실제 인증은 기존 openAI만 사용.
  const missionWorld=m=>{const n=parseInt(String(m.id||'').replace(/\D/g,''),10)||1;return (n-1)%worlds.length};

  const css=`
    #pp9-root{position:fixed;inset:0;z-index:2147482000;background:radial-gradient(ellipse at 54% 47%,#193458,#090d23 57%,#030615 100%);color:#fff;overflow:hidden;font-family:'Noto Sans KR',system-ui,sans-serif;isolation:isolate}
    #pp9-root[hidden]{display:none!important}
    #pp9-root.pp9-land{background:linear-gradient(180deg,#6ba8bc 0%,#b9d8d1 56%,#d2ded0 100%)}
    #pp9-bg,#pp9-canvas,#pp9-input{position:absolute;inset:0;width:100%;height:100%;display:block}
    #pp9-input{touch-action:none;cursor:grab;z-index:2;user-select:none}
    #pp9-input.dragging{cursor:grabbing}
    #pp9-hud{position:absolute;inset:0;z-index:3;pointer-events:none}
    #pp9-hud button,#pp9-hud .pp9-card,#pp9-hud .pp9-panel{pointer-events:auto}
    #pp9-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;position:absolute;top:14px;left:14px;right:14px}
    .pp9-card{background:#101f37c8;border:1px solid #d8faff55;border-radius:18px;backdrop-filter:blur(12px);padding:11px 14px;color:#fff;box-shadow:0 8px 32px #0713293b}
    .pp9-muted{font-size:11px;opacity:.78}
    #pp9-title{font-weight:800;font-size:19px;letter-spacing:-.03em}
    #pp9-stats{font-size:12px;white-space:nowrap}
    .pp9-btn{font:700 14px 'Noto Sans KR',system-ui,sans-serif;cursor:pointer;background:#e1f5e9;color:#214a46;border:1px solid #ffffff99;border-radius:13px;min-height:42px;padding:10px 15px;box-shadow:0 6px 18px #0003}
    .pp9-btn.alt{background:#172e4bdc;color:#f3fbff;border-color:#ffffff55}
    .pp9-btn:focus-visible{outline:3px solid #fef49f;outline-offset:2px}
    #pp9-controls{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;justify-content:center;gap:8px;max-width:calc(100vw - 130px);flex-wrap:wrap}
    #pp9-panel{display:none;position:absolute;top:78px;right:16px;bottom:110px;width:min(360px,calc(100vw - 32px));background:#0b1d36ed;border:1px solid #ffffff55;border-radius:23px;backdrop-filter:blur(18px);padding:18px;overflow:auto;box-shadow:0 22px 60px #0009}
    #pp9-panel.open{display:block}
    #pp9-options{display:grid;gap:8px;margin-top:14px}
    .pp9-option{width:100%;font:600 13px 'Noto Sans KR',system-ui,sans-serif;cursor:pointer;text-align:left;color:#fff;background:#ffffff13;border:1px solid #ffffff30;padding:12px;border-radius:12px;line-height:1.5}
    .pp9-option:hover{background:#ffffff25}
    #pp9-tip{position:absolute;left:16px;bottom:18px;font-size:12px;color:#e0f2ffdf;line-height:1.7;text-shadow:0 1px 9px #091123}
    #pp9-toast{position:absolute;top:83px;left:50%;transform:translateX(-50%);background:#142d48dc;border:1px solid #ffffff55;max-width:80vw;padding:10px 14px;border-radius:13px;display:none;text-align:center;font-size:13px}
    #pp9-pad{display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(2,42px);gap:5px;position:absolute;left:16px;bottom:102px}
    #pp9-pad button,#pp9-zoom button{background:#142b46de;color:white;border:1px solid #ffffff70;border-radius:11px;touch-action:none;font-size:19px;cursor:pointer}
    #pp9-zoom{display:grid;gap:7px;position:absolute;right:16px;bottom:105px}
    #pp9-zoom button{width:42px;height:42px}
    #pp9-failure{display:none;position:absolute;z-index:5;inset:20% 8% auto;background:#13213e;padding:24px;border:1px solid #eef7ff77;border-radius:20px;text-align:center}
    #pp9-failure.open{display:block}
    #pp9-guest{display:none;position:absolute;bottom:16px;right:16px;z-index:5}
    @media(max-width:680px){#pp9-top{top:8px;left:8px;right:8px}#pp9-title{font-size:16px}.pp9-card{padding:8px 10px}#pp9-stats{font-size:10px}#pp9-controls{bottom:16px;max-width:calc(100vw - 112px)}.pp9-btn{font-size:12px;padding:8px 10px;min-height:38px}#pp9-pad{bottom:108px;left:8px;grid-template-columns:repeat(3,35px);grid-template-rows:repeat(2,35px)}#pp9-zoom{bottom:108px;right:8px}#pp9-zoom button{width:35px;height:35px}#pp9-tip{font-size:10px;left:9px;bottom:8px;max-width:125px}#pp9-panel{top:64px;bottom:90px}}
    @media (prefers-reduced-motion: reduce){#pp9-root *{transition:none!important}}
  `;
  const sheet=document.createElement('style');sheet.id='pp9-style';sheet.textContent=css;document.head.appendChild(sheet);
  const root=document.createElement('section');root.id='pp9-root';root.hidden=true;root.tabIndex=0;
  root.innerHTML=`
    <canvas id="pp9-bg" aria-hidden="true"></canvas>
    <canvas id="pp9-canvas" aria-label="뽀송별 3D 우주"></canvas>
    <div id="pp9-input" role="application" aria-label="우주와 지상 마우스 조작 영역"></div>
    <div id="pp9-hud">
      <div id="pp9-top"><div class="pp9-card"><div id="pp9-title">☁️ 뽀송별 <small style="font-size:10px;opacity:.7">v9</small></div><div class="pp9-muted" id="pp9-place">광활한 우주</div></div>
      <div class="pp9-card" id="pp9-stats">🌱 <span id="pp9-mcount">0</span>회 · 약 <span id="pp9-co2">0</span>kg CO₂ <button id="pp9-close" title="기존 화면으로 돌아가기" style="background:none;color:#fff;border:0;cursor:pointer;font-size:19px;margin-left:8px">×</button></div></div>
      <div id="pp9-toast" role="status"></div>
      <div class="pp9-panel" id="pp9-panel"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b id="pp9-panel-title">행성</b><button class="pp9-btn alt" id="pp9-panel-close">닫기</button></div><div id="pp9-options"></div></div>
      <div id="pp9-pad"><span></span><button data-go="up" aria-label="앞으로">↑</button><span></span><button data-go="left" aria-label="왼쪽">←</button><button data-go="down" aria-label="뒤로">↓</button><button data-go="right" aria-label="오른쪽">→</button></div>
      <div id="pp9-zoom"><button id="pp9-plus" title="확대">+</button><button id="pp9-minus" title="축소">−</button></div>
      <div id="pp9-controls"></div>
      <div id="pp9-tip">🖱️ 드래그: 둘러보기<br>휠: 확대·축소<br>클릭: 선택·걷기 · WASD: 이동</div>
    </div>
    <div id="pp9-failure" role="alert"><b>3D 그래픽을 시작할 수 없어요.</b><p style="margin:12px 0;line-height:1.7">브라우저 WebGL을 활성화하거나 다른 기기에서 열어주세요.<br>기존 회원과 인증 데이터는 안전하게 유지돼요.</p><button class="pp9-btn" id="pp9-error-close">기존 화면으로 돌아가기</button></div>
  `;
  document.body.appendChild(root);
  const el=id=>document.getElementById(id),input=el('pp9-input'),glCanvas=el('pp9-canvas'),bg=el('pp9-bg');
  const panel=el('pp9-panel'),actions=el('pp9-controls');
  let gl=null,software=false,softCtx=null,program=null,attribs={},uniforms={},mesh={},sceneReady=false,active=false,mode='space',planetIndex=0;
  let raf=0,previous=0,roll=0,spaceX=0,spaceY=0,spaceZ=94,lookTheta=.25,approachDistance=14;
  let landYaw=0.55,landPitch=0.49,landDistance=16,characterX=0,characterZ=3,characterFacing=0,walkPhase=0,rest=false;
  let walkTo=null,pointer=null,keys={up:false,down:false,left:false,right:false},view=null,proj=null,vp=null,eye=[0,0,0],forward=[0,0,-1],right=[1,0,0],up=[0,1,0];
  let nextMission=null,statsTimer=0,notificationTimer=0,stars=[];
  const game={getState:()=>({active,mode,planetIndex,spaceX,spaceY,spaceZ,landYaw,landDistance,characterX,characterZ,webgl:!!gl,software}),open,close,selectPlanet:selectWorld,land,space,refreshStats};
  window.PPOSONG3D=game;window.PPOSONG_V9=game;

  // 4x4 matrix and vector math (column major; standard WebGL coordinates).
  const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  const mult=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o};
  const trans=(x=0,y=0,z=0)=>{const a=I();a[12]=x;a[13]=y;a[14]=z;return a};
  const scale=(x=1,y=1,z=1)=>{const a=I();a[0]=x;a[5]=y;a[10]=z;return a};
  const rotY=t=>{const c=Math.cos(t),s=Math.sin(t),a=I();a[0]=c;a[2]=-s;a[8]=s;a[10]=c;return a};
  const norm=a=>{const d=Math.hypot(...a)||1;return a.map(v=>v/d)};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const lookAt=(e,at)=>{const z=norm(e.map((v,i)=>v-at[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);right=x;up=y;forward=z.map(v=>-v);const o=I();o[0]=x[0];o[1]=y[0];o[2]=z[0];o[4]=x[1];o[5]=y[1];o[6]=z[1];o[8]=x[2];o[9]=y[2];o[10]=z[2];o[12]=-dot(x,e);o[13]=-dot(y,e);o[14]=-dot(z,e);return o};
  const persp=(fov,aspect,n,f)=>{const t=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=t/aspect;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o};
  function model(x,y,z,sx=1,sy=1,sz=1,yaw=0){return mult(mult(trans(x,y,z),rotY(yaw)),scale(sx,sy,sz))}
  function pointProj(p){if(!vp)return null;const [x,y,z]=p;const q=[vp[0]*x+vp[4]*y+vp[8]*z+vp[12],vp[1]*x+vp[5]*y+vp[9]*z+vp[13],vp[2]*x+vp[6]*y+vp[10]*z+vp[14],vp[3]*x+vp[7]*y+vp[11]*z+vp[15]];if(q[3]<.1)return null;return {x:(q[0]/q[3]+1)*.5*input.clientWidth,y:(1-q[1]/q[3])*.5*input.clientHeight,scale:input.clientHeight/q[3],depth:q[2]/q[3]}};
  function initGL(){
    gl=glCanvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false})||glCanvas.getContext('experimental-webgl',{alpha:true,antialias:true});
    if(!gl)return false;
    const vs=`attribute vec3 aPos;attribute vec3 aNorm;uniform mat4 uM,uMVP;varying float light;void main(){vec3 n=normalize(mat3(uM)*aNorm);light=0.54+0.46*max(dot(n,normalize(vec3(0.32,0.8,0.55))),0.0);gl_Position=uMVP*vec4(aPos,1.0);}`;
    const fs=`precision mediump float;uniform vec3 uColor;varying float light;void main(){gl_FragColor=vec4(uColor*light,1.0);}`;
    const compile=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh};
    program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    attribs.p=gl.getAttribLocation(program,'aPos');attribs.n=gl.getAttribLocation(program,'aNorm');
    uniforms.m=gl.getUniformLocation(program,'uM');uniforms.mvp=gl.getUniformLocation(program,'uMVP');uniforms.color=gl.getUniformLocation(program,'uColor');
    mesh.box=makeBox();mesh.sphere=makeSphere(12,20);mesh.sphereSmall=makeSphere(8,12);mesh.cone=makeCone(14);mesh.cyl=makeCylinder(14);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);
    glCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();el('pp9-failure').classList.add('open')});
    return true;
  }
  function makeGeo(tris){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tris),gl.STATIC_DRAW);return {buffer:b,count:tris.length/6}}
  const addTri=(out,a,b,c,n)=>{for(const v of [a,b,c])out.push(...v,...n)};
  function makeBox(){const a=[],p=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
    for(const [ids,n] of [[[4,5,6,7],[0,0,1]],[[1,0,3,2],[0,0,-1]],[[0,4,7,3],[-1,0,0]],[[5,1,2,6],[1,0,0]],[[3,7,6,2],[0,1,0]],[[0,1,5,4],[0,-1,0]]]){addTri(a,p[ids[0]],p[ids[1]],p[ids[2]],n);addTri(a,p[ids[0]],p[ids[2]],p[ids[3]],n)}return makeGeo(a)}
  function makeSphere(stacks,rings){const a=[];const pt=(lat,lon)=>[Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)];for(let i=0;i<stacks;i++){const lat1=-Math.PI/2+Math.PI*i/stacks,lat2=-Math.PI/2+Math.PI*(i+1)/stacks;for(let j=0;j<rings;j++){const lon1=j*2*Math.PI/rings,lon2=(j+1)*2*Math.PI/rings;const p=pt(lat1,lon1),q=pt(lat1,lon2),r=pt(lat2,lon1),s=pt(lat2,lon2);addTri(a,p,r,q,p);addTri(a,q,r,s,q)}}return makeGeo(a)}
  function makeCone(segments){const a=[];for(let i=0;i<segments;i++){const t=i*2*Math.PI/segments,u=(i+1)*2*Math.PI/segments;const p=[Math.cos(t),0,Math.sin(t)],q=[Math.cos(u),0,Math.sin(u)],top=[0,1,0],n=norm([Math.cos((t+u)/2),.5,Math.sin((t+u)/2)]);addTri(a,p,top,q,n);addTri(a,[0,0,0],p,q,[0,-1,0])}return makeGeo(a)}
  function makeCylinder(segments){const a=[];for(let i=0;i<segments;i++){const t=i*2*Math.PI/segments,u=(i+1)*2*Math.PI/segments,p=[Math.cos(t),0,Math.sin(t)],q=[Math.cos(u),0,Math.sin(u)],r=[p[0],1,p[2]],s=[q[0],1,q[2]],n=norm([Math.cos((t+u)/2),0,Math.sin((t+u)/2)]);addTri(a,p,r,q,n);addTri(a,q,r,s,n);addTri(a,[0,1,0],s,r,[0,1,0]);addTri(a,[0,0,0],p,q,[0,-1,0])}return makeGeo(a)}
  function draw(geo,color,x,y,z,sx=1,sy=1,sz=1,yaw=0){if(!gl||!vp)return;const m=model(x,y,z,sx,sy,sz,yaw),mvp=mult(vp,m);gl.uniformMatrix4fv(uniforms.m,false,m);gl.uniformMatrix4fv(uniforms.mvp,false,mvp);gl.uniform3fv(uniforms.color,color);gl.bindBuffer(gl.ARRAY_BUFFER,geo.buffer);gl.vertexAttribPointer(attribs.p,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(attribs.n,3,gl.FLOAT,false,24,12);gl.drawArrays(gl.TRIANGLES,0,geo.count)}
  const C={white:[.99,.97,.93],pink:[.98,.73,.78],brown:[.73,.46,.36],leaf:[.26,.63,.37],leaf2:[.53,.79,.54],dark:[.23,.38,.41],sand:[.89,.81,.65],earth:[.46,.71,.54],path:[.83,.79,.62],blue:[.34,.66,.88],gold:[.95,.79,.45],purple:[.68,.57,.87]};
  function rabbit(x,z,t,s=1){const bob=rest?-.15:Math.abs(Math.sin(walkPhase))*0.08;const y=bob;draw(mesh.sphere,C.white,x,y+.76,z,.47*s,.64*s,.4*s,characterFacing);
    draw(mesh.sphere,C.white,x,y+1.48,z,.53*s,.48*s,.47*s);draw(mesh.sphere,C.white,x-.24*s,y+2.07,z,.16*s,.47*s,.16*s);draw(mesh.sphere,C.white,x+.24*s,y+2.07,z,.16*s,.47*s,.16*s);
    draw(mesh.sphere,C.pink,x-.24*s,y+2.07,z+.10*s,.09*s,.34*s,.07*s);draw(mesh.sphere,C.pink,x+.24*s,y+2.07,z+.10*s,.09*s,.34*s,.07*s);
    draw(mesh.sphere,C.brown,x-.20*s,y+1.56,z+.46*s,.07*s,.075*s,.07*s);draw(mesh.sphere,C.brown,x+.20*s,y+1.56,z+.46*s,.07*s,.075*s,.07*s);
    draw(mesh.sphere,C.pink,x,y+1.36,z+.51*s,.09*s,.06*s,.06*s);draw(mesh.sphere,C.white,x-.24*s,y+.25,z+.2*s,.24*s,.17*s,.3*s);draw(mesh.sphere,C.white,x+.24*s,y+.25,z+.2*s,.24*s,.17*s,.3*s)}
  function tree(x,z,s=1){draw(mesh.cyl,C.brown,x,-.5,z,.22*s,1.25*s,.22*s);draw(mesh.cone,C.leaf,x,.7*s-.2,z,1.25*s,2.9*s,1.25*s);draw(mesh.cone,C.leaf2,x,1.0*s,z,.85*s,1.9*s,.85*s)}
  function station(x,z,i){const a=worlds[planetIndex][2],t=performance.now()*.001;draw(mesh.cyl,C.sand,x,-.7,z,.6,.35,.6);draw(mesh.sphere,a,x,.55+Math.sin(t*1.7+i)*.1,z,.52,.52,.52);draw(mesh.sphere,C.white,x,.55+Math.sin(t*1.7+i)*.1,z+.45,.15,.15,.15)}
  function planet(i,x,y,z,r,t){const co=worlds[i][2];draw(mesh.sphere,co,x,y,z,r,r,r,t*.06+i*.25);const rand=i+1;for(let a=0;a<7;a++){const th=(a*2.27+rand)*1.7;const ph=(a*3.21+.9)*.84;const ox=Math.cos(th)*Math.cos(ph),oy=Math.sin(ph),oz=Math.sin(th)*Math.cos(ph);draw(mesh.sphere,C.leaf2,x+ox*r*.87,y+oy*r*.87,z+oz*r*.87,r*.21,r*.09,r*.26,t*.01)}}
  function resize(){const dpr=Math.min(2,devicePixelRatio||1),w=root.clientWidth||innerWidth,h=root.clientHeight||innerHeight;for(const c of [bg,glCanvas]){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);c.style.width=w+'px';c.style.height=h+'px'}if(gl)gl.viewport(0,0,glCanvas.width,glCanvas.height);drawStars();}
  function drawStars(){const ctx=bg.getContext('2d');if(!ctx)return;const w=bg.width,h=bg.height;ctx.clearRect(0,0,w,h);if(mode==='land')return;let seed=48381;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);for(let i=0;i<600;i++){const x=rnd()*w,y=rnd()*h,r=rnd()*1.35+.25;ctx.fillStyle=i%8===0?'rgba(179,227,255,.85)':'rgba(255,255,255,.63)';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}}
  function cam(){const aspect=Math.max(.2,glCanvas.clientWidth/glCanvas.clientHeight);proj=persp(62*Math.PI/180,aspect,.08,600);let target;
    if(mode==='space'){eye=[spaceX,spaceY,spaceZ];target=[spaceX*.65,spaceY*.65,-18]}
    else if(mode==='approach'){eye=[Math.sin(lookTheta)*approachDistance,approachDistance*.25,Math.cos(lookTheta)*approachDistance];target=[0,0,0]}
    else{eye=[characterX+Math.sin(landYaw)*landDistance*Math.cos(landPitch),landDistance*Math.sin(landPitch)+1.6,characterZ+Math.cos(landYaw)*landDistance*Math.cos(landPitch)];target=[characterX,1.0,characterZ]}
    view=lookAt(eye,target);vp=mult(proj,view);
  }
  // Reliable software-perspective fallback when a browser blocks WebGL entirely.
  // Uses the exact same 3D camera and world coordinates as the WebGL renderer.
  function softwareRender(now){
    if(!softCtx) return;
    const ctx=softCtx, dpr=glCanvas.width/Math.max(1,input.clientWidth), w=input.clientWidth,h=input.clientHeight;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);cam();
    function ball(pos,r,color,outline){const p=pointProj(pos);if(!p||p.depth>1.2)return;const rad=clamp(Math.abs(p.scale*r),1,Math.max(w,h)*2);const gr=ctx.createRadialGradient(p.x-rad*.25,p.y-rad*.32,rad*.05,p.x,p.y,rad);
      gr.addColorStop(0,'#ffffff');gr.addColorStop(.1,color);gr.addColorStop(1,outline||'#172e40');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,2*Math.PI);ctx.fill();return {p,rad}}
    function textAt(pos,txt,sz=13){const p=pointProj(pos);if(!p)return;ctx.fillStyle='#ffffff';ctx.shadowColor='#001527';ctx.shadowBlur=5;ctx.font=`700 ${sz}px system-ui`;ctx.textAlign='center';ctx.fillText(txt,p.x,p.y);ctx.shadowBlur=0}
    if(mode==='space'){locations.forEach((loc,i)=>{const size=(i===0?3.8:2.7);const co=worlds[i][3];const o=ball(loc,size,co,'#152139');if(!o)return;ctx.fillStyle='#b4e9be';for(let j=0;j<3;j++){const a=(j*2.2+i*.6+now*.00003),px=o.p.x+Math.cos(a)*o.rad*.42,py=o.p.y+Math.sin(a*1.5)*o.rad*.42;ctx.beginPath();ctx.ellipse(px,py,o.rad*.19,o.rad*.105,a,0,Math.PI*2);ctx.fill()}textAt([loc[0],loc[1]-size-1.8,loc[2]],worlds[i][0],12)});return}
    if(mode==='approach'){const v=worlds[planetIndex];ball([0,0,0],3.3,v[3],'#1a3142');textAt([0,-4.65,0],v[0],22);return}
    // perspective land: horizon, grass, distance-scaled nature, mission markers and rabbit
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#78bac8');sky.addColorStop(.63,'#c4dfd2');sky.addColorStop(1,'#a2bd91');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const corners=[[-36,-1.14,-36],[36,-1.14,-36],[36,-1.14,36],[-36,-1.14,36]].map(pointProj);
    if(corners.every(Boolean)){ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#86bb8b';ctx.fill()}
    const scenery=[];
    for(let i=0;i<12;i++){scenery.push({type:'tree',x:-24+i*4.5,z:6*Math.sin(i*.8)+11});scenery.push({type:'tree',x:-25+i*4.5,z:-13-4*Math.cos(i*.8)})}
    const list=missions().filter(m=>missionWorld(m)===planetIndex);
    list.forEach((m,i)=>scenery.push({type:'station',x:(i%2?6:-6)+(Math.floor(i/2)%2?2:0),z:-16+Math.floor(i/2)*10,mission:m}));
    scenery.push({type:'rabbit',x:characterX,z:characterZ});
    scenery.sort((a,b)=>Math.hypot(eye[0]-b.x,eye[2]-b.z)-Math.hypot(eye[0]-a.x,eye[2]-a.z));
    scenery.forEach(o=>{const p=pointProj([o.x,-.95,o.z]);if(!p)return;const sc=clamp(p.scale,.3,120);if(o.type==='tree'){const size=clamp(sc*3.2,2,190);ctx.fillStyle='#6b4f3a';ctx.fillRect(p.x-size*.08,p.y-size*.7,size*.16,size*.7);ctx.fillStyle='#4b9164';ctx.beginPath();ctx.moveTo(p.x,p.y-size*2);ctx.lineTo(p.x-size*.75,p.y-size*.42);ctx.lineTo(p.x+size*.75,p.y-size*.42);ctx.fill();}
      else if(o.type==='station'){let size=clamp(sc*.75,4,50);ctx.fillStyle='#f4d68d';ctx.fillRect(p.x-size*.35,p.y-size*.55,size*.7,size*.6);ball([o.x,.1,o.z],.37,worlds[planetIndex][3],'#56758b');}
      else {const size=clamp(sc*1.25,7,95);ctx.fillStyle='#fff5f2';ctx.beginPath();ctx.ellipse(p.x,p.y-size*.8,size*.55,size*.75,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(p.x,p.y-size*1.56,size*.57,size*.48,0,0,Math.PI*2);ctx.fill();for(const dir of [-1,1]){ctx.beginPath();ctx.ellipse(p.x+dir*size*.32,p.y-size*2.18,size*.15,size*.55,-dir*.12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#303c48';ctx.beginPath();ctx.arc(p.x+dir*size*.19,p.y-size*1.59,size*.055,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff5f2'}}
    });
  }
  function worldRender(now){if(software){softwareRender(now);return}if(!gl)return;gl.viewport(0,0,glCanvas.width,glCanvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.enableVertexAttribArray(attribs.p);gl.enableVertexAttribArray(attribs.n);cam();
    if(mode==='space'){for(let i=0;i<7;i++){const [x,y,z]=locations[i];planet(i,x,y,z,i===0?3.8:2.7,now)}
      planet(0,52,-26,-65,4.4,now);
    }else if(mode==='approach'){planet(planetIndex,0,0,0,3.3,now)}
    else{
      const col=worlds[planetIndex][2];draw(mesh.box,[.45*col[0]+.24,.45*col[1]+.34,.45*col[2]+.21],0,-1.52,0,76,.8,76);
      for(let i=0;i<12;i++){let x=-24+i*4.5,z=6*Math.sin(i*.8)+11;tree(x,z,.7+Math.abs(Math.sin(i*3.14))*.35)}
      for(let i=0;i<12;i++){let x=-25+i*4.5,z=-13-4*Math.cos(i*.8);tree(x,z,.7+Math.abs(Math.sin(i*1.7))*.3)}
      draw(mesh.box,C.path,0,-1.08,0,5,.13,66);
      const picked=missions().filter(m=>missionWorld(m)===planetIndex);
      picked.forEach((m,i)=>{const x=(i%2?6:-6)+(Math.floor(i/2)%2?2:0),z=-16+Math.floor(i/2)*10;station(x,z,i)});
      // A wooden bench and a small resting hut.
      draw(mesh.box,C.brown,-10,-.5,6,2,.26,.8);draw(mesh.box,C.brown,-10,-.1,6,2,.9,.2);
      draw(mesh.box,C.white,13,.2,8,4,3.4,3.5);draw(mesh.cone,C.pink,13,1.92,8,3.3,2.1,3.3);
      for(let i=0;i<14;i++){const x=-18+i*2.8,z=-5+4*Math.sin(i*2.9);draw(mesh.sphere,i%3===0?C.pink:C.gold,x,-.5,z,.17,.26,.18)}
      rabbit(characterX,characterZ,now);
      // Quiet non-player animals. These are not other signed-in people.
      draw(mesh.sphere,C.brown,-6,-.20,-10,.45,.45,.55);draw(mesh.sphere,C.brown,-6,0.3,-9.9,.35,.38,.35);draw(mesh.sphere,C.white,-5.85,.42,-9.6,.16,.16,.16);
      draw(mesh.sphere,C.white,7,-.23,11,.42,.42,.48);draw(mesh.sphere,C.pink,6.78,.32,11,.15,.4,.12);draw(mesh.sphere,C.pink,7.22,.32,11,.15,.4,.12);
    }
  }
  function render(now){if(!active)return;const dt=Math.min(.06,(now-previous)/1000||.016);previous=now;update(dt);try{worldRender(now)}catch(e){console.error('[뽀송별 렌더링]',e);showFailure();return}raf=requestAnimationFrame(render)}
  function update(dt){if(mode==='space'){const speed=20*dt*(spaceZ/80);const dx=(Number(keys.right)-Number(keys.left))*speed,dy=(Number(keys.up)-Number(keys.down))*speed;spaceX=clamp(spaceX+dx,-85,85);spaceY=clamp(spaceY+dy,-65,65);return}
    if(mode!=='land')return;
    let x=Number(keys.right)-Number(keys.left),z=Number(keys.down)-Number(keys.up);const len=Math.hypot(x,z);
    if(len){walkTo=null;const ax=(Math.cos(landYaw)*x+Math.sin(landYaw)*z)/len,az=(-Math.sin(landYaw)*x+Math.cos(landYaw)*z)/len;characterX=clamp(characterX+ax*dt*6,-32,32);characterZ=clamp(characterZ+az*dt*6,-32,32);characterFacing=Math.atan2(ax,az);walkPhase+=dt*11;rest=false}
    else if(walkTo){const dx=walkTo.x-characterX,dz=walkTo.z-characterZ,d=Math.hypot(dx,dz);if(d<.42){const mission=walkTo.mission;walkTo=null;if(mission)showMission(mission)}else{const k=Math.min(d,dt*6)/d;characterX+=dx*k;characterZ+=dz*k;characterFacing=Math.atan2(dx,dz);walkPhase+=dt*11}}
  }
  function msg(s){const t=el('pp9-toast');t.textContent=s;t.style.display='block';clearTimeout(notificationTimer);notificationTimer=setTimeout(()=>t.style.display='none',2300)}
  function refreshStats(){const u=window.UDATA||{};el('pp9-mcount').textContent=safeText(Math.max(0,Number(u.missionCount)||0));el('pp9-co2').textContent=(Math.max(0,Number(u.co2)||0)).toFixed(2)}
  function setMode(m){mode=m;root.classList.toggle('pp9-land',m==='land');el('pp9-place').textContent=m==='space'?'광활한 우주':worlds[planetIndex][0]+' · '+(m==='approach'?'착륙 준비':'느리게 산책하는 중');drawActions();drawStars()}
  function addAction(label,action,alt=false){const btn=document.createElement('button');btn.type='button';btn.className='pp9-btn'+(alt?' alt':'');btn.textContent=label;btn.addEventListener('click',e=>{e.stopPropagation();action()});actions.append(btn)}
  function drawActions(){actions.replaceChildren();if(mode==='space'){addAction('🪐 행성 찾아보기',showWorlds);addAction('🎵 소리',toggleAudio,true)}else if(mode==='approach'){addAction('🚀 착륙하기',land);addAction('🌌 우주로 돌아가기',space,true)}else{addAction('🌱 이 별의 미션',showMissions);addAction('🪑 앉기 / 일어나기',()=>{rest=!rest;msg(rest?'잠시 쉬어가요':'다시 산책해요')},true);addAction('👋 친구 보기',showFriends,true);addAction('🚀 우주로',space,true)}}
  function showPanel(title,items){el('pp9-panel-title').textContent=title;const holder=el('pp9-options');holder.replaceChildren();items.forEach(obj=>{const b=document.createElement('button');b.type='button';b.className='pp9-option';b.textContent=obj.label;b.onclick=()=>{panel.classList.remove('open');obj.action()};holder.append(b)});panel.classList.add('open')}
  function showWorlds(){showPanel('어느 별에 가볼까요?',worlds.map((w,i)=>({label:'🪐 '+w[0]+' · '+w[1],action:()=>selectWorld(i)})))}
  function selectWorld(i){planetIndex=clamp(Number(i)||0,0,worlds.length-1);lookTheta=.2;approachDistance=14;setMode('approach');msg(worlds[planetIndex][0]+'에 가까워지고 있어요')}
  function land(){characterX=0;characterZ=3;landYaw=.35;landPitch=.50;landDistance=18;walkTo=null;rest=false;setMode('land');msg('이 별에서는 아무것도 하지 않아도 괜찮아요')}
  function space(){walkTo=null;spaceX=0;spaceY=0;spaceZ=94;setMode('space');msg('별 사이를 자유롭게 떠다녀요')}
  function showMissions(){let list=missions().filter(m=>missionWorld(m)===planetIndex);if(!list.length)list=missions();showPanel('이 별의 작은 실천 ('+list.length+')',list.map(m=>({label:safeText(m.emoji||'🌱')+' '+safeText(m.name),action:()=>showMission(m)})))}
  function showMission(m){showPanel(safeText(m.name),[{label:'📷 기존 AI 사진 인증 열기',action:()=>{if(!window.ME?.uid){msg('AI 인증은 로그인 후 이용할 수 있어요');return}try{const arr=typeof MISSIONS!=='undefined'?MISSIONS:[];const found=arr.find(x=>x.id===m.id);if(found&&typeof window.openAI==='function'){close();window.openAI(found,window.ME.uid,null)}else msg('기존 AI 인증 기능을 찾을 수 없어요')}catch(e){console.error(e);msg('인증창 실행에 실패했어요')}}},{label:'🪑 그냥 산책하기',action:()=>{}}])}
  function showFriends(){showPanel('이 별의 친구들',[{label:'🐰 숲에서 만난 토끼에게 인사하기',action:()=>msg('토끼가 살짝 고개를 끄덕여요')},{label:'🦦 물가의 작은 친구를 구경하기',action:()=>msg('조용히 머무는 것만으로도 좋아요')},{label:'👥 다른 실제 회원 보기',action:()=>msg('실시간 회원 만남은 서버 설정 후 연결할 수 있어요')}])}
  function zoomBy(delta){if(mode==='space')spaceZ=clamp(spaceZ+delta,25,180);else if(mode==='approach')approachDistance=clamp(approachDistance+delta*.24,7,27);else landDistance=clamp(landDistance+delta*.30,5,33)}
  function screenRay(px,py){const w=input.clientWidth||1,h=input.clientHeight||1,nx=2*px/w-1,ny=1-2*py/h,tan=Math.tan(62*Math.PI/360),aspect=w/h;return norm(forward.map((v,i)=>v+right[i]*nx*tan*aspect+up[i]*ny*tan))}
  function chooseAt(x,y){if(mode==='space'){cam();let best=null,dmin=65;for(let i=0;i<7;i++){const p=pointProj(locations[i]);if(!p)continue;const dist=Math.hypot(p.x-x,p.y-y);const radius=Math.max(23, p.scale*(i===0?3.8:2.7));if(dist<radius+12&&dist<dmin+radius*.4){best=i;dmin=dist}}if(best!==null)selectWorld(best);else msg('행성을 눌러보거나 행성 찾아보기를 눌러요');return}
    if(mode==='approach')return;
    cam();const ray=screenRay(x,y);if(ray[1]>=-.0005){msg('바닥을 눌러 걸어가 보세요');return}const t=(-1.11-eye[1])/ray[1];if(t<0||t>1200){msg('바닥을 눌러 걸어가 보세요');return}
    const tx=clamp(eye[0]+ray[0]*t,-30,30),tz=clamp(eye[2]+ray[2]*t,-30,30);let mission=null;const arr=missions().filter(m=>missionWorld(m)===planetIndex);for(let i=0;i<arr.length;i++){const sx=(i%2?6:-6)+(Math.floor(i/2)%2?2:0),sz=-16+Math.floor(i/2)*10;if(Math.hypot(tx-sx,tz-sz)<2.4){mission=arr[i];break}}
    walkTo={x:tx,z:tz,mission};rest=false;msg(mission?'미션 장소로 걸어가요':'그곳까지 걸어가요')
  }
  function bindInputs(){
    const km={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
    window.addEventListener('keydown',e=>{if(!active)return;if(/input|textarea/i.test(document.activeElement?.tagName||''))return;const k=km[e.key.length===1?e.key.toLowerCase():e.key];if(k){keys[k]=true;e.preventDefault();e.stopPropagation()}if(e.key==='Escape')close()},true);
    window.addEventListener('keyup',e=>{const k=km[e.key.length===1?e.key.toLowerCase():e.key];if(k){keys[k]=false;if(active)e.preventDefault()}},true);
    window.addEventListener('blur',()=>{keys={up:false,down:false,left:false,right:false};pointer=null});
    root.querySelectorAll('[data-go]').forEach(btn=>{const k=btn.dataset.go;btn.addEventListener('pointerdown',e=>{keys[k]=true;btn.setPointerCapture?.(e.pointerId);e.preventDefault()});for(const t of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(t,()=>keys[k]=false)});
    input.addEventListener('contextmenu',e=>e.preventDefault());
    input.addEventListener('pointerdown',e=>{if(!active)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:0,button:e.button};input.setPointerCapture?.(e.pointerId);e.preventDefault()});
    input.addEventListener('pointermove',e=>{if(!active||!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.lastX,dy=e.clientY-pointer.lastY;pointer.lastX=e.clientX;pointer.lastY=e.clientY;pointer.moved=Math.max(pointer.moved,Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y));if(pointer.moved<4)return;input.classList.add('dragging');if(mode==='space'){spaceX=clamp(spaceX-dx*.12*(spaceZ/85),-85,85);spaceY=clamp(spaceY+dy*.12*(spaceZ/85),-65,65)}else if(mode==='approach'){lookTheta-=dx*.008}else{landYaw-=dx*.009;landPitch=clamp(landPitch+dy*.006,.14,1.26)}e.preventDefault()});
    input.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const was=pointer;pointer=null;input.classList.remove('dragging');if(was.button===0&&was.moved<9)chooseAt(e.clientX-input.getBoundingClientRect().left,e.clientY-input.getBoundingClientRect().top)});
    for(const ev of ['pointercancel','lostpointercapture'])input.addEventListener(ev,()=>{pointer=null;input.classList.remove('dragging')});
    root.addEventListener('wheel',e=>{if(!active||e.target.closest('#pp9-panel'))return;e.preventDefault();zoomBy(Math.sign(e.deltaY)*4)},{passive:false,capture:true});
    el('pp9-plus').onclick=()=>zoomBy(-6);el('pp9-minus').onclick=()=>zoomBy(6);
    let pzoom=null;
    input.addEventListener('touchmove',e=>{if(e.touches.length!==2)return;e.preventDefault();const [a,b]=e.touches,dist=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(pzoom)zoomBy((pzoom-dist)*.065);pzoom=dist},{passive:false});
    input.addEventListener('touchend',e=>{if(e.touches.length<2)pzoom=null});
    el('pp9-close').onclick=close;el('pp9-panel-close').onclick=()=>panel.classList.remove('open');el('pp9-error-close').onclick=close;
    window.addEventListener('resize',resize);
  }
  let sound=null;
  function toggleAudio(){try{if(sound){sound.osc.stop();sound.ctx.close();sound=null;msg('소리를 껐어요');return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC){msg('이 브라우저는 소리를 지원하지 않아요');return}const ctx=new AC(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=174.61;gain.gain.value=.013;osc.connect(gain);gain.connect(ctx.destination);osc.start();sound={ctx,osc};msg('잔잔한 소리를 켰어요')}catch(e){msg('소리를 켤 수 없어요')}}
  function showFailure(){pause();el('pp9-failure').classList.add('open');console.warn('PPOSONG v9: WebGL is not available')}
  function pause(){cancelAnimationFrame(raf);raf=0}
  function open(){if(active)return;root.hidden=false;root.focus({preventScroll:true});el('pp9-failure').classList.remove('open');if(!sceneReady){try{if(!initGL()){software=true;softCtx=glCanvas.getContext('2d');if(!softCtx){showFailure();return}console.info('[뽀송별] WebGL이 없어 간소화된 원근 렌더링을 사용합니다')}bindInputs();sceneReady=true}catch(e){console.error('PPOSONG 3D startup failed',e);showFailure();return}}active=true;previous=0;resize();setMode('space');refreshStats();raf=requestAnimationFrame(render);msg('우주에 오신 걸 환영해요. 천천히 둘러보세요')}
  function close(){pause();active=false;root.hidden=true;panel.classList.remove('open');Object.keys(keys).forEach(k=>keys[k]=false);if(sound){try{sound.osc.stop();sound.ctx.close()}catch(e){}sound=null}}
  const launcher=document.createElement('button');launcher.type='button';launcher.textContent='☁️ 뽀송별 여행하기';launcher.id='pp9-launcher';launcher.className='pp9-btn';Object.assign(launcher.style,{position:'fixed',bottom:'85px',right:'14px',zIndex:'1100'});launcher.onclick=open;document.body.append(launcher);
  const guest=document.createElement('button');guest.id='pp9-guest-login';guest.type='button';guest.textContent='🪐 먼저 우주 둘러보기';guest.className='pp9-btn';guest.onclick=open;const loginBtn=document.getElementById('btnLogin');if(loginBtn)loginBtn.insertAdjacentElement('afterend',guest);
  const p=new URLSearchParams(location.search);let auto=false;
  function tryStart(){if(auto||p.get('classic')==='1'||!document.body.contains(root))return;const app=document.getElementById('app');if(p.get('space')==='1'||p.get('pposongDemo')==='1'){auto=true;open();return}if(window.ME?.uid&&app&&getComputedStyle(app).display!=='none'){auto=true;open()}}
  tryStart();const check=setInterval(()=>{tryStart();if(auto)clearInterval(check)},900);
  window.addEventListener('pagehide',()=>clearInterval(check));
})();
