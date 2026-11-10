/* 뽀송별 자체 3D WebGL 렌더러 — 외부 게임 엔진 CDN 불필요 */
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const rgb=(h)=>{const v=typeof h==='number'?h:parseInt(h.replace('#',''),16);return [(v>>16&255)/255,(v>>8&255)/255,(v&255)/255]};
const vec=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{let d=Math.hypot(...a)||1;return mul(a,1/d)};
const ident=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mm(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function perspective(fov,aspect,near,far){let t=1/Math.tan(fov/2),o=ident();o[0]=t/aspect;o[5]=t;o[10]=(far+near)/(near-far);o[11]=-1;o[14]=2*far*near/(near-far);o[15]=0;return o}
function lookAt(eye,aim){let z=norm(sub(eye,aim)),x=norm(cross([0,1,0],z)),y=cross(z,x),o=ident();o[0]=x[0];o[4]=x[1];o[8]=x[2];o[1]=y[0];o[5]=y[1];o[9]=y[2];o[2]=z[0];o[6]=z[1];o[10]=z[2];o[12]=-dot(x,eye);o[13]=-dot(y,eye);o[14]=-dot(z,eye);return o}
function model(p,s=[1,1,1],yaw=0){let a=ident(),c=Math.cos(yaw),si=Math.sin(yaw);a[0]=c*s[0];a[2]=-si*s[0];a[5]=s[1];a[8]=si*s[2];a[10]=c*s[2];a[12]=p[0];a[13]=p[1];a[14]=p[2];return a}
function uvSphere(){let v=[],n=[],id=[],st=14,seg=20;for(let j=0;j<=st;j++){let phi=j*Math.PI/st;for(let i=0;i<=seg;i++){let a=i*Math.PI*2/seg, nx=Math.sin(phi)*Math.cos(a),ny=Math.cos(phi),nz=Math.sin(phi)*Math.sin(a);v.push(nx,ny,nz);n.push(nx,ny,nz)}}for(let j=0;j<st;j++)for(let i=0;i<seg;i++){let a=j*(seg+1)+i,b=a+seg+1;id.push(a,b,a+1,b,b+1,a+1)}return {v,n,id}}
function box(){let v=[],n=[],id=[];const faces=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]]];faces.forEach(([nn,pts],f)=>{pts.forEach(p=>{v.push(...p.map(x=>x*.5));n.push(...nn)});const a=f*4;id.push(a,a+1,a+2,a,a+2,a+3)});return {v,n,id}}
function cone(){return tube(.05,1,1)}
function cylinder(){return tube(1,1,1)}
function tube(top,bottom,height){const v=[],n=[],id=[],seg=16;for(let i=0;i<=seg;i++){const a=i*Math.PI*2/seg,c=Math.cos(a),s=Math.sin(a), nn=norm([c,(bottom-top)/height,s]);v.push(top*c,height/2,top*s,bottom*c,-height/2,bottom*s);n.push(...nn,...nn)}for(let i=0;i<seg;i++){let a=i*2;id.push(a,a+1,a+2,a+1,a+3,a+2)}return{v,n,id}}
const WORLDS=[
{id:'forest',name:'초록숨별',detail:'이끼 숲, 고사리 길, 깊은 나무 그늘',color:0x6fce9b,sky:0xb5dfd3,land:0x78b58a,flower:0xffd1d9,seed:11},
{id:'ocean',name:'물결퐁별',detail:'분홍 산호와 조개 해변, 잔잔한 푸른 물결',color:0x7ac8e9,sky:0xa8d6e9,land:0xe8d3a9,flower:0xffd6c5,seed:22},
{id:'wind',name:'바람솜별',detail:'구름 언덕과 작은 풍차, 끝없는 풀바람',color:0xc7b6e9,sky:0xc8ceee,land:0xaacb9e,flower:0xfff2d6,seed:33},
{id:'home',name:'반짝집별',detail:'노을빛 집들이 모인 조용한 골목',color:0xf3bda4,sky:0xf3d0c4,land:0xc2cba4,flower:0xffc3a4,seed:44},
{id:'food',name:'소풍식탁별',detail:'곡식밭과 과수원, 넓은 피크닉 들판',color:0xefce8f,sky:0xeedcb6,land:0xb6ca88,flower:0xf8d8a3,seed:55},
{id:'sharing',name:'나눔마을별',detail:'빛나는 광장과 꽃가게, 이웃의 골목',color:0xbac5ee,sky:0xd5d8ee,land:0xa8c5b6,flower:0xd8b9ed,seed:66},
{id:'quiet',name:'별빛산책별',detail:'별무리, 반짝이는 결정과 자정의 호숫길',color:0x91b5d9,sky:0x506c96,land:0x7297a4,flower:0xafd9fb,seed:77}
];
const CHUNK=48;
const fract=n=>n-Math.floor(n);
const hash=(x,z,k=0)=>fract(Math.sin(x*127.1+z*311.7+k*74.7)*43758.5453123);
const smooth=n=>n*n*(3-2*n);
const interpNoise=(x,z,seed)=>{const X=Math.floor(x),Z=Math.floor(z),a=smooth(fract(x)),b=smooth(fract(z));const h=(u,v)=>hash(u,v,seed);return (h(X,Z)*(1-a)+h(X+1,Z)*a)*(1-b)+(h(X,Z+1)*(1-a)+h(X+1,Z+1)*a)*b};
export function landscapeHeight(x,z,worldId='forest'){
 const w=WORLDS.find(v=>v.id===worldId)||WORLDS[0],r=Math.hypot(x,z);
 const broad=(interpNoise(x/54,z/54,w.seed)-.5)*6.3;
 const rolling=(interpNoise(x/18,z/18,w.seed+3)-.5)*1.5;
 const flatten=smooth(clamp((r-13)/28,0,1));
 let height=(broad+rolling)*flatten;
 if(worldId==='wind')height*=1.7;
 if(worldId==='quiet')height*=1.3;
 if(worldId==='ocean')height-=Math.max(0,(-z-28)/18)*2.7;
 return Math.max(-5,Math.min(11,height));
}
export function terrainChunkKey(x,z){return `${Math.floor(x/CHUNK)},${Math.floor(z/CHUNK)}`}
function terrainGeo(cx,cz,w){const v=[],n=[],id=[],seg=12,step=CHUNK/seg,baseX=cx*CHUNK,baseZ=cz*CHUNK;
 for(let j=0;j<=seg;j++)for(let i=0;i<=seg;i++){let x=baseX+i*step,z=baseZ+j*step,y=landscapeHeight(x,z,w.id);v.push(i*step,y,j*step);
 const hx=(landscapeHeight(x+.75,z,w.id)-landscapeHeight(x-.75,z,w.id))/1.5;
 const hz=(landscapeHeight(x,z+.75,w.id)-landscapeHeight(x,z-.75,w.id))/1.5;
 n.push(...norm([-hx,1,-hz]));}
 for(let j=0;j<seg;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+seg+1;id.push(a,b,a+1,b,b+1,a+1)}
 return {v,n,id};
}
function colorMix(a,b,t){t=clamp(t,0,1);return Math.round((a>>16&255)*(1-t)+(b>>16&255)*t)<<16|Math.round((a>>8&255)*(1-t)+(b>>8&255)*t)<<8|Math.round((a&255)*(1-t)+(b&255)*t)}
import {MISSIONS} from './missions.js';
export {WORLDS};
export class WorldEngine {
 constructor(canvas,callbacks={}){this.canvas=canvas;this.cb=callbacks;this.ctx=null;this.gl=null;this.objects=[];this.stations=[];this.planets=[];this.mode='orbit';this.selected=0;this.yaw=.35;this.pitch=.25;this.distance=39;this.avatar={x:0,z:1,angle:0,sit:false};this.destination=null;this.down=null;this.inputs=new Set();this.now=0;this.frame=0;this.suspended=false;this.world=WORLDS[0];this.fps=0;this.last=0;this.pointerCaptured=false;this.walkVelocity=[0,0];this.cameraFocus=null;this.heal=0;this.visitors=[];this.fallbackPlanets=[];this.chunks=new Map();this.chunkCenter='';this.nearStation=null;this.collectedKeys=new Set();this.homeDecor=[];this.init();}
 init(){const gl=this.canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:false})||this.canvas.getContext('experimental-webgl');if(!gl){this.ctx=this.canvas.getContext('2d');this.cb.onStatus?.('이 기기는 WebGL을 사용할 수 없어 단순 화면으로 보여요');this.bind();this.setOrbit();this.loop();return;}this.gl=gl;const vs=`attribute vec3 aP;attribute vec3 aN;uniform mat4 uP,uV,uM;varying vec3 vN;varying float vD;void main(){vec4 v=uV*uM*vec4(aP,1.0);vN=mat3(uM)*aN;vD=length(v.xyz);gl_Position=uP*v;}`;const fs=`precision mediump float;uniform vec3 uC,uFog;uniform float uDensity;varying vec3 vN;varying float vD;void main(){float l=.49+max(dot(normalize(vN),normalize(vec3(-.35,.84,.45))),0.0)*.52;vec3 col=uC*l;float fog=exp(-pow(vD*uDensity,2.0));gl_FragColor=vec4(mix(uFog,col,clamp(fog,0.0,1.0)),1.0);}`;const program=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){let sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(program,sh)}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);this.p=program;this.loc={p:gl.getUniformLocation(program,'uP'),v:gl.getUniformLocation(program,'uV'),m:gl.getUniformLocation(program,'uM'),c:gl.getUniformLocation(program,'uC'),fog:gl.getUniformLocation(program,'uFog'),density:gl.getUniformLocation(program,'uDensity'),aP:gl.getAttribLocation(program,'aP'),aN:gl.getAttribLocation(program,'aN')};this.geos={sphere:this.makeGeo(uvSphere()),box:this.makeGeo(box()),cone:this.makeGeo(cone()),cylinder:this.makeGeo(cylinder())};gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);this.bind();this.setOrbit();this.loop()}
 makeGeo(g){const gl=this.gl,ret={};for(let [key,content] of [['v',g.v],['n',g.n]]){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(content),gl.STATIC_DRAW);ret[key]=b}ret.id=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ret.id);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(g.id),gl.STATIC_DRAW);ret.count=g.id.length;return ret}
 disposeGeo(g){if(!g||!this.gl)return;for(const b of [g.v,g.n,g.id])if(b)this.gl.deleteBuffer(b)}
 clearChunks(){for(const ch of this.chunks.values())if(ch.geo)this.disposeGeo(ch.geo);this.chunks.clear();this.chunkCenter=''}
 add(shape,pos,size,color,extra={}){const obj={shape,pos:[...pos],size:[...size],color,...extra};this.objects.push(obj);return obj}
 addSphere(pos,size,color,o={}){return this.add('sphere',pos,[size,size,size],color,o)}
 setOrbit(){this.clearChunks();this.mode='orbit';this.objects=[];this.stations=[];this.planets=[];this.distance=46;this.yaw=.3;this.pitch=.22;for(let i=0;i<7;i++){let t=i*6.283185/7,r=15+(i%3)*3,p=[Math.sin(t)*r,(i%3-1)*2.8,Math.cos(t)*r];let o=this.addSphere(p,2.35+(i%2)*.22,WORLDS[i].color,{planet:i});this.planets.push(o);for(let c=0;c<8;c++){let a=c*2.399,r=.35+c*.1;this.addSphere([p[0]+Math.sin(a)*r,p[1]+Math.cos(a*.7)*r*.5,p[2]+Math.cos(a)*r],.18+(c%3)*.09,i%3===0?0x4e9d7c:0xebefdb)}}this.cb.onMode?.('orbit',null);}
 approach(i){this.selected=i;this.mode='approach';this.distance=9;this.cb.onMode?.('approach',WORLDS[i]);}
 land(i=this.selected){
  this.collectedKeys??=new Set();this.homeDecor??=[];this.clearChunks();this.selected=i;this.world=WORLDS[i];this.mode='land';this.distance=19;this.yaw=.3;this.pitch=.20;
  this.avatar={x:0,z:7,angle:0,sit:false};this.walkVelocity=[0,0];this.cameraFocus=[0,7];this.destination=null;this.objects=[];this.stations=[];this.visitors=[];this.nearStation=null;
  this.streamChunks(true);this.placeFacilities();this.buildAvatar();this.setHomeDecor(this.homeDecor);
  this.earthObj=this.addSphere([44,38,-110],7,0x6ab9c8,{distantEarth:true});this.setHealing(this.heal);
  this.cb.onMode?.('land',this.world);
 }
 ground(x,z){return landscapeHeight(x,z,this.world.id)}
 spawn(kind,x,z,scale,seed){
  const y=this.ground(x,z),w=this.world.id,scene=this.world;
  const add=(shape,offset,size,color,extra={})=>this.add(shape,[x+offset[0],y+offset[1],z+offset[2]],size,color,extra);
  if(kind==='tree'){
   add('cylinder',[0,.9*scale,0],[.26*scale,1.8*scale,.26*scale],0x987e6b);
   const evergreen=w==='forest'||w==='wind',leaf=evergreen?[0x4e9b79,0x79b59a,0x9dcb9d][seed%3]:[0xc49c96,0xe4b6ae,0xebc69d][seed%3];
   if(evergreen){add('cone',[0,2.25*scale,0],[1.22*scale,2.2*scale,1.22*scale],leaf);add('cone',[0,3.05*scale,0],[.94*scale,1.55*scale,.94*scale],colorMix(leaf,0xc8e5cb,.2));}
   else {add('sphere',[0,2.05*scale,0],[1.2*scale,1.02*scale,1.0*scale],leaf);add('sphere',[.53*scale,2.4*scale,-.1*scale],[.68*scale,.6*scale,.66*scale],0xf0d6bf)}
  }else if(kind==='flower'){
   add('cylinder',[0,.28,0],[.055,.56,.055],0x6da777);add('sphere',[0,.64,0],[.21,.19,.21],seed%3?scene.flower:0xfff9e2);
   add('sphere',[-.21,.63,0],[.14,.14,.15],scene.flower);add('sphere',[.21,.63,0],[.14,.14,.15],scene.flower);
  }else if(kind==='stone'){
   add('sphere',[0,.32*scale,0],[.8*scale,.55*scale,.73*scale],w==='quiet'?0x9daed6:w==='ocean'?0xe9ddc5:0xaab6ab);
   if(w==='quiet')add('cone',[.1,1.05*scale,0],[.4*scale,.95*scale,.4*scale],0xadddf4);
  }else if(kind==='coral'){
   add('cylinder',[0,.47,0],[.16,.94,.16],0xd9a1a4);for(const v of [[-.3,.84,.08],[.3,1.12,0],[0,1.39,-.22]])add('sphere',v,[.35,.33,.3],seed%2?0xf4ad9a:0xebc5be);
  }else if(kind==='windmill'){
   add('cylinder',[0,2.1,0],[.38,4.2,.38],0xf0eee2);add('cone',[0,4.55,0],[.85,.92,.85],0x9f92bb);
   for(const [sx,sy] of [[0,1.4],[0,-1.4],[1.4,0],[-1.4,0]])add('box',[sx,3.55+sy,.55],[sx?2.25:.3,sy?2.25:.3,.18],0xf8f3ea);
   add('sphere',[0,3.55,.6],[.24,.24,.24],0xbab0d2);
  }else if(kind==='lantern'){
   add('cylinder',[0,1.3,0],[.12,2.6,.12],w==='quiet'?0x6c8099:0x97857b);
   add('sphere',[0,2.75,0],[.37,.38,.37],w==='quiet'?0xc0deff:0xffedb9);add('cone',[0,3.18,0],[.55,.45,.55],0xa799a0);
  }else if(kind==='crop'){
   add('box',[0,.08,0],[2.0,.2,1.3],0x907b60);
   for(let k=-1;k<=1;k++)add('sphere',[k*.48,.41,0],[.37,.34,.33],seed%2?0xa4c779:0xd6a06e);
  }else if(kind==='cottage'){
   add('box',[0,1.6,0],[3.4,3,3.1],0xf0e5d5);add('cone',[0,3.65,0],[2.65,1.75,2.65],seed%2?0xba929c:0x9baacb);
   add('box',[0,.85,1.60],[.84,1.7,.13],0xa28780);add('box',[-1.05,2.15,1.6],[.68,.7,.14],0xf8dba2);
  }else if(kind==='cloud'){
   for(const [px,py,pz,s] of [[0,0,0,1],[1,.15,0,.85],[-.95,.08,.25,.7]])add('sphere',[px*scale,5*scale+py*scale,pz*scale],[s*scale,s*.63*scale,s*.8*scale],0xfaf2fb);
  }else if(kind==='stargem'){
   add('cone',[0,.75,0],[.6,1.55,.6],0x9fcff1);add('cone',[0,1.86,0],[.28,.77,.28],0xddeefb);
  }else if(kind==='table'){
   add('box',[0,.85,0],[2.4,.19,1.5],0xe7cead);for(const ix of [-.9,.9])add('cylinder',[ix,.43,0],[.09,.86,.09],0x96755f);
   for(let j=0;j<3;j++)add('sphere',[j*.5-.5,1.16,0],[.28,.29,.28],j===1?0xefc974:0xee9989);
  }
 }
 chunkColor(cx,cz){let w=this.world,n=hash(cx,cz,w.seed),base=w.land;
  if(w.id==='forest')return colorMix(base,n>.47?0x4f987b:0xadd59a,.28);
  if(w.id==='ocean')return cz< -1?colorMix(0x73b8d1,0x9ad5dd,n*.42):colorMix(base,n>.47?0xece1bc:0xd7c6a8,.2);
  if(w.id==='wind')return colorMix(base,0xd6d5bf,.1+n*.21);
  if(w.id==='home')return colorMix(base,0xc7bca7,n*.17);
  if(w.id==='food')return colorMix(base,0xd8cb93,n*.34);
  if(w.id==='sharing')return colorMix(base,0xb9c2d1,n*.22);
  return colorMix(base,0x7597be,.16+n*.3);
 }
 makeChunk(cx,cz,cx0,cz0){
  const key=`${cx},${cz}`,w=this.world,baseX=cx*CHUNK,baseZ=cz*CHUNK,geo=this.gl?this.makeGeo(terrainGeo(cx,cz,w)):null;
  const obj=this.add('terrain',[baseX,0,baseZ],[1,1,1],this.chunkColor(cx,cz),{chunkKey:key,geo});
  this.chunks.set(key,{geo,obj});
  const close=Math.abs(cx-cx0)<=1&&Math.abs(cz-cz0)<=1;
  const count=close?9:2;
  for(let k=0;k<count;k++){
   const rx=hash(cx*31+k*7,cz*43+k*13,w.seed),rz=hash(cx*19+k*17,cz*37-k*11,w.seed),x=baseX+rx*CHUNK,z=baseZ+rz*CHUNK;
   if(Math.hypot(x,z)<13||Math.abs(x)<2.4&&Math.abs(z)<80||this.stations.some(s=>Math.hypot(x-s.x,z-s.z)<3.4))continue;
   const t=hash(cx*71+k*3,cz*59+k*5,w.seed+8),size=.6+hash(cx*23+k*2,cz*17+k*3,w.seed)*.65;
   const kind=w.id==='forest'?(t<.46?'tree':t<.75?'flower':'stone'):
      w.id==='ocean'?(t<.39?'coral':t<.7?'stone':'flower'):
      w.id==='wind'?(t<.16?'windmill':t<.53?'flower':t<.84?'tree':'cloud'):
      w.id==='home'?(t<.2?'cottage':t<.55?'lantern':t<.83?'tree':'flower'):
      w.id==='food'?(t<.3?'crop':t<.61?'tree':t<.86?'flower':'table'):
      w.id==='sharing'?(t<.28?'cottage':t<.59?'flower':t<.83?'lantern':'tree'):
      (t<.33?'stargem':t<.68?'lantern':t<.85?'stone':'flower');
   const before=this.objects.length;this.spawn(kind,x,z,size,k+Math.floor(t*100));for(let q=before;q<this.objects.length;q++)this.objects[q].chunkKey=key;
  }
  // 각 구역의 고정 좌표에 반짝이는 수집품을 한 개 배치해요.
  // 구역을 재방문해도 같은 수집품이 재생성되며, 주운 경우 숨겨집니다.
  if((Math.abs(cx)+Math.abs(cz))%2===0){
   const seed=hash(cx*61+13,cz*73-7,w.seed+101),x=baseX+(0.18+seed*.62)*CHUNK,z=baseZ+(0.2+hash(cx*43,cz*19,w.seed)*.6)*CHUNK;
   const collectKey=`${w.id}:${cx}:${cz}`;
   if(Math.hypot(x,z)>13&&!this.collectedKeys.has(collectKey)){
    const y=this.ground(x,z),c=[0xf6d5a4,0xc1e8df,0xd7d2fa][Math.abs(cx*3+cz)%3];
    const sparkle=this.addSphere([x,y+.55,z],.36,c,{chunkKey:key,collectKey});
    this.add('cone',[x,y+.17,z],[.32,.43,.32],0xe9fff0,{chunkKey:key,collectKey});
    this.stations.push({i:collectKey,x,z,kind:'collect',collectKey,collectType:w.id});
   }
  }
 }
 streamChunks(force=false){
  if(this.mode!=='land')return;const ccx=Math.floor(this.avatar.x/CHUNK),ccz=Math.floor(this.avatar.z/CHUNK),center=`${ccx},${ccz}`;
  if(!force&&this.chunkCenter===center)return;this.chunkCenter=center;
  const wanted=new Set();for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){wanted.add(`${ccx+dx},${ccz+dz}`)}
  for(const [key,ch] of this.chunks){if(wanted.has(key))continue;this.disposeGeo(ch.geo);this.chunks.delete(key)}
  this.objects=this.objects.filter(o=>!o.chunkKey||wanted.has(o.chunkKey));
  this.stations=this.stations.filter(st=>st.kind!=='collect'||wanted.has(st.collectKey.split(':').slice(1).join(',')));
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=ccx+dx,z=ccz+dz,key=`${x},${z}`;if(!this.chunks.has(key))this.makeChunk(x,z,ccx,ccz)}
 }
 placeFacilities(){
  const missions=MISSIONS.filter(m=>m.planet===this.world.id);
  missions.forEach((m,i)=>{const angle=i*2.399+1.2,r=17+(i%3)*10+(i>5?12:0),x=Math.sin(angle)*r,z=Math.cos(angle)*r;
   this.addStation(i,[x,z],m);
  });
  const worldIndex=this.selected;
  const scenicKinds=['tree','coral','windmill','cottage','table','cottage','stargem'];
  const scenicPos=[[9,7],[-12,8],[11,-3],[-11,-6],[12,11],[-10,10],[13,-8]];
  const [px,pz]=scenicPos[worldIndex];this.spawn(scenicKinds[worldIndex],px,pz,1.7,worldIndex*7);
  this.buildBench(4,4);this.buildBench(-6,8);
  const recordAt=[-11,-12],shopAt=[12,-11];this.addStation(90,recordAt,null,'record');this.addStation(91,shopAt,null,'shop');
 }
 buildBench(x,z){const y=this.ground(x,z);for(let q of [-1,1])this.add('box',[x+q*.8,y+.42,z],[.13,.8,.2],0x8b7868);this.add('box',[x,y+.87,z],[2,.18,.65],0xb68969);this.add('box',[x,y+1.3,z-.28],[2,.55,.16],0xb68969)}
 addStation(i,[x,z],mission=null,kind='mission'){
  const y=this.ground(x,z),s={i,x,z,kind,missionId:mission?.id||null,missionName:mission?.name||null};this.stations.push(s);
  const color=kind==='record'?0x9bbaea:kind==='shop'?0xe9b9d7:0xf4d4a2;
  this.add('cylinder',[x,y+.25,z],[.91,.5,.91],0xd6c8b9);
  this.add('cylinder',[x,y+1.22,z],[.17,1.9,.17],0xa78f82);
  this.addSphere([x,y+2.27,z],.47,color);
  this.add('cone',[x,y+2.84,z],[.4,.5,.4],0xfff5d6);
 }
 buildAvatar(){this.rabbit=[];const add=(shape,offset,size,color)=>this.rabbit.push(this.add(shape,[0,0,0],size,color,{rabbitOffset:offset}));add('sphere',[0,1,0],[.64,.68,.58],0xf4eadf);add('sphere',[0,.4,0],[.46,.5,.45],0xf1e7db);add('sphere',[-.26,1.87,-.05],[.22,.54,.2],0xf4eadf);add('sphere',[.26,1.87,-.05],[.22,.54,.2],0xf4eadf);add('sphere',[-.26,1.89,.15],[.125,.39,.075],0xeab9c7);add('sphere',[.26,1.89,.15],[.125,.39,.075],0xeab9c7);for(let x of [-.24,.24]){add('sphere',[x,1.08,.49],[.085,.11,.06],0x302c39);add('sphere',[x*.9,.30,.34],[.18,.18,.2],0xd9cbb9)}add('sphere',[0,.89,.58],[.12,.095,.065],0xe9abc0);add('sphere',[-.47,.56,.1],[.19,.32,.18],0xf4eadf);add('sphere',[.47,.56,.1],[.19,.32,.18],0xf4eadf);}
 collectNearby(key){
  const s=this.stations.find(x=>x.kind==='collect'&&x.collectKey===key);
  if(!s)return false;
  if(Math.hypot(s.x-this.avatar.x,s.z-this.avatar.z)>3.1)return false;
  this.collectedKeys.add(key);
  this.stations=this.stations.filter(x=>x!==s);
  this.objects=this.objects.filter(o=>o.collectKey!==key);
  this.nearStation=null;this.cb.onNearby?.(null);
  return true;
 }
 setCollectedKeys(keys){this.collectedKeys=new Set(keys||[]);this.objects=this.objects.filter(o=>!o.collectKey||!this.collectedKeys.has(o.collectKey));this.stations=this.stations.filter(st=>st.kind!=='collect'||!this.collectedKeys.has(st.collectKey));}
 setHomeDecor(items=[]){
  this.homeDecor=[...items];this.objects=this.objects.filter(o=>!o.homeDecor);
  if(this.mode!=='land')return;
  const x0=-8,z0=10;
  items.slice(0,6).forEach((id,i)=>{
   const x=x0+(i%3)*2.8,z=z0+Math.floor(i/3)*3.0,y=this.ground(x,z);
   const add=(shape,pos,size,color)=>this.add(shape,pos,size,color,{homeDecor:true});
   if(id.includes('mat')){add('box',[x,y+.08,z],[1.7,.15,1.5],0xe8b5a8);add('box',[x,y+.25,z-.3],[1.5,.15,.36],0xffe8c9)}
   else if(id.includes('lamp')){add('cylinder',[x,y+.65,z],[.14,1.3,.14],0x8b7768);add('sphere',[x,y+1.48,z],[.4,.4,.4],0xf8e8b4)}
   else if(id.includes('chair')){add('box',[x,y+.6,z],[1.4,.22,1.1],0xb58d73);add('box',[x,y+1,z-.5],[1.4,.95,.18],0xc79e82)}
   else {add('cylinder',[x,y+.26,z],[.67,.52,.67],0xc99e8a);add('sphere',[x,y+.93,z],[.63,.65,.63],id.includes('sea')?0x85c7d7:0x88c6a0)}
  });
 }
 setHealing(n){this.heal=Math.max(0,Number(n)||0);if(this.earthObj){const green=Math.min(1,this.heal/125);this.earthObj.color=green>.75?0x6ee1ab:green>.32?0x72c8bb:0x759fae}}
 setVisitors(people){
  this.objects=this.objects.filter(o=>!o.visitor);this.visitors=people||[];
  const palette=[0xd7b7a6,0xb6cebb,0xd2c1e8,0xf1c9ad,0xc4d8e1,0xead6bd];
  this.visitors.slice(0,12).forEach((p,i)=>{const x=clamp(Number(p.x)||0,-100000,100000),z=clamp(Number(p.z)||0,-100000,100000),c=palette[i%palette.length],ground=this.ground(x,z);
   for(const [shape,px,py,pz,sx,sy,sz,color] of [['sphere',0,1,0,.64,.68,.58,c],['sphere',0,.41,0,.46,.49,.45,c],['sphere',-.26,1.84,0,.2,.49,.18,c],['sphere',.26,1.84,0,.2,.49,.18,c],['sphere',-.23,1.10,.5,.075,.085,.07,0x263b47],['sphere',.23,1.10,.5,.075,.085,.07,0x263b47]]){
    this.add(shape,[x+px,py+ground,z+pz],[sx,sy,sz],color,{visitor:true})}
  });
 }
 getPlanetPosition(i){return this.planets[i]?.pos||[0,0,0]}
 camera(){let aim,eye;if(this.mode==='orbit'){aim=[0,0,0];eye=[Math.sin(this.yaw)*this.distance,Math.sin(this.pitch)*this.distance*.78,Math.cos(this.yaw)*this.distance];}else if(this.mode==='approach'){aim=this.getPlanetPosition(this.selected);eye=[aim[0]+Math.sin(this.yaw)*this.distance,aim[1]+Math.sin(this.pitch)*this.distance*.65,aim[2]+Math.cos(this.yaw)*this.distance]}else{const focus=this.cameraFocus||[this.avatar.x,this.avatar.z];aim=[focus[0],this.ground(focus[0],focus[1])+1.0,focus[1]];eye=[aim[0]+Math.sin(this.yaw)*this.distance,aim[1]+4.2+Math.sin(this.pitch)*this.distance*.65,aim[2]+Math.cos(this.yaw)*this.distance]};return {aim,eye}}
 project(pos){const c=this.camera(),p=perspective(Math.PI/3,this.w/this.h,.1,600),v=lookAt(c.eye,c.aim),m=mm(p,v),x=pos[0],y=pos[1],z=pos[2],w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.1)return null;return {x:(m[0]*x+m[4]*y+m[8]*z+m[12])/w*this.w/2+this.w/2,y:(1-(m[1]*x+m[5]*y+m[9]*z+m[13])/w)*this.h/2,w}}
 hitGround(x,y){const c=this.camera(),f=norm(sub(c.aim,c.eye)),r=norm(cross(f,[0,1,0])),u=norm(cross(r,f)),ndcX=x/this.w*2-1,ndcY=1-y/this.h*2,tan=Math.tan(Math.PI/6),ray=norm(vec(f,vec(mul(r,ndcX*this.w/this.h*tan),mul(u,ndcY*tan))));
 if(ray[1]>=-.001)return null;let t=-c.eye[1]/ray[1];for(let k=0;k<6;k++){let px=c.eye[0]+ray[0]*t,pz=c.eye[2]+ray[2]*t,h=this.ground(px,pz);t=(h-c.eye[1])/ray[1]}
 if(t<0||t>230)return null;return{x:c.eye[0]+ray[0]*t,z:c.eye[2]+ray[2]*t}}
 chooseAt(x,y){if(this.mode==='orbit'){if(this.ctx&&this.fallbackPlanets.length){const hit=this.fallbackPlanets.find(p=>Math.hypot(p.x-x,p.y-y)<p.r+21);if(hit){this.approach(hit.i);return}}let hits=this.planets.map((p,i)=>({i,screen:this.project(p.pos)})).filter(p=>p.screen);hits.sort((a,b)=>Math.hypot(a.screen.x-x,a.screen.y-y)-Math.hypot(b.screen.x-x,b.screen.y-y));if(hits[0]&&Math.hypot(hits[0].screen.x-x,hits[0].screen.y-y)<Math.max(48,160/hits[0].screen.w)){this.approach(hits[0].i);return}this.cb.onStatus?.('행성을 누르면 가까이 다가갈 수 있어요');}else if(this.mode==='land'){const ground=this.hitGround(x,y);if(ground){this.destination=ground;this.avatar.sit=false;this.cb.onStatus?.('천천히 걸어가는 중…');}}}
 bind(){const el=this.canvas;el.style.touchAction='none';el.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;el.setPointerCapture(e.pointerId);this.down={x:e.clientX,y:e.clientY,yaw:this.yaw,pitch:this.pitch,drag:false};});el.addEventListener('pointermove',e=>{if(!this.down)return;const d=this.down,dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>7)d.drag=true;if(d.drag){this.yaw=d.yaw-dx*.006;this.pitch=clamp(d.pitch+dy*.004,-.08,.92)}});el.addEventListener('pointerup',e=>{if(!this.down)return;const d=this.down;this.down=null;if(!d.drag){const b=el.getBoundingClientRect();this.chooseAt((e.clientX-b.left)*(this.w/b.width),(e.clientY-b.top)*(this.h/b.height))}});el.addEventListener('pointercancel',()=>this.down=null);el.addEventListener('contextmenu',e=>e.preventDefault());el.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.sign(e.deltaY))},{passive:false});window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){this.inputs.add(k);e.preventDefault()}},true);window.addEventListener('keyup',e=>this.inputs.delete(e.key.toLowerCase()),true);window.addEventListener('blur',()=>this.inputs.clear());}
 zoom(dir){this.distance=clamp(this.distance+dir*(this.mode==='land'?1.1:3),this.mode==='orbit'?12:this.mode==='approach'?5:5,this.mode==='land'?22:90)}
 move(dx,dz){this.inputs.clear();this.destination=null;const length=Math.hypot(dx,dz);if(length>0){const speed=1.05;this.avatar.x+=dx/length*speed;this.avatar.z+=dz/length*speed;this.streamChunks();this.avatar.angle=Math.atan2(dx,dz);this.avatar.sit=false;this.checkStation()}}
 checkStation(){const s=this.stations.find(s=>Math.hypot(s.x-this.avatar.x,s.z-this.avatar.z)<(s.kind==='collect'?2.8:2.2));if(s&&(this.nearStation!==s.i)){this.nearStation=s.i;this.cb.onNearby?.(s)}if(!s&&this.nearStation!=null){this.nearStation=null;this.cb.onNearby?.(null)}}
 sit(){if(this.mode==='land'){this.avatar.sit=!this.avatar.sit;this.destination=null;this.walkVelocity=[0,0];this.cb.onStatus?.(this.avatar.sit?'잠시 쉬어 가요.':'다시 산책해요.')}}
 update(dt){
  this.now+=dt;
  if(this.mode==='orbit')for(const p of this.planets)p.spin=(p.spin||0)+dt*.055;
  if(this.mode!=='land')return;
  const a=this.avatar;
  let dx=0,dz=0;
  const f=[-Math.sin(this.yaw),-Math.cos(this.yaw)],r=[Math.cos(this.yaw),-Math.sin(this.yaw)];
  if(this.inputs.has('w')||this.inputs.has('arrowup')){dx+=f[0];dz+=f[1]}
  if(this.inputs.has('s')||this.inputs.has('arrowdown')){dx-=f[0];dz-=f[1]}
  if(this.inputs.has('d')||this.inputs.has('arrowright')){dx+=r[0];dz+=r[1]}
  if(this.inputs.has('a')||this.inputs.has('arrowleft')){dx-=r[0];dz-=r[1]}
  const keyMove=Math.hypot(dx,dz)>0;
  if(this.destination&&!keyMove){dx=this.destination.x-a.x;dz=this.destination.z-a.z;
    if(Math.hypot(dx,dz)<.24){this.destination=null;dx=dz=0}}
  const n=Math.hypot(dx,dz),speed=this.inputs.has('shift')?3.0:1.95;
  const target=n?[dx/n*speed,dz/n*speed]:[0,0];
  // 자연스럽게 출발하지만 키를 떼면 미끄러지지 않도록 감속을 더 빠르게
  const easing=1-Math.exp(-dt*(n?4.8:8.5));
  this.walkVelocity[0]+=(target[0]-this.walkVelocity[0])*easing;
  this.walkVelocity[1]+=(target[1]-this.walkVelocity[1])*easing;
  if(Math.hypot(...this.walkVelocity)<.015){this.walkVelocity=[0,0]}
  const moving=Math.hypot(...this.walkVelocity)>.03;
  if(moving){a.x+=this.walkVelocity[0]*dt;a.z+=this.walkVelocity[1]*dt;
    this.streamChunks();
    // 부드럽게 진행 방향을 바라보기: -π ~ π 경계에서 역회전 방지
    const desired=Math.atan2(this.walkVelocity[0],this.walkVelocity[1]);
    const difference=Math.atan2(Math.sin(desired-a.angle),Math.cos(desired-a.angle));
    a.angle+=difference*(1-Math.exp(-dt*9));
    a.sit=false;this.checkStation();}
  else if(this.destination)this.checkStation();
  // 카메라는 캐릭터를 부드럽게 따라가며 지평선의 여유를 살려요.
  if(!this.cameraFocus)this.cameraFocus=[a.x,a.z];
  const follow=1-Math.exp(-dt*2.4);
  this.cameraFocus[0]+=(a.x-this.cameraFocus[0])*follow;
  this.cameraFocus[1]+=(a.z-this.cameraFocus[1])*follow;
  const bob=moving?Math.sin(this.now*6.2)*.032:Math.sin(this.now*.95)*.008;
  for(const m of this.rabbit||[]){const q=m.rabbitOffset;
    const ca=Math.cos(a.angle),sa=Math.sin(a.angle);
    m.pos[0]=a.x+q[0]*ca+q[2]*sa;
    m.pos[1]=this.ground(a.x,a.z)+q[1]+bob-(a.sit?.3:0);
    m.pos[2]=a.z-q[0]*sa+q[2]*ca;
    m.spin=a.angle}
  if(this.earthObj){this.earthObj.pos[0]=a.x+44;
    this.earthObj.pos[1]=this.ground(a.x,a.z)+38;
    this.earthObj.pos[2]=a.z-110;}
  this.cb.onPosition?.(a);
 }
 resize(){const {width,height}=this.canvas.getBoundingClientRect(),scale=Math.min(window.devicePixelRatio||1,2);this.w=Math.max(1,Math.round(width*scale));this.h=Math.max(1,Math.round(height*scale));if(this.canvas.width!==this.w||this.canvas.height!==this.h){this.canvas.width=this.w;this.canvas.height=this.h}if(this.gl)this.gl.viewport(0,0,this.w,this.h)}
 render(){this.resize();const gl=this.gl;if(!gl){this.drawFallback();return}let fogHex=this.mode==='land'?this.world.sky:0x070f26;const fog=rgb(fogHex);gl.clearColor(...fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const c=this.camera(),proj=perspective(Math.PI/3,this.w/this.h,.1,600),view=lookAt(c.eye,c.aim);gl.useProgram(this.p);gl.uniformMatrix4fv(this.loc.p,false,proj);gl.uniformMatrix4fv(this.loc.v,false,view);gl.uniform3fv(this.loc.fog,fog);gl.uniform1f(this.loc.density,this.mode==='land'?.007:0);for(const o of this.objects){if(o.distantEarth)gl.uniform1f(this.loc.density,0);else gl.uniform1f(this.loc.density,this.mode==='land'?.007:0);const g=o.geo||this.geos[o.shape];if(!g)continue;gl.uniformMatrix4fv(this.loc.m,false,model(o.pos,o.size,o.spin||0));gl.uniform3fv(this.loc.c,rgb(o.color));gl.bindBuffer(gl.ARRAY_BUFFER,g.v);gl.enableVertexAttribArray(this.loc.aP);gl.vertexAttribPointer(this.loc.aP,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,g.n);gl.enableVertexAttribArray(this.loc.aN);gl.vertexAttribPointer(this.loc.aN,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.id);gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_SHORT,0)}}
 drawFallback(){
  const c=this.ctx,w=this.w,h=this.h,PI=Math.PI;const round=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,PI*2);c.fill()};
  c.fillStyle=this.mode==='land'?'#bcdedb':'#08122c';c.fillRect(0,0,w,h);this.fallbackPlanets=[];
  if(this.mode!=='land'){
    const centers=this.mode==='approach'?[this.selected]:[0,1,2,3,4,5,6];
    centers.forEach(i=>{const a=i*PI*2/7,zoom=this.mode==='approach'?3:1;
      const x=w/2+Math.sin(a+this.yaw*.16)*w*.27*(this.mode==='orbit'?1:0),y=h/2+Math.cos(a)*h*.28*(this.mode==='orbit'?1:0);
      const r=(Math.min(w,h)*.038+((i%3)*3)) *zoom * (this.mode==='orbit'?clamp(46/this.distance,.5,2):1);
      c.save();c.shadowColor='#b7f4fc';c.shadowBlur=30;const g=c.createRadialGradient(x-r*.42,y-r*.4,r*.02,x,y,r);const t=['#a8dfbe','#a1dced','#c6b5ee','#f7c2b0','#f7d794','#bec8ed','#9fb6d5'][i];g.addColorStop(0,'#f2fcff');g.addColorStop(.45,t);g.addColorStop(1,'#41677b');round(x,y,r,g);c.restore();
      c.save();c.beginPath();c.arc(x,y,r,0,2*PI);c.clip();for(let j=0;j<6;j++){const ca=j*2.399,x2=x+Math.sin(ca)*r*.7,y2=y+Math.cos(ca)*r*.55;round(x2,y2,r*(.07+(j%3)*.04),'#6b9c8d8a')}c.restore();
      this.fallbackPlanets.push({x,y,r,i});
      c.fillStyle='#f0faffd9';c.textAlign='center';c.font=`600 ${Math.max(12,Math.round(w*.013))}px system-ui`;c.fillText(WORLDS[i].name,x,y+r+26);
    });
    return;
  }
  const pal={forest:['#a1d0c8','#d8eee0','#7db99f','#5c9e82'],ocean:['#83c4df','#c9e9e3','#a8d8d5','#decf9d'],wind:['#b4b7e3','#e1dff0','#b9cba8','#9faf9d'],home:['#ddb2b8','#f5ded6','#d6c2a5','#abbf9c'],food:['#e1cc9b','#f9e7c9','#d6d6a2','#a9bd78'],sharing:['#b8c1e5','#e6e2f1','#c4dacd','#91bcac'],quiet:['#31456c','#60779b','#6a91a5','#668b91']}[this.world.id];
  const grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,pal[0]);grad.addColorStop(.63,pal[1]);grad.addColorStop(1,pal[2]);c.fillStyle=grad;c.fillRect(0,0,w,h);
  // 멀리 있는 능선은 캐릭터 위치와 함께 천천히 이동합니다.
  for(let layer=0;layer<3;layer++){
   const par=layer*.17,level=h*(.56+layer*.055),size=h*(.045+.012*layer),offset=this.avatar.x*(.002+layer*.003);
   c.fillStyle=[pal[1],pal[2],pal[3]][layer];c.globalAlpha=.55+layer*.14;c.beginPath();c.moveTo(0,h);
   for(let px=0;px<=w+20;px+=16){let t=px/w*9+offset;c.lineTo(px,level+Math.sin(t*1.12+layer)*size*.35+Math.sin(t*2.12-layer)*size*.2)}
   c.lineTo(w,h);c.closePath();c.fill();c.globalAlpha=1;
  }
  const floor=c.createLinearGradient(0,h*.57,0,h);floor.addColorStop(0,pal[2]);floor.addColorStop(1,pal[3]);c.fillStyle=floor;c.fillRect(0,h*.59,w,h*.41);
  if(this.world.id==='quiet'){for(let n=0;n<45;n++){let x=hash(n,3,77)*w,y=hash(n,5,90)*h*.5;c.fillStyle='#e7f0fc';c.globalAlpha=.25+hash(n,6,20)*.65;c.fillRect(x,y,2,2)}c.globalAlpha=1}
  if(this.world.id==='ocean'){c.fillStyle='#7bbdc6';c.globalAlpha=.24;c.fillRect(0,h*.66,w,h*.13);c.globalAlpha=1}
  // 떨어져 있는 초록지구별: 인증 횟수가 쌓일수록 색감이 맑아집니다.
  const bgx=w*.76,bgy=h*.25,br=Math.min(w,h)*.045;const g=c.createRadialGradient(bgx-br/3,bgy-br/3,4,bgx,bgy,br);g.addColorStop(0,'#f4ffec');g.addColorStop(.4,this.heal>30?'#87deab':'#83b4b4');g.addColorStop(1,'#5b8cad');c.save();c.shadowBlur=26;c.shadowColor='#92d9e8';round(bgx,bgy,br,g);c.restore();
  c.save();c.fillStyle='#'+this.world.land.toString(16).padStart(6,'0');c.fillRect(0,h*.58,w,h*.42);c.restore();
  const scale=Math.max(18,Math.min(w,h)*.027),angle=this.yaw,ca=Math.cos(angle),sa=Math.sin(angle),me=this.avatar;
  const render=o=>{const dx=o.pos[0]-me.x,dz=o.pos[2]-me.z,ax=dx*ca-dz*sa,depth=dx*sa+dz*ca;return {...o,sx:w*.5+ax*scale,sy:h*.61+depth*scale*.40-o.pos[1]*scale,depth}};
  const visible=this.objects.filter(o=>o.shape!=='terrain'&&(o.rabbitOffset||Math.hypot(o.pos[0]-me.x,o.pos[2]-me.z)<65)).map(render).sort((a,b)=>b.depth-a.depth);
  for(const o of visible){if(o.distantEarth)continue;const r=Math.max(1,o.size[0]*scale*.5),sy=o.sy,sx=o.sx;const color='#'+o.color.toString(16).padStart(6,'0');if(o.shape==='sphere'){
      c.save();c.shadowBlur=o.rabbitOffset?2:5;c.shadowColor='#27504e70';const gr=c.createRadialGradient(sx-r*.4,sy-r*.42,1,sx,sy,r*1.2);gr.addColorStop(0,'#fdfbf3');gr.addColorStop(.16,color);gr.addColorStop(1,color);c.fillStyle=gr;c.beginPath();c.ellipse(sx,sy,Math.max(2,o.size[0]*scale*.55),Math.max(2,o.size[1]*scale*.55),0,0,PI*2);c.fill();c.restore()
    }else if(o.shape==='cone'){
      c.fillStyle=color;c.beginPath();c.moveTo(sx,sy-o.size[1]*scale*.5);c.lineTo(sx-o.size[0]*scale*.38,sy+o.size[1]*scale*.45);c.lineTo(sx+o.size[0]*scale*.38,sy+o.size[1]*scale*.45);c.closePath();c.fill()
    }else{c.fillStyle=color;c.fillRect(sx-o.size[0]*scale*.42,sy-o.size[1]*scale*.5,Math.max(1,o.size[0]*scale*.84),Math.max(1,o.size[1]*scale))}}
  c.fillStyle='#ffffffad';c.font=`600 ${Math.max(12,Math.round(w*.012))}px system-ui`;c.textAlign='left';c.fillText('가볍게 걷다가 마음에 드는 장소에 머물러 보세요',Math.max(15,w*.03),h*.93);
 }
 loop(){const fn=t=>{if(this.suspended)return;let dt=Math.min(.05,Math.max(.002,((t||0)-(this.last||t))/1000));this.last=t;this.update(dt);this.render();this.frame=requestAnimationFrame(fn)};this.frame=requestAnimationFrame(fn)}
 destroy(){cancelAnimationFrame(this.frame);this.suspended=true;this.clearChunks()}
}
