import "./validate-fascial-ruler.mjs";
import "./validate-additions.mjs";
import "./validate-canal-types.mjs";
import fs from "node:fs";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import * as T from "three";
import { createDentalFrame, DENTAL_ROWS } from "../app/dental-unfold.ts";
import { createExplosionLayout } from "../app/explosion-layout.ts";
import { inPreset, PRESETS, getStudyEntry } from "../app/study.ts";
import { PointerTap } from "../app/pointer-tap.ts";
import { DENTAL_TEETH_DATA } from "../app/dental-data.ts";
import { validatePulp } from "./validate-pulp.mjs";
const root = new URL("../public", import.meta.url);
const a = JSON.parse(fs.readFileSync(new URL("./head-neck/atlas.json", root + "/")));
const ids = new Set(a.parts.map((p) => p.id));
assert.equal(ids.size, a.parts.length);
assert.equal(a.geometry?.quality, "published-obj");
assert.equal(a.geometry?.additionalSimplification, false);
for (const id of ["FJ2554", "FJ2555"]) assert.ok(!ids.has(id), `Excluded mesh returned: ${id}`);
assert.ok(!a.concepts.some(c => /major alar cartilage/i.test(c.name)), "Excluded cartilage remains searchable");
assert.ok(a.parts.length > 500 && a.parts.length < 800);
const files = a.chunks.map((c) => {
  const b = fs.readFileSync(new URL("." + c.url, root + "/"));
  assert.equal(b.length, c.bytes);
  assert.deepEqual(gunzipSync(fs.readFileSync(new URL("." + c.gzip, root + "/"))), b);
  return b;
});
let triangles = 0;
for (const p of a.parts) {
  assert.equal(p.indexCount / 3, p.sourceTriangleCount, `Source faces changed: ${p.id}`);
  assert.ok(p.name && p.conceptId);
  assert.notEqual(p.system, "cardiac");
  assert.ok(
    !/femur|tibia|humerus|thoracic vertebra|^skin$|^trachea$|^esophagus$/i.test(p.name),
    p.name,
  );
  const b = files[p.chunk];
  for (const [key, length] of [
    ["positions", p.vertexCount * 12],
    ["normals", p.vertexCount * 6],
    ["indices", p.indexCount * 4],
  ])
    assert.ok(p[key] % 4 === 0 && p[key] + length <= b.length);
  const positions = new Float32Array(b.buffer, b.byteOffset + p.positions, p.vertexCount * 3),
    indices = new Uint32Array(b.buffer, b.byteOffset + p.indices, p.indexCount);
  for (const i of indices) assert.ok(i < p.vertexCount);
  for (let i = 0; i < positions.length; i++) {
    assert.ok(Number.isFinite(positions[i]));
    assert.ok(
      positions[i] >= p.bounds[0][i % 3] - 1e-5 && positions[i] <= p.bounds[1][i % 3] + 1e-5,
    );
  }
  triangles += p.indexCount / 3;
}
assert.equal(triangles, a.triangles);
assert.equal(new Set(a.concepts.map((c) => c.id)).size, a.concepts.length);
for (const c of a.concepts) {
  assert.ok(c.elements.length);
  for (const id of c.elements) assert.ok(ids.has(id));
}
for (const name of ["Mandible", "Left maxilla", "Right maxilla", "Atlas", "Axis", "Hyoid bone"])
  assert.ok(
    a.parts.some((p) => p.name === name),
    name,
  );
