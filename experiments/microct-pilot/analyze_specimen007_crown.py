"""Native-resolution continuity screen of specimen007's coronal candidate.

Uses raw and lightly smoothed images independently, with no ring subtraction,
interpolation, hole filling, or linking across missing layers.
"""
import csv
import gzip
import hashlib
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
from skimage.measure import marching_cubes
import trimesh

SOURCE=ROOT/'source/specimen007'
OUT=ROOT/'output/specimen007-crown';OUT.mkdir(parents=True,exist_ok=True)
ORIGIN=np.array([1100,650,650]);LAST=1434;PITCH=.00999999
SHAPE=(335,320,300);SEED=np.array([791,789])-ORIGIN[1:]
records={r['section']:r for r in json.loads((SOURCE/'manifest.json').read_text())['files']}
assert set(range(1100,1435))<=records.keys(),'Acquire full 1100:1434 interval first'
raw=np.empty(SHAPE,np.uint8);hashes={}
for z in range(1100,1435):
    r=records[z];b=(SOURCE/r['file']).read_bytes();digest=hashlib.sha256(b).hexdigest()
    assert digest==r['sha256']
    a=np.array(Image.open(SOURCE/r['file']));assert a.shape==(1632,1632) and a.dtype==np.uint8
    raw[z-1100]=a[650:970,650:950];hashes[str(z)]=digest


def enclosed(a,t):
    labels,_=ndi.label(a<t)
    size=np.bincount(labels.ravel());size[0]=0
    border=np.unique(np.r_[labels[0],labels[-1],labels[:,0],labels[:,-1]])
    ids=np.flatnonzero(size>=4);ids=ids[~np.isin(ids,border)]
    return np.isin(labels,ids)


def bottom_connected(mask):
    label,n=ndi.label(mask)  # native six-neighbour topology
    cy,cx=SEED
    win=label[-1,cy-12:cy+13,cx-12:cx+13];yy,xx=np.where(win>0)
    assert len(yy), 'No candidate near fixed start anchor'
    d=(yy-12)**2+(xx-12)**2;k=d.argmin();assert d[k]<=144
    root=int(win[yy[k],xx[k]])
    result=label==root
    return result,n


def nrrd(array,name):
    path=OUT/name;o=ORIGIN[::-1]*PITCH
    header=(f'NRRD0005\n# Source axes, not anatomical orientation\ntype: unsigned char\ndimension: 3\n'
            f'space dimension: 3\nsizes: {array.shape[2]} {array.shape[1]} {array.shape[0]}\n'
            f'space directions: ({PITCH},0,0) (0,{PITCH},0) (0,0,{PITCH})\n'
            f'space origin: ({o[0]},{o[1]},{o[2]})\nspace units: "mm" "mm" "mm"\nencoding: gzip\n\n')
    payload=array.astype(np.uint8).tobytes();path.write_bytes(header.encode()+gzip.compress(payload,compresslevel=5,mtime=0))
    decoded=gzip.decompress(path.read_bytes().split(b'\n\n',1)[1]);assert decoded==payload
    return dict(file=name,decodedSha256=hashlib.sha256(decoded).hexdigest(),roundTripPassed=True)


volumes={};summaries=[];profiles=[]
for method in ['raw','gaussian06']:
    for t in [25,30,35]:
        masks=np.empty(SHAPE,bool)
        for k in range(len(raw)):
            a=raw[k] if method=='raw' else ndi.gaussian_filter(raw[k].astype(np.float32),.6)
            masks[k]=enclosed(a,t)
        connected,n=bottom_connected(masks)
        area=connected.sum(axis=(1,2));zs=np.flatnonzero(area)
        assert np.array_equal(zs,np.arange(zs[0],len(raw))), 'Six-connected component cannot skip a plane'
        assert not connected[:,[0,-1],:].any() and not connected[:,:,[0,-1]].any()
        summaries.append(dict(method=method,threshold=t,firstBottomConnectedSection=int(zs[0]+1100),
                              lastSection=1434,continuousPlaneCount=len(zs),voxelCount=int(connected.sum()),
                              maxAreaPixels=int(area.max()),allEnclosed3DComponentCount=n,
                              firstPlaneCensored=bool(zs[0]==0)))
        for k in range(len(raw)):
            points=np.argwhere(connected[k]);contrast=None
            if len(points):
                neighborhood=ndi.binary_dilation(connected[k],iterations=8)&~ndi.binary_dilation(connected[k],iterations=3)
                # Descriptive contrast around this algorithm's own mask, not independent accuracy.
                if neighborhood.any():contrast=float(np.median(raw[k][neighborhood])-np.median(raw[k][connected[k]]))
            profiles.append(dict(section=k+1100,method=method,threshold=t,areaPixels=int(area[k]),
                                 sourceY=float(points[:,0].mean()+650) if len(points) else None,
                                 sourceX=float(points[:,1].mean()+650) if len(points) else None,
                                 localMedianContrastRawGray=contrast))
        volumes[f'{method}_{t}']=connected
        print('CONTINUITY',summaries[-1],flush=True)

