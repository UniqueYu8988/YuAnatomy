"""Local research volumes and surface; no website integration or inferred missing anatomy."""
import sys,json,gzip,hashlib,argparse
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('--no-preview',action='store_true',help='Export data only; do not render the costly static figure')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from skimage.measure import marching_cubes
from PIL import Image
import trimesh
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
OUT=ROOT/'output/root-study';OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((ROOT/'output/root-tracking/report.json').read_text())
branch=np.load(ROOT/'output/cohort-branch/threshold30.npz')['terminalConnectedComponents']
tracks=np.load(ROOT/'cache/root-tracking/tracks.npy',mmap_mode='r')
rawroot=np.load(ROOT/'cache/root-tracking/raw.npy',mmap_mode='r')
p=np.argwhere(branch);lo=p[:,1:].min(0);hi=p[:,1:].max(0)+1
for z in range(len(tracks)):
    q=np.argwhere(tracks[z]>0)
    if len(q):lo=np.minimum(lo,q.min(0));hi=np.maximum(hi,q.max(0)+1)
lo=np.maximum(lo-25,0);hi=np.minimum(hi+25,branch.shape[1:]);ys=slice(lo[0],hi[0]);xs=slice(lo[1],hi[1])
shape=(len(branch)+len(tracks)-1,*(hi-lo));labels=np.zeros(shape,np.uint8)
labels[:len(branch)]=branch[:,ys,xs];labels[len(branch):]=tracks[1:,ys,xs]>0
source_origin=np.array([1681,350+int(lo[0]),480+int(lo[1])]);pitch=.00999999
raw=np.lib.format.open_memmap(ROOT/'cache/root-tracking/combined-raw.npy',mode='w+',dtype=np.uint8,shape=shape)
for i,z in enumerate(range(1681,2005)):
    raw[i]=np.array(Image.open(ROOT/f'source/cohort-branch/Tooth045_rec{z:08}.png'))[source_origin[1]:350+hi[0],source_origin[2]:480+hi[1]]
raw[len(branch):]=rawroot[1:,ys,xs];raw.flush()
def nrrd(a,name):
    path=OUT/name;origin=source_origin[[2,1,0]]*pitch
    header=(f'NRRD0005\n# Source image axes; not patient anatomical orientation\n# Candidate segmentation; not expert validated\ntype: unsigned char\ndimension: 3\nspace dimension: 3\nsizes: {a.shape[2]} {a.shape[1]} {a.shape[0]}\nspace directions: ({pitch},0,0) (0,{pitch},0) (0,0,{pitch})\nspace origin: ({origin[0]},{origin[1]},{origin[2]})\nspace units: "mm" "mm" "mm"\nencoding: gzip\n\n').encode()
    digest=hashlib.sha256()
    with path.open('wb') as f:
        f.write(header)
        with gzip.GzipFile(fileobj=f,mode='wb',compresslevel=1,mtime=0) as g:
            for z in range(0,len(a),32):
                b=a[z:z+32].tobytes();digest.update(b);g.write(b)
    actual=hashlib.sha256();size=0
    with path.open('rb') as f:
        while f.readline()!=b'\n':pass
        with gzip.GzipFile(fileobj=f,mode='rb') as g:
            while b:=g.read(1024*1024):actual.update(b);size+=len(b)
    assert actual.hexdigest()==digest.hexdigest() and size==a.size
    return {'file':name,'decodedSha256':actual.hexdigest(),'decodedBytes':size,'roundTripVerified':True}
files=[nrrd(raw,'raw-canal-roi.nrrd'),nrrd(labels,'candidate-lumen.nrrd')]
np.savez_compressed(OUT/'candidate-labels.npz',labels=labels,sourceOriginSectionYX=source_origin)
v,f,_,_=marching_cubes(np.pad(labels,1),.5)
v=(v+source_origin-1)[:,[2,1,0]]*pitch
mesh=trimesh.Trimesh(vertices=v,faces=f,process=False)
if mesh.volume<0:mesh.invert()
assert mesh.is_watertight and mesh.is_winding_consistent
mesh.export(OUT/'candidate-root-system.ply')
_,components=ndi.label(labels)
# Compare the two interface planes explicitly; no interpolation at the dataset join.
join=[int((((tracks[1,ys,xs]&bit)>0)&(labels[len(branch)-1]>0)).sum()) for bit in [1,2]]
if not args.no_preview:
    fig=plt.figure(figsize=(12,7),facecolor='#f4f6f5')
    for i,azimuth in enumerate([0,65,125]):
        ax=fig.add_subplot(1,3,i+1,projection='3d');ax.set_facecolor('#f4f6f5')
        ax.plot_trisurf(mesh.vertices[:,0],mesh.vertices[:,1],mesh.vertices[:,2],triangles=mesh.faces,color='#318f82',linewidth=0,antialiased=False,shade=True)
        size=np.ptp(mesh.vertices,axis=0);ax.set_box_aspect(size);ax.view_init(elev=10,azim=azimuth);ax.set_axis_off();ax.set_title(f'View {i+1}',fontsize=11)
    fig.suptitle('Specimen 045: partial root-system candidate\nSource sections 1681–2973; missing/open regions are not filled',fontsize=13)
    fig.tight_layout();fig.savefig(OUT/'three-dimensional-candidate.png',dpi=160);plt.close(fig)
summary={'sourceSectionRange':[1681,2973],'sourceOriginSectionYX':source_origin.tolist(),'shapeZYX':[int(n) for n in shape],'pixelSizeMmFromSourceLog':pitch,'volumes':files,'meshFaces':len(mesh.faces),'meshVertices':len(mesh.vertices),'voxelComponents6':int(components),'joinOverlapPixelsAandB':join,'limitations':['Partial root system, not whole tooth or crown.','Candidate ends and interval boundaries produce artificial caps.','Disconnected segments are preserved, not repaired.','Branch region uses 3D Gaussian; downstream tracking uses 2D Gaussian.','NRRD axes are source image axes, not patient anatomical axes.','No explicit data redistribution license; local research only.']}
(OUT/'manifest.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2),flush=True)
