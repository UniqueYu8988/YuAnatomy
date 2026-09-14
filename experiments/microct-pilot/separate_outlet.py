"""Competing-seed outlet experiment. No ground-truth anatomical labels."""
import sys,json,csv
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from skimage.segmentation import watershed
from PIL import Image,ImageDraw
OUT=ROOT/'output/outlet-separation';OUT.mkdir(parents=True,exist_ok=True)
coords=json.loads((ROOT/'cache/coordinates.json').read_text())
meta=json.loads((ROOT/'output/opening-audit/audit.json').read_text())
origin=np.array(meta['roiOriginCachedZYX']);shape=np.array(meta['roiShape']);sl=tuple(slice(int(a),int(a+b)) for a,b in zip(origin,shape))
raw=np.array(np.load(ROOT/'cache/volume.npy',mmap_mode='r')[sl]);masks=np.load(ROOT/'cache/masks.npz')
old=masks['pulp'][sl];envelope=masks['tooth'][sl]
soft=ndi.gaussian_filter(raw.astype(np.float32),.6);low=soft<75
external_distance=ndi.distance_transform_edt(~envelope)
core=ndi.binary_erosion(old)&low
surfaces={'gradient':ndi.gaussian_gradient_magnitude(raw.astype(np.float32),.6),'neck':-ndi.distance_transform_edt(low)}
votes=np.zeros(raw.shape,np.uint8);rows=[];nominal=None;cuts=[]
def interface(a):
    # Canal-side voxels sharing a FACE with exterior label; explicitly artificial.
    return (a==1)&ndi.binary_dilation(a==2,structure=ndi.generate_binary_structure(3,1))
for method,height in surfaces.items():
    for last_seed in [940,950,960]:
        inside=core.copy();inside[int(last_seed-origin[0])+1:]=False
        for clearance in [3,8]:
            outside=low&(external_distance>=clearance)
            assert inside.any() and outside.any() and not (inside&outside).any()
            markers=np.zeros(raw.shape,np.int32);markers[inside]=1;markers[outside]=2
            labels=watershed(height,markers,mask=low,connectivity=1)
            assert np.all(labels[inside]==1) and np.all(labels[outside]==2)
            assert not ((labels>0)&~low).any()
            cut=interface(labels);idx=np.argwhere(cut)
            assert len(idx)>0,'Expected competing labels to meet in this connected scan'
            canal=labels==1;votes+=canal
            row={'method':method,'lastSeedSourceZ_zeroBased':last_seed,'externalClearanceVoxels':clearance,'canalVoxels':int(canal.sum()),'addedBeyondOldMask':int((canal&~old).sum()),'removedFromOldMask':int((old&~canal).sum()),'artificialInterfaceVoxels':int(cut.sum()),'interfaceFirstSourceSlice':int(idx[:,0].min()+origin[0]+1),'interfaceLastSourceSlice':int(idx[:,0].max()+origin[0]+1)}
            rows.append(row);cuts.append(cut)
            key=f'{method}-seed{last_seed}-clearance{clearance}'
            np.savez_compressed(OUT/f'{key}.npz',labels=labels.astype(np.uint8),artificialInterface=cut,internalSeeds=inside,externalSeeds=outside)
            if method=='gradient' and last_seed==950 and clearance==3:nominal=labels.copy()
            print(row,flush=True)
count=len(rows);disagreement=(votes>0)&(votes<count);stable=votes==count
# Stable here means only agreement under these seeds, not verified anatomy.
np.savez_compressed(OUT/'ensemble.npz',raw=raw,votes=votes,stableCanal=stable,seedMethodDisagreement=disagreement,intensityUncertain=(soft>=65)&(soft<85),nominalLabels=nominal,artificialInterface=interface(nominal))
with (OUT/'interfaces.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
# Structural fixture: a closed wall must block competition. Deliberately opened wall must allow an interface.
test=np.ones((15,15,15),bool);test[7]=False;markers=np.zeros(test.shape,np.int32);markers[3,7,7]=1;markers[11,7,7]=2
result=watershed(np.zeros(test.shape),markers,mask=test,connectivity=1)
assert not interface(result).any() and np.all(result[:7]==1) and np.all(result[8:]==2)
test[7,7,7]=True;result=watershed(np.zeros(test.shape),markers,mask=test,connectivity=1);assert interface(result).any()
report={'variants':rows,'roiOriginSourceZYX':(origin+coords['sourceOriginZYX']).tolist(),'roiShapeZYX':shape.tolist(),'stableCanalVoxels':int(stable.sum()),'disagreementVoxels':int(disagreement.sum()),'unionCanalVoxels':int((votes>0).sum()),'fixturesPassed':True,'labelMeaning':{'0':'not assigned: high intensity or unseeded component','1':'algorithmic canal candidate','2':'algorithmic exterior candidate'},'limitations':['Automatic seeds use the old envelope; not expert labels.','Fixed threshold75 and sigma0.6; does not test all intensity uncertainty.','Interface is an artificial partition of continuous low-density space, not a detected anatomical membrane or validated foramen.','No source scale or normal specimen status confirmed.']}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
def paint(rawplane,stableplane,uncertainplane,cutplane):
    rgb=np.repeat(rawplane[:,:,None],3,axis=2);rgb[stableplane]=[45,188,151];rgb[uncertainplane]=[247,173,49];rgb[cutplane]=[222,82,210];return rgb
sheet=Image.new('RGB',(1080,6*230),'#18232b');draw=ImageDraw.Draw(sheet)
for i,z in enumerate([60,65,68,70,73,77]):
    images=[np.repeat(raw[z,:,:,None],3,axis=2),paint(raw[z],stable[z],disagreement[z],np.zeros(raw[z].shape,bool)),paint(raw[z],nominal[z]==1,np.zeros(raw[z].shape,bool),interface(nominal)[z])]
    for j,a in enumerate(images):
        im=Image.fromarray(a).resize((raw.shape[2]*2,raw.shape[1]*2),Image.Resampling.NEAREST)
        sheet.paste(im,(j*360+(360-im.width)//2,i*230+45));draw.text((j*360+8,i*230+8),f'Source {int(z+origin[0]+1)} '+['raw','green=agreement / amber=disagreement','nominal / magenta=artificial cut'][j],fill='white')
sheet.save(OUT/'comparison.png')
for axis in [1,2]:
    # Orthogonal SOURCE axes, not anatomically registered sagittal/coronal planes.
    index=int(np.argwhere(old)[:,axis].mean())
    a=paint(np.take(raw,index,axis),np.take(stable,index,axis),np.take(disagreement,index,axis),np.take(interface(nominal),index,axis))
    Image.fromarray(a).resize((a.shape[1]*4,a.shape[0]*4),Image.Resampling.NEAREST).save(OUT/f'source-axis{axis}-plane.png')
print('PASS: seed preservation, intensity exclusion, closed/open barrier fixtures; results saved',flush=True)
