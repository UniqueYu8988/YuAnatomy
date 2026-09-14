"""Independent export/registration checks, not a medical segmentation validation."""
import sys, gzip, json, re, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'work/pulp-runtime'))
import numpy as np
from PIL import Image
import trimesh

OUT = ROOT / 'output/root-study'
archive = np.load(OUT / 'candidate-labels.npz')
labels = archive['labels']; origin = archive['sourceOriginSectionYX']; pitch = .00999999
def read_nrrd(name):
    with (OUT / name).open('rb') as f:
        header = []
        while True:
            line = f.readline()
            assert line, 'Missing NRRD header delimiter'
            if line == b'\n': break
            header.append(line.decode().strip())
        fields = dict(x.split(': ', 1) for x in header if ': ' in x and not x.startswith('#'))
        assert fields['type'] == 'unsigned char' and fields['encoding'] == 'gzip'
        sizes = tuple(map(int, fields['sizes'].split()))
        data = gzip.decompress(f.read())
        assert len(data) == int(np.prod(sizes))
        physical_origin = np.array([float(x) for x in fields['space origin'].strip('()').split(',')])
        directions = np.array([float(x) for x in re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?', fields['space directions'])]).reshape(3, 3)
        assert np.allclose(physical_origin, origin[::-1] * pitch, rtol=0, atol=1e-10)
        assert np.allclose(directions, np.eye(3) * pitch, rtol=0, atol=1e-10)
        return np.frombuffer(data, dtype=np.uint8).reshape(sizes[::-1]), hashlib.sha256(data).hexdigest()

raw, rawsha = read_nrrd('raw-canal-roi.nrrd')
exported, labelsha = read_nrrd('candidate-lumen.nrrd')
assert raw.shape == labels.shape == exported.shape
assert np.array_equal(labels, exported)
checked = [1681, 1740, 2004, 2005, 2431, 2538, 2746, 2827, 2973]
for z in checked:
    folder = 'cohort-branch' if z <= 2004 else 'cohort-2005-2973'
    original = np.array(Image.open(ROOT / 'source' / folder / f'Tooth045_rec{z:08}.png'))
    roi = original[origin[1]:origin[1]+raw.shape[1], origin[2]:origin[2]+raw.shape[2]]
    assert np.array_equal(raw[z-origin[0]], roi), f'Source registration differs at {z}'
mesh = trimesh.load(OUT / 'candidate-root-system.ply', process=False)
assert mesh.is_watertight and mesh.is_winding_consistent and mesh.volume > 0
points = np.argwhere(labels)
expected_bounds = np.array([points.min(0)+origin-.5, points.max(0)+origin+.5])[:, ::-1] * pitch
assert np.allclose(mesh.bounds, expected_bounds, atol=2e-6, rtol=0), 'Mesh and source-coordinate bounds differ'
summary = {'passed': True, 'sourceSlicesPixelIdentical': checked,
           'rawAndLabelsSameDimensionsAndSourceCoordinates': True,
           'nrrdLabelEqualsNPZ': True, 'meshBoundsMatchSourceLabelBounds': True,
           'watertightAndConsistentWinding': True,
           'rawDecodedSha256': rawsha, 'labelDecodedSha256': labelsha,
           'scope': 'File integrity and geometric registration only; no anatomy reference validation.'}
(OUT / 'validation.json').write_text(json.dumps(summary, indent=2))
print(json.dumps(summary, indent=2))
