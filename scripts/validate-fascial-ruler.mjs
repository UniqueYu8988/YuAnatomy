import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {measurePoints,retainedByPlane} from '../app/measurement.ts';
import {FASCIAL_SPACES,INFECTION_PATHWAYS} from '../app/fascial-spaces.ts';
const hash=b=>createHash('sha256').update(b).digest('hex');
const a=JSON.parse(fs.readFileSync('public/fascial/atlas.json'));
const grid=JSON.parse(fs.readFileSync('public/fascial/constraints.json'));
const occupied=gunzipSync(fs.readFileSync('public/fascial/constraints.bin.gz'));
assert.equal(occupied.length,grid.bytes);assert.equal(hash(occupied),grid.sha256);
const b=fs.readFileSync('public'+a.url);assert.equal(b.length,a.bytes);assert.equal(hash(b),a.sha256);assert.deepEqual(gunzipSync(fs.readFileSync('public'+a.gzip)),b);
const sources=new Map();
for(const folder of ['head-neck','mastication']){
 const base=JSON.parse(fs.readFileSync(`public/${folder}/atlas.json`));const chunks=base.chunks.map(c=>fs.readFileSync('public'+c.url));
 for(const p of base.parts){const buf=chunks[p.chunk];sources.set(p.id,hash(Buffer.concat([buf.subarray(p.positions,p.positions+p.vertexCount*12),buf.subarray(p.indices,p.indices+p.indexCount*4)])));}
}
for(const p of a.sources)assert.equal(sources.get(p.id),p.sha256,`Stale source: ${p.id}`);
const isBlocked=point=>{
 const coordinates=point.map((v,i)=>(v-grid.origin[i])/grid.spacing);
 // Float32 isosurface coordinates can lie exactly on a voxel boundary.
 // Treat contact within 0.00004 mm as contact, not penetration of the cell interior.
 const choices=coordinates.map(v=>Math.abs(v-Math.floor(v)-.5)<.00005 ? [Math.floor(v),Math.ceil(v)] : [Math.round(v)]);
 for(const x of choices[0])for(const y of choices[1])for(const z of choices[2]){
  assert([x,y,z].every((v,i)=>v>=0&&v<grid.shape[i]));
  if(!occupied[(x*grid.shape[1]+y)*grid.shape[2]+z])return false;
 }
 return true;
};
assert.equal(a.parts.length,8);let tested=0;
for(const p of a.parts){
 assert(FASCIAL_SPACES.some(s=>s.id===p.id));
 const v=new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3);const f=new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount);
 const edges=new Map();
 for(let i=0;i<f.length;i+=3){
  const triangle=Array.from(f.slice(i,i+3),index=>{assert(index<p.vertexCount);return Array.from(v.slice(index*3,index*3+3));});
  // Include vertices, edge midpoints and face centroid, not only mesh centers.
  const samples=[...triangle,triangle[0].map((_,j)=>(triangle[0][j]+triangle[1][j]+triangle[2][j])/3)];
  for(let k=0;k<3;k++){
   const x=f[i+k],y=f[i+(k+1)%3],key=x<y?`${x}:${y}`:`${y}:${x}`;edges.set(key,(edges.get(key)??0)+1);
   samples.push(triangle[k].map((v,j)=>(v+triangle[(k+1)%3][j])/2));
  }
  for(const point of samples){assert(point.every(Number.isFinite));assert(!isBlocked(point),`${p.id}: surface penetrates reserved tissue cells ${point.map((v,i)=>(v-grid.origin[i])/grid.spacing)}`);tested++;}
 }
 assert([...edges.values()].every(n=>n===2),`${p.id}: surface not closed`);
}
// A deliberately moved point inside the blocked tissue must be rejected.
const index=occupied.findIndex(v=>v===1);const ijk=[Math.floor(index/(grid.shape[1]*grid.shape[2])),Math.floor(index/grid.shape[2])%grid.shape[1],index%grid.shape[2]];
assert(isBlocked(ijk.map((v,i)=>grid.origin[i]+v*grid.spacing)));
for(const space of FASCIAL_SPACES)for(const id of space.boundaryParts)assert(sources.has(id));
for(const path of INFECTION_PATHWAYS){assert.equal(path.flowPoints.length,0);for(const step of path.stages)assert(FASCIAL_SPACES.some(s=>s.id===step.spaceId));}
assert.equal(measurePoints([0,0,0],[.003,.004,0]).distanceMm,5);
assert.equal(measurePoints([.1,.2,.3],[.103,.204,.3]).distanceMm.toFixed(5),'5.00000');
assert.deepEqual(measurePoints([.003,.004,0],[0,0,0]).deltaMm,[3,4,0]);
assert.throws(()=>measurePoints([NaN,0,0],[0,0,0]));
assert(retainedByPlane([1,0,0],[1,0,0],0));assert(!retainedByPlane([-1,0,0],[1,0,0],0));
assert(retainedByPlane([-1,0,0],[-1,0,0],0));assert(!retainedByPlane([1,0,0],[-1,0,0],0));
console.log(`PASS: 8 constrained space surfaces, ${tested} surface samples outside reserved tissue cells, source hashes, closed edges, branches; metric and clipping fixtures.`);
