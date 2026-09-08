import * as T from "three";
import type { Part } from "./anatomy";
import { getDentalToothByMesh } from "./dental-data.ts";

export const DENTAL_ROWS = [
  ["17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27"],
  ["47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37"],
];
export interface DentalFrame {
  rotation: T.Quaternion;
  size: T.Vector3;
  centerOffset: T.Vector3;
}
const center = (p: Part) => new T.Vector3(...p.bounds[0]).add(new T.Vector3(...p.bounds[1])).multiplyScalar(.5);

/** Display orientation estimated from the source tooth's principal axis and arch tangent.
 * Rigid transforms only; no geometry deformation or radiographic projection. */
export function createDentalFrame(part: Part, parts: Part[], positions: ArrayLike<number>): DentalFrame | undefined {
  const tooth = getDentalToothByMesh(part.id);
  if (!tooth) return;
  const row = DENTAL_ROWS[tooth.quadrant <= 2 ? 0 : 1];
  const at = row.indexOf(tooth.fdi);
  const byFdi = new Map(parts.map(p => [getDentalToothByMesh(p.id)?.fdi, p]));
  const before = byFdi.get(row[Math.max(0, at - 1)]) ?? part;
  const after = byFdi.get(row[Math.min(row.length - 1, at + 1)]) ?? part;
  const tangent = center(after).sub(center(before)).normalize();
  const mean = new T.Vector3();
  for (let i = 0; i < positions.length; i += 3) mean.add(new T.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  mean.multiplyScalar(3 / positions.length);
  const covariance = new T.Matrix3().set(0,0,0,0,0,0,0,0,0);
  const e = covariance.elements;
  for (let i = 0; i < positions.length; i += 3) {
    const v = [positions[i] - mean.x, positions[i + 1] - mean.y, positions[i + 2] - mean.z];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) e[c * 3 + r] += v[r] * v[c];
  }
  const axis = new T.Vector3(0, 1, 0);
  for (let i = 0; i < 32; i++) axis.applyMatrix3(covariance).normalize();
  if (axis.y < 0) axis.negate();
  const facial = tangent.clone().cross(axis).normalize();
  const right = axis.clone().cross(facial).normalize();
  const rotation = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right, axis, facial)).invert();
  const pivot = center(part), box = new T.Box3(), v = new T.Vector3();
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i], positions[i + 1], positions[i + 2]).sub(pivot).applyQuaternion(rotation);
    box.expandByPoint(v);
  }
  return { rotation, size: box.getSize(new T.Vector3()), centerOffset: box.getCenter(new T.Vector3()) };
}
