"""Exploratory intensity segmentation. Not a clinically reviewed annotation."""
import sys, io, json, zipfile, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from skimage.measure import marching_cubes
from PIL import Image, ImageDraw
import trimesh
OUT = ROOT/'output'; OUT.mkdir(exist_ok=True)
CACHE = ROOT/'cache'; CACHE.mkdir(exist_ok=True)
PITCH = .020

def largest(mask):
    labels, count = ndi.label(mask)
    if not count: return np.zeros_like(mask)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    return labels == sizes.argmax()

if not (CACHE/'volume.npy').exists():
    with zipfile.ZipFile(next((ROOT/'source').glob('*.zip'))) as archive:
        names = sorted(n for n in archive.namelist() if n.lower().endswith('.tiff'))
        planes=[]; boxes=[]
        for i,name in enumerate(names):
            a=np.array(Image.open(io.BytesIO(archive.read(name))))
            tissue=largest(a>80)
            if tissue.sum()>30:
                y,x=np.where(tissue); boxes.append([y.min(),x.min(),y.max()+1,x.max()+1])
            # Full source slice retained on disk in archive. A broad crop reduces RAM.
            planes.append(a[200:900,180:780])
            if i%200==0: print('Read',i,flush=True)
        boxes=np.array(boxes); lo=boxes[:,:2].min(0)-12; hi=boxes[:,2:].max(0)+12
        assert np.all(lo>=[200,180]) and np.all(hi<=[900,780]), (lo,hi)
        vol=np.stack(planes)[:,lo[0]-200:hi[0]-200,lo[1]-180:hi[1]-180]
        np.save(CACHE/'volume.npy',vol)
        (CACHE/'coordinates.json').write_text(json.dumps({'sourceOriginZYX':[0,int(lo[0]),int(lo[1])], 'shapeZYX':list(vol.shape),'pitchMm':PITCH,'axes':'x=source column, y=source row, z=source slice; not anatomical orientation'}))
vol=np.load(CACHE/'volume.npy')
print('Volume',vol.shape,flush=True)
soft=ndi.gaussian_filter(vol.astype(np.float32),.6)

def segment(threshold):
    envelope=np.zeros(vol.shape,bool); additions=0
    for z in range(len(vol)):
        mineral=soft[z]>=threshold
        closed=ndi.binary_closing(mineral,iterations=1)
        additions+=int((closed&~mineral).sum())
        envelope[z]=ndi.binary_fill_holes(largest(closed))
    # Keep one physical specimen, ignoring detached debris.
    envelope=largest(envelope)
    candidates=envelope&(soft<threshold)
    labels,n=ndi.label(candidates); sizes=np.bincount(labels.ravel());sizes[0]=0
    cavity=labels==sizes.argmax() if n else np.zeros_like(envelope)
    return envelope,cavity,{'threshold':threshold,'candidateComponents':int(n),'largestCavityVoxels':int(cavity.sum()),'otherCandidateVoxels':int(candidates.sum()-cavity.sum()),'closingAddedPixels':additions}

stats=[]; nominal=None
for threshold in [65,75,85]:
    envelope,cavity,info=segment(threshold)
    info.update({'envelopeVoxels':int(envelope.sum()),'cavityVolumeMm3':float(cavity.sum()*PITCH**3)})
    if threshold==75:
        nominal=(envelope.copy(),cavity.copy())
        np.savez_compressed(CACHE/'masks.npz',tooth=envelope,pulp=cavity)
    stats.append(info);print(info,flush=True)
tooth,pulp=nominal

def export_mesh(mask,name):
    # No mesh smoothing: the exported surface follows the recorded binary mask.
    vertices,faces,_,_=marching_cubes(np.pad(mask,1).astype(np.uint8),.5,spacing=(PITCH,)*3,allow_degenerate=False)
    origin=np.array(json.loads((CACHE/'coordinates.json').read_text())['sourceOriginZYX'])
    vertices+=(origin-1)*PITCH
    vertices=vertices[:,[2,1,0]] # millimetres, source X/Y/Z
    faces=faces[:,::-1] # parity of axis permutation
    mesh=trimesh.Trimesh(vertices=vertices,faces=faces,process=False)
    if mesh.volume < 0:
        mesh.invert() # Ensure outward winding after marching-cubes/axis conversion.
    mesh.export(OUT/f'{name}.ply')
    mesh.export(OUT/f'{name}.stl')
    return {'vertices':len(vertices),'triangles':len(faces),'watertight':bool(mesh.is_watertight),'boundsMm':mesh.bounds.tolist(),'sha256':hashlib.sha256((OUT/f'{name}.ply').read_bytes()).hexdigest()}

meshstats={name:export_mesh(mask,name) for name,mask in [('tooth',tooth),('pulp',pulp)]}
zs=np.flatnonzero(pulp.any(axis=(1,2)))
print('Cavity slices',zs.min(),zs.max(),flush=True)
summary={'source':'https://doi.org/10.5281/zenodo.3877625','specimen':'Tomo1B','license':'CC BY 4.0','pitchMmProvisional':PITCH,'thresholdSensitivity':stats,'meshes':meshstats,'cavitySliceRange':[int(zs.min()),int(zs.max())],'cavityOutsideEnvelope':int((pulp&~tooth).sum()),'method':'Gaussian sigma 0.6 voxel; threshold 75/255; per-slice one-pixel closing and hole fill; largest 3D enclosed low-intensity component; no mesh smoothing','limitations':['Scale conflict: publisher says 20um, inner folder says 10um','Automatic segmentation, not expert reviewed','Tiny disconnected cavities and side canals may be excluded','Per-slice closure can artificially close openings; apical foramina not validated','Low-density cavity represents space, not living pulp tissue','FDI identity not provided']}
(OUT/'report.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')

# Matched raw / overlay panels at fixed source slice positions, plus orthogonal views.
indexes=np.linspace(zs.min(),zs.max(),8).astype(int)
sheet=Image.new('RGB',(1200,4*320),'#18232b');draw=ImageDraw.Draw(sheet)
for j,z in enumerate(indexes):
    raw=np.repeat(vol[z,:,:,None],3,axis=2)
    overlay=raw.copy();overlay[pulp[z]]=(.45*overlay[pulp[z]]+.55*np.array([242,71,86])).astype('uint8')
    edge=tooth[z]&~ndi.binary_erosion(tooth[z]);overlay[edge]=[64,199,182]
    for k,a in enumerate([raw,overlay]):
        im=Image.fromarray(a);im.thumbnail((290,290));x=(j%2)*600+k*300;y=(j//2)*320
        sheet.paste(im,(x+(300-im.width)//2,y+25));draw.text((x+8,y+5),f'Slice {z+1:04d} / '+('raw' if k==0 else 'segmentation'),fill='white')
sheet.save(OUT/'slice-validation.png')
for axis,name in [(1,'coronal'),(2,'sagittal')]:
    # Sample through cavity centroid, keeping source axes explicit.
    coord=int(np.where(pulp)[axis].mean())
    raw=np.take(vol,coord,axis=axis);pm=np.take(pulp,coord,axis=axis)
    rgb=np.repeat(raw[:,:,None],3,axis=2);rgb[pm]=(.45*rgb[pm]+.55*np.array([242,71,86])).astype('uint8')
    Image.fromarray(rgb).save(OUT/f'{name}-overlay.png')
print(json.dumps(meshstats),flush=True)
