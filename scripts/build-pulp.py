"""Build surface-constrained *schematic* cavities, never inferred clinical anatomy.

Install scripts/pulp-requirements.txt into work/pulp-runtime, then run this file.
Coordinates are taken from the shipped atlas, not a second copy of the teeth.
"""
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'work/pulp-runtime'))
import argparse
import hashlib
import gzip
import json
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from scipy import ndimage as ndi
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes
from skimage.graph import MCP_Geometric
import trimesh

PITCH = 0.12  # mm; offline discretization, not a claim of source resolution
MARGIN = 0.30  # computational clearance, not anatomical dentine thickness


def source_mesh(atlas, part):
    raw = (ROOT / 'public' / atlas['chunks'][part['chunk']]['url'].lstrip('/')).read_bytes()
    vb = raw[part['positions']:part['positions'] + part['vertexCount'] * 12]
    ib = raw[part['indices']:part['indices'] + part['indexCount'] * 4]
    vertices = np.frombuffer(vb, '<f4').reshape(-1, 3).astype(float)
    faces = np.frombuffer(ib, '<u4').reshape(-1, 3)
    center = np.mean(part['bounds'], axis=0)
    mesh = trimesh.Trimesh((vertices - center) * 1000, faces, process=True)
    assert mesh.is_watertight, f"Open tooth surface: {part['id']}"
    return mesh, center, hashlib.sha256(vb + ib).hexdigest()


def certify(surface, cavity):
    """Each whole triangle fits in an interior ball: not only vertex sampling.

    Distance to the tooth boundary at a triangle centroid must exceed the
    maximum centroid-to-corner distance. Convexity of that ball encloses the
    entire triangle and prevents crossing the tooth surface between vertices.
    """
    triangles = cavity.triangles
    centers = triangles.mean(axis=1)
    radii = np.linalg.norm(triangles - centers[:, None, :], axis=2).max(axis=1)
    distances = []
    for start in range(0, len(centers), 500):
        points = centers[start:start + 500]
        assert surface.contains(points).all(), 'Cavity triangle outside tooth'
        _, d, _ = trimesh.proximity.closest_point(surface, points)
        distances.extend(d)
    clearance = np.asarray(distances) - radii
    assert clearance.min() > 0.025, f'Uncertified triangle: {clearance.min():.4f} mm'
    assert cavity.is_watertight and len(cavity.split()) == 1, f'Invalid topology: watertight={cavity.is_watertight}, components={len(cavity.split())}'
    return float(clearance.min())


