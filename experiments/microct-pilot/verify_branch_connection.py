"""Locate the last image-stack suffix retaining a connection between terminal cavities."""
import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
OUT=ROOT/'output/cohort-branch'
def terminal_points(a):
    labels,n=ndi.label(a[-1]);sizes=np.bincount(labels.ravel());sizes[0]=0
    ids=np.argsort(sizes)[-2:];assert np.all(sizes[ids]>=80)
    result=[]
    for k in ids:
        p=np.argwhere(labels==k);result.append(tuple(p[np.linalg.norm(p-p.mean(0),axis=1).argmin()]))
    return result
def connected(a,start,points):
    labels,n=ndi.label(a[start:])
    ids=[int(labels[-1,*p]) for p in points]
    return ids[0]!=0 and ids[0]==ids[1]
# Negative/positive fixtures: same terminal section, different 3D connectivity.
fixture=np.zeros((10,20,20),bool);fixture[:,3:7,3:7]=True;fixture[:,12:16,12:16]=True
points=[(5,5),(14,14)];assert not connected(fixture,0,points)
fixture[2,5,5:15]=True;fixture[2,5:15,14]=True
assert connected(fixture,0,points) and not connected(fixture,3,points)
rows=[]
for threshold in [25,30,35,40]:
    a=np.load(OUT/f'threshold{threshold}.npz')['terminalConnectedComponents']
    p=np.argwhere(a);lo=p[:,1:].min(0);hi=p[:,1:].max(0)+1;a=a[:,lo[0]:hi[0],lo[1]:hi[1]]
    points=terminal_points(a);assert connected(a,0,points) and not connected(a,len(a)-1,points)
    left,right=0,len(a)-1
    while right-left>1:
        middle=(left+right)//2
        if connected(a,middle,points):left=middle
        else:right=middle
    assert connected(a,left,points) and not connected(a,right,points)
    rows.append({'threshold':threshold,'lastSuffixStartStillConnectedSourceSection':left+1681,'nextSuffixStartDisconnectedSourceSection':right+1681})
    print(rows[-1],flush=True)
(OUT/'connection-verification.json').write_text(json.dumps({'results':rows,'fixturesPassed':True,'meaning':'Latest retained starting plane for any connecting path in this threshold mask; not a validated anatomical bifurcation plane. Sensitive to artifacts and segmentation.'},indent=2))
sections=[1694,1695,1696,1700,1701,1702]
sheet=Image.new('RGB',(960,6*300),'#18232b');draw=ImageDraw.Draw(sheet)
for j,t in enumerate([None,25,30,35]):
    mask=None if t is None else np.load(OUT/f'threshold{t}.npz')['terminalConnectedComponents'][np.array(sections)-1681,610-350:870-350,690-480:870-480]
    for k,z in enumerate(sections):
        a=np.array(Image.open(ROOT/f'source/cohort-branch/Tooth045_rec{z:08}.png'))[610:870,690:870]
        rgb=np.repeat((np.clip(a.astype(float)/90,0,1)*255).astype('uint8')[:,:,None],3,axis=2)
        if mask is not None:rgb[mask[k]]=(rgb[mask[k]]*.45+np.array([32,210,170])*.55).astype('uint8')
        sheet.paste(Image.fromarray(rgb),(j*240+30,k*300+25));draw.text((j*240+8,k*300+5),f'{z} '+('raw' if t is None else f'threshold {t}'),fill='white')
sheet.save(OUT/'connection-focus.png')
