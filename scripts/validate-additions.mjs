import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {mergeAtlases} from '../app/atlas-loader.ts';
import {CANAL_PATTERNS,canalPaths} from '../app/canal-patterns.ts';
import {inPreset,getStudyEntry} from '../app/study.ts';
const base=JSON.parse(fs.readFileSync('public/head-neck/atlas.json'));
const extra=JSON.parse(fs.readFileSync('public/mastication/atlas.json'));
assert.equal(extra.parts.length,12);assert.equal(extra.triangles,285254);
const merged=mergeAtlases(base,extra);assert.equal(merged.parts.length,603);
assert.throws(()=>mergeAtlases(base,base),/Duplicate/);
assert.equal(merged.parts.filter(p=>p.system==='dental').length,28);
for(const c of extra.chunks){
 const b=fs.readFileSync('public'+c.url);assert.equal(b.length,c.bytes);
 assert.equal(createHash('sha256').update(b).digest('hex'),c.sha256);
 assert.deepEqual(gunzipSync(fs.readFileSync('public'+c.gzip)),b);
 for(const p of extra.parts){
  assert(inPreset(p,'mastication'));assert(inPreset(p,'muscles'));
  assert(/[\u4e00-\u9fff]/.test(getStudyEntry(p.conceptId,[p.id])?.displayName??''));
  const v=new Float32Array(b.buffer,b.byteOffset+p.positions,p.vertexCount*3);
  const indices=new Uint32Array(b.buffer,b.byteOffset+p.indices,p.indexCount);
  assert.equal(p.indexCount,p.sourceTriangleCount*3);
  for(const i of indices)assert(i<p.vertexCount);
  for(let axis=0;axis<3;axis++){
   const values=Array.from(v).filter((_,i)=>i%3===axis);assert(values.every(Number.isFinite));
   assert(Math.abs(Math.min(...values)-p.bounds[0][axis])<1e-7);assert(Math.abs(Math.max(...values)-p.bounds[1][axis])<1e-7);
  }
 }
}
assert.equal(extra.registrationChecks.length,4);
for(const c of extra.registrationChecks)for(const m of [c.sourceToTarget,c.targetToSource]){assert(m.rmsMm<.6);assert(m.p95Mm<1.2);}
assert.deepEqual(CANAL_PATTERNS.map(p=>p.stages.join('-')),['1-1','2-1','1-2-1','2-2','1-2','2-1-2','1-2-1-2','3-3']);
for(const p of CANAL_PATTERNS)assert(canalPaths(p.stages).every(d=>!d.includes('NaN')));
console.log('PASS: 12 registered mastication meshes, independent licenses, combined atlas, Chinese lookup, Vertucci I–VIII.');
