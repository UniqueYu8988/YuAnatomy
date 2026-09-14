"""Follow existing root lumen coronally without bridging missing or exterior voxels."""
import sys,json,csv,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
OUT=ROOT/'output/crown-extension';OUT.mkdir(parents=True,exist_ok=True)
CACHE=ROOT/'cache/crown-extension';CACHE.mkdir(parents=True,exist_ok=True)
y0,y1,x0,x1=300,1180,250,1200
shape=(1293,y1-y0,x1-x0)
candidate=np.lib.format.open_memmap(CACHE/'candidate.npy',mode='w+',dtype=np.uint8,shape=shape)
manifest={}
for folder in ['cohort-389-1680','cohort-branch']:
    for i in json.loads((ROOT/'source'/folder/'manifest.json').read_text())['files']:
        manifest[i['section']]=(ROOT/'source'/folder/i['file'],i['sha256'])
branch=np.load(ROOT/'output/cohort-branch/threshold30.npz')['terminalConnectedComponents'][0]
p=np.argwhere(branch);center=p.mean(0);seed=p[np.linalg.norm(p-center,axis=1).argmin()]+[350-y0,480-x0]
states={t:{'point':seed.astype(float).copy(),'missing':0,'previous':None} for t in [25,30,35]}
rows=[]
for z in range(1681,388,-1):
    path,sha=manifest[z];assert hashlib.sha256(path.read_bytes()).hexdigest()==sha
    raw=np.array(Image.open(path))[y0:y1,x0:x1]
    soft=ndi.gaussian_filter(raw.astype(np.float32),.6)
    for t,s in states.items():
        labels,_=ndi.label(soft<t);sizes=np.bincount(labels.ravel());sizes[0]=0
        borders=np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]))
        ids=np.flatnonzero(sizes>=4);ids=ids[~np.isin(ids,borders)]
        point=s['point'];cy,cx=np.round(point).astype(int);cy=int(np.clip(cy,12,len(raw)-13));cx=int(np.clip(cx,12,raw.shape[1]-13))
        status='stopped-after-gap';area=0;overlap=False
        if s['missing']<=3:
            window=labels[cy-12:cy+13,cx-12:cx+13];yy,xx=np.where(np.isin(window,ids))
            label=0
            if len(yy):
                d=(yy-12)**2+(xx-12)**2;k=d.argmin()
                if d[k]<=144:label=int(window[yy[k],xx[k]])
            if label:
                mask=labels==label;area=int(mask.sum());p=np.argwhere(mask)
                overlap=s['previous'] is not None and bool((mask&s['previous']).any())
                status='enclosed' if s['missing']==0 else 'reacquired'
                s.update(point=p.mean(0),missing=0,previous=mask)
                if t==30:candidate[z-389]=mask
            else:
                status='external-at-anchor' if int(labels[cy,cx]) in borders else 'no-enclosed-candidate'
                s['missing']+=1;s['previous']=None
        rows.append({'section':z,'threshold':t,'state':status,'areaPixels':area,
                     'sourceY':float(s['point'][0]+y0),'sourceX':float(s['point'][1]+x0),
                     'overlapPreviousPlane':overlap,'allEnclosedComponentsAtLeast4Pixels':len(ids),
                     'largestEnclosedAreaPixels':int(sizes[ids].max()) if len(ids) else 0})
    if (1681-z)%100==0:print('CROWN',z,flush=True)
candidate.flush()
with (OUT/'profiles.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary=[]
for t in states:
    r=[x for x in rows if x['threshold']==t];kept=[x['section'] for x in r if x['areaPixels']]
    summary.append({'threshold':t,'firstCandidateSection':min(kept) if kept else None,
                    'maxAreaPixels':max(x['areaPixels'] for x in r),
                    'reacquiredSections':[x['section'] for x in r if x['state']=='reacquired'],
                    'noOverlapWhileDetected':[x['section'] for x in r[1:] if x['areaPixels'] and not x['overlapPreviousPlane']]})
report={'sourceRange':[389,1681],'sourceOriginSectionYX':[389,y0,x0],
        'seedSourceYX':(seed+[y0,x0]).tolist(),'summary':summary,'sourceHashesPassed':True,
        'limitations':['Only enclosed low-intensity regions are tracked. Open crown defects are not filled.',
        'Failure to track cannot establish absence of pulp space or its anatomical coronal limit.',
        'Ring artifacts can form enclosed low regions; continuity alone is not anatomical validation.',
        'No interpolation across missing layers; reacquired regions need separate review.']}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
first=next(x['firstCandidateSection'] for x in summary if x['threshold']==30)
selected=sorted(set([712,1035,1358,1550,1681]+[max(389,first+d) for d in [-10,-1,0,10]]))
sheet=Image.new('RGB',(1080,len(selected)*300),'#18232b');draw=ImageDraw.Draw(sheet)
for row,z in enumerate(selected):
    raw=np.array(Image.open(manifest[z][0]))[y0:y1,x0:x1]
    rgb=np.repeat((np.clip(raw.astype(float)/90,0,1)*255).astype('uint8')[:,:,None],3,axis=2)
    overlay=rgb.copy();mask=candidate[z-389]>0;overlay[mask]=[45,210,160]
    for col,a in enumerate([rgb,overlay]):
        im=Image.fromarray(a);im.thumbnail((500,270));sheet.paste(im,(col*540+(540-im.width)//2,row*300+25))
        draw.text((col*540+15,row*300+5),f'Source {z}: '+('raw' if col==0 else 'candidate, no gap filling'),fill='white')
sheet.save(OUT/'crown-source-comparison.png')
print(json.dumps(report,indent=2),flush=True)
