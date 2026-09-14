"""Audit nominal crown candidate without repairing disconnected observations."""
import sys, json
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi

a = np.load(ROOT / 'cache/crown-extension/candidate.npy', mmap_mode='r')
planes = []
for z in range(len(a)):
    p = np.argwhere(a[z])
    if len(p):
        planes.append((z, p.min(0), p.max(0)))
lo = np.min([p[1] for p in planes], axis=0)
hi = np.max([p[2] for p in planes], axis=0) + 1
z0, z1 = planes[0][0], planes[-1][0] + 1
mask = np.asarray(a[z0:z1, lo[0]:hi[0], lo[1]:hi[1]], dtype=bool)
labels, count = ndi.label(mask)  # 6-neighbour native voxel connectivity
seed_ids = np.unique(labels[-1]); seed_ids = seed_ids[seed_ids != 0]
parts = []
for i, box in enumerate(ndi.find_objects(labels), 1):
    if box is None:
        continue
    parts.append({'component': i, 'voxels': int((labels[box] == i).sum()),
                  'sourceSectionRange': [389 + z0 + box[0].start, 389 + z0 + box[0].stop - 1],
                  'touchesRootJoinPlane1681': bool(i in seed_ids)})
report = {'threshold': 30, 'connectivity': 6, 'componentCount': count,
          'components': parts, 'totalCandidateVoxels': int(mask.sum()),
          'disconnectedFromJoinVoxels': int(sum(p['voxels'] for p in parts if not p['touchesRootJoinPlane1681'])),
          'interpretation': 'Disconnected observations are retained as uncertain candidates, not bridged or called a continuous pulp chamber.'}
assert sum(p['voxels'] for p in parts) == int(mask.sum())
(ROOT / 'output/crown-extension/continuity-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
