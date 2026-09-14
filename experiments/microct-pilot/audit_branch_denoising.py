"""Raw-vs-smoothed connectivity and erosion robustness near the candidate branch."""
import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
OUT=ROOT/'output/branch-denoising';OUT.mkdir(parents=True,exist_ok=True)
sections=list(range(1681,1741));raw=np.stack([np.array(Image.open(ROOT/f'source/cohort-branch/Tooth045_rec{z:08}.png'))[350:1120,480:1150] for z in sections])
def largest(a):
    labels,n=ndi.label(a);s=np.bincount(labels.ravel());s[0]=0;return labels==s.argmax()
def connected(a,points,start=0,neighbors=1):
    labels,n=ndi.label(a[start:],structure=ndi.generate_binary_structure(3,neighbors));ids=[int(labels[-1,*p]) for p in points]
    return ids[0]>0 and ids[0]==ids[1]
results=[];panels=[]
for sigma in [0,.6,1.0]:
    data=raw if sigma==0 else ndi.gaussian_filter(raw.astype(np.float32),sigma)
    for threshold in [25,30,35]:
        full=np.zeros(raw.shape,bool)
        for z in range(len(raw)):
            mineral=largest(data[z]>=threshold);assert not mineral[[0,-1]].any() and not mineral[:,[0,-1]].any()
            full[z]=ndi.binary_fill_holes(mineral)&~mineral
        # Fixed inner ROI contains the candidate branch and both terminal cavities.
        a=full[:,610-350:860-350,690-480:870-480]
        labels,n=ndi.label(a[-1]);sizes=np.bincount(labels.ravel());sizes[0]=0;ids=np.argsort(sizes)[-2:]
        assert np.all(sizes[ids]>=80),'Terminal cavities not recoverable with selected parameters'
        points=[]
        for i in ids:
            depth=ndi.distance_transform_edt(labels==i)
            points.append(np.unravel_index(depth.argmax(),depth.shape))
        six=connected(a,points);twentysix=connected(a,points,neighbors=3);last=None
        if six:
            left,right=0,len(a)-1
            assert not connected(a,points,right)
            while right-left>1:
                mid=(left+right)//2
                if connected(a,points,mid):left=mid
                else:right=mid
            last=left+1681
        erosion=[]
        for radius in [0,1,2,3]:
            eroded=a if radius==0 else ndi.binary_erosion(a,iterations=radius,border_value=1)
            erosion.append({'iterations':radius,'connected':connected(eroded,points),'terminalSeedSurvival':all(bool(eroded[-1,*p]) for p in points)})
        item={'sigmaVoxels':sigma,'threshold':threshold,'connected6':six,'connected26':twentysix,'lastSuffixStartConnected':last,'erosion':erosion}
        results.append(item);print(json.dumps(item),flush=True)
        np.savez_compressed(OUT/f'sigma{sigma}-threshold{threshold}.npz',candidate=a)
        z=1698-1681;rgb=np.repeat((np.clip(raw[z,260:510,210:390].astype(float)/90,0,1)*255).astype('uint8')[:,:,None],3,axis=2)
        rgb[a[z]]=(rgb[a[z]]*.45+np.array([25,210,160])*.55).astype('uint8');panels.append((Image.fromarray(rgb),f'sigma={sigma}, threshold={threshold}'))
(OUT/'report.json').write_text(json.dumps({'sectionRange':[1681,1740],'sourceInnerROIYX':[610,860,690,870],'results':results,'limitations':['All methods share intensity/enclosed-section assumptions.','Erosion is a digital connectivity stress test, not a canal diameter measurement.','Fixed terminal seeds must survive for erosion tests to be interpreted.','No original slice interpolation; denoising may still alter geometry.']},indent=2))
sheet=Image.new('RGB',(720,3*300),'#18232b');draw=ImageDraw.Draw(sheet)
for i,(im,label) in enumerate(panels):
    x=i%3*240;y=i//3*300;sheet.paste(im,(x+30,y+30));draw.text((x+8,y+8),label,fill='white')
sheet.save(OUT/'section1698-comparison.png')
print('DONE denoising ablation',flush=True)
