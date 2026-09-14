"""Re-read exports against independent source pixels, labels and mesh geometry."""
import gzip
import hashlib
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image
import trimesh

OUT=ROOT/'output/specimen007-crown';SOURCE=ROOT/'source/specimen007'
report=json.loads((OUT/'report.json').read_text())
origin=np.array(report['sourceOriginSectionYX']);pitch=report['pixelPitchMm']
arrays={}
for record in report['volumes']:
    header,payload=(OUT/record['file']).read_bytes().split(b'\n\n',1)
    fields=dict(line.split(': ',1) for line in header.decode().splitlines() if ': ' in line)
    size=list(map(int,fields['sizes'].split()))
    assert size==[300,320,335]
    assert fields['space origin']==f'({origin[2]*pitch},{origin[1]*pitch},{origin[0]*pitch})'
    assert fields['space directions']==f'({pitch},0,0) (0,{pitch},0) (0,0,{pitch})'
    decoded=gzip.decompress(payload)
    assert hashlib.sha256(decoded).hexdigest()==record['decodedSha256']
    arrays[record['file']]=np.frombuffer(decoded,np.uint8).reshape(tuple(size[::-1]))
manifest={x['section']:x for x in json.loads((SOURCE/'manifest.json').read_text())['files']}
for z in range(1100,1435):
    p=SOURCE/manifest[z]['file']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==report['sourceHashes'][str(z)]==manifest[z]['sha256']
sampled=[1100,1150,1200,1247,1300,1350,1400,1434]
for z in sampled:
    expected=np.asarray(Image.open(SOURCE/manifest[z]['file']))[650:970,650:950]
    assert np.array_equal(arrays['raw-native-10um.nrrd'][z-1100],expected)
variants=np.load(OUT/'candidate-variants.npz')
assert np.array_equal(variants['sourceOriginSectionYX'],origin)
names=[f'{m}_{t}' for m in ['raw','gaussian06'] for t in [25,30,35]]
masks=[variants[n] for n in names]
assert np.array_equal(arrays['candidate-native-10um.nrrd'],variants['gaussian06_30'])
assert np.array_equal(arrays['six-variant-agreement-10um.nrrd'],np.logical_and.reduce(masks))
assert np.array_equal(arrays['variant-disagreement-10um.nrrd'],np.logical_or.reduce(masks)&~np.logical_and.reduce(masks))
for row in report['trackingSummary']:
    mask=variants[f'{row["method"]}_{row["threshold"]}']
    labels,count=ndi.label(mask)
    assert count==1
    nz=np.flatnonzero(mask.any(axis=(1,2)))
    assert nz[0]+1100==row['firstBottomConnectedSection'] and len(nz)==row['continuousPlaneCount']
    assert np.array_equal(nz,np.arange(nz[0],335))
mesh=trimesh.load(OUT/report['mesh']['file'],process=False)
assert mesh.is_watertight and mesh.is_winding_consistent and mesh.volume>0
assert len(mesh.faces)==report['mesh']['triangles']
points=np.argwhere(variants['gaussian06_30'])
expected_bounds=np.array([points.min(0)-.5,points.max(0)+.5])[:,::-1]*pitch+origin[::-1]*pitch
assert np.allclose(mesh.bounds,expected_bounds,atol=2e-6)
result=dict(passed=True,sourcePNGHashes=335,sourceCoordinateSampledPlanes=sampled,
            volumesVerified=list(arrays),allSixCandidatesHaveOne6ConnectedComponent=True,
            meshBoundsAndTopologyPassed=True,
            scope='File integrity and geometry only; no expert anatomy labels or clinical validation.')
(OUT/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
