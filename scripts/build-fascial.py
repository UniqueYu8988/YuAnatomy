"""Conservative mesh-constrained teaching regions, NOT segmented fascia or abscesses."""
from pathlib import Path
import sys,json,hashlib,gzip
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work/pulp-runtime'))
import numpy as np
import scipy.ndimage as ndi
import trimesh
from skimage.measure import marching_cubes
h=.0008;origin=np.array([-.04,.18,-.035]);shape=(151,201,151)
grid=np.indices(shape,dtype=np.float32);X,Y,Z=[origin[i]+grid[i]*h for i in range(3)]
obstacles=np.zeros(shape,bool);fields={};sources=[]
for folder in ['head-neck','mastication']:
 a=json.loads((ROOT/f'public/{folder}/atlas.json').read_text());chunks=[(ROOT/('public'+c['url'])).read_bytes() for c in a['chunks']]
 for p in a['parts']:
  if p['system'] not in ['skeletal','muscular','dental','digestive']:continue
  if p['bounds'][0][1]>.34 or p['bounds'][1][1]<.18 or p['bounds'][1][2]<-.035:continue
  b=chunks[p['chunk']];v=np.frombuffer(b,'<f4',p['vertexCount']*3,p['positions']).reshape(-1,3);f=np.frombuffer(b,'<u4',p['indexCount'],p['indices']).reshape(-1,3)
  cache=ROOT/f'work/fascial-voxels/{p["id"]}.npz';cache.parent.mkdir(exist_ok=True)
  digest=hashlib.sha256(v.tobytes()+f.tobytes()).hexdigest()
  if cache.exists():
   saved=np.load(cache);assert str(saved['digest'])==digest;ijk=saved['ijk']
  else:
   vox=trimesh.Trimesh(v,f,process=False).voxelized(h).fill();ijk=np.rint((vox.points-origin)/h).astype(int);ijk=ijk[np.all((ijk>=0)&(ijk<shape),axis=1)];np.savez_compressed(cache,ijk=ijk,digest=digest)
  field=np.zeros(shape,bool);field[tuple(ijk.T)]=True;obstacles|=field
  if p['id'] in ['FJ3289','FJ1562','BP3-FMA49002','BP3-FMA49005','BP3-FMA49013']:fields[p['id']]=field
  sources.append({'id':p['id'],'sha256':digest})
print('Obstacles',len(sources),int(obstacles.sum()),flush=True)
# One cell guard protects the final isosurface from the voxelized original structures.
blocked=ndi.binary_dilation(obstacles);free=~blocked
bone=fields['FJ3289'];mass=fields['BP3-FMA49002']|fields['BP3-FMA49005'];medial=fields['BP3-FMA49013'];mylo=fields['FJ1562']
def corridor(muscle,lateral):
 result=np.zeros(shape,bool)
 for j in range(shape[1]):
  for k in range(shape[2]):
   m=np.flatnonzero(muscle[:,j,k]);b=np.flatnonzero(bone[:,j,k] & (np.arange(shape[0])*h+origin[0]>.012))
   if not len(m) or not len(b):continue
   if lateral:
    m0=m.min();side=b[b<m0]
    if len(side):result[side.max()+1:m0,j,k]=True
   else:
    m0=m.max();side=b[b>m0]
    if len(side):result[m0+1:side.min(),j,k]=True
 return result
above=np.zeros(shape,bool);below=np.zeros(shape,bool)
for i in range(shape[0]):
 for k in range(shape[2]):
  occupied=np.flatnonzero(mylo[i,:,k])
  if len(occupied):above[i,occupied.max()+1:,k]=True;below[i,:occupied.min(),k]=True
