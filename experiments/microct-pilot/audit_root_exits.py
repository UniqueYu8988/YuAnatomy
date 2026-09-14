"""Independent raw-intensity paths near tracking endpoints; never count them as foramina."""
import sys,json,csv
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from skimage.graph import MCP
from PIL import Image,ImageDraw
OUT=ROOT/'output/root-exits';OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((ROOT/'output/root-tracking/report.json').read_text())
raw=np.load(ROOT/'cache/root-tracking/raw.npy',mmap_mode='r');tracks=np.load(ROOT/'cache/root-tracking/tracks.npy',mmap_mode='r')
results=[]
for track,bit in [('A',1),('B',2)]:
    item=next(r for r in report['summary'] if r['threshold']==30 and r['track']==track)
    last=item['lastEnclosedSection'];seedsection=last-10;mask=(tracks[seedsection-2004]&bit)>0
    assert mask.any(),'No anchor candidate at endpoint audit seed layer'
    distance=ndi.distance_transform_edt(mask);point=np.array(np.unravel_index(distance.argmax(),mask.shape))
    lo=np.maximum(point-45,0);hi=np.minimum(point+46,raw.shape[1:]);first=max(2004,last-25);end=min(2974,last+36)
    volume=np.array(raw[first-2004:end-2004,lo[0]:hi[0],lo[1]:hi[1]])
    seed=(seedsection-first,*(point-lo));boundary=np.zeros(volume.shape,bool)
    boundary[-1]=True;boundary[:,0]=True;boundary[:,-1]=True;boundary[:,:,0]=True;boundary[:,:,-1]=True;boundary[:seed[0]+1]=False
    rows=[];pathmask=np.zeros(volume.shape,bool)
    for sigma in [0,.6]:
        data=volume if sigma==0 else ndi.gaussian_filter(volume.astype(np.float32),sigma)
        for t in [20,25,30,35]:
            allowed=data<t;allowed[:seed[0]]=False
            labels,n=ndi.label(allowed);label=int(labels[seed]);reachable=labels==label if label else np.zeros_like(allowed);contact=reachable&boundary
            r={'sigma':sigma,'threshold':t,'seedIntensity':float(data[seed]),'seedAvailable':bool(label),'reachesExternalROIBoundary':bool(contact.any())}
            if sigma==0 and t==30 and contact.any():
                solver=MCP(np.where(allowed,1.,np.inf),fully_connected=False);costs,_=solver.find_costs([seed]);target=np.unravel_index(np.where(contact,costs,np.inf).argmin(),volume.shape)
                path=np.array(solver.traceback(target));assert allowed[tuple(path.T)].all() and np.all(np.abs(np.diff(path,axis=0)).sum(1)==1)
                pathmask[tuple(path.T)]=True
                source=path+np.array([first,lo[0]+350,lo[1]+480]);np.savetxt(OUT/f'{track}-raw-path.csv',source,fmt='%d',delimiter=',',header='sourceSection,sourceY,sourceX')
                r['pathSteps']=len(path)-1
            rows.append(r)
    results.append({'track':track,'lastEnclosedSection':last,'seedSourceSectionYX':[int(seedsection),int(point[0]+350),int(point[1]+480)],'roiOriginSourceSectionYX':[int(first),int(lo[0]+350),int(lo[1]+480)],'tests':rows})
    np.savez_compressed(OUT/f'{track}-roi.npz',raw=volume,rawThreshold30Path=pathmask)
    sheet=Image.new('RGB',(1000,6*220),'#18232b');draw=ImageDraw.Draw(sheet)
    for i,z in enumerate([last-5,last-2,last,last+1,last+3,last+8]):
        j=z-first
        if not 0<=j<len(volume):continue
        rgb=np.repeat((np.clip(volume[j].astype(float)/90,0,1)*255).astype('uint8')[:,:,None],3,axis=2);overlay=rgb.copy();overlay[ndi.binary_dilation(pathmask[j])]=[240,163,40]
        for k,a in enumerate([rgb,overlay]):
            im=Image.fromarray(a).resize((182,182),Image.Resampling.NEAREST);sheet.paste(im,(k*500+159,i*220+25));draw.text((k*500+20,i*220+5),f'{track} source {z} '+('raw' if k==0 else 'orange=path, not a foramen contour'),fill='white')
    sheet.save(OUT/f'{track}-endpoint-sections.png')
(OUT/'report.json').write_text(json.dumps({'results':results,'limitations':['Local external reachability does not establish a normal apical foramen.','A/B ROIs may overlap and paths may share exits; do not infer two independent foramina.','No manual reference annotation or histology.','ROI boundary is computational, not an anatomical surface.']},indent=2))
print(json.dumps(results,indent=2),flush=True)
