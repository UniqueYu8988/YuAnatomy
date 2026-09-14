"""Sparse source-image threshold stress test; no chamber inferred from low intensity alone."""
import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
OUT=ROOT/'output/crown-extension';OUT.mkdir(parents=True,exist_ok=True)
rows=[];sheet=Image.new('RGB',(1200,800),'#18232b');draw=ImageDraw.Draw(sheet)
for row,z in enumerate([1035,1358]):
    raw=np.array(Image.open(ROOT/'source/cohort-screening'/f'Tooth045_rec{z:08}.png'))[300:1180,400:1200]
    soft=ndi.gaussian_filter(raw.astype(np.float32),.6);saved={}
    for t in [25,30,35,40,50]:
        labels,_=ndi.label(soft<t);sizes=np.bincount(labels.ravel());sizes[0]=0
        ids=np.flatnonzero(sizes>=4);borders=np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]));ids=ids[~np.isin(ids,borders)]
        best=int(ids[sizes[ids].argmax()]) if len(ids) else 0
        rows.append({'sourceSection':z,'threshold':t,'largestEnclosedAreaPixels':int(sizes[best]) if best else 0,
                     'allEnclosedComponentsAtLeast4Pixels':len(ids)})
        if t in [30,50]:saved[t]=labels==best if best else np.zeros(raw.shape,bool)
    rgb=np.repeat((np.clip(raw.astype(float)/120,0,1)*255).astype('uint8')[:,:,None],3,axis=2)
    for col,t in enumerate([None,30,50]):
        a=rgb.copy()
        if t:a[saved[t]]=(a[saved[t]]*.3+np.array([235,114,59])*.7).astype('uint8')
        im=Image.fromarray(a);im.thumbnail((380,350));sheet.paste(im,(col*400+(400-im.width)//2,row*400+35))
        draw.text((col*400+12,row*400+10),f'Source {z}: '+('raw' if t is None else f'largest enclosed region <{t}'),fill='white')
sheet.save(OUT/'threshold-overgrowth.png')
result={'rows':rows,'limitations':['Largest enclosed dark region is not an anatomical pulp annotation.',
    'Raising threshold can include broad dentin-like regions; do not enlarge a chamber this way.',
    'Sparse planes cannot establish continuity or the cause of poor contrast.']}
(OUT/'threshold-stress.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