def build(surface, upper):
    # PCA supplies a tooth-local long axis; no shared global Y-axis tubes.
    _, axes = np.linalg.eigh(np.cov(surface.vertices.T))
    long = axes[:, -1]
    if long[1] * (1 if upper else -1) < 0:
        long = -long
    transverse = axes[:, 0]
    basis = np.column_stack((transverse, long, np.cross(transverse, long)))
    local = trimesh.Trimesh(surface.vertices @ basis, surface.faces, process=False)
    vox = local.voxelized(PITCH).fill()
    inside = np.pad(vox.matrix, 3)
    origin = vox.transform[:3, 3] - 3 * PITCH
    distance = ndi.distance_transform_edt(inside) * PITCH
    field = np.full(inside.shape, -2., dtype=np.float32)
    section_grid = np.moveaxis(np.indices((inside.shape[0], inside.shape[2])), 0, -1)
    ymin, ymax = local.bounds[:, 1]
    for j in range(inside.shape[1]):
        t = (origin[1] + j * PITCH - ymin) / (ymax - ymin)
        if t < 0.12 or t > 0.46:
            continue
        section = inside[:, j, :]
        labels, count = ndi.label(section)
        d = ndi.distance_transform_edt(section) * PITCH
        # Wider coronal chamber blends into smaller root lumens. Separate root
        # cross-sections receive their own scale, following root divergence.
        fraction = 0.25 + 0.17 * np.exp(-((t - 0.30) / 0.16) ** 2)
        # Rounded coronal roof and gradual apical taper, not plane-cut cylinders.
        if t < 0.25:
            fraction *= np.sqrt(max(0, 1 - ((t - 0.25) / 0.13) ** 2))
        if t > 0.34:
            fraction *= np.sqrt(max(0, 1 - ((t - 0.34) / 0.12) ** 2))
        for label in range(1, count + 1):
            mask = labels == label
            coords = section_grid[mask]
            if len(coords) < 4:
                continue
            center = np.average(coords, axis=0, weights=d[mask] ** 2)
            _, cross_axes = np.linalg.eigh(np.cov(coords.T))
            projected = (coords - center) @ cross_axes
            radii = np.maximum(np.max(np.abs(projected), axis=0) * PITCH * fraction, 0.001)
            radial = np.linalg.norm(projected * PITCH / radii, axis=1)
            # A tooth-local elliptical envelope prevents distance erosion from
            # leaving nearly full-width ribbons in very flattened roots.
            envelope = (1 - radial) * radii.min()
            field[:, j, :][mask] = np.minimum(d[mask] - (1 - fraction) * d[mask].max(), envelope)
    field = ndi.gaussian_filter(field, 1.15)
    field = np.minimum(field, distance - MARGIN)
    # Identify geometric root lobes above several transverse sections. This
    # determines paths for external roots, NOT anatomical canal number/type.
    height_vox = (ymax - ymin) / PITCH
    root_regions = []
    for cut in (0.52, 0.58, 0.64, 0.70, 0.76):
        j = int(round((ymin + cut * (ymax - ymin) - origin[1]) / PITCH))
        labels, count = ndi.label(distance[:, j:, :] > MARGIN + 0.20)
        candidates = []
        for label in range(1, count + 1):
            coords = np.argwhere(labels == label)
            if len(coords) >= 80 and np.ptp(coords[:, 1]) > height_vox * 0.08:
                coords[:, 1] += j
                candidates.append(coords)
        if len(candidates) > len(root_regions):
            root_regions = candidates
    assert root_regions, 'No resolvable geometric root'
    ends = []
    for region in root_regions:
        # The endpoint is the most apical internally safe voxel in that root.
        tip = region[region[:, 1] == region[:, 1].max()]
        end = tip[np.argmax(distance[tuple(tip.T)])]
        ends.append(tuple(end))
    j = int(round((ymin + 0.32 * (ymax - ymin) - origin[1]) / PITCH))
    x, z = np.unravel_index(np.argmax(field[:, j, :]), field[:, j, :].shape)
    start = (int(x), j, int(z))
    assert field[start] > 0, 'Missing chamber seed'
    costs = np.where(distance > MARGIN + PITCH, 1 / (distance + 0.05) ** 3, np.inf)
    paths = MCP_Geometric(costs)
    costs_out, _ = paths.find_costs([start], ends)
    sample_grid = np.argwhere(distance > MARGIN)
    for end in ends:
        assert np.isfinite(costs_out[end]), 'No interior route to root tip'
        route = np.asarray(paths.traceback(end), dtype=float)
        smooth = ndi.gaussian_filter1d(route, 2.5, axis=0, mode='nearest')
        smooth[0] = route[0]; smooth[-1] = route[-1]
        arc = np.r_[0, np.cumsum(np.linalg.norm(np.diff(smooth, axis=0), axis=1))]
        # Densely resample to avoid beads along the reconstructed tube.
        steps = np.linspace(0, arc[-1], max(16, int(arc[-1] * 3)))
        curve = np.column_stack([np.interp(steps, arc, smooth[:, axis]) for axis in range(3)])
        u = steps / arc[-1]
        radius = 0.12 + 0.48 * (1 - u) ** 0.85
        # Limit radius to locally available tooth thickness after smoothing.
        available = ndi.map_coordinates(distance, curve.T, order=1) - MARGIN - 0.08
        radius = np.minimum(radius, np.maximum(0.09, available))
        nearest_distance, nearest = cKDTree(curve).query(sample_grid)
        tube = radius[nearest] - nearest_distance * PITCH
        field[tuple(sample_grid.T)] = np.maximum(field[tuple(sample_grid.T)], tube)
    field = ndi.gaussian_filter(field, 0.55)
    field = np.minimum(field, distance - MARGIN)
    labels, count = ndi.label(field > 0)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    main = int(sizes.argmax())
    discarded = int(sizes.sum() - sizes[main])
    # Fail instead of silently losing substantial disconnected root branches.
    assert discarded / sizes.sum() < 0.015, f'Disconnected cavity volume: {discarded / sizes.sum():.2%}'
    field[(labels != main) & (field > 0)] = -0.01
    vertices, faces, _, _ = marching_cubes(field, level=0, spacing=(PITCH,) * 3, allow_degenerate=False)
    cavity = trimesh.Trimesh((vertices + origin) @ basis.T, faces, process=True)
    # Light geometry smoothing removes voxel steps; containment is certified
    # against the original triangle mesh AFTER smoothing and float32 encoding.
    trimesh.smoothing.filter_laplacian(cavity, lamb=0.35, iterations=3, volume_constraint=False)
    cavity.vertices = (cavity.vertices / 1000).astype('<f4').astype(float) * 1000
    cavity.process(validate=True)
    clearance = certify(surface, cavity)
    return cavity, clearance, discarded


