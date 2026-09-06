import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { BoxGeometry } from 'three';
import { surfaceTree, certifyCavity } from './pulp-geometry-check.mjs';

const hash = b => createHash('sha256').update(b).digest('hex');
export function validatePulp(atlas, chunks) {
  const root = new URL('../public/', import.meta.url);
  const manifest = JSON.parse(fs.readFileSync(new URL('pulp/atlas.json', root)));
  assert.equal(manifest.kind, 'surface-constrained-schematic');
  assert.equal(manifest.schema, 1);
  const teeth = atlas.parts.filter(p => p.system === 'dental');
  assert.deepEqual(manifest.parts.map(p => p.id).sort(), teeth.map(p => p.id).sort());
  const bytes = fs.readFileSync(new URL('.' + manifest.url, root));
  assert.equal(bytes.length, manifest.bytes);
  assert.equal(hash(bytes), manifest.sha256);
  if (manifest.gzip) assert.deepEqual(gunzipSync(fs.readFileSync(new URL('.' + manifest.gzip, root))), bytes);
  let faces = 0, minimum = Infinity;
  for (const part of manifest.parts) {
    const tooth = teeth.find(p => p.id === part.id), source = chunks[tooth.chunk];
    const vb = source.subarray(tooth.positions, tooth.positions + tooth.vertexCount * 12);
    const ib = source.subarray(tooth.indices, tooth.indices + tooth.indexCount * 4);
    assert.equal(hash(Buffer.concat([vb, ib])), part.sourceSha256, `${part.id}: tooth changed; rebuild cavities`);
    assert.deepEqual(part.center, tooth.bounds[0].map((v, i) => (v + tooth.bounds[1][i]) / 2));
    const sourcePositions = Float64Array.from(new Float32Array(vb.buffer, vb.byteOffset, tooth.vertexCount * 3), (v, i) => (v - part.center[i % 3]) * 1000);
    const tree = surfaceTree(sourcePositions, new Uint32Array(ib.buffer, ib.byteOffset, tooth.indexCount));
    const positions = Float64Array.from(new Float32Array(bytes.buffer, bytes.byteOffset + part.positions, part.vertexCount * 3), v => v * 1000);
    const indices = new Uint32Array(bytes.buffer, bytes.byteOffset + part.indices, part.indexCount);
    const clearance = certifyCavity(tree, positions, indices);
    assert.ok(Math.abs(clearance - part.certifiedClearanceMm) < 1e-5, `${part.id}: stale clearance report`);
    minimum = Math.min(minimum, clearance); faces += indices.length / 3;
  }
  // Deliberately wrong geometry must fail, preventing a vacuous containment test.
  const box = new BoxGeometry(10, 10, 10);
  const tree = surfaceTree(box.attributes.position.array, box.index.array);
  const tetra = [0, 0, 0.3, -0.3, -0.3, -0.3, 0.3, -0.3, -0.3, 0, 0.3, -0.3];
  const facesT = [0, 2, 1, 0, 3, 2, 0, 1, 3, 1, 2, 3];
  certifyCavity(tree, tetra, facesT);
  assert.throws(() => certifyCavity(tree, tetra.map((v, i) => v + (i % 3 === 0 ? 20 : 0)), facesT), /outside/);
  assert.throws(() => certifyCavity(tree, tetra.map(v => v * 30), facesT), /outside|cross/);
  assert.throws(() => certifyCavity(tree, tetra, facesT.slice(3)), /closed/);
  box.dispose();
  console.log(`PASS: ${teeth.length} pulp schematics, ${faces} triangles; independently certified whole-face clearance >= ${minimum.toFixed(3)} mm; source hashes, closed connected topology, negative fixtures.`);
}
