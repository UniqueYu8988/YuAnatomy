import * as T from "three";
import type { Atlas } from "./anatomy";
import { decodeModelResponse } from "./model-download";

interface PulpPart {
  id: string;
  center: [number, number, number];
  vertexCount: number;
  indexCount: number;
  positions: number;
  indices: number;
}
interface PulpManifest {
  schema: number;
  kind: string;
  bytes: number;
  url: string;
  gzip?: string;
  sha256: string;
  parts: PulpPart[];
}

/** Offline surface-constrained teaching schematics, not scanned pulp anatomy. */
export async function loadPulpData(atlas: Atlas, signal: AbortSignal) {
  const response = await fetch("/pulp/atlas.json", { signal });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("髓腔示意模型索引加载失败，请刷新重试。");
  }
  const manifest: PulpManifest = await response.json();
  const teeth = atlas.parts.filter((p) => p.system === "dental");
  if (manifest.schema !== 1 || manifest.kind !== "surface-constrained-schematic" ||
      manifest.parts.length !== teeth.length || new Set(manifest.parts.map((p) => p.id)).size !== teeth.length) {
    throw new Error("髓腔模型版本与牙体不匹配。");
  }
  for (const part of manifest.parts) {
    const tooth = teeth.find((p) => p.id === part.id);
    if (!tooth || part.center.some((v, i) => Math.abs(v - (tooth.bounds[0][i] + tooth.bounds[1][i]) / 2) > 1e-7)) {
      throw new Error("髓腔模型坐标与牙体不匹配。");
    }
  }
  const compressed = !!manifest.gzip && typeof DecompressionStream !== "undefined";
  const binary = await fetch(compressed ? manifest.gzip! : manifest.url, { signal });
  if (!binary.ok) throw new Error("髓腔示意模型下载失败，请刷新重试。");
  const buffer = await decodeModelResponse(binary, manifest.bytes, compressed);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hash = Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
  if (hash !== manifest.sha256) throw new Error("髓腔模型校验失败，请刷新重试。");
  return { manifest, buffer };
}

export function createPulpCavityGeometry(part: PulpPart, buffer: ArrayBuffer): T.Group {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.BufferAttribute(new Float32Array(buffer, part.positions, part.vertexCount * 3), 3));
  geometry.setIndex(new T.BufferAttribute(new Uint32Array(buffer, part.indices, part.indexCount), 1));
  geometry.computeVertexNormals();
  const material = new T.MeshStandardMaterial({
    color: 0xc85057, roughness: 0.65, metalness: 0, side: T.DoubleSide,
  });
  const group = new T.Group();
  group.name = `PulpSchematic-${part.id}`;
  group.visible = false;
  group.add(new T.Mesh(geometry, material));
  return group;
}
