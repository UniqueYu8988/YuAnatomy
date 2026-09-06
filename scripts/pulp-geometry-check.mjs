import assert from 'node:assert/strict';
import { Box3, Vector3, Triangle, Ray } from 'three';

export function surfaceTree(positions, indices) {
  const triangles = [];
  for (let i = 0; i < indices.length; i += 3) {
    const vertices = [0, 1, 2].map(j => new Vector3().fromArray(positions, indices[i + j] * 3));
    triangles.push({ triangle: new Triangle(...vertices), box: new Box3().setFromPoints(vertices), center: vertices[0].clone().add(vertices[1]).add(vertices[2]).divideScalar(3) });
  }
  function build(items) {
    const box = new Box3();
    items.forEach(t => box.union(t.box));
    if (items.length <= 8) return { box, items };
    const size = box.getSize(new Vector3());
    const axis = size.x > size.y && size.x > size.z ? 'x' : size.y > size.z ? 'y' : 'z';
    items.sort((a, b) => a.center[axis] - b.center[axis]);
    const mid = Math.floor(items.length / 2);
    return { box, left: build(items.slice(0, mid)), right: build(items.slice(mid)) };
  }
  const root = build(triangles), closest = new Vector3();
  function distance(point, node = root, best = Infinity) {
    if (node.box.distanceToPoint(point) >= best) return best;
    if (node.items) {
      for (const item of node.items) {
        item.triangle.closestPointToPoint(point, closest);
        best = Math.min(best, closest.distanceTo(point));
      }
    } else {
      let first = node.left, second = node.right;
      if (second.box.distanceToPoint(point) < first.box.distanceToPoint(point)) [first, second] = [second, first];
      best = distance(point, first, best);
      best = distance(point, second, best);
    }
    return best;
  }
  function contains(point) {
    const ray = new Ray(point, new Vector3(0.371, 0.529, 0.763).normalize()), hit = new Vector3(), hits = [];
    function visit(node) {
      if (!ray.intersectsBox(node.box)) return;
      if (node.items) {
        for (const { triangle: t } of node.items) {
          if (ray.intersectTriangle(t.a, t.b, t.c, false, hit)) hits.push(hit.distanceTo(point));
        }
      } else { visit(node.left); visit(node.right); }
    }
    visit(root);
    hits.sort((a, b) => a - b);
    return hits.filter((v, i) => i === 0 || v - hits[i - 1] > 1e-7).length % 2 === 1;
  }
  return { distance, contains };
}

/** Certify whole triangles in mm. Connected closed surface + interior seed +
 * no boundary intersection proves all faces stay inside the tooth shell. */
export function certifyCavity(surface, positions, indices) {
  assert.ok(positions.length > 0 && indices.length > 0 && indices.length % 3 === 0);
  assert.ok(Array.from(positions).every(Number.isFinite));
  const count = positions.length / 3, parents = Array.from({ length: count }, (_, i) => i), edges = new Map();
  function find(i) { while (parents[i] !== i) { parents[i] = parents[parents[i]]; i = parents[i]; } return i; }
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), center = new Vector3();
  let minClearance = Infinity;
  for (let i = 0; i < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    assert.ok(ids.every(v => Number.isInteger(v) && v >= 0 && v < count), 'Invalid cavity index');
    assert.equal(new Set(ids).size, 3, 'Degenerate cavity face');
    for (let j = 0; j < 3; j++) {
      const x = ids[j], y = ids[(j + 1) % 3];
      parents[find(x)] = find(y);
      const key = Math.min(x, y) * count + Math.max(x, y);
      const edge = edges.get(key) ?? { count: 0, winding: 0 };
      edge.count++; edge.winding += x < y ? 1 : -1; edges.set(key, edge);
    }
    a.fromArray(positions, ids[0] * 3); b.fromArray(positions, ids[1] * 3); c.fromArray(positions, ids[2] * 3);
    center.copy(a).add(b).add(c).divideScalar(3);
    if (i === 0) assert.ok(surface.contains(center), 'Cavity is outside tooth');
    const radius = Math.max(center.distanceTo(a), center.distanceTo(b), center.distanceTo(c));
    const clearance = surface.distance(center) - radius;
    assert.ok(clearance > 0.025, `Triangle ${i / 3} may cross tooth boundary (${clearance} mm)`);
    minClearance = Math.min(minClearance, clearance);
  }
  assert.ok([...edges.values()].every(e => e.count === 2 && e.winding === 0), 'Cavity must be closed with consistent winding');
  assert.equal(new Set(parents.map((_, i) => find(i))).size, 1, 'Disconnected cavity or unused vertices');
  return minClearance;
}
