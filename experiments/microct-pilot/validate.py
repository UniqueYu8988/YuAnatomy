"""Independent source/alignment and mesh checks; no medical-ground-truth claim."""
import sys,json,hashlib,zipfile,io
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import trimesh
record=json.loads((ROOT/'source/record.json').read_text())
assert record['metadata']['license']['id']=='cc-by-4.0'
source=next((ROOT/'source').glob('*.zip'))
entry=next(f for f in record['files'] if f['key']==source.name)
assert 'md5:'+hashlib.md5(source.read_bytes()).hexdigest()==entry['checksum']
vol=np.load(ROOT/'cache/volume.npy',mmap_mode='r')
coords=json.loads((ROOT/'cache/coordinates.json').read_text());z0,y0,x0=coords['sourceOriginZYX']
masks=np.load(ROOT/'cache/masks.npz');tooth=masks['tooth'];pulp=masks['pulp']
assert tooth.shape==pulp.shape==vol.shape
assert not (pulp&~tooth).any()
assert ndi.label(pulp)[1]==1
assert not tooth[[0,-1]].any() and not tooth[:,[0,-1]].any() and not tooth[:,:,[0,-1]].any(), 'Specimen touches crop boundary'
with zipfile.ZipFile(source) as archive:
    names=sorted(n for n in archive.namelist() if n.endswith('.tiff'))
    for z in [0,92,232,337,442,547,653,758,863,969,1017]:
        raw=np.array(Image.open(io.BytesIO(archive.read(names[z]))))
        assert np.array_equal(vol[z],raw[y0:y0+vol.shape[1],x0:x0+vol.shape[2]])
        assert np.array_equal(np.array(Image.open(ROOT/f'output/slices/{z:04d}.png')),vol[z])
        overlay=np.array(Image.open(ROOT/f'output/slices/{z:04d}-mask.png'))
        assert np.array_equal(overlay[:,:,3]>0,pulp[z])
results={}
for name,mask in [('tooth',tooth),('pulp',pulp)]:
    mesh=trimesh.load(ROOT/f'output/{name}.ply',force='mesh',process=False)
    assert mesh.is_watertight and mesh.is_winding_consistent
    assert mesh.volume > 0, 'Surface winding must point outward'
    assert np.isfinite(mesh.vertices).all()
    # Mesh centroid samples should land near the binary isosurface in source coordinates.
    triangles=mesh.triangles_center[::max(1,len(mesh.faces)//5000)]
    voxel=(triangles[:,[2,1,0]]/.020-np.array(coords['sourceOriginZYX'])).T
    surface=ndi.map_coordinates(mask.astype(np.float32),voxel,order=1,mode='constant')
    assert np.all((surface>.05)&(surface<.95)), 'Surface/source transform inconsistent'
    results[name]={'faces':len(mesh.faces),'watertight':True,'windingConsistent':True,'signedVolumeMm3':float(mesh.volume),'maskVolumeMm3':float(mask.sum()*.020**3),'surfaceSamplesChecked':len(surface)}
# Negative coordinate fixture: translating a mesh far from source must not pass.
shifted=voxel.copy();shifted[0]+=10000
assert not np.any(ndi.map_coordinates(mask.astype(np.float32),shifted,order=1,mode='constant')>.05)
(ROOT/'output/validation.json').write_text(json.dumps(results,indent=2))
print('PASS: source checksum/license; raw crop and PNG identity; all mask containment; cavity connectivity; closed consistent surfaces; source-coordinate sampling; displaced negative fixture.')
print(json.dumps(results,indent=2))
