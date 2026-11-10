import {WorldEngine,WORLDS,landscapeHeight,terrainChunkKey} from './game/engine.js';
import {MISSIONS} from './game/missions.js';
import assert from 'node:assert/strict';
assert.equal(WORLDS.length,7);
assert.equal(MISSIONS.length,40);
assert.equal(new Set(MISSIONS.map(m=>m.id)).size,40);
assert.equal(new Set(WORLDS.map(w=>w.id)).size,7);
for(const w of WORLDS){
  for(const [x,z] of [[0,0],[-30,65],[800,800],[-1950,120],[48-1e-6,-60]]){
   const h=landscapeHeight(x,z,w.id);assert(Number.isFinite(h));
   assert(Math.abs(h-landscapeHeight(x+.0001,z,w.id))<.02,'height continuity');
  }
  const o=Object.create(WorldEngine.prototype);
  Object.assign(o,{cb:{},gl:null,objects:[],chunks:new Map(),chunkCenter:'',stations:[],planets:[],inputs:new Set(),mode:'orbit',selected:0,heal:5});
  o.land(WORLDS.indexOf(w));
  assert.equal(o.mode,'land');
  assert.equal(o.chunks.size,25);
  assert.equal(o.stations.filter(s=>s.kind==='mission').length,MISSIONS.filter(m=>m.planet===w.id).length);
  assert.equal(new Set(o.stations.filter(s=>s.missionId).map(s=>s.missionId)).size,MISSIONS.filter(m=>m.planet===w.id).length);
  assert(o.objects.some(x=>x.shape==='terrain'));
  const old=new Set(o.chunks.keys());o.avatar.x=163;o.avatar.z=-111;o.streamChunks();
  assert.equal(o.chunks.size,25);assert(![...old].every(k=>o.chunks.has(k)));
  assert(Math.abs(o.ground(163,-111)-landscapeHeight(163,-111,w.id))<1e-9);
  assert(o.objects.length<800,'object count bounded '+w.id);
  o.move(1,0);assert(o.avatar.x>163);
  o.avatar.x=1800;o.avatar.z=1800;o.streamChunks();assert.equal(o.chunks.size,25);
  const key=terrainChunkKey(o.avatar.x,o.avatar.z);assert(o.chunks.has(key));
  console.log(w.name,'mission stations',o.stations.filter(s=>s.missionId).length,'objects at 1km',o.objects.length);
}
console.log('PASS: seven worlds, 40 missions, deterministic height, chunks, travel, station mappings');
