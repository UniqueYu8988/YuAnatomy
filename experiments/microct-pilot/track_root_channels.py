"""Track two enclosed lumen candidates toward the apex and record open/uncertain states.
No interpolation across missing sections; no exterior region is called pulp.
"""
import sys,json,csv,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
OUT=ROOT/'output/root-tracking';OUT.mkdir(parents=True,exist_ok=True)
CACHE=ROOT/'cache/root-tracking';CACHE.mkdir(parents=True,exist_ok=True)
y0,y1,x0,x1=350,1120,480,1150
sections=list(range(2004,2974));shape=(len(sections),y1-y0,x1-x0)
nominal=np.lib.format.open_memmap(CACHE/'tracks.npy',mode='w+',dtype=np.uint8,shape=shape)
rawcache=np.lib.format.open_memmap(CACHE/'raw.npy',mode='w+',dtype=np.uint8,shape=shape)
envcache=np.lib.format.open_memmap(CACHE/'envelope.npy',mode='w+',dtype=np.uint8,shape=shape)
initial=np.array([[633.92,820.49],[828.12,727.89]])-[y0,x0]
state={t:[{'point':p.copy(),'missing':0,'previous':None} for p in initial] for t in [25,30,35]}
manifest={}
for folder in ['cohort-branch','cohort-2005-2973']:
    for item in json.loads((ROOT/'source'/folder/'manifest.json').read_text())['files']:manifest[item['section']]=(ROOT/'source'/folder/item['file'],item['sha256'])
rows=[];summary=[]
for zi,z in enumerate(sections):
    path,digest=manifest[z];assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
    raw=np.array(Image.open(path))[y0:y1,x0:x1];rawcache[zi]=raw
    soft=ndi.gaussian_filter(raw.astype(np.float32),.6) # In-plane only; explicitly different from earlier 3D Gaussian.
    for threshold in [25,30,35]:
        mineral=soft>=threshold;ml,n=ndi.label(mineral);ms=np.bincount(ml.ravel());ms[0]=0
        body=ml==ms.argmax() if ms.max()>=100 else np.zeros(raw.shape,bool)
        envelope=ndi.binary_fill_holes(body)
        if threshold==30:envcache[zi]=envelope
        low=soft<threshold;ll,n=ndi.label(low);sizes=np.bincount(ll.ravel());sizes[0]=0
        borderids=set(np.unique(np.concatenate([ll[0],ll[-1],ll[:,0],ll[:,-1]])).tolist())
        inside=low&envelope
        ids=np.unique(ll[inside]);ids=[int(i) for i in ids if i and i not in borderids and sizes[i]>=4]
        centers=ndi.center_of_mass(low,ll,ids) if ids else []
        # Preserve local anchors and allow a shared component. Do not force independent tubes.
        assigned={}
        for track,s in enumerate(state[threshold]):
            if s['missing']>3:continue
            cy,cx=np.round(s['point']).astype(int);cy=int(np.clip(cy,12,raw.shape[0]-13));cx=int(np.clip(cx,12,raw.shape[1]-13))
            window=ll[cy-12:cy+13,cx-12:cx+13];candidate=np.isin(window,ids);yy,xx=np.where(candidate)
            if len(yy):
                distance=(yy-12)**2+(xx-12)**2;k=distance.argmin()
                if distance[k]<=12**2:assigned[track]=ids.index(int(window[yy[k],xx[k]]))
        for track,s in enumerate(state[threshold]):
            status='missing';area=0;touches_previous=False;centroid=s['point'].copy();near_tissue=0
            if track in assigned:
                j=assigned[track];component=ll==ids[j];area=int(component.sum())
                shared=len(assigned)==2 and assigned.get(0)==assigned.get(1)
                if shared:
                    points=np.argwhere(component);centroid=points[np.linalg.norm(points-s['point'],axis=1).argmin()].astype(float)
                else:centroid=np.array(centers[j])
                touches_previous=s['previous'] is not None and bool((component&s['previous']).any())
                status='shared-component' if shared else 'enclosed' if s['missing']==0 else 'reacquired'
                s['point']=centroid;s['missing']=0;s['previous']=component
                if threshold==30:nominal[zi][component]|=1<<track
            else:
                cy,cx=np.round(s['point']).astype(int);cy=int(np.clip(cy,4,raw.shape[0]-5));cx=int(np.clip(cx,4,raw.shape[1]-5))
                window=ll[cy-3:cy+4,cx-3:cx+4];yy,xx=np.where(window>0)
                if len(yy):
                    k=np.argmin((yy-3)**2+(xx-3)**2);label=int(window[yy[k],xx[k]])
                    near_tissue=int(body[max(0,cy-25):cy+26,max(0,cx-25):cx+26].sum())
                    if label in borderids:status='external-connected' if near_tissue>=20 else 'background'
                s['missing']+=1;s['previous']=None
            rows.append({'threshold':threshold,'section':z,'track':'A' if track==0 else 'B','state':status,'areaPixels':area,'sourceY':float(centroid[0]+y0),'sourceX':float(centroid[1]+x0),'overlapWithPreviousSlice':touches_previous,'nearbyTissuePixelsWhenUnmatched':near_tissue})
    if zi%100==0:print('TRACKED',z,flush=True)
nominal.flush();rawcache.flush();envcache.flush()
for t in [25,30,35]:
    for track in ['A','B']:
        r=[x for x in rows if x['threshold']==t and x['track']==track];closed=[x['section'] for x in r if x['areaPixels']>0]
        opening=None
        for i in range(1,len(r)-2):
            if r[i-1]['areaPixels']>0 and all(x['state']=='external-connected' for x in r[i:i+3]):opening=r[i]['section'];break
        shared=[x['section'] for x in r if x['state']=='shared-component']
        summary.append({'threshold':t,'track':track,'lastEnclosedSection':max(closed) if closed else None,'firstThreeSliceExternalTransition':opening,'sharedSectionCount':len(shared),'sharedSectionRange':[min(shared),max(shared)] if shared else None,'reacquiredSections':[x['section'] for x in r if x['state']=='reacquired'],'unmatchedBeforeLastEnclosed':[x['section'] for x in r if x['areaPixels']==0 and closed and x['section']<max(closed)],'noDirectOverlapSections':[x['section'] for x in r[1:] if x['areaPixels'] and not x['overlapWithPreviousSlice']]})
with (OUT/'profiles.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
(OUT/'report.json').write_text(json.dumps({'sourceSections':[2004,2973],'originSectionYX':[2004,y0,x0],'shapeZYX':list(shape),'sourceHashesPassed':True,'summary':summary,'method':'2D Gaussian sigma0.6, three thresholds, local-anchor component tracking (12 voxel limit), shared components allowed; no fill across missing slices','limitations':['A/B are arbitrary tracking labels, not anatomical names. Their identity after shared regions is provisional.','External-connected state means nearby low intensity reaches image edge while tissue remains nearby, not a confirmed foramen.','Three-frame transition is a screening rule, not medical validation.','Reacquisition does not demonstrate continuity across a gap.','Largest tissue component can omit separate root fragments.','No clinical dimension or full-tooth classification inferred.']},indent=2))
# Full-source-axis vertical maximum projection of tracked candidates, no web viewer.
projection=np.zeros((len(sections),shape[2],3),np.uint8)
for zi in range(len(sections)):
    projection[zi,(nominal[zi]&1).any(axis=0)]=[42,200,165]
    projection[zi,(nominal[zi]&2).any(axis=0)]=[230,126,68]
Image.fromarray(projection).save(OUT/'tracked-source-zx-projection.png')
print(json.dumps(summary,indent=2),flush=True)