# ROI limits are educational extents, not reconstructed fascial boundaries.
regions={
 'pterygomandibular_left':corridor(medial,False)&(Y>.236)&(Y<.269)&(Z>.003)&(Z<.032),
 'masseteric_left':corridor(mass,True)&(Y>.222)&(Y<.274)&(Z>-.002)&(Z<.035),
 'infratemporal_left':(((X-.03)/.014)**2+((Y-.276)/.017)**2+((Z-.012)/.021)**2<1),
 'submandibular_left':(((X-.019)/.016)**2+((Y-.209)/.013)**2+((Z-.039)/.022)**2<1)&below,
 'sublingual':(((X-.015)/.014)**2+((Y-.23)/.012)**2+((Z-.044)/.021)**2<1)&above,
 'parapharyngeal_left':(((X-.018)/.008)**2+((Y-.254)/.028)**2+((Z+.006)/.014)**2<1),
 'infraorbital_left':(((X-.024)/.014)**2+((Y-.271)/.013)**2+((Z-.067)/.013)**2<1),
 'buccal_left':(((X-.041)/.012)**2+((Y-.243)/.02)**2+((Z-.048)/.018)**2<1),
}
blob=bytearray();parts=[];proof={}
for id,region in regions.items():
 mask=region&free
 # Close voxel stair steps inside the safe region; never grow into an obstacle.
 smooth=ndi.gaussian_filter(mask.astype(np.float32),.65)>.4;mask=smooth&free
 labels,count=ndi.label(mask);sizes=np.bincount(labels.ravel());sizes[0]=0;assert sizes.max()>20,(id,"No usable connected region");mask=labels==sizes.argmax()
 assert mask.sum()>20,(id,mask.sum())
 v,f,_,_=marching_cubes(np.pad(mask,1).astype(np.float32),.5,spacing=(h,h,h));v=v+origin-h
 mesh=trimesh.Trimesh(v,f,process=False);assert mesh.is_watertight
 original=v.copy()
 trimesh.smoothing.filter_laplacian(mesh,lamb=.35,iterations=10,volume_constraint=False)
 proposal=np.asarray(mesh.vertices)
 delta=proposal-original;length=np.linalg.norm(delta,axis=1);proposal=original+delta*np.minimum(1,.2*h/np.maximum(length,1e-12))[:,None]
 cells=np.rint((proposal-origin)/h).astype(int)
 allowed=np.all((cells>=0)&(cells<shape),axis=1);safe=np.clip(cells,0,np.array(shape)-1)
 allowed &= mask[tuple(safe.T)]
 v=np.where(allowed[:,None],proposal,original)
 p={'id':id,'vertexCount':len(v),'indexCount':f.size,'bounds':[v.min(0).tolist(),v.max(0).tolist()],'center':v.mean(0).tolist(),'voxels':int(mask.sum()),'method':'paired bone/muscle corridor' if id in ['masseteric_left','pterygomandibular_left'] else 'anatomically bounded illustrative ROI minus registered tissue obstacles'}
 for key,data in [('positions',v.astype('<f4')),('indices',f.astype('<u4'))]:p[key]=len(blob);blob.extend(data.tobytes())
 parts.append(p);proof[id]=np.argwhere(mask).astype('<u2');print(id,len(v),len(f),p['center'],flush=True)
np.savez_compressed(ROOT/'work/fascial-voxels/proof.npz',blocked=blocked,origin=origin,h=h,**proof)
out=ROOT/'public/fascial';out.mkdir(exist_ok=True);sha=hashlib.sha256(blob).hexdigest();name=f'spaces-{sha[:12]}.bin';(out/name).write_bytes(blob);(out/(name+'.gz')).write_bytes(gzip.compress(blob,mtime=0))
a={'version':1,'kind':'mesh-constrained educational regions; not clinical segmentation','voxelSpacingMm':h*1000,'license':'CC-BY-SA-2.1-JP','sources':sources,'parts':parts,'url':'/fascial/'+name,'gzip':'/fascial/'+name+'.gz','bytes':len(blob),'sha256':sha}
(out/'atlas.json').write_text(json.dumps(a,ensure_ascii=False,indent=2),encoding='utf-8')

# Validation records actual occupied tissue cells; the extra one-cell generation guard is empty safety space.
constraintBytes=obstacles.astype('u1').tobytes()
(out/'constraints.bin.gz').write_bytes(gzip.compress(constraintBytes,mtime=0))
(out/'constraints.json').write_text(json.dumps({'origin':origin.tolist(),'spacing':h,'shape':shape,'bytes':len(constraintBytes),'sha256':hashlib.sha256(constraintBytes).hexdigest()}),encoding='utf-8')
