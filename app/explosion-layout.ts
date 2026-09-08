import type { Part } from "./anatomy";
import { getDentalToothByMesh } from "./dental-data.ts";
import { DENTAL_ROWS, type DentalFrame } from "./dental-unfold.ts";
export interface LayoutCell {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: DentalFrame["rotation"];
  centerOffset?: DentalFrame["centerOffset"];
}
/** Pack only visible source meshes. Every projected bounding box gets its own cell. */
export function createExplosionLayout(parts: Part[], aspect = 1, frames?: Map<string, DentalFrame>) {
  const teeth = parts.map((part) => ({ part, tooth: getDentalToothByMesh(part.id) }));
  if (teeth.length && teeth.every(({ tooth }) => tooth)) {
    const widths = Array<number>(14).fill(0);
    const heights = Array<number>(2).fill(0);
    for (const { part, tooth } of teeth) {
      const row = tooth!.quadrant <= 2 ? 0 : 1, col = DENTAL_ROWS[row].indexOf(tooth!.fdi);
      const size = frames?.get(part.id)?.size;
      widths[col] = Math.max(widths[col], size?.x ?? part.bounds[1][0] - part.bounds[0][0]);
      heights[row] = Math.max(heights[row], size?.y ?? part.bounds[1][1] - part.bounds[0][1]);
    }
    const columnSizes = widths.map(w => Math.max(w, .005) + .002);
    const rowSizes = heights.map(h => Math.max(h, .012) + .008);
    const width = columnSizes.reduce((a, b) => a + b, 0);
    const height = rowSizes.reduce((a, b) => a + b, 0);
    const cells = new Map<string, LayoutCell>();
    for (const { part, tooth } of teeth) {
      const row = tooth!.quadrant <= 2 ? 0 : 1, col = DENTAL_ROWS[row].indexOf(tooth!.fdi);
      const frame = frames?.get(part.id);
      cells.set(part.id, {
        x: columnSizes.slice(0, col).reduce((a, b) => a + b, 0) + columnSizes[col] / 2 - width / 2,
        y: height / 2 - rowSizes.slice(0, row).reduce((a, b) => a + b, 0) - rowSizes[row] / 2,
        width: columnSizes[col], height: rowSizes[row],
        rotation: frame?.rotation, centerOffset: frame?.centerOffset,
      });
    }
    return { cells, width, height };
  }
  const cards = parts.map((p) => ({
    id: p.id,
    system: p.system,
    width: Math.max(0.035, p.bounds[1][0] - p.bounds[0][0]) + 0.04,
    height: Math.max(0.035, p.bounds[1][1] - p.bounds[0][1]) + 0.04,
  }));
  const area = cards.reduce((n, c) => n + c.width * c.height, 0),
    maxWidth = Math.max(0.3, ...cards.map((c) => c.width));
  const targetWidth = Math.max(
    maxWidth,
    Math.sqrt(area * Math.max(0.5, Math.min(1.5, aspect))) * 1.18,
  );
  cards.sort((a, b) => b.height - a.height || a.id.localeCompare(b.id));
  const cells = new Map<string, LayoutCell>();
  let x = 0,
    y = 0,
    row = 0,
    usedWidth = 0;
  for (const c of cards) {
    if (x > 0 && x + c.width > targetWidth) {
      x = 0;
      y += row;
      row = 0;
    }
    cells.set(c.id, { x: x + c.width / 2, y: -y - c.height / 2, width: c.width, height: c.height });
    x += c.width;
    usedWidth = Math.max(usedWidth, x);
    row = Math.max(row, c.height);
  }
  const height = y + row;
  cells.forEach((c) => {
    c.x -= usedWidth / 2;
    c.y += height / 2;
  });
  return { cells, width: usedWidth, height };
}
