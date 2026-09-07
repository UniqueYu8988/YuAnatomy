"""Pack only 12 mastication meshes; retain source topology and verify registration."""
import sys,json,hashlib,gzip
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'work/pulp-runtime'))
import numpy as np
import trimesh
cfg=json.loads((ROOT/'scripts/mastication-source.json').read_text())
cfg['attribution']='BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan'
R=np.array(cfg['registration']['rotation']); t=np.array(cfg['registration']['translationMm']); scale=cfg['registration']['scale']
def parse(id):
 raw=(ROOT/f'work/mastication-source/obj/{id}.obj').read_bytes(); vs=[];ns=[];fs=[]
 for line in raw.decode().splitlines():
  f=line.split()
  if not f:continue
  if f[0]=='v':vs.append(list(map(float,f[1:4])))
  elif f[0]=='vn':ns.append(list(map(float,f[1:4])))
  elif f[0]=='f':
   face=[]
   for token in f[1:]:
    v,_,n=token.split('/');assert v==n;face.append(int(v)-1)
   for k in range(1,len(face)-1):fs.append([face[0],face[k],face[k+1]])
 v=np.array(vs)@R.T*scale+t;v=v[:,[0,2,1]]*.001;v[:,1]+=.0781112-1.30;v[:,2]=-v[:,2]-.1
 n=np.array(ns)@R.T;n=n[:,[0,2,1]];n[:,2]*=-1;n/=np.linalg.norm(n,axis=1)[:,None]
 return raw,v.astype('<f4'),np.rint(n*32767).astype('<i2'),np.array(fs,dtype='<u4')
base=json.loads((ROOT/'public/head-neck/atlas.json').read_text())
checks=[]
for old,new in [('FMA52748','FJ3289'),('FMA52734','FJ3200'),('FMA53649','FJ3375'),('FMA53650','FJ3269')]:
 raw,v,n,f=parse(old);p=next(p for p in base['parts'] if p['id']==new);b=(ROOT/('public'+base['chunks'][p['chunk']]['url'])).read_bytes()
 w=np.frombuffer(b,dtype='<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3);g=np.frombuffer(b,dtype='<u4',count=p['indexCount'],offset=p['indices']).reshape(-1,3)
 metrics=[]
 for source,target,faces in [(v,w,g),(w,v,f)]:
  sample=source[np.linspace(0,len(source)-1,min(1024,len(source)),dtype=int)]
  _,d,_=trimesh.proximity.closest_point(trimesh.Trimesh(target,faces,process=False),sample)
  rms=float(np.sqrt(np.mean(d*d))*1000);p95=float(np.percentile(d,95)*1000)
  assert rms<.6 and p95<1.2,(old,rms,p95)
  metrics.append({'rmsMm':rms,'p95Mm':p95})
 checks.append({'source':old,'target':new,'sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceToTarget':metrics[0],'targetToSource':metrics[1]})
 print(old,metrics,flush=True)
parts=[];blob=bytearray();concepts=[]
for record in cfg['parts']:
 raw,v,n,f=parse(record['conceptId']);assert hashlib.sha256(raw).hexdigest()==record['sourceSha256'];assert len(v)==record['vertexCount'] and f.size==record['indexCount']
 p={**record,'system':'muscular','chunk':0,'bounds':[v.min(0).tolist(),v.max(0).tolist()],'sourceTriangleCount':len(f)}
 for key,data in [('positions',v),('normals',n),('indices',f)]:
  blob.extend(bytes((-len(blob))%4));p[key]=len(blob);blob.extend(data.tobytes())
 parts.append(p)
 concepts.append({'id':p['conceptId'],'name':p['name'],'elements':[p['id']]})
out=ROOT/'public/mastication';out.mkdir(exist_ok=True);digest=hashlib.sha256(blob).hexdigest();name=f'mastication-{digest[:12]}.bin';(out/name).write_bytes(blob);packed=gzip.compress(blob,mtime=0);(out/(name+'.gz')).write_bytes(packed)
a={**cfg,'version':'YuAnatomy mastication 1','parts':parts,'concepts':concepts,'triangles':sum(p['indexCount']//3 for p in parts),'chunks':[{'url':'/mastication/'+name,'bytes':len(blob),'gzip':'/mastication/'+name+'.gz','gzipBytes':len(packed),'sha256':digest}],'registrationChecks':checks,'adaptation':'Similarity registration, YuAnatomy meter/Y-up conversion, Int16 normals, binary packing. No additional simplification.'}
(out/'atlas.json').write_text(json.dumps(a,ensure_ascii=False,indent=2),encoding='utf-8')
print('Pack:',len(parts),a['triangles'],len(packed),flush=True)
