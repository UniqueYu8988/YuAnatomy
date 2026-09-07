import type { RulerMeasurement } from "./anatomy";
type Point = [number, number, number];
export function measurePoints(a: Point, b: Point, partA?: RulerMeasurement["partA"], partB?: RulerMeasurement["partB"]): RulerMeasurement {
  if (![...a, ...b].every(Number.isFinite)) throw Error("Invalid measurement point");
  const deltaMm = a.map((v, i) => Math.abs(b[i] - v) * 1000) as Point;
  return { pointA: [...a], pointB: [...b], distanceMm: Math.hypot(...deltaMm), deltaMm, partA, partB, complete: !!partB };
}

/** Three.js clips the negative half-space; use the same rule for picking. */
export function retainedByPlane(point: Point, normal: Point, constant: number) {
  return point.reduce((sum, v, i) => sum + v * normal[i], constant) >= -1e-7;
}
