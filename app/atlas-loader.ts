import type { Atlas } from "./anatomy";

export function mergeAtlases(base: Atlas, extra: Atlas): Atlas {
  for (const key of ["parts", "concepts"] as const) {
    const ids = [...base[key], ...extra[key]].map((p) => p.id);
    if (new Set(ids).size !== ids.length) throw Error(`Duplicate ${key} ID`);
  }
  return {
    ...base,
    parts: [...base.parts, ...extra.parts.map((p) => ({ ...p, chunk: p.chunk + base.chunks.length }))],
    concepts: [...base.concepts, ...extra.concepts],
    chunks: [...base.chunks, ...extra.chunks],
    triangles: base.triangles + extra.triangles,
  };
}

export async function loadAtlas(signal: AbortSignal): Promise<Atlas> {
  const [base, extra] = await Promise.all(["/head-neck/atlas.json", "/mastication/atlas.json"].map(async (url) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw Error(`Atlas load failed: ${url}`);
    return response.json() as Promise<Atlas>;
  }));
  return mergeAtlases(base, extra);
}
