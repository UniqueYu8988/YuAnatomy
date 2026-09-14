"""Paired preprocessing ablation; uncertainty is not anatomical ground truth."""
import sys,json,csv
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
OUT=ROOT/'output/detail-audit';OUT.mkdir(parents=True,exist_ok=True)
vol=np.load(ROOT/'cache/volume.npy',mmap_mode='r')
baseline=np.load(ROOT/'cache/masks.npz')['pulp']
def largest(a):
    labels,n=ndi.label(a)
    sizes=np.bincount(labels.ravel());sizes[0]=0
    return labels==sizes.argmax() if n else np.zeros_like(a)
variants={};rows=[];summary=[]
for sigma,closing in [(0,0),(0,1),(.6,0),(.6,1)]:
    key=f'sigma{sigma}_closing{closing}'
    data=vol if sigma==0 else ndi.gaussian_filter(vol.astype(np.float32),sigma)
    candidate=np.zeros(vol.shape,bool)
    for z in range(len(vol)):
        mineral=data[z]>=75
        wall=ndi.binary_closing(mineral) if closing else mineral
        envelope=ndi.binary_fill_holes(largest(wall))
        candidate[z]=envelope&(data[z]<75)
    labels,n=ndi.label(candidate);sizes=np.bincount(labels.ravel());sizes[0]=0
    main=labels==sizes.argmax();variants[key]=main
    omitted=candidate&~main
    components=[]
    for label in np.argsort(sizes)[-11:][::-1]:
        if label==0 or sizes[label]==0 or label==sizes.argmax():continue
        points=np.argwhere(labels==label)
        components.append({'voxels':int(sizes[label]),'boundsCropZYX':[points.min(0).tolist(),points.max(0).tolist()]})
    np.savez_compressed(OUT/f'{key}.npz',main=main,otherCandidates=omitted)
    zs=np.flatnonzero(main.any(axis=(1,2)))
    summary.append({'variant':key,'voxels':int(main.sum()),'firstSourceSlice':int(zs[0]+1),'lastSourceSlice':int(zs[-1]+1),'components':int(n),'otherVoxels':int(omitted.sum()),'largestOtherComponents':components,'disagreementWithBaseline':int((main^baseline).sum())})
    for z in range(len(vol)):
        rows.append([key,z+1,int(main[z].sum()),int((main[z]&~baseline[z]).sum()),int((baseline[z]&~main[z]).sum())])
    print(summary[-1],flush=True)
    del labels,candidate,omitted,data
assert np.array_equal(variants['sigma0.6_closing1'],baseline),'Nominal reconstruction must reproduce baseline'
union=np.logical_or.reduce(list(variants.values()));stable=np.logical_and.reduce(list(variants.values()))
np.savez_compressed(OUT/'stability.npz',stable=stable,disagreement=union&~stable)
with (OUT/'slice-areas.csv').open('w',newline='') as f:
    writer=csv.writer(f);writer.writerow(['variant','sourceSlice','areaPixels','addedVsBaseline','missingVsBaseline']);writer.writerows(rows)
report={'threshold':75,'coordinateSystem':'cached source ZYX; source slice numbers one-based','scale':'All audit measurements in voxels/pixels; no physical resolution assumed','variants':summary,'unionVoxels':int(union.sum()),'stableVoxels':int(stable.sum()),'disagreementVoxels':int((union&~stable).sum()),'baselineReproduced':True,'warning':'Agreement of preprocessing variants is not accuracy; all share threshold and envelope assumptions. Enclosed-cavity method cannot validate openings.'}
(OUT/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
# Target beginning, largest area, largest disagreement and terminal region.
delta=(union&~stable).sum(axis=(1,2));zs=np.flatnonzero(baseline.any(axis=(1,2)))
indexes=sorted(set([max(0,int(zs[0])-5),int(zs[0]),int(zs[0])+10,int(baseline.sum(axis=(1,2)).argmax()),int(delta.argmax()),int(zs[-1])-10,int(zs[-1]),min(len(vol)-1,int(zs[-1])+5)]))
sheet=Image.new('RGB',(1000,len(indexes)*290),'#18232b');draw=ImageDraw.Draw(sheet)
for i,z in enumerate(indexes):
    rgb=np.repeat(vol[z,:,:,None],3,axis=2);overlay=rgb.copy()
    overlay[stable[z]]=[42,195,155];overlay[(union&~stable)[z]]=[255,174,40]
    for j,a in enumerate([rgb,overlay]):
        im=Image.fromarray(a);im.thumbnail((480,260));sheet.paste(im,(j*500+(500-im.width)//2,i*290+25))
        draw.text((j*500+10,i*290+5),f'Source {z+1:04d}: '+('raw' if j==0 else 'green=agreement; amber=disagreement'),fill='white')
sheet.save(OUT/'targeted-sections.png')
print('PASS: nominal baseline reproduced; audit artifacts saved',flush=True)
