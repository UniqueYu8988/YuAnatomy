"""Original volumetric Vertucci teaching models; no patient/tooth-specific anatomy claims."""
from pathlib import Path
import sys,json,gzip,hashlib
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'work/pulp-runtime'))
import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.spatial import cKDTree
import scipy.ndimage as ndi
from skimage.measure import marching_cubes,find_contours
import trimesh
h=.1
axes=[np.arange(-5.5,5.51,h),np.arange(-.5,25.51,h),np.arange(-4.5,4.51,h)]
X,Y,Z=np.meshgrid(*axes,indexing='ij');shape=X.shape
knots=[0,.8,2,5,10,15,17,19,22,24,25]
rx=PchipInterpolator(knots,[0,.9,1.45,2,2.7,3.15,3.35,4,4.2,3.4,0])(np.clip(Y,0,25))
rz=PchipInterpolator(knots,[0,.7,1.15,1.55,2,2.4,2.5,3.2,3.1,2.8,0])(np.clip(Y,0,25))
def center(y):return .5*np.sin(np.pi*y/25)+.25*(1-y/25)**2,.22*np.sin(y/25*np.pi*1.5)
cx,cz=center(Y)
outer=(np.sqrt(((X-cx)/np.maximum(rx,.001))**2+((Z-cz)/np.maximum(rz,.001))**2)-1)*np.minimum(rx,rz)
outer=np.maximum(outer,np.maximum(-Y,Y-25));outer[(Y<=0)|(Y>=25)]=.2
root=outer<0;distance=ndi.distance_transform_edt(root,sampling=h)
blob=bytearray();meshes=[];models=[]
def pack(id,field):
 v,f,_,_=marching_cubes(field.astype('<f4'),0,spacing=(h,h,h));v+=np.array([a[0] for a in axes]);v[:,1]-=12.5;v/=1000
 mesh=trimesh.Trimesh(v,f,process=False);assert mesh.is_watertight,id
 # Data owns topology; display computes normals once on load.
 record={'id':id,'vertexCount':len(v),'indexCount':f.size,'bounds':[v.min(0).tolist(),v.max(0).tolist()]}
 for key,array in [('positions',v.astype('<f4')),('indices',f.astype('<u4'))]:record[key]=len(blob);blob.extend(array.tobytes())
 meshes.append(record);return record
pack('shell',outer)
patterns=[('I',[1,1]),('II',[2,1]),('III',[1,2,1]),('IV',[2,2]),('V',[1,2]),('VI',[2,1,2]),('VII',[1,2,1,2]),('VIII',[3,3])]
points=np.stack([X.ravel(),Y.ravel(),Z.ravel()*1.18],axis=1)
def lane(count,j,y):
 spread=.45+.065*y if count<3 else .45+.042*y
 if count==1:dx=dz=0
 elif count==2:
  theta=.32+.5*(y/15);dx=(-1 if j==0 else 1)*spread*np.cos(theta);dz=(-1 if j==0 else 1)*spread*np.sin(theta)
 else:
  theta=j*2*np.pi/3+.4+.35*y/15;dx=spread*np.cos(theta);dz=spread*np.sin(theta)*0.85
 c0,c1=center(y)
 return np.array([c0+dx+.09*np.sin(y*.45),y,c1+dz+.07*np.sin(y*.6)])
def outlines(mask,yi):
 return [np.column_stack([axes[0][0]+line[:,0]*h,axes[2][0]+line[:,1]*h]).tolist() for line in find_contours(mask[:,yi,:].astype(float),.5)]
for name,counts in patterns:
 stageYs=np.linspace(15,3,len(counts));paths=[]
 # Add crown-to-orifice and terminal segments, retaining the declared root connectivity.
 topY=18.5 if counts[0]==3 else 18.0
 for j in range(counts[0]):paths.append(np.array([lane(counts[0],j,y) for y in np.linspace(topY,15,int((topY-15)/.05)+1)]))
 for i in range(len(counts)-1):
  for j in range(max(counts[i],counts[i+1])):
   curve=[]
   for t in np.linspace(0,1,int((stageYs[i]-stageYs[i+1])/.05)+1):
    y=stageYs[i]*(1-t)+stageYs[i+1]*t
    # Plateau near each observation plane makes the displayed canal count unambiguous.
    w=np.clip((t-.15)/.7,0,1);w=w*w*(3-2*w)
    curve.append(lane(counts[i],j%counts[i],y)*(1-w)+lane(counts[i+1],j%counts[i+1],y)*w)
   paths.append(np.array(curve))
 for j in range(counts[-1]):paths.append(np.array([lane(counts[-1],j,y) for y in np.linspace(3,1.7,27)]))
 line=np.concatenate(paths);scaled=line.copy();scaled[:,2]*=1.18
 d,indices=cKDTree(scaled).query(points,workers=4);radius=.2+.018*line[indices,1]
 field=(d-radius).reshape(shape)
 # Smooth chamber blends into the canal orifices, without intersecting tube meshes.
 chamber=(np.sqrt(((X-.55)/1.8)**2+((Y-19)/2.7)**2+((Z-.1)/1.35)**2)-1)*1.35
 field=np.minimum(field,chamber);field=ndi.gaussian_filter(field,.65)
 field=np.maximum(field,.30-distance)
 mask=field<0
 _,components=ndi.label(mask);assert components==1,(name,components)
 sections=[]
 for expected,y in zip(counts,stageYs):
  yi=int(round((y-axes[1][0])/h));_,actual=ndi.label(mask[:,yi,:]);assert actual==expected,(name,y,actual,expected)
  sections.append({'y':(y-12.5)/1000,'count':expected,'outer':outlines(root,yi),'canals':outlines(mask,yi)})
 record=pack(name,field)
 # Confirm non-planar geometry and broad interior margin before publishing.
 local=np.frombuffer(blob,'<f4',record['vertexCount']*3,record['positions']).reshape(-1,3)*1000
 local[:,1]+=12.5
 coords=np.rint((local-np.array([a[0] for a in axes]))/h).astype(int)
 assert distance[tuple(coords.T)].min()>=.25,(name,'containment')
 models.append({'type':name,'stages':counts,'sections':sections})
 print(name,record['vertexCount'],record['indexCount']//3,flush=True)
sha=hashlib.sha256(blob).hexdigest();out=ROOT/'public/canal-types';out.mkdir(exist_ok=True);name=f'canal-types-{sha[:12]}.bin';(out/name).write_bytes(blob);gz=gzip.compress(blob,mtime=0);(out/(name+'.gz')).write_bytes(gz)
a={'version':1,'kind':'original generic volumetric teaching geometry; not a specimen','license':'MIT','voxelSpacingMm':h,'url':'/canal-types/'+name,'gzip':'/canal-types/'+name+'.gz','bytes':len(blob),'sha256':sha,'meshes':meshes,'models':models,'note':'Closed termini and generic chamber/root. Sequence describes canal connectivity, not root count. No clinical length or tooth assignment.'}
(out/'atlas.json').write_text(json.dumps(a,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print('Package',len(blob),len(gz),flush=True)
