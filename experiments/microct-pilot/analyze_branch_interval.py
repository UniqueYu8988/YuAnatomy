"""Consecutive slice connectivity, with threshold sensitivity; not clinical classification."""
import sys,json,hashlib,csv
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parents[1]/'work/pulp-runtime'))
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
from skimage.measure import marching_cubes
import trimesh
SOURCE=ROOT/'source/cohort-branch';OUT=ROOT/'output/cohort-branch';OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((SOURCE/'manifest.json').read_text());files=manifest['files']
assert [i['section'] for i in files]==list(range(1681,2005))
# Fixed full-source rectangle includes tooth and surrounding background throughout this interval.
y0,y1,x0,x1=350,1120,480,1150
planes=[]
for item in files:
    b=(SOURCE/item['file']).read_bytes();assert hashlib.sha256(b).hexdigest()==item['sha256']
    a=np.array(Image.open(SOURCE/item['file']));assert a.shape==(1632,1632) and a.dtype==np.uint8
    planes.append(a[y0:y1,x0:x1])
raw=np.stack(planes);soft=ndi.gaussian_filter(raw.astype(np.float32),.6)
def largest(a):
    labels,n=ndi.label(a);sizes=np.bincount(labels.ravel());sizes[0]=0
    return labels==sizes.argmax() if n else np.zeros_like(a)
summary=[];table=[];saved=None
for threshold in [25,30,35,40]:
    cavity=np.zeros(raw.shape,bool);counts=[];areas=[]
    for z in range(len(raw)):
        mineral=largest(soft[z]>=threshold)
        assert not mineral[[0,-1]].any() and not mineral[:,[0,-1]].any(),f'Tooth touches crop boundary: section={z+1681}, threshold={threshold}'
        # Internal branch experiment only. Does not reconstruct open apical foramina.
        cavity[z]=ndi.binary_fill_holes(mineral)&~mineral
        lab,n=ndi.label(cavity[z]);sizes=np.bincount(lab.ravel());sizes[0]=0
        big=np.flatnonzero(sizes>=80);counts.append(len(big));areas.append(sorted(sizes[big].tolist(),reverse=True))
        table.append([threshold,z+1681,len(big),int(cavity[z].sum()),*sorted(sizes[big].tolist(),reverse=True)[:2],*([0]*max(0,2-len(big)))])
    labels,n=ndi.label(cavity);sizes=np.bincount(labels.ravel());sizes[0]=0
    # Examine the two largest terminal cross-sectional cavities, without assuming they are connected.
    terminal,n2=ndi.label(cavity[-1]);sizes2=np.bincount(terminal.ravel());sizes2[0]=0
    terminalids=np.argsort(sizes2)[-2:][::-1];connections=[];targetids=set()
    for tid in terminalids:
        if sizes2[tid]<80:continue
        p=np.argwhere(terminal==tid);center=p.mean(0);point=p[np.linalg.norm(p-center,axis=1).argmin()]
        label=int(labels[-1,point[0],point[1]]);targetids.add(label)
        connections.append({'terminalAreaPixels':int(sizes2[tid]),'terminalCenterSourceYX':(center+[y0,x0]).tolist(),'component3D':label,'componentVoxels':int(sizes[label]),'touchesFirstSection':bool((labels[0]==label).any())})
    kept=np.isin(labels,list(targetids));stable2=None
    for z in range(len(counts)-19):
        if all(c>=2 for c in counts[z:z+20]):stable2=z+1681;break
    item={'threshold':threshold,'sigmaVoxels':.6,'areaCriterionPixels':80,'first20ConsecutiveSectionsWithAtLeastTwoLargeCavities':stable2,'terminalCavities':connections,'terminalCavitiesShare3DComponent':len(connections)==2 and len(targetids)==1,'keptVoxels':int(kept.sum()),'totalCandidateVoxels':int(cavity.sum())}
    summary.append(item);print(json.dumps(item),flush=True)
    np.savez_compressed(OUT/f'threshold{threshold}.npz',terminalConnectedComponents=kept)
    if threshold==30:saved=kept.copy()
    del labels,cavity
with (OUT/'slice-counts.csv').open('w',newline='') as f:
    w=csv.writer(f);w.writerow(['threshold','sourceSection','largeComponents','allCavityPixels','largestArea','secondArea']);w.writerows(table)
vertices,faces,_,_=marching_cubes(np.pad(saved,1).astype(np.uint8),.5)
vertices+=np.array([1681,y0,x0])-1
mesh=trimesh.Trimesh(vertices=vertices[:,[2,1,0]],faces=faces,process=False)
if mesh.volume<0:mesh.invert()
mesh.export(OUT/'branch-source-voxel-coordinates.ply')
report={'specimen':'045 (sample ID, not FDI)','sectionRange':[1681,2004],'shapeZYX':list(raw.shape),'originSourceSectionYX':[1681,y0,x0],'sourcePixelSizeUm':9.99999,'meshUnits':'source voxel coordinates; Z is file section number','variants':summary,'sourceHashesPassed':True,'meshFaces':len(mesh.faces),'limitations':['No expert annotation; threshold agreement is not accuracy.','Only 324 sections, not complete tooth or apical exits.','Per-slice hole filling assumes enclosed cross sections here.','80 pixels and 20 slices are engineering screening criteria, not anatomical definitions.','Mesh end caps arise from interval cropping and are artificial.','Source license unspecified; local research only.']}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
# Fixed intensity display window, to avoid per-slice contrast changes.
indexes=np.linspace(0,len(raw)-1,12).astype(int)
sheet=Image.new('RGB',(1200,4*360),'#18232b');draw=ImageDraw.Draw(sheet)
rawsheet=Image.new('RGB',sheet.size,'#18232b');rawdraw=ImageDraw.Draw(rawsheet)
for k,z in enumerate(indexes):
    a=(np.clip(raw[z].astype(float)/90,0,1)*255).astype('uint8');rgb=np.repeat(a[:,:,None],3,axis=2)
    rawim=Image.fromarray(rgb.copy());rawim.thumbnail((380,330))
    rgb[saved[z]]=(rgb[saved[z]]*.45+np.array([32,210,170])*.55).astype('uint8')
    im=Image.fromarray(rgb);im.thumbnail((380,330));x=k%3*400;y=k//3*360
    sheet.paste(im,(x+(400-im.width)//2,y+25));draw.text((x+10,y+5),f'Section {z+1681}, threshold30 overlay',fill='white')
    rawsheet.paste(rawim,(x+(400-rawim.width)//2,y+25));rawdraw.text((x+10,y+5),f'Section {z+1681}, raw window 0-90',fill='white')
sheet.save(OUT/'branch-contact-sheet.png')
rawsheet.save(OUT/'branch-raw-contact-sheet.png')
print('PASS: 324 source hashes, exact section sequence, crop containment; geometry is unreviewed',flush=True)
