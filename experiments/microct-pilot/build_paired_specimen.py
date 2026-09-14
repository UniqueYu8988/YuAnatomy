"""Paired same-specimen overview and native-grid cavity candidate, local research only."""
import sys,json,gzip,hashlib,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--prepare-existing',action='store_true');parser.add_argument('--export-partial',action='store_true');args=parser.parse_args()
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from skimage.measure import marching_cubes
from PIL import Image,ImageDraw
import trimesh
OUT=ROOT/('output/paired-specimen-partial' if args.export_partial else 'output/paired-specimen');OUT.mkdir(parents=True,exist_ok=True)
CACHE=ROOT/'cache/paired-specimen-v2';CACHE.mkdir(parents=True,exist_ok=True)
origin=np.array([389,300,250]);shape=(2585,880,950);pitch=.00999999
manifest={}
for folder in ['cohort-389-1680','cohort-branch','cohort-2005-2973']:
    mp=ROOT/'source'/folder/'manifest.json'
    if (args.prepare_existing or args.export_partial) and not mp.exists():mp=mp.with_name('manifest.partial.json')
    if args.prepare_existing and not mp.exists():continue
    for i in json.loads(mp.read_text())['files']:
        manifest[i['section']]=(ROOT/'source'/folder/i['file'],i['sha256'])
if not (args.prepare_existing or args.export_partial):assert sorted(manifest)==list(range(389,2974))
overviewshape=(1293,440,475)
def cache(name):
    p=CACHE/name
    a=np.lib.format.open_memmap(p,mode='r+' if p.exists() else 'w+',dtype=np.uint8,shape=overviewshape)
    assert a.shape==overviewshape and a.dtype==np.uint8
    return a
raw=cache('raw-overview.npy');tissue=cache('tissue-overview.npy');envelope=cache('envelope-overview.npy')
checkpoint=CACHE/'overview-checkpoint.json'
stats=json.loads(checkpoint.read_text()) if checkpoint.exists() else []
completed={r['section']:r for r in stats}
def save_checkpoint():
    raw.flush();tissue.flush();envelope.flush()
    tmp=checkpoint.with_suffix('.tmp');tmp.write_text(json.dumps(stats));tmp.replace(checkpoint)
for j,z in enumerate(range(389,2974,2)):
    if z not in manifest:continue
    path,digest=manifest[z];assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
    if z in completed:
        assert completed[z]['sourceSha256']==digest
        continue
    full=np.array(Image.open(path));assert full.shape==(1632,1632) and full.dtype==np.uint8
    a=full[300:1180,250:1200];soft=ndi.gaussian_filter(a.astype(np.float32),.6)
    labels,_=ndi.label(soft>=30);sizes=np.bincount(labels.ravel());sizes[0]=0
    ids=np.flatnonzero(sizes>=500);body=np.isin(labels,ids)
    border=bool(body[[0,-1]].any() or body[:,[0,-1]].any())
    assert not border,f'Tissue at crop boundary: {z}; expand crop rather than clip'
    filled=ndi.binary_fill_holes(body)
    raw[j]=a[::2,::2];tissue[j]=body[::2,::2];envelope[j]=filled[::2,::2]
    stats.append({'section':z,'sourceSha256':digest,'retainedTissueComponents':len(ids),'fullGridTissuePixels':int(body.sum()),'fullGridEnvelopePixels':int(filled.sum())})
    if j%100==0:save_checkpoint();print('PAIRED OVERVIEW',z,flush=True)
raw.flush();tissue.flush();envelope.flush()
save_checkpoint()
if args.prepare_existing:
    print('PREPARED EXISTING',len(stats),'overview slices; no complete model claimed',flush=True);sys.exit(0)
if not args.export_partial:assert len(stats)==1293
stats.sort(key=lambda r:r['section'])
crownpath=ROOT/'cache/crown-extension/candidate.npy'
crownreport=ROOT/'output/crown-extension/report.json'
crownready=False
if crownpath.exists() and crownreport.exists():
    cr=json.loads(crownreport.read_text())
    crownready=cr.get('sourceHashesPassed') is True and cr.get('sourceOriginSectionYX')==origin.tolist() and cr.get('sourceRange')==[389,1681]
crown=np.load(crownpath,mmap_mode='r') if crownready else None
if crown is not None:assert crown.shape==(1293,*shape[1:])
if not args.export_partial:assert crown is not None
old=np.load(ROOT/'output/root-study/candidate-labels.npz');root=old['labels'];ro=old['sourceOriginSectionYX']
combined=np.lib.format.open_memmap(CACHE/'candidate-native.npy',mode='w+',dtype=np.uint8,shape=shape)
if crown is not None:combined[:1292]=crown[:1292]
ry=int(ro[1]-origin[1]);rx=int(ro[2]-origin[2]);rz=int(ro[0]-origin[0])
combined[rz:rz+len(root),ry:ry+root.shape[1],rx:rx+root.shape[2]]=root
combined.flush()
join=int((combined[1291]&combined[1292]).sum())
outside=int(((combined[::2,::2,::2]>0)&~(envelope>0)).sum())