reference=volumes['gaussian06_30'];agreement=[]
for name,a in volumes.items():
    inter=int((a&reference).sum());union=int((a|reference).sum())
    agreement.append(dict(variant=name,diceToNominal=2*inter/(int(a.sum())+int(reference.sum())),
                          jaccardToNominal=inter/union))
stable=np.logical_and.reduce(list(volumes.values()))
possible=np.logical_or.reduce(list(volumes.values()))
files=[nrrd(raw,'raw-native-10um.nrrd'),nrrd(reference,'candidate-native-10um.nrrd'),
       nrrd(stable,'six-variant-agreement-10um.nrrd'),nrrd(possible&~stable,'variant-disagreement-10um.nrrd')]
np.savez_compressed(OUT/'candidate-variants.npz',**volumes,sourceOriginSectionYX=ORIGIN)

v,f,_,_=marching_cubes(np.pad(reference,1),.5,allow_degenerate=False)
v=((v-1+ORIGIN)[:,::-1]*PITCH)
mesh=trimesh.Trimesh(vertices=v,faces=f,process=False)
if mesh.volume<0:mesh.invert()
assert mesh.is_watertight and mesh.is_winding_consistent
mesh.export(OUT/'partial-coronal-candidate.ply')

first=int(np.flatnonzero(reference.any(axis=(1,2)))[0]+1100)
selected=sorted(set([1100,1150,1200,1247,1350,1434]+[max(1100,first-1),first]))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
w,h=340,375
sheet=Image.new('RGB',(w*3,h*len(selected)+50),'#f1f4f3');draw=ImageDraw.Draw(sheet)
for c,title in enumerate(['Raw PNG, same window','Nominal candidate','Agreement / disagreement']):
    draw.text((c*w+10,10),title,font=font,fill='#193d36')
for row,z in enumerate(selected):
    k=z-1100;gray=(np.clip(raw[k].astype(float)/90,0,1)*255).astype(np.uint8)
    rgb=np.repeat(gray[...,None],3,axis=2);overlay=rgb.copy();overlay[reference[k]]=[36,178,146]
    confidence=rgb.copy();confidence[stable[k]]=[36,178,146];confidence[(possible&~stable)[k]]=[220,144,47]
    for col,a in enumerate([rgb,overlay,confidence]):
        im=Image.fromarray(a);im.thumbnail((w-15,h-40));sheet.paste(im,(col*w+(w-im.width)//2,50+row*h+25))
    draw.text((10,50+row*h),f'Section {z}',font=font,fill='#193d36')
sheet.save(OUT/'source-and-candidates.png')

projection=Image.new('RGB',(900,530),'#f1f4f3');d=ImageDraw.Draw(projection)
for col,axis in enumerate([1,2]):
    occupied=reference.any(axis=axis);u=possible.any(axis=axis);core=stable.any(axis=axis)
    rgb=np.full((*occupied.shape,3),241,np.uint8);rgb[u]=[220,144,47];rgb[occupied]=[36,148,126];rgb[core]=[20,91,78]
    im=Image.fromarray(rgb);im=im.resize((im.width,im.height),Image.Resampling.NEAREST)
    projection.paste(im,(col*450+(450-im.width)//2,70))
    d.text((col*450+20,20),'Source '+('ZX' if axis==1 else 'ZY')+' projection',font=font,fill='#193d36')
d.text((20,465),'Partial coronal interval only. Lower end is cut, not an apical foramen.',font=font,fill='#193d36')
d.text((20,493),'Dark green: agreement; green: nominal; amber: other candidates.',font=font,fill='#193d36')
projection.save(OUT/'partial-projections.png')
with (OUT/'profiles.csv').open('w',newline='',encoding='utf8') as f:
    writer=csv.DictWriter(f,fieldnames=list(profiles[0]));writer.writeheader();writer.writerows(profiles)
report=dict(specimen='007',sourceRange=[1100,1434],sourceCropYX=[650,970,650,950],
            sourceOriginSectionYX=ORIGIN.tolist(),pixelPitchMm=PITCH,sourceHashes=hashes,
            seedSourceYX=[791,789],trackingSummary=summaries,methodAgreement=agreement,
            agreementVoxels=int(stable.sum()),unionVoxels=int(possible.sum()),volumes=files,
            mesh=dict(file='partial-coronal-candidate.ply',triangles=len(mesh.faces),vertices=len(mesh.vertices),
                      watertight=True,windingConsistent=True,artificialBottomCap=True),
            limitations=['Only 1100..1434 acquired continuously; no whole-tooth or whole-system reconstruction.',
                         'Shared thresholds are exploratory, not tissue calibration; same cohort does not mean same grayscale distribution.',
                         'Agreement is method stability, not independent anatomy validation; raw anchor was selected from a visible dark region.',
                         'Ring artifacts remain. No normal-status, exact chamber boundary, root count or classification established.',
                         'The bottom plane is an acquisition interval cut and its mesh cap is artificial.',
                         'License unconfirmed; local research only.'])
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('EXPORTED',len(mesh.faces),'triangles',flush=True)
