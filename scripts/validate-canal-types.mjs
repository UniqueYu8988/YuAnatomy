import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {surfaceTree,certifyCavity} from './pulp-geometry-check.mjs';
import {CANAL_PATTERNS} from '../app/canal-patterns.ts';
const a=JSON.parse(fs.readFileSync('public/canal-types/atlas.json'));
const b=fs.readFileSync('public'+a.url);
assert.equal(b.length,a.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);
assert.deepEqual(gunzipSync(fs.readFileSync('public'+a.gzip)),b);
assert.equal(a.meshes.length,9);assert.equal(a.models.length,8);
const meshes=new Map(a.meshes.map(p=>[p.id,{v:Float64Array.from(new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3),v=>v*1000),f:new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount)}]));
const shell=meshes.get('shell'),tree=surfaceTree(shell.v,shell.f);
function sliceLoops(mesh,y){
 const graph=new Map();
 const key=p=>p.map(v=>Math.round(v*1e5)).join(':');
 const connect=(a,b)=>{const ka=key(a),kb=key(b);if(ka===kb)return;for(const [u,v] of [[ka,kb],[kb,ka]]){if(!graph.has(u))graph.set(u,new Set());graph.get(u).add(v);}};
 for(let i=0;i<mesh.f.length;i+=3){
  const triangle=[0,1,2].map(k=>Array.from(mesh.v.slice(mesh.f[i+k]*3,mesh.f[i+k]*3+3)));let hits=[];
  for(let k=0;k<3;k++){const a=triangle[k],b=triangle[(k+1)%3];if((a[1]<y)!==(b[1]<y)){const t=(y-a[1])/(b[1]-a[1]);hits.push([a[0]+(b[0]-a[0])*t,a[2]+(b[2]-a[2])*t]);}}
  if(hits.length===2)connect(...hits);
 }
 assert(graph.size>0);assert([...graph.values()].every(n=>n.size===2),'Cut contours must be closed loops');
 const seen=new Set();let count=0;
 for(const point of graph.keys())if(!seen.has(point)){count++;const queue=[point];seen.add(point);while(queue.length){for(const p of graph.get(queue.pop()))if(!seen.has(p)){seen.add(p);queue.push(p);}}}
 return count;
}
let minimum=Infinity,sections=0;
const expectedGenus=[0,1,1,0,0,1,1,0];
for(let i=0;i<CANAL_PATTERNS.length;i++){
 const pattern=CANAL_PATTERNS[i],model=a.models[i],mesh=meshes.get(pattern.type);
 assert.equal(model.type,pattern.type);assert.deepEqual(model.stages,pattern.stages);
 minimum=Math.min(minimum,certifyCavity(tree,mesh.v,mesh.f));
 const edges=new Set();for(let j=0;j<mesh.f.length;j+=3)for(let k=0;k<3;k++){const a=mesh.f[j+k],b=mesh.f[j+(k+1)%3];edges.add(a<b?`${a}:${b}`:`${b}:${a}`);}
 const euler=mesh.v.length/3-edges.size+mesh.f.length/3;assert.equal((2-euler)/2,expectedGenus[i],`${pattern.type}: unexpected extra loop or missing merge`);
 for(let j=0;j<pattern.stages.length;j++){
  const section=model.sections[j];assert.equal(sliceLoops(mesh,section.y*1000+.003),pattern.stages[j],`${pattern.type} section ${j}`);
  assert.equal(section.canals.length,pattern.stages[j]);assert.equal(section.outer.length,1);sections++;
 }
}
const shifted=Float64Array.from(meshes.get('VII').v,(v,i)=>v+(i%3===2?20:0));
assert.throws(()=>certifyCavity(tree,shifted,meshes.get('VII').f),/outside|cross/);
assert.throws(()=>certifyCavity(tree,meshes.get('II').v,meshes.get('II').f.slice(3)),/closed|Disconnected/);
console.log(`PASS: 8 volumetric Vertucci models; ${sections} independently intersected sections; connected closed surfaces, expected loop topology, whole-face shell clearance >= ${minimum.toFixed(3)} mm; negative fixtures.`);