for (const preset of PRESETS) {
  const parts = a.parts.filter((p) => inPreset(p, preset.id));
  assert.ok(parts.length > 0);
  for (const aspect of [0.46, 1, 1.7]) {
    const layout = createExplosionLayout(parts, aspect),
      cells = [...layout.cells.values()];
    assert.equal(cells.length, parts.length);
    for (let i = 0; i < cells.length; i++)
      for (let j = i + 1; j < cells.length; j++) {
        const x = cells[i],
          y = cells[j];
        assert.ok(
          Math.abs(x.x - y.x) >= (x.width + y.width) / 2 - 1e-8 ||
            Math.abs(x.y - y.y) >= (x.height + y.height) / 2 - 1e-8,
        );
      }
  }
}
assert.ok(a.parts.filter((p) => inPreset(p, "oral")).some((p) => p.system === "dental"));
// Panoramic display: right-to-left patient order, two arches, rigid source transforms.
const dentalParts = Object.values(DENTAL_TEETH_DATA).map(t => a.parts.find(p => p.id === t.meshId));
const frames = new Map(dentalParts.map(p => {
  const buffer = files[p.chunk];
  const positions = new Float32Array(buffer.buffer, buffer.byteOffset + p.positions, p.vertexCount * 3);
  return [p.id, createDentalFrame(p, a.parts, positions)];
}));
const dentalLayout = createExplosionLayout(dentalParts, 1, frames);
assert.equal(dentalLayout.cells.size, 28);
assert.ok(dentalLayout.width < .25 && dentalLayout.height < .10, "Compact two-arch layout");
let previousRow = Infinity;
for (const sequence of DENTAL_ROWS) {
  let previousX = -Infinity;
  const row = sequence.map(fdi => dentalLayout.cells.get(DENTAL_TEETH_DATA[fdi].meshId));
  assert.ok(row[0].y < previousRow, "Upper arch above lower arch");
  previousRow = row[0].y;
  for (const cell of row) {
    assert.equal(cell.y, row[0].y);
    assert.ok(cell.x > previousX, "Patient-right molars to midline to patient-left molars");
    previousX = cell.x;
  }
}
for (const part of dentalParts) {
  const cell = dentalLayout.cells.get(part.id), frame = frames.get(part.id);
  assert.ok(Math.abs(frame.rotation.length() - 1) < 1e-8, "Rigid unit rotation");
  assert.ok(cell.width >= frame.size.x + .0019);
  assert.ok(cell.height >= frame.size.y + .0079);
  const buffer = files[part.chunk];
  const positions = new Float32Array(buffer.buffer, buffer.byteOffset + part.positions, part.vertexCount * 3);
  const pivot = new T.Vector3(...part.bounds[0]).add(new T.Vector3(...part.bounds[1])).multiplyScalar(.5);
  const transformed = new T.Vector3();
  for (let v = 0; v < positions.length; v += 3) {
    transformed.fromArray(positions, v).sub(pivot).applyQuaternion(frame.rotation).sub(frame.centerOffset);
    assert.ok(Math.abs(transformed.x) <= cell.width / 2 - .0009, `Unfolded width: ${part.id}`);
    assert.ok(Math.abs(transformed.y) <= cell.height / 2 - .0039, `Unfolded height: ${part.id}`);
  }
  const sourceA = new T.Vector3().fromArray(positions), sourceB = new T.Vector3().fromArray(positions, positions.length - 3);
  const distance = sourceA.distanceTo(sourceB);
  sourceA.sub(pivot).applyQuaternion(frame.rotation); sourceB.sub(pivot).applyQuaternion(frame.rotation);
  assert.ok(Math.abs(sourceA.distanceTo(sourceB) - distance) < 1e-10, "Tooth dimensions preserved");
}
const dentalCells = [...dentalLayout.cells.values()];
for (let i = 0; i < dentalCells.length; i++) for (let j = i + 1; j < dentalCells.length; j++) {
  const x = dentalCells[i], y = dentalCells[j];
  assert.ok(Math.abs(x.x - y.x) >= (x.width + y.width) / 2 - 1e-8 || Math.abs(x.y - y.y) >= (x.height + y.height) / 2 - 1e-8, "Unfolded teeth do not overlap");
}
for (const p of a.parts) {
  const entry = getStudyEntry(p.conceptId, [p.id]);
  assert.ok(entry && entry.displayName, `Part missing Chinese localization: ${p.id} (${p.name})`);
}
for (const c of a.concepts) {
  const entry = getStudyEntry(c.id, c.elements);
  assert.ok(entry && entry.displayName, `Concept missing Chinese localization: ${c.id} (${c.name})`);
}
const tap = new PointerTap();
tap.down(1, 10, 10, 5);
assert.equal(tap.up(1, 12, 11), true);
tap.down(1, 10, 10, 5);
tap.move(1, 40, 10);
assert.equal(tap.up(1, 10, 10), false);
tap.down(1, 10, 10, 12);
tap.down(2, 20, 20, 12);
assert.equal(tap.up(2, 20, 20), false);
assert.equal(tap.up(1, 10, 10), false);
tap.down(1, 10, 10, 5);
tap.cancel(1);
assert.equal(tap.up(1, 10, 10), false);
// Dental Studio Validation (28 Permanent Teeth)
const teethKeys = Object.keys(DENTAL_TEETH_DATA);
assert.equal(teethKeys.length, 28, "Dental Studio must contain all 28 permanent teeth");
for (const fdi of teethKeys) {
  const tooth = DENTAL_TEETH_DATA[fdi];
  assert.ok(tooth.name && tooth.name.length > 0, `Tooth ${fdi} missing name`);
  assert.ok(tooth.meshId && ids.has(tooth.meshId), `Tooth ${fdi} meshId ${tooth.meshId} not found in atlas`);
  assert.ok(a.concepts.some((c) => c.id === tooth.conceptId), `Tooth ${fdi} conceptId ${tooth.conceptId} not found`);
  assert.ok(tooth.morphometrics.totalLength > 0, `Tooth ${fdi} missing valid totalLength`);
  assert.ok(tooth.pulpFeatures && tooth.pulpFeatures.chamberShape, `Tooth ${fdi} missing pulp chamber features`);
  assert.ok(tooth.clinicalPearls && tooth.clinicalPearls.extraction, `Tooth ${fdi} missing clinical pearls`);
  assert.ok(Array.isArray(tooth.pins) && tooth.pins.length > 0, `Tooth ${fdi} must have 3D anatomical pins`);
}

validatePulp(a, files);
console.log(
  `PASS: ${ids.size} meshes, ${a.concepts.length} concepts, ${triangles} triangles; 28 Dental Studio teeth verified; gzip, indices, translated bounds, regional coverage, presets, non-overlapping layouts and pointer gestures.`,
);