def nrrd(a,name,step):
    path=OUT/name;p=pitch*step;o=origin[::-1]*pitch
    header=(f'NRRD0005\n# Source axes, not patient orientation\ntype: unsigned char\ndimension: 3\nspace dimension: 3\nsizes: {a.shape[2]} {a.shape[1]} {a.shape[0]}\nspace directions: ({p},0,0) (0,{p},0) (0,0,{p})\nspace origin: ({o[0]},{o[1]},{o[2]})\nspace units: "mm" "mm" "mm"\nencoding: gzip\n\n').encode()
    digest=hashlib.sha256()
    with path.open('wb') as f:
        f.write(header)
        with gzip.GzipFile(fileobj=f,mode='wb',compresslevel=1,mtime=0) as g:
            for z in range(0,len(a),16):
                b=a[z:z+16].tobytes();g.write(b);digest.update(b)
    check=hashlib.sha256();size=0
    with path.open('rb') as f:
        while f.readline()!=b'\n':pass
        with gzip.GzipFile(fileobj=f,mode='rb') as g:
            while b:=g.read(1024*1024):check.update(b);size+=len(b)
    assert size==a.size and check.hexdigest()==digest.hexdigest()
    return {'file':name,'sourceSamplingStep':step,'decodedSha256':check.hexdigest(),'decodedBytes':size,'roundTripPassed':True}

files=[nrrd(raw,'raw-overview-20um.nrrd',2),nrrd(tissue,'tissue-overview-20um.nrrd',2),
       nrrd(envelope,'envelope-overview-20um.nrrd',2),nrrd(combined,'cavity-candidate-10um.nrrd',1)]
observed=np.array([z in manifest for z in range(389,2974,2)],np.uint8)
files.append(nrrd(np.broadcast_to(observed[:,None,None],overviewshape),'observed-overview-20um.nrrd',2))
def surface(a,name,step,sourceorigin,method='lewiner'):
    v,f,_,_=marching_cubes(np.pad(a,1),.5,allow_degenerate=False,method=method)
    v=((v-1)*step+sourceorigin)[:,::-1]*pitch
    m=trimesh.Trimesh(vertices=v,faces=f,process=False)
    if m.volume<0:m.invert()
    assert m.is_watertight and m.is_winding_consistent
    m.export(OUT/name)
    return {'file':name,'triangles':len(m.faces),'vertices':len(m.vertices),'watertight':True,'marchingCubesMethod':method,'isoLevel':.5}
# 40um surface only for the outer overview; native source files remain unchanged.
meshes=[surface(envelope[::2,::2,::2],'tooth-envelope-overview-40um.ply',4,origin,method='lorensen')]
points=[]
for z in range(len(combined)):
    q=np.argwhere(combined[z]>0)
    if len(q):points.append([z,*q.min(0),*q.max(0)])
points=np.array(points);zmin,zmax=int(points[:,0].min()),int(points[:,0].max())
lo=points[:,1:3].min(0);hi=points[:,3:5].max(0)+1
small=np.array(combined[zmin:zmax+1,lo[0]:hi[0],lo[1]:hi[1]])
meshes.append(surface(small,'cavity-candidate-native.ply',1,origin+[zmin,*lo]))
# Source-axis orthographic occupancy projections; do not infer topology from a projection.
sheet=Image.new('RGB',(1120,1100),'#f1f4f3');draw=ImageDraw.Draw(sheet)
for col,axis in enumerate([1,2]):
    silhouette=envelope.any(axis=axis);cav=combined[::2,::2,::2].any(axis=axis)
    rgb=np.full((*silhouette.shape,3),241,np.uint8);rgb[silhouette]=[190,201,198];rgb[cav]=[21,120,106]
    rgb[observed==0]=[230,198,190]
    im=Image.fromarray(rgb);im.thumbnail((510,1000));sheet.paste(im,(col*560+(560-im.width)//2,60))
    draw.text((col*560+20,20),'Specimen 045: source '+('ZX' if axis==1 else 'ZY')+' projection',fill='#183e38')
draw.text((20,1070),'Gray: envelope. Green: candidate. Pink: missing source planes. Projection is not a containment proof.',fill='#183e38')
sheet.save(OUT/'paired-source-projections.png')
report={'sourceSections':[389,2973],'sourcePNGCount':len(manifest),'completeSourceAcquisition':len(manifest)==2585,
        'crownTrackingExecuted':crown is not None,'missingSourceSections':sorted(set(range(389,2974))-manifest.keys()),'originSectionYX':origin.tolist(),
        'sourcePixelPitchMm':pitch,'overviewSampling':'Every second source voxel (point sampling, not averaged); aliasing possible.',
        'outerSurfaceSampling':'Every fourth source voxel; visualization only, not native-resolution morphology.',
        'volumes':files,'meshes':meshes,'crownRootJoinOverlapPixels':join,
        'candidateOutsideEnvelopeAtOverviewSamples':outside,'sliceProfiles':stats,
        'limitations':['Missing source planes are unknown, not background; check observed volume. Mesh gaps create artificial caps.',
        'Candidate cavity may terminate before the anatomical pulp chamber; inspect crown report.',
        'Envelope fills enclosed 2D holes; it is not a separate histological enamel/dentin segmentation.',
        'External crown separations are not synthetically repaired. Tissue threshold and 500-pixel filter are heuristic.',
        'Containment uses related segmentation and is not independent medical validation.',
        'Mixed upstream 3D and downstream 2D smoothing remains in candidate; not suitable for clinical measurements.',
        'Only one specimen; no normal-status or whole-system classification established.',
        'No confirmed data redistribution license; local research only.']}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='sliceProfiles'},indent=2),flush=True)
