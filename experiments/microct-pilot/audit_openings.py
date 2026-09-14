"""Root-tip low-intensity connectivity audit, not a foramen annotation."""
import sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from skimage.graph import MCP
from PIL import Image,ImageDraw
OUT=ROOT/'output/opening-audit';OUT.mkdir(parents=True,exist_ok=True)
full=np.load(ROOT/'cache/volume.npy',mmap_mode='r');masks=np.load(ROOT/'cache/masks.npz')
z0,z1=900,1000
points=np.argwhere(masks['pulp'][z0:z1]);lo=points[:,1:].min(0)-25;hi=points[:,1:].max(0)+26
sl=(slice(z0,z1),slice(lo[0],hi[0]),slice(lo[1],hi[1]))
raw=np.array(full[sl]);old=masks['pulp'][sl];envelope=masks['tooth'][sl]
seedz=20;xy=np.argwhere(old[seedz]);center=xy.mean(0)
seedxy=xy[np.linalg.norm(xy-center,axis=1).argmin()];seed=(seedz,*map(int,seedxy))
# Exclude the coronal entry plane: exiting there is not root-tip evidence.
boundary=np.zeros(raw.shape,bool);boundary[-1]=True;boundary[:,0]=True;boundary[:,-1]=True;boundary[:,:,0]=True;boundary[:,:,-1]=True;boundary[:seedz+1]=False
rows=[];paths={}
for sigma in [0,.6]:
    data=raw.astype(np.float32) if sigma==0 else ndi.gaussian_filter(raw.astype(np.float32),sigma)
    for neighbors in [6,26]:
        structure=ndi.generate_binary_structure(3,1 if neighbors==6 else 3)
        for threshold in [55,65,75,85,95]:
            allowed=data<threshold
            allowed[:seedz]=False # Do not allow a path to escape coronally and return outside.
            labels,n=ndi.label(allowed,structure);label=labels[seed]
            reachable=(labels==label) if label else np.zeros_like(allowed)
            contact=reachable&boundary
            rows.append({'sigma':sigma,'neighbors':neighbors,'threshold':threshold,'seedIntensity':float(data[seed]),'reachesExternalROIBoundary':bool(contact.any()),'reachableVoxels':int(reachable.sum()),'outsideOldEnvelopeVoxels':int((reachable&~envelope).sum())})
            if neighbors==6 and threshold==75 and contact.any():
                # Shortest voxel path, not an anatomical centerline or diameter.
                solver=MCP(np.where(allowed,1.,np.inf),fully_connected=False)
                costs,_=solver.find_costs([seed]);end=np.unravel_index(np.where(contact,costs,np.inf).argmin(),raw.shape)
                path=np.array(solver.traceback(end));paths[f'sigma{sigma}']=path
                assert np.all(allowed[tuple(path.T)])
                assert np.all(np.abs(np.diff(path,axis=0)).sum(axis=1)==1)
                assert boundary[tuple(path[-1])]
                source=path+np.array([z0,lo[0]+367,lo[1]+316])
                np.savetxt(OUT/f'path-sigma{sigma}-sourceZYX.csv',source,fmt='%d',delimiter=',',header='sourceZ_zeroBased,sourceY_zeroBased,sourceX_zeroBased')
                rows[-1]['shortestPathSteps']=len(path)-1
                crossed=np.flatnonzero(~envelope[tuple(path.T)])
                rows[-1]['firstExitOldEnvelopeSourceZYX']=source[crossed[0]].tolist() if len(crossed) else None
                pm=np.zeros(raw.shape,bool);pm[tuple(path.T)]=True
                np.savez_compressed(OUT/f'connected-sigma{sigma}.npz',reachable=reachable,path=pm)
            del labels,reachable
# Fixtures: closed cavity, open channel, and forbidden coronal entry only.
fixture=np.zeros((15,15,15),bool);fixture[5:10,6:9,6:9]=True
def exits(a):
    seedmask=np.zeros_like(a);seedmask[7,7,7]=True
    reached=ndi.binary_propagation(seedmask,mask=a)
    return bool(reached[-1].any() or reached[:,0].any() or reached[:,-1].any() or reached[:,:,0].any() or reached[:,:,-1].any())
assert not exits(fixture)
fixture[9:,7,7]=True;assert exits(fixture)
fixture[9:,7,7]=False;fixture[:8,7,7]=True;assert not exits(fixture)
report={'roiOriginCachedZYX':[z0,*lo.tolist()],'roiShape':list(raw.shape),'seedCachedZYX':(np.array(seed)+[z0,*lo]).tolist(),'rows':rows,'fixturesPassed':True,'warning':'External ROI reachability is low-intensity connectivity, not proof of an anatomical foramen. Paths may traverse artifacts. No closure or hole filling is applied to intensity data. Paths are shortest voxel routes, not centerlines.'}
(OUT/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
path=paths.get('sigma0',np.empty((0,3),int));pm=np.zeros(raw.shape,bool)
if len(path):pm[tuple(path.T)]=True
indexes=list(range(55,81,3))
sheet=Image.new('RGB',(960,len(indexes)*235),'#18232b');draw=ImageDraw.Draw(sheet)
for i,z in enumerate(indexes):
    rgb=np.repeat(raw[z,:,:,None],3,axis=2)
    overlay=rgb.copy();overlay[old[z]]=[42,190,155]
    pathview=ndi.binary_dilation(pm[z],iterations=1);overlay[pathview]=[255,172,35]
    for j,a in enumerate([rgb,overlay]):
        im=Image.fromarray(a);im.thumbnail((450,205));im=im.resize((im.width*min(3,450//im.width),im.height*min(3,450//im.width)),Image.Resampling.NEAREST)
        sheet.paste(im,(j*480+(480-im.width)//2,i*235+25));draw.text((j*480+8,i*235+5),f'Source {z+z0+1}: '+('raw' if j==0 else 'green=old mask; amber=path (dilated for visibility)'),fill='white')
sheet.save(OUT/'apical-contact-sheet.png')
print(json.dumps(report,indent=2),flush=True)