def build_part(task):
    atlas, part, build_key = task
    surface, center, digest = source_mesh(atlas, part)
    cache = ROOT / 'work/pulp-cache' / f"{part['id']}-{build_key}-{digest[:12]}.npz"
    if cache.exists():
        with np.load(cache) as saved:
            return part, center, digest, saved['positions'], saved['indices'], float(saved['clearance']), int(saved['discarded'])
    cavity, clearance, discarded = build(surface, 'upper' in part['name'])
    positions = np.asarray(cavity.vertices / 1000, dtype='<f4')
    indices = np.asarray(cavity.faces, dtype='<u4')
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(cache, positions=positions, indices=indices, clearance=clearance, discarded=discarded)
    return part, center, digest, positions, indices, clearance, discarded


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', help='One mesh ID for development; writes work only')
    args = parser.parse_args()
    atlas = json.loads((ROOT / 'public/head-neck/atlas.json').read_text())
    output = ROOT / ('work/pulp-preview' if args.only else 'public/pulp')
    output.mkdir(parents=True, exist_ok=True)
    data = bytearray()
    parts = []
    selected = [p for p in atlas['parts'] if p['system'] == 'dental' and (not args.only or p['id'] == args.only)]
    build_key = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()[:12]
    with ProcessPoolExecutor(max_workers=3) as pool:
      for part, center, digest, positions, indices, clearance, discarded in pool.map(build_part, [(atlas, p, build_key) for p in selected]):
        entry = dict(id=part['id'], sourceSha256=digest, center=center.tolist(),
                     vertexCount=len(positions), indexCount=indices.size,
                     positions=len(data), certifiedClearanceMm=clearance,
                     discardedVoxels=discarded)
        data.extend(positions.tobytes())
        entry['indices'] = len(data)
        data.extend(indices.tobytes())
        parts.append(entry)
        print(f"{part['id']}: {len(indices)} faces, certified clearance {clearance:.3f} mm", flush=True)
    digest = hashlib.sha256(data).hexdigest()
    filename = f'pulp-{digest[:12]}.bin'
    (output / filename).write_bytes(data)
    (output / (filename + '.gz')).write_bytes(gzip.compress(data, compresslevel=9, mtime=0))
    manifest = dict(schema=1, kind='surface-constrained-schematic',
                    apices='closed-schematic-ends-not-anatomical-foramina',
                    pitchMm=PITCH, minimumComputationalMarginMm=MARGIN,
                    url='/pulp/' + filename, gzip='/pulp/' + filename + '.gz', bytes=len(data), sha256=digest, parts=parts)
    (output / 'atlas.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Completed {len(parts)} cavities, {len(data)} bytes', flush=True)


if __name__ == '__main__':
    main()
